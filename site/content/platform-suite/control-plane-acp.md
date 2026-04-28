---
title: The Arango Control Plane (ACP) service
menuTitle: Control Plane (ACP)
weight: 30
description: >-
  Orchestrate the Contextual Data Platform with the Arango Control Plane to
  install, manage, and run services in your Kubernetes cluster
---
## Overview

The Arango Control Plane (ACP) is your single entry point for running and
organizing everything in the Contextual Data Platform. You can deploy services,
group your work into projects, and manage the secrets and files those
services depend on:

- **Services**: install, upgrade, uninstall, get status, and list installed
  services. Each service type has its own deployment endpoint but shares a
  common request and response structure.
- **Projects**: organize GraphRAG work by grouping related services and
  keeping data separate. See [Projects](#projects).
- **Secrets**: create and manage secret profiles used by services (for
  example, LLM API keys). See [Secrets Manager](secrets-manager.md).
- **Files**: upload and manage files used by services such as the Importer.
  See [File Manager](file-manager/_index.md).

The ACP service is **started by default** and is available at
`https://<EXTERNAL_ENDPOINT>:8529/_platform/acp/v1/service`.

## Getting started

### Obtaining a Bearer token

Before you can authenticate with the ACP service, you need to obtain a Bearer
token. You can generate this token using the ArangoDB authentication API:

{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/_open/auth" >}}

```bash
curl -X POST https://<EXTERNAL_ENDPOINT>:8529/_open/auth \
  -d '{"username": "your-username", "password": "your-password"}'
```

This returns a JWT token that you can use as your Bearer token. For more
details about ArangoDB authentication and JWT tokens, see the
[ArangoDB Authentication](../../arangodb/3.12/develop/http-api/authentication.md#jwt-user-tokens)
documentation.

### Health check

To verify the ACP service is running:

{{< endpoint "GET" "https://<EXTERNAL_ENDPOINT>:8529/_platform/acp/v1/health" >}}

```bash
curl -X GET https://<EXTERNAL_ENDPOINT>:8529/_platform/acp/v1/health
```

Expected output on success: `{"status":"OK"}`

{{< info >}}
This request requires a valid Bearer token. Without a valid Bearer token, the
request fails.
{{< /info >}}

## Services

All endpoints are prefixed with `https://<EXTERNAL_ENDPOINT>:8529/_platform/acp`.

| Method | Path | Description |
| ------ | ---- | ----------- |
| POST | `/v1/graphanalytics` | Deploy a Graph Analytics service |
| POST | `/v1/graphrag` | Deploy a GraphRAG service |
| POST | `/v1/graphragimporter` | Deploy a GraphRAG Importer service |
| POST | `/v1/graphragretriever` | Deploy a GraphRAG Retriever service |
| POST | `/v1/autograph` | Deploy an AutoGraph service |
| POST | `/v1/llmhost` | Deploy an LLM Host service |
| POST | `/v1/notebook` | Deploy a Notebook service |
| POST | `/v1/uds` | Deploy a User-Defined Service (UDS). See [Deploy a new service via API](container-manager/deploy-api.md) |
| POST | `/v1/service` | Deploy a generic service (any Helm chart) |
| GET | `/v1/service/{service_id}` | Check the status of a service |
| PUT | `/v1/service/{service_id}` | Upgrade a service to the latest version |
| DELETE | `/v1/service/{service_id}` | Uninstall a service |
| POST | `/v1/list_services` | List all installed services (supports label filtering) |
| GET | `/v1/health` | Health check |

The `/v1/service` endpoint accepts a generic body for deploying any Helm
chart:

```json
{
    "service_name": "<helm-chart-service-name>",
    "env": { "<key>": "<value>" },
    "labels": { "<key>": "<value>" }
}
```

### Service creation request body

The following example shows a complete request body with all available options:

```json
{
    "env": {
        "model_name": "<registered_model_name>",
        "profiles": "gpu,internal"
    },
    "labels": {
        "key1": "value1",
        "key2": "value2"
    }
}
```

- **env**: Service-specific parameters (for example, `model_name` for an
  LLM Host service). The required keys depend on the service; see the
  corresponding service documentation, such as
  [Importer](../agentic-ai-suite/importer/_index.md) and
  [Retriever](../agentic-ai-suite/retriever/_index.md).
- **labels** (optional): Key-value pairs used to filter and identify services
  in the platform.
- **profiles** (optional): A comma-separated string inside `env` defining
  which profiles to use for the service (for example, `"gpu,internal"`).
  If not set, the service is created with the default profile. Profiles must
  already exist in the platform. For example, a GPU profile enables the
  service to run an LLM on GPU resources.

### Complete service lifecycle example

The example below shows how to install, monitor, and uninstall the
[Importer](../agentic-ai-suite/importer/_index.md) service.

#### Step 1: Install the service

{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/_platform/acp/v1/graphragimporter" >}}

```bash
curl -X POST https://<EXTERNAL_ENDPOINT>:8529/_platform/acp/v1/graphragimporter \
  -H "Authorization: Bearer <your-bearer-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "env": {
      "db_name": "your_database_name",
      "project_name": "your_project_name",
      "chat_api_provider": "openai",
      "chat_api_url": "https://api.openai.com/v1",
      "embedding_api_provider": "openai",
      "embedding_api_url": "https://api.openai.com/v1",
      "chat_model": "gpt-4o",
      "embedding_model": "text-embedding-3-small",
      "chat_api_key": "your_openai_api_key",
      "embedding_api_key": "your_openai_api_key",
      "embedding_dim": "512"
    }
  }'
```

Where:
- `db_name`: Name of the ArangoDB database where the knowledge graph will be stored
- `project_name`: Name of an existing project (see [Projects](#projects)). Used
  as a prefix for all ArangoDB collections (for example, a project named
  `docs` creates `docs_Documents`, `docs_Chunks`, etc.)
- `chat_api_provider`: Set to `"openai"` for any OpenAI-compatible API
- `chat_api_url`: API endpoint URL for the chat/language model service
- `embedding_api_provider`: Set to `"openai"` for any OpenAI-compatible API
- `embedding_api_url`: API endpoint URL for the embedding model service
- `chat_model`: Specific language model to use for text generation and analysis
- `embedding_model`: Specific model to use for generating text embeddings
- `chat_api_key`: API key for authenticating with the chat/language model service
- `embedding_api_key`: API key for authenticating with the embedding model service
- `embedding_dim` (optional): Embedding dimension. The default value is `512`
  (auto-set to `768` for `nomic-embed-text-v1`). Only set manually if using a
  custom embedding model with a different dimension; must match the embedding
  model's output dimension.

{{< tip >}}
Instead of inline API keys, you can use `chat_secret_profile_id` and
`embedding_secret_profile_id` when your platform supports secret profiles for
the Importer install. For Triton Inference Server and other deployment
options, see the [LLM Configuration](../agentic-ai-suite/importer/llm-configuration.md)
documentation.
{{< /tip >}}

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

#### Step 2: Check the service status

{{< endpoint "GET" "https://<EXTERNAL_ENDPOINT>:8529/_platform/acp/v1/service/{serviceId>}" >}}

```bash
curl -X GET https://<EXTERNAL_ENDPOINT>:8529/_platform/acp/v1/service/arangodb-graphrag-importer-of1ml \
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

#### Step 3: Uninstall the service

{{< endpoint "DELETE" "https://<EXTERNAL_ENDPOINT>:8529/_platform/acp/v1/service/{serviceId}" >}}

```bash
curl -X DELETE https://<EXTERNAL_ENDPOINT>:8529/_platform/acp/v1/service/arangodb-graphrag-importer-of1ml \
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
- **Service ID**: The `serviceId` from Step 1's response
  (`arangodb-graphrag-importer-of1ml`) is used in Steps 2 and 3.
- **Authentication**: All requests use the same Bearer token in the
  `Authorization` header.
{{< /info >}}

### Listing services

To list all installed services, optionally filtered by labels:

{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/_platform/acp/v1/list_services" >}}

```bash
curl -X POST https://<EXTERNAL_ENDPOINT>:8529/_platform/acp/v1/list_services \
  -H "Authorization: Bearer <your-bearer-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "labels": {
      "key1": "value1"
    }
  }'
```

An empty request body (`{}`) returns all installed services.

### Upgrading a service

To upgrade a service to the latest available version:

{{< endpoint "PUT" "https://<EXTERNAL_ENDPOINT>:8529/_platform/acp/v1/service/{serviceId}" >}}

```bash
curl -X PUT https://<EXTERNAL_ENDPOINT>:8529/_platform/acp/v1/service/arangodb-graphrag-importer-of1ml \
  -H "Authorization: Bearer <your-bearer-token>"
```

## Projects

Projects help you organize your GraphRAG work by grouping related services and
keeping your data separate. When the Importer service creates ArangoDB
collections (such as documents, chunks, entities, relationships, and
communities), it uses your project name as a prefix. For example, a project
named `docs` will have collections like `docs_Documents`, `docs_Chunks`, and
so on.

Projects are required for the following services:
- Importer
- Retriever
- AutoGraph

| Method | Path | Description |
| ------ | ---- | ----------- |
| POST | `/v1/project` | Create a new AI project |
| DELETE | `/v1/project/{project_db_name}/{project_name}` | Delete a project |
| GET | `/v1/project_by_name/{project_db_name}/{project_name}` | Get a project by name |
| GET | `/v1/all_project_names/{project_db_name}` | Get all project names in a database |
| GET | `/v1/all_projects/{project_db_name}` | Get all projects in a database |

### Creating a project

To create a new GraphRAG project, send a POST request to the project endpoint:

{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/_platform/acp/v1/project" >}}

```bash
curl -X POST https://<EXTERNAL_ENDPOINT>:8529/_platform/acp/v1/project \
  -H "Authorization: Bearer <your-bearer-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "project_name": "docs",
    "project_type": "graphrag",
    "project_db_name": "documentation",
    "project_description": "A documentation project for GraphRAG."
  }'
```

Where:
- **project_name** (required): Unique identifier for your project. Must be
  1-63 characters and contain only letters, numbers, underscores (`_`), and
  hyphens (`-`).
- **project_type** (required): Type of project (for example, `"graphrag"`).
- **project_db_name** (required): The ArangoDB database name where the
  project will be created.
- **project_description** (optional): A description of your project.

Once created, you can reference your project in service deployments using the
`project_name` field:

```json
{
  "env": {
    "project_name": "docs"
  }
}
```

### Listing projects

**List all project names in a database:**

{{< endpoint "GET" "https://<EXTERNAL_ENDPOINT>:8529/_platform/acp/v1/all_project_names/<database_name>" >}}

```bash
curl -X GET https://<EXTERNAL_ENDPOINT>:8529/_platform/acp/v1/all_project_names/<database_name> \
  -H "Authorization: Bearer <your-bearer-token>"
```

This returns only the project names for quick reference.

**List all projects with full metadata in a database:**

{{< endpoint "GET" "https://<EXTERNAL_ENDPOINT>:8529/_platform/acp/v1/all_projects/<database_name>" >}}

```bash
curl -X GET https://<EXTERNAL_ENDPOINT>:8529/_platform/acp/v1/all_projects/<database_name> \
  -H "Authorization: Bearer <your-bearer-token>"
```

This returns complete project objects including metadata, associated services,
and knowledge graph information.

### Getting project details

Retrieve comprehensive metadata for a specific project:

{{< endpoint "GET" "https://<EXTERNAL_ENDPOINT>:8529/_platform/acp/v1/project_by_name/<database_name>/<project_name>" >}}

```bash
curl -X GET https://<EXTERNAL_ENDPOINT>:8529/_platform/acp/v1/project_by_name/<database_name>/<project_name> \
  -H "Authorization: Bearer <your-bearer-token>"
```

The response includes:
- Project configuration
- Associated Importer and Retriever services
- Knowledge graph metadata
- Service status information
- Last modification timestamp

### Deleting a project

Remove a project's metadata from the AI service:

{{< endpoint "DELETE" "https://<EXTERNAL_ENDPOINT>:8529/_platform/acp/v1/project/<database_name>/<project_name>" >}}

```bash
curl -X DELETE https://<EXTERNAL_ENDPOINT>:8529/_platform/acp/v1/project/<database_name>/<project_name> \
  -H "Authorization: Bearer <your-bearer-token>"
```

{{< warning >}}
Deleting a project only removes the project metadata from the AI service.
It does **not** delete:
- Services associated with the project (must be deleted separately)
- ArangoDB collections and data
- Knowledge graphs

You must manually delete services and collections if needed.
{{< /warning >}}

## Secrets

For managing secret profiles via ACP, see the
[Secrets Manager](secrets-manager.md) documentation.

## Files

For managing files via ACP, see the
[File Manager](file-manager/_index.md) documentation.

## API reference

For detailed API documentation, see the
[Arango Control Plane service API Reference](https://apiref.arango.ai/#genai-service).
