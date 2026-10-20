---
title: Arango Contextual Data Platform Quickstart
menuTitle: Quickstart
weight: 5
description: >-
  Install the Arango Contextual Data Platform and ask your first questions
  against a Context Graph with the Arango AI SDK
---
Welcome to tutorial 1! This page takes you from an empty machine to a working
Context Graph that you can ask questions in natural language:

- [Install the data platform](#install-arango-contextual-data-platform): set up a
  local evaluation deployment.
- [Install the Arango AI SDK](#install-the-arango-ai-sdk): the official Python
  to drive an AutoGraph workflow.
- [Connect](#connect): sign in, create a project, and start AutoGraph.
- [Build](#build): upload a few short texts and turn them into a Context Graph.
- [Query](#query): deploy a retriever and ask questions that span all the
  texts.

## Prerequisites

- **Docker**: Docker must be installed and running.
  - macOS: [Docker Desktop](https://docs.docker.com/desktop/setup/install/mac-install/)
  - Linux: [Docker Engine](https://docs.docker.com/engine/install/)

  Allocate at least 4 CPUs and 8 GB RAM to Docker.
- **Kubernetes** (optional): The installer uses whichever cluster your current
  `kubectl` context points to, local (Kind, minikube, k3d, Docker Desktop) or
  remote (EKS, GKE, AKS, OpenShift). Point `kubectl` at the cluster you want
  before you run the installer, and confirm it with `kubectl cluster-info`.
  If no cluster is reachable, the installer installs
  [Kind](https://kind.sigs.k8s.io/) and creates a local cluster named
  `arango-platform` for you.
- **Resources**: 2+ CPU cores, 8 GB+ RAM, and 50 GB+ free disk space.
- **Connectivity**: Active internet connection for downloading container images
  and tools.
- **License key**: An Arango license key. Get one for free from the
  [Arango Developer Edition page](https://arango.ai/arango-developer-edition/) -
  fill in your name, work email, company, and country, accept the license
  terms, and select **Get started**. No credit card is required.
- **LLM access**: A valid OpenAI API key. Any other OpenAI-compatible endpoint
  works as well - OpenRouter, Google Gemini, Anthropic, Azure, or a private
  corporate LLM - see
  [LLM Configuration](../../../agentic-ai-suite/autograph/llm-configuration.md) for the
  supported providers and models.

## Install Arango Contextual Data Platform

There are two ways to install the data platform, and they do not give you the same
deployment. Pick the one that matches what you need:

| | Installation script | Manual installation |
|:---|:---|:---|
| **Purpose** | Local evaluation of AutoGraph and AutoRAG | Full data platform deployment |
| **Kubernetes** | Your current cluster, or a local Kind cluster it creates for you | Any cluster you control |
| **ArangoDB** | Single server | Single server or cluster |
| **Services** | Only what AutoGraph and AutoRAG need. GraphML, MLflow, Grafana, and Prometheus are removed | Everything in your package configuration |
| **You run** | One command | Individual `kubectl` and `helm` commands you can review |
| **Use it for** | Trying the data platform out on your own machine | Deployments you intend to keep, including production |

### Option 1: Installation script (evaluation)

The installation script sets up a complete local evaluation environment. It
takes about 10 minutes, most of it spent downloading container images.
Replace `YOUR_LICENSE_KEY` with the key you received from the
[Arango Developer Edition page](https://arango.ai/arango-developer-edition/):

```bash
curl --proto '=https' --tlsv1.2 -fsSL https://releases.license.arango.ai/releases/plg/install.sh | bash -s -- --license-key "YOUR_LICENSE_KEY"
```

If you would rather not pipe a remote script straight into a shell, download it
first, read it, and then run it. This is the same installation - download,
review, then run:

```bash
curl --proto '=https' --tlsv1.2 -fsSL -O https://releases.license.arango.ai/releases/plg/install.sh
less install.sh
bash install.sh --license-key "YOUR_LICENSE_KEY"
```

The script is written for Bash, so run it with `bash` even if your login shell
is Zsh or Fish.

{{< security >}}
A license key passed as `--license-key` is visible in process lists and is
saved to your shell history. To avoid that, either set it in the
`ARANGO_LICENSE_KEY` environment variable, or leave the flag off altogether and
let the script prompt you for it.
{{< /security >}}

#### What the script does

Reading the script is the surest way to know what it does, but here is what to
expect. Before it starts, it checks for `kubectl`, `helm`, and `kind`, and
installs any that are missing, using Homebrew on macOS and verified binary
downloads elsewhere. It then runs the following steps:

1. Verifies your current Kubernetes cluster, or creates a Kind cluster named
   `arango-platform`.
2. Creates the `arango` namespace and stores your license credentials in a
   Kubernetes secret.
3. Installs the ArangoDB Kubernetes Operator.
4. Deploys ArangoDB in single server mode.
5. Sets up SeaweedFS object storage.
6. Configures platform storage.
7. Installs the data platform, then removes the services that evaluation does not
   need: GraphML (`arangodb-ml-api`), MLflow, Grafana, and Prometheus.
8. Waits for all pods to be ready.
9. Starts a port-forward on port 8529 and sets the root password.

It writes a detailed log to `~/.arango-install.log`.

The script also registers a cleanup trap that runs when it exits or is
interrupted. The trap stops the port-forward it started and deletes the
temporary files it created under `$TMPDIR`. It does not touch anything else,
and it does not roll back the installation.

### Option 2: Manual installation (full data platform)

If you would prefer not to run an installation script at all, or you need the
full data platform rather than the evaluation subset, follow
[Online setup](../../../contextual-data-platform/install-and-upgrade/online-setup.md)
instead. It covers the same deployment as a sequence of `kubectl` and `helm`
commands that you can read and run one at a time, against a cluster you already
control.

For an environment without internet access, see
[Offline setup](../../../contextual-data-platform/install-and-upgrade/offline-setup.md).

The rest of this page assumes you used the installation script.

### After the installation

When the installation completes, it prints one or two **Next Steps**. Make sure
you run those steps before accessing the web interface or running the quick
start application.

Sample output:

```
[Step 9/9] Starting port-forward and opening UI
ℹ  Starting port-forward for service/deployment-ea on port 8529...
ℹ  Setting root password...
✔  Root password set.
✔  Done (4s)

=========================================
  Installation Complete!
=========================================

  UI:       https://127.0.0.1:8529/ui/
  Username: root
  Password: test

  ⚠  These defaults are for local evaluation only.
     Change the password before exposing the deployment beyond your machine.

  Log file: /Users/jd/.arango-install.log
  Duration: 6m 45s

=========================================
  Next Steps
=========================================

  1. Start port-forward to access the UI or run quickstart examples:

     kubectl port-forward -n arango service/deployment-ea 8529:8529

     Then open: https://127.0.0.1:8529/ui/

     Note: Re-run the command above any time the port-forward drops.

  2. Cleanup when done:
     kind delete cluster --name arango-platform
```

For common setup issues, see
[Troubleshooting the installation](troubleshooting.md).

## Install the Arango AI SDK

AutoGraph and AutoRAG are exposed as HTTP APIs, and you can call them directly -
the [AutoGraph Service Reference](../../../agentic-ai-suite/autograph/reference/_index.md)
documents every endpoint. Going from documents to answers that way takes more
than a dozen calls in the right order, though: obtaining and renewing a JWT,
storing your LLM API key as a secret, creating a project, starting the AutoGraph
service, running the build stages one after another while polling each one
until it finishes, and finally deploying a retriever to query. The Arango
AI SDK, the official Python client, wraps that
whole sequence into named methods on a client object and takes care of
authentication, waiting on long-running steps, and reconnecting to a project
you built earlier. It is the quickest way to put the data platform to work from
your own code, and it is what the quick start below uses.

Installing from the repository requires `git` and
[uv](https://docs.astral.sh/uv/getting-started/installation/). The
`make install` step uses uv to create a virtual environment in `.venv` with a
suitable Python interpreter (the SDK requires **Python 3.12 or higher**) and
installs the SDK into it:

```bash
git clone https://github.com/arangoml/arango-ai-sdk
cd arango-ai-sdk
make install
source .venv/bin/activate
```

The last command activates the virtual environment, so run the quick start
below from the same shell. If `make install` fails with
`uv: command not found`, install uv first.

## Quick Start

In this quick start, you give AutoGraph a few short texts, let it turn them into
a graph, and then ask that graph questions in plain English. A complete working
Python program is available at the end.

The sample data is three short biographies of physicists - Albert Einstein,
Niels Bohr, and Werner Heisenberg. Each text is about one person, but they
mention one another: Heisenberg studied under Bohr, Bohr and Einstein debated
quantum mechanics, and all three won the Nobel Prize in Physics. The point of
the exercise is to answer questions that no single text answers alone, such as
which of them won a Nobel Prize and for what. A plain keyword or vector search
returns individual passages, while a graph connects the facts across documents.

**AutoGraph** is the service that builds that graph. From your documents, it
creates a **Context Graph** made of two parts:

- The **Corpus Graph** maps how your documents relate to each other. AutoGraph
  extracts the text, computes embeddings, links similar documents, and groups
  them into topic clusters.
- The **Knowledge Graph** holds what the documents say. For each cluster,
  AutoGraph uses your LLM to pick the entity types worth extracting and a
  retrieval strategy: a full graph of entities and relationships for complex
  content, or plain vector retrieval for simpler content. For a full graph, it
  then extracts entities such as people, institutions, and prizes, along with
  the relationships between them.

**AutoRAG** then deploys a retriever on top of the Context Graph that answers
natural-language questions from it. For a closer look at each stage, see
[AutoGraph](../../../agentic-ai-suite/autograph/_index.md).

{{< info >}}
The Arango AI SDK client connects through the port-forward that the installer
started. If it has dropped, re-run
`kubectl port-forward -n arango service/deployment-ea 8529:8529`.
{{< /info >}}

The quick start walks you through connect, build, and query, with a cleanup
step at the end.

### Connect

Connecting means signing in, creating a project, storing your LLM API key,
and starting AutoGraph.

Constructing the client signs you in, so a wrong password fails here rather
than on your first real call. Every later call carries a valid token, which
the SDK renews silently when it expires. The client connects to the `_system`
database by default.

A *project* is the workspace everything else belongs to: the documents you
upload, the Context Graph built from them, and the questions you later ask
against it. Your LLM API key is stored once as a *secret profile* and referred
to by ID afterwards, so the key never travels through your code again. One key
can serve both the chat and the embedding model:

```python
import urllib3

from arango_ai_sdk import ArangoAIClient

# Silence the warning that verify=False otherwise triggers on every request
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

client = ArangoAIClient(
    base_url="https://localhost:8529",
    username="root",
    password="test",
    verify=False,  # the local deployment uses a self-signed certificate
)

project = client.project.create(
    project_name="quickstart",
    project_type="autograph",
)

profile = client.secret_profile.create(
    name="quickstart-openai",
    secret="YOUR_LLM_API_KEY",
    provider="openai",
)

project.autograph.deploy(
    chat_api_provider="openai",
    embedding_api_provider="openai",
    chat_secret_profile_id=profile.profile_id,
    embedding_secret_profile_id=profile.profile_id,
    fps_recovery_username="root",
    chat_model="gpt-4o",
    embedding_model="text-embedding-3-small",
)

if not project.autograph.wait_until_ready():
    raise RuntimeError("AutoGraph did not become ready in time")
```

A project name can only be created once, and a project cannot be deleted yet.
To pick up a project from an earlier run, use
`client.project.get(project_name="quickstart")` instead of `create`.

`deploy()` starts the AutoGraph service for the project. The call returns as
soon as the data platform accepts the install, while the pod may still be starting,
so `wait_until_ready()` waits for the service before you continue.
`fps_recovery_username` names an existing ArangoDB user with read and write
access to the project's database; AutoGraph uses it to resume file parsing
after a pod restart. For this local evaluation setup, `root` is fine.

### Build

Files are uploaded under a *scope*: the first label is the project name and
the second is the *category*, a label you later ingest by. Save the three
biographies as text files and upload the folder:

```python
from pathlib import Path

docs = Path("./quickstart-docs")
docs.mkdir(exist_ok=True)

(docs / "einstein.txt").write_text(
    "Albert Einstein developed the theory of relativity and received "
    "the Nobel Prize in Physics in 1921. He worked at the Institute for "
    "Advanced Study in Princeton and collaborated with many physicists "
    "including Niels Bohr on quantum mechanics debates."
)
(docs / "bohr.txt").write_text(
    "Niels Bohr proposed the Bohr model of the atom and won the Nobel "
    "Prize in Physics in 1922. He founded the Institute of Theoretical "
    "Physics in Copenhagen and mentored Werner Heisenberg, who later "
    "developed the uncertainty principle."
)
(docs / "heisenberg.txt").write_text(
    "Werner Heisenberg formulated quantum mechanics and the uncertainty "
    "principle. He received the Nobel Prize in Physics in 1932. During "
    "World War II he led Germany's nuclear energy project. He had studied "
    "under Niels Bohr in Copenhagen and later debated with Einstein about "
    "the foundations of quantum theory."
)

results = client.files.upload_folder(docs, scope=["quickstart", "physicists"])
for result in results:
    print(result.name, result.status)
```

Now build the graph. `ingest()` runs the whole AutoGraph pipeline described
above - Corpus Graph, per-cluster strategies, and Knowledge Graph extraction -
and blocks until it finishes. Most steps call your LLM or embedding model, so
expect it to take several minutes even for this small dataset. The
`on_progress` callback prints which phase is running - `build`, then
`strategize`, then `orchestrate`. Orchestrate is the long one; repeated
`orchestrate running` lines mean the import is still working:

```python
result = project.autograph.ingest(
    categories=["physicists"],
    on_progress=lambda p: print(p.step, p.status.status),
)
print(result.build.document_count, "documents ingested")
```

A category can only be built once. If you upload more files later, ingest
again with `incremental=True`; running the same ingest twice without it raises
`CategoryAlreadyBuiltError`.

### Query

Questions are answered by a retriever: **AutoRAG** runs as its own service on
top of the Context Graph, so deploy it once, with the same model settings as
AutoGraph, before the first question:

```python
retriever = project.autorag.deploy(
    chat_api_provider="openai",
    embedding_api_provider="openai",
    chat_secret_profile_id=profile.profile_id,
    embedding_secret_profile_id=profile.profile_id,
    chat_model="gpt-4o",
    embedding_model="text-embedding-3-small",
)

rag = retriever.autorag
if not rag.wait_until_ready():
    raise RuntimeError("The retriever did not become ready in time")
```

With the graph built and the retriever running, you can ask questions about
the three biographies. `ask()` sends your question to the retriever. The
retriever looks up the relevant entities, relationships, and text passages in
the Context Graph and passes them to your LLM, which writes an answer based on
that retrieved context rather than on its general knowledge.

How the retriever searches depends on the kind of question, and you select it
with the `query_type` parameter:

- [**Local search**](../../../agentic-ai-suite/autorag/search-methods/local-search.md)
  (`QueryType.LOCAL`) starts from the entities your question names, such as
  Heisenberg, and follows their direct relationships. Use it for questions about
  a specific person or thing.
- [**Global search**](../../../agentic-ai-suite/autorag/search-methods/global-search.md)
  (`QueryType.GLOBAL`) works from summaries of groups of closely related
  entities across the whole graph. Use it for broad questions about overall
  themes.
- [**Unified search**](../../../agentic-ai-suite/autorag/search-methods/unified-search.md)
  (`QueryType.UNIFIED`, the default) combines matching text passages with
  matching entities in a single fast lookup, and works on every part of the
  graph.

Try one question with each mode. The answer is in the `result` field of the
response:

```python
from arango_ai_sdk.models import QueryType

# Local search: one entity and its direct relationships
print(rag.ask("What did Heisenberg contribute to physics?",
              query_type=QueryType.LOCAL).result)

# Global search: themes across the whole graph
print(rag.ask("What are the big themes across these documents?",
              query_type=QueryType.GLOBAL).result)

# Unified search (the default): text passages and entities combined
print(rag.ask("Which physicists here won Nobel Prizes and what were they for?").result)
```

The last question is the one from the start of this quick start. No single
biography lists all three prizes, so answering it requires connecting facts
from all three documents.

### Cleanup

Remove the retriever and the AutoGraph service when you are done, and close
the client. The project and the graph it built stay in the database, so you
can pick the project up again later with `client.project.get()` and deploy a
new retriever to ask more questions:

```python
rag.undeploy()
project.autograph.undeploy()
client.close()
```

## Complete Python Script

The following script combines all the steps above into a single file. It reads
the database password and the LLM API key from the `ARANGODB_PASSWORD` and
`LLM_API_KEY` environment variables:

```python
# Complete Quick Start Script
import os
from pathlib import Path

import urllib3

from arango_ai_sdk import ArangoAIClient
from arango_ai_sdk.models import QueryType

# Silence the warning that verify=False otherwise triggers on every request
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

client = ArangoAIClient(
    base_url="https://localhost:8529",
    username="root",
    password=os.environ["ARANGODB_PASSWORD"],
    verify=False,
)
print("Connected to Arango AI...")

project = client.project.create(
    project_name="quickstart",
    project_type="autograph",
)

# Store the LLM API key once; one key serves both models here
profile = client.secret_profile.create(
    name="quickstart-openai",
    secret=os.environ["LLM_API_KEY"],
    provider="openai",
)

project.autograph.deploy(
    chat_api_provider="openai",
    embedding_api_provider="openai",
    chat_secret_profile_id=profile.profile_id,
    embedding_secret_profile_id=profile.profile_id,
    fps_recovery_username="root",
    chat_model="gpt-4o",
    embedding_model="text-embedding-3-small",
)
if not project.autograph.wait_until_ready():
    raise RuntimeError("AutoGraph did not become ready in time")

# Write three separate documents - each about a different person

docs = Path("./quickstart-docs")
docs.mkdir(exist_ok=True)
(docs / "einstein.txt").write_text(
    "Albert Einstein developed the theory of relativity and received "
    "the Nobel Prize in Physics in 1921. He worked at the Institute for "
    "Advanced Study in Princeton and collaborated with many physicists "
    "including Niels Bohr on quantum mechanics debates."
)
(docs / "bohr.txt").write_text(
    "Niels Bohr proposed the Bohr model of the atom and won the Nobel "
    "Prize in Physics in 1922. He founded the Institute of Theoretical "
    "Physics in Copenhagen and mentored Werner Heisenberg, who later "
    "developed the uncertainty principle."
)
(docs / "heisenberg.txt").write_text(
    "Werner Heisenberg formulated quantum mechanics and the uncertainty "
    "principle. He received the Nobel Prize in Physics in 1932. During "
    "World War II he led Germany's nuclear energy project. He had studied "
    "under Niels Bohr in Copenhagen and later debated with Einstein about "
    "the foundations of quantum theory."
)

print("Uploading files...")
for result in client.files.upload_folder(docs, scope=["quickstart", "physicists"]):
    print(result.name, result.status)
print("Upload complete. Building knowledge graph (this may take several minutes)...")

# Build the knowledge graph, printing which phase is running

project.autograph.ingest(
    categories=["physicists"],
    on_progress=lambda p: print(p.step, p.status.status),
)
print("Build complete.")

# Deploy the retriever that answers questions from the graph

retriever = project.autorag.deploy(
    chat_api_provider="openai",
    embedding_api_provider="openai",
    chat_secret_profile_id=profile.profile_id,
    embedding_secret_profile_id=profile.profile_id,
    chat_model="gpt-4o",
    embedding_model="text-embedding-3-small",
)
rag = retriever.autorag
if not rag.wait_until_ready():
    raise RuntimeError("The retriever did not become ready in time")

# Cross-document question
# This is the key value of a knowledge graph: connecting dots across documents
# that no single document answers on its own.

print("=== Cross-document question ===")
print(rag.ask("How are Einstein, Bohr, and Heisenberg connected to each other?").result)

# All three query modes

print("\n=== Local - entity neighborhood ===")
print(rag.ask("What did Heisenberg contribute to physics?",
              query_type=QueryType.LOCAL).result)

print("\n=== Global - themes across the whole graph ===")
print(rag.ask("What are the big themes across these documents?",
              query_type=QueryType.GLOBAL).result)

print("\n=== Unified (default) - passages + entities combined ===")
print(rag.ask("Which physicists here won Nobel Prizes and what were they for?").result)

# Out-of-scope question (grounding check)
# The retriever should tell you it doesn't know - it stays inside your knowledge
# graph instead of inventing an answer.

print("\n=== Out-of-scope question (grounding check) ===")
print(rag.ask("What was the score of last night's football game?").result)

# Stop services; the project and the graph stay in the database
rag.undeploy()
project.autograph.undeploy()
client.close()
```