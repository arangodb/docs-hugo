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
- **Maximum size**: 65,536 bytes (64 KiB) of UTF-8 text. A larger query is
  rejected with `INVALID_ARGUMENT` and a message naming its size, before any
  retrieval work starts. Operators can change the limit with the
  `MAX_QUERY_BYTES` environment variable.

{{< info >}}
The limit counts bytes, not characters, so a query written in a script whose
characters take two or three bytes each in UTF-8, such as Cyrillic, Chinese, or
Japanese, reaches it well before an English query of the same length.
{{< /info >}}

{{< warning >}}
A query rejected for its size never becomes a run, so it does not appear in the
[query history](verify-and-monitor.md#query-history). Handle the error from the
call itself; there is no stored run to look up afterwards.
{{< /warning >}}

### `query_type`

The type of search to perform.

- **Required**: No (defaults to `1` for `GLOBAL`).
- **Possible values**:
  - `0`: Unspecified.
  - `1` or `GLOBAL`: Global Search.
  - `2` or `LOCAL`: Deep Search (with LLM planner) or Local Search (without LLM planner).
  - `3` or `UNIFIED`: Instant Search.
  - `4` or `CUSTOM`: Custom Retriever. Requires `custom_tools` in standard mode; optional in Deep Search mode (`use_llm_planner=true`).

### `mode`

Selects Instant or Deep Search with a single value, instead of combining
`query_type` and `use_llm_planner`.

- **Required**: No.
- **Possible values**:
  - `1` or `"INSTANT"`: Runs
    [Instant Search](search-methods/unified-search.md) for a fast answer.
  - `2` or `"DEEP_SEARCH"`: Runs [Deep Search](search-methods/deep-search.md)
    for a thorough answer. It searches with your
    [Custom Retriever](search-methods/custom-retriever.md) tools if you have
    any, and with Local Search if you do not.
- **Description**: You can send the value as a number or as its name, for
  example `2` or `"DEEP_SEARCH"`. Setting `mode` takes precedence over
  `query_type` and `use_llm_planner`, so whatever you pass for those two is
  ignored.

{{< info >}}
With `include_metadata` set to `true`, the response reports `mode` by name
(`"INSTANT"` or `"DEEP_SEARCH"`) together with the search type it picked. For
`DEEP_SEARCH`, you can tell which of the two paths ran from the metadata:
`deep_search_route` is set to `"LOCAL"` when the query fell back to Local
Search, and `deep_search_route_reason` says why, for example that no tools were
found in the Tools collection. When your Custom Retriever tools were used
instead, both fields are absent and the tool fields such as
`custom_retrievers_used` and `successful_tools` are populated.
{{< /info >}}

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

- **Required**: No (defaults to empty).
- **Description**: An array of partition ID strings. When provided, all data
  (communities, entities, chunks, relationships) is filtered to the specified
  partitions. Multiple partitions can be specified.
- **Example**: `["tenant-123", "tenant-456"]`

{{< info >}}
Your knowledge graph data must include a `partition_id` field on documents for
filtering to work. See the [Importer `partition_id` parameter](../importer/reference/parameters.md#partition_id).
{{< /info >}}

{{< warning >}}
Passing `partition_ids` is enough on its own: it turns automatic selection off
for that query. Do not also send
[`auto_select_partitions`](#auto_select_partitions) as `true`, because the
service rejects a request that asks for both.
{{< /warning >}}

### `auto_select_partitions`

Whether the service selects the relevant partitions itself.

- **Required**: No (defaults to `true`).
- **Applicable to**: All query types (`GLOBAL`, `LOCAL`, `UNIFIED`, `CUSTOM`).
- **Description**:
  - When `true` (default): The service searches the
    [AutoGraph](../autograph/_index.md) corpus graph before retrieval and
    restricts the query to the partitions that match. Omitting the parameter has
    the same effect as setting it to `true`.
  - When `false`: No automatic selection happens, and the query runs without a
    partition filter unless you pass `partition_ids`.
- **Cannot be combined with**: `partition_ids`, if you set this parameter to
  `true`. Sending `false` alongside `partition_ids` is allowed but unnecessary,
  because those IDs already switch automatic selection off.

{{< info >}}
Custom Retriever tools can override partition routing per tool. See
[Custom Retriever configuration parameters](search-methods/custom-retriever.md#configuration-parameters).
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

- **Required**: No (defaults to `true`).
- **Applicable to**: `CUSTOM` query type only.
- **Description**:
  - When `true` (default): Automatically creates any missing inverted indexes,
    vector indexes, and search-alias views.
  - When `false`: Checks that required indexes and views exist; returns
    a clear error listing what is missing if they are not found.
- **Precedence**: A tool's own `auto_create_indexes` setting takes priority over
  the request-level value. Missing indexes and views are created automatically
  when neither is set.

{{< warning >}}
Because creation is the default, set `auto_create_indexes` to `false` on large
pre-existing collections where you want to control index creation yourself;
building indexes can be expensive in memory and compute.
{{< /warning >}}

### `custom_prompts`

Override default LLM prompts for this query.

- **Required**: No.
- **Description**: A dictionary mapping prompt keys to custom prompt strings.
  Only specified prompts are overridden; all others use defaults. See the
  [Custom Prompts reference](custom-prompts.md) for available keys and template
  variables.

### `model`

Override the chat model for a single query.

- **Required**: No.
- **Description**: The chat model to use for this query only. If omitted, the
  query uses the chat model the service is currently configured with, which may
  have been changed since the install. The model is returned in response
  metadata as `"model"` when `include_metadata` is `true`.
- **Example**: `"gpt-5.4-nano"`

{{< info >}}
This parameter overrides the chat model only; the embedding model is never
affected. To change the embedding model, or to change the chat model for every
query, see
[Update the model configuration at runtime](llm-configuration.md#update-the-model-configuration-at-runtime).
{{< /info >}}

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
  - This parameter controls displaying citations only. The actual citation URL metadata is set via [`citable_url`](../importer/reference/parameters.md#file-source-parameters) at import time.
- **Supported query types**: `LOCAL` (with or without `use_llm_planner`),
  `UNIFIED`, and `CUSTOM` (both standard and Deep Search). A Deep Search query
  runs several retrieval steps, and the citations they collect are combined into
  a single numbered list for the final answer, with each source cited once.
- **Not supported**: `GLOBAL` queries; citations are always disabled for Global
  Search regardless of this flag.

{{< info >}}
For `CUSTOM` queries, a tool's own `show_citations: false` configuration can still suppress citations from that tool's results, even when the request-level flag is `true`.
{{< /info >}}

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
  - When `false` (default): Skips cache entirely; no check, no write.
- **Supported query types**: All query types (`GLOBAL`, `LOCAL`, `UNIFIED`, `CUSTOM`).

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

All queries return a response with `result`, `metadata`, `runId`, and
`errorCode` fields.

### Standard Response

```json
{
  "result": "Your answer text...",
  "metadata": "",
  "runId": "a1b2c3d4-...",
  "errorCode": ""
}
```

- `result`: The generated answer text.
- `metadata`: JSON-encoded metadata string, populated when `include_metadata`
  is `true`.
- `runId`: Identifier of the stored query run.
- `errorCode`: Empty on success; a machine-readable code on failure.

{{< warning >}}
Inspect `errorCode` instead of treating any non-empty `result` as success.
{{< /warning >}}

For the meaning of every code, see
[Error handling](error-handling.md#query-error-codes).

### Response with Metadata

When `include_metadata` is `true`, the `metadata` field contains JSON with 
different structures depending on the query type.

**Common fields (all query types):**

- `model`: The chat model that generated the response, whether it came from the
  configuration of the service or from the request-level [`model`](#model)
  override. The embedding model is not included.
- `mode`, `query_type`: Included when the request used
  [`mode`](#mode). `mode` is echoed as `"INSTANT"` or `"DEEP_SEARCH"`.

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

**For partition routing:**

When partition selection is active, metadata includes a `partition_routing`
object:

- `mode`: One of `manual`, `auto`, `auto_no_match`, `auto_failed`,
  `tool_config`, `tool_config_disabled`, or `not_requested`
- `partition_ids`: The partition IDs used for retrieval
- `partition_filter_applied`: Whether a partition filter was applied
- `max_partition_limit`: The effective limit for automatic selection

## API Reference

For detailed API documentation, see the
[GraphRAG Retrievers API Reference](https://apiref.arango.ai/#graphrag_retrievers).
