---
title: GraphRAG Concepts
menuTitle: Concepts
weight: 1
description: >-
  Knowledge graphs, large language models, and how graph-based
  retrieval-augmented generation combines the two
aliases:
  - /arangodb/3.12/data-science/llm-knowledge-graphs # 3.10, 3.11
  - /arangodb/stable/data-science/llm-knowledge-graphs # 3.10, 3.11
  - /arangodb/4.x/data-science/llm-knowledge-graphs # 3.10, 3.11
  - /arangodb/devel/data-science/llm-knowledge-graphs # 3.10, 3.11
---
AutoGraph builds on a set of foundational ideas: knowledge graphs as a way to
represent connected information, large language models as a way to read and
write natural language, and graph-based retrieval-augmented generation
(GraphRAG) as the technique that combines the two. This page explains those
ideas. AutoGraph goes considerably further, adding domain discovery, per-domain
retrieval strategies, horizontal scaling, and incremental updates on top of
them.

## What are knowledge graphs?

A knowledge graph can be thought of as a dynamic and interconnected network of
real-world entities and the intricate relationships that exist between them.

Key aspects of knowledge graphs:
- **Domain-specific knowledge**: You can tailor knowledge graphs to specific
  domains and industries.
- **Structured information**: Makes it easy to query, analyze, and extract
  meaningful insights from your data.
- **Accessibility**: You can build a Semantic Web knowledge graph or build one
  from custom data.

LLMs can help distill knowledge graphs from natural language by performing
the following tasks:
- Entity discovery
- Relation extraction
- Coreference resolution
- End-to-end knowledge graph construction
- (Text) Embeddings

## LLMs and knowledge graphs

Large language models (LLMs) and knowledge graphs are two prominent and
contrasting concepts, each possessing unique characteristics and functionalities
that significantly impact the methods we employ to extract valuable insights from
constantly expanding and complex datasets.

LLMs, such as those powering OpenAI's ChatGPT, represent a class of powerful language
transformers. These models leverage advanced neural networks to exhibit a
remarkable proficiency in understanding, generating, and participating in
contextually-aware conversations.

On the other hand, knowledge graphs contain carefully structured data and are
designed to capture intricate relationships among discrete and seemingly
unrelated information.

Arango's unique capabilities and flexible integration of knowledge graphs and
LLMs provide a powerful and efficient solution for anyone seeking to extract
valuable insights from diverse datasets.

## Why GraphRAG

GraphRAG is particularly valuable for use cases like the following:

- Applications requiring in-depth knowledge retrieval
- Contextual question answering
- Reasoning over interconnected information
- Discovery of relationships between concepts across documents

For detailed business scenarios, see [Use Cases](use-cases.md).

## Cross-document intelligence

GraphRAG extracts meaningful insights from document collections by creating
knowledge graphs that capture not just individual facts, but the intricate
relationships between concepts across documents. This goes beyond traditional
RAG systems by understanding document interconnections and providing both
granular detail-level responses and high-level conceptual understanding.

- **Cross-document relationship intelligence**\
  Unlike traditional RAG systems that treat documents in isolation, the
  GraphRAG pipeline detects and leverages references between documents and
  chunks. This enables more accurate responses by understanding how concepts
  relate across your entire knowledge base.

- **Multi-level understanding architecture**\
  The system provides both detailed technical responses and high-level strategic
  insights from the same knowledge base, adapting response depth based on query
  complexity and user intent.

- **Reference-aware knowledge graph**\
  Relationships between document chunks are detected and mapped automatically,
  while the context of how information connects across different sources is
  maintained.

- **Dynamic knowledge evolution**\
  The system learns and improves understanding as more documents are added, with
  relationships and connections becoming more sophisticated over time.

## What's next

- **[Use Cases](use-cases.md)**: Understand the business value through
  real-world enterprise scenarios.
- **[Architecture](architecture.md)**: See how the concepts above map onto
  AutoGraph's three-layer knowledge graph and the ArangoDB collections
  behind it.
- **[Web Interface](web-interface.md)**: Run the complete workflow in AutoGraph
  Studio, from building the Context Graph to deploying AutoRAG retrievers and
  asking questions against it.
