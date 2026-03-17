---
title: The Arango Contextual Data Platform (v4.0)
menuTitle: Arango Contextual Data Platform
weight: 1
description: >-
  The Arango Contextual Data Platform provides entity-aware retrieval,
  graph-based reasoning, temporal state management, and platform-level
  governance to support reliable, stateful agentic AI systems in
  production environments
---
The Arango Contextual Data Platform brings everything Arango offers together
in a single solution that you can deploy and self-manage on-premises or in the
cloud, or use as a managed service - [Arango Managed Platform (AMP)](../amp/_index.md).
It is built on a modern, cloud-native foundation designed for enterprise
scalability and reliability.

## Architecture

The Arango Contextual Data Platform is a layered architecture that combines
powerful components into a unified solution. It always includes the
[Platform Suite](../platform-suite/_index.md) and you can extend it with the
[Agentic AI Suite](../agentic-ai-suite/_index.md).
The [ArangoDB](../arangodb/_index.md) multi-model database system is the
foundation for it all.

{{< image src="../images/Arango-Contextual-Data-Platform-All.svg" alt="Product layers and features of the Arango Contextual Data Platform" style="display: block; margin: 2rem auto;" >}}

The Contextual Data Platform is a [**Kubernetes-native**](kubernetes.md) technical infrastructure that
acts as the umbrella for hosting the entire Arango offering of products.
Built from the ground up for cloud-native orchestration, the platform leverages
the power of Kubernetes to make it easy to deploy, scale, and operate the core
ArangoDB database system along with additional services and AI solutions for
GraphRAG, graph machine learning, data explorations, and more. You can
run it on-premises or in the cloud yourself on top of Kubernetes to access all
of the platform features with enterprise-grade automation and reliability.

## Platform components

The Arango Contextual Data Platform consists of multiple integrated components
that work together to provide a complete, enterprise-ready solution.

The following list gives you a high-level overview of the Contextual Data Platform.
Follow the links for a more details explanation of each component.

- [**Kubernetes**](kubernetes.md):\
  At its core, the Arango Contextual Data Platform is purpose-built for
  Kubernetes environments. Kubernetes is the technical infrastructure that is
  used for container orchestration, automated deployment, scaling, and
  management. The official ArangoDB Kubernetes Operator (`kube-arangodb`) is
  leveraged to deliver enterprise-grade database management, automation,
  scalability, high availability, and operational excellence.

- [**ArangoDB Enterprise Edition**](arangodb.md):\
  The multi-model database system acts as the solid foundation for all your
  graph, document, key-value, search, and vector needs.

- [**Arango Platform Suite**](platform-suite.md):\
  Various services and features for working with your data and operating the
  platform. It includes a **unified web interface** with a **Graph Visualizer**
  and an advanced **Query Editor**.

- [**Arango Agentic AI Suite**](agentic-ai-suite.md):\
  A sophisticated set of services and features in addition to the Platform Suite
  to enhance the Contextual Data Platform.

  Includes **Ada**, the AI digital assistant, **AutoGraph** to organize
  enterprise data into contextual knowledge graph, **AutoRAG** to optimize
  retrieval across graph, vector, and document data, **AQLizer** to generate
  optimized queries from natural language, **Arango GraphML** (graph machine learning)
  for node classification and computing embeddings, **Graph Analytics Engines**
  for running graph algorithms, as well as integrations for machine learning
  projects such as **Jupyter notebooks** and **MLflow**.
