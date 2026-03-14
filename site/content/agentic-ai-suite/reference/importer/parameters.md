---
title: Import Parameter Reference
menuTitle: Parameters
description: >-
  Complete reference for all Importer service parameters
weight: 60
---

{{< info >}}
This page provides detailed parameter definitions. For import workflows and examples, see the [Import Files guide](importing-files.md).
{{< /info >}}

## Overview

The Importer service supports a wide range of parameters to customize how your documents 
are processed and imported. Parameters are organized by functionality to help you 
find what you need.

## File Source Parameters

Parameters differ between single file and multi-file import:

### Single File Import

- `file_content` (required, or use `file_url`): Direct file content as base64-encoded string.
- `file_url` (required, or use `file_content`): URL to download the file from.
- `file_name` (required): Original filename with extension.

{{< tip >}}
For single file import, you can use either `file_content` or `file_url`, but not both in the same request.
{{< /tip >}}

**Example with direct file content:**

```json
{
  "file_content": "base64_encoded_content_here",
  "file_name": "document.txt"
}
```

**Example with URL download:**

```json
{
  "file_url": "https://example.com/documents/report.pdf",
  "file_name": "report.pdf"
}
```

### Multi-File Import

Each file in the `files` array requires:

- `name` (required): Original filename with extension.
- `content` (required): File content as base64-encoded bytes.
- `citable_url` (optional): URL to be cited in inline citations. This URL is stored in
  the document metadata and used at retrieval. When querying your knowledge graph, citations
  can be optionally included in the response. 

**Example:**

```json
{
  "files": [
    {
      "name": "document1.txt",
      "content": "base64_encoded_content_1",
      "citable_url": "https://example.com/docs/document1"
    },
    {
      "name": "document2.md",
      "content": "base64_encoded_content_2",
      "citable_url": "https://example.com/docs/document2"
    }
  ]
}
```

## RAG Mode Configuration

The Importer supports two operational modes that determine how documents are processed and what knowledge graph elements are created:

- `rag_mode`: Specifies the retrieval mode. Valid values are:
  - `"full_graphrag"` (default): Full knowledge graph extraction with entities, relationships, and communities
  - `"vector_rag"`: Simple vector-based retrieval using only chunk embeddings (skips entity extraction)

**Example:**

```json
{
  "rag_mode": "full_graphrag"
}
```

{{< info >}}
When using `"vector_rag"` mode, chunk embeddings are automatically enabled regardless of the `enable_chunk_embeddings` setting. Entity extraction, relationships, and community detection are skipped for faster processing. Use this mode when you only need semantic search over document chunks without the full knowledge graph structure.
{{< /info >}}

## Chunking Parameters

These parameters control how documents are split into smaller chunks for processing.

- `chunk_token_size`: Maximum tokens per chunk. The default value is `1200`.
- `chunk_overlap_token_size`: Number of overlapping tokens between consecutive
  chunks. The default value is `100`.
- `chunk_min_token_size`: Minimum tokens per chunk (optional).
- `chunk_custom_separators`: Custom separators for chunking (optional, e.g., `["\n\n", "\n", " "]`).
- `preserve_chunk_separator`: Whether to preserve separator characters in chunks
  (default: `false`).
- `ignore_chunk_token_size`: If `true`, chunks are split only by separators without
  enforcing token size limits. When enabled, `chunk_token_size` and `chunk_overlap_token_size`
  are ignored (default: `false`).

**Example:**

```json
{
  "chunk_token_size": 1200,
  "chunk_overlap_token_size": 100,
  "chunk_min_token_size": 50,
  "chunk_custom_separators": ["\n\n", "\n", " "],
  "preserve_chunk_separator": false,
  "ignore_chunk_token_size": false
}
```

**Example with separator-only chunking:**

```json
{
  "chunk_custom_separators": ["\n## ", "\n\n", "\n"],
  "ignore_chunk_token_size": true,
  "preserve_chunk_separator": false
}
```

{{< tip >}}
Use `ignore_chunk_token_size: true` when you want pure separator-based chunking. This is useful for documents with clear structural boundaries (like markdown headers) where token-based limits might split content in undesirable ways.
{{< /tip >}}

## Entity and Relationship Extraction

These parameters define what entities and relationships to extract from your documents.

- `entity_types`: Entity types to extract from the document (e.g., `["person", "organization", "geo", "event"]`).
- `relationship_types`: Relationship types to extract (e.g., `["RELATED_TO", "PART_OF", "USES"]`).
- `enable_strict_types`: Enable strict filtering of entities and relationships from the specified types (default: `false`).
- `entity_extract_max_gleaning`: Maximum number of extraction iterations (default: `1`).

**Example:**

```json
{
  "entity_types": ["person", "organization", "location", "event", "technology"],
  "relationship_types": ["WORKS_FOR", "LOCATED_IN", "USES", "PARTICIPATES_IN"],
  "enable_strict_types": true,
  "entity_extract_max_gleaning": 3
}
```

{{< info >}}
Entity and relationship extraction is only performed in `"full_graphrag"` mode. When using `"vector_rag"` mode, these parameters are ignored.
{{< /info >}}

## Custom Prompts

You can customize the prompts used for entity extraction, relationship extraction, and community report generation. This is an advanced feature for domain-specific customization.

- `custom_prompts`: A dictionary mapping prompt names to custom prompt text. When provided, custom prompts override the default prompts. If empty or not provided, default prompts are used.

Available prompt keys:
- `"entity_extraction"`: Prompt for extracting entities from text chunks
- `"entity_relationship"`: Prompt for extracting relationships between entities
- `"community_report"`: Prompt for generating community summary reports

**Example:**

```json
{
  "custom_prompts": {
    "entity_extraction": "Extract technical entities including: software libraries, programming languages, APIs, and architectural components. For each entity provide: name, type, and a brief description.",
    "community_report": "Generate a technical summary focusing on: 1) Key technologies and their relationships, 2) Architectural patterns, 3) Integration points. Provide 5-7 key insights."
  }
}
```

{{< warning >}}
Custom prompts are an advanced feature. Poorly designed prompts may result in lower quality entity extraction or community reports. Use the default prompts unless you have specific domain requirements.
{{< /warning >}}

## Embedding Parameters

These parameters control which graph elements receive embedding vectors for semantic search.

- `enable_chunk_embeddings`: Whether to enable embeddings for text chunks (default: `false` for `"full_graphrag"` mode, always `true` for `"vector_rag"` mode).
- `enable_edge_embeddings`: Whether to enable embeddings for relationship edges (default: `false`).
- `enable_community_embeddings`: Whether to enable embeddings for community reports (default: `true`).

**Example:**

```json
{
  "enable_chunk_embeddings": true,
  "enable_edge_embeddings": false,
  "enable_community_embeddings": true
}
```

{{< info >}}
In `"vector_rag"` mode, chunk embeddings are always enabled regardless of the `enable_chunk_embeddings` setting. The `enable_edge_embeddings` and `enable_community_embeddings` parameters are ignored since edges and communities are not created in vector RAG mode.
{{< /info >}}

## Vector Index Configuration

These parameters configure the vector indexes used for semantic search and similarity queries. Vector indexes are automatically created on embedding fields when embeddings are enabled.

- `vector_index_metric`: Distance metric for vector similarity search. The supported values are `"cosine"` (default), `"l2"`, and `"innerProduct"`.
- `vector_index_n_lists`: Number of lists for approximate search (optional). If not set, it is automatically computed as `8 * sqrt(collection_size)`. This parameter is ignored when using HNSW.
- `vector_index_use_hnsw`: Whether to use HNSW (Hierarchical Navigable Small World) index instead of the default inverted index (default: `false`).

**Example:**

```json
{
  "vector_index_n_lists": 100,
  "vector_index_metric": "cosine",
  "vector_index_use_hnsw": false
}
```

{{< info >}}
Vector index parameters apply to all embedding fields in your knowledge graph (chunks, edges, entities, and communities). For more details on ArangoDB vector indexes, see the [Vector Search](../../../arangodb/3.12/indexes-and-search/indexing/working-with-indexes/vector-indexes.md) documentation.
{{< /info >}}

## Semantic Units and Image Processing

These parameters enable extraction of images and multimedia references. For detailed 
information, see the [Semantic Units guide](semantic-units.md).

- `enable_semantic_units`: Enable semantic unit processing (extracts web URLs and image references).
- `process_images`: Process storage URLs like base64/S3 links (requires `enable_semantic_units=true`).
- `store_image_data`: Store actual image data for storage URLs (requires `process_images=true`).

These parameters are hierarchical - each requires the previous one to be enabled.

**Example:**

```json
{
  "enable_semantic_units": true,
  "process_images": true,
  "store_image_data": false
}
```

## Graph Configuration

These parameters configure ArangoDB graph features for distributed deployments.

- `smart_graph_attribute`: SmartGraph attribute for graph sharding.
- `shard_count`: Number of shards for the collections.
- `is_disjoint`: Whether the graphs must be disjoint.
- `satellite_collections`: An array of collection names to create as Satellite Collections.

**Example:**

```json
{
  "smart_graph_attribute": "region",
  "shard_count": 3,
  "is_disjoint": false,
  "satellite_collections": ["entities"]
}
```

{{< info >}}
These parameters are primarily used for distributed ArangoDB deployments. 
Consult the [ArangoDB SmartGraphs documentation](../../../arangodb/3.12/graphs/smartgraphs/_index.md) 
for more details.
{{< /info >}}

## Storage and Organization

These parameters control data storage and organization.

- `store_in_s3`: Whether to store processed data in S3.
- `partition_id`: Partition identifier for grouping related documents together.
- `batch_size`: Number of documents, entities, and relationships to insert in a single batch. The default value is `1000`.

### `partition_id`

The `partition_id` parameter enables semantic sharding and horizontal scaling by grouping related documents into logical partitions.

**Key benefits:**
- **Semantic sharding**: Documents from the same domain/cluster are stored together
- **Horizontal scaling**: Different partitions can be distributed across multiple machines
- **Multi-tenancy**: Isolate documents for different projects, customers, or use cases
- **Efficient querying**: Retriever can target specific partitions for faster searches

**Usage patterns:**

1. **With Autograph**: Use Autograph-generated `rag_partition_id` values (format: `{cluster_index}_{a|b}`) to group documents by semantic similarity and RAG strategy
2. **Manual partitioning**: Define your own partition scheme based on domain, project, or tenant
3. **Auto-generated**: If not specified, a random partition ID is generated

**Example:**

```json
{
  "partition_id": "0_a",
  "files": [...]
}
```

{{< tip >}}
When using Autograph for corpus analysis, use the `rag_partition_id` values from the strategizer results as your `partition_id` values when calling the Importer. This ensures documents from the same semantic cluster are stored together, enabling efficient two-stage retrieval.
{{< /tip >}}

**Example:**

```json
{
  "store_in_s3": false,
  "partition_id": "cluster_0_a",
  "batch_size": 1000
}
```

## Examples

### Standard Full GraphRAG Example

This example uses full GraphRAG mode with entity extraction, chunking, and embeddings:

```json
{
  "file_content": "base64_encoded_content",
  "file_name": "document.txt",
  "rag_mode": "full_graphrag",
  "chunk_token_size": 1200,
  "chunk_overlap_token_size": 100,
  "entity_types": ["person", "organization", "location", "event"],
  "relationship_types": ["WORKS_FOR", "LOCATED_IN", "PARTICIPATES_IN"],
  "enable_chunk_embeddings": false,
  "enable_community_embeddings": true,
  "batch_size": 1000
}
```

### Vector RAG Example

This example uses vector RAG mode for fast, simple semantic search without entity extraction:

```json
{
  "file_content": "base64_encoded_content",
  "file_name": "document.txt",
  "rag_mode": "vector_rag",
  "chunk_token_size": 1200,
  "chunk_overlap_token_size": 100,
  "batch_size": 1000
}
```

### Advanced Full GraphRAG Example

For advanced use cases, this configuration demonstrates custom prompts, separator-based chunking, semantic units for image processing, strict type filtering, and optimized vector index settings:

```json
{
  "file_content": "base64_encoded_content",
  "file_name": "document.md",
  "rag_mode": "full_graphrag",
  "chunk_custom_separators": ["\n## ", "\n\n", "\n"],
  "ignore_chunk_token_size": true,
  "entity_types": ["person", "organization", "technology", "concept"],
  "relationship_types": ["USES", "RELATED_TO", "PART_OF"],
  "enable_strict_types": true,
  "entity_extract_max_gleaning": 2,
  "enable_chunk_embeddings": true,
  "enable_community_embeddings": true,
  "enable_semantic_units": true,
  "process_images": true,
  "vector_index_metric": "cosine",
  "vector_index_use_hnsw": true,
  "custom_prompts": {
    "entity_extraction": "Extract technical components, APIs, and architectural elements with their relationships.",
    "community_report": "Summarize key technical insights and system architecture patterns."
  },
  "batch_size": 500
}
```

## API Reference

For detailed API documentation, see the <!-- TODO: New API reference and link -->
[GraphRAG Importer API Reference](https://arangoml.github.io/platform-dss-api/graphrag_importer/proto/index.html).