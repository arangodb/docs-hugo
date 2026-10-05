---
title: Importer Limits and Quotas
menuTitle: Limits and Quotas
weight: 40
description: >-
  The concurrency, size, timeout, and provider limits the Importer service
  enforces, and which of them you can change
---
This page lists the limits the Importer enforces. They fall into three kinds:

- **Hard**: the request is rejected or the job fails. You cannot raise them.
- **Soft**: a default you can override, or that your operator can change at
  install time.
- **Fixed**: a built-in value that is not exposed as a setting.

## Concurrency and jobs

| Limit | Value | Kind |
|-------|-------|------|
| Concurrent imports or reclusters per replica | `1` | Hard |
| Retained completed jobs per replica | `100` | Fixed |
| Concurrent chat calls (`CHAT_MAX_CONCURRENT_CALLS`) | `16` | Soft |
| Concurrent embedding calls (`EMBEDDING_MAX_CONCURRENT_CALLS`) | `16` | Soft |

A single lock serializes both import endpoints and `POST /v1/recluster` on a
given replica, whichever partitions they touch. Completed jobs are held in
memory, so they are lost when the pod restarts. See
[Asynchronous import lifecycle](../architecture.md#asynchronous-import-lifecycle).

## Request size

There is **no** application-level rate limiting, and **no** limit on the number
of files or the total size of a `POST /v1/import-multiple` request.

In practice, a large inline upload is bounded by the memory available to the
service, which defaults to 256 MiB at the HTTP layer and 2 GiB for the import
itself, and by the 15-minute request timeout of the platform route. Neither is
an install parameter.

{{< tip >}}
Reference large files by `file_id` instead of embedding them as base64
`file_content`. The Importer then resolves them from the File Manager without
the bytes passing through the request at all.
{{< /tip >}}

## Providers

- `chat_api_provider` and `embedding_api_provider` must resolve to the same
  family: either both OpenAI-compatible (`openai`, `custom`, or one of each) or
  both `triton`. Mixing the two families is rejected at install time. An unknown
  provider name is rejected as well, rather than falling back to a default.
- `custom` requires a non-empty API URL for that side (`chat_api_url` or
  `embedding_api_url`). `custom` chat additionally requires an explicit
  `chat_model`.
- OpenAI-compatible providers require at least one API key. Triton providers
  require an API URL.
- **Reclustering** requires an OpenAI-compatible provider. On Triton,
  `POST /v1/recluster` is rejected. See
  [Reclustering](../incremental-updates.md#reclustering).
- **Image descriptions** require an OpenAI-compatible vision endpoint. See
  [Vision model requirements](../semantic-units.md#vision-model-requirements).

## Graphs and sharding

| Limit | Value | Kind |
|-------|-------|------|
| `shard_count` for a new SmartGraph or sharded Enterprise Graph | exactly `1` | Hard |
| `smart_graph_attribute` | must be `partition_id`, which must also be set | Hard |
| `is_disjoint` on a new Enterprise Graph | must be `false` | Hard |
| `partition_id` length | 1-254 UTF-8 bytes | Hard |
| `partition_id` characters | No whitespace, no `:`. Allowed: `A-Z a-z 0-9 _ - . @ ( ) + , = ; $ ! * ' %` | Hard |
| Replication factor | `3`, or the cluster's `minReplicationFactor` if that is higher | Fixed |

Multi-shard SmartGraphs are not supported in this version, because ArangoDB
trains the vector index per shard. For a graph that already exists,
`shard_count` is ignored. See
[SmartGraph and sharding](../importing-files.md#smartgraph-and-sharding).

## Chunking

| Parameter | Default | Rule |
|-----------|---------|------|
| `chunk_token_size` | `1024` | Must not be smaller than `chunk_overlap_token_size`. Equal values are accepted |
| `chunk_overlap_token_size` | `128` | |
| `chunk_min_token_size` | `64` | Smaller chunks are merged with their neighbors |
| `batch_size` | `1000` | ArangoDB insert batch size |
| `entity_extract_max_gleaning` | `1` | |

## Vector index

- `embedding_dim` defaults to `512` and has to match the embedding model you
  configured. See
  [LLM Configuration](../llm-configuration.md#using-openai-compatible-apis).
- `vector_index_metric` accepts `cosine` (default), `innerProduct`, and `l2`.
  Any other value is rejected.
- `vector_index_n_lists` must be a positive integer when set. When omitted, it
  is computed as `8 * sqrt(collection_size)` and capped at the collection size.
  It is ignored when `vector_index_use_hnsw` is `true`.

## Document conversion

| Limit | Value | Kind |
|-------|-------|------|
| Markdown accepted per document | 64 MiB | Soft. A larger result excludes that file as `MARKDOWN_TOO_LARGE` |

Which formats can be converted is not an Importer limit. See
[Format support](../setup.md#format-support).

## Images

| Limit | Value | Notes |
|-------|-------|-------|
| Local image size | 20 MiB | Larger images are skipped, not failed |
| `http://` and `https://` image fetches | Allowlist-gated | Only hosts on the operator's allowlist (`IMAGE_FETCH_ALLOWED_HOSTS`) are fetched. If no allowlist is set, only File Manager URLs are fetched |
| File Manager and `s3://` artifact routes | Not allowlist-gated | Read through the platform's storage path instead of being fetched by URL, so the host allowlist does not apply |
| `data:` URIs | Stored as-is | Inline base64 images are kept unchanged |
| Any other URL scheme | Refused | |

## Timeouts and retries

| Setting | Default | Kind |
|---------|---------|------|
| ArangoDB request timeout (`ARANGODB_REQUEST_TIMEOUT_SECONDS`) | 900 s | Soft |
| Platform route timeout | 15 min | Fixed |
| Chat request timeout | 600 s, with a 120 s connect timeout | Fixed |
| Embedding request timeout | 120 s | Fixed |
| Vector index training wait | up to 3600 s | Fixed |
| Provider retry attempts (`OPENAI_MAX_RETRY_ATTEMPTS`) | `10`, where `0` means unlimited | Soft |
| Provider retry window (`OPENAI_MAX_RETRY_DURATION_SECONDS`) | 3600 s | Soft |
| Image upload retries (`IMAGE_UPLOAD_MAX_RETRIES`) | `3` | Soft |

## Token limits

- `CHAT_MAX_COMPLETION_TOKENS` is derived from the chat model's context window,
  falling back to `8192`.
- `EMBEDDING_MAX_INPUT_TOKENS` defaults to `8192`.

See [Token budget for chat models](../llm-configuration.md#token-budget-for-chat-models)
for the full set of chat controls.

## Project naming

The project name is not validated by the Importer, but it is used verbatim as
the prefix of every collection it creates. It therefore has to satisfy
ArangoDB's collection naming rules:

- It must start with a letter or an underscore (`_`).
- It may only contain letters, digits, underscores (`_`), and hyphens (`-`).
- It must not exceed 256 characters, including suffixes such as `_Documents`.

An invalid name is not caught at startup; collection creation fails at runtime.
See [Prerequisites](../setup.md#prerequisites).

## Related references

- **[Parameters](parameters.md)**: Complete request parameter reference.
- **[Error Handling](error-handling.md)**: Failure markers, per-file exclusion
  reasons, and troubleshooting.
- **[Reference index](_index.md)**: Endpoints and recommended call sequence.
