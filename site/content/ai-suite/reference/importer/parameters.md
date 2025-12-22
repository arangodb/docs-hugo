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
- `citable_url` (required): URL to be cited in inline citations.

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

## Chunking Parameters

These parameters control how documents are split into smaller chunks for processing.

- `chunk_token_size`: Maximum tokens per chunk.
- `chunk_overlap_token_size`: Number of overlapping tokens between consecutive
  chunks.
- `chunk_min_token_size`: Minimum tokens per chunk.
- `chunk_custom_separators`: Custom separators for chunking (e.g., `["\n\n", "\n", " "]`).
- `preserve_chunk_separator`: Whether to preserve separator characters in chunks
  (default: `false`).

**Example:**

```json
{
  "chunk_token_size": 1200,
  "chunk_overlap_token_size": 100,
  "chunk_min_token_size": 50,
  "chunk_custom_separators": ["\n\n", "\n", " "],
  "preserve_chunk_separator": false
}
```

## Entity and Relationship Extraction

These parameters define what entities and relationships to extract from your documents.

- `entity_types`: Entity types to extract from the document (e.g., `["person", "organization", "geo", "event"]`).
- `relationship_types`: Relationship types to extract (e.g., `["RELATED_TO", "PART_OF", "USES"]`).
- `enable_strict_types`: Enable strict filtering of entities and relationships from the specified types.
- `entity_extract_max_gleaning`: Maximum number of extraction iterations.

**Example:**

```json
{
  "entity_types": ["person", "organization", "location", "event", "technology"],
  "relationship_types": ["WORKS_FOR", "LOCATED_IN", "USES", "PARTICIPATES_IN"],
  "enable_strict_types": true,
  "entity_extract_max_gleaning": 3
}
```

## Community Report Parameters

These parameters control how community reports are generated.

- `community_report_num_findings`: Number of key insights to generate (e.g., `"5-10"`).
- `community_report_instructions`: Custom instructions (e.g., "Focus on key relationships and insights").

**Example:**

```json
{
  "community_report_num_findings": "5-10",
  "community_report_instructions": "Focus on key relationships and technical insights"
}
```

## Embedding Parameters

These parameters control which graph elements receive embedding vectors for semantic search.

- `enable_chunk_embeddings`: Whether to enable embeddings for chunks.
- `enable_edge_embeddings`: Whether to enable embeddings for edges.

**Example:**

```json
{
  "enable_chunk_embeddings": true,
  "enable_edge_embeddings": false
}
```

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
Consult the [ArangoDB SmartGraphs documentation](../../../../arangodb/stable/graphs/smartgraphs/_index.md) 
for more details.
{{< /info >}}

## Storage and Organization

These parameters control data storage and organization.

- `store_in_s3`: Whether to store processed data in S3.
- `partition_id`: Partition identifier.
- `batch_size`: Number of documents, entities, and relationships to insert in a single batch.

**Example:**

```json
{
  "store_in_s3": false,
  "partition_id": "project_alpha",
  "batch_size": 1000
}
```

## Examples

This example includes entity extraction, chunking, and embeddings with standard parameters that work well across different document types.

```json
{
  "file_content": "base64_encoded_content",
  "file_name": "document.txt",
  "chunk_token_size": 1200,
  "chunk_overlap_token_size": 100,
  "entity_types": ["person", "organization", "location", "event"],
  "relationship_types": ["WORKS_FOR", "LOCATED_IN", "PARTICIPATES_IN"],
  "enable_chunk_embeddings": true,
  "batch_size": 1000
}
```

For advanced use cases, this configuration adds semantic units for image processing, custom markdown-specific chunk separators, strict type filtering, and extended community reports.

```json
{
  "file_content": "base64_encoded_content",
  "file_name": "document.md",
  "chunk_token_size": 1500,
  "chunk_overlap_token_size": 150,
  "chunk_custom_separators": ["\n## ", "\n\n", "\n", " "],
  "entity_types": ["person", "organization", "technology", "concept"],
  "relationship_types": ["USES", "RELATED_TO", "PART_OF"],
  "enable_strict_types": true,
  "enable_chunk_embeddings": true,
  "enable_semantic_units": true,
  "process_images": true,
  "community_report_num_findings": "7-12",
  "batch_size": 500
}
```

## API Reference

For detailed API documentation, see the
[GraphRAG Importer API Reference](https://arangoml.github.io/platform-dss-api/graphrag_importer/proto/index.html).