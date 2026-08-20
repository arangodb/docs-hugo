---
title: AutoGraph Service Reference
menuTitle: Reference
weight: 30
description: >-
  AutoGraph HTTP REST API endpoints, authentication, call sequence, and workflow examples
---
This section documents the AutoGraph HTTP REST API. All endpoints require
JWT authentication and are served on port `8080`. For the pipeline
architecture, see [Architecture](../architecture.md#complete-pipeline).

{{< info >}}
**Field names are lowerCamelCase over HTTP.** This reference uses the
protobuf field names, such as `rag_partition_id` or `overall_status`. The REST
gateway emits the JSON names instead, so an actual response carries
`ragPartitionId` and `overallStatus`. Convert accordingly when you read a
response or build a request body.
{{< /info >}}

## Authentication

All endpoints require a **JWT** in the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

The service handles token renewal automatically, including for long-running
background jobs (corpus build, RAG strategizer, orchestration).

## Endpoints

Endpoints are served at **`http://<host>:8080`**.

### Pipeline

| Method | Path | Description | Details |
|--------|------|-------------|---------|
| `GET` | `/v1/health` | Check service readiness | - |
| `POST` | `/v1/import-multiple` | Upload documents with module labels | [Import Files](importing-files.md) |
| `POST` | `/v1/corpus/builds` | Start a corpus build | [Corpus Build](corpus-build.md) |
| `GET` | `/v1/corpus/builds/{id}` | Monitor build progress | [Corpus Build](corpus-build.md#monitoring-build-status) |
| `POST` | `/v1/rag-strategizer/analyze` | Assign RAG strategies to clusters | [RAG Strategizer](rag-strategizer.md) |
| `GET` | `/v1/rag-strategizer/jobs/{id}` | Monitor a strategizer run | [RAG Strategizer](rag-strategizer.md#monitor-a-strategizer-job) |
| `GET` | `/v1/rag-strategizer/strategy` | Inspect assigned strategies | [RAG Strategizer](rag-strategizer.md#retrieve-rag-strategies) |
| `PATCH` | `/v1/rag-strategizer/strategy/{cluster_id}` | Override the strategy of one cluster | [RAG Strategizer](rag-strategizer.md#update-a-cluster-strategy) |
| `POST` | `/v1/orchestrate` | Build the knowledge graph | [Graph Operations](orchestration.md) |
| `GET` | `/v1/orchestrate/{id}` | Monitor an orchestration and read the partition divergence | [Graph Operations](orchestration.md#monitor-an-orchestration) |
| `DELETE` | `/v1/orchestrate/{id}` | Cancel a running orchestration | [Graph Operations](orchestration.md#cancel-an-orchestration) |

### Document-level changes

| Method | Path | Description | Details |
|--------|------|-------------|---------|
| `POST` | `/v1/graph/insert` | Add a document to a knowledge graph that is already built | [Graph Operations](orchestration.md#insert-documents) |
| `POST` | `/v1/graph/delete` | Remove a document from the graph | [Graph Operations](orchestration.md#delete-documents) |
| `POST` | `/v1/graph/update` | Replace the content of an existing document | [Graph Operations](orchestration.md#update-documents) |
| `POST` | `/v1/graph/recluster` | Rebuild the Layer 3 communities of a partition | [Graph Operations](orchestration.md#trigger-reclustering) |

### Project operations

| Method | Path | Description | Details |
|--------|------|-------------|---------|
| `GET` | `/v1/projects/{project}/overview` | Read the whole project state in one call | [Project Operations](project-operations.md#project-overview) |
| `PUT` | `/v1/projects/{project}/model-config/credentials` | Set the chat and embedding configuration | [Project Operations](project-operations.md#update-model-config-credentials) |
| `DELETE` | `/v1/projects/{project}/categories/{category}` | Remove a category and its graph data | [Project Operations](project-operations.md#delete-category) |
| `DELETE` | `/v1/projects/{project}` | Tear down the whole project | [Project Operations](project-operations.md#delete-project) |

### Standalone

| Method | Path | Description | Details |
|--------|------|-------------|---------|
| `POST` | `/v1/embed-field-in-collection` | Add embeddings to an existing collection | [Embeddings](embeddings.md) |

For HTTP error codes and troubleshooting, see [Error Handling](error-handling.md).

{{< info >}}
**Asynchronous operations return `202 Accepted`.** `POST /v1/corpus/builds`,
`POST /v1/rag-strategizer/analyze`, and `POST /v1/orchestrate` acknowledge the
request with `202` and run the work in the background. Accept any `2xx` as
"accepted" and poll the matching status endpoint for the outcome.
{{< /info >}}

## The category contract

A **category** is the second scope level of a project and carries the label you
set as `module` when you imported the files, see
[Import files](importing-files.md#parameters).

Every endpoint that takes a category expects the **bare label**, such as
`legal`, exactly as `GET /v1/projects/{project}/overview` reports it in
`categories[].name`. The internal `{project}_legal` encoding is a server-side
detail that you never have to construct. An already encoded value is still
accepted as a legacy alias, but the bare form is the one to use.

`POST /v1/corpus/builds`, `POST /v1/rag-strategizer/analyze`, and
`POST /v1/orchestrate` take a list of them in `categories`, the `/v1/graph/*`
endpoints take a single one in `category`, and
`DELETE /v1/projects/{project}/categories/{category}` takes one in the path.

{{< warning >}}
**Responses mix bare labels and internal identifiers.** The overview exposes
bare labels on `categories[].name`, `knowledge_graph.new_categories`, and
`strategies.categories_without_strategies`. Those are the values to feed back
into a `categories` parameter.

`knowledge_graph.removed_categories` carries `rag_partition_id` values, and
`jobs[].category` of an orchestration status carries the encoded module. Never
pass either of them to a `categories` parameter.
{{< /warning >}}

## Call Sequence

All calls require a valid **`Authorization: Bearer <token>`** header.

### Standard workflow

1. `GET /v1/health` - confirm the service is ready.
2. Upload the documents. Either upload them to the File Manager under the scope
   `[project, category]`, which is the preferred path, or call
   `POST /v1/import-multiple` once per module. See
   [Import Files](importing-files.md).
3. `POST /v1/corpus/builds` - start the corpus build, preferably with
   `categories`. Returns `202` with a `corpus_build_id` and the `graph_name`.
   See [Corpus Build](corpus-build.md).
4. Poll `GET /v1/corpus/builds/{corpus_build_id}` until `status` is `completed`.
   Check `error_code` even then, because a non-empty value on a completed build
   means a partial success. See
   [Monitoring Build Status](corpus-build.md#monitoring-build-status).
5. `POST /v1/rag-strategizer/analyze` - assign RAG strategies to the clusters.
   `project` and `complexity` are required. Returns `202` with a
   `strategize_job_id`. See [RAG Strategizer](rag-strategizer.md).
6. Poll `GET /v1/rag-strategizer/jobs/{strategize_job_id}` until `status` is
   `completed`. See
   [Monitor a strategizer job](rag-strategizer.md#monitor-a-strategizer-job).
7. *(Optional)* `GET /v1/rag-strategizer/strategy` - inspect the assigned
   strategies. See
   [Retrieve RAG Strategies](rag-strategizer.md#retrieve-rag-strategies).
8. *(Optional)* `PATCH /v1/rag-strategizer/strategy/{cluster_id}` - override the
   strategy of a cluster if the assigned one is not suitable. Do this **before**
   you orchestrate. See
   [Update a cluster strategy](rag-strategizer.md#update-a-cluster-strategy).
9. `POST /v1/orchestrate` - spawn Importer workers to build the knowledge graph.
   Returns `202` with an `orchestration_id`. See
   [Graph Operations](orchestration.md).
10. Poll `GET /v1/orchestrate/{orchestration_id}`. Branch on `status`, which
    reaches `completed` only once every job is terminal *and* the imported
    partitions were found in the knowledge graph, and render `phase` as the
    progress. The response also carries the per-partition results, including the
    divergence of each FullGraphRAG partition. Read them before you start another
    orchestration, which evicts this run. See
    [Monitor an orchestration](orchestration.md#monitor-an-orchestration).

At any point,
[`GET /v1/projects/{project}/overview`](project-operations.md#project-overview)
reports where the project stands: the document and cluster counts, whether the
corpus, the strategies, or the knowledge graph are stale, and which categories
still need work.

### Embed-only workflow

Use this path when you already have documents in ArangoDB and only need
vector embeddings and a search index on one attribute. No import or corpus
build is required.

1. `GET /v1/health`
2. `POST /v1/embed-field-in-collection` - add vector embeddings to an
   existing ArangoDB collection. Repeat per `(collection, field)` pair.
   See [Embeddings](embeddings.md).

### Adding a category to an existing corpus

Follow the standard workflow, but in step 3 list **only** the new category in
`categories` and leave `incremental` at its default of `false`. The existing
categories are left untouched.

Use `incremental: true` only to **append documents to a category that already
exists**. A full rebuild of an already built category is rejected with
`REBUILD_NOT_ALLOWED`, see [Corpus Build](corpus-build.md#create-corpus-build).

### Rebuilding a category

There is no in-place rebuild. To rebuild a category from scratch, remove it with
[`DELETE /v1/projects/{project}/categories/{category}`](project-operations.md#delete-category),
then run a corpus build, the strategizer, and an orchestration again. This is
also the supported recovery path for a partition that imported incompletely.

### Document-level changes to an existing graph

Use these calls if the corpus graph is already built and you only want to change
individual documents. See
[Incremental Graph Updates](../incremental-graph-updates.md) for the
prerequisites, a comparison with a rebuild, and the full endpoint reference.

1. Call `POST /v1/graph/insert`, `/v1/graph/delete`, or `/v1/graph/update`,
   depending on what changed. Insert and update only cover Layers 1 and 2.
   Delete is synchronous and removes the Layer 3 data itself.
2. After an insert or a successful update, call `POST /v1/orchestrate` with the
   `file_ids` of the changed documents, so that Layer 3 contains the new
   content.
3. Check `divergence_score` and `needs_reclustering` in the `jobs` of
   `GET /v1/orchestrate/{id}`. Insert and update responses do not report them.
   After a delete, they are on each file's result if its `overall_status` is
   `COMMITTED`.
4. *(Optional)* Call `POST /v1/graph/recluster` if the flag is `true` and you
   want to refresh the communities. Reclustering is never automatic.

### Ordering rules

{{< warning >}}
- Do not call `POST /v1/rag-strategizer/analyze` until the corpus build
  reaches `status: completed`.
- Do not call `POST /v1/orchestrate` until the strategizer has finished
  after a successful build.
- Do not call the `/v1/graph/*` endpoints before the initial corpus build has
  finished.
- Only one corpus build, orchestration run, or graph update can be active at a
  time. If they overlap, you get a `409`.
- `POST /v1/orchestrate` returns `409` when every category with strategies is
  already in the knowledge graph. That is a successful steady state, not a
  failure, see
  [Telling the three `409` responses apart](orchestration.md#telling-the-three-409-responses-apart).
- `DELETE /v1/projects/{project}/categories/{category}` and
  `PATCH /v1/rag-strategizer/strategy/{cluster_id}` also return `409` while a
  build or an orchestration is running.
{{< /warning >}}

For guidance on structuring your data with modules, see the
[Design Guide](../design-guide.md).

## Workflow Examples

### Knowledge graph build

This example drives the build from File Manager categories. To use the legacy
direct-upload path instead, call `POST /v1/import-multiple` first and omit
`categories` from the corpus build (see [Import Files](importing-files.md)).

```bash
# Step 1: Health check
curl -H "Authorization: Bearer <token>" http://localhost:8080/v1/health

# Step 2: Build the corpus for the categories you uploaded to the File Manager.
# Returns 202 with corpus_build_id and graph_name.
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "embedding_strategy": "first_chunk",
    "categories": ["legal", "finance"],
    "strategy": { "top_k": 7, "cluster_threshold": 2 }
  }' \
  http://localhost:8080/v1/corpus/builds

# Step 3: Monitor build progress. Poll until status is completed or failed, and
# check error_code even on a completed build.
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/v1/corpus/builds/<corpus_build_id>

# Step 4: Analyze the clusters. Returns 202 with strategize_job_id.
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"project": "my_project", "complexity": "high"}' \
  http://localhost:8080/v1/rag-strategizer/analyze

# Step 5: Monitor the strategizer job
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/v1/rag-strategizer/jobs/<strategize_job_id>

# Step 6: Review the strategies
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/v1/rag-strategizer/strategy

# Step 7: Start the orchestration. Returns 202 with orchestration_id.
# A 409 here means every eligible category is already in the knowledge graph.
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"project": "my_project", "replicas": 2, "max_retries": 3}' \
  http://localhost:8080/v1/orchestrate

# Step 8: Monitor the orchestration
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/v1/orchestrate/<orchestration_id>
```

### Checking the project state

```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/v1/projects/my_project/overview
```

### Removing a category

```bash
# Graph cleanup and file deletion. delete_files is a query parameter.
curl -X DELETE \
  -H "Authorization: Bearer <token>" \
  "http://localhost:8080/v1/projects/my_project/categories/legal?delete_files=true"
```

### Field embedding on an existing collection

Use this when you already have documents in ArangoDB and only need vector
embeddings and a search index on one attribute. No import or corpus build
is required.

```bash
# Health check
curl -H "Authorization: Bearer <token>" http://localhost:8080/v1/health

# Embed one field (collection must exist; field must not end with _embedding)
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"collection": "my_collection", "field": "content"}' \
  http://localhost:8080/v1/embed-field-in-collection
```

## JSON field naming

The request and response examples in this section spell field names in
**snake_case**, such as `corpus_build_id` and `document_count`. Responses come
back in **camelCase** on the wire (`corpusBuildId`, `documentCount`). Read the
examples as field identifiers rather than as the literal wire encoding, and
parse the responses accordingly. Request bodies are accepted in either form.

## API Reference

For detailed API documentation, see the
[AutoGraph API Reference](https://apiref.arango.ai/#autograph).
