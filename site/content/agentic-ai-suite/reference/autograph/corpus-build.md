---
title: Corpus Build Operations
menuTitle: Corpus Build
description: >-
  Create and monitor corpus builds for document analysis and clustering
weight: 30
---

## Overview

Corpus builds analyze your imported documents to create semantic clusters and generate embeddings. 

This process includes:
- Reading and processing uploaded files
- Generating document embeddings
- Computing document similarities
- Creating semantic clusters
- Building vector indexes
- Organizing documents for efficient retrieval

Corpus builds run in the background and can take significant time for large document collections. Use the status endpoint to monitor progress.

## Create Corpus Build

Trigger a new corpus build to analyze and cluster your documents.

{{< endpoint "POST" "/v1/corpus/builds" >}}

### Request Parameters

#### `embedding_strategy` (required)

The embedding strategy to use. Valid values:
- `"first_chunk"`: Generate embeddings from the first chunk of each document

#### `strategy` (optional)

Build strategy configuration object with these fields:

- `top_k` (optional, integer): Number of similar documents to consider for each document
- `cluster_threshold` (optional, integer): Clustering levels
  - `1`: Single-level clustering
  - `2`: Two-level clustering (default)
- `custom_params` (optional, map): Additional custom parameters as key-value pairs

#### `file_ids` (optional)

Array of file IDs to process. If provided, only these files will be included in the build.

#### `modules` (optional)

Array of module names to build sequentially. If empty, AutoGraph discovers modules from document metadata.

#### `incremental` (optional, boolean)

If `true`, preserves existing collections and only adds/updates specified modules. If `false` (default), performs a complete rebuild.

### Request Example

**Basic corpus build:**

```bash
curl -X POST https://<your-platform-url>/v1/corpus/builds \
  -H "Content-Type: application/json" \
  -d '{
    "embedding_strategy": "first_chunk"
  }'
```

**Build with strategy configuration:**

```bash
curl -X POST https://<your-platform-url>/v1/corpus/builds \
  -H "Content-Type: application/json" \
  -d '{
    "embedding_strategy": "first_chunk",
    "strategy": {
      "top_k": 20,
      "cluster_threshold": 2,
      "custom_params": {
        "param1": "value1",
        "param2": "value2"
      }
    }
  }'
```

**Build specific modules:**

```bash
curl -X POST https://<your-platform-url>/v1/corpus/builds \
  -H "Content-Type: application/json" \
  -d '{
    "embedding_strategy": "first_chunk",
    "modules": ["legal", "technical"]
  }'
```

**Incremental build:**

```bash
curl -X POST https://<your-platform-url>/v1/corpus/builds \
  -H "Content-Type: application/json" \
  -d '{
    "embedding_strategy": "first_chunk",
    "modules": ["new_module"],
    "incremental": true
  }'
```

### Response

```json
{
  "corpus_build_id": "cb_01H8X9Y7Z8ABCDEF123456"
}
```

**Response Fields:**

- `corpus_build_id` (string): Generated corpus build ID (e.g., `"cb_01H..."`)

The `corpus_build_id` can be used to monitor the build status.

## Monitoring Build Status

Check the current status of a corpus build operation.

{{< endpoint "GET" "/v1/corpus/builds/{corpus_build_id}" >}}

### Request Parameters

- `corpus_build_id` (required): The corpus build ID returned from the create endpoint

### Request Example

```bash
curl -X GET https://<your-platform-url>/v1/corpus/builds/cb_01H8X9Y7Z8ABCDEF123456
```

### Response

```json
{
  "corpus_build_id": "cb_01H8X9Y7Z8ABCDEF123456",
  "status": "running",
  "message": "Processing similarity computation",
  "progress": 65,
  "error": "",
  "started_at": 1710432000.0,
  "completed_at": 0.0
}
```

### Response Fields

- `corpus_build_id` (string): The corpus build ID
- `status` (string): Current status
  - `"pending"`: Build queued but not started
  - `"running"`: Build in progress
  - `"completed"`: Build finished successfully
  - `"failed"`: Build encountered an error
- `message` (string): Human-readable status message describing current operation
- `progress` (integer): Progress percentage (0-100)
- `error` (string): Error message if status is `"failed"`
- `started_at` (float): Unix timestamp when build started
- `completed_at` (float): Unix timestamp when build completed (0 if not finished)

## Build Process Stages

The corpus build process includes these stages:

1. **File Reading**: Loading documents from the corpus collection
2. **Embedding Generation**: Creating vector embeddings for each document
3. **Document Insertion**: Storing processed documents in ArangoDB
4. **Vector Indexing**: Building vector search indexes
5. **Similarity Finding**: Computing pairwise document similarities
6. **Clustering**: Grouping similar documents into semantic clusters
7. **Graph Creation**: Building cluster relationships and hierarchies

Each stage is reflected in the `message` field of the status response.

## Incremental Builds

Incremental builds allow you to add new modules or update existing ones without rebuilding the entire corpus.

**When to use incremental builds:**
- Adding new document modules to an existing corpus
- Updating specific modules while preserving others
- Reducing build time for large corpora

**Example workflow:**

```bash
# Initial build with modules A and B
curl -X POST https://<your-platform-url>/v1/corpus/builds \
  -H "Content-Type: application/json" \
  -d '{
    "embedding_strategy": "first_chunk",
    "modules": ["module_a", "module_b"]
  }'

# Later, add module C without rebuilding A and B
curl -X POST https://<your-platform-url>/v1/corpus/builds \
  -H "Content-Type: application/json" \
  -d '{
    "embedding_strategy": "first_chunk",
    "modules": ["module_c"],
    "incremental": true
  }'
```

{{< warning >}}
Incremental builds preserve existing collections. If you need to completely rebuild everything from scratch, use `incremental: false` (the default).
{{< /warning >}}

## Next Steps

- **[Run RAG Strategizer](rag-strategizer.md)**: Analyze clusters and get RAG strategy recommendations
- **[Orchestrate Pipeline](orchestration.md)**: Automatically build knowledge graphs