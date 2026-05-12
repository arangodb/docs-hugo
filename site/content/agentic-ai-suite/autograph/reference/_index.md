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

## Authentication

All endpoints require a **JWT** in the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

The service handles token renewal automatically, including for long-running
background jobs (corpus build, RAG strategizer, orchestration).

## Endpoints

Endpoints are served at **`http://<host>:8080`**.

| Method | Path | Description | Details |
|--------|------|-------------|---------|
| `GET` | `/v1/health` | Check service readiness | - |
| `POST` | `/v1/import-multiple` | Upload documents with module labels | [Import Files](importing-files.md) |
| `POST` | `/v1/corpus/builds` | Start a corpus build | [Corpus Build](corpus-build.md) |
| `GET` | `/v1/corpus/builds/{id}` | Monitor build progress | [Corpus Build](corpus-build.md#monitoring-build-status) |
| `POST` | `/v1/rag-strategizer/analyze` | Assign RAG strategies to clusters | [RAG Strategizer](rag-strategizer.md) |
| `GET` | `/v1/rag-strategizer/strategy` | Inspect assigned strategies | [RAG Strategizer](rag-strategizer.md#retrieve-rag-strategies) |
| `POST` | `/v1/orchestrate` | Build the knowledge graph | [Orchestration](orchestration.md) |
| `POST` | `/v1/embed-field-in-collection` | Add embeddings to an existing collection | [Embeddings](embeddings.md) |

For HTTP error codes and troubleshooting, see [Error Handling](error-handling.md).

## Call Sequence

All calls require a valid **`Authorization: Bearer <token>`** header.

### Standard workflow

1. `GET /v1/health` - confirm the service is ready.
2. `POST /v1/import-multiple` - upload documents. Repeat once per module
   (for example, call once for `"legal"`, once for `"engineering"`, and so on).
   See [Import Files](importing-files.md).
3. `POST /v1/corpus/builds` - start the corpus build for all imported modules.
   See [Corpus Build](corpus-build.md).
4. Poll `GET /v1/corpus/builds/{corpus_build_id}` until `status` is `completed`.
   See [Monitoring Build Status](corpus-build.md#monitoring-build-status).
5. `POST /v1/rag-strategizer/analyze` - assign RAG strategies to clusters.
   See [RAG Strategizer](rag-strategizer.md).
6. *(Optional)* `GET /v1/rag-strategizer/strategy` - inspect the assigned strategies.
   See [RAG Strategizer](rag-strategizer.md#retrieve-rag-strategies).
7. `POST /v1/orchestrate` - spawn Importer workers to build the knowledge graph.
   See [Orchestration](orchestration.md).

### Embed-only workflow

Use this path when you already have documents in ArangoDB and only need
vector embeddings and a search index on one attribute. No import or corpus
build is required.

1. `GET /v1/health`
2. `POST /v1/embed-field-in-collection` - add vector embeddings to an
   existing ArangoDB collection. Repeat per `(collection, field)` pair.
   See [Embeddings](embeddings.md).

### Adding a module to an existing corpus

Follow the standard workflow, but in step 3 set `incremental: true` and list
only the new module in `modules`. Existing modules are preserved; only the
listed modules are updated. See
[Incremental Builds](corpus-build.md#incremental-builds).

### Ordering rules

{{< warning >}}
- Do not call `POST /v1/rag-strategizer/analyze` until the corpus build
  reaches `status: completed`.
- Do not call `POST /v1/orchestrate` until the strategizer has finished
  after a successful build.
- Only one corpus build and one orchestration run may be active at a time
  (`409` if you collide).
{{< /warning >}}

For guidance on structuring your data with modules, see the
[Design Guide](../design-guide.md).

## Workflow Examples

### Knowledge graph build

This example uses the `import-multiple` path. To use File Manager instead,
replace steps 2 and 3 with a single `POST /v1/corpus/builds` call that
includes `file_ids` (see [Corpus Build](corpus-build.md)).

```bash
# Step 1: Health check
curl -H "Authorization: Bearer <token>" http://localhost:8080/v1/health

# Step 2: Import documents (repeat per module)
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "files": [
      {
        "doc_name": "doc1.txt",
        "content": "VGV4dCBjb250ZW50",
        "citable_url": "https://example.com/doc1"
      }
    ],
    "module": "engineering"
  }' \
  http://localhost:8080/v1/import-multiple

# Step 3: Build corpus
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "embedding_strategy": "first_chunk",
    "strategy": { "top_k": 7, "cluster_threshold": 2 }
  }' \
  http://localhost:8080/v1/corpus/builds

# Step 4: Monitor build progress
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/v1/corpus/builds/<corpus_build_id>

# Step 5: Analyze clusters (after build completes)
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"full_graph_rag_strategy": "high"}' \
  http://localhost:8080/v1/rag-strategizer/analyze

# Step 6: Review strategies
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/v1/rag-strategizer/strategy

# Step 7: Start orchestration
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"replicas": 2, "max_retries": 3}' \
  http://localhost:8080/v1/orchestrate
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

## API Reference

For detailed API documentation, see the
[AutoGraph API Reference](https://apiref.arango.ai/#autograph).
