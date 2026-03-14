---
title: RAG Strategizer
menuTitle: RAG Strategizer
description: >-
  Analyze document clusters and get intelligent RAG strategy recommendations
weight: 50
---

## Overview

The RAG Strategizer analyzes document clusters created during corpus builds and recommends optimal RAG strategies for each domain. It uses lexical metrics (word density and average word length) to determine whether FullGraphRAG or VectorRAG is best suited for each cluster.

**Key features:**
- Automatic strategy selection per domain
- Configurable FullGraphRAG percentage preference
- Parallel cluster analysis
- Entity type extraction per domain
- Strategy profiles ready for orchestration

{{< tip >}}
Run the RAG Strategizer **after** completing a corpus build. It analyzes the clusters created during the build process.
{{< /tip >}}

## Analyze Clusters and Recommend Strategies

Trigger RAG strategy analysis on your corpus clusters.

{{< endpoint "POST" "/v1/rag-strategizer/analyze" >}}

### Request Parameters

#### `full_graph_rag_strategy` (optional)

Instruction for FullGraphRAG percentage allocation. Valid values:

- `"very low"`: ~0% FullGraphRAG (most clusters use VectorRAG)
- `"low"`: ~25% FullGraphRAG
- `"high"`: ~75% FullGraphRAG
- `"very high"`: ~100% FullGraphRAG (default)
- `"X%"`: Custom percentage (e.g., `"50%"`)

#### `max_parallel_clusters` (optional)

Maximum number of clusters to analyze in parallel using LLM calls. Default is `5`. Set to `0` to use the default.

Higher values speed up analysis but increase concurrent LLM usage.

### Request Examples

**Basic analysis with defaults:**

```bash
curl -X POST https://<your-platform-url>/v1/rag-strategizer/analyze \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Prefer VectorRAG for most clusters:**

```bash
curl -X POST https://<your-platform-url>/v1/rag-strategizer/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "full_graph_rag_strategy": "low"
  }'
```

**Custom FullGraphRAG percentage:**

```bash
curl -X POST https://<your-platform-url>/v1/rag-strategizer/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "full_graph_rag_strategy": "60%",
    "max_parallel_clusters": 10
  }'
```

### Response

```json
{
  "success": true,
  "message": "RAG strategizer analysis completed successfully"
}
```

**Response Fields:**

- `success` (boolean): Whether the operation started successfully
- `message` (string): Success or error message

Results are stored in the `rags` collection and can be retrieved using the [strategy retrieval endpoint](#retrieve-rag-strategies).

## Retrieve RAG Strategies

Get all RAG strategies that have been created by the strategizer.

{{< endpoint "GET" "/v1/rag-strategizer/strategy" >}}

### Request Example

```bash
curl -X GET https://<your-platform-url>/v1/rag-strategizer/strategy
```

### Response

```json
{
  "strategies": [
    {
      "cluster_id": "cluster_0",
      "strategy_type": "FullGraphRAG",
      "rag_partition_id": "0_a",
      "entity_types": ["person", "organization", "location", "technology"],
      "document_count": 45,
      "parameters": {
        "rag_mode": "full_graphrag",
        "batch_size": "1000",
        "enable_chunk_embeddings": "false"
      }
    },
    {
      "cluster_id": "cluster_1",
      "strategy_type": "VectorRAG",
      "rag_partition_id": "1_b",
      "entity_types": [],
      "document_count": 32,
      "parameters": {
        "rag_mode": "vector_rag",
        "batch_size": "1000",
        "enable_chunk_embeddings": "true"
      }
    }
  ],
  "total_strategies": 2,
  "strategy_type_counts": {
    "FullGraphRAG": 1,
    "VectorRAG": 1
  }
}
```

### Response Fields

#### Top-level fields

- `strategies` (array): List of all RAG strategies
- `total_strategies` (integer): Total number of strategies
- `strategy_type_counts` (map): Count of strategies by type

#### Strategy object fields

- `cluster_id` (string): Cluster identifier (e.g., `"cluster_0"`)
- `strategy_type` (string): Strategy type (`"VectorRAG"` or `"FullGraphRAG"`)
- `rag_partition_id` (string): Partition ID for this domain (e.g., `"0_a"`, `"1_b"`)
- `entity_types` (array): Extracted entity types for this domain
- `document_count` (integer): Number of documents in this cluster
- `parameters` (map): Extensible strategy-specific parameters (e.g., `rag_mode`, `batch_size`)

## Understanding RAG Strategies

### FullGraphRAG

Recommended for clusters with:
- Complex relationships between concepts
- Dense, technical content requiring entity extraction
- Multi-hop reasoning requirements

**Characteristics:**
- Extracts entities, relationships, and communities
- Builds complete knowledge graphs
- Slower processing but richer structure
- Better for complex queries

### VectorRAG

Recommended for clusters with:
- Simple, straightforward content
- FAQ-style documents
- Fast retrieval requirements

**Characteristics:**
- Uses only document chunks and embeddings
- No entity extraction
- Faster processing
- Better for simple semantic search

## Using Strategy Results

### With Orchestration

The `rag_partition_id` from each strategy should be used when orchestrating the importer pipeline:

```bash
# Get strategies
STRATEGIES=$(curl -s -X GET https://<your-platform-url>/v1/rag-strategizer/strategy)

# Extract partition IDs (example with jq)
PARTITION_IDS=$(echo "$STRATEGIES" | jq -r '.strategies[].rag_partition_id')

# Orchestrate specific partitions
curl -X POST https://<your-platform-url>/v1/orchestrate \
  -H "Content-Type: application/json" \
  -d '{
    "replicas": 3,
    "partition_ids": ["0_a", "1_b"]
  }'
```

### With Manual Import

Use strategy parameters when calling the Importer service:

```bash
# For a FullGraphRAG partition
curl -X POST https://<importer-url>/v1/import-multiple \
  -H "Content-Type: application/json" \
  -d '{
    "partition_id": "0_a",
    "rag_mode": "full_graphrag",
    "entity_types": ["person", "organization", "location", "technology"],
    "files": [...]
  }'

# For a VectorRAG partition
curl -X POST https://<importer-url>/v1/import-multiple \
  -H "Content-Type: application/json" \
  -d '{
    "partition_id": "1_b",
    "rag_mode": "vector_rag",
    "files": [...]
  }'
```

## Strategy Selection Process

The RAG Strategizer analyzes each cluster using:

1. **Lexical Metrics**: Word density, average word length
2. **Content Complexity**: Document structure and relationships
3. **User Preference**: The `full_graph_rag_strategy` setting
4. **Cluster Characteristics**: Document count, similarity patterns

Based on these factors, it assigns each cluster either FullGraphRAG or VectorRAG.

{{< tip >}}
The `rag_partition_id` follows the format `{cluster_index}_{a|b}` where:
- `cluster_index`: The semantic cluster number
- `a`: FullGraphRAG strategy
- `b`: VectorRAG strategy
{{< /tip >}}

## Next Steps

- **[Orchestrate Pipeline](orchestration.md)**: Automatically build knowledge graphs for all strategies
- **[Import Files](../importer/importing-files.md)**: Manually import with strategy parameters
