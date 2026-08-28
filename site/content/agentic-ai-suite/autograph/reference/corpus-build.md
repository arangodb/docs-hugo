---
title: AutoGraph Corpus Build Reference
menuTitle: Corpus Build
description: >-
  Create and monitor corpus builds for document analysis and clustering
weight: 40
---
## Create Corpus Build

{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/corpus/builds" >}}

Trigger a corpus build from File Manager categories or from files that you have
imported directly.

**Recommended path:** Prefer `categories`, so that the service resolves the files
of each category from the File Manager itself. Send only new categories on a
first build and leave `incremental` at its default of `false`. To append
documents to a category that has already been built, set `incremental: true`.
Only one build can run at a time (`409`).

### Selecting what to build

Provide **at most one** of the following selectors. A request that carries more
than one is rejected with `400`.

| Selector | Status | What it does |
|----------|--------|--------------|
| `categories` | **Preferred** | Category labels below the current project. The service lists the files of each category from the File Manager. |
| `modules` | Deprecated alias | Identical to `categories`, and only used when `categories` is empty. |
| `file_ids` | Deprecated | Explicit File Manager IDs of RAG inputs. |
| *(none)* | **Deprecated** | Uses the files staged by [`POST /v1/import-multiple`](importing-files.md) at the project root. |

{{< info >}}
Category labels are the **bare** labels, such as `legal`, exactly as
[`GET /v1/projects/{project}/overview`](project-operations.md#project-overview)
reports them in `categories[].name`. You never have to construct the internal
`{project}_legal` form yourself. An already encoded value is still accepted as a
legacy alias.
{{< /info >}}

When you use the legacy path without a selector, every imported basename has to
exist as a RAG input in the File Manager for the same database as well.

### Request (preferred - by category)

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

### Request (deprecated - by file IDs)

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

| Parameter | Type | Required | Description | Recommended value |
|-----------|------|----------|-------------|-------------------|
| `embedding_strategy` | string | No | Selects how text is chosen for embedding. | Omit to get **`"first_chunk"`**, which is the only supported value. |
| `categories` | string[] | No | **Preferred.** Bare category labels below the current project. The files are resolved server-side through the File Manager. | For example **`["legal", "finance"]`**. Mutually exclusive with `modules` and `file_ids`. |
| `modules` | string[] | No | **Deprecated** alias for `categories`, honored only when `categories` is empty. | Use `categories`. |
| `file_ids` | string[] | No | **Deprecated.** Explicit File Manager IDs of RAG inputs. | Use `categories`. |
| `strategy` | object | No | Tunables for similarity and clustering. | Omit to use service defaults (see below). |
| `strategy.top_k` | integer | No | How many similar neighbors each document gets (edge count driver). | **7** (default): good general default. **5–10**: typical range; higher = denser graph, more work and API cost. |
| `strategy.cluster_threshold` | integer | No | Controls clustering depth. **`1`**: flat grouping. **`2`**: hierarchical (default, produces richer structure). | **2** for most corpora; **1** for simpler/faster clustering or very small document sets. |
| `strategy.custom_params` | map | No | Extra string key/values interpreted by the service (e.g. graph naming). | Omit unless your operator documents a key (e.g. `graph_name`). |
| `incremental` | boolean | No | Build mode. **`false`** (default) cleans up and rebuilds the processed categories, and is only accepted if every processed category is new to the corpus. **`true`** appends to the processed categories, and on a File Manager category build it also removes corpus documents that are no longer in the current File Manager listing. | **`false`** for a first build or when you add only new categories. **`true`** to append to, and sync deletions of, categories that already exist. |

{{< warning >}}
**An already built category cannot be rebuilt from scratch.** A request with
`incremental: false` that lists a category which is already in the corpus is
rejected with `REBUILD_NOT_ALLOWED`, before anything is deleted. This also
applies to a list that mixes new and existing categories.

On the `categories` path the rejection is synchronous and comes back as `409`.
On the deprecated `file_ids` and import-multiple paths, the request can be
accepted with `202` first and the build then fails with
`error_code: REBUILD_NOT_ALLOWED`.

Send only new categories with `incremental: false`, use `incremental: true` to
append, change individual documents with an
[incremental graph update](../incremental-graph-updates.md), or remove the
category with
[`DELETE /v1/projects/{project}/categories/{category}`](project-operations.md#delete-category)
and build it again.
{{< /warning >}}

### Citation URLs

There is no `citable_url` field on this request. For File Manager builds, set
`custom_metadata.citable_url` on the RAG input when you upload it. AutoGraph
reads it while fetching the file and stores it on the source document.

The URL has to be an `http` or `https` URL without whitespace or unbalanced
parentheses. If the key is missing, empty, or invalid, the build still succeeds,
`citable_url` is stored as an empty string, and the citation numbers stay
unlinked. The API does not report the rejection, so check the build logs if
links are missing.

### Response

```json
{
  "corpus_build_id": "cb_01ARZ3NDEKTSV4RRFFQ69G5FAV",
  "graph_name": "myproject_CorpusGraph"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `corpus_build_id` | string | Poll [`GET /v1/corpus/builds/{corpus_build_id}`](#monitoring-build-status) with this ID. |
| `graph_name` | string | The named graph this build writes to. You do not have to poll for it. |

| Status Code | Meaning |
|-------------|---------|
| `202` | Build accepted and started in the background |
| `400` | Invalid request: more than one selector, an empty category label, a category scope deeper than the File Manager limit, a selector the File Manager has nothing for, or a latched model configuration (see below) |
| `401` | Authentication failed |
| `409` | Another build is in progress, a document delete is running, a project deletion has started, or `REBUILD_NOT_ALLOWED` on a `categories` request with `incremental: false` |
| `500` | Server error |

{{< info >}}
**This endpoint returns `202`, not `200`.** Accept any `2xx` as "accepted". The
response body is unchanged.
{{< /info >}}

{{< warning >}}
**Model configuration gate.** If the chat or embedding configuration that the
service resolved at startup is invalid, or if a pod is still reloading the
persisted settings, this endpoint returns `400` right away instead of queueing a
build that would fail while embedding. The same gate applies to
[`POST /v1/rag-strategizer/analyze`](rag-strategizer.md) and
[`POST /v1/orchestrate`](orchestration.md#trigger-orchestration). Clear it with
[`PUT /v1/projects/{project}/model-config/credentials`](project-operations.md#update-model-config-credentials).
{{< /warning >}}

### Selector validation

The service looks the selector up in the File Manager while it handles the
request, and rejects the build with `400` if there is nothing to build:

- A `categories` label that holds no files, on a full build with
  `incremental: false`.
- `file_ids` that the File Manager cannot resolve, because they are unknown or
  malformed, or because they belong to another database.

The response names what was missing. **No build is created in these cases**, so
there is no `corpus_build_id` to poll. Check the status code before you read the
ID out of the response body.

Two cases are deliberately not rejected:

- An **incremental build** (`incremental: true`) still accepts a category whose
  files are all gone, because reconciling such removals is part of what an
  incremental run is for. See [Incremental Builds](#incremental-builds).
- If the **File Manager cannot be reached at all**, the service reaches no
  verdict and accepts the build as before. An outage is reported on the build,
  never as a bad request.

A file that is deleted after the check still fails the build the way it always
did. The check makes the common mistake visible right away, it does not remove
the deferred failure path.

### Document parsing

For File Manager builds (`categories`, `modules`, or `file_ids`), the service
extracts the text through the **File Parsing Service** instead of parsing
in-process: preview scope, the **first 4,800 characters**, images excluded.
Files uploaded through the deprecated
[`POST /v1/import-multiple`](importing-files.md) are still parsed in-process.

Parsing is durable. If the pod restarts in the middle of a build, it picks up
the batches it already submitted instead of submitting them again.

Three outcomes are worth planning for:

- A file that yields **no extractable text**, such as a scanned image without
  OCR-readable content, is reported as a **failed file**. It is no longer
  embedded as an empty document.
- If some files parse and others fail, the build **completes** instead of
  failing, and [`GET /v1/corpus/builds/{id}`](#monitoring-build-status) reports
  `error_code: FILE_PARSER_PARTIAL_FAILURE`.
- If **no** file parses, the build **fails** with
  `error_code: FILE_PARSER_NO_SUCCESS`.

In every case the failing files are named individually in `message`, as
`filename (ID: file_id): error`, so you can tell which document caused the
failure rather than only which batch did:

```
Build partially completed: 2 file(s) failed in File Parser. Failed files:
report.pdf (ID: rag-input-abc): FILE_TOO_LARGE: source exceeds size limit;
scan.pdf (ID: rag-input-def): no extractable content
```

A completed build with partial failures lists the **first five** entries and
then `; ... and N more`. A build that failed because nothing parsed lists the
**first ten** and then `... and N more file(s)`. On a large failure set,
`message` alone therefore does not enumerate every affected file.

Scanned and image-heavy documents are much slower to parse than digital text,
and the quality of the extraction depends on how legible the scan is. The
mechanics belong to the File Parsing Service, which ships on its own release
cadence, so consult its documentation for the current per-format behavior.

**Chunk limit:** by default the first **1200 tokens (~4800 characters)** per
document drive the embedding. Your operator can tune the embedding budget with
`CHUNK_SIZE` and `CHARACTERS_PER_TOKENS`, but the 4,800-character extraction cap
of the File Parsing Service is fixed and does not move with it.

### HTTP Example

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "embedding_strategy": "first_chunk",
    "categories": ["legal", "finance"],
    "strategy": { "top_k": 10, "cluster_threshold": 2 }
  }' \
  https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/corpus/builds
```

---

## Monitoring Build Status

{{< endpoint "GET" "https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/corpus/builds/{corpus_build_id}" >}}

Check the progress of a corpus build.

**Recommended path:** Immediately after **`POST /v1/corpus/builds`** returns `corpus_build_id`, poll this endpoint until **`status`** is **`completed`** or **`failed`**. Typical interval: **5–30 seconds** for short builds; **30–60 seconds** for very large corpora to avoid load.

### Parameters

| Parameter | Location | Required | Description | Recommended value |
|-----------|----------|----------|-------------|-------------------|
| `corpus_build_id` | URL path | Yes | The id returned by create build. | Use the value verbatim (e.g. `cb_…`). |

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

| Field | Type | Description |
|-------|------|-------------|
| `corpus_build_id` | string | Build identifier |
| `status` | string | **`pending`** → **`running`** → **`completed`** or **`failed`**. Only proceed to the Strategizer on **`completed`**. |
| `message` | string | Human-readable stage (e.g. similarity or clustering). |
| `progress` | integer | **0–100**; use together with `message` for UI. |
| `error` | string | Non-empty when **`failed`**. Use for support tickets. |
| `error_code` | string \| null | Machine-readable failure code. Set when **`failed`**, and also on a **`completed`** build that had partial file failures. See below. |
| `started_at` | double | Unix epoch seconds (float). |
| `completed_at` | double | Set when finished; **0** while running. |
| `graph_name` | string | The named graph of this build, available from **`pending`** onward. Same value as the create response. |
| `document_count` | integer | Size of the **whole** `{project}_sources` collection once the build is **`completed`**, otherwise **0**. On a project with several categories this includes every other category's sources, so it is a project total, not the contribution of this build. |
| `cluster_count` | integer | Number of domain clusters, set on **`completed`**, otherwise **0**. |
| `documents_added` | integer | On a **`completed`** incremental File Manager build: files that were in the File Manager but not yet in the corpus. **0** otherwise. |
| `documents_removed` | integer | On a **`completed`** incremental File Manager build: corpus documents removed because they were no longer in the File Manager listing. **0** otherwise. |
| `documents_unchanged` | integer | On a **`completed`** incremental File Manager build: corpus documents that are still in the File Manager. **0** otherwise. |
| `files_written` | integer | On a **`completed`** build: the input files that this build wrote successfully. It counts the File Manager entries the build was given, not your uploads, so a file that a re-upload under the same name superseded was never part of it. Set on every build, not only on incremental ones. |
| `documents_created` | integer | On a **`completed`** build: the number of **distinct documents** that these files produced. It equals `files_written` minus `documents_deduplicated`. |
| `documents_deduplicated` | integer | On a **`completed`** build: input files that were absorbed into a document another file already owned. A value above **0** means that the build produced fewer documents than it was given files, see [Document identity and deduplication](#document-identity-and-deduplication). |
| `dedup_groups` | object[] | One entry per collapsed document, naming every source file that mapped onto it. Empty when `documents_deduplicated` is **0**. |

Every `dedup_groups` entry has the following fields:

| Field | Type | Description |
|-------|------|-------------|
| `document_key` | string | The `_key` of the surviving document in `{project}_sources`. |
| `document_id` | string | The `_id` of the surviving document. |
| `module` | string | The category the document belongs to. |
| `filename` | string | The filename the document is keyed by. |
| `source_filenames` | string[] | Every input file that mapped onto this document, in input order. **The content of the last one is what the document holds.** |
| `source_file_ids` | string[] | The File Manager IDs of these files, in the same order. Use them to tell files with the same name apart. |
| `collapsed_onto_existing` | boolean | `true` if the collapse also overwrote a document from an earlier build, instead of only colliding within this build. |

{{< info >}}
**A `documents_deduplicated` of `0` does not prove that nothing was lost.**
A file that a re-upload under the same name superseded within one category is
replaced by the File Manager before the build even runs, so it cannot show up
in these counters.
{{< /info >}}

{{< warning >}}
**A `completed` build with a non-empty `error_code` is a partial success.** Read
`error_code` even when `status` is `completed`.
{{< /warning >}}

### Build error codes

| Code | Status | Meaning | What to do |
|------|--------|---------|------------|
| `UNKNOWN_ERROR` | `failed` | The service could not classify the failure. This is the fallback for any unrecognized error. | Read `error` and `message` and quote them in a support ticket. |
| `FILE_PARSER_PARTIAL_FAILURE` | `completed` | Some files could not be parsed, or yielded no extractable text, but others did. | `message` names each failing file as `filename (ID: file_id): error`, the first five only, followed by `; ... and N more`. Re-upload or fix those files, then build that category again. |
| `FILE_PARSER_NO_SUCCESS` | `failed` | **No** file produced any usable text, so there was nothing to embed. | `message` names the first ten failing files in the same form. Check that the documents contain extractable text and are not corrupt or password-protected, see [Document parsing](#document-parsing). |
| `FILE_PARSER_TIMEOUT` | `failed` | The File Parsing Service did not finish the batch within the deadline. The batch was not cancelled and may still complete on the parser side. | `message` names the batch and up to five of the submitted files. Retry the build; if it recurs, the corpus is probably too slow to parse, for example because it is mostly scanned material. |
| `STORAGE_FILE_TOO_LARGE` | `completed` | One or more files were skipped because the local staging budget was exhausted. The remaining files were still processed. | `message` names the skipped File Manager IDs, the first five, then `, ... (N more)`. Split or shrink the files, or ask your operator to raise `LOCAL_STORAGE_MAX_BYTES`. |
| `REBUILD_NOT_ALLOWED` | `failed` | `incremental: false` over a category that is already built, on a path where the categories are only resolved after the request was accepted. | Use `incremental: true`, send only new categories, or delete the category and build it again. On the `categories` path this is a `409` on the create request instead. |
| `LLM_RATE_LIMITED` | `failed` | The embedding or chat provider throttled the service. | Retry later, or lower the embedding concurrency. |
| `LLM_QUOTA_EXCEEDED` | `failed` | The provider quota for the key is used up. | Top up or rotate the key on the secret profile. |
| `LLM_AUTHENTICATION_FAILED` | `failed` | The provider rejected the API key. | Fix it with [`PUT …/model-config/credentials`](project-operations.md#update-model-config-credentials). |
| `LLM_API_KEY_MISSING` | `failed` | No chat or embedding key is configured on the service. | Fix it with [`PUT …/model-config/credentials`](project-operations.md#update-model-config-credentials). |
| `LLM_PERMISSION_DENIED` | `failed` | The API key is valid but has no access to the model. | Fix it with [`PUT …/model-config/credentials`](project-operations.md#update-model-config-credentials). |

{{< info >}}
**This list is not closed.** Any failure the service cannot classify is reported
as `UNKNOWN_ERROR`, so a client that switches on `error_code` needs a
fall-through branch that surfaces `message` verbatim.

**The two partial-success codes are not alternatives.** A build can hit parse
failures *and* the staging budget in the same run. `error_code` is then
`FILE_PARSER_PARTIAL_FAILURE`, which takes precedence, and `message` carries
both texts. Read `message`, not only `error_code`.
{{< /info >}}

| Status Code | Meaning |
|-------------|---------|
| `200` | Status returned |
| `401` | Authentication failed |
| `404` | Unknown or expired `corpus_build_id`. The status is held in memory, evicted after 24 hours, and lost on a pod restart. |
| `500` | Server error |

### HTTP Example

```bash
curl -H "Authorization: Bearer <token>" \
  https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/corpus/builds/cb_01ARZ3NDEKTSV4RRFFQ69G5FAV
```

---

## Document identity and deduplication

A corpus document is identified by its **category and its filename**, and by
nothing else. The document key is a hash of exactly these two values, and the
writes use the `update` overwrite mode of ArangoDB. That has the following
consequences:

- **Two input files with the same filename in the same category produce a single
  document.** The one written last provides the content, the other one is
  absorbed. This is what makes a re-import idempotent instead of duplicating
  rows, and it is reported in `documents_deduplicated` and `dedup_groups`.
- **The deduplication is by name, never by content.** No content is hashed, no
  embedding similarity is compared, and no similarity threshold is involved.
  Two documents whose extracted text is identical, a shared boilerplate cover
  page for example, stay two documents as long as their filenames differ.
- **The category scopes the name.** A `cover.pdf` in `legal` and a `cover.pdf`
  in `finance` are two separate documents.
- **Filenames are disambiguated on the way in.** If a build resolves several
  File Manager files that share a basename, they are renamed to `report.pdf`,
  `report_1.pdf`, and so on, before any of the above applies. The counter is
  shared by the entire build, so the renaming also occurs between files in
  different categories.
- **A re-upload under an existing name never reaches this rule.** The File
  Manager keys a RAG input by database, project, category, and name, so
  uploading the same name into the same category supersedes the earlier file
  with a new version instead of adding a second entry. Only the latest version
  of a file is built, and this loss occurs before AutoGraph sees anything.

### When a collapse actually happens

Because names are unique within a category and are disambiguated across
categories, few sequences reach a collapse. The known one is a filename that
collides with the output of the disambiguation:

| Upload | Category | Stored as | Result |
|--------|----------|-----------|--------|
| `a.md` | `archive` | `a.md` | — |
| `a.md` | `legal` | `a_1.md` | Renamed, because `a.md` already occurred in `archive` |
| `a_1.md` | `legal` | `a_1.md` | **Collides** with the row above: the same category and the same name |

Three File Manager entries become two documents, with
`documents_deduplicated: 1`. The renaming does not reserve the name it
generates, so a file that is genuinely called `a_1.md` is not disambiguated
against it. Watch out for this if you use systematic `_1` and `_2` suffixes in
your filenames **and** reuse those basenames across categories.

### Which files a document came from

Every document records its own mapping, so you do not have to reconstruct the
key hash. The documents in the `{project}_sources` collection have the following
fields:

| Field | Description |
|-------|-------------|
| `source_filenames` | Every input file that mapped onto this document, in input order. |
| `source_file_ids` | The File Manager IDs of the same files, in the same order. |

Both are on every document, with a single entry in the ordinary case where
nothing collapsed, so you never have to handle their absence. Documents that
were written before these fields existed have neither. Import them again to
populate them.

If `documents_deduplicated` is not what you expected:

1. Read `dedup_groups`. It names the exact files and their File Manager IDs.
2. If the collapse was unintended, upload the absorbed file under a filename
   that is distinct **and** not of the form `name_1` or `name_2` for a basename
   that is used elsewhere in the build, then add it with
   [`POST /v1/graph/insert`](orchestration.md#insert-documents). Uploading it
   under the same name in the same category does not help, because the File
   Manager supersedes the earlier version instead of creating a second entry.
3. To replace the content of a document deliberately, use
   [`POST /v1/graph/update`](orchestration.md#update-documents) instead of
   relying on a re-import under the same name.

If 5% or more of a batch collapses, the completion `message` of the build says
so as well, so a high deduplication ratio is visible without reading the counts.

---

## Incremental Builds

An incremental build appends documents to categories that already exist, without
rebuilding the rest of the corpus. For guidance on structuring categories, see
the [Design Guide](../design-guide.md#designing-categories).

**When to use an incremental build:**

- Adding documents to a category that has already been built.
- Syncing deletions: on a File Manager category build, `incremental: true` also
  removes corpus documents that are no longer in the File Manager listing.
- Reducing the build time for large corpora.

**When not to use one:**

- For a first build, or when you add a category that is new to the corpus, leave
  `incremental` at its default of `false`.
- To change individual documents in a graph that is already built, use an
  [incremental graph update](../incremental-graph-updates.md) instead.

{{< warning >}}
A corpus build never removes Layer 3 records, whether `incremental` is `true` or
`false`. Removing knowledge graph data is exclusive to
[`DELETE /v1/projects/{project}/categories/{category}`](project-operations.md#delete-category).
{{< /warning >}}

## Next Steps

- **[Run RAG Strategizer](rag-strategizer.md)**: Analyze clusters and get RAG strategy recommendations
- **[Orchestrate Pipeline](orchestration.md)**: Automatically build knowledge graphs
- **[Project Operations](project-operations.md)**: Inspect the project state and remove categories
