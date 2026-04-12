---
title: Local Search
menuTitle: Local Search
description: >-
  Entity-focused retrieval for detailed queries about specific concepts and relationships
weight: 20
---

## Overview

Local Search focuses on specific entities and their relationships within your
knowledge graph. It is ideal for detailed queries about particular concepts,
entities, or relationships.

{{< diagram src="/images/retriever-local-search-architecture.png" 
           alt="Local Search Architecture showing entity-based retrieval" >}}

## Configuration

```json
{
  "query_type": 2,
  "use_llm_planner": false
}
```

{{< info >}}
When `use_llm_planner` is not specified, Local Search defaults to `true`
(Deep Search mode). Set it explicitly to `false` for standard Local Search.
{{< /info >}}

## How it works

1. **Entity Identification**: Identifies relevant entities from the knowledge
   graph based on the query.
2. **Context Gathering**: Collects:
   - Related text chunks from original documents.
   - Connected entities and their strongest relationships.
   - Entity descriptions and attributes.
   - Context from the community each entity belongs to.
3. **Prioritized Response**: Generates a response using the most relevant
   gathered information.

## Best use cases

- "What are the properties of [specific entity]?"
- "How is [entity A] related to [entity B]?"
- "What are the key details about [specific concept]?"

## Next Steps

- **[Deep Search](deep-search.md)**: Use Local Search with the LLM planner for multi-step research.
- **[Execute queries](../executing-queries.md)**: Learn how to call the search endpoints.
- **[Parameters](../parameters.md)**: Customize search behavior.
