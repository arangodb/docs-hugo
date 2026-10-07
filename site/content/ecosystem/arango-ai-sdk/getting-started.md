---
title: Get started with the Arango AI SDK
menuTitle: Getting started
weight: 10
description: >-
  A short tutorial that takes you from an empty database to a Context Graph
  built from your documents, using only Python
---
{{< tag "Experimental" >}}

This tutorial walks the happy path: connect to your deployment, create a
project, store the API keys your models need, upload the documents you want
answers from, deploy AutoGraph, and ingest the documents into a Context Graph.

## Before you start

[Install the SDK](installation.md), then collect:

- **The endpoint of your deployment**, port included, for example
  `https://<your-deployment>:8529`.
- **A username and password** that can access the database you want to work in.
- **An API key for a model provider**, for example an OpenAI key. The same key
  can cover both the chat and the embedding model.
- **The name of an existing ArangoDB user** with read and write access to the
  project's database. AutoGraph uses it to resume file parsing after a pod
  restart, and the SDK does not create it for you.
- **The documents to ingest**, in a folder on the machine that runs the script.

## 1. Create a client

The client is your connection: one endpoint, one account, one database. It is
not tied to a project, so a single client serves any number of them.

```python
from arango_ai_sdk import ArangoAIClient

client = ArangoAIClient(
    base_url="https://<your-deployment>:8529",
    username="<username>",
    password="<password>",
    db_name="_system",   # optional, this is the default
)
```

Constructing the client signs you in, so a wrong password or a misspelt database
fails here rather than on your first real call. Every later call carries a valid
token, which the SDK renews silently when it expires.

## 2. Create a project

A project is the workspace everything else belongs to: the documents you upload,
the Context Graph built from them, and the questions you later ask against it.

```python
project = client.project.create(
    project_name="my_first_project",
    project_type="autograph",
)
```

The project is created in the database the client was constructed with, and
`create` returns a *project handle*, which is where everything project-scoped
happens from here on. The name must start with a letter, hold only letters,
numbers, underscores, and hyphens, and be 1 to 63 characters long; the platform
rejects anything else with `InvalidProjectNameError`. To pick up a project you created earlier, use
`client.project.get(project_name=...)` instead.

## 3. Store the model provider API keys

AutoGraph needs a chat model to read your documents and an embedding model to
index them. Rather than passing keys around, you store each one once as a
*secret profile* and refer to it by ID afterwards.

```python
chat = client.secret_profile.create(
    name="openai-chat", secret="<your-api-key>", provider="openai"
)

embed = client.secret_profile.create(
    name="openai-embedding", secret="<your-api-key>", provider="openai"
)
```

Keep the `profile_id` values, because that is what the deploy step asks for. The
key itself is encrypted on the platform and never leaves it again. If one key
covers both models, create a single profile and pass its ID twice.

## 4. Upload your documents

Files are uploaded under a *scope*: an ordered list of up to five labels that
works like a storage path, so `["acme", "legal"]` places a file in the `legal`
part of `acme`. A label may hold letters, digits, underscores, and hyphens.
For ingestion, the first label is the project name and the second the
*category*, so the files below belong to category `legal` of project
`my_first_project`.

```python
# Takes the files directly inside the folder and ignores subfolders
results = client.files.upload_folder("./documents", scope=["my_first_project", "legal"])

# One rejected file does not stop the others, so check every result
for result in results:
    print(result.name, result.status)

# For a single file
client.files.upload_file("./documents/nda.pdf", scope=["my_first_project", "legal"])
```

A file is identified by its database, scope, and name together, so uploading the
same name under the same scope stores a new version instead of a duplicate.
Re-running the script is therefore safe.

## 5. Deploy AutoGraph

A project holds exactly one AutoGraph service, reached as `project.autograph`.
Deploying it is what turns the project into something that can build a context
graph.

```python
info = project.autograph.deploy(
    chat_api_provider="openai",
    embedding_api_provider="openai",
    chat_secret_profile_id=chat.profile_id,
    embedding_secret_profile_id=embed.profile_id,
    fps_recovery_username="<arangodb-username>",
    chat_model="gpt-4o",
    embedding_model="text-embedding-3-small",
)

print(f"Deploying {info.service_id}: {info.status}")
```

You pass Python arguments, not platform install keys; the SDK builds the install
request from them. The project name and database are not parameters, because
they come from the handle. The model names are optional for the install itself,
but a first ingestion needs both, because the platform only stores the model
settings when the install includes both model names and both profile IDs.

{{< info >}}
Acceptance is not readiness. The call returns as soon as the platform accepts
the install request, while the pod may still be starting. Wait for it before
you ingest:
{{< /info >}}

```python
if not project.autograph.wait_until_ready(timeout=600.0):
    raise RuntimeError("AutoGraph did not become ready in time")

# Reading the handle costs nothing: the state comes from the project record it holds
print(project.autograph.is_deployed)   # True
print(project.autograph.service_url)
```

## 6. Ingest your documents

Ingestion turns the uploaded files into the Context Graph. It runs in three
steps on the platform: the corpus build extracts the documents and groups them
into clusters, the strategizer decides per cluster whether it becomes a full
knowledge graph or vectors only, and the import builds the graph accordingly.
`ingest()` runs all of them in order:

```python
def show(progress):
    print(progress.step, progress.status.status)

result = project.autograph.ingest(
    categories=["legal"],
    timeout=3600.0,      # one deadline for all steps; unset waits without bound
    on_progress=show,    # called on every status poll, every 30 seconds by default
)

print(f"{result.build.document_count} documents in {result.build.cluster_count} clusters")
print(dict(result.strategies.strategy_type_counts))
```

The call blocks until the last step has finished. It returns an `IngestResult`
with the final status of each step as `build`, `strategize`, `strategies`, and
`orchestration`. `orchestration` is `None` when every category was already up to
date and there was nothing to import. If the timeout passes, the SDK stops
waiting with `JobTimeoutError`, but the step keeps running on the platform.

`complexity` sets what share of the clusters gets a full knowledge graph rather
than vectors, from `very_low` (none) to `very_high` (all). The default is `high`,
three quarters of the clusters. It is the setting the **Complexity** slider
controls in the web interface. Pass it as
`complexity=RagStrategizerComplexity.very_high`, importing the enum from
`arango_ai_sdk.models`.

To run the steps one at a time, for example to inspect the corpus before
generating strategies or to redo a single step, call them yourself:

```python
build = project.autograph.corpus_build(categories=["legal"])
project.autograph.strategize(categories=["legal"])
stored = project.autograph.strategies()   # read-only: which cluster got which strategy
orchestration = project.autograph.orchestrate(categories=["legal"])
```

A category can only be built once. To add documents you uploaded later, ingest
again with `incremental=True`; otherwise the build raises
`CategoryAlreadyBuiltError`. Only clusters whose data changed are imported again.

```python
project.autograph.ingest(categories=["legal"], incremental=True)
```

To remove the service again, call `project.autograph.undeploy()`. It takes no
arguments, and the model settings survive it, so a later deploy reuses them.

## 7. Close the client

```python
client.close()   # releases the HTTP sessions and sockets; safe to call more than once
```

Call it when you are done, typically in a `finally` block.

## Handle errors

The SDK never hands you an HTTP status code to interpret. Every failure is
translated into a named exception, and all of them descend from `ArangoAIError`,
so you can catch at whichever level fits what you want to handle:

```python
from arango_ai_sdk.exceptions import (
    ArangoAIError,
    IngestionFailedError,
    InvalidCredentialsError,
)

try:
    ...
except InvalidCredentialsError:
    print("Check the username and password.")
except IngestionFailedError as exc:
    print(f"Ingestion failed: {exc}")   # exc.job_status holds the failed step's status
except ArangoAIError as exc:
    print(f"Something went wrong: {exc}")
```

## Next steps

Open the project in [AutoGraph Studio](../../agentic-ai-suite/autograph/web-interface.md)
to explore the Context Graph, and deploy retrievers with
[AutoRAG](../../agentic-ai-suite/autorag/_index.md) to ask questions against it.
Editing strategies and deleting categories or files from the graph are not in
the SDK yet; use the web interface or the
[AutoGraph HTTP API](../../agentic-ai-suite/autograph/reference/_index.md).

<!-- TODO: link to the SDK's own reference documentation once it is published -->
