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

Spawn GraphRAG importer workers for the strategy profiles that are not in the
knowledge graph yet. Called after RAG strategizer is completed.

**Recommended path:** Call after a successful corpus build and strategizer run, when `rags` is non-empty. This is the final step of the standard workflow. Omit `categories` to process every eligible strategy profile; list bare category labels to scope the run to those categories. Do not overlap with an active build (`409`).

{{< info >}}
**Only stale partitions are built**, when `file_ids` is omitted or empty. Before
any worker is started, the service computes which partitions actually need
importing. A category is eligible only when it has RAG strategies **and** its
partitions are not already in the `{project}_kg` knowledge graph. Partitions
that are already in the knowledge graph are never rebuilt, and if nothing is
stale, the request is rejected with `409` instead of starting a no-op run that
spins up importer pods. On a first build the knowledge graph does not exist yet,
so every partition counts as stale.

The filter is presence-based: a partition that imported *incompletely* still
counts as built. To force it to be built again, delete the category with
[`DELETE /v1/projects/{project}/categories/{category}`](project-operations.md#delete-category),
re-run the strategizer, and orchestrate again.
{{< /info >}}

{{< tip >}}
**Targeted orchestration is driven by `file_ids` alone.** When `file_ids` is
non-empty, the run is narrowed to the strategized clusters that actually contain
those File Manager IDs, and each of those partitions imports only those IDs. You
do not name the partitions, and there is no parameter for doing so. A non-empty
`file_ids` also **bypasses the stale filter**, so an
[incremental graph update](../incremental-graph-updates.md) can add a newly
inserted or replaced document to a partition that is already imported, without
processing the whole partition again.

Because unrelated partitions are never dispatched at all, the `total_jobs` of a
targeted run is the number of partitions that genuinely hold your files, not an
upper bound.
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
| `replicas` | integer | No | Number of Importer worker replicas (parallelism). Defaults to **1** when omitted. | **2–4** for typical jobs. Scale up only if you have many partitions and capacity. |
| `max_retries` | integer | No | Retries per failed Importer job before giving up. | **3** (default) is appropriate for transient errors. |
| `chat_secret_profile_ids` | string[] | No | Platform secret profile IDs for chat keys. | Provide one or more secret profile IDs. Follow your operator's convention. Raw chat keys are not accepted on this endpoint. |
| `embedding_secret_profile_id` | string | No | Secret profile for embedding key on the Importer. | Set when embedding must come from vault, not env. |
| `importer_env` | map | No | Extra environment variables for Importer pods (e.g. model names, timeouts). | Start **empty**; add only keys documented for your Importer version (often chunk or model overrides). |
| `categories` | string[] | No | If **non-empty**, only the strategy profiles of the listed categories are orchestrated. A category is a bare category label, such as `legal`, not a partition ID. If no strategy profile matches, the request is rejected with `400`. | **Omit or `[]`** for the full corpus. This is the coarsest scoping level; there is no way to single out one partition of a category. |
| `file_ids` | string[] | No | If **non-empty**, the run is narrowed to the strategized clusters that contain these File Manager IDs, each of those partitions imports only those IDs, and the stale-partition filter is skipped. Ids that match nothing are skipped and reported in `unmatched_file_ids` on the response. Matching uses the `file_id` that a corpus build stamps on the corpus sources; there is no fallback to file names. | **Omit** for a normal build. Use it after an [incremental graph update](../incremental-graph-updates.md) to import only the documents that changed. |

### Credential precedence

AutoGraph is replacing raw API keys with secret profile IDs. When a profile ID
is available, it takes priority, and the Importer resolves the key from the
platform secret manager at runtime, so no plaintext key is written into the
Importer pod environment.

Chat and embedding credentials are resolved independently, each in this order:

1. `chat_secret_profile_ids` and `embedding_secret_profile_id` on the request.
2. The persisted project model configuration, for any profile field that the
   request omits. See
   [Update Model Config Credentials](project-operations.md#update-model-config-credentials).
3. Inline keys, only when no profile ID exists at either of the levels above:
   `CHAT_API_KEY` and `EMBEDDING_API_KEY` in `importer_env`, and then the
   environment of the AutoGraph service itself.

{{< info >}}
**A resolved secret profile suppresses inline keys.** When a profile ID is found
on the request or in the project metadata, an inline key for the same credential
is **not** forwarded to the Importer, including one you set in `importer_env`. A
discarded inline key is logged as a warning. Configure both profiles if you want
both credentials forwarded by reference.
{{< /info >}}

### Response

```json
{
  "orchestration_id": "orch_1711812345_a1b2c3d4",
  "success": true,
  "message": "Orchestration started",
  "total_jobs": 0,
  "completed_jobs": 0,
  "failed_jobs": 0,
  "job_results": [],
  "unmatched_file_ids": []
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
| `unmatched_file_ids` | The requested `file_ids` that matched no document in any strategized cluster within the requested categories. Empty when every ID matched, or when `file_ids` was omitted. | Read it on a partial match to see which documents were silently left out. |

{{< warning >}}
**`unmatched_file_ids` is only on this immediate response.** It is not repeated
by [`GET /v1/orchestrate/{orchestration_id}`](#monitor-an-orchestration), so
read it from the response body before you start polling. A request in which
*every* ID misses is refused with `409` instead, see below.
{{< /warning >}}

| Status Code | Meaning |
|-------------|---------|
| `202` | Orchestration accepted and started in the background |
| `400` | `project` is missing or does not name the project the service runs against, no strategy profile matches the given `categories`, or the model configuration gate is latched (see [Corpus Build](corpus-build.md#create-corpus-build)) |
| `401` | Authentication failed |
| `403` | Access denied |
| `409` | One of three distinct conditions, see below |
| `500` | Server error |

{{< info >}}
**This endpoint returns `202`, not `200`.** Accept any `2xx` as "accepted". The
response body is unchanged.
{{< /info >}}

### Telling the three `409` responses apart

All three share the status code. The `message` and `error_type` of the response
distinguish them, and each calls for a different reaction:

| Condition | How to recognize it | What it means | What to do |
|-----------|---------------------|---------------|------------|
| **Already in progress** | The message names the running operation and its `orchestration_id` (`OrchestrationInProgressError`), or a running document delete or project deletion | Another operation holds the single-flight slot | Wait and send the request again. The message carries liveness diagnostics, see below. |
| **Nothing to orchestrate** | The message reads `Nothing to orchestrate: …` and lists the categories that are already built | Every eligible category is already in the knowledge graph, and `file_ids` was omitted or empty | **Do not retry.** This is a successful steady state. Check [Project Overview](project-operations.md#project-overview) if you expected work. |
| **No matching `file_ids`** | `NoMatchingFilesError`, with `unmatched_file_ids` and a `reasons` map in the error details | You sent `file_ids` and **none** of them is in any strategized cluster within the requested categories, so the run would import nothing | Fix the IDs using `reasons`, see the table below. |

A request that matches **some** of its `file_ids` is not rejected. The unmatched
ids are skipped and reported in `unmatched_file_ids` on the `202` response, and
the run continues with the rest. A `NoMatchingFilesError` therefore always means
that *every* ID missed. The request is refused before any importer pod is
created and before the single-flight slot is taken, so there is nothing to clean
up.

| Reason in `reasons` | Meaning | What to do |
|--------|---------|------------|
| `not_in_project` | The ID does not belong to the requested `project`. | The ID is wrong. |
| `not_in_any_cluster` | The document is in the project, but no cluster contains it. | The ID is wrong, or the corpus build did not cover it. |
| `cluster_not_strategized` | The cluster that holds it has no strategy profile yet. | Run the [RAG Strategizer](rag-strategizer.md) for that category. |
| `outside_requested_categories` | The ID matches, but its category is not in `categories`. | Widen or drop the `categories` scope. |
| `corpus_has_no_file_id_stamps` | The corpus was built without File Manager IDs, so nothing can be matched by ID at all. | Build that category again on a current version. |

{{< tip >}}
**Reading an "already in progress" `409`.** The message carries the liveness of
the run that holds the slot, so that you can tell a healthy orchestration from a
wedged one without reading pod logs: how long it has been running, the
`completed`, `total`, and `failed` job counts, **how long ago a worker last made
contact**, and whether a cancellation has already been requested.

The last contact time is the signal that matters. A single large partition sits
at unchanged job counters for hours while it imports perfectly normally, so
static counters are not evidence of a stall. A run whose last worker contact is
minutes old is healthy. One that has been silent for tens of minutes is reaped,
see [Automatic reaping of a wedged run](#automatic-reaping-of-a-wedged-run).
{{< /tip >}}

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

Each entry of `jobs` reports one Importer job, that is, one strategized
partition. For a **FullGraphRAG** partition, the entry carries the
`divergence_score` and `needs_reclustering` of that partition, measured after the
job has created its Layer 3 entities. This is the value to act on, not the one
from an insert or update response, see
[Where to read the score](../incremental-graph-updates.md#where-to-read-the-score).

### Response

```json
{
  "orchestration_id": "orch_1711812345_a1b2c3d4",
  "status": "running",
  "phase": "importing",
  "total_jobs": 4,
  "completed_jobs": 2,
  "failed_jobs": 0,
  "running_jobs": 2,
  "pending_jobs": 0,
  "skipped_jobs": 0,
  "entities_added": 18432,
  "elapsed_seconds": 3420,
  "seconds_since_progress": 7,
  "message": "Running: 2/4 completed, 0 failed",
  "jobs": [
    {
      "rag_partition_id": "myproject_legal_0_a",
      "category": "myproject_legal",
      "strategy_type": "FullGraphRAG",
      "status": "completed",
      "retry_count": 0,
      "error_message": null,
      "divergence_score": 0.12,
      "needs_reclustering": false,
      "entities_added": 9216,
      "imported": true
    }
  ]
}
```

### What `status` and `phase` mean

The two status-shaped fields answer different questions and do not substitute
for each other.

| Field | Answers | Values |
|-------|---------|--------|
| `status` | Is the run over, and did it succeed? | `running`, then `completed`, `failed`, or `cancelled` |
| `phase` | Where the work currently is | `initializing` → `starting_importers` → `importing` → `verifying` → `finished` |

`status` turns terminal only once every import job is terminal, and `completed`
additionally requires that the partitions the Importer reported writing were
found in the knowledge graph. A terminal run always reports `phase: "finished"`,
whatever the outcome — including a cancelled or reaped one, which is the fourth
`status` value that a client mapping only `running`, `completed`, and `failed`
meets unhandled. See [Cancel an orchestration](#cancel-an-orchestration).

`phase` is the field to render as progress. A run in `starting_importers` has
imported nothing yet, whatever `elapsed_seconds` reports: the Importer pods are
created, health-checked, and given 60 seconds for route registration before the
first job is dispatched, which is minutes on a large fleet.

`message` carries the human-readable outcome and never reads "completed" for a
run that lost jobs:

| `message` starts with | Meaning |
|-----------------------|---------|
| `Orchestration completed:` | Every job succeeded. |
| `Orchestration finished with failures:` | At least one job failed after its retries. |
| `Aborted:` | The run stopped early, for example through the circuit breaker. |
| `Cancelled:` | The run was cancelled or reaped. |

### Response fields

| Field | Description |
|-------|-------------|
| `status` | The outcome of the run. Terminal only when no job is outstanding, and `completed` also requires verified output. |
| `phase` | Where the work is, see the table above. |
| `total_jobs` | The number of import jobs, one per stale partition. **`0` while `phase` is `initializing`**, because the job set is not loaded yet. There, `0` means "not known", not "none". |
| `completed_jobs` / `failed_jobs` | Live counters. `completed_jobs` **includes** `skipped_jobs`. |
| `running_jobs` / `pending_jobs` | Jobs assigned to a replica, and jobs loaded but not dispatched yet. |
| `skipped_jobs` | Jobs counted as succeeded that imported nothing, because the requested `file_ids` matched nothing in that partition. A run where this equals `completed_jobs` wrote no output at all. |
| `entities_added` | The entities the Importer reported writing in this run, summed over the finished jobs. |
| `elapsed_seconds` | Wall-clock seconds since the run was triggered. |
| `seconds_since_progress` | Seconds since an Importer worker last answered. A large value on a `running` run means the fleet has gone quiet, and the run is stopped automatically once the silence budget expires. |
| `output_verified` | `true` when every partition reported as imported was found in the knowledge graph. `false` when some were absent, which makes the run `failed`. **Absent** while the run is not terminal, and also when the knowledge graph lookup itself failed, which is reported in `message` and never turned into a false import failure. |
| `unverified_partitions` | The partitions whose jobs reported success but which are absent from the knowledge graph. A non-empty list forces `status: "failed"`. |
| `message` | Human-readable summary, see the table above. |
| `jobs` | Per-partition details, ordered running → pending → completed → failed. |
| `jobs[].rag_partition_id` | The partition this job processed. |
| `jobs[].category` | The **internal encoded module** of the partition, such as `myproject_legal`, and empty for a legacy corpus without modules. Do not pass it to a `categories` parameter, use the bare labels from [Project Overview](project-operations.md#project-overview) instead. |
| `jobs[].strategy_type` | `FullGraphRAG` or `VectorRAG`. A completed VectorRAG job creates `Documents`, `Chunks`, and `Relations` only, so that partition cannot serve `LOCAL`, `GLOBAL`, or `UNIFIED` queries, see [Retrieval capability per strategy](rag-strategizer.md#retrieval-capability-per-strategy). |
| `jobs[].retry_count` | How many retries were attempted. |
| `jobs[].error_message` | Set only when the job `status` is `failed`. |
| `jobs[].divergence_score` | The partition divergence after this job finished, set once Layer 3 entities exist. |
| `jobs[].needs_reclustering` | `true` when `divergence_score` strictly exceeds the threshold of the partition. |
| `jobs[].entities_added` | The entities the Importer reported writing for this partition. Absent until the job is terminal. |
| `jobs[].imported` | `false` on a completed job that performed no import, which is a no-op success. Absent until the job is terminal. |

{{< warning >}}
**`entities_added: 0` is not evidence that nothing was imported.** A VectorRAG
partition writes `Documents`, `Chunks`, and `Relations` but no entities by
design, so a successful VectorRAG-only run legitimately reports `0`. To tell a
real no-op from an entity-free import, read `skipped_jobs` and
`jobs[].imported`, not this counter.
{{< /warning >}}

{{< info >}}
**Progress within a job is not reported.** The Importer only returns counts on a
terminal job, so `entities_added` advances one finished job at a time rather
than continuously. On a run with a single large partition it stays at `0` until
that partition finishes. During that window, `phase` and
`seconds_since_progress` are the signals that the run is alive.
{{< /info >}}

### Waiting for a graph to be ready

Poll until `status` leaves `running`, then treat only `completed` as ready. The
example prints `phase` while it waits, because the counters alone do not
distinguish a fleet that is still starting from one that is importing. The JSON
keys come back in camelCase:

```bash
while [ "$(curl -sH "Authorization: Bearer $TOKEN" \
  "$HOST/v1/orchestrate/$ORCH_ID" | jq -r .status)" = "running" ]; do
  curl -sH "Authorization: Bearer $TOKEN" "$HOST/v1/orchestrate/$ORCH_ID" \
    | jq -r '"\(.phase): \(.completedJobs)/\(.totalJobs) jobs, \(.entitiesAdded) entities"'
  sleep 30
done
```

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
| `400` | `orchestration_id` is missing or empty. |
| `401` | Authentication failed. |
| `403` | Access denied. |
| `404` | Unknown `orchestration_id`, or the run has been evicted by a later orchestration or a pod restart. |
| `500` | Server error. |

### HTTP Example

```bash
curl -H "Authorization: Bearer <token>" \
  https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/orchestrate/orch_1711812345_a1b2c3d4
```

## Cancel an orchestration

{{< endpoint "DELETE" "https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/orchestrate/{orchestration_id}" >}}

Ask the running orchestration to stop and release the single-flight slot of the
project, so that a wedged run can be cleared without database surgery.

The request takes no body. Pass the `orchestration_id` in the path.

{{< info >}}
**Cancellation is cooperative, not immediate.** The run notices the request at
the next pass of its consumption loop, tears down its own importer service, and
frees the slot. That is bounded by one importer HTTP timeout, so allow up to
about **2 minutes**. The response acknowledges the request, it does not report a
finished cancellation.
{{< /info >}}

### Response

```json
{
  "orchestration_id": "orch_1711812345_a1b2c3d4",
  "cancellation_requested": true,
  "status": "running",
  "message": "Cancellation requested; the run will release the slot at its next loop pass"
}
```

| Field | Description |
|-------|-------------|
| `orchestration_id` | The run that was asked to stop. |
| `cancellation_requested` | `true` when the running orchestration accepted the request. |
| `status` | The status of the run at the time of the acknowledgement, which is **still `running`** until the run reaches a terminal status. Poll [`GET /v1/orchestrate/{orchestration_id}`](#monitor-an-orchestration) until it reads `cancelled`. |
| `message` | Human-readable summary, including how the slot is released. |

| Status Code | Meaning |
|-------------|---------|
| `200` | Cancellation requested |
| `401` | Authentication failed |
| `404` | The `orchestration_id` is not the run that currently holds the slot: it is already terminal, unknown, or evicted |

**Notes:**

- You can only cancel the run that currently holds the slot.
- If the run does not release the slot within a grace period of **3 minutes**,
  the admission reaper force-releases it, so a cancellation that the run never
  observed cannot hold the slot indefinitely.
- While the cancellation is in flight, a `409` from `POST /v1/orchestrate`
  reports `cancellation_requested` in its diagnostics.
- Partitions that finished before the stop are in the knowledge graph and count
  as built. The rest are not. Orchestrate again to pick up what is left.

### HTTP Example

```bash
curl -X DELETE \
  -H "Authorization: Bearer <token>" \
  https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/orchestrate/orch_1711812345_a1b2c3d4
```

### Automatic reaping of a wedged run

Independently of cancellation, a run that stops making contact is stopped
automatically, so that a dead importer fleet cannot hold the slot for the full
wall-clock cap:

| Budget | Value | Applies to |
|--------|-------|------------|
| First usable worker | **15 minutes** | No importer replica has ever become ready, so the fleet never came up. |
| Worker silence | **30 minutes** | No replica has answered a health check or a job poll, and the platform has reported no started replica. |

Both budgets are measured against **worker contact**, not against job counters,
because a single large partition sits at unchanged counters for hours while it
imports normally. A reaped run ends with `status: cancelled` and
releases the slot. The orchestration wall-clock cap of **3 days** remains as a
final backstop. These two budgets and the 3-minute cancellation grace period are
fixed constants, not operator-configurable settings.

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
| `files` | object[] | Yes | The documents to insert. The list cannot be empty, cannot contain duplicate `doc_name` or `file_id` values, and cannot hold more than **100** files per request. |
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
| `delete_id` | The ID of this deletion, and the key of the concurrency lock it holds. Log it, so that you can correlate a `409` from a parallel call with the deletion that was holding the lock. |
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
| `files` | object[] | Yes | The documents to replace. The list cannot be empty and cannot contain duplicate `doc_name` or `file_id` values. Unlike insert, update has no per-request file cap. |
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
| `400` | `partition_ids` is missing or empty, it lists more than five partitions, or the project runs on **Triton**, which cannot be reclustered. |
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
  and takes no inline content, so every entry needs one, and one missing ID
  rejects the whole batch. Upload the new version first, then send the returned
  ID. See [Identifying documents for Layer
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
  and try again. On `POST /v1/orchestrate` the same status code covers two more
  conditions, see
  [Telling the three `409` responses apart](#telling-the-three-409-responses-apart).
- **`POST /v1/orchestrate` returns `409` with "Nothing to orchestrate".** Every
  category that has strategies is already in the knowledge graph. This is the
  expected steady state when you re-run without new data, so do not retry.
  Check `knowledge_graph.new_categories` in
  [Project Overview](project-operations.md#project-overview) to see what would
  actually be built. After an insert or update, send the `file_ids` of the
  changed documents, which skips the stale filter.
- **An orchestration seems stuck and `POST /v1/orchestrate` keeps returning
  `409`.** Read the diagnostics in the message: the age of the run, the job
  counts, and above all the time since the last worker contact. Static job
  counters are normal for a large partition, a long silence is not. A run
  without a usable worker for 15 minutes, or without any worker contact for 30
  minutes, is reaped automatically. To clear it sooner, call
  [`DELETE /v1/orchestrate/{orchestration_id}`](#cancel-an-orchestration) and
  allow about two minutes.
- **The orchestration status reads `cancelled`.** The run was cancelled
  explicitly, or reaped for worker inactivity. The partitions that finished
  before the stop are in the knowledge graph and count as built, the rest are
  not. Orchestrate again to pick up what is left.
- **The orchestration reports `failed` with `unverified_partitions`.** Every
  import job reported success, but those partitions were not found in the
  `{project}_kg` graph afterwards, so the run does not claim your knowledge
  graph is ready. `message` names the missing partitions. Delete the affected
  category, build it again, re-run the strategizer, and orchestrate.
- **The orchestration seems to hang at `total_jobs: 0`.** While `phase` is
  `initializing` the job set is not loaded yet, so `0` means "not known", not
  "nothing to do". Watch `phase` rather than the counters.
- **`elapsed_seconds` keeps growing but no job finishes.** Check `phase`. In
  `starting_importers` the fleet is still coming up, which takes minutes on a
  large fleet, and nothing has been imported yet. In `importing`, check
  `seconds_since_progress`: the Importer only reports counts on a terminal job,
  so a single large partition stays at unchanged counters for hours while
  importing normally.
- **The orchestration completed but `entities_added` is `0`.** A VectorRAG
  partition writes `Documents`, `Chunks`, and `Relations` but no entities, so a
  VectorRAG-only run legitimately reports `0`. To tell that apart from a run
  that imported nothing, read `skipped_jobs` and `jobs[].imported`. See
  [Retrieval capability per strategy](rag-strategizer.md#retrieval-capability-per-strategy).
- **The orchestration succeeded but the graph is unchanged.** Compare
  `skipped_jobs` with `completed_jobs`. When they are equal, every job was a
  no-op success, because the `file_ids` you sent matched nothing in any of the
  dispatched partitions. Check `unmatched_file_ids` on the `202` response of the
  trigger request.
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
