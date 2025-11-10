---
title: The Arango Data Platform (v3.0)
menuTitle: Arango Data Platform
weight: 1
description: >-
  The Arango Data Platform brings everything ArangoDB offers together to a single
  solution that you can deploy on-prem or use as a managed service
---
{{< tip >}}
The Arango Data Platform is available as a pre-release. To get
exclusive early access, [get in touch](https://arango.ai/contact-us/) with
the Arango team.
{{< /tip >}}

The Arango Data Platform is a **Kubernetes-native** technical infrastructure that acts as the umbrella
for hosting the entire ArangoDB offering of products. Built from the ground up for 
cloud-native orchestration, the platform leverages the power of Kubernetes to make it easy
to deploy, scale, and operate the core ArangoDB database system along with any additional
AI solutions for GraphRAG, graph machine learning, data explorations, and more. You can
run it on-premises or in the cloud yourself on top of Kubernetes to access all
of the platform features with enterprise-grade automation and reliability.

## What Makes Up the Arango Data Platform

The Arango Data Platform is built on a layered architecture that combines powerful
components into a unified solution:

- **ArangoDB Enterprise Edition**: The multi-model database foundation supporting
  graphs, documents, key-value, vector search, and full-text search capabilities.

- **Graph Visualizer**: A sophisticated web-based interface for graph exploration,
  smart search, and visual layouts.

- **Arango Platform Suite**: Enterprise-grade features including high availability
  and monitoring, comprehensive APIs and connectors, centralized orchestration and
  resource management.

All components are orchestrated through Kubernetes, providing automated deployment,
scaling, and management with enterprise-grade reliability.

For a detailed breakdown of each component, see [Features and Architecture](features/).

## Extend the Arango Data Platform with AI capabilities

Extend the Arango Data Platform with the [**AI Suite**](../ai-suite/_index.md) 
that offers advanced AI and machine learning capabilities that integrate seamlessly
into the platform's unified web interface.

What you get with the AI Suite:

- [GraphRAG](../ai-suite/graphrag/): Generate knowledge graphs from documents and enable
   conversational querying of your data.
- [GraphML](../ai-suite/graphml/): Apply machine learning algorithms that leverage graph
  structure for better predictions.
- [Graph Analytics](../ai-suite/graph-analytics/): Run advanced algorithms like PageRank
  to discover influential nodes and patterns.
- [AQLizer](../ai-suite/aqlizer.md): Generate AQL queries from natural language.
- [Jupyter notebooks](../ai-suite/notebook-servers.md): Run Jupyter Notebooks to build and
  experiment with graph-powered data, AI, and machine learning workflows directly connected
  to ArangoDB databases. 
- Public and private LLM support: Use public LLMs such as OpenAI
  or private LLMs with [Triton Inference Server](../ai-suite/reference/triton-inference-server.md).
- [MLflow integration](../ai-suite/reference/mlflow.md): Use the popular MLflow as a model registry
  for private LLMs or to run machine learning experiments as part of the Arango Data Platform.

{{< tip >}}
The AI Suite requires a separate license.
{{< /tip >}}

{{< cards >}}

{{% card title="Get started with the Arango Data Platform" link="get-started/" %}}
Deploy the core ArangoDB database system with Kubernetes orchestration.
Optionally add AI Suite to turn data into an AI-powered knowledge engine.
{{% /card %}}

{{% card title="Features and Architecture" link="features/" %}}
Explore the Kubernetes-native architecture, unified interface, and enterprise-grade capabilities of the Arango Data Platform.
{{% /card %}}

{{% card title="Kubernetes-Native Architecture" link="kubernetes/" %}}
Learn about the Kubernetes-native foundation that the Arango Data Platform is purpose-built on.
{{% /card %}}

{{% card title="Graph Visualizer" link="graph-visualizer/" %}}
Explore your graph data with an intuitive web interface and sophisticated querying capabilities.
{{% /card %}}

{{% card title="AI Suite" link="../../ai-suite/" %}}
Supercharge your platform with GraphRAG, GraphML, and advanced analytics for AI-powered data insights.
{{% /card %}}

{{% card title="ArangoDB Core Database" link="../../arangodb/" %}}
Discover the multi-model database at the heart of the platform supporting graphs, documents, key-value, and vector search.
{{% /card %}}

{{< /cards >}}
