---
title: Set Up the Natural Language to AQL Service
menuTitle: Setup
weight: 15
description: >-
  Deploy and configure the Natural Language to AQL service on the Arango
  Contextual Data Platform, including LLM provider configuration and
  Secrets Manager integration
---

Deploy the Natural Language to AQL service with a single API call to the platform.
You provide configuration parameters in the request body, and the platform
automatically provisions the service with those settings.

{{< info >}}
Replace `<ExternalEndpoint>` in all examples below with your Arango Contextual
Data Platform deployment URL.
{{< /info >}}

## Prerequisites

Before deploying, have ready:

- An ArangoDB instance with a database name
- An API key from your chosen LLM provider (OpenAI, OpenRouter, or another
  OpenAI-compatible service), or a secret profile stored in the
  [Secrets Manager](../../platform-suite/secrets-manager.md)
- A Bearer token for platform authentication

## Obtain a Bearer token

Generate a Bearer token using the ArangoDB authentication API:

```bash
curl -X POST https://<EXTERNAL_ENDPOINT>:8529/_open/auth \
  -d '{"username": "your-username", "password": "your-password"}'
```

This returns a JWT token to use as the Bearer token in all subsequent API calls.
For more details, see the
[ArangoDB Authentication](../../arangodb/3.12/develop/http-api/authentication.md/#jwt-user-tokens)
documentation.

## Start the service

Create the service instance with your configuration:

```bash
curl --request POST \
  --url https://<EXTERNAL_ENDPOINT>:8529/_platform/acp/v1/graphrag \
  --header 'Authorization: Bearer <your-bearer-token>' \
  --header 'Content-Type: application/json' \
  --data '{
    "env": {
      "db_name": "<your_database_name>",
      "chat_api_provider": "openai",
      "chat_api_key": "<your-openai-api-key>",
      "chat_model": "gpt-4o"
    }
  }'
```

**Expected response:**
```json
{
  "serviceInfo": {
    "serviceId": "arangodb-graph-rag-xxxxx",
    "description": "Install complete",
    "status": "DEPLOYED",
    "namespace": "<arangodb>",
    "values": "<eyJhcGlfcHJvdmlkZXIi>..."
  }
}
```

{{< info >}}
Save the trailing segment of the `serviceId` from the response (here: `xxxxx`).
You need it to construct the endpoint URLs for all subsequent API calls.
{{< /info >}}

## Configuration parameters

All parameters are provided in the `env` object of your deployment request.

**Required:**

| Parameter | Description |
|---|---|
| `db_name` | Name of the ArangoDB database |
| `chat_api_provider` | Set to `openai` (supports OpenAI and OpenAI-compatible services) |
| `chat_api_key` **or** `chat_secret_profile_id` | LLM provider API key, or the name of a secret stored in the [Secrets Manager](../../platform-suite/secrets-manager.md) |

**Optional:**

| Parameter | Description |
|---|---|
| `chat_model` | Model name (default: `gpt-4o-mini`) |
| `chat_api_url` | Base URL for OpenAI-compatible endpoints (required for OpenRouter, self-hosted models, etc.) |
| `openai_max_retries` | Maximum retry attempts for failed LLM requests |

### Using OpenAI

The [deployment example](#start-the-service) above uses OpenAI directly. Provide
your OpenAI API key as `chat_api_key`.

### Using the Secrets Manager

Instead of embedding your API key directly in the request, reference a secret stored
in the [Secrets Manager](../../platform-suite/secrets-manager.md):

```bash
curl --request POST \
  --url https://<EXTERNAL_ENDPOINT>:8529/_platform/acp/v1/graphrag \
  --header 'Authorization: Bearer <your-bearer-token>' \
  --header 'Content-Type: application/json' \
  --data '{
    "env": {
      "db_name": "<your_database_name>",
      "chat_api_provider": "openai",
      "chat_secret_profile_id": "<secret-name>",
      "chat_model": "gpt-4o"
    }
  }'
```

The `chat_secret_profile_id` value must match the **Name** of a secret stored in
the Secrets Manager. For instructions on creating secrets, see
[Secrets Manager](../../platform-suite/secrets-manager.md).

### Using OpenRouter

OpenRouter provides access to multiple LLM providers through an OpenAI-compatible API:

- Set `chat_api_provider` to `openai`
- Set `chat_api_url` to `https://openrouter.ai/api/v1`
- Provide your OpenRouter API key as `chat_api_key`, or reference a stored secret
  using `chat_secret_profile_id`
- Set `chat_model` to any model ID from the OpenRouter catalog

### Using self-hosted models

For self-hosted OpenAI-compatible models:

- Set `chat_api_provider` to `openai`
- Set `chat_api_url` to your model's endpoint
- Configure `chat_api_key` (or `chat_secret_profile_id`) according to your setup

## Verify service status

Check that the service is properly deployed:

```bash
curl --request GET \
  --url https://<EXTERNAL_ENDPOINT>:8529/_platform/acp/v1/service/<SERVICE_ID> \
  --header 'Authorization: Bearer <your-bearer-token>'
```

**Expected response:**
```json
{
  "serviceInfo": {
    "serviceId": "arangodb-graph-rag-xxxxx",
    "description": "Install complete",
    "status": "DEPLOYED",
    "namespace": "<arangodb>",
    "values": "<eyJhcGlfcHJvdmlkZXIi>..."
  }
}
```

## Health check

Verify that the service is running and healthy:

```bash
curl --request GET \
  --url https://<EXTERNAL_ENDPOINT>:8529/graph-rag/<SERVICE_ID_POSTFIX>/v1/health \
  --header 'Authorization: Bearer <your-bearer-token>'
```

**Expected response:**
```json
{
  "status": "SERVING"
}
```

{{< info >}}
The `serviceIdPostfix` in the URL is the trailing segment of the `serviceId`
(after the last `-`), like `xxxxx` from `arangodb-graph-rag-xxxxx`.
{{< /info >}}

Once the service is running, see the [API Reference](api-reference.md) for endpoint
documentation.
