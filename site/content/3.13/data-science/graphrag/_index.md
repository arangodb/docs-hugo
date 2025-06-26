---
title: GraphRAG
menuTitle: GraphRAG
weight: 10
description: >-
  ArangoDB's GraphRAG solution combines graph-based retrieval augmented generation
  with Large Language Models (LLMs) for turbocharged Gen AI solutions
aliases:
  llm-knowledge-graphs
# TODO: Repurpose for GenAI
---
Large language models (LLMs) and knowledge graphs are two prominent and
contrasting concepts, each possessing unique characteristics and functionalities
that significantly impact the methods we employ to extract valuable insights from
constantly expanding and complex datasets.

LLMs, exemplified by OpenAI's ChatGPT, represent a class of powerful language
transformers. These models leverage advanced neural networks to exhibit a
remarkable proficiency in understanding, generating, and participating in
contextually-aware conversations.

On the other hand, knowledge graphs contain carefully structured data and are
designed to capture intricate relationships among discrete and seemingly
unrelated information. With knowledge graphs, you can explore contextual
insights and execute structured queries that reveal hidden connections within
complex datasets. 

ArangoDB's unique capabilities and flexible integration of knowledge graphs and
LLMs provide a powerful and efficient solution for anyone seeking to extract
valuable insights from diverse datasets.

The GraphRAG component of the GenAI Suite brings all the capabilities
together with an easy-to-use interface so you can make the knowledge accessible
to your organization.

## ArangoDB GraphRAG

ArangoDB's GraphRAG solution democratizes the creation and usage of knowledge
graphs with a unique combination of vector search, graphs, and LLMs in a
single product.

### Knowledge Graphs

A knowledge graph can be thought of as a dynamic and interconnected network of
real-world entities and the intricate relationships that exist between them.

Key aspects of knowledge graphs:
- **Domain specific knowledge**: You can tailor knowledge graphs to specific
  domains and industries.
- **Structured information**: Makes it easy to query, analyze, and extract
  meaningful insights from your data.
- **Accessibility**: You can build a Semantic Web knowledge graph or using
  custom data.

LLMs can help distill knowledge graphs from natural language by performing
the following tasks:
- Entity discovery
- Relation extraction
- Coreference resolution
- End-to-end knowledge graph construction
- (Text) Embeddings

![ArangoDB Knowledge Graphs and LLMs](../../../images/ArangoDB-knowledge-graphs-meets-llms.png)

### Examples

### Interfaces

{{< tabs "interfaces" >}}

{{< tab "Web interface" >}}
1. In the Platform UI, ...
{{< /tab >}}

{{< tab "cURL" >}}
```
curl http://localhost:8529/gen-ai/
```
{{< /tab >}}

{{< /tabs >}}
