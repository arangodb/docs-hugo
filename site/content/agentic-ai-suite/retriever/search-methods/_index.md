---
title: Retriever Search Methods
menuTitle: Search Methods
description: >-
  Understand the different search methods available in the Retriever service
weight: 30
---
{{< info >}}
**Getting Started Path:** [Overview](../) → [Configure LLMs](../llm-configuration.md) → **Search Methods** → [Execute Queries](../executing-queries.md) → [Verify](../verify-and-monitor.md)
{{< /info >}}

## Overview

The Retriever service provides multiple search methods that leverage the
structured knowledge graph created by the Importer to deliver accurate and
contextually relevant responses to your natural language queries.

| Method | `query_type` | `mode` | Best for | Latency |
|--------|-----------|--------|----------|---------|
| [**Global Search**](global-search.md) | `1` (GLOBAL) | | Themes, patterns, high-level insights | Medium |
| [**Local Search**](local-search.md) | `2` (LOCAL) | | Specific entities and relationships | Low |
| [**Deep Search**](deep-search.md) | `2` (LOCAL) + `use_llm_planner: true` | `DEEP_SEARCH` | Detailed, multi-step research | Higher |
| [**Unified (Instant Search)**](unified-search.md) | `3` (UNIFIED) | `INSTANT` | Fast answers with document references | Low |
| [**Custom Retriever**](custom-retriever.md) | `4` (CUSTOM) | `DEEP_SEARCH` | Domain-specific search with custom logic | Varies |

{{< info >}}
Instead of choosing a method from the table, you can send
[`mode`](../parameters.md#mode) and let the service pick: `INSTANT` for a fast
answer, or `DEEP_SEARCH` for a thorough one. `DEEP_SEARCH` uses your Custom
Retriever tools if you have any, and Local Search if you do not. Set a
`query_type` yourself when you want a specific method, such as Global Search.
{{< /info >}}

## VectorRAG and FullGraphRAG partitions

A partition is ingested either as **VectorRAG** or as **FullGraphRAG**, and the
search methods you can run against it depend on that choice.
[AutoGraph](../../autograph/_index.md) assigns the strategy per cluster, and the
[Importer](../../importer/_index.md) receives it as `rag_mode`.

- **VectorRAG** stores documents and chunk embeddings. It does not build
  entities or communities.
- **FullGraphRAG** builds the full knowledge graph (entities, relations, and
  communities) in addition to chunks.

| Method | VectorRAG | FullGraphRAG |
|--------|-----------|--------------|
| [**Unified (Instant Search)**](unified-search.md) | Supported | Supported |
| [**Global Search**](global-search.md) | Not supported | Supported |
| [**Local Search**](local-search.md) | Not supported | Supported |
| [**Deep Search**](deep-search.md) (Local Search plus planner) | Not supported | Supported |
| [**Custom Retriever**](custom-retriever.md), including Custom Deep Search | Supported when the tools search chunks | Supported |

On a VectorRAG partition, use Instant Search. Global Search, Local Search, and
Deep Search need entities and communities, which VectorRAG does not build, so
they are not supported there. Deep Search does not fall back to chunk search
when entities are missing.

If you need Deep Search on a VectorRAG partition, use the
[Custom Retriever](custom-retriever.md) with tools that search chunks.

{{< info >}}
For how AutoGraph decides which clusters become VectorRAG and which become
FullGraphRAG, see the
[RAG strategizer](../../autograph/reference/rag-strategizer.md). For how the
resulting partitions are named and imported, see the
[Importer AutoGraph Integration](../../importer/autograph-integration.md).
{{< /info >}}

## Choosing a search method

- **Need high-level summaries across all documents?** Use [Global Search](global-search.md).
- **Need details about a specific entity?** Use [Local Search](local-search.md).
- **Need thorough, accurate analysis?** Use [Deep Search](deep-search.md).
- **Need a quick answer with references?** Start with [Unified (Instant Search)](unified-search.md).
- **Need domain-specific search on custom collections?** Use [Custom Retriever](custom-retriever.md).
- **Querying a VectorRAG partition?** Use [Unified (Instant Search)](unified-search.md), or a
  [Custom Retriever](custom-retriever.md) with chunk-searching tools if you need Deep Search.
  See [VectorRAG and FullGraphRAG partitions](#vectorrag-and-fullgraphrag-partitions).

## Next Steps

- **[Execute queries](../executing-queries.md)**: Learn how to call the search endpoints.
- **[Parameters](../parameters.md)**: Customize search behavior.
