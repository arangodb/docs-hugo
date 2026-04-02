---
title: Orchestration
menuTitle: Orchestration
description: >-
  Automatically spawn importer workers and execute RAG pipeline builds
weight: 50
aliases:
  - ../../../reference/autograph/orchestration/
---

## Trigger Orchestration

{{< endpoint "POST" "/v1/orchestrate" >}}

Spawn GraphRAG importer workers for all strategy profiles. Called after RAG strategizer is completed.

**Recommended path:** Call after a successful corpus build and strategizer run, when `rags` is non-empty. This is the final step of the standard workflow. Omit `partition_ids` to process all profiles; supply specific ids from `GET /v1/rag-strategizer/strategy` to retry or target individual partitions. Do not overlap with an active build (`409`).

### Request

```json
{
  "replicas": 3,
  "max_retries": 3,
  "chat_api_keys": ["sk-key1", "sk-key2"],
  "importer_env": {
    "CUSTOM_ENV": "value"
  },
  "partition_ids": ["domain_0_a", "domain_1_b"]
}
```

### Parameters

| Parameter | Type | Required | Description | Recommended value |
|-----------|------|----------|-------------|-------------------|
| `replicas` | integer | Yes | Number of Importer worker replicas (parallelism). Minimum: **1**. | **2–4** for typical jobs. Scale up only if you have many partitions and capacity. |
| `max_retries` | integer | No | Retries per failed Importer job before giving up. | **3** (default) is appropriate for transient errors. |
| `chat_api_keys` | string[] | No | Raw chat LLM API keys rotated across replicas. | Prefer **secret profiles** in production; use keys only when your deployment has no secret manager. |
| `chat_secret_profile_ids` | string[] | No | Platform secret profile ids for chat keys. Overrides `chat_api_keys` when both are provided. | Provide one or more secret profile IDs — follow your operator's convention. |
| `embedding_secret_profile_id` | string | No | Secret profile for embedding key on the Importer. | Set when embedding must come from vault, not env. |
| `importer_env` | map | No | Extra environment variables for Importer pods (e.g. model names, timeouts). | Start **empty**; add only keys documented for your Importer version (often chunk or model overrides). |
| `partition_ids` | string[] | No | If **non-empty**, only strategies whose **`rag_partition_id`** is listed are orchestrated. | **Omit or `[]`** for full corpus. Use **exact ids** from **`GET /v1/rag-strategizer/strategy`** for targeted reruns. |

### Response

```json
{
  "orchestration_id": "orch_1711812345_a1b2c3d4",
  "success": true,
  "message": "Orchestration started",
  "total_jobs": 0,
  "completed_jobs": 0,
  "failed_jobs": 0,
  "job_results": []
}
```

Orchestration runs in the background. The counters start at zero in this immediate response. Monitor completion through your platform's job tracking or service logs.

| Field | Meaning | Typical use |
|-------|---------|-------------|
| `orchestration_id` | Id for this orchestration run. | Log for correlation with support / metadata. |
| `success` | **`true`** if the background pipeline was scheduled. | Treat as "accepted", not "all Importer jobs finished". |
| `message` | e.g. **`Orchestration started`**. | Display to operators. |
| `total_jobs` / `completed_jobs` / `failed_jobs` / `job_results` | Counters and per-partition results. | Often remain at initial values on this first response; rely on monitoring for completion. |

| Status Code | Meaning |
|-------------|---------|
| `200` | Orchestration started |
| `401` | Authentication failed |
| `409` | Another orchestration or build is in progress |
| `500` | Server error |

### HTTP Example

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"replicas": 2, "max_retries": 3}' \
  http://localhost:8080/v1/orchestrate
```

## Next Steps

- **[Retriever Setup](../../reference/retriever/)**: Query your built knowledge graphs
- **[Monitor Results](../../reference/importer/verify-and-explore.md)**: Verify import success
