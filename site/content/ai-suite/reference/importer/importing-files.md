---
title: Import Files to build your Knowledge Graph
menuTitle: Import Files
description: >-
  Learn how to import single or multiple documents to build your knowledge graph
weight: 30
---

{{< info >}}
**Getting Started Path:** [Overview](./) → [Configure LLMs](llm-configuration.md) → **Import Files** → [Semantic Units](semantic-units.md) (optional) → [Verify Results](verify-and-explore.md)
{{< /info >}}

## Before you start

Before you can import files, make sure you've completed these steps:

1. **Create a GraphRAG project**
   Learn how to [create and manage projects](../ai-orchestrator.md#projects).

2. **Install the Importer service**
   Deploy the service using the `/v1/graphragimporter` endpoint. See the [AI Orchestration Service](../ai-orchestrator.md) documentation for installation instructions.

3. **Configure your LLM provider**
   Choose between OpenAI-compatible APIs or Triton Inference Server. Follow the [LLM Configuration guide](llm-configuration.md) to set up your models.

Once you've completed these steps, you're ready to import documents to build 
your Knowledge Graph using either single file import or multi-file import.

## Single File Import

Use single file import when you want to process one document at a time. This is 
ideal for testing, small documents, or when you need immediate feedback without 
streaming progress updates.

```
POST /v1/import
```

### Basic example

```bash
# Base64 encode your document
base64_content=$(base64 -i your_document.txt)

# Send to the Importer service
curl -X POST https://<your-platform-url>/v1/import \
  -H "Content-Type: application/json" \
  -d '{
    "file_content": "'$base64_content'",
    "file_name": "your_document.txt"
  }'
```

### Example with common parameters

```bash
curl -X POST https://<your-platform-url>/v1/import \
  -H "Content-Type: application/json" \
  -d '{
    "file_content": "'$base64_content'",
    "file_name": "your_document.txt",
    "batch_size": 1000,
    "chunk_token_size": 1200,
    "chunk_overlap_token_size": 100,
    "entity_types": ["person", "organization", "location", "event"],
    "relationship_types": ["WORKS_FOR", "LOCATED_IN", "PARTICIPATES_IN"],
    "enable_chunk_embeddings": false,
    "enable_edge_embeddings": false,
    "enable_community_embeddings": true
  }'
```

Replace `<your-platform-url>` with your Arango Data Platform URL.

The service will:
- Process the document using the configured LLM model.
- Generate embeddings using the embedding model.
- Build a knowledge graph.
- Import the graph into your ArangoDB database.

For detailed information about all available parameters, see the [Import Parameters Reference](parameters.md).

## Multi-File Import

Use multi-file import when you need to process multiple documents into a single 
Knowledge Graph. This API provides streaming progress updates, making it 
ideal for batch processing and long-running imports where you need to track progress.

```
POST /v1/import-multiple
```

### Basic example

```bash
# Create JSON payload with multiple files
curl -X POST https://<your-platform-url>/v1/import-multiple \
  -H "Content-Type: application/json" \
  -d '{
    "files": [
      {
        "name": "document1.md",
        "content": "'$(base64 -i document1.md)'",
        "citable_url": "https://example.com/docs/document1"
      },
      {
        "name": "document2.txt",
        "content": "'$(base64 -i document2.txt)'",
        "citable_url": "https://example.com/docs/document2"
      }
    ],
    "batch_size": 1000,
    "chunk_token_size": 1200,
    "chunk_overlap_token_size": 100,
    "entity_types": ["person", "organization", "location", "event"],
    "enable_chunk_embeddings": true,
    "enable_community_embeddings": true,
    "vector_index_metric": "cosine"
  }'
```

Replace `<your-platform-url>` with your Arango Data Platform URL.

For detailed information about all available parameters, see the [Import Parameters Reference](parameters.md).

### Full example with all parameters

This comprehensive example demonstrates all available import parameters for the multi-file import endpoint:

```json
{
  "files": [
    {
      "name": "document1.txt",
      "content": "VGhpcyBpcyBkb2MxIGNvbnRlbnQgaW4gYmFzZTY0Lg==",
      "citable_url": "https://example.com/doc1"
    },
    {
      "name": "document2.md",
      "content": "VGhpcyBpcyBkb2MyIGNvbnRlbnQgaW4gYmFzZTY0Lg==",
      "citable_url": "https://example.com/doc2"
    }
  ],
  "store_in_s3": false,
  "batch_size": 1000,
  "enable_chunk_embeddings": true,
  "enable_edge_embeddings": true,
  "enable_community_embeddings": true,
  "chunk_token_size": 1000,
  "chunk_overlap_token_size": 200,
  "chunk_min_token_size": 50,
  "chunk_custom_separators": [
    "\n\n",
    "---",
    "###"
  ],
  "preserve_chunk_separator": true,
  "entity_types": [
    "PERSON",
    "ORGANIZATION",
    "LOCATION",
    "TECHNOLOGY"
  ],
  "relationship_types": [
    "RELATED_TO",
    "PART_OF",
    "USES",
    "LOCATED_IN"
  ],
  "enable_strict_types": true,
  "entity_extract_max_gleaning": 1,
  "community_report_num_findings": "5-10",
  "community_report_instructions": "Focus on key entities, relationships, and risk-related findings.",
  "enable_semantic_units": true,
  "process_images": true,
  "store_image_data": true,
  "vector_index_n_lists": 2048,
  "vector_index_metric": "cosine",
  "vector_index_use_hnsw": true,
  "smart_graph_attribute": "region",
  "shard_count": 3,
  "is_disjoint": false,
  "satellite_collections": [
    "sat_col_1",
    "sat_col_2"
  ],
  "partition_id": "my_partition_id_001"
}
```

### Streaming Progress Responses

The multi-file import endpoint returns a stream of `ImportProgressResponse` messages.
Each response contains:

- `type`: Type of progress update (see Progress Types below).
- `message`: Human-readable progress message.
- `current_file_index`: Index of the file currently being processed (0-based).
- `total_files`: Total number of files in the batch.
- `success`: Whether the operation succeeded.
- `error_message`: Error details if `success` is false.

### Progress Types

The `type` field indicates the current stage of processing:

- `IMPORT_PROGRESS_TYPE_FILES_RECEIVED` (value: `1`): All files received and validated.
- `IMPORT_PROGRESS_TYPE_FILE_PROCESSING` (value: `2`): Currently processing a specific file.
- `IMPORT_PROGRESS_TYPE_GRAPH_BUILDING` (value: `3`): Building the unified knowledge graph.
- `IMPORT_PROGRESS_TYPE_DATABASE_IMPORT` (value: `4`): Importing to ArangoDB.
- `IMPORT_PROGRESS_TYPE_COMPLETED` (value: `5`): All processing completed successfully.
- `IMPORT_PROGRESS_TYPE_ERROR` (value: `6`): Error occurred during processing.

### Example: Handling Streaming Responses

```python
import requests
import json

url = "https://<your-platform-url>/v1/import-multiple"
payload = {
    "files": [
        {
            "name": "doc1.txt",
            "content": base64_content_1,
            "citable_url": "https://example.com/doc1"
        },
        {
            "name": "doc2.txt", 
            "content": base64_content_2,
            "citable_url": "https://example.com/doc2"
        }
    ],
    "batch_size": 1000,
    "chunk_token_size": 1200,
    "enable_chunk_embeddings": True,
    "enable_community_embeddings": True,
    "vector_index_metric": "cosine"
}

response = requests.post(url, json=payload, stream=True)

for line in response.iter_lines():
    if line:
        progress = json.loads(line)
        print(f"Progress: {progress['message']}")
        print(f"File: {progress['current_file_index'] + 1}/{progress['total_files']}")
        
        if progress['type'] == 5:  # COMPLETED
            print("Import completed successfully!")
        elif progress['type'] == 6:  # ERROR
            print(f"Error: {progress['error_message']}")
            break
```

## Next Steps

- **[Explore all parameters](parameters.md)**: Customize chunking, entity extraction, and more.
- **[Enable semantic units](semantic-units.md)**: Process images and multimedia content.
- **[Verify your import](verify-and-explore.md)**: Check import status and explore the created collections.