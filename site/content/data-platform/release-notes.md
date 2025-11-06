---
title: What's new in the Arango Data Platform
menuTitle: Release notes
weight: 50
description: >-
  Features and improvements in the Arango Data Platform
---
{{< tip >}}
The Arango Data Platform is available as a pre-release. To get exclusive early access,
[get in touch](https://arango.ai/contact-us/) with the Arango team.
{{< /tip >}}

## October 2024 (pre-release)

<small>ArangoDB Enterprise Edition: v3.12.6</small>

This release includes new features and enhancements for the Data Platform web
interface, running with ArangoDB Enterprise Edition v3.12.6. For AI Suite updates
in this release, see [AI Suite Release Notes](../ai-suite/release-notes.md).

### Query Editor

A new [Query Editor](query-editor.md) has been integrated into the
Arango Data Platform web interface for writing, executing, and managing AQL queries.

Key features:

- **Tabbed interface**: Work on multiple queries concurrently with side-by-side
  query and results views.
- **Query operations**: Run, explain, and profile queries with dedicated buttons
  and result history tracking.
- **Saved queries**: Save and share frequently used queries with all users in the
  database, persisted across sessions.
- **Query monitoring**: View running queries and slow query logs, with the ability
  to kill long-running operations.
- **Flexible viewport**: Drag and drop tabs to reorganize panels horizontally or
  vertically.

### Graph Visualizer enhancements

The [Graph Visualizer](graph-visualizer.md) has been significantly enhanced with
new visual customization capabilities, improved navigation features, and better
performance for exploring large-scale graphs.

Key improvements:

- **Icon assignment**: Assign pictograms to node collections for quick visual
  identification of entity types on the canvas.
- **Theme support**: Create and manage multiple themes to highlight different
  aspects of graph data, with default themes that automatically color different
  collections on the canvas.
- **Shortest path**: Find and visualize the shortest path between two selected
  nodes directly on the canvas.
- **Enhanced tooltips**: Hover over nodes and edges to view document IDs and
  customizable additional attributes without opening the full properties dialog.
- **Bulk selection**: Select all nodes or edges of a specific type (collection)
  from the Legend panel, showing the count of elements per collection.
- **Edge properties view**: View and edit edge properties through a dedicated
  properties dialog with Form and JSON editing modes.
- **Attribute-based styling**: Define conditional styling rules based on document
  attributes to dynamically color and style nodes and edges (e.g., apply colors
  based on genre or other field values).
- **Performance improvements**: Optimized rendering for large graphs with
  millions of nodes and edges.

## July 2024 (pre-release)

<small>ArangoDB Enterprise Edition: v3.12.5</small>

This release marks the initial internal launch of the Arango Data Platform, running with
ArangoDB Enterprise Edition v3.12.5. For AI Suite features in this release, see
[AI Suite Release Notes](../ai-suite/release-notes.md).

### Arango Data Platform

The Arango Data Platform is a Kubernetes-native technical infrastructure that
brings together the entire ArangoDB offering into a unified solution.
See [Get Started with the Arango Data Platform](get-started.md).

What's included:

- **ArangoDB Enterprise Edition**: Multi-model database foundation supporting
  graphs, documents, key-value, vector search, and full-text search capabilities.
- **Graph Visualizer**: Sophisticated web-based interface for interactive graph
  exploration, visual customization, and direct graph editing.
- **Arango Platform Suite**: Enterprise-grade features including high availability
  and monitoring, comprehensive APIs and connectors, and centralized orchestration
  and resource management.
- **Kubernetes orchestration**: Powered by the official ArangoDB Kubernetes
  Operator for automated deployment, scaling, and management.
- **Unified web interface**: Single interface for accessing all Platform services
  and components.

The Platform can be extended with the [AI Suite](../ai-suite/_index.md) for
advanced capabilities like GraphRAG, GraphML, Graph Analytics, AQLizer, and more
(requires separate license).
