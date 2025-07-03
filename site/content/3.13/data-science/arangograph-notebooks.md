---
title: ArangoDB Notebooks
menuTitle: ArangoDB Notebooks
weight: 130
description: >-
  Colocated Jupyter Notebooks within the ArangoDB Platform
---

{{< tag "ArangoDB Platform" >}}

ArangoDB Notebooks provide a Jupyter-based environment for interactive data science
and GenAI, GraphRAG, graph analytics, and exploration of ArangoDB datasets.
The notebooks enable seamless integration of ArangoDB’s multi-model capabilities
with data science tools and libraries in Python.

ArangoDB Notebooks provide a Python-based, Jupyter-compatible interface for building
and experimenting with graph-powered data, GenAI, and graph machine learning
workflows directly connected to ArangoDB databases. The notebooks offer a
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

<!-- TODO: Add links to corressponding pages -->

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

<!-- TODO: Describe underlying services? -->

<!-- TODO: Add links to interactive tutorials? -->

