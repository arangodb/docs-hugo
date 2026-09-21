---
title: Notebook Servers
menuTitle: Notebook Servers
weight: 20
description: >-
  Colocated Jupyter Notebooks within the Arango Contextual Data Platform
---
Notebooks provide a Python-based, Jupyter-compatible interface for building
and experimenting with graph-powered data, AI, and graph machine learning
workflows directly connected to ArangoDB databases. The notebook servers are
embedded in the Arango Contextual Data Platform ecosystem and offer a
pre-configured environment where everything, including all the necessary services
and configurations, comes preloaded. You don't need to set up or configure the
infrastructure, and can immediately start using the GraphML and AI
functionalities.

The notebooks are primarily focused on the following solutions:
- [AutoGraph](autograph/_index.md): Extract entities from text files to create a
  knowledge graph that you can then query with a natural language interface.
- [GraphML](graphml/_index.md): Apply machine learning to graphs for link prediction,
  classification, and similar tasks.
- [Adapters](../ecosystem/adapters/_index.md): Use ArangoDB together with cuGraph,
  NetworkX, and other data science tools.

The notebooks include the following:
- Automatic connection to the ArangoDB databases and to the Agentic AI Suite
  services such as GraphML, with credentials and endpoints pre-configured, so
  that you don't need to download any data locally or to remember user IDs,
  passwords, and endpoint URLs
- [Magic commands](#magic-commands) that simplify database interactions
- Example notebooks for learning
- A pre-installed [python-arango](https://docs.python-arango.com/en/main/)
  driver as well as the `arangoml` package and the ArangoDB adapters for
  [PyG](https://github.com/arangoml/pyg-adapter),
  [DGL](https://github.com/arangoml/dgl-adapter),
  [cuGraph](https://github.com/arangoml/cugraph-adapter), and
  [NetworkX](https://github.com/arangodb/nx-arangodb)

## Quickstart

1. In the Arango Contextual Data Platform web interface, expand **AI Tools** in the
   main navigation and click **Notebook servers**.
2. The page displays an overview of the notebook services.
   Click **New notebook server** to create a new one.
3. After your notebook service has been deployed, you can click the ID to start
   interacting with the Jupyter interface.

## Examples

- To get a better understanding of how to interact with ArangoDB using notebooks,
  open the `GettingStarted.ipynb` notebook from the file browser to learn the basics.
- To get started with GraphML using the integrated notebook servers, see
  the [GraphML Notebooks and API](graphml/notebooks-api.md) documentation.

## Magic commands

The notebooks come with built-in magic commands that answer questions like:
- What ArangoDB database am I connected to at the moment?
- What data does the ArangoDB instance contain?
- How can I access certain documents?
- How do I create a graph?

A list of the available magic commands you can interact with is provided below.
Single line commands have a `%` prefix and multi-line commands have a `%%` prefix.

**Database Commands**

- `%listDatabases` - lists the databases on the database server.
- `%whichDatabase` - returns the database name you are connected to.
- `%createDatabase databaseName` - creates a database.
- `%selectDatabase databaseName` - selects a database as the current database.
- `%useDatabase databasename` - uses a database as the current database;
  alias for `%selectDatabase`.
- `%getDatabase databaseName` - gets a database. Used for assigning a database,
   e.g. `studentDB` = `getDatabase student_database`.
- `%deleteDatabase databaseName` - deletes the database.

**Graph Commands**

- `%listGraphs` - lists the graphs defined in the currently selected database.
- `%whichGraph` - returns the graph name that is currently selected.
- `%createGraph graphName` - creates a named graph.
- `%selectGraph graphName` - selects the graph as the current graph.
- `%useGraph graphName` - uses the graph as the current graph;
  alias for `%selectGraph`.
- `%getGraph graphName` - gets the graph for variable assignment, 
  e.g. `studentGraph` = `%getGraph student-graph`.
- `%deleteGraph graphName` - deletes a graph.

**Collection Commands**

- `%listCollections` - lists the collections on the selected current database.
- `%whichCollection` - returns the collection name that is currently selected.
- `%createCollection collectionName` - creates a collection.
- `%selectCollection collectionName` - selects a collection as the current collection.
- `%useCollection collectionName` - uses the collection as the current collection;
  alias for `%selectCollection`.
- `%getCollection collectionName` - gets a collection for variable assignment,
  e.g. `student` = `% getCollection Student`.
- `%createEdgeCollection` - creates an edge collection.
- `%createVertexCollection` - creates a node collection.
- `%createEdgeDefinition` - creates an edge definition.
- `%deleteCollection collectionName` - deletes the collection.
- `%truncateCollection collectionName` - truncates the collection.
- `%sampleCollection collectionName` - returns a random document from the collection.
  If no collection is specified, then it uses the selected collection.

**Document Commands**

- `%insertDocument jsonDocument` - inserts the document into the currently selected collection.
- `%replaceDocument jsonDocument` - replaces the document in the currently selected collection.
- `%updateDocument jsonDocument` - updates the document in the currently selected collection.
- `%deleteDocument jsonDocument` - deletes the document from the currently selected collection.
- `%%importBulk jsonDocumentArray` - imports an array of documents into the currently selected collection.

**AQL Commands**

- `%aql single-line_aql_query` - executes a single line AQL query.
- `%%aqlm multi-line_aql_query` - executes a multi-line AQL query.

**Variables**

- `_endpoint` - the endpoint (URL) of the ArangoDB Server.
- `_system` - the system database used for creating, listing, and deleting databases.
- `_db` - the selected (current) database. To select a different database, use `%selectDatabase`.
- `_graph` - the selected (current) graph. To select a different graph, use `%selectGraph`.
- `_collection` - the selected (current) collection. To select a different collection, use `%selectCollection`.
- `_user` - the current user.

You can use these variables directly, for example, `_db.collections()` to list
collections or `_system.databases` to list databases.

You can also create your own variable assignments, such as:

- `schoolDB` = `%getDatabase schoolDB`
- `school_graph` = `%getGraph school_graph`
- `student` = `%getCollection Student`

**Reset environment**

In the event that any of the above variables have been unintentionally changed,
you can revert all of them to the default state with `reset_environment()`.

{{< tip >}}
GraphML comes with additional magic commands. See the
[`arangoml` magics reference](https://arangoml.github.io/arangoml/magics.html)
for the full list.
{{< /tip >}}
