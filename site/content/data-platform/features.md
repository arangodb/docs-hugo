---
title: Feature list of the Arango Data Platform
menuTitle: Features
weight: 5
description: >-
  The Arango Data Platform is a scalable Kubernetes-native architecture that gets you all features
  of ArangoDB as a single solution with a unified interface
---
## Architecture

The Arango Data Platform is built on a modern, cloud-native foundation designed for enterprise scalability and reliability.

{{< tip >}}
**Kubernetes-Native Architecture**: Built as a cloud-native platform that leverages 
[Kubernetes](https://kubernetes.io/) for container orchestration, automated deployment, 
scaling, and management. Powered by the official 
[ArangoDB Kubernetes Operator](https://arangodb.github.io/kube-arangodb/) for
enterprise-grade database management and high availability.
{{< /tip >}}

- **Core Database**: The ArangoDB database system forms the solid core
  of the Arango Data Platform.

- **Helm**: A package manager for Kubernetes that enables consistent, repeatable
  installations and version control.

- **Envoy**: A high-performance service proxy that acts as the gateway for the
  Arango Data Platform for centralizing authentication and routing.

- **Web interface**: The Platform includes a unified, browser-based UI that lets
  you access its features in an intuitive way. Optional products like the
  AI Services seamlessly integrate into the UI if installed.

## Kubernetes Integration

At its core, the Arango Data Platform is purpose-built for Kubernetes environments, leveraging the 
[official ArangoDB Kubernetes Operator](https://arangodb.github.io/kube-arangodb/docs/) 
(`kube-arangodb`) to deliver enterprise-grade automation, scalability, and operational excellence.

## Features

The Arango Data Platform provides these core capabilities out of the box:

- [**ArangoDB Core**](../arangodb/3.12/_index.md): The ArangoDB database system with support for
  graphs, documents, key-value, full-text search, and vector search.

- [**Graph Visualizer**](graph-visualizer.md):
  A web-based tool for exploring your graph data with an intuitive interface and
  sophisticated querying capabilities.

## Extend the Arango Data Platform with AI capabilities

Take your Arango Data Platform to the next level with [**AI Services**](../ai-services/_index.md) that offers advanced AI and machine learning capabilities that integrate seamlessly into the platform's unified web interface.

What you get with AI Services:

- [GraphRAG](../ai-services/graphrag/): Generate knowledge graphs from documents and enable
   conversational querying of your data.
- [GraphML](../ai-services/graphml/): Apply machine learning algorithms that leverage graph
  structure for better predictions.
- [Graph Analytics](../ai-services/graph-analytics/): Run advanced algorithms like PageRank
  to discover influential nodes and patterns.
- [Jupyter notebooks](../ai-services/notebook-servers.md): Run Jupyter Notebooks to build and
  experiment with graph-powered data, AI, and machine learning workflows directly connected
  to ArangoDB databases. 
- Public and private LLM support: Use public LLMs such as OpenAI
  or private LLMs with [Triton Inference Server](../ai-services/reference/triton-inference-server.md).
- [MLflow integration](../ai-services/reference/mlflow.md): Use the popular MLflow as a model registry
  for private LLMs or to run machine learning experiments as part of the Arango Data Platform.

{{< tip >}}
AI Services integrate directly into the existing platform interface, no need for
separate systems to manage or learn. A separate license is required.
{{< /tip >}}







