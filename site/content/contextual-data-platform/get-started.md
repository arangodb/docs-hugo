---
title: Get started with the data platform
menuTitle: Get Started
weight: 15
description: >-
  Install the Arango Contextual Data Platform, load a sample dataset, and run
  your first graph-powered questions with the Python client
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
  from the [Arango developer portal](https://arango.ai/developers/).
- **LLM access**: A valid OpenAI API key. Any other OpenAI-compatible endpoint
  works as well - OpenRouter, Google Gemini, Anthropic, Azure, or a private
  corporate LLM - see
  [LLM Configuration](../agentic-ai-suite/autograph/llm-configuration.md) for the
  supported providers and models.

## Install Arango Contextual Data Platform

Run the following command to install the Arango Contextual Data Platform:

```bash
curl -fsSL https://releases.license.arango.ai/releases/plg/install.sh | bash -s -- \
    --client-id "YOUR_CLIENT_ID" --client-secret "YOUR_CLIENT_SECRET"
```

If you prefer to run the installation steps manually, see
[Online setup](install-and-upgrade/online-setup.md).

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

## Sample Data

Download the sample dataset to use in the tutorial:

```bash
curl -L https://github.com/arangodb/docs-tutorials/releases/download/autograph-v1/corpus.zip -o corpus.zip
unzip -o corpus.zip -d ./files
```

This extracts a `tech_articles` folder with 51 Markdown articles about the tech
industry into `./files`.

Alternatively, you can download the dataset manually by clicking
[this link](https://github.com/arangodb/docs-tutorials/releases/download/autograph-v1/corpus.zip)
and then unzipping the file to a local directory named `files`.

## Quick Start

Follow these steps to connect and run your first graph query.

{{< info >}}
The client connects through the port-forward that the installer started. If it
has dropped, re-run
`kubectl port-forward -n arango service/deployment-ea 8529:8529`.
{{< /info >}}

### Connect

```python
from arango_ai import ArangoAIClient

client = ArangoAIClient("https://localhost:8529", verify_tls=False)
db = client.db('tech_corpus', username='root', password='test')
ag = db.autograph('tech-industry', llm_api_key='YOUR_LLM_API_KEY')
```

### Build

```python
ag.upload('./files/tech_articles')
ag.build()
```

### Query

Now the part you built all of this for. Each line below asks the corpus a
different kind of question, so run them in order - together they show what the
Context Graph can do that a keyword search cannot.

```python
# Global; Summarizes across the whole graph
response = ag.ask('What are the big themes here?')

# Local; One entity and its immediate neighbourhood
response = ag.ask('Tell me about NVIDIA and CUDA.')

# Unified; Combines passages and entities into one answer
response = ag.ask('Explain the iPhone.')

# Deep; Plans several hops across the graph
response = ag.ask('Which people led more than one company?', use_llm_planner=True)
```

### Cleanup

```python
ag.stop()
```

## Complete Python Script

The following script combines all the steps above into a single file:

```python
# Complete Quick Start Script
import logging

from arango_ai import ArangoAIClient

# Enable SDK logs so you can see progress instead of a blank screen
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

# 1. Connect
print("Connecting to ArangoDB...")
client = ArangoAIClient("https://localhost:8529", verify_tls=False)
db = client.db('tech_corpus', username='root', password='test')
ag = db.autograph('tech-industry', llm_api_key='YOUR_LLM_API_KEY')
print("Connected.")

# 2. Build
print("Uploading files...")
ag.upload('./files/tech_articles')
print("Upload complete. Building knowledge graph (this may take several minutes)...")
ag.build()
print("Build complete.")

# 3. Query
print("\n--- Query 1: Global (summarizes across the whole graph) ---")
response = ag.ask('What are the big themes here?')
print(response)

print("\n--- Query 2: Local (one entity and its immediate neighbourhood) ---")
response = ag.ask('Tell me about NVIDIA and CUDA.')
print(response)

print("\n--- Query 3: Unified (combines passages and entities) ---")
response = ag.ask('Explain the iPhone.')
print(response)

print("\n--- Query 4: Deep (plans several hops across the graph) ---")
response = ag.ask('Which people led more than one company?', use_llm_planner=True)
print(response)

# Clean up services when done
print("\nStopping services...")
ag.stop()
print("Done.")
```
