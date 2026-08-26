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
Deletion is only permitted when `safe_to_delete` is `true` in the file metadata.

{{< info >}}
BYOC files currently always report `safe_to_delete` as `false`, so deleting an
existing file returns `423`.
{{< /info >}}

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

**Errors:** `404` (not found), `423` (not safe to delete), `500` (server error)

---

## RAG Input Files

RAG input files are binary files uploaded for GraphRAG processing. They are
database-scoped and support automatic versioning. Supported file types include
images, videos, audio, PDFs, and other binary media.

Every RAG input operation is addressed either by **file** (a file identifier) or
by **scope** (a subtree of the scope hierarchy).

### Scopes

A scope is an ordered list of labels that addresses a file within a database,
for example `["acme", "legal", "q3"]`. The model is deliberately
generic: the same mechanism represents a project, a module, or any deeper
folder level. Consumers map their own concepts onto scope levels —
[AutoGraph](../../agentic-ai-suite/autograph/design-guide.md#designing-categories)
uses the first level for the project and the second, the *category*, for its
module, for instance.

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

Each stored file has an `id` that addresses the whole lineage, for example
`rag-input-OjI6bXktZGF0YWJhc2U6YWNtZTpsZWdhbDpteS1maWxlLnBkZg`. The
id encodes the database, scope, and name, so endpoints that take an `{id}` path
parameter do not accept a separate scope argument.

Operations that accept a `version` query parameter default to the latest
version. Version numbers start at `1`; a `version` of `0` or lower is rejected
with `422`.

Changing the *order* of the scope labels addresses a different lineage:
`["acme", "legal"]` and `["legal", "acme"]` are unrelated.

### Custom metadata

When you upload a RAG input file, you can attach information of your own to it,
as a set of name-value pairs called `custom_metadata`:

```json
{
  "author": "Ada",
  "department": "legal",
  "citable_url": "https://example.com/doc"
}
```

Names and values are both plain text. File Manager only keeps them and hands
them back unchanged; it never acts on them itself, so you are free to use
whatever names suit your own applications. A few names are picked up by other
services, such as `citable_url`, described below.

The following limits apply:

| Limit | Value |
|-------|-------|
| Number of pairs per file | 32 |
| Length of one name | 64 characters |
| Length of one value | 2048 characters |
| Size of all pairs together | 16 KiB |

An upload that goes over one of these limits, or that sends anything other than
plain text, is rejected with `400`.

A file uploaded without custom metadata simply has none, and every response
shows it as `{}`.

Custom metadata belongs to **one version** of a file. Uploading the same file
again creates a new version, and that version carries only the custom metadata
sent with it. Nothing is merged into or removed from earlier versions, which
keep their own. To read what an earlier version carries, add a `version` query
parameter to [Get RAG Input File Info](#get-rag-input-file-info), as in
`?version=1`. The numbers you can ask for come from
[Get Version History](#get-version-history).

#### The `citable_url` key

`citable_url` is one of the names other services look for. When AutoGraph
builds a knowledge graph from your files, it turns this URL into a clickable
link on every citation that points at the file. Without it, readers see a bare
citation number instead.

Set it to the document's public web address when you upload the file:

```bash
curl -X POST \
  "https://<EXTERNAL_ENDPOINT>:8529/_platform/filemanager/_db/my-database/rag-input" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -F "name=my-file.pdf" \
  -F "file=@./downloads/my-file.pdf" \
  -F 'custom_metadata={"citable_url":"https://example.com/docs/my-file"}'
```

The link has to start with `http://` or `https://` and must not contain
whitespace or unmatched parentheses. File Manager does not check this; it only
applies the size limits above. Anything that is not a usable link is quietly
skipped, which leaves the citation unlinked. See
[Import parameters](../../agentic-ai-suite/importer/reference/parameters.md#citation-urls)
for how the Importer resolves the key.

### Safe-to-delete

Every *version* carries its own `safe_to_delete` flag in its own metadata
document:

- `true` — the version can be deleted.
- `false` — the version is **locked**. Delete requests skip it and report it as
  locked rather than removing it.

Consumers set this flag to protect files that are in use. Although the flag is
stored per version, the endpoints that write it
([single](#lock-or-unlock-a-file), [bulk](#lock-or-unlock-multiple-files), and
[scope](#lock-or-unlock-a-scope)) always write it to **every** version of a
lineage in one call, so the versions of a lineage stay in sync. Deleting a
single version, on the other hand, only checks the flag of the version being
deleted.

Every newly uploaded version starts out **unlocked** (`safe_to_delete` is
`true`), whether it is the first version of a new file or another version added
to an existing lineage. Uploading does not inherit the lock state of the
previous versions.

### Partial results

Operations that act on more than one file — the bulk and scope variants of
delete and safe-to-delete, and batch upload — can partially succeed. They
return:

- `200` when every item succeeded.
- `207` (Multi-Status) when at least one item failed, was locked, or was not
  found. The response body has the same shape in both cases; inspect the
  per-item lists to see what happened.

### Error responses

Request-level errors use a common body with a `detail` string:

```json
{
  "detail": "scope labels may only contain letters, digits, hyphens, and underscores"
}
```

`422` responses instead carry the standard request-validation body, in which
`detail` is an **array** with one entry per offending field.

---

### Upload a RAG Input File

{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/_platform/filemanager/_db/{database}/rag-input" >}}

Uploads a single file for RAG processing. Re-uploading a file with the same name
into the same scope automatically creates a new version.

To upload multiple files at once, see [Upload a batch of RAG Input Files](#upload-a-batch-of-rag-input-files).

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
| `custom_metadata` | string (JSON) | No | Your own name-value pairs, as a JSON object, stored with this version of the file. See [Custom metadata](#custom-metadata). Defaults to `{}`. |

**Example:**

```bash
curl -X POST \
  "https://<EXTERNAL_ENDPOINT>:8529/_platform/filemanager/_db/my-database/rag-input" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -F "name=my-file.pdf" \
  -F "scope=acme" \
  -F "scope=legal" \
  -F "file=@my-file.pdf" \
  -F 'custom_metadata={"author":"Ada","citable_url":"https://example.com/doc"}'
```

**Response (200):**

```json
{
  "id": "rag-input-OjI6bXktZGF0YWJhc2U6YWNtZTpsZWdhbDpteS1maWxlLnBkZg",
  "name": "my-file.pdf",
  "database": "my-database",
  "scope": ["acme", "legal"],
  "content_type": "application/pdf",
  "size": 102400,
  "uploaded_at": "2026-01-15T10:30:00Z",
  "version": 1,
  "safe_to_delete": true,
  "custom_metadata": {
    "author": "Ada",
    "citable_url": "https://example.com/doc"
  },
  "metadata_key": "_rag_input.my-database.acme.legal.rag-input-OjI6bXktZGF0YWJhc2U6YWNtZTpsZWdhbDpteS1maWxlLnBkZg.v1"
}
```

**Errors:** `400` (invalid scope, including a violation of the level or
combined-length limits, or invalid `custom_metadata`), `422` (a required form
field is missing or a typed field is invalid), `500` (storage, metadata, or
another internal operation failed).

There is no application-level size limit on single-file upload, although an
ingress or proxy in front of the service may impose one.

---

### Upload a Batch of RAG Input Files

{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/_platform/filemanager/_db/{database}/rag-input/batch" >}}

Uploads up to 100 files in one request. The combined request body must not
exceed 2 GiB. Files are processed sequentially and independently, and the
`results` array stays in request order.

**Path parameters:**

| Parameter | Description |
|-----------|-------------|
| `database` | The database name. |

**Content-Type:** `multipart/form-data`

**Form fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `files` | file | Yes | File content. Repeat the field once per file, up to 100. |
| `manifest` | string (JSON) | No | Per-file target mappings. See [Targeting files with a manifest](#targeting-files-with-a-manifest). |
| `scope` | string | No | Shared base scope applied to every file, used only when `manifest` is omitted. Repeat once per level, in order. Defaults to the empty scope. |
| `mapping` | string | No | `flatten` (default) or `preserve_paths`, used only when `manifest` is omitted. |
| `custom_metadata` | string (JSON) | No | Shared [custom metadata](#custom-metadata) applied to every file in the batch. A manifest entry's own `custom_metadata` is merged on top of it. Applies in both manifest and shared-scope mode. |

The two ways of placing files are alternatives: supply a `manifest`, or supply
`scope` and `mapping`. When a `manifest` is present, `scope` and `mapping` do
not apply. The shared `custom_metadata` field applies either way.

In shared-scope mode, `flatten` stores every uploaded basename directly in the
shared scope. `preserve_paths` appends the directory segments of each multipart
filename to that scope and uses the final segment as the name.

Each file's resolved scope must still satisfy the
[scope rules](#scopes) — with `preserve_paths`, a deep source directory can push
a file past the 5-level limit, and that file fails while the rest succeed.

#### Targeting files with a manifest

The `manifest` field carries a JSON **array**. Each entry maps to one multipart
file by the zero-based `file` index, or by its own position in the array when
`file` is omitted:

```json
[
  {
    "file": 0,
    "name": "Q3 Report (EMEA).pdf",
    "scope": ["acme", "reports", "2026"]
  },
  {
    "file": 1,
    "name": "legal-notes.txt"
  }
]
```

| Entry field | Type | Required | Description |
|-------------|------|----------|-------------|
| `file` | integer | No | Zero-based index of the multipart file this entry applies to. Defaults to the entry's position in the array. |
| `name` | string | No | Stored file name. Defaults to the basename of the uploaded file. |
| `scope` | array of strings | No | Full scope for this file, ordered from the top level down. Defaults to the empty scope. |
| `custom_metadata` | object | No | [Custom metadata](#custom-metadata) for this file only, merged on top of the shared `custom_metadata` form field. |

Every manifest `scope` follows the [scope rules](#scopes). An entry that omits
`scope` defaults to the empty scope.

A file ends up with the shared `custom_metadata` and its own entry's
`custom_metadata` combined. Where both use the same name, the entry's value is
the one that is kept. The combined result is checked against the
[size limits](#custom-metadata) again, so two sets that are each small enough
on their own can still be too large together.

**Example using a manifest:**

```bash
curl -X POST \
  "https://<EXTERNAL_ENDPOINT>:8529/_platform/filemanager/_db/my-database/rag-input/batch" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -F "files=@q1.pdf" \
  -F "files=@q2.pdf" \
  -F 'manifest=[{"file":0,"name":"q1.pdf","scope":["acme","reports"]},{"file":1,"name":"q2.pdf","scope":["acme","reports"]}]'
```

**Example using path preservation:**

```bash
curl -X POST \
  "https://<EXTERNAL_ENDPOINT>:8529/_platform/filemanager/_db/my-database/rag-input/batch" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -F "files=@./reports/q1.pdf;filename=reports/q1.pdf" \
  -F "scope=acme" \
  -F "mapping=preserve_paths"
```

**Response (200):** every file stored.

```json
{
  "database": "my-database",
  "results": [
    {
      "name": "q1.pdf",
      "scope": ["acme", "reports"],
      "status": "ok",
      "id": "rag-input-OjI6bXktZGF0YWJhc2U6YWNtZTpyZXBvcnRzOnExLnBkZg",
      "version": 1,
      "content_type": "application/pdf",
      "size": 4096,
      "uploaded_at": "2026-01-15T10:30:00Z",
      "custom_metadata": {},
      "metadata_key": "_rag_input.my-database.acme.reports.rag-input-OjI6bXktZGF0YWJhc2U6YWNtZTpyZXBvcnRzOnExLnBkZg.v1"
    }
  ],
  "ok_count": 1,
  "error_count": 0
}
```

**Response (207):** at least one file failed validation or processing. Per-file
results report `status` as `ok` or `error`; error entries carry a `detail`
message.

```json
{
  "database": "my-database",
  "results": [
    {
      "name": "q1.pdf",
      "scope": ["acme", "reports"],
      "status": "ok",
      "id": "rag-input-OjI6bXktZGF0YWJhc2U6YWNtZTpyZXBvcnRzOnExLnBkZg",
      "version": 1,
      "custom_metadata": {}
    },
    {
      "name": "bad.pdf",
      "scope": ["bad value"],
      "status": "error",
      "detail": "scope labels may only contain letters, digits, hyphens, and underscores"
    }
  ],
  "ok_count": 1,
  "error_count": 1
}
```

An invalid **shared** `custom_metadata` map fails the whole request with `400`
before any file is stored. An invalid per-entry or merged map fails only the
file it belongs to and is reported in the `207` body.

**Errors:** `400` (no files, more than 100 files, a malformed `manifest`, an
unsupported `mapping` value, or an invalid shared `custom_metadata`),
`413` (combined size exceeds the 2 GiB limit), `422` (a required form field is
missing or a typed field is invalid), `500` (every file failed because of an
internal or storage error).

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
  "https://<EXTERNAL_ENDPOINT>:8529/_platform/filemanager/_db/my-database/rag-input?scope=acme&scope=legal&search=file" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

**Response (200):**

```json
{
  "files": [
    {
      "id": "rag-input-OjI6bXktZGF0YWJhc2U6YWNtZTpsZWdhbDpteS1maWxlLnBkZg",
      "name": "my-file.pdf",
      "database": "my-database",
      "scope": ["acme", "legal"],
      "content_type": "application/pdf",
      "storage_location": "file_manager:rag_inputs:my-database:rag-input-OjI6bXktZGF0YWJhc2U6YWNtZTpsZWdhbDpteS1maWxlLnBkZg:v2",
      "size": 102400,
      "uploaded_at": "2026-01-15T11:00:00Z",
      "version": 2,
      "safe_to_delete": true,
      "custom_metadata": {
        "citable_url": "https://example.com/doc"
      }
    }
  ],
  "total": 1,
  "limit": 100,
  "offset": 0
}
```

Results are ordered newest upload first, and `total` counts all matching
lineages before pagination is applied.

**Errors:** `400` (invalid scope), `422` (invalid pagination or another typed
query parameter), `500` (metadata listing failed)

---

### Get Version History

{{< endpoint "GET" "https://<EXTERNAL_ENDPOINT>:8529/_platform/filemanager/_db/{database}/rag-input/versions" >}}

Returns the full version history for a lineage, looked up by exact ordered scope
and name within the specified database. Versions are returned in descending
order.

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
  "scope": ["acme", "legal"],
  "versions": [
    {
      "version": 2,
      "metadata_key": "_rag_input.my-database.acme.legal.rag-input-OjI6bXktZGF0YWJhc2U6YWNtZTpsZWdhbDpteS1maWxlLnBkZg.v2"
    },
    {
      "version": 1,
      "metadata_key": "_rag_input.my-database.acme.legal.rag-input-OjI6bXktZGF0YWJhc2U6YWNtZTpsZWdhbDpteS1maWxlLnBkZg.v1"
    }
  ],
  "latest_version": 2
}
```

**Errors:** `400` (invalid scope), `404` (no version history found for the
lineage), `422` (`name` is missing or a typed query value is invalid),
`500` (version-index lookup failed)

---

### Browse Scopes

{{< endpoint "GET" "https://<EXTERNAL_ENDPOINT>:8529/_platform/filemanager/_db/{database}/rag-input/scopes" >}}

Lists the immediate child scopes under a given scope path, together with the
files located at exactly that scope. Use it to build a folder-style browser:
start with no `scope` parameter to browse the database root, then pass the path
of the child you want to descend into.

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
  "scope": ["acme"],
  "children": [
    {
      "segment": "legal",
      "file_count": 3
    },
    {
      "segment": "reports",
      "file_count": 2
    }
  ],
  "files": [
    {
      "id": "rag-input-OjE6bXktZGF0YWJhc2U6YWNtZTpyZWFkbWUucGRm",
      "name": "readme.pdf",
      "database": "my-database",
      "scope": ["acme"],
      "content_type": "application/pdf",
      "storage_location": "file_manager:rag_inputs:my-database:rag-input-OjE6bXktZGF0YWJhc2U6YWNtZTpyZWFkbWUucGRm:v1",
      "size": 2048,
      "uploaded_at": "2026-01-15T10:30:00Z",
      "version": 1,
      "safe_to_delete": true,
      "custom_metadata": {}
    }
  ]
}
```

Each `file_count` counts active lineages beneath that child recursively, not
versions. The `files` array contains only the latest version of each lineage.

Only scopes that currently contain at least one file are listed.

**Errors:** `400` (invalid scope), `422` (malformed typed query parameter),
`500` (registry or metadata lookup failed)

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
  "id": "rag-input-OjI6bXktZGF0YWJhc2U6YWNtZTpsZWdhbDpteS1maWxlLnBkZg",
  "name": "my-file.pdf",
  "database": "my-database",
  "scope": ["acme", "legal"],
  "content_type": "application/pdf",
  "storage_location": "file_manager:rag_inputs:my-database:rag-input-OjI6bXktZGF0YWJhc2U6YWNtZTpsZWdhbDpteS1maWxlLnBkZg:v2",
  "size": 102400,
  "uploaded_at": "2026-01-15T11:00:00Z",
  "version": 2,
  "safe_to_delete": true,
  "custom_metadata": {
    "author": "Ada",
    "citable_url": "https://example.com/doc"
  }
}
```

The scope is decoded from the `id`, so this endpoint takes no scope argument.
Requesting an explicit `version` returns that version's own `custom_metadata`,
which may differ from the latest version's map.

**Errors:** `404` (the id cannot be resolved or the selected version does not
exist), `422` (invalid `version`), `500` (metadata lookup failed).

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

**Response (200):** A binary stream whose `Content-Type` is the file's
stored/original MIME type, such as `application/pdf`. The generic OpenAPI
`application/octet-stream` schema does not force that response type.

**Errors:** `404` (the id or selected version does not exist), `422` (invalid
`version`), `500` (metadata or storage download failed)

---

### Lock or Unlock a File

{{< endpoint "PATCH" "https://<EXTERNAL_ENDPOINT>:8529/_platform/filemanager/_db/{database}/rag-input/{id}" >}}

Sets the `safe_to_delete` flag of a file. The flag is stored per version, and
this endpoint writes the given value to every version of the lineage.

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

**Response (200):** the flag was written to every version, and the latest
version's metadata is returned.

```json
{
  "id": "rag-input-OjI6bXktZGF0YWJhc2U6YWNtZTpsZWdhbDpteS1maWxlLnBkZg",
  "name": "my-file.pdf",
  "database": "my-database",
  "scope": ["acme", "legal"],
  "content_type": "application/pdf",
  "storage_location": "file_manager:rag_inputs:my-database:rag-input-OjI6bXktZGF0YWJhc2U6YWNtZTpsZWdhbDpteS1maWxlLnBkZg:v2",
  "size": 102400,
  "uploaded_at": "2026-01-15T11:00:00Z",
  "version": 2,
  "safe_to_delete": false,
  "custom_metadata": {
    "citable_url": "https://example.com/doc"
  }
}
```

**Errors:** `404` (the id is invalid or the lineage does not exist),
`422` (the body is missing or `safe_to_delete` is invalid),
`500` (metadata update failed)

---

### Lock or Unlock Multiple Files

{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/_platform/filemanager/_db/{database}/rag-input/safe-to-delete" >}}

Sets the `safe_to_delete` flag of up to 100 files in one request. Each id
writes the given value to every version of that lineage.

**Path parameters:**

| Parameter | Description |
|-----------|-------------|
| `database` | The database name. |

**Request body:**

```json
{
  "ids": [
    "rag-input-OjI6bXktZGF0YWJhc2U6YWNtZTpyZXBvcnRzOnExLnBkZg",
    "rag-input-OjI6bXktZGF0YWJhc2U6YWNtZTpyZXBvcnRzOnEyLnBkZg"
  ],
  "safe_to_delete": false
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ids` | array of strings | Yes | File ids. Between 1 and 100 entries. |
| `safe_to_delete` | boolean | Yes | `false` locks the files, `true` unlocks them. |

Ids are processed in request order and the `results` array follows that order.
Each result reports a `status` of `updated`, `not_found`, or `error`.

**Response (200):** every lineage updated.

```json
{
  "database": "my-database",
  "results": [
    {"id": "rag-input-OjI6bXktZGF0YWJhc2U6YWNtZTpyZXBvcnRzOnExLnBkZg", "status": "updated"},
    {"id": "rag-input-OjI6bXktZGF0YWJhc2U6YWNtZTpyZXBvcnRzOnEyLnBkZg", "status": "updated"}
  ],
  "updated_count": 2,
  "error_count": 0
}
```

**Response (207):** at least one id was `not_found` or returned `error`.

```json
{
  "database": "my-database",
  "results": [
    {"id": "rag-input-OjI6bXktZGF0YWJhc2U6YWNtZTpyZXBvcnRzOnExLnBkZg", "status": "updated"},
    {"id": "rag-input-OjI6bXktZGF0YWJhc2U6YWNtZTpyZXBvcnRzOm1pc3NpbmcucGRm", "status": "not_found"}
  ],
  "updated_count": 1,
  "error_count": 1
}
```

**Errors:** `422` (malformed body, empty `ids`, or more than 100 ids),
`500` (the bulk update failed before per-id results could be produced)

---

### Lock or Unlock a Scope

{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/_platform/filemanager/_db/{database}/rag-input/safe-to-delete-scope" >}}

Sets the `safe_to_delete` flag of every file at a scope **and below it**,
including every version of each of these files.

**Path parameters:**

| Parameter | Description |
|-----------|-------------|
| `database` | The database name. |

**Request body:**

```json
{
  "scope": ["acme", "legal"],
  "safe_to_delete": false
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `scope` | array of strings | Yes | The scope subtree to update. Must not be empty. |
| `safe_to_delete` | boolean | Yes | `false` locks the files, `true` unlocks them. |

**Response (200):** every matched lineage updated. A scope that matches no files
also returns `200`, with empty `updated` and `failed` arrays.

```json
{
  "database": "my-database",
  "scope": ["acme", "legal"],
  "updated": ["rag-input-OjI6bXktZGF0YWJhc2U6YWNtZTpsZWdhbDpteS1maWxlLnBkZg"],
  "failed": [],
  "updated_count": 1
}
```

**Response (207):** at least one matched lineage could not be updated.

```json
{
  "database": "my-database",
  "scope": ["acme", "legal"],
  "updated": ["rag-input-OjI6bXktZGF0YWJhc2U6YWNtZTpsZWdhbDpteS1maWxlLnBkZg"],
  "failed": ["rag-input-OjI6bXktZGF0YWJhc2U6YWNtZTpsZWdhbDpmYWlsZWQucGRm"],
  "updated_count": 1
}
```

**Errors:** `400` (the scope is empty or exceeds the combined 256-character
limit), `422` (the body or an individual scope label violates its schema),
`500` (scope resolution or the bulk update failed)

---

### Delete a RAG Input File Version

{{< endpoint "DELETE" "https://<EXTERNAL_ENDPOINT>:8529/_platform/filemanager/_db/{database}/rag-input/{id}" >}}

Deletes a single RAG input file version and its metadata. Defaults to the latest
version unless a specific version is given. Deletion is only permitted when the
`safe_to_delete` flag **of the selected version** is `true`. The flags of the
other versions of the lineage are not considered.

This differs from [Delete Multiple Files](#delete-multiple-files) and
[Delete a Scope](#delete-a-scope), which remove entire lineages. The scope is
decoded from the `id`.

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
  "id": "rag-input-OjI6bXktZGF0YWJhc2U6YWNtZTpsZWdhbDpteS1maWxlLnBkZg",
  "database": "my-database",
  "status": "deleted"
}
```

**Errors:** `404` (not found), `422` (invalid `version`), `423` (the selected
version is locked, not safe to delete), `500` (server error)

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
  "ids": [
    "rag-input-OjI6bXktZGF0YWJhc2U6YWNtZTpyZXBvcnRzOnExLnBkZg",
    "rag-input-OjI6bXktZGF0YWJhc2U6YWNtZTpyZXBvcnRzOnEyLnBkZg"
  ]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ids` | array of strings | Yes | File ids. Between 1 and 100 entries. |

Ids are processed in request order and the `results` array follows that order.
Each result reports a `status` of `deleted`, `locked`, `not_found`, or `error`.
Entries that did not succeed may also carry a `detail` string.

**Response (200):** every requested lineage and all of its versions deleted.

```json
{
  "database": "my-database",
  "results": [
    {"id": "rag-input-OjI6bXktZGF0YWJhc2U6YWNtZTpyZXBvcnRzOnExLnBkZg", "status": "deleted"},
    {"id": "rag-input-OjI6bXktZGF0YWJhc2U6YWNtZTpyZXBvcnRzOnEyLnBkZg", "status": "deleted"}
  ],
  "deleted_count": 2,
  "locked_count": 0,
  "error_count": 0
}
```

**Response (207):** at least one result was `locked`, `not_found`, or `error`.

```json
{
  "database": "my-database",
  "results": [
    {"id": "rag-input-OjI6bXktZGF0YWJhc2U6YWNtZTpyZXBvcnRzOnExLnBkZg", "status": "deleted"},
    {"id": "rag-input-OjI6bXktZGF0YWJhc2U6YWNtZTpyZXBvcnRzOmxvY2tlZC5wZGY", "status": "locked", "detail": "safe_to_delete is false"}
  ],
  "deleted_count": 1,
  "locked_count": 1,
  "error_count": 0
}
```

**Errors:** `422` (malformed body, empty `ids`, or more than 100 ids),
`500` (the bulk deletion failed before per-id results could be produced)

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
  "scope": ["acme", "legal"]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `scope` | array of strings | Yes | The scope subtree to delete. Must not be empty. |

**Response (200):** every matched lineage deleted. A scope that matches no files
also returns `200`, with empty `deleted`, `locked`, and `failed` arrays and zero
counts.

```json
{
  "database": "my-database",
  "scope": ["acme", "legal"],
  "deleted": ["rag-input-OjI6bXktZGF0YWJhc2U6YWNtZTpsZWdhbDpteS1maWxlLnBkZg"],
  "locked": [],
  "failed": [],
  "deleted_count": 1,
  "locked_count": 0
}
```

**Response (207):** at least one matched lineage was locked or failed.

```json
{
  "database": "my-database",
  "scope": ["acme", "legal"],
  "deleted": ["rag-input-OjI6bXktZGF0YWJhc2U6YWNtZTpsZWdhbDpteS1maWxlLnBkZg"],
  "locked": ["rag-input-OjI6bXktZGF0YWJhc2U6YWNtZTpsZWdhbDpsb2NrZWQucGRm"],
  "failed": [],
  "deleted_count": 1,
  "locked_count": 1
}
```

**Errors:** `400` (the scope is empty or exceeds the combined 256-character
limit), `422` (the body or an individual scope label violates its schema),
`500` (scope resolution or the bulk deletion failed)

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
