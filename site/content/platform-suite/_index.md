---
title: The Arango Platform Suite (v4.0)
menuTitle: Platform Suite
weight: 3
description: >-
  The Platform Suite is a set of services and features for operating ArangoDB
  with Kubernetes and includes a Graph Visualizer and advanced Query Editor
aliases:
  - data-platform/get-started
---
## What Makes Up the Arango Platform Suite

- [**ArangoDB Enterprise Edition**](../arangodb/_index.md):
  The multi-model database foundation supporting graphs, documents, key-value,
  vector search, and full-text search capabilities.

- [**Graph Visualizer**](graph-visualizer.md):
  A sophisticated web-based interface for graph exploration, smart search, and
  visual layouts.

- [**Query Editor**](query-editor.md):
  Write, run, and analyze AQL queries using an IDE-like interface with tabs,
  result history, query management, and more.

- **Operational features**: Enterprise-grade features including high availability
  and monitoring, comprehensive APIs and connectors, centralized orchestration and
  resource management.

All components are orchestrated through Kubernetes, providing automated deployment,
scaling, and management with enterprise-grade reliability.

For a detailed breakdown of each component, its architecture and features, see
[The Arango Contextual Data Platform](../contextual-data-platform/_index.md).

## Extend the Arango Contextual Data Platform with AI capabilities

Extend the Arango Contextual Data Platform and its Platform Suite with the
[**Agentic AI Suite**](../agentic-ai-suite/_index.md) to get the fully featured
data platform with all its services. It offers advanced AI and machine learning
capabilities that integrate seamlessly into the platform's unified web interface.

{{< tip >}}
The Agentic AI Suite requires a separate license.
{{< /tip >}}

## Deployment options

### Use the Arango Contextual Data Platform as a managed service

You can request the Arango Contextual Data Platform as a managed service for the
[Arango Managed Platform (AMP)](../../amp/_index.md).

[Get in touch](https://arango.ai/contact-us/) with the Arango team to learn more.

### Self-host the Arango Contextual Data Platform

You can set up and run the Arango Contextual Data Platform on-premises or in the cloud and
manage this deployment yourself.

For a guide how to set up the Contextual Data Platform yourself, see
[Install and upgrade the Arango Contextual Data Platform](../contextual-data-platform/install-and-upgrade/_index.md).

{{< info >}}
**Kubernetes-Native**: The Arango Contextual Data Platform is built specifically for Kubernetes 
environments and relies on the official [ArangoDB Kubernetes Operator](https://arangodb.github.io/kube-arangodb/) 
to provide automated deployment, scaling, and management capabilities.
{{< /info >}}

## Recommended resources

{{< cards >}}

{{% card title="Graph Visualizer" link="graph-visualizer/" %}}
Explore your graph data with an intuitive web interface and sophisticated querying capabilities.
{{% /card %}}

{{% card title="Query Editor" link="query-editor/" %}}
Learn about the Kubernetes-native foundation that the Arango Contextual Data Platform is purpose-built on.
{{% /card %}}

{{< /cards >}}
