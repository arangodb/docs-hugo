---
title: How to get started with GraphML
menuTitle: Quickstart
weight: 5
description: >-
  You can use GraphML straight within the ArangoDB Platform, via the web interface
  or via Notebooks
aliases:
  - ../arangographml/deploy  
---

## Web interface versus Jupyter Notebooks

The ArangoDB Platform provides enterprise-ready Graph Machine Learning in two options,
tailored to suit diverse requirements and preferences: 
- Using the web interface
- In a scriptable manner, using the integrated Jupyter Notebooks and the HTTP API for GraphML

## Setup

{{< tabs "graphml-setup" >}}

{{< tab "Web Interface" >}}
The web interface of the ArangoDB Platform allows you to create, configure, and
run a full machine learning workflow for GraphML. To get started, see the
[Web interface for GraphML](ui.md) page.
{{< /tab >}}

{{< tab "Notebooks" >}}
The ArangoDB Notebooks service runs on the
[ArangoGraph Insights Platform](https://dashboard.arangodb.cloud/home?utm_source=docs&utm_medium=cluster_pages&utm_campaign=docs_traffic).
It offers a pre-configured environment where everything,
including necessary components and configurations, comes preloaded. You don't
need to set up or configure the infrastructure, and can immediately start using the
GraphML functionalities in a scriptable manner. To get started, see the
[GraphML Notebooks & API](notebooks-api.md) reference documentation.

{{< tip >}}
To get access to GraphML services and packages in ArangoGraph Insights Platform,
[get in touch](https://www.arangodb.com/contact/)
with the ArangoDB team.
{{< /tip >}}

- **Accessible at all levels**
  - Low code UI
  - Notebooks
  - APIs
- **Full usability**
  - MLOps lifecycle
  - Metrics
  - Metadata capture
  - Model management

![ArangoGraphML Pipeline](../../../images/ArangoGraphML_Pipeline.png)
{{< /tab >}}

{{< /tabs >}}