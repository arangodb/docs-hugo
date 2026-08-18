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

{{< info >}}
The endpoints on this page scope documents by **category**. A category is the
second scope level of a project and carries the label you set as `module` when
you imported the files, see
[Import files](importing-files.md#parameters). The orchestrate request takes a
list of them in `categories`, and the `/v1/graph/*` endpoints take a single one
in `category`.
{{< /info >}}

## Trigger Orchestration

{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/orchestrate" >}}

Spawn GraphRAG importer workers for all strategy profiles. Called after RAG strategizer is completed.

**Recommended path:** Call after a successful corpus build and strategizer run, when `rags` is non-empty. This is the final step of the standard workflow. Omit `categories` to process every strategy profile; list category labels to scope the run to those categories. Do not overlap with an active build (`409`).

{{< tip >}}
**Targeted orchestration is driven by `file_ids` alone.** When `file_ids` is
non-empty, the run is narrowed to the strategized clusters that actually contain
those File Manager ids, and each of those partitions imports only those ids. You
do not name the partitions, and there is no parameter for doing so. A
strategized partition whose intersection with `file_ids` is empty is skipped as a
completed no-op, not a failure. This is how an
[incremental graph update](../incremental-graph-updates.md) adds a newly
inserted or replaced document to Layer 3 without processing the whole partition
again.
{{< /tip >}}

### Request

```json
{
  "project": "my_project",
  "replicas": 3,
  "max_retries": 3,
  "categories": ["legal", "finance"],
  "importer_env": {
    "CUSTOM_ENV": "value"
  }
}
```

### Parameters

| Parameter | Type | Required | Description | Recommended value |
|-----------|------|----------|-------------|-------------------|
| `project` | string | Yes | The platform project that holds the corpus. It has to match the project the service runs against, otherwise the request is rejected with `400`. | The project name of your deployment. Send it in **every** orchestrate request. |
| `replicas` | integer | Yes | Number of Importer worker replicas (parallelism). Minimum: **1**. | **2–4** for typical jobs. Scale up only if you have many partitions and capacity. |
| `max_retries` | integer | No | Retries per failed Importer job before giving up. | **3** (default) is appropriate for transient errors. |
| `chat_secret_profile_ids` | string[] | No | Platform secret profile ids for chat keys. | Provide one or more secret profile IDs. Follow your operator's convention. Raw chat keys are not accepted on this endpoint. |
| `embedding_secret_profile_id` | string | No | Secret profile for embedding key on the Importer. | Set when embedding must come from vault, not env. |
| `importer_env` | map | No | Extra environment variables for Importer pods (e.g. model names, timeouts). | Start **empty**; add only keys documented for your Importer version (often chunk or model overrides). |
| `categories` | string[] | No | If **non-empty**, only the strategy profiles of the listed categories are orchestrated. A category is a bare category label, such as `legal`, not a partition id. | **Omit or `[]`** for the full corpus. This is the coarsest scoping level; there is no way to single out one partition of a category. |
| `file_ids` | string[] | No | If **non-empty**, the run is narrowed to the strategized clusters that contain these File Manager ids, and each of those partitions imports only those ids. | **Omit** for a normal build. Use it after an [incremental graph update](../incremental-graph-updates.md) to import only the documents that changed. |

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

Orchestration runs in the background. The counters start at zero in this immediate
response. Poll
[`GET /v1/orchestrate/{orchestration_id}`](#monitor-an-orchestration) for the
per-partition results, or watch your platform's job tracking and service logs.

| Field | Meaning | Typical use |
|-------|---------|-------------|
| `orchestration_id` | Id for this orchestration run. | Log for correlation with support / metadata. |
| `success` | **`true`** if the background pipeline was scheduled. | Treat as "accepted", not "all Importer jobs finished". |
| `message` | e.g. **`Orchestration started`**. | Display to operators. |
| `total_jobs` / `completed_jobs` / `failed_jobs` / `job_results` | Counters and per-partition results. | Often remain at initial values on this first response. Read the populated values from [`GET /v1/orchestrate/{orchestration_id}`](#monitor-an-orchestration). |

| Status Code | Meaning |
|-------------|---------|
| `200` | Orchestration started |
| `400` | `project` is missing, or does not name the project the service runs against |
| `401` | Authentication failed |
| `409` | Another orchestration or build is in progress, or none of the `file_ids` matched anything (`NoMatchingFilesError`) |
| `500` | Server error |

{{< info >}}
**`409` has two causes.** Besides an overlapping orchestration or build, a
request whose `file_ids` match **nothing at all** is rejected with a
`NoMatchingFilesError`. The body sorts every unmatched id into a reason, so read
those before you retry:

| Reason | Meaning |
|--------|---------|
| `not_in_project` | The id does not belong to the requested `project`. |
| `not_in_any_cluster` | The document is in the project, but no cluster contains it. |
| `cluster_not_strategized` | The cluster that holds it has no strategy profile yet. Run the RAG Strategizer. |
| `outside_requested_categories` | The id matches, but its category is not in `categories`. |
| `corpus_has_no_file_id_stamps` | The corpus was built without File Manager ids, so nothing can be matched by id at all. |

A request that matches **some** of its ids is not rejected. The unmatched ids are
reported and the run continues with the rest.
{{< /info >}}

### HTTP Example

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"project": "my_project", "replicas": 2, "max_retries": 3}' \
  https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/orchestrate
```

## Monitor an orchestration

{{< endpoint "GET" "https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/orchestrate/{orchestration_id}" >}}

Returns the status of the orchestration run that
[`POST /v1/orchestrate`](#trigger-orchestration) started, using the
`orchestration_id` from its response. This is where the per-partition results
of the run become visible, including the **authoritative partition divergence**.

Each entry of `job_results` reports one Importer job, that is, one strategized
partition. For a **FullGraphRAG** partition, the entry carries the
`divergence_score` and `needs_reclustering` of that partition, measured after the
job has created its Layer 3 entities. This is the value to act on, not the one
from an insert or update response, see
[Where to read the score](../incremental-graph-updates.md#where-to-read-the-score).

{{< warning >}}
**The status is held in memory only, and one run at a time.** Starting a new
`POST /v1/orchestrate` **evicts the previous run immediately**, so read the
results of a run before you start the next one. There is no history to go back
to. An `orchestration_id` that was never issued, or that has been evicted this
way, returns `404`.

The durable copy of the divergence lives on the partition's `rags` strategy
profile, see [Where the values are
stored](../incremental-graph-updates.md#where-the-values-are-stored). Read it
from there if you need the state after the run has been evicted.
{{< /warning >}}

| Status Code | Meaning |
|-------------|---------|
| `200` | The status of the run is returned. |
| `401` | Authentication failed. |
| `404` | Unknown `orchestration_id`, or the run has been evicted by a later orchestration. |
| `500` | Server error. |

### HTTP Example

```bash
curl -H "Authorization: Bearer <token>" \
  https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/orchestrate/orch_1711812345_a1b2c3d4
```

## Insert documents

{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/graph/insert" >}}

Adds documents that are not in the graph yet. The call is **synchronous**.

The corpus and the target category have to exist already. If the project has
exactly one category, you can omit `category`. Otherwise, it is required.

### Request

Every document is identified by its File Manager `file_id`. Insert takes no
inline content, so upload the document with
[`POST /_platform/filemanager/_db/{database}/rag-input`](../../../platform-suite/file-manager/api.md)
first and pass the returned ID.

```json
{
  "files": [
    {
      "doc_name": "new-contract.pdf",
      "file_id": "<file-manager-file-id>"
    }
  ],
  "category": "legal"
}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `files` | object[] | Yes | The documents to insert. The list cannot be empty and cannot contain duplicate `doc_name` or `file_id` values. |
| `files[].doc_name` | string | Yes | The file name of the document. It has to match the File Manager file name of `file_id`. |
| `files[].file_id` | string | Yes | The File Manager ID to get the document from. Every entry needs one. If any entry is missing it, the whole batch is rejected with `400` and a message that lists the offending `doc_name` values. |
| `category` | string | Conditional | The target category. Required unless the project has exactly one category. |

There is no `citable_url` request field. AutoGraph reads the citable URL from the
`custom_metadata` of the File Manager file and validates it the same way a
[corpus build](importing-files.md#parameters) does, so it has to be an
`http` or `https` URL with valid characters. Set it on the file when you upload
it.

### Response

```json
{
  "results": [
    {
      "doc_name": "new-contract.pdf",
      "success": true,
      "cluster_key": "cluster_legal_0",
      "rag_partition_id": "legal_0_a"
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
| `file_id` | The File Manager ID of the inserted document. Use this value in the `file_ids` of your targeted orchestration. |

{{< info >}}
**The insert response carries no divergence.** The score is deliberately left off,
because at this point it would be premature: it is measured on Layers 1 and 2,
before the targeted orchestration has created the insert's Layer 3 entities. Read
the authoritative value from
[`GET /v1/orchestrate/{orchestration_id}`](#monitor-an-orchestration) once the
orchestration has run. See [Where to read the
score](../incremental-graph-updates.md#where-to-read-the-score).
{{< /info >}}

Insert extracts the text, creates an embedding, stores the source, assigns the
closest existing cluster, and adds the membership and similarity edges. It only
updates **Layers 1 and 2**. To add the document to Layer 3, run a targeted
orchestration with its `file_id`. AutoGraph resolves the partition itself, so you
do not pass one. Because every insert is keyed by a File Manager ID, an inserted
document is always targetable, see
[Identifying documents for Layer 3](../incremental-graph-updates.md#identifying-documents-for-layer-3).

| Status Code | Meaning |
|-------------|---------|
| `200` | The request has been processed. Check the `success` of every entry in `results`. |
| `400` | Empty or invalid batch, a missing `file_id` on any entry, corpus not built, invalid category, duplicate names or IDs, file name mismatch, or the file could not be retrieved from the File Manager. |
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
      "doc_name": "new-contract.pdf",
      "file_id": "<file-manager-file-id>"
    }],
    "category": "legal"
  }' \
  https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/graph/insert
```

## Delete documents

{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/graph/delete" >}}

Removes documents from an existing corpus graph. The call is **synchronous** and
performs the whole removal itself. It cleans up **Layer 3 first**, then Layers 1
and 2. No Importer worker is involved, and there is no background job to wait
for. The response is the final result.

Use File Manager IDs in `file_ids` if you can, as they are stable. Otherwise,
provide `doc_names`, which are looked up in the requested category. You need to
provide at least one of the two lists.

### Request

```json
{
  "file_ids": [
    "<file-manager-file-id-1>",
    "<file-manager-file-id-2>"
  ],
  "category": "legal"
}
```

By file name instead:

```json
{
  "doc_names": ["old-contract.pdf"],
  "category": "legal"
}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `file_ids` | string[] | Conditional | The File Manager IDs of the documents to delete. Required unless you provide `doc_names`. |
| `doc_names` | string[] | Conditional | The file names to look up in `category`. Required unless you provide `file_ids`. |
| `category` | string | Conditional | The category the documents belong to. Required unless the project has exactly one category. |

{{< info >}}
The batch is validated before anything is removed. If one of the documents is
invalid, the request returns `400` and nothing is deleted.
{{< /info >}}

{{< info >}}
**Delete has no replica setting, because it has no workers.** AutoGraph removes
the Layer 3 data itself, with AQL queries against the knowledge graph, as part
of this request. There are no Importer jobs to spawn or to scale, unlike an
[orchestration](#trigger-orchestration).
{{< /info >}}

### Response

```json
{
  "delete_id": "delete_1711812345_a1b2c3d4",
  "results": [
    {
      "file_id": "<file-manager-file-id-1>",
      "status": "LAYER2_DELETE_STATUS_SUCCESS",
      "rag_partition_id": "legal_0_a",
      "cluster_key": "cluster_legal_0",
      "similarity_edges_removed": 4,
      "divergence_score": 0.31,
      "needs_reclustering": true
    }
  ],
  "affected_rag_partitions": ["legal_0_a"],
  "removed_rag_partitions": [],
  "affected_cluster_ids": ["cluster_legal_0"],
  "removed_cluster_ids": [],
  "layer3_results": [
    {
      "status": "LAYER3_DELETE_STATUS_SUCCESS"
    }
  ],
  "overall_status": "COMMITTED"
}
```

The response reports the outcome of the complete deletion, Layer 3 included.
There is no `importerOrchestration` entry to poll, because a standalone delete
does not write one.

| Field | Meaning |
|-------|---------|
| `delete_id` | The id of this deletion, and the key of the concurrency lock it holds. Log it, so that you can correlate a `409` from a parallel call with the deletion that was holding the lock. |
| `overall_status` | How the deletion as a whole ended, see the table below. |
| `results` | The Layer 1 and Layer 2 result of every file, with the cluster and partition it belonged to, the number of similarity edges that were removed, and the divergence of the partition. |
| `layer3_results` | The Layer 3 result of the cleanup, with its `status` and the counts of what was removed. The counts are AutoGraph's own AQL totals, not Importer figures. |
| `affected_rag_partitions` / `affected_cluster_ids` | The partitions and clusters the deletion touched. |
| `removed_rag_partitions` / `removed_cluster_ids` | The partitions and clusters that became empty and have been dropped. |

**`overall_status`** covers both stages and tells you whether you can retry:

| Value | Meaning |
|-------|---------|
| `COMMITTED` | The deletion succeeded. Layer 3 and Layers 1 and 2 are both done. |
| `ROLLED_BACK` | Something failed, and the state from before the call has been **fully restored**. The documents are still in the graph, and it is safe to retry the same batch. |
| `FAILED` | Something failed and the restore itself was **incomplete**. Do not simply retry. Inspect the corpus and the knowledge graph before you call again. |

The `status` of a `layer3_results` entry is one of `LAYER3_DELETE_STATUS_SUCCESS`,
`LAYER3_DELETE_STATUS_FAILED`, `LAYER3_DELETE_STATUS_NOT_ATTEMPTED`, or
`LAYER3_DELETE_STATUS_UNSPECIFIED`.

{{< info >}}
**`NOT_ATTEMPTED` is a success case.** It means there were no knowledge graph
collections for the deletion to work on, so there was nothing to clean up. The
Layer 1 and Layer 2 removal still goes ahead, and `overall_status` can still be
`COMMITTED`. Treat it as "nothing to do", not as an error.
{{< /info >}}

{{< tip >}}
**A failed deletion is rolled back.** AutoGraph snapshots the Layer 3 data before
it removes anything. If the Layer 3 cleanup fails, the snapshot is restored and
Layers 1 and 2 are never touched. If Layer 1 or Layer 2 then fails, the Layer 3
snapshots are restored as well. A deletion that unwinds this way reports
`ROLLED_BACK`, and the same batch is safe to send again. Only `FAILED` means the
restore did not complete.
{{< /tip >}}

When the deletion **commits**, AutoGraph calculates the divergence of every
affected partition again and stamps `divergence_score` and `needs_reclustering`
onto the result of each file. The fields are only present if `overall_status` is
`COMMITTED`. A deletion that ends in `ROLLED_BACK` or `FAILED` writes no score.
See
[Where to read the score](../incremental-graph-updates.md#where-to-read-the-score).

| Status Code | Meaning |
|-------------|---------|
| `200` | The deletion has been processed. Check `overall_status` and the `status` of every entry in `results`. |
| `400` | Missing or duplicate identifiers, invalid category, a document does not exist, or it belongs to another category. Nothing is deleted. |
| `401` | Authentication failed. |
| `403` | Access denied. |
| `409` | Another operation is currently changing the corpus. The `delete_id` of the deletion that holds the lock lets you correlate the two calls. |
| `500` | Server error. |
| `503` | A required dependency is temporarily unavailable. |

### HTTP example

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "file_ids": ["<file-manager-file-id>"],
    "category": "legal"
  }' \
  https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/graph/delete
```

## Update documents

{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/graph/update" >}}

Replaces the content of documents that are already in the graph. The call is
**asynchronous**.

Every document has to exist and belong to the requested category. A single
invalid document makes the whole batch fail before anything is changed.

### Request

Like an insert, every document is identified by its File Manager `file_id`.
Update takes **no inline content**: the replacement is always read back from the
File Manager. Upload the new version with
[`POST /_platform/filemanager/_db/{database}/rag-input`](../../../platform-suite/file-manager/api.md)
and pass the returned ID.

```json
{
  "files": [
    {
      "doc_name": "existing-contract.txt",
      "file_id": "<file-manager-file-id>"
    }
  ],
  "category": "legal"
}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `files` | object[] | Yes | The documents to replace. The list cannot be empty and cannot contain duplicate `doc_name` or `file_id` values. |
| `files[].doc_name` | string | Yes | The file name of the document to replace. It has to match the File Manager file name of `file_id`. |
| `files[].file_id` | string | Yes | The File Manager ID to get the new version from. Every entry needs one. If any entry is missing it, the whole batch is rejected with `400` and a message that lists the offending `doc_name` values. |
| `category` | string | Conditional | The category the documents belong to. Required unless the project has exactly one category. If you omit it in a project with a single category, the `doc_name` values are looked up in that category before anything is changed. |

Update still accepts the **deprecated** `module` field, which is only honored
when `category` is empty. Send `category`. Insert and delete have no `module`
field at all.

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

1. `DELETE_L3`: AutoGraph removes the old knowledge graph data with AQL queries
   of its own. This is synchronous, and no Importer is involved.
2. `DELETE_L12`: Removes the old source and the corpus graph data.
3. `INSERT_L12`: Inserts the new version and assigns a cluster to it.
4. `DONE`: The update has succeeded or failed.

The order is **Layer 3 first**, for the same reason as a standalone
[delete](#delete-documents): an update reuses the same deletion core, which
snapshots and removes the knowledge graph data before it touches Layers 1 and 2.

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
      "file_id": "<file-manager-file-id>",
      "error": ""
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
| `file_id` | The File Manager ID of the new version. Use it in the `file_ids` of the targeted orchestration, and to add the document again with [insert](#insert-documents) if the update left it removed. |
| `error` | Set if this file failed. Empty otherwise. |

{{< warning >}}
**Check every file, not only the top-level `status`.** A run can report
`status: "completed"` while an individual entry of `files[]` carries an `error`.
Read the `result` and `error` of each file before you treat the update as done.
{{< /warning >}}

{{< info >}}
**The update status carries no divergence either**, and for the same reason as
[insert](#insert-documents): the new version only reaches Layer 3 through a
targeted orchestration, so any score written here would predate the entities it
is supposed to measure. Read it from
[`GET /v1/orchestrate/{orchestration_id}`](#monitor-an-orchestration) afterwards.
{{< /info >}}

An update waits for the old Layer 3 data to be removed before it inserts the new
version, so that old and new knowledge graph data do not exist side by side. It
is still not a database transaction.

{{< warning >}}
If the deletion succeeds but the insertion fails, the document stays removed.
Fix the underlying problem and add it again with `POST /v1/graph/insert`, using
the `file_id` from the entry of that file.
{{< /warning >}}

After a successful update, run a targeted orchestration to import the new
version into Layer 3.

| Status Code | Meaning |
|-------------|---------|
| `200` | The update has been validated and started. Poll for the result. |
| `400` | Empty or invalid batch, a missing `file_id` on any entry, invalid category, or a document that is not in the graph. |
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
      "file_id": "<file-manager-file-id>"
    }],
    "category": "legal"
  }' \
  https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/graph/update
```

## Trigger reclustering

{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/graph/recluster" >}}

Schedules a Layer 3 reclustering for up to five **FullGraphRAG** partitions. The
call returns right away and reports whether each partition was taken up, which is
weaker than a queue position, see the response below. The reclustering itself runs
**asynchronously**, and only one runs at a time.

Call this endpoint if `needs_reclustering: true` is reported for a partition and
you decide that refreshing the communities is worth the cost. AutoGraph never
starts a reclustering on its own. The flag is reported by
[`GET /v1/orchestrate/{orchestration_id}`](#monitor-an-orchestration), by a
[delete](#delete-documents) once its Layer 3 cleanup has committed, and by the
`rags` profile of the partition. Insert and update responses do not report it,
see [Where to read the
score](../incremental-graph-updates.md#where-to-read-the-score).

Only FullGraphRAG partitions have a community layer that can be rebuilt. A
VectorRAG partition has no `Entities` or `Communities`, so there is nothing to
rebuild, and such a partition is never flagged for reclustering in the first
place.

**How the flag you are reacting to is calculated.** The `divergence_score` is the
higher of two signals, both measured on the `Entities` of the partition:

```text
divergence_score = max(gross_churn_score, multi_batch_score)

gross_churn_score = cumulative_churn / baseline_entity_count
multi_batch_score = (total_entities - largest_batch) / total_entities
```

- **Gross churn** counts every entity that has been added **and** deleted since
  the last clustering, gross rather than net. A same-size replacement therefore
  still counts: an update that removes 100 entities and adds 100 new ones adds
  about 200 to the churn, not 0. The `baseline_entity_count` is the entity count
  at the last successful clustering or reclustering.
- **Multi-batch spread** groups the entities by `import_number`, takes the
  **largest** batch as the stable baseline, and counts everything outside it as
  changed. A partition with a single batch, or with no entities, scores `0` here.

`needs_reclustering` is set when the score is **strictly above** the threshold,
which is `0.25` and not configurable. For the baseline bootstrap, worked
examples, and the lifecycle of the values, see [Partition divergence and
reclustering](../incremental-graph-updates.md#partition-divergence-and-reclustering).

{{< warning >}}
**Plan a reclustering as a maintenance operation.** It holds the single
service-wide mutation slot for its entire run, which can take up to **3600
seconds**, and blocks every corpus build, insert, update, and delete until it is
done. Partitions are reclustered one after another, so a request for several of
them blocks writes for roughly the sum of their run times. Run it in a window
where nothing else has to write to the corpus.
{{< /warning >}}

### Request

```json
{
  "partition_ids": ["legal_0_a", "engineering_0_a"]
}
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `partition_ids` | string[] | Yes | One or more `rag_partition_id` values, for example from the response of an insert, delete, or update. At least one non-empty ID is required, and **at most five**. Duplicates are ignored. |

{{< info >}}
**Five partitions per request is a hard cap.** A request that lists more than
five `partition_ids` is rejected with `400`, and nothing is reclustered. Split
larger sets into several requests. They still run one at a time, so splitting
does not make them faster.
{{< /info >}}

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
| `results[].accepted` | `true` if the request for this partition was taken up, or if it has been merged into a reclustering that is already running for this partition. It does **not** mean the work is queued, see the warning below. |
| `results[].error_message` | Set if the reclustering could not be scheduled for this partition, for example because the ID is empty. |

{{< warning >}}
**`accepted: true` is not a queue position.** Reclusterings are serialized. Only
one runs at a time, and there is no queue behind it. A partition whose peer holds
the mutation slot makes about **ten attempts, one second apart**, to claim it and
then gives up. It is left flagged `needs_reclustering`, so that you can trigger
it again later. The response reports `accepted: true` for those partitions too,
which means it tells you nothing about whether they actually ran.
{{< /warning >}}

Read the per-partition outcome from the **`rags` strategy profile**, not from
`importerOrchestration`. The `importerOrchestration` entry in your project
metadata carries the status of the job that holds the slot. It is *not* a
per-partition ledger, and a partition that gave up waiting is never published
there at all, so it is invisible in that slot. The `rags` node of the partition
is authoritative:

| Field on the `rags` node | After a successful reclustering |
|--------------------------|---------------------------------|
| `needs_reclustering` | Cleared to `false` |
| `last_reclustered_at` | Set to the time of the run |
| `divergence_score` | Reset to `0`, and a new baseline is taken |

If `needs_reclustering` is still `true` and `last_reclustered_at` has not moved,
the partition was not reclustered, whether it failed or never got the slot.
Trigger it again. See [Where the values are
stored](../incremental-graph-updates.md#where-the-values-are-stored).

| Status Code | Meaning |
|-------------|---------|
| `200` | The request has been processed. Check the `accepted` value of every entry in `results`. |
| `400` | `partition_ids` is missing or empty, it lists more than five partitions, or the project runs on **Triton**, which cannot be reclustered (gRPC `FAILED_PRECONDITION`). |
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
- **Triton projects can never be reclustered.** The request is rejected up front
  with `400`, so there is no job and nothing to poll.
- A partition **without entities** is a successful no-op. The job reports `0`
  communities over `0` entities and finishes, so a completed job is not evidence
  that anything was refreshed. Check `last_reclustered_at` and the
  `Communities` of the partition.
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
    "category": "legal"
  }' \
  https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/graph/insert

# 2. Delete an obsolete document (synchronous, Layer 3 included)
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "file_ids": ["<old-file-id>"],
    "category": "legal"
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
    "category": "legal"
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
    "project": "my_project",
    "replicas": 1,
    "file_ids": ["<new-or-updated-file-id>"]
  }' \
  https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/orchestrate
```

Then read the results of that run, which is where the divergence of each affected
partition is reported:

```bash
curl -H "Authorization: Bearer <token>" \
  https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/orchestrate/<orchestration_id>
```

If `needs_reclustering: true` is reported for a partition, by the orchestration
status above or by the delete result, you can start a reclustering. It is optional
and never automatic:

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "partition_ids": ["legal_0_a"]
  }' \
  https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/graph/recluster
```

Then read the `rags` profile of the partition. If the reclustering succeeded,
`needs_reclustering` is `false`, `last_reclustered_at` has moved, and the
`divergence_score` is back to `0`. Reclusterings run one at a time and block
every other write while they do, so send at most five partitions per request and
pick a maintenance window for them.

## Troubleshooting

- **The insert succeeded but the document is not in Layer 3.** An insert only
  updates Layers 1 and 2. Run a targeted orchestration with the new `file_id`.
- **The update was rejected with `400` and a list of `doc_name` values.** Those
  entries have no `file_id`. Update reads the replacement from the File Manager
  and takes no inline content, so every entry needs one, and one missing id
  rejects the whole batch. Upload the new version first, then send the returned
  id. See [Identifying documents for Layer
  3](../incremental-graph-updates.md#identifying-documents-for-layer-3).
- **The delete reports `overall_status: "ROLLED_BACK"`.** Something failed, and
  the state from before the call has been fully restored, so the documents are
  still in the graph. There is nothing to poll and nothing to clean up by hand.
  Fix the underlying problem and send the same batch again.
- **The delete reports `overall_status: "FAILED"`.** The restore did not complete
  either, so the corpus can be in a partial state. Do not retry blindly. Inspect
  the affected partitions and clusters first, then decide what to send again.
- **The delete reports `LAYER3_DELETE_STATUS_NOT_ATTEMPTED`.** There were no
  knowledge graph collections to clean up. This is expected for a corpus that has
  no Layer 3 yet, and it does not stop the Layer 1 and Layer 2 removal.
- **The update returned `accepted: true` but the document has not changed.**
  Updates are asynchronous. Poll `importerOrchestration` until the JSON message
  reports `phase: "DONE"`.
- **The update failed and the source document is gone.** The deletion succeeded
  but the insertion failed. Fix the input or the underlying problem and add the
  document again with `POST /v1/graph/insert`, using the `file_id` that the
  status message reports for that file.
- **A call returns `409`.** Another operation, such as a build, insert, update,
  delete, or reclustering, is using the service-wide slot. Wait for it to finish
  and try again.
- **`needs_reclustering` is `true` for a partition.** The divergence score of the
  partition is above its threshold, which is 25% and not configurable. Nothing is
  reclustered automatically. Call `POST /v1/graph/recluster` with the
  `rag_partition_id` if you want to refresh the communities.
- **The insert or update result has no `divergence_score`.** This is by design,
  not a missing field. Neither response reports a divergence, because it would be
  measured before Layer 3 holds the new entities. Read the score from
  [`GET /v1/orchestrate/{orchestration_id}`](#monitor-an-orchestration) after the
  targeted orchestration, or from the partition's `rags` profile. See
  [Where to read the score](../incremental-graph-updates.md#where-to-read-the-score).
- **The reclustering was accepted but `needs_reclustering` is still `true`.**
  `accepted: true` only means the request was taken up. The partition may still
  be running, it may have failed, or it may never have got the mutation slot:
  reclusterings are serialized, and a partition that waits behind a peer gives up
  after about ten one-second attempts. None of that clears the flag. Check
  `last_reclustered_at` on the `rags` node to tell "not yet reclustered" from
  "reclustered and drifted again", and trigger the partition again. Do not look
  for the answer in `importerOrchestration`, which only shows the job that holds
  the slot and never sees a partition that gave up waiting.
- **A recluster request returns `400`.** Either `partition_ids` is empty, or it
  lists more than five partitions, or the project runs on Triton. Triton projects
  cannot be reclustered at all.
- **A reclustering completed but the communities look unchanged.** A partition
  with no entities is a successful no-op that reports `0` communities over `0`
  entities. Confirm that the partition has `Entities` before you expect a
  refreshed community layer.

## Next Steps

- **[Retriever Setup](../../retriever/)**: Query your built knowledge graphs
- **[Monitor Results](../../importer/verify-and-explore.md)**: Verify import success
- **[Incremental Graph Updates](../incremental-graph-updates.md)**: When to use the `/v1/graph/*` endpoints and how the partition divergence is measured
- **[Design Guide - Modules to partitions](../design-guide.md#how-modules-become-a-partitioned-knowledge-graph)**: How module names flow into partition IDs
- **[Error Handling](error-handling.md)**: HTTP codes and general troubleshooting
