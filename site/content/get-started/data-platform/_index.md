---
title: Get started with the data platform
menuTitle: Arango Contextual Data Platform
weight: 10
description: >-
  Install the Arango Contextual Data Platform and run your first graph-powered
  questions with the Python client
---
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
- **License key**: An Arango license key. Request one with the
  [license key request form](https://arangoaistg.wpenginepowered.com/cdp-license-request/).
- **LLM access**: A valid OpenAI API key. Any other OpenAI-compatible endpoint
  works as well - OpenRouter, Google Gemini, Anthropic, Azure, or a private
  corporate LLM - see
  [LLM Configuration](../../agentic-ai-suite/autograph/llm-configuration.md) for the
  supported providers and models.

## Install Arango Contextual Data Platform

There are two ways to install the platform, and they do not give you the same
deployment. Pick the one that matches what you need:

| | Installation script | Manual installation |
|:---|:---|:---|
| **Purpose** | Local evaluation of AutoGraph and AutoRAG | Full platform deployment |
| **Kubernetes** | Your current cluster, or a local Kind cluster it creates for you | Any cluster you control |
| **ArangoDB** | Single server | Single server or cluster |
| **Services** | Only what AutoGraph and AutoRAG need. GraphML, MLflow, Grafana, and Prometheus are removed | Everything in your package configuration |
| **You run** | One command | Individual `kubectl` and `helm` commands you can review |
| **Use it for** | Trying the platform out on your own machine | Deployments you intend to keep, including production |

### Option 1: Installation script (evaluation)

The installation script sets up a complete local evaluation environment. It
takes about 10 minutes, most of it spent downloading container images.

```bash
curl --proto '=https' --tlsv1.2 -fsSL https://releases.license.arango.ai/releases/plg/install.sh | bash -s -- --license-key "YOUR_LICENSE_KEY"
```

If you would rather not pipe a remote script straight into a shell, download it
first, read it, and then run it. This is the same installation, in three steps
instead of one:

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
downloads elsewhere. It then runs nine steps:

1. Verifies your current Kubernetes cluster, or creates a Kind cluster named
   `arango-platform`.
2. Creates the `arango` namespace and stores your license credentials in a
   Kubernetes secret.
3. Installs the ArangoDB Kubernetes Operator.
4. Deploys ArangoDB in single server mode.
5. Sets up MinIO object storage.
6. Configures platform storage.
7. Installs the platform, then removes the services that evaluation does not
   need: GraphML (`arangodb-ml-api`), MLflow, Grafana, and Prometheus.
8. Waits for all pods to be ready.
9. Starts a port-forward on port 8529 and sets the root password.

It writes a detailed log to `~/.arango-install.log`.

The script also registers a cleanup trap that runs when it exits or is
interrupted. The trap stops the port-forward it started and deletes the
temporary files it created under `$TMPDIR`. It does not touch anything else,
and it does not roll back the installation.

### Option 2: Manual installation (full platform)

If you would prefer not to run an installation script at all, or you need the
full platform rather than the evaluation subset, follow
[Online setup](../../contextual-data-platform/install-and-upgrade/online-setup.md)
instead. It covers the same deployment as a sequence of `kubectl` and `helm`
commands that you can read and run one at a time, against a cluster you already
control.

For an environment without internet access, see
[Offline setup](../../contextual-data-platform/install-and-upgrade/offline-setup.md).

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

## Install Python Client

To interact with your instance programmatically, install the official
Python client. It requires **Python 3.10 or higher** - note that the Python
shipped with macOS is older than that, so check your version first:

```bash
python3 --version
```

Create and activate a virtual environment with a supported Python version, then
install the client into it:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install https://releases.license.arango.ai/releases/plg/python_arango_ai_sdk-0.1.0-py3-none-any.whl
```

If `pip` reports `requires a different Python: 3.9.x not in '>=3.10'`, the
virtual environment was created with too old an interpreter. Delete `.venv`,
and create it again with a newer Python, for example
`python3.12 -m venv .venv`.

## Quick Start

The quick start walks you through the steps needed to build a graph and run
queries with code samples. A complete working Python program is available at the
end.

{{< info >}}
The client connects through the port-forward that the installer started. If it
has dropped, re-run
`kubectl port-forward -n arango service/deployment-ea 8529:8529`.
{{< /info >}}

Follow these steps to connect and run your first graph query.

### Connect

```python
from arango_ai import ArangoAIClient

client = ArangoAIClient("https://localhost:8529", verify_tls=False)
db = client.db('quickstart_db', username='root', password='test')
ag = db.autograph('my-project', llm_api_key='YOUR_LLM_API_KEY')
```

### Build

Upload three separate documents - each about a different person - and then build
the graph:

```python
ag.upload(
    text="Albert Einstein developed the theory of relativity and received "
    "the Nobel Prize in Physics in 1921. He worked at the Institute for "
    "Advanced Study in Princeton and collaborated with many physicists "
    "including Niels Bohr on quantum mechanics debates."
)

ag.upload(
    text="Niels Bohr proposed the Bohr model of the atom and won the Nobel "
    "Prize in Physics in 1922. He founded the Institute of Theoretical "
    "Physics in Copenhagen and mentored Werner Heisenberg, who later "
    "developed the uncertainty principle."
)

ag.upload(
    text="Werner Heisenberg formulated quantum mechanics and the uncertainty "
    "principle. He received the Nobel Prize in Physics in 1932. During "
    "World War II he led Germany's nuclear energy project. He had studied "
    "under Niels Bohr in Copenhagen and later debated with Einstein about "
    "the foundations of quantum theory."
)

ag.build()
```

### Query

Now the part you built all of this for. Each line below asks the corpus a
different kind of question, so run them in order - together they show what the
Context Graph can do that a keyword search cannot.

```python
# Global; Summarizes across the whole graph
response = ag.ask("What are the big themes across these documents?", mode="global")

# Local (the default); One entity and its immediate neighbourhood
response = ag.ask("What did Heisenberg contribute to physics?")

# Unified; Combines passages and entities into one answer
response = ag.ask("Explain the Nobel Prize contributions in quantum mechanics.", mode="unified")

# Deep; Plans several hops across the graph
response = ag.ask("Which physicists here won Nobel Prizes and what were they for?", use_llm_planner=True)
```

### Cleanup

```python
ag.stop()
```

## Complete Python Script

The following script combines all the steps above into a single file. It reads
the database password and the LLM API key from the `ARANGODB_PASSWORD` and
`LLM_API_KEY` environment variables:

```python
# Complete Quick Start Script
import os
import logging

from arango_ai import ArangoAIClient

# Enable SDK logs so you can see progress instead of a blank screen
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

client = ArangoAIClient("https://localhost:8529", verify_tls=False)
db = client.db("quickstart_db", username="root", password=os.environ["ARANGODB_PASSWORD"])
ag = db.autograph("my-project", llm_api_key=os.environ["LLM_API_KEY"])
print("Connected to Arango AI...")

# Upload three separate documents - each about a different person

print("Uploading files...")
ag.upload(
    text="Albert Einstein developed the theory of relativity and received "
    "the Nobel Prize in Physics in 1921. He worked at the Institute for "
    "Advanced Study in Princeton and collaborated with many physicists "
    "including Niels Bohr on quantum mechanics debates."
)
ag.upload(
    text="Niels Bohr proposed the Bohr model of the atom and won the Nobel "
    "Prize in Physics in 1922. He founded the Institute of Theoretical "
    "Physics in Copenhagen and mentored Werner Heisenberg, who later "
    "developed the uncertainty principle."
)
ag.upload(
    text="Werner Heisenberg formulated quantum mechanics and the uncertainty "
    "principle. He received the Nobel Prize in Physics in 1932. During "
    "World War II he led Germany's nuclear energy project. He had studied "
    "under Niels Bohr in Copenhagen and later debated with Einstein about "
    "the foundations of quantum theory."
)
print("Upload complete. Building knowledge graph (this may take several minutes)...")

# Build the knowledge graph

ag.build()
print("Build complete.")

# Cross-document question
# This is the key value of a knowledge graph: connecting dots across documents
# that no single document answers on its own.

print("=== Cross-document question ===")
print(ag.ask("How are Einstein, Bohr, and Heisenberg connected to each other?"))

# All four query modes

print("\n=== Local (default) - entity neighborhood ===")
print(ag.ask("What did Heisenberg contribute to physics?"))

print("\n=== Global - themes across the whole graph ===")
print(ag.ask("What are the big themes across these documents?", mode="global"))

print("\n=== Unified - passages + entities combined ===")
print(ag.ask("Explain the Nobel Prize contributions in quantum mechanics.", mode="unified"))

print("\n=== Deep - multi-hop reasoning with LLM planner ===")
print(
    ag.ask(
        "Which physicists here won Nobel Prizes and what were they for?",
        use_llm_planner=True,
    )
)

# Out-of-scope question (grounding check)
# The retriever should tell you it doesn't know - it stays inside your knowledge
# graph instead of inventing an answer.

print("\n=== Out-of-scope question (grounding check) ===")
print(ag.ask("What was the score of last night's football game?"))

# Stop services
ag.stop()
```
