---
title: Get started with the Arango AI SDK
menuTitle: Getting started
weight: 10
description: >-
  A short tutorial that takes you from an empty database to a Context Graph
  built from your documents and a retriever that answers questions, using only
  Python
---
{{< tag "Experimental" >}}

This tutorial walks the happy path: connect to your deployment, create a
project, store the API keys your models need, upload the documents you want
answers from, deploy AutoGraph, ingest the documents into a Context Graph, and
ask it a question through an AutoRAG retriever.

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
fails here rather than on your first real call. When the platform later rejects
the token, the SDK signs in again and retries the request once, so you never
handle the token yourself.

If your deployment uses a self-signed certificate, pass `verify` as well: the
path to a CA bundle, or `False` to turn off certificate verification.

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
happens from here on. The name may hold only letters, numbers, underscores, and
hyphens; a name with any other character raises `InvalidProjectNameError`. To
pick up a project you created earlier, use `client.project.get(project_name=...)`
instead.

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
    print(result.name, result.status, result.detail)   # detail: why it was rejected

# For a single file
client.files.upload_file("./documents/nda.pdf", scope=["my_first_project", "legal"])
```

`status` is `ok` for a stored file and `error` for a rejected one. One upload
request takes at most 100 files and 2 GiB in total, which also applies to the
files of a folder. Above that, the SDK raises `FileBatchTooLargeError` before
sending anything; split the files over several `upload_files()` calls, which
takes a list of paths.

A file is identified by its database, scope, and name together, so uploading the
same name under the same scope stores a new version instead of a duplicate.
Re-running the script is therefore safe.

## 5. Deploy AutoGraph

A project holds exactly one AutoGraph service, reached as `project.autograph`.
Deploying a second one raises `AutoGraphAlreadyDeployedError`.
Deploying it is what turns the project into something that can build a context
graph.

```python
deployed = project.autograph.deploy(
    chat_api_provider="openai",
    embedding_api_provider="openai",
    chat_secret_profile_id=chat.profile_id,
    embedding_secret_profile_id=embed.profile_id,
    fps_recovery_username="<arangodb-username>",
    chat_model="gpt-4o",
    embedding_model="text-embedding-3-small",
)

print(f"Deploying {deployed.service_info.service_id}: {deployed.service_info.status}")
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

Alternatively, pass `wait=True` to `deploy()`, which then waits for the health
check before it returns and sets `deployed.ready` to `True` or, if the service
was still starting when the wait ended, `False`.

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
three quarters of the clusters. Pass it as
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

## 7. Ask a question

To query the Context Graph, deploy an [AutoRAG](../../agentic-ai-suite/autorag/_index.md)
retriever into the project. Do this only after the ingestion has finished,
because the retriever answers from the graph it finds. It takes the same model
settings and secret profiles as the AutoGraph deploy, except that there is no
`fps_recovery_username`:

```python
deployed = project.autorag.deploy(
    chat_api_provider="openai",
    embedding_api_provider="openai",
    chat_secret_profile_id=chat.profile_id,
    embedding_secret_profile_id=embed.profile_id,
    chat_model="gpt-4o",
    embedding_model="text-embedding-3-small",
)
retriever = deployed.autorag

if not retriever.wait_until_ready(timeout=600.0):   # default 300 seconds
    raise RuntimeError("The retriever did not become ready in time")

answer = retriever.ask("What do the contracts say about termination?")
print(answer.result)
print(answer.run_id)   # the id the platform stored this query under
```

Unlike AutoGraph, a project can run several retrievers, each with its own models
and secret profiles. `project.autorag` is therefore a manager, not a retriever:
every `deploy()` call installs a new one and returns an `AutoRagDeployResult`,
whose `autorag` attribute is the retriever you ask and remove. There is no
`project.autorag.ask()`. To find the retrievers that already exist, for example
in a later script, use `project.autorag.list()` or
`project.autorag.get(service_id)`.

As with AutoGraph, acceptance is not readiness: `deploy()` returns before the
retriever is serving, and `wait_until_ready()` returns `False` if the timeout
passes first. Pass `wait=True` to `deploy()` to have it wait for you, then check
`deployed.ready`.

`ask()` searches with `QueryType.UNIFIED` by default. It combines matching text
passages with the graph and works whether a cluster became a full knowledge
graph or vectors only. Pass `query_type=QueryType.LOCAL` for a specific fact or
`QueryType.GLOBAL` for themes across the whole corpus, importing the enum from
`arango_ai_sdk.models`. A global question needs full-graph clusters: against
vectors only, the retriever answers `No communities found at the specified
level.` instead of raising an error.

`ask()` also takes `response_instructions` for the style of the answer,
`partition_ids` to limit the search to certain partitions, `show_citations`,
`include_metadata`, and `model` to use a different chat model for one question.
Streaming the answer, Deep Search, and the Custom Retriever are not available in
the SDK.

To remove the retriever again, call `retriever.undeploy()`. It takes no
arguments and leaves the Context Graph, the AutoGraph service, and any other
retrievers in place.

## 8. Close the client

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
    AutoRagNotDeployedError,
    IngestionFailedError,
    InvalidCredentialsError,
    QueryFailedError,
)

try:
    ...
except InvalidCredentialsError:
    print("Check the username and password.")
except IngestionFailedError as exc:
    print(f"Ingestion failed: {exc}")   # exc.job_status holds the failed step's status
except AutoRagNotDeployedError:
    print("The retriever is no longer in the project; deploy it again.")
except QueryFailedError as exc:
    print(f"Query failed: {exc.failure_code}")   # for example INVALID_API_KEY
except ArangoAIError as exc:
    print(f"Something went wrong: {exc}")
```

A question can fail even though the retriever answered. When the model provider
rejects the request mid-query, for example because the API key expired or the
quota ran out, the retriever reports it in the response body rather than as an
HTTP error. The SDK raises `QueryFailedError` for it, with the provider's code in
`failure_code`, so a failed question never looks like an empty answer.
`AutoRagNotDeployedError` right after a deploy usually means the route is not
registered yet; call `wait_until_ready()` before the first question.

Other exceptions you are likely to meet:

- `AutoGraphBusyError`: another build, strategizer run, or import is already
  running for the project. Wait for it to finish and try again.
- `JobStatusLostError`: the AutoGraph pod restarted while the SDK was waiting
  for a step, so the platform no longer knows the job. Its `job_id` names the
  job that was lost.
- `DatabaseNotFoundError` and `PlatformUnreachableError`: raised when the client
  is constructed, for a database that does not exist or a deployment that
  cannot be reached.

To catch a whole group, use the base classes between `ArangoAIError` and the
specific exceptions. `AuthenticationError` covers sign-in problems.
`CommunicationError` covers problems reaching the platform or reading its reply,
and its subclass `ServiceError` covers every error a service answered with. A
`ServiceError` carries the platform's `status_code` and `error_code`.

## Next steps

To learn more about the search methods a retriever offers, see
[AutoRAG](../../agentic-ai-suite/autorag/_index.md). Editing strategies and
deleting categories or files from the graph are not in the SDK yet; use the
[AutoGraph HTTP API](../../agentic-ai-suite/autograph/reference/_index.md).

For every parameter, return value, and exception of the calls used here, see the
[SDK reference documentation](https://arango-ai-sdk-reference.arango.ai/).
