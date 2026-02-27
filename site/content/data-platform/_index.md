---
title: The Arango Platform Suite (v4.0)
menuTitle: Arango Platform Suite
weight: 3
description: >-
  The Arango Data Platform brings everything ArangoDB offers together to a single
  solution that you can deploy on-prem or use as a managed service
aliases:
  - data-platform/get-started
---
The Arango Data Platform is a **Kubernetes-native** technical infrastructure that
acts as the umbrella for hosting the entire ArangoDB offering of products.
Built from the ground up for cloud-native orchestration, the platform leverages
the power of Kubernetes to make it easy to deploy, scale, and operate the core
ArangoDB database system along with additional services and AI solutions for
GraphRAG, graph machine learning, data explorations, and more. You can
run it on-premises or in the cloud yourself on top of Kubernetes to access all
of the platform features with enterprise-grade automation and reliability.

## What Makes Up the Arango Data Platform

The Arango Data Platform is built on a layered architecture that combines powerful
components into a unified solution:

- [**ArangoDB Enterprise Edition**](../arangodb/_index.md):
  The multi-model database foundation supporting graphs, documents, key-value,
  vector search, and full-text search capabilities.

- [**Graph Visualizer**](graph-visualizer.md):
  A sophisticated web-based interface for graph exploration, smart search, and
  visual layouts.

- **Arango Platform Suite**: Enterprise-grade features including high availability
  and monitoring, comprehensive APIs and connectors, centralized orchestration and
  resource management.

All components are orchestrated through Kubernetes, providing automated deployment,
scaling, and management with enterprise-grade reliability.

For a detailed breakdown of each component, see [Features and Architecture](features/).

## Extend the Arango Data Platform with AI capabilities

Extend the Arango Data Platform with the [**Agentic AI Suite**](../agentic-ai-suite/_index.md) 
that offers advanced AI and machine learning capabilities that integrate seamlessly
into the platform's unified web interface.

{{< tip >}}
The Agentic AI Suite requires a separate license.
{{< /tip >}}

## Deployment options

### Use the Arango Data Platform as a managed service

You can request the Arango Data Platform as a managed service for the
[Arango Managed Platform (AMP)](../../amp/_index.md).

[Get in touch](https://arango.ai/contact-us/) with the Arango team to learn more.

### Self-host the Arango Data Platform

You can set up and run the Arango Data Platform on-premises or in the cloud and
manage this deployment yourself.

For a guide how to set up the Data Platform yourself, see
[Install and upgrade the Arango Data Platform](install-and-upgrade/_index.md).

{{< info >}}
**Kubernetes-Native**: The Arango Data Platform is built specifically for Kubernetes 
environments and relies on the official [ArangoDB Kubernetes Operator](https://arangodb.github.io/kube-arangodb/) 
to provide automated deployment, scaling, and management capabilities.
{{< /info >}}

## Recommended resources

{{< cards >}}

{{< comment >}}
{{% card title="Get started with the Arango Data Platform" link="get-started/" %}}
Deploy the core ArangoDB database system with Kubernetes orchestration.
Optionally add the Agentic AI Suite to turn data into an AI-powered knowledge engine.
{{% /card %}}
{{< /comment >}}

{{% card title="Features and Architecture" link="features/" %}}
Explore the Kubernetes-native architecture, unified interface, and enterprise-grade capabilities of the Arango Data Platform.
{{% /card %}}

{{% card title="Kubernetes-Native Architecture" link="kubernetes/" %}}
Learn about the Kubernetes-native foundation that the Arango Data Platform is purpose-built on.
{{% /card %}}

{{% card title="Graph Visualizer" link="graph-visualizer/" %}}
Explore your graph data with an intuitive web interface and sophisticated querying capabilities.
{{% /card %}}

{{% card title="Agentic AI Suite" link="../../agentic-ai-suite/" %}}
Supercharge your platform with GraphRAG, GraphML, and advanced analytics for AI-powered data insights.
{{% /card %}}

{{% card title="ArangoDB Core Database" link="../../arangodb/" %}}
Discover the multi-model database at the heart of the platform supporting graphs, documents, key-value, and vector search.
{{% /card %}}

{{< /cards >}}
