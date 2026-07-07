---
title: Retriever Service
menuTitle: Retriever
description: >-
  The Retriever service enables intelligent search and retrieval from knowledge
  graphs created by the Importer service
weight: 8
---

## Overview

The Retriever service provides intelligent search and retrieval from knowledge
graphs stored in ArangoDB. It offers multiple search methods optimized for
different query types, from fast instant answers to thorough multi-step research,
plus a Custom Retriever for domain-specific search on any collection.

## When to use the Retriever

The Retriever serves two usage patterns depending on how your knowledge graph
was built.

### With GraphRAG (standalone)

When using the [Importer](../importer/) directly to build a single knowledge
graph, you query it with the Retriever. You can use the Retriever through:

- The [Contextual Data Platform web interface](../graphrag/web-interface.md),
  which provides Instant Search and Deep Search.
- The [query API](executing-queries.md), which gives access to all search
  methods and parameters.

### With AutoGraph (partitioned)

When [AutoGraph](../autograph/) manages your document pipeline, it builds
partitioned knowledge graphs with domain-aware RAG strategies. The Retriever
queries across these partitions using `partition_ids` to target specific
domains. AutoGraph's two-stage retrieval pattern first identifies relevant
partitions, then performs deep search within them.

For details on how partitions are created and mapped, see the
[Importer AutoGraph Integration](../importer/autograph-integration.md) page.

## Search methods

| Method | Best for | Latency |
|--------|----------|---------|
| [**Unified (Instant Search)**](search-methods/unified-search.md) | Fast answers with document references | Low |
| [**Deep Search**](search-methods/deep-search.md) | Thorough, multi-step research | Higher |
| [**Global Search**](search-methods/global-search.md) | Themes, patterns, high-level insights | Medium |
| [**Local Search**](search-methods/local-search.md) | Specific entities and relationships | Low |
| [**Custom Retriever**](search-methods/custom-retriever.md) | Domain-specific search on any collection | Varies |

See [Search Methods](search-methods/_index.md) for a full comparison and
guidance on choosing the right method.

## Prerequisites

Before using the Retriever service, you need:

1. **A GraphRAG project** with imported data. If you are using the Importer
   standalone, follow the [Importer Setup](../importer/setup.md).
   If you are using AutoGraph, follow the
   [AutoGraph Setup](../autograph/setup.md).

2. **An LLM provider** configured for the Retriever. See
   [LLM Configuration](llm-configuration.md) to set up Triton Inference Server
   or any OpenAI-compatible API.

## Installation

To install and start the Retriever service, use the following endpoint:

{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/_platform/acp/v1/graphragretriever" >}}

For detailed instructions on installing, monitoring, and managing services, see
[The Arango Control Plane (ACP) service](../../platform-suite/control-plane-acp.md).

## Getting Started

1. [**Configure your LLM provider**](llm-configuration.md):
   Choose and configure either Triton or OpenAI-compatible APIs.
2. [**Understand search methods**](search-methods/_index.md):
   Learn about Instant, Deep, Global, Local, and Custom search.
3. [**Execute queries**](executing-queries.md):
   Start querying your knowledge graph.

**Additional resources:**

- [**Custom Prompts**](custom-prompts.md): Customize LLM prompts for domain-specific behavior.
- [**Verify and Monitor**](verify-and-monitor.md): Check service health and query status.
- [**Parameter Reference**](parameters.md): Complete list of query parameters.

## API Reference

For detailed API documentation, see the
[GraphRAG Retrievers API Reference](https://apiref.arango.ai/#graphrag_retrievers).
