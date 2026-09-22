---
title: Arango AI SDK
menuTitle: Arango AI SDK
weight: 5
description: >-
  The Arango AI SDK is the Python library for the Agentic AI Suite, letting you
  drive the AutoGraph workflow from code instead of assembling HTTP requests
---
{{< tag "Experimental" >}}

`arango-ai-sdk` is the official Python SDK for the
[Agentic AI Suite](../../agentic-ai-suite/_index.md). It is the code-first way to
drive an [AutoGraph](../../agentic-ai-suite/autograph/_index.md) workflow: sign
in, create a project, store the API keys the models need, upload your documents,
and deploy the AutoGraph service that turns them into a Context Graph.

The SDK wraps the suite's wire contracts, so you never assemble a URL, set an
authentication header, or interpret an HTTP status code.
Everything that can go wrong arrives as a named Python exception instead.

```python
from arango_ai_sdk import ArangoAIClient

client = ArangoAIClient(
    base_url="https://<your-deployment>:8529",
    username="<username>",
    password="<password>",
)

project = client.project.create(project_name="sales", project_type="autograph")
```

The SDK is developed continuously and grows one area at a time. It does not
cover the entire AutoGraph flow yet, so anything it does not offer today is done
through the
[web interface](../../agentic-ai-suite/autograph/web-interface.md) or the
[HTTP API](../../agentic-ai-suite/autograph/reference/_index.md).

## What maps to what

The SDK is a third way to drive AutoGraph, alongside the web interface and the
HTTP API. The following table shows the operations it covers next to the action
and the endpoint that do the same thing, so you can move between the three
interfaces:

| Operation | Web interface | HTTP API | Arango AI SDK |
|-----------|---------------|---------------|---------------|
| Authenticate | Signed in to the platform | [Obtain a Bearer token](../../platform-suite/control-plane-acp/_index.md#obtaining-a-bearer-token) | `ArangoAIClient(...)` |
| Create a project | AutoGraph Studio, **+ New Project** | [Create a Project](../../platform-suite/control-plane-acp/api.md#create-a-project) | `client.project.create()` |
| Open an existing project | Pick it from the project list | [Get Project Details](../../platform-suite/control-plane-acp/api.md#get-project-details) | `client.project.get()` |
| Store a model provider key | Control Panel, **Secrets** | [Secrets Manager API](../../platform-suite/secrets-manager.md#api) | `client.secret_profile.create()` |
| Upload documents | AutoGraph Studio, upload into a category | [Upload a RAG Input File](../../platform-suite/file-manager/api.md#upload-a-rag-input-file) | `client.files.upload_file()` and friends |
| Deploy the service | **Start the build** deploys it for you | [Deploy a Service](../../platform-suite/control-plane-acp/api.md#deploy-a-service) | `project.autograph.deploy()` |
| Remove the service | — | [Uninstall a Service](../../platform-suite/control-plane-acp/api.md#uninstall-a-service) | `project.autograph.undeploy()` |

The mapping is not one to one. The web interface folds several API calls into a
single button, and the SDK groups the platform's endpoints into namespaces on a
client rather than following the URL structure.

## How it relates to the rest of the platform

The SDK is a client for services that are documented in their own right:

- [AutoGraph](../../agentic-ai-suite/autograph/_index.md) builds the context
  graph from your documents. The SDK deploys it and feeds it files.
- [Projects](../../platform-suite/control-plane-acp/_index.md#projects) in the
  Arango Control Plane group related services and keep your data separate.
  `client.project` creates and fetches them.
- The [Secrets Manager](../../platform-suite/secrets-manager.md) stores the
  provider API keys as secret profiles. `client.secret_profile` writes them, and
  the key never leaves the platform again.
- The [File Manager](../../platform-suite/file-manager/_index.md) holds the
  uploaded documents. `client.files` puts them there, under the scope the
  ingestion later reads from.

## Get started

- [Installation](installation.md): requirements and how to install the package.
- [Getting started](getting-started.md): a short tutorial that takes you from an
  empty database to a deployed AutoGraph service.

<!-- TODO: link to the SDK's own reference documentation once it is published -->
