---
title: API changes in the Arango Contextual Data Platform
menuTitle: API changes
weight: 10
description: >-
  New endpoints, new request and response options, and breaking changes of the
  service APIs of the Contextual Data Platform, including the Platform Suite and
  Agentic AI Suite
pageToc:
  maxHeadlineLevel: 3
---
## v4.1.0 (August 2026)

### AutoGraph (v0.0.14)

{{< tag "Agentic AI Suite" >}}

This release extends the
[AutoGraph](../../agentic-ai-suite/autograph/_index.md) HTTP API with endpoints
for incremental graph updates, project and category management, runtime model
configuration, and status polling for every asynchronous operation. It also
removes and renames a number of request fields.

{{< warning >}}
The following changes require you to adjust existing clients and deployment
configuration:

- [RAG Strategizer](#rag-strategizer): `full_graph_rag_strategy` is replaced by
  a required `complexity` field, and `project` is required.
- [Orchestration](#orchestration): `chat_api_keys` and `partition_ids` are
  removed, `project` is required, and requests over an already-built corpus are
  now rejected.
- [Corpus builds](#corpus-builds): a full rebuild over already-built modules is
  rejected.
- [Direct file upload](#direct-file-upload): `POST /v1/import-multiple` is
  deprecated. A new call now deletes the files and the category that the
  previous call created, and every uploaded file has to exist in the File
  Manager as well.
- [Model configuration](#model-configuration): the embedding model of an
  existing project can no longer be changed.
- [Deployment configuration](#deployment-configuration): the embedding model and
  dimension keys have been renamed, and `fps_recovery_username` is now required.
- [Status and error codes](#status-and-error-codes): the asynchronous endpoints
  return `202` instead of `200`.
{{< /warning >}}

#### New endpoints

| Endpoint | Purpose |
|----------|---------|
| `POST /v1/graph/insert` | Add documents to an existing corpus and Knowledge Graph without a full rebuild. |
| `POST /v1/graph/update` | Replace documents that have changed. |
| `POST /v1/graph/delete` | Remove documents and their graph assets. |
| `POST /v1/graph/recluster` | Recluster the partitions that divergence tracking has flagged. |
| `GET /v1/orchestrate/{orchestration_id}` | Poll the status of an orchestration run. |
| `DELETE /v1/orchestrate/{orchestration_id}` | Cancel a running orchestration. |
| `GET /v1/rag-strategizer/jobs/{strategize_job_id}` | Poll the status of a RAG Strategizer run. |
| `PATCH /v1/rag-strategizer/strategy/{cluster_id}` | Override the strategy assigned to a cluster. |
| `GET /v1/projects/{project}/overview` | Read the whole project Overview payload in one call. |
| `DELETE /v1/projects/{project}` | Delete a project and everything it owns. |
| `DELETE /v1/projects/{project}/categories/{category}` | Delete a single category. |
| `PUT /v1/projects/{project}/model-config/credentials` | Change the chat and embedding configuration at runtime. |

For request and response details, see the
[AutoGraph Service Reference](../../agentic-ai-suite/autograph/reference/_index.md).

#### Incremental graph updates

The `/v1/graph/*` endpoints keep an existing Knowledge Graph current without
re-running the corpus build, the RAG Strategizer, and a full orchestration pass.
Existing clusters and strategy profiles are preserved, and only the documents
that actually changed are processed.

- `POST /v1/graph/insert` extracts, embeds, and inserts a batch of File Manager
  files, assigning each document to the most similar existing cluster within its
  category.
- `POST /v1/graph/update` replaces changed documents, running as a delete leg
  followed by an insert leg.
- `POST /v1/graph/delete` removes documents and their graph assets, cascading
  into cluster and partition cleanup. It is fully synchronous, owns every layer,
  and restores the Knowledge Graph if the corpus delete fails afterwards. The
  `overall_status` response field reports `COMMITTED`, `ROLLED_BACK`, or
  `FAILED`.
- `POST /v1/graph/recluster` reclusters the partitions listed in
  `partition_ids` in the background.

Insert, update, and delete are mutually exclusive and reject a concurrent call
with HTTP `409`, as do category and project deletion while one of them is in
flight.

Each of the three also tracks how far the affected partitions have drifted from
the clustering they were built with, and returns a `divergence_score` and a
`needs_reclustering` flag per file. Reclustering is never automatic: divergence
is a signal, and calling `POST /v1/graph/recluster` is a deliberate step.

#### Corpus builds

**`categories` replaces `modules` and `file_ids` as the selector**

`POST /v1/corpus/builds` accepts a `categories` array of category labels, each
resolved server-side through the File Manager as the scope
`[<project>, <category>]`. `modules` remains as a deprecated alias, and the
`file_ids` id selector is deprecated as well. Provide only one of the three.

**New response and status fields**

- The create response returns `graph_name` next to `corpus_build_id`, so callers
  get the named graph without polling.
- `GET /v1/corpus/builds/{id}` additionally reports `graph_name`,
  `document_count`, `cluster_count`, and `error_code` on failure. Note that
  `document_count` is the size of the project's whole sources collection, not
  the contribution of this build.
- An incremental build over File Manager categories now also removes documents
  whose files were deleted in the File Manager, and reports `documents_added`,
  `documents_removed`, and `documents_unchanged`.

**Citable URLs**

Corpus builds and `POST /v1/graph/insert` read the optional
`custom_metadata.citable_url` key from the File Manager file metadata and
persist it on the source documents, so inline RAG citations render as links.

**Document conversion runs through the File Parser**

File Manager corpus builds parse documents through the File Parser service. A
build in which only some documents fail to parse completes and reports
`FILE_PARSER_PARTIAL_FAILURE` together with the ids of the failed files.

**Full rebuilds over already-built modules are rejected**

A build with `incremental: false` is refused with `REBUILD_NOT_ALLOWED`
(HTTP `409`) if any module it would process already has corpus sources.
Previously, such a build wiped the module's data and rebuilt it, which stranded
Knowledge Graph content that the Importer cannot replace.

- Send only new categories with `incremental: false`. Mixed lists that contain
  both new and already-built categories are rejected as well, because the first
  pass would still wipe every processed module.
- Use `incremental: true` to add to or update modules that already exist.
- A first build on an empty corpus is unaffected.

No module data is deleted in either case. For `categories` and `modules`
requests the rejection is synchronous, before a build id is issued. For
`file_ids` and `import-multiple` requests the module set is only known after the
File Manager files have been resolved, so the build fails with the same error
code after a build id has been handed out.

**A staging budget caps how much a build downloads at once**

Total on-disk staging is capped by `LOCAL_STORAGE_MAX_BYTES` (default
`268435456`, that is 256 MiB, as a plain byte count). Files are downloaded in
waves within that budget and deleted after extraction. A single file that
exceeds the budget is skipped and the build status carries
`STORAGE_FILE_TOO_LARGE`. The remaining files are still processed, so the build
completes and reports the skipped files.

#### Direct file upload

**`POST /v1/import-multiple` is deprecated, and its behavior has regressed**

The direct upload of documents with a `module` label is deprecated and is
documented only for integrations that already use it. The endpoint is still
served and still accepts files, but two changes in this release make it
unusable as the only upload path:

- A new call **deletes** the files staged by the previous call, together with
  the category that the previous `module` label created. Earlier versions of
  the service kept both in place and only superseded the staged files, so
  successive uploads accumulated. Now only the most recent batch survives, and
  a version history staged through the endpoint is lost with it.
- A staged file only reaches a corpus build if a file with the same basename
  also exists as a RAG input in the File Manager for the same database.
  Earlier versions built from the staged files alone. Every document therefore
  has to be uploaded twice.

In addition,
[incremental graph updates](../../agentic-ai-suite/autograph/incremental-graph-updates.md)
identify a document by its File Manager `file_id` and cannot reach a document
that exists only as a direct upload.

Upload your files to the
[File Manager](../../platform-suite/file-manager/api.md#upload-a-rag-input-file)
under the scope `[<project>, <category>]` and build with `categories` instead.
See [Import Files](../../agentic-ai-suite/autograph/reference/importing-files.md).

The File Manager is the more convenient way to manage uploads, and it scales
better. Files are uploaded once and can then be listed, searched, replaced, and
reused across builds, each with a stable `file_id` that corpus builds and
incremental graph updates refer to. It also keeps large uploads away from
AutoGraph itself: a direct upload pushes an entire batch into the service in
one request, which a big enough batch can overwhelm, whereas a build over File
Manager files downloads and parses them in waves within the
[staging budget](#corpus-builds).

**`doc_name` values are validated**

`POST /v1/import-multiple` now rejects each `doc_name` that contains a path
traversal sequence (`..`, `/`, `\`), a control character, a quote, a semicolon,
or an ampersand, as well as stems consisting only of emoji. The response is
HTTP `400` naming the offending character class, and accepted names are
NFC-normalized. Previously, a value such as `../../escape.md` was accepted and
silently stripped to its basename.

#### RAG Strategizer

**`full_graph_rag_strategy` has been replaced by a required `complexity` field**

The `full_graph_rag_strategy` field no longer exists in the
[`POST /v1/rag-strategizer/analyze`](../../agentic-ai-suite/autograph/reference/rag-strategizer.md)
request and is silently dropped before it reaches the service. Use the
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
`round(target_percentage / 100.0 * cluster_count)`, so a project with a single
cluster gets **zero** FullGraphRAG clusters at `moderate` and below. Check the
assigned strategies with `GET /v1/rag-strategizer/strategy` before you query: a
VectorRAG partition has no entities and no communities, and cannot serve the
retriever's `LOCAL`, `GLOBAL`, or `UNIFIED` modes.

**New request options**

| Option | Type | Description |
|--------|------|-------------|
| `project` | string, required | Must match the project the service is configured for. A mismatch returns HTTP `400`. |
| `complexity` | enum, required | See above. |
| `extract_images_default` | boolean, optional | Defaults to `false`. Rejected with HTTP `400` unless `complexity` is `high` or `very_high`. |
| `categories` | string[], optional | Restricts strategy generation to the listed categories. |

Everything except `categories` is validated before the asynchronous job is
dispatched. If a listed category has no matching cluster, the job now ends with
`status: failed` instead of silently proceeding on the matched categories only.

**New endpoints**

- `GET /v1/rag-strategizer/jobs/{strategize_job_id}` returns the `status`,
  `progress`, and `clusters_total` / `clusters_done` counters of an analyze run.
  Terminal snapshots are retained for one hour by default, so poll for the
  outcome rather than relying on the status staying available.
- `PATCH /v1/rag-strategizer/strategy/{cluster_id}` overrides `strategy_type`,
  `entity_types`, and `extract_images` for a single cluster. Overriding a
  strategy after its partition has been imported does not re-import it: delete
  the category, rebuild, re-strategize, and orchestrate again.

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
| `project` | **New, required** | Must match the project the service is configured for. A mismatch returns HTTP `400`. |
| `categories` | New, optional | Category labels the run is restricted to. Omit it or send `[]` to orchestrate the whole project. |
| `file_ids` | New, optional | File Manager ids the run is restricted to. Each orchestrated partition then imports only those files, intersected with its own cluster. |

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

A `file_ids` list now narrows the run to the strategized clusters that actually
contain one of those files, instead of dispatching a job for every partition and
skipping most of them later, so `total_jobs` is meaningful for targeted runs.

**New endpoints**

- `GET /v1/orchestrate/{orchestration_id}` returns the status, the job counters,
  and per-job details of a run. The status is held in memory only, and a newer
  trigger evicts it.
- `DELETE /v1/orchestrate/{orchestration_id}` cancels a running orchestration.
  This adds `cancelled` as a fourth terminal state next to `pending`, `running`,
  `completed`, and `failed`, so clients that treat the status field as a closed
  set must handle the new value.

The `409` `OrchestrationInProgressError` now reports the age of the run holding
the slot, its job counts, the time since the last worker contact, and whether a
cancellation is pending, so a healthy long-running import can be told apart from
a stuck one.

#### Projects and categories

- `GET /v1/projects/{project}/overview` returns the whole Overview payload in
  one call: a corpus graph card, a Knowledge Graph card, a strategies block, and
  a per-category list, each with its own staleness flags, plus `category_count`,
  `total_documents`, and `filtered_total_documents`. Staleness is computed at
  read time, with no stored flag. `total_documents` is always the unfiltered
  project total; the total for a browse or paging request is reported separately
  in `filtered_total_documents`. The endpoint accepts the browse parameters
  `scope`, `search`, `name`, `limit`, and `offset`, and deliberately returns no
  file list — browse files against the File Manager directly.
- `DELETE /v1/projects/{project}` deletes the services, graphs, Views, and
  collections a project owns, optionally including its File Manager data. It
  reports partial-cleanup warnings so the call can be retried.
- `DELETE /v1/projects/{project}/categories/{category}` deletes a single
  category synchronously, and its files when `delete_files` is set. A file that
  the corpus still references is locked, left intact, and reported in
  `locked_skipped`.

Both delete endpoints return HTTP `409` while a corpus build, an orchestration,
or a graph update is in progress.

#### Model configuration

**`PUT /v1/projects/{project}/model-config/credentials`**

Sets the chat and embedding configuration of a running service, independently
for each side, and persists it in the project metadata so it survives a
teardown and redeploy. Only secret profile ids are stored, never API keys. The
response reports whether the configuration was persisted, whether it passed
validation, and whether it is live without a restart — check the last one,
because otherwise the configuration only takes effect on the next restart.

**`custom` is a first-class provider**

`custom` identifies any OpenAI-compatible endpoint, such as OpenRouter, Gemini,
Azure, or a self-hosted gateway, and can be set independently for chat and
embedding. `chat_api_url` and `embedding_api_url` are required with it. Unknown
provider strings are rejected rather than silently defaulting to `openai`, and
configurations already stored as `openai` with a non-default base URL are not
migrated automatically. The chat side accepts `openai`, `custom`, and `triton`;
the embedding side accepts `openai` and `custom`.

**The embedding model of a project can no longer be changed**

The endpoint rejects any request that changes a previously stored
`embedding_api_provider`, `embedding_model`, or `embedding_api_url`. The
response has `valid=false`, `errorCode=EMBEDDING_CONFIG_IMMUTABLE`, and the
offending `field`. Nothing is persisted and nothing is applied to the running
service.

Re-embedding a corpus would leave the Knowledge Graph built from the old
vectors, and the Importer can only insert into a partition, so it can neither
refresh nor drop the stale content. A different embedding model therefore
requires a **new project**. Rotating `embedding_secret_profile_id` and changing
every chat-side setting remain allowed. The `rebuildRequired` response field is
now always `false` and is retained only for backward compatibility.

**Credential validation issues a real inference call**

Validation no longer decides model support by looking the model up in the
provider's model catalog, which produced false negatives on gateways that list
no embedding models at all, and let a key without remaining credit pass. It
issues one minimal chat completion and one single-input embeddings request
instead. The `MODEL_INVALID` error code is gone, and failures now map to a fixed
set of codes such as `INVALID_API_KEY`, `INSUFFICIENT_QUOTA`,
`MODEL_NOT_FOUND`, and `ENDPOINT_UNREACHABLE`. A validation failure is not an
HTTP error: the endpoint returns HTTP `200` with `valid=false` and the code.

**Model-sensitive endpoints are refused until the model configuration is valid**

On startup, AutoGraph reconciles the persisted model settings and probes the
effective configuration. Corpus builds, the RAG Strategizer, and orchestration
are refused while that is pending, and stay refused if the probe latches a
definitive failure, which is written into the corpus build and strategizer
status with `status: failed`. The service itself stays up so that this endpoint
remains available as the remediation path, and the gate clears only once a
successful request applies a valid configuration to the running service.

#### Status and error codes

**The asynchronous endpoints return `202`**

`POST /v1/corpus/builds`, `POST /v1/rag-strategizer/analyze`, and
`POST /v1/orchestrate` accept the request and return HTTP **`202 Accepted`**.
Earlier documentation described these responses as `200`. Poll the respective
status endpoint for the outcome.

**New HTTP status codes**

| Status | When |
|--------|------|
| `202 Accepted` | An asynchronous operation has been accepted. |
| `409 Conflict` | The request conflicts with an operation that is already in progress, such as a build, an orchestration, or a delete. |
| `429 Too Many Requests` | A service resource has been exhausted. |
| `507 Insufficient Storage` | Defined for the local storage limit. In practice, exhausting the staging budget surfaces as a *completed* build carrying `STORAGE_FILE_TOO_LARGE`, and a single oversized file is a `400`. |

**Corpus build error codes**

`GET /v1/corpus/builds/{id}` reports `error_code` on failure. This release adds
`REBUILD_NOT_ALLOWED`, `STORAGE_FILE_TOO_LARGE`, and
`FILE_PARSER_PARTIAL_FAILURE` to the provider-failure codes documented in
[Error handling](../../agentic-ai-suite/autograph/reference/error-handling.md),
and documents `UNKNOWN_ERROR` as the fallback for any unclassified failure. The
list is not closed, so treat an unknown code as a generic failure.

**`GET /v1/health`**

The health endpoint returns only `200` or `401` and always reports `SERVING`. It
probes no dependencies. The response gains an optional `message` field that
carries the per-provider LLM tracing health while tracing is enabled.

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
instead of failing at the first corpus build. The named ArangoDB user must exist
and have read/write access to the project database before the first corpus
build.

**New configuration options**

| Option | Description |
|--------|-------------|
| `TRACING_ENABLED`, `TRACING_SECRET_PROFILE_ID` | Enable LLM tracing and point it at a secret profile carrying the provider settings, endpoints, and credentials. Tracing is off by default and fails open, so an unreachable provider never blocks a build. |
| `LOCAL_STORAGE_MAX_BYTES` | Caps on-disk staging under the corpus working directory. Default `268435456`. |
| `DOCUMENT_EXTRACTION_CONCURRENCY` | Document extraction concurrency, decoupled from the embedding concurrency. |
| `provider_probe_timeout_seconds` | Timeout for the model configuration inference probe. Default 10 seconds; raise it for slow private endpoints. |
| `rag_strategizer_status_retention_seconds`, `rag_strategizer_status_max_entries` | How long terminal strategizer job statuses stay pollable, and the cap on retained entries. Defaults: one hour and `1000`. |

**`EMBEDDING_CONCURRENCY` is a floor, not a ceiling**

Embedding and entity-generation requests read the provider's rate-limit response
headers and adapt their concurrency upward, to a ceiling of **100**, falling
back to the configured value when the provider answers with `429`. Size your
provider quota against 100 rather than against the configured value.

**Orchestration timeouts**

The maximum orchestration duration has been raised from 2.5 hours to three days.
Two liveness limits now terminate a run whose Importer fleet never arrives: no
worker ready within 15 minutes, and no worker answering for 30 minutes. Both are
measured against worker contact, never against job counters, so a large
partition that sits at unchanged counters for hours while importing normally is
not affected.

#### Upgrading a corpus built with an earlier version

Corpus builds stamp the File Manager file identifier onto each source document.
Corpora built with an earlier release do not carry it, which affects
orchestration in two ways:

- A targeted orchestration that sends `file_ids` against such a corpus is
  refused with HTTP `409` `NoMatchingFilesError`. Previously, the request was
  accepted and silently did nothing.
- Orchestration against a database whose name contains spaces or other special
  characters can fail with `File name(s) not found in file_manager`, because the
  fallback lookup by file name encodes the database name differently.

In both cases, run a full corpus build
([`POST /v1/corpus/builds`](../../agentic-ai-suite/autograph/reference/corpus-build.md))
to stamp the identifiers. Redeploying the service is not sufficient.

### Importer (v0.0.32)

{{< tag "Agentic AI Suite" >}}

This release removes the Importer's delete endpoint and its image storage
request fields, and replaces the boot-time API key probe with a full model
configuration check.

{{< warning >}}
The following changes require you to adjust existing clients, and one of them
requires you to import data again:

- [Removed endpoint](#removed-endpoint): `POST /v1/delete` is gone. Deleting a
  document is an AutoGraph operation.
- [Removed image request fields](#removed-image-request-fields):
  `store_image_data`, `crop_images`, and `store_images_to_s3` no longer exist,
  and a request that still carries them may be rejected.
- [Metadata of earlier imports](#metadata-of-earlier-imports): partitions
  imported out of alphabetical order before this release carry the wrong
  `file_name` and `citable_url` and have to be imported again.
{{< /warning >}}

#### Removed endpoint

`POST /v1/delete` has been removed. Removing the Layer 3 data of a document is
handled by
[`POST /v1/graph/delete`](../../agentic-ai-suite/autograph/reference/orchestration.md#delete-documents)
in AutoGraph. The Importer keeps
[`POST /v1/recluster`](../../agentic-ai-suite/importer/incremental-updates.md#reclustering)
for rebuilding the community layer of a single partition. See
[Incremental Updates](../../agentic-ai-suite/importer/incremental-updates.md).

#### Removed image request fields

The `store_image_data`, `crop_images`, and `store_images_to_s3` request fields
have been removed. The service does not read them, and a request body that still
carries them may be rejected instead of being ignored. Image extraction is now
driven by `enable_semantic_units` and image descriptions by `process_images`.
See
[Semantic Units](../../agentic-ai-suite/importer/semantic-units.md#configuration).

#### Metadata of earlier imports

A bug could attach the wrong `file_name` and `citable_url` to a document when
several files were imported in an order other than alphabetical. New imports are
correct. Partitions that were imported out of alphabetical order before this
release can still carry the wrong values and have to be imported again to fix
the metadata.

#### Boot-time model configuration gate

The boot-time check of the deployed chat and embedding configuration now tests
the models with a live inference call and reports the outcome as
`[MODEL_CONFIG]`. A definitive rejection keeps the service up for inspection
instead of terminating it, and imports are refused until it is redeployed with a
valid configuration. See
[Boot-time model configuration gate](../../agentic-ai-suite/importer/reference/error-handling.md#boot-time-model-configuration-gate).

#### Limits and quotas

The limits the Importer enforces on concurrency, request size, chunking, images,
and timeouts are now documented. See
[Limits and Quotas](../../agentic-ai-suite/importer/reference/limits.md).
