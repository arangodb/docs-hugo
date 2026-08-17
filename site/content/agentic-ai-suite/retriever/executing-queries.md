---
title: Execute Queries using the Retriever
menuTitle: Execute Queries
description: >-
  Learn how to execute different types of queries against your knowledge graph
weight: 40
---
{{< info >}}
**Getting Started Path:** [Overview](./) → [Configure LLMs](llm-configuration.md) → [Search Methods](search-methods/_index.md) → **Execute Queries** → [Verify](verify-and-monitor.md)
{{< /info >}}

## Query Endpoints

The Retriever service provides two main query endpoints and a health endpoint:

{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/graphrag/retriever/{serviceIdPostfix}/v1/graphrag-query" >}}

{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/graphrag/retriever/{serviceIdPostfix}/v1/graphrag-query-stream" >}}

{{< endpoint "GET" "https://<EXTERNAL_ENDPOINT>:8529/graphrag/retriever/{serviceIdPostfix}/v1/health" >}}

{{< tip >}}
The streaming endpoint (`/v1/graphrag-query-stream`) returns responses
as they are generated, making it ideal for real-time applications and
interactive interfaces.
{{< /tip >}}

{{< info >}}
The streaming endpoint accepts requests for every provider. The
OpenAI-compatible providers, `openai` and `custom` (OpenRouter, corporate LLMs,
and any other compatible endpoint), stream tokens as they are generated. Triton
does not token-stream: the request still succeeds, but the full answer arrives
as a single chunk.
{{< /info >}}

{{< info >}}
All endpoints require authentication. Include an `Authorization: Bearer <token>`
header on all requests.
{{< /info >}}

## Executing Queries

After the Retriever service is installed successfully, you can interact with 
it using the query endpoints.

{{< tabs "executing-queries" >}}

{{< tab "Global Search" >}}

```bash
curl -X POST https://<EXTERNAL_ENDPOINT>:8529/graphrag/retriever/<SERVICE_ID_POSTFIX>/v1/graphrag-query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "query": "What are the main themes discussed in the document?",
    "query_type": 1,
    "level": 1,
    "include_metadata": true
  }'
```

{{< /tab >}}

{{< tab "Local Search" >}}

```bash
curl -X POST https://<EXTERNAL_ENDPOINT>:8529/graphrag/retriever/<SERVICE_ID_POSTFIX>/v1/graphrag-query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "query": "What is the AR3 Drone?",
    "query_type": 2,
    "use_llm_planner": false,
    "include_metadata": true
  }'
```

{{< /tab >}}

{{< tab "Deep Search" >}}

```bash
curl -X POST https://<EXTERNAL_ENDPOINT>:8529/graphrag/retriever/<SERVICE_ID_POSTFIX>/v1/graphrag-query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "query": "What are the properties of a specific entity?",
    "query_type": 2,
    "use_llm_planner": true,
    "include_metadata": true
  }'
```

{{< /tab >}}

{{< tab "Instant Search" >}}

```bash
curl -X POST https://<EXTERNAL_ENDPOINT>:8529/graphrag/retriever/<SERVICE_ID_POSTFIX>/v1/graphrag-query-stream \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "query": "How are X and Y related?",
    "query_type": 3,
    "include_metadata": true
  }'
```

{{< /tab >}}

{{< tab "Custom Retriever" >}}

```bash
curl -X POST https://<EXTERNAL_ENDPOINT>:8529/graphrag/retriever/<SERVICE_ID_POSTFIX>/v1/graphrag-query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "query": "Find airports in New York",
    "query_type": 4,
    "custom_tools": ["airport_search_v1"],
    "include_metadata": true
  }'
```

{{< /tab >}}

{{< /tabs >}}

For detailed information about all available parameters, see the 
[Query Parameters Reference](parameters.md).

## Request Examples

**Instant Search with response instructions:**

```bash
curl -X POST https://<EXTERNAL_ENDPOINT>:8529/graphrag/retriever/<SERVICE_ID_POSTFIX>/v1/graphrag-query-stream \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "query": "How are X and Y related?",
    "query_type": 3,
    "include_metadata": true,
    "show_citations": true,
    "use_cache": false,
    "response_instructions": "Provide a concise answer with bullet points"
  }'
```

**Instant or Deep Search using `mode`:**

Instead of combining `query_type` and `use_llm_planner`, you can set
[`mode`](parameters.md#mode):

```bash
curl -X POST https://<EXTERNAL_ENDPOINT>:8529/graphrag/retriever/<SERVICE_ID_POSTFIX>/v1/graphrag-query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "query": "What are all the technical specifications mentioned?",
    "mode": "DEEP_SEARCH",
    "include_metadata": true
  }'
```

`"mode": "INSTANT"` gives you a fast answer from Instant Search, and
`"mode": "DEEP_SEARCH"` a thorough one, using your Custom Retriever tools if you
have any and Local Search if you do not. Either value takes precedence over
`query_type` and `use_llm_planner`.

**Deep Search:**

```bash
curl -X POST https://<EXTERNAL_ENDPOINT>:8529/graphrag/retriever/<SERVICE_ID_POSTFIX>/v1/graphrag-query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "query": "What are all the technical specifications mentioned?",
    "query_type": 2,
    "use_llm_planner": true,
    "include_metadata": true,
    "response_instructions": "Focus on technical details and specifications"
  }'
```

{{< info >}}
Citations are supported in Deep Search mode (`use_llm_planner=true`) for `LOCAL`
and `CUSTOM` queries. Only `GLOBAL` queries disable citations unconditionally,
regardless of `show_citations`.
{{< /info >}}

**Global Search:**

```bash
curl -X POST https://<EXTERNAL_ENDPOINT>:8529/graphrag/retriever/<SERVICE_ID_POSTFIX>/v1/graphrag-query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "query": "What are the main themes in my documents?",
    "query_type": 1,
    "level": 1,
    "include_metadata": true,
    "use_cache": true,
    "response_instructions": "Provide a high-level summary"
  }'
```

**Custom Retriever with partition filtering:**

```bash
curl -X POST https://<EXTERNAL_ENDPOINT>:8529/graphrag/retriever/<SERVICE_ID_POSTFIX>/v1/graphrag-query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "query": "Find relevant technical documentation",
    "query_type": 4,
    "custom_tools": ["entity_relationship_expander_v1"],
    "partition_ids": ["tenant-123"],
    "include_metadata": true,
    "auto_create_indexes": true
  }'
```

## Streaming Response Format

The streaming endpoint returns chunks with the following structure:

```json
{
  "delta": "The",
  "finalResult": "",
  "metadata": "",
  "isFinal": false,
  "runId": "a1b2c3d4-...",
  "errorCode": ""
}
```

- `delta`: Partial token text for intermediate chunks.
- `finalResult`: Full final text on the last chunk.
- `metadata`: Optional JSON metadata string (typically on the last chunk when `include_metadata=true`).
- `isFinal`: `true` only on the last chunk.
- `runId`: Identifier of the stored query run. Only the first and the last chunk
  of a stream carry it, whichever kind of chunk they happen to be. The chunks in
  between leave it out.
- `errorCode`: Empty on success; set on the chunk that reports a failure.

For Deep Search streaming, you may also receive metadata-only progress chunks
before token chunks. The example below is such a chunk from the middle of a
stream, so it has no `runId`. A progress chunk that arrives first in the stream
does carry one, following the rule above:

```json
{
  "delta": "",
  "finalResult": "",
  "metadata": "{\"type\":\"progress\",\"step\":\"tool_selection\",\"message\":\"Selecting best tool\"}",
  "isFinal": false
}
```

## Next Steps

- **[View all parameters](parameters.md)**: Explore query configuration options.
- **[Verify and monitor](verify-and-monitor.md)**: Check service health and query status.
- **[Learn about search methods](search-methods/_index.md)**: Understand when to use each search type.
