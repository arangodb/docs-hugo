---
title: AutoGraph Graph Operations
menuTitle: Graph Operations
description: >-
  Spawn Importer workers to build the Layer 3 knowledge graph, and monitor or
  cancel a run
weight: 14
---
{{< tag "Agentic AI Suite" >}}

This page describes the endpoints that build the Layer 3 knowledge graph.
`POST /v1/orchestrate` starts the Importer workers for the strategy profiles,
and `GET` and `DELETE /v1/orchestrate/{orchestration_id}` monitor and cancel
the run.

The endpoints that insert, delete, update, and recluster individual documents in
a graph that has already been built are described in the
[Incremental Graph Updates API Reference](../incremental-graph-updates/api-reference.md).

{{< info >}}
The orchestrate request scopes documents by **category**. A category is the
second scope level of a project and carries the label you set as `module` when
you imported the files, see
[Import files](importing-files.md#parameters). The request takes a list of them
in `categories`.
{{< /info >}}

## Trigger Orchestration

{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/orchestrate" >}}

Spawn Importer workers for the strategy profiles that are not in the
knowledge graph yet. Called after RAG strategizer is completed.

**Recommended path:** Call after a successful corpus build and strategizer run,
when `rags` is non-empty. This is the final step of the standard workflow. Omit
`categories` to process every eligible strategy profile; list bare category
labels to scope the run to those categories. Do not overlap with an active
build (`409`).

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
[incremental graph update](../incremental-graph-updates/_index.md) can add a newly
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
  "chat_secret_profile_ids": ["<chat-profile-id-1>", "<chat-profile-id-2>"],
  "embedding_secret_profile_id": "<embedding-profile-id>",
  "importer_env": {
    "CUSTOM_ENV": "value"
  }
}
```

### Parameters

| Parameter | Type | Required | Description | Recommended value |
|-----------|------|----------|-------------|-------------------|
| `project` | string | Yes | The platform project that holds the corpus. It has to match the project the service runs against, otherwise the request is rejected with `400`. | The project name of your deployment. Send it in **every** orchestrate request. |
| `replicas` | integer | No | Number of Importer worker replicas (parallelism). Defaults to **1**. A value of `0`, or omitting the field, is silently treated as `1`. | **2–4** for typical jobs. Scale up only if you have many partitions and capacity. |
| `max_retries` | integer | No | Retries per failed Importer job before giving up. | **3** (default) is appropriate for transient errors. |
| `chat_secret_profile_ids` | string[] | No | [Secrets Manager](../../secrets-manager.md#reference-secrets-in-service-requests) profile IDs of the chat API keys. Each Importer worker picks one key at random at startup and keeps it, so the load is spread across the workers but not necessarily evenly. With a single replica, only one key is used. | Store each key as a separate secret and list all profile IDs to spread the load across multiple keys. |
| `embedding_secret_profile_id` | string | No | Secrets Manager profile ID of the embedding API key for the Importer workers. | A single profile ID; multiple embedding keys are not supported here. |
| `importer_env` | map | No | Extra environment variables for Importer pods (e.g. model names, timeouts). | Start **empty**; add only keys documented for your Importer version (often chunk or model overrides). |
| `categories` | string[] | No | If **non-empty**, only the strategy profiles of the listed categories are orchestrated. A category is a bare category label, such as `legal`, not a partition ID. If no strategy profile matches, the request is rejected with `400`. | **Omit or `[]`** for the full corpus. This is the coarsest scoping level; there is no way to single out one partition of a category. |
| `file_ids` | string[] | No | If **non-empty**, the run is narrowed to the strategized clusters that contain these File Manager IDs, each of those partitions imports only those IDs, and the stale-partition filter is skipped. IDs that match nothing are skipped and reported in `unmatched_file_ids` on the response. Matching uses the `file_id` that a corpus build stamps on the corpus sources; there is no fallback to file names. | **Omit** for a normal build. Use it after an [incremental graph update](../incremental-graph-updates/_index.md) to import only the documents that changed. |

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
| `total_jobs` / `completed_jobs` / `failed_jobs` / `job_results` | Counters and per-partition results. | Often remain at initial values on this first response. Read the populated values from [`GET /v1/orchestrate/{orchestration_id}`](#monitor-an-orchestration), where the per-job array is called `jobs`. |
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
  -d '{"project": "my_project", "replicas": 2, "max_retries": 3, "chat_secret_profile_ids": ["<chat-profile-id>"], "embedding_secret_profile_id": "<embedding-profile-id>"}' \
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
[Where to read the score](../incremental-graph-updates/_index.md#where-to-read-the-score).

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
stored](../incremental-graph-updates/_index.md#where-the-values-are-stored). Read it
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

## Troubleshooting

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

## Next Steps

- **[AutoRAG](../../autorag/)**: Query your built knowledge graphs
- **[Monitor Results](../importer/verify-and-explore.md)**: Verify import success
- **[Incremental Graph Updates](../incremental-graph-updates/_index.md)**: When to use the `/v1/graph/*` endpoints and how the partition divergence is measured
- **[Incremental Graph Updates API Reference](../incremental-graph-updates/api-reference.md)**: The `/v1/graph/insert`, `/delete`, `/update`, and `/recluster` endpoints
- **[Design Guide - Categories to partitions](../design-guide.md#how-categories-become-a-partitioned-knowledge-graph)**: How category labels flow into partition IDs
- **[Error Handling](error-handling.md)**: HTTP codes and general troubleshooting
