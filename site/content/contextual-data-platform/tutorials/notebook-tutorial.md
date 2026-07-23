---
title: Build a knowledge graph with AutoGraph from a Jupyter notebook
menuTitle: Notebook Tutorial
weight: 18
description: >-
  A hands-on tutorial that takes you from a folder of documents to a queryable
  knowledge graph, driving the full AutoGraph pipeline from a Jupyter notebook
  with Python and the HTTP REST API
---
In this tutorial, we go from a folder of raw documents to a queryable knowledge
graph using AutoGraph, driving every step from a Jupyter notebook. We run the
ready-made `Autograph_DEMO.ipynb` notebook cell by cell in a platform Notebook
server, meeting each service that AutoGraph orchestrates along the way: the
Secrets Manager for the LLM key, the File Manager for the documents, the corpus
build that clusters them, the RAG Strategizer that picks a retrieval strategy,
and the Retriever we finally chat with.

This is the same workflow you would run in the
[web interface](../../agentic-ai-suite/autograph/web-interface.md), but here
every step is a Python call against the
[HTTP REST API](../../agentic-ai-suite/autograph/reference/_index.md) - so you
can automate the pipeline, inspect intermediate results, and reuse the calls in
your own scripts.

By the end, you will have:

- An AutoGraph service deployed on the platform, configured with your LLM.
- Your documents uploaded through the File Manager and embedded into a Corpus Graph.
- A per-domain RAG strategy chosen automatically for your content.
- A knowledge graph built by the orchestrated GraphRAG importers.
- A running Retriever service you can query in natural language.
- A simple way to remove everything when you are done.

The **Expected output** blocks in this tutorial are illustrative - IDs, counts,
and generated text will differ on your run.

{{< embed-svg "GraphRAG-Flow" "AutoGraph end-to-end flow." >}}

## Step 1: Check the prerequisites

Confirm you have everything before you start; the rest of this tutorial assumes
all of it is in place.

- **Arango Contextual Data Platform 4.0+** (which ships with **ArangoDB 3.12.9**
  or later) with the Agentic AI Suite enabled, reachable from where you run the
  notebook.
- **A running Notebook server** in that platform. This tutorial is designed to
  run in the platform's integrated
  [Notebook servers](../../agentic-ai-suite/notebook-servers.md), where network
  access and Python are already set up. You can also run it from any local
  Jupyter environment that can reach the platform endpoint.
- **Platform credentials** - a username and password with permission to create
  projects and deploy services.
- **LLM and embedding API access** - this tutorial uses OpenAI-compatible
  endpoints and an API key. Any OpenAI-compatible provider works.
- **A folder of documents** to ingest, in one of the
  [supported file formats](../../agentic-ai-suite/autograph/setup.md#supported-file-formats).
  To reproduce this tutorial exactly, download the ready-made sample corpus
  `corpus.zip` (50 short tech articles); unzipping it
  produces a `files/` folder.
- **The notebook file**: download
  `Autograph_DEMO.ipynb`.

{{< tip >}}
For large-scale ingestion of PDF and Office documents, GPUs are recommended.
Ingestion of those formats on CPU-only clusters can be slow even for small
document sets.
{{< /tip >}}

## Step 2: Open the notebook

Open the notebook in a Notebook server so that this page becomes your guide to
what each cell does, rather than something you copy from.

1. In the Arango Contextual Data Platform web interface, expand **AI Tools** in
   the main navigation and click **Notebook servers**.
2. Create a notebook server, or open an existing one, and click its ID to open
   the Jupyter interface. For details, see
   [Notebook servers](../../agentic-ai-suite/notebook-servers.md).
3. Download `Autograph_DEMO.ipynb, upload it
   into the file browser, and open it.
4. Put the documents you want to ingest in a `files/` folder next to the
   notebook. To use the sample corpus, download
   `corpus.zip` and unzip it here - it expands to a
   ready-made `files/` folder of 50 articles.

Run the cells **top to bottom**, one at a time. Do not use **Run All**: the
corpus build, the RAG Strategizer, and the orchestration run in the background,
so you re-run each status cell until it reports the stage is finished before
continuing to the next one.

{{< info >}}
The notebook defines its own HTTP helpers (`authenticate`, `send_request`,
`start_service`, `stop_service`, and `ag_request`), so it runs from any Jupyter
environment, including one outside the platform. The only packages it needs are
`python-dotenv` and `requests`; the first cell installs both.
{{< /info >}}

## Step 3: Configure platform and LLM access

The notebook reads your platform, database, credentials, and files from a file,
so you point it at your environment in one place rather than by editing those
values in code cells. The LLM provider and models are set separately, in the
deployment cell in Step 7 (pre-filled for OpenAI).

Create a file named `env` in the same directory as the notebook and fill in your
own values:

```sh
SERVER_URL = "https://<EXTERNAL_ENDPOINT>:8529"
USERNAME = "root"
PASSWORD = "<your-password>"
DB_NAME = "your-database"
PROJECT_NAME = "your-autograph-project"
LLM_API_KEY = "sk-..."
FILES_PATH = "./files"
```

Each value is used as follows:

| Variable | Purpose |
|---|---|
| `SERVER_URL` | Base URL of your platform gateway (port `8529`). |
| `USERNAME` / `PASSWORD` | Platform credentials used to obtain the access token. |
| `DB_NAME` | The ArangoDB database that holds the project, documents, and knowledge graph. |
| `PROJECT_NAME` | The GenAI project name. It becomes the prefix for all collections AutoGraph creates (for example, `your-project_sources`, `your-project_domains`). |
| `LLM_API_KEY` | Your chat and embedding API key. It is stored in the Secrets Manager, not hard-coded into requests. |
| `FILES_PATH` | Path to the folder of documents to ingest (top-level files only). |

Run the first two code cells. They install `python-dotenv`, import the
libraries, and load the `env` file with
`load_dotenv(dotenv_path="./env", override=True)`. Every later cell reads these
values through `os.environ`, so once the `env` file is correct you can run the
rest of the notebook without editing code, as long as you keep the OpenAI
defaults in Step 7. To use a different OpenAI-compatible provider or models, edit
the provider, model, and API URL fields in that deployment cell.

{{< warning >}}
`VERIFY_TLS` is set to `False` in the notebook so it works against a platform
with a self-signed certificate, such as a local evaluation cluster. For a
production endpoint with a trusted certificate, set it to `True`.
{{< /warning >}}

## Step 4: Authenticate

Every AutoGraph API call needs a bearer token obtained from the platform's
`/_open/auth` endpoint. The setup cell defines the notebook's helper functions;
the next cell obtains and stores the token:

```py
authenticate(os.environ["USERNAME"], os.environ["PASSWORD"])
```

Expected output:

```
Authenticated.
```

If instead you see a connection or name-resolution error, `SERVER_URL` is wrong
or unreachable; fix it in `env`, re-run the load cell, and try again. The token
is short-lived, so several later cells re-call `authenticate(...)` before a long
step. If you ever get an authentication error partway through, re-run the nearest
`authenticate(...)` cell and continue.

## Step 5: Create a project

Create a GenAI project. It keeps your datasets and configuration isolated, and
its name prefixes every collection AutoGraph creates. This is the notebook
equivalent of creating a project in the web interface.

```py
project_payload = {
    "project_name": os.environ["PROJECT_NAME"],
    "project_db_name": os.environ["DB_NAME"],
    "project_type": "autograph",
    "project_description": "Autograph_DEMO",
}
project_response = send_request("/gen-ai/v1/project", project_payload, "POST")
```

Expected output:

```
Creating project 'your-autograph-project' in database 'your-database'...
Project 'your-autograph-project' created successfully!
```

The cell is safe to re-run. If the project already exists, it catches the error
and prints `Project '...' already exists. Continuing...` instead.

{{< info >}}
Each project should have only one AutoGraph service. Starting multiple AutoGraph
services under the same project is not supported and causes conflicts.
{{< /info >}}

## Step 6: Store your API key in the Secrets Manager

Instead of passing raw keys around, store the key once and reference it by a
profile ID. The
[Secrets Manager](../../platform-suite/secrets-manager.md) returns the ID you
reuse for both chat and embeddings.

```py
secret_resp = send_request(
    "/gen-ai/v1/secrets",
    {
        "profile_type": "LLM",
        "name": "API_KEY",
        "secret_data": os.environ["LLM_API_KEY"],
        "description": "Autograph_DEMO",
        "provider": "openai",
    },
)
profile_id = secret_resp["profile"]["profileId"]
print(profile_id)
```

Expected output (the profile ID, reused by the deployment steps):

```
a1b2c3d4-....
```

## Step 7: Deploy the AutoGraph service

Deploy the AutoGraph service as a pod, using the secret profile from Step 6 for
both the chat and embedding models. This is the equivalent of **Deploy
AutoGraph** in the web interface.

```py
myDict = {
    "db_name": os.environ["DB_NAME"],
    "genai_project_name": os.environ["PROJECT_NAME"],
    "chat_api_provider": "openai",
    "embedding_api_provider": "openai",
    "chat_model": "gpt-5.4-nano",
    "embedding_model": "text-embedding-3-small",
    "chat_api_url": "https://api.openai.com/v1",
    "embedding_api_url": "https://api.openai.com/v1",
    "chat_secret_profile_id": profile_id,
    "embedding_secret_profile_id": profile_id,
    "profiles": "",  # Kubernetes resource profile, e.g. "memory-16gi-cpu-2"; "" = platform default
}

response = start_service("arangodb-autograph", myDict)
autograph_service_id = response["serviceInfo"]["serviceId"].split("-")[-1]
```

Expected output (abbreviated - the service ID varies):

```
{'serviceInfo': {'serviceId': 'arangodb-autograph-xxxxx', 'status': 'deploying', ...}}
```

The startup parameters are:

| Parameter | Purpose |
|---|---|
| `db_name` | ArangoDB database (same as the GenAI project and File Manager). |
| `genai_project_name` | Project name from Step 5 - prefixes AutoGraph collections. |
| `chat_api_provider` / `embedding_api_provider` | Provider names (this tutorial uses `openai`). |
| `chat_model` / `embedding_model` | Models for chat and embeddings. |
| `chat_api_url` / `embedding_api_url` | Provider API base URLs. |
| `chat_secret_profile_id` / `embedding_secret_profile_id` | Secrets Manager profile ID from Step 6. |
| `profiles` | Kubernetes resource profile for the pod. Leave `""` for the default. |

After deployment, all AutoGraph-specific calls go through a pod-scoped URL,
`{SERVER_URL}/autograph/{autograph_service_id}/v1/...`, which the `ag_request`
helper builds for you. Wait for the pod to become ready and confirm it is
healthy:

```py
health_response = ag_request("GET", "/v1/health")
```

Expected output:

```
{'status': 'SERVING'}
```

If the health check fails, the service is still starting; wait a few seconds and
re-run the cell.

## Step 8: Upload your documents

Upload the files in `FILES_PATH` to the
[File Manager](../../platform-suite/file-manager/_index.md), a separate platform
service. The upload returns a list of file IDs (`rag_uploaded_file_ids`) that
you pass to the corpus build in the next step.

```py
# Uploads every top-level file in FILES_PATH and collects their IDs.
```

Expected output (each file as it uploads, then the list of IDs):

```
1/3 activision_blizzard.md
2/3 alphabet_inc.md
3/3 amazon.md
['12345', '12346', '12347']
```

{{< info >}}
Files uploaded to the File Manager are shared across all projects in the same
database, exactly as in the web interface. Only top-level files in the folder are
uploaded; dotfiles are skipped.
{{< /info >}}

## Step 9: Build the corpus

Start an asynchronous corpus build from the uploaded files. The build embeds each
document, finds similarity relationships (vector plus lexical search fused with
Reciprocal Rank Fusion), and clusters documents into domains with the Leiden
algorithm. For the full pipeline, see
[Corpus Build](../../agentic-ai-suite/autograph/reference/corpus-build.md).

```py
build_payload = {
    "embedding_strategy": "first_chunk",
    "file_ids": rag_uploaded_file_ids,
    "strategy": {
        "top_k": 7,            # nearest neighbors kept per document
        "cluster_threshold": 1,  # 1 = single-level, 2 = two-level reclustering
    },
}
build_corpus_graph = ag_request("POST", "/v1/corpus/builds", payload=build_payload)
pprint(build_corpus_graph)
```

Expected output:

```
{'corpusBuildId': '...', 'status': 'running'}
```

The call returns immediately with a build ID. Poll the build status, re-running
the cell every 10-30 seconds until `status` is `completed`:

```py
corpus_build_id = build_corpus_graph["corpusBuildId"]

build_status = ag_request("GET", f"/v1/corpus/builds/{corpus_build_id}")
pprint(build_status)
```

Expected output (once finished):

```
{'status': 'completed', ...}
```

{{< warning >}}
Do not start Step 10 while the build is still running. The strategizer fails with
`409` if a corpus build is in progress. If the status becomes `failed`, check the
`message` and `error` fields in the response; for provider failures, `error_code`
carries a machine-readable value such as `LLM_AUTHENTICATION_FAILED`,
`LLM_RATE_LIMITED`, or `LLM_QUOTA_EXCEEDED`.
{{< /warning >}}

## Step 10: Generate strategies

Run the RAG Strategizer. For each domain cluster it scores complexity, extracts
entity types, and assigns either **VectorRAG** (simpler, faster) or
**FullGraphRAG** (richer, more expensive), writing the results to the project's
`rags` collection. See
[RAG Strategizer](../../agentic-ai-suite/autograph/reference/rag-strategizer.md)
for details.

```py
rag_payload = {
    "fullGraphRagStrategy": "very high",
}
rag_response = ag_request("POST", "/v1/rag-strategizer/analyze", payload=rag_payload)
```

The `fullGraphRagStrategy` hint controls the split between the two strategies:

| Value | FullGraphRAG | VectorRAG | Description |
|---|---|---|---|
| `"very low"` | 0% | 100% | All clusters use VectorRAG. |
| `"low"` | 25% | 75% | Only the most complex quarter gets FullGraphRAG. |
| `"high"` | 75% | 25% | Most clusters get FullGraphRAG. |
| `"very high"` (default) | 100% | 0% | All clusters use FullGraphRAG. |
| `"X%"` (e.g. `"70%"`) | X% | (100-X)% | Custom split. |

`analyze` starts a background job and returns immediately. Wait for it to
finish, then read the stored strategies with a GET, re-running until the rows
appear:

```py
rag_response = ag_request("GET", "/v1/rag-strategizer/strategy")
pprint(rag_response)
```

Expected output (one row per domain):

```
[{'strategy_type': 'FullGraphRAG', 'rag_partition_id': 'default_0_a', ...}, ...]
```

{{< warning >}}
Wait until the strategies appear before running orchestration. Running
orchestration too early returns `400` or processes only part of the jobs.
{{< /warning >}}

## Step 11: Import into the knowledge graph

Orchestration spawns GraphRAG importer worker pods, loads the jobs the
strategizer wrote to `rags`, and runs each domain through the appropriate import
pipeline. This is the equivalent of **Start Import** in the web interface. See
[Orchestration](../../agentic-ai-suite/autograph/reference/orchestration.md).

```py
orchestrate_payload = {
    "chat_secret_profile_ids": [profile_id],
    "embedding_secret_profile_id": profile_id,
    "max_retries": 1,
    "replicas": 2,
    # "partition_ids": ["...", "..."],  # optional: orchestrate only these partitions
}
orchestrate_response = ag_request("POST", "/v1/orchestrate", payload=orchestrate_payload)
```

The orchestration parameters are:

| Parameter | Description | Default |
|---|---|---|
| `replicas` | Number of importer worker pods to spawn. | `1` |
| `max_retries` | Retry attempts per failed job. | `3` |
| `chat_secret_profile_ids` | Secrets Manager profile IDs for the chat LLM. | -- |
| `embedding_secret_profile_id` | Secrets Manager profile ID for embeddings. | -- |
| `partition_ids` | Only orchestrate jobs whose `rag_partition_id` is in this list; empty means all. | all |

The call returns an orchestration ID immediately while the import runs in the
background. Only one orchestration run should be active at a time.

Expected output:

```
{'orchestration_id': '...'}
```

The import runs asynchronously, so you must wait for it to finish before
deploying the Retriever. Poll the project metadata endpoint
(`GET /gen-ai/v1/project_by_name/{db}/{project}`) and re-run it until every
importer service reports `service_completed`:

```py
project = send_request(
    f"/gen-ai/v1/project_by_name/{os.environ['DB_NAME']}/{os.environ['PROJECT_NAME']}",
    method="GET",
)
statuses = [
    svc.get("status", {}).get("status")
    for svc in project.get("projectMetadata", {}).get("importerServices", [])
]
print(statuses)
```

{{< warning >}}
Do not deploy the Retriever until the import is complete: a Retriever started
against a partial graph returns incomplete answers. Re-run the poll every
10 - 30 seconds until every importer service reports `service_completed`. A
terminal `*_failed` status (for example, `service_failed` or
`import_graph_to_adb_failed`) means the import failed; see
[Error handling](../../agentic-ai-suite/importer/reference/error-handling.md)
before retrying.
{{< /warning >}}

{{< tip >}}
You can explore the resulting knowledge graph at any time, including while the
import is still running, in the
[Graph Visualizer](../../platform-suite/graph-visualizer.md).
{{< /tip >}}

## Step 12: Deploy the Retriever and query the graph

Deploy the [Retriever service](../../agentic-ai-suite/retriever/) to query your
knowledge graph. It starts the same way as AutoGraph, with the same LLM
configuration:

```py
retriever_response = start_service("arangodb-graphrag-retriever", myDict)
retriever_service_id = retriever_response["serviceInfo"]["serviceId"].split("-")[-1]
```

Expected output (abbreviated - the service ID varies):

```
{'serviceInfo': {'serviceId': 'arangodb-graphrag-retriever-xxxxx', 'status': 'deploying', ...}}
```

Confirm the service is healthy, then send a query. Queries go to
`/graphrag/retriever/{retriever_service_id}/v1/graphrag-query`:

```py
health_response = send_request(
    f"/graphrag/retriever/{retriever_service_id}/v1/health", method="GET"
)

myBody = {
    "query": "What are the dominant themes across the imported documentation?",
    "query_type": 1,
}
retrieverResponse = send_request(
    f"/graphrag/retriever/{retriever_service_id}/v1/graphrag-query", myBody, "POST"
)
pprint(retrieverResponse)
```

Expected output (the answer drawn from your knowledge graph):

```
{'result': 'The documents center on ...'}
```

Pick the `query_type` that fits your question:

| Query type | `query_type` | Best for |
|---|---|---|
| **Global** | `1` | Broad themes and summaries across the whole graph. |
| **Local** | `2` | Specific entities, relationships, and details. |
| **Unified** | `3` | Combined chunk plus entity search for a single comprehensive answer. |
| **Deep** | `2` with `use_llm_planner: true` | Complex questions that need multi-step, LLM-planned retrieval. |

Optional request fields include `include_metadata` (return citations and an
execution log) and `use_cache` (reuse answers to similar questions). For the full
list, see the
[Retriever parameters](../../agentic-ai-suite/retriever/parameters.md).

{{< tip >}}
The service can report healthy a moment before `/v1/graphrag-query` is fully
ready. If a query fails right after deployment, wait a few seconds and retry.
{{< /tip >}}

The notebook includes a query cell for each search mode - Global, Local,
Unified, and Deep - so you can run whichever fits your question and see the
answer come straight from the knowledge graph you built. This is the payoff
moment: you are now asking your own documents questions and getting answers back.

## What's next

You now have a full AutoGraph pipeline you can run from Python, ending in a
knowledge graph you can query. From here:

- Try the same workflow through the guided
  [Web Interface](../../agentic-ai-suite/autograph/web-interface.md).
- Learn how the graph is organized in the
  [Architecture](../../agentic-ai-suite/autograph/architecture.md) overview and
  the [Design Guide](../../agentic-ai-suite/autograph/design-guide.md).
- Tune retrieval with the
  [Retriever parameters](../../agentic-ai-suite/retriever/parameters.md) and
  search methods.
- Dive into the endpoints in the
  [API Reference](../../agentic-ai-suite/autograph/reference/_index.md).

## Clean up

The knowledge graph persists in ArangoDB, but the service pods keep consuming
cluster resources. When you are finished, stop them:

```py
stop_service(f"arangodb-autograph-{autograph_service_id}")
stop_service(f"arangodb-graphrag-retriever-{retriever_service_id}")
```

Your ArangoDB data - collections, graphs, and documents - persists after the
pods are stopped. Stopping a service does not delete your corpus graph or
knowledge graph; you can redeploy a service later and keep querying. If an
orchestration run was interrupted, stop any leftover importer services through
the Gen-AI service API.
