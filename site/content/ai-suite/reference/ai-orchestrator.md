---
title: AI Orchestration Service
menuTitle: AI Orchestrator
description: >-
  The AI orchestrator service installs, manages, and runs AI-based services
  for GraphRAG in your Kubernetes cluster
weight: 5
---
{{< tip >}}
The Arango AI Data Platform is available as a pre-release. To get
exclusive early access, [get in touch](https://arango.ai/contact-us/) with
the Arango team.
{{< /tip >}}

## Overview

The basic operations that the AI orchestration service carries out are the following:
- Install a service
- Uninstall a service
- Get the status of a service
- List all installed and deployed services

Each unique service has its own API endpoint for the deployment.

**Endpoint LLM Host:**
`https://<ExternalEndpoint>:8529/ai/v1/llmhost`

While services have their own unique endpoint, they share the same creation
request body and the same response body structure. The `env` field is used
to define the service specific parameters, like the model name to use for a
`llmhost` service, and the labels can be used to filter and identify the services
in the platform. All services support the `profiles` field, which you can use
to define the profile to use for the service. For example, you can define a
GPU profile that enables the service to run an LLM on GPU resources.

## Service Creation Request Body

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

**Optional fields:**

- **labels**: Key-value pairs used to filter and identify services in the platform.
- **profiles**: A comma-separated string defining which profiles to use for the 
  service (e.g., `"gpu,internal"`). If not set, the service is created with the 
  default profile. Profiles must be present and created in the platform before 
  they can be used.

The parameters required for the deployment of each service are defined in the
corresponding service documentation. See [Importer](importer.md)
and [Retriever](retriever.md).

## Projects

Projects help you organize your GraphRAG work by grouping related services and 
keeping your data separate. When the Importer service creates ArangoDB collections 
(such as documents, chunks, entities, relationships, and communities), it uses 
your project name as a prefix. For example, a project named `docs` will have 
collections like `docs_Documents`, `docs_Chunks`, and so on.

Projects are required for the following services:
- Importer
- Retriever

### Creating a project

To create a new GraphRAG project, send a POST request to the project endpoint:

```bash
curl -X POST "https://<ExternalEndpoint>:8529/gen-ai/v1/project" \
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
- **project_name** (required): Unique identifier for your project. Must be 1-63 
  characters and contain only letters, numbers, underscores (`_`), and hyphens (`-`).
- **project_type** (required): Type of project (e.g., `"graphrag"`).
- **project_db_name** (required): The ArangoDB database name where the project 
  will be created.
- **project_description** (optional): A description of your project.

Once created, you can reference your project in service deployments using the 
`genai_project_name` field:

```json
{
  "env": {
    "genai_project_name": "docs"
  }
}
```

### Listing projects

**List all project names in a database:**

```bash
curl -X GET "https://<ExternalEndpoint>:8529/gen-ai/v1/all_project_names/<database_name>" \
  -H "Authorization: Bearer <your-bearer-token>"
```

This returns only the project names for quick reference.

**List all projects with full metadata in a database:**

```bash
curl -X GET "https://<ExternalEndpoint>:8529/gen-ai/v1/all_projects/<database_name>" \
  -H "Authorization: Bearer <your-bearer-token>"
```

This returns complete project objects including metadata, associated services, 
and knowledge graph information.

### Getting project details

Retrieve comprehensive metadata for a specific project:

```bash
curl -X GET "https://<ExternalEndpoint>:8529/gen-ai/v1/project_by_name/<database_name>/<project_name>" \
  -H "Authorization: Bearer <your-bearer-token>"
```

The response includes:
- Project configuration
- Associated Importer and Retriever services
- Knowledge graph metadata
- Service status information
- Last modification timestamp

### Deleting a project

Remove a project's metadata from the GenAI service:

```bash
curl -X DELETE "https://<ExternalEndpoint>:8529/gen-ai/v1/project/<database_name>/<project_name>" \
  -H "Authorization: Bearer <your-bearer-token>"
```

{{< warning >}}
Deleting a project only removes the project metadata from the GenAI service. 
It does **not** delete:
- Services associated with the project (must be deleted separately)
- ArangoDB collections and data
- Knowledge graphs

You must manually delete services and collections if needed.
{{< /warning >}}

## Obtaining a Bearer Token

Before you can authenticate with the AI service, you need to obtain a
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

The example below shows how to install, monitor, and uninstall the [Importer](importer.md) service.

### Step 1: Installing the service

```bash
curl -X POST https://<ExternalEndpoint>:8529/ai/v1/graphragimporter \
  -H "Authorization: Bearer <your-bearer-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "env": {
      "db_name": "<your-database-name>",
      "chat_api_provider": "<your-api-provider>",
      "chat_api_url": "https://api.openai.com/v1",
      "embedding_api_provider": "openai",
      "embedding_api_url": "https://api.openai.com/v1",
      "chat_model": "gpt-4o",
      "embedding_model": "text-embedding-3-small",
      "chat_api_key": "your_openai_api_key",
      "embedding_api_key": "your_openai_api_key"
    }
  }'
```

Where:
- `db_name`: Name of the ArangoDB database where the knowledge graph will be stored
- `chat_api_provider`: Set to `"openai"` for any OpenAI-compatible API
- `chat_api_url`: API endpoint URL for the chat/language model service
- `embedding_api_provider`: Set to `"openai"` for any OpenAI-compatible API
- `embedding_api_url`: API endpoint URL for the embedding model service
- `chat_model`: Specific language model to use for text generation and analysis
- `embedding_model`: Specific model to use for generating text embeddings
- `chat_api_key`: API key for authenticating with the chat/language model service
- `embedding_api_key`: API key for authenticating with the embedding model service

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
curl -X GET https://<ExternalEndpoint>:8529/ai/v1/service/arangodb-graphrag-importer-of1ml \
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
curl -X DELETE https://<ExternalEndpoint>:8529/ai/v1/service/arangodb-graphrag-importer-of1ml \
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

## Service configuration

The AI orchestrator service is **started by default**. 

It will be available at the following URL:
`https://<ExternalEndpoint>:8529/ai/v1/service`

## Health check

To test whether the service is running, you can use the following snippet:

```bash
curl -X GET https://<ExternalEndpoint>:8529/ai/v1/health
```

Expected output on success: `{"status":"OK"}`

{{< info >}}
Keep in mind that this request requires a valid Bearer token. Without a valid
Bearer token, the request fails.
{{< /info >}}

## API Reference

For detailed API documentation, see the
[AI service Protocol Documentation](https://arangoml.github.io/platform-dss-api/GenAI-Service/proto/index.html).
