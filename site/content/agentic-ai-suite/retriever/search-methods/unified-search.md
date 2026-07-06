---
title: Unified Search (Instant Search)
menuTitle: Unified Search
description: >-
  Fast unified retrieval combining chunk and entity search for quick answers
weight: 30
---

## Overview

Unified Search combines chunk and entity search to provide comprehensive
results with very short latency. It performs both semantic chunk search and
entity relationship analysis, then intelligently selects the most relevant
documents for LLM processing, producing a streamed natural-language response
with clickable references to the relevant documents.

{{< diagram src="/images/retriever-instant-search-architecture.svg" 
           alt="Instant Search Architecture showing parallel retrieval flow" >}}

{{< info >}}
Unified Search is also available as **Instant Search** via the
[web interface](../../graphrag/web-interface.md).
{{< /info >}}

## Configuration

```json
{
  "query_type": 3
}
```

## How it works

1. **Chunk Search**: Performs semantic search on text chunks using vector embeddings.
2. **Entity Search**: Identifies relevant entities and their relationships.
3. **Document Selection**: Intelligently combines and ranks results from both searches.
4. **LLM Processing**: Generates a response using the most relevant documents.

## Best use cases

- "What are the main themes and key entities in the dataset?"
- "Provide a comprehensive analysis of [topic]"
- "Summarize the key findings with specific examples"

## Next Steps

- **[Execute queries](../executing-queries.md)**: Learn how to call the search endpoints.
- **[Parameters](../parameters.md)**: Customize search behavior.
