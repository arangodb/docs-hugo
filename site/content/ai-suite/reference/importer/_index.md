---
title: Importer Service
menuTitle: Importer
description: >-
  The Importer service helps you transform your text documents into a knowledge graph,
  making it easier to analyze and understand complex information
weight: 10
---
{{< tip >}}
The Arango AI Data Platform is available as a pre-release. To get
exclusive early access, [get in touch](https://arango.ai/ai-preview/) with
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
You can also use the GraphRAG Importer service via the [AI Data Platform web interface](../../graphrag/web-interface.md).
{{< /tip >}}

## Prerequisites

Before importing data, you need to create a GraphRAG project. Projects help you 
organize your work and keep your data separate from other projects.

For detailed instructions on creating and managing projects, see the 
[Projects](../ai-orchestrator.md#projects) section in the AI Orchestration Service 
documentation.

Once you have created a project, you can reference it when deploying the Importer 
service using the `project_name` field in the service configuration.

## Installation

To install and start the Importer service, use the AI service endpoint `/v1/graphragimporter`. 
This endpoint is part of the AI Orchestration Service, which manages the lifecycle of all 
AI services in the platform.

For detailed instructions on installing, monitoring, and managing the Importer service, 
see the [AI Orchestration Service](../ai-orchestrator.md) documentation.

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

## Getting Started

To use the Importer service, follow these steps:

1. **[Create a GraphRAG project](../ai-orchestrator.md#creating-a-project)**: Set up a project to organize your data.
2. **[Configure your LLM provider](llm-configuration.md)**: Choose and configure either Triton or OpenAI-compatible APIs.
3. **[Import your documents](importing-files.md)**: Upload single or multiple files to build your knowledge graph.
4. **[Verify the results](verify-and-explore.md)**: Check that your data was imported successfully and what ArangoDB collections look like after the import.

**Additional resources:**

- **[Semantic Units](semantic-units.md)**: Process images and multimedia content.
- **[Parameter Reference](parameters.md)**: Complete list of import parameters.

## API Reference

For detailed API documentation, see the
[GraphRAG Importer API Reference](https://arangoml.github.io/platform-dss-api/graphrag_importer/proto/index.html).

