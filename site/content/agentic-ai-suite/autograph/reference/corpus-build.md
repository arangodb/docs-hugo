---
title: Corpus Build
menuTitle: Corpus Build
description: >-
  Create and monitor corpus builds for document analysis and clustering
weight: 40
aliases:
  - ../../../reference/autograph/corpus-build/
---

## Create Corpus Build

{{< endpoint "POST" "/v1/corpus/builds" >}}

Trigger a corpus build from imported files or File Manager.

**Recommended path:** Call this after importing all documents for the modules you want to build. For a first build, omit `incremental` (it defaults to false - existing module data is wiped and rebuilt cleanly). To add or update specific modules without touching the rest of the corpus, set `incremental: true` and list the target modules in `modules`. Only one build may run at a time.

### Request (Option A — File Manager Integration)

```json
{
  "embedding_strategy": "first_chunk",
  "file_ids": ["file_id_1", "file_id_2", "file_id_3"],
  "strategy": {
    "top_k": 7,
    "cluster_threshold": 2
  },
  "modules": ["legal", "marketing"],
  "incremental": false
}
```

### Request (Option B — Previously Imported Files)

```json
{
  "embedding_strategy": "first_chunk",
  "strategy": {
    "top_k": 7,
    "cluster_threshold": 2
  }
}
```

### Parameters

| Parameter | Type | Required | Description | Recommended value |
|-----------|------|----------|-------------|-------------------|
| `embedding_strategy` | string | Yes | Selects how text is chosen for embedding. | Required. Use **`"first_chunk"`**. |
| `file_ids` | string[] | No | File Manager IDs from your platform. The service downloads these files for the build. | Supply when files already live in the platform File Manager. Omit when you have uploaded files via `import-multiple`. |
| `strategy` | object | No | Tunables for similarity and clustering. | Omit to use service defaults (see below). |
| `strategy.top_k` | integer | No | How many similar neighbors each document gets (edge count driver). | **7** (default): good general default. **5–10**: typical range; higher = denser graph, more work and API cost. |
| `strategy.cluster_threshold` | integer | No | Controls clustering depth. **`1`**: flat grouping. **`2`**: hierarchical (default, produces richer structure). | **2** for most corpora; **1** for simpler/faster clustering or very small document sets. |
| `strategy.custom_params` | map | No | Extra string key/values interpreted by the service (e.g. graph naming). | Omit unless your operator documents a key (e.g. `graph_name`). |
| `modules` | string[] | No | Restricts which module labels are built in this run. | **Omit** to auto-discover all modules from imported files. Set explicitly (e.g. **`["legal"]`**) when using `incremental: true` to target specific modules. |
| `incremental` | boolean | No | When true, existing data for other modules is preserved; only the modules listed in `modules` are updated. When false (default), data for each listed module is wiped before rebuilding. | **false** for a first build or full rebuild. **true** to update specific modules without touching others. |

### Response

```json
{
  "corpus_build_id": "cb_01ARZ3NDEKTSV4RRFFQ69G5FAV"
}
```

**Formats:** common text and markup (e.g. `.txt`, `.md`, `.json`, `.html`, `.xml`, `.csv`), **PDF** (page-oriented extraction), and **Office** formats (via conversion to PDF where the deployment provides LibreOffice).

**Chunk limit:** by default the first **1200 tokens (~4800 characters)** per document drive embedding. PDFs fill that budget page-by-page; other formats use a character cap. Your operator may tune limits via service configuration (`CHUNK_SIZE` and `CHARACTERS_PER_TOKENS`).

| Status Code | Meaning |
|-------------|---------|
| `200` | Build started successfully |
| `400` | Invalid request |
| `401` | Authentication failed |
| `409` | Another build is already in progress |
| `500` | Server error |

### HTTP Example

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "embedding_strategy": "first_chunk",
    "file_ids": ["id1", "id2"],
    "strategy": { "top_k": 10, "cluster_threshold": 2 }
  }' \
  http://localhost:8080/v1/corpus/builds
```

---

## Monitoring Build Status

{{< endpoint "GET" "/v1/corpus/builds/{corpus_build_id}" >}}

Check the progress of a corpus build.

**Recommended path:** Immediately after **`POST /v1/corpus/builds`** returns `corpus_build_id`, poll this endpoint until **`status`** is **`completed`** or **`failed`**. Typical interval: **5–30 seconds** for short builds; **30–60 seconds** for very large corpora to avoid load.

### Parameters

| Parameter | Location | Required | Description | Recommended value |
|-----------|----------|----------|-------------|-------------------|
| `corpus_build_id` | URL path | Yes | The id returned by create build. | Use the value verbatim (e.g. `cb_…`). |

### Response

```json
{
  "corpus_build_id": "cb_01ARZ3NDEKTSV4RRFFQ69G5FAV",
  "status": "running",
  "message": "Creating similarity edges...",
  "progress": 55,
  "error": "",
  "started_at": 1705344000.0,
  "completed_at": 0.0
}
```

| Field | Type | Description |
|-------|------|-------------|
| `corpus_build_id` | string | Build identifier |
| `status` | string | **`pending`** → **`running`** → **`completed`** or **`failed`**. Only proceed to strategizer on **`completed`**. |
| `message` | string | Human-readable stage (e.g. similarity or clustering). |
| `progress` | integer | **0–100**; use together with `message` for UI. |
| `error` | string | Non-empty when **`failed`** — use for support tickets. |
| `started_at` | double | Unix epoch seconds (float). |
| `completed_at` | double | Set when finished; **0** while running. |

### HTTP Example

```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/v1/corpus/builds/cb_01ARZ3NDEKTSV4RRFFQ69G5FAV
```

---

## Incremental Builds

Incremental builds allow you to add new modules or update existing ones without rebuilding the entire corpus.

**When to use incremental builds:**
- Adding new document modules to an existing corpus
- Updating specific modules while preserving others
- Reducing build time for large corpora

{{< warning >}}
Do not use incremental mode for a first-time build. Incremental builds preserve existing collections. If you need to completely rebuild everything from scratch, use `incremental: false` (the default).
{{< /warning >}}

## Next Steps

- **[Run RAG Strategizer](rag-strategizer.md)**: Analyze clusters and get RAG strategy recommendations
- **[Orchestrate Pipeline](orchestration.md)**: Automatically build knowledge graphs
