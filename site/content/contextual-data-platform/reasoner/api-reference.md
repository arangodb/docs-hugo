---
title: Reasoner API Reference
menuTitle: API Reference
weight: 20
description: >-
  Use the Reasoner programmatically via its HTTP API to optimize queries and
  generate AQL from natural language, with streaming (SSE) and non-streaming
  response modes
---
{{< tag "Agentic AI Suite" "Beta" >}}

The Reasoner exposes an HTTP API for programmatic access. The service listens on
port `8080`, so the base URL is `https://<EXTERNAL_ENDPOINT>:8080` (or
`http://localhost:8080` when accessed locally). The Reasoner provides two main
endpoints:

- `POST /query` for database exploration and query optimization, for example
  `POST https://<EXTERNAL_ENDPOINT>:8080/query`.
- `POST /txt2aql` for answering a natural-language question with a generated
  AQL query, its results, and a short answer. See [Text-to-AQL](#text-to-aql).

Both endpoints support two response modes: streaming and non-streaming.

## Optimization example

The following example shows how to submit an optimization request via the web
interface and the API.

{{< tabs "optimization-example" >}}

{{< tab "Web Interface" >}}

In the Reasoner panel, type your optimization request in plain text, for
example:

```
Optimize this query: FOR u IN users FILTER u.status == 'active' SORT u.created_at DESC RETURN u
```

Press {{< kbd "Enter" >}} to send. The Reasoner returns an **AI Reasoning
Response** with the optimization report.

{{< /tab >}}

{{< tab "API" >}}

Send a `POST /query` request with the query in the `request` field:

```json
{
  "request": "Optimize this query: FOR u IN users FILTER u.status == 'active' SORT u.created_at DESC RETURN u",
  "stream": true
}
```

{{< /tab >}}

{{< /tabs >}}

**Optimization report:**

````markdown
## Optimization Summary

### Performance Comparison
| Metric         | Original | Optimized    |
|----------------|----------|--------------|
| Execution time | 0.842s   | 0.091s       |
| Rows returned  | 1,247    | 1,247        |
| Peak memory    | 8.2 MB   | 1.1 MB       |
| Speedup        | -        | 9.25× faster |

### What Changed
- Added a composite index hint on `status` and `created_at` to avoid a full
  collection scan.
- The SORT on `created_at DESC` is now served directly by the index, eliminating
  a separate in-memory sort step.

### Why It's Faster
- The original query performed a full scan of all documents in the `users`
  collection before filtering by status. With the composite index, only documents
  matching `status == 'active'` are read, already in the correct sort order -
  reducing both execution time and memory usage significantly.

### Final Optimized Query
```aql
FOR u IN users
  OPTIONS { indexHint: "status_created_at", forceIndexHint: true }
  FILTER u.status == "active"
  SORT u.created_at DESC
  RETURN u
```
````

## Streaming mode (recommended)

Streaming mode returns results progressively as the Reasoner works through each
phase. Events are delivered over a persistent Server-Sent Events (SSE)
connection, allowing the client to display progress in real time.

> **Note:** Streaming is only available via the API.

**General query - request:**

```json
{
  "request": "List all the collections in database User",
  "stream": true
}
```

**Example SSE stream - general query:**

```
event: phase
data: {"phase": "executing"}

event: tool_call
data: {"tool": "list-collections", "input": {}, "status": "pending"}

event: tool_result
data: {"tool": "list-collections", "result": "[\"users\", \"orders\", \"products\"]"}

event: text
data: {"content": "The database contains 3 collections: **users**, **orders**, and **products**."}

event: done
data: {"synthesized": false}
```

**Optimization query - request:**

```json
{
  "request": "Optimize this query: FOR u IN users FILTER u.status == 'active' SORT u.created_at DESC RETURN u",
  "stream": true
}
```

**Example SSE stream - optimization query:**

```
event: phase
data: {"phase": "executing"}

event: phase
data: {"phase": "validating"}

event: validation
data: {"passed": true, "original_time": 0.842, "optimized_time": 0.091, "improvement_pct": 89.2, "rows_match": true, "content_match": true, "reason": "Optimization valid: execution time reduced by 89.2%, rows match (1247=1247), content verified (hash match)"}

event: phase
data: {"phase": "synthesizing"}

event: done
data: {"synthesized": true, "result": "## Optimization Summary\n\n### Performance Comparison\n| Metric | Original | Optimized |\n..."}
```

## Non-streaming mode

Non-streaming mode waits for the complete result before responding. This is
suited for server-to-server integrations where a single JSON response is
preferred.

**Request:**

```json
{
  "request": "List all graphs in the database",
  "stream": false
}
```

**Response:**

```json
{
  "result": "The database contains 2 named graphs:\n\n- **social_network** - vertices: `users`, edges: `friendships`\n- **supply_chain** - vertices: `products`, `warehouses`, edges: `shipments`"
}
```

## `POST /query` - request parameters

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `request` | string | Yes | - | The user question or query to optimize |
| `stream` | boolean | No | `true` | `true` returns an SSE stream; `false` returns a JSON response after completion |

## HTTP status codes

| Code | Description |
|---|---|
| `200` | Request completed successfully |
| `500` | Processing failed - the error detail includes the phase during which the failure occurred |

## When validation does not pass

Each `validation` SSE event includes a `reason` field that explains why an
attempt did not pass. Common scenarios:

| Symptom | Likely Cause |
|---|---|
| `rows_match: false` | The rewritten query returns a different number of results; the optimization may have altered the query's logic |
| `content_match: false` | Row counts match but the content did not |
| `improvement_pct` below threshold | The optimization is valid but the improvement is less than the minimum required (5%); the Reasoner retries with a different approach |

## Text-to-AQL

The `POST /txt2aql` endpoint accepts a question in natural language and
returns a generated AQL query, the rows it returned, and a short answer in
natural language.

Every request requires a valid JWT in the `Authorization: Bearer <token>`
header. The Reasoner uses this token for all database access during the
request, including the template lookup and the generated query, so it is
subject to your permissions in the database.

### How a request is processed

1. The Reasoner looks up saved query templates in the `Tools` collection.
2. If the best matching template has a score of at least `0.85`, the Reasoner
   adapts it to your question, mainly by filling in its bind parameters, and
   runs it.
3. If no template scores that high, or filling in the template does not
   succeed, the Reasoner writes a new query. Any templates it found are used
   as examples. If the filled-in template writes data, or saving it as a
   template fails, the request ends with an error instead.

A query that writes data, for example with `INSERT`, `UPDATE`, `REPLACE`,
`UPSERT`, or `REMOVE`, is rejected before it runs.

### `POST /txt2aql` - request parameters

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `query` | string | Yes | - | The question in natural language |
| `stream` | boolean | No | `false` | `true` returns an SSE stream; `false` returns a JSON response after completion |
| `add_template` | boolean | No | `false` | `true` saves the query as a template in the `Tools` collection after it runs, and sets `added_template_id` in the response |

Note that the default for `stream` is `false`, unlike for `POST /query`.

### Non-streaming response

**Request:**

```bash
curl -X POST https://<EXTERNAL_ENDPOINT>:8080/txt2aql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"query": "What are the top 5 performing stores based on revenue?", "stream": false, "add_template": false}'
```

**Response:**

```json
{
  "aql": "FOR s IN stores SORT s.revenue DESC LIMIT 5 RETURN { name: s.name, revenue: s.revenue }",
  "json": [
    {"name": "North", "revenue": 1250000},
    {"name": "Central", "revenue": 1180000},
    {"name": "East", "revenue": 970000},
    {"name": "West", "revenue": 940000},
    {"name": "South", "revenue": 880000}
  ],
  "nl": "The top 5 stores by revenue are North (1,250,000), Central (1,180,000), East (970,000), West (940,000), and South (880,000). This answer is based on 5 rows.",
  "error": null,
  "added_template_id": null
}
```

The language model writes the `nl` answer, so its wording varies.

| Field | Type | Description |
|---|---|---|
| `aql` | string | The generated AQL query |
| `json` | array of objects | The rows returned by the query, at most 50 |
| `nl` | string | The answer in natural language |
| `error` | string or null | Set when no answer is produced |
| `added_template_id` | string or null | The ID of the saved template in the `Tools` collection, set when `add_template` is `true` |

### Streaming response

With `"stream": true`, the endpoint returns a Server-Sent Events (SSE) stream
in the same format as `POST /query`, with the following events:

| Event | Description |
|---|---|
| `phase` | The processing phase changed (`executing`) |
| `text` | Partial text from the language model |
| `tool_call` | A database tool was called |
| `tool_result` | A database tool returned a result |
| `done` | The final result: `aql`, `json`, `nl`, `error` (`null`), and `added_template_id` |
| `error` | Generation or execution failed; the data includes `message` and `error` |

If no event is sent for 5 seconds, the stream sends an SSE comment
(`: heartbeat`) to keep the connection open. Standard SSE clients ignore
comments.

If the client closes the connection, the Reasoner stops processing the request.

### Row limit

The response contains at most 50 rows. The `nl` answer ends by stating how
many rows it is based on. If the query finds more than 50 rows, `json` holds
the first 50 and `nl` states that the answer is based on only the first 50
rows.

For questions that match many documents, ask for a count, a total, or a top N
instead of the full list.

### Errors and empty results

If no answer can be produced, the request still succeeds with HTTP status
`200`. In non-streaming mode, the response has `error` set and `aql`, `json`,
and `nl` empty. In streaming mode, the stream ends with an `error` event with
the same fields.

| Code | Description |
|---|---|
| `200` | The request completed, with an answer or with `error` set |
| `401` | The `Authorization` header is missing or does not use the Bearer scheme, or the token is invalid or expired |
| `422` | The request body is invalid, for example `query` is empty |
| `500` | An unexpected failure occurred. In streaming mode, failures during processing are reported as an `error` event instead |
| `503` | The authentication service is unavailable |

| `error` | Meaning |
|---|---|
| `Can not generate AQL` | Text-to-AQL is not available because no MCP server is configured |
| `Can not add template` | `add_template` was `true` but the query could not be saved, for example because you don't have write access to the `Tools` collection |
| `Can not change data: text-to-AQL only reads` | The question asks to add, change, or delete data |
| `Query contains write operation '<OPERATION>'`, followed by a snippet of the query | The query would modify data, so it did not run |
| `I can only answer questions about the data in this database.` | The question is not about the data in the database |

Two cases return no rows without an error:

- If the database has no data for what the question asks for, `aql` and `json`
  are empty and `nl` explains what is missing.
- If the query runs but finds nothing, `aql` contains the query, `json` is
  empty, and `nl` is `The query found no matching data.`

### Save queries as templates

Set `add_template` to `true` to save the query as a template in the `Tools`
collection, so that the Reasoner can reuse it for similar questions. This
requires write access to the `Tools` collection.

Templates help in two ways:

- When a question closely matches a saved template, the Reasoner adapts the
  template to the question, mainly by filling in its bind parameters. This
  takes fewer steps than writing a new query, where the Reasoner first samples
  the collections and, if needed, looks up values in the database.
- When no template matches closely enough, the most similar templates still
  serve as examples for writing the new query.

The template is saved with your question as its description, and new
questions are matched against these descriptions. The `Tools` collection is
created if it doesn't exist. If the same query with the same bind parameters
is already saved, `added_template_id` is the ID of the existing template.

If saving fails, the request ends with the `Can not add template` error. If no
query is generated, for example because the database has no data for the
question, nothing is saved and `added_template_id` is `null`.

Templates require an embedding API key to be configured for the service.
Without it, the Reasoner always writes a new query, and saving new templates
fails with the `Can not add template` error.

The Reasoner and MCP endpoints don't let you list or delete saved templates.
To manage them, query the `Tools` collection directly, for example with AQL.

## Health and monitoring

The Reasoner exposes three health endpoints for use with Kubernetes probes and
operational monitoring.

| Endpoint | Purpose | Kubernetes Probe |
|---|---|---|
| `GET /health` | Liveness check - confirms the service process is running | Liveness probe |
| `GET /health/ready` | Readiness check - verifies connectivity to the AI coder and the internal MCP server | Readiness probe |
| `GET /health/mcp` | Detailed connectivity status of the internal MCP server | Diagnostic / monitoring |

### Liveness check

Returns `healthy` whenever the service process is running, regardless of
downstream connectivity.

```bash
curl http://localhost:8080/health
```

```json
{
  "status": "healthy",
  "version": "1.0.0",
  "environment": "production"
}
```

### Readiness check

Verifies that the AI coder is reachable and reports MCP server connectivity.
The service is considered ready when the AI coder is available; MCP server
status is reported for visibility.

```bash
curl http://localhost:8080/health/ready
```

```json
{
  "ready": true,
  "checks": {
    "opencode": {
      "status": "healthy",
      "url": "http://localhost:4099"
    },
    "mcp_servers": {
      "status": "available",
      "details": {
        "arangodb": { "status": "connected" }
      }
    }
  }
}
```

### MCP connectivity check

Returns detailed status for all registered MCP servers.

```bash
curl http://localhost:8080/health/mcp
```

```json
{
  "status": "healthy",
  "servers": {
    "arangodb": { "status": "connected" }
  },
  "connected_servers": ["arangodb"],
  "timestamp": "2026-03-27T10:30:00.000Z"
}
```

**Possible status values:**

| Status | Meaning |
|---|---|
| `healthy` | The registered MCP server is connected |
| `degraded` | The registered MCP server is not connected |
| `unhealthy` | No MCP servers are configured |
| `error` | AI coder could not be reached to retrieve MCP status |
