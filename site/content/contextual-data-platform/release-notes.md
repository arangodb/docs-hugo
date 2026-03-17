---
title: What's new in the Arango Contextual Data Platform
menuTitle: Release notes
weight: 100
description: >-
  Features and improvements released for the Contextual Data Platform
---
## March 2026 (v4.0, General Availability)

The Arango Contextual Data Platform has been officially released and comes with
various improvements and major additions to the unified web interface, the
Platform Suite and the Agentic AI Suite.

The minimum required ArangoDB version is Enterprise Edition v4.0.0.

### Dashboard

{{< tag "Platform Suite" >}}

A new home screen has been added, providing the following information and actions:

- A cluster respectively single server health overview
- Shard distribution information and rebalancing options
- The cluster maintenance status

### Query Editor

{{< tag "Platform Suite" >}}

The [Query Editor](../platform-suite/query-editor.md) has been extended with the following capabilities:

- **Graph visualization**: If a query returns edges or traversal paths, the
  results are shown by an embedded graph visualizer. You can still switch to a JSON
  view mode of the results.

- **Download results**:
  You can download the results of queries in JSON and CSV format.

- **Syntax highlighting**: AQL queries in the query editor are colorized for
  better readability.

## October 2025 (v3.0, pre-release 2)

This release includes new features and enhancements for the Contextual Data Platform
web interface as well as the components of the Agentic AI Suite.

The minimum required ArangoDB version has been raised to Enterprise Edition v3.12.6.

### GraphRAG enhancements

{{< tag "Agentic AI Suite" >}}

- **Instant and Deep Search**: New [Retriever](../agentic-ai-suite/reference/retriever/search-methods.md) search methods
  optimized for different use cases. Instant Search provides fast responses with
  streaming support. Deep Search offers detailed, accurate responses for complex queries
  requiring high accuracy. Both methods are accessible via the API or the
  [GraphRAG web interface](../agentic-ai-suite/graphrag/web-interface.md#chat-with-your-knowledge-graph).

- **Update Knowledge Graphs**: [Add additional data sources](../agentic-ai-suite/graphrag/web-interface.md#update-the-knowledge-graph)
  to existing Knowledge Graphs through the web interface. Upload new files to
  automatically update the Knowledge Graph and underlying collections with new data.

- **Unified LLM provider configuration**: Simplified deployment configuration using
  OpenAI-compatible APIs. Mix and match providers for chat and embeddings (e.g.,
  use OpenRouter for chat and OpenAI for embeddings). Support for OpenAI, OpenRouter,
  Gemini, Anthropic, and any self-hosted LLM with OpenAI-compatible endpoints.

### AQLizer

{{< tag "Agentic AI Suite" >}}

The [Natural Language to AQL Translation Service](../agentic-ai-suite/reference/natural-language-to-aql.md)
enables you to query your ArangoDB database using natural language or get
LLM-powered answers to general questions. 

You can generate AQL queries from natural language directly in the Query Editor using the
[AQLizer](../agentic-ai-suite/aqlizer.md) mode. More advanced features are available via the API.

### Query Editor

{{< tag "Platform Suite" >}}

A new [Query Editor](../platform-suite/query-editor.md) has been integrated into the
Arango Contextual Data Platform web interface for writing, executing, and managing AQL queries.

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

{{< tag "Platform Suite" >}}

The [Graph Visualizer](../platform-suite/graph-visualizer.md) has been significantly enhanced with
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

### Platform Services

{{< tag "Platform Suite" >}}

- **Secrets Manager**: Store secrets like API keys for Large Language Model (LLM)
  for easy use across the Contextual Data Platform. Secrets are encrypted at rest and can be
  accessed by services via a metadata sidecar container.

## July 2025 (v3.0, pre-release 1)

This release marks the initial internal launch of the Arango Contextual Data Platform
and its Agentic AI Suite and Platform Suite.

The minimum required ArangoDB version is the Enterprise Edition v3.12.5.

### Introducing the Arango Agentic AI Suite

{{< tag "Agentic AI Suite" >}}

What's included:

- [**GraphRAG**](../agentic-ai-suite/graphrag/_index.md):
  Transform unstructured documents into intelligent knowledge graphs and
  natural language querying through Importer and Retriever services.

- [**GraphML**](../agentic-ai-suite/graphml/_index.md):
  Apply machine learning to graphs with node classification and
  embedding generation, built on GraphSAGE framework.

- [**Graph Analytics**](../agentic-ai-suite/graph-analytics/_index.md):
  Run algorithms like PageRank, Connected Components, and more.

- [**Jupyter Notebooks**](../agentic-ai-suite/notebook-servers.md):
  Launch integrated Jupyter notebook servers with pre-installed ArangoDB drivers
  and data science libraries for interactive experimentation.

- [**MLflow Integration**](../agentic-ai-suite/reference/mlflow.md):
  Use MLflow as a model registry for private LLMs and machine learning
  experiment tracking.

- [**Triton Inference Server**](../agentic-ai-suite/reference/triton-inference-server.md):
  Host private Large Language Models using NVIDIA Triton Inference Server for
  secure, on-premises AI capabilities.

### Introducing the Arango Platform Suite

{{< tag "Platform Suite" >}}

What's included:

- [**ArangoDB Enterprise Edition**](../arangodb/_index.md):
  Multi-model database foundation supporting
  graphs, documents, key-value, vector search, and full-text search capabilities.
- **Unified web interface**: Single interface for accessing all
   Contextual Data Platform services and components.
- [**Graph Visualizer**](../platform-suite/graph-visualizer.md):
  Sophisticated web-based interface for interactive graph
  exploration, visual customization, and direct graph editing.
- [**Query Editor**](../platform-suite/query-editor.md):
  Write, run, and analyze AQL queries using an IDE-like interface with tabs,
  result history, query management, and more.
- [**Kubernetes orchestration**](kubernetes.md):
  Powered by the official ArangoDB Kubernetes
  Operator for automated deployment, scaling, and management.
- [**Operational features**](../platform-suite/_index.md):
  Enterprise-grade features including high availability and monitoring,
  comprehensive APIs and connectors, and centralized orchestration and
  resource management.
- **Additional services**: Cypher2AQL service for translating graph queries
  written in Neo4j's Cypher query language to ArangoDB's AQL query language
  (experimental)
