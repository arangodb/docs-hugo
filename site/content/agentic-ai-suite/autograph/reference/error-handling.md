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
| `401` | Missing or invalid token |
| `403` | Authenticated but not allowed to use the database |
| `404` | Unknown build id, missing collection (embed), etc. |
| `409` | Build or orchestration already running |
| `500` | Server or configuration error |
| `503` | Service not ready |

Error bodies are usually JSON with a **`message`** (and sometimes a **`code`**) you can log or show to operators.

**Common cases:** empty `files` on import; wrong `embedding_strategy` (use `"first_chunk"`); `cluster_threshold` not `1` or `2`; strategizer run before a successful build; embed request missing `collection` / `field`, or `field` ending in `_embedding`; embedding or auth not configured on the server.

## Troubleshooting

- **Cannot reach ArangoDB** — Check network/firewall and the ArangoDB URL your deployment uses.
- **401 / auth** — Use `Authorization: Bearer <token>` with a space after `Bearer`.
- **Build stuck or failed** — Poll `GET /v1/corpus/builds/{id}` for `status`, `message`, and `error`.
- **Strategizer fails** — Finish corpus build first; ensure clusters exist.
- **Orchestration fails** — Ensure strategies exist in `rags`; confirm platform auth and GenAI/importer integration are configured for your environment.
- **Embed field** — Collection must exist; source field must have non-empty values; embedding must be configured on the service.
