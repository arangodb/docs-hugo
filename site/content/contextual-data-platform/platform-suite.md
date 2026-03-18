---
title: About the Arango Platform Suite
menuTitle: Platform Suite
weight: 10
description: >-
  The Platform Suite is a set of services for scalability, reliability,
  governance, as well as a query editor and graph visualizer, all
  included in the Arango Contextual Data Platform
---
The **Platform Suite** adds enterprise-grade capabilities on top of ArangoDB.
It is part of both, the Arango Data Platform and the full Arango Contextual Data Platform.

## Operational features

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

## Unified web interface

### Graph Visualizer

The [**Graph Visualizer**](../platform-suite/graph-visualizer.md)
provides an intuitive web-based interface that brings your data to life with:

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

### Query editor

### Container manager

### File manager

### Secrets manager

## Additional services

### Cypher to AQL (experimental)

The [**Cypher to AQL**](../platform-suite/cypher2aql.md) service translates Cypher queries into AQL so you can use Cypher-style syntax and run the resulting AQL against ArangoDB. It is available only as part of the Contextual Data Platform and is currently experimental.

