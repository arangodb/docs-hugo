---
title: Get started with the data platform
menuTitle: Get Started
weight: 15
description: >-
  Install the Arango Contextual Data Platform and run your first graph-powered
  questions with the Python client
---
## Prerequisites

- **Docker**: Docker must be installed and running.
  - macOS: [Docker Desktop](https://docs.docker.com/desktop/setup/install/mac-install/)
  - Linux: [Docker Engine](https://docs.docker.com/engine/install/)

  Allocate at least 4 CPUs and 8 GB RAM to Docker.
- **Kubernetes** (optional): If you already have access to a Kubernetes cluster,
  the installer uses it. If not, the installer automatically installs
  [Kind](https://kind.sigs.k8s.io/) and creates a local cluster for you.
- **Resources**: 2+ CPU cores, 8 GB+ RAM, and 50 GB+ free disk space.
- **Connectivity**: Active internet connection for downloading container images
  and tools.
- **License credentials**: An Arango client ID and client secret. Generate them
  from the
  [Arango developer portal](https://arangoaistg.wpenginepowered.com/developers/).
- **LLM access**: A valid OpenAI API key. Any other OpenAI-compatible endpoint
  works as well - OpenRouter, Google Gemini, Anthropic, Azure, or a private
  corporate LLM - see
  [LLM Configuration](../agentic-ai-suite/autograph/llm-configuration.md) for the
  supported providers and models.

## Install Arango Contextual Data Platform

Run the following command to install and start up the Arango Contextual Data
Platform:

```bash
curl -fsSL https://releases.license.arango.ai/releases/plg/install.sh | bash -s -- \
    --client-id "YOUR_CLIENT_ID" --client-secret "YOUR_CLIENT_SECRET"
```

If you prefer to run the installation steps manually, see
[Online setup](install-and-upgrade/online-setup.md).

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

For common setup issues, please refer to the
[Troubleshooting / Installation FAQ](https://docs.arangodb.com/troubleshooting).

## Install Python Client

To interact with your instance programmatically, install the official
Python client:

```bash
pip install https://releases.license.arango.ai/releases/plg/python_arango_ai_sdk-0.1.0-py3-none-any.whl
```

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
