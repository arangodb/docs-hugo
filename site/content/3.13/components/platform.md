---
title: The ArangoDB Platform
menuTitle: Platform
weight: 169
description: >-
  The ArangoDB Platform brings everything ArangoDB offers together to a single
  solution that you can deploy on-prem or use as a managed service
---
The ArangoDB Platform is a technical infrastructure that acts as the umbrella
for hosting the entire ArangoDB offering of products. The Platform makes it easy
to deploy and operate the core ArangoDB database system along with any additional
ArangoDB products for machine learning, data explorations, and more. You can
run it on-premise or in the cloud yourself on top of Kubernetes, as well as use
ArangoDB's managed service, the [ArangoGraph Insights Platform](../arangograph/_index.md)
to access all of the platform features.

## Requirements for self-hosting

- **Kubernetes**: Orchestrates the selected services that comprise the
  ArangoDB Platform, running them in containers for safety and scalability.
- **Helm**: A package manager for Kubernetes. It is used to install Platform
  services with the correct versions.
- **Licenses**: If you want to use any paid features, you need to purchase the
  respective packages.

## Features of the ArangoDB Platform

- **Core database system**: The ArangoDB graph database system for storing
  interconnected data. You can use the free Community Edition or the commercial
  Enterprise Edition.
- **Graph visualizer**: A web-based tool for exploring your graph data with an
  intuitive interface and sophisticated querying capabilities.
- **Graph Analytics**: A suite of graph algorithms including PageRank,
  community detection, and centrality measures with support for GPU
  acceleration thanks to Nvidia cuGraph.
- **GraphML**: A turnkey solution for graph machine learning for prediction
  use cases such as fraud detection, supply chain, healthcare, retail, and
  cyber security.
- **GenAI Suite**: A set of paid machine learning services, APIs, and
  user interfaces that are available as a package as well as individual products.
  - **GraphRAG**: Leverage ArangoDB's graph, document, key-value,
      full-text search, and vector search features to streamline knowledge
      extraction and retrieval.
      {{< comment >}}TODO: Not available in prerelease version
      - **Txt2AQL**: Unlock natural language querying with a service that converts
        user input into ArangoDB Query Language (AQL), powered by fine-tuned
        private or public LLMs. <!-- TODO: GenAI -->
      {{< /comment >}}
      - **GraphRAG Importer**: Extract entities and relationships from large
        text-based files, converting unstructured data into a knowledge graph
        stored in ArangoDB.
      - **GraphRAG Retriever**: Perform semantic similarity searches or aggregate
        insights from graph communities with global and local queries.
      - **MLflow integration**: Use the popular MLflow for machine learning
        practitioners as part of the ArangoDB Platform.
- **Jupyter notebooks**: Run a Jupyter kernel in the platform for hosting
  interactive notebooks for experimentation and development of applications
  that use ArangoDB as their backend.
{{< comment >}}TODO: Mostly unrelated to Platform, vector index in core, 
- **Vector embeddings**: You can train machine learning models for later use
  in vector search in conjunction with the core database system's `vector`
  index type. It allows you to find similar items in your dataset.
{{< /comment >}}

<!-- TODO: Which product requires what license, free trial -->

## Additional features of the ArangoDB Platform




## Get started with the ArangoDB Platform

### Use the ArangoDB Platform as a managed service

<!-- TODO: Sign up at https://dashboard.arangodb.cloud -->

### Self-host the ArangoDB Platform

<!-- TODO: Adam's installer -->

## Interfaces

<!-- TODO: UIs, APIs (with links to generated docs) -->