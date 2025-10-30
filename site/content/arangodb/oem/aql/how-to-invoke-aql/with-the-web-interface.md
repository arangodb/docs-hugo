---
title: Executing AQL queries in the ArangoDB web interface
menuTitle: with the Web Interface
weight: 10
description: >-
  You can run ad-hoc AQL queries using the query editor in the web interface
---
In the **QUERIES** section of the web interface, type in a query in the main box
and execute it by clicking the **Execute** button. The query result is displayed
below the editor.

The editor provides a few example queries that you can use as templates.
It also provides a feature to explain a query and inspect its execution plan
by clicking the **Explain** button.

Bind parameters can be defined in the right-hand side pane. The format is the
same as used for bind parameters in the HTTP REST API and in (JavaScript)
application code.
 
Here is an example: 

```aql
FOR doc IN @@collection
  FILTER CONTAINS(LOWER(doc.author), @search, false)
  RETURN { "name": doc.name, "descr": doc.description, "author": doc.author }
```

Bind parameters (table view mode):

| Key         | Value  |
|-------------|--------|
| @collection | _apps  |
| search      | arango |

Bind parameters (JSON view mode):

```json
{
    "@collection": "_apps",
    "search": "arango"
}
```

How bind parameters work can be found in [AQL Fundamentals](../fundamentals/bind-parameters.md).

Queries can also be saved in the AQL editor along with their bind parameter values
for later reuse. This data is stored in the user profile in the current database
(in the `_users` system collection). 

Also see the detailed description of the [Web Interface](../../components/web-interface/_index.md).
