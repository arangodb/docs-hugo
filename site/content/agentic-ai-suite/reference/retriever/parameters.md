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

### `use_llm_planner`

Whether to use the LLM planner for intelligent query orchestration.

- **Required**: No (defaults to `true` for `LOCAL` queries).
- **Applicable to**: `LOCAL` query types only.
- **Description**: 
  - When `true` (default): Enables Deep Search with LLM-orchestrated retrieval.
  - When `false`: Uses standard Local Search without orchestration.

### `level`

Community hierarchy level for Global Search analysis.

- **Required**: No (defaults to `2`).
- **Applicable to**: `GLOBAL` query type only.
- **Possible values**:
  - `1`: Top-level communities (broader themes).
  - `2`: Second-level communities (default).
  - Higher values for deeper hierarchy levels (if available in your knowledge graph).

## Response Parameters

### `include_metadata`

Whether to include metadata in the response.

- **Required**: No (defaults to `false`).
- **Description**: When enabled, responses include additional metadata.

### `show_citations`

Whether to show inline citations in the response.

- **Required**: No (defaults to `true`).
- **Description**: When enabled, citations are formatted as `[[X](URL)]` or `[X]` 
  in the response. Works with the `citable_url` field set during import.

{{< warning >}}
For deep search queries (`use_llm_planner=true`), citations are always disabled 
regardless of this setting.
{{< /warning >}}

### `response_instruction`

Custom instructions for response generation style.

- **Required**: No
- **Description**: Provides custom instructions to the LLM for how to format or 
  style the response.
- **Examples:**
  - "Short answer"
  - "Multiple paragraphs"
  - "Concise answer in 2-3 sentences"
  - "Provide detailed analysis with examples"

If not specified, the response types are using the following default instructions based on the query type:

| Query Type | Default Instruction |
|------------|---------------------|
| Local Search | "Concise answer in fewer than 25 words if possible; multiple paragraphs only when context is required" |
| Unified/Instant Search | "Answer in 60 words ideally, 100 words maximum. Be direct and concise" |
| Global Search | "Provide a comprehensive answer with detailed explanations and context based on the community data" |

## Caching Parameters

### `use_cache`

Whether to use caching for this query.

- **Required**: No (defaults to `false`)
- **Description**: When enabled, checks cache for hits and saves responses to cache. When disabled, skips cache entirely (no check, no write).

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

## API Reference

For detailed API documentation, see the
[GraphRAG Retriever API Reference](https://arangoml.github.io/platform-dss-api/graphrag_retrievers/proto/index.html).
