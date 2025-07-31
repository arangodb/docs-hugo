---
title: Feature list of the ArangoDB Platform
menuTitle: ArangoDB Platform
weight: 10
description: >-
  The ArangoDB Platform is a scalable architecture that gets you all features
  of ArangoDB including graph-powered machine learning and GenAI as a single
  solution with a unified interface
---
For in-depth information about the ArangoDB Platform as a whole and how to
deploy and use it, see [The ArangoDB Platform](../../components/platform.md).

## Architecture

- **Core Database**: The ArangoDB database system forms the solid core
  of the ArangoDB Platform.

- **Kubernetes**: An open-source container orchestration system for automating
  software deployment, scaling, and management designed by Google. It is the
  autopilot for operating ArangoDB clusters and the additional Platform services.

- **Helm**: A package manager for Kubernetes that enables consistent, repeatable
  installations and version control.

- **Envoy**: A high-performance service proxy that acts as the gateway for the
  ArangoDB Platform for centralizing authentication and routing.

- **Web interface**: The Platform includes a unified, browser-based UI that lets
  you access its features in an intuitive way. Optional products like the
  GenAI Suite seamlessly integrate into the UI if installed.

## Features

- [**ArangoDB Core**](core.md): The ArangoDB database system with support for
  graphs, documents, key-value, full-text search, and vector search.

- [**Graph Visualizer**](../../graphs/graph-visualizer.md):
  A web-based tool for exploring your graph data with an intuitive interface and
  sophisticated querying capabilities.

- [**Graph Analytics**](../../graphs/graph-analytics.md):
  A service that can efficiently load graph data from the core database system
  and run graph algorithms such as PageRank and many more.

- [**GenAI Suite**](../../data-science/_index.md):
  ArangoDB's graph-powered machine learning (GraphML) as well as GraphRAG for
  automatically building knowledge graphs from text and taking advantage of both
  excerpts and higher-level summaries as context for turbocharging GenAI
  applications.

- [**Notebook servers**](../../data-science/notebook-servers.md):
  Run Jupyter kernels in the Platform for hosting interactive, Python-based
  notebooks to experiment and develop applications.

- [**MLflow integration**](../../data-science/graphrag/services/mlflow.md):
  Use the popular MLflow for machine learning practitioners as part of the
  ArangoDB Platform.
