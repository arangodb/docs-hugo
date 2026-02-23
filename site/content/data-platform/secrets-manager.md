---
title: The Secrets Manager of the Arango Data Platform
menuTitle: Secrets Manager
weight: 35
description: >-
  Store secrets like API keys for easy use across the Data Platform
---
If you want to use external services like the API of a Large Language Model (LLM),
you need an API key or similar to do so. In the Arango Data Platform, you may
have multiple internal services that require an LLM, but manually specifying
the API key each time would be tedious. Instead, you can use the Secrets Manager
of the Data Platform to centrally store API keys, account credentials, and so on.

The Secrets Manager stores secrets globally for the entire deployment. If the
value of a secret changes, you only need to update it in a single place.

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
     remove. Then click **Delete selected (#)** in the top-right corner and
     confirm by clicking **Delete # Secret(s)**.

## API

<!-- TODO: Where are the methods mapped to endpoints?
https://github.com/arangoml/mlflow_http_artifact_repository/blob/main/packages/arango_platform_clients/arango_platform_clients/secrets/manager.py
-->
