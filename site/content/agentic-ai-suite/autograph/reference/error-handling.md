---
title: AutoGraph Error Handling and Troubleshooting
menuTitle: Error Handling
description: >-
  HTTP error codes, common issues, and troubleshooting for the AutoGraph service
weight: 60
---
## Error Handling

The service returns these HTTP status codes:

| Code | Meaning |
|------|---------|
| `200` | Success, for synchronous operations. |
| `202` | Accepted. The corpus build, strategizer run, or orchestration was started in the background. |
| `400` | Invalid request body or parameters, a corpus build selector the File Manager has nothing for, a rejected model configuration credential, or a latched model configuration. |
| `401` | Missing or invalid token. [Project Overview](project-operations.md#project-overview) also returns it when the File Manager rejects the credentials of the service. |
| `403` | Authenticated but not allowed to use the database. [Project Overview](project-operations.md#project-overview) also returns it when the File Manager denies access. |
| `404` | Unknown build, job, orchestration, or cluster ID, a collection in an embed request that does not exist, a category that was never built, a project that is not the one the service runs against, or an AutoGraph service node that is missing from the project metadata. |
| `409` | Another build, orchestration run, strategizer run, or graph mutation is already in progress, a project deletion has started, there is nothing to orchestrate, or none of the given `file_ids` matched. |
| `500` | Server or configuration error. |
| `503` | The service, the graph, or the File Manager is not ready. |

Error responses are usually JSON with a `message` field (and sometimes a
`code`) that you can log or show to operators.

{{< info >}}
**`429 Too Many Requests` and `507 Insufficient Storage` are defined but never
reached.** The gateway maps a provider rate limit onto `429` and a local storage
limit onto `507`, but no endpoint raises either of them. Do not write a client
branch for these two statuses.

- **Provider throttling** always happens while a job runs in the background, so
  it is reported on the job as `error_code: LLM_RATE_LIMITED` or
  `LLM_QUOTA_EXCEEDED`, which you read from a `200` poll of the failed job. A
  rate limit that the live inference probe of
  [`PUT /v1/projects/{project}/model-config/credentials`](project-operations.md#update-model-config-credentials)
  runs into is a `400` with `error_code: RATE_LIMITED` instead, and a
  rate-limited File Manager is reported as `503`.
- **Staging budget exhaustion** is reported on the build itself, as a
  **completed** build with `error_code: STORAGE_FILE_TOO_LARGE`. A single file
  that is larger than the whole budget is a `400` on the deprecated
  [`POST /v1/import-multiple`](importing-files.md).
{{< /info >}}

### Two outcomes that are not failures

- **`202`** means accepted, not finished. Poll the matching status endpoint.
- **`409` from `POST /v1/orchestrate`** with a message that reads
  `Nothing to orchestrate: …` means the knowledge graph is already up to date.
  Do not retry. Check
  [Project Overview](project-operations.md#project-overview) if you expected
  work to be pending.

### Successful responses that you still have to inspect

- `GET /v1/corpus/builds/{id}` with `status: completed` **and** a non-empty
  `error_code` is a partial success, see
  [Build error codes](corpus-build.md#build-error-codes).
- `PUT /v1/projects/{project}/model-config/credentials` returns `200` for a
  configuration that was accepted and persisted, but `applied_to_running_pod`
  can still be `false`, which means it only takes effect on the next service
  restart. A validation failure is a `400`, see
  [Update Model Config Credentials](project-operations.md#update-model-config-credentials).
- `DELETE /v1/projects/{project}` returns `200` for a complete teardown and for
  a partial failure. Key off `deleted`, see
  [Delete Project](project-operations.md#delete-project).
- A `POST /v1/graph/insert` or `/v1/graph/update` response can report a failure
  per file while the request itself succeeded.

{{< info >}}
**Async jobs**: Corpus build, RAG Strategizer, and orchestration jobs run in the
background. The request that starts one returns `202` even if the job later
fails because of an LLM or embedding provider problem; the `202` only means that
the job was accepted, not that it finished. To learn the real outcome, poll
`GET /v1/corpus/builds/{id}`, `GET /v1/rag-strategizer/jobs/{id}`, or
`GET /v1/orchestrate/{id}`, or watch the status in the web interface.
{{< /info >}}

### Provider-failure error codes

When a corpus build fails because of an LLM
or embedding provider error, `GET /v1/corpus/builds/{id}` returns an `error_code`
field that identifies the cause, so your client can react to each one.

The **HTTP equivalent** column below is a semantic category for client handling.
It is not a status that the API returns: the poll of the build status answers
`200` with the failed build record, and none of these failures ever reaches you
as an HTTP status, because they all occur while the job runs in the background.

| `error_code` | Meaning | HTTP equivalent |
|--------------|---------|-----------------|
| `LLM_AUTHENTICATION_FAILED` | API key rejected by the provider | `401` |
| `LLM_PERMISSION_DENIED` | API key valid but lacks access to the model | `403` |
| `LLM_RATE_LIMITED` | Provider rate-limited the request | `429` |
| `LLM_QUOTA_EXCEEDED` | Provider quota for the key was consumed | `429` |
| `LLM_API_KEY_MISSING` | No chat/embedding key configured on the service | `401` |

A build can also carry `FILE_PARSER_PARTIAL_FAILURE`, `FILE_PARSER_NO_SUCCESS`,
`FILE_PARSER_TIMEOUT`, `STORAGE_FILE_TOO_LARGE`, `REBUILD_NOT_ALLOWED`, or the
catch-all `UNKNOWN_ERROR`. For the full list and what to do about each of them,
see [Build error codes](corpus-build.md#build-error-codes).

### The model configuration gate

If the chat or embedding configuration that the service resolved at startup is
invalid, or if a pod is still reloading the persisted settings, then
`POST /v1/corpus/builds`, `POST /v1/rag-strategizer/analyze`, and
`POST /v1/orchestrate` return `400` immediately rather than queueing work that
would fail while embedding. Health checks and read requests are unaffected.

Clear the gate with
[`PUT /v1/projects/{project}/model-config/credentials`](project-operations.md#update-model-config-credentials).
Only definitive, non-retryable validation failures latch it. Transient ones such
as `ENDPOINT_UNREACHABLE`, `TIMEOUT`, `RATE_LIMITED`, and `PROVIDER_ERROR` are
logged and leave the gate open.

**Common causes of validation or configuration errors:**

- The `files` array is empty on import, insert, or update, or an insert batch
  holds more than 100 files.
- The `embedding_strategy` is set to a value other than `"first_chunk"`.
- The `cluster_threshold` is set to a value other than `1` or `2`.
- More than one of `categories`, `modules`, or `file_ids` is set on a corpus
  build.
- A `categories` label on a full corpus build (`incremental: false`) has no
  files in the File Manager, or `file_ids` lists IDs that the File Manager
  cannot resolve. No build is created in either case, see
  [Create Corpus Build](corpus-build.md#create-corpus-build).
- A model configuration credential is rejected by the provider or the secret
  manager, see
  [Update Model Config Credentials](project-operations.md#update-model-config-credentials).
- `project` or `complexity` is missing on a RAG Strategizer request.
- The RAG Strategizer was called before a corpus build finished successfully.
- An [incremental graph update](../incremental-graph-updates.md) was called
  before the initial corpus build had finished.
- The `category` of an incremental graph update is unknown, or it was omitted in
  a project that has more than one category.
- A document that you want to delete or update is not in the graph, or it
  belongs to another category.
- A batch contains duplicate `doc_name` or `file_id` values.
- The `partition_ids` array is empty in a recluster request, or lists more than
  five partitions.
- An embed request is missing `collection` or `field`, or `field` ends in
  `_embedding`.
- The server has no embedding provider or no authentication configured.

## Known Limitations

### Citation handling

**Citations require manual processing.** AutoGraph preserves the `citable_url`
field throughout the pipeline (from import through the GraphRAG Importer), but
it does not yet detect or link citations automatically. The service stores
any citation URLs you provide at import and passes them on to later stages;
you have to handle these citation features yourself:

- **Citation extraction from content**: Citations inside document text
  (for example, references, footnotes, or bibliographies) are not detected
  or extracted automatically.
- **SemanticUnits linking**: The orchestrator sets `enable_semantic_units: true`
  for FullGraphRAG partitions, but citation nodes are not yet created or linked
  in the `SemanticUnits` collection.
- **Citation validation**: No citation URL is checked for reachability, so a
  link that has gone dead is still shown. URLs that come from File Manager are
  at least checked for a usable `http` or `https` form; ones you set inline are
  stored exactly as you write them.
- **Cross-document citation tracking**: Links between documents based on
  citations are not created automatically.

**Recommended workflow:**

1. Give every document you want cited a citation URL. Files in File Manager
   take theirs from
   [custom metadata](../../../platform-suite/file-manager/api.md#the-citable_url-key)
   at upload; inline imports take it from `citable_url` on the file.
2. The URL is stored in the corpus graph and passed to the importer during
   orchestration.
3. To extract citations from document content, add your own processing step
   that:
   - Scans your documents for citation references.
   - Creates `SemanticUnits` nodes for cited resources.
   - Links chunks and documents to their citations.

A future release will add automatic citation detection and SemanticUnits
creation.

### VectorRAG query support

**VectorRAG partitions support a smaller set of queries.** When the RAG
Strategizer assigns **VectorRAG** to a cluster (domain), the GraphRAG
Importer creates only the `Documents`, `Chunks`, and `Relations` collections
for that partition. It does not create `Entities` or `Communities`, which
some query types need. This limits which queries you can run later.

| Query type | VectorRAG | FullGraphRAG | Notes |
|------------|:---------:|:------------:|-------|
| **Global** | Not supported | Supported | Needs `Communities` with community summaries. |
| **Local** | Not supported | Supported | Needs `Entities` and entity-relationship subgraphs. |
| **Unified** | Partial | Supported | Vector search works, but without entity context the answer quality drops. |

**Why this happens:**

- VectorRAG is a lighter strategy that skips entity extraction and
  community detection to save time and cost.
- Global queries need community-level summaries that only exist in
  FullGraphRAG partitions.
- Local queries need entity-relationship graphs extracted from text,
  which VectorRAG does not produce.
- Unified queries can search chunks with vector similarity (both strategies
  have chunks), but they miss the entity context that FullGraphRAG adds.

**Recommended approach:**

1. **For query-heavy workloads**: Set `complexity` to `"very_high"` or `"high"`
  when calling `POST /v1/rag-strategizer/analyze` so that most or all clusters
  use FullGraphRAG.
2. **For mixed workloads**: Accept that VectorRAG partitions only serve vector
  chunk search (unified queries with reduced quality).
3. **To change the strategy of a single cluster**: Override it with
  `PATCH /v1/rag-strategizer/strategy/{cluster_id}`. Do so **before** the first
  orchestration, because the partition ID does not change and an already
  imported partition is not built again.
4. **For critical domains**: Review the assignments with
  `GET /v1/rag-strategizer/strategy`. If a partition has already been imported
  under the wrong strategy, remove the category with
  `DELETE /v1/projects/{project}/categories/{category}`, build it again, re-run
  the strategizer, and orchestrate.

For the full comparison, see
[Retrieval capability per strategy](rag-strategizer.md#retrieval-capability-per-strategy).

## Troubleshooting

- **Cannot reach ArangoDB.** Check your network and firewall, and confirm
  the ArangoDB URL your deployment is using.
- **401 Unauthorized.** Send the token as `Authorization: Bearer <token>`,
  with a space between `Bearer` and the token value.
- **Build appears stuck or fails.** Poll `GET /v1/corpus/builds/{id}` and
  inspect the `status`, `message`, and `error` fields for details.
- **A build failed with `FILE_PARSER_NO_SUCCESS`.** No file in the build
  produced any usable text, so there was nothing to embed. `message` names the
  first ten failing files as `filename (ID: file_id): error`. Scanned images
  without OCR-readable text, and corrupt or password-protected documents, are
  the usual causes.
- **A build failed with `FILE_PARSER_TIMEOUT`.** The File Parsing Service did
  not finish within the batch deadline. The batch was not cancelled and may
  still complete on the parser side. Retry the build; if it keeps happening, the
  corpus is probably too slow to parse, for example because it is mostly scanned
  material.
- **Only one module's files appear in the build**, or **files and a category
  from an earlier import are gone.** Each `POST /v1/import-multiple` call
  deletes the files of the previous direct-upload call and the category its
  `module` label created. Earlier versions of the service kept both. The
  endpoint is deprecated for this reason: upload to the File Manager and build
  with `categories` instead. See [Import Files](importing-files.md).
- **A build ignores files that `import-multiple` accepted.** A staged file only
  reaches the build if the same basename also exists as a RAG input in the
  File Manager for the same database, so the direct upload alone is not enough.
  A build that does pass `categories` or `file_ids` has its selector checked
  before it is accepted and reports this as a `400` on the request instead, see
  [Create Corpus Build](corpus-build.md#create-corpus-build).
- **RAG Strategizer fails.** Make sure a corpus build has finished and
  produced clusters before you run the Strategizer. Poll
  `GET /v1/rag-strategizer/jobs/{strategize_job_id}` for the outcome of a run.
- **A scoped Strategizer job fails immediately.** If you sent `categories` and
  any of the listed categories has no matching cluster, the whole job fails,
  even when the others matched. The labels are case-sensitive, check them
  against `GET /v1/projects/{project}/overview`.
- **A job status returns `404`.** The statuses are held in memory with bounded
  retention: 24 hours for a corpus build, 1 hour for a strategizer job, and an
  orchestration status is evicted by the next orchestration trigger. All of them
  are lost on a pod restart, so persist any ID you need for an audit.
- **Orchestration fails.** Confirm that the `rags` collection contains
  strategies, and that platform authentication and the GraphRAG Importer
  integration are configured for your environment.
- **You uploaded more files than the corpus has documents.** There are two
  causes and they show up in different places. Check them in this order:
  1. **A name was reused within one category**, which is the more common case.
     The File Manager keys a RAG input by database, project, category, and name,
     so uploading the same name into the same category supersedes the earlier
     file. You get one entry at `version: 2`, not two entries, and only the
     latest version of a file is built. Confirm it by listing the RAG inputs of
     the project and comparing their number against the number of your uploads,
     and by checking the `version` field of the suspects. The build response
     cannot show this, because a file that was superseded before the build ran
     was never visible to AutoGraph. Upload under distinct names, or into
     separate categories, if you want both files to exist.
  2. **Two files collapsed onto one document during the build**, which
     `documents_deduplicated` and `dedup_groups` report on
     `GET /v1/corpus/builds/{id}`. See
     [Document identity and deduplication](corpus-build.md#document-identity-and-deduplication)
     for the sequence that leads to it and how to resolve it.
- **A corpus build fails with duplicate insert symptoms**, such as
  `Partial bulk insert: 0/N` or `No documents were inserted into the database`.
  The run tried to insert document keys that already exist, that is the same
  category and the same file name. Import under a different category or file
  name, or replace the documents in place with `POST /v1/graph/update`. A full
  rebuild of a category that already exists is rejected with
  `REBUILD_NOT_ALLOWED`.
- **A client breaks after an upgrade with an unexpected status.** The
  asynchronous endpoints now return `202` instead of `200`. Accept any `2xx`.
- **A model configuration change had no effect.** Check
  `applied_to_running_pod` in the response. When it is `false`, the
  configuration was persisted but only takes effect on the next service
  restart. A rejected configuration never gets that far. It comes back as a
  `400` with `valid: false` and nothing is persisted or applied.
- **`MODEL_NOT_FOUND` for a model you know exists.** Send `chat_api_url` and
  `embedding_api_url` in the request, so that the live inference probe hits your
  endpoint instead of the default OpenAI URL.
- **Project Overview returns `503`.** The File Manager is unreachable, timed
  out, or not ready. A `401` or `403` from the overview indicates a File Manager
  authentication or permission problem rather than an outage.
- **An incremental graph update returns `409`.** Corpus builds, orchestration
  runs, and the `/v1/graph/*` endpoints share one service-wide slot. Wait for
  the active operation to finish and try again.
- **A document is missing from Layer 3 after an insert.** An insert only updates
  Layers 1 and 2. Run a targeted orchestration with the returned `file_id`. For
  other problems with incremental graph updates, see
  [Graph Operations](orchestration.md#troubleshooting).
- **An insert or update is rejected with `400` and a list of `doc_name`
  values.** Those entries have no `file_id`. Both endpoints take File Manager
  input only, and a single missing ID rejects the whole batch. See
  [Identifying documents for Layer 3](../incremental-graph-updates.md#identifying-documents-for-layer-3).
- **Embed Field endpoint fails.** The target collection must exist, the
  source field must have non-empty values, and an embedding provider must
  be configured on the service.
