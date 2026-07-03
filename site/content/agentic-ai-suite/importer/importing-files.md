---
title: Import Files to build your Knowledge Graph
menuTitle: Import Files
description: >-
  Learn how to import single or multiple documents to build your knowledge graph
weight: 50
---

This page covers the import endpoints and how to monitor running imports.
Before reading it, make sure you've finished the
[Quickstart](quickstart.md) (project created, service installed) and
[LLM Configuration](llm-configuration.md) (chat and embedding providers
configured).

{{< info >}}
Platform routes require authentication. Include a standard `Authorization`
header (e.g., `Bearer <token>`) on every request to the Importer.
{{< /info >}}

## Choosing a RAG Mode

The Importer supports two operational modes:

- **Full GraphRAG** (default): Extracts entities, relationships, and community structures from your documents to build a complete knowledge graph. Best for complex queries that require understanding relationships between concepts.

- **Vector RAG**: Performs simple vector-based retrieval using only document chunks. Faster processing but without the rich graph structure. Best for straightforward semantic search use cases.

{{< tip >}}
If you're unsure which mode to use, start with Full GraphRAG. You can always switch to Vector RAG later if you need faster processing and simpler retrieval. See the [Parameters Reference](reference/parameters.md#rag-mode-configuration) for more details.
{{< /tip >}}

## Single File Import

Use single file import when you want to process one document at a time. This is 
ideal for testing, small documents, or when you need immediate feedback without 
streaming progress updates.

{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/graphrag/importer/{serviceIdPostfix}/v1/import" >}}

### Basic example

```bash
# Base64 encode your document
base64_content=$(base64 -i your_document.txt)

# Send to the Importer service
curl -X POST https://<EXTERNAL_ENDPOINT>:8529/graphrag/importer/<SERVICE_ID_POSTFIX>/v1/import \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "file_content": "'$base64_content'",
    "file_name": "your_document.txt"
  }'
```

### Example with common parameters

```bash
curl -X POST https://<EXTERNAL_ENDPOINT>:8529/graphrag/importer/<SERVICE_ID_POSTFIX>/v1/import \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "file_content": "'$base64_content'",
    "file_name": "your_document.txt",
    "batch_size": 1000,
    "chunk_token_size": 1024,
    "chunk_overlap_token_size": 128,
    "entity_types": ["person", "organization", "location", "event"],
    "relationship_types": ["WORKS_FOR", "LOCATED_IN", "PARTICIPATES_IN"],
    "enable_chunk_embeddings": false,
    "enable_edge_embeddings": false,
    "enable_community_embeddings": true
  }'
```

The service will:
- Process the document using the configured LLM model.
- Generate embeddings using the embedding model.
- Build a knowledge graph.
- Import the graph into your ArangoDB database.

For detailed information about all available parameters, see the [Import Parameters Reference](reference/parameters.md).

## Multi-File Import

Use multi-file import when you need to process multiple documents into a single
Knowledge Graph. The request returns immediately with a `job_id` that you use
to poll for progress via the [jobs API](#monitoring-jobs).

{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/graphrag/importer/{serviceIdPostfix}/v1/import-multiple" >}}

The response payload looks like this:

```json
{
  "success": true,
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "service_id": "arangodb-graphrag-importer-0",
  "message": "Import started for 2 files. Use GET /v1/jobs/550e8400-e29b-41d4-a716-446655440000 to monitor progress."
}
```

{{< tip >}}
You can also reference files already uploaded to
[File Manager](../../platform-suite/file-manager/) by passing
`file_ids` instead of inline `files`. When `file_ids` is non-empty, the
`files` array is ignored.
{{< /tip >}}

### Basic example

```bash
curl -X POST https://<EXTERNAL_ENDPOINT>:8529/graphrag/importer/<SERVICE_ID_POSTFIX>/v1/import-multiple \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
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
    "chunk_token_size": 1024,
    "chunk_overlap_token_size": 128,
    "entity_types": ["person", "organization", "location", "event"],
    "enable_chunk_embeddings": true,
    "enable_community_embeddings": true,
    "vector_index_metric": "cosine"
  }'
```

For detailed information about all available parameters, see the [Import Parameters Reference](reference/parameters.md).

### Vector RAG example

For faster processing when you only need semantic search over document chunks:

```bash
curl -X POST https://<EXTERNAL_ENDPOINT>:8529/graphrag/importer/<SERVICE_ID_POSTFIX>/v1/import-multiple \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
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
    "rag_mode": "vector_rag",
    "batch_size": 1000,
    "chunk_token_size": 1024,
    "chunk_overlap_token_size": 128,
    "vector_index_metric": "cosine"
  }'
```

{{< info >}}
In `"vector_rag"` mode, entity extraction is skipped and chunk embeddings are automatically enabled. This results in faster processing but without the knowledge graph structure.
{{< /info >}}

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
  "rag_mode": "full_graphrag",
  "store_in_s3": false,
  "batch_size": 1000,
  "enable_chunk_embeddings": true,
  "enable_edge_embeddings": true,
  "enable_community_embeddings": true,
  "chunk_token_size": 1024,
  "chunk_overlap_token_size": 128,
  "chunk_min_token_size": 50,
  "chunk_custom_separators": [
    "\n\n",
    "---",
    "###"
  ],
  "preserve_chunk_separator": true,
  "ignore_chunk_token_size": false,
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
  "custom_prompts": {
    "entity_extraction": "Extract key entities with detailed context.",
    "community_report": "Focus on key entities, relationships, and risk-related findings. Provide 5-10 insights."
  },
  "enable_semantic_units": true,
  "process_images": true,
  "store_image_data": true,
  "vector_index_n_lists": 2048,
  "vector_index_metric": "cosine",
  "vector_index_use_hnsw": true,
  "smart_graph_attribute": "partition_id",
  "shard_count": 1,
  "is_disjoint": false,
  "satellite_collections": [
    "sat_col_1",
    "sat_col_2"
  ],
  "partition_id": "my_partition_id_001"
}
```

{{< warning >}}
When creating a new SmartGraph through the Importer, `smart_graph_attribute`
must be `"partition_id"` and `shard_count` must be `1`. See
[SmartGraph and sharding](#smartgraph-and-sharding) below.
{{< /warning >}}

## Monitoring jobs

Multi-file imports report progress through the **jobs API**. Single-file
imports do not produce a `job_id`; use the platform service status feed for
those instead. See [Architecture](architecture.md#asynchronous-import-lifecycle)
for the full lifecycle.

### Get job status

{{< endpoint "GET" "https://<EXTERNAL_ENDPOINT>:8529/graphrag/importer/{serviceIdPostfix}/v1/jobs/{job_id}" >}}

```bash
curl -sS "https://<EXTERNAL_ENDPOINT>:8529/graphrag/importer/<SERVICE_ID_POSTFIX>/v1/jobs/<JOB_ID>" \
  -H "Authorization: Bearer <your-jwt-token>"
```

The response includes a `job` object with:

- `job_id`, `created_at`, `files`, `files_count`.
- `is_terminal`: `true` once the job has reached a final state (success or failure).
- `current_status`: latest status entry with `status`, `timestamp`,
  `progress` (0-100), and `message`.
- `status_history`: prior entries, oldest first.

Terminal `current_status.status` values: `service_completed`, `service_failed`,
`openai_graph_build_failed`, `openai_embedding_failed`,
`triton_graph_build_failed`, `triton_embedding_failed`,
`import_graph_to_adb_failed`, `create_index_failed`.

Non-terminal examples: `graph_builder_started`, `chunking_in_progress`,
`import_entities_in_progress`, `openai_graph_build_in_progress`,
`create_index_in_progress`.

Status messages may include a `[rag_mode=...]` prefix or markers such as
`[NO_ENTITIES_WRITTEN]` and `[KG_VERIFICATION_INCONCLUSIVE]`. See
[Error Handling](reference/error-handling.md#asynchronous-failure-markers)
for the full list.

{{< info >}}
Job history is held **in memory per pod** with a cap of 100 terminal jobs.
Older jobs disappear from the API; query the platform service status feed
for longer-term visibility.
{{< /info >}}

### Polling example

```python
import requests
import time

url = "https://<EXTERNAL_ENDPOINT>:8529/graphrag/importer/<SERVICE_ID_POSTFIX>"
headers = {"Authorization": "Bearer <your-jwt-token>"}

# Submit
resp = requests.post(f"{url}/v1/import-multiple", headers=headers, json=payload).json()
job_id = resp["job_id"]

# Poll
while True:
    status = requests.get(f"{url}/v1/jobs/{job_id}", headers=headers).json()
    job = status["job"]
    print(f"{job['current_status']['status']} - {job['current_status']['progress']}%")
    if job["is_terminal"]:
        break
    time.sleep(15)
```

### List recent jobs

{{< endpoint "GET" "https://<EXTERNAL_ENDPOINT>:8529/graphrag/importer/{serviceIdPostfix}/v1/jobs" >}}

Returns up to `limit` recent job summaries (default `50`), most recent first.

## Health check

{{< endpoint "GET" "https://<EXTERNAL_ENDPOINT>:8529/graphrag/importer/{serviceIdPostfix}/v1/health" >}}

Returns the readiness status of the Importer service. While an import is
running on the replica, the response is still `success: true` but the
`message` says **"Service is healthy but busy."** - a second import
submitted in that state will fail with `success: false`.

## SmartGraph and sharding

When the Importer creates ArangoDB graph collections, the following
constraints apply:

| Scenario | Rule |
|----------|------|
| **New SmartGraph** | `smart_graph_attribute` must be `"partition_id"`. `partition_id` must be non-empty. **`shard_count` must be `1`** (the protobuf default `0` is rejected). |
| **Existing SmartGraph** | Send `smart_graph_attribute` + `partition_id`. `shard_count` is ignored with an info log. |
| **New sharded enterprise graph** (no smart attribute) | Only `shard_count: 1` is supported when creating. |
| **`is_disjoint`** | Must be `false` when creating a sharded enterprise graph with a positive `shard_count`. |

`partition_id` charset: 1-254 UTF-8 bytes; no whitespace or `:`; allowed
`A-Z a-z 0-9 _ - . @ ( ) + , = ; $ ! * ' %`.

When SmartGraph + `partition_id` is active, vertex `_key` values are
written as `{partition_id}:{logicalKey}`.

## Next Steps

- **[Explore all parameters](reference/parameters.md)**: Customize chunking, entity extraction, and more.
- **[Enable semantic units](semantic-units.md)**: Process images and multimedia content.
- **[Verify your import](verify-and-explore.md)**: Check import status and explore the created collections.