---
title: The Query Editor of the Arango Data Platform
menuTitle: Query Editor
weight: 30
description: >-
  Write, run, and analyze AQL queries using an IDE-like interface
---
{{< tag "Experimental" >}}

## Features

The Query Editor of the Arango Data Platform offers the following features:

- **Tabbed interface**:
  Work on multiple queries concurrently via tabs.

- **Query and results side by side**:
  View the results of running, explaining, and profiling a query in a separate
  tab, with one results tab for each query tab.

- **Result history**:
  A results tab shows the previous run, explain, and profile outputs.
  You can individually collapse and expand the entries, as well as clear the
  entire history.

- **Saved queries**:
  You can save frequently used queries to add them to a sidebar for all users
  in the current database.  

- **Remembered queries and results**:
  The Query Editor remembers its state including unsaved queries as well as
  results across sessions using your local browser storage.

- **Re-organizable viewport**:
  You can drag and drop tabs to re-order them and move them between existing
  panels, as well as split panels vertically and horizontally into more panels.

- **Ask AI for AQL Queries (AQLizer)**:
  Describe what you want in natural language and generate AQL queries right
  from the Query Editor. This feature is only available in the
  Arango AI Data Platform.

{{< info >}}
The Query Editor of the Data Platform is not feature-complete. It currently
lacks features like syntax highlighting and a way to set query options.
Use the query editor of ArangoDB instead if you need these features.
You can find it under **Management** in the Data Platform web interface, and
then **Queries** in the second-level navigation.
{{< /info >}}

## Work with queries

You can enter your AQL query code into the default tab, or open more query tabs
at any point by clicking the button at the top of a panel to the right of the
tabs ({{< icon "add" >}}).

You can close tabs with the button next to the tab name ({{< icon "close" >}}).
When you close all tabs, the viewport opens the **Welcome** tab.

A floating panel in the top right corner lets you enter values for
**Bind variables** if there are any such placeholders in the query. You can
minimize this panel to a button.

The following buttons are available at the bottom of a query tab:

- **Save**: Store the query and the bind variables under a name you provide.
  The saved queries of the current database are listed in the sidebar on the
  left-hand side under **Saved**, where you can also clone, rename, and delete them.
- **AQLizer**: This button is only visible if you use the AI Data Platform.
  See [Generate queries (AQLizer)](#generate-queries-aqlizer).
- **Run query**: Execute the AQL query normally.
- **Explain**: Show the execution plan for the query.
- **Profile**: Run the query with detailed tracking of its performance.

The sidebar on the left-hand side allows you to manage queries:

- **Search queries**: Filter the list of **Saved** queries by name.
- **Saved**: Open previously saved queries by clicking the name, or click the
  small button ({{< icon "ellipsis" >}}) to duplicate, rename, or delete
  saved queries.
- **Running**: Open a tab with an overview over the currently executing queries.
  You can also kill a query from this view.
- **Slow Queries**: Open a tab with a list of past queries that ran longer than
  a server-configured threshold.

## Generate queries (AQLizer)

{{< tag "AI Data Platform" >}}

For an introduction to the AQLizer, see
[The AQLizer feature of the Arango AI Data Platform](../ai-suite/aqlizer.md).

Before you can generate AQL queries, you need to set up the AQLizer feature.

1. Click the **AQLizer** button to open the panel for generating AQL queries
   with AI.
2. On first use, you are asked for an **OpenAPI API Key** and you can select the
   desired **OpenAI Model**.
3. Click **Start Service**.
4. You can check the status of the service as well as stop it from the
   **Manage Services** dialog.

Once the AQLizer service is ready, you can generate queries.

1. In the AQLizer tab, enter a self-contained question or instructions in
   natural language, like "List all distinct surnames of characters older than 30".
2. Click **Ask** to use GenAI for generating an AQL query.
3. Verify and refine the query in the editor.

## Adjust the viewport

The following options for re-organizing how tabs and panels are arranged in the
Query Editor are available:

- You can drag a tab with your mouse to a different place in the tab list to
  change the order of the tabs or move a tab to a different panel.
- You can drag a tab to the left or right side of a panel to split it
  horizontally, or to the top or bottom to split it vertically.
  If you move or close the last remaining tab of panel elsewhere, the space is
  automatically reclaimed.
