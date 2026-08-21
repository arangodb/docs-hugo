---
title: AutoGraph Import Files Reference
menuTitle: Import Files
description: >-
  Upload multiple files into the corpus graph with module organization
weight: 35
---
## Import multiple files

{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/import-multiple" >}}

Import documents into the corpus for later processing.

Use this endpoint to upload files directly, instead of pointing to ones you have
already uploaded to the File Manager. Each call attaches every file in the
request to one module (the `module` field) and creates one new partition for
that module. A new call to this endpoint replaces any files staged by previous
direct-upload calls. Do not import new files while a build is in progress.

Choose one of the following upload workflows:

- **File Manager (preferred)**: Upload your files to the
  [File Manager](../../../platform-suite/file-manager/_index.md) under the scope
  `[project, category]`, then call
  [`POST /v1/corpus/builds`](corpus-build.md) with those category labels in
  `categories`. The service resolves and parses the files itself. To add another
  category later, run another build that lists only the new category.
- **Direct upload**: Send one `import-multiple` call containing every file for
  the module (set `module` on the request body), then run a
  [corpus build](corpus-build.md) without a selector. Every imported basename
  has to exist as a RAG input in the File Manager for the same database as well.

{{< info >}}
Documents uploaded through this endpoint are parsed in-process. File Manager
builds extract the text through the File Parsing Service instead, see
[Document parsing](corpus-build.md#document-parsing).
{{< /info >}}

{{< warning >}}
A new `import-multiple` call replaces the files staged by the previous
one. Always complete a corpus build before staging the next module's files.
{{< /warning >}}

See [Designing modules](../design-guide.md#designing-modules) for guidance
on how to work with modules.

## Request

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

| Parameter | Type | Required | Description | Recommended value |
|-------------|------|----------|-------------|-------------------|
| `files` | array | Yes | Non-empty list of file objects for this request. | Batch sizes that fit your timeout and payload limits (e.g. tens of small docs or fewer large ones per call). |
| `files[].doc_name` | string | Yes | Filename as stored for the corpus build. Basename only; requests containing path segments or `..` are rejected with `400`. | Use real extensions (`.md`, `.pdf`, `.docx`, …) so format detection works. Example: `guide.md`. |
| `files[].content` | string (base64) | Yes | Raw file bytes, **base64-encoded** in JSON. | Encode the entire file in a single field; the endpoint does not support chunked or resumable uploads. |
| `files[].citable_url` | string | No | Canonical URL shown in citations, for **this direct-upload path only**. On the File Manager path, set `custom_metadata.citable_url` on the RAG input at upload time instead. The URL is preserved through the corpus build and passed to the GraphRAG Importer. Automatic citation extraction and SemanticUnits linking are not yet implemented; see [Known Limitations](error-handling.md#citation-handling). | Provide the source URL for web-sourced documents (for example, `https://docs.example.com/guide`). Omit the field for documents without a canonical web location. |
| `files[].metadata` | string | No | Opaque string carried in metadata (often JSON as text). | Use for stable IDs, versions, or tags your app parses later. Omit if unused. |
| `module` | string | No | Module label applied to **every** file in this request. See [Designing modules](../design-guide.md#designing-modules) for naming guidance. | Use a **stable** module label (`legal`, `docs_en`, …). If omitted, files receive the `default` module label during corpus build. |

{{< info >}}
Duplicate `doc_name` values within a single request are deduplicated before
upload: only the last entry is kept, and the discarded entries do not produce
versions of their own.

Versioning happens across requests. Each accepted upload of a `doc_name` that
already exists creates a new version of that file in the
[File Manager](../../../platform-suite/file-manager/_index.md), within the same
[scope](../../../platform-suite/file-manager/_index.md#organizing-files-with-scopes).
To build up a version history for a document, upload it in separate requests —
sending several revisions of the same `doc_name` in one request yields a single
version, not one per entry.

The `module` label of a request maps onto the *category*, which is the second
scope level. The first scope level is the project. The same `doc_name` under two
different modules therefore refers to two separate files with independent
version histories.
{{< /info >}}

## Response

On success:

```json
{
  "success": true,
  "message": "Successfully imported 2 files"
}
```

### Response fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | `true` when the import succeeded. |
| `message` | string | Confirmation text, including how many files were imported. |
| `error_message` | string | Reserved for `success: false` responses from the underlying RPC. Validation failures (such as an empty `files` array) are not returned in this envelope; they surface as HTTP `400` with a gateway error body. |

### Status codes

| Status code | Meaning |
|-------------|---------|
| `200` | Files imported successfully. |
| `400` | Validation failure (empty `files`, invalid `doc_name`, etc.). Returned as a JSON error body from the gateway, not the `success`/`message` shape. |
| `401` | Authentication failed. |
| `409` | A corpus build is already in progress. |
| `500` | Server error. |

## HTTP Example

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
  https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/import-multiple
```

## Next Steps

- **[Create Corpus Build](corpus-build.md)**: Analyze and cluster your imported documents
- **[Monitor Build Status](corpus-build.md#monitoring-build-status)**: Track corpus build progress
