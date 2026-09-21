---
title: Drive AutoGraph with the Python SDK
menuTitle: Python SDK
weight: 16
description: >-
  Examples of the AutoGraph setup workflow driven from Python, with each
  operation mapped to its web interface action and HTTP REST endpoint
---
{{< tag "Experimental" >}}

The [Arango AI Suite Python SDK](../../ecosystem/ai-suite-sdk/_index.md) is a
third way to drive AutoGraph, alongside the
[web interface](web-interface.md) and the
[HTTP REST API](reference/_index.md). It covers the **setup half** of the
workflow: connect, create a project, store the model provider keys, upload the
documents, and deploy the AutoGraph service.

This page shows each of those operations as the SDK expresses it, next to the
web interface action and the HTTP endpoint that do the same thing, so you can
move between the three interfaces. For installing the package, see
[Installation](../../ecosystem/ai-suite-sdk/installation.md); for a linear
walkthrough, see
[Getting started](../../ecosystem/ai-suite-sdk/getting-started.md).

{{< info >}}
The SDK does not cover the build stages yet. The corpus build, the RAG
strategizer, orchestration, and retrieval have no SDK equivalent today, so a
complete run switches to the web interface or the REST API partway through. See
[Where the SDK stops](#where-the-sdk-stops).
{{< /info >}}

## What maps to what

| Operation | Web interface | HTTP REST API | Python SDK |
|-----------|---------------|---------------|------------|
| Authenticate | Signed in to the platform | [Obtain a Bearer token](../../platform-suite/control-plane-acp/_index.md#obtaining-a-bearer-token) | `ArangoAIClient(...)` |
| Create a project | AutoGraph Studio, **Create project** | [Create a Project](../../platform-suite/control-plane-acp/api.md#create-a-project) | `client.project.create()` |
| Open an existing project | Pick it from the project list | [Get Project Details](../../platform-suite/control-plane-acp/api.md#get-project-details) | `client.project.get()` |
| Store a model provider key | Control Panel, **Secrets** | [Secrets Manager API](../../platform-suite/secrets-manager.md#api) | `client.secret_profile.create()` |
| Upload documents | AutoGraph Studio, upload into a category | [Upload a RAG Input File](../../platform-suite/file-manager/api.md#upload-a-rag-input-file) | `client.files.upload_file()` and friends |
| Deploy the service | **Start the build** deploys it for you | [Deploy a Service](../../platform-suite/control-plane-acp/api.md#deploy-a-service) | `project.autograph.deploy()` |
| Remove the service | — | [Uninstall a Service](../../platform-suite/control-plane-acp/api.md#uninstall-a-service) | `project.autograph.undeploy()` |
| Build the corpus | **Start the build** | [Corpus build](reference/corpus-build.md) | Not available |
| Generate strategies | **Generate strategies** | [RAG Strategizer](reference/rag-strategizer.md) | Not available |
| Import the graph | **Build Knowledge Graph** | [Orchestration](reference/orchestration.md) | Not available |
| Query the graph | Ask questions in the UI | [AutoRAG](../autorag/_index.md) | Not available |

The mapping is not one to one. The web interface folds several API calls into a
single button, and the SDK groups the platform's endpoints into namespaces on a
client rather than following the URL structure.

## Connect

The client is the connection: one endpoint, one account, one database. Where the
REST API has you obtain a JWT and attach it to every request, the SDK signs in
when you construct the client and keeps the token current from then on, renewing
it silently when the deployment rejects it.

```python
from arango_ai_sdk import ArangoAIClient

client = ArangoAIClient(
    base_url="https://<your-deployment>:8529",
    username="<username>",
    password="<password>",
    db_name="_system",   # optional, this is the default
)
```

Signing in happens in the constructor, so wrong credentials or a misspelt
database fail here rather than on the first real call.

## Create a project

A project groups the documents, the graph built from them, and the services that
do the work. In the web interface this is the **Create project** action in
AutoGraph Studio; over HTTP it is
[Create a Project](../../platform-suite/control-plane-acp/api.md#create-a-project).

```python
project = client.project.create(
    project_name="my_project",
    project_type="autograph",
    description="Optional free text.",
)
```

The database is not a parameter: the project is created in the `db_name` the
client was constructed with. Names may contain letters, digits, underscores, and
hyphens only.

To pick up a project that already exists, use `get` instead. Unlike `create`, it
returns the project's full current state, so the service and file records are
filled in where the platform has them:

```python
project = client.project.get(project_name="my_project")
```

Both return a project handle, which is where everything project-scoped happens.
One client can hold any number of handles without signing in again.

## Store the model provider keys

AutoGraph needs a chat model and an embedding model. Rather than passing keys
into the deploy call, you store each key once as a *secret profile* and refer to
it by ID afterwards. This is the same store the
[Secrets Manager](../../platform-suite/secrets-manager.md) writes to from the
Control Panel.

```python
chat = client.secret_profile.create(
    name="openai-chat",
    secret="<your-api-key>",
    provider="openai",
)

embed = client.secret_profile.create(
    name="openai-embedding",
    secret="<your-api-key>",
    provider="openai",
)
```

Keep the `profile_id` of each: that is what the deploy step asks for. The key is
encrypted on the platform and cannot be read back — `secret_data` on the returned
profile is an obfuscated copy that keeps only the first two and last two
characters. If one key covers both models, create a single profile and pass its
ID twice.

## Upload documents

Uploads go to the File Manager under a *scope*, an ordered list of up to five
labels that works like a storage path. The AutoGraph workflow uses
`[project, category]`, matching what
[Upload through the File Manager](reference/importing-files.md#upload-through-the-file-manager)
describes for the REST API.

```python
# One file
uploaded = client.files.upload_file(
    "./contracts/nda.pdf",
    scope=["acme", "legal"],
    name="nda-2026.pdf",                 # optional, defaults to the file's name
    custom_metadata={"owner": "legal"},  # optional
)
print(uploaded.id, uploaded.version)

# Every file directly inside a folder, under one scope
results = client.files.upload_folder("./contracts", scope=["acme", "legal"])

# An explicit list, each under its own scope
results = client.files.upload_files({
    "./contracts/nda.pdf": ["acme", "legal"],
    "./reports/q1.pdf": ["acme", "finance", "2026"],
})
```

A multi-file upload reports each file separately, and one rejected file does not
stop the others, so check `status` on every result rather than assuming success:

```python
for result in results:
    if result.status == "ok":
        print(result.id, result.version)
    else:
        print(result.name, result.detail)
```

`upload_folder` ignores subfolders. One request carries at most 100 files and
2 GiB. Uploading a name that already exists under the same scope stores a new
version rather than a duplicate, so re-running a script is safe.

## Deploy AutoGraph

A project holds exactly one AutoGraph service. In the web interface it is
deployed for you when you start the build; over HTTP it is a
[service install](../../platform-suite/control-plane-acp/api.md#deploy-a-service)
with the chart's `env` values. The SDK takes Python arguments and builds that
install request for you.

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
print(info.service_id, info.status)
```

`fps_recovery_username` is an existing ArangoDB user with read and write access
to the project's database, which AutoGraph uses to resume File Parser work after
a pod restart. The SDK does not create this user.

The project name and database are not parameters, because they come from the
handle. Before sending anything, `deploy` reloads the project and refuses with
`AutoGraphAlreadyDeployedError` if a service is already there.

{{< info >}}
Acceptance is not readiness. The call returns once the platform accepts the
install request, while the pod may still be starting.
{{< /info >}}

Reading the deployment state costs nothing, because it comes from the project
record the handle already holds:

```python
project.autograph.is_deployed   # True
project.autograph.service_id
project.autograph.service_url
project.model_settings          # providers, models, profile IDs
```

Call `project.refresh()` first to pick up a change made elsewhere, for example a
deploy from another client. To remove the service, `undeploy()` takes no
arguments, because the project has exactly one:

```python
project.autograph.undeploy()
```

## Where the SDK stops

Everything above gets you a project with documents and a running AutoGraph
service. The stages that actually build and query the graph have no SDK surface
yet, so continue in [AutoGraph Studio](web-interface.md) or with the REST API:

1. **Build the corpus** — [`POST /v1/corpus/builds`](reference/corpus-build.md)
   with your category labels in `categories`.
2. **Generate RAG strategies** —
   [`POST /v1/rag-strategizer/analyze`](reference/rag-strategizer.md).
3. **Orchestrate the import** —
   [`POST /v1/orchestrate`](reference/orchestration.md).
4. **Deploy a retriever and ask questions** — see
   [AutoRAG](../autorag/_index.md).

Steps 1 to 3 are asynchronous: they acknowledge with `202` and you poll the
matching status endpoint before moving on. See the
[call sequence](reference/_index.md#call-sequence) for the ordering rules.

These stages arrive as further methods on `project.autograph` in later releases.

## Handle errors

The SDK never hands you a status code to interpret. Every failure is translated
into a named exception, and all of them descend from `ArangoAIError`:

```python
from arango_ai_sdk.exceptions import (
    ArangoAIError,
    AutoGraphAlreadyDeployedError,
    InvalidCredentialsError,
    PlatformUnreachableError,
)

try:
    ...
except InvalidCredentialsError:
    print("Check the username and password.")
except PlatformUnreachableError:
    print("Check the endpoint and your network.")
except AutoGraphAlreadyDeployedError:
    print(f"Already running as {project.autograph.service_id}")
except ArangoAIError as exc:
    print(f"Something else went wrong: {exc}")
```

`CommunicationError` separates "never got there" (`PlatformUnreachableError`)
from "got there, and it said no" (`ServiceError`). Every `ServiceError` carries
`status_code` and `error_code` alongside its message, so the HTTP detail is
still there when you want it.
