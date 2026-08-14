---
title: Arango Control Plane HTTP API
menuTitle: API Reference
weight: 10
description: >-
  HTTP API reference for the Arango Control Plane (ACP) service, covering the
  service lifecycle and AI projects
---
The Arango Control Plane (ACP) service provides an HTTP API for installing,
inspecting, upgrading, and removing platform services, as well as for managing
the projects that group AutoGraph and GraphRAG work.

**Base URL:** `https://<EXTERNAL_ENDPOINT>:8529/_platform/acp`

Authentication uses a Bearer token in the `Authorization` header. See
[Obtaining a Bearer token](_index.md#obtaining-a-bearer-token) for how to
generate one.

## Health Check

{{< endpoint "GET" "https://<EXTERNAL_ENDPOINT>:8529/_platform/acp/v1/health" >}}

Returns the current health status of the service.

```bash
curl -X GET https://<EXTERNAL_ENDPOINT>:8529/_platform/acp/v1/health \
  -H "Authorization: Bearer <your-bearer-token>"
```

**Response (200):**

```json
{
  "status": "OK"
}
```

{{< info >}}
This request requires a valid Bearer token. Without a valid Bearer token, the
request fails.
{{< /info >}}

---

## Services

Every service type has its own URL path for the deployment, but all of them use
the same request and response structure. Once a service is installed, it is
identified by the `serviceId` that the response returns. You need this ID to
check the status of the service, to upgrade it, and to uninstall it.

| Method | Path | Description |
| ------ | ---- | ----------- |
| POST | `/v1/graphanalytics` | Deploy a Graph Analytics service |
| POST | `/v1/graphrag` | Deploy a GraphRAG service |
| POST | `/v1/graphragimporter` | Deploy a GraphRAG Importer service |
| POST | `/v1/graphragretriever` | Deploy a GraphRAG Retriever service |
| POST | `/v1/autograph` | Deploy an AutoGraph service |
| POST | `/v1/llmhost` | Deploy an LLM Host service |
| POST | `/v1/notebook` | Deploy a Notebook service |
| POST | `/v1/uds` | Deploy a User-Defined Service (UDS). See [Deploy a new service via API](../container-manager/deploy-api.md) |
| POST | `/v1/service` | Deploy a generic service (any Helm chart) |
| GET | `/v1/service/{service_id}` | Check the status of a service |
| PUT | `/v1/service/{service_id}` | Update a service's configuration (env vars and labels) and upgrade it to the latest available chart version |
| DELETE | `/v1/service/{service_id}` | Uninstall a service |
| POST | `/v1/list_services` | List all installed services (supports label filtering) |
| GET | `/v1/health` | Health check |

### Service Creation Request Body

All service creation endpoints share the same `env` and `labels` fields:

```json
{
    "env": {
        "profiles": "gpu,internal",
        "<service-specific-key>": "<value>"
    },
    "labels": {
        "key1": "value1",
        "key2": "value2"
    }
}
```

- **env**: Service-specific parameters as key-value pairs. The required keys
  depend on the service type; see the corresponding service documentation, such
  as [Importer](../../agentic-ai-suite/importer/_index.md) and
  [Retriever](../../agentic-ai-suite/retriever/_index.md).
- **labels** (optional): Key-value pairs used to filter and identify services
  in the platform.
- **profiles** (optional): A comma-separated string inside `env` defining
  which resource profiles to apply (for example, `"gpu,internal"`). If not
  set, the service uses the default profile. Profiles must already exist in
  the platform.

The `/v1/service` endpoint additionally takes a `service_name` field, which lets
you deploy any Helm chart:

```json
{
    "service_name": "<helm-chart-service-name>",
    "env": { "<key>": "<value>" },
    "labels": { "<key>": "<value>" }
}
```

---

### Deploy a Service

{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/_platform/acp/v1/graphragimporter" >}}

Installs a service of the given type. The example below deploys the
[Importer](../../agentic-ai-suite/importer/_index.md) service.

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
      "chat_model": "gpt-5.4-nano",
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
- `chat_api_provider`: Set to `"openai"` for the OpenAI API, or `"custom"` for
  any other OpenAI-compatible API
- `chat_api_url`: API endpoint URL for the chat/language model service. Required
  for `"custom"`; defaults to the OpenAI URL for `"openai"`
- `embedding_api_provider`: Set to `"openai"` for the OpenAI API, or `"custom"`
  for any other OpenAI-compatible API
- `embedding_api_url`: API endpoint URL for the embedding model service.
  Required for `"custom"`; defaults to the OpenAI URL for `"openai"`
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
options, see the [LLM Configuration](../../agentic-ai-suite/importer/llm-configuration.md)
documentation.
{{< /tip >}}

**Response (200):**

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

---

### Check the Status of a Service

{{< endpoint "GET" "https://<EXTERNAL_ENDPOINT>:8529/_platform/acp/v1/service/{serviceId}" >}}

Returns the current state of an installed service.

**Path parameters:**

| Parameter | Description |
|-----------|-------------|
| `serviceId` | The service identifier returned when the service was installed. |

```bash
curl -X GET https://<EXTERNAL_ENDPOINT>:8529/_platform/acp/v1/service/arangodb-graphrag-importer-of1ml \
  -H "Authorization: Bearer <your-bearer-token>"
```

**Response (200):**

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

{{< info >}}
`DEPLOYED` means the service was successfully installed. It may still take a
moment to start up and become ready to accept requests. Refer to each service's
documentation for its specific readiness or health check endpoint.
{{< /info >}}

---

### Upgrade a Service

{{< endpoint "PUT" "https://<EXTERNAL_ENDPOINT>:8529/_platform/acp/v1/service/{serviceId}" >}}

Use this endpoint to change the environment variables or labels of a running
service, or to upgrade it to the latest chart version. Every call upgrades the
Helm chart to the latest version. You cannot select a specific version.

{{< info >}}
This endpoint only changes the configuration and the chart version of a single
running service. It does not change the configuration of the platform, such as
Helm values files and operator settings, nor the version of the ArangoDB
cluster. You manage these separately with your deployment YAML file and the
Helm operator.
{{< /info >}}

**Path parameters:**

| Parameter | Description |
|-----------|-------------|
| `serviceId` | The service identifier returned when the service was installed. |

```bash
curl -X PUT https://<EXTERNAL_ENDPOINT>:8529/_platform/acp/v1/service/arangodb-graphrag-importer-of1ml \
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
      "chat_model": "<new-chat-model>",
      "embedding_model": "text-embedding-3-small",
      "chat_api_key": "your_openai_api_key",
      "embedding_api_key": "your_openai_api_key",
      "embedding_dim": "512"
    },
    "labels": { "key1": "value1" }
  }'
```

The request body is optional. Omitting it (or sending `{}`) triggers an upgrade
to the latest chart version with no configuration changes.

- **env** (optional): Updated service-specific environment variables. The object
  **replaces** the current `env` rather than merging into it, so send every
  value the service needs, not only the ones you are changing. The example above
  resends the full `env` the service was installed with for that reason,
  changing only `chat_model`.
- **labels** (optional): Updated key-value pairs used to filter and identify
  the service in the platform.

{{< warning >}}
Because `env` is replaced wholesale, any installation value you leave out of the
request is dropped. Retrieve the service's current configuration before you
upgrade it, and send the full set of values it was installed with.
{{< /warning >}}

---

### Uninstall a Service

{{< endpoint "DELETE" "https://<EXTERNAL_ENDPOINT>:8529/_platform/acp/v1/service/{serviceId}" >}}

Removes an installed service from the platform.

**Path parameters:**

| Parameter | Description |
|-----------|-------------|
| `serviceId` | The service identifier returned when the service was installed. |

```bash
curl -X DELETE https://<EXTERNAL_ENDPOINT>:8529/_platform/acp/v1/service/arangodb-graphrag-importer-of1ml \
  -H "Authorization: Bearer <your-bearer-token>"
```

**Response (200):**

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

---

### List Services

{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/_platform/acp/v1/list_services" >}}

Lists all installed services, optionally filtered by labels.

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

---

## Projects

Projects group related AutoGraph and GraphRAG services and keep their data
separate. They are required for the Importer, Retriever, and AutoGraph
services. For a conceptual overview, see
[Projects](_index.md#projects).

| Method | Path | Description |
| ------ | ---- | ----------- |
| POST | `/v1/project` | Create a new AI project |
| DELETE | `/v1/project/{project_db_name}/{project_name}` | Delete a project |
| GET | `/v1/project_by_name/{project_db_name}/{project_name}` | Get a project by name |
| GET | `/v1/all_project_names/{project_db_name}` | Get all project names in a database |
| GET | `/v1/all_projects/{project_db_name}` | Get all projects in a database |

### Create a Project

{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/_platform/acp/v1/project" >}}

Creates a project in the specified database. The example below creates a
GraphRAG project:

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

---

### List Project Names

{{< endpoint "GET" "https://<EXTERNAL_ENDPOINT>:8529/_platform/acp/v1/all_project_names/{project_db_name}" >}}

Lists all project names in a database. This returns only the project names for
quick reference.

**Path parameters:**

| Parameter | Description |
|-----------|-------------|
| `project_db_name` | The ArangoDB database name that holds the projects. |

```bash
curl -X GET https://<EXTERNAL_ENDPOINT>:8529/_platform/acp/v1/all_project_names/<project_db_name> \
  -H "Authorization: Bearer <your-bearer-token>"
```

---

### List Projects

{{< endpoint "GET" "https://<EXTERNAL_ENDPOINT>:8529/_platform/acp/v1/all_projects/{project_db_name}" >}}

Lists all projects with full metadata in a database. This returns complete
project objects including metadata, associated services, and knowledge graph
information.

**Path parameters:**

| Parameter | Description |
|-----------|-------------|
| `project_db_name` | The ArangoDB database name that holds the projects. |

```bash
curl -X GET https://<EXTERNAL_ENDPOINT>:8529/_platform/acp/v1/all_projects/<project_db_name> \
  -H "Authorization: Bearer <your-bearer-token>"
```

---

### Get Project Details

{{< endpoint "GET" "https://<EXTERNAL_ENDPOINT>:8529/_platform/acp/v1/project_by_name/{project_db_name}/{project_name}" >}}

Retrieves comprehensive metadata for a specific project.

**Path parameters:**

| Parameter | Description |
|-----------|-------------|
| `project_db_name` | The ArangoDB database name that holds the project. |
| `project_name` | The project name. |

```bash
curl -X GET https://<EXTERNAL_ENDPOINT>:8529/_platform/acp/v1/project_by_name/<project_db_name>/<project_name> \
  -H "Authorization: Bearer <your-bearer-token>"
```

The response includes:
- Project configuration
- Associated Importer and Retriever services
- Knowledge graph metadata
- Service status information
- Last modification timestamp

---

### Delete a Project

{{< endpoint "DELETE" "https://<EXTERNAL_ENDPOINT>:8529/_platform/acp/v1/project/{project_db_name}/{project_name}" >}}

Deletes a project. The project record is removed entirely; only the external
resources it referenced (services, collections, graphs) remain.

**Path parameters:**

| Parameter | Description |
|-----------|-------------|
| `project_db_name` | The ArangoDB database name that holds the project. |
| `project_name` | The project name. |

```bash
curl -X DELETE https://<EXTERNAL_ENDPOINT>:8529/_platform/acp/v1/project/<project_db_name>/<project_name> \
  -H "Authorization: Bearer <your-bearer-token>"
```

{{< warning >}}
Deleting a project removes the project record itself, but it does **not**
delete the resources the project referenced:
- Importer, Retriever, and AutoGraph services
- ArangoDB collections created with the project name as prefix
  (for example, `docs_Documents`, `docs_Chunks`)
- Knowledge graphs stored in ArangoDB

Delete those separately if you no longer need them.
{{< /warning >}}
