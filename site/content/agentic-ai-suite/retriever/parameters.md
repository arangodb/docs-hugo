---
title: Retriever Parameter Reference
menuTitle: Parameters
description: >-
  Complete reference for all Retriever service query parameters
weight: 60
---

{{< info >}}
This page provides detailed parameter definitions. For query workflows and examples, 
see the [Execute Queries guide](executing-queries.md).
{{< /info >}}

## Overview

The Retriever service supports a range of parameters to customize how your queries 
are processed and how responses are generated.

## Query Parameters

### `query`

Your search query text.

- **Required**: Yes.
- **Description**: The natural language question or search query to execute against your knowledge graph. Example: `"What is the AR3 Drone?"`.

### `query_type`

The type of search to perform.

- **Required**: No (defaults to `1` for `GLOBAL`).
- **Possible values**:
  - `0`: Unspecified.
  - `1` or `GLOBAL`: Global Search.
  - `2` or `LOCAL`: Deep Search (with LLM planner) or Local Search (without LLM planner).
  - `3` or `UNIFIED`: Instant Search.
  - `4` or `CUSTOM`: Custom Retriever. Requires `custom_tools` in standard mode; optional in Deep Search mode (`use_llm_planner=true`).

### `use_llm_planner`

Whether to use the LLM planner for intelligent query orchestration.

- **Required**: No.
- **Default**: `true` for `LOCAL`, `false` for `GLOBAL`, `UNIFIED`, and `CUSTOM`.
- **Description**: 
  - When `true`: Enables Deep Search with LLM-orchestrated retrieval.
  - When `false`: Uses standard search without orchestration.
  - For `CUSTOM` queries with `use_llm_planner=true`, the LLM automatically selects and plans tool execution. See [Deep Search](search-methods/deep-search.md).

### `level`

Community hierarchy level for Global Search analysis.

- **Required**: No (defaults to `2`).
- **Applicable to**: `GLOBAL` query type only.
- **Possible values**:
  - `1`: Top-level communities (broader themes).
  - `2`: Second-level communities (default).
  - Higher values for deeper hierarchy levels (if available in your knowledge graph).

### `partition_ids`

Filter results to specific data partitions.

- **Required**: No (defaults to empty; all partitions included).
- **Description**: An array of partition ID strings. When provided, all data
  (communities, entities, chunks, relationships) is filtered to the specified
  partitions. Multiple partitions can be specified.
- **Example**: `["tenant-123", "tenant-456"]`

{{< info >}}
Your knowledge graph data must include a `partition_id` field on documents for
filtering to work. See the [Importer `partition_id` parameter](../importer/parameters.md#partition_id).
{{< /info >}}

### `custom_tools`

Tool IDs for Custom Retriever execution.

- **Required**: Yes for `CUSTOM` queries (when `use_llm_planner=false`). Optional for Custom Deep Search (`use_llm_planner=true`).
- **Applicable to**: `CUSTOM` query type only.
- **Description**: An array of tool IDs stored in the ArangoDB Tools
  collection. Tools are executed in parallel with automatic citation merging.
  When using Deep Search with `CUSTOM` and `custom_tools` is omitted, tools
  are auto-loaded from the Tools collection.
- **Example**: `["airport_search_v1", "entity_expander_v1"]`

### `auto_create_indexes`

Whether to auto-create missing indexes and views for Custom Retriever.

- **Required**: No (defaults to `false`).
- **Applicable to**: `CUSTOM` query type only.
- **Description**:
  - When `false` (default): Checks that required indexes and views exist; returns
    a clear error listing what is missing if they are not found.
  - When `true`: Automatically creates any missing inverted indexes, vector
    indexes, and search-alias views.

{{< warning >}}
Set to `true` with care on large pre-existing collections; index creation can
be expensive in memory and compute.
{{< /warning >}}

### `custom_prompts`

Override default LLM prompts for this query.

- **Required**: No.
- **Description**: A dictionary mapping prompt keys to custom prompt strings.
  Only specified prompts are overridden; all others use defaults. See the
  [Custom Prompts reference](custom-prompts.md) for available keys and template
  variables.

## Response Parameters

### `include_metadata`

Whether to include metadata in the response.

- **Required**: No (defaults to `false`).
- **Description**: When enabled, responses include additional metadata.

### `show_citations`

Whether to show inline citations in the response.

- **Required**: No (defaults to `true`).
- **Description**:
  - When `true` (default): Citations appear inline as `[X]` in the response.
  - When `false`: All `[CITE:X]` patterns are stripped from the response.
  - This parameter controls displaying citations only. The actual citation URL metadata is set via [`citable_url`](../importer/parameters.md#file-source-parameters) at import time.

{{< warning >}}
For deep search queries (`use_llm_planner=true`), citations are always disabled
regardless of this setting.
{{< /warning >}}

### `response_instructions`

Custom instructions for response generation style.

- **Required**: No
- **Description**: Provides custom instructions to the LLM for how to format or 
  style the response.
- **Examples:**
  - "Short answer"
  - "Multiple paragraphs"
  - "Concise answer in 2-3 sentences"
  - "Provide detailed analysis with examples"

If not specified, default instructions are applied based on the query type:

| Query Type | Default Instruction |
|------------|---------------------|
| Global Search | "Provide a comprehensive answer with detailed explanations and context based on the community data" |
| Local Search | "Concise answer in fewer than 25 words if possible; multiple paragraphs only when context is required" |
| Unified/Instant Search | "Answer in 60 words ideally, 100 words maximum. Be direct and concise" |

{{< info >}}
For Custom Retriever (`query_type=4`), the request-level `response_instructions`
is ignored. Instead, synthesis uses `config.response_instructions` from each
custom tool's configuration.
{{< /info >}}

## Caching Parameters

### `use_cache`

Whether to use caching for this query.

- **Required**: No (defaults to `false` when unspecified).
- **Description**:
  - When `true`: Checks cache for hits and saves responses to cache.
  - When `false` (default): Skips cache entirely — no check, no write.

**Example to enable caching:**

```json
{
  "query": "What is X?",
  "query_type": 2,
  "use_cache": true
}
```

{{< tip >}}
Enable caching to improve response times for repeated queries. Leave it disabled (default) when you need fresh results or when testing changes to your knowledge graph.
{{< /tip >}}

## Response Format

All queries return a response with `result` and `metadata` fields.

### Standard Response

```json
{
  "result": "Your answer text...",
  "metadata": ""
}
```

### Response with Metadata

When `include_metadata` is `true`, the `metadata` field contains JSON with 
different structures depending on the query type.

**For Local and Unified Search:**

```json
{
  "result": "Your answer text...",
  "metadata": "{\"context_data\": [...], \"formatted_context\": \"...\", \"citation_mapping\": {...}}"
}
```

- `context_data`: Retrieved context nodes
- `formatted_context`: Formatted context with citations
- `citation_mapping`: Mapping of citation numbers to source URLs

**For Global Search:**

```json
{
  "result": "Your answer text...",
  "metadata": "{\"final_support_points\": [{\"analyst\": 0, \"answer\": \"...\", \"score\": 0.95}]}"
}
```

- `final_support_points`: Array of insights from community analysts, each with:
  - `analyst`: Community/analyst number
  - `answer`: Key insight from that analyst
  - `score`: Relevance score (higher is more relevant)

**For Local Search with LLM planner (`use_llm_planner=true`):**

- `execution_log`: Log of planner execution
- `completed_steps`: Number of completed steps
- `total_steps`: Total planned steps
- `iterations`: Number of iterations
- `global_context`: Global context used for planning
- `llm_planner_used`: Always `true`
- `original_query_type`: The original query type

**For Custom Retriever:**

- `custom_retrievers_used`: List of tools used
- `num_tools`: Number of tools executed
- `successful_tools`: Number of tools that succeeded
- `failed_tools`: Number of tools that failed
- `citation_mapping`: Citation mappings from tools

**For cache hits (`use_cache=true`):**

- `cached`: `true`
- `similarity`: Cache match score
- `cached_question`: The cached question that matched

## API Reference

For detailed API documentation, see the
[GraphRAG Retrievers API Reference](https://apiref.arango.ai/#graphrag_retrievers).
