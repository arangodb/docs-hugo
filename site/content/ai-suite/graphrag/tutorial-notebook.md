---
title: GraphRAG Notebook Tutorial
menuTitle: Notebook Tutorial
description: >-
  Building a GraphRAG pipeline using ArangoDB's integrated notebook servers
weight: 25
---
{{< tip >}}
The Arango Data Platform & AI Suite are available as a pre-release. To get
exclusive early access, [get in touch](https://arango.ai/contact-us/) with
the Arango team.
{{< /tip >}}

## Tutorial overview

This tutorial guides you through the process of building a
Graph-based Retrieval Augmented Generation (GraphRAG) pipeline using
ArangoDB's integrated Notebook servers. GraphRAG is an advanced framework that
combines the power of knowledge graphs (KGs) and large language models (LLMs)
to provide precise and contextually relevant responses from unstructured text data.

You will learn how to:
- Prepare your raw text data (PDFs in this case) into a structured format
  suitable for Knowledge Graph extraction using Docling.
- Utilize the ArangoDB Importer service to automatically extract
  entities and relationships from your prepared text and store them as a
  Knowledge Graph in ArangoDB.
- Query your newly created Knowledge Graph using the ArangoDB Retriever
  service for both broad (global) and targeted (local) information retrieval.
- Set up a simple Gradio interface to interact with your GraphRAG pipeline.

## Prerequisites

Before you begin, ensure you have the following:
- **ArangoDB deployment:** Access to an ArangoDB deployment where you can
  create and manage databases. You need the endpoint, your username, and
  write access to your chosen database.
- **Python environment:** A Python 3.x environment with `pip` installed.
- **Jupyter Notebook:** This tutorial is designed to be run in ArangoDB's integrated
  Notebook servers.
- **OpenAI API key (optional):** If you plan to use OpenAI's models for LLM
  processing, you need an OpenAI API key.

## Environment setup

This section covers installing necessary libraries, importing Python modules,
and setting up the network functions for interacting with ArangoDB services.

### Install required libraries

First, install all the Python libraries necessary for PDF parsing, Markdown
conversion, and interacting with the ArangoDB GraphRAG services.

```py
! pip install fitz
! pip install PyMuPDF
! pip install PyPDF2
! pip install markdownify
! pip install docling==2.26.0
! pip install gradio
```

### Import required Python libraries

Next, import the specific modules and functions used throughout the tutorial.

```py
import fitz
import requests
import base64
import os
import re
from PyPDF2 import PdfReader
from docling.document_converter import DocumentConverter
from markdownify import markdownify as md
from typing import Dict, Optional
from pprint import pprint
import time
```

## Step 1: Prepare your document

{{< warning >}}
GraphRAG currently supports `.txt` and `.md` formats only. If your document is
in `.pdf` format, you must convert it into a structured Markdown format using Docling.

You can only import one file using the pre-release version of ArangoDB GraphRAG.
Importing another file overwrites the knowledge graph.
{{< /warning >}}

[Docling](https://docling-project.github.io/docling/) from IBM is an AI-based PDF
parsing tool designed to convert complex PDFs into Markdown. This conversion is
crucial for efficient extraction of entities and relationships in the next stage.

The following process creates a Markdown file for you (e.g., `AliceInWonderland_docling.md`)
from your PDF. The file is automatically added in the file browser of the Jupyter
notebook interface.

```py
# --- Configuration for your document and database ---
DB_NAME = "documentation" # Set the name of the ArangoDB database you will use for your knowledge graph. Ensure this database already exists in your ArangoDB Deployment.
FILE_NAME = "AliceInWonderland" # Specify the base name of your input file (e.g., 'AliceInWonderland' for 'AliceInWonderland.pdf').
PDF_NAME=f"./{FILE_NAME}.pdf" # Update the file path and extension if your input document is not a PDF or has a different name.
# ----------------------------------------------------

%%time

def pdf_to_markdown_docling(pdf_file):
    """Converts a PDF file to Markdown using Docling."""
    converter = DocumentConverter()
    result = converter.convert(pdf_file)
    output_md_file = pdf_file.replace(".pdf", "_docling.md")
    with open(output_md_file, "w", encoding="utf-8") as md_file:
        md_file.write(result.document.export_to_markdown())
    print(f"Successfully converted {pdf_file} to {output_md_file}")

try:
    pdf_to_markdown_docling(PDF_NAME)
except Exception as e:
    print(f"An error occurred during PDF to Markdown conversion: {e}")
```

The next step is to encode the content of the Markdown file into Base64,
which is required for the Importer service.

```py
%%time

def encode_file_content(file_path: str) -> Optional[str]:
    """Encodes the file content to Base64."""
    try:
        with open(file_path, "rb") as file:
            encoded_content = base64.b64encode(file.read()).decode("utf-8")
            print(f"Successfully encoded file: {file_path}")
            return encoded_content
    except FileNotFoundError:
        print(f"File not found: {file_path}")
    except Exception as e:
        print(f"Error reading file {file_path}: {e}")
    return None

file_content = encode_file_content(f"./{FILE_NAME}_docling.md")
```

## Step 2: Import your document to generate the Knowledge Graph

Once your document is prepared, you can start the Importer service. This
service takes your processed Markdown content, extracts entities and relationships,
and then stores this structured information as a Knowledge Graph within
your specified ArangoDB database.

### Start the Importer service

Start the Importer service providing the necessary configuration
parameters.

```py
%%time

# Start the GraphRAG Importer service
importer_config = {
    "db_name": DB_NAME,
    "username": os.environ["USERNAME"],
    "api_provider": "openai", # Switch the provider if needed
    "openai_api_key": os.environ["OPENAI_API_KEY"], # Required if api_provider is 'openai'
}

response = start_service("arangodb-graphrag-importer", importer_config)
pprint(response)

# Extract the service ID for future reference
importer_service_id = response["serviceInfo"]["serviceId"].split("-")[-1]
print(f"Importer Service ID: {importer_service_id}")
```

### Submit your document

With the importer service running, submit your Base64 encoded Markdown file.
The service will process it in the background to build the Knowledge Graph.

{{< info >}}
This process can take some time depending on the document's size and complexity.
{{< /info >}}

```py
%%time

# Submit the prepared file to generate the Knowledge Graph
importer_payload = {
    "file_name": FILE_NAME,
    "file_content": file_content,
}

importerResponse = send_request(f"/graphrag/importer/{importer_service_id}/v1/import", importer_payload, "POST")
pprint(importerResponse)
```

### Visualize and interact with the Knowledge Graph

Once the importer service has processed the document, you can visualize and
interact with the generated Knowledge Graph using the [Graph Visualizer](../../data-platform/graph-visualizer.md)
directly from the Arango Data Platform web interface.

1. In the Arango Data Platform web interface, select the database you have previously used.
2. Click **Graphs** in the main navigation.
3. Select the graph named **Knowledge Graph** from the list.
4. The viewport of the Graph Visualizer opens for exploring the graph.
5. In the AQL editor, use the following query to explore communities and
  entities:
  ```aql
  FOR c IN Communities
    FILTER c._key == "0"
    FOR v,e,p IN 1 INBOUND c GRAPH "KnowledgeGraph"
    RETURN p
  ```

You can also configure the display options:
- Set all **Nodes** collections (e.g., Communities, Entities) to a different color.
- Set the **Communities** label to `title`.
- Set the **Entities** label to `entity_name`.
- For **Edges** (relations), set the label to `type`.

## Step 3: Query the Knowledge Graph with the Retriever service

To retrieve information from the Knowledge Graph, you need to deploy the
Retriever service. This service interacts with your Knowledge Graph
and uses an LLM to formulate answers to your queries.

### Startup parameters

- `api_provider`: Defines to which LLM provider you want to connect (e.g., `openai`).
- `openai_api_key`: An API key for usage with ChatGPT. This is only required when
  `openai` is selected as the provider.
- `db_name`: The name of the database where your Knowledge Graph was created.
- `username`: The ArangoDB username. This user needs to have write access to the specified database.

### Start the Retriever service

```py
%%time

# Start the GraphRAG Retriever service
retriever_config = {
    "db_name": DB_NAME,
    "username": os.environ["USERNAME"],
    "api_provider": "openai", # Change this provider if needed
    "openai_api_key": os.environ["OPENAI_API_KEY"],
}

response = start_service("arangodb-graphrag-retriever", retriever_config)
pprint(response)

# Extract the service ID for future reference
retriever_service_id = response["serviceInfo"]["serviceId"].split("-")[-1]
print(f"Retriever Service ID: {retriever_service_id}")
```

The Retriever service is available at the following endpoint, which allows you 
to send queries to the Knowledge Graph:
```
/graphrag/retriever/{service_id}/v1/graphrag-query
```

### Query parameters

The `POST /v1/graphrag-query` API expects the following parameters:

- `query`: The question you want to ask.
- `query_type`: Can be `1` for a global search (information from the entire KG)
  or `2` for a local search (focused on specific subgraphs).
- `level`: Recommended value is `1`. This parameter is relevant for global searches
  and defines the hierarchy level of community grouping to start from.
- `provider`: Must be `0` for public LLMs like OpenAI. Use `1` for private LLMs.

### Example: Global search

Global retrieval focuses on extracting information from the entire Knowledge Graph.
It is designed to provide a comprehensive overview and answer queries that span
across multiple entities and relationships in the graph.

For example, you can ask a broad question about the main themes of the document:

```py
%%time

# Example for a Global Query
global_query_body = {
    "query": "What are the main themes or topics covered in the document?",
    "query_type": 1,  # 1 = Global search
    "level": 1,
    "provider": 0,    # 0 = OPENAI (based on our setup)
    "response_type": "use_query_decomp=True use_llm_planner=True Detailed summary"
}

print("Executing Global Query...")
retrieverResponse = send_request(
    f"/graphrag/retriever/{retriever_service_id}/v1/graphrag-query",
    global_query_body,
    "POST"
)

pprint(retrieverResponse["result"])
```

### Example: Local search

Local retrieval is a focused approach where the query is constrained to
specific subgraphs within the Knowledge Graphs. It is designed for targeted
and precise information extraction.

For example, you can ask a detailed question about entities within the
Knowledge Graph:

```py
%%time

# Example for a Local Query
local_query_body = {
    "query": "Who are Alice's relatives?",
    "query_type": 2,  # 2 = Local search
    "level": 1,
    "provider": 0,    # 0 = OPENAI (based on our setup)
    "response_type": "use_query_decomp=True use_llm_planner=True Concise list"
}

print("Executing Local Query...")
retrieverResponse = send_request(
    f"/graphrag/retriever/{retriever_service_id}/v1/graphrag-query",
    local_query_body,
    "POST"
)

pprint(retrieverResponse["result"])
```

## Step 4: Create a chat interface via Gradio

To make querying your Knowledge Graph more interactive, you can use Gradio to
create a simple chat interface. This allows you to submit queries and see real-time
responses from the Retriever.

First, define the functions that handle the queries through the Gradio interface:

```py
import time

def global_query(query, messages):
    yield from query_graph(query, 1)

def local_query(query, messages):
    yield from query_graph(query, 2)

def query_graph(query, query_type):
    body = {
        "query": query, 
        "query_type": query_type,
        "level": 1,
        "provider": 0
    }

    retrieverResponse = send_request(f"/graphrag/retriever/{retriever_service_id}/v1/graphrag-query", body, "POST")
    result = retrieverResponse["result"]

    response = ""
    i = 0
    
    while i < len(result):
        current_char = result[i]
        
        # Handle escaped characters
        if current_char == '\\':
            if i + 1 < len(result):
                next_char = result[i + 1]
                if next_char == 'n':
                    response += '\n'
                    i += 2
                    continue
        
        response += current_char
        i += 1
        
        yield response

        time.sleep(0.005)
```
Then, you can launch the global retriever and the local retriever interfaces:

```py
import gradio as gr

gr.ChatInterface(
    title="ArangoDB GraphRAG Global Retriever",
    fn=global_query,
    chatbot=gr.Chatbot(height=1000, type="messages"),
    type="messages",
    theme='JohnSmith9982/small_and_pretty'
).launch(share=True)
```

```py
import gradio as gr

gr.ChatInterface(
    title="ArangoDB GraphRAG Local Retriever",
    fn=local_query,
    chatbot=gr.Chatbot(height=1000, type="messages"),
    type="messages",
    theme='JohnSmith9982/small_and_pretty'
).launch(share=True)
```