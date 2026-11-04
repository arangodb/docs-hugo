---
title: AutoGraph Incremental Graph Updates Reference
menuTitle: API Reference
description: >-
  Add, remove, and replace documents in the existing categories of an AutoGraph
  knowledge graph, and reorganize its communities
weight: 30
---
{{< tag "Agentic AI Suite" >}}

This page describes the endpoints of
[Incremental Graph Updates](_index.md). `POST /v1/graph/insert`, `/delete`, and
`/update` add, remove, and replace individual documents in the **existing
categories** of a graph that has already been built, and
`POST /v1/graph/recluster` reorganizes the communities of a partition that has
changed a lot. To learn when to use them and how they compare to a full
rebuild, see [Incremental Graph Updates](_index.md). For a step-by-step guide,
see the [Quick Start](quick-start.md). For how the divergence is measured, see
[Divergence and Reorganization](divergence-and-reorganization.md).

| Endpoint | Operation | Purpose | Call |
|----------|-----------|---------|------|
| [`POST /v1/graph/insert`](#add-documents) | Add | Add new documents to an existing category | Synchronous |
| [`POST /v1/graph/delete`](#remove-documents) | Remove | Remove documents that are in an existing category, with all their graph data | Synchronous |
| [`POST /v1/graph/update`](#replace-documents) | Replace | Replace documents that are in an existing category with a new version | Asynchronous |
| [`POST /v1/graph/recluster`](#reorganize-partitions) | Reorganize | Rebuild the communities of a FullGraphRAG partition that has changed a lot | Asynchronous |
| [`POST /v1/orchestrate`](#build-the-knowledge-graph-for-changed-documents) with `file_ids` | Knowledge graph build | Add the added and replaced documents to the knowledge graph | Asynchronous |

{{< info >}}
The `/v1/graph/*` endpoints scope documents by **category**, and the category
has to **exist already**. A category is the second scope level of a project and
carries the label you set as `module` when you imported the files, see
[Import files](../reference/importing-files.md#parameters). The endpoints take a
single one in `category`. They cannot create a category. To add a new one, run
the full build for it, see [When to use IGU](_index.md#when-to-use-igu).
{{< /info >}}

## Add documents

{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/graph/insert" >}}

Adds documents that are not in the graph yet to an **existing category**. The
API calls this operation **insert**. The call is **synchronous**.

The corpus and the target category have to exist already. If the project has
exactly one category, you can omit `category`. Otherwise, it is required.

### Request

Every document is identified by its File Manager `file_id`. Adding takes no
inline content, so upload the document with
[`POST /_platform/filemanager/_db/{database}/rag-input`](../../file-manager/api.md#upload-a-rag-input-file)
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
| `files` | object[] | Yes | The documents to add. The list cannot be empty, cannot contain duplicate `doc_name` or `file_id` values, and cannot hold more than **100** files per request. |
| `files[].doc_name` | string | Yes | The file name of the document. It has to match the File Manager file name of `file_id`. |
| `files[].file_id` | string | Yes | The File Manager ID to get the document from. Every entry needs one. If any entry is missing it, the whole batch is rejected with `400` and a message that lists the offending `doc_name` values. |
| `category` | string | Conditional | The existing category to add the documents to. Required unless the project has exactly one category. |

There is no `citable_url` request field. AutoGraph reads the citable URL from the
`custom_metadata` of the File Manager file and validates it the same way a
[corpus build](../reference/importing-files.md#parameters) does, so it has to be an
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
| `success` | Whether the document has been added. |
| `error_message` | Set if this file failed. The other files of the batch can still succeed. |
| `cluster_key` | The existing cluster that has been selected for the document. Can be empty if there is no suitable neighbor in a cluster. |
| `rag_partition_id` | The knowledge graph partition of the selected cluster. Can be empty if there is no strategy profile yet. |
| `file_id` | The File Manager ID of the added document. Use this value in the `file_ids` of the knowledge graph build. |

{{< info >}}
**The response carries no divergence.** At this point, it would be measured
before the knowledge graph build has created the entities of the new documents.
Read it from
[`GET /v1/orchestrate/{orchestration_id}`](../reference/orchestration.md#monitor-an-orchestration) once the
knowledge graph build has run. See
[Where to read the divergence](divergence-and-reorganization.md#where-to-read-the-divergence).
{{< /info >}}

Adding extracts the text, creates an embedding, stores the document, assigns the
closest existing cluster, and adds the membership and similarity edges. It only
changes the **corpus graph**. To add the document to the knowledge graph, start a
[knowledge graph build](#build-the-knowledge-graph-for-changed-documents) with
its `file_id`. AutoGraph resolves the partition itself, so you
do not pass one. Because every added document has a File Manager ID, it can
always be passed to the build, see
[Identifying documents for the knowledge graph](#identifying-documents-for-the-knowledge-graph).

| Status Code | Meaning |
|-------------|---------|
| `200` | The request has been processed. Check the `success` of every entry in `results`. |
| `400` | Empty or invalid batch, more than 100 files, a missing `file_id` on any entry, corpus not built, invalid category, duplicate names or IDs, file name mismatch, or the file could not be retrieved from the File Manager. |
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

## Remove documents

{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/graph/delete" >}}

Removes documents that are **already in an existing category**. The API calls
this operation **delete**. The call is **synchronous** and performs the whole
removal itself. It cleans up the knowledge graph first, then
the corpus graph. No Importer worker is involved, and there is no background job to wait
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
| `file_ids` | string[] | Conditional | The File Manager IDs of the documents to remove. Required unless you provide `doc_names`. |
| `doc_names` | string[] | Conditional | The file names to look up in `category`. Required unless you provide `file_ids`. |
| `category` | string | Conditional | The existing category the documents are in. Required unless the project has exactly one category. |

{{< info >}}
The batch is validated before anything is removed. If one of the documents is
invalid, the request returns `400` and nothing is removed.
{{< /info >}}

{{< info >}}
**Removing has no replica setting, because it has no workers.** AutoGraph removes
the knowledge graph data itself, with AQL queries, as part
of this request. There are no Importer jobs to spawn or to scale, unlike a
[knowledge graph build](#build-the-knowledge-graph-for-changed-documents).
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

The response reports the outcome of the complete deletion, knowledge graph included.
There is no `importerOrchestration` entry to poll, because a standalone removal
does not write one.

| Field | Meaning |
|-------|---------|
| `delete_id` | The ID of this deletion, and the key of the concurrency lock it holds. Log it, so that you can correlate a `409` from a parallel call with the deletion that was holding the lock. |
| `overall_status` | How the deletion as a whole ended, see the table below. |
| `results` | The corpus graph result of every file, with the cluster and partition it belonged to, the number of similarity edges that were removed, and the divergence of the partition. |
| `layer3_results` | The knowledge graph result of the cleanup, with its `status` and the counts of what was removed. The counts are AutoGraph's own AQL totals, not Importer figures. |
| `affected_rag_partitions` / `affected_cluster_ids` | The partitions and clusters the deletion touched. |
| `removed_rag_partitions` / `removed_cluster_ids` | The partitions and clusters that became empty and have been dropped. |

**`overall_status`** covers both stages and tells you whether you can retry:

| Value | Meaning |
|-------|---------|
| `COMMITTED` | The deletion succeeded in both the knowledge graph and the corpus graph. |
| `ROLLED_BACK` | Something failed, and the state from before the call has been **fully restored**. The documents are still in the graph, and it is safe to retry the same batch. |
| `FAILED` | Something failed and the restore itself was **incomplete**. Do not simply retry. Inspect the corpus and the knowledge graph before you call again. |

In field and status names, `LAYER3` refers to the knowledge graph and `LAYER2`
to the corpus graph. The `status` of a `layer3_results` entry is one of
`LAYER3_DELETE_STATUS_SUCCESS`, `LAYER3_DELETE_STATUS_FAILED`,
`LAYER3_DELETE_STATUS_NOT_ATTEMPTED`, or `LAYER3_DELETE_STATUS_UNSPECIFIED`.

{{< info >}}
**`NOT_ATTEMPTED` is a success case.** It means there were no knowledge graph
collections for the deletion to work on, so there was nothing to clean up. The
corpus graph removal still goes ahead, and `overall_status` can still be
`COMMITTED`. Treat it as "nothing to do", not as an error.
{{< /info >}}

{{< tip >}}
**A failed deletion is rolled back.** AutoGraph snapshots the knowledge graph
data before it removes anything. If the knowledge graph cleanup fails, the
snapshot is restored and the corpus graph is never touched. If the corpus graph
removal then fails, the knowledge graph
snapshots are restored as well. A deletion that unwinds this way reports
`ROLLED_BACK`, and the same batch is safe to send again. Only `FAILED` means the
restore did not complete.
{{< /tip >}}

When the deletion **commits**, AutoGraph calculates the divergence of every
affected partition again and adds `divergence_score` and `needs_reclustering`
to the result of each file. The fields are only present if `overall_status` is
`COMMITTED`. A deletion that ends in `ROLLED_BACK` or `FAILED` reports no
divergence. See
[Where to read the divergence](divergence-and-reorganization.md#where-to-read-the-divergence).

| Status Code | Meaning |
|-------------|---------|
| `200` | The deletion has been processed. Check `overall_status` and the `status` of every entry in `results`. |
| `400` | Missing or duplicate identifiers, a category that does not exist, a document that is not in the category, or a document in another category. Nothing is removed. |
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

## Replace documents

{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/graph/update" >}}

Replaces documents that are **already in an existing category** with a new
version. The API calls this operation **update**. The call is **asynchronous**.

Every document has to be in the requested category already. A single
invalid document makes the whole batch fail before anything is changed.

### Request

As when adding, every document is identified by its File Manager `file_id`.
Replacing takes **no inline content**: the replacement is always read back from the
File Manager. Upload the new version with
[`POST /_platform/filemanager/_db/{database}/rag-input`](../../file-manager/api.md#upload-a-rag-input-file)
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
| `files` | object[] | Yes | The documents to replace. The list cannot be empty and cannot contain duplicate `doc_name` or `file_id` values. Unlike adding, replacing has no per-request file cap. |
| `files[].doc_name` | string | Yes | The file name of the document to replace. It has to match the File Manager file name of `file_id`. |
| `files[].file_id` | string | Yes | The File Manager ID to get the new version from. Every entry needs one. If any entry is missing it, the whole batch is rejected with `400` and a message that lists the offending `doc_name` values. |
| `category` | string | Conditional | The existing category the documents are in. Required unless the project has exactly one category. If you omit it in a project with a single category, the `doc_name` values are looked up in that category before anything is changed. |

`POST /v1/graph/update` still accepts the **deprecated** `module` field, which
is only honored when `category` is empty. Send `category`. Insert and delete
have no `module` field at all.

### Immediate response

```json
{
  "update_id": "update_1721840400_a1b2c3d4",
  "accepted": true,
  "message": "Update started",
  "results": []
}
```

`accepted: true` means that replacing has been validated and started, not that
it is done. Poll the `importerOrchestration` entry in the metadata of your
platform project. Replacing goes through the following phases. In their
names, `L3` stands for the knowledge graph and `L12` for the corpus graph:

1. `DELETE_L3`: AutoGraph removes the old knowledge graph data with AQL queries
   of its own. This is synchronous, and no Importer is involved.
2. `DELETE_L12`: Removes the old document from the corpus graph.
3. `INSERT_L12`: Inserts the new version into the corpus graph and assigns a
   cluster to it.
4. `DONE`: Replacing has succeeded or failed.

The knowledge graph is cleaned up first, for the same reason as in a standalone
[removal](#remove-documents): replacing reuses the same removal logic, which
snapshots and removes the knowledge graph data before it touches the corpus
graph.

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
      "file_id": "<file-manager-file-id>"
    }
  ]
}
```

| Field in `files[]` | Meaning |
|--------------------|---------|
| `file` | The document this result refers to. |
| `result` | The result for this file, for example `updated`. |
| `cluster` / `previous_cluster` | The cluster that is assigned to the new version, and the cluster the old version belonged to. |
| `partition` | The knowledge graph partition of the new cluster. |
| `file_id` | The File Manager ID of the new version. Use it in the `file_ids` of the knowledge graph build, and to add the document again with [insert](#add-documents) if replacing left it removed. |
| `error` | Present only if this file failed. |

Only `file` and `result` are always present. The service adds every other key
conditionally, so read them as absent rather than empty when the value does not
apply.

{{< warning >}}
**Check every file, not only the top-level `status`.** A run can report
`status: "completed"` while an individual entry of `files[]` carries an `error`.
Read the `result` and `error` of each file before you treat the replacement as done.
{{< /warning >}}

{{< info >}}
**The status carries no divergence either**, for the same reason as when
[adding](#add-documents): the new version only reaches the knowledge graph through a
knowledge graph build, so any score written here would predate the entities it
is supposed to measure. Read it from
[`GET /v1/orchestrate/{orchestration_id}`](../reference/orchestration.md#monitor-an-orchestration) afterwards.
{{< /info >}}

Replacing waits for the old knowledge graph data to be removed before it adds the new
version, so that old and new knowledge graph data do not exist side by side. It
is still not a database transaction.

{{< warning >}}
If removing the old version succeeds but adding the new one fails, the document
stays removed.
Fix the underlying problem and add it again with `POST /v1/graph/insert`, using
the `file_id` from the entry of that file.
{{< /warning >}}

After the documents have been replaced, start a
[knowledge graph build](#build-the-knowledge-graph-for-changed-documents) to
import the new version into the knowledge graph.

| Status Code | Meaning |
|-------------|---------|
| `200` | Replacing has been validated and started. Poll for the result. |
| `400` | Empty or invalid batch, a missing `file_id` on any entry, a category that does not exist, or a document that is not in the category. |
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

## Reorganize partitions

{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/graph/recluster" >}}

Rebuilds the communities of up to five **FullGraphRAG** partitions from their
current entities. The API calls this operation **recluster**. The call returns
right away and reports whether each partition was taken up, which is weaker
than a queue position, see the response below. Reorganizing itself runs
**asynchronously**, and only one partition is reorganized at a time.

Call this endpoint if `needs_reclustering: true` is reported for a partition and
you decide that rebuilding its communities is worth the cost. AutoGraph never
reorganizes on its own. The flag is reported by
[`GET /v1/orchestrate/{orchestration_id}`](../reference/orchestration.md#monitor-an-orchestration), by a
[removal](#remove-documents) once it has committed, and by the
`rags` profile of the partition. Adding and replacing do not report it,
see [Where to read the
divergence](divergence-and-reorganization.md#where-to-read-the-divergence).

Only FullGraphRAG partitions have communities that can be rebuilt. A
VectorRAG partition has no `Entities` or `Communities`, so there is nothing to
rebuild, and such a partition is never flagged in the first place.

The flag is set when the `divergence_score` is **strictly above** the threshold,
which is `0.25` and not configurable. For how the divergence is calculated,
with examples, and how the values change over time, see
[Divergence and Reorganization](divergence-and-reorganization.md).

{{< warning >}}
**Plan reorganizing as a maintenance operation.** It holds the single
service-wide mutation slot for its entire run, which can take up to **3600
seconds**, and blocks every corpus build and every addition, removal, and
replacement until it is done. Partitions are reorganized one after another, so
a request for several of them blocks changes for roughly the sum of their run
times. Run it in a window where nothing else has to change the corpus.
{{< /warning >}}

### Request

```json
{
  "partition_ids": ["legal_0_a", "engineering_0_a"]
}
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `partition_ids` | string[] | Yes | One or more `rag_partition_id` values, for example from the response of an addition, removal, or replacement. At least one non-empty ID is required, and **at most five**. Duplicates are ignored. |

{{< info >}}
**Five partitions per request is a hard cap.** A request that lists more than
five `partition_ids` is rejected with `400`, and nothing is reorganized. Split
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
| `results[].accepted` | `true` if the request for this partition was taken up, or if it has been merged into a reorganization that is already running for this partition. It does **not** mean the work is queued, see the warning below. |
| `results[].error_message` | Set if reorganizing could not be scheduled for this partition, for example because the ID is empty. |

{{< warning >}}
**`accepted: true` is not a queue position.** Partitions are reorganized one at
a time, and there is no queue behind it. A partition whose peer holds
the mutation slot makes about **ten attempts, one second apart**, to claim it and
then gives up. It is left flagged `needs_reclustering`, so that you can trigger
it again later. The response reports `accepted: true` for those partitions too,
which means it tells you nothing about whether they actually ran.
{{< /warning >}}

Read the per-partition outcome from the **`rags` strategy profile**, not from
`importerOrchestration`. The `importerOrchestration` entry in your project
metadata carries the status of the job that holds the slot. It is *not* a
per-partition ledger. A partition that gave up waiting behind **another
reorganization** is not published there at all, so it is invisible in that slot; a
deferral behind any other operation is published as `failed`. The `rags` node of
the partition is authoritative:

| Field on the `rags` node | After a successful reorganization |
|--------------------------|---------------------------------|
| `needs_reclustering` | Cleared to `false` |
| `last_reclustered_at` | Set to the time of the run |
| `divergence_score` | Reset to `0`, and a new baseline is taken |

If `needs_reclustering` is still `true` and `last_reclustered_at` has not moved,
the partition was not reorganized, whether it failed or never got the slot.
Trigger it again. See [Where the values are
stored](divergence-and-reorganization.md#where-the-values-are-stored).

| Status Code | Meaning |
|-------------|---------|
| `200` | The request has been processed. Check the `accepted` value of every entry in `results`. |
| `400` | `partition_ids` is missing or empty, or it lists more than five partitions. |
| `401` | Authentication failed. |
| `403` | Access denied. |
| `500` | Server error. |

**Notes:**

- If a partition is already being reorganized, a second request is
  **merged** into it and does not start another Importer job.
- Reorganizing uses the same service-wide slot as builds and as adding,
  removing, and replacing documents, so it cannot run at the same time as these
  operations.
- A reorganization that fails or is skipped does not clear `needs_reclustering`.
  Start it again once the slot is free.
- A partition **without entities** is a successful no-op. The job reports `0`
  communities over `0` entities and finishes, so a completed job is not evidence
  that anything was refreshed. Check `last_reclustered_at` and the
  `Communities` of the partition.
- To learn what the Importer does while it reorganizes and how long it takes,
  see
  [Importer Incremental Updates](../importer/incremental-updates.md#reclustering).

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

## Build the knowledge graph for changed documents

{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/orchestrate" >}}

Adding and replacing only change the corpus graph. To extract the entities and
relationships of the new content and add them to the knowledge graph, call
`POST /v1/orchestrate` with the `file_ids` of the added and replaced
documents. Only those documents are processed, in the partitions that hold
them. You do not name the partitions, AutoGraph finds them from the IDs.

Removing does not need this call. It removes the knowledge graph data itself.

### Request

```json
{
  "project": "my_project",
  "replicas": 1,
  "file_ids": ["<added-or-replaced-file-id>"]
}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `project` | string | Yes | The platform project that holds the corpus. |
| `file_ids` | string[] | Yes, for an incremental update | The `file_id` values from the response of an addition or the status of a replacement. A non-empty list skips the filter that otherwise only builds partitions that are not in the knowledge graph yet, so a partition that is already built can take the changed documents. |
| `replicas` | integer | No | Number of Importer workers. **1** is enough for a handful of documents. |
| `categories` | string[] | No | Narrows the IDs to these categories. Sending `categories` **without** `file_ids` does not work for an incremental update, see [Identifying documents for the knowledge graph](#identifying-documents-for-the-knowledge-graph). |

For the complete list of parameters, the response, the credential handling, and
the three kinds of `409`, see
[Trigger Orchestration](../reference/orchestration.md#trigger-orchestration).

### Identifying documents for the knowledge graph

The build identifies documents by `file_id` alone. `doc_name` does not work
here, and it never has to: [adding](#add-documents) and
[replacing](#replace-documents) both require a File Manager `file_id` for every
document, so the ID you send is the ID you pass on to the build. IDs have the
form `rag-input-{base64url(db:path)}` and refer to a File Manager path, which is
why the project has to be built through the File Manager. Upload a document with
[`POST /_platform/filemanager/_db/{database}/rag-input`](../../file-manager/api.md#upload-a-rag-input-file)
and pass the returned ID.

A non-empty `file_ids` is what keeps an already built partition eligible,
because it bypasses the filter that otherwise only builds partitions that are
not in the `{project}_kg` knowledge graph yet. Sending `categories` alone does
not bypass that filter, so it skips exactly the partitions that your addition
or replacement touched. If nothing else is stale, the request is rejected with a `409`
and a `Nothing to orchestrate` message, see
[Telling the three `409` responses apart](../reference/orchestration.md#telling-the-three-409-responses-apart).

### Response

The call returns `202` with an `orchestration_id` and runs in the background.
IDs that matched no document are listed in `unmatched_file_ids`, which is only
reported on this response.

```json
{
  "orchestration_id": "orch_1711812345_a1b2c3d4",
  "success": true,
  "message": "Orchestration started",
  "unmatched_file_ids": []
}
```

Poll
[`GET /v1/orchestrate/{orchestration_id}`](../reference/orchestration.md#monitor-an-orchestration)
until `status` leaves `running`. Each entry of `jobs` carries the
`divergence_score` and `needs_reclustering` of its partition, which is the
value to act on after adding or replacing documents.

### HTTP example

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "project": "my_project",
    "replicas": 1,
    "file_ids": ["<added-or-replaced-file-id>"]
  }' \
  https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/orchestrate
```

For all steps in order, with example requests, see the
[Quick Start](quick-start.md).
