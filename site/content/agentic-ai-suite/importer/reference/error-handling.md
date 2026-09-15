---
title: Importer Error Handling and Known Limitations
menuTitle: Error Handling
weight: 30
description: >-
  Synchronous error codes, asynchronous failure markers, troubleshooting, and
  known limitations of the Importer service
---
The Importer reports failures in two places:

1. **Synchronous HTTP response** of the API call itself (status code + JSON body).
2. **Asynchronous job status** (for multi-file imports) and **platform
   service status** (for both single- and multi-file imports), where
   background failures appear after the initial request has already returned.

This page covers both, plus the known limitations of the current version.

## Synchronous HTTP errors

For the immediate response of an API call:

| Symptom | Typical HTTP | Response body |
|---------|--------------|---------------|
| Bad or missing JWT | `401` | Error detail or empty body |
| Database access denied | `403` | Error detail |
| Invalid `rag_mode`, `partition_id`, vector params | `400` | Error detail |
| Importer busy (lock held), on `/v1/import` or `/v1/import-multiple` | `200` | `"success": false`, message about the lock |
| Importer busy (lock held), on `/v1/recluster` | `503` | gRPC `UNAVAILABLE` mapped by the HTTP gateway, with the message in the body |
| Multi-file request validation failure | `200` | `"success": false`, `error_message` set |
| Unexpected server fault | `500` | Internal error |

{{< info >}}
Provider failures during graph build (OpenAI quota, rate limits, context
length, etc.) do **not** change the HTTP status of the original `POST`.
They appear on the asynchronous status feeds described below.
{{< /info >}}

## Asynchronous failure markers

These markers appear in `job.current_status.message`, `status_history`, or on
the platform service status:

| Marker / pattern | Meaning |
|------------------|---------|
| `[MODEL_CONFIG]` | The boot-time model configuration check rejected the deployed chat or embedding configuration. The service stays up but refuses imports. See [Boot-time model configuration gate](#boot-time-model-configuration-gate). |
| `[NO_ENTITIES_WRITTEN]` | **Multi-file only.** `full_graphrag` import finished but entity and relation counts are empty. Check that the source documents have enough content and that the chat model produced extractable output. |
| `[KG_VERIFICATION_INCONCLUSIVE]` | **Multi-file only.** Import completed but the post-import count check failed transiently. Re-running often resolves it. |
| `[rag_mode=...]` | Informational - shows the RAG mode applied to the job. |
| OpenAI remediation text | Mapped from the SDK exception. Covers insufficient quota, invalid key, rate limit, timeout, `5xx`, and context-length exceeded. |
| Terminal status name | One of `service_failed`, `openai_graph_build_failed`, `triton_graph_build_failed`, `openai_embedding_failed`, `triton_embedding_failed`, `import_graph_to_adb_failed`, `create_index_failed`. |

### Boot-time model configuration gate

Before the service accepts requests, the Importer tests every configured
OpenAI-compatible chat and embedding model, and the optional
`MULTIMODAL_MODEL`, with a minimal live inference call. The chat test omits the
optional token-limit fields, so reasoning models are not rejected by mistake.

What happens next depends on what the test found:

| Outcome | Reported as |
|---------|-------------|
| **Definitive rejection**: `INVALID_API_KEY`, `KEY_EXPIRED`, `INSUFFICIENT_QUOTA`, `PERMISSION_DENIED`, `MODEL_NOT_FOUND`, `MODEL_REJECTED_REQUEST`, `PROVIDER_EMPTY_RESPONSE`, `RESPONSES_API_UNAVAILABLE`, `API_KEY_REQUIRED`, `MODEL_REQUIRED`, `INVALID_BASE_URL`, `PROVIDER_NOT_FOUND` | A `SERVICE_FAILED` status carrying `[MODEL_CONFIG] <code> on <field>: <message> (endpoint: <url>)`. `SERVICE_STARTED` is **not** published. |
| **Transient or indeterminate**: `ENDPOINT_UNREACHABLE`, `TIMEOUT`, `RATE_LIMITED`, `PROVIDER_ERROR`, `UNKNOWN_VALIDATION_ERROR` | A log entry only. Startup continues and `SERVICE_STARTED` is published, because these outcomes do not prove the configuration is wrong. |

After a definitive rejection the process **stays up** so that you can inspect
it, rather than exiting. In that state, `GET /v1/health` returns
`"success": false` with the `[MODEL_CONFIG]` payload in `message`, and import
calls are rejected until you redeploy the service with a valid configuration.

`INSUFFICIENT_QUOTA` is a definitive rejection and is distinct from
`RATE_LIMITED`, including `HTTP 402`. It is never treated as a transient pass.

## Troubleshooting

| Symptom | Likely cause | Action |
|---------|--------------|--------|
| `success: false` with a "busy" message on an import call | A running import or recluster job holds the lock | Wait until it is done and check `GET /v1/health` for the busy message |
| `503` on a recluster call (gRPC `UNAVAILABLE`) | A running import or recluster job holds the lock | Poll the running job until `is_terminal`, then try again (see [Incremental Updates](../incremental-updates.md)). A **single-file** import that holds the lock has no `job_id`. In this case, watch the platform service status or `GET /v1/health` instead |
| Single-file import reports `success: true` but the DB is empty | Background work still running, or failed asynchronously | Check the platform service status (single-file imports have no `job_id`) |
| Multi-file job never reaches a terminal status | Long graph build or vector-index training | Continue polling; index training can take up to an hour on large corpora. Read `current_status.message` for hints. |
| `[NO_ENTITIES_WRITTEN]` in a `full_graphrag` job | Extraction returned nothing, or wrong mode | Inspect the source content; confirm `rag_mode: "full_graphrag"`; check the chat model is producing structured output |
| `[MODEL_CONFIG]` at startup, and imports rejected | The boot-time check rejected the chat or embedding configuration | Read the code and field named in the message, fix that value (for example `chat_api_key`, `embedding_model`, or `chat_api_url`), and redeploy. The service does not recover without a redeploy |
| `context_length_exceeded` in a status message | Model context too small for the rendered prompt | Operator tunes `CHAT_MAX_COMPLETION_TOKENS`, `CHAT_MODEL_CONTEXT_TOKENS`, or `GRAPHRAG_LLM_PROMPT_TOKEN_BUDGET` (see [LLM Configuration](../llm-configuration.md#token-budget-for-chat-models)) |
| SmartGraph validation error | `shard_count` not `1`, or invalid `partition_id` charset | Set `shard_count: 1` and use a valid `partition_id` |
| `Job not found` on `GET /v1/jobs/{id}` | Wrong id, or the job was pruned from the in-memory history | Re-submit; check you're querying the same replica that accepted the original request |
| Image fetch blocked | Host not on the allowlist | Operator sets `IMAGE_FETCH_ALLOWED_HOSTS` |
| Invalid `file_id` | Database name in the encoded ID doesn't match the importer's `db_name` | Regenerate `rag-input-{base64url(db:path)}` with the correct DB name |
| A document is cited with the wrong `file_name` or `citable_url` | The partition was imported before this release, in an order other than alphabetical | Import that partition again. New imports pair the metadata correctly |
| Semantic units exist but carry no `description` | No vision model is configured, or the call failed | Check for `description_generation: "failed"`, then see [Vision model requirements](../semantic-units.md#vision-model-requirements). On Triton, `CHAT_API_KEY` has to be set |

## Known limitations

1. **One import or recluster job per replica** at a time (a single in-process
   import lock, not keyed by partition).
2. **Single-file imports have no `job_id`**. The jobs API applies only to
   multi-file imports; use the platform service status feed instead.
3. **`store_in_s3`** request field is accepted by the API but has **no
   effect** in the current service version.
4. **KG write verification** (`[NO_ENTITIES_WRITTEN]`,
   `[KG_VERIFICATION_INCONCLUSIVE]`) runs only on the **multi-file**
   completion path. Single-file `POST /v1/import` can report
   `service_completed` without that gate.
5. **KG verification** counts whole entity and relation collections, not
   per `import_number`. Re-runs against a non-empty graph may mask a
   zero-write regression.
6. **Job history is in-memory** per pod (up to 100 terminal jobs). It is
   not durable across restarts.
7. **Proto streaming types** (`ImportProgressResponse`) are not exposed on
   HTTP. Use the jobs API for monitoring.
8. **SmartGraph** creation supports `shard_count=1` only.
9. **Deprecated OpenAI `gpt-4` 8k** models lack the JSON-mode response
   format required for community reports. Prefer current models
   (for example `gpt-5.4-nano`, `gpt-4.1`, `gpt-4o`).
10. **IVF vector indexes** on sharded data may skip training when a shard
    contains no embedded documents (warning, not always a failure).
11. **Documents imported before v4.1.0 in a non-alphabetical order** can carry
    a `file_name` and `citable_url` belonging to another file in the same
    batch. Re-import the partition to correct it.
12. **Image descriptions require an OpenAI-compatible endpoint**, even when
    graph building runs on Triton. A Triton-only deployment without
    `CHAT_API_KEY` creates semantic units without descriptions.

## Related references

- **[Reference index](_index.md)**: Endpoints and recommended call sequence.
- **[Limits and Quotas](limits.md)**: The limits that produce many of the
  validation errors above.
- **[Incremental Updates](../incremental-updates.md)**: Reclustering, its job
  status, and how documents are removed and replaced in Layer 3.
- **[Parameters](parameters.md)**: Request parameter reference.
- **[Architecture](../architecture.md)**: Async-job lifecycle diagram and
  terminal status names.
- **[LLM Configuration](../llm-configuration.md#error-messages-on-graph-build-failure)**:
  Provider-specific error remediation messages.
