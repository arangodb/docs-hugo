---
title: Retriever Service
menuTitle: Retriever
description: >-
  The Retriever is a powerful service that enables intelligent search and
  retrieval from knowledge graphs created by the Importer service
weight: 15
---
{{< tip >}}
The Arango AI Data Platform is available as a pre-release. To get
exclusive early access, [get in touch](https://arango.ai/contact-us/) with
the Arango team.
{{< /tip >}}

## Overview

The Retriever service provides intelligent search and retrieval from knowledge graphs,
with multiple search methods optimized for different query types. The service supports 
LLMs through Triton Inference Server or any OpenAI-compatible API (including private 
corporate LLMs), making it flexible for various deployment and infrastructure requirements.

**Key features:**
- Multiple search methods optimized for different use cases
- Streaming support for real-time responses for `UNIFIED` queries
- Optional LLM orchestration for `LOCAL` queries
- Configurable community hierarchy levels for `GLOBAL` queries
- Support for Triton Inference Server and OpenAI-compatible APIs
- Simple REST API interface
- Integration with ArangoDB knowledge graphs

{{< tip >}}
You can use the Retriever service via the [web interface](../graphrag/web-interface.md)
for Instant and Deep Search, or through the API for full control over all query types.
{{< /tip >}}

## Prerequisites

Before using the Retriever service, you need to:

1. **Create a GraphRAG project** - For detailed instructions on creating and 
   managing projects, see the [Projects](ai-orchestrator.md#projects) section in the 
   GenAI Orchestration Service documentation.

2. **Import data** - Use the [Importer](importer.md) service to transform your 
   text documents into a knowledge graph stored in ArangoDB.

## Search Methods

The Retriever service enables intelligent search and retrieval of information
from your knowledge graph. It provides multiple search methods that leverage 
the structured knowledge graph created by the Importer to deliver accurate and 
contextually relevant responses to your natural language queries.

### Instant Search

Instant Search is designed for responses with very short latency. It triggers
fast unified retrieval over relevant parts of the knowledge graph via hybrid
(semantic and lexical) search and graph expansion algorithms, producing a fast,
streamed natural-language response with clickable references to the relevant documents.

{{< info >}}
The Instant Search method is also available via the [Web interface](../graphrag/web-interface.md).
{{< /info >}}

```json
{
  "query_type": "UNIFIED"
}
```

### Deep Search

Deep Search is designed for highly detailed, accurate responses that require understanding
what kind of information is available in different parts of the knowledge graph and
sequentially retrieving information in an LLM-guided research process. Use whenever
detail and accuracy are required (e.g. aggregation of highly technical details) and
very short latency is not (i.e. caching responses for frequently asked questions,
or use case with agents or research use cases).

{{< info >}}
The Deep Search method is also available via the [Web interface](../graphrag/web-interface.md).
{{< /info >}}

```json
{
  "query_type": "LOCAL",
  "use_llm_planner": true
}
```

### Global Search

Global search is designed for queries that require understanding and aggregation of information across your entire document. It’s particularly effective for questions about overall themes, patterns, or high-level insights in your data.

- **Community-Based Analysis**: Uses pre-generated community reports from your knowledge graph to understand the overall structure and themes of your data.
- **Map-Reduce Processing**:
  - **Map Stage**: Processes community reports in parallel, generating intermediate responses with rated points.
  - **Reduce Stage**: Aggregates the most important points to create a comprehensive final response.

```json
{
  "query_type": "GLOBAL"
}
```

### Local Search

Local search focuses on specific entities and their relationships within your knowledge graph. It is ideal for detailed queries about particular concepts, entities, or relationships.

- **Entity Identification**: Identifies relevant entities from the knowledge graph based on the query.
- **Context Gathering**: Collects:
  - Related text chunks from original documents.
  - Connected entities and their strongest relationships.
  - Entity descriptions and attributes.
  - Context from the community each entity belongs to.
- **Prioritized Response**: Generates a response using the most relevant gathered information.

```json
{
  "query_type": "LOCAL",
  "use_llm_planner": false
}
```

## Installation

The Retriever service can be configured to use either Triton Inference Server or any 
OpenAI-compatible API. OpenAI-compatible APIs work with public providers (OpenAI, 
OpenRouter, Gemini, Anthropic) as well as private corporate LLMs that expose an 
OpenAI-compatible endpoint.

To start the service, use the AI service endpoint `/v1/graphragretriever`. 
Please refer to the documentation of the [AI orchestration service](ai-orchestrator.md) for more
information on how to use it.

### Using OpenAI-compatible APIs

The `openai` provider works with any OpenAI-compatible API, including:
- OpenAI (official API)
- OpenRouter
- Google Gemini
- Anthropic Claude
- Corporate or self-hosted LLMs with OpenAI-compatible endpoints

Set the `chat_api_url` and `embedding_api_url` to point to your provider's endpoint.

**Example using OpenAI:**

```json
{
  "env": {
    "db_name": "your_database_name",
    "chat_api_provider": "openai",
    "chat_api_url": "https://api.openai.com/v1",
    "embedding_api_provider": "openai",
    "embedding_api_url": "https://api.openai.com/v1",
    "chat_model": "gpt-4o",
    "embedding_model": "text-embedding-3-small",
    "chat_api_key": "your_openai_api_key",
    "embedding_api_key": "your_openai_api_key"
  },
}
```

Where:
- `db_name`: Name of the ArangoDB database where the knowledge graph will be stored
- `chat_api_provider`: Set to `"openai"` for any OpenAI-compatible API
- `chat_api_url`: API endpoint URL for the chat/language model service
- `embedding_api_provider`: Set to `"openai"` for any OpenAI-compatible API
- `embedding_api_url`: API endpoint URL for the embedding model service
- `chat_model`: Specific language model to use for text generation and analysis
- `embedding_model`: Specific model to use for generating text embeddings
- `chat_api_key`: API key for authenticating with the chat/language model service
- `embedding_api_key`: API key for authenticating with the embedding model service

{{< info >}}
When using the official OpenAI API, the service defaults to `gpt-4o` and 
`text-embedding-3-small` models.
{{< /info >}}

### Using different OpenAI-compatible services for chat and embedding

You can use different OpenAI-compatible services for chat and embedding. For example, 
you might use OpenRouter for chat and OpenAI for embeddings, depending 
on your needs for performance, cost, or model availability.

{{< info >}}
Both `chat_api_provider` and `embedding_api_provider` must be set to the same value 
(either both `"openai"` or both `"triton"`). You cannot mix Triton and OpenAI-compatible 
APIs. However, you can use different OpenAI-compatible services (like OpenRouter, OpenAI, 
Gemini, etc.) by setting both providers to `"openai"` and differentiating them with 
different URLs in `chat_api_url` and `embedding_api_url`.
{{< /info >}}

**Example using OpenRouter for chat and OpenAI for embedding:**

```json
    {
      "env": {
        "db_name": "your_database_name",
        "chat_api_provider": "openai",
        "embedding_api_provider": "openai",
        "chat_api_url": "https://openrouter.ai/api/v1",
        "embedding_api_url": "https://api.openai.com/v1",
        "chat_model": "mistral-nemo",
        "embedding_model": "text-embedding-3-small",
        "chat_api_key": "your_openrouter_api_key",
        "embedding_api_key": "your_openai_api_key"
      },
    }
```

Where:
- `db_name`: Name of the ArangoDB database where the knowledge graph is stored
- `chat_api_provider`: Set to `"openai"` for any OpenAI-compatible API
- `chat_api_url`: API endpoint URL for the chat/language model service (in this example, OpenRouter)
- `embedding_api_provider`: Set to `"openai"` for any OpenAI-compatible API
- `embedding_api_url`: API endpoint URL for the embedding model service (in this example, OpenAI)
- `chat_model`: Specific language model to use for text generation and analysis
- `embedding_model`: Specific model to use for generating text embeddings
- `chat_api_key`: API key for authenticating with the chat/language model service
- `embedding_api_key`: API key for authenticating with the embedding model service

### Using Triton Inference Server for chat and embedding

The first step is to install the LLM Host service with the LLM and
embedding models of your choice. The setup will use the 
Triton Inference Server and MLflow at the backend. 
For more details, please refer to the [Triton Inference Server](triton-inference-server.md)
and [Mlflow](mlflow.md) documentation.

Once the `llmhost` service is up-and-running, then you can start the Retriever
service using the below configuration:

```json
{
  "env": {
    "db_name": "your_database_name",
    "chat_api_provider": "triton",
    "embedding_api_provider": "triton",
    "chat_api_url": "your-arangodb-llm-host-url",
    "embedding_api_url": "your-arangodb-llm-host-url",
    "chat_model": "mistral-nemo-instruct",
    "embedding_model": "nomic-embed-text-v1"
  },
}
```

Where:
- `db_name`: Name of the ArangoDB database where the knowledge graph will be stored
- `chat_api_provider`: Specifies which LLM provider to use for language model services
- `embedding_api_provider`: API provider for embedding model services (e.g., "triton")
- `chat_api_url`: API endpoint URL for the chat/language model service
- `embedding_api_url`: API endpoint URL for the embedding model service
- `chat_model`: Specific language model to use for text generation and analysis
- `embedding_model`: Specific model to use for generating text embeddings

## Executing queries

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

### Request Parameters

- `query`: Your search query text (required).

- `query_type`: The type of search to perform.
  - `GLOBAL` or `1`: Global Search (default if not specified).
  - `LOCAL` or `2`: Deep Search when used with LLM planner (default), or standard Local Search when `llm_planner` is explicitly set to `false`.
  - `UNIFIED` or `3`: Instant Search.

- `use_llm_planner`: Whether to use LLM planner for intelligent query orchestration (optional)
  - When enabled (default), orchestrates retrieval using both local and global strategies (powers Deep Search)
  - Set to `false` for standard Local Search without orchestration

- `level`: Community hierarchy level for analysis (only applicable for `GLOBAL` queries)
  - `1` for top-level communities (broader themes)
  - `2` for more granular communities (default)

- `provider`: The LLM provider to use
  - `0`: Any OpenAI-compatible API (OpenAI, OpenRouter, Gemini, Anthropic, etc.)
  - `1`: Triton Inference Server

- `include_metadata`: Whether to include metadata in the response (optional, defaults to `false`)

- `response_instruction`: Custom instructions for response generation style (optional)

- `use_cache`: Whether to use caching for this query (optional, defaults to `false`)

- `show_citations`: Whether to show inline citations in the response (optional, defaults to `false`)

## Health check

You can also monitor the service health:

```bash
GET /v1/health
```

## Verify status

You can verify the state of the retriever process via the following endpoint:

```
GET /ai/v1/project_by_name/<your_project>
```

For example, the `status` object found within `retrieverServices` may contain the following
properties:

```json
"status": {
    "status": "service_started",
    "progress": 100,
}
```

## API Reference

For detailed API documentation, see the
[GraphRAG Retrievers API Reference](https://arangoml.github.io/platform-dss-api/graphrag_retrievers/proto/index.html).
