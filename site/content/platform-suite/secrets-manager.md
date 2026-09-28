---
title: The Secrets Manager of the Arango Contextual Data Platform
menuTitle: Secrets Manager
weight: 20
description: >-
  Store secrets like API keys for easy use across the Contextual Data Platform
---
If you want to use external services like cloud APIs, you need API keys
or other means to authenticate and authorize the usage.

In the Arango Contextual Data Platform, you may have multiple internal services that
utilize the same third-party API, but manually specifying the API key each time
would be tedious. Instead, you can use the Secrets Manager of the Contextual Data Platform
to centrally store API keys, account credentials, and so on.

The Secrets Manager stores secrets globally for the entire Contextual Data Platform
deployment. If the value of a secret changes, you only need to update it in
a single place.

{{< tip >}}
Services that utilize the secrets manager are, for example, AutoGraph and
AutoRAG of the Agentic AI Suite. They require a Large Language Model (LLM) and
embedding model and need an API key for a provider like OpenAI. See
[Reference secrets in service requests](#reference-secrets-in-service-requests).
{{< /tip >}}

## Encryption and access

Secrets are encrypted at rest using a token derived from the Kubernetes namespace.

Each service that runs in the Contextual Data Platform can access the secrets via a
sidecar container for metadata that runs in the pod of the service. <!-- TODO: Does it need to be enabled via a configuration? -->

## Web interface

### Store a secret

1. In the main navigation of the Arango Contextual Data Platform web interface, go to the
   **Control Panel** ({{< icon "settings" >}}).
2. Click **Secrets** in the navigation.
3. Click **Add secret** in the top-right corner.
4. In the **Create Secret** dialog, enter a **Name** to later reference the secret.
5. The **Type** is fixed to `API_KEY` (generic API keys and tokens) for secrets
   created via the web interface. Other types can be created via the API.
6. Enter the sensitive information (API key, password, or similar) into the
   **Secret Data** field. Click the eye icon to show or hide the value.
7. Optionally enter a **Description** to help identify the secret.
8. Click **Create**.

### Edit a secret

1. In the main navigation, go to the **Control Panel** ({{< icon "settings" >}}).
2. Click **Secrets** in the navigation.
3. In the **Actions** column, click the edit icon ({{< icon "edit-square" >}}).
4. Adjust the information. To edit the **Secret Value**, click the toggle next to
   the label and then enter the new value.
5. Click **Save Changes**.

### Delete a secret

1. Go to the **Control Panel** ({{< icon "settings" >}}).
2. Click **Secrets** in the navigation.
3. Delete one or multiple secrets:
   - In the **Actions** column, click the remove icon ({{< icon "delete" >}})
     and confirm by clicking **Delete**.
   - At the start of the row, tick the checkboxes of the secrets you want to
     remove. Then click the **Delete selected (#)** button in the top-right
     corner and confirm by clicking **Delete # Secret(s)**.

### Import secrets

1. Go to the **Control Panel** ({{< icon "settings" >}}).
2. Click **Secrets** in the navigation.
3. Click the **Import** button in the top-right corner.
4. In the **Import Secrets** dialog, you can **Paste JSON** from the clipboard
   or go to the **Upload File** tab to select or drop a `.json` file. The file
   must contain a JSON array of secret profiles. You can inspect and edit
   uploaded data in the **Paste JSON** tab. Click **Load sample** to insert
   an example payload.
5. Click **Validate & Preview**. Fix missing fields or syntax errors if necessary.
6. Verify the data. You can remove ({{< icon "delete" >}}) individual rows to
   exclude secrets from the import.
7. Click **Import # Secret(s)**.

## API

The Secrets Manager endpoints are part of the
[Arango Control Plane (ACP) API](https://apiref.arango.ai/#genai-service).
See the reference for the full request and response schemas of the
`/v1/secrets`, `/v1/secrets_batch`, and `/v1/secret_types` endpoints.

### How to use the secrets manager API

Before you create a secret, take a look at the available types you can specify:

{{< endpoint "GET" "https://<EXTERNAL_ENDPOINT>:8529/_platform/acp/v1/secret_types" >}}

Now create a new secret with this endpoint:

{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/_platform/acp/v1/secrets" >}}

The request body needs to be a JSON object with the following attributes:

- `name` (string, _required_): The name for referencing the secret.
- `profileType` (string): One of the available types (see above), e.g. `LLM`.
- `secretData` (string, _required_): The sensitive information
   (API key, password, or similar).
- `provider` (string): One of the available providers as returned when you
   listed the types.
- `description` (string): Information that helps to identify the secret or is
   noteworthy.
- `metadata` (object): Additional information as key-value pairs (both strings).

**Example**

```sh
curl -H "Authorization: bearer <TOKEN>" -d '{"name":"OpenAI-API","profileType":"LLM","provider":"openai","secretData":"sk-...","description":"Production API key for OpenAI"}' https://127.0.0.1:8529/_platform/acp/v1/secrets
```

You can list the existing secret objects (but without the sensitive secrets
themselves):

{{< endpoint "GET" "https://<EXTERNAL_ENDPOINT>:8529/_platform/acp/v1/secrets" >}}

To retrieve a specific secret object by its profile ID:

{{< endpoint "GET" "https://<EXTERNAL_ENDPOINT>:8529/_platform/acp/v1/secrets/{profile_id}" >}}

To replace an existing secret with a new one, use the following endpoint.
The request body must include all attributes of the secret:

{{< endpoint "PUT" "https://<EXTERNAL_ENDPOINT>:8529/_platform/acp/v1/secrets/{profile_id}" >}}

To update only specific attributes of an existing secret, use the following
endpoint. The request body only needs to include the attributes you want to
change:

{{< endpoint "PATCH" "https://<EXTERNAL_ENDPOINT>:8529/_platform/acp/v1/secrets/{profile_id}" >}}

To delete a single secret by its profile ID:

{{< endpoint "DELETE" "https://<EXTERNAL_ENDPOINT>:8529/_platform/acp/v1/secrets/{profile_id}" >}}

To create multiple secrets in a single request, use the batch endpoint.
The request body must be a JSON array of secret objects:

{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/_platform/acp/v1/secrets_batch" >}}

To delete multiple secrets in a single request, use the batch delete endpoint.
The request body must include the list of profile IDs to delete:

{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/_platform/acp/v1/secrets_batch/delete" >}}

## Reference secrets in service requests

Services don't accept the name of a secret. Instead, request fields that end
in `_secret_profile_id` (or `_secret_profile_ids` for a list) expect the
**profile ID** of a secret. The service resolves the profile ID to the stored
value via the Secrets Manager. The raw API key is never part of the request.

### Get the profile ID of a secret

The profile ID is returned when you create a secret:

```sh
curl -H "Authorization: bearer <TOKEN>" \
  -d '{"name":"OpenAI-API","profileType":"LLM","provider":"openai","secretData":"sk-..."}' \
  https://<EXTERNAL_ENDPOINT>:8529/_platform/acp/v1/secrets
```

```json
{
  "profile": {
    "profileId": "<profile-id>",
    "profileType": "LLM",
    "name": "OpenAI-API",
    "provider": "openai",
    "secretData": "********"
  }
}
```

For existing secrets, list them and look up the `profileId` by `name`:

```sh
curl -H "Authorization: bearer <TOKEN>" \
  https://<EXTERNAL_ENDPOINT>:8529/_platform/acp/v1/secrets
```

```json
{
  "profiles": [
    {
      "profileId": "<profile-id>",
      "profileType": "LLM",
      "name": "OpenAI-API",
      "provider": "openai"
    }
  ],
  "total": 1
}
```

### Pass the profile ID to a service

The following examples use AutoGraph. Other services of the Agentic AI Suite,
like AutoRAG, use the same `chat_secret_profile_id` and
`embedding_secret_profile_id` field names.

**Set the credentials when installing a service**

Put the profile IDs into the `env` object of the install request instead of
`chat_api_key` and `embedding_api_key`:

```json
{
  "env": {
    "db_name": "your_database_name",
    "genai_project_name": "your_project_name",
    "chat_api_provider": "openai",
    "chat_model": "gpt-5.4-nano",
    "chat_secret_profile_id": "<chat-profile-id>",
    "embedding_api_provider": "openai",
    "embedding_model_name": "text-embedding-3-small",
    "embedding_secret_profile_id": "<embedding-profile-id>"
  }
}
```

You can reference the same profile ID for chat and embeddings if one API key
covers both models.

**Change the credentials of a running service**

AutoGraph validates the new configuration, including a live check of the API
key, and applies it to the running service without a restart:

{{< endpoint "PUT" "https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/projects/{project}/model-config/credentials" >}}

```sh
curl -X PUT -H "Authorization: bearer <TOKEN>" -H "Content-Type: application/json" \
  -d '{
    "chat_api_provider": "openai",
    "chat_model": "gpt-5.4-nano",
    "chat_secret_profile_id": "<chat-profile-id>",
    "embedding_api_provider": "openai",
    "embedding_model": "text-embedding-3-small",
    "embedding_secret_profile_id": "<embedding-profile-id>"
  }' \
  https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/projects/your_project_name/model-config/credentials
```

If a profile ID is missing or cannot be resolved, the request is rejected with
HTTP status `400` and an `error_code` such as `SECRET_PROFILE_REQUIRED`,
`SECRET_NOT_FOUND`, or `SECRET_RESOLUTION_ERROR`.

**Spread the chat load across multiple API keys**

The [orchestration endpoint](../agentic-ai-suite/autograph/reference/orchestration.md)
of AutoGraph accepts a list of chat profile IDs. The spawned Importer workers
rotate across the keys, which helps to stay within per-key rate limits:

```sh
curl -X POST -H "Authorization: bearer <TOKEN>" -H "Content-Type: application/json" \
  -d '{
    "project": "your_project_name",
    "replicas": 3,
    "chat_secret_profile_ids": ["<chat-profile-id-1>", "<chat-profile-id-2>"],
    "embedding_secret_profile_id": "<embedding-profile-id>"
  }' \
  https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/orchestrate
```

Store each API key as a separate secret to get one profile ID per key.
The embedding credentials accept a single profile ID only.
