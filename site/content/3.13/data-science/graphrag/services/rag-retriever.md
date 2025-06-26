---
title: RagRetriever Service
menuTitle: RagRetriever
description: >-
  RagRetriever is a powerful service that enables intelligent search and
  retrieval from knowledge graphs created by the GraphRAG Importer
# TODO: GraphRAG Importer == RagLoader?
weight: 15
---
## Summary

The RagRetriever service offers two distinct search methods:

- **Global Search**: Analyzes entire document to identify themes and patterns, perfect for high-level insights and comprehensive summaries.
- **Local Search**: Focuses on specific entities and their relationships, ideal for detailed queries about particular concepts.

The service supports both private (Triton Inference Server) and public (OpenAI) LLM deployments, making it flexible for various security and infrastructure requirements. With simple HTTP endpoints, you can easily query your knowledge graph and get contextually relevant responses.

Key features:
- Dual search methods for different query types
- Support for both private and public LLM deployments
- Simple REST API interface
- Integration with ArangoDB knowledge graphs
- Configurable community hierarchy levels

<!-- TODO: Summary and Overview seems redundant -->

## Overview

The RagRetriever service enables intelligent search and retrieval of information from your knowledge graph. It provides two powerful search methods - Global Search and Local Search - that leverage the structured knowledge graph created by the GraphRAG Importer to deliver accurate and contextually relevant responses to your natural language queries.

## Search Methods

### Global Search

Global Search is designed for queries that require understanding and aggregation of information across your entire document. It's particularly effective for questions about overall themes, patterns, or high-level insights in your data.

#### How Global Search Works

1. **Community-Based Analysis**: Uses pre-generated community reports from your knowledge graph to understand the overall structure and themes of your data
2. **Map-Reduce Processing**:
   - **Map Stage**: Processes community reports in parallel, generating intermediate responses with rated points
   - **Reduce Stage**: Aggregates the most important points to create a comprehensive final response

#### Best Use Cases
- "What are the main themes in the dataset?"
- "Summarize the key findings across all documents"
- "What are the most important concepts discussed?"

### Local Search

Local Search focuses on specific entities and their relationships within your knowledge graph. It's ideal for detailed queries about particular concepts, entities, or relationships.

#### How Local Search Works

1. **Entity Identification**: Identifies relevant entities from the knowledge graph based on the query
2. **Context Gathering**: Collects:
   - Related text chunks from original documents
   - Connected entities and their strongest relationships
   - Entity descriptions and attributes
   - Context from the community each entity belongs to
3. **Prioritized Response**: Generates a response using the most relevant gathered information

#### Best Use Cases
- "What are the properties of [specific entity]?"
- "How is [entity A] related to [entity B]?"
- "What are the key details about [specific concept]?"

## How to install RagRetriever Service

The RagRetriever service can be configured to use either Triton Inference Server (for private LLM deployments) or OpenAI / OpenRouter (for public LLM deployments). 
To start the service, use GenAI service endpoint `/v1/graphragretriever`. Please refer to the documentation of GenAI service for more information on how to use it.
Here are the configuration options for all 3 options:

### Using Triton Inference Server (Private LLM)

First setup and install LLM-Host service with LLM and embedding models of your choice. The setup will use Triton Inference Server and mlflow at the backend. Please refer to below documentation for more detail:
// @docs-team please insert reference to GenAI/Triton documentation here

Once the LLM-host service is installed and running successfully, then you can start the retriever service using the below reference:

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

- `username`: ArangoDB database user with permissions to access collections
- `db_name`: Name of the ArangoDB database where the knowledge graph is stored
- `api_provider`: Specifies which LLM provider to use
- `triton_url`: URL of your Triton Inference Server instance. This should be the URL where your LLM-host service is running
- `triton_model`: Name of the LLM model to use for text processing

### Using OpenAI

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

- `username`: ArangoDB database user with permissions to access collections
- `db_name`: Name of the ArangoDB database where the knowledge graph is stored
- `api_provider`: Specifies which LLM provider to use
- `openai_api_key`: Your OpenAI API key

Note: By default for OpenAI API, we use gpt-4-mini and text-embedding-3-small models as LLM and embedding model respectively.
### Using OpenRouter (Gemini, Anthropic, etc.)

OpenRouter makes it possible to connect to a huge array of LLM API providers, including non-OpenAI LLMs like Gemini Flash, Anthropic Claude and publicly hosted open-source models.

When using the OpenRouter option, the LLM responses are served via OpenRouter while OpenAI is used for the embedding model.

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

- `username`: ArangoDB database user with permissions to access collections  
- `db_name`: Name of the ArangoDB database where the knowledge graph is stored  
- `api_provider`: Specifies which LLM provider to use  
- `openai_api_key`: Your OpenAI API key (for the embedding model)  
- `openrouter_api_key`: Your OpenRouter API key (for the LLM)  
- `openrouter_model`: Desired LLM (optional; default is `mistral-nemo`)

> **Note**  
> When using OpenRouter, we default to `mistral-nemo` for generation (via OpenRouter) and `text-embedding-3-small` for embeddings (via OpenAI).
## Using the Retriever Service

### Executing Queries

After the retriever service is installed successfully. You can interact with the retriever service using the following HTTP endpoint:

#### Local Search

```bash
curl -X POST /v1/graphrag-query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is the AR3 Drone?",
    "query_type": 2,
    "provider": 0
  }'
```

#### Global Search

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

The request parameters are:
- `query`: Your search query text
- `level`: The community hierarchy level to use for the search (1 for top-level communities)
- `query_type`: The type of search to perform
  - `1`: Global Search
  - `2`: Local Search
- `provider`: The LLM provider to use
  - `0`: OpenAI (or OpenRouter)
  - `1`: Triton

### Health Check

Monitor the service health:
```bash
GET /v1/health
```

## Best Practices

1. **Choose the Right Search Method**:
   - Use Global Search for broad, thematic queries
   - Use Local Search for specific entity or relationship queries


2. **Performance Considerations**:
   - Global Search may take longer due to its map-reduce process
   - Local Search is typically faster for concrete queries

