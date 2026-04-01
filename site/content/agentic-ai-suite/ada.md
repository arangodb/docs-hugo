---
title: Ada – the ArangoDB AI Digital Assistant
menuTitle: Ada
weight: 16
description: >-
  Ask questions about your database in natural language with Ada, the ArangoDB
  AI Digital Assistant integrated into the Arango Contextual Data Platform
---

Ada is the ArangoDB AI Digital Assistant built into the Arango Contextual Data
Platform. It lets you interact with your database using natural language instead
of writing AQL queries manually. You can explore collections, inspect data
structures, generate and execute queries, and create reusable query artifacts,
all through a conversational chat interface.

Ada is powered by an external large language model (LLM) of your choice. You
configure the provider and model once per database, and Ada uses the
corresponding API key stored in the
[Secrets Manager](../platform-suite/secrets-manager.md).

Ada is accessible from the left sidebar under **Ada**. It is scoped to the
database currently selected in the database selector at the top of the sidebar.
The top bar shows the active database name alongside the LLM provider and model
in use, for example `_system  openai/gpt-4.1`.

## Features

- **Natural language queries**:
  Describe what you want in plain English and Ada generates and executes the
  appropriate AQL query on your behalf.

- **Collection exploration**:
  List collections in the current database along with their document counts.

- **Data structure inspection**:
  Explore the schema and structure of your data without writing any code.

- **Query execution**:
  Run AQL queries directly from the chat and see results inline.

- **Reusable query artifacts**:
  Save generated queries for later reuse across sessions.

- **Chat history**:
  Review and revisit previous conversations using the **History** menu in the
  top bar.

## Configure the LLM provider

Before using Ada you need to configure the LLM provider and model for the
current database.

1. Click the gear icon (⚙) in the top-right corner of the Ada panel to open the
   **Chat Settings** dialog.
2. Select a **Provider** from the dropdown. Supported options are **Anthropic**,
   **OpenAI**, **OpenRouter**, and **Custom Endpoint**.
3. Select a **Model**. The available models depend on the selected provider.
   For OpenAI, the options include GPT-4o, GPT-4o Mini, and o3-mini.
   You can also enter a custom identifier using the **Use custom model ID** link
   below the model dropdown.
4. Select an **API Key** from the dropdown. Keys are managed in the
   [Secrets Manager](../platform-suite/secrets-manager.md).
5. Click **Save**. The top bar updates to reflect the active configuration.

{{< tip >}}
Add your LLM provider API key in the [Secrets Manager](../platform-suite/secrets-manager.md)
before configuring Ada.
{{< /tip >}}

## Start a conversation

Type your question or instruction in the **Ask about your database...** input
field at the bottom of the panel and press **Enter** to send. Use
**Shift+Enter** to insert a line break without sending.

You can also click any of the suggested prompt buttons on the welcome screen to
get started quickly:

- **What collections do I have?**
- **List documents in a collection and make a chart out of it**
- **Create a query to find all users**
- **Explore my data structure**
- **Execute an AQL query**

To start a fresh conversation, click **+ New Chat** in the top bar. To browse
previous conversations, click **History**.

## What's next

- **[AQLizer](aqlizer.md)**: Generate AQL queries from natural language directly
  in the Query Editor without leaving your query workflow.
- **[Secrets Manager](../platform-suite/secrets-manager.md)**: Manage the API
  keys used by Ada and other services.
