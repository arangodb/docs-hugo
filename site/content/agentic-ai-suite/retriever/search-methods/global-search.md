---
title: Global Search
menuTitle: Global Search
description: >-
  Community-based analysis for themes, patterns, and high-level insights
weight: 10
---

## Overview

Global Search is designed for queries that require understanding and aggregation
of information across your entire document set. It is particularly effective for
questions about overall themes, patterns, or high-level insights in your data.

{{< diagram src="/images/retriever-global-search-architecture.png" 
           alt="Global Search Architecture showing Map-Reduce processing" >}}

## Configuration

```json
{
  "query_type": 1,
  "level": 2
}
```

The `level` parameter controls the community hierarchy level used for analysis.
Level `1` uses top-level communities; level `2` (default) uses second-level
communities for more granular results.

## How it works

1. **Community-Based Analysis**: Uses pre-generated community reports from your
   knowledge graph to understand the overall structure and themes of your data.
2. **Map-Reduce Processing**:
   - **Map Stage**: Processes community reports in parallel, generating
     intermediate responses with rated points.
   - **Reduce Stage**: Aggregates the most important points to create a
     comprehensive final response.

## Best use cases

- "What are the main themes in the dataset?"
- "Summarize the key findings across all documents"
- "What are the most important concepts discussed?"

## Next Steps

- **[Execute queries](../executing-queries.md)**: Learn how to call the search endpoints.
- **[Parameters](../parameters.md)**: Customize search behavior.
