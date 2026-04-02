---
title: Import Files
menuTitle: Import Files
description: >-
  Upload multiple files into the corpus graph with module organization
weight: 35
aliases:
  - ../../../reference/autograph/importing-files/
---

## Import multiple files

{{< endpoint "POST" "/v1/import-multiple" >}}

Import documents into the corpus for later processing.

**Recommended path:** Call after health check and before `POST /v1/corpus/builds` when you are uploading files directly (not using File Manager `file_ids`). Call once per module to load each module's documents. Avoid importing while a corpus build is already running.

## Request

```json
{
  "files": [
    {
      "doc_name": "architecture.md",
      "content": "<base64_encoded_bytes>",
      "citable_url": "https://docs.example.com/architecture",
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
| `files[].doc_name` | string | Yes | Filename as stored for the corpus build (basename only; path segments and `..` are rejected). | Use real extensions (`.md`, `.pdf`, `.docx`, …) so format detection works. Example: `guide.md`. |
| `files[].content` | string (base64) | Yes | Raw file bytes, **base64-encoded** in JSON. | Encode the full file; avoid partial uploads. |
| `files[].citable_url` | string | No | Canonical URL shown in citations. | Set for web-sourced docs; empty string if not applicable. |
| `files[].metadata` | string | No | Opaque string carried in metadata (often JSON as text). | Use for stable ids, versions, or tags your app parses later; omit if unused. |
| `module` | string | No | Module label applied to **every** file in this request. | Use a **stable** module id (`legal`, `docs_en`, …). If omitted, files receive the `default` module label during corpus build. |

## Response

```json
{
  "success": true,
  "message": "Successfully imported 2 files"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether import succeeded |
| `message` | string | On success, includes how many files were imported. |
| `error_message` | string | Present when `success` is false |

| Status Code | Meaning |
|-------------|---------|
| `200` | Files imported successfully |
| `400` | Invalid request or empty files array |
| `401` | Authentication failed |
| `500` | Server error |

## HTTP Example

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "files": [
      {
        "doc_name": "doc1.txt",
        "content": "VGV4dCBjb250ZW50",
        "citable_url": "https://example.com/doc1"
      }
    ],
    "module": "default"
  }' \
  http://localhost:8080/v1/import-multiple
```

## Next Steps

- **[Create Corpus Build](corpus-build.md)**: Analyze and cluster your imported documents
- **[Monitor Build Status](corpus-build.md#monitoring-build-status)**: Track corpus build progress
