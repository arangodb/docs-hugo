---
title: Import Files
menuTitle: Import Files
description: >-
  Upload multiple files into the corpus graph with module organization
weight: 35
---

## Import multiple files

{{< endpoint "POST" "/v1/import-multiple" >}}

Import documents into the corpus for later processing.

Use this endpoint to upload files directly, instead of pointing to ones you have
already uploaded to the File Manager (`file_ids`). Send a separate request for
each module so the files in it share the same module label. Add all your files
first, then start a [corpus build](corpus-build.md). Do not import new files
while a build is in progress.

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
| `files[].citable_url` | string | No | Canonical URL shown in citations. This URL is preserved through the corpus build and passed to the GraphRAG Importer. Automatic citation extraction and SemanticUnits linking are not yet implemented; see [Known Limitations](error-handling.md#citation-handling). | Provide the source URL for web-sourced documents (for example, `https://docs.example.com/guide`). Omit the field for documents without a canonical web location. |
| `files[].metadata` | string | No | Opaque string carried in metadata (often JSON as text). | Use for stable IDs, versions, or tags your app parses later. Omit if unused. |
| `module` | string | No | Module label applied to **every** file in this request. See [Designing modules](../design-guide.md#designing-modules) for naming guidance. | Use a **stable** module label (`legal`, `docs_en`, …). If omitted, files receive the `default` module label during corpus build. |

{{< info >}}
If the same `doc_name` appears more than once in a single request, only the last
one is kept. This matches how the [File Manager](../../../platform-suite/file-manager/_index.md)
handles versions: a newer upload replaces an older one with the same name.
{{< /info >}}

## Response

On success:

```json
{
  "success": true,
  "message": "Successfully imported 2 files"
}
```

On failure (for example, an empty `files` array):

```json
{
  "success": false,
  "message": "Files list cannot be empty"
}
```

### Response fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | `true` when the import succeeded. |
| `message` | string | Confirmation text, including how many files were imported. |
| `error_message` | string | Present when `success` is false. |

### Status codes

| Status code | Meaning |
|-------------|---------|
| `200` | Files imported successfully. |
| `400` | Invalid request or empty `files` array. |
| `401` | Authentication failed. |
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
  http://localhost:8080/v1/import-multiple
```

## Next Steps

- **[Create Corpus Build](corpus-build.md)**: Analyze and cluster your imported documents
- **[Monitor Build Status](corpus-build.md#monitoring-build-status)**: Track corpus build progress
