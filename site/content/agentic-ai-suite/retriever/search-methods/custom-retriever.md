---
title: Custom Retriever
menuTitle: Custom Retriever
description: >-
  Domain-specific search using configurable tools with flexible search strategies and custom graph traversal
weight: 40
---

## Overview

Custom Retriever enables domain-specific search and retrieval using
configurable, natural-language-described tools stored in the ArangoDB Tools
collection. Unlike the built-in search methods (Global, Local, Unified),
Custom Retriever allows you to define your own search logic, combine multiple
search strategies, and execute custom graph traversal queries tailored to your
specific use case.

Custom retrievers can target any collection in the same database, whether it
was created by the Importer (GraphRAG data) or contains pre-existing
domain-specific graph data from structured sources.

Since tools are described in natural language, they can also be used by
[Deep Search](deep-search.md), where the LLM selects the best tool
automatically based on the query.

## Configuration

```json
{
  "query_type": 4,
  "custom_tools": ["my_tool_id"]
}
```

## How it works

Custom Retriever uses a **3-stage pipeline**:

1. **Stage 1 - Search for starting nodes**: Find relevant documents using one
   or more search modes:
   - **Lexical Search**: Full-text BM25 search using inverted indexes and
     search-alias views.
   - **Semantic Search**: Vector similarity search using embeddings and cosine
     distance.
   - **Hybrid Search**: Combines lexical and semantic search with weighted RRF
     (Reciprocal Rank Fusion).

2. **Stage 2 - AQL graph expansion**: Expand and enrich results using custom
   AQL queries. Execute custom graph traversal queries to gather related
   entities and relationships.

3. **Stage 3 - Citation processing**: Format results with optional citations.
   Deduplicate chunks, create citation mappings, and format context data with
   `[CITE:X]` markers.

## Tool configuration

Custom tools are stored in the ArangoDB `{project_name}_Tools` collection
with the following structure:

```json
{
  "_key": "my_custom_tool_v1",
  "tool_id": "my_custom_tool_v1",
  "tool_type": "custom_retriever",
  "description": "Natural language description of when to use this tool",
  "config": {
    "collection": "MyCollection",
    "search_modes": [
      {
        "type": "lexical",
        "field": "content",
        "weight": 0.4
      },
      {
        "type": "semantic",
        "field": "embedding",
        "weight": 0.6
      }
    ],
    "top_k": 5,
    "show_citations": true,
    "response_instructions": "Provide structured data with clear formatting.",
    "aql_config": {
      "template": "LET nodes = @nodes\nFOR nodeId IN nodes\n  LET doc = DOCUMENT(nodeId)\n  FILTER @include_all OR doc.status == 'active'\n  LIMIT @max_results\n  RETURN doc",
      "relations_collection": "MyRelations",
      "bind_params": {
        "max_results": 10,
        "include_all": false
      }
    }
  }
}
```

### Configuration parameters

- `collection`: Target collection for search.
- `search_modes`: Array of search strategies:
  - `type`: `"lexical"` or `"semantic"` (include both for hybrid search).
  - `field`: Field to search on. For semantic search, this must point to a
    field containing pre-computed vector embeddings.
  - `weight`: RRF weight (higher = more important in fusion). Only applies
    when both lexical and semantic modes are present.
- `top_k`: Number of results to retrieve from search.
- `show_citations`: Whether to generate citations (tool-level control).
- `response_instructions`: Custom instructions for LLM response formatting
  (e.g., "Use table format", "Provide bullet points").
- `aql_config`:
  - `template`: AQL query template (must use `@nodes` bind variable).
  - `relations_collection`: Collection for relationship queries.
  - `bind_params`: Custom parameters passed to AQL execution. Default values
    defined here act as safe defaults for the AQL template and can be
    overridden at query time.

## Index and view management

By default, the system checks that the required indexes and views exist before
executing a search. If anything is missing, it returns a clear error listing
what is absent.

Pass `"auto_create_indexes": true` in your request to create missing indexes
automatically:

```bash
curl -X POST https://<EXTERNAL_ENDPOINT>:8529/graphrag/retriever/<SERVICE_ID_POSTFIX>/v1/graphrag-query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "query": "Find airports in New York",
    "query_type": 4,
    "custom_tools": ["airport_search_v1"],
    "auto_create_indexes": true
  }'
```

**Resources created with `auto_create_indexes: true`:**

| Search type | Resource | Naming pattern |
|-------------|----------|----------------|
| Lexical | Inverted index | `cr_{collection}_{field}` |
| Lexical | Search-alias view | `cr_{collection}_view` |
| Semantic | Vector index | `idx_vector_{collection}_{field}` |

The `cr_` prefix marks resources as Custom Retriever-managed, making them easy
to identify and clean up separately from GraphRAG or manually created resources.

{{< info >}}
Lexical search requires both an inverted index and a search-alias view. The
inverted index stores and tokenizes the field data for full-text (BM25)
matching. The search-alias view is an ArangoDB abstraction that makes the
index queryable via AQL.
{{< /info >}}

## Examples

### Entity relationship expander

This tool searches GraphRAG entities using hybrid search and expands results
with graph relationships:

```json
{
  "_key": "entity_relationship_expander_v1",
  "tool_id": "entity_relationship_expander_v1",
  "tool_type": "custom_retriever",
  "description": "Searches technical documentation for component definitions, architecture explanations, and system integrations.",
  "config": {
    "collection": "SecureSystems_test_Entities",
    "search_modes": [
      { "type": "lexical", "field": "entity_name", "weight": 0.3 },
      { "type": "semantic", "field": "embedding", "weight": 0.7 }
    ],
    "top_k": 30,
    "show_citations": true,
    "aql_config": {
      "template": "LET nodes = @nodes\nFOR n IN nodes\n  LET entity = DOCUMENT(n)\n  LET entity_chunks = (\n    FOR e IN @@relations_collection\n      FILTER e.type == 'MENTIONED_IN' AND e._from == entity._id\n      LIMIT @max_chunks\n      LET chunk = DOCUMENT(e._to)\n      RETURN { content: chunk.content, chunk_id: chunk._key }\n  )\n  LET related_entities = (\n    FOR e IN @@relations_collection\n      FILTER e.type == 'RELATED_TO' AND e._from == entity._id\n      LIMIT @top_k\n      LET related = DOCUMENT(e._to)\n      RETURN { entity_name: related.entity_name, description: related.description, relationship_strength: e.weight }\n  )\n  RETURN { node_id: entity._key, entity_name: entity.entity_name, description: entity.description, chunks: entity_chunks, related_entities: related_entities }",
      "relations_collection": "SecureSystems_test_Relations",
      "bind_params": {
        "max_chunks": 5
      }
    }
  }
}
```

### Structured data search

This tool searches structured (non-GraphRAG) data using lexical search:

```json
{
  "_key": "airport_search_v1",
  "tool_id": "airport_search_v1",
  "tool_type": "custom_retriever",
  "description": "Searches airport database for airport information by name, city, or state.",
  "config": {
    "collection": "airports",
    "search_modes": [
      { "type": "lexical", "field": "name", "weight": 1.0 }
    ],
    "top_k": 10,
    "show_citations": false,
    "aql_config": {
      "template": "LET nodes = @nodes\nFOR n IN nodes\n  LET airport = DOCUMENT(n)\n  LET outgoing_flights = (\n    FOR flight IN flights\n      FILTER flight._from == airport._id\n      LIMIT @max_flights\n      LET dest = DOCUMENT(flight._to)\n      RETURN { destination: dest.name, carrier: flight.UniqueCarrier, distance: flight.Distance }\n  )\n  RETURN { airport_code: airport._key, airport_name: airport.name, city: airport.city, state: airport.state, outgoing_flights: outgoing_flights }",
      "relations_collection": "flights",
      "bind_params": {
        "max_flights": 5
      }
    }
  }
}
```

## Best use cases

- **Domain-specific search**: Airport data, digital twins, network data,
  product catalogs, customer records.
- **Custom business logic**: Multi-step retrieval with domain rules.
- **Hybrid search requirements**: Control lexical vs. semantic balance per domain.
- **Graph traversal needs**: Expand search results with custom relationship patterns.
- **Multi-tool workflows**: Execute multiple specialized tools in parallel.

## Next Steps

- **[Deep Search](deep-search.md)**: Use custom tools with the LLM planner for automated multi-step research.
- **[Execute queries](../executing-queries.md)**: Learn how to call the search endpoints.
- **[Parameters](../parameters.md)**: Customize search behavior.
