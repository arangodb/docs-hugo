---
title: Retriever Quick Start
menuTitle: Quick Start
weight: 2
description: >-
  Chat with your knowledge graph - ask questions in plain language and get
  grounded, cited answers
---

## Prerequisites

- A **GraphRAG project with imported data**. If you haven't built a graph
  yet, follow the [Importer Quick Start](../importer/quick-start.md) (or the
  [AutoGraph Quick Start](../autograph/quick-start.md) for partitioned
  corpora).
- An **LLM provider** for the Retriever (Triton or any OpenAI-compatible
  API). See [LLM Configuration](llm-configuration.md).
- A **valid JWT** (`Authorization: Bearer ...`).

## Run your first query

{{< steps >}}

{{< step "Install the Retriever service" >}}
Install and start the service through the Arango Control Plane. Configure your
LLM and embedding providers at install time by passing them in the `env` object
of the install request body. Streaming is supported with OpenAI,
OpenAI-compatible APIs, and OpenRouter (not Triton).

{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/_platform/acp/v1/graphragretriever" >}}

```json
{
  "env": {
    "db_name": "your_database_name",
    "project_name": "your_project_name",
    "chat_api_provider": "openai",
    "chat_api_key": "your_openai_api_key",
    "embedding_api_provider": "openai",
    "embedding_api_key": "your_openai_api_key"
  }
}
```

Note the `serviceIdPostfix` from the response. For all provider options and
parameters, see [LLM Configuration](llm-configuration.md).
{{< /step >}}

{{< step "Send a query" >}}
Use **Global Search** (`query_type: 1`) for high-level themes, **Local
Search** (`query_type: 2`) for specific entities, or **Instant Search**
(`query_type: 3`) on the streaming endpoint for fast answers.

```bash
curl -X POST \
  https://<EXTERNAL_ENDPOINT>:8529/graphrag/retriever/{serviceIdPostfix}/v1/graphrag-query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "query": "What are the main themes discussed in the document?",
    "query_type": 1,
    "level": 1,
    "include_metadata": true
  }'
```
{{< /step >}}

{{< step "Read the answer" >}}
The response contains the generated answer and, when `include_metadata` is
`true`, the supporting references. Switch to
`/v1/graphrag-query-stream` to receive tokens as they are generated.
{{< /step >}}

{{< /steps >}}

{{< tip >}}
**You now have** a working natural language interface over your knowledge
graph. Tune behavior with response instructions, citations, and caching.
{{< /tip >}}

## Next steps

- [Search Methods](search-methods/_index.md): When to use each method.
- [Execute Queries](executing-queries.md): All endpoints and examples.
- [Parameter Reference](parameters.md): Every query parameter.
