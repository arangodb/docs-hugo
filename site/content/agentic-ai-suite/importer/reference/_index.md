---
title: Importer Service Reference
menuTitle: Reference
weight: 100
description: >-
  Importer HTTP API endpoints, authentication, and recommended call sequence
---

This section documents the Importer HTTP API. All endpoints require
JWT authentication and are served on port `8080`. For the underlying
collections and the async-job lifecycle, see [Architecture](../architecture.md).

## Authentication

All endpoints require a **JWT** in the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

The service handles token renewal automatically for long-running imports.
Read-only endpoints (`GET /v1/jobs` and `GET /v1/jobs/{job_id}`) validate the
token without renewing it.

### Synchronous HTTP errors

These status codes apply to the immediate HTTP response of an API call:

| Condition | HTTP |
|-----------|------|
| Missing or malformed `Authorization` header | `401` |
| Token rejected | `401` |
| Database access denied after auth | `403` |
| Invalid `rag_mode`, `partition_id`, vector params, or missing `file_name` | `400` |
| Unexpected server fault | `500` |

Many **business** failures (busy importer, multi-file validation) return
`HTTP 200` with `"success": false` in the JSON body. See
[Error Handling](error-handling.md) for the full table.

## Endpoints

Endpoints are served at **`http://<host>:8080`**.

| Method | Path | Description | Details |
|--------|------|-------------|---------|
| `GET` | `/v1/health` | Check service readiness | [Import Files](../importing-files.md#health-check) |
| `POST` | `/v1/import` | Import a single file | [Import Files](../importing-files.md#single-file-import) |
| `POST` | `/v1/import-multiple` | Import a batch of files | [Import Files](../importing-files.md#multi-file-import) |
| `GET` | `/v1/jobs/{job_id}` | Get the status of a multi-file import job | [Import Files](../importing-files.md#monitoring-jobs) |
| `GET` | `/v1/jobs` | List recent multi-file import jobs | [Import Files](../importing-files.md#monitoring-jobs) |

## Recommended call sequence

### Standalone single file

1. `GET /v1/health` - confirm the service is ready.
2. `POST /v1/import` - submit the file. Returns `success: true` and starts
   processing in the background. **No `job_id` is returned**.
3. Monitor via the **platform service status** until the status reaches
   `service_completed` or a terminal failure status.
4. Query ArangoDB or call the [Retriever](../../retriever/) against the
   resulting knowledge graph.

### Standalone batch

1. `GET /v1/health`
2. `POST /v1/import-multiple` - save the returned `job_id`.
3. Poll `GET /v1/jobs/{job_id}` (for example, every 10-30 seconds) until
   `is_terminal` is `true`.
4. On `service_completed`, verify the graph; on failure, read
   `current_status.message` and consult [Error Handling](error-handling.md).

### Via AutoGraph

When AutoGraph drives the pipeline, you do **not** call the Importer
directly. AutoGraph orchestration submits one import per partition, sets
`partition_id` from the corpus build, and sets `rag_mode` from the RAG
Strategizer's assignment. Monitor via the AutoGraph orchestration status and
the platform service status. See
[AutoGraph Integration](../autograph-integration.md).

## Related references

- **[Parameters](parameters.md)**: Complete request parameter reference.
- **[Error Handling](error-handling.md)**: Troubleshooting, known
  limitations, and error markers in job status messages.
- **[API Reference](https://apiref.arango.ai/#graphrag_importer)**: Full
  machine-readable API reference.
