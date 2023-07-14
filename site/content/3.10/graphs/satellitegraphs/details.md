---
title: SatelliteGraph Details
menuTitle: Details
weight: 10
description: >-
  How to create and use SatelliteGraphs
archetype: default
---
Below you find usage examples and advanced configuration possibilities for
SatelliteGraphs. The examples use _arangosh_ and the
`@arangodb/satellite-graph` module. You can also manage SatelliteGraphs via
the [HTTP API](../../develop/http/graphs/named-graphs.md).

## How to create a SatelliteGraph

SatelliteGraphs enforce and rely on special properties of the underlying
collections and hence can only work with collections that are either created
implicitly through the SatelliteGraph interface, or manually with the correct
properties:

- There needs to be a [prototype collection](#the-prototype-collection) with
  `replicationFactor` set to `"satellite"`
- All other collections need to have `distributeShardsLike` set to the name
  of the prototype collection

Collections can be part of multiple SatelliteGraphs. This means that in
contrast to SmartGraphs, SatelliteGraphs can be overlapping. If you have a
larger SatelliteGraph and want to create an additional SatelliteGraph which
only covers a part of it, then you can do so.

### Create a graph

To create a SatelliteGraph in arangosh, use the `satellite-graph` module:

```js
---
name: satelliteGraphCreate1
description: ''
render: input/output
version: '3.10'
server_name: stable
type: cluster
---
  var satelliteGraphModule = require("@arangodb/satellite-graph");
  var graph = satelliteGraphModule._create("satelliteGraph");
  satelliteGraphModule._graph("satelliteGraph");
~ satelliteGraphModule._drop("satelliteGraph", true);
```

In contrast to General Graphs and SmartGraphs, you do not need to take care of
the sharding and replication properties. The properties `distributeShardsLike`,
`replicationFactor` and `numberOfShards` will be set automatically.

### Add vertex collections

Adding vertex collections is analogous to General Graphs:

```js
---
name: satelliteGraphCreate2
description: ''
render: input/output
version: '3.10'
server_name: stable
type: cluster
---
~ var satelliteGraphModule = require("@arangodb/satellite-graph");
  var graph = satelliteGraphModule._create("satelliteGraph");
  graph._addVertexCollection("aVertexCollection");
  graph = satelliteGraphModule._graph("satelliteGraph");
~ satelliteGraphModule._drop("satelliteGraph", true);
```

If the collection `"aVertexCollection"` doesn't exist yet, then the
SatelliteGraph module creates it automatically with the correct
properties. If it exists already, then its properties must be suitable for a
SatelliteGraph (see [prototype collection](#the-prototype-collection)).
Otherwise, it is not added.

### Define relations

Adding edge collections works the same as with General Graphs, but again, the
collections are created by the SatelliteGraph module with the right properties
if they don't exist already.

```js
---
name: satelliteGraphCreate3
description: ''
render: input/output
version: '3.10'
server_name: stable
type: cluster
---
~ var satelliteGraphModule = require("@arangodb/satellite-graph");
  var graph = satelliteGraphModule._create("satelliteGraph");
  var relation = satelliteGraphModule._relation("isFriend", ["person"], ["person"]);
  graph._extendEdgeDefinitions(relation);
  graph = satelliteGraphModule._graph("satelliteGraph");
~ satelliteGraphModule._drop("satelliteGraph", true);
```

Existing edge collections can be added, but they require the
`distributeShardsLike` property to reference the prototype collection.

## The prototype collection

Every SatelliteGraph needs exactly one document collection with
`replicationFactor` set to `"satellite"`. This automatically leads to the
collection having an exact amount of one shard per collection. This collection
is selected as prototype.

All other collections of the SatelliteGraph need to inherit its properties by
referencing its name in the `distributeShardsLike` property.

If collections are created implicitly through the SatelliteGraph module, then
this is handled for you automatically. If you want to create the collections
manually before adding them to the SatelliteGraph, then you need to take care
of these properties.

### Prototype collection examples

Creating an empty SatelliteGraph: No prototype collection is present.

```js
---
name: satelliteGraphPrototype1
description: ''
render: input/output
version: '3.10'
server_name: stable
type: cluster
---
  var satelliteGraphModule = require("@arangodb/satellite-graph");
  satelliteGraphModule._create("satelliteGraph");
~ satelliteGraphModule._drop("satelliteGraph", true);
```

Creating an empty SatelliteGraph, then adding a document (vertex) collection.
This leads to the creation of a prototype collection `"myPrototypeColl"`
(assuming that no collection with this name existed before):

```js
---
name: satelliteGraphPrototype2
description: ''
render: input/output
version: '3.10'
server_name: stable
type: cluster
---
  var satelliteGraphModule = require("@arangodb/satellite-graph");
  var graph = satelliteGraphModule._create("satelliteGraph");
  graph._addVertexCollection("myPrototypeColl");
  graph = satelliteGraphModule._graph("satelliteGraph");
~ satelliteGraphModule._drop("satelliteGraph", true);
```

Creating an empty SatelliteGraph, then adding an edge definition.
This will select the collection `"person"` as prototype collection, as it is
the only document (vertex) collection. If you supply more than one document
collection, then one of the collections will be chosen arbitrarily as
prototype collection.

```js
---
name: satelliteGraphPrototype3
description: ''
render: input/output
version: '3.10'
server_name: stable
type: cluster
---
  var satelliteGraphModule = require("@arangodb/satellite-graph");
  var graph = satelliteGraphModule._create("satelliteGraph");
  var relation = satelliteGraphModule._relation("isFriend", ["person"], ["person"]);
  graph._extendEdgeDefinitions(relation);
  graph = satelliteGraphModule._graph("satelliteGraph");
~ satelliteGraphModule._drop("satelliteGraph", true);
```

The prototype collection can and also is automatically selected during the
graph creation process if at least one document (vertex) collection is supplied
directly. If more then one are available, they are chosen randomly as well,
regardless whether they are set inside the edge definition itself or set as a
vertex/orphan collection.

## Utilizing SatelliteGraphs

Obviously, a SatelliteGraph must be created before it can be queried. Valid
operations that can then be optimized are (k-)shortest path(s) computations and
traversals. Both also allow for combination with local joins or other
SatelliteGraph operations.

Here is an example showing the difference between the execution of a General Graph
and a SatelliteGraph traversal query:

1. First we setup our graphs and collections.

```js
---
name: satelliteGraphGeneralGraph1
description: ''
render: input/output
version: '3.10'
server_name: stable
type: cluster
---
 var graphModule = require("@arangodb/general-graph");
 var satelliteGraphModule = require("@arangodb/satellite-graph");
 graphModule._create("normalGraph", [ graphModule._relation("edges", "vertices", "vertices") ], [], {});
 satelliteGraphModule._create("satelliteGraph", [ satelliteGraphModule._relation("satEdges", "satVertices", "satVertices") ], [], {});
 db._create("collection", {numberOfShards: 8});
   ~ db._drop("collection");
   ~ satelliteGraphModule._drop("satelliteGraph", true);
   ~ graphModule._drop("normalGraph", true);
```

2. Let us analyze a query involving a traversal:

```js
---
name: satelliteGraphGeneralGraph2
description: ''
render: input/output
version: '3.10'
server_name: stable
type: cluster
---
   ~ var graphModule = require("@arangodb/general-graph");
   ~ var satelliteGraphModule = require("@arangodb/satellite-graph");
   ~ graphModule._create("normalGraph", [ graphModule._relation("edges", "vertices", "vertices") ], [], {});
   ~ satelliteGraphModule._create("satelliteGraph", [ satelliteGraphModule._relation("satEdges", "satVertices", "satVertices") ], [], {});
   ~ db._create("collection", {numberOfShards: 8});
 db._explain(`FOR doc in collection FOR v,e,p IN OUTBOUND "vertices/start" GRAPH "normalGraph" RETURN [doc,v,e,p]`, {}, {colors: false});
   ~ db._drop("collection");
   ~ satelliteGraphModule._drop("satelliteGraph", true);
   ~ graphModule._drop("normalGraph", true);
```

   You can see that the `TraversalNode` is executed on a Coordinator, and only
   the `EnumerateCollectionNode` is executed on DB-Servers. This happens for
   each of the 8 shards in `collection`.

3. Let us now have a look at the same query using a SatelliteGraph:

```js
---
name: satelliteGraphGeneralGraph3
description: ''
render: input/output
version: '3.10'
server_name: stable
type: cluster
---
   ~ var graphModule = require("@arangodb/general-graph");
   ~ var satelliteGraphModule = require("@arangodb/satellite-graph");
   ~ graphModule._create("normalGraph", [ graphModule._relation("edges", "vertices", "vertices") ], [], {});
   ~ satelliteGraphModule._create("satelliteGraph", [ satelliteGraphModule._relation("satEdges", "satVertices", "satVertices") ], [], {});
   ~ db._create("collection", {numberOfShards: 8});
 db._explain(`FOR doc in collection FOR v,e,p IN OUTBOUND "vertices/start" GRAPH "satelliteGraph" RETURN [doc,v,e,p]`, {}, {colors: false});
   ~ db._drop("collection");
   ~ satelliteGraphModule._drop("satelliteGraph", true);
   ~ graphModule._drop("normalGraph", true);
```

   Note that now the `TraversalNode` is executed on each DB-Server, leading to a
   great reduction in required network communication, and hence potential gains
   in query performance.

## Convert General Graphs or SmartGraphs to SatelliteGraphs

If you want to transform an existing General Graph or SmartGraph into a
SatelliteGraph, then you need to dump and restore your previous graph.
This is necessary for the initial data replication and because some collection
properties are immutable.

Use _arangodump_ and _arangorestore_. The only thing you have to change in this
pipeline is that you create the new collections during creation with the
SatelliteGraph module or add collections manually to the SatelliteGraph
**before starting the arangorestore process**.
