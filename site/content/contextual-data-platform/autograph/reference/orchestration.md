---
title: AutoGraph Graph Operations Reference
menuTitle: Graph Operations
description: >-
  Build the knowledge graph from the strategy profiles with Importer workers,
  and monitor or cancel a build
weight: 14
---
{{< tag "Agentic AI Suite" >}}

`POST /v1/orchestrate` starts the Importer workers that build the knowledge
graph from the strategy profiles. `GET /v1/orchestrate/{orchestration_id}`
reports the progress and the result of a build, and
`DELETE /v1/orchestrate/{orchestration_id}` cancels it. Run a build after the
[corpus build](corpus-build.md) and the [RAG Strategizer](rag-strategizer.md).
To add, remove, or replace individual documents in a built knowledge graph, or
to reorganize its communities, see the
[Incremental Graph Updates API Reference](../incremental-graph-updates/api-reference.md).

The endpoints are relative to the path of the project's AutoGraph service,
`https://<EXTERNAL_ENDPOINT>:8529/autograph/{service_id_postfix}`.
`service_id_postfix` is the end of the service ID, such as `vyk1t` for
`arangodb-autograph-vyk1t`. The `serviceUrl` in the project metadata of
[`GET /_platform/acp/v1/project_by_name/{database}/{project}`](../../control-plane-acp/api.md#get-project-details)
ends with it, for example `.../autograph/vyk1t/`.

| Endpoint | Operation | Purpose | Call |
|----------|-----------|---------|------|
| [`POST /v1/orchestrate`](#build-the-knowledge-graph) | Build | Start Importer workers that build the knowledge graph for the partitions that need it | Asynchronous |
| [`GET /v1/orchestrate/{orchestration_id}`](#monitor-a-knowledge-graph-build) | Monitor | Read the progress, the result of every partition, and the partition divergence | Synchronous |
| [`DELETE /v1/orchestrate/{orchestration_id}`](#cancel-a-knowledge-graph-build) | Cancel | Ask a running build to stop and free the slot | Synchronous |

{{< info >}}
The build request scopes documents by category. A category is the label you
give a document when you upload it to the File Manager, the second part of its
scope `[project, category]`. Files imported with the legacy
[`module`](importing-files.md#parameters) field use that label instead. The
request takes a list of categories in `categories`.
{{< /info >}}

## Build the knowledge graph

{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/autograph/{service_id_postfix}/v1/orchestrate" >}}

Starts Importer workers for the strategy profiles that are not in the knowledge
graph yet. The API calls this operation orchestrate. The call is asynchronous
and returns `202`.

Call it after a successful corpus build and RAG Strategizer run, when `rags` is
not empty. This is the last step of the standard workflow. Omit `categories` to
process every eligible strategy profile, or list bare category labels to scope
the build to those categories. Do not start it while another build is running,
which returns `409`.

{{< info >}}
**Only stale partitions are built if you omit `file_ids` or leave it empty.**
Before any worker is started, the service works out which partitions need
importing. A category is eligible only if it has RAG strategies and its
partitions are not in the `{project}_kg` knowledge graph yet. Partitions that
are already in the knowledge graph are never built again. If nothing is stale,
the request is rejected with `409` instead of starting a run that spins up
Importer pods for nothing. On a first build the knowledge graph does not exist
yet, so every partition counts as stale.

The filter only checks whether a partition is present. A partition that was
imported incompletely still counts as built. To build it again, delete the
category with
[`DELETE /v1/projects/{project}/categories/{category}`](project-operations.md#delete-a-category),
run the strategizer again, and start the build again.
{{< /info >}}

{{< tip >}}
**`file_ids` alone decides a targeted build.** If `file_ids` is not empty, the
build is narrowed to the strategized clusters that contain those File Manager
IDs, and each of those partitions imports only those IDs. You do not name the
partitions, and there is no parameter to do so. A non-empty `file_ids` also
skips the stale filter, so an
[incremental graph update](../incremental-graph-updates/_index.md) can add a
newly added or replaced document to a partition that is already imported,
without processing the whole partition again.

Unrelated partitions are never dispatched, so the `total_jobs` of a targeted
build is the number of partitions that hold your files, not an upper bound.
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

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `project` | string | Yes | The platform project that holds the corpus. It has to match the project the service runs against, otherwise the request is rejected with `400`. Send it in every request. |
| `replicas` | integer | No | The number of Importer workers that run in parallel. Defaults to `1`. A value of `0`, or omitting the field, is treated as `1` without a warning. `2` to `4` suits typical jobs. Use more only if you have many partitions and the capacity for them. |
| `max_retries` | integer | No | How often a failed Importer job is retried before it gives up. The default of `3` covers transient errors. |
| `chat_secret_profile_ids` | string[] | No | The [Secrets Manager](../../secrets-manager.md#reference-secrets-in-service-requests) profile IDs of the chat API keys. Each Importer worker picks one key at random when it starts and keeps it, so the load is spread across the workers, but not necessarily evenly. With a single replica, only one key is used. To spread the load across several keys, store each key as a separate secret and list all profile IDs. |
| `embedding_secret_profile_id` | string | No | The Secrets Manager profile ID of the embedding API key for the Importer workers. Only one profile ID. Several embedding keys are not supported here. |
| `importer_env` | map | No | Extra environment variables for the Importer pods, such as model names or timeouts. Start with an empty map, and only add keys that are documented for your Importer version, often chunk or model overrides. |
| `categories` | string[] | No | If not empty, only the strategy profiles of the listed categories are built. Use bare category labels, such as `legal`, not partition IDs. If no strategy profile matches, the request is rejected with `400`. Omit it or send `[]` for the whole corpus. This is the coarsest scope. You cannot single out one partition of a category. |
| `file_ids` | string[] | No | If not empty, the build is narrowed to the strategized clusters that contain these File Manager IDs, each of those partitions imports only those IDs, and the stale filter is skipped. IDs that match nothing are skipped and listed in `unmatched_file_ids` in the response. Matching uses the `file_id` that a corpus build stamps on the corpus sources. There is no fallback to file names. Omit it for a normal build. Use it after an [incremental graph update](../incremental-graph-updates/_index.md) to import only the documents that changed. |

### Credential precedence

AutoGraph is replacing raw API keys with secret profile IDs. If a profile ID is
available, it takes priority, and the Importer gets the key from the platform
secret manager at runtime, so no plain-text key is written into the
environment of the Importer pods.

Chat and embedding credentials are resolved independently, each in this order:

1. `chat_secret_profile_ids` and `embedding_secret_profile_id` in the request.
2. The stored model configuration of the project, for every profile field that
   the request omits. See
   [Update the model configuration credentials](project-operations.md#update-the-model-configuration-credentials).
3. Inline keys, only if there is no profile ID at either of the levels above:
   `CHAT_API_KEY` and `EMBEDDING_API_KEY` in `importer_env`, and then the
   environment of the AutoGraph service itself.

{{< info >}}
**A resolved secret profile suppresses inline keys.** If a profile ID is found
in the request or in the project metadata, an inline key for the same
credential is not passed on to the Importer, including one you set in
`importer_env`. A discarded inline key is logged as a warning. Configure both
profiles if you want both credentials passed by reference.
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

The build runs in the background, so the counters start at zero in this
response. Poll
[`GET /v1/orchestrate/{orchestration_id}`](#monitor-a-knowledge-graph-build)
for the results of each partition, or watch the job tracking of your platform
and the service logs.

| Field | Meaning |
|-------|---------|
| `orchestration_id` | The ID of this build. Log it, so that you can correlate it with support requests and the project metadata. |
| `success` | `true` if the build has been scheduled in the background. Read it as accepted, not as all Importer jobs having finished. |
| `message` | A message for operators, for example `Orchestration started`. |
| `total_jobs` / `completed_jobs` / `failed_jobs` / `job_results` | Counters and the results of each partition. They usually still have their initial values in this response. Read the actual values from [`GET /v1/orchestrate/{orchestration_id}`](#monitor-a-knowledge-graph-build), where the array of jobs is called `jobs`. |
| `unmatched_file_ids` | The requested `file_ids` that matched no document in any strategized cluster of the requested categories. Empty if every ID matched, or if you omitted `file_ids`. Read it on a partial match to see which documents were left out without an error. |

{{< warning >}}
**`unmatched_file_ids` is only in this response.**
[`GET /v1/orchestrate/{orchestration_id}`](#monitor-a-knowledge-graph-build)
does not repeat it, so read it before you start polling. A request in which
every ID misses is rejected with `409` instead, see below.
{{< /warning >}}

{{< info >}}
**This endpoint returns `202`, not `200`.** Accept any `2xx` status code as
accepted. The response body is the same.
{{< /info >}}

### Telling the three `409` responses apart

All three have the same status code. The `message` and `error_type` of the
response tell them apart, and each needs a different reaction:

| Condition | How to recognize it | What it means | What to do |
|-----------|---------------------|---------------|------------|
| Already in progress | The message names the running operation and its `orchestration_id` (`OrchestrationInProgressError`), or a running document removal or project deletion. | Another operation holds the single-flight slot. | Wait and send the request again. The message includes liveness diagnostics, see below. |
| Nothing to orchestrate | The message reads `Nothing to orchestrate: …` and lists the categories that are already built. | Every eligible category is already in the knowledge graph, and `file_ids` was omitted or empty. | Do not retry. This is a successful steady state. Check the [project overview](project-operations.md#get-the-project-overview) if you expected work. |
| No matching `file_ids` | `NoMatchingFilesError`, with `unmatched_file_ids` and a `reasons` map in the error details. | You sent `file_ids` and none of them is in a strategized cluster of the requested categories, so the build would import nothing. | Fix the IDs with the help of `reasons`, see the table below. |

A request that matches some of its `file_ids` is not rejected. The unmatched
IDs are skipped and listed in `unmatched_file_ids` in the `202` response, and
the build goes ahead with the rest. A `NoMatchingFilesError` therefore always
means that every ID missed. The request is rejected before any Importer pod is
created and before the single-flight slot is taken, so there is nothing to
clean up.

| Reason in `reasons` | Meaning | What to do |
|---------------------|---------|------------|
| `not_in_project` | The ID does not belong to the requested `project`. | The ID is wrong. |
| `not_in_any_cluster` | The document is in the project, but no cluster contains it. | The ID is wrong, or the corpus build did not cover it. |
| `cluster_not_strategized` | The cluster that holds the document has no strategy profile yet. | Run the [RAG Strategizer](rag-strategizer.md) for that category. |
| `outside_requested_categories` | The ID matches, but its category is not in `categories`. | Widen or drop the `categories` scope. |
| `corpus_has_no_file_id_stamps` | The corpus was built without File Manager IDs, so nothing can be matched by ID. | Build that category again on a current version. |

{{< tip >}}
**Read the liveness in an "already in progress" `409`.** The message reports
the liveness of the build that holds the slot, so that you can tell a healthy
build from a stuck one without reading pod logs: how long it has been running,
the `completed`, `total`, and `failed` job counts, how long ago a worker last
made contact, and whether a cancellation has already been requested.

The time since the last worker contact is the signal to watch. A single large
partition can keep the job counters unchanged for hours while it imports
normally, so unchanged counters do not mean that the build is stuck. A build
whose last worker contact is minutes old is healthy. One that has been silent
for tens of minutes is stopped automatically, see
[Automatic reaping of a stuck build](#automatic-reaping-of-a-stuck-build).
{{< /tip >}}

| Status Code | Meaning |
|-------------|---------|
| `202` | The build has been accepted and started in the background. |
| `400` | `project` is missing or does not name the project the service runs against, no strategy profile matches the given `categories`, or the model configuration gate is latched, see [Start a corpus build](corpus-build.md#start-a-corpus-build). |
| `401` | Authentication failed. |
| `403` | Access denied. |
| `409` | One of three different conditions, see [Telling the three `409` responses apart](#telling-the-three-409-responses-apart). |
| `500` | Server error. |

### HTTP example

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "project": "my_project",
    "replicas": 2,
    "max_retries": 3,
    "chat_secret_profile_ids": ["<chat-profile-id>"],
    "embedding_secret_profile_id": "<embedding-profile-id>"
  }' \
  https://<EXTERNAL_ENDPOINT>:8529/autograph/{service_id_postfix}/v1/orchestrate
```

## Monitor a knowledge graph build

{{< endpoint "GET" "https://<EXTERNAL_ENDPOINT>:8529/autograph/{service_id_postfix}/v1/orchestrate/{orchestration_id}" >}}

Returns the status of the build that
[`POST /v1/orchestrate`](#build-the-knowledge-graph) started. The call is
synchronous. This is where the results of each partition become visible,
including the partition divergence that you act on.

Each entry of `jobs` reports one Importer job, that is, one strategized
partition. For a partition with the FullGraphRAG strategy, the entry has the
`divergence_score` and `needs_reclustering` of that partition, measured after
the job has created its knowledge graph entities. This is the value to act on,
not a value from an addition or a replacement, see
[Where to read the divergence](../incremental-graph-updates/divergence-and-reorganization.md#where-to-read-the-divergence).

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `orchestration_id` | string (path) | Yes | The `orchestration_id` from the response of [`POST /v1/orchestrate`](#build-the-knowledge-graph). |

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

| Field | Meaning |
|-------|---------|
| `status` | The outcome of the build, see [What `status` and `phase` mean](#what-status-and-phase-mean). It only becomes terminal once no job is outstanding, and `completed` also requires verified output. |
| `phase` | Where the work currently is, see [What `status` and `phase` mean](#what-status-and-phase-mean). |
| `total_jobs` | The number of import jobs, one per stale partition. It is `0` while `phase` is `initializing`, because the jobs are not loaded yet. There, `0` means not known, not none. |
| `completed_jobs` / `failed_jobs` | Live counters. `completed_jobs` includes `skipped_jobs`. |
| `running_jobs` / `pending_jobs` | The jobs that are assigned to a replica, and the jobs that are loaded but not dispatched yet. |
| `skipped_jobs` | Jobs counted as succeeded that imported nothing, because the requested `file_ids` matched nothing in that partition. If this equals `completed_jobs`, the build wrote no output at all. |
| `entities_added` | The entities the Importer reported writing in this build, summed over the finished jobs. |
| `elapsed_seconds` | The wall-clock seconds since the build was started. |
| `seconds_since_progress` | The seconds since an Importer worker last answered. A large value on a `running` build means that the workers have gone quiet, and the build is stopped automatically once the silence budget runs out. |
| `output_verified` | `true` if every partition that was reported as imported was found in the knowledge graph. `false` if some were missing, which makes the build `failed`. Absent while the build is not terminal, and also if the knowledge graph lookup itself failed, which is reported in `message` and never turned into a false import failure. |
| `unverified_partitions` | The partitions whose jobs reported success but that are missing from the knowledge graph. A non-empty list forces `status: "failed"`. |
| `message` | A human-readable summary, see [What `status` and `phase` mean](#what-status-and-phase-mean). |
| `jobs` | The details of each partition, ordered by running, pending, completed, and failed jobs. |
| `jobs[].rag_partition_id` | The partition this job processed. |
| `jobs[].category` | The internal encoded module of the partition, such as `myproject_legal`, and empty for a legacy corpus without modules. Do not pass it to a `categories` parameter. Use the bare labels from the [project overview](project-operations.md#get-the-project-overview) instead. |
| `jobs[].strategy_type` | `FullGraphRAG` or `VectorRAG`. A completed VectorRAG job only creates `Documents`, `Chunks`, and `Relations`, so that partition cannot serve `LOCAL`, `GLOBAL`, or `UNIFIED` queries, see [Retrieval capability per strategy](rag-strategizer.md#retrieval-capability-per-strategy). |
| `jobs[].status` | The status of this job, for example `completed` or `failed`. |
| `jobs[].retry_count` | How many retries were made. |
| `jobs[].error_message` | Only set if the job `status` is `failed`. |
| `jobs[].divergence_score` | The divergence of the partition after this job finished. Set once the knowledge graph entities exist. |
| `jobs[].needs_reclustering` | `true` if `divergence_score` is strictly above the threshold of the partition. |
| `jobs[].entities_added` | The entities the Importer reported writing for this partition. Absent until the job is terminal. |
| `jobs[].imported` | `false` on a completed job that imported nothing, which counts as a success that did nothing. Absent until the job is terminal. |

{{< warning >}}
**`entities_added: 0` does not mean that nothing was imported.** A partition
with the VectorRAG strategy writes `Documents`, `Chunks`, and `Relations` but no
entities by design, so a successful build of only VectorRAG partitions reports
`0`. To tell a build that did nothing from an import without entities, read
`skipped_jobs` and `jobs[].imported`, not this counter.
{{< /warning >}}

{{< info >}}
**Progress within a job is not reported.** The Importer only returns counts for
a terminal job, so `entities_added` goes up one finished job at a time, not
continuously. On a build with a single large partition, it stays at `0` until
that partition finishes. Meanwhile, `phase` and `seconds_since_progress` show
that the build is alive.
{{< /info >}}

### What `status` and `phase` mean

The two fields answer different questions and cannot replace each other.

| Field | Answers | Values |
|-------|---------|--------|
| `status` | Is the build over, and did it succeed? | `running`, then `completed`, `failed`, or `cancelled` |
| `phase` | Where is the work now? | `initializing`, `starting_importers`, `importing`, `verifying`, `finished`, in this order |

`status` only becomes terminal once every import job is terminal. `completed`
also requires that the partitions the Importer reported writing were found in
the knowledge graph. A terminal build always reports `phase: "finished"`,
whatever the outcome. This includes a cancelled or reaped build, which reports
`cancelled`, the fourth `status` value. A client that only handles `running`,
`completed`, and `failed` does not handle it. See
[Cancel a knowledge graph build](#cancel-a-knowledge-graph-build).

Show `phase` as the progress. A build in `starting_importers` has not imported
anything yet, whatever `elapsed_seconds` reports. The Importer pods are
created, health-checked, and given 60 seconds to register their routes before
the first job is dispatched, which takes minutes with many workers.

`message` has the human-readable outcome and never reads "completed" for a
build that lost jobs:

| `message` starts with | Meaning |
|-----------------------|---------|
| `Orchestration completed:` | Every job succeeded. |
| `Orchestration finished with failures:` | At least one job failed after its retries. |
| `Aborted:` | The build stopped early, for example through the circuit breaker. |
| `Cancelled:` | The build was cancelled or reaped. |

### Waiting for a graph to be ready

Poll until `status` is no longer `running`, then treat only `completed` as
ready. The example prints `phase` while it waits, because the counters alone
cannot tell workers that are still starting from workers that are importing.
The JSON keys come back in camelCase:

```bash
while [ "$(curl -sH "Authorization: Bearer $TOKEN" \
  "$HOST/v1/orchestrate/$ORCH_ID" | jq -r .status)" = "running" ]; do
  curl -sH "Authorization: Bearer $TOKEN" "$HOST/v1/orchestrate/$ORCH_ID" \
    | jq -r '"\(.phase): \(.completedJobs)/\(.totalJobs) jobs, \(.entitiesAdded) entities"'
  sleep 30
done
```

{{< warning >}}
**The status is only held in memory, for one build at a time.** A new
`POST /v1/orchestrate` removes the previous build right away, so read its
results before you start the next one. There is no history. An
`orchestration_id` that was never issued, or that has been removed this way,
returns `404`.

The lasting copy of the divergence is on the `rags` strategy profile of the
partition, see
[Where the values are stored](../incremental-graph-updates/divergence-and-reorganization.md#where-the-values-are-stored).
Read it from there if you need the state after the build has been removed.
{{< /warning >}}

| Status Code | Meaning |
|-------------|---------|
| `200` | The status of the build is returned. |
| `400` | `orchestration_id` is missing or empty. |
| `401` | Authentication failed. |
| `403` | Access denied. |
| `404` | Unknown `orchestration_id`, or the build has been removed by a later build or a pod restart. |
| `500` | Server error. |

### HTTP example

```bash
curl -X GET \
  -H "Authorization: Bearer <token>" \
  https://<EXTERNAL_ENDPOINT>:8529/autograph/{service_id_postfix}/v1/orchestrate/orch_1711812345_a1b2c3d4
```

## Cancel a knowledge graph build

{{< endpoint "DELETE" "https://<EXTERNAL_ENDPOINT>:8529/autograph/{service_id_postfix}/v1/orchestrate/{orchestration_id}" >}}

Asks the running build to stop and free the single-flight slot of the project,
so that you can clear a stuck build without changing the database by hand. The
call is synchronous, but it only acknowledges the request. The build stops
later.

{{< info >}}
**Cancelling does not stop the build right away.** The build notices the
request the next time its loop runs, shuts down its own Importer service, and
frees the slot. This takes at most one Importer HTTP timeout, so allow up to
about two minutes. The response confirms the request, not a finished
cancellation.
{{< /info >}}

### Parameters

The request takes no body.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `orchestration_id` | string (path) | Yes | The ID of the build that currently holds the slot. |

### Response

```json
{
  "orchestration_id": "orch_1711812345_a1b2c3d4",
  "cancellation_requested": true,
  "status": "running",
  "message": "Cancellation requested; the run will release the slot at its next loop pass"
}
```

| Field | Meaning |
|-------|---------|
| `orchestration_id` | The build that was asked to stop. |
| `cancellation_requested` | `true` if the running build accepted the request. |
| `status` | The status of the build when the request was confirmed. It is still `running` until the build reaches a terminal status. Poll [`GET /v1/orchestrate/{orchestration_id}`](#monitor-a-knowledge-graph-build) until it reads `cancelled`. |
| `message` | A human-readable summary, including how the slot is freed. |

Notes:

- You can only cancel the build that currently holds the slot.
- If the build does not free the slot within a grace period of 3 minutes, the
  admission reaper frees it, so a cancellation that the build never notices
  cannot hold the slot forever.
- While the cancellation is in progress, a `409` from `POST /v1/orchestrate`
  reports `cancellation_requested` in its diagnostics.
- Partitions that finished before the stop are in the knowledge graph and count
  as built. The others are not. Start the build again to process the rest.

### Automatic reaping of a stuck build

Apart from cancelling, a build whose workers stop making contact is stopped
automatically, so that Importer workers that have died cannot hold the slot
until the wall-clock limit:

| Budget | Value | Applies to |
|--------|-------|------------|
| First usable worker | 15 minutes | No Importer replica has ever become ready, so the workers never came up. |
| Worker silence | 30 minutes | No replica has answered a health check or a job poll, and the platform has reported no started replica. |

Both budgets are measured against the contact with the workers, not against the
job counters, because a single large partition can keep the counters unchanged
for hours while it imports normally. A reaped build ends with
`status: cancelled` and frees the slot. The wall-clock limit of 3 days for a
build stays as a last safeguard. These two budgets and the 3-minute grace period
for cancelling are fixed and cannot be configured.

| Status Code | Meaning |
|-------------|---------|
| `200` | Cancellation requested. |
| `401` | Authentication failed. |
| `404` | The `orchestration_id` is not the build that currently holds the slot. It is already terminal, unknown, or removed. |

### HTTP example

```bash
curl -X DELETE \
  -H "Authorization: Bearer <token>" \
  https://<EXTERNAL_ENDPOINT>:8529/autograph/{service_id_postfix}/v1/orchestrate/orch_1711812345_a1b2c3d4
```

## Troubleshooting

- **A call returns `409`.** Another operation, such as a build, an addition,
  replacement, or removal of documents, or a reorganization, is using the
  service-wide slot. Wait for it to finish and try again. On
  `POST /v1/orchestrate`, the same status code covers two more conditions, see
  [Telling the three `409` responses apart](#telling-the-three-409-responses-apart).
- **`POST /v1/orchestrate` returns `409` with "Nothing to orchestrate".** Every
  category that has strategies is already in the knowledge graph. This is
  expected if you build again without new data, so do not retry. Check
  `knowledge_graph.new_categories` in the
  [project overview](project-operations.md#get-the-project-overview) to see what would
  be built. After adding or replacing documents, send the `file_ids` of the
  changed documents, which skips the stale filter.
- **A build seems stuck and `POST /v1/orchestrate` keeps returning `409`.** Read
  the diagnostics in the message: the age of the build, the job counts, and
  above all the time since the last worker contact. Unchanged job counters are
  normal for a large partition, a long silence is not. A build without a usable
  worker for 15 minutes, or without any worker contact for 30 minutes, is
  stopped automatically. To clear it sooner, call
  [`DELETE /v1/orchestrate/{orchestration_id}`](#cancel-a-knowledge-graph-build)
  and allow about two minutes.
- **The build status reads `cancelled`.** The build was cancelled, or stopped
  automatically because its workers were inactive. The partitions that finished
  before the stop are in the knowledge graph and count as built, the others are
  not. Start the build again to process the rest.
- **The build reports `failed` with `unverified_partitions`.** Every import job
  reported success, but those partitions were not found in the `{project}_kg`
  graph afterwards, so the build does not report your knowledge graph as ready.
  `message` names the missing partitions. Delete the affected category, build it
  again, run the strategizer again, and start the knowledge graph build.
- **The build seems to hang at `total_jobs: 0`.** While `phase` is
  `initializing`, the jobs are not loaded yet, so `0` means not known, not
  nothing to do. Watch `phase`, not the counters.
- **`elapsed_seconds` keeps growing, but no job finishes.** Check `phase`. In
  `starting_importers`, the workers are still coming up, which takes minutes
  with many workers, and nothing has been imported yet. In `importing`, check
  `seconds_since_progress`. The Importer only reports counts for a terminal
  job, so a single large partition can keep the counters unchanged for hours
  while it imports normally.
- **The build completed, but `entities_added` is `0`.** A partition with the
  VectorRAG strategy writes `Documents`, `Chunks`, and `Relations` but no
  entities, so a build of only VectorRAG partitions reports `0`. To tell it
  apart from a build that imported nothing, read `skipped_jobs` and
  `jobs[].imported`. See
  [Retrieval capability per strategy](rag-strategizer.md#retrieval-capability-per-strategy).
- **The build succeeded, but the graph has not changed.** Compare
  `skipped_jobs` with `completed_jobs`. If they are equal, every job succeeded
  without doing anything, because the `file_ids` you sent matched nothing in the
  dispatched partitions. Check `unmatched_file_ids` in the `202` response of the
  build request.

To query the built knowledge graph, see [AutoRAG](../../autorag/). To check the
result of the import, see
[Monitor results](../importer/verify-and-explore.md). For how category labels
become partition IDs, see
[How categories become a partitioned knowledge graph](../design-guide.md#how-categories-become-a-partitioned-knowledge-graph).
For HTTP codes and general troubleshooting, see [Error Handling](error-handling.md).
