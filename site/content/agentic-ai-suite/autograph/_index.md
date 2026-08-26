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
- **Change**: Lets you add, remove, and replace individual documents instead of rebuilding the corpus every time a few files change

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

Document sets change over time. Contracts are amended, specifications are
revised, and obsolete files need to be removed. If you rebuild the whole corpus
for a few changed documents, you pay again for the extraction, the embeddings,
the clustering, and a full Importer run.

Incremental Graph Updates keep a knowledge graph up-to-date after it has been
built. You insert, delete, or replace individual documents, and only what
actually changed is processed. Existing clusters and strategy profiles are kept,
and a new document joins the cluster closest to it, so the whole domain does not
have to be clustered again. AutoGraph also measures how far each partition has
drifted since it was last clustered and flags the ones that may need a refresh,
but it never reclusters on its own. That decision, and the cost of it, is up to
you.

See [Incremental Graph Updates](incremental-graph-updates.md).

## What's next

- **[Use Cases](use-cases.md)**: Understand the business value through real-world enterprise scenarios and how AutoGraph compares to traditional RAG.
- **[Setup](setup.md)**: Set up AutoGraph using the web interface or the HTTP REST API.
- **[Web Interface](web-interface.md)**: Create, configure, and run a complete AutoGraph workflow in the web interface.
- **[Architecture](architecture.md)**: Explore AutoGraph's three-layer knowledge graph architecture and ArangoDB collections.
- **[Design Guide](design-guide.md)**: Learn how to structure your data with categories, layers, and components.
- **[Incremental Graph Updates](incremental-graph-updates.md)**: Insert, delete, and update individual documents in a knowledge graph that has already been built.
- **[API Reference](reference/)**: Dive into the corpus build, embeddings, RAG Strategizer, and orchestration endpoints.