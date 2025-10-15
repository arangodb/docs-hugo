---
title: GraphRAG
menuTitle: GraphRAG
weight: 5
description: >-
  ArangoDB's GraphRAG solution combines graph-based retrieval-augmented generation
  with Large Language Models (LLMs) for turbocharged GenAI solutions
aliases:
  llm-knowledge-graphs
---
{{< tip >}}
The Arango Data Platform & GenAI Suite is available as a pre-release. To get
exclusive early access, [get in touch](https://arangodb.com/contact/) with
the ArangoDB team.
{{< /tip >}}

## Transform unstructured documents into intelligent knowledge graphs

ArangoDB's GraphRAG solution enables organizations to extract meaningful insights 
from their document collections by creating knowledge graphs that capture not just 
individual facts, but the intricate relationships between concepts across documents. 
This approach goes beyond traditional RAG systems by understanding document 
interconnections and providing both granular detail-level responses and high-level 
conceptual understanding.

- **Intelligent document understanding**: Automatically extracts and connects knowledge across multiple document sources
- **Contextual intelligence**: Maintains relationships between concepts, enabling more accurate and comprehensive responses  
- **Multi-level insights**: Provides both detailed technical answers and strategic high-level understanding
- **Seamless knowledge access**: Natural language interface for querying complex document relationships

## Key benefits for enterprise applications

- **Cross-document relationship intelligence**:
Unlike traditional RAG systems that treat documents in isolation, ArangoDB's GraphRAG 
pipeline detects and leverages references between documents and chunks. This enables 
more accurate responses by understanding how concepts relate across your entire knowledge base.

- **Multi-level understanding architecture**:
The system provides both detailed technical responses and high-level strategic insights 
from the same knowledge base, adapting response depth based on query complexity and user intent.

- **Reference-aware knowledge graph**:
GraphRAG automatically detects and maps relationships between document chunks while 
maintaining context of how information connects across different sources.

- **Dynamic knowledge evolution**:
The system learns and improves understanding as more documents are added, with 
relationships and connections becoming more sophisticated over time.


## What's next

- **[GraphRAG Enterprise Use Cases](use-cases.md)**: Understand the business value through real-world scenarios.
- **[GraphRAG Technical Overview](technical-overview.md)**: Dive into the architecture, services, and implementation details.
- **[GraphRAG Web Interface](web-interface.md)**: Try GraphRAG using the interactive web interface.
- **[GraphRAG Tutorial using integrated Notebook servers](tutorial-notebook.md)**: Follow hands-on examples and implementation guidance via Jupyter Notebooks.

For deeper implementation details, explore the individual services:
- **[Importer Service](services/importer.md)**: Transform documents into knowledge graphs.
- **[Retriever Service](services/retriever.md)**: Query and extract insights from your knowledge graphs.
