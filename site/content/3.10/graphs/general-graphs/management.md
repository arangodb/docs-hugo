---
title: Graph Management
weight: 5
description: >-
  This chapter describes the JavaScript interface for creating and modifying named graphs
archetype: default
---
This chapter describes the javascript interface for creating and modifying
[named graphs](../first-steps.md#named-graphs).

## Edge Definitions

An edge definition is always a directed relation of a graph. Each graph can
have arbitrary many relations defined within the edge definitions array.

### Initialize the List

Create a list of edge definitions to construct a graph:

`graph_module._edgeDefinitions(relation1, relation2, ..., relationN)`

- `relation` (object, _optional_):
  An object representing a definition of one relation in the graph

The list of edge definitions of a graph can be managed by the graph module
itself. This function is the entry point for the management and returns
the correct list.

**Examples**

```js
---
name: generalGraphEdgeDefinitionsSimple
description: ''
render: input/output
version: '3.10'
server_name: stable
type: single
---
  var graph_module = require("@arangodb/general-graph");
  directed_relation = graph_module._relation("lives_in", "user", "city");
  undirected_relation = graph_module._relation("knows", "user", "user");
  edgedefinitions = graph_module._edgeDefinitions(directed_relation, undirected_relation);
```

### Extend the List

Extend the list of edge definitions to construct a graph:

`graph_module._extendEdgeDefinitions(edgeDefinitions, relation1, relation2, ..., relationN)`

- `edgeDefinitions` (array):
  A list of relation definition objects.
- `relationX` (object):
  An object representing a definition of one relation in the graph

In order to add more edge definitions to the graph before creating
this function can be used to add more definitions to the initial list.

**Examples**

```js
---
name: generalGraphEdgeDefinitionsExtend
description: ''
render: input/output
version: '3.10'
server_name: stable
type: single
---
  var graph_module = require("@arangodb/general-graph");
  directed_relation = graph_module._relation("lives_in", "user", "city");
  undirected_relation = graph_module._relation("knows", "user", "user");
  edgedefinitions = graph_module._edgeDefinitions(directed_relation);
  edgedefinitions = graph_module._extendEdgeDefinitions(undirected_relation);
```

### Relation

Define a directed relation:

`graph_module._relation(relationName, fromVertexCollections, toVertexCollections)`

- `relationName` (string):
  The name of the edge collection where the edges should be stored.
  It is created if it does not exist yet.
- `fromVertexCollections` (string\|array):
  One or a list of collection names. Source vertices for the edges
  have to be stored in these collections. Collections are created if they
  do not exist.
- `toVertexCollections` (string\|array):
  One or a list of collection names. Target vertices for the edges
  have to be stored in these collections. Collections are created if they
  do not exist.

The `relationName` defines the name of this relation and references to the
underlying edge collection. The `fromVertexCollections` is an Array of document
collections holding the start vertices. The `toVertexCollections` is an array
of document collections holding the target vertices. Relations are only allowed
in the direction from any collection in `fromVertexCollections` to any
collection in `toVertexCollections`.

**Examples**

A relation from one vertex collection to another:

```js
---
name: generalGraphRelationDefinitionSingle
description: ''
render: input/output
version: '3.10'
server_name: stable
type: single
---
var graph_module = require("@arangodb/general-graph");
graph_module._relation("has_bought", "Customer", "Product");
```

A relation from multiple vertex collections to multiple others:

```js
---
name: generalGraphRelationDefinitionSave
description: ''
render: input/output
version: '3.10'
server_name: stable
type: single
---
var graph_module = require("@arangodb/general-graph");
graph_module._relation("has_bought", ["Customer", "Company"], ["Groceries", "Electronics"]);
```

### Edge Definition Options

The following edge definition options are supported:

- `satellites` (array, _optional_):
  An array of collection names that is used to create [SatelliteCollections](../../develop/satellitecollections.md)
  for a (Disjoint) SmartGraph using SatelliteCollections (Enterprise Edition only).
  Each array element must be a string and a valid collection name. The collection
  type cannot be modified later.

## Create a Graph

`graph_module._create(graphName, edgeDefinitions, orphanCollections)`

- `graphName` (string):
  Unique identifier of the graph
- `edgeDefinitions` (array, _optional_):
  List of relation definition objects
- `orphanCollections` (array, _optional_):
  List of additional vertex collection names

The creation of a graph requires the name of the graph and a definition of
its edges.

For every type of edge definition a convenience method exists that can be used
to create a graph. Optionally a list of vertex collections can be added, which
are not used in any edge definition. These collections are referred to as
orphan collections within this chapter. All collections used within the
creation process are created if they do not exist.

**Examples**

Create an empty graph, edge definitions can be added at runtime:

```js
---
name: generalGraphCreateGraphNoData
description: ''
render: input/output
version: '3.10'
server_name: stable
type: single
---
  var graph_module = require("@arangodb/general-graph");
  graph = graph_module._create("myGraph");
~ graph_module._drop("myGraph", true);
```

Create a graph using an edge collection `edges` and a single
vertex collection `vertices`:

```js
---
name: generalGraphCreateGraphSingle
description: ''
render: input/output
version: '3.10'
server_name: stable
type: single
---
~ db._drop("edges");
~ db._drop("vertices");
  var graph_module = require("@arangodb/general-graph");
  var edgeDefinitions = [ { collection: "edges", "from": [ "vertices" ], "to" : [ "vertices" ] } ];
  graph = graph_module._create("myGraph", edgeDefinitions);
~ graph_module._drop("myGraph", true);
```

Create a graph with edge definitions and orphan collections:

```js
---
name: generalGraphCreateGraph2
description: ''
render: input/output
version: '3.10'
server_name: stable
type: single
---
  var graph_module = require("@arangodb/general-graph");
  graph = graph_module._create("myGraph",
  [graph_module._relation("myRelation", ["male", "female"], ["male", "female"])], ["sessions"]);
~ graph_module._drop("myGraph", true);
```

### Complete Example to Create a Graph

Example call:

```js
---
name: general_graph_create_graph_example1
description: ''
render: input/output
version: '3.10'
server_name: stable
type: single
---
  var graph_module = require("@arangodb/general-graph");
  var edgeDefinitions = graph_module._edgeDefinitions();
  graph_module._extendEdgeDefinitions(edgeDefinitions, graph_module._relation("friend_of", "Customer", "Customer"));
  graph_module._extendEdgeDefinitions(
  edgeDefinitions, graph_module._relation(
  "has_bought", ["Customer", "Company"], ["Groceries", "Electronics"]));
  graph_module._create("myStore", edgeDefinitions);
~ graph_module._drop("myStore");
~ db._drop("Electronics");
~ db._drop("Customer");
~ db._drop("Groceries");
~ db._drop("Company");
~ db._drop("has_bought");
~ db._drop("friend_of");
```

Alternative call:

```js
---
name: general_graph_create_graph_example2
description: ''
render: input/output
version: '3.10'
server_name: stable
type: single
---
  var graph_module = require("@arangodb/general-graph");
   var edgeDefinitions = graph_module._edgeDefinitions(
   graph_module._relation("friend_of", ["Customer"], ["Customer"]), graph_module._relation(
   "has_bought", ["Customer", "Company"], ["Groceries", "Electronics"]));
  graph_module._create("myStore", edgeDefinitions);
~ graph_module._drop("myStore");
~ db._drop("Electronics");
~ db._drop("Customer");
~ db._drop("Groceries");
~ db._drop("Company");
~ db._drop("has_bought");
~ db._drop("friend_of");
```

## List available Graphs

Lists all graph names stored in this database:

`graph_module._list()`


Lists all graph definitions stored in this database:

`graph_module._listObjects()`

**Examples**

List the graph names:

```js
---
name: generalGraphList
description: ''
render: input/output
version: '3.10'
server_name: stable
type: single
---
  var graph_module = require("@arangodb/general-graph");
~ graph_module._create("myGraph");
~ graph_module._create("myStore");
  graph_module._list();
~ graph_module._drop("myGraph");
~ graph_module._drop("myStore");
```

List the graph definitions:

```js
---
name: generalGraphListObjects
description: ''
render: input/output
version: '3.10'
server_name: stable
type: single
---
  var graph_module = require("@arangodb/general-graph");
~ graph_module._create("myGraph", [ { collection: "edges", "from": [ "vertices" ], "to" : [ "vertices" ] } ]);
~ graph_module._create("myStore", [ { collection: "friend_of", from: [ "Customer" ], to: [ "Customer" ] }, { collection: "has_bought", from: [ "Customer", "Company" ], to: [ "Groceries", "Electronics" ] } ]);
  graph_module._listObjects();
~ graph_module._drop("myGraph", true);
~ graph_module._drop("myStore", true);
```

## Load a Graph

Get a graph by its name:

`graph_module._graph(graphName)`

- `graphName` (string):
  Unique identifier of the graph

**Examples**

```js
---
name: generalGraphLoadGraph
description: ''
render: input/output
version: '3.10'
server_name: stable
type: single
---
~ var examples = require("@arangodb/graph-examples/example-graph.js");
~ var g1 = examples.loadGraph("social");
  var graph_module = require("@arangodb/general-graph");
  graph = graph_module._graph("social");
~ examples.dropGraph("social");
```

## Remove a Graph

Drop a Graph by its name:

`graph_module._drop(graphName, dropCollections)`

- `graphName` (string):
  Unique identifier of the graph
- `dropCollections` (bool, _optional_):
  Define if collections should be dropped (default: `false`)

This can drop all collections contained in the graph as long as they are not
used within other graphs. To drop the collections only belonging to this graph,
the optional parameter `drop-collections` has to be set to `true`.

**Examples**

Drop a graph and keep collections:

```js
---
name: generalGraphDropGraphKeep
description: ''
render: input/output
version: '3.10'
server_name: stable
type: single
---
~ var examples = require("@arangodb/graph-examples/example-graph.js");
~ var g1 = examples.loadGraph("social");
  var graph_module = require("@arangodb/general-graph");
  graph_module._drop("social");
  db._collection("female");
  db._collection("male");
  db._collection("relation");
~ db._drop("female");
~ db._drop("male");
~ db._drop("relation");
~ examples.dropGraph("social");
```

Drop a graph and its collections:

```js
---
name: generalGraphDropGraphDropCollections
description: ''
render: input/output
version: '3.10'
server_name: stable
type: single
---
~ var examples = require("@arangodb/graph-examples/example-graph.js");
~ var g1 = examples.loadGraph("social");
  var graph_module = require("@arangodb/general-graph");
  graph_module._drop("social", true);
  db._collection("female");
  db._collection("male");
  db._collection("relation");
```

## Modify a Graph definition at runtime

After you have created a graph its definition is not immutable.
You can still add, delete or modify edge definitions and vertex collections.

### Extend the Edge Definitions

Add another edge definition to the graph:

`graph._extendEdgeDefinitions(edgeDefinition, options)`

- `edgeDefinition` (object):
  The relation definition to extend the graph
- `options` (object):
  Additional options related to the edge definition itself.
  See [Edge Definition Options](#edge-definition-options).

Extends the edge definitions of a graph. If an orphan collection is used in this
edge definition, it is removed from the orphanage. If the edge collection of
the edge definition to add is already used in the graph or used in a different
graph with different `from` and/or `to` collections an error is thrown.

**Examples**

```js
---
name: general_graph__extendEdgeDefinitions
description: ''
render: input/output
version: '3.10'
server_name: stable
type: single
---
  var graph_module = require("@arangodb/general-graph")
  var ed1 = graph_module._relation("myEC1", ["myVC1"], ["myVC2"]);
  var ed2 = graph_module._relation("myEC2", ["myVC1"], ["myVC3"]);
  var graph = graph_module._create("myGraph", [ed1]);
  graph._extendEdgeDefinitions(ed2);
  graph = graph_module._graph("myGraph");
~ graph_module._drop("myGraph", true);
```

### Modify an Edge Definition

Modify a relation definition:

`graph_module._editEdgeDefinitions(edgeDefinition, options)`

- `edgeDefinition` (object):
  The edge definition to replace the existing edge definition with the same
  attribute `collection`.
- `options` (object):
  Additional options related to the edge definition itself.
  See [Edge Definition Options](#edge-definition-options).

Edits one relation definition of a graph. The edge definition used as argument
replaces the existing edge definition of the graph which has the same collection.
Vertex Collections of the replaced edge definition that are not used in the new
definition are transformed to an orphan. Orphans that are used in this new edge
definition are deleted from the list of orphans. Other graphs with the same edge
definition are modified, too.

**Examples**

```js
---
name: general_graph__editEdgeDefinition
description: ''
render: input/output
version: '3.10'
server_name: stable
type: single
---
  var graph_module = require("@arangodb/general-graph")
  var original = graph_module._relation("myEC1", ["myVC1"], ["myVC2"]);
  var modified = graph_module._relation("myEC1", ["myVC2"], ["myVC3"]);
  var graph = graph_module._create("myGraph", [original]);
  graph._editEdgeDefinitions(modified);
~ graph_module._drop("myGraph", true);
```

### Delete an Edge Definition

Delete one relation definition:

`graph_module._deleteEdgeDefinition(edgeCollectionName, dropCollection)`

- `edgeCollectionName` (string):
  Name of edge collection in the relation definition.
- `dropCollection` (bool, _optional_):
  Define if the edge collection should be dropped. Default: `false`

Deletes a relation definition defined by the edge collection of a graph. If the
collections defined in the edge definition (`collection`, `from`, `to`) are not used
in another edge definition of the graph, they are moved to the orphanage.

**Examples**

Remove an edge definition but keep the edge collection:

```js
---
name: general_graph__deleteEdgeDefinitionNoDrop
description: ''
render: input/output
version: '3.10'
server_name: stable
type: single
---
  var graph_module = require("@arangodb/general-graph")
  var ed1 = graph_module._relation("myEC1", ["myVC1"], ["myVC2"]);
  var ed2 = graph_module._relation("myEC2", ["myVC1"], ["myVC3"]);
  var graph = graph_module._create("myGraph", [ed1, ed2]);
  graph._deleteEdgeDefinition("myEC1");
  db._collection("myEC1");
~ db._drop("myEC1");
~ graph_module._drop("myGraph", true);
```

Remove an edge definition and drop the edge collection:

```js
---
name: general_graph__deleteEdgeDefinitionWithDrop
description: ''
render: input/output
version: '3.10'
server_name: stable
type: single
---
  var graph_module = require("@arangodb/general-graph")
  var ed1 = graph_module._relation("myEC1", ["myVC1"], ["myVC2"]);
  var ed2 = graph_module._relation("myEC2", ["myVC1"], ["myVC3"]);
  var graph = graph_module._create("myGraph", [ed1, ed2]);
  graph._deleteEdgeDefinition("myEC1", true);
  db._collection("myEC1");
~ db._drop("myEC1");
~ graph_module._drop("myGraph", true);
```

### Extend Vertex Collections

Each graph can have an arbitrary amount of vertex collections, which are not
part of any edge definition of the graph. These collections are called orphan
collections. If the graph is extended with an edge definition using one of the
orphans, it is removed from the set of orphan collection automatically.

#### Add a Vertex Collection

Add a vertex collection to the graph:

`graph._addVertexCollection(vertexCollectionName, createCollection, options)`

- `vertexCollectionName` (string):
  Name of vertex collection.
- `createCollection` (bool, _optional_):
  If `true`, the collection is created if it does not exist. Default: `true`
- `options` (object, _optional_):
  Additional options related to the edge definition itself.
  See [Edge Definition Options](#edge-definition-options).

Adds a vertex collection to the set of orphan collections of the graph. If the
collection does not exist, it is created. If it is already used by any edge
definition of the graph, an error is thrown.

**Examples**

```js
---
name: general_graph__addVertexCollection
description: ''
render: input/output
version: '3.10'
server_name: stable
type: single
---
  var graph_module = require("@arangodb/general-graph");
  var ed1 = graph_module._relation("myEC1", ["myVC1"], ["myVC2"]);
  var graph = graph_module._create("myGraph", [ed1]);
  graph._addVertexCollection("myVC3", true);
  graph = graph_module._graph("myGraph");
~ db._drop("myVC3");
~ graph_module._drop("myGraph", true);
```

#### Get the Orphaned Collections

Get all orphan collections:

`graph._orphanCollections()`

Returns all vertex collections of the graph that are not used in any
edge definition.

**Examples**

```js
---
name: general_graph__orphanCollections
description: ''
render: input/output
version: '3.10'
server_name: stable
type: single
---
  var graph_module = require("@arangodb/general-graph")
  var ed1 = graph_module._relation("myEC1", ["myVC1"], ["myVC2"]);
  var graph = graph_module._create("myGraph", [ed1]);
  graph._addVertexCollection("myVC3", true);
  graph._orphanCollections();
~ graph_module._drop("myGraph", true);
```

#### Remove a Vertex Collection

Remove a vertex collection from the graph:

`graph._removeVertexCollection(vertexCollectionName, dropCollection)`

- `vertexCollectionName` (string):
  Name of vertex collection.
- `dropCollection` (bool, _optional_):
  If `true`, the collection is dropped if it is not used in any other graph.
  Default: `false`

Removes a vertex collection from the graph.
Only collections not used in any relation definition can be removed.
Optionally the collection can be deleted, if it is not used in any other graph.

**Examples**

```js
---
name: general_graph__removeVertexCollections
description: ''
render: input/output
version: '3.10'
server_name: stable
type: single
---
  var graph_module = require("@arangodb/general-graph")
  var ed1 = graph_module._relation("myEC1", ["myVC1"], ["myVC2"]);
  var graph = graph_module._create("myGraph", [ed1]);
  graph._addVertexCollection("myVC3", true);
  graph._addVertexCollection("myVC4", true);
  graph._orphanCollections();
  graph._removeVertexCollection("myVC3");
  graph._orphanCollections();
~ db._drop("myVC3");
~ graph_module._drop("myGraph", true);
```

## Manipulating Vertices

### Save a Vertex

Create a new vertex in `vertexCollectionName`:

`graph.vertexCollectionName.save(data)`

- `data` (object):
  JSON data of vertex.

**Examples**

```js
---
name: generalGraphVertexCollectionSave
description: ''
render: input/output
version: '3.10'
server_name: stable
type: single
---
  var examples = require("@arangodb/graph-examples/example-graph.js");
  var graph = examples.loadGraph("social");
  graph.male.save({name: "Floyd", _key: "floyd"});
~ examples.dropGraph("social");
```

### Replace a Vertex

Replaces the data of a vertex in collection `vertexCollectionName`:

`graph.vertexCollectionName.replace(vertexId, data, options)`

- `vertexId` (string):
  `_id` attribute of the vertex
- `data` (object):
  JSON data of vertex.
- `options` (object, _optional_):
  See the [_collection_ object](../../develop/javascript-api/@arangodb/collection-object.md#collectionreplacedocument-data--options)

**Examples**

```js
---
name: generalGraphVertexCollectionReplace
description: ''
render: input/output
version: '3.10'
server_name: stable
type: single
---
  var examples = require("@arangodb/graph-examples/example-graph.js");
  var graph = examples.loadGraph("social");
  graph.male.save({neym: "Jon", _key: "john"});
  graph.male.replace("male/john", {name: "John"});
~ examples.dropGraph("social");
```

### Update a Vertex

Updates the data of a vertex in collection `vertexCollectionName`.

`graph.vertexCollectionName.update(vertexId, data, options)`

- `vertexId` (string):
  `_id` attribute of the vertex
- `data` (object):
  JSON data of vertex.
- `options` (object, _optional_):
  See the [_collection_ object](../../develop/javascript-api/@arangodb/collection-object.md#collectionupdatedocument-data--options)

**Examples**

```js
---
name: generalGraphVertexCollectionUpdate
description: ''
render: input/output
version: '3.10'
server_name: stable
type: single
---
  var examples = require("@arangodb/graph-examples/example-graph.js");
  var graph = examples.loadGraph("social");
  graph.female.save({name: "Lynda", _key: "linda"});
  graph.female.update("female/linda", {name: "Linda", _key: "linda"});
~ examples.dropGraph("social");
```

### Remove a Vertex

Removes a vertex in collection `vertexCollectionName`.

`graph.vertexCollectionName.remove(vertexId, options)`

- `vertexId` (string):
  `_id` attribute of the vertex
- `options` (object, _optional_):
  See the [_collection_ object](../../develop/javascript-api/@arangodb/collection-object.md#collectionremoveobject)

Additionally removes all ingoing and outgoing edges of the vertex recursively
(see [edge remove](#remove-an-edge)).

**Examples**

```js
---
name: generalGraphVertexCollectionRemove
description: ''
render: input/output
version: '3.10'
server_name: stable
type: single
---
  var examples = require("@arangodb/graph-examples/example-graph.js");
  var graph = examples.loadGraph("social");
  graph.male.save({name: "Kermit", _key: "kermit"});
  db._exists("male/kermit")
  graph.male.remove("male/kermit")
  db._exists("male/kermit")
~ examples.dropGraph("social");
```

## Manipulating Edges

### Save a new Edge

Creates an edge from vertex `data._from` to vertex `data._to` in collection
`edgeCollectionName`.

`graph.edgeCollectionName.save(data, options)`

- `data` (object):
  JSON data of the edge. Needs to include a `_from` attribute with the document
  identifier of the source vertex and a `_to` attribute with the document
  identifier of the target vertex.
- `options` (object, _optional_):
  See the [_collection_ object](../../develop/javascript-api/@arangodb/collection-object.md#collectioninsertdata--options)

**Examples**

```js
---
name: generalGraphEdgeCollectionSave1
description: ''
render: input/output
version: '3.10'
server_name: stable
type: single
---
  var examples = require("@arangodb/graph-examples/example-graph.js");
  var graph = examples.loadGraph("social");
  graph.relation.save({
    _from: "male/bob",
    _to: "female/alice",
_key: "bobAndAlice", type: "married" });
~ examples.dropGraph("social");
```

If the collections of `from` and `to` are not defined in an edge definition
of the graph, the edge is not stored.

```js
---
name: generalGraphEdgeCollectionSave2
description: ''
render: input/output
version: '3.10'
server_name: stable
type: single
---
  var examples = require("@arangodb/graph-examples/example-graph.js");
  var graph = examples.loadGraph("social");
    graph.relation.save(
     "relation/aliceAndBob",
      "female/alice",
 {type: "married", _key: "bobAndAlice"}); // xpError(ERROR_GRAPH_INVALID_EDGE)
~ examples.dropGraph("social");
```

### Replace an Edge

Replaces the data of an edge in collection `edgeCollectionName`.
Note that `_from` and `_to` are mandatory.

`graph.edgeCollectionName.replace(edgeId, data, options)`

- `edgeId` (string):
  `_id` attribute of the edge
- `data` (object, _optional_):
  JSON data of the edge
- `options` (object, _optional_):
  See the [_collection_ object](../../develop/javascript-api/@arangodb/collection-object.md#collectionreplacedocument-data--options)

**Examples**

```js
---
name: generalGraphEdgeCollectionReplace
description: ''
render: input/output
version: '3.10'
server_name: stable
type: single
---
  var examples = require("@arangodb/graph-examples/example-graph.js");
  var graph = examples.loadGraph("social");
  graph.relation.save("female/alice", "female/diana", {typo: "nose", _key: "aliceAndDiana"});
  graph.relation.replace("relation/aliceAndDiana", {type: "knows", _from: "female/alice", _to: "female/diana"});
~ examples.dropGraph("social");
```

### Update an Edge

Updates the data of an edge in collection `edgeCollectionName`.

`graph.edgeCollectionName.update(edgeId, data, options)`

- `edgeId` (string):
  `_id` attribute of the edge
- `data` (object, _optional_):
  JSON data of the edge
- `options` (object, _optional_):
  See the [_collection_ object](../../develop/javascript-api/@arangodb/collection-object.md#collectionupdatedocument-data--options)

**Examples**

```js
---
name: generalGraphEdgeCollectionUpdate
description: ''
render: input/output
version: '3.10'
server_name: stable
type: single
---
  var examples = require("@arangodb/graph-examples/example-graph.js");
  var graph = examples.loadGraph("social");
  graph.relation.save("female/alice", "female/diana", {type: "knows", _key: "aliceAndDiana"});
  graph.relation.update("relation/aliceAndDiana", {type: "quarreled", _key: "aliceAndDiana"});
~ examples.dropGraph("social");
```

### Remove an Edge

Removes an edge in collection `edgeCollectionName`.

`graph.edgeCollectionName.remove(edgeId, options)`

- `edgeId` (string):
  `_id` attribute of the edge
- `options` (object, _optional_):
  See the [_collection_ object](../../develop/javascript-api/@arangodb/collection-object.md#collectionremoveobject)

If this edge is used as a vertex by another edge, the other edge is removed
(recursively).

**Examples**

```js
---
name: generalGraphEdgeCollectionRemove
description: ''
render: input/output
version: '3.10'
server_name: stable
type: single
---
  var examples = require("@arangodb/graph-examples/example-graph.js");
  var graph = examples.loadGraph("social");
  graph.relation.save("female/alice", "female/diana", {_key: "aliceAndDiana"});
  db._exists("relation/aliceAndDiana")
  graph.relation.remove("relation/aliceAndDiana")
  db._exists("relation/aliceAndDiana")
~ examples.dropGraph("social");
```
