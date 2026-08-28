---
title: Verify and Monitor the Retriever
menuTitle: Verify and Monitor
description: >-
  Check service health, verify the status of your Retriever service, and browse
  the query history of your project
weight: 50
---
{{< info >}}
**Getting Started Path:** [Overview](./) → [Configure LLMs](llm-configuration.md) → [Search Methods](search-methods/_index.md) → [Execute Queries](executing-queries.md) → **Verify**
{{< /info >}}

{{< info >}}
Every endpoint on this page needs an `Authorization: Bearer <token>` header, the
health endpoint included. A request without one is rejected with `401`.
{{< /info >}}

## Health Check

You can monitor the Retriever service health using the health endpoint:

{{< endpoint "GET" "https://<EXTERNAL_ENDPOINT>:8529/graphrag/retriever/{serviceIdPostfix}/v1/health" >}}

```bash
curl https://<EXTERNAL_ENDPOINT>:8529/graphrag/retriever/<SERVICE_ID_POSTFIX>/v1/health \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Example response:**

```json
{
  "status": "OK",
  "message": "Service is healthy"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | `"OK"` when the service is healthy |
| `message` | string | Detail about the status, usually the text `"Service is healthy"`. Some deployments return a JSON document here instead, so do not assume the value is prose. |

## Verify Service Status

You can verify the state of the Retriever service via the project endpoint:

{{< endpoint "GET" "https://<EXTERNAL_ENDPOINT>:8529/_platform/acp/v1/project_by_name/{project_name}" >}}

For example, the `status` object found within `retrieverServices` may contain the following
properties:

```json
"status": {
    "status": "service_started",
    "progress": 100
}
```

## Query History

Every query is saved automatically as a **run**, so you can browse past queries,
inspect the parameters and responses they used, and delete entries you no longer
need.

Runs are scoped to the project database, which means everyone querying the same
project shares one history. The Retriever returns the identifier of the run as
`runId` in every query response, including the first and last chunk of a
streaming response.

### Run lifecycle

| Status | Meaning |
|--------|---------|
| `streaming` | The query is in progress and the response is not final yet. |
| `complete` | The query finished successfully; response and duration are recorded. |
| `error` | The query failed; the `error` field holds the failure reason. |

Runs that stay in `streaming` status beyond a configurable timeout are marked as
`error` automatically by a background job that detects abandoned queries.

### List runs

{{< endpoint "GET" "https://<EXTERNAL_ENDPOINT>:8529/graphrag/retriever/{serviceIdPostfix}/v1/retriever-runs" >}}

Returns the runs of the project, newest first. Deleted runs are excluded.

**Query parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | integer | No | `0` | Maximum number of runs to return. `0` means no limit. |

{{< warning >}}
There is no server-side maximum and no pagination: with `limit` omitted or set
to `0`, the response contains every run of the project. Since each query adds a
run, pass an explicit `limit` on projects with a long history.
{{< /warning >}}

**Example response:**

```json
{
  "runs": [
    {
      "runId": "a1b2c3d4-...",
      "query": "What is the main theme?",
      "response": "The main theme is...",
      "queryType": "UNIFIED",
      "model": "gpt-5.4-nano",
      "status": "complete",
      "durationMs": 3420,
      "configSnapshot": "{\"query_type\":\"UNIFIED\",\"level\":2}",
      "createdAt": "2026-07-19T10:30:00Z",
      "updatedAt": "2026-07-19T10:30:03Z"
    }
  ]
}
```

### Get a single run

{{< endpoint "GET" "https://<EXTERNAL_ENDPOINT>:8529/graphrag/retriever/{serviceIdPostfix}/v1/retriever-runs/{run_id}" >}}

Returns one run, in the same shape as the items of the list response. Returns
`404` if the run does not exist or has been deleted.

### Delete a run

{{< endpoint "DELETE" "https://<EXTERNAL_ENDPOINT>:8529/graphrag/retriever/{serviceIdPostfix}/v1/retriever-runs/{run_id}" >}}

**Example response:**

```json
{
  "success": true
}
```

Deleting a run that does not exist, or that you already deleted, is not an
error: the call returns HTTP `200` with `success: false`. Check the `success`
field rather than the status code to find out whether anything was deleted.

{{< info >}}
Deletion is a soft delete. The run stops appearing in list and get responses,
but the underlying document is kept in ArangoDB with a `deleted_at` timestamp so
that other services can still consume the history.
{{< /info >}}

### Run fields

| Field | Type | Description |
|-------|------|-------------|
| `runId` | string | Unique identifier of the run, also returned by the query itself. |
| `query` | string | The original query text. |
| `response` | string | The generated response, empty while streaming. |
| `metadata` | string | Response metadata JSON, when `include_metadata` was `true`. |
| `queryType` | string | `GLOBAL`, `LOCAL`, `UNIFIED`, or `CUSTOM`. |
| `model` | string | The chat model used for this query. |
| `retrieverServiceId` | string | Identifier of the Retriever service instance. |
| `status` | string | `streaming`, `complete`, or `error`. |
| `error` | string | Error message, populated only when `status` is `error`. |
| `durationMs` | integer | Total query duration in milliseconds. |
| `configSnapshot` | string | JSON string of the query parameters recorded for the run: `mode`, `query_type`, `level`, `use_llm_planner`, `show_citations`, `use_cache`, `include_metadata`, `response_instructions`, `partition_ids`, `custom_prompts`, `custom_tools`, and `auto_create_indexes`. It does not record `model` or `auto_select_partitions`, and it stores `auto_create_indexes` as `false` when the request omitted it, even though the query itself defaults to creating indexes. |
| `createdAt` | string | ISO 8601 timestamp of when the run started. |
| `updatedAt` | string | ISO 8601 timestamp of the last update. |

## Next Steps

- **[Execute queries](executing-queries.md)**: Start querying your knowledge graph.
- **[Explore all parameters](parameters.md)**: Customize your queries.
- **[Learn about search methods](search-methods/_index.md)**: Understand when to use each search type.
