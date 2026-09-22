---
title: Get started with the Arango AI SDK
menuTitle: Getting started
weight: 10
description: >-
  A short tutorial that takes you from an empty database to a deployed AutoGraph
  service, using only Python
---
{{< tag "Experimental" >}}

This tutorial walks the happy path: connect to your deployment, create a
project, store the API keys your models need, upload the documents you want
answers from, and deploy AutoGraph against them.

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
name fails here rather than on your first real call. From then on, every call
carries a valid token, and the SDK renews it silently when it expires.

## 2. Create a project

A project is the workspace everything else belongs to: the documents you upload,
the context graph built from them, and the questions you later ask against it.

```python
project = client.project.create(
    project_name="my_first_project",
    project_type="autograph",
)
```

The project is created in the database the client was constructed with. Names
may contain letters, digits, underscores, and hyphens only.

`create` returns a project handle, which is where everything project-scoped
happens from here on. To pick up a project you created earlier, use
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

The key is encrypted on the platform and never leaves it again. Keep the
`profile_id` values: that is what the deploy step asks for. If one key covers
both models, create a single profile and pass its ID twice.

## 4. Upload your documents

Files are uploaded under a *scope*: an ordered list of up to five labels that
works like a storage path, so `["acme", "legal"]` places a file in the `legal`
part of `acme`.

```python
results = client.files.upload_folder("./documents", scope=["acme", "legal"])

for result in results:
    print(result.name, result.status)
```

`upload_folder` takes the files directly inside the folder and ignores
subfolders. For a single file, use `client.files.upload_file(path, scope=[...])`.

One file the platform rejects does not stop the others, so check `status` on
every result rather than assuming success. A file is identified by its database,
scope, and name together, so uploading the same name under the same scope again
stores a new version instead of a duplicate. Re-running the script is safe.

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
they come from the handle.

{{< info >}}
Acceptance is not readiness. The call returns as soon as the platform accepts
the install request, while the pod may still be starting.
{{< /info >}}

To check the deployment, read the handle. It costs nothing, because the state
comes from the project record the handle already holds:

```python
print(project.autograph.is_deployed)   # True
print(project.autograph.service_url)
```

Call `project.refresh()` first to pick up a change made elsewhere, for example a
deploy from another client. To remove the service again, use
`project.autograph.undeploy()`, which takes no arguments.

## 6. Close the client

```python
client.close()
```

`close()` releases the HTTP sessions and sockets the client keeps open. Call it
when you are done, typically in a `finally` block. Calling it more than once is
safe.

## Handle errors

The SDK never hands you an HTTP status code to interpret. Every failure is
translated into a named exception, and all of them descend from `ArangoAIError`,
so you can catch at whichever level fits what you want to handle:

```python
from arango_ai_sdk.exceptions import ArangoAIError, InvalidCredentialsError

try:
    ...
except InvalidCredentialsError:
    print("Check the username and password.")
except ArangoAIError as exc:
    print(f"Something went wrong: {exc}")
```

## Next steps

Continue in [AutoGraph Studio](../../agentic-ai-suite/autograph/web-interface.md)
or with the [AutoGraph REST API](../../agentic-ai-suite/autograph/reference/_index.md)
to build the context graph from the documents you uploaded and to ask questions
against it with [AutoRAG](../../agentic-ai-suite/autorag/_index.md).

<!-- TODO: link to the SDK's own reference documentation once it is published -->
