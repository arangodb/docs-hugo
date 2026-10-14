---
title: What is Arango?
menuTitle: What is Arango?
weight: 5
description: >-
  The Arango Contextual Data Platform delivers a governed, continuously
  maintained context graph that AI agents and applications query for the
  entities, relationships, and sources behind an answer
---
## What is the Arango Contextual Data Platform

The [**Arango Contextual Data Platform**](../contextual-data-platform/_index.md)
delivers a contextual data layer (also called a context layer): a governed,
continuously maintained context graph that AI agents and applications query for
the entities, relationships, and sources behind an answer.

The platform consists of three modules: the Agentic AI Suite, the Platform
Suite, and ArangoDB. Every service in the platform reads and writes through
ArangoDB, and agents and applications access the context layer through the
[ArangoDB Query Language (AQL)](../arangodb/3.12/aql/_index.md), the
[HTTP API](../arangodb/3.12/develop/http-api/_index.md), or the
[Model Context Protocol (MCP)](../ecosystem/arangodb-mcp-server.md).

{{< embed-svg "Arango-Contextual-Data-Platform-Overview" >}}

### Agentic AI Suite

The [**Agentic AI Suite**](../agentic-ai-suite/_index.md) builds the context
graph, keeps it current, and answers questions from it.

[**AutoGraph Studio**](../agentic-ai-suite/autograph/_index.md) turns enterprise
data into a context graph and retrieves from it:

- **Build**: Ingests documents as-is (PDF, Office, text, and Markdown), clusters
  them into knowledge domains, and uses a large language model (LLM) to derive
  the entity types for each domain. It then extracts entities and relationships
  into the context graph. Each domain gets the processing depth it needs: full
  [GraphRAG](../agentic-ai-suite/autograph/concepts.md) (graph-based
  retrieval-augmented generation) for relationship-rich content, or a lighter
  VectorRAG path where similarity search is enough.
- **Maintain**: Updates are
  [incremental](../agentic-ai-suite/autograph/incremental-graph-updates.md).
  Inserting, deleting, or replacing a document reprocesses only what changed,
  and new documents join the nearest existing domain. Domains that have drifted
  since they were clustered are flagged; reclustering runs when you start it.
- **Retrieve**: Selects a retrieval strategy for each question (vector search,
  graph traversal, or a combination) and answers against the context graph.
- **Trace**: Documents, chunks, and entities carry provenance metadata, so
  answers can be traced back to their source files.

The suite also includes:

- [**AQLizer**](../agentic-ai-suite/natural-language-to-aql/_index.md)
  translates natural-language questions into AQL, so users can query across
  domains in the context graph without writing AQL first.
- [**Ada**](../agentic-ai-suite/ada/_index.md) is an AI assistant for
  natural-language interaction and development.
- [**Reasoner**](../agentic-ai-suite/reasoner/_index.md) analyzes and optimizes
  AQL queries with AI-assisted reasoning.
- [**GraphML**](../agentic-ai-suite/graphml/_index.md) applies machine learning
  to graphs for link prediction, classification, and embeddings.
- [**Graph Analytics**](../agentic-ai-suite/graph-analytics/_index.md) runs
  graph algorithms such as PageRank on dedicated compute.

### Platform Suite

The [**Platform Suite**](../platform-suite/_index.md) runs, secures, and manages
the platform on Kubernetes.

- [**Kubernetes Operator**](../contextual-data-platform/architecture.md):
  deployment, scaling, upgrades, backups, and license management.
- [**Role-based access control (RBAC)**](../contextual-data-platform/access-control/authorization.md):
  controls which users and agents can read or act on which data.
- **Web interface**: [Graph Visualizer](../platform-suite/graph-visualizer.md)
  and [Query Editor](../platform-suite/query-editor.md) for exploring and
  querying the context graph.
- [**Bring Your Own Code**](../platform-suite/container-manager/_index.md): run
  custom services alongside the platform.

### ArangoDB

[**ArangoDB**](../arangodb/_index.md) is the multi-model database at the
foundation of the platform. Graph, document, key-value, full-text, and vector
data share one storage engine, one index layer, and one transaction system. A
document, its graph edges, its full-text index entries, and its vector embedding
are stored and updated together, so there is no second store to synchronize and
no cross-system join by ID.

A single AQL query can start from a full-text match, walk the graph, filter on
document attributes, and rank by
[vector similarity](../arangodb/3.12/indexes-and-search/indexing/working-with-indexes/vector-indexes.md):

```aql
FOR article IN articlesView
  SEARCH ANALYZER(article.body IN TOKENS(@topic, "text_en"), "text_en")
  FOR related, edge IN 1..2 OUTBOUND article cites
    FILTER related.published >= @since
    SORT APPROX_NEAR_COSINE(related.embedding, @queryVector) DESC
    LIMIT 10
    RETURN { title: related.title, via: edge._from }
```

ArangoDB is also available on its own for applications that store and query
connected data.

## What is a contextual data layer?

To answer a question reliably, an AI agent needs more than retrieved text
passages. It needs to know which entities are involved, how they connect, what
they mean, what is true now, where each fact came from, and whether the caller
is allowed to see it. In most architectures, that context is split across a
vector store, a graph database, a document store, and the pipelines that sync
them.

A contextual data layer holds this context in one place as a context graph.
Each layer below adds an answer the one before it cannot give:

| Layer | What it adds | What it answers |
|-------|--------------|-----------------|
| Graph | Entities and relationships that can be traversed at scale | How is it connected? |
| Ontology | Shared entity types, relationships, and constraints | What does it mean? |
| Knowledge graph | Meaning applied to real entities across source systems | What is this, and how is it connected? |
| Context graph | Current state, sources, and access policies | What is true now, and can I trace why? |

## What the contextual data layer delivers

| Capability | How it works | Result |
|------------|--------------|--------|
| Relational depth | Multi-hop graph traversal in the same query as filters, text search, and vector ranking | Answers that span systems and relationships, not isolated passages |
| Traceability | Provenance metadata links graph content to source files; graph paths show how an answer was reached | Explainable answers that can be verified |
| Freshness | Incremental updates; only changed documents are reprocessed | Context stays current without full rebuilds |
| Governed access | RBAC applied at the data layer for users and agents | Agents retrieve only what they are permitted to see |
| Fewer moving parts | One engine for graph, document, key-value, full-text, and vector data | No separate stores to sync, secure, and operate |
| Model choice | Access through AQL, the HTTP API, and MCP | Use any LLM, agent framework, or application |

## Ways to run it

### Arango Contextual Data Platform

**Self-managed**: Runs on your own Kubernetes cluster, in the cloud,
on-premises, or in air-gapped environments. Available in two editions:

- **Developer Edition**: free under a non-commercial license.
- **Enterprise Edition**: licensed for production and commercial use.

Both editions require ArangoDB Enterprise Edition 3.12.12 or later. Licenses
activate and renew automatically through the Kubernetes Operator. See
[License Management](../contextual-data-platform/license-management.md).

**Managed**: The [Arango Managed Platform (AMP)](../amp/_index.md) runs the
Contextual Data Platform for you on Google Cloud or AWS, with monitoring,
upgrades, and backups handled.

### ArangoDB

**Self-managed**: ArangoDB Community Edition is free to use under the ArangoDB
Community License. Enterprise Edition adds clustering features, including
[SmartGraphs](../arangodb/3.12/graphs/smartgraphs/_index.md) for sharding
connected data without cross-node traversal, and security features. See
[Features](../arangodb/3.12/features/_index.md) for the per-edition breakdown.

**Managed**: [AMP](../amp/_index.md) runs ArangoDB for you on Google Cloud or
AWS, with monitoring, upgrades, and backups handled.

## Which product do I need?

Two offers are available to try for free:

- **ArangoDB with the Platform Suite**: the multi-model database plus the
  services to run, secure, and explore it on Kubernetes.
- **Arango Contextual Data Platform**: everything above, plus the Agentic AI
  Suite, which builds and queries a context graph for AI agents.

The deciding question is simple. Will you model and query your data yourself,
or do you want the platform to build AI-ready context for you?

| If you are building... | Choose |
|------------------------|--------|
| An application that stores and traverses connected data, such as recommendations, fraud detection, network and IT asset graphs, or identity and access | ArangoDB with the Platform Suite |
| An application that combines graph, document, key-value, full-text, and vector data in a single query | ArangoDB with the Platform Suite |
| Your own retrieval or RAG (retrieval-augmented generation) pipeline, where you design the schema and write the AQL queries | ArangoDB with the Platform Suite |
| AI agents, copilots, or assistants that need trusted context from enterprise documents | Arango Contextual Data Platform |
| GraphRAG without hand-building a schema, ontology, or extraction pipeline | Arango Contextual Data Platform |
| Answers to natural-language questions across domains, traced back to their source | Arango Contextual Data Platform |
| Shared memory and context for multiple agents, kept current as data changes | Arango Contextual Data Platform |

Not sure? If your project involves AI agents or LLMs answering questions over
documents, start with the Arango Contextual Data Platform. It includes ArangoDB
and the Platform Suite, so you won't outgrow it.

## Next steps

Pick an installation path:

- [Get started with the Arango Contextual Data Platform](contextual-data-platform/_index.md)
- [Get started with ArangoDB](arangodb/_index.md)
