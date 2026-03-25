---
title: Orchestration
menuTitle: Orchestration
description: >-
  Automatically spawn importer workers and execute RAG pipeline builds
weight: 60
---

## Overview

The orchestration endpoint spawns multiple graphrag_importer worker instances and executes builds for all strategy profiles in the `corpus_rags` collection. This automates the entire knowledge graph construction pipeline.

**Key features:**
- Parallel worker execution
- Automatic load distribution across workers
- Retry logic for failed jobs
- Secret manager integration
- Selective partition processing
- Immediate response with background execution

{{< tip >}}
Orchestration should be run **after** the RAG Strategizer has analyzed your corpus and created strategy profiles.
{{< /tip >}}

## Trigger Orchestration

Start the orchestration pipeline to build knowledge graphs for all strategy profiles.

{{< endpoint "POST" "/v1/orchestrate" >}}

### Request Parameters

#### `replicas` (required)

Number of worker replicas to spawn. Each worker processes strategy profiles in parallel.

#### `max_retries` (optional)

Maximum retry attempts per failed job. Default is `3`.

#### `importer_env` (optional)

Environment variable overrides for the importer workers. Use this to pass:
- Unmasked API keys
- Custom configuration
- Model endpoints
- Feature flags

Example:
```json
{
  "OPENAI_API_KEY": "sk-...",
  "EMBEDDING_MODEL": "text-embedding-3-large",
  "CHUNK_SIZE": "1200"
}
```

#### `chat_api_keys` (optional)

Array of Chat LLM API keys for load distribution across workers. Workers will use these keys in round-robin fashion.

#### `chat_secret_profile_ids` (optional)

Array of secret manager profile IDs for chat LLM credentials. Use this for secure credential management instead of passing raw keys.

When set, takes precedence over `chat_api_keys`. One profile per replica or round-robin distribution.

#### `embedding_secret_profile_id` (optional)

Secret manager profile ID for embedding model credentials.

When set, the importer resolves credentials via the secret manager instead of using raw keys.

#### `partition_ids` (optional)

Array of partition IDs to process. When non-empty, only strategy profiles with `rag_partition_id` in this list are orchestrated. When empty, all strategy profiles are processed.

**Example:** `["0_a", "1_a", "3_b"]` processes only these three partitions.

### Request Examples

**Basic orchestration:**

```bash
curl -X POST https://<your-platform-url>/v1/orchestrate \
  -H "Content-Type: application/json" \
  -d '{
    "replicas": 3,
    "max_retries": 3
  }'
```

**With API keys:**

```bash
curl -X POST https://<your-platform-url>/v1/orchestrate \
  -H "Content-Type: application/json" \
  -d '{
    "replicas": 3,
    "chat_api_keys": [
      "sk-key1...",
      "sk-key2...",
      "sk-key3..."
    ]
  }'
```

**With secret manager:**

```bash
curl -X POST https://<your-platform-url>/v1/orchestrate \
  -H "Content-Type: application/json" \
  -d '{
    "replicas": 5,
    "chat_secret_profile_ids": [
      "chat-profile-1",
      "chat-profile-2"
    ],
    "embedding_secret_profile_id": "embedding-profile-1"
  }'
```

**Process specific partitions:**

```bash
curl -X POST https://<your-platform-url>/v1/orchestrate \
  -H "Content-Type: application/json" \
  -d '{
    "replicas": 2,
    "partition_ids": ["0_a", "1_b", "2_a"]
  }'
```

**With environment overrides:**

```bash
curl -X POST https://<your-platform-url>/v1/orchestrate \
  -H "Content-Type: application/json" \
  -d '{
    "replicas": 3,
    "max_retries": 5,
    "importer_env": {
      "CHUNK_TOKEN_SIZE": "1500",
      "BATCH_SIZE": "500",
      "ENABLE_STRICT_TYPES": "true"
    }
  }'
```

### Response

The endpoint returns immediately with an orchestration ID. The pipeline runs in the background.

```json
{
  "orchestration_id": "orch_01H8X9Y7Z8ABCDEF123456",
  "success": false,
  "message": "",
  "total_jobs": 0,
  "completed_jobs": 0,
  "failed_jobs": 0,
  "job_results": []
}
```

**Response Fields:**

- `orchestration_id` (string): Unique ID for this orchestration run
- `success` (boolean): `false` on immediate return (updated when complete)
- `message` (string): Empty on immediate return (summary when complete)
- `total_jobs` (integer): `0` on immediate return (updated when complete)
- `completed_jobs` (integer): `0` on immediate return
- `failed_jobs` (integer): `0` on immediate return
- `job_results` (array): Empty on immediate return (populated when complete)

When orchestration completes, the `job_results` array contains job result objects with:

- `rag_partition_id` (string): Partition ID of the job
- `strategy_type` (string): `"FullGraphRAG"` or `"VectorRAG"`
- `status` (string): `"completed"` or `"failed"`
- `retry_count` (integer): Number of retries attempted
- `error_message` (optional, string): Error details if failed

## Monitoring Orchestration

Since orchestration runs in the background, you'll need to monitor progress through:

1. **ArangoDB collections**: Check the `corpus_rags` collection for status updates
2. **Importer logs**: View worker logs for detailed progress
3. **Platform monitoring**: Use ACP service monitoring tools

## Job Processing

Each strategy profile from the RAG Strategizer becomes a job. Jobs are:

1. Distributed across worker replicas
2. Processed with the appropriate RAG strategy (FullGraphRAG or VectorRAG)
3. Retried up to `max_retries` times if they fail
4. Tracked with status (`completed` or `failed`)

### Job Result Example

```json
{
  "job_results": [
    {
      "rag_partition_id": "0_a",
      "strategy_type": "FullGraphRAG",
      "status": "completed",
      "retry_count": 0,
      "error_message": ""
    },
    {
      "rag_partition_id": "1_b",
      "strategy_type": "VectorRAG",
      "status": "failed",
      "retry_count": 3,
      "error_message": "Timeout during embedding generation"
    }
  ]
}
```

## Credential Management

### Using Raw API Keys

Pass API keys directly for simple deployments:

```json
{
  "replicas": 3,
  "chat_api_keys": ["sk-key1", "sk-key2", "sk-key3"]
}
```

Workers use keys in round-robin fashion for load balancing.

### Using Secret Manager

For production deployments, use secret profiles:

```json
{
  "replicas": 3,
  "chat_secret_profile_ids": ["profile-1", "profile-2"],
  "embedding_secret_profile_id": "embedding-profile"
}
```

**Benefits:**
- Secure credential storage
- No credentials in request payloads
- Centralized secret rotation
- Audit logging

{{< warning >}}
When both `chat_secret_profile_ids` and `chat_api_keys` are provided, secret profile IDs take precedence.
{{< /warning >}}

## Selective Processing

Process only specific partitions using `partition_ids`:

```bash
# Get FullGraphRAG partitions only
FULL_GRAPH_PARTITIONS=$(curl -s https://<url>/v1/rag-strategizer/strategy | \
  jq -r '.strategies[] | select(.strategy_type=="FullGraphRAG") | .rag_partition_id')

# Orchestrate only FullGraphRAG builds
curl -X POST https://<your-platform-url>/v1/orchestrate \
  -H "Content-Type: application/json" \
  -d "{
    \"replicas\": 3,
    \"partition_ids\": $(echo $FULL_GRAPH_PARTITIONS | jq -R 'split(\" \")')
  }"
```

**Use cases:**
- Process high-priority domains first
- Separate FullGraphRAG from VectorRAG builds
- Retry failed partitions
- Incremental processing of new domains

## Best Practices

### Retry Strategy

**Transient failures (network issues):**
- Higher `max_retries` (5-10)

**Persistent failures (invalid data):**
- Lower `max_retries` (1-3)
- Fix data issues before re-orchestrating

### API Key Distribution

**Equal distribution:**
```json
{
  "replicas": 3,
  "chat_api_keys": ["key1", "key2", "key3"]
}
```

**Shared keys (rate limit management):**
```json
{
  "replicas": 6,
  "chat_api_keys": ["key1", "key2"]
}
```

## Common Workflows

### Full Pipeline Execution

```bash
# 1. Import files
curl -X POST https://<url>/v1/import-multiple \
  -d '{"files": [...], "module": "technical"}'

# 2. Create corpus build
BUILD_ID=$(curl -s -X POST https://<url>/v1/corpus/builds \
  -d '{"embedding_strategy": "first_chunk"}' | jq -r '.corpus_build_id')

# 3. Wait for build completion
while true; do
  STATUS=$(curl -s https://<url>/v1/corpus/builds/$BUILD_ID | jq -r '.status')
  [[ "$STATUS" == "completed" ]] && break
  sleep 10
done

# 4. Run RAG strategizer
curl -X POST https://<url>/v1/rag-strategizer/analyze \
  -d '{"full_graph_rag_strategy": "high"}'

# 5. Orchestrate builds
curl -X POST https://<url>/v1/orchestrate \
  -d '{"replicas": 5, "max_retries": 3}'
```

### Selective Re-processing

```bash
# Get failed jobs from previous run
FAILED_PARTITIONS=(...)

# Re-orchestrate only failed partitions
curl -X POST https://<url>/v1/orchestrate \
  -d "{
    \"replicas\": 2,
    \"partition_ids\": $FAILED_PARTITIONS,
    \"max_retries\": 5
  }"
```

## Next Steps

- **[Retriever Setup](../retriever/)**: Query your built knowledge graphs
- **[Monitor Results](../importer/verify-and-explore.md)**: Verify import success
