---
title: RagLoader Service
menuTitle: RagLoader
description: >-
  The RagLoader service helps you transform your text document into a knowledge graph,
  making it easier to analyze and understand complex information
weight: 10
---
## Overview

The RagLoader service lets you turn text files into a knowledge graph.
It supports the following text formats with UTF-8 encoding:
- `.txt` (Plain text)
- `.md` (Markdown)

The RagLoader takes your text, analyzes it using the configured language model, and
creates a structured knowledge graph. This graph is then imported into your
ArangoDB database, where you can query and analyze the relationships between
different concepts in your document with the RagRetriever service.

## What ArangoDB Collections look like after import

The RagLoader creates several collections in ArangoDB to store different
aspects of your knowledge graph. See below a detailed explanation of each
collection.

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

## Deployment options

You can choose between two deployment options based on your needs.

### Private LLM

If you're working in an air-gapped environment or need to keep your data
private, you can use the private LLM mode with Triton Inference Server.
This option allows you to run the service completely within your own
infrastructure. The Triton Inference Server is a crucial component when
running in private LLM mode. It serves as the backbone for running your
language (LLM) and embedding models on your own machines, ensuring your
data never leaves your infrastructure. The server handles all the complex
model operations, from processing text to generating embeddings, and provides
both HTTP and gRPC interfaces for communication.

### Public LLM

Alternatively, if you prefer a simpler setup and don't have specific privacy
requirements, you can use the public LLM mode. This option connects to cloud-based
services like OpenAI's models via the OpenAI API or a large array of models
(Gemini, Anthropic, publicly hosted open-source models, etc.) via the OpenRouter option.


## Installation and configuration

The RagLoader service can be configured to use either:
- Triton Inference Server (for private LLM deployments)
- OpenAI (for public LLM deployments)
- OpenRouter (for public LLM deployments)

To start the service, use the GenAI service endpoint `/v1/graphragimporter`. 
Please refer to the documentation of [GenAI service](gen-ai.md) for more
information on how to use it.

### Using Triton Inference Server (Private LLM)

The first step is to install the LLM Host service with the LLM and
embedding models of your choice. The setup will the use the 
Triton Inference Server and MLflow at the backend. 
For more details, please refer to the [Triton Inference Server](./triton-inference-server.md)
and [Mlflow](./mlflow.md) documentation.

Once the `llmhost` service is up-and-running, then you can start the RAGloader
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
- `username`: ArangoDB database user with permissions to create and modify collections.
- `db_name`: Name of the ArangoDB database where the knowledge graph will be stored.
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
- `username`: ArangoDB database user with permissions to create and modify collections
- `db_name`: Name of the ArangoDB database where the knowledge graph will be stored
- `api_provider`: Specifies which LLM provider to use
- `openai_api_key`: Your OpenAI API key

{{< info >}}
By default, for OpenAI API, the service is using
`gpt-4o-mini` and `text-embedding-3-small` models as LLM and
embedding model respectively.
{{< /info >}}

### Using OpenRouter (Gemini, Anthropic, etc.)

OpenRouter makes it possible to connect to a huge array of LLM API
providers, including non-OpenAI LLMs like Gemini Flash, Anthropic Claude
and publicly hosted open-source models.

When using the OpenRouter option, the LLM responses are served via OpenRouter
while OpenAI is used for the embedding model.

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
- `username`: ArangoDB database user with permissions to access collections  
- `db_name`: Name of the ArangoDB database where the knowledge graph is stored  
- `api_provider`: Specifies which LLM provider to use  
- `openai_api_key`: Your OpenAI API key (for the embedding model)  
- `openrouter_api_key`: Your OpenRouter API key (for the LLM)  
- `openrouter_model`: Desired LLM (optional; default is `mistral-nemo`)

{{< info >}}
When using OpenRouter, the service defaults to `mistral-nemo` for generation
(via OpenRouter) and `text-embedding-3-small` for embeddings (via OpenAI).
{{< /info >}}

## Building Knowledge Graphs

Once the service is installed successfully, you can follow these steps
to send an input file to the RAGloader service:

1. Prepare your text document for processing (text format with UTF-8 encoding or markdown files).
2. Send the document to the RagLoader service using HTTP:
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
   - `<your-arangodb-platform-url>`: Your ArangoDB Platform URL.
   - `<url-postfix>`: The URL postfix configured in your deployment.


   The service will:
   - Process the document using the configured LLM model.
   - Generate embeddings using the embedding model.
   - Build a knowledge graph.
   - Import the graph into your ArangoDB database.

## Verifying the import

You can verify that the import was successful by checking your ArangoDB database:

1. Connect to your ArangoDB instance.
2. Navigate to the specified database.
3. Verify that the following collections exist:
   - `knowledge_graph_vertices`: Contains the nodes of the knowledge graph i.e. documents, chunks, communities, and entities.
   - `knowledge_graph_edges`: Contains the relationships between nodes i.e. relations.