---
title: Search Methods
menuTitle: Search Methods
description: >-
  Understand the different search methods available in the Retriever service
weight: 30
---

{{< info >}}
**Getting Started Path:** [Overview](./) → [Configure LLMs](llm-configuration.md) → **Search Methods** → [Execute Queries](executing-queries.md) → [Verify](verify-and-monitor.md)
{{< /info >}}

## Overview

The Retriever service enables intelligent search and retrieval of information
from your knowledge graph. It provides multiple search methods that leverage 
the structured knowledge graph created by the Importer to deliver accurate and 
contextually relevant responses to your natural language queries.

## Instant Search

Instant Search is designed for responses with very short latency. It triggers
fast unified retrieval over relevant parts of the knowledge graph via hybrid
(semantic and lexical) search and graph expansion algorithms, producing a fast,
streamed natural-language response with clickable references to the relevant documents.

{{< info >}}
The Instant Search method is also available via the [Web interface](../../graphrag/web-interface.md).
{{< /info >}}

**Configuration:**

```json
{
  "query_type": "UNIFIED"
}
```

## Deep Search

Deep Search is designed for highly detailed, accurate responses that require understanding
what kind of information is available in different parts of the knowledge graph and
sequentially retrieving information in an LLM-guided research process. Use whenever
detail and accuracy are required (e.g. aggregation of highly technical details) and
very short latency is not (i.e. caching responses for frequently asked questions,
or use case with agents or research use cases).

{{< info >}}
The Deep Search method is also available via the [Web interface](../../graphrag/web-interface.md).
{{< /info >}}

**Configuration:**

```json
{
  "query_type": "LOCAL",
  "use_llm_planner": true
}
```

## Global Search

Global search is designed for queries that require understanding and aggregation of 
information across your entire document. It's particularly effective for questions 
about overall themes, patterns, or high-level insights in your data.

**Configuration:**

```json
{
  "query_type": "GLOBAL"
}
```

**How it works:**

- **Community-Based Analysis**: Uses pre-generated community reports from your knowledge 
  graph to understand the overall structure and themes of your data.
- **Map-Reduce Processing**:
  - **Map Stage**: Processes community reports in parallel, generating intermediate 
    responses with rated points.
  - **Reduce Stage**: Aggregates the most important points to create a comprehensive 
    final response.

## Local Search

Local search focuses on specific entities and their relationships within your knowledge 
graph. It is ideal for detailed queries about particular concepts, entities, or relationships.

**Configuration:**

```json
{
  "query_type": "LOCAL",
  "use_llm_planner": false
}
```

**How it works:**

- **Entity Identification**: Identifies relevant entities from the knowledge graph based 
  on the query.
- **Context Gathering**: Collects:
  - Related text chunks from original documents.
  - Connected entities and their strongest relationships.
  - Entity descriptions and attributes.
  - Context from the community each entity belongs to.
- **Prioritized Response**: Generates a response using the most relevant gathered information.

## Next Steps

- **[Execute queries](executing-queries.md)**: Learn how to call the search endpoints.
- **[Explore all parameters](parameters.md)**: Customize search behavior.
- **[Verify and monitor](verify-and-monitor.md)**: Check service health and status.
