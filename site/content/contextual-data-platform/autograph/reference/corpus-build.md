---
title: AutoGraph Corpus Build Reference
menuTitle: Corpus Build
description: >-
  Build the corpus graph from the documents of your categories, and monitor
  the build
weight: 10
---
{{< tag "Agentic AI Suite" >}}

`POST /v1/corpus/builds` reads the documents of one or more categories,
creates an embedding for each one, and groups them into clusters in the corpus
graph. `GET /v1/corpus/builds/{corpus_build_id}` reports the progress and the
result of a build. Once a build has completed, assign strategies to the
clusters with the [RAG Strategizer](rag-strategizer.md). For how categories,
the corpus graph, and the knowledge graph fit together, see the
[Design Guide](../design-guide.md).

The endpoints are relative to the path of the project's AutoGraph service,
`https://<EXTERNAL_ENDPOINT>:8529/autograph/{service_id_postfix}`.
`service_id_postfix` is the end of the service ID, such as `vyk1t` for
`arangodb-autograph-vyk1t`. The `serviceUrl` in the project metadata of
[`GET /_platform/acp/v1/project_by_name/{database}/{project}`](../../control-plane-acp/api.md#get-project-details)
ends with it, for example `.../autograph/vyk1t/`.

| Endpoint | Operation | Purpose | Call |
|----------|-----------|---------|------|
| [`POST /v1/corpus/builds`](#start-a-corpus-build) | Build | Build the corpus graph from File Manager categories | Asynchronous |
| [`GET /v1/corpus/builds/{corpus_build_id}`](#monitor-a-corpus-build) | Monitor | Read the progress and the result of a build | Synchronous |

## Start a corpus build

{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/autograph/{service_id_postfix}/v1/corpus/builds" >}}

Starts a corpus build from File Manager categories, or from files that you
have imported directly. The call is asynchronous. It returns `202` with a
`corpus_build_id` and runs the build in the background.

Select the documents by `categories`, so that the service resolves the files of
each category from the File Manager itself. On a first build, send only new
categories and leave `incremental` at its default of `false`. To append
documents to a category that has already been built, set `incremental: true`.
Only one build can run at a time. A second one is rejected with `409`.

### Request

By category:

```json
{
  "embedding_strategy": "first_chunk",
  "categories": ["legal", "finance"],
  "strategy": {
    "top_k": 7,
    "cluster_threshold": 2
  },
  "incremental": false
}
```

By File Manager IDs, which is deprecated:

```json
{
  "embedding_strategy": "first_chunk",
  "file_ids": ["file_id_1", "file_id_2", "file_id_3"],
  "strategy": {
    "top_k": 7,
    "cluster_threshold": 2
  }
}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `embedding_strategy` | string | No | How the text for the embedding is chosen. `first_chunk` is the only supported value and the default, so you can omit it. |
| `categories` | string[] | No | The preferred selector. Bare category labels below the current project, such as `["legal", "finance"]`. The service resolves the files on the server through the File Manager. |
| `modules` | string[] | No | Deprecated alias for `categories`. Only used when `categories` is empty. Send `categories` instead. |
| `file_ids` | string[] | No | Deprecated. Explicit File Manager IDs of RAG inputs. Send `categories` instead. |
| `strategy` | object | No | Settings for similarity and clustering. Omit it to use the service defaults. |
| `strategy.top_k` | integer | No | How many similar neighbors each document gets, which drives the number of similarity edges. The default is `7`. Values from `5` to `10` are typical. A higher value makes the graph denser and costs more work and API calls. |
| `strategy.cluster_threshold` | integer | No | How deep the clustering goes. `1` groups documents flat, which is simpler and faster and suits very small document sets. `2` builds a hierarchy with a richer structure. The default is `2`, which suits most corpora. |
| `strategy.custom_params` | map | No | Extra string keys and values that the service interprets, such as a graph name. Omit it unless your operator documents a key, such as `graph_name`. |
| `incremental` | boolean | No | The build mode. `false`, the default, cleans up and rebuilds the processed categories. It is only accepted if every processed category is new to the corpus, so use it for a first build or when you only add new categories. `true` appends to the processed categories. On a File Manager category build, it also removes corpus documents that are no longer in the current File Manager listing. Use it to append to, and sync removals from, categories that already exist. |

Send at most one of the selectors `categories`, `modules`, and `file_ids`. A
request with more than one is rejected with `400`. A request with none uses the
files that the deprecated
[`POST /v1/import-multiple`](importing-files.md) staged at the project root.
That path is deprecated as well, and every imported basename then also has to
exist as a RAG input in the File Manager for the same database.

{{< info >}}
Category labels are the bare labels, such as `legal`, exactly as
[`GET /v1/projects/{project}/overview`](project-operations.md#get-the-project-overview)
reports them in `categories[].name`. You never have to construct the internal
`{project}_legal` form yourself. An already encoded value is still accepted as a
legacy alias.
{{< /info >}}

There is no `citable_url` request field. For File Manager builds, set
`custom_metadata.citable_url` on the RAG input when you upload it. AutoGraph
reads it while it fetches the file and stores it on the source document. The URL
has to be an `http` or `https` URL without whitespace or unbalanced
parentheses. If the key is missing, empty, or invalid, the build still
succeeds, `citable_url` is stored as an empty string, and the citation numbers
stay unlinked. The API does not report the rejection, so check the build logs if
links are missing.

### Response

```json
{
  "corpus_build_id": "cb_01ARZ3NDEKTSV4RRFFQ69G5FAV",
  "graph_name": "myproject_CorpusGraph"
}
```

| Field | Meaning |
|-------|---------|
| `corpus_build_id` | The ID of the build. Poll [`GET /v1/corpus/builds/{corpus_build_id}`](#monitor-a-corpus-build) with it. |
| `graph_name` | The named graph this build writes to. You do not have to poll for it. |

{{< info >}}
**This endpoint returns `202`, not `200`.** Accept any `2xx` as accepted. The
response body is the same.
{{< /info >}}

{{< warning >}}
**An already built category cannot be rebuilt from scratch.** A request with
`incremental: false` that lists a category which is already in the corpus is
rejected with `REBUILD_NOT_ALLOWED` before anything is deleted. This also
applies to a list that mixes new and existing categories.

With `categories`, the rejection is synchronous and comes back as `409`. With
the deprecated `file_ids` and import-multiple paths, the request can be
accepted with `202` first, and the build then fails with
`error_code: REBUILD_NOT_ALLOWED`.

Send only new categories with `incremental: false`, use `incremental: true` to
append, change individual documents with an
[incremental graph update](../incremental-graph-updates/_index.md), or remove the
category with
[`DELETE /v1/projects/{project}/categories/{category}`](project-operations.md#delete-a-category)
and build it again.
{{< /warning >}}

{{< warning >}}
**The model configuration is checked first.** If the chat or embedding
configuration that the service resolved at startup is invalid, or if a pod is
still reloading the persisted settings, this endpoint returns `400` right away
instead of queueing a build that would fail while embedding. The same check
applies to [`POST /v1/rag-strategizer/analyze`](rag-strategizer.md) and
[`POST /v1/orchestrate`](orchestration.md#build-the-knowledge-graph). Clear it with
[`PUT /v1/projects/{project}/model-config/credentials`](project-operations.md#update-the-model-configuration-credentials).
{{< /warning >}}

### Selector validation

The service looks the selector up in the File Manager while it handles the
request, and rejects the build with `400` if there is nothing to build:

- A `categories` label that holds no files, on a full build with
  `incremental: false`.
- `file_ids` that the File Manager cannot resolve, because they are unknown or
  malformed, or because they belong to another database.

The response names what was missing. No build is created in these cases, so
there is no `corpus_build_id` to poll. Check the status code before you read the
ID from the response body.

Two cases are not rejected on purpose:

- An incremental build with `incremental: true` still accepts a category whose
  files are all gone, because reconciling such removals is part of what an
  incremental build is for. See [Incremental builds](#incremental-builds).
- If the File Manager cannot be reached at all, the service cannot decide and
  accepts the build as before. An outage is reported on the build, never as a
  bad request.

A file that is deleted after the check still fails the build later. The check
makes the common mistake visible right away, but it does not remove the later
failure.

| Status Code | Meaning |
|-------------|---------|
| `202` | The build has been accepted and runs in the background. |
| `400` | More than one selector, an empty category label, a category scope deeper than the File Manager limit, a selector the File Manager has nothing for, or an invalid model configuration. |
| `401` | Authentication failed. |
| `409` | Another build is running, a document removal is running, a project deletion has started, or `REBUILD_NOT_ALLOWED` on a `categories` request with `incremental: false`. |
| `500` | Server error. |

### HTTP example

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "embedding_strategy": "first_chunk",
    "categories": ["legal", "finance"],
    "strategy": { "top_k": 10, "cluster_threshold": 2 }
  }' \
  https://<EXTERNAL_ENDPOINT>:8529/autograph/{service_id_postfix}/v1/corpus/builds
```

## Monitor a corpus build

{{< endpoint "GET" "https://<EXTERNAL_ENDPOINT>:8529/autograph/{service_id_postfix}/v1/corpus/builds/{corpus_build_id}" >}}

Returns the progress and the result of a corpus build. The call is
synchronous.

Start polling as soon as `POST /v1/corpus/builds` has returned the
`corpus_build_id`, and stop when `status` is `completed` or `failed`. Poll every
5 to 30 seconds for short builds, and every 30 to 60 seconds for very large
corpora to avoid load.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `corpus_build_id` | string | Yes | Path parameter. The ID that starting the build returned, such as `cb_...`. Use it exactly as returned. |

### Response

```json
{
  "corpus_build_id": "cb_01ARZ3NDEKTSV4RRFFQ69G5FAV",
  "status": "running",
  "message": "Creating similarity edges...",
  "progress": 55,
  "error": "",
  "error_code": null,
  "started_at": 1705344000.0,
  "completed_at": 0.0,
  "graph_name": "myproject_CorpusGraph",
  "document_count": 0,
  "cluster_count": 0,
  "documents_added": 0,
  "documents_removed": 0,
  "documents_unchanged": 0,
  "files_written": 0,
  "documents_created": 0,
  "documents_deduplicated": 0,
  "dedup_groups": []
}
```

| Field | Meaning |
|-------|---------|
| `corpus_build_id` | The ID of the build. |
| `status` | `pending`, then `running`, then `completed` or `failed`. Only run the RAG Strategizer once it is `completed`. |
| `message` | The current stage in plain text, such as similarity or clustering. |
| `progress` | A value from `0` to `100`. Show it together with `message`. |
| `error` | Set when the build has `failed`. Quote it in support tickets. |
| `error_code` | A failure code for programs, or `null`. Set when the build has `failed`, and also on a `completed` build in which some files failed. See [Build error codes](#build-error-codes). |
| `started_at` | The start time, in Unix epoch seconds as a floating-point number. |
| `completed_at` | The end time, or `0` while the build is running. |
| `graph_name` | The named graph of this build, available from `pending` onward. The same value as in the response that started the build. |
| `document_count` | The size of the whole `{project}_sources` collection once the build is `completed`, otherwise `0`. On a project with several categories, this includes the sources of every other category, so it is a project total, not what this build added. |
| `cluster_count` | The number of domain clusters once the build is `completed`, otherwise `0`. |
| `documents_added` | On a `completed` incremental File Manager build, the files that were in the File Manager but not yet in the corpus. Otherwise `0`. |
| `documents_removed` | On a `completed` incremental File Manager build, the corpus documents that were removed because they were no longer in the File Manager listing. Otherwise `0`. |
| `documents_unchanged` | On a `completed` incremental File Manager build, the corpus documents that are still in the File Manager. Otherwise `0`. |
| `files_written` | On a `completed` build, the input files that this build wrote successfully. It counts the File Manager entries the build was given, not your uploads, so a file that a re-upload under the same name replaced was never part of it. Set on every build, not only on incremental ones. |
| `documents_created` | On a `completed` build, the number of distinct documents that these files produced. It equals `files_written` minus `documents_deduplicated`. |
| `documents_deduplicated` | On a `completed` build, the input files that were absorbed into a document that another file already owned. A value above `0` means that the build produced fewer documents than it was given files, see [Document identity and deduplication](#document-identity-and-deduplication). |
| `dedup_groups` | One entry per collapsed document, naming every source file that mapped onto it. Empty when `documents_deduplicated` is `0`. |

Every `dedup_groups` entry has the following fields:

| Field | Meaning |
|-------|---------|
| `document_key` | The `_key` of the remaining document in `{project}_sources`. |
| `document_id` | The `_id` of the remaining document. |
| `module` | The category the document belongs to. |
| `filename` | The file name the document is keyed by. |
| `source_filenames` | Every input file that mapped onto this document, in input order. The document holds the content of the last one. |
| `source_file_ids` | The File Manager IDs of these files, in the same order. Use them to tell files with the same name apart. |
| `collapsed_onto_existing` | `true` if the collapse also overwrote a document from an earlier build, instead of only colliding within this build. |

{{< info >}}
**A `documents_deduplicated` of `0` does not prove that nothing was lost.**
If a re-upload under the same name replaced a file within one category, the
File Manager replaces it before the build even runs, so it cannot show up in
these counts.
{{< /info >}}

{{< warning >}}
**A `completed` build with an `error_code` only partly succeeded.** Read
`error_code` even when `status` is `completed`.
{{< /warning >}}

### Build error codes

| Code | Status | Meaning | What to do |
|------|--------|---------|------------|
| `UNKNOWN_ERROR` | `failed` | The service could not classify the failure. This is the fallback for any error it does not recognize. | Read `error` and `message` and quote them in a support ticket. |
| `FILE_PARSER_PARTIAL_FAILURE` | `completed` | Some files could not be parsed, or had no text to extract, but others did. | `message` names each failing file as `filename (ID: file_id): error`, the first five only, followed by `; ... and N more`. Upload those files again or fix them, then build that category again. |
| `FILE_PARSER_NO_SUCCESS` | `failed` | No file produced any usable text, so there was nothing to embed. | `message` names the first ten failing files in the same form. Check that the documents contain text that can be extracted and are not corrupt or password-protected, see [Document parsing](#document-parsing). |
| `FILE_PARSER_TIMEOUT` | `failed` | The File Parsing Service did not finish the batch within the deadline. The batch was not cancelled and may still complete on the parser side. | `message` names the batch and up to five of the submitted files. Retry the build. If it happens again, the corpus is probably too slow to parse, for example because it is mostly scanned material. |
| `STORAGE_FILE_TOO_LARGE` | `completed` | A file was larger than the entire local staging space, so it could never be downloaded and was skipped. The other files were still processed. Running out of staging space on a large build is normal and drops nothing. Files are downloaded in waves, and each wave is processed and deleted before the next one starts, so a build of several gigabytes fills and frees the space many times. | `message` names the skipped File Manager IDs, the first five, then `, ... (N more)`. Split or shrink those files, or ask your operator to raise `LOCAL_STORAGE_MAX_BYTES` above the size of the largest single file. |
| `REBUILD_NOT_ALLOWED` | `failed` | `incremental: false` for a category that is already built, on a path where the categories are only resolved after the request was accepted. | Use `incremental: true`, send only new categories, or delete the category and build it again. With `categories`, starting the build returns `409` instead. |
| `LLM_RATE_LIMITED` | `failed` | The embedding or chat provider throttled the service. | Retry later, or lower the embedding concurrency. |
| `LLM_QUOTA_EXCEEDED` | `failed` | The provider quota for the key is used up. | Top up the quota or rotate the key on the secret profile. |
| `LLM_AUTHENTICATION_FAILED` | `failed` | The provider rejected the API key. | Fix it with [`PUT .../model-config/credentials`](project-operations.md#update-the-model-configuration-credentials). |
| `LLM_API_KEY_MISSING` | `failed` | No chat or embedding key is configured on the service. | Fix it with [`PUT .../model-config/credentials`](project-operations.md#update-the-model-configuration-credentials). |
| `LLM_PERMISSION_DENIED` | `failed` | The API key is valid but has no access to the model. | Fix it with [`PUT .../model-config/credentials`](project-operations.md#update-the-model-configuration-credentials). |

Two different situations report `STORAGE_FILE_TOO_LARGE`:

- A file larger than the whole staging space is skipped on its own, and the wave
  goes on with the files after it.
- If a wave can download nothing at all and no staging space can be freed,
  every file still queued is abandoned and reported as
  `Local storage budget exhausted; could not download remaining files`.
  Those files are not too large and succeed on a retry once the staging space is
  free.

Check the text for each file before you split or shrink anything.

{{< info >}}
**This list is not complete.** Any failure the service cannot classify is
reported as `UNKNOWN_ERROR`. If you branch on `error_code`, add a default
branch that shows `message` as it is.

A build can have parse failures and run out of staging space in the same run.
`error_code` is then `FILE_PARSER_PARTIAL_FAILURE`, which takes precedence, and
`message` has both texts. If you only check for `STORAGE_FILE_TOO_LARGE`, you
never learn that files were skipped, so read `message`, not only `error_code`.
{{< /info >}}

| Status Code | Meaning |
|-------------|---------|
| `200` | The status has been returned. |
| `401` | Authentication failed. |
| `404` | Unknown or expired `corpus_build_id`. The status is held in memory, removed after 24 hours, and lost on a pod restart. |
| `500` | Server error. |

### HTTP example

```bash
curl -X GET \
  -H "Authorization: Bearer <token>" \
  https://<EXTERNAL_ENDPOINT>:8529/autograph/{service_id_postfix}/v1/corpus/builds/cb_01ARZ3NDEKTSV4RRFFQ69G5FAV
```

## Document parsing

For File Manager builds, with `categories`, `modules`, or `file_ids`, the
service extracts the text through the File Parsing Service instead of parsing
it in-process. It uses the preview scope, which is the first 4,800 characters
without images. Files uploaded through the deprecated
[`POST /v1/import-multiple`](importing-files.md) are still parsed in-process.

Plain text files (`.txt` and `.md`) are parsed directly. Every other file is
sent to the File Parser service, which converts a sample to Markdown before
AutoGraph embeds and clusters it. PDF files, including scanned documents read
with OCR, and the Office formats `.doc`, `.docx`, `.ppt`, and `.pptx` are
officially supported. See
[Supported file formats](_index.md#supported-file-formats) for details.

Parsing survives restarts. If the pod restarts in the middle of a build, it
picks up the batches it already submitted instead of submitting them again.

Plan for three outcomes:

- A file with no text to extract, such as a scanned image without text that OCR
  can read, is reported as a failed file. It is no longer embedded as an empty
  document.
- If some files are parsed and others fail, the build completes instead of
  failing, and [`GET /v1/corpus/builds/{id}`](#monitor-a-corpus-build) reports
  `error_code: FILE_PARSER_PARTIAL_FAILURE`.
- If no file is parsed, the build fails with
  `error_code: FILE_PARSER_NO_SUCCESS`.

In every case, `message` names each failing file as
`filename (ID: file_id): error`, so you can tell which document caused the
failure and not only which batch:

```
Build partially completed: 2 file(s) failed in File Parser. Failed files:
report.pdf (ID: rag-input-abc): FILE_TOO_LARGE: source exceeds size limit;
scan.pdf (ID: rag-input-def): no extractable content
```

A completed build with some failed files lists the first five, followed by
`; ... and N more`. A build that failed because nothing was parsed lists the
first ten, followed by `... and N more file(s)`. On a large set of failures,
`message` alone does not list every affected file.

Scanned and image-heavy documents are much slower to parse than digital text,
and the quality of the extraction depends on how legible the scan is. The File
Parsing Service ships on its own release schedule, so see its documentation for
the current behavior per format.

By default, the first 1200 tokens of each document, about 4,800 characters,
are used for the embedding. Your operator can tune the embedding budget with
`CHUNK_SIZE` and `CHARACTERS_PER_TOKENS`, but the 4,800-character extraction
limit of the File Parsing Service is fixed and does not change with it.

## Document identity and deduplication

A corpus document is identified by its category and its file name, and by
nothing else. The document key is a hash of exactly these two values, and the
writes use the `update` overwrite mode of ArangoDB. This has the following
consequences:

- Two input files with the same file name in the same category produce a single
  document. The one written last provides the content, and the other one is
  absorbed. This is what makes importing again safe instead of duplicating
  documents, and it is reported in `documents_deduplicated` and `dedup_groups`.
- The deduplication goes by name, never by content. No content is hashed, no
  embedding similarity is compared, and no similarity threshold is involved.
  Two documents with identical extracted text, such as a shared cover page,
  stay two documents as long as their file names differ.
- The category scopes the name. A `cover.pdf` in `legal` and a `cover.pdf` in
  `finance` are two separate documents.
- File names are made unique on the way in. If a build resolves several File
  Manager files with the same base name, they are renamed to `report.pdf`,
  `report_1.pdf`, and so on, before any of the above applies. The counter is
  shared by the entire build, so files in different categories are renamed as
  well.
- A re-upload under an existing name never reaches this rule. The File Manager
  keys a RAG input by database, project, category, and name, so uploading the
  same name into the same category replaces the earlier file with a new version
  instead of adding a second entry. Only the latest version of a file is built,
  and the earlier one is lost before AutoGraph sees anything.

### When a collapse actually happens

Because names are unique within a category and are made unique across
categories, few sequences lead to a collapse. The known one is a file name that
collides with the output of the renaming:

| Upload | Category | Stored as | Result |
|--------|----------|-----------|--------|
| `a.md` | `archive` | `a.md` | |
| `a.md` | `legal` | `a_1.md` | Renamed, because `a.md` already occurred in `archive` |
| `a_1.md` | `legal` | `a_1.md` | Collides with the row above, with the same category and the same name |

Three File Manager entries become two documents, with
`documents_deduplicated: 1`. The renaming does not reserve the name it
generates, so a file that is really called `a_1.md` is not renamed to avoid it.
Watch out for this if you use `_1` and `_2` suffixes in your file names and also
reuse those base names across categories.

### Which files a document came from

Every document records its own mapping, so you do not have to reconstruct the
key hash. The documents in the `{project}_sources` collection have the following
fields:

| Field | Meaning |
|-------|---------|
| `source_filenames` | Every input file that mapped onto this document, in input order. |
| `source_file_ids` | The File Manager IDs of the same files, in the same order. |

Both are on every document, with a single entry in the normal case where
nothing collapsed, so you never have to handle their absence. Documents that
were written before these fields existed have neither. Import them again to
add them.

If `documents_deduplicated` is not what you expected:

1. Read `dedup_groups`. It names the exact files and their File Manager IDs.
2. If the collapse was not intended, upload the absorbed file under a file name
   that is distinct and not of the form `name_1` or `name_2` for a base name
   that is used elsewhere in the build. Then add it with
   [`POST /v1/graph/insert`](../incremental-graph-updates/api-reference.md#add-documents).
   Uploading it under the same name in the same category does not help, because
   the File Manager replaces the earlier version instead of creating a second
   entry.
3. To replace the content of a document on purpose, use
   [`POST /v1/graph/update`](../incremental-graph-updates/api-reference.md#replace-documents)
   instead of importing again under the same name.

If 5% or more of a batch collapses, the completion `message` of the build says
so as well, so you can see a high deduplication ratio without reading the
counts.

## Incremental builds

An incremental build appends documents to categories that already exist,
without rebuilding the rest of the corpus. For how to structure categories, see
the [Design Guide](../design-guide.md#designing-categories).

Use an incremental build to:

- Add documents to a category that has already been built.
- Sync removals. On a File Manager category build, `incremental: true` also
  removes corpus documents that are no longer in the File Manager listing.
- Reduce the build time for large corpora.

Do not use one:

- For a first build, or when you add a category that is new to the corpus.
  Leave `incremental` at its default of `false`.
- To change individual documents in a graph that is already built. Use an
  [incremental graph update](../incremental-graph-updates/_index.md) instead.

{{< warning >}}
A corpus build never removes knowledge graph data, whether `incremental` is
`true` or `false`. Only
[`DELETE /v1/projects/{project}/categories/{category}`](project-operations.md#delete-a-category)
removes knowledge graph data.
{{< /warning >}}
