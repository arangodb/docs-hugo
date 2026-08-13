---
title: AutoGraph Graph Operations
menuTitle: Graph Operations
description: >-
  Spawn Importer workers, execute RAG pipeline builds, and apply document-level
  updates to a knowledge graph that is already built
weight: 50
---
This page describes the endpoints that build and maintain the Layer 3 knowledge
graph. `POST /v1/orchestrate` starts the Importer workers for the strategy
profiles. The `POST /v1/graph/*` endpoints insert, delete, update, and recluster
individual documents in a graph that has already been built.

To learn when to use the `/v1/graph/*` endpoints, how they compare to a full
rebuild, and how the partition divergence is measured, see
[Incremental Graph Updates](../incremental-graph-updates.md).

## Trigger Orchestration

{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/orchestrate" >}}

Spawn GraphRAG importer workers for all strategy profiles. Called after RAG strategizer is completed.

**Recommended path:** Call after a successful corpus build and strategizer run, when `rags` is non-empty. This is the final step of the standard workflow. Omit `partition_ids` to process all profiles; supply specific ids from `GET /v1/rag-strategizer/strategy` to retry or target individual partitions. Do not overlap with an active build (`409`).

{{< tip >}}
**Targeted orchestration.** If you combine `partition_ids` with `file_ids`, the
Importer only processes the listed documents in the listed partitions. This is
how an [incremental graph update](../incremental-graph-updates.md) adds a newly
inserted or replaced document to Layer 3 without processing the whole partition
again.
{{< /tip >}}

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
| `chat_api_keys` | string[] | No | Raw chat LLM API keys rotated across replicas. | Prefer **secret profiles** in production; use keys only when your deployment has no secrets manager. |
| `chat_secret_profile_ids` | string[] | No | Platform secret profile ids for chat keys. Overrides `chat_api_keys` when both are provided. | Provide one or more secret profile IDs. Follow your operator's convention. |
| `embedding_secret_profile_id` | string | No | Secret profile for embedding key on the Importer. | Set when embedding must come from vault, not env. |
| `importer_env` | map | No | Extra environment variables for Importer pods (e.g. model names, timeouts). | Start **empty**; add only keys documented for your Importer version (often chunk or model overrides). |
| `partition_ids` | string[] | No | If **non-empty**, only strategies whose **`rag_partition_id`** is listed are orchestrated. | **Omit or `[]`** for full corpus. Use **exact ids** from **`GET /v1/rag-strategizer/strategy`** for targeted reruns. |
| `file_ids` | string[] | No | If **non-empty**, the Importer job of each listed partition only processes these files instead of the whole partition. | **Omit** for a normal build. Use it together with `partition_ids` after an [incremental graph update](../incremental-graph-updates.md) to import only the documents that changed. |

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
  https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/orchestrate
```

## Insert documents

{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/graph/insert" >}}

Adds documents that are not in the graph yet. The call is **synchronous**.

The corpus and the target module have to exist already. If the project has
exactly one module, you can omit `module`. Otherwise, it is required.

### Request

Inline content, base64-encoded:

```json
{
  "files": [
    {
      "doc_name": "new-contract.txt",
      "content": "Q29udHJhY3QgdGV4dA==",
      "citable_url": "https://example.com/new-contract"
    }
  ],
  "module": "legal"
}
```

To get the file from the File Manager instead, omit `content` and provide a
`file_id`:

```json
{
  "files": [
    {
      "doc_name": "new-contract.pdf",
      "file_id": "<file-manager-file-id>"
    }
  ],
  "module": "legal"
}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `files` | object[] | Yes | The documents to insert. The list cannot be empty and cannot contain duplicate `doc_name` or `file_id` values. |
| `files[].doc_name` | string | Yes | The file name of the document. It has to match the File Manager file name if you use `file_id`. |
| `files[].content` | string | No | The file content, base64-encoded. Provide either `content` or `file_id`. No `file_id` is created for inline content, so you cannot use the document in a targeted orchestration. See [Identifying documents for Layer 3](../incremental-graph-updates.md#identifying-documents-for-layer-3). |
| `files[].file_id` | string | No | The File Manager ID to get the document from. Preferred over inline content, and required if you want to add the document to Layer 3 later. |
| `files[].citable_url` | string | No | The canonical URL for citations. It is passed through the pipeline. |
| `module` | string | Conditional | The target module. Required unless the project has exactly one module. |

### Response

```json
{
  "results": [
    {
      "doc_name": "new-contract.txt",
      "success": true,
      "cluster_key": "cluster_legal_0",
      "rag_partition_id": "legal_0_a",
      "divergence_score": 0.12,
      "needs_reclustering": false
    }
  ]
}
```

| Field | Meaning |
|-------|---------|
| `doc_name` | The document this result refers to. |
| `success` | Whether the source document has been inserted. |
| `error_message` | Set if this file failed. The other files of the batch can still succeed. |
| `cluster_key` | The existing cluster that has been selected for the document. Can be empty if there is no suitable neighbor in a cluster. |
| `rag_partition_id` | The Layer 3 partition of the selected cluster. Can be empty if there is no strategy profile yet. |
| `file_id` | Returned if you provided File Manager input. Not set for inserts with inline content because they have no File Manager ID. Use this value in the `file_ids` of your targeted orchestration. |
| `divergence_score` | The partition divergence after this insert. It can be lower than the actual churn until a targeted orchestration has created the Layer 3 entities. See [Partition divergence and reclustering](../incremental-graph-updates.md#partition-divergence-and-reclustering). |
| `needs_reclustering` | `true` if the `divergence_score` is above the threshold of the partition. Nothing is reclustered automatically. |

Insert extracts the text, creates an embedding, stores the source, assigns the
closest existing cluster, and adds the membership and similarity edges. It only
updates **Layers 1 and 2**. To add the document to Layer 3, run a targeted
orchestration with its `file_id` and the returned `rag_partition_id`. This is
only possible if the insert used a File Manager `file_id`, see
[Identifying documents for Layer 3](../incremental-graph-updates.md#identifying-documents-for-layer-3).

| Status Code | Meaning |
|-------------|---------|
| `200` | The request has been processed. Check the `success` of every entry in `results`. |
| `400` | Empty or invalid batch, corpus not built, invalid module, duplicate names or IDs, file name mismatch, or the file could not be retrieved from the File Manager. |
| `401` | Authentication failed. |
| `403` | Access denied. |
| `409` | Another operation is currently changing the corpus. |
| `500` | Server error. |
| `503` | A required dependency is temporarily unavailable. |

### HTTP example

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "files": [{
      "doc_name": "new-contract.txt",
      "content": "Q29udHJhY3QgdGV4dA=="
    }],
    "module": "legal"
  }' \
  https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/graph/insert
```

## Delete documents

{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/graph/delete" >}}

Removes documents from an existing corpus graph. Layers 1 and 2 are updated
**synchronously**. The Layer 3 cleanup runs **asynchronously** in the Importer.

Use File Manager IDs in `file_ids` if you can, as they are stable. Otherwise,
provide `doc_names`, which are looked up in the requested module. You need to
provide at least one of the two lists.

### Request

```json
{
  "file_ids": [
    "<file-manager-file-id-1>",
    "<file-manager-file-id-2>"
  ],
  "module": "legal"
}
```

By file name instead:

```json
{
  "doc_names": ["old-contract.pdf"],
  "module": "legal"
}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `file_ids` | string[] | Conditional | The File Manager IDs of the documents to delete. Required unless you provide `doc_names`. |
| `doc_names` | string[] | Conditional | The file names to look up in `module`. Required unless you provide `file_ids`. |
| `module` | string | Conditional | The module the documents belong to. Required unless the project has exactly one module. |

{{< info >}}
The batch is validated before anything is removed. If one of the documents is
invalid, the request returns `400` and nothing is deleted.
{{< /info >}}

{{< info >}}
**Delete has no replica setting.** The Layer 3 cleanup in the background always
runs on a single Importer worker. Unlike an
[orchestration](#trigger-orchestration), it cannot run in parallel.
{{< /info >}}

### Response

```json
{
  "results": [
    {
      "file_id": "<file-manager-file-id-1>",
      "status": "LAYER2_DELETE_STATUS_SUCCESS",
      "rag_partition_id": "legal_0_a",
      "cluster_key": "cluster_legal_0",
      "similarity_edges_removed": 4
    }
  ],
  "affected_rag_partitions": ["legal_0_a"],
  "removed_rag_partitions": [],
  "affected_cluster_ids": ["cluster_legal_0"],
  "removed_cluster_ids": [],
  "layer3_results": [],
  "layer3_overall_status": "LAYER3_DELETE_STATUS_PENDING"
}
```

The response confirms the changes in Layer 1 and Layer 2.
`LAYER3_DELETE_STATUS_PENDING` means that the Importer is still removing the
documents, chunks, entities, and edges of Layer 3. Poll the
`importerOrchestration` status in the metadata of your platform project until it
reports `completed` or `failed`.

{{< warning >}}
The deletion in Layer 1 and Layer 2 is not rolled back if the Layer 3 cleanup
fails.
{{< /warning >}}

Once the Layer 3 cleanup is done, AutoGraph calculates the divergence of every
affected partition again and adds `divergence_score` and `needs_reclustering` to
the result of each file in that status.

| Status Code | Meaning |
|-------------|---------|
| `200` | The Layer 1 and Layer 2 results are returned. Check `layer3_overall_status`. |
| `400` | Missing or duplicate identifiers, invalid module, a document does not exist, or it belongs to another module. Nothing is deleted. |
| `401` | Authentication failed. |
| `403` | Access denied. |
| `409` | Another operation is currently changing the corpus. |
| `500` | Server error. |
| `503` | A required dependency is temporarily unavailable. |

### HTTP example

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "file_ids": ["<file-manager-file-id>"],
    "module": "legal"
  }' \
  https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/graph/delete
```

## Update documents

{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/graph/update" >}}

Replaces the content of documents that are already in the graph. The call is
**asynchronous**.

Every document has to exist and belong to the requested module. A single invalid
document makes the whole batch fail before anything is changed.

### Request

```json
{
  "files": [
    {
      "doc_name": "existing-contract.txt",
      "content": "VXBkYXRlZCBjb250cmFjdCB0ZXh0"
    }
  ],
  "module": "legal"
}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `files` | object[] | Yes | The documents to replace. The list cannot be empty and cannot contain duplicate `doc_name` or `file_id` values. |
| `files[].doc_name` | string | Yes | The file name of the document to replace. It has to match the File Manager file name if you use `file_id`. |
| `files[].content` | string | No | The new content, base64-encoded. Provide either `content` or `file_id`. No `file_id` is created for inline content, so you cannot use the new version in a targeted orchestration. See [Identifying documents for Layer 3](../incremental-graph-updates.md#identifying-documents-for-layer-3). |
| `files[].file_id` | string | No | The File Manager ID to get the new version from. Preferred over inline content, and required if you want to add the new version to Layer 3 later. |
| `module` | string | Conditional | The module the documents belong to. Required unless the project has exactly one module. If you omit it in a project with a single module, the `doc_name` values are looked up in that module before anything is changed. |

### Immediate response

```json
{
  "update_id": "update_1721840400_a1b2c3d4",
  "accepted": true,
  "message": "Update started",
  "results": []
}
```

`accepted: true` means that the update has been validated and started, not that
it is done. Poll the `importerOrchestration` entry in the metadata of your
platform project. The update goes through the following phases:

1. `DELETE_L12`: Removes the old source and the corpus graph data.
2. `DELETE_L3`: Waits for the Importer to remove the old knowledge graph data.
3. `INSERT_L12`: Inserts the new version and assigns a cluster to it.
4. `DONE`: The update has succeeded or failed.

A final status message looks like this:

```json
{
  "phase": "DONE",
  "status": "completed",
  "summary": "Updated 1 file(s) in Layers 1-2; run orchestrate to re-import Layer 3",
  "files": [
    {
      "file": "existing-contract.txt",
      "result": "updated",
      "cluster": "cluster_legal_0",
      "previous_cluster": "cluster_legal_1",
      "partition": "legal_0_a",
      "divergence_score": 0.20,
      "needs_reclustering": false
    }
  ]
}
```

| Field in `files[]` | Meaning |
|--------------------|---------|
| `file` | The document this result refers to. |
| `result` | The result for this file, for example `updated`. |
| `cluster` / `previous_cluster` | The cluster that is assigned to the new version, and the cluster the old version belonged to. |
| `partition` | The Layer 3 partition of the new cluster. |
| `divergence_score` | The partition divergence after the deletion and the insertion, as gross churn. See [Partition divergence and reclustering](../incremental-graph-updates.md#partition-divergence-and-reclustering). |
| `needs_reclustering` | `true` if the score is above the threshold of the partition. AutoGraph does not recluster automatically. |

An update waits for the old Layer 3 data to be removed before it inserts the new
version, so that old and new knowledge graph data do not exist side by side. It
is still not a database transaction.

{{< warning >}}
If the deletion succeeds but the insertion fails, the document stays removed.
Fix the underlying problem and add it again with `POST /v1/graph/insert`.
{{< /warning >}}

After a successful update, run a targeted orchestration to import the new
version into Layer 3.

| Status Code | Meaning |
|-------------|---------|
| `200` | The update has been validated and started. Poll for the result. |
| `400` | Empty or invalid batch, invalid module, or a document that is not in the graph. |
| `401` | Authentication failed. |
| `403` | Access denied. |
| `409` | Another operation is currently changing the corpus. |
| `500` | Server error. |
| `503` | A required dependency is temporarily unavailable. |

### HTTP example

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "files": [{
      "doc_name": "existing-contract.txt",
      "content": "VXBkYXRlZCBjb250cmFjdCB0ZXh0"
    }],
    "module": "legal"
  }' \
  https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/graph/update
```

## Trigger reclustering

{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/graph/recluster" >}}

Schedules a Layer 3 reclustering for one or more **FullGraphRAG** partitions.
The call returns right away and tells you whether the work has been scheduled.
The reclustering itself runs **asynchronously**.

Call this endpoint if the result of an insert, delete, or update, or the `rags`
profile of the partition, reports `needs_reclustering: true` and you decide that
refreshing the communities is worth the cost. AutoGraph never starts a
reclustering on its own.

Only FullGraphRAG partitions have a community layer that can be rebuilt. A
VectorRAG partition has no `Entities` or `Communities`, so there is nothing to
rebuild, and such a partition is never flagged for reclustering in the first
place. See [Partition divergence and
reclustering](../incremental-graph-updates.md#partition-divergence-and-reclustering).

### Request

```json
{
  "partition_ids": ["legal_0_a", "engineering_0_a"]
}
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `partition_ids` | string[] | Yes | One or more `rag_partition_id` values, for example from the response of an insert, delete, or update. At least one non-empty ID is required. Duplicates are ignored. |

### Response

```json
{
  "results": [
    {
      "rag_partition_id": "legal_0_a",
      "accepted": true
    },
    {
      "rag_partition_id": "engineering_0_a",
      "accepted": true
    }
  ]
}
```

| Field | Meaning |
|-------|---------|
| `results[].rag_partition_id` | The partition this result refers to. |
| `results[].accepted` | `true` if a reclustering has been scheduled, or if it has been merged into a reclustering that is already running for this partition. |
| `results[].error_message` | Set if the reclustering could not be scheduled for this partition, for example because the ID is empty. |

`accepted: true` means that the work is **queued**, not that the reclustering is
done. Poll the `importerOrchestration` entry in the metadata of your platform
project to see whether it is running, completed, or failed. If it succeeds,
AutoGraph resets the divergence of the partition. The `divergence_score` becomes
`0`, `needs_reclustering` becomes `false`, and a new baseline is taken. If it
fails, the score and the flag stay as they are so that you can try again.

| Status Code | Meaning |
|-------------|---------|
| `200` | The request has been processed. Check the `accepted` value of every entry in `results`. |
| `400` | `partition_ids` is missing or empty. |
| `401` | Authentication failed. |
| `403` | Access denied. |
| `500` | Server error. |

**Notes:**

- If a reclustering is already running for a partition, a second request is
  **merged** into it and does not start another Importer job.
- Reclustering uses the same service-wide slot as build, insert, update, and
  delete, so it cannot run at the same time as these operations.
- A reclustering that fails or is skipped does not clear `needs_reclustering`.
  Start it again once the slot is free.
- To learn what the Importer does during a reclustering and how long it takes,
  see
  [Importer Incremental Updates](../../importer/incremental-updates.md#reclustering).

### HTTP example

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "partition_ids": ["legal_0_a"]
  }' \
  https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/graph/recluster
```

## End-to-end example of an incremental update

The following calls assume that the corpus graph has already been built.

```bash
# 1. Add a new document to Layers 1 and 2
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "files": [{
      "doc_name": "new.txt",
      "file_id": "<new-file-id>"
    }],
    "module": "legal"
  }' \
  https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/graph/insert

# 2. Delete an obsolete document (Layer 3 cleanup continues in the background)
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "file_ids": ["<old-file-id>"],
    "module": "legal"
  }' \
  https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/graph/delete

# 3. Replace an existing document (returns an update_id immediately)
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "files": [{
      "doc_name": "existing.txt",
      "file_id": "<existing-file-id>"
    }],
    "module": "legal"
  }' \
  https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/graph/update
```

After an insert or a successful update, run a targeted orchestration so that
Layer 3 contains the new content:

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "replicas": 1,
    "partition_ids": ["legal_0_a"],
    "file_ids": ["<new-or-updated-file-id>"]
  }' \
  https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/orchestrate
```

If a result reports `needs_reclustering: true` for a partition, you can start a
reclustering. It is optional and never automatic:

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "partition_ids": ["legal_0_a"]
  }' \
  https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/graph/recluster
```

Poll `importerOrchestration` in your project metadata until the reclustering is
done. If it succeeds, the `divergence_score` of the partition is reset to `0`
and `needs_reclustering` is cleared.

## Troubleshooting

- **The insert succeeded but the document is not in Layer 3.** An insert only
  updates Layers 1 and 2. Run a targeted orchestration with the returned
  `rag_partition_id` and the new `file_id`.
- **The insert or update result has no `file_id`.** The call used inline
  `content`, for which no File Manager ID is created, so there is nothing you
  can use in the `file_ids` of a targeted orchestration. See [Identifying
  documents for Layer
  3](../incremental-graph-updates.md#identifying-documents-for-layer-3).
- **The delete returned `LAYER3_DELETE_STATUS_PENDING`.** This is expected.
  Layers 1 and 2 are done and the Layer 3 cleanup runs in the background. Poll
  `importerOrchestration` in your project metadata.
- **The update returned `accepted: true` but the document has not changed.**
  Updates are asynchronous. Poll `importerOrchestration` until the JSON message
  reports `phase: "DONE"`.
- **The update failed and the source document is gone.** The deletion succeeded
  but the insertion failed. Fix the input or the underlying problem and add the
  document again with `POST /v1/graph/insert`.
- **A call returns `409`.** Another operation, such as a build, insert, update,
  delete, or reclustering, is using the service-wide slot. Wait for it to finish
  and try again.
- **`needs_reclustering` is `true` after an insert, delete, or update.** The
  divergence score of the partition is above its threshold, which is 25% by
  default. Nothing is reclustered automatically. Call
  `POST /v1/graph/recluster` with the `rag_partition_id` if you want to refresh
  the communities.
- **An insert showed a low `divergence_score` but the flag was set later.** This
  is expected. The insert response can be calculated before the Layer 3 entities
  exist. The final score is written after the targeted orchestration.
- **The reclustering was accepted but `needs_reclustering` is still `true`.**
  The scheduling succeeded, but the background job may still be running or it
  may have failed. Poll `importerOrchestration`. A failed reclustering does not
  clear the flag, so you can try again.

## Next Steps

- **[Retriever Setup](../../retriever/)**: Query your built knowledge graphs
- **[Monitor Results](../../importer/verify-and-explore.md)**: Verify import success
- **[Incremental Graph Updates](../incremental-graph-updates.md)**: When to use the `/v1/graph/*` endpoints and how the partition divergence is measured
- **[Design Guide - Modules to partitions](../design-guide.md#how-modules-become-a-partitioned-knowledge-graph)**: How module names flow into partition IDs
- **[Error Handling](error-handling.md)**: HTTP codes and general troubleshooting
