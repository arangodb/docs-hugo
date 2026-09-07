---
title: Retriever Error Handling
menuTitle: Error Handling
weight: 65
description: >-
  How the Retriever reports failures, the status codes it returns, and what
  every error code means
---
## How the Retriever reports failures

The Retriever reports a failure in one of two ways, depending on how far the
request got:

- **The request was rejected.** You get an HTTP error status and no result, for
  example when the token is missing or the query is too large.
- **The request was accepted but the work failed.** You get HTTP `200` with a
  field in the response body that carries the failure.

The second case is easy to miss. Three different operations report failure
inside a successful response, so a client that looks only at the status code
treats them as successes.

## Status codes

| Code | Meaning |
|------|---------|
| `200` | The request was accepted. The work itself may still have failed, see [Failures reported with a 200](#failures-reported-with-a-200). |
| `400` | The request was rejected before any retrieval work. Besides a [`query`](parameters.md#query) larger than 64 KiB, this covers requests the service refuses as contradictory or malformed: conflicting partition parameters, an invalid Custom Retriever tool configuration, or an unknown key in [`custom_prompts`](custom-prompts.md#validation). |
| `401` | The `Authorization` header is missing or the token is invalid. Every endpoint of the service needs one. |
| `404` | The run you asked for does not exist or was deleted, when [getting a single run](verify-and-monitor.md#get-a-single-run). Other operations can also return it when something they look up is missing. |
| `500` | The service could not complete the request, for example when it cannot reach the collection that stores the query history. A provider failure that no part of the query path handled also arrives here, with its [provider error code](#provider-error-codes) at the front of the message rather than in a field. |

## Failures reported with a 200

| Operation | Field to inspect | A failure looks like |
|-----------|------------------|----------------------|
| [Querying](executing-queries.md), streaming or not | `errorCode` | A non-empty code. See [Query error codes](#query-error-codes). |
| [Updating the model configuration](llm-configuration.md#update-the-model-configuration-at-runtime) | `valid` | `valid: false`, with `errorCode` and `field` naming the problem. See [Model configuration error codes](#model-configuration-error-codes). |
| [Deleting a run](verify-and-monitor.md#delete-a-run) | `success` | `success: false`, which means no run was deleted. |

{{< warning >}}
Inspect the field named above rather than the status code. A query that failed
still returns `200`, and its `result` can be non-empty, because the service puts
the failure message there for callers that display it.
{{< /warning >}}

## Query error codes

These are the values `errorCode` can have on a failed query, on both the unary
and the streaming endpoint. On a stream, the code is set on the chunk that
reports the failure.

| `errorCode` | Meaning |
|-------------|---------|
| `CONTEXT_LENGTH_EXCEEDED` | The context assembled for the query exceeded the context window of the model. For a Custom Retriever query, lower the `top_k` of the tool named in the message. |
| `CREDENTIAL_VALIDATION_FAILED` | The service has no chat or embedding API key, or it runs on the `custom` provider without an API URL. See [Configure LLMs](llm-configuration.md). |
| `VECTOR_INDEX_NOT_READY` | The vector index that semantic search needs cannot serve the query: it is either still building after graph creation, or it does not exist. Retry if a build is in progress, otherwise create the index. |
| Any [provider error code](#provider-error-codes) | The LLM provider rejected the call. |
| `PROCESSING_ERROR` | Any other failure. The accompanying message carries the underlying cause. |

## Model configuration error codes

When an update to the [model configuration](llm-configuration.md#update-the-model-configuration-at-runtime)
is rejected, `errorCode` names the reason and `field` names the request field to
correct.

**Something is wrong with the request:**

| `errorCode` | Meaning |
|-------------|---------|
| `PROJECT_MISMATCH` | The `project` in the request is not the project this Retriever belongs to. |
| `PROVIDER_REQUIRED` | A provider field is empty. |
| `INVALID_PROVIDER` | A provider field is not `openai`, `custom`, or `triton`. |
| `PROVIDER_MISMATCH` | The chat and embedding providers are not compatible with each other, for example one is `triton` and the other is not. |
| `MODEL_REQUIRED` | A model name is missing. |
| `SECRET_PROFILE_REQUIRED` | A secret profile ID is missing. |
| `SECRET_NOT_FOUND` | No secret profile exists with the ID you sent. |
| `SECRET_RESOLUTION_ERROR` | The secret profile could not be read. |
| `SECRET_PROFILE_INVALID` | The secret profile holds no usable API key. |

**The settings could not be saved:**

| `errorCode` | Meaning |
|-------------|---------|
| `SERVICE_NOT_REGISTERED` | This Retriever is not recorded in the project, so there is nothing to update. |
| `METADATA_CLIENT_UNAVAILABLE` | The service cannot reach the store that holds the project settings. |
| `METADATA_WRITE_TIMEOUT` | Saving the settings took too long. |
| `METADATA_WRITE_FAILED` | Saving the settings failed. |

The test requests that validate the new settings fail with the
[provider error codes](#provider-error-codes) below.

## Provider error codes

These come from the LLM provider rather than from the Retriever. You meet them
in two places: on a query, when a working configuration stops working, and on a
model configuration update, when the service tries the new settings before
saving them. The same code means the same thing in both, so a key that dies
mid-query reads exactly like one caught while saving credentials.

| `errorCode` | Meaning |
|-------------|---------|
| `INVALID_API_KEY` | The provider rejected the API key. |
| `KEY_EXPIRED` | The provider rejected the API key as expired. |
| `API_KEY_REQUIRED` | No API key is configured for this role. |
| `INSUFFICIENT_QUOTA` | The account behind the key has no quota left. |
| `RATE_LIMITED` | The provider is rate-limiting this key. Retry shortly. |
| `PERMISSION_DENIED` | The key is valid but not allowed to use this model. |
| `MODEL_NOT_FOUND` | The endpoint does not serve a model with that name. |
| `MODEL_REJECTED_REQUEST` | The model refused the request as it was sent. |
| `INVALID_BASE_URL` | The API URL is not a usable endpoint. You also get this when the provider is `custom` and no URL was given. |
| `ENDPOINT_UNREACHABLE` | The API URL could not be reached. |
| `TIMEOUT` | The provider did not answer in time. |
| `PROVIDER_EMPTY_RESPONSE` | The provider answered, but with nothing usable. |
| `PROVIDER_ERROR` | The provider returned a server error, an unreadable response, or another failure that does not fit the rows above. A server error is usually transient. |
| `UNKNOWN_VALIDATION_ERROR` | The failure could not be classified. |

{{< tip >}}
On a model configuration update, `keyStatus` summarizes the same outcome in one
word, which is useful when you only need to know whether the key itself is
usable. It is empty whenever the key was never actually tried, either because
the request failed a check before the provider was reached or because the
endpoint could not be connected to.
{{< /tip >}}

## Next Steps

- [**Execute queries**](executing-queries.md): The query endpoints and their responses.
- [**Verify and monitor**](verify-and-monitor.md): Service health and query history.
- [**Configure LLMs**](llm-configuration.md): Providers, models, and runtime updates.
