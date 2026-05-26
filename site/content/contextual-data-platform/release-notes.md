---
title: What's new in the Arango Contextual Data Platform
menuTitle: Release notes
weight: 100
description: >-
  Features and improvements released for the Contextual Data Platform
---

## v4.0.2 (May 2026)

This is a maintenance release. The [Container Manager](../platform-suite/container-manager/_index.md)
base images (base, PyTorch, and cuGraph variants) have been updated to Python 3.12;
service packages must now target Python 3.12 or later. The release also includes
security fixes.

## v4.0.1 (May 2026)

This release contains improvements and refinements to features introduced in v4.0.0.

- **AutoGraph**:
  - Corpus build failures caused by the LLM or embedding provider now surface a
    machine-readable [`error_code`](../agentic-ai-suite/autograph/reference/corpus-build.md)
    on the build status response (authentication failed, permission denied,
    rate limited, quota exceeded, or API key missing), so clients can react to
    each case instead of parsing free-text messages. The
    [error reference](../agentic-ai-suite/autograph/reference/error-handling.md)
    also adds HTTP `429` (provider rate-limited or quota exhausted), expands
    the meanings of `401` and `403` to cover LLM provider auth and permission
    failures, and explains why an accepted (`200`) async job can still fail
    later.
  - The new Known Limitations section in the
    [error reference](../agentic-ai-suite/autograph/reference/error-handling.md)
    documents two important behaviors: citation extraction and `SemanticUnits`
    linking are not yet automatic (you provide `citable_url` and run your own
    post-processing); and VectorRAG partitions cannot serve Global or Local
    queries because they skip entity and community extraction.
  - The [RAG Strategizer](../agentic-ai-suite/autograph/reference/rag-strategizer.md)
    response is documented more precisely: `rag_partition_id` suffixes
    (`_a` = FullGraphRAG, `_b` = VectorRAG), the full list of FullGraphRAG
    importer tunables returned in `parameters`, empty `entity_types` for
    VectorRAG clusters, and an `entity_generation_error` field that appears
    when LLM-driven entity-type generation fails for a cluster.
- **Importer**:
  - The Importer now auto-detects each chat model's context window and picks a
    sensible completion-token cap, so common OpenAI models (GPT-4o, GPT-4 Turbo,
    GPT-5.4 Nano, o1, o3) work without manual tuning. New environment variables
    (`CHAT_MAX_COMPLETION_TOKENS`, `CHAT_MODEL_CONTEXT_TOKENS`,
    `GRAPHRAG_LLM_PROMPT_TOKEN_BUDGET`) let you override the defaults for
    private fine-tunes or sparse graphs. See
    [LLM configuration](../agentic-ai-suite/importer/llm-configuration.md#token-budget-for-chat-models).
  - Before each chat call, the Importer re-tokenizes the actual prompt and
    truncates it if it would exceed the model's window, so jobs no longer fail
    with `context_length_exceeded` on long prompts.
  - The Importer now auto-detects newer OpenAI models that require
    `/v1/responses` (for example `gpt-5.4-pro`, `o3-pro`), retries the call via
    the [Responses API](../agentic-ai-suite/importer/llm-configuration.md#openai-responses-api-fallback),
    and caches the result so subsequent calls skip the failing chat-completion
    attempt.
  - Provider errors during graph build are mapped to short remediation messages
    (insufficient quota, invalid API key, rate limit, timeout, 5xx, context
    length exceeded) and stored on the service status, so operators see
    actionable text instead of raw SDK output.
  - The model used for image description during semantic-unit processing is now
    configurable via the
    [`MULTIMODAL_MODEL`](../agentic-ai-suite/importer/semantic-units.md#image-description-model)
    environment variable (default `gpt-4o-mini`), and it honors the same token
    budget and Responses API settings as the rest of the pipeline.
- **Retriever**:
  - Response [caching](../agentic-ai-suite/retriever/parameters.md#use_cache)
    (`use_cache: true`) now works for every query type (`GLOBAL`, `LOCAL`,
    `UNIFIED`, and `CUSTOM`); previously only some query types could be cached.
  - [`show_citations`](../agentic-ai-suite/retriever/parameters.md#show_citations)
    is documented as a no-op in Deep Search (`use_llm_planner=true`) and
    `GLOBAL` queries, because those modes always strip citations regardless of
    the flag. The parameter still applies to `LOCAL`, `UNIFIED`, and `CUSTOM`
    queries.
  - For `CUSTOM` queries, an individual tool's own `show_citations: false`
    configuration can suppress citations from that tool's results even when the
    request-level flag is `true`, so you can mix citation behavior across the
    components of a custom retriever.
- **Default AI models**: Default OpenAI chat model upgraded from `gpt-4o` to the
  GPT-5.4 family. The [Importer](../agentic-ai-suite/importer/llm-configuration.md)
  and [Retriever](../agentic-ai-suite/retriever/llm-configuration.md) now default
  to `gpt-5.4-nano`; the
  [Natural Language to AQL](../agentic-ai-suite/natural-language-to-aql/setup.md)
  service (AQLizer) defaults to `gpt-5.4`. [Ada](../agentic-ai-suite/ada.md) also
  adds **Anthropic**, **OpenRouter**, and **Custom Endpoint** as provider options
  alongside OpenAI.
- **License activation**: A new web-based
  [License Activation portal](./license-management.md) is available for
  internet-connected deployments as an alternative to the Platform CLI, with Managed,
  Inventory, and Generic modes.
- **MLflow**: The integrated [MLflow](../agentic-ai-suite/reference/mlflow.md) service
  has been upgraded to MLflow 3.x.

## v4.0.0 (April 2026, General Availability)

The Arango Contextual Data Platform has been officially released and comes with
various improvements and major additions to the unified web interface, the
Platform Suite and the Agentic AI Suite.

The minimum required ArangoDB version is the Enterprise Edition v3.12.9.

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

### Graph Analytics

{{< tag "Agentic AI Suite" >}}

[Graph Analytics](../agentic-ai-suite/graph-analytics/_index.md) now includes a web interface
and a new AQL-based data loading API.

- **Web interface**: A new [graphical interface](../agentic-ai-suite/graph-analytics/web-interface.md)
  is now available for managing Graph Analytics Engines, loading graphs, running algorithms
  (PageRank, Connected Components, Label Propagation, and more), and monitoring job progress.
  The interface provides an intuitive workflow for engine management, graph loading, algorithm
  execution, job monitoring, and trigger jobs to persist results of algorithms into collections.

- **AQL-based data loading API**: A new API endpoint allows you to import graph data using
  [custom AQL queries](../agentic-ai-suite/graph-analytics/api.md#load-data-using-aql-queries).
  Queries are organized into phases that run sequentially, while queries within each phase
  execute in parallel for optimal performance.

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
image URLs, with support for Python 3.12 runtimes (including PyTorch and cuGraph
variants). Services can be scoped globally or per-database, with version management
and deployment via [web interface](../platform-suite/container-manager/web-interface.md)
or [API](../platform-suite/container-manager/deploy-api/).

### File Manager

{{< tag "Platform Suite" >}}

The [File Manager](../platform-suite/file-manager/_index.md) provides a centralized interface
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

### Cypher to AQL (experimental)

{{< tag "Platform Suite" >}}

An experimental service for translating Cypher queries to ArangoDB's query
language AQL has been added. The [`arango-cypher2aql` service](../platform-suite/cypher2aql.md)
provides an API for parser-based translation so that you can reuse existing
Cypher knowledge.

## v3.0.0 pre-release 2 (October 2025)

This release includes new features and enhancements for the Contextual Data Platform
web interface as well as the components of the Agentic AI Suite.

The minimum required ArangoDB version has been raised to Enterprise Edition v3.12.6.

### GraphRAG enhancements

{{< tag "Agentic AI Suite" >}}

- **Instant and Deep Search**: New [Retriever](../agentic-ai-suite/retriever/search-methods/_index.md) search methods
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

The [Natural Language to AQL Translation Service](../agentic-ai-suite/natural-language-to-aql/_index.md)
enables you to query your ArangoDB database using natural language or get
LLM-powered answers to general questions. 

You can generate AQL queries from natural language directly in the Query Editor using the
[AQLizer](../agentic-ai-suite/natural-language-to-aql/_index.md) mode. More advanced features are available via the API.

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

## v3.0.0 pre-release 1 (July 2025)

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

- [**MLflow Integration**](../agentic-ai-suite/private-llms/mlflow.md):
  Use MLflow as a model registry for private LLMs and machine learning
  experiment tracking.

- [**Triton Inference Server**](../agentic-ai-suite/private-llms/triton-inference-server.md):
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
- [**Kubernetes orchestration**](architecture.md):
  Powered by the official ArangoDB Kubernetes
  Operator for automated deployment, scaling, and management.
- [**Operational features**](../platform-suite/_index.md):
  Enterprise-grade features including high availability and monitoring,
  comprehensive APIs and connectors, and centralized orchestration and
  resource management.
- **Additional services**: Cypher2AQL service for translating graph queries
  written in Neo4j's Cypher query language to ArangoDB's AQL query language
  (experimental)
