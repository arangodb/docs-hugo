---
title: Incompatible changes in the Arango Contextual Data Platform
menuTitle: Incompatible changes
weight: 10
description: >-
  Check the following list of breaking changes **before** upgrading the
  Contextual Data Platform including the Platform Suite and Agentic AI Suite,
  and adjust your client applications and deployment configuration if necessary
pageToc:
  maxHeadlineLevel: 3
---
## v4.1.0 (August 2026)

### AutoGraph (v0.0.14)

{{< tag "Agentic AI Suite" >}}

The changes listed below affect the
[AutoGraph](../../agentic-ai-suite/autograph/_index.md) service. Requests that
worked against the previous release can be rejected after the upgrade, and some
deployment configuration keys have to be renamed before you upgrade.

#### RAG Strategizer

**`full_graph_rag_strategy` has been replaced by a required `complexity` field**

The `full_graph_rag_strategy` field no longer exists in the
[`POST /v1/rag-strategizer/analyze`](../../agentic-ai-suite/autograph/reference/rag-strategizer.md)
request. It is silently dropped before it reaches the service. Use the
`complexity` enum instead. It has **no default**, so a request that omits it
fails with HTTP `400` and `complexity is required` — including a request that
still sends only the old field.

| Old `full_graph_rag_strategy` | New `complexity` | Share of clusters that get FullGraphRAG |
|-------------------------------|------------------|-----------------------------------------|
| `"very low"` | `very_low` | 0% |
| `"low"` | `low` | 25% |
| — | `moderate` | 50% |
| `"high"` | `high` | 75% |
| `"very high"` | `very_high` | 100% |

Free-form percentage strings such as `"40%"` are no longer accepted.

The share is applied to the ranked cluster list as
`round(target_percentage / 100.0 * cluster_count)`. A project with a single
cluster therefore gets **zero** FullGraphRAG clusters at `moderate` and below,
and the whole corpus is served by VectorRAG. Check the assigned strategies with
`GET /v1/rag-strategizer/strategy` before you query, because a VectorRAG
partition has no entities and no communities and cannot serve the retriever's
`LOCAL`, `GLOBAL`, or `UNIFIED` modes.

**A request with unmatched categories now fails instead of partially succeeding**

If any category in the request has no matching cluster (for example
`["finance", "unknown"]`), the job ends with `status: failed`. Previously, the
run silently proceeded on the matched categories only. The unmatched names are
reported in the server logs and in the composite status message.

**Three fields have been removed from the stored strategy profiles**

FullGraphRAG strategy profiles no longer store `enable_semantic_units`,
`enable_edge_embeddings`, and `community_report_num_findings`, so these keys are
gone from the `parameters` map returned by
[`GET /v1/rag-strategizer/strategy`](../../agentic-ai-suite/autograph/reference/rag-strategizer.md).
Orchestration never forwarded them to the Importer, and
`community_report_num_findings` is no longer supported by the Importer API at
all.

#### Orchestration

**Removed and added request fields**

The [`POST /v1/orchestrate`](../../agentic-ai-suite/autograph/reference/orchestration.md)
request schema has changed:

| Field | Change | What to do instead |
|-------|--------|--------------------|
| `chat_api_keys` | Removed | Use `chat_secret_profile_ids`. |
| `partition_ids` | Removed | Scope a run with the new `categories` field, or narrow it to individual documents with `file_ids`. |
| `project` | **New, required** | Must match the project the service is configured for (`GENAI_PROJECT_NAME`), otherwise the request fails with HTTP `400`. |
| `categories` | New, optional | A list of category labels to restrict the run to. Omit it or send `[]` to orchestrate the whole project. |

**Requests that used to start a background run are now rejected upfront**

Orchestration validates before it claims the project's orchestration slot and
before it requests any Importer pod:

| Status | Error | Cause |
|--------|-------|-------|
| `400` | `NO_STRATEGY_PROFILES` | No matching strategy profiles exist. Run the RAG Strategizer first. |
| `409` | `NothingToOrchestrateError` | Every candidate partition is already present in the Knowledge Graph. |
| `409` | `NoMatchingFilesError` | A non-empty `file_ids` list matches no document. The response names the unmatched ids and the reason for each. |

The `NothingToOrchestrateError` case is the most likely to affect existing
automation: re-running orchestration over an already-built corpus no longer
starts a no-op run that reports success. To rebuild a partition that is present
but incomplete, delete the category, rebuild the corpus, re-run the strategizer,
and orchestrate again.

**Targeted runs only build the partitions that hold the requested files**

A `file_ids` list now narrows the run to the strategized clusters that actually
contain one of those files, instead of dispatching a job for every partition and
skipping most of them later. As a result, `total_jobs` in the status response is
meaningful for targeted runs. Unmatched ids in an otherwise valid list are
logged and the run proceeds.

**Orchestration status has a fourth terminal state**

Orchestration can now be cancelled with `DELETE /v1/orchestrate/{orchestration_id}`,
which adds `cancelled` to the terminal states. Clients that treat the status
field as a closed set of `pending`, `running`, `completed`, and `failed` must
handle the new value.

**The in-progress conflict response carries diagnostics**

The `409` `OrchestrationInProgressError` now reports the age of the run holding
the slot, its job counts, the time since the last worker contact, and whether a
cancellation is already pending, so a healthy long-running import can be told
apart from a stuck one.

#### Corpus builds

**Full rebuilds over already-built modules are rejected**

[`POST /v1/corpus/builds`](../../agentic-ai-suite/autograph/reference/corpus-build.md)
with `incremental: false` is refused with `REBUILD_NOT_ALLOWED`
(HTTP `409`) if any module it would process already has corpus sources.
Previously, such a build wiped the module's data and rebuilt it, which stranded
the Knowledge Graph content that the Importer cannot replace.

- Send only new categories with `incremental: false`. Mixed lists that contain
  both new and already-built categories are rejected as well, because the first
  pass would still wipe every processed module.
- Use `incremental: true` to add to or update modules that already exist.
- A first build on an empty corpus is unaffected.

For `categories` and `modules` requests the rejection is synchronous, before a
build id is issued. For `file_ids` and `import-multiple` requests the module set
is only known after the File Manager files have been resolved, so the build
fails with the same error code, but after a build id has been handed out. No
module data is deleted in either case.

**A staging budget caps how much a build downloads at once**

Total on-disk staging under the corpus working directory is capped by
`LOCAL_STORAGE_MAX_BYTES` (default `268435456`, i.e. 256 MiB, as a plain byte
count — suffixes such as `Mi` or `G` are not accepted). Files are downloaded in
waves within that budget and deleted after extraction.

A single file that exceeds the budget is skipped and the build status carries
the `STORAGE_FILE_TOO_LARGE` error code. The remaining files are still
processed, so the build can complete while reporting skipped files in its
completion message. Previously, a build with many files staged all of them
before extraction and could exceed the container memory limit.

**`doc_name` values are validated**

[`POST /v1/import-multiple`](../../agentic-ai-suite/autograph/reference/importing-files.md)
now rejects each `doc_name` that contains a path traversal sequence (`..`, `/`,
`\`), a control character, a quote, a semicolon, or an ampersand, as well as
stems consisting only of emoji. The response is HTTP `400` naming the offending
character class. Accepted names are NFC-normalized. Previously, a value such as
`../../escape.md` was accepted and silently stripped to its basename.

**The asynchronous endpoints return `202`**

`POST /v1/corpus/builds`, `POST /v1/rag-strategizer/analyze`, and
`POST /v1/orchestrate` accept the request and return HTTP **`202 Accepted`**.
Earlier documentation described these responses as `200`. Poll the respective
status endpoint for the outcome.

#### Model configuration

**The embedding model of a project can no longer be changed**

`PUT /v1/projects/{project}/model-config/credentials` rejects any request that
changes a previously stored `embedding_api_provider`, `embedding_model`, or
`embedding_api_url`. The response has `valid=false`, `errorCode=EMBEDDING_CONFIG_IMMUTABLE`,
and the offending `field`. Nothing is persisted and nothing is applied to the
running service.

Re-embedding a corpus would leave the Knowledge Graph built from the old
vectors, and the Importer can only insert into a partition, so it can neither
refresh nor drop the stale content. A different embedding model therefore
requires a **new project**. Rotating `embedding_secret_profile_id` and changing
every chat-side setting remain allowed. The `rebuildRequired` response field is
now always `false` and is retained only for wire compatibility.

**Credential validation issues a real inference call**

Validation no longer decides model support by looking the model up in the
provider's `GET /v1/models` catalog. It issues one minimal chat completion and
one single-input embeddings request instead, which establishes reachability, key
validity, model entitlement, and remaining quota together. The `MODEL_INVALID`
error code is gone. Failures map to a fixed set of codes:

`INVALID_API_KEY`, `KEY_EXPIRED`, `INSUFFICIENT_QUOTA`, `RATE_LIMITED`,
`PERMISSION_DENIED`, `MODEL_NOT_FOUND`, `MODEL_REJECTED_REQUEST`,
`ENDPOINT_UNREACHABLE`, `TIMEOUT`, `PROVIDER_ERROR`, `PROVIDER_EMPTY_RESPONSE`,
`RESPONSES_API_UNAVAILABLE`, `API_KEY_REQUIRED`, `MODEL_REQUIRED`,
`INVALID_BASE_URL`, `PROVIDER_NOT_FOUND`, and `UNKNOWN_VALIDATION_ERROR`.

A validation failure is not an HTTP error: the endpoint returns HTTP `200` with
`valid=false` and the code above.

**Model-sensitive endpoints are refused until the model configuration is valid**

On startup, AutoGraph reconciles the persisted model settings and probes the
effective chat and embedding configuration. Corpus builds, the RAG Strategizer,
and orchestration are refused while that is pending, and stay refused if the
probe latches a definitive failure. The service itself stays up so that
`PUT /v1/projects/{project}/model-config/credentials` remains available as the
remediation path, and it writes
`[MODEL_CONFIG] <code> on <field>: <message> (endpoint: <url>)` into the corpus
build and strategizer status with `status: failed`. The gate clears only when a
successful `PUT` **applies** a valid configuration to the running service;
persisting one is not enough.

#### Deployment configuration

**Embedding configuration keys have been renamed**

AutoGraph now uses the same keys as the Importer and the Retriever. Rename them
in your Helm values and deployment environment **before** you upgrade:

| Old key | New key |
|---------|---------|
| `EMBEDDING_MODEL_NAME` / `embedding_model_name` | `EMBEDDING_MODEL` / `embedding_model` |
| `EMBEDDING_DIMENSIONS` / `embedding_dimensions` | `EMBEDDING_DIM` / `embedding_dim` |

AutoGraph still reads the old names as a temporary fallback, but orchestration
and the Importer use the new keys only, so the legacy names do not reach the
Importer pods. They will be removed in a future release. See
[LLM configuration](../../agentic-ai-suite/autograph/llm-configuration.md).

**`fps_recovery_username` is required at install time**

Installing AutoGraph without `fps_recovery_username` now fails the Helm render
with an explicit error instead of failing at the first corpus build. The named
ArangoDB user must exist and have read/write access to the project database
before the first corpus build. Any read/write user works, but a dedicated
least-privilege user is recommended.

**`EMBEDDING_CONCURRENCY` is a floor, not a ceiling**

Embedding and entity-generation requests now read the provider's rate-limit
response headers and adapt their concurrency upward, to a ceiling of **100**,
falling back to the configured value when the provider answers with `429`. Size
your provider quota against 100 rather than against the configured value.

#### gRPC status codes

`BuildInProgressError` and `OrchestrationInProgressError` now map to the gRPC
status `ALREADY_EXISTS` (code 6) instead of `FAILED_PRECONDITION` (code 9).
Pure gRPC clients that match on `FAILED_PRECONDITION` must be updated. Clients
that go through the HTTP gateway are unaffected: both errors are still
HTTP `409 Conflict`.

#### Upgrading a corpus built with an earlier version

Corpus builds stamp the File Manager file identifier onto each source document.
Corpora built with an earlier release do not carry it, which affects
orchestration in two ways:

- A targeted orchestration that sends `file_ids` against such a corpus is
  refused with HTTP `409` `NoMatchingFilesError`, reporting that the corpus
  carries no stamped file id. Previously, the request was accepted and silently
  did nothing.
- Orchestration against a database whose name contains spaces or other special
  characters can fail with `File name(s) not found in file_manager`, because the
  fallback lookup by file name encodes the database name differently.

In both cases, run a full corpus build
([`POST /v1/corpus/builds`](../../agentic-ai-suite/autograph/reference/corpus-build.md))
to stamp the identifiers. Redeploying the service is not sufficient.
