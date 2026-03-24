---
title: Embedding Operations
menuTitle: Embeddings
description: >-
  Generate embeddings for specific fields in ArangoDB collections
weight: 40
draft: true
---

{{< info >}}
This is an advanced feature for generating embeddings on custom collection fields. Most users won't need this - corpus builds automatically handle embedding generation.
{{< /info >}}

## Overview

The embed field endpoint generates embeddings for documents in a collection that don't yet have the specified embedding field. This is useful for:

- Adding embeddings to existing collections
- Creating embeddings for custom document fields
- Incremental embedding generation (only processes documents without embeddings)
- Creating vector indexes and ArangoSearch views for custom fields

The operation is incremental - repeated calls will only process documents that don't have embeddings yet.

## Endpoint

{{< endpoint "POST" "/v1/embed-field-in-collection" >}}

## Request Parameters

### `collection` (required)

The name of the ArangoDB collection to process (e.g., `"documents"`).

### `field` (required)

The document attribute to generate embeddings for (e.g., `"content"`, `"title"`, `"summary"`).

Embeddings are stored in a field named `<field>_embedding`. For example:
- Field `"content"` → Embeddings stored in `"content_embedding"`
- Field `"title"` → Embeddings stored in `"title_embedding"`

## Request Example

**Generate embeddings for content field:**

```bash
curl -X POST https://<your-platform-url>/v1/embed-field-in-collection \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "documents",
    "field": "content"
  }'
```

**Generate embeddings for title field:**

```bash
curl -X POST https://<your-platform-url>/v1/embed-field-in-collection \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "documents",
    "field": "title"
  }'
```

## Response

### Success Response

```json
{
  "status": "completed",
  "message": "Successfully generated embeddings for content field",
  "collection": "documents",
  "field": "content",
  "embedding_field": "content_embedding",
  "documents_updated": 150,
  "documents_skipped": 50
}
```

### Response Fields

- `status` (string): Operation status (e.g., `"completed"`)
- `message` (string): Human-readable message describing the result
- `collection` (string): Collection name that was processed
- `field` (string): Source field name
- `embedding_field` (string): Name of the field where embeddings are stored
- `documents_updated` (integer): Number of documents that received new embeddings
- `documents_skipped` (integer): Number of documents that already had embeddings (skipped)

## Behavior

### Incremental Processing

The endpoint only processes documents that don't have the embedding field:

```bash
# First call: Process all 200 documents
# Response: "documents_updated": 200, "documents_skipped": 0

# Second call: No documents need processing
# Response: "documents_updated": 0, "documents_skipped": 200

# After adding 50 new documents, third call:
# Response: "documents_updated": 50, "documents_skipped": 200
```

### Vector Index Creation

The operation automatically:
1. Generates embeddings for the specified field
2. Stores embeddings in `<field>_embedding`
3. Creates a vector index on the embedding field
4. Creates an ArangoSearch view for the field

This enables immediate vector similarity search on the embedded field.

## Use Cases

### Custom Field Embeddings

Generate embeddings for specific document attributes:

```bash
# Embed document titles
curl -X POST https://<your-platform-url>/v1/embed-field-in-collection \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "articles",
    "field": "title"
  }'

# Embed document summaries
curl -X POST https://<your-platform-url>/v1/embed-field-in-collection \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "articles",
    "field": "summary"
  }'
```

### Multi-Field Embeddings

Create embeddings for multiple fields to enable different search strategies:

```bash
# Content-based search
curl -X POST https://<your-platform-url>/v1/embed-field-in-collection \
  -d '{"collection": "docs", "field": "content"}'

# Title-based search
curl -X POST https://<your-platform-url>/v1/embed-field-in-collection \
  -d '{"collection": "docs", "field": "title"}'

# Abstract-based search
curl -X POST https://<your-platform-url>/v1/embed-field-in-collection \
  -d '{"collection": "docs", "field": "abstract"}'
```

### Adding Embeddings to Existing Data

Process collections that were created without embeddings:

```bash
curl -X POST https://<your-platform-url>/v1/embed-field-in-collection \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "legacy_documents",
    "field": "text"
  }'
```

{{< tip >}}
This operation is safe to run multiple times. Only documents without embeddings will be processed, making it efficient for incremental updates.
{{< /tip >}}

## Limitations

- Processes a single collection and single field per request
- The specified field must exist in the documents
- The field must contain text content suitable for embedding generation
- Vector index configuration uses default settings (cosine similarity)

## Next Steps

- **[Corpus Build](corpus-build.md)**: Learn about automatic embedding generation during builds
