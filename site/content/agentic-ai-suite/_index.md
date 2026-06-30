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
---

{{< embed-svg "Agentic-AI-Suite-Architecture" "The Agentic AI Suite, layer by layer." >}}

## A layered architecture

The Agentic AI Suite is organized as a set of cooperating layers. Each layer
owns one stage of the journey that turns raw enterprise data into context that
your agents and your people can consume. Data flows from left to right: it is
**ingested**, shaped into a **Context Graph**, turned into an optimal
**RAG** system, **enriched and optimized**, backed by **purpose-built models**,
and finally **served to agents** — all while being **presented** through
interactive interfaces and kept fully **observable**.

### Ingestion Layer — AutoImport

[**AutoImport**](importer/_index.md) is intelligent data ingestion: any source,
any format, automatically. It manages your data sources, links to external
databases, imports files, and hands both structured and unstructured data to
the next layer.

- **ArangoLink** — a unified connector framework that covers 20+ source types
  (and all major SQL databases through one SQLAlchemy-based connector) out of
  the box, so no custom ETL code is required.
- **Source Manager** — monitors freshness and triggers delta re-ingestion
  automatically, so only changed documents are re-processed.
- **File Manager** — maintains version history, content hashes, and a full
  lineage graph for byte-0-to-vertex provenance and GDPR-compliant deletion.
- **File Upload** — brings in unstructured sources (PDF, Office documents,
  HTML, Markdown, images, and charts) alongside structured SQL data in the
  same pipeline.

### Context Graph Layer — AutoGraph

[**AutoGraph**](autograph/_index.md) receives the structured and unstructured
data and builds a usable **Context Graph** for your enterprise out of the box —
no months of manual ontology design required. It provides entity resolution,
feature extraction from documents, AI-aided ontology generation and curation,
and **Virtual Graph** capabilities whose ontology can later be used for
federated queries.

### RAG Building Layer — AutoRAG

[**AutoRAG**](autograph/reference/rag-strategizer.md) analyzes the Context Graph,
decides how to build an optimal [**GraphRAG**](graphrag/_index.md) system, and
builds it as a set of **RAG partitions**.

- **PartitionBuilders** extract entities, relations, communities, and semantic
  units in parallel, one strategy per auto-discovered domain — anything from
  plain vector embeddings to full GraphRAG with custom ontologies and image
  extraction, interpretation, and description.
- **FileParser** exhaustively parses large volumes of multimodal sources.
- A fractal, partitioned design means a new RAG partition is added simply by
  writing documents with a new `partition_id`, with no schema change and no
  full rebuild.

### Context Harness Layer — Context Optimizer

The **Context Optimizer** is the AI that measures and enhances your Context
Graph and retrieval process. It orchestrates a harness of specialized tools so
that quality and cost are optimized automatically, with no manual benchmarking
and no need to study graph algorithms:

- **AutoEval** — automatically produces test sets, benchmarks, metrics, and
  experiments, suggesting configurations along the cost/accuracy frontier.
- **GAE** — the [Graph Analytics Engine](graph-analytics/_index.md) enriches the
  graph with PageRank and other graph-algorithmic insights.
- [**AQL Optimizer**](reasoner/_index.md) — analyzes and optimizes AQL queries
  using AI-powered reasoning, with validated performance improvements.
- **ToolBuilder** — automates the creation of the tools consumed by the
  Agentic Context Layer.
- **Entity Resolution Studio**, **Feature Extraction**, and **Ontology Builder**
  — refine the entities, features, and ontology of the Context Graph.

### Contextual Model Layer

This layer produces models tuned to your specific Context Graph and use case:

- [**GraphML**](graphml/_index.md) — trains graph neural networks for use cases
  such as fraud detection, link prediction, classification, and embeddings,
  directly on your Context Graph.
- **AutoTuner** — automatically produces fine-tuned models (such as embedding
  models) optimal for your Context Graph.
- **ModelHost** — Bring Your Own Model (BYOM), including
  [private LLMs](private-llms/_index.md) and the models you just fine-tuned with
  AutoTuner.

### Agentic Context Layer

This is where context gets served to your agents and your people:

- **AutoRetrievers** — the [Retriever](retriever/_index.md) returns natural
  language responses, with custom retrievers for every use case.
- **AgentMemory** — persistent agentic memories.
- **AgentBuilder** — no-code agentic workflows.
- **ToolGraph** — clustered tools, so an agent can find exactly the tool it
  needs, with support for custom tools and external agents through natural
  language queries and an SDK.

### Presentation Layer

- [**ADA**](ada.md) — the Arango Digital Assistant, your chatbot to talk to the
  database as an administrator.
- [**AQLizer**](natural-language-to-aql/_index.md) — automatically translates
  natural language into AQL.
- **Graph Visualizer** — world-class graph visualization.

### Observability Layer

- **AutoObserve** — full observability, including LLM traces, a model registry,
  and an experiment registry.

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