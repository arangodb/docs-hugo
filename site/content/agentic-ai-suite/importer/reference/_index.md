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

{{< info >}}
**Field names are lowerCamelCase over HTTP.** This reference uses the
protobuf field names, such as `partition_id` or `job_id`. The REST gateway
emits the JSON names instead, so an actual response carries `partitionId` and
`jobId`. Convert accordingly when you read a response or build a request body.
{{< /info >}}

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
| `POST /v1/recluster` while the import lock is held | `503` |

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
| `POST` | `/v1/recluster` | Rebuild the community layer of one partition | [Incremental Updates](../incremental-updates.md#reclustering) |
| `GET` | `/v1/jobs/{job_id}` | Get the status of a multi-file import or recluster job | [Import Files](../importing-files.md#monitoring-jobs) |
| `GET` | `/v1/jobs` | List recent jobs | [Import Files](../importing-files.md#monitoring-jobs) |

{{< info >}}
A replica can only run one import or recluster job at a time, under a single
global lock that is not keyed by partition. While one job holds the lock, calls
to the other endpoints are rejected. How they are rejected depends on the
endpoint you call. The import endpoints return `HTTP 200` with
`"success": false`, whereas `/v1/recluster` returns `HTTP 503` (gRPC
`UNAVAILABLE`). See
[Concurrency](../architecture.md#asynchronous-import-lifecycle).

There is no endpoint for deleting or updating a document. AutoGraph removes and
replaces documents across all three layers. See
[Deleting a document](../incremental-updates.md#deleting-a-document) and
[Updating a document](../incremental-updates.md#updating-a-document).
{{< /info >}}

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

### Reclustering

1. Call `POST /v1/recluster` and save the returned `job_id`.
2. Poll `GET /v1/jobs/{job_id}` until `is_terminal` is `true`.

See [Incremental Updates](../incremental-updates.md) for the request fields,
what the operation rebuilds, and how to troubleshoot problems. To remove or
replace a document, use AutoGraph's
[`POST /v1/graph/delete`](../../autograph/reference/orchestration.md#delete-documents)
or
[`POST /v1/graph/update`](../../autograph/reference/orchestration.md#update-documents).

## Related references

- **[Incremental Updates](../incremental-updates.md)**: Reclustering, and how
  documents are removed and replaced in Layer 3.
- **[Parameters](parameters.md)**: Complete request parameter reference.
- **[Error Handling](error-handling.md)**: Troubleshooting, known
  limitations, and error markers in job status messages.
- **[Limits and Quotas](limits.md)**: Concurrency, size, timeout, and provider
  limits, and which of them are configurable.
- **[API Reference](https://apiref.arango.ai/#graphrag_importer)**: Full
  machine-readable API reference.
