---
title: Execute Queries
menuTitle: Execute Queries
description: >-
  Learn how to execute different types of queries against your knowledge graph
weight: 40
---

{{< info >}}
**Getting Started Path:** [Overview](./) → [Configure LLMs](llm-configuration.md) → [Search Methods](search-methods.md) → **Execute Queries** → [Verify](verify-and-monitor.md)
{{< /info >}}

## Query Endpoints

The Retriever service provides two main endpoints:

{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/ai/v1/graphrag-query" >}}

{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/ai/v1/graphrag-query-stream" >}}

{{< tip >}}
The Instant Search endpoint (`/v1/graphrag-query-stream`) returns streaming responses, 
making it ideal for real-time applications and interactive interfaces.
{{< /tip >}}

{{< warning >}}
The streaming functionality is currently not compatible with Triton Inference Server. Streaming is only supported when using OpenAI, OpenAI-compatible APIs (including corporate LLMs), or OpenRouter providers.
{{< /warning >}}

## Executing Queries

After the Retriever service is installed successfully, you can interact with 
it using the following HTTP endpoints.

{{< tabs "executing-queries" >}}

{{< tab "Instant Search" >}}

```bash
curl -X POST /v1/graphrag-query-stream \
  -H "Content-Type: application/json" \
  -d '{
    "query": "How are X and Y related?",
    "query_type": "UNIFIED",
    "provider": 0,
    "include_metadata": true
  }'
```

{{< /tab >}}

{{< tab "Deep Search" >}}

```bash
curl -X POST /v1/graphrag-query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What are the properties of a specific entity?",
    "query_type": "LOCAL",
    "use_llm_planner": true,
    "provider": 0,
    "include_metadata": true
  }'
```

{{< /tab >}}

{{< tab "Global Search" >}}

```bash
curl -X POST /v1/graphrag-query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What are the main themes discussed in the document?",
    "query_type": "GLOBAL",
    "level": 1,
    "provider": 0,
    "include_metadata": true
  }'
```

{{< /tab >}}

{{< tab "Local Search" >}}

```bash
curl -X POST /v1/graphrag-query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is the AR3 Drone?",
    "query_type": "LOCAL",
    "use_llm_planner": false,
    "provider": 0,
    "include_metadata": true
  }'
```

{{< /tab >}}

{{< /tabs >}}

For detailed information about all available parameters, see the 
[Query Parameters Reference](parameters.md).

## Request Examples

**Instant Search example:**

```bash
curl -X POST https://<EXTERNAL_ENDPOINT>:8529/v1/graphrag-query-stream \
  -H "Content-Type: application/json" \
  -d '{
    "query": "How are X and Y related?",
    "query_type": "UNIFIED",
    "provider": 0,
    "include_metadata": true,
    "show_citations": true,
    "use_cache": false,
    "response_instruction": "Provide a concise answer with bullet points"
  }'
```

**Deep Search example:**

```bash
curl -X POST https://<EXTERNAL_ENDPOINT>:8529/v1/graphrag-query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What are all the technical specifications mentioned?",
    "query_type": "LOCAL",
    "use_llm_planner": true,
    "provider": 0,
    "include_metadata": true,
    "show_citations": true,
    "response_instruction": "Focus on technical details and specifications"
  }'
```

**Global Search example:**

```bash
curl -X POST https://<EXTERNAL_ENDPOINT>:8529/v1/graphrag-query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What are the main themes in my documents?",
    "query_type": "GLOBAL",
    "level": 1,
    "provider": 0,
    "include_metadata": true,
    "response_instruction": "Provide a high-level summary"
  }'
```

## Next Steps

- **[View all parameters](parameters.md)**: Explore query configuration options.
- **[Verify and monitor](verify-and-monitor.md)**: Check service health and query status.
- **[Learn about search methods](search-methods.md)**: Understand when to use each search type.

