---
title: AutoGraph
menuTitle: AutoGraph
weight: 4
description: >-
  AutoGraph structures enterprise data into contextual knowledge shards with domain-aware retrieval strategies providing AI copilots and agents with production-grade context infrastructure
---

## What is AutoGraph?

AutoGraph is an **automation copilot** that analyzes your enterprise documents, discovers 
natural knowledge domains, and builds semantic infrastructure for intelligent retrieval at scale.

Think of it as a **self-organizing knowledge system**. Instead of manually categorizing 
documents or designing taxonomies, AutoGraph handles the following:
1. Analyzes document relationships automatically
2. Discovers natural domain clusters using graph algorithms
3. Creates specialized RAG partitions per domain
4. Optimizes retrieval strategies per domain
5. Routes queries intelligently to relevant domains

The result is a domain-aware knowledge base that scales horizontally across machines.

### Why AutoGraph?

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

## Architecture Overview

AutoGraph's **three-layer architecture** organizes data from business taxonomy through semantic discovery to optimized retrieval.

### Layer 1: Business Taxonomy

The first layer reflects your company's explicit organizational structure. This is where you define:
- Document categories based on business needs (e.g., legal, technical, marketing)
- Departmental or product-line boundaries
- Security or access control classifications
- Any metadata-driven categorization

In practice, this creates **multiple parallel corpora** — separate document collections that reflect your organizational taxonomy. While each corpus can be processed independently, they remain connected within a single database, enabling cross-corpus queries when needed.

### Layer 2: Corpus Graph

Within a business-defined corpus, AutoGraph automatically discovers natural knowledge domains. The **Corpus Graph** is AutoGraph's automated semantic map showing:
- Which documents exist in your corpus
- How documents relate to each other semantically
- Which knowledge domains they belong to
- What processing strategy each domain needs

This context layer provides intelligent routing and retrieval by:
- Analyzing semantic relationships between documents
- Using graph clustering to find topical groupings
- Building a Corpus Graph showing documents, domains, and relationships
- Providing intelligent routing to relevant domains

### Layer 3: RAG Partitions

Each discovered knowledge domain becomes a specialized RAG partition with optimized processing. This architecture enables:

- **Horizontal Scaling**: Domain partitions can be distributed across multiple machines, allowing you to add capacity as your corpus grows. Each partition is independently scalable, enabling true horizontal growth without architectural limitations.
- **Efficient Retrieval**: AutoGraph finds relevant domains, then searches only those partitions, dramatically reducing the search space. Instead of querying the entire corpus, queries typically hit only a few relevant partitions. The SmartGraph keeps related data together for high performance while enabling cross-partition queries when needed.
- **Optimized Processing**: Each domain gets the best RAG strategy for its complexity. Choose from cheap and fast (NaiveRAG) for simple content to complex and powerful (Full GraphRAG) for technical documents, resulting in major cost savings compared to processing everything uniformly.

All partitions are unified into the **MegaGraph** — a single, unified knowledge graph containing all the individual RAG partitions. It is built as an ArangoDB **SmartGraph**, which means data within the same partition is kept together for high performance, but partitions can still be connected. This creates a single graph composed of many smaller, weakly connected knowledge graphs.