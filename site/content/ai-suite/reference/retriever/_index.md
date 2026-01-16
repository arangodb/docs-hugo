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
exclusive early access, [get in touch](https://arango.ai/ai-preview/) with
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
You can use the Retriever service via the [web interface](../../graphrag/web-interface.md)
for Instant and Deep Search, or through the API for full control over all query types.
{{< /tip >}}

## Prerequisites

Before using the Retriever service, you need to:

1. **Create a GraphRAG project** - For detailed instructions on creating and 
   managing projects, see the [Projects](../ai-orchestrator.md#projects) section in the 
   AI Orchestration Service documentation.

2. **Import data** - Use the [Importer](../importer/) service to transform your 
   text documents into a knowledge graph stored in ArangoDB.

## Installation

To start the service, use the AI service endpoint:

{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/ai/v1/graphragretriever" >}}

Please refer to the documentation of the [AI orchestration service](../ai-orchestrator.md) for more
information on how to use it.

## LLM options

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

Arango's AI Services are fully compatible with OpenAI-compatible APIs, whether cloud-based or self-hosted.

Thus, you can connect to cloud-based services like OpenAI's models via the OpenAI API or a large array of models (Gemini, Anthropic, publicly hosted open-source models, etc.) via the OpenRouter option, as well as private Azure endpoints.

This option also works with private corporate LLMs that expose an OpenAI-compatible endpoint.

## Getting Started

To use the Retriever service, follow these steps:

1. **[Create a GraphRAG project](../ai-orchestrator.md#creating-a-project)**: Set up a project to organize your data.
2. **[Import data](../importer/)**: Build your knowledge graph using the Importer service.
3. **[Configure your LLM provider](llm-configuration.md)**: Choose and configure either Triton or OpenAI-compatible APIs.
4. **[Understand search methods](search-methods.md)**: Learn about Instant, Deep, Global, and Local search.
5. **[Execute queries](executing-queries.md)**: Start querying your knowledge graph.

**Additional resources:**

- **[Verify and Monitor](verify-and-monitor.md)**: Check service health and query status.
- **[Parameter Reference](parameters.md)**: Complete list of query parameters.

## API Reference

For detailed API documentation, see the
[GraphRAG Retrievers API Reference](https://arangoml.github.io/platform-dss-api/graphrag_retrievers/proto/index.html).

