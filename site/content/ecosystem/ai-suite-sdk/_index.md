---
title: Arango AI Suite Python SDK
menuTitle: AI Suite SDK
weight: 5
description: >-
  The Python SDK for the Agentic AI Suite lets you drive the AutoGraph workflow
  from code, without assembling HTTP requests, handling tokens, or interpreting
  status codes yourself
---
{{< tag "Experimental" >}}

`arango-ai-sdk` is the official Python SDK for the
[Agentic AI Suite](../../agentic-ai-suite/_index.md). It is the code-first way to
drive an [AutoGraph](../../agentic-ai-suite/autograph/_index.md) workflow: sign
in, create a project, store the API keys the models need, upload your documents,
and deploy the AutoGraph service that turns them into a context graph.

The SDK wraps the suite's wire contracts, so you never assemble a URL, set an
authentication header, poll a job by hand, or interpret an HTTP status code.
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

## Scope

The SDK covers a subset of the AutoGraph API: the happy path from signing in to
a deployed AutoGraph service. It grows one area at a time, so anything not
listed below is done through the
[web interface](../../agentic-ai-suite/autograph/web-interface.md) or the
[HTTP REST API](../../agentic-ai-suite/autograph/reference/_index.md) for now.

| Area | What it covers | Available |
|------|----------------|-----------|
| Authentication | Sign in once with a username and password. Every later call is authenticated, and expired tokens are renewed for you. | Yes |
| Projects (`client.project`) | The project everything else happens in. | Create and get |
| Secret profiles (`client.secret_profile`) | Store a model provider API key once, then refer to it by ID. | Create and get |
| Files (`client.files`) | Upload the documents to ingest. | One file, several files, or a folder |
| AutoGraph (`project.autograph`) | The project's AutoGraph service. | Deploy and undeploy |
| Retrieval | Ask questions against the built context graph. | Not yet |

Not available through the SDK yet:

- **Building the graph.** The corpus build and the strategizer that follow the
  deploy are driven from the web interface or the REST API. They arrive as
  further methods on `project.autograph` in a later release.
- **Querying.** [AutoRAG](../../agentic-ai-suite/autorag/_index.md) retrieval has
  no SDK surface yet.
- **Listing, updating, and deleting** projects, secret profiles, and files.

{{< info >}}
`arango-ai-sdk` is an early release published to ArangoDB's private package
index. Its surface may still change between versions, and availability on the
public PyPI is a later step. See [Installation](installation.md).
{{< /info >}}

## How it relates to the rest of the platform

The SDK is a client for services that are documented in their own right:

- [AutoGraph](../../agentic-ai-suite/autograph/_index.md) builds the context
  graph from your documents. The SDK deploys it and feeds it files. See
  [Drive AutoGraph with the Python SDK](../../agentic-ai-suite/autograph/python-sdk.md)
  for each operation next to its web interface action and HTTP endpoint.
- [Projects](../../platform-suite/control-plane-acp/_index.md#projects) in the
  Arango Control Plane keep datasets isolated. `client.project` creates and
  fetches them.
- The [Secrets Manager](../../platform-suite/secrets-manager.md) stores the
  provider API keys as secret profiles. `client.secret_profile` writes them, and
  the key never leaves the platform again.
- The [File Manager](../../platform-suite/file-manager/_index.md) holds the
  uploaded documents. `client.files` puts them there, under the scope the
  ingestion later reads from.

## Get started

- [Installation](installation.md): requirements and how to install from the
  private package index.
- [Getting started](getting-started.md): a tutorial that takes you from an empty
  database to a deployed AutoGraph service.
