---
title: How to use AutoGraph in the Arango Contextual Data Platform web interface
menuTitle: Web Interface
weight: 15
description: >-
  Learn how to create, configure, and run a complete AutoGraph workflow in the web interface
---

Learn how to use AutoGraph's web interface to build an intelligent knowledge
graph from your documents. AutoGraph analyzes your content, automatically
discovers knowledge domains, generates optimized import strategies,
and deploys retrieval services, all through a streamlined, step-by-step workflow.
In just a few steps, your fully operational knowledge graph is ready to answer
questions about your documents.

## Create an AutoGraph project

To create a new AutoGraph project using the Arango Contextual Data Platform
web interface, follow these steps:

1. From the left-hand sidebar, select the database where you want to create the project.
   You can also switch to a different database if you wish to create your project
   elsewhere.
2. In the left-hand sidebar, click **Agentic AI Suite**, then click **AutoGraph**.
3. In the **AutoGraph** view, click **+ New Project**.
4. The **New Project** dialog opens. Enter a **Project Name** and optionally
   a description for your project.
5. Click the **Create & Continue** button to finalize the creation.

## Upload documents

After creating your project, you are guided through setting up your AutoGraph workflow.

{{< info >}}
AutoGraph is checking the [File Manager](../../platform-suite/file-manager/_index.md) for
documents previously uploaded to this database. Files uploaded to the File Manager
are shared across all projects within the same database. You can choose to use
these existing files or upload new ones.
{{< /info >}}

1. The interface displays a drag-and-drop area for uploading documents.
2. Drag and drop files, or click to browse. Supported file formats are:
   - **Text files**: `.txt`, `.md`
   - **PDF files**: `.pdf`
   - **Office documents**: `.docx`, `.pptx`, `.xlsx`, `.doc`, `.ppt`, `.xls`
   - **OpenDocument formats**: `.odt`, `.odp`, `.ods`
   - **Rich Text Format**: `.rtf`
3. You can also click **Upload Folder** to upload an entire folder of documents.
4. Once files are uploaded, they appear in a **Ready to Upload** list showing the filename and size.
5. Click **Upload** to proceed to the next step.

## Configure LLM provider

Select your LLM provider and enter your API key.

{{< tabs "llm-provider" >}}

{{< tab "OpenAI" >}}
1. Select **OpenAI** from the **Provider** dropdown menu.
2. Select the model you want to use from the **Select model** dropdown.
3. Select an **API Key** from the dropdown menu. Keys are managed in the
   [Secrets Manager](../../platform-suite/secrets-manager.md).
4. Optionally, if you want to use a different key for embeddings, check the **Use different key for embeddings** checkbox and configure the embedding model and key.
5. Click **Continue** to proceed.
{{< /tab >}}

{{< tab "Custom (OpenAI-compatible)" >}}
1. Select **Custom (OpenAI-compatible)** from the **Provider** dropdown menu.
2. Enter the **Chat API URL** for your OpenAI-compatible endpoint.
3. Enter the **Model** name (e.g., `gemini-2.0-flash`, `mistral-nemo-instruct`).
4. Select an **API Key** from the dropdown menu. Keys are managed in the
   [Secrets Manager](../../platform-suite/secrets-manager.md).
5. Optionally, check **Use different key for embeddings** if you want to configure separate embedding settings.
6. In the **EMBEDDING** section, enter the **Embedding API URL** and **Embedding Model** name.
7. Click **Continue** to proceed.
{{< /tab >}}

{{< /tabs >}}

## Configure import settings

Configure complexity and parallelization settings for your import:

1. Adjust the **Complexity** slider. The setting ranges from
   **Basic (0%)** to **Standard (50%)** to **100%**. Higher complexity creates
   larger chunks, more gleaning, edge and community embeddings.
2. Set the number of **Parallel importers** using the number input (default is 2).
3. Click **Continue** to proceed.

## Deploy the AutoGraph service

The AutoGraph service powers the knowledge graph pipeline by analyzing
your documents and generating optimized import strategies:

1. Review the configuration summary showing your LLM provider and import settings.
2. Click **Deploy AutoGraph** to deploy the service.
3. Wait for the confirmation message **AutoGraph service deployed**.

## Build the corpus

After the AutoGraph service is deployed, build the corpus from your uploaded
documents. For details on what happens during this step, see
[Corpus Build](../reference/autograph/corpus-build.md).

1. The interface displays **Ready to build the corpus from your uploaded documents**.
2. Click **Build Corpus**.
3. Wait for the confirmation message **Corpus built successfully**.

## Generate strategies

The RAG strategizer analyzes your documents and generates import strategies.
For details on how strategies are determined, see
[RAG Strategizer](../reference/autograph/rag-strategizer.md).

1. After corpus building completes, click **Generate Strategies**.
2. Review the **Strategy Overview** which shows:
   - Number of partitions (e.g., "1 partition: 1 VectorRAG")
   - Strategy type (e.g., **VECTORRAG**)
   - Number of documents (e.g., "35 documents")
   - Entity types that will be extracted (e.g., `APP_VERSION`, `PROGRAMMING_LANGUAGE`, `DEPLOYMENT_TYPE`, `ARCHIVE_FILE`, etc.)
3. Click **Continue to Import** to proceed with the import.

{{< info >}}
AutoGraph automatically analyzes your document corpus and determines
the optimal import strategy, including which entity types to extract
and how to partition the data.
{{< /info >}}

## Import documents into the knowledge graph

After reviewing the strategy:

1. The interface displays **Ready to import your documents into the knowledge graph**.
2. Click **Start Import**.
3. Wait for the import process to complete.
   You will see **Import complete! Knowledge graph built successfully**.

{{< tip >}}
You can explore the generated knowledge graph in the [Graph Visualizer](../../platform-suite/graph-visualizer.md) at any time.
{{< /tip >}}

## Deploy the Retriever service

The [Retriever service](../reference/retriever/_index.md) enables intelligent
search and retrieval of information from your knowledge graph.

1. The interface automatically shows the retriever deployment section with your previously configured LLM provider.
2. Click **Deploy Retriever**.
3. Wait for the confirmation message **Retriever service deployed** with the service name (e.g., `arangodb-graphrag-retriever-gqmwd`).
4. Click the **New Chat** button to start chatting with your knowledge graph.

## Chat with your knowledge graph

After the retriever is deployed, the chat interface opens automatically.

{{< info >}}
You can deploy multiple retriever services with different configurations for the same knowledge graph.
{{< /info >}}

1. The chat interface provides three
   [search modes](../reference/retriever/search-methods.md):
   - **LOCAL**: Searches at the entity level within relevant partitions.
   - **UNIFIED**: Combines semantic and lexical search with graph expansion
     for fast, streamed responses (Instant Search).
   - **GLOBAL**: Searches at the community level across the knowledge graph.
2. Toggle **Deep Search** to enable LLM-planned multi-step retrieval over
   LOCAL search. See [Search Methods](../reference/retriever/search-methods.md)
   for details.
3. Under **Advanced** options, you can adjust additional
   [retriever parameters](../reference/retriever/parameters.md):
   - Adjust the **Level (GLOBAL)** setting.
   - Add custom **Response Instruction** to override the LLM answer style.
   - Toggle **Show citations** to include source references.
   - Toggle **Include metadata** to add metadata to responses.
   - Toggle **Use cache** for faster repeated queries.
4. Enter your question in the text area and click **Run**.
5. The response appears below with the status **COMPLETE**.
6. If citations are enabled, click on the citations panel to see source references with links to the specific chunks in your documents.

{{< tip >}}
To start a new chat session after the initial setup, click the **New Chat** button.
{{< /tip >}}

## Manage retriever services

To view and manage all deployed retriever services:

1. Navigate to the **Retrievers** page from the interface. The
   **RETRIEVER SERVICES** section shows all deployed retrievers with their
   status (e.g., **DEPLOYED**).
2. To create additional retriever services with different configurations,
   click **+ Deploy**.

Each retriever can have different settings for search level, response
instructions, and other parameters, allowing you to create specialized
retrievers optimized for different types of queries or use cases. For more
details, see the [Retriever service](../reference/retriever/_index.md)
reference documentation.
