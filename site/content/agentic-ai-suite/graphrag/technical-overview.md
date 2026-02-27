---
title: GraphRAG Technical Overview
menuTitle: Technical Overview
weight: 15
description: >-
  Technical overview of ArangoDB's GraphRAG solution, including
  architecture, services, and deployment options
---
## Introduction

Large language models (LLMs) and knowledge graphs are two prominent and
contrasting concepts, each possessing unique characteristics and functionalities
that significantly impact the methods we employ to extract valuable insights from
constantly expanding and complex datasets.

LLMs, such as those powering OpenAI's ChatGPT, represent a class of powerful language
transformers. These models leverage advanced neural networks to exhibit a
remarkable proficiency in understanding, generating, and participating in
contextually-aware conversations.

On the other hand, knowledge graphs contain carefully structured data and are
designed to capture intricate relationships among discrete and seemingly
unrelated information.

Arango's unique capabilities and flexible integration of knowledge graphs and
LLMs provide a powerful and efficient solution for anyone seeking to extract
valuable insights from diverse datasets.

The GraphRAG component of the AI Suite brings all the capabilities
together with an easy-to-use interface, so you can make the knowledge accessible
to your organization.

## Why GraphRAG

GraphRAG is particularly valuable for use cases like the following:

- Applications requiring in-depth knowledge retrieval
- Contextual question answering
- Reasoning over interconnected information
- Discovery of relationships between concepts across documents

For detailed business scenarios, see [GraphRAG Use Cases](../autograph/use-cases.md).

## Ways to use GraphRAG

You can interact with Arango's GraphRAG solution via a web interface or an API,
depending on your needs.

### Web Interface

The [Web Interface](web-interface.md) provides a user-friendly, no-code way to work 
with GraphRAG.

The web interface guides you through the process of the following:

1. Creating projects.
2. Configuring Importer and Retriever services.
3. Uploading documents to build knowledge graphs.
4. Querying your knowledge graph with natural language.
5. Exploring the graph structure visually.

### API and Services

The [AI Orchestrator](../reference/ai-orchestrator.md), 
[Importer](../reference/importer.md), and [Retriever](../reference/retriever/_index.md) 
services provide programmatic access to create and manage GraphRAG pipelines, 
and give you access to advanced search methods.

## How GraphRAG works

Arango's GraphRAG solution democratizes the creation and usage of knowledge
graphs with a unique combination of vector search, graphs, and LLMs (privately or publicly hosted)
in a single product.

The overall workflow involves the following steps:

1. **Chunking**:
   - Breaking down raw documents into text chunks
2. **Entity and relation extraction for Knowledge Graph construction**:
   - LLM-assisted description of entities and relations
   - Entities get inserted as nodes with embeddings
   - Relations get inserted as edges, these include: entity-entity, entity-chunk, chunk-document
3. **Topology-based clustering into mini-topics (called communities)**:
   - Each entity points to its community
   - Each community points to its higher-level community, if available
     (mini-topics point to major topics)
4. **LLM-assisted community summarization**:
   - Community summarization is based on all information available about each topic

### Turn text files into a Knowledge Graph

The Importer service is the entry point of the GraphRAG pipeline. It takes a
raw text file as input, processes it using an LLM to extract entities and
relationships, and generates a Knowledge Graph. The Knowledge Graph is then
stored in an ArangoDB database for further use. The Knowledge Graph represents
information in a structured graph format, allowing efficient querying and retrieval.

1. Pre-process the raw text file to identify entities and their relationships.
2. Use LLMs to infer connections and context, enriching the Knowledge Graph.
3. Store the generated Knowledge Graph in the database for retrieval and reasoning.

For detailed information about the service, see the
[Importer](../reference/importer/) service documentation.

### Query your Knowledge Graph

The Retriever service enables intelligent search and retrieval using multiple 
search methods optimized for different query types. For detailed information 
about the service, see the [Retriever](../reference/retriever/_index.md) service documentation.

The Retriever provides different search methods, each optimized for specific query patterns:

- **Instant Search**: Fast streaming responses for quick answers.
- **Deep Search**: LLM-orchestrated multi-step research for comprehensive accuracy.
- **Global Search**: Community-based analysis for themes and overviews.
- **Local Search**: Entity-focused retrieval for specific relationships.

{{< info >}}
The Web Interface exposes **Instant Search** and **Deep Search** as the primary 
methods for ease of use. For access to all search methods with advanced 
parameters, use the API directly. See [Retriever - Search Methods](../reference/retriever/search-methods.md) 
for complete details.
{{< /info >}}

## LLM Options

The GraphRAG services can utilize public and private LLMs, depending on your 
infrastructure requirements and data governance needs.

### Self-hosted models via Triton Inference Server

For air-gapped environments or strict data privacy requirements, you can run 
all models on your own infrastructure.
The Triton Inference Server serves as the backbone for running your LLM
and embedding models on your own machines. It handles all model operations, from 
processing text to generating embeddings, and provides both HTTP and gRPC interfaces 
for communication.

For setup instructions, see [Triton Inference Server](../reference/triton-inference-server.md) 
and [MLflow](../reference/mlflow.md) documentation.

### Using OpenAI-compatible endpoints

For a simpler setup, you can use any service that exposes an OpenAI-compatible API 
endpoint. This includes both cloud providers and private corporate LLMs such as
OpenAI, OpenRouter, Google Gemini, Anthropic Claude, and any corporate or self-hosted
LLM with OpenAI-compatible endpoints.

For detailed configuration examples, see:
- [Importer - Deployment Options](../reference/importer.md#deployment-options)
- [Retriever - Installation](../reference/retriever/_index.md)

## Limitations

The pre-release version of Arango GraphRAG has the following limitations:

- The knowledge graph generated from the file is imported into a named graph
  with the name `{project_name}_kg` and set of collections prefixed with your
  project name (e.g., `{project_name}_Documents`, `{project_name}_Chunks`, etc.).
