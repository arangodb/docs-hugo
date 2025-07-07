---
title: Notebook Servers
menuTitle: Notebook Servers
weight: 130
description: >-
  Colocated Jupyter Notebooks within the ArangoDB Platform
aliases:
  - data-science/arangograph-notebooks
---

{{< tag "ArangoDB Platform" >}}

ArangoDB Notebooks provide a Python-based, Jupyter-compatible interface for building
and experimenting with graph-powered data, GenAI, and graph machine learning
workflows directly connected to ArangoDB databases. The notebook servers are
embedded in the ArangoGraph ecosystem and offer a
pre-configured environment where everything, including all the necessary services
and configurations, comes preloaded. You don't need to set up or configure the
infrastructure, and can immediately start using the GraphML and GenAI
functionalities.

The notebooks are primarily focused on the following solutions:
- **GraphRAG**: A complete solution for extracting entities
  from text files to create a knowledge graph that you can then query with a
  natural language interface.
- **GraphML**: Apply machine learning to graphs for link prediction,
  classification, and similar tasks.
- **Integrations** : Use ArangoDB together with cuGraph, NetworkX, and other data science tools.

<!-- TODO: Add links to corresponding pages -->

The ArangoDB Notebooks also include the following services and tools:
- Automatically connect to ArangoDB databases and GenAI platform services
- [Magic commands](../arangograph/notebooks.md#arangograph-magic-commands)
  that simplify database interactions
- [ArangoDB CLI Tools](../components/tools/) included in each Notebook server
  to interact with ArangoDB from the command line  

## Quickstart

1. In the ArangoDB Platform web interface, select a database.
2. Under **GenAI Tools**, click **Notebook servers**.
3. The **Notebook servers** page displays an overview of the notebook services. Click
  **New notebook server** to create a new one.
4. After your notebook service is launched, you can start interacting with the
  Jupyter interface.

{{< tip >}}
To get a better understanding of how to interact with ArangoDB, use
the `GettingStarted.ipynb` template from the file browser.
{{< /tip >}}

<!-- TODO: Add links to interactive tutorials? -->