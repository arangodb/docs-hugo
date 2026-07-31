---
title: Build and query a Context Graph with AutoGraph and AutoRAG
menuTitle: Notebook Tutorial
weight: 18
description: >-
  Turn 50 documents into a Context Graph and deploy a retriever that answers
  questions none of those documents answers on its own
---
Every organization has a folder like this one. A wiki export, years of reports,
a product knowledge base. The information you need is in there somewhere, but
nobody can get an answer out of it. Search returns documents and leaves the
reading to you. A general-purpose chatbot will answer confidently and be wrong,
because it has never seen any of it.

What is missing is context. An AI can only reason about what it has been given,
and handing it a pile of files is not the same as giving it an understanding of
how the things inside those files relate to each other. That understanding is
what you are going to build here - and then hand to an agent.

You start with 50 short articles about the technology industry and finish with a
service you can ask: *which people in this corpus have led more than one
company?* No single article answers that. The answer only exists in the
connections between them.

**The notebook is the tutorial.** This page gets you to the starting line -
prerequisites, the files, a running Notebook server - and then hands over. Every
step, every API call, and every explanation lives in `Autograph_DEMO.ipynb`, so
you follow one story in one place instead of reading here and clicking there.

By the end, you will have:

- A **Context Graph** built from your documents: what they are about, and how
  the things inside them connect.
- An **AutoRAG** service deployed on the platform, configured with your LLM,
  allowing you to have an agent reason about your documents.
- Answers to questions that no single document contains.
- A set of Python calls you can lift straight into your own scripts.

{{< embed-svg "GraphRAG-Flow" "AutoGraph end-to-end flow." >}}

{{< info >}}
Two products, run back to back. **AutoGraph** is the building stage: it produces
the **Context Graph**, made of the **Corpus Graph** (how your documents are
organized into clusters and modules) and the **Knowledge Graph** (the entities,
relations, and communities extracted inside them). **AutoRAG** is the retrieval
stage: it deploys retrievers over that Context Graph so agents can answer from
it. AutoGraph can be your finish line; this tutorial continues into AutoRAG.
{{< /info >}}

The same two stages are available as a guided web interface,
[AutoGraph Studio](../../agentic-ai-suite/autograph/web-interface.md). Here, every
step is instead a Python call against the
[HTTP REST API](../../agentic-ai-suite/autograph/reference/_index.md) - so you can
automate the pipeline, inspect what comes back, and reuse the calls yourself.

## What is in the sample corpus

The tutorial ships with `corpus.zip`: 50 short, encyclopedia-style Markdown
articles about the modern technology industry. Three kinds of subject, heavily
cross-referenced:

| Subject | Examples |
|---|---|
| **Companies** | Apple, Microsoft, Alphabet, Amazon, NVIDIA, Tesla, SpaceX, OpenAI |
| **Products and services** | iPhone, iOS, Android, Windows 11, CUDA, ChatGPT, AWS, Azure, YouTube, GitHub |
| **People** | Steve Jobs, Tim Cook, Bill Gates, Satya Nadella, Sundar Pichai, Jeff Bezos, Elon Musk, Jensen Huang |

This corpus was chosen because the same entities recur across many documents.
A person founds one company and later runs another; a chip built by one vendor
powers a product sold by a different one. Those connections are what turn a
folder into a graph, and they are what the questions at the end of the notebook
are designed to exercise.

## Prerequisites

Confirm you have everything before you start; the notebook assumes all of it is
in place.

- **Arango Contextual Data Platform 4.0+** (which ships with **ArangoDB 3.12.9**
  or later) with the Agentic AI Suite enabled. If you do not have one yet, start
  with [Evaluate locally](evaluate-locally.md) to get a platform running on a
  local Kubernetes cluster.
- **Platform credentials** - a username and password with permission to create
  projects and deploy services.
- **An OpenAI API key**, used for both chat and embeddings. The tutorial is
  written for OpenAI throughout.

{{< tip >}}
The sample corpus is Markdown and runs fine on a CPU-only cluster. If you later
point AutoGraph at PDFs or Office documents at scale, GPUs are recommended -
ingesting those formats on CPU can be slow even for small document sets.
{{< /tip >}}

## Step 1: Get the notebook and the sample corpus

Download both files:

- `Autograph_DEMO.ipynb` - the tutorial itself.
- `corpus.zip` - the 50 sample articles. Unzipping it
  produces a `files/` folder.

## Step 2: Start a Notebook server

The notebook runs in the platform's integrated
[Notebook servers](../../agentic-ai-suite/notebook-servers.md), where network
access, Python, and the platform endpoint are already set up for you.

1. In the Arango Contextual Data Platform web interface, expand **AI Tools** in
   the main navigation. **Notebook servers** should now be selected.
2. Create a notebook server and click its ID to open
   the Jupyter interface.
3. Upload `Autograph_DEMO.ipynb` into the file browser.
4. Upload and unzip `corpus.zip` next to the notebook, so that a `files/` folder
   sits beside it.

## Step 3: Create the `env` file

The notebook reads your credentials, database, and file path from one file, so
you point it at your environment in a single place rather than editing code
cells. Create a file named `env` next to the notebook in the Jupyter file
browser:

```sh
USERNAME = "root"
PASSWORD = "<your-password>"
DB_NAME = "tech_corpus"
PROJECT_NAME = "tech-industry"
LLM_API_KEY = "sk-..."
FILES_PATH = "./files"

# Only if you run this from your own Jupyter, outside the platform:
# SERVER_URL = "https://<EXTERNAL_ENDPOINT>:8529"
```

| Variable | Purpose |
|---|---|
| `USERNAME` / `PASSWORD` | Platform credentials used to obtain the access token. |
| `DB_NAME` | The ArangoDB database where we want to store the Context Graph. |
| `PROJECT_NAME` | The project name. It becomes the prefix for every collection AutoGraph creates - `tech-industry_sources`, `tech-industry_domains`, and so on. |
| `LLM_API_KEY` | Your own OpenAI key. It is stored in the Secrets Manager, not hard-coded into requests. |
| `FILES_PATH` | Path to the documents to ingest - `./files` for the sample corpus. |
| `SERVER_URL` | **Only set this if you run the notebook from your own Jupyter**, outside the platform. Inside a platform Notebook server the endpoint is already provided. |

{{< warning >}}
`VERIFY_TLS` is set to `False` in the notebook so it works against a platform
with a self-signed certificate, such as a local evaluation cluster. For a
production endpoint with a trusted certificate, set it to `True`.
{{< /warning >}}

## Step 4: Run the notebook

Open `Autograph_DEMO.ipynb` and work through it from the top. From here, the
notebook is your guide - it explains each stage as you reach it.

Two things worth knowing before you start:

- **Run the cells top to bottom, one at a time. Do not use Run All.** The corpus
  build, the strategy analysis, and the import all run in the background. The
  notebook waits for each one and shows a spinner while it works, but a stage
  started before the previous one has finished will fail.
- **Budget around 30 to 45 minutes** for the sample corpus, most of it spent
  waiting on the import. Times vary with your cluster and LLM provider.

## What's next

Once you have asked your Context Graph a question it could only answer by
connecting documents:

- Point the notebook at **your own documents** by changing `FILES_PATH`, in any
  of the
  [supported file formats](../../agentic-ai-suite/autograph/setup.md#supported-file-formats).
  This is the moment the product stops being a demo.
- Run the same two stages through the guided
  [AutoGraph Studio web interface](../../agentic-ai-suite/autograph/web-interface.md).
- Learn how the graph is organized in the
  [Architecture](../../agentic-ai-suite/autograph/architecture.md) overview and
  the [Design Guide](../../agentic-ai-suite/autograph/design-guide.md).
- Tune retrieval with the
  [Retriever parameters](../../agentic-ai-suite/retriever/parameters.md), and use a
  different LLM provider or models.
- Work through the endpoints in the
  [API Reference](../../agentic-ai-suite/autograph/reference/_index.md).
