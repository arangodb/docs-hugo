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
| Importer busy (lock held) | `200` | `"success": false`, message about the lock |
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
| `[INVALID_API_KEY]` | The boot-time API key probe failed. The pod exits before serving traffic. |
| `[NO_ENTITIES_WRITTEN]` | **Multi-file only.** `full_graphrag` import finished but entity and relation counts are empty. Check that the source documents have enough content and that the chat model produced extractable output. |
| `[KG_VERIFICATION_INCONCLUSIVE]` | **Multi-file only.** Import completed but the post-import count check failed transiently. Re-running often resolves it. |
| `[rag_mode=...]` | Informational - shows the RAG mode applied to the job. |
| OpenAI remediation text | Mapped from the SDK exception. Covers insufficient quota, invalid key, rate limit, timeout, `5xx`, and context-length exceeded. |
| Terminal status name | One of `service_failed`, `openai_graph_build_failed`, `triton_graph_build_failed`, `openai_embedding_failed`, `triton_embedding_failed`, `import_graph_to_adb_failed`, `create_index_failed`. |

### Boot-time API key gate

Before the service starts accepting requests, the Importer probes the
configured OpenAI key via `GET {chat_api_url}/models`. Definitive `401` /
`403` responses cause a `SERVICE_FAILED` status with `[INVALID_API_KEY]`
and the process exits. `429` / `5xx` / timeouts produce a warning only;
the service still starts.

## Troubleshooting

| Symptom | Likely cause | Action |
|---------|--------------|--------|
| `success: false` with a "busy" message | Import lock held by another in-flight import | Wait for completion; check `GET /v1/health` for the busy message |
| Single-file import reports `success: true` but the DB is empty | Background work still running, or failed asynchronously | Check the platform service status (single-file imports have no `job_id`) |
| Multi-file job never reaches a terminal status | Long graph build or vector-index training | Continue polling; index training can take up to an hour on large corpora. Read `current_status.message` for hints. |
| `[NO_ENTITIES_WRITTEN]` in a `full_graphrag` job | Extraction returned nothing, or wrong mode | Inspect the source content; confirm `rag_mode: "full_graphrag"`; check the chat model is producing structured output |
| `[INVALID_API_KEY]` at startup | Bad deploy-time API key | Fix the operator secret (`chat_api_key` / `embedding_api_key`) and redeploy |
| `context_length_exceeded` in a status message | Model context too small for the rendered prompt | Operator tunes `CHAT_MAX_COMPLETION_TOKENS`, `CHAT_MODEL_CONTEXT_TOKENS`, or `GRAPHRAG_LLM_PROMPT_TOKEN_BUDGET` (see [LLM Configuration](../llm-configuration.md#token-budget-for-chat-models)) |
| SmartGraph validation error | `shard_count` not `1`, or invalid `partition_id` charset | Set `shard_count: 1` and use a valid `partition_id` |
| `Job not found` on `GET /v1/jobs/{id}` | Wrong id, or the job was pruned from the in-memory history | Re-submit; check you're querying the same replica that accepted the original request |
| Image fetch blocked | Host not on the allowlist | Operator sets `IMAGE_FETCH_ALLOWED_HOSTS` |
| Invalid `file_id` | Database name in the encoded ID doesn't match the importer's `db_name` | Regenerate `rag-input-{base64url(db:path)}` with the correct DB name |

## Known limitations

1. **One import per replica** at a time (an in-process import lock).
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

## Related references

- **[Reference index](_index.md)**: Endpoints and recommended call sequence.
- **[Parameters](parameters.md)**: Request parameter reference.
- **[Architecture](../architecture.md)**: Async-job lifecycle diagram and
  terminal status names.
- **[LLM Configuration](../llm-configuration.md#error-messages-on-graph-build-failure)**:
  Provider-specific error remediation messages.
