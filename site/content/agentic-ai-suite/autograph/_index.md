---
title: AutoGraph
menuTitle: AutoGraph
weight: 4
description: >-
  AutoGraph structures enterprise data into contextual knowledge shards with domain-aware retrieval strategies providing AI copilots and agents with production-grade context infrastructure
aliases:
  - ../reference/autograph/
---

## What is AutoGraph?

AutoGraph is an automation copilot that analyzes enterprise documents, discovers
natural knowledge domains, and builds semantic infrastructure for intelligent
retrieval at scale - importing documents, generating embeddings, building knowledge
graphs, assigning RAG strategies per domain, and orchestrating downstream GraphRAG builds.

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

Traditional RAG solutions treat all documents the same way, leading to either inadequate processing of complex content or wasteful over-processing of simple content. AutoGraph adapts to your data.

By organizing enterprise data into contextual knowledge graphs, AutoGraph creates a semantic data layer that represents relationships between business entities, systems, and operational events. This enables AI agents to:
- Reason across enterprise relationships
- Understand real-time operational states
- Operate within governance policies
- Produce explainable outputs with traceable lineage

## AutoRAG: Automated Retrieval Strategy Selection

AutoRAG automatically selects the optimal retrieval strategy by combining:
- GraphRAG
- Vector search
- Hybrid retrieval
- Contextual summarization

The system dynamically selects the retrieval approach based on the query, enabling AI systems to reason across connected enterprise context.