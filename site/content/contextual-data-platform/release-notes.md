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

### AutoGraph

{{< tag "Agentic AI Suite" >}}

[AutoGraph](../agentic-ai-suite/autograph/_index.md) is an automation copilot
that analyzes enterprise documents, discovers natural knowledge domains, and
automatically builds optimized knowledge graphs for intelligent retrieval at scale.

Key features:

- **Automated domain discovery**: Analyzes document relationships and discovers
natural clusters using graph algorithms, creating specialized RAG partitions per domain.
- **Intelligent RAG strategy selection**: Automatically recommends FullGraphRAG
or VectorRAG for each domain based on content complexity.
- **Knowledge graph creation**: Transforms documents into structured knowledge graphs
with entities, relationships, and semantic connections.
- **Natural language querying**: Chat with your knowledge graph using natural language
to ask questions and retrieve insights from your documents.
- **Web interface**: Streamlined [workflow](../agentic-ai-suite/autograph/web-interface.md)
guides you through document upload, corpus building, strategy generation, knowledge graph
import, retriever deployment, and chat.

### Ada

{{< tag "Agentic AI Suite" >}}

[Ada](../agentic-ai-suite/ada.md) is a new AI digital assistant integrated into the Arango
Contextual Data Platform. It lets you interact with your database using natural language,
generate and execute AQL queries, explore collections and data structures, and save reusable
query artifacts through a conversational chat interface.

### Graph Visualizer

{{< tag "Platform Suite" >}}

The [Graph Visualizer](../platform-suite/graph-visualizer.md) now supports exporting
graph data in CSV format. Export the entire visible canvas, or export nodes and
edges separately with all document attributes included.

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

### AQL Optimizer (Reasoner)

{{< tag "Agentic AI Suite" >}}

A new **Optimize** button has been added to query tabs for
[AI-powered query optimization](../platform-suite/query-editor.md#optimize-queries-reasoner).
The Reasoner analyzes your AQL query and suggests improvements through a
streaming chat interface with real-time tool call and validation feedback.
This feature requires a license.

### Container Manager

{{< tag "Platform Suite" >}}

The [Container Manager](../platform-suite/container-manager/_index.md) enables you to
deploy and manage custom services directly within the Arango Contextual Data Platform,
running your own applications alongside platform services.

Deploy services by uploading source code packages (`.tar.gz`) or providing Docker
image URLs, with support for Python 3.13 runtimes (including PyTorch and cuGraph
variants). Services can be scoped globally or per-database, with version management
and deployment via [web interface](../platform-suite/container-manager/web-interface.md)
or [API](../platform-suite/container-manager/deploy-api/).

### File Manager

{{< tag "Platform Suite" >}}

The [File Manager](../platform-suite/file-manager.md) provides a centralized interface
for viewing and managing data stored by platform services, including container
service files, RAG content, and AutoGraph files.

### Secrets Manager

{{< tag "Platform Suite" >}}

The [Secrets Manager](../platform-suite/secrets-manager.md) has been introduced
for managing API keys and credentials across the platform.
Secrets are encrypted at rest and accessible to services via sidecar containers,
with support for bulk operations, import/export, and multiple secret types.

### Monitoring

{{< tag "Platform Suite" >}}

Integrated [Monitoring](../platform-suite/monitoring.md) with Grafana and Prometheus
provides observability for the entire deployment. Both tools are embedded in the
unified web interface with authenticated access for tracking performance metrics,
cluster health, and resource utilization.

### Dashboard

{{< tag "Platform Suite" >}}

A new home screen has been added, providing the following information and actions:

- A cluster respectively single server health overview
- Shard distribution information and rebalancing options
- The cluster maintenance status

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
