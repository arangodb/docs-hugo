---
title: GraphRAG Notebook Tutorial
menuTitle: Notebook Tutorial
description: >-
  A step-by-step guide to building knowledge graphs from your documents using
  the GraphRAG Importer
weight: 25
---
## Tutorial overview

This tutorial walks you step-by-step through building a knowledge graph from
your documents using the GraphRAG Importer service of the Arango Contextual
Data Platform. It covers service setup, document preprocessing, single-file and
multi-file imports, custom prompts, and verification, all with ready-to-run
Python examples.

You will learn how to:
- Authenticate with the GenAI API and send requests to the platform.
- Create a GenAI project and start the Importer service with LLM configuration.
- List, update, and stop running services.
- Base64-encode single files or an entire folder of documents for import.
- Run single-file and multi-file imports with custom parameters and prompts.
- Track long-running import jobs and verify the generated collections.

## Prerequisites

Before you begin, ensure you have the following:
- **ArangoDB deployment:** Access to the Arango Contextual Data Platform where
  you can create and manage databases. You need the server URL, your username,
  and a database you can write to.
- **Python environment:** A Python 3.x environment with `pip` installed.
- **Jupyter Notebook:** This tutorial is designed to be run in the integrated
  Notebook servers of the Arango Contextual Data Platform.
- **LLM access:** An API key for an OpenAI-compatible provider (or a reachable
  Triton Inference Server) for chat and embedding models.
- **`.env` file:** Store the following variables in a file named `your_env_file`
  next to the notebook: `SERVER_URL`, `USERNAME`, `PASSWORD`, `DB_NAME`,
  `DB_PROJECT_NAME`, and `OPENAI_API_KEY`.

## ArangoDB collections after import

The Importer creates the following collections in your ArangoDB database. Which
collections are populated depends on the `rag_mode` you choose:

| Collection | What it stores | `full_graphrag` | `vector_rag` |
|---|---|---|---|
| **Documents** | Original source texts with their content and partition ID | ✓ | ✓ |
| **Chunks** | Smaller text segments split from documents, ordered by position | ✓ | ✓ |
| **Entities** | Extracted people, organizations, concepts, and so on, with embeddings for semantic search | ✓ | — |
| **Communities** | Thematic clusters of related entities, rated by significance, with hierarchical sub-communities | ✓ | — |
| **Relations** | Edges connecting nodes — includes weight, description, and type | ✓ | — |
| **SemanticUnits** | Image references and web URLs extracted from documents (requires `enable_semantic_units=true`) | ✓ | ✓ |

- **`full_graphrag`** builds the complete knowledge graph: documents, chunks,
  entities, communities, relations, and (optionally) semantic units.
- **`vector_rag`** imports only documents and chunks (with optional semantic
  units). Entities, communities, and relations are skipped.

### Relationship types

These edge types are created only in `full_graphrag` mode (except **PART_OF**,
which is always created):

- **PART_OF** — chunk → document
- **MENTIONED_IN** — entity → chunk
- **RELATED_TO** — entity → entity
- **IN_COMMUNITY** — entity → community
- **SUB_COMMUNITY_OF** — community → community

### Vector search

Vector indexes are auto-created on `embedding` fields based on your import
settings:

- **Entities** — `full_graphrag` mode only
- **Chunks** — when `enable_chunk_embeddings=true`
- **SemanticUnits** — when `enable_semantic_unit_embeddings=true`
- **Relations** — when `enable_edge_embeddings=true` (`full_graphrag` only)

These power semantic similarity search and nearest-neighbor queries across
your graph.

## 1. GenAI API

### Setup and authentication

Install the required libraries:

```py
! pip install aiohttp==3.13.5
! pip install python-dotenv==1.2.2
! pip install requests==2.33.1
```

Suppress noisy warnings to keep the notebook output clean:

```py
import warnings
warnings.filterwarnings('ignore')

import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

import requests
requests.packages.urllib3.disable_warnings()

import sys
if not sys.warnoptions:
    warnings.simplefilter('ignore')

print("✓ Warning suppression enabled")
```

Import the modules used throughout the tutorial:

```py
import aiohttp
import asyncio
import json
import base64
import os
import pathlib
from typing import Dict, Optional, List
from dotenv import load_dotenv
```

### Environment variable helper

Reload values from the `.env` file on every request so you can update
credentials without restarting the notebook kernel:

```py
def get_updated_env_var(env_var_name):
    """Reload the .env file and return the value of the given environment variable."""
    load_dotenv(dotenv_path="./your_env_file", override=True)
    return os.environ.get(env_var_name, None)

jwt_token = None
```

### Authentication

Authenticate against the `/_open/auth` endpoint of your ArangoDB deployment
and store the JWT token globally:

```py
def authenticate():
    """Authenticate with the ArangoDB server and store the JWT token globally."""
    global jwt_token
    auth_url = f"{get_updated_env_var('SERVER_URL')}/_open/auth"
    payload = {
        "username": get_updated_env_var("USERNAME"),
        "password": get_updated_env_var("PASSWORD")
    }
    try:
        print("Authenticating with the server...")
        response = requests.post(auth_url, json=payload, verify=False)
        response.raise_for_status()
        jwt_token = response.json().get("jwt")
        if not jwt_token:
            raise ValueError("Authentication response does not contain a token.")
        print("✓ Authentication successful. JWT token retrieved.")
    except Exception as e:
        print(f"✗ Error during authentication: {e}")
        raise
```

### Authenticated request helper

`send_request` is the synchronous helper used for most API calls. It
re-authenticates before every request so the token never expires mid-session:

```py
def send_request(suffix: str, payload: Dict, method: str = "POST") -> Optional[Dict]:
    """Send an authenticated HTTP request to the ArangoDB server."""
    authenticate()
    headers = {
        "Authorization": f"Bearer {jwt_token}",
        "Content-Type": "application/json"
    }
    url = f"{get_updated_env_var('SERVER_URL')}{suffix}"

    try:
        print(f"INFO: Sending {method} request to {suffix}")
        response = requests.request(method, url, json=payload, headers=headers, verify=False)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"ERROR: Error during request to {url}: {e}")
        raise
```

### Async streaming helper

Multi-file imports can run for several minutes and emit progress updates.
`send_streaming_request_async` reads the response line-by-line and prints each
event as it arrives:

```py
async def send_streaming_request_async(suffix: str, payload: Dict, method: str = "POST") -> None:
    """Send an authenticated HTTP request and stream the response line-by-line."""
    authenticate()
    headers = {
        "Authorization": f"Bearer {jwt_token}",
        "Content-Type": "application/json",
    }
    url = f"{get_updated_env_var('SERVER_URL')}{suffix}"

    print(f"INFO: Streaming {method} request to {suffix}")
    async with aiohttp.ClientSession() as session:
        async with session.request(method, url, json=payload, headers=headers, ssl=False) as resp:
            resp.raise_for_status()
            async for line in resp.content:
                decoded = line.decode("utf-8").strip()
                if decoded:
                    try:
                        print(json.dumps(json.loads(decoded), indent=2))
                    except json.JSONDecodeError:
                        print(decoded)
```

## 2. Starting a service

Define a thin wrapper around the service-creation endpoint:

```py
def start_service(service_name: str, startup_parameters: Dict) -> Optional[Dict]:
    """Start a service using the GenAI API."""
    body = {
        "service_name": service_name,
        "env": startup_parameters
    }
    return send_request("/gen-ai/v1/service", body)
```

### Create a GenAI project

A GenAI project groups your services and data together. Collection names in
ArangoDB are prefixed with the project name:

```py
DB_PROJECT_NAME = get_updated_env_var("DB_PROJECT_NAME")
DB_NAME = get_updated_env_var("DB_NAME")

project_payload = {
    "project_name": DB_PROJECT_NAME,
    "project_db_name": DB_NAME,
    "project_type": "tutorial",
    "project_description": "GraphRAG Tutorial Project"
}

print(f"Creating project '{DB_PROJECT_NAME}' in database '{DB_NAME}'...")
try:
    project_response = send_request("/gen-ai/v1/project", project_payload, "POST")
    print(f"Project '{DB_PROJECT_NAME}' created successfully!")
    print(json.dumps(project_response, indent=2))
except Exception as e:
    print(f"Project '{DB_PROJECT_NAME}' already exists. Continuing...")
```

{{< info >}}
If the project already exists, you can skip the creation step and proceed with
starting the Importer service.
{{< /info >}}

### Start the Importer service

Launch the Importer with the LLM and database configuration it should use. The
example below targets OpenAI-compatible APIs; swap in Triton URLs and model
names for self-hosted deployments.

```py
importer_params = {
    # ArangoDB connection & GenAI project
    "db_name": get_updated_env_var("DB_NAME"),
    "username": get_updated_env_var("USERNAME"),
    "password": get_updated_env_var("PASSWORD"),
    "genai_project_name": get_updated_env_var("DB_PROJECT_NAME"),

    # LLM provider: "openai" for cloud APIs, "triton" for self-hosted models
    "chat_api_provider": "openai",
    "embedding_api_provider": "openai",
    "chat_api_key": get_updated_env_var("OPENAI_API_KEY"),
    "embedding_api_key": get_updated_env_var("OPENAI_API_KEY"),
    "chat_model": "gpt-4o",                       # triton: "mistral-nemo-instruct", etc.
    "embedding_model": "text-embedding-3-small",  # triton: "nomic-embed-text-v1", etc.

    # API URLs — defaults to OpenAI; override for Triton, OpenRouter, or other compatible endpoints
    "chat_api_url": "https://api.openai.com/v1",
    "embedding_api_url": "https://api.openai.com/v1",

    # Resource profile — allocates extra memory/CPU to the service container
    "profiles": "memory-2gi-cpu-1",
}

importer_response = start_service("arangodb-graphrag-importer", importer_params)
print(json.dumps(importer_response, indent=2))

importer_service_id = "-".join(importer_response["serviceInfo"]["serviceId"].split("-")[-2:])
print(f"\nImporter Service ID: {importer_service_id}")
```

{{< info >}}
Both `chat_api_provider` and `embedding_api_provider` must be set to the same
value. You cannot mix Triton and OpenAI-compatible APIs.
{{< /info >}}

## 3. List of services

Use `list_services` to retrieve every running service and its metadata:

```py
def list_services() -> Optional[Dict]:
    """List all running services via the GenAI API."""
    return send_request("/gen-ai/v1/list_services", {}, "POST")

services_response = list_services()
print("All Services:")
print(json.dumps(services_response, indent=2))
```

## 4. Modifying an Importer and viewing it

The Importer service is already running from Section 2. The helper below
updates its configuration in place.

### 4.1 Update the Importer service

```py
def update_service(full_service_id: str, startup_parameters: Dict) -> Optional[Dict]:
    """Update a running service with new configuration or environment variables."""
    body = {"env": startup_parameters}
    return send_request(f"/gen-ai/v1/service/{full_service_id}", body, "PUT")
```

Example — upgrade the chat model and allocate more memory and CPU:

```py
updated_params = importer_params.copy()
updated_params["chat_model"] = "gpt-4o"
updated_params["profiles"] = "memory-4gi-cpu-2"

importer_service_id_full = f"arangodb-graphrag-importer-{importer_service_id}"
print(f"Updating service: {importer_service_id_full}")
response = update_service(importer_service_id_full, updated_params)
print(json.dumps(response, indent=2))
```

### 4.2 Viewing a pod in k9s

To inspect the running service pod, launch `k9s` and use the following
keyboard shortcuts:

- **Arrow keys** — navigate through pods
- **ENTER** — view pod details
- **d** — describe the pod (full YAML, status, and events)
- **l** — view logs; press `0`, `1`, `2`... to filter by time range
- **ESC** — return to the previous view
- **SHIFT+F** — port-forward a pod
- **e** — edit pod configuration
- **CTRL+D** — delete the pod
- **?** — show the help menu with all available commands

## 5. File encoding

The Importer accepts Base64-encoded file content. You can encode a single file
or pre-process a whole folder into a reusable JSON manifest.

### 5.1 Single file encoding

Read any file and return its content as a Base64-encoded string:

```py
def file_to_bytes(file_path: str) -> str:
    """Read any file as base64-encoded content (for ImportFileRequest.file_content or FileInput.content)."""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")

    if not os.access(file_path, os.R_OK):
        raise PermissionError(f"No read permissions for file: {file_path}")

    try:
        with open(file_path, "rb") as file:
            encoded_content = base64.b64encode(file.read()).decode("utf-8")
            return encoded_content
    except Exception as exc:
        raise Exception(f"Failed to read file bytes: {exc}") from exc
```

Example usage:

```py
pdf_path = "./your_pdf_file.pdf"
file_content = file_to_bytes(str(pdf_path))
```

### 5.2 Batch folder processing

For multi-file imports, `process_folder` Base64-encodes all supported files in
a directory and writes a JSON manifest. Files are encoded directly — no format
conversion is needed.

```py
SUPPORTED_EXTENSIONS = {".pdf", ".docx", ".html", ".htm", ".md", ".txt"}


def process_folder(
    input_folder: str,
    json_output_file: str,
) -> List[Dict]:
    """Base64-encode all supported files in a directory and produce a JSON manifest for multi-file import."""
    files_info: List[Dict] = []
    input_path = pathlib.Path(input_folder)

    all_files = [
        f for f in input_path.iterdir()
        if f.is_file() and f.suffix.lower() in SUPPORTED_EXTENSIONS
    ]

    if not all_files:
        print(f"No supported files found in {input_folder}")
        return files_info

    print(f"Processing {len(all_files)} file(s) from {input_folder}...")
    for file_path in all_files:
        try:
            encoded_content = file_to_bytes(str(file_path))
            files_info.append({
                "name": file_path.name,
                "content": encoded_content,
                "citable_url": "",
            })
            print(f"✓ Encoded {file_path.name}")
        except Exception as e:
            print(f"✗ Error processing {file_path.name}: {e}")

    with open(json_output_file, "w", encoding="utf-8") as f:
        json.dump(files_info, f, indent=2, ensure_ascii=False)
    print(f"\nJSON manifest saved to {json_output_file} ({len(files_info)} files)")
    return files_info
```

Reload the manifest later without re-encoding:

```py
def load_files_from_json(json_file: str) -> List[Dict]:
    """Load a file manifest previously created by process_folder."""
    try:
        with open(json_file, "r", encoding="utf-8") as f:
            files = json.load(f)
        print(f"Loaded {len(files)} file(s) from {json_file}")
        return files
    except FileNotFoundError:
        print(f"JSON file not found: {json_file}")
        return []
    except Exception as e:
        print(f"Error loading JSON: {e}")
        return []
```

Encode a folder (or reload a previously saved manifest):

```py
input_folder = "./your_documents_folder/"
json_output_file = "./files_info.json"

files = process_folder(
    input_folder=input_folder,
    json_output_file=json_output_file,
)

# Or reload from a previously saved manifest
# files = load_files_from_json(json_output_file)
```

## 6. Importing the file

Once you have Base64-encoded content (from Section 5), you can hand it to the
Importer.

### 6.1 Import parameters reference

#### Single-file input (`/v1/import`)

- `file_content` — Base64-encoded file content **or** `file_url` — URL to
  download the file from (provide one, not both).
- `file_name` — original filename with extension (always required; used to
  detect format).

#### Multi-file input (`/v1/import-multiple`)

- `files` — array of `{name, content, citable_url}` objects (see
  Section 6.3.2 for details).

#### File Manager (alternative to inline content)

When files are already uploaded to File Manager, pass their IDs instead of raw
content:
- `file_id` — *(single-file only)* File Manager file ID. When set,
  `file_content` / `file_url` are ignored.
- `file_ids` — *(multi-file only)* list of File Manager file IDs. When
  non-empty, the `files` array is ignored.

The following parameters are **shared** across both single-file and multi-file
imports.

**RAG mode:**
- `rag_mode` — `"full_graphrag"` (default) builds the complete knowledge
  graph; `"vector_rag"` imports only documents and chunks for vector
  retrieval.

**Chunking:**
- `chunk_token_size` — max tokens per chunk (default: `1024`).
- `chunk_overlap_token_size` — overlap between consecutive chunks
  (default: `128`).
- `chunk_min_token_size` — minimum tokens per chunk; smaller chunks are
  merged with adjacent ones.
- `chunk_custom_separators` — custom split strings (replaces the default
  character-split strategy).
- `preserve_chunk_separator` — keep the separator text in the resulting
  chunks (default: `true`).
- `ignore_chunk_token_size` — chunk by separators only, ignoring token size
  limits (default: `false`).

**Entity and relationship extraction:**
- `entity_types` — types to extract (default: `["person", "organization", "geo", "event"]`).
- `relationship_types` — types to extract (default: inferred by the LLM).
- `enable_strict_types` — only allow entities/relationships matching the
  provided type lists.
- `entity_extract_max_gleaning` — extraction refinement iterations
  (default: `1`).

**Embeddings:**
- `enable_chunk_embeddings` — generate chunk embeddings for vector search
  (default: `false`; always on in `vector_rag`).
- `enable_edge_embeddings` — generate edge embeddings (default: `false`).
- `enable_community_embeddings` — generate community embeddings from
  `report_string` (default: `true`).

**Semantic units** — extract URLs and image references found in your text
into a `SemanticUnits` collection. Each flag builds on the previous one:
- `enable_semantic_units` — extract web URLs from the given data
  (default: `false`).
- `process_images` — also extract storage-style URLs (base64, S3, FileManager
  artifacts) in addition to web URLs (requires `enable_semantic_units`).
- `store_image_data` — save the actual image binary for storage-style URLs;
  web URLs always store metadata only (requires `process_images`).
- `enable_semantic_unit_embeddings` — generate vector embeddings for all
  extracted semantic units (requires `enable_semantic_units`).

**Image extraction from documents** — pull images out of PDFs/DOCX files
during conversion:
- `crop_images` — extract embedded images and insert markdown image
  references into the chunk text.
- `store_images_to_s3` — upload those extracted images to File Manager and
  replace local paths with download URLs (requires `crop_images`).

**Vector index:**
- `vector_index_metric` — distance metric: `"cosine"` (default), `"l2"`, or
  `"innerProduct"`.
- `vector_index_use_hnsw` — use an HNSW index instead of IVF
  (default: `false`).
- `vector_index_n_lists` — IVF partition count (auto-computed if unset;
  ignored with HNSW).

**Partitioning:**
- `partition_id` — logical partition label for multi-tenant data isolation.

**Smart Graph:**
- `batch_size` — vertices/edges per insert batch (default: `1000`).
- `smart_graph_attribute` — enables ArangoDB Smart Graph sharding on this
  attribute (for example, `partition_id`).
- `shard_count` — number of shards for distributed deployments.
- `is_disjoint` — enforce disjoint vertex sets across graphs.
- `satellite_collections` — collections replicated to all DB-Server nodes.

**Storage:**
- `store_in_s3` — store files in S3 (default: `false`).

**Prompts:**
- `custom_prompts` — dictionary of prompt overrides (see
  [Section 6.2 Custom prompts](#62-custom-prompts) below).

### 6.2 Custom prompts

Pass a `custom_prompts` dictionary to override any of the prompts listed
below. Only the keys you provide are overridden; all others keep their
defaults.

| Key | What it controls |
|---|---|
| `entity_extraction` | Extracts entities and relationships from each text chunk |
| `community_report` | Generates a summary report for each community of related entities |
| `claim_extraction` | Extracts claims or assertions made about entities |
| `summarize_entity_descriptions` | Merges multiple descriptions of the same entity into one |
| `entiti_continue_extraction` | Follow-up prompt to catch entities missed in the first pass |
| `entiti_if_loop_extraction` | Decides whether another extraction pass is needed (expects YES/NO) |

**Template variables** — these placeholders are auto-filled at runtime and
must appear in your custom prompt where applicable:
- `{input_text}` — the text chunk being processed.
- `{entity_types}` — comma-separated entity types
  (e.g., `"person, organization, geo"`).
- `{relationship_types}` — comma-separated relationship types.
- `{relationship_type_instruction}` — dynamic instruction about
  relationship types.
- `{tuple_delimiter}`, `{record_delimiter}`, `{completion_delimiter}` —
  output format delimiters.

{{< tip >}}
You can override just one key (for example, only `entity_extraction`) and
leave the rest as defaults. Always test with a sample document to verify the
output format parses correctly.
{{< /tip >}}

Example custom prompt bundle:

```py
custom_prompts_example = {

    "entity_extraction": """
-Goal-
Extract domain-specific entities and relationships from the text.

-Steps-
1. Identify entities:
   - entity_name: capitalized name
   - entity_type: one of [{entity_types}]
   - entity_description: concise description of the entity's role
   Format: ("entity"{tuple_delimiter}<entity_name>{tuple_delimiter}<entity_type>{tuple_delimiter}<entity_description>)

2. Identify relationships:
   - relationship_type: {relationship_type_instruction}
   - relationship_strength: 1-10
   Format: ("relationship"{tuple_delimiter}<source>{tuple_delimiter}<target>{tuple_delimiter}<type>{tuple_delimiter}<description>{tuple_delimiter}<strength>)

3. Separate records with {record_delimiter}
4. End with {completion_delimiter}

Entity_types: {entity_types}
Relationship_types: {relationship_types}
Text: {input_text}
Output:
""",

    "community_report": """
Write a concise community analysis report as JSON.

Include:
- "title": community theme
- "summary": 2-3 sentence overview
- "rating": significance score 1-10
- "rating_explanation": one sentence justification
- "findings": list of {{"summary": "...", "explanation": "..."}}

Ground all findings in the provided data only.

Text:
{input_text}

Output:
""",

    "summarize_entity_descriptions": """
Combine the following descriptions of {entity_name} into a single coherent summary.
Resolve contradictions, remove duplicates, and write in third person.

Descriptions: {description_list}
Output:
""",

    "entiti_continue_extraction": "Review the text again. Add any entities or relationships missed in the previous extraction using the same format.",

    "entiti_if_loop_extraction": "Are there still entities that need to be extracted? Answer YES or NO.",
}
```

Different strategies for customizing entity extraction depending on your use
case:

| Strategy | When to use | How |
|---|---|---|
| **Domain-focused** | Your documents belong to a specific field (legal, medical, financial) | Tailor `entity_extraction` with domain terminology, entity types, and relationship types relevant to your field |
| **Example-driven (few-shot)** | The LLM struggles with your output format or misses entities | Add a `-Example-` section in your prompt with sample input/output pairs before the `-Real Data-` section |
| **Zero-shot** | Generic documents, no specific domain constraints | Use a short, general-purpose prompt (like the sample above) and rely on `entity_types` / `relationship_types` lists to guide extraction |
| **Multi-pass refinement** | Documents are dense with many entities | Increase `entity_extract_max_gleaning` (e.g., `2` or `3`) and customize `entiti_continue_extraction` to guide what the second pass should look for |
| **Strict typing** | You need a clean, controlled graph schema | Set `enable_strict_types=True` and provide explicit `entity_types` + `relationship_types` lists so the LLM only produces matching types |
| **Non-English** | Documents are in another language | Write your custom prompts in the target language; template variables are language-agnostic |

### 6.3 Generate the knowledge graph

#### 6.3.1 Single-file import

Submit one Base64-encoded document and wait synchronously for the response:

```py
import_body = {
    # File input
    "file_name": "example.pdf",
    "file_content": file_content,  # or "file_url": "..."
    # File Manager alternative (uncomment below and remove "file_content" above)
    # "file_id": "file_manager_id_1",

    # RAG mode
    "rag_mode": "full_graphrag",  # "full_graphrag" | "vector_rag"

    # Chunking
    "chunk_token_size": 1024,
    "chunk_overlap_token_size": 128,

    # Entity & relationship extraction
    "entity_types": ["person", "organization", "geo", "event"],
    "relationship_types": ["WORKS_FOR", "LOCATED_IN", "MEMBER_OF"],
    "enable_strict_types": False,
    "entity_extract_max_gleaning": 1,

    # Embeddings
    "enable_chunk_embeddings": True,
    "enable_edge_embeddings": False,
    "enable_community_embeddings": True,

    # Semantic units & images
    "enable_semantic_units": False,
    "enable_semantic_unit_embeddings": False,
    "process_images": False,
    "store_image_data": False,
    "crop_images": False,
    "store_images_to_s3": False,

    # Vector index
    "vector_index_metric": "cosine",
    "vector_index_use_hnsw": False,

    # Partitioning
    "partition_id": "partition_1",

    # Prompts
    "custom_prompts": custom_prompts_example,
}

import_response = send_request(
    f"/graphrag/importer/{importer_service_id}/v1/import",
    import_body,
    "POST",
)
print(json.dumps(import_response, indent=2))
```

#### 6.3.2 Multi-file import

Use `/v1/import-multiple` to process an entire folder of documents into a
single knowledge graph in one request.

**How it differs from single-file import:**

|  | Single file (`/v1/import`) | Multi-file (`/v1/import-multiple`) |
|---|---|---|
| **Input** | One `file_content` + `file_name` | A `files` array of `{name, content, citable_url}` objects |
| **Response** | Synchronous — blocks until complete | Returns a `job_id` immediately; processing runs in the background |
| **Tracking** | Response includes success/failure | Poll `/v1/jobs/{job_id}` for progress updates |
| **Graph output** | One document in the graph | All files merged into a single knowledge graph |

**Two ways to provide files:**

- **Option A — inline content** (`files` array). Each entry requires:
  - `name` — original filename (e.g., `"report.pdf"`).
  - `content` — Base64-encoded file content.
  - `citable_url` — (optional) URL for inline citations in the graph.
- **Option B — File Manager IDs** (`file_ids` array). Pass a list of File
  Manager file IDs (e.g., `["id1", "id2"]`); the service fetches files by ID
  and the `files` array is ignored.

All other parameters (`chunk_token_size`, `entity_types`,
`enable_chunk_embeddings`, and so on) are shared across the batch — the same
as for single-file import.

```py
import_body = {
    # Multi-file input (Option A: inline content)
    "files": files,  # list of {"name": "...", "content": "...", "citable_url": "..."}
    # Option B: File Manager IDs (comment out Option A if using this)
    # "file_ids": ["file_manager_id_1", "file_manager_id_2"],

    # RAG mode
    "rag_mode": "full_graphrag",  # "full_graphrag" | "vector_rag"

    # Chunking
    "chunk_token_size": 1024,
    "chunk_overlap_token_size": 128,

    # Entity & relationship extraction
    "entity_types": ["person", "organization", "geo", "event"],
    "relationship_types": ["WORKS_FOR", "LOCATED_IN", "MEMBER_OF"],
    "enable_strict_types": False,
    "entity_extract_max_gleaning": 1,

    # Embeddings
    "enable_chunk_embeddings": True,
    "enable_edge_embeddings": False,
    "enable_community_embeddings": True,

    # Semantic units & images
    "enable_semantic_units": False,
    "enable_semantic_unit_embeddings": False,
    "process_images": False,
    "store_image_data": False,
    "crop_images": False,
    "store_images_to_s3": False,

    # Vector index
    "vector_index_metric": "cosine",
    "vector_index_use_hnsw": False,

    # Graph & partitioning
    "partition_id": "my_batch_partition",

    # Prompts
    "custom_prompts": custom_prompts_example,
}

await send_streaming_request_async(
    f"/graphrag/importer/{importer_service_id}/v1/import-multiple",
    import_body,
    "POST",
)
```

#### Job tracking

Multi-file imports return a `job_id`. Use the following endpoints to monitor
progress:
- `GET /v1/jobs/{job_id}` — status and history for a specific job.
- `GET /v1/jobs` — list all jobs.

The `progress` field (0–100%) maps to the pipeline stages shown below. The
table shows the **`full_graphrag`** path; `vector_rag` follows a shorter path
(noted in the last column):

| Progress | Status | Stage | `vector_rag` |
|---|---|---|---|
| **5%** | `graph_builder_started` | Graph builder initialized | ✓ |
| **10%** | `chunking_in_progress` | Splitting documents into chunks | ✓ |
| **40%** | `openai_graph_build_completed` or `triton_graph_build_completed` | LLM entity/relationship extraction done | skipped |
| **45%** | `import_in_progress` | Starting ArangoDB import | ✓ |
| **50%** | `import_documents_in_progress` | Importing documents | ✓ |
| **55%** | `import_text_chunks_in_progress` | Importing text chunks | ✓ |
| **65%** | `import_entities_in_progress` | Importing entities | skipped |
| **75%** | `import_entity_to_entity_relationships_in_progress` | Importing relationships | skipped |
| **80%** | `import_community_reports_in_progress` | Importing community reports | skipped |
| **85%** | `create_index_in_progress` | Creating vector indexes | ✓ |
| **100%** | `service_completed` | Import finished successfully | ✓ |
| **0%** | `service_failed` | Error at any stage | ✓ |

{{< info >}}
The 40% status is provider-prefixed (`openai_` or `triton_`); all other
statuses are generic. In `vector_rag` mode the entity extraction, relationship,
and community stages are skipped, so progress jumps directly from chunking to
the import/index stages.
{{< /info >}}

Check the status of a specific job:

```py
job_id = "your_job_id_here"
job_status = send_request(
    f"/graphrag/importer/{importer_service_id}/v1/jobs/{job_id}",
    {},
    "GET",
)
print(json.dumps(job_status, indent=2))
```

List all jobs:

```py
all_jobs = send_request(
    f"/graphrag/importer/{importer_service_id}/v1/jobs",
    {},
    "GET",
)
print(json.dumps(all_jobs, indent=2))
```

## 7. Performance and verification

### 7.1 Document size guidelines

| Size | Recommendation |
|---|---|
| **< 1 MB** | All features can be enabled with minimal impact |
| **1–10 MB** | Consider disabling `store_image_data` if documents contain large images |
| **> 10 MB** | Use `enable_semantic_units=true` with `process_images=false` and `store_image_data=false` for lightweight URL extraction only |

### 7.2 LLM compatibility

Semantic units and image processing work with all supported providers:
- **OpenAI** — GPT-4o, GPT-4o-mini.
- **OpenRouter** — Gemini Flash, Claude Sonnet, and other hosted models.
- **Triton** — Mistral-Nemo-Instruct and other self-hosted models.

### 7.3 Verifying the import

After a successful import, confirm the following collections exist in your
ArangoDB database. All collection names are prefixed with your
`DB_PROJECT_NAME`. Which collections are created depends on the `rag_mode`:

| Collection | Contents | `full_graphrag` | `vector_rag` |
|---|---|---|---|
| `{DB_PROJECT_NAME}_Documents` | Original source texts | ✓ | ✓ |
| `{DB_PROJECT_NAME}_Chunks` | Text segments split from documents | ✓ | ✓ |
| `{DB_PROJECT_NAME}_Entities` | Extracted entities with embeddings | ✓ | — |
| `{DB_PROJECT_NAME}_Communities` | Thematic clusters of related entities | ✓ | — |
| `{DB_PROJECT_NAME}_Relations` | Edges connecting all graph nodes | ✓ | — |
| `{DB_PROJECT_NAME}_SemanticUnits` | Extracted URLs and image references (only when `enable_semantic_units=true`) | ✓ | ✓ |

{{< info >}}
`vector_rag` only creates Documents, Chunks, and (optionally) SemanticUnits.
If you switch from `vector_rag` to `full_graphrag` and re-import, the
remaining collections are created.
{{< /info >}}

You can also explore the generated graph visually using the
[Graph Visualizer](../../platform-suite/graph-visualizer.md) in the Arango
Contextual Data Platform web interface.

## 8. Cleanup

Stop services when you are finished to free up resources:

```py
def stop_service(service_id: str) -> Optional[Dict]:
    """Stop a running service via the GenAI API."""
    body = {"service_id": service_id}
    return send_request(f"/gen-ai/v1/service/{service_id}", body, "DELETE")
```

```py
importer_stop_response = stop_service(f"arangodb-graphrag-importer-{importer_service_id}")
print(json.dumps(importer_stop_response, indent=2))
```
