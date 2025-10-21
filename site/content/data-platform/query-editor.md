---
title: Query editor
menuTitle: Query editor
weight: 30
description: >-
  Write, run, and analyze AQL queries using an IDE-like interface
---
{{< tag "Experimental" >}}

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
  You can drag and drop tabs to re-order, move them between existing panels,
  as well as split panels vertically and horizontally into more panels.

- **Ask AI for AQL Queries**:
  Describe what you want in natural language and generate AQL queries right
  from the query editor. This feature requires the AI Services component.
