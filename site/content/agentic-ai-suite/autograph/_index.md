---
title: AutoGraph
menuTitle: AutoGraph
weight: 4
description: >-
  AutoGraph structures enterprise data into contextual knowledge shards with domain-aware retrieval strategies providing AI copilots and agents with production-grade context infrastructure
---
{{< embed-svg "GraphRAG-Flow" "AutoGraph end-to-end flow." >}}

## What is AutoGraph?

AutoGraph is a large-scale RAG system that delivers strong accuracy at the
quality-cost tradeoff you choose. It supports benchmarking, testset creation,
automated ontologies, and extensibility to new RAG methods - distilling lessons
learned from running RAG at some of the world's largest enterprises.

Under the hood, AutoGraph is an automation copilot that analyzes enterprise
documents, discovers natural knowledge domains, and builds semantic infrastructure
for intelligent retrieval at scale - importing documents, generating embeddings,
building knowledge graphs, assigning RAG strategies per domain, and orchestrating
downstream GraphRAG builds.

Think of it as a **self-organizing knowledge system**. Instead of manually categorizing 
documents or designing taxonomies, AutoGraph handles the following:
1. Analyzes document relationships automatically
2. Discovers natural domain clusters using graph algorithms
3. Creates specialized RAG partitions per domain
4. Optimizes retrieval strategies per domain
5. Routes queries intelligently to relevant domains

The result is a domain-aware knowledge base that scales horizontally across machines.

## Why AutoGraph?

AutoGraph automatically discovers that enterprise data naturally divides into **knowledge domains**, with each domain deserving its own optimized processing and retrieval strategy. By building a **Corpus Graph** (the map of your knowledge) and importing each domain into **specialized RAG partitions**, AutoGraph enables:
- Automatic domain discovery
- Horizontal scaling across machines
- Cost-optimized processing
- Intelligent retrieval

This approach solves the compounding challenges modern enterprises face:
- **Fragmentation**: Unifies data scattered across dozens of systems into a connected knowledge graph
- **Scale**: Handles thousands to millions of documents through horizontal scaling
- **Heterogeneity**: Processes simple FAQs differently from complex technical specs
- **Cost**: Matches processing intensity to content complexity, avoiding expensive LLM waste
- **Performance**: Searches only relevant domain partitions instead of the entire corpus
- **Change**: Keeps a built graph current at document level, instead of rebuilding a corpus every time a few files change

Traditional RAG solutions treat all documents the same way, leading to either inadequate processing of complex content or wasteful over-processing of simple content. AutoGraph adapts to your data.

By organizing enterprise data into contextual knowledge graphs, AutoGraph creates a semantic data layer that represents relationships between business entities, systems, and operational events. This enables AI agents to:
- Reason across enterprise relationships
- Understand real-time operational states
- Operate within governance policies
- Produce explainable outputs with traceable lineage

## RAG Strategizer

Not all content is equally complex. The RAG Strategizer examines the domain
clusters in the Corpus Graph and assigns each one a processing strategy:
complex domains get a full knowledge graph with extracted entities and
relationships (FullGraphRAG); simpler domains get a lighter partition that
skips entity extraction (VectorRAG). For FullGraphRAG domains, it also
generates a domain-specific ontology (the entity types to extract), so the
resulting knowledge graph reflects the concepts that actually matter in
that content.

## Incremental Graph Updates

Enterprise document sets are not static. Contracts get amended, specifications
are revised, and obsolete files have to disappear. Rebuilding a corpus for a
handful of changed documents means paying again for extraction, embedding,
clustering, and a full Importer pass.

Incremental Graph Updates keep a built graph current at document level. You
insert, delete, or replace individual documents, and the work is scoped to what
actually changed: existing clusters and strategy profiles are preserved, and a
new document joins the nearest existing cluster instead of triggering a
re-clustering of the whole domain. AutoGraph measures how far each partition
has drifted since its last clustering and flags the ones worth refreshing, but
never reclusters on its own - that call, and its cost, stays with you.

See [Incremental Graph Updates](incremental-graph-updates.md).

## What's next

- **[Use Cases](use-cases.md)**: Understand the business value through real-world enterprise scenarios and how AutoGraph compares to traditional RAG.
- **[Setup](setup.md)**: Set up AutoGraph using the web interface or the HTTP REST API.
- **[Web Interface](web-interface.md)**: Create, configure, and run a complete AutoGraph workflow in the web interface.
- **[Architecture](architecture.md)**: Explore AutoGraph's three-layer knowledge graph architecture and ArangoDB collections.
- **[Design Guide](design-guide.md)**: Learn how to structure your data with modules, layers, and components.
- **[Incremental Graph Updates](incremental-graph-updates.md)**: Insert, delete, and update individual documents in a graph that is already built.
- **[API Reference](reference/)**: Dive into the corpus build, embeddings, RAG Strategizer, and orchestration endpoints.