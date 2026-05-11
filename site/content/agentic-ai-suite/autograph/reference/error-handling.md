---
title: Error Handling and Troubleshooting
menuTitle: Error Handling
description: >-
  HTTP error codes, common issues, and troubleshooting for the AutoGraph service
weight: 60
---

## Error Handling

Typical **HTTP** outcomes:

| Code | Meaning |
|------|---------|
| `200` | Success |
| `400` | Invalid request body or parameters |
| `401` | Missing or invalid token or LLM provider authentication failed |
| `403` | Authenticated but not allowed to use the database or LLM provider permission denied |
| `404` | Unknown build id, missing collection (embed), etc. |
| `409` | Build or orchestration already running |
| `429` | LLM provider rate limit or quota exceeded (request was rejected upstream) |
| `500` | Server or configuration error |
| `503` | Service not ready |

Error bodies are usually JSON with a **`message`** (and sometimes a **`code`**) you can log or show to operators.

**Provider-failure error codes:** when a corpus build or RAG Strategizer run fails
because of an LLM or embedding provider error, `GET /v1/corpus/builds/{id}` returns
an `error_code` field that classifies the cause for programmatic handling:

| `error_code` | Meaning | HTTP equivalent |
|--------------|---------|-----------------|
| `LLM_AUTHENTICATION_FAILED` | API key rejected by the provider | `401` |
| `LLM_PERMISSION_DENIED` | API key valid but lacks access to the model | `403` |
| `LLM_RATE_LIMITED` | Provider rate-limited the request | `429` |
| `LLM_QUOTA_EXCEEDED` | Provider quota for the key was consumed | `429` |
| `LLM_API_KEY_MISSING` | No chat/embedding key configured on the service | `401` |

**Common cases:** empty `files` on import; wrong `embedding_strategy` (use `"first_chunk"`); `cluster_threshold` not `1` or `2`; strategizer run before a successful build; embed request missing `collection` / `field`, or `field` ending in `_embedding`; embedding or auth not configured on the server.

## Troubleshooting

- **Cannot reach ArangoDB** - check network/firewall and the ArangoDB URL your deployment uses.
- **401 / auth** - use `Authorization: Bearer <token>` with a space after `Bearer`.
- **Build stuck or failed** - poll `GET /v1/corpus/builds/{id}` for `status`, `message`, and `error`.
- **Strategizer fails** - finish the corpus build first; ensure clusters exist.
- **Orchestration fails** - ensure strategies exist in `rags`; confirm platform auth and GenAI/importer integration are configured for your environment.
- **Embed field** - collection must exist; source field must have non-empty values; embedding must be configured on the service.
