---
title: The Secrets Manager of the Arango Data Platform
menuTitle: Secrets Manager
weight: 35
description: >-
  Store secrets like API keys for easy use across the Data Platform
---
If you want to use external services like cloud APIs, you need API keys
or other means to authenticate and authorize the usage.

In the Arango Data Platform, you may have multiple internal services that
utilize the same third-party API, but manually specifying the API key each time
would be tedious. Instead, you can use the Secrets Manager of the Data Platform
to centrally store API keys, account credentials, and so on.

The Secrets Manager stores secrets globally for the entire Data Platform
deployment. If the value of a secret changes, you only need to update it in
a single place.

{{< tip >}}
For example, the importer and retriever services of the AI Suite for GraphRAG
require a Large Language Model (LLM) and utilize the secret manager for storing
an LLM API key like from OpenAI.
{{< /tip >}}

## Encryption and access

Secrets are encrypted at rest using a token derived from the Kubernetes namespace.

Each service that runs in the Data Platform can access the secrets via a
sidecar container for metadata that runs in the pod of the service. <!-- TODO: Does it need to be enabled via a configuration? -->

## Web interface

### Store a secret

1. In the Arango Data Platform web interface, go to the
   **Control Panel** ({{< icon "settings" >}}).
2. Click **Secrets Manager** in the navigation.
3. Click **Add Secret**.
4. Enter a **Name** to later reference the secret.
5. Select a **Type** from the provided list.
5. Enter the **Secret Value** (API key, password, or similar).
6. Optionally specify additional metadata.
   You can enter a **Provider** and a **Description**.

### Edit a secret

1. Go to the **Control Panel** ({{< icon "settings" >}}).
2. Click **Secrets Manager** in the navigation.
3. In the **Actions** column, click the edit icon ({{< icon "edit-square" >}}).
4. Adjust the information.
5. Click **Save Changes**.

### Delete a secret

1. Go to the **Control Panel** ({{< icon "settings" >}}).
2. Click **Secrets Manager** in the navigation.
3. Delete one or multiple secrets:
   - In the **Actions** column, click the remove icon ({{< icon "delete" >}})
     and confirm by clicking **Delete**.
   - At the start of the row, tick the checkboxes of the secrets you want to
     remove. Then click the **Delete selected (#)** button in the top-right
     corner and confirm by clicking **Delete # Secret(s)**.

### Import secrets

1. Go to the **Control Panel** ({{< icon "settings" >}}).
2. Click **Secrets Manager** in the navigation.
3. Click the **Import** button in the top-right corner.
4. You can **Paste JSON** from the clipboard or go to the **Upload File**
   tab to select or drop a JSON file. You can inspect and edit the uploaded
   data in the **Paste JSON** tab.
5. Click **Validate & Preview**. Fix missing fields or syntax errors if necessary.
6. Verify the data. You can remove ({{< icon "delete" >}}) individual rows to
   exclude secrets from the import.
7. Click **Import # Secret(s)**.

## API

<!-- TODO: Link to reference docs -->

<!-- TODO: /ai prefix to be replaced -->

Before you create a secret, take a look at the available types you can specify:

{{< endpoint "GET" "https://<EXTERNAL_ENDPOINT>:8529/ai/v1/secret_types" >}}

Now create a new secret with this endpoint:

{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/ai/v1/secrets" >}}

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
curl -H "Authorization: bearer <TOKEN>" -d '{"name":"OpenAI-API","profileType":"LLM","provider":"openai","secretData":"sk-...","description":"Production API key for OpenAI"}' https://127.0.0.1:8529/ai/v1/secrets
```

You can list the existing secret objects (but without the sensitive secrets
themselves):

{{< endpoint "GET" "https://<EXTERNAL_ENDPOINT>:8529/ai/v1/secrets" >}}
