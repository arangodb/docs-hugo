---
title: Architecture and Features of the Arango Data Platform (v3.0)
menuTitle: Architecture and Features
weight: 5
description: >-
  Discover how the Arango Data Platform combines database, visualization, and enterprise
  features into a unified, Kubernetes-native architecture
---
## Architecture

The Arango Data Platform is built on a modern, cloud-native foundation designed for enterprise scalability and reliability.

{{< tip >}}
**Kubernetes-Native Architecture**: Built as a cloud-native platform that leverages 
[Kubernetes](https://kubernetes.io/) for container orchestration, automated deployment, 
scaling, and management. Powered by the official 
[ArangoDB Kubernetes Operator](https://arangodb.github.io/kube-arangodb/) for
enterprise-grade database management and high availability.
{{< /tip >}}

### Kubernetes-Native

At its core, the Arango Data Platform is purpose-built for Kubernetes environments, leveraging the 
[official ArangoDB Kubernetes Operator](https://arangodb.github.io/kube-arangodb/docs/) 
(`kube-arangodb`) to deliver enterprise-grade automation, scalability, and operational excellence.

For detailed information about the Kubernetes foundation, see [Kubernetes Integration](kubernetes/).

### Technical Infrastructure

- **Helm**: A package manager for Kubernetes that enables consistent, repeatable
  installations and version control.

- **Envoy**: A high-performance service proxy that acts as the gateway for the
  Arango Data Platform for centralizing authentication and routing.

## Platform Components

The Arango Data Platform consists of multiple integrated components that work together
to provide a complete, enterprise-ready solution.

### ArangoDB Enterprise Edition

At the foundation is [**ArangoDB Enterprise Edition**](../arangodb/_index.md), the 
powerful multi-model database that provides:

- **Graph**: Native graph database capabilities with efficient traversals and pattern matching
- **Document**: Flexible JSON document storage with schema validation
- **Key-Value**: High-performance key-value operations
- **Vector**: Vector embeddings and similarity search for AI applications
- **Search**: Full-text search and complex query capabilities

### Graph Visualizer

The [**Graph Visualizer**](graph-visualizer/) provides an intuitive web-based interface
that brings your data to life with:

- **Interactive Graph Exploration**: Visualize named graphs with node expansion,
  shortest path discovery, and AQL-powered queries including Canvas Actions that
  work with your selection to discover related data
  
- **Visual Customization and Layouts**: Customize node colors, icons, and labels
  with saveable themes, and apply automatic layout algorithms (force-directed,
  hierarchical, circular) with zoom controls and minimap navigation
  
- **Direct Graph Editing**: Create, modify, and delete nodes and edges directly
  from the canvas with an intuitive properties dialog supporting both form and
  JSON editing modes

The Graph Visualizer seamlessly integrates with the ArangoDB database and provides the
primary interface for data exploration and analysis.

### Arango Platform Suite

The **Arango Platform Suite** adds enterprise-grade capabilities such as:

- **High Availability and Monitoring**: Comprehensive health checks, metrics collection,
  alerting, and automatic failover mechanisms ensure your data platform stays operational.
  Real-time monitoring dashboards provide visibility into cluster performance,
  resource utilization, and query patterns.

- **APIs, Drivers and Connectors**: Comprehensive programmatic access through
  RESTful APIs, native drivers for popular programming languages (Java, Python,
  JavaScript, Go, PHP, and more), and connectors for data integration tools
  and BI platforms.

- **Centralized Orchestration and Resource Management**: Unified control plane
  for managing all platform resources, deployments, and configurations.
  Kubernetes-powered orchestration handles scaling, updates, and resource
  allocation automatically across all components.

These enterprise features are orchestrated through Kubernetes and the ArangoDB
Kubernetes Operator, providing automated management and enterprise-grade reliability.