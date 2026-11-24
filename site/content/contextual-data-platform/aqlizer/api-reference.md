---
title: AQLizer API Reference
menuTitle: API Reference
weight: 20
description: >-
  Generate AQL queries from questions in natural language and optimize AQL
  queries with the AQLizer HTTP API
---
{{< tag "Agentic AI Suite" "Beta" >}}

`POST /txt2aql` turns a question in natural language into an AQL query and
answers it. `POST /query` optimizes an AQL query. For how the AQLizer reasons
about your database to do this, see [AQLizer](_index.md). For a step-by-step
guide, see the [Quick Start](quick-start.md).

The endpoints are relative to the path of the AQLizer service of a database,
`https://<EXTERNAL_ENDPOINT>:8529/reasoner/{service_id_postfix}`. The path
starts with `/reasoner/` because the service was previously called the
Reasoner. `service_id_postfix` is the end of the service ID, such as `mxsli`
for `arangodb-reasoner-mxsli`. The **Manage services** dialog of the
[Query Editor](web-interface.md#manage-services) shows it as the
**Service ID**. The endpoints have no version prefix such as `/v1`.

Every endpoint except the health checks requires a JWT in the
`Authorization: Bearer <token>` header. The AQLizer uses this token for all
database access during the request, so queries are subject to your permissions
in the database.

| Endpoint | Operation | Purpose | Call |
|----------|-----------|---------|------|
| [`POST /txt2aql`](#generate-a-query) | Generate | Turn a question into an AQL query, run it, and answer the question | Synchronous or streamed |
| [`POST /query`](#optimize-a-query) | Optimize | Make an AQL query faster, with results verified to match | Synchronous or streamed |
| [`POST /query/permission`](#approve-or-reject-a-tool-call) | Approve | Answer a request for permission to run a tool during `POST /query` | Synchronous |
| [`POST /mcp/register`](#register-an-mcp-server) | Connect | Register the MCP server that provides the database tools | Synchronous |
| [`GET /mcp/registered`](#list-registered-mcp-servers) | Connect | List the registered MCP servers | Synchronous |
| [`DELETE /mcp/unregister/{server_name}`](#unregister-an-mcp-server) | Disconnect | Remove a registered MCP server | Synchronous |
| [`GET /health`](#check-that-the-service-is-running) | Monitor | Check that the service process is running | Synchronous |
| [`GET /health/ready`](#check-that-the-service-is-ready) | Monitor | Check the connection to the AI coder and the MCP server | Synchronous |
| [`GET /health/mcp`](#check-the-mcp-server-connection) | Monitor | Report the connection status of each MCP server | Synchronous |

## Generate a query

{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/reasoner/{service_id_postfix}/txt2aql" >}}

Turns a question in natural language into an AQL query, runs it, and returns
the query, the rows it returned, and a short answer.

### Request

```json
{
  "query": "What are the top 5 performing stores based on revenue?",
  "stream": false,
  "add_template": false
}
```

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `query` | string | Yes | | The question in natural language. Cannot be empty. |
| `stream` | boolean | No | `false` | `true` returns an SSE stream, `false` a JSON response after completion. The default differs from `POST /query`. |
| `add_template` | boolean | No | `false` | `true` saves the query as a template after it runs and sets `added_template_id` in the response. See [Save queries as templates](#save-queries-as-templates). |

### How a request is processed

1. The AQLizer looks up saved query templates in the `Tools` collection. It
   turns your question into an embedding vector and ranks the templates by the
   cosine similarity between this vector and the vector of each template's
   description, so a template matches a question with the same meaning even if
   the wording differs.
2. If the best matching template has a score of at least `0.85`, the AQLizer
   adapts it to your question, mainly by filling in its bind parameters, and
   runs it.
3. If no template scores that high, or filling in the template does not
   succeed, the AQLizer writes a new query. The most similar templates, up to
   3, are used as examples. If the filled-in template writes data, or saving
   it as a template fails, the request ends with an error instead.

A query that writes data, for example with `INSERT`, `UPDATE`, `REPLACE`,
`UPSERT`, or `REMOVE`, is rejected before it runs.

### Response

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

| Field | Type | Meaning |
|-------|------|---------|
| `aql` | string | The generated AQL query. |
| `json` | object[] | The rows returned by the query, at most 50. |
| `nl` | string | The answer in natural language. The language model writes it, so its wording varies. |
| `error` | string or null | Set when no answer is produced. |
| `added_template_id` | string or null | The ID of the saved template in the `Tools` collection. Set when `add_template` is `true`. |

The response contains at most 50 rows. The `nl` answer ends by stating how
many rows it is based on. If the query finds more than 50 rows, `json` holds
the first 50 and `nl` states that the answer is based on only the first 50
rows. For questions that match many documents, ask for a count, a total, or a
top N instead of the full list.

If no answer can be produced, the request still succeeds with HTTP status
`200`, with `error` set and `aql`, `json`, and `nl` empty:

| `error` | Meaning |
|---------|---------|
| `Can not generate AQL` | Generating is not available because no MCP server is configured. |
| `Can not add template` | `add_template` was `true` but the query could not be saved, for example because you don't have write access to the `Tools` collection. |
| `Can not change data: text-to-AQL only reads` | The question asks to add, change, or delete data. |
| `Query contains write operation '<OPERATION>'`, followed by a snippet of the query | The query would modify data, so it did not run. |
| `I can only answer questions about the data in this database.` | The question is not about the data in the database. |

Two cases return no rows without an error:

- If the database has no data for what the question asks for, `aql` and `json`
  are empty and `nl` explains what is missing.
- If the query runs but finds nothing, `aql` contains the query, `json` is
  empty, and `nl` is `The query found no matching data.`

| Status Code | Meaning |
|-------------|---------|
| `200` | The request completed, with an answer or with `error` set. |
| `401` | The `Authorization` header is missing or does not use the Bearer scheme, or the token is invalid or expired. |
| `422` | The request body is invalid, for example `query` is empty. |
| `500` | An unexpected failure occurred. In streaming mode, failures during processing are reported as an `error` event instead. |
| `503` | The authentication service is unavailable. |

### Streaming response

With `"stream": true`, the endpoint returns a Server-Sent Events (SSE) stream
with the following events:

| Event | Meaning |
|-------|---------|
| `phase` | The processing phase changed (`executing`). |
| `text` | Raw output of the language model, which can be JSON such as `{"nl":"","off_topic":true}`. Don't show it as the answer. The answer is `nl` in the `done` event. |
| `tool_call` | A database tool was called. |
| `tool_result` | A database tool returned a result. |
| `done` | The final result: `aql`, `json`, `nl`, `error` (`null`), and `added_template_id`. |
| `error` | Generating or running the query failed. The data includes `message` and `error`. |

If no event is sent for 5 seconds, the stream sends an SSE comment
(`: heartbeat`) to keep the connection open. Standard SSE clients ignore
comments. If the client closes the connection, the AQLizer stops processing
the request.

{{< info >}}
The AQLizer service of a database answers one request at a time.
`POST /txt2aql` and `POST /query` share this queue, so a second request waits
until the first one finishes, even if both come from the same user. While a
request waits, its stream only sends `: heartbeat` comments, and no event says
that it is waiting. Send requests one at a time, or allow for this wait in your
client's timeouts.
{{< /info >}}

### Save queries as templates

{{< info >}}
Query templates are only available through the API. The web interface does not
support them.
{{< /info >}}

Set `add_template` to `true` to save the query as a template in the `Tools`
collection, so that the AQLizer can reuse it for similar questions. This
requires write access to the `Tools` collection.

When a question closely matches a saved template, the AQLizer adapts the
template to the question, mainly by filling in its bind parameters. This takes
fewer steps than writing a new query, where the AQLizer first samples the
collections and, if needed, looks up values in the database. When no template
matches closely enough, the most similar templates still serve as examples for
writing the new query.

The template is saved with your question as its description. The AQLizer also
stores an embedding vector of the description, which it compares with new
questions. The `Tools` collection is created if it doesn't exist. If the same
query with the same bind parameters is already saved, `added_template_id` is
the ID of the existing template. Any query that runs without an error is
saved, whether it answers the question correctly or not, so check the query
before you save it.

If saving fails, the request ends with the `Can not add template` error. If no
query is generated, for example because the database has no data for the
question, nothing is saved and `added_template_id` is `null`.

Templates require an embedding API key. Set it as `embedding_api_key` in the
`env` of the AQLizer's MCP server when you start it through the data platform API.
Without it, the AQLizer always writes a new query, and saving new templates
fails with the `Can not add template` error.

The AQLizer endpoints don't let you list or delete saved templates. To manage
them, query the `Tools` collection directly, for example with AQL.

### HTTP example

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "query": "What are the top 5 performing stores based on revenue?",
    "stream": false,
    "add_template": false
  }' \
  https://<EXTERNAL_ENDPOINT>:8529/reasoner/{service_id_postfix}/txt2aql
```

## Optimize a query

{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/reasoner/{service_id_postfix}/query" >}}

Makes an AQL query faster and returns a report with the optimized query.

The AQLizer optimizes when `request` contains the query and one of the terms
`optimize`, `slow`, `performance`, `speed up`, `faster`, `execution time`, or
`profile`. Other requests, such as *List all graphs in the database*, are
answered with the database tools instead, without the optimization pipeline.

### Request

```json
{
  "request": "Optimize this query: FOR u IN users FILTER u.status == 'active' SORT u.created_at DESC RETURN u",
  "stream": false
}
```

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `request` | string | Yes | | The query to optimize with an instruction, or another request about the database. Cannot be empty. |
| `stream` | boolean | No | `true` | `true` returns an SSE stream, `false` a JSON response after completion. |

### Response

```json
{
  "result": "## Optimization Summary\n\n### Performance Comparison\n| Metric | Original | Optimized |\n..."
}
```

| Field | Type | Meaning |
|-------|------|---------|
| `result` | string | The final answer. For an optimization, a markdown report. |
| `error` | string or null | Set when the request failed. |

The report in `result` looks like this:

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
  matching `status == 'active'` are read, already in the correct sort order,
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

If the query writes data, the AQLizer does not run it and ends the request with
`This is a write query. Only read-only queries can be optimized or run.`

| Status Code | Meaning |
|-------------|---------|
| `200` | The request completed. |
| `401` | The `Authorization` header is missing or invalid, or the token is expired. |
| `422` | The request body is invalid, for example `request` is empty. |
| `500` | Processing failed. The error detail includes the phase in which it failed. |
| `503` | The authentication service is unavailable. |

### Streaming response

With `"stream": true`, the default, the endpoint returns a Server-Sent Events
(SSE) stream with the following events:

| Event | Meaning |
|-------|---------|
| `phase` | The processing phase changed: `executing`, `validating`, or `synthesizing`. |
| `text` | Partial text from the language model. |
| `tool_call` | A database tool was called. |
| `tool_result` | A database tool returned a result. |
| `validation` | The result of checking an optimization attempt. See [When validation does not pass](#when-validation-does-not-pass). |
| `permission_required` | A tool needs your approval before it runs. See [Approve or reject a tool call](#approve-or-reject-a-tool-call). |
| `done` | The final result. For an optimization, `result` holds the report. |
| `error` | Processing failed. |

The stream sends the same `: heartbeat` comment as `POST /txt2aql`, including
while the request [waits for other requests](#streaming-response). Closing the
connection stops the request.

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

For a request that is not an optimization, the stream has no `validation`
events and `done` reports `"synthesized": false`. The answer is in the
`text` events:

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

### When validation does not pass

Each `validation` event has a `reason` field that explains why an attempt did
not pass:

| Symptom | Likely cause |
|---------|--------------|
| `rows_match: false` | The rewritten query returns a different number of results. The optimization may have changed the query's logic. |
| `content_match: false` | The row counts match but the content does not. |
| `improvement_pct` below 5 | The optimization is valid but the improvement is below the minimum of 5%. The AQLizer retries with a different approach. |

### HTTP example

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "request": "Optimize this query: FOR u IN users FILTER u.status == '\''active'\'' SORT u.created_at DESC RETURN u",
    "stream": false
  }' \
  https://<EXTERNAL_ENDPOINT>:8529/reasoner/{service_id_postfix}/query
```

## Approve or reject a tool call

{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/reasoner/{service_id_postfix}/query/permission" >}}

Answers a request for permission to run a tool. Some database tools, such as
the ones that create documents or collections, need your approval before they
run. When `POST /query` wants to call one, the stream sends a
`permission_required` event and waits for your answer:

```
event: permission_required
data: {"permission_id": "per_01", "session_id": "ses_01", "tool_name": "arangodb_create-document", "tool_input": {…}}
```

### Request

```json
{
  "permission_id": "per_01",
  "session_id": "ses_01",
  "action": "reject"
}
```

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `permission_id` | string | Yes | | The `permission_id` of the `permission_required` event. |
| `session_id` | string | Yes | | The `session_id` of the `permission_required` event. |
| `action` | string | Yes | | `approve` runs the tool once, `reject` does not run it. |

### Response

```json
{
  "success": true,
  "action": "reject"
}
```

| Field | Type | Meaning |
|-------|------|---------|
| `success` | boolean | Whether the answer has been forwarded. |
| `action` | string | The action you sent. |

| Status Code | Meaning |
|-------------|---------|
| `200` | The answer has been forwarded. |
| `401` | The `Authorization` header is missing or invalid, or the token is expired. |
| `422` | `action` is not `approve` or `reject`, or a field is missing. |
| `500` | The answer could not be forwarded. |

### HTTP example

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "permission_id": "per_01",
    "session_id": "ses_01",
    "action": "reject"
  }' \
  https://<EXTERNAL_ENDPOINT>:8529/reasoner/{service_id_postfix}/query/permission
```

## Register an MCP server

{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/reasoner/{service_id_postfix}/mcp/register" >}}

Connects the AQLizer to the MCP server that provides its database tools. When
the data platform starts the AQLizer, it registers the internal MCP server
automatically, so you only need this endpoint to reconnect it. The AQLizer
supports one MCP server at a time.

### Request

```json
{
  "name": "arangodb",
  "config": {
    "type": "remote",
    "url": "http://arangodb-mcp-server-ir6oe:8080/",
    "enabled": true
  }
}
```

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `name` | string | Yes | | The name of the MCP server, for example `arangodb`. |
| `config.type` | string | No | `local` | `remote` for an MCP server reached over HTTP, such as the internal MCP server. |
| `config.url` | string | For `remote` | | The URL of the MCP server, `http://arangodb-mcp-server-<postfix>:8080/`, where `<postfix>` is the end of the MCP server's service ID. |
| `config.enabled` | boolean | No | `true` | Whether the MCP server is enabled. |

### Response

```json
{
  "success": true,
  "message": "MCP server 'arangodb' registered successfully",
  "server_name": "arangodb"
}
```

| Field | Type | Meaning |
|-------|------|---------|
| `success` | boolean | Whether the MCP server has been registered. |
| `message` | string | A status message. |
| `server_name` | string | The name of the registered MCP server. |

| Status Code | Meaning |
|-------------|---------|
| `200` | The MCP server has been registered. |
| `400` | `config.url` is missing for `remote`, or `config.type` is not supported. |
| `401` | The `Authorization` header is missing or invalid, or the token is expired. |
| `500` | Registering failed. |
| `502` | The AI coder sent an invalid response. |
| `503` | The AQLizer cannot reach its AI coder. |
| `504` | The AI coder did not respond after 3 attempts. |

### HTTP example

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "arangodb",
    "config": {
      "type": "remote",
      "url": "http://arangodb-mcp-server-ir6oe:8080/",
      "enabled": true
    }
  }' \
  https://<EXTERNAL_ENDPOINT>:8529/reasoner/{service_id_postfix}/mcp/register
```

## List registered MCP servers

{{< endpoint "GET" "https://<EXTERNAL_ENDPOINT>:8529/reasoner/{service_id_postfix}/mcp/registered" >}}

Lists the names of the MCP servers the AQLizer is connected to.

### Response

```json
{
  "registered_servers": ["arangodb"]
}
```

| Field | Type | Meaning |
|-------|------|---------|
| `registered_servers` | string[] | The names of the registered MCP servers. |

| Status Code | Meaning |
|-------------|---------|
| `200` | The list has been returned. |
| `401` | The `Authorization` header is missing or invalid, or the token is expired. |
| `503` | The AQLizer cannot reach its AI coder to read the list. |

### HTTP example

```bash
curl -X GET \
  -H "Authorization: Bearer <token>" \
  https://<EXTERNAL_ENDPOINT>:8529/reasoner/{service_id_postfix}/mcp/registered
```

## Unregister an MCP server

{{< endpoint "DELETE" "https://<EXTERNAL_ENDPOINT>:8529/reasoner/{service_id_postfix}/mcp/unregister/{server_name}" >}}

Removes a registered MCP server. Without an MCP server, generating fails with
`Can not generate AQL`.

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `server_name` | string | Yes | | Path parameter. The name of the MCP server to remove, for example `arangodb`. |

### Response

```json
{
  "success": true,
  "message": "MCP server 'arangodb' unregistered successfully",
  "server_name": "arangodb"
}
```

| Field | Type | Meaning |
|-------|------|---------|
| `success` | boolean | `true` if the MCP server has been removed or was not registered. |
| `message` | string | A status message. If the MCP server was not registered, `MCP server '<name>' was already not registered`. |
| `server_name` | string | The name from the path. |

| Status Code | Meaning |
|-------------|---------|
| `200` | The MCP server has been removed, or was not registered. |
| `401` | The `Authorization` header is missing or invalid, or the token is expired. |
| `500` | Unregistering failed. |
| `502` | The AI coder sent an invalid response. |
| `503` | The AQLizer cannot reach its AI coder. |
| `504` | The AI coder did not respond after 3 attempts. |

### HTTP example

```bash
curl -X DELETE \
  -H "Authorization: Bearer <token>" \
  https://<EXTERNAL_ENDPOINT>:8529/reasoner/{service_id_postfix}/mcp/unregister/arangodb
```

## Check that the service is running

{{< endpoint "GET" "https://<EXTERNAL_ENDPOINT>:8529/reasoner/{service_id_postfix}/health" >}}

Returns `healthy` whenever the service process is running, regardless of its
connections. Use it as the Kubernetes liveness probe. No token is needed.

### Response

```json
{
  "status": "healthy",
  "version": "1.0.0",
  "environment": "production"
}
```

| Field | Type | Meaning |
|-------|------|---------|
| `status` | string | Always `healthy`. |
| `version` | string | The version of the service. |
| `environment` | string | The environment the service runs in. |

| Status Code | Meaning |
|-------------|---------|
| `200` | The service process is running. |

### HTTP example

```bash
curl -X GET \
  https://<EXTERNAL_ENDPOINT>:8529/reasoner/{service_id_postfix}/health
```

## Check that the service is ready

{{< endpoint "GET" "https://<EXTERNAL_ENDPOINT>:8529/reasoner/{service_id_postfix}/health/ready" >}}

Checks the connection to the AI coder and the MCP server. The service is ready
when the AI coder is reachable. The MCP server status is reported for
information. Use it as the Kubernetes readiness probe. No token is needed.

### Response

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

| Field | Type | Meaning |
|-------|------|---------|
| `ready` | boolean | Whether the service is ready. |
| `checks.opencode.status` | string | `healthy` or `unhealthy`, the status of the AI coder. |
| `checks.mcp_servers.status` | string | Whether MCP servers are available. |
| `checks.mcp_servers.details` | object | The connection status of each MCP server. |

| Status Code | Meaning |
|-------------|---------|
| `200` | The check has run. Read `ready` for the result. |

### HTTP example

```bash
curl -X GET \
  https://<EXTERNAL_ENDPOINT>:8529/reasoner/{service_id_postfix}/health/ready
```

## Check the MCP server connection

{{< endpoint "GET" "https://<EXTERNAL_ENDPOINT>:8529/reasoner/{service_id_postfix}/health/mcp" >}}

Reports the connection status of each registered MCP server. No token is
needed.

### Response

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

| Field | Type | Meaning |
|-------|------|---------|
| `status` | string | `healthy` if the registered MCP server is connected, `degraded` if it is not, `unhealthy` if no MCP server is configured, `error` if the AI coder could not be reached to read the status. |
| `servers` | object | The connection status of each MCP server. |
| `connected_servers` | string[] | The names of the connected MCP servers. |
| `timestamp` | string | The time of the check. |

| Status Code | Meaning |
|-------------|---------|
| `200` | The check has run. Read `status` for the result. |

### HTTP example

```bash
curl -X GET \
  https://<EXTERNAL_ENDPOINT>:8529/reasoner/{service_id_postfix}/health/mcp
```
