---
title: Execute Queries
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

{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/graphrag/retriever/{SERVICE_ID}/v1/graphrag-query" >}}

{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/graphrag/retriever/{SERVICE_ID}/v1/graphrag-query-stream" >}}

{{< endpoint "GET" "https://<EXTERNAL_ENDPOINT>:8529/graphrag/retriever/{SERVICE_ID}/v1/health" >}}

{{< tip >}}
The streaming endpoint (`/v1/graphrag-query-stream`) returns responses
as they are generated, making it ideal for real-time applications and
interactive interfaces.
{{< /tip >}}

{{< warning >}}
Streaming is not compatible with Triton Inference Server. Streaming is only
supported when using OpenAI, OpenAI-compatible APIs (including corporate LLMs),
or OpenRouter providers.
{{< /warning >}}

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
curl -X POST https://<EXTERNAL_ENDPOINT>:8529/graphrag/retriever/{SERVICE_ID}/v1/graphrag-query \
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
curl -X POST https://<EXTERNAL_ENDPOINT>:8529/graphrag/retriever/{SERVICE_ID}/v1/graphrag-query \
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
curl -X POST https://<EXTERNAL_ENDPOINT>:8529/graphrag/retriever/{SERVICE_ID}/v1/graphrag-query \
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
curl -X POST https://<EXTERNAL_ENDPOINT>:8529/graphrag/retriever/{SERVICE_ID}/v1/graphrag-query-stream \
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
curl -X POST https://<EXTERNAL_ENDPOINT>:8529/graphrag/retriever/{SERVICE_ID}/v1/graphrag-query \
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
curl -X POST https://<EXTERNAL_ENDPOINT>:8529/graphrag/retriever/{SERVICE_ID}/v1/graphrag-query-stream \
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

**Deep Search:**

```bash
curl -X POST https://<EXTERNAL_ENDPOINT>:8529/graphrag/retriever/{SERVICE_ID}/v1/graphrag-query \
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
In Deep Search mode (`use_llm_planner=true`), citations are always disabled
regardless of `show_citations`. The same applies to `GLOBAL` queries.
{{< /info >}}

**Global Search:**

```bash
curl -X POST https://<EXTERNAL_ENDPOINT>:8529/graphrag/retriever/{SERVICE_ID}/v1/graphrag-query \
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
curl -X POST https://<EXTERNAL_ENDPOINT>:8529/graphrag/retriever/{SERVICE_ID}/v1/graphrag-query \
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
  "final_result": "",
  "metadata": "",
  "is_final": false
}
```

- `delta`: Partial token text for intermediate chunks.
- `final_result`: Full final text on the last chunk.
- `metadata`: Optional JSON metadata string (typically on the last chunk when `include_metadata=true`).
- `is_final`: `true` only on the last chunk.

For Deep Search streaming, you may also receive metadata-only progress chunks
before token chunks:

```json
{
  "delta": "",
  "final_result": "",
  "metadata": "{\"type\":\"progress\",\"step\":\"tool_selection\",\"message\":\"Selecting best tool\"}",
  "is_final": false
}
```

## Next Steps

- **[View all parameters](parameters.md)**: Explore query configuration options.
- **[Verify and monitor](verify-and-monitor.md)**: Check service health and query status.
- **[Learn about search methods](search-methods/_index.md)**: Understand when to use each search type.
