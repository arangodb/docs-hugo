---
title: How to use the Reasoner in the Arango Contextual Data Platform web interface
menuTitle: Web Interface
weight: 10
description: >-
  Step-by-step instructions for accessing, setting up, and using the Reasoner
  from the Query Editor in the Arango Contextual Data Platform web interface
---

The Reasoner is accessible directly from the **Query Editor** in the Arango
Contextual Data Platform. It requires the Agentic AI Suite license.

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
   [Secrets Manager](../../platform-suite/secrets-manager.md).
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
The Reasoner operates in one-shot mode. Each question is independent: there is
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
