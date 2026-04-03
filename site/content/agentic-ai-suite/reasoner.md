---
title: The Reasoner feature of the Arango Contextual Data Platform
menuTitle: Reasoner
weight: 18
description: >-
  Analyze and optimize AQL queries using AI-powered reasoning with the Reasoner
  feature of the Agentic AI Suite
---

The Reasoner feature lets you analyze and optimize your AQL queries directly in
the Arango Contextual Data Platform. It uses an AI-powered reasoning engine that
interacts with ArangoDB through the MCP Server to understand your data model and
suggest targeted improvements. You can ask questions, optimize queries, or
explore your database — all from within the Query Editor.

The Reasoner is accessible from the **Query Editor**. It requires a license.

## Access the Reasoner

You can open the Reasoner panel in two ways:

- From the **Welcome** tab of the Query Editor, click **Open Reasoner** in the
  **Start** section.
- From any query tab, click **Optimize** in the toolbar at the bottom of the
  editor.

The Reasoner opens as a **Reasoner** tab in the right panel of the Query Editor.

## Set up the Reasoner

On first use, the **Setup Reasoner** panel prompts you to configure an AI
provider for the current database.

1. In the **OpenAI API Key** field, enter your API key directly or pick one from
   the dropdown of saved secrets managed in the
   [Secrets Manager](../platform-suite/secrets-manager.md).
2. Select an **OpenAI Model** from the dropdown.
3. Click **Start Service**. A progress indicator shows the startup status.
   The service starts and then waits for the MCP server connection to be
   established. Chat input is enabled once the connection is confirmed and
   **MCP Connected** is shown in the bottom status bar.

You can check the status of the service and MCP server, or restart and stop the
service at any time from the **Manage Services** dialog at the bottom of the
panel.

## Ask the Reasoner

Once the Reasoner service is ready, you can submit questions and optimization
requests.

1. Type your question or instruction in the input field at the bottom of the
   Reasoner panel, for example `Optimize this query` or
   `Find all users connected to product X`.
2. Press {{< kbd "Enter" >}} to send, or {{< kbd "Shift Enter" >}} to insert a
   line break without sending.
3. The Reasoner responds with an **AI Reasoning Response**. Code suggestions in
   the response include an **Open in Editor** button to apply the query to a new
   query tab, where you can verify and run it.

{{< tip >}}
The Reasoner operates in one-shot mode. Each question is independent — there is
no follow-up context between messages.
{{< /tip >}}

{{< warning >}}
Always verify AI-generated query optimizations.
AI can make mistakes or produce unexpected results.
{{< /warning >}}

## History

Click **History** in the top-right corner of the Reasoner panel to expand the
session history. Each past session is listed by its first message and timestamp.
To delete all past sessions, click **Clear History** and confirm when prompted.

## What's next

- **[Query Editor](../platform-suite/query-editor.md#optimize-queries-reasoner)**:
  Learn about the full Query Editor interface including the Optimize button.
- **[AQLizer](aqlizer.md)**: Generate AQL queries from natural language directly
  in the Query Editor.
- **[Secrets Manager](../platform-suite/secrets-manager.md)**: Manage the API
  keys used by the Reasoner and other services.
