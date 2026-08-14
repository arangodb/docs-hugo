---
title: The Arango Control Plane (ACP) service
menuTitle: Control Plane (ACP)
weight: 30
description: >-
  Orchestrate the Contextual Data Platform with the Arango Control Plane to
  install, manage, and run services in your Kubernetes cluster
---
## Overview

The Arango Control Plane (ACP) is the main entry point for installing, running, and
managing services in the Contextual Data Platform. You can deploy services,
group AutoGraph and GraphRAG work into projects, and manage the secrets
profiles used by services:

- **Services**: install, upgrade, uninstall, get status, and list installed
  services. Each service type has its own URL path prefix but shares a
  common request and response structure. See [Services](#services).
- **Projects**: organize AutoGraph and GraphRAG work by grouping related services and
  keeping data separate. See [Projects](#projects).
- **Secrets**: create and manage secret profiles used by services (for
  example, LLM API keys). See [Secrets Manager](../secrets-manager.md).

The ACP service is **started by default** and is available at
`https://<EXTERNAL_ENDPOINT>:8529/_platform/acp`.

All operations are performed over HTTP. For the full endpoint reference, see the
[Arango Control Plane HTTP API](api/).

## Getting started

### Obtaining a Bearer token

Before you can authenticate with the ACP service, you need to obtain a Bearer
token. You can generate this token using the ArangoDB authentication API:

{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/_open/auth" >}}

```bash
curl -X POST https://<EXTERNAL_ENDPOINT>:8529/_open/auth \
  -d '{"username": "your-username", "password": "your-password"}'
```

This returns a user JWT token (not a superuser token) that you can use as
your Bearer token. For more details about ArangoDB authentication and JWT
tokens, see the
[ArangoDB Authentication](../../arangodb/3.12/develop/http-api/authentication.md#jwt-user-tokens)
documentation.

### Health check

To verify the ACP service is running:

{{< endpoint "GET" "https://<EXTERNAL_ENDPOINT>:8529/_platform/acp/v1/health" >}}

```bash
curl -X GET https://<EXTERNAL_ENDPOINT>:8529/_platform/acp/v1/health \
  -H "Authorization: Bearer <your-bearer-token>"
```

Expected output on success: `{"status":"OK"}`

{{< info >}}
This request requires a valid Bearer token. Without a valid Bearer token, the
request fails.
{{< /info >}}

## Services

The ACP installs every service from a Helm chart and gives it a `serviceId`.
You use this ID for all follow-up operations, such as checking the status,
changing the configuration, and uninstalling the service.

The following service types can be deployed through dedicated endpoints:

- Graph Analytics
- GraphRAG, as well as the GraphRAG Importer and Retriever
- AutoGraph
- LLM Host
- Notebook
- User-Defined Services (UDS), see
  [Deploy a new service via API](../container-manager/deploy-api.md)

There is also a generic endpoint that accepts any Helm chart service name, so
you are not limited to the service types listed above.

All requests for creating a service have the same structure. You pass the
parameters of the individual service as key-value pairs in an `env` object. You
can also add `labels` to tag services and filter them later. The `profiles` key
inside `env` selects the resource profiles to apply, for example `gpu`. If you
omit it, the default profile is used.

For the request and response format of each operation, see
[Services](api/#services) in the API reference.

## Projects

Projects help you organize AutoGraph and GraphRAG deployments by grouping related
services and keeping your data separate. When the Importer service creates ArangoDB
collections (such as documents, chunks, entities, relationships, and
communities), it uses your project name as a prefix. For example, a project
named `docs` will have collections like `docs_Documents`, `docs_Chunks`, and
so on.

Projects are required for the following services:
- Importer
- Retriever
- AutoGraph

Once a project exists, you can reference it in service deployments using the
`project_name` field:

```json
{
  "env": {
    "project_name": "docs"
  }
}
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

For the endpoints to create, retrieve, list, and delete projects, see
[Projects](api/#projects) in the API reference.

## Secrets

For managing secret profiles via ACP, see the
[Secrets Manager](../secrets-manager.md) documentation.

## Files

For managing files via ACP, see the
[File Manager](../file-manager/_index.md) documentation.

## API reference

For the endpoints exposed by the ACP service, see the
[Arango Control Plane HTTP API](api/).

For the generated API documentation, see the
[Arango Control Plane service API Reference](https://apiref.arango.ai/#genai-service).
