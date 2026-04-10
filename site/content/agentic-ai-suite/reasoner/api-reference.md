---
title: Reasoner API Reference
menuTitle: API Reference
weight: 20
description: >-
  Use the Reasoner programmatically via its HTTP API, with support for
  streaming (SSE) and non-streaming response modes
---

The Reasoner exposes an HTTP API for programmatic access. All requests are sent
to `POST /query`. The service supports two response modes: streaming and
non-streaming.

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
| Speedup        | —        | 9.25× faster |

### What Changed
- Added a composite index hint on `status` and `created_at` to avoid a full
  collection scan.
- The SORT on `created_at DESC` is now served directly by the index, eliminating
  a separate in-memory sort step.

### Why It's Faster
- The original query performed a full scan of all documents in the `users`
  collection before filtering by status. With the composite index, only documents
  matching `status == 'active'` are read, already in the correct sort order —
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

**General query — request:**

```json
{
  "request": "List all the collections in database User",
  "stream": true
}
```

**Example SSE stream — general query:**

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

**Optimization query — request:**

```json
{
  "request": "Optimize this query: FOR u IN users FILTER u.status == 'active' SORT u.created_at DESC RETURN u",
  "stream": true
}
```

**Example SSE stream — optimization query:**

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
  "result": "The database contains 2 named graphs:\n\n- **social_network** — vertices: `users`, edges: `friendships`\n- **supply_chain** — vertices: `products`, `warehouses`, edges: `shipments`"
}
```

## `POST /query` — request parameters

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `request` | string | Yes | — | The user question or query to optimize |
| `stream` | boolean | No | `true` | `true` returns an SSE stream; `false` returns a JSON response after completion |

## HTTP status codes

| Code | Description |
|---|---|
| `200` | Request completed successfully |
| `500` | Processing failed — the error detail includes the phase during which the failure occurred |

## When validation does not pass

Each `validation` SSE event includes a `reason` field that explains why an
attempt did not pass. Common scenarios:

| Symptom | Likely Cause |
|---|---|
| `rows_match: false` | The rewritten query returns a different number of results; the optimization may have altered the query's logic |
| `content_match: false` | Row counts match but the content did not |
| `improvement_pct` below threshold | The optimization is valid but the improvement is less than the minimum required (5%); the Reasoner retries with a different approach |

## Health and monitoring

The Reasoner exposes three health endpoints for use with Kubernetes probes and
operational monitoring.

| Endpoint | Purpose | Kubernetes Probe |
|---|---|---|
| `GET /health` | Liveness check — confirms the service process is running | Liveness probe |
| `GET /health/ready` | Readiness check — verifies connectivity to the AI coder and the MCP server | Readiness probe |
| `GET /health/mcp` | Detailed MCP server connectivity status | Diagnostic / monitoring |

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
