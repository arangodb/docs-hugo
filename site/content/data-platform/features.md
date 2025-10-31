---
title: Architecture and Features of the Arango Data Platform
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

### Kubernetes Integration

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

The Arango Data Platform consists of three integrated layers that work together
to provide a complete, enterprise-ready solution:

### Layer 1: ArangoDB Enterprise Edition (Foundation)

At the foundation is [**ArangoDB Enterprise Edition**](../../arangodb/3.12/), the 
powerful multi-model database that provides:

- **Graph**: Native graph database capabilities with efficient traversals and pattern matching
- **Document**: Flexible JSON document storage with schema validation
- **Key-Value**: High-performance key-value operations
- **Vector**: Vector embeddings and similarity search for AI applications
- **Search**: Full-text search and complex query capabilities

### Layer 2: Graph Visualizer

The [**Arango Visualizer**](graph-visualizer/) provides an intuitive web-based interface
that brings your data to life with:

- **Graph Exploration**: Interactive visualization of graph structures with
  drag-and-drop navigation, zoom controls, and customizable node appearances
  
- **Smart Search**: Intelligent search capabilities to quickly find nodes, edges,
  and patterns within your graphs using natural language queries
  
- **Visual Layouts**: Multiple automatic layout algorithms (force-directed, hierarchical,
  circular) to best represent your data relationships
  
- **Team Workspaces**: Collaborative features that allow teams to share visualizations,
  queries, and insights across the organization

The Graph Visualizer seamlessly integrates with the database layer and provides the
primary interface for data exploration and analysis.

### Layer 3: Arango Platform Suite

The **Arango Platform Suite** adds enterprise-grade capabilities on top of the
database and visualization layers:

- **High Availability and Monitoring**: Comprehensive health checks, metrics collection,
  alerting, and automatic failover mechanisms ensure your data platform stays operational.
  Real-time monitoring dashboards provide visibility into cluster performance,
  resource utilization, and query patterns.

- **SSO, RBAC/ABAC and OpenID Integration**: Enterprise authentication and authorization
  featuring Single Sign-On (SSO) support, Role-Based Access Control (RBAC),
  Attribute-Based Access Control (ABAC), and OpenID Connect integration for secure
  user management across your organization.

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