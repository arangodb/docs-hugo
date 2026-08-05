---
title: AutoGraph Graph Operations
menuTitle: Graph Operations
description: >-
  Spawn Importer workers, execute RAG pipeline builds, and apply document-level
  updates to a knowledge graph that is already built
weight: 50
---
This page documents the endpoints that build and maintain the Layer 3 knowledge
graph: `POST /v1/orchestrate`, which spawns Importer workers for the strategy
profiles, and the `POST /v1/graph/*` endpoints, which insert, delete, update,
and recluster individual documents in a graph that has already been built.

For the concepts behind the `/v1/graph/*` endpoints - when to use them, how they
compare with a full rebuild, and how partition divergence is measured - see
[Incremental Graph Updates](../incremental-graph-updates.md).

## Trigger Orchestration

{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/orchestrate" >}}

Spawn GraphRAG importer workers for all strategy profiles. Called after RAG strategizer is completed.

**Recommended path:** Call after a successful corpus build and strategizer run, when `rags` is non-empty. This is the final step of the standard workflow. Omit `partition_ids` to process all profiles; supply specific ids from `GET /v1/rag-strategizer/strategy` to retry or target individual partitions. Do not overlap with an active build (`409`).

{{< tip >}}
**Targeted orchestration.** Combining `partition_ids` with `file_ids` limits the
Importer to specific documents inside specific partitions. This is how an
[incremental graph update](../incremental-graph-updates.md) materializes a newly
inserted or replaced document in Layer 3 without reprocessing the partition.
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
| `file_ids` | string[] | No | If **non-empty**, the Importer job for each listed partition processes only these files instead of the whole partition. | **Omit** for a normal build. Use together with `partition_ids` after an [incremental graph update](../incremental-graph-updates.md) to import only the documents that changed. |

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

Add documents that are not already in the graph. Runs **synchronously**.

The corpus and the target module must already exist. If the project has
exactly one module, `module` can be omitted; otherwise it is required.

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

To fetch the file from the File Manager instead, omit `content` and provide
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
| `files` | object[] | Yes | Documents to insert. Must be non-empty, with no duplicate `doc_name` or `file_id` values. |
| `files[].doc_name` | string | Yes | File name of the document. Must match the File Manager file name when `file_id` is used. |
| `files[].content` | string | No | File bytes, base64-encoded. Provide either `content` or `file_id`. No `file_id` is generated for inline content, so the document cannot be named in a targeted orchestration - see [Identifying documents for Layer 3](../incremental-graph-updates.md#identifying-documents-for-layer-3). |
| `files[].file_id` | string | No | File Manager id to fetch the document from. Preferred over inline content, and required if you intend to materialize the document in Layer 3. |
| `files[].citable_url` | string | No | Canonical URL for citations, carried through the pipeline. |
| `module` | string | Conditional | Target module. Required unless the project has exactly one module. |

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
| `success` | Whether the source document was inserted. |
| `error_message` | Set when this file failed. Other files in the batch can still succeed. |
| `cluster_key` | Existing cluster selected for the document. Can be empty when no suitable clustered neighbor exists. |
| `rag_partition_id` | Layer 3 partition linked to the selected cluster. Can be empty when no strategy profile exists yet. |
| `file_id` | Echoed when File Manager input was used. Absent for inline-content inserts, which have no File Manager id. Pass this value in the `file_ids` of your targeted orchestration. |
| `divergence_score` | Partition divergence after this insert. Can understate churn until targeted orchestration creates the Layer 3 entities. See [Partition divergence and reclustering](../incremental-graph-updates.md#partition-divergence-and-reclustering). |
| `needs_reclustering` | `true` when `divergence_score` strictly exceeds the partition's threshold. Nothing is reclustered automatically. |

Insert extracts the text, generates an embedding, stores the source, assigns
the closest existing cluster, and adds membership and similarity edges. It
updates **Layers 1 and 2 only**. To materialize the document in Layer 3, run
targeted orchestration with its `file_id` and the returned `rag_partition_id`,
which requires that the insert used File Manager `file_id` input (see
[Identifying documents for Layer 3](../incremental-graph-updates.md#identifying-documents-for-layer-3)).

| Status Code | Meaning |
|-------------|---------|
| `200` | Request processed. Inspect each `results[].success`. |
| `400` | Empty or invalid batch, corpus not built, invalid module, duplicate names or ids, file name mismatch, or File Manager fetch failure. |
| `401` | Authentication failed. |
| `403` | Access denied. |
| `409` | Another corpus mutation is running. |
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

Remove documents from an existing corpus graph. Layers 1 and 2 are updated
**synchronously**; Layer 3 cleanup runs **asynchronously** in the Importer.

Prefer stable File Manager `file_ids`. Alternatively, provide `doc_names`,
which are resolved inside the requested module. At least one of the two lists
is required.

### Request

```json
{
  "file_ids": [
    "<file-manager-file-id-1>",
    "<file-manager-file-id-2>"
  ],
  "module": "legal",
  "replicas": 2
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
| `file_ids` | string[] | Conditional | File Manager ids of the documents to delete. Required unless `doc_names` is given. |
| `doc_names` | string[] | Conditional | File names to resolve inside `module`. Required unless `file_ids` is given. |
| `module` | string | Conditional | Module the targets belong to. Required unless the project has exactly one module. |
| `replicas` | integer | No | Importer worker replicas to use for the background Layer 3 cleanup. Omit to use the service default. |

{{< info >}}
The batch is validated before anything is removed. If any target is invalid,
the request returns `400` and nothing is deleted.
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

The response confirms the Layer 1 and Layer 2 changes.
`LAYER3_DELETE_STATUS_PENDING` means the Importer is still removing the
Layer 3 documents, chunks, entities, and edges. Poll the
`importerOrchestration` status in your platform project metadata until it
reports `completed` or `failed`.

{{< warning >}}
Layer 1 and Layer 2 deletion is not rolled back if the Layer 3 cleanup fails.
{{< /warning >}}

After Layer 3 cleanup finishes, AutoGraph recomputes divergence for each
affected partition and stamps `divergence_score` and `needs_reclustering` onto
the per-file outcome in that pollable status.

| Status Code | Meaning |
|-------------|---------|
| `200` | Layer 1 and Layer 2 results returned. Inspect `layer3_overall_status`. |
| `400` | Missing or duplicate identifiers, invalid module, target missing, or target belongs to another module. Nothing is deleted. |
| `401` | Authentication failed. |
| `403` | Access denied. |
| `409` | Another corpus mutation is running. |
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

Replace the content of documents that are already in the graph. Runs
**asynchronously**.

Every target must already exist and belong to the requested module. A single
invalid target rejects the whole batch before anything is mutated.

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

As with insert, supply either base64 `content` or a File Manager `file_id`. Use
`file_id` if you intend to materialize the replacement in Layer 3, because
targeted orchestration can only name documents that have one (see
[Identifying documents for Layer 3](../incremental-graph-updates.md#identifying-documents-for-layer-3)).

### Immediate response

```json
{
  "update_id": "update_1721840400_a1b2c3d4",
  "accepted": true,
  "message": "Update started",
  "results": []
}
```

`accepted: true` means the update was validated and dispatched, not that it
finished. Poll the `importerOrchestration` slot in your platform project
metadata. The phases are:

1. `DELETE_L12` - remove the old source and corpus-graph data.
2. `DELETE_L3` - wait for the Importer to remove the old knowledge-graph data.
3. `INSERT_L12` - insert the replacement and reassign its cluster.
4. `DONE` - terminal success or failure.

A terminal status message looks like this:

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
| `file` | The document this outcome refers to. |
| `result` | Per-file outcome, for example `updated`. |
| `cluster` / `previous_cluster` | Cluster assigned to the replacement, and the cluster the old version belonged to. |
| `partition` | Layer 3 partition of the new cluster. |
| `divergence_score` | Partition divergence after the delete and insert legs (gross churn). See [Partition divergence and reclustering](../incremental-graph-updates.md#partition-divergence-and-reclustering). |
| `needs_reclustering` | `true` when the score exceeds the partition threshold. AutoGraph does not recluster automatically. |

Update waits for the old Layer 3 data to be cleaned up before re-inserting,
which avoids old and new knowledge-graph data coexisting. It is still not a
database transaction.

{{< warning >}}
If the delete leg succeeds but the insert leg fails, the document stays
removed. Fix the underlying problem and restore it with
`POST /v1/graph/insert`.
{{< /warning >}}

After a successful update, run targeted orchestration to import the
replacement into Layer 3.

| Status Code | Meaning |
|-------------|---------|
| `200` | Update validated and dispatched. Poll for completion. |
| `400` | Empty or invalid batch, invalid module, or a target that is not already in the graph. |
| `401` | Authentication failed. |
| `403` | Access denied. |
| `409` | Another corpus mutation is running. |
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

Schedule Layer 3 reclustering for one or more **FullGraphRAG** partitions.
Returns a scheduling status immediately; the work itself runs
**asynchronously**.

Call this when an insert, delete, or update outcome - or the partition's `rags`
profile - reports `needs_reclustering: true` and you decide that refreshing the
communities is worth the cost. AutoGraph never starts a recluster on its own.

Only FullGraphRAG partitions have a community layer to rebuild. A VectorRAG
partition holds no `Entities` or `Communities`, so there is nothing for a
recluster to rebuild, and such a partition is never flagged for reclustering in
the first place. See [Partition divergence and
reclustering](../incremental-graph-updates.md#partition-divergence-and-reclustering).

### Request

```json
{
  "partition_ids": ["legal_0_a", "engineering_0_a"]
}
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `partition_ids` | string[] | Yes | One or more `rag_partition_id` values, for example from an IGU response. At least one non-blank id is required; duplicates are ignored. |

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
| `results[].rag_partition_id` | Partition this scheduling result refers to. |
| `results[].accepted` | `true` when a recluster was scheduled, or coalesced into a recluster already in flight for the same partition. |
| `results[].error_message` | Set when that partition could not be scheduled, for example because the id was blank. |

`accepted: true` means the work was **queued**, not that reclustering finished.
Poll the `importerOrchestration` slot in your platform project metadata for
running, completed, or failed progress. On success, AutoGraph resets the
partition's divergence: `divergence_score` becomes `0`,
`needs_reclustering` becomes `false`, and a new baseline is adopted. On
failure, the score and the flag are left unchanged so you can retry.

| Status Code | Meaning |
|-------------|---------|
| `200` | Request processed. Inspect each `results[].accepted`. |
| `400` | Missing or empty `partition_ids`. |
| `401` | Authentication failed. |
| `403` | Access denied. |
| `500` | Server error. |

**Notes:**

- A recluster for a partition that is already in flight **coalesces** - a
  second request does not spawn a second Importer job for that partition.
- Reclustering claims the same service-wide mutation slot as build, insert,
  update, and delete, so it does not run concurrently with those operations.
- A failed or skipped recluster does not clear `needs_reclustering`. Trigger it
  again when the slot is free.
- For what the Importer actually does during a recluster, and how long it
  takes, see
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

The calls below assume the corpus graph has already been built.

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

After an insert or a successful update, run targeted orchestration so Layer 3
includes the new content:

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

If an outcome reports `needs_reclustering: true` for a partition, reclustering
is optional and manual:

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "partition_ids": ["legal_0_a"]
  }' \
  https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/graph/recluster
```

Poll `importerOrchestration` in your project metadata until the recluster
finishes. On success, the partition's `divergence_score` resets to `0` and
`needs_reclustering` clears.

## Troubleshooting

- **Insert succeeded but the document is missing from Layer 3.** Insert only
  updates Layers 1 and 2. Run targeted orchestration with the returned
  `rag_partition_id` and the new `file_id`.
- **The insert or update result has no `file_id`.** The call used inline
  `content`, which produces no File Manager id, so there is nothing to name in
  the `file_ids` of a targeted orchestration. See [Identifying documents for
  Layer 3](../incremental-graph-updates.md#identifying-documents-for-layer-3).
- **Delete returned `LAYER3_DELETE_STATUS_PENDING`.** Expected. Layers 1 and 2
  are complete and the Layer 3 cleanup is running in the background. Poll
  `importerOrchestration` in your project metadata.
- **Update returned `accepted: true` but the document has not changed yet.**
  Update is asynchronous. Poll `importerOrchestration` until the JSON message
  reports `phase: "DONE"`.
- **Update failed and the source is gone.** The delete leg committed but the
  insert leg failed. Fix the input or the dependency problem and restore the
  document with `POST /v1/graph/insert`.
- **An IGU call returns `409`.** Another corpus mutation (build, insert,
  update, delete, or recluster) holds the service-wide mutation slot. Wait for
  it to finish and retry.
- **`needs_reclustering: true` after an insert, delete, or update.** The
  partition's divergence score exceeded its threshold (25% by default).
  Nothing is reclustered automatically - call `POST /v1/graph/recluster` with
  the `rag_partition_id` when you want the communities refreshed.
- **An insert showed a low `divergence_score`, then the flag flipped later.**
  Expected. The insert response can be computed before the Layer 3 entities
  exist; the authoritative score is written after targeted orchestration.
- **Recluster was accepted but `needs_reclustering` is still `true`.** The
  scheduling succeeded, but the background job may still be running or may have
  failed. Poll `importerOrchestration`. A failed recluster does not clear the
  flag, so you can retry.

## Next Steps

- **[Retriever Setup](../../retriever/)**: Query your built knowledge graphs
- **[Monitor Results](../../importer/verify-and-explore.md)**: Verify import success
- **[Incremental Graph Updates](../incremental-graph-updates.md)**: When to use the `/v1/graph/*` endpoints, and how partition divergence is measured
- **[Design Guide - Modules to partitions](../design-guide.md#how-modules-become-a-partitioned-knowledge-graph)**: How module names flow into partition IDs
- **[Error Handling](error-handling.md)**: HTTP codes and general troubleshooting
