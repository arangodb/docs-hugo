---
title: Retriever Service
menuTitle: Retriever
description: >-
  The Retriever is a powerful service that enables intelligent search and
  retrieval from knowledge graphs created by the Importer service
weight: 15
---
{{< tip >}}
The Arango Data Platform & AI Suite are available as a pre-release. To get
exclusive early access, [get in touch](https://arango.ai/contact-us/) with
the Arango team.
{{< /tip >}}

## Overview

The Retriever service offers two distinct search methods:
- **Global search**: Analyzes entire document to identify themes and patterns,
  perfect for high-level insights and comprehensive summaries.
- **Local search**: Focuses on specific entities and their relationships, ideal
  for detailed queries about particular concepts.

The service supports both private (Triton Inference Server) and public (OpenAI)
LLM deployments, making it flexible for various security and infrastructure
requirements. With simple HTTP endpoints, you can easily query your knowledge
graph and get contextually relevant responses.

**Key features:**
- Dual search methods for different query types
- Support for both private and public LLM deployments
- Simple REST API interface
- Integration with ArangoDB knowledge graphs
- Configurable community hierarchy levels

{{< tip >}}
You can also use the GraphRAG Retriever service via the ArangoDB [web interface](../graphrag/web-interface.md).
{{< /tip >}}

## Search methods

The Retriever service enables intelligent search and retrieval of information
from your knowledge graph. It provides two powerful search methods, global Search
and local Search, that leverage the structured knowledge graph created by the Importer
to deliver accurate and contextually relevant responses to your natural language queries.

### Global search

Global search is designed for queries that require understanding and aggregation
of information across your entire document. It's particularly effective for questions
about overall themes, patterns, or high-level insights in your data.

- **Community-Based Analysis**: Uses pre-generated community reports from your
  knowledge graph to understand the overall structure and themes of your data,
- **Map-Reduce Processing**:
   - **Map Stage**: Processes community reports in parallel, generating intermediate responses with rated points.
   - **Reduce Stage**: Aggregates the most important points to create a comprehensive final response.

**Best use cases**:
- "What are the main themes in the dataset?"
- "Summarize the key findings across all documents"
- "What are the most important concepts discussed?"

### Local search

Local search focuses on specific entities and their relationships within your
knowledge graph. It is ideal for detailed queries about particular concepts,
entities, or relationships.

- **Entity Identification**: Identifies relevant entities from the knowledge graph based on the query.
- **Context Gathering**: Collects:
   - Related text chunks from original documents.
   - Connected entities and their strongest relationships.
   - Entity descriptions and attributes.
   - Context from the community each entity belongs to.
- **Prioritized Response**: Generates a response using the most relevant gathered information.

**Best use cases**:
- "What are the properties of [specific entity]?"
- "How is [entity A] related to [entity B]?"
- "What are the key details about [specific concept]?"

## Installation

The Retriever service can be configured to use either the Triton Inference Server
(for private LLM deployments) or OpenAI/OpenRouter (for public LLM deployments).

To start the service, use the AI service endpoint `/v1/graphragretriever`. 
Please refer to the documentation of [AI service](gen-ai.md) for more
information on how to use it.

### Using Triton Inference Server (Private LLM)

The first step is to install the LLM Host service with the LLM and
embedding models of your choice. The setup will the use the 
Triton Inference Server and MLflow at the backend. 
For more details, please refer to the [Triton Inference Server](triton-inference-server.md)
and [Mlflow](mlflow.md) documentation.

Once the `llmhost` service is up-and-running, then you can start the Importer
service using the below configuration:

```json
{
  "env": {
    "username": "your_username",
    "db_name": "your_database_name",
    "api_provider": "triton",
    "triton_url": "your-arangodb-llm-host-url",
    "triton_model": "mistral-nemo-instruct"
  },
}
```

Where:
- `username`: ArangoDB database user with permissions to access collections.
- `db_name`: Name of the ArangoDB database where the knowledge graph is stored.
- `api_provider`: Specifies which LLM provider to use.
- `triton_url`: URL of your Triton Inference Server instance. This should be the URL where your `llmhost` service is running.
- `triton_model`: Name of the LLM model to use for text processing.

### Using OpenAI (Public LLM)

```json
{
  "env": {
    "openai_api_key": "your_openai_api_key",
    "username": "your_username",
    "db_name": "your_database_name",
    "api_provider": "openai"
  },
}
```

Where:
- `username`: ArangoDB database user with permissions to access collections.
- `db_name`: Name of the ArangoDB database where the knowledge graph is stored.
- `api_provider`: Specifies which LLM provider to use.
- `openai_api_key`: Your OpenAI API key.

{{< info >}}
By default, for OpenAI API, the service is using
`gpt-4o-mini` and `text-embedding-3-small` models as LLM and
embedding model respectively.
{{< /info >}}

### Using OpenRouter (Gemini, Anthropic, etc.)

OpenRouter makes it possible to connect to a huge array of LLM API providers,
including non-OpenAI LLMs like Gemini Flash, Anthropic Claude and publicly hosted
open-source models.

When using the OpenRouter option, the LLM responses are served via OpenRouter while
OpenAI is used for the embedding model.

```json
    {
      "env": {
        "db_name": "your_database_name",
        "username": "your_username",
        "api_provider": "openrouter",
        "openai_api_key": "your_openai_api_key",
        "openrouter_api_key": "your_openrouter_api_key",
        "openrouter_model": "mistralai/mistral-nemo"  // Specify a model here
      },
    }
```

Where:
- `username`: ArangoDB database user with permissions to access collections.
- `db_name`: Name of the ArangoDB database where the knowledge graph is stored.
- `api_provider`: Specifies which LLM provider to use.
- `openai_api_key`: Your OpenAI API key (for the embedding model).
- `openrouter_api_key`: Your OpenRouter API key (for the LLM).
- `openrouter_model`: Desired LLM (optional; default is `mistral-nemo`).

{{< info >}}
When using OpenRouter, the service defaults to `mistral-nemo` for generation
(via OpenRouter) and `text-embedding-3-small` for embeddings (via OpenAI).
{{< /info >}}

## Executing queries

After the Retriever service is installed successfully, you can interact with 
it using the following HTTP endpoints, based on the selected search method.

{{< tabs "executing-queries" >}}

{{< tab "Local search" >}}
```bash
curl -X POST /v1/graphrag-query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is the AR3 Drone?",
    "query_type": 2,
    "provider": 0
  }'
```
{{< /tab >}}

{{< tab "Global search" >}}

```bash
curl -X POST /v1/graphrag-query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is the AR3 Drone?",
    "level": 1,
    "query_type": 1,
    "provider": 0
  }'
```
{{< /tab >}}

{{< /tabs >}}

The request parameters are the following:
- `query`: Your search query text.
- `level`: The community hierarchy level to use for the search (`1` for top-level communities).
- `query_type`: The type of search to perform.
  - `1`: Global search.
  - `2`: Local search.
- `provider`: The LLM provider to use
  - `0`: OpenAI (or OpenRouter)
  - `1`: Triton

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

## Best Practices

- **Choose the right search method**:
   - Use global search for broad, thematic queries.
   - Use local search for specific entity or relationship queries.


- **Performance considerations**:
   - Global search may take longer due to its map-reduce process.
   - Local search is typically faster for concrete queries.

## API Reference

For detailed API documentation, see the
[GraphRAG Retrievers API Reference](https://arangoml.github.io/platform-dss-api/graphrag_retrievers/proto/index.html).
