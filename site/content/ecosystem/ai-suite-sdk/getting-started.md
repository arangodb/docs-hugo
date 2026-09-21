---
title: Get started with the Arango AI Suite Python SDK
menuTitle: Getting started
weight: 10
description: >-
  A tutorial that takes you from an empty database to a deployed AutoGraph
  service, using only Python
---
{{< tag "Experimental" >}}

This tutorial walks the happy path the SDK covers today: connect to your
deployment, create a project, store the API keys your models need, upload the
documents you want answers from, and deploy AutoGraph against them. Everything
runs in one Python script.

## Before you start

[Install the SDK](installation.md), then collect:

- **The endpoint of your deployment**, port included, exactly as the deployment
  publishes it, for example `https://<your-deployment>:8529`.
- **A username and password** that can access the database you want to work in.
- **An API key for a model provider**, for example an OpenAI key. The same key
  can cover both the chat and the embedding model.
- **The name of an existing ArangoDB user** with read and write access to the
  project's database. AutoGraph uses it to resume file parsing after a pod
  restart. The SDK does not create this user for you.
- **The documents to ingest**, in a folder on the machine that runs the script.

{{< steps >}}

{{< step "Create a client" >}}
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

Constructing the client signs you in: the SDK exchanges your credentials for a
token and checks that the database exists. A wrong password or a misspelt
database name therefore fails here, not on your first real call. From then on,
every call carries a valid token, and the SDK renews it silently when the
deployment says it has expired.
{{< /step >}}

{{< step "Create a project" >}}
A project is the workspace everything else belongs to: the documents you upload,
the context graph built from them, and the questions you later ask against it.

```python
project = client.project.create(
    project_name="my_first_project",
    project_type="autograph",
    description="Created from the getting-started tutorial.",
)

print(project.name, project.project_type, project.db_name)
```

The project is created in the database the client was constructed with. Names
may contain letters, digits, underscores, and hyphens only.

`create` returns a project handle, which is where everything project-scoped
happens from here on. To pick up a project you created earlier, in a previous
run or through the web interface, use `client.project.get(project_name=...)`
instead.
{{< /step >}}

{{< step "Store the model provider API keys" >}}
AutoGraph needs a chat model to read your documents and an embedding model to
index them. Rather than passing keys around, you store each one once as a
*secret profile* and refer to it by ID afterwards.

```python
chat = client.secret_profile.create(
    name="openai-chat",
    secret="<your-api-key>",
    provider="openai",
    description="Chat model key.",
)

embed = client.secret_profile.create(
    name="openai-embedding",
    secret="<your-api-key>",
    provider="openai",
    description="Embedding model key.",
)

print(chat.profile_id, embed.profile_id)
```

The key is encrypted on the platform and never leaves it again. `secret_data` on
the returned profile is an obfuscated copy that keeps only the first two and the
last two characters, enough to recognize a key without exposing it. Keep the
`profile_id` values: that is what the deploy step asks for.

If one key covers both models, you can create a single profile and pass its ID
twice.
{{< /step >}}

{{< step "Upload your documents" >}}
Files are uploaded under a *scope*: an ordered list of up to five labels that
works like a storage path, so `["acme", "legal"]` places a file in the `legal`
part of `acme`.

```python
results = client.files.upload_folder("./documents", scope=["acme", "legal"])

for result in results:
    if result.status == "ok":
        print(f"{result.name}: stored as {result.id} v{result.version}")
    else:
        print(f"{result.name}: rejected, {result.detail}")
```

`upload_folder` takes the files directly inside the folder and ignores
subfolders. For a single file, use `client.files.upload_file(path, scope=[...])`;
for an explicit list, or for files that go to different scopes, use
`client.files.upload_files(...)`.

One file the platform rejects, an empty one for example, does not stop the
others, so check `status` on every result rather than assuming success. A file
is identified by its database, scope, and name together, which means uploading
the same name under the same scope again stores a new version instead of a
duplicate. Re-running the script is therefore safe.

Large uploads take a while: the platform answers only once the last file is
written, and the SDK waits up to five minutes. Pass `timeout` in seconds for a
very large set or a slow deployment.
{{< /step >}}

{{< step "Deploy AutoGraph" >}}
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
{{< /step >}}

{{< step "Check the deployment" >}}
The handle is reloaded after the deploy, so its state is current straight away.
Reading it costs nothing: it comes from the project record the handle already
holds, not from a request.

```python
print(project.autograph.is_deployed)   # True
print(project.autograph.service_id)
print(project.autograph.service_url)
print(project.model_settings)          # providers, models, profile IDs
```

To pick up a change made elsewhere, for example a deploy from another client,
call `project.refresh()` first.
{{< /step >}}

{{< step "Close the client" >}}
```python
client.close()
```

`close()` releases the HTTP sessions and sockets the client keeps open. Call it
when you are done, typically in a `finally` block. Calling it more than once is
safe.
{{< /step >}}

{{< /steps >}}

## The complete script

```python
from arango_ai_sdk import ArangoAIClient

client = ArangoAIClient(
    base_url="https://<your-deployment>:8529",
    username="<username>",
    password="<password>",
)

try:
    project = client.project.create(
        project_name="my_first_project",
        project_type="autograph",
    )

    chat = client.secret_profile.create(
        name="openai-chat", secret="<your-api-key>", provider="openai"
    )
    embed = client.secret_profile.create(
        name="openai-embedding", secret="<your-api-key>", provider="openai"
    )

    for result in client.files.upload_folder("./documents", scope=["acme", "legal"]):
        print(result.name, result.status)

    info = project.autograph.deploy(
        chat_api_provider="openai",
        embedding_api_provider="openai",
        chat_secret_profile_id=chat.profile_id,
        embedding_secret_profile_id=embed.profile_id,
        fps_recovery_username="<arangodb-username>",
    )
    print(f"Deploying {info.service_id}: {info.status}")
finally:
    client.close()
```

## Handle errors

The SDK never hands you an HTTP status code to interpret. Every failure, its own
or one from an underlying library, is translated into a named exception, and all
of them descend from `ArangoAIError`. Catch at whichever level fits what you
want to handle:

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

The tree is shallow on purpose. `AuthenticationError` covers problems getting or
using a token. `CommunicationError` covers problems reaching the deployment,
and its two children separate "never got there" (`PlatformUnreachableError`)
from "got there, and it said no" (`ServiceError`). Every `ServiceError` carries
`status_code` and `error_code` alongside its message.

## What comes next

Building the graph is not part of the SDK yet. Continue in
[AutoGraph Studio](../../agentic-ai-suite/autograph/web-interface.md) or with the
[AutoGraph REST API](../../agentic-ai-suite/autograph/reference/_index.md):

1. **Run the corpus build.** AutoGraph reads every uploaded document and groups
   them by the topics they cover. See
   [Corpus build](../../agentic-ai-suite/autograph/reference/corpus-build.md).
2. **Generate strategies and build the knowledge graph.** See
   [RAG strategizer](../../agentic-ai-suite/autograph/reference/rag-strategizer.md).
3. **Deploy a retriever and ask questions.** See
   [AutoRAG](../../agentic-ai-suite/autorag/_index.md).

To remove the service again, the SDK does have `project.autograph.undeploy()`,
which takes no arguments: the project has exactly one AutoGraph service.

To see these same operations mapped to their web interface actions and HTTP
endpoints, see
[Drive AutoGraph with the Python SDK](../../agentic-ai-suite/autograph/python-sdk.md).
