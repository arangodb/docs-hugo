---
title: GenAI Orchestration Service
menuTitle: GenAI
description: >-
  The GenAI orchestrator service installs, manages, and runs AI-based services
  for GraphRAG in your Kubernetes cluster
weight: 5
---
{{< tag "ArangoDB Platform" >}}

{{< tip >}}
The ArangoDB Platform & GenAI Suite is available as a pre-release. To get
exclusive early access, [get in touch](https://arangodb.com/contact/) with
the ArangoDB team.
{{< /tip >}}

## Overview

The basic operations that the GenAI orchestration service carries out are the following:
- Install a service
- Uninstall a service
- Get the status of a service
- List all installed and deployed services

Each unique service has its own API endpoint for the deployment.

**Endpoint LLM Host:**
`https://<ExternalEndpoint>:8529/gen-ai/v1/llmhost`

While services have their own unique endpoint, they share the same creation
request body and the same response body structure. The `env` field is used
to define the service specific parameters, like the model name to use for a
`llmhost` service, and the labels can be used to filter and identify the services
in the platform. All services support the `profiles` field, which you can use
to define the profile to use for the service. For example, you can define a
GPU profile that enables the service to run an LLM on GPU resources.

## LLM Host Service Creation Request Body

```json
{
    "env": {
        "model_name": "<registered_model_name>"
    }
}
```

## Using Labels in Creation Request Body

```json
{
    "env": {
        "model_name": "<registered_model_name>"
    },
    "labels": {
        "key1": "value1",
        "key2": "value2"
    }
}
```

{{< info >}}
Labels are optional. Labels can be used to filter and identify services in
the Platform. If you want to use labels, define them as a key-value pair in `labels`
within the `env` field.
{{< /info >}}

## Using Profiles in Creation Request Body

```json
{
    "env": {
        "model_name": "<registered_model_name>",
        "profiles": "gpu,internal"
    }
}
```

{{< info >}}
The `profiles` field is optional. If it is not set, the service is created with
the default profile. Profiles must be present and created in the Platform before
they can be used. If you want to use profiles, define them as a comma-separated
string in `profiles` within the `env` field.
{{< /info >}}

The parameters required for the deployment of each service are defined in the
corresponding service documentation.

## Obtaining a Bearer Token

Before you can authenticate with the GenAI service, you need to obtain a
Bearer token. You can generate this token using the ArangoDB authentication API:

```bash
curl -X POST https://<ExternalEndpoint>:8529/_open/auth \
  -d '{"username": "your-username", "password": "your-password"}'
```

This returns a JWT token that you can use as your Bearer token. For more
details about ArangoDB authentication and JWT tokens, see
the [ArangoDB Authentication](../../arangodb/3.12/develop/http-api/authentication.md#jwt-user-tokens)
documentation.

## Complete Service lifecycle example

The example below shows how to install, monitor, and uninstall the Importer service.

### Step 1: Installing the service

```bash
curl -X POST https://<ExternalEndpoint>:8529/gen-ai/v1/graphragimporter \
  -H "Authorization: Bearer <your-bearer-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "env": {
      "username": "<your-username>",
      "db_name": "<your-database-name>",
      "api_provider": "<your-api-provider>",
      "triton_url": "<your-arangodb-llm-host-url>",
      "triton_model": "<your-triton-model>"
    }
  }'
```

**Response:**

```json
{
  "serviceInfo": {
    "serviceId": "arangodb-graphrag-importer-of1ml",
    "description": "Install complete",
    "status": "DEPLOYED",
    "namespace": "arangodb-platform-dev"
  }
}
```

### Step 2: Checking the service status

```bash
curl -X GET https://<ExternalEndpoint>:8529/gen-ai/v1/service/arangodb-graphrag-importer-of1ml \
  -H "Authorization: Bearer <your-bearer-token>"
```

**Response:**
```json
{
  "serviceInfo": {
    "serviceId": "arangodb-graphrag-importer-of1ml",
    "description": "Install complete",
    "status": "DEPLOYED",
    "namespace": "arangodb-platform-dev"
  }
}
```

### Step 3: Uninstalling the service

```bash
curl -X DELETE https://<ExternalEndpoint>:8529/gen-ai/v1/service/arangodb-graphrag-importer-of1ml \
  -H "Authorization: Bearer <your-bearer-token>"
```

**Response:**
```json
{
  "serviceInfo": {
    "serviceId": "arangodb-graphrag-importer-of1ml",
    "description": "Uninstall complete",
    "status": "UNINSTALLED", 
    "namespace": "arangodb-platform-dev"
  }
}
```

{{< info >}}
- **Service ID**: The `serviceId` from Step 1's response (`arangodb-graphrag-importer-of1ml`) is used in Steps 2 and 3
- **Authentication**: All requests use the same Bearer token in the `Authorization` header
{{< /info >}}

### Customizing the example

Replace the following values with your actual configuration:
- `<your-username>` - Your database username.
- `<your-database-name>` - Target database name.
- `<your-api-provider>` - Your API provider (e.g., `triton`)
- `<your-arangodb-llm-host-url>` - Your LLM host service URL.
- `<your-triton-model>` - Your Triton model name (e.g., `mistral-nemo-instruct`).
- `<your-bearer-token>` - Your authentication token.

## Service configuration

The GenAI orchestrator service is **started by default**. 

It will be available at the following URL:
`https://<ExternalEndpoint>:8529/gen-ai/v1/service`

## Health check

To test whether the service is running, you can use the following snippet:

```bash
curl -X GET https://<ExternalEndpoint>:8529/gen-ai/v1/health
```

Expected output on success: `{"status":"OK"}`

{{< info >}}
Keep in mind that this request requires a valid Bearer token. Without a valid
Bearer token, the request fails.
{{< /info >}}

## API Reference

For detailed API documentation, see the
[GenAI-Service API Reference](https://arangoml.github.io/platform-dss-api/GenAI-Service/proto/index.html).
