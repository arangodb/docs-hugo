---
title: Search Methods
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

| Method | `query_type` | Best for | Latency |
|--------|-----------|----------|---------|
| [**Global Search**](global-search.md) | `1` (GLOBAL) | Themes, patterns, high-level insights | Medium |
| [**Local Search**](local-search.md) | `2` (LOCAL) | Specific entities and relationships | Low |
| [**Deep Search**](deep-search.md) | `2` (LOCAL) + `use_llm_planner: true` | Detailed, multi-step research | Higher |
| [**Unified (Instant Search)**](unified-search.md) | `3` (UNIFIED) | Fast answers with document references | Low |
| [**Custom Retriever**](custom-retriever.md) | `4` (CUSTOM) | Domain-specific search with custom logic | Varies |

## Choosing a search method

- **Need high-level summaries across all documents?** Use [Global Search](global-search.md).
- **Need details about a specific entity?** Use [Local Search](local-search.md).
- **Need thorough, accurate analysis?** Use [Deep Search](deep-search.md).
- **Need a quick answer with references?** Start with [Unified (Instant Search)](unified-search.md).
- **Need domain-specific search on custom collections?** Use [Custom Retriever](custom-retriever.md).

## Next Steps

- **[Execute queries](../executing-queries.md)**: Learn how to call the search endpoints.
- **[Parameters](../parameters.md)**: Customize search behavior.
