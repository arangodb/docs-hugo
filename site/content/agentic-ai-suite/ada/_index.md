---
title: Ada – the ArangoDB AI Digital Assistant
menuTitle: Ada
weight: 16
description: >-
  Ask questions about your database in natural language with Ada, the ArangoDB
  AI Digital Assistant integrated into the Arango Contextual Data Platform
---

{{< embed-svg "Ada-Flow" "Ada end-to-end flow." >}}

Ada is the ArangoDB AI Digital Assistant built into the Arango Contextual Data
Platform. It lets you interact with your database using natural language instead
of writing AQL queries manually. You can explore collections, inspect data
structures, generate and execute queries, and create reusable query artifacts,
all through a conversational chat interface.

Ada is powered by an external large language model (LLM) of your choice. You
configure the provider and model once per database, and Ada uses the
corresponding API key stored in the
[Secrets Manager](../../platform-suite/secrets-manager.md).

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

## What's next

- **[Quick Start](quick-start.md)**: Configure Ada and get your first answer in
  four steps.
- **[Configure the LLM provider](llm-configuration.md)**: Choose your provider,
  model, and API key.
- **[Start a conversation](start-a-conversation.md)**: Ask questions and use the
  suggested prompts.
- **[Artifacts](artifacts.md)**: The interactive charts and custom HTML Ada
  renders alongside its answers.
- **[AQLizer](../natural-language-to-aql/_index.md)**: Generate AQL queries from
  natural language directly in the Query Editor.
- **[Secrets Manager](../../platform-suite/secrets-manager.md)**: Manage the API
  keys used by Ada and other services.
