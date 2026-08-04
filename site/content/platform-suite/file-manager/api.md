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

## Health Check

{{< endpoint "GET" "https://<EXTERNAL_ENDPOINT>:8529/_platform/filemanager/health" >}}

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

Uploading to the same `name` and `version` combination overwrites the existing
file. The original filename is preserved in the `file_name` metadata field.

### Upload a BYOC File

{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/_platform/filemanager/global/byoc/" >}}

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

{{< endpoint "GET" "https://<EXTERNAL_ENDPOINT>:8529/_platform/filemanager/global/byoc/" >}}

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

{{< endpoint "GET" "https://<EXTERNAL_ENDPOINT>:8529/_platform/filemanager/global/byoc/{name}" >}}

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

{{< endpoint "GET" "https://<EXTERNAL_ENDPOINT>:8529/_platform/filemanager/global/byoc/{name}/{version}" >}}

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

{{< endpoint "GET" "https://<EXTERNAL_ENDPOINT>:8529/_platform/filemanager/global/byoc/{name}/{version}/download" >}}

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

{{< endpoint "DELETE" "https://<EXTERNAL_ENDPOINT>:8529/_platform/filemanager/global/byoc/{name}/{version}" >}}

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
database-scoped and support automatic versioning. Supported file types include
images, videos, audio, PDFs, and other binary media.

Every RAG input operation is addressed either by **file** (an opaque file
identifier) or by **scope** (a subtree of the scope hierarchy).

### Scopes

A scope is an ordered list of labels that addresses a file within a database,
for example `["marketing", "campaigns", "q3"]`. The model is deliberately
generic: the same mechanism represents a project, a module, or any deeper
folder level. Consumers map their own concepts onto scope levels —
[AutoGraph](../../agentic-ai-suite/autograph/design-guide.md#designing-modules)
calls its first level a *module*, for instance.

The following rules apply:

| Rule | Value |
|------|-------|
| Maximum number of levels | 5 |
| Allowed characters per label | `A`–`Z`, `a`–`z`, `0`–`9`, `_`, `-` |
| Maximum length per label | 128 characters |
| Maximum combined length | 256 characters |

Additional behavior:

- A file belongs to **exactly one** scope. Multi-scope membership is not
  supported.
- Scopes are **derived from files**. A scope level exists only while at least
  one file is stored under it, and it disappears when the last file is removed.
  You cannot create an empty scope.
- An **empty scope** (`[]`) is valid and addresses the database's default,
  unscoped files. Files uploaded before scope support was introduced have an
  empty scope.

Scopes are expressed differently depending on the request type:

| Request type | How to pass a scope |
|--------------|---------------------|
| `multipart/form-data` | Repeat the `scope` form field once per label, in order. |
| Query string | Repeat the `scope` query parameter once per label, in order. |
| JSON body | A JSON array of strings, in order. |

### File identity and versioning

A file lineage is identified by the combination of **database**, **scope**, and
**name**. Uploading a file with the same name into the same scope of the same
database creates a new version of that lineage. The same name in a *different*
scope is a separate, independent file.

Each stored file has an opaque `id` that addresses the whole lineage. Operations
that accept a `version` query parameter default to the latest version. Version
numbers start at `1`; a `version` of `0` or lower is rejected with `422`.

### Safe-to-delete

Every lineage carries a `safe_to_delete` flag:

- `true` — the file can be deleted.
- `false` — the file is **locked**. Delete requests skip it and report it as
  locked rather than removing it.

Consumers set this flag to protect files that are in use. The flag applies to
the whole lineage (all versions), not to an individual version.

### Partial results

Operations that act on more than one file — the bulk and scope variants of
delete and safe-to-delete, and batch upload — can partially succeed. They
return:

- `200` when every item succeeded.
- `207` (Multi-Status) when at least one item failed, was locked, or was not
  found. The response body has the same shape in both cases; inspect the
  per-item lists to see what happened.

### Error responses

Errors use a common body:

```json
{
  "detail": "Error message"
}
```

`422` responses additionally carry the standard request-validation body listing
the offending fields.

---

### Upload a RAG Input File

{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/_platform/filemanager/_db/{database}/rag-input" >}}

Uploads a single file for RAG processing. Re-uploading a file with the same name
into the same scope automatically creates a new version.

**Path parameters:**

| Parameter | Description |
|-----------|-------------|
| `database` | The database name. |

**Content-Type:** `multipart/form-data`

**Form fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | File name identifier (1–255 characters). |
| `scope` | string | No | One scope label. Repeat the field once per level, in order. Omit for an unscoped file. |
| `file` | file | Yes | File content to upload. Must not be empty. |

**Example:**

```bash
curl -X POST \
  "https://<EXTERNAL_ENDPOINT>:8529/_platform/filemanager/_db/my-database/rag-input" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -F "name=my-file.pdf" \
  -F "scope=marketing" \
  -F "scope=campaigns" \
  -F "file=@my-file.pdf"
```

**Response (200):**

```json
{
  "id": "cmFnLWlucHV0LmRiLW5hbWUubXktZmlsZQ",
  "name": "my-file.pdf",
  "database": "my-database",
  "scope": ["marketing", "campaigns"],
  "content_type": "application/pdf",
  "size": 102400,
  "uploaded_at": "2026-01-15T10:30:00Z",
  "metadata_key": "_rag_input.my-database.cmFnLWlucHV0LmRiLW5hbWUubXktZmlsZQ.v1",
  "version": 1
}
```

**Errors:** `400` (validation error, including an invalid scope), `422` (request
validation error), `500` (server error)

There is no application-level size limit on single-file upload.

---

### Upload a Batch of RAG Input Files

{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/_platform/filemanager/_db/{database}/rag-input/batch" >}}

Uploads up to 100 files in one request. The combined request body must not
exceed 2 GiB.

**Path parameters:**

| Parameter | Description |
|-----------|-------------|
| `database` | The database name. |

**Content-Type:** `multipart/form-data`

**Form fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `files` | file | Yes | File content. Repeat the field once per file. |
| `scope` | string | No | Base scope applied to every file. Repeat once per level, in order. |
| `mapping` | string | No | How to derive each file's scope from its path: `flatten` (default) puts every file directly under the base scope; `preserve_paths` appends the file's directory segments as deeper scope levels. |
| `manifest` | string (JSON) | No | Per-file overrides, letting you set an individual name or scope for a file instead of deriving it. See [Overriding names and scopes](#overriding-names-and-scopes-with-a-manifest). |

Each file's resolved scope must still satisfy the
[scope rules](#scopes) — with `preserve_paths`, a deep source directory can push
a file past the 5-level limit, and that file fails while the rest succeed.

#### Overriding names and scopes with a manifest

The `manifest` field carries a JSON object with a `files` array. Each entry
matches one uploaded part by its submitted filename and overrides what would
otherwise be derived from `scope` and `mapping`:

```json
{
  "files": [
    {
      "filename": "docs/emea/q3-report.pdf",
      "name": "Q3 Report (EMEA).pdf",
      "scope": ["marketing", "reports", "2026"]
    },
    {
      "filename": "notes.txt",
      "name": "campaign-notes.txt"
    }
  ]
}
```

| Entry field | Type | Required | Description |
|-------------|------|----------|-------------|
| `filename` | string | Yes | The filename of the multipart part this entry applies to, exactly as submitted. |
| `name` | string | No | Stored file name. Defaults to the basename of `filename`. |
| `scope` | array of strings | No | Full scope for this file, ordered from the top level down. |

Resolution follows these rules, in order:

1. A file with no matching manifest entry is unaffected: its scope comes from
   the base `scope` plus whatever `mapping` derives.
2. A manifest `scope` **replaces** the entire resolved scope rather than
   extending it. The base `scope` is not prepended and `mapping` is not applied
   to that file, so the array you provide is the complete scope path.
3. Omitting `scope` in an entry leaves the derivation from rule 1 in place, so
   an entry can override only the `name`.
4. A manifest `scope` is validated like any other, so it must satisfy the
   [scope rules](#scopes) — including the 5-level limit.

Because rule 2 replaces the whole path, mixing a base `scope` with manifest
scopes puts the two sets of files in unrelated subtrees. Repeat the base levels
in each manifest `scope` when you want the overrides to stay under it.

{{< info >}}
Batch requests are easiest to reason about when the manifest is authoritative:
list every file with an explicit `scope` and omit `mapping` entirely. Derivation
and overrides in the same request are valid but harder to predict.
{{< /info >}}

**Response (200):** every file stored.

**Response (207):** at least one file failed. Per-file results report `status`
as `ok` or `error`; error entries carry the submitted scope rather than a
resolved one.

```json
{
  "results": [
    {
      "name": "guide.pdf",
      "scope": ["marketing", "campaigns"],
      "status": "ok",
      "id": "cmFnLWlucHV0LmRiLW5hbWUuZ3VpZGU"
    },
    {
      "name": "notes.txt",
      "scope": ["marketing", "campaigns"],
      "status": "error",
      "id": null
    }
  ]
}
```

**Errors:** `400` (validation error, including an unsupported `mapping` value),
`413` (request exceeds the 2 GiB limit), `422` (request validation error),
`500` (server error)

---

### List RAG Input Files

{{< endpoint "GET" "https://<EXTERNAL_ENDPOINT>:8529/_platform/filemanager/_db/{database}/rag-input" >}}

Lists the latest version of each RAG input file in a database.

**Path parameters:**

| Parameter | Description |
|-----------|-------------|
| `database` | The database name. |

**Query parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `scope` | string | — | Subtree filter: returns files at this scope **and below**. Repeat once per level, in order. Omit to list files across all scopes. |
| `search` | string | — | Case-insensitive substring match on the file name. |
| `name` | string | — | Filters by an exact file name. Can be combined with `scope`. |
| `limit` | integer | `100` | Maximum results (1–1000). |
| `offset` | integer | `0` | Pagination offset. |

**Example:**

```bash
curl -X GET \
  "https://<EXTERNAL_ENDPOINT>:8529/_platform/filemanager/_db/my-database/rag-input?scope=marketing&search=report" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

**Response (200):**

```json
{
  "files": [
    {
      "id": "cmFnLWlucHV0LmRiLW5hbWUubXktZmlsZQ",
      "name": "my-file.pdf",
      "database": "my-database",
      "scope": ["marketing", "campaigns"],
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

{{< endpoint "GET" "https://<EXTERNAL_ENDPOINT>:8529/_platform/filemanager/_db/{database}/rag-input/versions" >}}

Returns the full version history for a lineage, looked up by scope and name
within the specified database.

**Path parameters:**

| Parameter | Description |
|-----------|-------------|
| `database` | The database name. |

**Query parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | Yes | The file name to look up. |
| `scope` | string | No | One scope label of the lineage. Repeat once per level, in order. Omit for an unscoped file. |

**Response (200):**

```json
{
  "name": "my-file.pdf",
  "database": "my-database",
  "scope": ["marketing", "campaigns"],
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

**Errors:** `404` (no version history found), `422` (request validation error),
`500` (server error)

---

### Browse Scopes

{{< endpoint "GET" "https://<EXTERNAL_ENDPOINT>:8529/_platform/filemanager/_db/{database}/rag-input/scopes" >}}

Lists the immediate child scopes under a given scope path, with per-scope file
counts. Use it to build a folder-style browser: start with no `scope` parameter
to see the top level, then pass the path of the child you want to descend into.

**Path parameters:**

| Parameter | Description |
|-----------|-------------|
| `database` | The database name. |

**Query parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `scope` | string | — | The scope path to browse. Repeat once per level, in order. Omit to browse the top level. |

**Response (200):**

```json
{
  "database": "my-database",
  "scope": ["marketing"],
  "children": [
    {
      "name": "campaigns",
      "file_count": 12
    },
    {
      "name": "briefs",
      "file_count": 3
    }
  ],
  "file_count": 15
}
```

Only scopes that currently contain at least one file are listed.

---

### Get RAG Input File Info

{{< endpoint "GET" "https://<EXTERNAL_ENDPOINT>:8529/_platform/filemanager/_db/{database}/rag-input/{id}" >}}

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
| `version` | integer | latest | Specific version number to retrieve. Must be `1` or greater. |

**Response (200):**

```json
{
  "id": "cmFnLWlucHV0LmRiLW5hbWUubXktZmlsZQ",
  "name": "my-file.pdf",
  "database": "my-database",
  "scope": ["marketing", "campaigns"],
  "content_type": "application/pdf",
  "storage_location": "file_manager:rag_inputs:my-database:...",
  "size": 102400,
  "uploaded_at": "2026-01-15T10:30:00Z",
  "version": 1,
  "safe_to_delete": false
}
```

**Errors:** `404` (not found), `422` (invalid `version`), `500` (server error)

---

### Download a RAG Input File

{{< endpoint "GET" "https://<EXTERNAL_ENDPOINT>:8529/_platform/filemanager/_db/{database}/rag-input/{id}/download" >}}

Downloads the file content as a streaming binary response. Returns the latest
version unless a specific version is requested.

**Path parameters:**

| Parameter | Description |
|-----------|-------------|
| `database` | The database name. |
| `id` | The file identifier. |

**Query parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `version` | integer | latest | Specific version number to download. Must be `1` or greater. |

**Response (200):** Binary file stream. The response uses the file's detected
content type when one is known, and `application/octet-stream` otherwise.

**Errors:** `404` (not found), `422` (invalid `version`), `500` (server error)

---

### Lock or Unlock a File

{{< endpoint "PATCH" "https://<EXTERNAL_ENDPOINT>:8529/_platform/filemanager/_db/{database}/rag-input/{id}" >}}

Sets the `safe_to_delete` flag on a whole lineage (all versions).

**Path parameters:**

| Parameter | Description |
|-----------|-------------|
| `database` | The database name. |
| `id` | The file identifier. |

**Request body:**

```json
{
  "safe_to_delete": false
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `safe_to_delete` | boolean | Yes | `false` locks the file, `true` unlocks it. |

**Errors:** `404` (not found), `422` (request validation error),
`500` (server error)

---

### Lock or Unlock Multiple Files

{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/_platform/filemanager/_db/{database}/rag-input/safe-to-delete" >}}

Sets the `safe_to_delete` flag on up to 100 lineages in one request. Each id
affects the whole lineage.

**Path parameters:**

| Parameter | Description |
|-----------|-------------|
| `database` | The database name. |

**Request body:**

```json
{
  "ids": ["cmFnLWlucHV0LmRiLW5hbWUuYQ", "cmFnLWlucHV0LmRiLW5hbWUuYg"],
  "safe_to_delete": false
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ids` | array of strings | Yes | File ids. Between 1 and 100 entries. |
| `safe_to_delete` | boolean | Yes | `false` locks the files, `true` unlocks them. |

**Response (200):** every id updated. **Response (207):** at least one id was
not found.

```json
{
  "database": "my-database",
  "updated": ["cmFnLWlucHV0LmRiLW5hbWUuYQ"],
  "not_found": ["cmFnLWlucHV0LmRiLW5hbWUuYg"]
}
```

**Errors:** `422` (empty `ids`, more than 100 ids, or other request validation
error), `500` (server error)

---

### Lock or Unlock a Scope

{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/_platform/filemanager/_db/{database}/rag-input/safe-to-delete-scope" >}}

Sets the `safe_to_delete` flag on every file at a scope **and below it**.

**Path parameters:**

| Parameter | Description |
|-----------|-------------|
| `database` | The database name. |

**Request body:**

```json
{
  "scope": ["marketing", "campaigns"],
  "safe_to_delete": false
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `scope` | array of strings | Yes | The scope subtree to update. Must not be empty. |
| `safe_to_delete` | boolean | Yes | `false` locks the files, `true` unlocks them. |

**Response (200):** every file in the subtree updated. **Response (207):**
partial success.

```json
{
  "database": "my-database",
  "scope": ["marketing", "campaigns"],
  "updated": ["cmFnLWlucHV0LmRiLW5hbWUuYQ"]
}
```

**Errors:** `400` (invalid scope), `422` (request validation error),
`500` (server error)

---

### Delete a RAG Input File Version

{{< endpoint "DELETE" "https://<EXTERNAL_ENDPOINT>:8529/_platform/filemanager/_db/{database}/rag-input/{id}" >}}

Deletes a RAG input file version and its metadata. Defaults to the latest
version unless a specific version is given. Deletion is only permitted when the
lineage's `safe_to_delete` field is `true`.

**Path parameters:**

| Parameter | Description |
|-----------|-------------|
| `database` | The database name. |
| `id` | The file identifier. |

**Query parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `version` | integer | latest | Specific version number to delete. Must be `1` or greater. |

**Response (200):**

```json
{
  "id": "cmFnLWlucHV0LmRiLW5hbWUubXktZmlsZQ",
  "database": "my-database",
  "status": "deleted"
}
```

**Errors:** `404` (not found), `422` (invalid `version`), `423` (file locked,
not safe to delete), `500` (server error)

---

### Delete Multiple Files

{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/_platform/filemanager/_db/{database}/rag-input/delete" >}}

Deletes up to 100 lineages in one request. Each id removes the **whole** file,
including all of its versions. Locked files are left untouched and reported as
locked; unknown ids are reported as not found.

**Path parameters:**

| Parameter | Description |
|-----------|-------------|
| `database` | The database name. |

**Request body:**

```json
{
  "ids": ["cmFnLWlucHV0LmRiLW5hbWUuYQ", "cmFnLWlucHV0LmRiLW5hbWUuYg"]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ids` | array of strings | Yes | File ids. Between 1 and 100 entries. |

**Response (200):** every id deleted. **Response (207):** at least one id was
locked or not found.

```json
{
  "database": "my-database",
  "deleted": ["cmFnLWlucHV0LmRiLW5hbWUuYQ"],
  "locked": [],
  "not_found": ["cmFnLWlucHV0LmRiLW5hbWUuYg"]
}
```

**Errors:** `422` (empty `ids`, more than 100 ids, or other request validation
error), `500` (server error)

---

### Delete a Scope

{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/_platform/filemanager/_db/{database}/rag-input/delete-scope" >}}

Deletes every file at a scope **and below it**. Locked files are skipped and
reported. Because scopes are derived from files, a scope level that ends up
with no files left disappears from
[Browse Scopes](#browse-scopes).

**Path parameters:**

| Parameter | Description |
|-----------|-------------|
| `database` | The database name. |

**Request body:**

```json
{
  "scope": ["marketing", "campaigns"]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `scope` | array of strings | Yes | The scope subtree to delete. Must not be empty. |

**Response (200):** every file in the subtree deleted. **Response (207):** at
least one file was locked.

```json
{
  "database": "my-database",
  "scope": ["marketing", "campaigns"],
  "deleted": ["cmFnLWlucHV0LmRiLW5hbWUuYQ"],
  "locked": ["cmFnLWlucHV0LmRiLW5hbWUuYg"]
}
```

**Errors:** `400` (invalid scope), `422` (request validation error),
`500` (server error)

---

## MLflow Artifacts

MLflow artifact endpoints provide backward-compatible artifact storage for
MLflow experiments and runs. These endpoints are mounted at the service root
with no path prefix.

### Upload an Artifact

{{< endpoint "PUT" "https://<EXTERNAL_ENDPOINT>:8529/_platform/filemanager/{file_path}" >}}

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

{{< endpoint "GET" "https://<EXTERNAL_ENDPOINT>:8529/_platform/filemanager/mlflow-artifacts/artifacts" >}}

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

{{< endpoint "GET" "https://<EXTERNAL_ENDPOINT>:8529/_platform/filemanager/{file_path}" >}}

Downloads the content of the specified artifact file.

**Path parameters:**

| Parameter | Description |
|-----------|-------------|
| `file_path` | Path to the artifact to download. |

**Response (200):** Binary file stream (`application/octet-stream`)

**Errors:** `404` (artifact not found), `500` (server error)

---

### Delete an Artifact

{{< endpoint "DELETE" "https://<EXTERNAL_ENDPOINT>:8529/_platform/filemanager/{file_path}" >}}

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
