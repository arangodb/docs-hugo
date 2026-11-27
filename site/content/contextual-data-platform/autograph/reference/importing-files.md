---
title: AutoGraph Import Files Reference (Deprecated)
menuTitle: Import Files (deprecated)
description: >-
  The deprecated direct upload of files into the corpus graph, replaced by the
  File Manager
weight: 20
---
{{< tag "Agentic AI Suite" >}}

{{< warning >}}
**Do not build new integrations on this endpoint.** `POST /v1/import-multiple`
is deprecated. It is documented here for integrations that already use it.
Upload through the [File Manager](#upload-through-the-file-manager) instead.
{{< /warning >}}

`POST /v1/import-multiple` uploads files directly to the AutoGraph service and
labels them with a category, so that a [corpus build](corpus-build.md) without
a selector can build them. Uploading to the File Manager and building by
category replaces it.

The endpoint is relative to the path of the project's AutoGraph service,
`https://<EXTERNAL_ENDPOINT>:8529/autograph/{service_id_postfix}`.
`service_id_postfix` is the end of the service ID, such as `vyk1t` for
`arangodb-autograph-vyk1t`. The `serviceUrl` in the project metadata of
[`GET /_platform/acp/v1/project_by_name/{database}/{project}`](../../control-plane-acp/api.md#get-project-details)
ends with it, for example `.../autograph/vyk1t/`.

| Endpoint | Operation | Purpose | Call |
|----------|-----------|---------|------|
| [`POST /v1/import-multiple`](#import-multiple-files) | Import | Deprecated. Upload files directly and label them with one category | Synchronous |

## Why the endpoint is deprecated

The endpoint is still served and still accepts files, but it can no longer
handle an upload on its own:

- A new `import-multiple` call deletes the files that the previous call staged,
  together with the category that the `module` label of the previous call
  created. Earlier versions of the service kept both and only replaced the
  staged files. A version history that you staged through the endpoint is lost
  with them.
- Every imported base name also has to exist as a RAG input in the File Manager
  for the same database, so you have to upload every document twice.
- [Incremental graph updates](../incremental-graph-updates/_index.md) identify a
  document by its File Manager `file_id` and cannot reach a document that
  only exists as a direct upload.

## Upload through the File Manager

Upload your files to the
[File Manager](../../file-manager/api.md#upload-a-rag-input-file)
under the scope `[project, category]`, then call
[`POST /v1/corpus/builds`](corpus-build.md) with those category labels in
`categories`. The service resolves and parses the files itself. To add another
category later, run another build that lists only the new category. For how to
work with categories, see
[Designing categories](../design-guide.md#designing-categories).

{{< info >}}
Documents uploaded through the deprecated endpoint are parsed in-process. File
Manager builds extract the text through the File Parsing Service instead, see
[Document parsing](corpus-build.md#document-parsing).
{{< /info >}}

## Import multiple files

{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/autograph/{service_id_postfix}/v1/import-multiple" >}}

Uploads files and attaches every file of the request to one category, which
you set in `module`. The call is synchronous. Each call creates one new
partition for that category and deletes what the previous call staged. To
build from the staged files, run a [corpus build](corpus-build.md) without a
selector. Do not import new files while a build is running.

### Request

```json
{
  "files": [
    {
      "doc_name": "architecture.md",
      "content": "<base64_encoded_bytes>",
      "citable_url": "https://docs.example.com/architecture",
      "metadata": "{\"version\": \"1.0\"}"
    },
    {
      "doc_name": "overview.md",
      "content": "<base64_encoded_bytes>",
      "citable_url": "https://docs.example.com/overview",
      "metadata": "{\"version\": \"1.0\"}"
    }
  ],
  "module": "engineering"
}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `files` | object[] | Yes | The files of this request. The list cannot be empty. Choose a batch size that fits your timeout and payload limits, such as tens of small documents or fewer large ones per call. |
| `files[].doc_name` | string | Yes | The file name to store for the corpus build, such as `guide.md`. Base name only. A name with path segments or `..` is rejected with `400`. Use real extensions, such as `.md`, `.pdf`, or `.docx`, so that the format is detected. |
| `files[].content` | string | Yes | The raw bytes of the file, Base64-encoded. Encode the entire file in this one field. The endpoint does not support uploads in parts or resuming an upload. |
| `files[].citable_url` | string | No | The URL shown in citations, only for this direct upload. When you upload through the File Manager, set `custom_metadata.citable_url` on the RAG input instead. The URL is kept through the corpus build and passed to the Importer. Set it for documents that come from the web, such as `https://docs.example.com/guide`, and omit it for documents without a web address. Automatic citation extraction and linking to semantic units are not implemented yet, see [Known limitations](error-handling.md#citation-handling). |
| `files[].metadata` | string | No | A string that is stored in the metadata as it is, often JSON as text. Use it for stable IDs, versions, or tags that your application reads later. Omit it if you do not need it. |
| `module` | string | No | The category label for every file of this request. Use a stable label, such as `legal` or `docs_en`. If you omit it, the files get the `default` category during the corpus build. See [Designing categories](../design-guide.md#designing-categories) for naming. |

{{< info >}}
If a request contains the same `doc_name` more than once, only the last entry
is uploaded. The other entries do not create versions of their own.

Versions are created across requests. Each accepted upload of a `doc_name` that
already exists creates a new version of that file in the
[File Manager](../../file-manager/api.md#file-identity-and-versioning),
within the same [scope](../../file-manager/api.md#scopes). To build up a version
history for a document, upload it in separate requests. Several revisions of the
same `doc_name` in one request create a single version, not one per entry.

The `module` label of a request is the category, which is the second scope
level. The first scope level is the project. The same `doc_name` in two
different categories therefore refers to two separate files with separate
version histories.

A version history built this way does not survive the next call, because that
call deletes the files of the previous one and their category. Upload through
the File Manager if you rely on versions.
{{< /info >}}

### Response

```json
{
  "success": true,
  "message": "Successfully imported 2 files"
}
```

| Field | Meaning |
|-------|---------|
| `success` | `true` if the import succeeded. |
| `message` | A confirmation, including how many files have been imported. |
| `error_message` | Only for `success: false` responses from the service behind the endpoint. Validation failures, such as an empty `files` list, are not returned this way. They come back as `400` with a standard JSON error body. |

| Status Code | Meaning |
|-------------|---------|
| `200` | The files have been imported. |
| `400` | A validation failure, such as an empty `files` list, an invalid `doc_name`, or a single file larger than the whole local staging space. Returned as a standard JSON error body, not with `success` and `message`. |
| `401` | Authentication failed. |
| `409` | A corpus build is running. |
| `500` | Server error. |

### HTTP example

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "files": [
      {
        "doc_name": "architecture.md",
        "content": "VGV4dCBjb250ZW50",
        "citable_url": "https://docs.example.com/architecture"
      },
      {
        "doc_name": "overview.md",
        "content": "VGV4dCBjb250ZW50",
        "citable_url": "https://docs.example.com/overview"
      }
    ],
    "module": "engineering"
  }' \
  https://<EXTERNAL_ENDPOINT>:8529/autograph/{service_id_postfix}/v1/import-multiple
```
