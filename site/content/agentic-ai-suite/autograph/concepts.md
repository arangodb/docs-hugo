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
- **Explicit relationships**: Entities and the connections between them are
  modeled directly, so related information can be traversed instead of inferred.
  The entities and relationships themselves are typically described in natural
  language, not reduced to fixed fields.
- **Accessibility**: You can build a Semantic Web knowledge graph or build one
  from custom data.

An AutoGraph build turns a document collection into such a graph, using LLMs at
most of its stages:
- **Document parsing and chunking**: Source files are parsed and split into
  token-sized chunks, which stay in the graph as the retrieval unit.
- **Image interpretation**: A multimodal model describes the images in your
  documents, so their content becomes part of the searchable text.
- **Ontology generation**: Each domain gets its own set of entity types,
  generated from a sample of its documents.
- **Entity and relation extraction**: Entities of those types are extracted
  together with the relationships between them, and each entity gets an
  LLM-written description.
- **Community detection and summarization**: Related entities are clustered into
  a hierarchy of communities, and each community gets an LLM-written summary
  report.
- **Embeddings**: Chunks, entities, and communities are embedded for similarity
  search.

The target consumer is an agent, not a dashboard. An agent needs the prose that
explains a domain as much as the structure that connects it, which is why the
pipeline invests in generated descriptions and summaries rather than stopping at
bare entity-and-relationship triples. See
[Architecture](architecture.md#knowledge-graph-nodes) for the fields each stage
writes.

## LLMs and knowledge graphs

Large language models (LLMs) and knowledge graphs solve different halves of the
same problem. An LLM reads and writes natural language well but has no reliable
memory of your corpus. A knowledge graph makes the relationships among discrete
and seemingly unrelated pieces of information explicit, so they can be traversed
and reasoned over instead of being rediscovered on every query, but it cannot
interpret a question on its own.

AutoGraph uses each for what it is good at, in both directions:

- **LLMs build the graph.** Once documents are parsed and chunked, they describe
  images, propose the entity types of a domain, extract entities and
  relationships, and write the descriptions and community summaries that the
  graph stores.
- **The graph grounds the LLM.** At query time, retrieval walks the graph to
  assemble the entities, chunks, and community summaries that are relevant to a
  question, and the answer is generated from that evidence rather than from the
  model's own recollection.

## Why GraphRAG

AutoGraph exists to support agents, and an agent asks harder questions of a
corpus than a search box does. GraphRAG is particularly valuable for cases like
the following:

- Agents that need grounded, traceable evidence for the answers they give
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
