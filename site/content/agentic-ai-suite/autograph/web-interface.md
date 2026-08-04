---
title: How to use AutoGraph in the web interface
menuTitle: Web Interface
weight: 15
description: >-
  Learn how to create, configure, and run a complete AutoGraph workflow in the web interface
---
Learn how to use AutoGraph Studio to build a Context Graph from your documents.
AutoGraph analyzes your content, builds a Corpus Graph, and generates the
strategies for a Knowledge Graph. AutoRAG then deploys the retrievers that
answer questions from that Context Graph.

The workflow has two stages:

1. **AutoGraph**: Builds your Context Graph. This can be your finish line.
2. **AutoRAG**: Deploys retrievers so your agents and applications can answer
   questions from that Context Graph.

## Open AutoGraph Studio

1. From the left-hand sidebar, select the database where you want to create the
   project. You can switch to a different database at any time if you want to
   work elsewhere.
2. In the left-hand sidebar, click **Agentic AI Suite**, then click
   **AutoGraph Studio**. You can also open the **Agentic AI Suite** overview and
   click **Run AutoGraph Studio**.

## Create an AutoGraph project

1. In the **AutoGraph Studio** view, click **+ New Project**.
   Existing projects of the current database are listed as cards.
2. The **New project** dialog opens. Enter a **Project name** and, optionally,
   a **Description** of what this project's knowledge base is for.
3. Click **Create**.

The project opens the three-step setup wizard: **Docs**, **Configure**, and
**Build**.

## Add your documents

In the **Docs** step, you upload documents into categories. Each upload becomes
a category that you name. Documents are uploaded to the project when you
continue to the next step.

1. Click **Upload files** to select individual files, or **Upload folder** to
   upload an entire folder. Supported file formats are:
   - **Text files**: `.txt`, `.md`
   - **PDF files**: `.pdf`
   - **Office documents**: `.docx`, `.pptx`, `.xlsx`, `.doc`, `.ppt`, `.xls`
   - **OpenDocument formats**: `.odt`, `.odp`, `.ods`
   - **Rich Text Format**: `.rtf`
2. The **Name the category** dialog opens and lists the files you selected.
   Enter a unique **Category name** that describes what these files are about,
   for example `oasisctl` or `release-notes`.
3. Click **Upload `<N>` files**.
4. The files appear grouped under the category with a **Pending** status and
   their file size. You can:
   - Use the **Search files by name** field and the **Category** dropdown to
     filter the list.
   - Remove a single file with the cross icon, or delete a whole category with
     the trash icon.
   - Repeat the upload to add more categories.
5. Click **Next**. The documents are uploaded to the project and the wizard
   continues to the configuration step automatically.

{{< tip >}}
If you drop a folder, its name is used as the category name. For loose files,
you name the category yourself.
{{< /tip >}}

## Configure the LLM provider

In the **Configure** step, choose the LLM provider used to build the Corpus
Graph. A banner confirms what you are building from, for example
*Building from 50 documents across 1 category*.

{{< warning >}}
The provider configuration is baked into the build. Changing it later requires a
rebuild of the Corpus Graph.
{{< /warning >}}

{{< tabs "llm-provider" >}}

{{< tab "OpenAI" >}}
1. In the **CHAT LLM** section, select **OpenAI** from the **Provider** dropdown
   menu.
2. Select the model you want to use from the **Model** dropdown menu.
   The default is `gpt-5.4-nano`.
3. In the **API key** field, search for a saved secret or add a new one. Keys are
   managed in the [Secrets Manager](../../platform-suite/secrets-manager.md).
4. Optionally, select **Use a different key for embeddings** to configure a
   separate key for the embedding model. Otherwise, embeddings use your chat
   provider and key.
5. In the **EMBEDDING** section, select the **Embedding model**
   (`text-embedding-3-small` or `text-embedding-3-large`).
6. In the **MULTIMODAL** section, select the **Multimodal model**. This model
   describes images in your documents during the build. Keep
   **Provider default** or select a specific model.
7. Click **Start build**.
{{< /tab >}}

{{< tab "Custom (OpenAI-compatible)" >}}
1. In the **CHAT LLM** section, select **Custom (OpenAI-compatible)** from the
   **Provider** dropdown menu.
2. Enter the URL of your OpenAI-compatible endpoint and the **Model** name.
3. In the **API key** field, search for a saved secret or add a new one. Keys are
   managed in the [Secrets Manager](../../platform-suite/secrets-manager.md).
4. Optionally, select **Use a different key for embeddings** to configure a
   separate endpoint and key for the embedding model.
5. Configure the **EMBEDDING** and **MULTIMODAL** sections as needed.
6. Click **Start build**.
{{< /tab >}}

{{< /tabs >}}

Clicking **Start build** moves the wizard to the **Build** step and deploys the
AutoGraph service with these settings. The Corpus Graph itself is built in the
next step, once the service is up and you click **Build Corpus Graph**.

For more details, see [LLM Configuration](llm-configuration.md).

## Build the Corpus Graph

The **Build** step shows the two operations it performs. For details on what
happens during the corpus build, see [Corpus Build](reference/corpus-build.md).

1. **Deploy AutoGraph service**: The service is deployed and the interface waits
   for it to respond, showing *Checking service status…*. The **Service ID** is
   displayed, for example `arangodb-autograph-2orvp`. Wait for the confirmation
   message **AutoGraph service deployed**.
2. Click **Build Corpus Graph**.
3. **Build corpus**: Your documents are extracted into the Corpus Graph. When it
   completes, a **Corpus graph ready** notification appears and the project
   overview opens.

{{< info >}}
If the build fails, the reason is shown above the step list, for example
*The LLM provider rejected the API key — update it in Configure*. Go **Back** to
fix the configuration, then click **Retry build**.
{{< /info >}}

## The project overview

The project overview is the home of your project. It has the following sections:

- **Context Graph**: The Corpus Graph and the Knowledge Graph.
- **Categories**: The documents in the project, grouped by category.
- **Model & credentials**: The provider and models used by the build.
- **AutoRAG**: Deploy retrievers against your Context Graph.

Your Context Graph is the Corpus Graph together with the Knowledge Graph. The
credentials and retriever services shown alongside them configure and serve the
Context Graph, but are not part of it.

## Explore the Corpus Graph

The **Corpus Graph** card shows the graph name (for example
`<project>_CorpusGraph`) and its number of nodes and edges.

- Click **Open in Graph Explorer** to inspect the graph. You can search and add
  nodes to the canvas, run queries, change the layout, and style node types by
  color, icon, and label, including attribute-based rules. For more information,
  see [Graph Visualizer](../../platform-suite/graph-visualizer.md).
- Click **Rebuild** to build the Corpus Graph again from scratch, for example
  after changing the provider or models.

## Add more documents

You can add documents to an existing project at any time.

1. In the **Categories** section, click **+ Add new category**.
2. Drop files or a folder in the upload area, or use the **Choose files** and
   **Choose folder** buttons. Each upload becomes its own category, which you
   name next.
3. Click **Add `<N>` categories**.

Added categories are staged as pending. They are listed with a
**not in corpus yet** badge, and an **Unbuilt changes — update the Corpus Graph**
banner appears at the top of the project with the affected categories.

To include them in your Context Graph, click **Update Corpus Graph**.

{{< info >}}
If the update fails, an error notification names the failing step, for example a
File Parser batch that produced no successful Markdown documents. Check the file
formats of the affected category and try again.
{{< /info >}}

## Generate strategies and build the Knowledge Graph

The **Knowledge Graph** card shows the graph name (for example `<project>_kg`)
and whether the Knowledge Graph is built. The RAG Strategizer analyzes the
Corpus Graph and generates the import strategies per domain. For details on how
strategies are determined, see [RAG Strategizer](reference/rag-strategizer.md).

1. Click **Generate strategies** on the **Knowledge Graph** card. This assigns
   each domain a strategy (`FullGraphRAG` or `VectorRAG`) and writes one strategy
   profile per domain. It does not build the Knowledge Graph yet.
2. Click **Start Import** to run orchestration. Importer workers process each
   strategy profile and write the Knowledge Graph collections. For details, see
   [Orchestration](reference/orchestration.md).
3. Wait for the import to complete. You will see
   **Import complete! Knowledge graph built successfully**, and the
   **Knowledge Graph** card shows the graph as built.

{{< info >}}
**Generate strategies** is disabled while there are unbuilt changes. Update the
Corpus Graph first so that the strategies cover your latest documents.
{{< /info >}}

{{< tip >}}
You can explore the Knowledge Graph in the
[Graph Visualizer](../../platform-suite/graph-visualizer.md) at any time.
{{< /tip >}}

## Change the provider or key

The **Model & credentials** card lists the **Provider**, **Chat model**,
**Embedding model**, and **Multimodal model** of your project.

To change them, click **Change provider or key**. Because the provider is baked
into the build, rebuild the Corpus Graph afterwards to apply the new
configuration.

## Deploy an AutoRAG retriever

Retrievers let your agents and applications ask questions against your Context
Graph. You can deploy one or as many as you wish.

1. Open the **AutoRAG retrievers** panel from the document icon in the project
   sidebar, or click **Deploy retriever** in the **AutoRAG** section of the
   project overview.
2. In the **RETRIEVER SERVICES** list, click **+ Deploy**, or click
   **Deploy Retriever** if no retriever service exists yet.
3. In the **Deploy New AutoRAG Retriever** form, configure the following:
   - **Provider**: For example, **OpenAI**.
   - **Chat Model**: For example, **GPT-5.4 Nano**.
   - **Embedding Model**: For example, **Text Embedding 3 Small**.
   - **API Key**: Select a saved key or select **New Key** and enter it.
4. Click **Deploy**.

The retriever appears in the **RETRIEVER SERVICES** list with its ID and a
**DEPLOYED** status.

## Chat with your Context Graph

Select a retriever from the list to open its playground and its past runs, then
click **New Run**.

{{< info >}}
The playground shows *Waiting for retriever service to become reachable…* until
the service is ready to answer.
{{< /info >}}

1. Choose one of the three
   [search modes](../retriever/search-methods/_index.md):
   - **LOCAL**: Searches at the entity level within relevant partitions.
   - **UNIFIED**: Combines semantic and lexical search with graph expansion
     for fast, streamed responses (Instant Search).
   - **GLOBAL**: Searches at the community level across the knowledge graph.
2. Toggle **Deep Search** to enable LLM-planned multi-step retrieval over
   LOCAL search. See [Search Methods](../retriever/search-methods/_index.md)
   for details.
3. Under **Advanced**, you can adjust additional
   [retriever parameters](../retriever/parameters.md), such as the level used by
   GLOBAL search, a custom response instruction, citations, metadata, and
   caching.
4. Enter your question and click **Run**.

## Manage retriever services

The **RETRIEVER SERVICES** section of the **AutoRAG retrievers** panel lists all
deployed retrievers with their status and past runs.

- Click **+ Deploy** to add another retriever with a different configuration.
- Click the trash icon next to a retriever to remove it.

Each retriever can have different settings for search level, response
instructions, and other parameters, allowing you to create specialized
retrievers optimized for different types of queries or use cases. For more
details, see the [Retriever service](../retriever/) reference documentation.
