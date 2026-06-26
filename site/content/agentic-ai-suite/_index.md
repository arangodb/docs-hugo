---
title: The Agentic AI Suite of the Arango Contextual Data Platform (v4.0)
menuTitle: Agentic AI Suite
weight: 2
description: >-
  A comprehensive AI solution that transforms your data into intelligent
  knowledge graphs with GraphRAG capabilities, applies advanced machine learning
  with GraphML, and provides enterprise-grade tools for analytics,
  natural language querying, and AI-powered insights, all through an intuitive
  web interface
aliases:
  - arangodb/3.12/data-science # 3.10, 3.11
  - arangodb/stable/data-science # 3.10, 3.11
  - arangodb/4.0/data-science # 3.10, 3.11
  - arangodb/devel/data-science # 3.10, 3.11
  - supported-llm-models
---

{{< embed-svg "Agentic-AI-Suite-Overview" "Agentic AI Suite at a glance." >}}

## What's included

The Agentic AI Suite is composed of the following major components:

- [**Ada**](ada.md): The AI digital assistant, for natural language interaction and development.
- [**AutoGraph**](autograph/_index.md): Organize enterprise data into a
  contextual knowledge graph, with the **AutoRAG** assigning each
  domain the right processing depth.
- [**Natural Language to AQL/AQLizer**](natural-language-to-aql/_index.md): Generate AQL
  queries from natural language to explore your data and gain insights without having
  to learn the query language first.
- [**Reasoner**](reasoner/): Automatically analyze and optimize AQL queries
  using AI-powered reasoning, with validated performance improvements.
- [**GraphRAG**](graphrag/_index.md): A complete solution for extracting entities
  from text files to create a knowledge graph that you can then query with a
  natural language interface.
- [**GraphML**](graphml/_index.md): Apply machine learning to graphs for link prediction,
  classification, and computing embeddings.
- [**Graph Analytics**](graph-analytics/_index.md):
  Run graph algorithms such as PageRank on dedicated compute resources to
  discover influential nodes and patterns.

Each component has an intuitive graphical user interface integrated into the
Arango Contextual Data Platform web interface, guiding you through the process.

Alongside these components, you also get the following additional features:

- [**Jupyter notebooks**](notebook-servers.md): Run a Jupyter kernel in the
  Contextual Data Platform for hosting interactive notebooks for experimentation and
  development of applications that use ArangoDB as their backend.
- **Public and private LLM support**: Use public large language models (LLMs)
  such as OpenAI or private LLMs with [Triton Inference Server](private-llms/triton-inference-server.md).  
- [**MLflow integration**](private-llms/mlflow.md): Use the popular MLflow as a
  model registry for private LLMs or to run machine learning experiments.
- **Application Programming Interfaces (APIs)**: Use the underlying APIs of the
  Agentic AI Suite and build your own integrations. See the
  [API Reference](https://apiref.arango.ai/) for more details.

## Where your data lives

The Arango Contextual Data Platform deploys and integrates multiple services,
but the data itself lives in the ArangoDB core database system. Everything
the Agentic AI Suite produces (knowledge graphs, embeddings, analytics
results, query history) is persisted as collections and documents in
ArangoDB databases, alongside your existing application data.

The exception is raw files (PDFs, images, office documents, and other
binaries) that you upload for Agentic AI processing, such as GraphRAG input.
These are stored in object storage (S3, MinIO, or another blob store) and
managed through the
[File Manager](../platform-suite/file-manager/_index.md) service. The same
File Manager also holds the code packages uploaded through the Container
Manager's
[Bring Your Own Code](../platform-suite/container-manager/_index.md#bring-your-own-code)
flow, so its contents are not exclusive to the Agentic AI Suite.
Any structured data extracted from uploaded files
(entities, relationships, embeddings) is written back into ArangoDB.

## Sample datasets

If you want to try out ArangoDB's data science features, you may use the
[`arango-datasets` Python package](../ecosystem/arango-datasets.md)
to load sample datasets into a deployment.

## Supported LLM and embedding models

The services of the Agentic AI Suite work with OpenAI-compatible APIs (OpenAI,
OpenRouter, and other compatible providers) as well as self-hosted models served
through Triton Inference Server.

A model is listed as supported by the suite only if it works seamlessly across
the Importer, Retriever, and AutoGraph services. Individual services may also
work with additional models — for the full list available to a specific
service, see that service's own documentation (for example,
[Importer LLM Configuration](importer/llm-configuration.md#supported-models)).

{{% llm-models %}}
