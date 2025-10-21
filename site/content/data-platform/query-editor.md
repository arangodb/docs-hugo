---
title: Query editor
menuTitle: Query editor
weight: 30
description: >-
  Write, run, and analyze AQL queries using an IDE-like interface
---
{{< tag "Experimental" >}}

## Features

The query editor of the Arango Data Platform offers the following features:

- **Tabbed interface**:
  Work on multiple queries concurrently via tabs.

- **Query and results side by side**:
  View results in a separate tab, with one results tab for each query tab.

  If there is no results tab yet and you run, explain, or profile a query, the
  view splits into a left panel with the input queries and a right panel with
  the results.

- **Result history**:
  A results tab shows the previous run, explain, and profile outputs.
  You can individually collapse and expand the entries, as well as clear the
  entire history.

- **Re-organizable viewport**:
  You can drag and drop tabs to re-order them and move them between existing
  panels, as well as split panels vertically and horizontally into more panels.

- **Ask AI for AQL Queries (AQLizer)**:
  Describe what you want in natural language and generate AQL queries right
  from the query editor. This feature requires the AI Services component.

{{< info >}}
The query editor of the Data Platform is not feature-complete. It currently
lacks features such as remembering entered queries and results, a way to set
query options, syntax highlighting, and so on. Use the query editor of ArangoDB
instead if you need these features. You can find it under **Management** in the
Data Platform web interface, and then **Queries** in the second-level navigation.
{{< /info >}}

## Work with queries

You can enter your AQL query code into the default tab, or open more query tabs
at any point by clicking the `+` button at the top of a panel.<!-- TODO: use icon shortcode -->
You close tabs with the `x` button, except for the last remaining tab.

A floating panel in the top right corner lets you enter values for
**Bind variables** if there are any such placeholders in the query. You can
minimize this panel to a button.

The following buttons are available at the bottom of a query tab:
- **Run query**: Execute the AQL query normally.
- **Explain**: Show the execution plan for the query.
- **Profile**: Run the query with detailed tracking of its performance.

## Generate queries

{{< tag "AI Services" >}}

Click the **AQLizer** button to open the panel for generating AQL queries with
AI. The interface is like a chat, where you enter a question in natural language
and then click **Ask** to use GenAI for generating a query that can answer the
question.

## Adjust the viewport

The following options for re-organizing how tabs and panels are arranged in the
query editor are available:

- You can drag a tab with your mouse to a different place in the tab list to
  change the order of the tabs or move a tab to a different panel.
- You can drag a tab to the left or right side of a panel to split it
  horizontally, or to the top or bottom to split it vertically.
  If you move or close the last remaining tab of panel elsewhere, the space is
  automatically reclaimed.
