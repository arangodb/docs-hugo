---
title: Importer Service
menuTitle: Importer
description: >-
  The Importer service transforms your text documents into a knowledge graph
  stored in ArangoDB, ready for semantic search and Retriever-driven Q&A
weight: 6
---

## What is the Importer?

The Importer service turns documents into a **knowledge graph** stored in
your ArangoDB database. It chunks text, calls configured chat and embedding
models, extracts entities and communities (in full GraphRAG mode), writes the
graph data, and creates vector indexes where embeddings exist.

The resulting knowledge graph is the data layer your applications query with
the [Retriever service](../retriever/) or with AQL directly.

## When to use it

The Importer fits three usage patterns:

| Pattern | How you use it |
|---------|----------------|
| **Web interface** | The fastest path. Configure, run, and inspect imports through the [GraphRAG web interface](../graphrag/web-interface.md) without writing code. |
| **Direct API** | Call the Importer over HTTP API when you want full control - custom partitions, custom prompts, batch automation, or integration into an existing pipeline. |
| **Driven by AutoGraph** | For large or heterogeneous corpora, [AutoGraph](../autograph/) discovers domains, assigns a RAG strategy per domain, and orchestrates Importer workers automatically. You don't call the Importer directly in this mode. See [AutoGraph Integration](autograph-integration.md). |

## RAG modes

The Importer supports two operational modes that determine how documents are
processed and what knowledge-graph elements are created:

- **Full GraphRAG** (`rag_mode: "full_graphrag"`, default): Extracts entities,
  relationships, and community structures to build a complete knowledge
  graph. Best for queries that require understanding relationships between
  concepts.
- **Vector RAG** (`rag_mode: "vector_rag"`): Faster processing using only
  document chunks and embeddings. Best for straightforward semantic search
  use cases that don't need the full graph structure.

See [Architecture](architecture.md) for the collections each mode populates.

## Next steps

- [**Quickstart**](quickstart.md): Prerequisites, installation, and your
  first import call.
- [**Architecture**](architecture.md): Knowledge-graph collections, vector
  indexes, and the async-job lifecycle.
- [**LLM Configuration**](llm-configuration.md): Configure your chat and
  embedding providers (OpenAI-compatible APIs or Triton Inference Server).
- [**Import Files**](importing-files.md): Single-file and multi-file import
  workflows with examples.
- [**Verify and explore**](verify-and-explore.md): Check that your import
  succeeded and inspect the resulting collections.
- [**Semantic Units**](semantic-units.md) *(optional)*: Process images and
  multimedia content.
- [**AutoGraph Integration**](autograph-integration.md) *(optional)*: How
  the Importer is driven by AutoGraph for multi-partition builds.
- [**Reference**](reference/_index.md): HTTP endpoints, full parameter
  reference, and error handling.

## API reference

For the full machine-readable API, see the
[GraphRAG Importer API Reference](https://apiref.arango.ai/#graphrag_importer).
