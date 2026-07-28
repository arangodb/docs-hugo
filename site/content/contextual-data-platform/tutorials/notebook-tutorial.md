---
title: Build a Context Graph with AutoGraph from a Jupyter notebook
menuTitle: Notebook Tutorial
weight: 18
description: >-
  Set up a Notebook server, load the sample corpus, and run the AutoGraph
  notebook that turns a folder of documents into a queryable Context Graph
---
Fifty documents go in; a graph you can ask questions in plain English comes out.
That is the whole of this tutorial, and it runs inside a Jupyter notebook.

**The notebook is the tutorial.** This page gets you to the starting line -
prerequisites, the files, a running Notebook server - and then hands you over.
Every pipeline step, every API call, and every explanation lives in
`Autograph_DEMO.ipynb`, so you follow one story in one place instead of reading
here and clicking there.

By the end of the notebook, you will have:

- An AutoGraph service deployed on the platform, configured with your LLM.
- Your documents uploaded through the File Manager and embedded into a Corpus Graph.
- A per-domain RAG strategy chosen automatically for your content.
- A Knowledge Graph built by the orchestrated GraphRAG importers - together with
  the Corpus Graph, this is your **Context Graph**.
- A running retriever, deployed with AutoRAG, that answers questions about your
  documents.

{{< embed-svg "GraphRAG-Flow" "AutoGraph end-to-end flow." >}}

{{< info >}}
The **Context Graph** is everything AutoGraph builds for a project. It is made
of two graphs that keep their names: the **Corpus Graph** (how your documents
are organized into clusters and modules) and the **Knowledge Graph** (the
entities, relations, and communities extracted inside each partition). AutoGraph
builds the Context Graph; you then use **AutoRAG** to deploy retrievers over it.
{{< /info >}}

This is the same workflow you would run in
[AutoGraph Studio](../../agentic-ai-suite/autograph/web-interface.md), the
unified web interface, but here every step is a Python call against the
[HTTP REST API](../../agentic-ai-suite/autograph/reference/_index.md) - so you
can automate the pipeline, inspect intermediate results, and reuse the calls in
your own scripts.

## What is in the sample corpus

The tutorial ships with `corpus.zip`: 50 short, encyclopedia-style Markdown
articles about the modern technology industry. Three kinds of subject, heavily
cross-referenced:

| Subject | Examples |
|---|---|
| **Companies** | Apple, Microsoft, Alphabet, Amazon, NVIDIA, Tesla, SpaceX, OpenAI |
| **Products and services** | iPhone, iOS, Android, Windows 11, CUDA, ChatGPT, AWS, Azure, YouTube, GitHub |
| **People** | Steve Jobs, Tim Cook, Bill Gates, Satya Nadella, Sundar Pichai, Jeff Bezos, Elon Musk, Jensen Huang |

It is a deliberately good fit for a graph: the same entities recur across many
documents, so AutoGraph has real relationships to find - a person who founded
one company and now runs another, a chip that powers a product from a different
vendor. A pile of unrelated documents would produce a graph with nothing
interesting in it.

You can point the notebook at your own documents instead by changing one path in
the `env` file, in any of the
[supported file formats](../../agentic-ai-suite/autograph/setup.md#supported-file-formats).
Expect different answers to the example questions if you do.

## Prerequisites

Confirm you have everything before you start; the notebook assumes all of it is
in place.

- **Arango Contextual Data Platform 4.0+** (which ships with **ArangoDB 3.12.9**
  or later) with the Agentic AI Suite enabled, reachable from where you run the
  notebook. If you do not have one yet, start with
  [Evaluate locally](evaluate-locally.md) to get a platform running on a local
  Kubernetes cluster.
- **Platform credentials** - a username and password with permission to create
  projects and deploy services.
- **LLM and embedding API access** - this tutorial uses OpenAI-compatible
  endpoints and an API key. Any OpenAI-compatible provider works.

{{< tip >}}
For large-scale ingestion of PDF and Office documents, GPUs are recommended.
Ingestion of those formats on CPU-only clusters can be slow even for small
document sets. The Markdown sample corpus runs fine on CPU.
{{< /tip >}}

## Step 1: Get the notebook and the sample corpus

Download both files:

- [`Autograph_DEMO.ipynb`](/notebooks/Autograph_DEMO.ipynb) - the tutorial itself.
- [`corpus.zip`](/notebooks/corpus.zip) - the 50 sample articles. Unzipping it
  produces a `files/` folder.

## Step 2: Start a Notebook server

The notebook is designed to run in the platform's integrated
[Notebook servers](../../agentic-ai-suite/notebook-servers.md), where network
access and Python are already set up.

1. In the Arango Contextual Data Platform web interface, expand **AI Tools** in
   the main navigation and click **Notebook servers**.
2. Create a notebook server, or open an existing one, and click its ID to open
   the Jupyter interface.
3. Upload `Autograph_DEMO.ipynb` into the file browser.
4. Upload and unzip `corpus.zip` next to the notebook, so that a `files/` folder
   sits beside it.

{{< info >}}
The notebook defines its own HTTP helpers, so it also runs from any local
Jupyter environment that can reach the platform endpoint. The only package it
needs beyond the standard library is `python-dotenv`; the first cell installs it.
{{< /info >}}

## Step 3: Create the `env` file

The notebook reads your platform, database, credentials, and file path from one
file, so you point it at your environment in a single place rather than editing
code cells. Create a file named `env` next to the notebook in the Jupyter file
browser:

```sh
SERVER_URL = "https://<EXTERNAL_ENDPOINT>:8529"
USERNAME = "root"
PASSWORD = "<your-password>"
DB_NAME = "your-database"
PROJECT_NAME = "your-autograph-project"
LLM_API_KEY = "sk-..."
FILES_PATH = "./files"
```

| Variable | Purpose |
|---|---|
| `SERVER_URL` | Base URL of your platform gateway (port `8529`). |
| `USERNAME` / `PASSWORD` | Platform credentials used to obtain the access token. |
| `DB_NAME` | The ArangoDB database that holds the project, documents, and Context Graph. |
| `PROJECT_NAME` | The GenAI project name. It becomes the prefix for all collections AutoGraph creates (for example, `your-project_sources`, `your-project_domains`). |
| `LLM_API_KEY` | Your chat and embedding API key. It is stored in the Secrets Manager, not hard-coded into requests. |
| `FILES_PATH` | Path to the folder of documents to ingest - `./files` for the sample corpus. |

The LLM provider and models are set separately, in the AutoGraph deployment cell
inside the notebook. It is pre-filled for OpenAI; to use a different
OpenAI-compatible provider, edit the provider, model, and API URL fields there.

{{< warning >}}
`VERIFY_TLS` is set to `False` in the notebook so it works against a platform
with a self-signed certificate, such as a local evaluation cluster. For a
production endpoint with a trusted certificate, set it to `True`.
{{< /warning >}}

## Step 4: Run the notebook

Open `Autograph_DEMO.ipynb` and work through it from the top. From here, the
notebook is your guide - it explains each service as you meet it.

Two things worth knowing before you start:

- **Run the cells top to bottom, one at a time. Do not use Run All.** The corpus
  build, the RAG Strategizer, and the import all run in the background. The
  notebook waits for each one and shows a spinner while it works, but a stage
  started before the previous one finished will fail.
- **Budget around 30 to 45 minutes** for the sample corpus, most of it spent
  waiting on the import. Times vary with your cluster and LLM provider.

## What's next

Once you have queried your Context Graph:

- Try the same workflow through the guided
  [AutoGraph Studio web interface](../../agentic-ai-suite/autograph/web-interface.md).
- Learn how the graph is organized in the
  [Architecture](../../agentic-ai-suite/autograph/architecture.md) overview and
  the [Design Guide](../../agentic-ai-suite/autograph/design-guide.md).
- Tune retrieval with the
  [Retriever parameters](../../agentic-ai-suite/retriever/parameters.md) and
  search methods.
- Dive into the endpoints in the
  [API Reference](../../agentic-ai-suite/autograph/reference/_index.md).
