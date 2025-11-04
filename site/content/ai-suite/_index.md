---
title: The AI Suite of the Arango AI Data Platform
menuTitle: AI Suite
weight: 2
description: >-
  A comprehensive AI solution that transforms your data into intelligent
  knowledge graphs with GraphRAG capabilities, applies advanced machine learning
  with GraphML, and provides enterprise-grade tools for analytics,
  natural language querying, and AI-powered insights, all through an intuitive
  web interface
---
## What's included

The AI Suite is composed of three major components:

- [**GraphRAG**](graphrag/_index.md): A complete solution for extracting entities
  from text files to create a knowledge graph that you can then query with a
  natural language interface.
- [**GraphML**](graphml/_index.md): Apply machine learning to graphs for link prediction,
  classification, and similar tasks.
- [**AQLizer**](aqlizer.md): Generate AQL queries from natural language to explore
  your data and gain insights without having to learn the query language first.

Each component has an intuitive graphical user interface integrated into the
Arango Data Platform web interface, guiding you through the process.

Alongside these components, you also get the following additional features:

- [**Graph Analytics**](graph-analytics.md): Run graph algorithms such as PageRank
  on dedicated compute resources.
- [**Jupyter notebooks**](notebook-servers.md): Run a Jupyter kernel in the
  Data Platform for hosting interactive notebooks for experimentation and
  development of applications that use ArangoDB as their backend.
- **Public and private LLM support**: Use public large language models (LLMs)
  such as OpenAI or private LLMs with [Triton Inference Server](reference/triton-inference-server.md).  
- [**MLflow integration**](reference/mlflow.md): Use the popular MLflow as a
  model registry for private LLMs or to run machine learning experiments.
- **Application Programming Interfaces (APIs)**: Use the underlying APIs of the
  AI Suite and build your own integrations. See the
  [Protocol Documentation](https://arangoml.github.io/platform-dss-api/GenAI-Service/proto/index.html)
  for more details.
