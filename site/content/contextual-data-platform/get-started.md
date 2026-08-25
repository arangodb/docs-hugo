---
title: Get started with the data platform
menuTitle: Get Started
weight: 15
description: >-
  Install the Arango Contextual Data Platform, load a sample dataset, and run
  your first graph-powered questions with the Python client
---
## Prerequisites

- **Kubernetes**: Access to a Kubernetes cluster with `kubectl` and `helm`.

  If you do not have a cluster, you can use one of these options:
  - [Enable Kubernetes in Docker Desktop](https://docs.docker.com/desktop/features/kubernetes/)
  - [Kind](https://kind.sigs.k8s.io/)
  - [Minikube](https://minikube.sigs.k8s.io/docs/)
- **Resources**: Minimum 8 GB RAM and 2 CPUs available.
- **Connectivity**: Active internet connection for downloading images.
- **Permissions**: Root or `sudo` access on your local machine.
- **LLM access**: A valid OpenAI API key.

## Install Arango Contextual Data Platform

Generate your Client ID and Client Secret from the
[Arango developer portal](https://arango.ai/developers/).

Then run the following command to install the Arango Contextual Data Platform:

```bash
curl -fsSL https://get.arango.ai/install.sh | \
  ARANGO_CLIENT_ID=... ARANGO_CLIENT_SECRET=... sh
```

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
  UI:              https://127.0.0.1:8529/
  Username:         root
  Password:         test
  Services:         autorag
  Topology:         single
  ...
```

For common setup issues, please refer to the
[Troubleshooting / Installation FAQ](https://docs.arangodb.com/troubleshooting).

## Install Python Client

To interact with your instance programmatically, install the official
Python client:

```bash
%pip install python-arango --upgrade
```

## Sample Data

Download the sample dataset to use in the tutorial:

```bash
curl -L https://github.com/ArangoDB/example-datasets/releases/latest/download/data.zip -o data.zip
unzip -o data.zip -d ./files
```

Alternatively, you can download the dataset manually by clicking
[this link](https://github.com/ArangoDB/example-datasets/releases/latest/download/data.zip)
and then unzipping the file to a local directory named `files`.

## Quick Start

Follow these steps to connect and run your first graph query.

### Connect

```python
from arango import ArangoClient
client = ArangoClient('https://127.0.0.1:8529')
db = client.db('tech_corpus', username='root', password='test')
ag = db.autograph('tech-industry', openai_key='YOUR_OPENAI_API_KEY')
```

### Build

```python
ag.upload('./files')
ag.build()
```

### Query

Now the part you built all of this for. Each line below asks the corpus a
different kind of question, so run them in order - together they show what the
Context Graph can do that a keyword search cannot.

```python
# Global; Summarizes across the whole graph
ag.ask('What are the big themes here?')

# Local; One entity and its immediate neighbourhood
ag.ask('Tell me about NVIDIA and CUDA.')

# Unified; Combines passages and entities into one answer
ag.ask('Explain the iPhone.')

# Deep; Plans several hops across the graph
ag.ask('Which people led more than one company?', use_llm_planner=True)
```

## Complete Python Script

The following script combines all the steps above into a single file:

```python
# Complete Quick Start Script
from arango import ArangoClient

# 1. Connect
client = ArangoClient('https://127.0.0.1:8529')
db = client.db('tech_corpus', username='root', password='test')
ag = db.autograph('tech-industry', openai_key='YOUR_OPENAI_API_KEY')

# 2. Build
ag.upload('./files')
ag.build()

# 3. Query
# Global; Summarizes across the whole graph
response = ag.ask('What are the big themes here?')
print(response)

# Local; One entity and its immediate neighbourhood
response = ag.ask('Tell me about NVIDIA and CUDA.')
print(response)

# Unified; Combines passages and entities into one answer
response = ag.ask('Explain the iPhone.')
print(response)

# Deep; Plans several hops across the graph
response = ag.ask('Which people led more than one company?', use_llm_planner=True)
print(response)
```
