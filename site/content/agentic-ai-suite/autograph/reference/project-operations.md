---
title: AutoGraph Project Operations
menuTitle: Project Operations
description: >-
  Inspect the state of a project, configure its chat and embedding models, and
  remove categories or the whole project
weight: 58
---
The endpoints on this page sit outside the sequential pipeline. You can inspect
and configure a project at any time. The two delete endpoints are guarded
against a running build or orchestration and return `409` while one is active.

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/v1/projects/{project}/overview` | [Read the whole project state in one call](#project-overview) |
| `PUT` | `/v1/projects/{project}/model-config/credentials` | [Set the chat and embedding configuration](#update-model-config-credentials) |
| `DELETE` | `/v1/projects/{project}/categories/{category}` | [Remove one category and its graph data](#delete-category) |
| `DELETE` | `/v1/projects/{project}` | [Tear down the whole project](#delete-project) |

The `{project}` path segment always has to name the project that the service
runs against. What a mismatch returns differs per endpoint and is documented
below.

## Project Overview

{{< endpoint "GET" "https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/projects/{project}/overview" >}}

Read the state of a project in one aggregate call: a corpus graph card, a
knowledge graph card, a strategies block, and a per-category list with staleness
flags.

**Recommended path:** Safe to call at any time, it is a read-only aggregate. Use
it to drive a dashboard, to decide whether a build is needed before you call
`POST /v1/corpus/builds`, and to find the categories that still have no
strategies. Staleness is computed **at read time**, there is no stored flag that
you have to refresh.

### Parameters

| Parameter | Location | Type | Required | Description |
|-----------|----------|------|----------|-------------|
| `project` | URL path | string | Yes | Has to match the project the service runs against. |
| `scope` | query | string[] | No | File Manager scope subtree filter, 0 to 5 labels. It is rooted below the project automatically, so you pass the labels below the project. |
| `search` | query | string | No | Case-insensitive substring match on the file name. |
| `name` | query | string | No | Exact file name filter. |
| `limit` | query | integer | No | Paging limit. A value above **1,000** is **silently clamped** to 1,000, so a large limit returns a quietly truncated page rather than an error. `0` or a negative value means unbounded: the whole filtered listing from `offset` onward. |
| `offset` | query | integer | No | Paging offset. A negative value is clamped to `0`. |

{{< info >}}
The browse parameters (`scope`, `search`, `name`, `limit`, and `offset`) only
affect `filtered_total_documents`. They never narrow the `categories` list or
`total_documents`. Page with `offset` instead of asking for one oversized page.
{{< /info >}}

### Response

```json
{
  "project": "my_project",
  "corpus_graph": {
    "name": "my_project_CorpusGraph",
    "status": "ready",
    "document_count": 428,
    "cluster_count": 12,
    "stale": true,
    "graph_explorer_url": "https://.../_db/my_project/_admin/aardvark/graph/my_project_CorpusGraph"
  },
  "knowledge_graph": {
    "name": "my_project_kg",
    "status": "stale",
    "entity_count": 3184,
    "relationship_count": 9022,
    "stale": true,
    "new_categories": ["finance"],
    "removed_categories": []
  },
  "strategies": {
    "stale": true,
    "categories_without_strategies": ["finance"]
  },
  "categories": [
    {
      "name": "legal",
      "document_count": 210,
      "needs_corpus_update": false,
      "needs_strategies": false
    },
    {
      "name": "finance",
      "document_count": 218,
      "needs_corpus_update": true,
      "needs_strategies": true
    }
  ],
  "category_count": 2,
  "total_documents": 428,
  "filtered_total_documents": 0
}
```

| Field | Type | Description |
|-------|------|-------------|
| `project` | string | Echo of the requested project. |
| `corpus_graph.name` | string | The corpus named graph, for example `{project}_CorpusGraph`. |
| `corpus_graph.status` | string | `building`, `ready`, or `failed`. |
| `corpus_graph.document_count` | integer | Source documents in the corpus. |
| `corpus_graph.cluster_count` | integer | Leiden clusters, that is domains. These are clusters, not chunks. |
| `corpus_graph.stale` | boolean | `true` when the sources or the strategies are behind their inputs. |
| `corpus_graph.graph_explorer_url` | string | Deep link into the ArangoDB graph explorer. |
| `knowledge_graph.name` | string | The knowledge graph, for example `{project}_kg`. |
| `knowledge_graph.status` | string | `not_built`, `built`, or `stale`. |
| `knowledge_graph.entity_count` | integer | Distinct entities in the knowledge graph. |
| `knowledge_graph.relationship_count` | integer | Distinct relationships in the knowledge graph. |
| `knowledge_graph.stale` | boolean | `true` when the knowledge graph partitions diverge from the current strategies. |
| `knowledge_graph.new_categories` | string[] | **Bare category labels** that have strategy partitions in `rags` but are not in the knowledge graph yet. Several partitions of one category collapse into a single entry. A non-empty list means orchestration work is pending. Pass these values to `categories` on `POST /v1/orchestrate`, or omit `categories` to build everything that is stale. |
| `knowledge_graph.removed_categories` | string[] | The **`rag_partition_id` values** of the **last successful** [category delete](#delete-category), for example `my_project_finance_0_a`. Overwritten on every delete, and empty when no category has been deleted since the pod started. |
| `strategies.stale` | boolean | `true` when a category has no strategy, or a strategy is out of date. |
| `strategies.categories_without_strategies` | string[] | **Bare category labels** with no RAG strategy. Pass them straight to `categories` on `POST /v1/rag-strategizer/analyze`. |
| `categories[].name` | string | The **bare category label**, for example `legal`. This is the value that every category-taking endpoint expects. |
| `categories[].document_count` | integer | Documents in this category. |
| `categories[].needs_corpus_update` | boolean | `true` when the files of this category are ahead of the corpus graph, or not covered by it. |
| `categories[].needs_strategies` | boolean | `true` when this category has no RAG strategy yet. |
| `category_count` | integer | Number of entries in `categories`. |
| `total_documents` | integer | The **unfiltered** project total, the sum of the per-category counts. The browse parameters never narrow it. |
| `filtered_total_documents` | integer | The filtered File Manager page total when a browse or paging parameter is set, and **`0`** otherwise. |

{{< info >}}
**`new_categories` returns labels, `removed_categories` returns partition IDs.**
Staleness is computed over `rag_partition_id` values internally.
`new_categories` decodes them back to the bare label below the project
(`my_project_legal_0_a` → `legal`) and deduplicates them, while
`removed_categories` is not decoded.

Pass `new_categories`, `categories[].name`, or
`strategies.categories_without_strategies` to a `categories` parameter. Never
pass `removed_categories`, or the `jobs[].category` of an
[orchestration status](orchestration.md#monitor-an-orchestration), both of which
are internal identifiers.
{{< /info >}}

{{< warning >}}
**One case where `new_categories` is not a valid `categories` input.** Decoding
requires the leading segment of the partition ID to be the project name. On a
legacy corpus whose modules were never scoped to the project, such as an
`import-multiple` corpus with partitions like `cluster_0_a`, the value cannot be
decoded and is returned verbatim as a partition ID. Feeding it back to
`categories` matches no strategy profile and returns `400`. If an entry does not
look like one of the labels in `categories[].name`, treat it as a partition ID
and omit `categories` entirely, so that the orchestration builds everything that
is stale.
{{< /warning >}}

### Deciding what to do next

| Signal | Next call |
|--------|-----------|
| `categories[].needs_corpus_update` is `true` | [`POST /v1/corpus/builds`](corpus-build.md) for that category |
| `strategies.categories_without_strategies` is non-empty | [`POST /v1/rag-strategizer/analyze`](rag-strategizer.md) scoped to those categories |
| `knowledge_graph.new_categories` is non-empty | [`POST /v1/orchestrate`](orchestration.md#trigger-orchestration) with those labels in `categories`, or without `categories` to build everything stale |
| Everything is `false` or empty | Nothing to do. `POST /v1/orchestrate` would return `409`. |

| Status Code | Meaning |
|-------------|---------|
| `200` | Overview returned |
| `400` | The `project` path segment is empty |
| `401` | Missing or invalid token, or the File Manager rejected the credentials of the service |
| `403` | No database access, or the File Manager denied permission |
| `404` | `project` does not match the project the service runs against. The message names both. |
| `503` | The service, the graph, or the File Manager is not ready. This includes File Manager timeouts and transport failures. |

A failed File Manager call is never rendered as an empty but successful page.
You get an error status instead of a misleading all-zero overview. The response
is scoped to your project: categories and file counts of other projects that
share the same ArangoDB database are never returned.

### HTTP Example

```bash
curl -H "Authorization: Bearer <token>" \
  https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/projects/my_project/overview
```

---

## Update Model Config Credentials

{{< endpoint "PUT" "https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/projects/{project}/model-config/credentials" >}}

Set the chat and embedding provider, the models, and the secret profiles of a
project. The service validates the credentials against the provider with a live
inference call, applies the configuration to the running pod where it can, and
persists it to the project metadata.

**Recommended path:** Call it before your first corpus build, and whenever you
rotate keys or change models. Chat and embedding are configured independently.
There is no idle-only restriction, so you can call it during a corpus build, but
a running build keeps its existing clients and the change only takes effect on
the next one.

For guidance on picking providers and models, see
[LLM Configuration](../llm-configuration.md).

### Request

```json
{
  "chat_api_provider": "openai",
  "chat_model": "gpt-5.4-nano",
  "chat_secret_profile_id": "chat-profile-id",
  "embedding_api_provider": "openai",
  "embedding_model": "text-embedding-3-small",
  "embedding_secret_profile_id": "embedding-profile-id",
  "multimodal_model": "gpt-5.4",
  "chat_api_url": "https://api.openai.com/v1",
  "embedding_api_url": "https://api.openai.com/v1"
}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `project` | URL path | Yes | Has to match the project the service runs against. A mismatch returns `200` with `valid: false` and `error_code: PROJECT_MISMATCH`, not a `4xx`. |
| `chat_api_provider` | string | **Yes** | `openai`, `triton`, or `custom` for any other OpenAI-compatible endpoint. |
| `chat_model` | string | **Yes** | The chat model name. A model the provider does not serve is rejected with `MODEL_NOT_FOUND`. |
| `chat_secret_profile_id` | string | **Yes** | The secret profile ID of the chat key. **Never a raw key.** |
| `embedding_api_provider` | string | **Yes** | `openai` or `custom`. **Immutable** once saved. |
| `embedding_model` | string | **Yes** | The embedding model name. **Immutable** once saved. |
| `embedding_secret_profile_id` | string | **Yes** | The secret profile ID of the embedding key. **Never a raw key.** Can be rotated after the first save. |
| `multimodal_model` | string | No | The multimodal model name. Omit it unless you use image extraction. |
| `chat_api_url` | string | Conditional | **Required** when `chat_api_provider` is `custom`. Otherwise optional: omit it to keep the current value, or send an empty string to reset it to the default OpenAI URL. |
| `embedding_api_url` | string | Conditional | **Required** when `embedding_api_provider` is `custom`. Same omit and reset semantics as `chat_api_url`. |

Only secret **profile IDs** are stored. Raw API keys are never persisted to the
project metadata.

### Response

```json
{
  "applied": true,
  "valid": true,
  "applied_to_running_pod": true,
  "rebuild_required": false,
  "key_status": "valid",
  "field": "",
  "error_code": "",
  "message": ""
}
```

| Field | Type | Description |
|-------|------|-------------|
| `valid` | boolean | The validation probe passed. |
| `applied` | boolean | The configuration was persisted to the project metadata. |
| `applied_to_running_pod` | boolean | `true` means it is live immediately, without a restart. **`false` means the persisted configuration only takes effect on the next service restart.** |
| `rebuild_required` | boolean | Always `false`. Kept for wire compatibility: no accepted update can invalidate the stored vectors. |
| `key_status` | string | `valid`, `invalid`, `expired`, `rate_limited`, or `insufficient_quota`, or empty when unknown. For the `triton` provider, `valid` only means that a key is present. |
| `field` | string | On a failure, the request field that failed validation. |
| `error_code` | string | On a failure, a machine-readable code such as `MODEL_NOT_FOUND`, `INVALID_API_KEY`, or `EMBEDDING_CONFIG_IMMUTABLE`. |
| `message` | string | On a failure, a human-readable explanation. |

{{< warning >}}
**A validation failure returns `200` with `valid: false`, not a `4xx`.** Key off
`valid`, `applied`, and `error_code`, never off the HTTP status alone. Only
authentication problems, missing service metadata, and unexpected server faults
produce a non-`200` status.
{{< /warning >}}

| Status Code | Meaning |
|-------------|---------|
| `200` | The request was processed. **Inspect `valid` and `applied`** to learn the outcome. |
| `401` | Authentication failed |
| `404` | The AutoGraph service node was not found in the project metadata |
| `500` | Server error |

### Embedding identity is immutable

Once `embedding_api_provider`, `embedding_model`, and `embedding_api_url` have
been saved for a project, they cannot be changed. A request that changes any of
them is rejected with `valid: false`, `error_code: EMBEDDING_CONFIG_IMMUTABLE`,
and a `field` naming the offending value. Nothing is written to the metadata and
nothing is applied to the pod.

A different embedding model produces vectors that do not match the ones already
stored, and the corpus cannot be re-embedded without stranding the knowledge
graph that was built from it. What is still allowed is rotating
`embedding_secret_profile_id`, and any change to the chat provider, model, URL,
or secret. To embed with a different model, create a new project.

### Error codes

The stable `error_code` values are `INVALID_API_KEY`, `KEY_EXPIRED`,
`INSUFFICIENT_QUOTA`, `RATE_LIMITED`, `PERMISSION_DENIED`, `MODEL_NOT_FOUND`,
`MODEL_REJECTED_REQUEST`, `ENDPOINT_UNREACHABLE`, `TIMEOUT`, `PROVIDER_ERROR`,
`PROVIDER_EMPTY_RESPONSE`, `RESPONSES_API_UNAVAILABLE`, `API_KEY_REQUIRED`,
`MODEL_REQUIRED`, `INVALID_BASE_URL`, `PROVIDER_NOT_FOUND`, `URL_REQUIRED`,
`UNKNOWN_VALIDATION_ERROR`, and `EMBEDDING_CONFIG_IMMUTABLE`, plus the metadata
write codes `METADATA_WRITE_FAILED`, `METADATA_WRITE_TIMEOUT`, and
`PROJECT_MISMATCH`.

### Notes

- Validation is a **minimal live inference probe**, not a catalog lookup, with a
  10-second timeout. It uses the `chat_api_url` and `embedding_api_url` from the
  request when you supply them, so send them if a valid model behind a custom
  OpenAI-compatible endpoint is rejected.
- Concurrent updates are **serialized**, not rejected. A global lock makes the
  second request wait for the first, so expect a slower response rather than a
  `409`.
- A rejected candidate configuration is reported in the response only. It does
  not overwrite the status of a corpus build or a strategizer job.
- The persisted configuration lives at the project level in the metadata and
  **survives a teardown and redeployment** of the AutoGraph service.

### Model configuration after a pod restart

After a pod restart, AutoGraph tries to reload the saved chat and embedding
settings from the project metadata in the background, and then probes the
effective configuration with a live inference call.

Reconciliation is **best effort**. If the saved configuration cannot be read,
its secret profiles cannot be resolved, or it cannot be applied in-process,
AutoGraph keeps the deploy-time configuration and probes that instead. Saved
settings are therefore restored when the reconciliation succeeds, not
guaranteed on every restart.

The service accepts health checks and read requests immediately, but the
model-sensitive work of a **corpus build**, a **strategizer run**, and an
**orchestration** is rejected with `400` until the reconciliation and the probe
have finished. If the probe comes back with a definitive rejection, those
requests stay blocked until a successful call to this endpoint applies a valid
configuration to the running pod. Only definitive, non-retryable codes latch the
gate this way. Transient ones such as `ENDPOINT_UNREACHABLE`, `TIMEOUT`,
`RATE_LIMITED`, and `PROVIDER_ERROR` are logged and leave the gate open.

### HTTP Example

```bash
curl -X PUT \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "chat_api_provider": "openai",
    "chat_model": "gpt-5.4-nano",
    "chat_secret_profile_id": "chat-profile-id",
    "embedding_api_provider": "openai",
    "embedding_model": "text-embedding-3-small",
    "embedding_secret_profile_id": "embedding-profile-id"
  }' \
  https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/projects/my_project/model-config/credentials
```

---

## Delete Category

{{< endpoint "DELETE" "https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/projects/{project}/categories/{category}" >}}

Remove a category from the corpus graph **and** from the knowledge graph, and
optionally delete its files from the File Manager.

**Recommended path:** Call it when you want to remove a category and clean up
everything it contributed. This is also the supported way to recover a partition
that imported incompletely: delete the category, build it again, re-run the
strategizer, and orchestrate.

### What is removed, in order

1. **Knowledge graph (Layer 3).** The `rag_partition_id` values of the category
   are resolved from `rags`, and every knowledge graph record in those
   partitions is removed: `Relations` first, then `Entities`, `Chunks`,
   `Documents`, `Communities`, and `SemanticUnits`. This is a no-op when the
   knowledge graph was never built.
2. **Corpus graph (Layers 1 and 2).** All `sources`, `similarities`, `domains`,
   `corpus_relations`, and `rags` rows of the category.
3. **Files.** Only when `delete_files` is `true`.

Steps 1 and 2 always run when the category exists. `delete_files` controls step
3 only. There is no way to delete the files while keeping the graph data, and no
way to remove the corpus graph while keeping the knowledge graph.

Both graph steps run inside the build and orchestration lock, so a concurrent
build cannot interleave. If the knowledge graph step fails, the request aborts
with `500` **before** the corpus graph is touched. The `rags` rows survive so
that you can retry, and Layer 3 data is never left orphaned.

### Parameters

| Parameter | Location | Type | Required | Description |
|-----------|----------|------|----------|-------------|
| `project` | URL path | string | Yes | Has to match the project the service runs against. |
| `category` | URL path | string | Yes | The **bare category label**, for example `legal`, the same value that [Project Overview](#project-overview) returns. An already encoded module is accepted as a legacy alias. |
| `delete_files` | query | boolean | No | When `true`, the files of the category are also deleted from the File Manager after the graph cleanup. When `false` or omitted, the graph cleanup still happens in full and only the files are left in place. |

This endpoint takes **no request body**.

{{< warning >}}
**Send `delete_files` in the query string, not as JSON.** A JSON body on this
request is ignored: the field falls back to `false`, the graph is still cleaned
up, and the response comes back `200` with `files_deleted: 0`. That looks like a
successful delete while every file is silently left in the File Manager.

```bash
# Correct
DELETE /v1/projects/my_project/categories/legal?delete_files=true

# Ignored, files are kept
DELETE /v1/projects/my_project/categories/legal   -d '{"delete_files": true}'
```
{{< /warning >}}

### Response

```json
{
  "deleted": true,
  "category": "legal",
  "graph_updated": true,
  "files_deleted": 12,
  "locked_skipped": []
}
```

| Field | Type | Description |
|-------|------|-------------|
| `deleted` | boolean | Always `true` on a `200`. A category that cannot be resolved returns `404` rather than `deleted: false`. |
| `category` | string | Echo of the requested category. |
| `graph_updated` | boolean | `true` if corpus graph **or** knowledge graph data was removed. |
| `files_deleted` | integer | Files successfully deleted from the File Manager, only when `delete_files` is `true`. Zero when it is `false`, or when every file was locked. |
| `locked_skipped` | string[] | File names that could not be deleted because they are locked with `safe_to_delete: false` in the File Manager metadata. They stay in the File Manager even when `delete_files` is `true`, while the graph cleanup still goes ahead. |

| Status Code | Meaning |
|-------------|---------|
| `200` | The category has been deleted |
| `400` | The `project` or `category` path segment is empty |
| `401` | Authentication failed |
| `403` | Access denied |
| `404` | The category could not be resolved: it does not match any built category of this project, **or** its File Manager listing is empty, see the warning below |
| `409` | A corpus build, an orchestration, or a document delete is in progress |
| `500` | Server error |

{{< warning >}}
**Delete the category before its files leave the File Manager.** The endpoint
resolves a category by listing its File Manager files, and it does so *before*
any graph cleanup. If that listing is empty, the request returns `404` and
cleans nothing, whatever removed the files — the corpus and knowledge graph
data of the category is **left in place**.

**There is no recovery through the API.** Removing knowledge graph records is
exclusive to this endpoint, and a corpus build never does it at either
`incremental` setting. You have to remove the leftovers directly in ArangoDB.

Let this endpoint delete the files with `delete_files=true`, or call it while
they are still there.
{{< /warning >}}

Deleting a category also removes its strategies, so building it again is a full
corpus build, then the strategizer, then an orchestration.

### HTTP Example

```bash
# Graph cleanup and file deletion
curl -X DELETE \
  -H "Authorization: Bearer <token>" \
  "https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/projects/my_project/categories/legal?delete_files=true"

# Graph cleanup only, the files stay in the File Manager
curl -X DELETE \
  -H "Authorization: Bearer <token>" \
  "https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/projects/my_project/categories/legal"
```

---

## Delete Project

{{< endpoint "DELETE" "https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/projects/{project}" >}}

Tear down an entire project: every AutoGraph-owned service, graph, view, and
collection, optionally its File Manager files, its project metadata, and the
local staging directory. After a successful response has been sent, the
AutoGraph service deletes itself.

{{< danger >}}
This is destructive and irreversible.
{{< /danger >}}

### Parameters

| Parameter | Location | Type | Required | Description |
|-----------|----------|------|----------|-------------|
| `project` | URL path | string | Yes | Has to match the project the service runs against. |
| `delete_files` | query | boolean | No | Defaults to `false`. When `true`, the files of the project are also deleted from the File Manager, and locked files are skipped. When omitted or `false`, the File Manager files are left intact. |

{{< warning >}}
**`delete_files` is a query parameter, not a request body.** This endpoint has no
request body binding, so a JSON body is ignored and `delete_files` falls back to
`false`, which silently keeps every file. A full file wipe is opt-in by design:
pass `?delete_files=true` explicitly.
{{< /warning >}}

### Response

```json
{
  "deleted": true,
  "project": "my_project",
  "collections_deleted": ["my_project_sources", "my_project_Entities"],
  "graphs_deleted": ["my_project_kg", "my_project_CorpusGraph"],
  "services_deleted": ["svc-abc123"],
  "views_deleted": ["my_project_sources_search_view"],
  "files_deleted": 12,
  "locked_skipped": [],
  "warnings": []
}
```

| Field | Type | Description |
|-------|------|-------------|
| `deleted` | boolean | `true` if every actionable teardown step completed. `false` signals a **retryable partial failure**. |
| `project` | string | Echo of the requested project. |
| `collections_deleted` | string[] | Project-owned collections that were removed. |
| `graphs_deleted` | string[] | Project-owned graphs that were removed. |
| `services_deleted` | string[] | Service IDs that were removed, such as importers and retrievers. |
| `views_deleted` | string[] | Project-owned ArangoSearch views that were removed. |
| `files_deleted` | integer | Files removed from the File Manager, only with `delete_files=true`. |
| `locked_skipped` | string[] | Files left intact because they are locked with `safe_to_delete: false`. |
| `warnings` | string[] | Can be non-empty on **both** outcomes, see below. |

{{< warning >}}
**Check `deleted`, not the HTTP status, and not just whether `warnings` is
empty.** This endpoint returns `200` for a complete teardown **and** for a
partial failure.

- `deleted: true` means the teardown completed. Any `warnings` are informational
  notes about resources that were intentionally preserved, and retrying never
  clears them.
- `deleted: false` means an actionable failure occurred. Read `warnings`, fix
  the cause, for example by unlocking files, and re-issue the request. Deletion
  is idempotent and safe to retry.
{{< /warning >}}

| Status Code | Meaning |
|-------------|---------|
| `200` | The request was processed. Check `deleted`. |
| `400` | The `project` path segment is empty |
| `401` | Authentication failed |
| `403` | Access denied |
| `404` | `project` does not match the project the service runs against |
| `409` | A corpus build, an orchestration, a strategizer run, or a document delete is in progress |
| `500` | Server error |

### Notes

- **Locked files block completion.** With `delete_files=true`, a file marked
  `safe_to_delete: false` is not deleted. It is listed in `locked_skipped`,
  added to `warnings`, and the response comes back with `deleted: false`.
  Because the file cleanup is incomplete, the project scope is not unregistered
  and the project metadata is not deleted on that attempt. Unlock the files and
  retry to finish the teardown.
- **Only unambiguously project-owned resources are removed.** A graph, view, or
  collection whose ownership is ambiguous, such as a custom graph that mixes
  project and shared collections, is preserved and reported in `warnings`. This
  is informational: it does not block `deleted: true` and it does not hold the
  deletion lock. Removing such a resource is a manual operator task in ArangoDB.
- **Self-teardown happens only after `deleted: true`**, and only after the
  response has been sent. On a partial failure the service stays up so that you
  can retry.
- **`deleted: true` does not mean the pod is already gone.** The self-teardown
  is asynchronous and best effort, it is only *scheduled* after the response,
  and its outcome is not reported back. Do not immediately recreate the same
  project against the just-deleted service, because a follow-up create can race
  a pod that is still running. Confirm that the old service ID has disappeared
  from the platform service listing first.
- **A partially torn-down project is locked.** Once a delete has removed at
  least one resource, further mutating calls, such as corpus builds, imports,
  orchestrations, strategizer runs, model-config updates, category deletes, and
  strategy overrides, are rejected with `409` until the delete is retried to
  completion. A delete that fails **before** it mutated anything does not lock
  the project.

### HTTP Example

```bash
# Opt in to file deletion
curl -X DELETE \
  -H "Authorization: Bearer <token>" \
  "https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/projects/my_project?delete_files=true"

# Keep the File Manager files
curl -X DELETE \
  -H "Authorization: Bearer <token>" \
  "https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/projects/my_project"
```

## Next Steps

- **[Corpus Build](corpus-build.md)**: Build or extend the corpus graph
- **[LLM Configuration](../llm-configuration.md)**: Choose providers and models
- **[Error Handling](error-handling.md)**: HTTP codes and troubleshooting
