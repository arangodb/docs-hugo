---
title: Importer Service
menuTitle: Importer
description: >-
  The Importer service helps you transform your text document into a knowledge graph,
  making it easier to analyze and understand complex information
weight: 10
---
{{< tip >}}
The Arango AI Data Platform is available as a pre-release. To get
exclusive early access, [get in touch](https://arango.ai/contact-us/) with
the Arango team.
{{< /tip >}}

## Overview

The Importer service lets you turn text files into a knowledge graph.
It supports the following text formats with UTF-8 encoding:
- `.txt` (Plain text)
- `.md` (Markdown)

The Importer takes your text, analyzes it using the configured language model, and
creates a structured knowledge graph. This graph is then imported into your
ArangoDB database, where you can query and analyze the relationships between
different concepts in your document with the Retriever service.

{{< tip >}}
You can also use the GraphRAG Importer service via the [Data Platform web interface](../graphrag/web-interface.md).
{{< /tip >}}

## Prerequisites

Before importing data, you need to create a GraphRAG project. Projects help you 
organize your work and keep your data separate from other projects.

For detailed instructions on creating and managing projects, see the 
[Projects](ai-orchestrator.md#projects) section in the GenAI Orchestration Service 
documentation.

Once you have created a project, you can reference it when deploying the Importer 
service using the `genai_project_name` field in the service configuration.

## Deployment options

You can choose between two deployment options based on your needs.

### Triton Inference Server

If you're working in an air-gapped environment or need to keep your data
private, you can use Triton Inference Server.
This option allows you to run the service completely within your own
infrastructure. The Triton Inference Server is a crucial component when
running with self-hosted models. It serves as the backbone for running your
language (LLM) and embedding models on your own machines, ensuring your
data never leaves your infrastructure. The server handles all the complex
model operations, from processing text to generating embeddings, and provides
both HTTP and gRPC interfaces for communication.

### OpenAI-compatible APIs

Alternatively, if you prefer a simpler setup and don't have specific privacy
requirements, you can use OpenAI-compatible APIs. This option connects to cloud-based
services like OpenAI's models via the OpenAI API or a large array of models
(Gemini, Anthropic, publicly hosted open-source models, etc.) via the OpenRouter option.
It also works with private corporate LLMs that expose an OpenAI-compatible endpoint.


## Installation and configuration

The Importer service can be configured to use either Triton Inference Server or any
OpenAI-compatible API. OpenAI-compatible APIs work with public providers (OpenAI,
OpenRouter, Gemini, Anthropic) as well as private corporate LLMs that expose an
OpenAI-compatible endpoint.

To start the service, use the AI service endpoint `/v1/graphragimporter`. 
Please refer to the documentation of the [AI orchestration service](ai-orchestrator.md) for more
information on how to use it.

### Using OpenAI-compatible APIs

The `openai` provider works with any OpenAI-compatible API, including:
- OpenAI (official API)
- OpenRouter
- Google Gemini
- Anthropic Claude
- Corporate or self-hosted LLMs with OpenAI-compatible endpoints

set the `chat_api_url` and `embedding_api_url` to point to your provider's endpoint.

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
embedding models of your choice. The setup will the use the 
Triton Inference Server and MLflow at the backend. 
For more details, please refer to the [Triton Inference Server](triton-inference-server.md)
and [Mlflow](mlflow.md) documentation.

Once the `llmhost` service is up-and-running, then you can start the Importer
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

## Building Knowledge Graphs

Once the service is installed successfully, you can follow these steps
to send an input file to the Importer service:

1. Prepare your text document for processing (text format with UTF-8 encoding or markdown files).
2. Send the document to the Importer service using HTTP:
   ```bash
   # Base64 encode your document
   base64_content=$(base64 -i your_document.txt)
   
   # Send to the Loader service
   curl -X POST /v1/import \
     -H "Content-Type: application/json" \
     -d '{
       "file_content": "'$base64_content'",
       "file_name": "your_document.txt"
     }'
   ```

   Replace the following placeholders:
   - `<your-arangodb-platform-url>`: Your Arango Data Platform URL.
   - `<url-postfix>`: The URL postfix configured in your deployment.


   The service will:
   - Process the document using the configured LLM model.
   - Generate embeddings using the embedding model.
   - Build a knowledge graph.
   - Import the graph into your ArangoDB database.

## Verifying the import

You can verify the state of the import process via the following endpoint:

```
GET /ai/v1/project_by_name/<your_project>
```

For example, the `status` object found within `importerServices` may contain the following
properties:

```json
"status": {
    "status": "service_completed",
    "progress": 100,
    "message": ""
}
```

Alternatively, you can also see if the import was successful by checking your ArangoDB database:

1. Connect to your ArangoDB instance.
2. Navigate to the specified database.
3. Verify that the following collections exist:
   - `knowledge_graph_vertices`: Contains the nodes of the knowledge graph i.e. documents, chunks, communities, and entities.
   - `knowledge_graph_edges`: Contains the relationships between nodes i.e. relations.


## What ArangoDB Collections look like after import

The Importer creates several collections in ArangoDB to store different
aspects of your knowledge graph. See below a detailed explanation of each
collection. All collections are using the name of your project as a prefix.

### Documents collection

- **Purpose**: Stores the original text document that were processed.
- **Key Fields**:
  - `_key`: Unique identifier for the document.
  - `content`: The full text content of the document.
- **Usage**: Acts as the root level container for all document-related data.

### Chunks Collection

- **Purpose**: Stores text chunks extracted from documents for better processing and analysis.
- **Key Fields**:
  - `_key`: Unique identifier for the chunk.
  - `content`: The text content of the chunk.
  - `tokens`: Number of tokens in the chunk.
  - `chunk_order_index`: Position of the chunk in the original document.
- **Usage**: Enables granular analysis of document content and maintains document structure.

### Entities Collection

- **Purpose**: Stores entities extracted from the text, such as persons, organizations, concepts, etc.
- **Key Fields**:
  - `_key`: Unique identifier for the entity.
  - `entity_name`: Name of the entity.
  - `entity_type`: Type of entity (e.g., person, organization).
  - `description`: Description of the entity.
  - `embedding`: Vector representation of the entity for similarity search.
  - `clusters`: Community clusters the entity belongs to.
- **Usage**: Enables entity-based querying and semantic search.

### Communities Collection

- **Purpose**: Stores thematic clusters of related entities that form meaningful
  communities within your documents. Each community represents a cohesive group
  of concepts, characters, or themes that are closely related and interact with
  each other. These communities help identify and analyze the main narrative
  threads, character relationships, and thematic elements in your documents.
- **Key Fields**:
  - `_key`: Unique identifier for the community.
  - `title`: Cluster ID to which this community belongs to.
  - `report_string`: A detailed markdown-formatted analysis that explains the
    community's theme, key relationships, and significance. This includes
    sections on main characters, their roles, relationships, and the impact of key events or locations.
  - `report_json`: Structured data containing:
    - `title`: The main theme or focus of the community.
    - `summary`: A concise overview of the community's central narrative.
    - `rating`: A numerical score indicating the community's significance (the higher, the better).
    - `rating_explanation`: Justification for the rating.
    - `findings`: An array of detailed analyses, each containing a summary and explanation of key aspects.
  - `level`: The hierarchical level of the community (e.g., `1` for top-level communities).
  - `occurrence`: A normalized score (ranging from `0` to `1`) showing the relative frequency with which this community is mentioned or identified throughout your documents. A value close to 1 means this community is very common in your data and a value near `0` means it is rare.
  - `sub_communities`: References to more specific sub-communities that are part of this larger community.
- **Usage**: Enables you to:
  - Identify and analyze major narrative threads and themes.
  - Understand complex relationships between characters and concepts.
  - Track the significance and impact of different story elements.
  - Navigate through hierarchical relationships between themes.
  - Discover patterns and recurring elements in your documents.

### Relations Collection

- **Purpose**: Stores relationships between different nodes in the graph.
- **Key Fields**:
  - `_from`: Source node reference.
  - `_to`: Target node reference.
  - `type`: Type of relationship (e.g., **PART_OF**, **MENTIONED_IN**, **RELATED_TO**, **IN_COMMUNITY**).
  - Additional metadata depending on relationship type (Entity to Entity):
    - `weight`: Relationship strength (the higher, the better).
    - `description`: Description of the relationship.
    - `source_id`: Source of the relationship.
    - `order`: Order of the relationship.
- **Usage**: Enables traversal and analysis of relationships between different elements.

### Relationship Types

The system creates several types of relationships between nodes:

1. **PART_OF**: Links chunks to their parent documents.
2. **MENTIONED_IN**: Connects entities to the chunks where they are mentioned.
3. **RELATED_TO**: Shows relationships between different entities.
4. **IN_COMMUNITY**: Associates entities with their community groups.

### Vector Search Capabilities

The system automatically creates vector indexes on the `embedding` field in the Entities collection, enabling:
- Semantic similarity search
- Nearest neighbor queries
- Efficient vector-based retrieval

## API Reference

For detailed API documentation, see the
[GraphRAG Importer API Reference](https://arangoml.github.io/platform-dss-api/graphrag_importer/proto/index.html).
