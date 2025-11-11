---
title: How to get started with GraphML
menuTitle: Quickstart
weight: 5
description: >-
  You can use GraphML straight within the Arango Data Platform, via the web interface
  or via Notebooks
aliases:
  - ../../arangodb/3.12/data-science/arangographml/deploy # 3.10, 3.11
  - ../../arangodb/stable/data-science/arangographml/deploy # 3.10, 3.11
  - ../../arangodb/4.0/data-science/arangographml/deploy # 3.10, 3.11
  - ../../arangodb/devel/data-science/arangographml/deploy # 3.10, 3.11
---
## Web interface versus Jupyter Notebooks

The Arango Data Platform provides enterprise-ready Graph Machine Learning in two options,
tailored to suit diverse requirements and preferences: 
- Using the web interface
- In a scriptable manner, using the integrated Jupyter Notebooks and the HTTP API for GraphML

## Setup

{{< tabs "graphml-setup" >}}

{{< tab "Web Interface" >}}
The web interface of the Arango Data Platform allows you to create, configure, and
run a full machine learning workflow for GraphML. To get started, see the
[Web interface for GraphML](ui.md) page.
{{< /tab >}}

{{< tab "Notebooks" >}}
The ArangoDB Notebooks service runs on the
[Arango Managed Platform (AMP)](https://dashboard.arangodb.cloud/home?utm_source=docs&utm_medium=cluster_pages&utm_campaign=docs_traffic).
It offers a pre-configured environment where everything,
including necessary components and configurations, comes preloaded. You don't
need to set up or configure the infrastructure, and can immediately start using the
GraphML functionalities in a scriptable manner. To get started, see the
[GraphML Notebooks & API](notebooks-api.md) reference documentation.

{{< tip >}}
To get access to GraphML services and packages in Arango Managed Platform (AMP),
[get in touch](https://arangodb.ai/contact-us/)
with the Arango team.
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

![ArangoGraphML Pipeline](../../images/ArangoGraphML_Pipeline.png)
{{< /tab >}}

{{< /tabs >}}