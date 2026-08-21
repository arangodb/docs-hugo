---
title: Agentic AI Suite
menuTitle: Agentic AI Suite
weight: 2
description: >-
  A comprehensive AI solution that transforms your documents into a Context
  Graph with AutoGraph and answers questions from it with AutoRAG, applies
  advanced machine learning with GraphML, and provides enterprise-grade tools for
  analytics, natural language querying, and AI-powered insights, all through an
  intuitive web interface
aliases:
  - arangodb/3.12/data-science # 3.10, 3.11
  - arangodb/stable/data-science # 3.10, 3.11
  - arangodb/4.x/data-science # 3.10, 3.11
  - arangodb/devel/data-science # 3.10, 3.11
---
{{< embed-svg "Agentic-AI-Suite-Overview" "Agentic AI Suite at a glance." >}}

## What's included

The Agentic AI Suite is composed of the following major components:

- [**Ada**](ada/_index.md): The AI digital assistant, for natural language interaction and development.
- [**AutoGraph and AutoRAG**](autograph/_index.md): **AutoGraph** organizes
  enterprise data into a **Context Graph**, assigning each domain the right
  processing depth. **AutoRAG** is the retrieval layer on top: it deploys the
  retrievers that answer questions from that Context Graph. Both stages are
  driven from the **AutoGraph Studio** view of the web interface. See
  [GraphRAG Concepts](autograph/concepts.md) for the approach behind them.
- [**Natural Language to AQL/AQLizer**](natural-language-to-aql/_index.md): Generate AQL
  queries from natural language to explore your data and gain insights without having
  to learn the query language first.
- [**Reasoner**](reasoner/): Automatically analyze and optimize AQL queries
  using AI-powered reasoning, with validated performance improvements.
- [**GraphML**](graphml/_index.md): Apply machine learning to graphs for link prediction,
  classification, and computing embeddings.
- [**Graph Analytics**](graph-analytics/_index.md):
  Run graph algorithms such as PageRank on dedicated compute resources to
  discover influential nodes and patterns.

Most components have an intuitive graphical user interface integrated into the
Arango Contextual Data Platform web interface, guiding you through the process.
In the left-hand sidebar, **Agentic AI Suite** groups **AutoGraph Studio**,
**Graph Analytics**, and **GraphML**.

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
binaries) that you upload for Agentic AI processing, such as the documents you
feed into AutoGraph.
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

The services of the Agentic AI Suite work with OpenAI-compatible APIs as well as
self-hosted models served through Triton Inference Server. The recommended setup
is the `openai` provider with the OpenAI models listed below: that is the
combination ArangoDB tests, and other endpoints can differ in behavior such as
latency.

You can still use any other OpenAI-compatible endpoint — OpenRouter, Google
Gemini, Anthropic, Azure, or a corporate LLM — and run a model that is not on the
list. In the Importer, AutoGraph, and Retriever, use the `custom` provider for
these: it is the intended way to point a service at an OpenAI-compatible
endpoint that is not the OpenAI API itself, and you should always set
`chat_api_url` / `embedding_api_url` explicitly with it. In those three
services, pointing the `openai` provider at a non-OpenAI URL is **not
supported**. Natural Language to AQL has no `custom` provider and reaches such
endpoints with `openai` plus a `chat_api_url` — see
[Natural Language to AQL setup](natural-language-to-aql/setup.md). Models
beyond the ones listed below are outside ArangoDB's testing, so validate them in
your own environment.

"OpenAI-compatible" here has a specific meaning: the suite talks to providers
through the OpenAI Chat Completions client, so an endpoint must implement the
`/v1/chat/completions` contract that client expects (and `/v1/embeddings` for
embedding models). An endpoint that exposes only a different API surface is not
supported, even if it is marketed as OpenAI-compatible. Some newer OpenAI models
require the Responses API (`/v1/responses`) instead; the Importer and AutoGraph
detect this and fall back automatically.

A model is listed as supported by the suite only if it works seamlessly across
the Importer, Retriever, and AutoGraph services. Individual services may also
work with additional models — for the full list available to a specific
service, see that service's own documentation (for example,
[Importer LLM Configuration](importer/llm-configuration.md#supported-models)).

{{% llm-models %}}
