---
title: AutoGraph RAG Strategizer Reference
menuTitle: RAG Strategizer
description: >-
  Analyze document clusters, assign RAG strategies, and override them per cluster
weight: 45
---
## Trigger RAG Strategizer

{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/rag-strategizer/analyze" >}}

Analyze existing clusters and assign a RAG strategy to each of them. Must be
called **after** a corpus build is completed.

**Recommended path:** Call after the corpus build reaches `completed`, and before
`POST /v1/orchestrate`. If you rebuild the corpus, run the strategizer again so
that `rags` reflects the current clusters.

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

| Parameter | Type | Required | Description | Recommended value |
|-----------|------|----------|-------------|-------------------|
| `project` | string | **Yes** | Has to match the project the service runs against. | The project name of your deployment. |
| `complexity` | string | **Yes** | Controls what **fraction of clusters** receives **FullGraphRAG**. The rest get **VectorRAG**. Values: **`very_low`** → 0%, **`low`** → 25%, **`moderate`** → 50%, **`high`** → 75%, **`very_high`** → 100%. Omitting it, or sending an unknown value, returns `400`. | **`very_high`** when every partition has to serve entity-based queries. **`high`** as a balanced default for mixed corpora. |
| `extract_images_default` | boolean | No | When `true`, enables the image processing flags (semantic units, image processing, image embeddings) on **FullGraphRAG profiles only**. Allowed when `complexity` is `high` or `very_high`. VectorRAG profiles always keep these flags at `false`. | **`false`** (default). Set it to `true` only when you need multimodal image extraction. |
| `categories` | string[] | No | Bare category labels, to scope the run to specific categories. **Not validated up front**: the request always returns `202`. If any listed category has no matching cluster, the asynchronous job ends with `status: failed` and a message naming the categories it could not match. | Omit or send `[]` to analyze every category. Use the bare label from [Project Overview](project-operations.md#project-overview) to re-run one of them. |
| `max_parallel_clusters` | integer | No | Limits how many clusters are analyzed concurrently. Each analysis can call the LLM. | Default: **5**. Lower it to **2–3** if you hit LLM rate limits. |

{{< warning >}}
**`full_graph_rag_strategy` has been removed.** The field is dropped silently by
the gateway, so a client that only sends it now gets `400`
(`complexity is required`). Replace it with `complexity`:

| Old `full_graph_rag_strategy` | New `complexity` | FullGraphRAG share |
|-------------------------------|------------------|--------------------|
| `very high` | `very_high` | 100% |
| `high` | `high` | 75% |
| - | `moderate` | 50% |
| `low` | `low` | 25% |
| `very low` | `very_low` | 0% |

Custom percentage strings such as `"40%"` are no longer supported. Pick the
nearest of the five values.
{{< /warning >}}

### How `complexity` is applied

The percentage applies to the **ranked** cluster list: the top
`round(percentage / 100 * cluster_count)` clusters get FullGraphRAG and the rest
get VectorRAG. With few clusters, the rounding decides the outcome. At
`moderate`, a project with a single cluster gets `round(0.5) == 0` FullGraphRAG
clusters, so the whole project ends up on VectorRAG:

| Clusters | Result at `moderate` |
|----------|----------------------|
| 1 | 0 FullGraphRAG · 1 VectorRAG |
| 2 | 1 FullGraphRAG · 1 VectorRAG |
| 3 | 2 FullGraphRAG · 1 VectorRAG |
| 4 | 2 FullGraphRAG · 2 VectorRAG |
| 5 | 2 FullGraphRAG · 3 VectorRAG |

A VectorRAG partition has no `Entities` and no `Communities`, so it cannot serve
`LOCAL`, `GLOBAL`, or `UNIFIED` queries. Send `very_high` when every partition
has to support entity-based retrieval. See
[Retrieval capability per strategy](#retrieval-capability-per-strategy).

### Response

```json
{
  "strategize_job_id": "strat_1738000000_a1b2c3d4"
}
```

The strategizer runs asynchronously. Poll
[`GET /v1/rag-strategizer/jobs/{strategize_job_id}`](#monitor-a-strategizer-job)
for the live progress.

For each cluster the strategizer samples documents, computes a complexity score,
and assigns **FullGraphRAG** or **VectorRAG**. For FullGraphRAG clusters it also
uses an LLM to generate a **domain-specific ontology** of 8 to 12 entity types.
The ontology and the strategy profiles are persisted to the **`rags`**
collection and later passed to the Importer to constrain entity extraction, see
[Per-cluster ontology](../design-guide.md#per-cluster-ontology-entity_types).

| Status Code | Meaning |
|-------------|---------|
| `202` | Job accepted, `strategize_job_id` returned |
| `400` | Invalid `project`, `complexity`, or `extract_images_default`, or the model configuration gate is latched (see [Corpus Build](corpus-build.md#create-corpus-build)) |
| `401` | Authentication failed |
| `403` | No database access |
| `409` | A corpus build is still in progress, another strategizer run is active, or a project deletion has started |
| `500` | Server error |

{{< info >}}
**This endpoint returns `202`, not `200`.** Accept any `2xx` as "accepted". The
response body is unchanged.
{{< /info >}}

{{< warning >}}
**Re-running the strategizer does not overwrite existing profiles.** A cluster
that already has a document in `rags` is reported as *skipped* and left as it
is. The completion message names the skipped cluster IDs. If the strategy type
would have changed, a warning is logged and both documents stay active. Clear
the `rags` collection before you re-run if you need a clean slate, or override
individual clusters with
[`PATCH /v1/rag-strategizer/strategy/{cluster_id}`](#update-a-cluster-strategy).
{{< /warning >}}

### HTTP Example

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
  https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/rag-strategizer/analyze
```

---

## Monitor a strategizer job

{{< endpoint "GET" "https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/rag-strategizer/jobs/{strategize_job_id}" >}}

Poll the live progress of an analyze run with the `strategize_job_id` that
[`POST /v1/rag-strategizer/analyze`](#trigger-rag-strategizer) returned. Use it
to drive a progress bar while the job runs in the background.

### Parameters

| Parameter | Location | Required | Description |
|-----------|----------|----------|-------------|
| `strategize_job_id` | URL path | Yes | The ID returned by the analyze request. |

### Response

```json
{
  "status": "running",
  "progress": 42.0,
  "clusters_total": 10,
  "clusters_done": 4
}
```

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | **`idle`**, **`pending`**, **`running`**, **`completed`**, or **`failed`**. |
| `progress` | number | Overall progress in percent, **0.0–100.0**. |
| `clusters_total` | integer | Clusters to analyze. **0** until the number is known. |
| `clusters_done` | integer | Clusters that have finished, including empty and failed ones. |

Poll until `status` is `completed` or `failed`. A terminal snapshot is kept for
a bounded window, one hour by default, and is then evicted. The status lives in
memory and is lost on a pod restart.

| Status Code | Meaning |
|-------------|---------|
| `200` | Snapshot returned |
| `401` | Authentication failed |
| `404` | Unknown or expired `strategize_job_id`, including an empty ID |

{{< info >}}
**A scoped run fails as a whole.** If you sent `categories` and any of the
listed categories has no matching cluster, the job ends with `status: failed`,
even when the other categories did match. The message names the categories it
could not match, echoed back in the form you sent them. Category labels are
case-sensitive; check them against
[Project Overview](project-operations.md#project-overview).
{{< /info >}}

### HTTP Example

```bash
curl -H "Authorization: Bearer <token>" \
  https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/rag-strategizer/jobs/strat_1738000000_a1b2c3d4
```

---

## Retrieve RAG Strategies

{{< endpoint "GET" "https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/rag-strategizer/strategy" >}}

Retrieve all RAG strategies that have been created.

**Recommended path:** Optional audit step after the strategizer job reaches
`completed`. Use it to check which strategy each cluster was assigned before you
orchestrate, and to get the `rag_partition_id` values that
`POST /v1/graph/recluster` takes. Safe to call anytime for read-only inspection.

### Request

No body or query parameters.

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

| Field | Type | Description |
|-------|------|-------------|
| `strategies` | array | One entry per cluster strategy profile. |
| `strategies[].cluster_id` | string | Domain/cluster key (e.g. `cluster_legal_0`, or `cluster_0` when no module prefix applies). This is the value that [`PATCH /v1/rag-strategizer/strategy/{cluster_id}`](#update-a-cluster-strategy) takes. |
| `strategies[].strategy_type` | string | **`FullGraphRAG`** or **`VectorRAG`**. Decides which query modes the partition can serve, see [Retrieval capability per strategy](#retrieval-capability-per-strategy). |
| `strategies[].rag_partition_id` | string | Id passed to the Importer, and the id that [`POST /v1/graph/recluster`](orchestration.md#trigger-reclustering) takes in its `partition_ids`. It is **not** accepted by `POST /v1/orchestrate`, which scopes by `categories` and `file_ids`. Suffix **`_a`** = FullGraphRAG, **`_b`** = VectorRAG. |
| `strategies[].entity_types` | array | Domain-specific entity types generated by the LLM for FullGraphRAG clusters. Always empty for VectorRAG, which extracts no entities. Passed to the Importer to constrain entity extraction (see [Per-cluster ontology](../design-guide.md#per-cluster-ontology-entity_types)). |
| `strategies[].document_count` | integer | Documents in that cluster. |
| `strategies[].parameters` | map | All non-core fields stored alongside the strategy, as a string-to-string map. Always includes **`rag_mode`** (mirrors `strategy_type`) and the **`module`** label when one applies. **FullGraphRAG** profiles additionally include the importer tunables shown above (`batch_size`, `enable_chunk_embeddings`, `enable_edge_embeddings`, `chunk_token_size`, `chunk_overlap_token_size`, `community_report_num_findings`, `enable_semantic_units`). Note that while `enable_semantic_units` is set to true, automatic citation extraction is not yet implemented (see [Known Limitations](error-handling.md#citation-handling)). If LLM-driven entity-type generation failed for a FullGraphRAG cluster, the field **`entity_generation_error`** is included and `entity_types` is empty. Booleans and numbers are serialized as their string form. |
| `total_strategies` | integer | Length of `strategies`. |
| `strategy_type_counts` | map | e.g. counts of `VectorRAG` vs `FullGraphRAG`. |

{{< info >}}
This response does not carry the category label of its own. The `cluster_id`
embeds it, but to scope an orchestration run, pass the bare category labels from
[Project Overview](project-operations.md#project-overview) instead.
{{< /info >}}

### HTTP Example

```bash
curl -H "Authorization: Bearer <token>" \
  https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/rag-strategizer/strategy
```

---

## Update a cluster strategy

{{< endpoint "PATCH" "https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/rag-strategizer/strategy/{cluster_id}" >}}

Override the strategy type, the entity types, and the image extraction flag of a
single cluster. Use it when the automatically assigned strategy is not what you
want.

**Recommended path:** Call after
[`GET /v1/rag-strategizer/strategy`](#retrieve-rag-strategies) and **before**
`POST /v1/orchestrate`.

{{< warning >}}
**Override before the first orchestration.** The `rag_partition_id` of the
strategy is never changed by this endpoint, so a partition that is already in
the knowledge graph still counts as built. `POST /v1/orchestrate` then returns
`409` instead of importing it again under the new strategy.

To change a partition that has already been imported, delete the category with
[`DELETE /v1/projects/{project}/categories/{category}`](project-operations.md#delete-category),
build it again, re-run the strategizer, and orchestrate.
{{< /warning >}}

### Request

```json
{
  "strategy_type": "FullGraphRAG",
  "entity_types": ["PERSON", "ORGANIZATION", "LOCATION"],
  "extract_images": false
}
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `cluster_id` | URL path | Yes | The cluster to update, for example `cluster_legal_0`. Take it from [`GET /v1/rag-strategizer/strategy`](#retrieve-rag-strategies). |
| `strategy_type` | string | **Yes** | `"FullGraphRAG"` or `"VectorRAG"`. |
| `entity_types` | string[] | No | Domain-specific entity types. Forced to `[]` when `strategy_type` is `VectorRAG`. |
| `extract_images` | boolean | No | Enables image extraction. Forced to `false` when `strategy_type` is `VectorRAG`. |

{{< info >}}
**VectorRAG normalizes the request.** With `strategy_type: "VectorRAG"`,
`entity_types` is always stored as `[]` and the image flags
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

| Field | Type | Description |
|-------|------|-------------|
| `strategy.cluster_id` | string | The cluster that was updated. |
| `strategy.strategy_type` | string | The persisted strategy type. |
| `strategy.rag_partition_id` | string | Unchanged, the same value as before the update. |
| `strategy.entity_types` | array | The persisted entity types, `[]` for VectorRAG. |
| `strategy.document_count` | integer | The unchanged document count of the cluster. |
| `strategy.parameters` | map | All remaining fields, including the image flags, stored as strings. |

| Status Code | Meaning |
|-------------|---------|
| `200` | The strategy has been updated |
| `400` | `cluster_id` is empty, or `strategy_type` is missing or not one of the two valid values |
| `401` | Authentication failed |
| `404` | No strategy document exists for this `cluster_id` |
| `409` | A corpus build or an orchestration is running. Wait for it to finish. |
| `500` | Server error |

### HTTP Example

```bash
curl -X PATCH \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "strategy_type": "VectorRAG",
    "entity_types": [],
    "extract_images": false
  }' \
  https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/rag-strategizer/strategy/cluster_legal_0
```

---

## Retrieval capability per strategy

The strategy of a cluster decides **what a query against that partition can
answer**. This is by design: a VectorRAG partition has no `Entities` and no
`Communities`, and the entity-based query modes are built on that entity layer.

| Strategy | Layer 3 contents | Query modes the partition can serve |
|----------|------------------|-------------------------------------|
| **FullGraphRAG** | `Documents`, `Chunks`, `Relations`, **`Entities`**, **`Communities`** | `LOCAL`, `GLOBAL`, `UNIFIED` |
| **VectorRAG** | `Documents`, `Chunks`, `Relations` | none of `LOCAL`, `GLOBAL`, `UNIFIED` |

**The partition is the unit, not the project.** A project that holds both
strategies answers entity-based queries only from its FullGraphRAG partitions. A
question whose answer sits in the documents of a VectorRAG partition still comes
back unanswered, because the partition cannot serve the mode.

{{< warning >}}
**A project that is entirely VectorRAG answers nothing in these modes, and
nothing looks broken.** The corpus build reports `completed`, the orchestration
reports `failed_jobs: 0`, and the knowledge graph is reported as built with an
entity count of `0`. Check `strategy_type_counts` in
[`GET /v1/rag-strategizer/strategy`](#retrieve-rag-strategies): if it contains
only `VectorRAG`, no partition can serve entity-based retrieval.

AutoGraph does not run queries and cannot reject an incompatible query mode. A
query against a VectorRAG partition is answered with nothing found, rather than
refused.
{{< /warning >}}

To make every partition entity-capable, send `complexity: "very_high"` to
[`POST /v1/rag-strategizer/analyze`](#trigger-rag-strategizer), or override
individual clusters with
[`PATCH /v1/rag-strategizer/strategy/{cluster_id}`](#update-a-cluster-strategy).
Do both **before** you orchestrate.

## Next Steps

- **[Orchestrate Pipeline](orchestration.md)**: Automatically build knowledge graphs for all strategies
- **[Per-cluster ontology](../design-guide.md#per-cluster-ontology-entity_types)**: How entity types shape your knowledge graph
