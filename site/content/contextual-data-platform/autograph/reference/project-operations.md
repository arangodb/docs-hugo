---
title: AutoGraph Project Operations Reference
menuTitle: Project Operations
description: >-
  Inspect the state of a project, configure its chat and embedding models, and
  remove categories or the whole project
weight: 18
---
{{< tag "Agentic AI Suite" >}}

`GET /v1/projects/{project}/overview` returns the state of a project in one
call. `PUT /v1/projects/{project}/model-config/credentials` sets its chat and
embedding models. `DELETE /v1/projects/{project}/categories/{category}` and
`DELETE /v1/projects/{project}` remove a category or the whole project. These
endpoints sit outside the sequential pipeline, so you can call them at any
time. The two delete endpoints return `409` while a build or an orchestration
is running. For picking providers and models, see
[LLM Configuration](../llm-configuration.md). For error codes and
troubleshooting, see [Error Handling](error-handling.md).

The endpoints are relative to the path of the project's AutoGraph service,
`https://<EXTERNAL_ENDPOINT>:8529/autograph/{service_id_postfix}`.
`service_id_postfix` is the end of the service ID, such as `vyk1t` for
`arangodb-autograph-vyk1t`. The `serviceUrl` in the project metadata of
[`GET /_platform/acp/v1/project_by_name/{database}/{project}`](../../control-plane-acp/api.md#get-project-details)
ends with it, for example `.../autograph/vyk1t/`.

| Endpoint | Operation | Purpose | Call |
|----------|-----------|---------|------|
| [`GET /v1/projects/{project}/overview`](#get-the-project-overview) | Overview | Read the whole project state in one call | Synchronous |
| [`PUT /v1/projects/{project}/model-config/credentials`](#update-the-model-configuration-credentials) | Model configuration | Set the chat and embedding configuration | Synchronous |
| [`DELETE /v1/projects/{project}/categories/{category}`](#delete-a-category) | Delete a category | Remove one category and its graph data | Synchronous |
| [`DELETE /v1/projects/{project}`](#delete-a-project) | Delete a project | Tear down the whole project | Synchronous |

{{< info >}}
The `{project}` path segment always has to name the project that the service
runs against. What a mismatch returns differs per endpoint, see the status
codes of each endpoint.
{{< /info >}}

## Get the project overview

{{< endpoint "GET" "https://<EXTERNAL_ENDPOINT>:8529/autograph/{service_id_postfix}/v1/projects/{project}/overview" >}}

Returns the state of a project in one aggregate call: a corpus graph card, a
knowledge graph card, a strategies block, and a list of categories with
staleness flags. The call is synchronous and read-only, so you can call it at
any time.

Use it to drive a dashboard, to decide whether a build is needed before you call
`POST /v1/corpus/builds`, and to find the categories that still have no
strategies. Staleness is computed when you read it. There is no stored flag that
you have to refresh.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `project` | string | Yes | Path parameter. Has to match the project the service runs against. |
| `scope` | string[] | No | Query parameter. File Manager scope subtree filter, 0 to 5 labels. It is rooted below the project automatically, so you pass the labels below the project. |
| `search` | string | No | Query parameter. Case-insensitive substring match on the file name. |
| `name` | string | No | Query parameter. Exact file name filter. |
| `limit` | integer | No | Query parameter. Paging limit. A value above 1,000 is silently clamped to 1,000, so a large limit returns a quietly truncated page rather than an error. `0` or a negative value means unbounded: the whole filtered listing from `offset` onward. |
| `offset` | integer | No | Query parameter. Paging offset. A negative value is clamped to `0`. |

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

| Field | Meaning |
|-------|---------|
| `project` | The requested project. |
| `corpus_graph.name` | The corpus named graph, for example `{project}_CorpusGraph`. |
| `corpus_graph.status` | `building`, `ready`, or `failed`. |
| `corpus_graph.document_count` | Source documents in the corpus. |
| `corpus_graph.cluster_count` | Leiden clusters, that is domains. These are clusters, not chunks. |
| `corpus_graph.stale` | `true` when the sources or the strategies are behind their inputs. |
| `corpus_graph.graph_explorer_url` | A link into the ArangoDB graph explorer. |
| `knowledge_graph.name` | The knowledge graph, for example `{project}_kg`. |
| `knowledge_graph.status` | `not_built`, `built`, or `stale`. |
| `knowledge_graph.entity_count` | Distinct entities in the knowledge graph. |
| `knowledge_graph.relationship_count` | Distinct relationships in the knowledge graph. |
| `knowledge_graph.stale` | `true` when the knowledge graph partitions differ from the current strategies. |
| `knowledge_graph.new_categories` | Bare category labels that have strategy partitions in `rags` but are not in the knowledge graph yet. Several partitions of one category collapse into a single entry. A non-empty list means a knowledge graph build is pending. Pass these values to `categories` on `POST /v1/orchestrate`, or omit `categories` to build everything that is stale. |
| `knowledge_graph.removed_categories` | The `rag_partition_id` values of the last successful [category deletion](#delete-a-category), for example `my_project_finance_0_a`. Overwritten on every deletion, and empty when no category has been deleted since the pod started. |
| `strategies.stale` | `true` when a category has no strategy, or a strategy is out of date. |
| `strategies.categories_without_strategies` | Bare category labels with no RAG strategy. Pass them to `categories` on `POST /v1/rag-strategizer/analyze`. |
| `categories[].name` | The bare category label, for example `legal`. Every endpoint that takes a category expects this value. |
| `categories[].document_count` | Documents in this category. |
| `categories[].needs_corpus_update` | `true` when the files of this category are ahead of the corpus graph, or not covered by it. |
| `categories[].needs_strategies` | `true` when this category has no RAG strategy yet. |
| `category_count` | Number of entries in `categories`. |
| `total_documents` | The unfiltered project total, the sum of the counts per category. The browse parameters never narrow it. |
| `filtered_total_documents` | The filtered File Manager page total when a browse or paging parameter is set, and `0` otherwise. |

{{< info >}}
**`new_categories` returns labels, `removed_categories` returns partition IDs.**
Staleness is computed over `rag_partition_id` values internally.
`new_categories` decodes them back to the bare label below the project
(`my_project_legal_0_a` becomes `legal`) and removes duplicates, while
`removed_categories` is not decoded.

Pass `new_categories`, `categories[].name`, or
`strategies.categories_without_strategies` to a `categories` parameter. Never
pass `removed_categories`, or the `jobs[].category` of an
[orchestration status](orchestration.md#monitor-a-knowledge-graph-build), as both are
internal identifiers.
{{< /info >}}

{{< warning >}}
**In one case, `new_categories` is not a valid `categories` input.** Decoding
requires the leading segment of the partition ID to be the project name. On a
legacy corpus whose modules were never scoped to the project, such as an
`import-multiple` corpus with partitions like `cluster_0_a`, the value cannot be
decoded and is returned as the partition ID. Passing it to `categories` matches
no strategy profile and returns `400`. If an entry does not look like one of the
labels in `categories[].name`, treat it as a partition ID and omit `categories`
entirely, so that the knowledge graph build processes everything that is stale.
{{< /warning >}}

A failed File Manager call is never shown as an empty but successful page. You
get an error status instead of a misleading overview with all counts at zero.
The response is scoped to your project. Categories and file counts of other
projects that share the same ArangoDB database are never returned.

### Deciding what to do next

| Signal | Next call |
|--------|-----------|
| `categories[].needs_corpus_update` is `true` | [`POST /v1/corpus/builds`](corpus-build.md) for that category |
| `strategies.categories_without_strategies` is not empty | [`POST /v1/rag-strategizer/analyze`](rag-strategizer.md) scoped to those categories |
| `knowledge_graph.new_categories` is not empty | [`POST /v1/orchestrate`](orchestration.md#build-the-knowledge-graph) with those labels in `categories`, or without `categories` to build everything that is stale |
| Everything is `false` or empty | Nothing to do. `POST /v1/orchestrate` would return `409`. |

| Status Code | Meaning |
|-------------|---------|
| `200` | The overview has been returned. |
| `400` | The `project` path segment is empty. |
| `401` | Missing or invalid token, or the File Manager rejected the credentials of the service. |
| `403` | No database access, or the File Manager denied permission. |
| `404` | `project` does not match the project the service runs against. The message names both. |
| `503` | The service, the graph, or the File Manager is not ready. This includes File Manager timeouts and transport failures. |

### HTTP example

```bash
curl -X GET \
  -H "Authorization: Bearer <token>" \
  https://<EXTERNAL_ENDPOINT>:8529/autograph/{service_id_postfix}/v1/projects/my_project/overview
```

## Update the model configuration credentials

{{< endpoint "PUT" "https://<EXTERNAL_ENDPOINT>:8529/autograph/{service_id_postfix}/v1/projects/{project}/model-config/credentials" >}}

Sets the chat and embedding provider, the models, and the secret profiles of a
project. The call is synchronous. The service validates the credentials against
the provider with a live inference call, applies the configuration to the
running pod where it can, and saves it to the project metadata.

Call it before your first corpus build, and whenever you rotate keys or change
models. Chat and embedding are configured independently. You can also call it
during a corpus build, but a running build keeps its existing clients, and the
change only takes effect on the next one.

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
| `project` | string | Yes | Path parameter. Has to match the project the service runs against. A mismatch returns `400` with `valid: false` and `error_code: PROJECT_MISMATCH`. |
| `chat_api_provider` | string | Yes | `openai`, or `custom` for any other OpenAI-compatible endpoint. |
| `chat_model` | string | Yes | The chat model name. A model the provider does not serve is rejected with `MODEL_NOT_FOUND`. |
| `chat_secret_profile_id` | string | Yes | The secret profile ID of the chat key. Never a raw key. |
| `embedding_api_provider` | string | Yes | `openai` or `custom`. Cannot be changed once saved. |
| `embedding_model` | string | Yes | The embedding model name. Cannot be changed once saved. |
| `embedding_secret_profile_id` | string | Yes | The secret profile ID of the embedding key. Never a raw key. You can rotate it after the first save. |
| `multimodal_model` | string | No | The multimodal model name. Omit it unless you use image extraction. |
| `chat_api_url` | string | Conditional | Required when `chat_api_provider` is `custom`. Otherwise, omit it to keep the current value, or send an empty string to reset it to the default OpenAI URL. |
| `embedding_api_url` | string | Conditional | Required when `embedding_api_provider` is `custom`. Cannot be changed once saved. Unlike `chat_api_url`, omitting it does not keep the current value. AutoGraph saves the URL at startup even if it was never set, with `https://api.openai.com/v1` as the fallback, so a missing value counts as a change. Always send the saved URL. |

Only secret profile IDs are stored. Raw API keys are never saved to the project
metadata.

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

| Field | Meaning |
|-------|---------|
| `valid` | Whether the validation probe passed. It is `false` on the `400` of a rejected configuration. |
| `applied` | Whether the configuration has been saved to the project metadata. |
| `applied_to_running_pod` | `true` means the configuration is live immediately, without a restart. `false` means the saved configuration only takes effect on the next service restart. |
| `rebuild_required` | Always `false`. Kept for compatibility, as no accepted update can invalidate the stored vectors. |
| `key_status` | `valid`, `invalid`, `expired`, `rate_limited`, or `insufficient_quota`, or empty when unknown. |
| `field` | On a failure, the request field that failed validation. |
| `error_code` | On a failure, a machine-readable code such as `MODEL_NOT_FOUND`, `INVALID_API_KEY`, or `EMBEDDING_CONFIG_IMMUTABLE`. For all values, see the `400` status code below. |
| `message` | On a failure, an explanation you can read. |

{{< info >}}
**A validation failure returns `400` with the same response body.** A `2xx`
therefore means that the configuration has been accepted and saved, so you can
rely on the HTTP status. The body has not changed: `valid`, `applied`, `field`,
`error_code`, and `message` are still there on a rejection, so anything you
already parse keeps working.

Earlier versions answered a rejected configuration with `200` and
`valid: false`, which let a client that only checked the status treat a refused
credential as applied.
{{< /info >}}

The following is an example of a rejection with `400`, for a chat secret
profile that cannot be resolved:

```json
{
  "applied": false,
  "valid": false,
  "applied_to_running_pod": false,
  "rebuild_required": false,
  "key_status": "",
  "field": "chat_secret_profile_id",
  "error_code": "SECRET_NOT_FOUND",
  "message": "Secret profile '00000000-0000-0000-0000-000000000000' not found"
}
```

A rejected configuration is reported in the response only. Nothing is written to
the metadata or applied to the pod, and it does not overwrite the status of a
corpus build or a strategizer job.

### Validation

Validation is a minimal live inference probe with a 10-second timeout, not a
catalog lookup. It uses the `chat_api_url` and `embedding_api_url` of the
request when you supply them, so send them if a valid model behind a custom
OpenAI-compatible endpoint is rejected.

Concurrent updates are serialized, not rejected. A global lock makes the second
request wait for the first, so expect a slower response rather than a `409`.

The saved configuration lives at the project level in the metadata, and it
survives a teardown and redeployment of the AutoGraph service.

### Embedding identity is immutable

Once `embedding_api_provider`, `embedding_model`, and `embedding_api_url` have
been saved for a project, you cannot change them. A request that changes any of
them is rejected with `400`, `valid: false`,
`error_code: EMBEDDING_CONFIG_IMMUTABLE`, and a `field` that names the value.
Nothing is written to the metadata and nothing is applied to the pod.

The embedding URL is saved at startup even if you never set it, with
`https://api.openai.com/v1` as the fallback. Leaving `embedding_api_url` out of
a request therefore counts as a change and is rejected. Always send the saved
embedding provider, model, and URL, even when you only rotate the secret.

A different embedding model produces vectors that do not match the ones already
stored, and the corpus cannot be embedded again without stranding the knowledge
graph that was built from it. You can still rotate
`embedding_secret_profile_id`, and change the chat provider, model, URL, or
secret. To embed with a different model, create a new project.

### Model configuration after a pod restart

After a pod restart, AutoGraph tries to reload the saved chat and embedding
settings from the project metadata in the background, and then probes the
effective configuration with a live inference call.

This is best effort. If the saved configuration cannot be read, its secret
profiles cannot be resolved, or it cannot be applied in the running process,
AutoGraph keeps the configuration from deployment time and probes that instead.
Saved settings are restored when the reload succeeds, which is not guaranteed on
every restart.

The service accepts health checks and read requests immediately, but it rejects
the model-dependent work of a corpus build, a strategizer run, and a knowledge
graph build with `400` until the reload and the probe have finished. If the
probe comes back with a definitive rejection, those requests stay blocked until
a successful call to this endpoint applies a valid configuration to the running
pod. Only definitive codes that cannot be retried keep the requests blocked this
way. Transient ones such as `ENDPOINT_UNREACHABLE`, `TIMEOUT`, `RATE_LIMITED`,
and `PROVIDER_ERROR` are logged and do not block anything.

| Status Code | Meaning |
|-------------|---------|
| `200` | The configuration has been validated and saved. Read `applied_to_running_pod` to find out whether it is live or only takes effect after the next restart. |
| `400` | Rejected by the validation: a secret profile that cannot be resolved, an unsupported provider, a model the provider does not serve, a missing required field, a `project` mismatch, or a change of the embedding identity. Nothing has been saved or applied. The `error_code` of the response is one of `INVALID_API_KEY`, `KEY_EXPIRED`, `INSUFFICIENT_QUOTA`, `RATE_LIMITED`, `PERMISSION_DENIED`, `MODEL_NOT_FOUND`, `MODEL_REJECTED_REQUEST`, `ENDPOINT_UNREACHABLE`, `TIMEOUT`, `PROVIDER_ERROR`, `PROVIDER_EMPTY_RESPONSE`, `RESPONSES_API_UNAVAILABLE`, `API_KEY_REQUIRED`, `MODEL_REQUIRED`, `INVALID_BASE_URL`, `PROVIDER_NOT_FOUND`, `URL_REQUIRED`, `SECRET_PROFILE_REQUIRED`, `SECRET_NOT_FOUND`, `SECRET_RESOLUTION_ERROR`, `PROJECT_MISMATCH`, `EMBEDDING_CONFIG_IMMUTABLE`, or `UNKNOWN_VALIDATION_ERROR`. |
| `401` | Authentication failed. |
| `404` | The AutoGraph service node was not found in the project metadata. |
| `409` | A project deletion is in progress. |
| `500` | Server error, including `METADATA_WRITE_FAILED`: the configuration passed the validation but could not be stored. The body is the standard JSON error body, not the response above. |
| `503` | `METADATA_WRITE_TIMEOUT`: the configuration passed the validation but the metadata write timed out. Retrying is safe. The body is the standard JSON error body, not the response above. |

### HTTP example

```bash
curl -X PUT \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "chat_api_provider": "openai",
    "chat_model": "gpt-5.4-nano",
    "chat_secret_profile_id": "chat-profile-id",
    "embedding_api_provider": "openai",
    "embedding_api_url": "https://api.openai.com/v1",
    "embedding_model": "text-embedding-3-small",
    "embedding_secret_profile_id": "embedding-profile-id"
  }' \
  https://<EXTERNAL_ENDPOINT>:8529/autograph/{service_id_postfix}/v1/projects/my_project/model-config/credentials
```

## Delete a category

{{< endpoint "DELETE" "https://<EXTERNAL_ENDPOINT>:8529/autograph/{service_id_postfix}/v1/projects/{project}/categories/{category}" >}}

Removes a category from the corpus graph and from the knowledge graph, and
optionally deletes its files from the File Manager. The call is synchronous.

Call it when you want to remove a category and clean up everything it
contributed. It is also how you recover a partition that was imported
incompletely: delete the category, build it again, run the strategizer again,
and start the knowledge graph build.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `project` | string | Yes | Path parameter. Has to match the project the service runs against. |
| `category` | string | Yes | Path parameter. The bare category label, for example `legal`, the same value that the [project overview](#get-the-project-overview) returns. An already encoded module is accepted as a legacy alias. |
| `delete_files` | boolean | No | Query parameter. When `true`, the files of the category are also deleted from the File Manager after the graph cleanup. When `false` or omitted, the graph cleanup still happens in full and only the files are left in place. |

This endpoint takes no request body.

{{< warning >}}
**Send `delete_files` in the query string, not as JSON.** A JSON body on this
request is ignored. The field falls back to `false`, the graph is still cleaned
up, and the response comes back `200` with `files_deleted: 0`. That looks like a
successful deletion while every file is silently left in the File Manager.

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

| Field | Meaning |
|-------|---------|
| `deleted` | Always `true` on a `200`. A category that cannot be resolved returns `404` rather than `deleted: false`. |
| `category` | The requested category. |
| `graph_updated` | `true` if corpus graph or knowledge graph data has been removed. |
| `files_deleted` | Files deleted from the File Manager, only when `delete_files` is `true`. `0` when it is `false`, or when every file was locked. |
| `locked_skipped` | File names that could not be deleted because they are locked with `safe_to_delete: false` in the File Manager metadata. They stay in the File Manager even when `delete_files` is `true`, while the graph cleanup still goes ahead. |

### What is removed, in order

1. The knowledge graph. The `rag_partition_id` values of the category are
   looked up in `rags`, and every knowledge graph record in those partitions is
   removed: `Relations` first, then `Entities`, `Chunks`, `Documents`,
   `Communities`, and `SemanticUnits`. Nothing happens in this step if the
   knowledge graph was never built.
2. The corpus graph. All `sources`, `similarities`, `domains`,
   `corpus_relations`, and `rags` rows of the category.
3. The files. Only when `delete_files` is `true`.

Steps 1 and 2 always run when the category exists. `delete_files` controls
step 3 only. You cannot delete the files and keep the graph data, and you cannot
remove the corpus graph and keep the knowledge graph.

Both graph steps run inside the build lock, so a concurrent build or knowledge
graph build cannot interleave. If the knowledge graph step fails, the request
stops with `500` before the corpus graph is touched. The `rags` rows remain so
that you can retry, and no knowledge graph data is left orphaned.

Deleting a category also removes its strategies. To build it again, run a full
corpus build, then the strategizer, then a knowledge graph build.

{{< warning >}}
**Delete the category before its files leave the File Manager.** The endpoint
finds a category by listing its File Manager files, and it does so before any
graph cleanup. If that listing is empty, the request returns `404` and cleans
nothing, whatever removed the files. The corpus graph and knowledge graph data
of the category is left in place.

There is no recovery through the API. Only this endpoint removes knowledge
graph records. A corpus build never does it, whatever the `incremental`
setting. You have to remove the leftovers directly in ArangoDB.

Let this endpoint delete the files with `delete_files=true`, or call it while
they are still there.
{{< /warning >}}

| Status Code | Meaning |
|-------------|---------|
| `200` | The category has been deleted. |
| `400` | The `project` or `category` path segment is empty. |
| `401` | Authentication failed. |
| `403` | Access denied. |
| `404` | The category could not be resolved. It does not match any built category of this project, or its File Manager listing is empty, see the warning above. |
| `409` | A corpus build, a knowledge graph build, or a document removal is in progress. |
| `500` | Server error. |

### HTTP example

```bash
# Graph cleanup and file deletion
curl -X DELETE \
  -H "Authorization: Bearer <token>" \
  "https://<EXTERNAL_ENDPOINT>:8529/autograph/{service_id_postfix}/v1/projects/my_project/categories/legal?delete_files=true"

# Graph cleanup only, the files stay in the File Manager
curl -X DELETE \
  -H "Authorization: Bearer <token>" \
  "https://<EXTERNAL_ENDPOINT>:8529/autograph/{service_id_postfix}/v1/projects/my_project/categories/legal"
```

## Delete a project

{{< endpoint "DELETE" "https://<EXTERNAL_ENDPOINT>:8529/autograph/{service_id_postfix}/v1/projects/{project}" >}}

Tears down an entire project: every service, graph, view, and collection that
AutoGraph owns, optionally its File Manager files, its project metadata, and the
local staging directory. The call is synchronous. Once a successful response
has been sent, the AutoGraph service deletes itself.

{{< danger >}}
This is destructive and cannot be undone.
{{< /danger >}}

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `project` | string | Yes | Path parameter. Has to match the project the service runs against. |
| `delete_files` | boolean | No | Query parameter. Defaults to `false`. When `true`, the files of the project are also deleted from the File Manager, and locked files are skipped. When omitted or `false`, the File Manager files are left in place. |

This endpoint takes no request body.

{{< warning >}}
**Send `delete_files` in the query string, not as JSON.** A JSON body is
ignored and `delete_files` falls back to `false`, which silently keeps every
file. Deleting the files is opt-in by design, so pass `?delete_files=true`
explicitly.
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

| Field | Meaning |
|-------|---------|
| `deleted` | `true` if every teardown step that can be acted on has completed. `false` signals a partial failure that you can retry. |
| `project` | The requested project. |
| `collections_deleted` | Collections of the project that have been removed. |
| `graphs_deleted` | Graphs of the project that have been removed. |
| `services_deleted` | Service IDs that have been removed, such as importers and retrievers. |
| `views_deleted` | ArangoSearch views of the project that have been removed. |
| `files_deleted` | Files removed from the File Manager, only with `delete_files=true`. |
| `locked_skipped` | Files left in place because they are locked with `safe_to_delete: false`. |
| `warnings` | Can be non-empty on both outcomes, see below. |

{{< warning >}}
**Check `deleted`, not the HTTP status, and not only whether `warnings` is
empty.** This endpoint returns `200` both for a complete teardown and for a
partial failure.

- `deleted: true` means the teardown has completed. Any `warnings` are notes
  about resources that were kept on purpose, and retrying never clears them.
- `deleted: false` means a failure occurred that you need to act on. Read
  `warnings`, fix the cause, for example by unlocking files, and send the
  request again. Deletion is idempotent and safe to retry.
{{< /warning >}}

### What is kept and when the project is locked

- Locked files block completion. With `delete_files=true`, a file marked
  `safe_to_delete: false` is not deleted. It is listed in `locked_skipped`,
  added to `warnings`, and the response comes back with `deleted: false`.
  Because the file cleanup is incomplete, the project scope is not unregistered
  and the project metadata is not deleted on that attempt. Unlock the files and
  retry to finish the teardown.
- Only resources that clearly belong to the project are removed. A graph, view,
  or collection whose ownership is unclear, such as a custom graph that mixes
  project and shared collections, is kept and reported in `warnings`. This is
  for your information only. It does not prevent `deleted: true` and it does not
  hold the deletion lock. Removing such a resource is a manual task in ArangoDB.
- A partly torn-down project is locked. Once a deletion has removed at least
  one resource, further calls that change the project, such as corpus builds,
  imports, knowledge graph builds, strategizer runs, model configuration
  updates, category deletions, and strategy overrides, are rejected with `409`
  until you retry the deletion to completion. A deletion that fails before it
  changed anything does not lock the project.

### Self-teardown of the service

The service deletes itself only after `deleted: true`, and only after the
response has been sent. On a partial failure, the service stays up so that you
can retry.

`deleted: true` does not mean the pod is already gone. The self-teardown is
asynchronous and best effort. It is only scheduled after the response, and its
outcome is not reported back. Do not recreate the same project against the
deleted service right away, because a new create request can race a pod that is
still running. First confirm that the old service ID has disappeared from the
platform service listing.

| Status Code | Meaning |
|-------------|---------|
| `200` | The request has been processed. Check `deleted`. |
| `400` | The `project` path segment is empty. |
| `401` | Authentication failed. |
| `403` | Access denied. |
| `404` | `project` does not match the project the service runs against. |
| `409` | A corpus build, a knowledge graph build, a strategizer run, or a document removal is in progress. |
| `500` | Server error. |

### HTTP example

```bash
# Also delete the File Manager files
curl -X DELETE \
  -H "Authorization: Bearer <token>" \
  "https://<EXTERNAL_ENDPOINT>:8529/autograph/{service_id_postfix}/v1/projects/my_project?delete_files=true"

# Keep the File Manager files
curl -X DELETE \
  -H "Authorization: Bearer <token>" \
  "https://<EXTERNAL_ENDPOINT>:8529/autograph/{service_id_postfix}/v1/projects/my_project"
```
