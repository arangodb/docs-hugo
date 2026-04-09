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
It it always included with the Arango Contextual Data Platform.

## Operational features

- **High Availability and Monitoring**: Multiple availability zones,
  comprehensive health checks, metrics collection, alerting, and
  automatic failover mechanisms ensure your data platform stays operational.
  Real-time monitoring dashboards provide visibility into cluster performance,
  resource utilization, and query patterns.

- **APIs, Drivers and Connectors**: Comprehensive programmatic access through
  HTTP APIs, native drivers for popular programming languages (Java, Python,
  JavaScript, Go), and connectors for data integration tools
  and BI platforms.

- **Centralized Orchestration and Resource Management**: Unified control plane
  for managing all platform resources, deployments, and configurations.
  Kubernetes-powered orchestration handles scaling, updates, and resource
  allocation automatically across all components.

These enterprise features are orchestrated through Kubernetes and the ArangoDB
Kubernetes Operator, providing automated management and enterprise-grade reliability.

## Unified web interface

The Contextual Data Platform includes single, unified web interface for
accessing all services and components seamlessly.

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

The Arango Contextual Data Platform web interface features an advanced, integrated
[Query Editor](../platform-suite/query-editor.md) with an IDE-like user interface
with re-organizable tabs for writing, executing, analyzing, and managing AQL queries.

- **Graph visualization**: If a query returns edges or traversal paths, the
  results are shown by an embedded graph visualizer.

- **Download results**:
  You can download the results of queries in JSON and CSV format.

- **Syntax highlighting**: AQL queries in the query editor are colorized for
  better readability.

- **Saved queries**: Save and share frequently used queries with all users in the
  database, persisted across sessions.

- **Query monitoring**: View running queries and slow query logs, with the ability
  to kill long-running operations.

### Container manager

The [Container manager](../platform-suite/container-manager/_index.md) lets you
deploy and manage custom services within the Arango Contextual Data Platform
using your own code packages or container images.

It is available in the web interface of the Contextual Data Platform as well as
an API.

### File manager

The [File manager](../platform-suite/file-manager.md) lets you view and manage
the data of services, such as your uploaded content for AutoGraph and GraphRAG,
as well as the files used by service containers.

### Secrets manager

The [Secrets manager](../platform-suite/secrets-manager.md) store secrets like
API keys for easy use across the Contextual Data Platform.

### Arango Control Plane (ACP)

The [Arango Control Plane (ACP)](../platform-suite/control-plane-acp.md) is an
orchestration service to install, manage, and run services in your
Contextual Data Platform. It is used by built-in features such as AutoGraph but
also for custom services.

## Additional services

### Cypher2AQL (experimental)

The **Cypher to AQL** service translates
Cypher queries into AQL so you can use Cypher-style syntax and run the resulting
AQL queries against ArangoDB.
