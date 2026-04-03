---
title: File Manager HTTP API
menuTitle: API Reference
weight: 10
description: >-
  HTTP API reference for the File Manager service, covering BYOC container files,
  RAG input files, and MLflow artifact storage
---

The File Manager service provides an HTTP API for managing files across three
storage categories: BYOC (Bring Your Own Container) service files, RAG input
files, and MLflow artifacts.

**External base URL:** `https://<EXTERNAL_ENDPOINT>:8529/_platform/filemanager`

Authentication uses a Bearer token in the `Authorization` header.

{{< info >}}
The File Manager service automatically integrates with the ArangoDB MCP
(Model Context Protocol) service. MCP-related endpoints are not exposed
through this API and require no additional configuration.
{{< /info >}}

## Health Check

{{< endpoint "GET" "/_platform/filemanager/health" >}}

Returns the current health status of the service.

**Response (200):**

```json
{
  "status": "ok"
}
```

---

## BYOC Files

BYOC files represent application code packages uploaded for container service
deployments. They are globally scoped (not tied to a specific database) and
versioned by name and version string.

Uploading to the same `name` + `version` combination overwrites the existing
file. The original filename is preserved in the `file_name` metadata field.

### Upload a BYOC File

{{< endpoint "POST" "/_platform/filemanager/global/byoc/" >}}

Uploads a code package for a BYOC container service deployment.

**Content-Type:** `multipart/form-data`

**Form fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Service name. Alphanumeric, hyphens, and underscores only (1–255 characters). |
| `version` | string | Yes | [Semantic version](https://semver.org/) string, e.g. `1.0.0` (1–50 characters). |
| `language` | string | Yes | Programming language: `python` or `nodejs`. |
| `type` | string | Yes | Deployment type: `Service` or `Job`. |
| `file` | file | Yes | File content to upload. Must not be empty. |

**Example:**

```bash
curl -X POST "https://<EXTERNAL_ENDPOINT>:8529/_platform/filemanager/global/byoc/" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -F "name=my-service" \
  -F "version=1.0.0" \
  -F "language=python" \
  -F "type=Service" \
  -F "file=@project.tar.gz"
```

**Response (200):**

```json
{
  "name": "my-service",
  "version": "1.0.0",
  "status": "uploaded",
  "uploaded_at": "2026-01-15T10:30:00Z"
}
```

**Errors:** `400` (validation error), `413` (file too large), `500` (server error)

---

### List BYOC Services

{{< endpoint "GET" "/_platform/filemanager/global/byoc/" >}}

Lists all uploaded BYOC services with optional filtering and pagination.

**Query parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `name` | string | — | Filter by service name. |
| `language` | string | — | Filter by language (`python`, `nodejs`). |
| `limit` | integer | `100` | Maximum results (1–1000). |
| `offset` | integer | `0` | Pagination offset. |

**Response (200):**

```json
{
  "services": [
    {
      "name": "my-service",
      "version": "1.0.0",
      "language": "python",
      "type": "Service",
      "file_name": "app.py",
      "uploaded_at": "2026-01-15T10:30:00Z",
      "storage_location": "file_manager:byoc:my-service:v1.0.0",
      "size": 2048,
      "safe_to_delete": false
    }
  ],
  "total": 1,
  "limit": 100,
  "offset": 0
}
```

---

### List Versions of a BYOC Service

{{< endpoint "GET" "/_platform/filemanager/global/byoc/{name}" >}}

Lists all available versions of a specific BYOC service.

**Path parameters:**

| Parameter | Description |
|-----------|-------------|
| `name` | The service name. |

**Query parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | integer | `100` | Maximum results (1–1000). |
| `offset` | integer | `0` | Pagination offset. |

**Response (200):**

```json
{
  "name": "my-service",
  "versions": [
    {
      "version": "1.0.0",
      "language": "python",
      "type": "Service",
      "size": 2048,
      "uploaded_at": "2026-01-15T10:30:00Z"
    }
  ],
  "total": 1,
  "limit": 100,
  "offset": 0
}
```

**Errors:** `404` (service not found), `500` (server error)

---

### Get BYOC File Info

{{< endpoint "GET" "/_platform/filemanager/global/byoc/{name}/{version}" >}}

Retrieves metadata for a specific version of a BYOC service.

**Path parameters:**

| Parameter | Description |
|-----------|-------------|
| `name` | The service name. |
| `version` | The version string. |

**Response (200):**

```json
{
  "name": "my-service",
  "version": "1.0.0",
  "language": "python",
  "type": "Service",
  "file_name": "app.py",
  "storage_location": "file_manager:byoc:my-service:v1.0.0",
  "size": 2048,
  "uploaded_at": "2026-01-15T10:30:00Z",
  "safe_to_delete": false
}
```

**Errors:** `404` (not found), `500` (server error)

---

### Download a BYOC File

{{< endpoint "GET" "/_platform/filemanager/global/byoc/{name}/{version}/download" >}}

Downloads the file content as a binary stream.

**Path parameters:**

| Parameter | Description |
|-----------|-------------|
| `name` | The service name. |
| `version` | The version string. |

**Example:**

```bash
curl -X GET \
  "https://<EXTERNAL_ENDPOINT>:8529/_platform/filemanager/global/byoc/my-service/1.0.0/download" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -o my-service.tar.gz
```

**Response (200):** Binary file stream (`application/octet-stream`)

**Errors:** `404` (not found), `500` (server error)

---

### Delete a BYOC File

{{< endpoint "DELETE" "/_platform/filemanager/global/byoc/{name}/{version}" >}}

Deletes a specific version of a BYOC service file and its metadata.
Deletion is only permitted when `safe_to_delete` is `true` in the file metadata,
which means the file is not referenced by any active service deployment.

**Path parameters:**

| Parameter | Description |
|-----------|-------------|
| `name` | The service name. |
| `version` | The version string. |

**Response (200):**

```json
{
  "name": "my-service",
  "version": "1.0.0",
  "status": "deleted"
}
```

**Errors:** `404` (not found), `423` (file in use, not safe to delete), `500` (server error)

---

## RAG Input Files

RAG input files are binary files uploaded for GraphRAG processing. They are
database-scoped and support automatic versioning — each upload of the same
filename within the same database creates a new version. Supported file types
include images, videos, audio, PDFs, and other binary media.

### Upload a RAG Input File

{{< endpoint "POST" "/_platform/filemanager/_db/{database}/rag-input" >}}

Uploads a file for RAG processing. Re-uploading a file with the same name
within the same database automatically creates a new version.

**Path parameters:**

| Parameter | Description |
|-----------|-------------|
| `database` | The database name. |

**Content-Type:** `multipart/form-data`

**Form fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | File name identifier (1–255 characters). |
| `file` | file | Yes | File content to upload. Must not be empty. |

**Response (200):**

```json
{
  "id": "cmFnLWlucHV0LmRiLW5hbWUubXktZmlsZQ",
  "name": "my-file.pdf",
  "database": "my-database",
  "content_type": "application/pdf",
  "size": 102400,
  "uploaded_at": "2026-01-15T10:30:00Z",
  "metadata_key": "_rag_input.my-database.cmFnLWlucHV0LmRiLW5hbWUubXktZmlsZQ.v1",
  "version": 1
}
```

**Errors:** `400` (validation error), `413` (file too large), `500` (server error)

---

### List RAG Input Files

{{< endpoint "GET" "/_platform/filemanager/_db/{database}/rag-input" >}}

Lists RAG input files for a specific database.

**Path parameters:**

| Parameter | Description |
|-----------|-------------|
| `database` | The database name. |

**Query parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `name` | string | — | Filter by file name. |
| `limit` | integer | `100` | Maximum results (1–1000). |
| `offset` | integer | `0` | Pagination offset. |

**Response (200):**

```json
{
  "files": [
    {
      "id": "cmFnLWlucHV0LmRiLW5hbWUubXktZmlsZQ",
      "name": "my-file.pdf",
      "database": "my-database",
      "content_type": "application/pdf",
      "size": 102400,
      "uploaded_at": "2026-01-15T10:30:00Z",
      "version": 1,
      "safe_to_delete": false,
      "storage_location": "file_manager:rag_inputs:my-database:..."
    }
  ],
  "total": 1,
  "limit": 100,
  "offset": 0
}
```

---

### Get Version History

{{< endpoint "GET" "/_platform/filemanager/_db/{database}/rag-input/versions" >}}

Returns the full version history for a file, looked up by name within the
specified database.

**Path parameters:**

| Parameter | Description |
|-----------|-------------|
| `database` | The database name. |

**Query parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | Yes | The file name to look up. |

**Response (200):**

```json
{
  "name": "my-file.pdf",
  "database": "my-database",
  "versions": [
    {
      "version": 2,
      "metadata_key": "_rag_input.my-database.abc123.v2"
    },
    {
      "version": 1,
      "metadata_key": "_rag_input.my-database.abc123.v1"
    }
  ],
  "latest_version": 2
}
```

**Errors:** `404` (no version history found), `500` (server error)

---

### Get RAG Input File Info

{{< endpoint "GET" "/_platform/filemanager/_db/{database}/rag-input/{id}" >}}

Retrieves metadata for a stored RAG input file. Returns the latest version
unless a specific version is requested.

**Path parameters:**

| Parameter | Description |
|-----------|-------------|
| `database` | The database name. |
| `id` | The file identifier. |

**Query parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `version` | integer | latest | Specific version number to retrieve. |

**Response (200):**

```json
{
  "id": "cmFnLWlucHV0LmRiLW5hbWUubXktZmlsZQ",
  "name": "my-file.pdf",
  "database": "my-database",
  "content_type": "application/pdf",
  "storage_location": "file_manager:rag_inputs:my-database:...",
  "size": 102400,
  "uploaded_at": "2026-01-15T10:30:00Z",
  "version": 1,
  "safe_to_delete": false
}
```

**Errors:** `404` (not found), `500` (server error)

---

### Download a RAG Input File

{{< endpoint "GET" "/_platform/filemanager/_db/{database}/rag-input/{id}/download" >}}

Downloads the file content as a binary stream. Returns the latest version
unless a specific version is requested.

**Path parameters:**

| Parameter | Description |
|-----------|-------------|
| `database` | The database name. |
| `id` | The file identifier. |

**Query parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `version` | integer | latest | Specific version number to download. |

**Response (200):** Binary file stream with the original content type.

**Errors:** `404` (not found), `500` (server error)

---

### Delete a RAG Input File

{{< endpoint "DELETE" "/_platform/filemanager/_db/{database}/rag-input/{id}" >}}

Deletes a RAG input file and its metadata. Defaults to the latest version
unless a specific version is specified. Deletion is only permitted when the
file's `safe_to_delete` field is `true`.

**Path parameters:**

| Parameter | Description |
|-----------|-------------|
| `database` | The database name. |
| `id` | The file identifier. |

**Query parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `version` | integer | latest | Specific version number to delete. |

**Response (200):**

```json
{
  "id": "cmFnLWlucHV0LmRiLW5hbWUubXktZmlsZQ",
  "database": "my-database",
  "status": "deleted"
}
```

**Errors:** `404` (not found), `423` (file in use, not safe to delete), `500` (server error)

---

## MLflow Artifacts

MLflow artifact endpoints provide backward-compatible artifact storage for
MLflow experiments and runs. These endpoints are mounted at the service root
with no path prefix.

### Upload an Artifact

{{< endpoint "PUT" "/_platform/filemanager/{file_path}" >}}

Uploads a file to the specified path in artifact storage.

**Path parameters:**

| Parameter | Description |
|-----------|-------------|
| `file_path` | Destination storage path for the artifact. |

**Request body:** Raw binary content of the file.

**Response (200):**

```json
{
  "message": "Artifact uploaded successfully"
}
```

**Errors:** `500` (server error)

---

### List Artifacts

{{< endpoint "GET" "/_platform/filemanager/mlflow-artifacts/artifacts" >}}

Lists MLflow artifacts at the specified directory path.

**Query parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `path` | string | `""` | Relative path to the artifact directory. |

**Response (200):**

```json
{
  "files": [
    {
      "path": "experiment-1/run-1/model.pkl",
      "is_dir": false,
      "file_size": 51200
    },
    {
      "path": "experiment-1/run-1/artifacts",
      "is_dir": true,
      "file_size": null
    }
  ]
}
```

**Errors:** `500` (server error)

---

### Download an Artifact

{{< endpoint "GET" "/_platform/filemanager/{file_path}" >}}

Downloads the content of the specified artifact file.

**Path parameters:**

| Parameter | Description |
|-----------|-------------|
| `file_path` | Path to the artifact to download. |

**Response (200):** Binary file stream (`application/octet-stream`)

**Errors:** `404` (artifact not found), `500` (server error)

---

### Delete an Artifact

{{< endpoint "DELETE" "/_platform/filemanager/{file_path}" >}}

Removes the specified file or directory and all its contents from artifact storage.

**Path parameters:**

| Parameter | Description |
|-----------|-------------|
| `file_path` | Path to the artifact or directory to delete. |

**Response (200):**

```json
{
  "message": "Artifact deleted successfully"
}
```

**Errors:** `500` (server error)
