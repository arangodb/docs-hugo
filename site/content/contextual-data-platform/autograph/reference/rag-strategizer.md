---
title: AutoGraph RAG Strategizer Reference
menuTitle: RAG Strategizer
description: >-
  Assign a RAG strategy to every cluster of the corpus, inspect the strategies,
  and override them per cluster
weight: 12
---
{{< tag "Agentic AI Suite" >}}

`POST /v1/rag-strategizer/analyze` assigns a RAG strategy, FullGraphRAG or
VectorRAG, to every cluster of a built corpus.
`GET /v1/rag-strategizer/jobs/{strategize_job_id}` reports the progress of that
run. `GET /v1/rag-strategizer/strategy` lists the strategies, and
`PATCH /v1/rag-strategizer/strategy/{cluster_id}` overrides the strategy of one
cluster. Run the strategizer after the [corpus build](corpus-build.md) and
before the [knowledge graph build](orchestration.md). For how the entity types
shape the knowledge graph, see
[Per-cluster entity schema](../design-guide.md#per-cluster-entity-schema-entity_types).

The endpoints are relative to the path of the project's AutoGraph service,
`https://<EXTERNAL_ENDPOINT>:8529/autograph/{service_id_postfix}`.
`service_id_postfix` is the end of the service ID, such as `vyk1t` for
`arangodb-autograph-vyk1t`. The `serviceUrl` in the project metadata of
[`GET /_platform/acp/v1/project_by_name/{database}/{project}`](../../control-plane-acp/api.md#get-project-details)
ends with it, for example `.../autograph/vyk1t/`.

| Endpoint | Operation | Purpose | Call |
|----------|-----------|---------|------|
| [`POST /v1/rag-strategizer/analyze`](#start-the-rag-strategizer) | Analyze | Assign a RAG strategy to every cluster | Asynchronous |
| [`GET /v1/rag-strategizer/jobs/{strategize_job_id}`](#monitor-a-strategizer-job) | Monitor | Read the progress of a strategizer run | Synchronous |
| [`GET /v1/rag-strategizer/strategy`](#retrieve-rag-strategies) | Retrieve | List the strategy of every cluster | Synchronous |
| [`PATCH /v1/rag-strategizer/strategy/{cluster_id}`](#update-a-cluster-strategy) | Override | Change the strategy of one cluster | Synchronous |

## Start the RAG Strategizer

{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/autograph/{service_id_postfix}/v1/rag-strategizer/analyze" >}}

Analyzes the existing clusters and assigns a RAG strategy to each of them. The
call is asynchronous and returns `202`.

Call it once the corpus build has reached `completed`, and before
`POST /v1/orchestrate`. If you build the corpus again, run the strategizer
again, so that `rags` matches the current clusters.

### Request

```json
{
  "project": "my_project",
  "complexity": "high",
  "extract_images_default": false,
  "categories": ["legal", "marketing"],
  "max_parallel_clusters": 5
}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `project` | string | Yes | The project name of your deployment. It has to match the project the service runs against. |
| `complexity` | string | Yes | Sets the share of clusters that get the FullGraphRAG strategy. The others get VectorRAG. `very_low` is 0%, `low` 25%, `moderate` 50%, `high` 75%, and `very_high` 100%. If you omit it or send an unknown value, the request returns `400`. Send `very_high` if every partition has to serve entity-based queries, and `high` as a balanced default for mixed corpora. |
| `extract_images_default` | boolean | No | If `true`, turns on the image flags (semantic units, image processing, image embeddings) on FullGraphRAG profiles only. Allowed if `complexity` is `high` or `very_high`. VectorRAG profiles always keep these flags at `false`. Defaults to `false`. Only set it to `true` if you need multimodal image extraction. |
| `categories` | string[] | No | Bare category labels, to limit the run to these categories. Omit it or send `[]` to analyze every category. Use the bare labels from the [project overview](project-operations.md#get-the-project-overview) to run one of them again. The list is not validated up front, so the request always returns `202`. If a listed category has no matching cluster, the job ends with `status: failed` and a message that names the categories it could not match. |
| `max_parallel_clusters` | integer | No | How many clusters are analyzed at the same time. Each analysis can call the LLM. Defaults to `5`. Lower it to `2` or `3` if you hit LLM rate limits. |

{{< warning >}}
**`full_graph_rag_strategy` has been removed.** The field is dropped without a
warning when the request is parsed, so a client that only sends it now gets
`400` (`complexity is required`). Replace it with `complexity`:

| Old `full_graph_rag_strategy` | New `complexity` | FullGraphRAG share |
|-------------------------------|------------------|--------------------|
| `very high` | `very_high` | 100% |
| `high` | `high` | 75% |
| - | `moderate` | 50% |
| `low` | `low` | 25% |
| `very low` | `very_low` | 0% |

Custom percentage strings such as `"40%"` are no longer supported. Pick the
closest of the five values.
{{< /warning >}}

### How `complexity` is applied

The percentage applies to the ranked list of clusters. The top
`round(percentage / 100 * cluster_count)` clusters get FullGraphRAG, and the
others get VectorRAG. With few clusters, the rounding decides the outcome. At
`moderate`, a project with a single cluster gets `round(0.5) == 0` FullGraphRAG
clusters, so the whole project ends up with VectorRAG:

| Clusters | Result at `moderate` |
|----------|----------------------|
| 1 | 0 FullGraphRAG, 1 VectorRAG |
| 2 | 1 FullGraphRAG, 1 VectorRAG |
| 3 | 2 FullGraphRAG, 1 VectorRAG |
| 4 | 2 FullGraphRAG, 2 VectorRAG |
| 5 | 2 FullGraphRAG, 3 VectorRAG |

A VectorRAG partition has no `Entities` and no `Communities`, so it cannot serve
`LOCAL`, `GLOBAL`, or `UNIFIED` queries. Send `very_high` if every partition has
to support entity-based retrieval. See
[Retrieval capability per strategy](#retrieval-capability-per-strategy).

In the web interface, the split between the two strategies is the
**Complexity** slider of the strategy generation wizard. It goes from
*Vector only*, with no FullGraphRAG, to *Graph + images*, with FullGraphRAG
everywhere and image extraction. See
[Web Interface](../web-interface.md#configure-strategy-generation).

### Response

```json
{
  "strategize_job_id": "strat_1738000000_a1b2c3d4"
}
```

| Field | Meaning |
|-------|---------|
| `strategize_job_id` | The ID of the run. Poll [`GET /v1/rag-strategizer/jobs/{strategize_job_id}`](#monitor-a-strategizer-job) with it for the progress. |

For each cluster, the strategizer samples documents, calculates a complexity
score, and assigns FullGraphRAG or VectorRAG. For FullGraphRAG clusters, it also
uses an LLM to derive an entity schema of 8 to 12 entity types from the
documents of the cluster. The entity schema and the strategy profiles are stored
in the `rags` collection and later passed to the Importer to constrain entity
extraction, see
[Per-cluster entity schema](../design-guide.md#per-cluster-entity-schema-entity_types).

{{< info >}}
**This endpoint returns `202`, not `200`.** Accept any `2xx` status code as
accepted. The response body is the same.
{{< /info >}}

{{< warning >}}
**Running the strategizer again does not overwrite existing profiles.** A
cluster that already has a document in `rags` is reported as skipped and left
as it is. The completion message names the skipped cluster IDs. If the strategy
type would have changed, a warning is logged and both documents stay active.
Clear the `rags` collection before you run the strategizer again if you need a
clean start, or override individual clusters with
[`PATCH /v1/rag-strategizer/strategy/{cluster_id}`](#update-a-cluster-strategy).
{{< /warning >}}

| Status Code | Meaning |
|-------------|---------|
| `202` | The strategizer has been accepted and started in the background. |
| `400` | Invalid `project`, `complexity`, or `extract_images_default`, or the model configuration gate is latched, see [Start a corpus build](corpus-build.md#start-a-corpus-build). |
| `401` | Authentication failed. |
| `403` | No database access. |
| `409` | A corpus build is still running, another strategizer run is active, or a project deletion has started. |
| `500` | Server error. |

### HTTP example

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "project": "my_project",
    "complexity": "high",
    "extract_images_default": false,
    "max_parallel_clusters": 5
  }' \
  https://<EXTERNAL_ENDPOINT>:8529/autograph/{service_id_postfix}/v1/rag-strategizer/analyze
```

## Monitor a strategizer job

{{< endpoint "GET" "https://<EXTERNAL_ENDPOINT>:8529/autograph/{service_id_postfix}/v1/rag-strategizer/jobs/{strategize_job_id}" >}}

Returns the progress of a strategizer run. The call is synchronous. Use it to
show a progress bar while the run works in the background.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `strategize_job_id` | string (path) | Yes | The ID that [`POST /v1/rag-strategizer/analyze`](#start-the-rag-strategizer) returned. |

### Response

```json
{
  "status": "running",
  "progress": 42.0,
  "clusters_total": 10,
  "clusters_done": 4
}
```

| Field | Meaning |
|-------|---------|
| `status` | `idle`, `pending`, `running`, `completed`, or `failed`. |
| `progress` | The overall progress in percent, from `0.0` to `100.0`. |
| `clusters_total` | The number of clusters to analyze. `0` until the number is known. |
| `clusters_done` | The clusters that have finished, including empty and failed ones. |

Poll until `status` is `completed` or `failed`. The final status is kept for a
limited time, one hour by default, and then removed. The status is only held
in memory and is lost when the pod restarts.

{{< info >}}
**A run limited to categories fails as a whole.** If you sent `categories` and
one of the listed categories has no matching cluster, the job ends with
`status: failed`, even if the other categories matched. The message names the
categories it could not match, in the form you sent them. Category labels are
case-sensitive. Check them against the
[project overview](project-operations.md#get-the-project-overview).
{{< /info >}}

| Status Code | Meaning |
|-------------|---------|
| `200` | The status is returned. |
| `401` | Authentication failed. |
| `404` | Unknown or expired `strategize_job_id`, including an empty ID. |

### HTTP example

```bash
curl -X GET \
  -H "Authorization: Bearer <token>" \
  https://<EXTERNAL_ENDPOINT>:8529/autograph/{service_id_postfix}/v1/rag-strategizer/jobs/strat_1738000000_a1b2c3d4
```

## Retrieve RAG strategies

{{< endpoint "GET" "https://<EXTERNAL_ENDPOINT>:8529/autograph/{service_id_postfix}/v1/rag-strategizer/strategy" >}}

Returns all RAG strategies that have been created. The call is synchronous and
only reads data, so you can call it at any time.

Call it once the strategizer job has reached `completed`, to check which
strategy each cluster has before you start the knowledge graph build, and to get
the `rag_partition_id` values that `POST /v1/graph/recluster` takes.

### Parameters

The request takes no body and no query parameters.

### Response

```json
{
  "strategies": [
    {
      "cluster_id": "cluster_legal_0",
      "strategy_type": "FullGraphRAG",
      "rag_partition_id": "legal_0_a",
      "entity_types": ["CONTRACT", "JURISDICTION", "LEGISLATION"],
      "document_count": 25,
      "parameters": {
        "rag_mode": "FullGraphRAG",
        "module": "legal",
        "batch_size": "100",
        "enable_chunk_embeddings": "true",
        "enable_edge_embeddings": "false",
        "chunk_token_size": "1200",
        "chunk_overlap_token_size": "100",
        "community_report_num_findings": "5-10",
        "enable_semantic_units": "true"
      }
    },
    {
      "cluster_id": "cluster_legal_1",
      "strategy_type": "VectorRAG",
      "rag_partition_id": "legal_1_b",
      "entity_types": [],
      "parameters": {
        "rag_mode": "VectorRAG",
        "module": "legal"
      }
    }
  ],
  "total_strategies": 2,
  "strategy_type_counts": {
    "FullGraphRAG": 1,
    "VectorRAG": 1
  }
}
```

| Field | Meaning |
|-------|---------|
| `strategies` | One entry per cluster strategy profile. |
| `strategies[].cluster_id` | The cluster key, such as `cluster_legal_0`, or `cluster_0` if no category prefix applies. This is the value that [`PATCH /v1/rag-strategizer/strategy/{cluster_id}`](#update-a-cluster-strategy) takes. |
| `strategies[].strategy_type` | `FullGraphRAG` or `VectorRAG`. It decides which query modes the partition can serve, see [Retrieval capability per strategy](#retrieval-capability-per-strategy). |
| `strategies[].rag_partition_id` | The ID that is passed to the Importer, and the ID that [`POST /v1/graph/recluster`](../incremental-graph-updates/api-reference.md#reorganize-partitions) takes in its `partition_ids`. `POST /v1/orchestrate` does not accept it, as it scopes by `categories` and `file_ids`. The suffix `_a` stands for FullGraphRAG, `_b` for VectorRAG. |
| `strategies[].entity_types` | The domain-specific entity types the LLM generated for a FullGraphRAG cluster. Always empty for VectorRAG, which extracts no entities. They are passed to the Importer to constrain entity extraction, see [Per-cluster entity schema](../design-guide.md#per-cluster-entity-schema-entity_types). |
| `strategies[].document_count` | The number of documents in the cluster. |
| `strategies[].parameters` | All other fields that are stored with the strategy, as a map of strings to strings. It always has `rag_mode`, which matches `strategy_type`, and the `module` label if one applies. FullGraphRAG profiles also have the Importer settings shown above: `batch_size`, `enable_chunk_embeddings`, `enable_edge_embeddings`, `chunk_token_size`, `chunk_overlap_token_size`, `community_report_num_findings`, and `enable_semantic_units`. Even if `enable_semantic_units` is `true`, automatic citation extraction is not implemented yet, see [Known limitations](error-handling.md#citation-handling). If the LLM could not generate the entity types for a FullGraphRAG cluster, the field `entity_generation_error` is set and `entity_types` is empty. Booleans and numbers are stored as strings. |
| `total_strategies` | The number of entries in `strategies`. |
| `strategy_type_counts` | The number of `VectorRAG` and `FullGraphRAG` strategies. |

{{< info >}}
The response does not have a separate category label. The `cluster_id`
contains it, but to scope a knowledge graph build, pass the bare category
labels from the [project overview](project-operations.md#get-the-project-overview)
instead.
{{< /info >}}

### HTTP example

```bash
curl -X GET \
  -H "Authorization: Bearer <token>" \
  https://<EXTERNAL_ENDPOINT>:8529/autograph/{service_id_postfix}/v1/rag-strategizer/strategy
```

## Update a cluster strategy

{{< endpoint "PATCH" "https://<EXTERNAL_ENDPOINT>:8529/autograph/{service_id_postfix}/v1/rag-strategizer/strategy/{cluster_id}" >}}

Overrides the strategy type, the entity types, and the image extraction flag of
one cluster. The call is synchronous. Use it if the strategy that was assigned
automatically is not what you want. Call it after
[`GET /v1/rag-strategizer/strategy`](#retrieve-rag-strategies) and before
`POST /v1/orchestrate`.

{{< warning >}}
**Override the strategy before the first knowledge graph build.** This endpoint
never changes the `rag_partition_id` of the strategy, so a partition that is
already in the knowledge graph still counts as built. `POST /v1/orchestrate`
then returns `409` instead of importing it again with the new strategy.

To change a partition that has already been imported, delete the category with
[`DELETE /v1/projects/{project}/categories/{category}`](project-operations.md#delete-a-category),
build it again, run the strategizer again, and start the knowledge graph build.
{{< /warning >}}

### Request

```json
{
  "strategy_type": "FullGraphRAG",
  "entity_types": ["PERSON", "ORGANIZATION", "LOCATION"],
  "extract_images": false
}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `cluster_id` | string (path) | Yes | The cluster to update, for example `cluster_legal_0`. Take it from [`GET /v1/rag-strategizer/strategy`](#retrieve-rag-strategies). |
| `strategy_type` | string | Yes | `FullGraphRAG` or `VectorRAG`. |
| `entity_types` | string[] | No | Domain-specific entity types. Always `[]` if `strategy_type` is `VectorRAG`. |
| `extract_images` | boolean | No | Turns on image extraction. Always `false` if `strategy_type` is `VectorRAG`. |

{{< info >}}
**VectorRAG overrides the request.** With `strategy_type: "VectorRAG"`,
`entity_types` is always stored as `[]`, and the image flags
(`extract_images_default`, `enable_semantic_units`, `process_images`,
`enable_semantic_unit_embeddings`) are always stored as `false`, whatever the
request contained.
{{< /info >}}

### Response

```json
{
  "strategy": {
    "cluster_id": "cluster_legal_0",
    "strategy_type": "FullGraphRAG",
    "rag_partition_id": "legal_0_a",
    "entity_types": ["PERSON", "ORGANIZATION", "LOCATION"],
    "document_count": 25,
    "parameters": {
      "rag_mode": "FullGraphRAG",
      "updated_at": "1752844800.0",
      "extract_images_default": "false",
      "enable_semantic_units": "false",
      "process_images": "false",
      "enable_semantic_unit_embeddings": "false",
      "batch_size": "100",
      "enable_chunk_embeddings": "true",
      "chunk_token_size": "1200",
      "chunk_overlap_token_size": "100"
    }
  }
}
```

| Field | Meaning |
|-------|---------|
| `strategy.cluster_id` | The cluster that was updated. |
| `strategy.strategy_type` | The stored strategy type. |
| `strategy.rag_partition_id` | The same value as before the update. It does not change. |
| `strategy.entity_types` | The stored entity types, `[]` for VectorRAG. |
| `strategy.document_count` | The document count of the cluster, which does not change. |
| `strategy.parameters` | All other fields, including the image flags, stored as strings. |

| Status Code | Meaning |
|-------------|---------|
| `200` | The strategy has been updated. |
| `400` | `cluster_id` is empty, or `strategy_type` is missing or not one of the two valid values. |
| `401` | Authentication failed. |
| `404` | There is no strategy document for this `cluster_id`. |
| `409` | A corpus build or a knowledge graph build is running. Wait for it to finish. |
| `500` | Server error. |

### HTTP example

```bash
curl -X PATCH \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "strategy_type": "VectorRAG",
    "entity_types": [],
    "extract_images": false
  }' \
  https://<EXTERNAL_ENDPOINT>:8529/autograph/{service_id_postfix}/v1/rag-strategizer/strategy/cluster_legal_0
```

## Retrieval capability per strategy

The strategy of a cluster decides what a query against that partition can
answer. This is by design. A VectorRAG partition has no `Entities` and no
`Communities`, and the entity-based query modes need them.

| Strategy | Knowledge graph contents | Query modes the partition can serve |
|----------|--------------------------|-------------------------------------|
| FullGraphRAG | `Documents`, `Chunks`, `Relations`, `Entities`, `Communities` | `LOCAL`, `GLOBAL`, `UNIFIED` |
| VectorRAG | `Documents`, `Chunks`, `Relations` | None of `LOCAL`, `GLOBAL`, `UNIFIED` |

Each partition counts on its own, not the project as a whole. A project with
both strategies only answers entity-based queries from its FullGraphRAG
partitions. A question whose answer is in the documents of a VectorRAG
partition still gets no answer, because the partition cannot serve the mode.

{{< warning >}}
**A project that only has VectorRAG partitions answers nothing in these modes,
and nothing looks broken.** The corpus build reports `completed`, the knowledge
graph build reports `failed_jobs: 0`, and the knowledge graph is reported as
built with an entity count of `0`. Check `strategy_type_counts` in
[`GET /v1/rag-strategizer/strategy`](#retrieve-rag-strategies). If it only has
`VectorRAG`, no partition can serve entity-based retrieval.

AutoGraph does not run queries and cannot reject a query mode that does not
fit. A query against a VectorRAG partition returns nothing found instead of an
error.
{{< /warning >}}

To make every partition support entities, send `complexity: "very_high"` to
[`POST /v1/rag-strategizer/analyze`](#start-the-rag-strategizer), or override
individual clusters with
[`PATCH /v1/rag-strategizer/strategy/{cluster_id}`](#update-a-cluster-strategy).
Do both before you start the knowledge graph build.
