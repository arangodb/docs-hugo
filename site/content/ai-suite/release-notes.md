---
title: What's new in the AI Suite
menuTitle: Release notes
weight: 100
description: >-
  Features and improvements in the AI Suite of the Arango Data Platform
---
{{< tip >}}
The AI Suite is available as a pre-release. To get exclusive early access,
[get in touch](https://arango.ai/contact-us/) with the Arango team.
{{< /tip >}}

## October 2024 (pre-release)

This release introduces new features and enhancements to the AI Suite components.
See also the [Arango Data Platform Release Notes](../data-platform/release-notes.md).

### GraphRAG enhancements

- **Instant and Deep Search**: New [Retriever](reference/retriever.md#search-methods) search methods
  optimized for different use cases. Instant Search provides fast responses with
  streaming support. Deep Search offers detailed, accurate responses complex queries
  requiring high accuracy. Both methods are accessible via the API or the
  [GraphRAG web interface](graphrag/web-interface.md#chat-with-your-knowledge-graph).

- **Update Knowledge Graphs**: [Add additional data sources](graphrag/web-interface.md#update-the-knowledge-graph)
  to existing Knowledge Graphs through the web interface. Upload new files to
  automatically update the Knowledge Graph and underlying collections with new data.

- **Unified LLM provider configuration**: Simplified deployment configuration using
  OpenAI-compatible APIs. Mix and match providers for chat and embeddings (e.g.,
  use OpenRouter for chat and OpenAI for embeddings). Support for OpenAI, OpenRouter,
  Gemini, Anthropic, and any self-hosted LLM with OpenAI-compatible endpoints.

### AQLizer

The [Natural Language to AQL Translation Service](reference/natural-language-to-aql.md)
enables you to query your ArangoDB database using natural language or get LLM-powered answers to general questions. 

You can generate AQL queries from natural language directly in the Query Editor using the
[AQLizer](aqlizer.md) mode. More advanced features are available via the API.

## July 2024 (pre-release)

This release marks the initial internal launch of the AI Suite with the following
components. For Data Platform features in this release, see
[Arango Data Platform Release Notes](../data-platform/release-notes.md).

- **[GraphRAG](graphrag/_index.md)**: Transform unstructured documents into
  intelligent knowledge graphs and natural language querying through Importer
  and Retriever services.

- **[GraphML](graphml/_index.md)**: Apply machine learning to graphs with node
  classification and embedding generation, built on GraphSAGE framework.

- **[Graph Analytics](graph-analytics.md)**: Run algorithms like PageRank,
  Connected Components, and more.

- **[Jupyter Notebooks](notebook-servers.md)**: Launch integrated Jupyter
  notebook servers with pre-installed ArangoDB drivers and data science libraries
  for interactive experimentation.

- **[MLflow Integration](reference/mlflow.md)**: Use MLflow as a model registry
  for private LLMs and machine learning experiment tracking.

- **[Triton Inference Server](reference/triton-inference-server.md)**: Host
  private Large Language Models using NVIDIA Triton Inference Server for secure,
  on-premises AI capabilities.

