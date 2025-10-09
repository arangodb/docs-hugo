---
title: GraphRAG Technical Overview
menuTitle: Technical Overview
weight: 15
description: >-
  Technical overview of ArangoDB's GraphRAG solution, including
  architecture, services, and deployment options
---
{{< tag "ArangoDB Platform" >}}

{{< tip >}}
The ArangoDB Platform & GenAI Suite is available as a pre-release. To get
exclusive early access, [get in touch](https://arangodb.com/contact/) with
the ArangoDB team.
{{< /tip >}}

## Introduction

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

ArangoDB's unique capabilities and flexible integration of knowledge graphs and
LLMs provide a powerful and efficient solution for anyone seeking to extract
valuable insights from diverse datasets.

The GraphRAG component of the GenAI Suite brings all the capabilities
together with an easy-to-use interface, so you can make the knowledge accessible
to your organization.

GraphRAG is particularly valuable for use cases like the following:
- Applications requiring in-depth knowledge retrieval
- Contextual question answering
- Reasoning over interconnected information

## How GraphRAG works

ArangoDB's GraphRAG solution democratizes the creation and usage of knowledge
graphs with a unique combination of vector search, graphs, and LLMs (privately or publicly hosted)
in a single product.

The overall workflow involves the following steps:
1. **Chunking**:
   - Breaking down raw documents into text chunks
2. **Entity and relation extraction for Knowledge Graph construction**:
   - LLM-assisted description of entities and relations
   - Entities get inserted as nodes with embeddings
   - Relations get inserted as edges, these include: entity-entity, entity-chunk, chunk-document
3. **Topology-based clustering into mini-topics (called communities)**:
   - Each entity points to its community
   - Each community points to its higher-level community, if available
     (mini-topics point to major topics)
4. **LLM-assisted community summarization**:
   - Community summarization is based on all information available about each topic

### Turn text files into a Knowledge Graph

The Importer service is the entry point of the GraphRAG pipeline. It takes a
raw text file as input, processes it using an LLM to extract entities and
relationships, and generates a Knowledge Graph. The Knowledge Graph is then
stored in an ArangoDB database for further use. The Knowledge Graph represents
information in a structured graph format, allowing efficient querying and retrieval.

1. Pre-process the raw text file to identify entities and their relationships.
2. Use LLMs to infer connections and context, enriching the Knowledge Graph.
3. Store the generated Knowledge Graph in the database for retrieval and reasoning.

For detailed information about the service, see the
[Importer](services/importer.md) service documentation.

### Extract information from the Knowledge Graph

The Retriever service enables intelligent search and retrieval of information
from your previously created Knowledge Graph.
You can extract information from Knowledge Graphs using two distinct methods:
- Global retrieval
- Local retrieval

For detailed information about the service, see the
[Retriever](services/retriever.md) service documentation.

#### Global retrieval

Global retrieval focuses on:
- Extracting information from the entire Knowledge Graph, regardless of specific
  contexts or constraints.
- Provides a comprehensive overview and answers queries that span across multiple
  entities and relationships in the graph.

**Use cases:**
- Answering broad questions that require a holistic understanding of the Knowledge Graph.
- Aggregating information from diverse parts of the Knowledge Graph for high-level insights.

**Example query:**

Global retrieval can answer questions like _**What are the main themes or topics covered in the document**_?

During import, the entire Knowledge Graph is analyzed to identify and summarize
the dominant entities, their relationships, and associated themes. Global
retrieval uses these community summaries to answer questions from different
perspectives, then the information gets aggregated into the final response.

#### Local retrieval

Local retrieval is a more focused approach for:
- Queries that are constrained to specific subgraphs or contextual clusters
  within the Knowledge Graph.
- Targeted and precise information extraction, often using localized sections
  of the Knowledge Graph.

**Use cases:**
- Answering detailed questions about a specific entity or a related group of entities.
- Retrieving information relevant to a particular topic or section in the Knowledge Graph.

**Example query:**

Local retrieval can answer questions like _**What is the relationship between entity X and entity Y**_?

Local queries use hybrid search (semantic and lexical) over the Entities
collection, and then it expands that subgraph over related entities, relations
(and its LLM-generated verbal descriptions), text chunks, and communities.

### Private LLMs

If you're working in an air-gapped environment or need to keep your data
private, you can use the private LLM mode with 
[Triton Inference Server](services/triton-inference-server.md).

This option allows you to run the service completely within your own
infrastructure. The Triton Inference Server is a crucial component when
running in private LLM mode. It serves as the backbone for running your
language (LLM) and embedding models on your own machines, ensuring your
data never leaves your infrastructure. The server handles all the complex
model operations, from processing text to generating embeddings, and provides
both HTTP and gRPC interfaces for communication.

### Public LLMs

Alternatively, if you prefer a simpler setup and don't have specific privacy
requirements, you can use the public LLM mode. This option connects to cloud-based
services like OpenAI's models via the OpenAI API or a large array of models
(Gemini, Anthropic, publicly hosted open-source models, etc.) via the OpenRouter option.

## Limitations

The pre-release version of ArangoDB GraphRAG has the following limitations:

- You can only import a single file.
- The knowledge graph generated from the file is imported into a named graph
  with a fixed name of `KnowledgeGraph` and set of collections which also have
  fixed names.
