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
deploy the AutoGraph service, and ingest the documents into a Context Graph.

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
cover the entire AutoGraph flow yet. Editing strategies, deleting categories or
files from the graph, and deploying AutoRAG retrievers are done through the
[web interface](../../agentic-ai-suite/autograph/web-interface.md) or the
[HTTP API](../../agentic-ai-suite/autograph/reference/_index.md).

## What maps to what

The SDK is an alternative to the web interface. The following table shows the
operations it covers next to the action in the web interface that does the same
thing:

| Operation | Web interface | Arango AI SDK |
|-----------|---------------|---------------|
| Authenticate | Signed in to the platform | `ArangoAIClient(...)` |
| Create a project | AutoGraph Studio, **+ New Project** | `client.project.create()` |
| Open an existing project | Pick it from the project list | `client.project.get()` |
| Store a model provider key | Control Panel, **Secrets** | `client.secret_profile.create()` |
| Upload documents | AutoGraph Studio, upload into a category | `client.files.upload_file()` and friends |
| Deploy the service | **Start build** deploys it for you | `project.autograph.deploy()` |
| Build the Corpus Graph | **Build Corpus Graph** | `project.autograph.corpus_build()` |
| Add documents to a built graph | **Update Corpus Graph** | `project.autograph.corpus_build(incremental=True)` |
| Generate strategies | **Generate strategies** | `project.autograph.strategize()` |
| Set the GraphRAG ↔ VectorRAG mix | **Complexity** slider | `strategize(complexity=...)` |
| Extract entities from images | **Extract images from documents** | `strategize(extract_images_default=True)` |
| Review strategies | **Review strategies** step | `project.autograph.strategies()` (read-only) |
| Build the Knowledge Graph | **Build Knowledge Graph** | `project.autograph.orchestrate()` |
| Run the whole ingestion | — | `project.autograph.ingest()` |
| Remove the service | — | `project.autograph.undeploy()` |

The mapping is not one to one. The web interface folds several steps into a
single button, and the SDK groups operations into namespaces on a client. In the
other direction, `ingest()` runs the corpus build, the strategizer, and the
Knowledge Graph import in one call, which the web interface spreads over two
wizards. The SDK reads the stored strategies but cannot edit them. Image
extraction and `max_parallel_clusters`, which sets how many clusters the
strategizer analyzes at once, are only on `strategize()`, not on `ingest()`. The
web interface's **Parallel builds** setting for the import has no SDK
equivalent yet.

## How it relates to the rest of the platform

The SDK is a client for services that are documented in their own right:

- [AutoGraph](../../agentic-ai-suite/autograph/_index.md) builds the context
  graph from your documents. The SDK deploys it and runs the ingestion.
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
  empty database to a Context Graph built from your documents.

<!-- TODO: link to the SDK's own reference documentation once it is published -->
