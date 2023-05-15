---
title: EnterpriseGraphs Management
weight: 10
description: >-
  This chapter describes the JavaScript interface for creating and modifying EnterpriseGraphs
archetype: default
---
An EnterpriseGraph is a specialized version of a SmartGraph, which
means that both modules work similarly. The major difference is that
EnterpriseGraphs rely on a special automated sharding of the underlying
collections and hence can only work with collections that are created
through the EnterpriseGraph itself. EnterpriseGraphs cannot overlap.

To generally understand the concept of this module please read the chapter
about [General Graph Management](../general-graphs/graph-management.md) first,
and continue with [SmartGraph Management](../smartgraphs/smartgraph-management.md).

## Create a Graph

EnterpriseGraphs require edge relations to be created. The format of the
relations is identical to the format used for General Graphs.
The only difference is that all collections used within
the relations to create a new EnterpriseGraph must not exist yet. You have to let
the EnterpriseGraph module create the Graph collections for you, so that it can
enforce the correct sharding.

`graph_module._create(graphName, edgeDefinitions, orphanCollections, smartOptions)`

- `graphName` (string):
  Unique identifier of the graph.
- `edgeDefinitions` (array):
  List of relation definition objects, may be empty.
- `orphanCollections` (array):
  List of additional vertex collection names, may be empty.
- `smartOptions` (object):
  A JSON object having the following keys:
  - `numberOfShards` (number):
    The number of shards that are created for each collection. To maintain
    the correct sharding, all collections need an identical number of shards.
    This cannot be modified after the creation of the graph.
  - `isSmart` (bool):
    Mandatory parameter that needs to be set to `true` to create an EnterpriseGraph.
  - `satellites` (array, _optional_):
    An array of collection names that is used to create
    [SatelliteCollections](../../../advanced-topics/satellitecollections.md) for an EnterpriseGraph.
    Each array element must be a string and a valid collection name.
    The collection type cannot be modified later.

The creation of a graph requires the name and some SmartGraph options.
Due to the API, `edgeDefinitions` and `orphanCollections` have to be given but
both can be empty arrays and be added later.

The `edgeDefinitions` can be created using the convenience method `_relation`
known from the `general-graph` module, which is also available here.

`orphanCollections` again is just a list of additional vertex collections which
are not yet connected via edges but should follow the same sharding to be
connected later on. Note that these collections are not necessarily orphans in 
the graph theoretic sense: it is possible to add edges having one end in a collection
that has been declared as orphan. 

All collections used within the creation process are newly created.
The process fails if one of them already exists, unless they have the
correct sharding already. All newly created collections are immediately
dropped again in the failure case.

### Examples

Create a graph without relations. Edge definitions can be added later:

```js
---
name: enterpriseGraphCreate1
description: ''
render: input/output
version: '3.11'
server_name: stable
type: cluster
---
  var graph_module = require("@arangodb/enterprise-graph");
  var graph = graph_module._create("myGraph", [], [], {isSmart: true, numberOfShards: 9});
  graph_module._graph("myGraph");
 ~graph_module._drop("myGraph", true);
```

Create a graph using an edge collection `edges` and a single vertex collection
`vertices` as relation:

```js
---
name: enterpriseGraphCreate2
description: ''
render: input/output
version: '3.11'
server_name: stable
type: cluster
---
  var graph_module = require("@arangodb/enterprise-graph");
  var edgeDefinitions = [ graph_module._relation("edges", "vertices", "vertices") ];
  var graph = graph_module._create("myGraph", edgeDefinitions, [], {isSmart: true, numberOfShards: 9});
  graph_module._graph("myGraph");
 ~graph_module._drop("myGraph", true);
```

Create a graph with edge definitions and orphan collections:

```js
---
name: enterpriseGraphCreate3
description: ''
render: input/output
version: '3.11'
server_name: stable
type: cluster
---
  var graph_module = require("@arangodb/enterprise-graph");
  var edgeDefinitions = [ graph_module._relation("myRelation", ["male", "female"], ["male", "female"]) ];
  var graph = graph_module._create("myGraph", edgeDefinitions, ["sessions"], {isSmart: true, numberOfShards: 9});
  graph_module._graph("myGraph");
 ~graph_module._drop("myGraph", true);
```

## Modify a graph definition at runtime

After you have created an EnterpriseGraph, its definition is not immutable. You can
still add or remove relations. This is again identical to General Graphs.

However, there is one important difference: you can only add collections that
either *do not exist*, or that have been created by this graph earlier. The
latter can be the case if you, for example, remove an orphan collection from this
graph, without dropping the collection itself. When after some time you decide
to add it to the graph again, you can do it. This is because the enforced sharding is still
applied to this vertex collection.

## Remove a vertex collection

Remove a vertex collection from the graph:

`graph._removeVertexCollection(vertexCollectionName, dropCollection)`

- `vertexCollectionName` (string):
  Name of vertex collection.
- `dropCollection` (bool, _optional_):
  If `true`, the collection is dropped if it is not used in any other graph.
  Default: `false`.

In most cases, this function works identically to the General Graph one.
However, there is one special case: the first vertex collection added to the graph
(either orphan or within a relation) defines the sharding for all collections
within the graph. Every other collection has its `distributeShardsLike` attribute set to the
name of the initial collection. This collection cannot be dropped as long as
other collections follow its sharding (i.e. they need to be dropped first).

### Examples

Create an EnterpriseGraph and list its orphan collections:

```js
---
name: enterpriseGraphModify1
description: ''
render: input/output
version: '3.11'
server_name: stable
type: cluster
---
  var graph_module = require("@arangodb/enterprise-graph");
  var relation = graph_module._relation("edges", "vertices", "vertices");
  var graph = graph_module._create("myGraph", [relation], ["other"], {isSmart: true, numberOfShards: 9});
  graph._orphanCollections();
 ~graph_module._drop("myGraph", true);
```

Remove the orphan collection from the EnterpriseGraph and drop the collection:

```js
---
name: enterpriseGraphModify2
description: ''
render: input/output
version: '3.11'
server_name: stable
type: cluster
---
 ~var graph_module = require("@arangodb/enterprise-graph");
 ~var relation = graph_module._relation("edges", "vertices", "vertices");
 ~var graph = graph_module._create("myGraph", [relation], ["other"], {isSmart: true, numberOfShards: 9});
  graph._removeVertexCollection("other", true);
  graph_module._graph("myGraph");
 ~graph_module._drop("myGraph", true);
```

Attempting to remove a non-orphan collection results in an error:

```js
---
name: enterpriseGraphModify3
description: ''
render: input/output
version: '3.11'
server_name: stable
type: cluster
---
 ~var graph_module = require("@arangodb/enterprise-graph");
 ~var relation = graph_module._relation("edges", "vertices", "vertices");
 ~var graph = graph_module._create("myGraph", [relation], [], {isSmart: true, numberOfShards: 9});
  graph._removeVertexCollection("vertices"); // xpError(ERROR_GRAPH_NOT_IN_ORPHAN_COLLECTION)
 ~graph_module._drop("myGraph", true);
```

You cannot drop the initial collection (`vertices`) as long as it defines the
sharding for other collections (`edges`).

```js
---
name: enterpriseGraphModify4
description: ''
render: input/output
version: '3.11'
server_name: stable
type: cluster
---
  var graph_module = require("@arangodb/enterprise-graph");
  var relation = graph_module._relation("edges", "vertices", "vertices");
  var graph = graph_module._create("myGraph", [relation], [], {isSmart: true, numberOfShards: 9});
  graph._deleteEdgeDefinition("edges");
  graph._removeVertexCollection("vertices");
  db._drop("vertices"); // xpError(ERROR_CLUSTER_MUST_NOT_DROP_COLL_OTHER_DISTRIBUTESHARDSLIKE)
 ~graph_module._drop("myGraph", true);
 ~db._drop("edges");
 ~db._drop("vertices");
```

You may drop the complete graph including the underlying collections by setting
the second argument in the call to `_drop()` to `true`. This only drops
collections that are in the graph definition at that point. Remember to manually
drop collections that you might have removed from the graph beforehand.

```js
---
name: enterpriseGraphModify5
description: ''
render: input/output
version: '3.11'
server_name: stable
type: cluster
---
  var graph_module = require("@arangodb/enterprise-graph");
  var relation = graph_module._relation("edges", "vertices", "vertices");
  var graph = graph_module._create("myGraph", [relation], [], {isSmart: true, numberOfShards: 9});
  graph._deleteEdgeDefinition("edges");  // Remove edge collection from graph definition
  graph._removeVertexCollection("vertices"); // Remove vertex collection from graph definition
  graph_module._drop("myGraph", true);   // Does not drop any collections because none are left in the graph definition
  db._drop("edges"); // Manually clean up the collections that were left behind, drop 'edges' before sharding-defining 'vertices' collection
  db._drop("vertices");
```

Alternatively, you can `truncate()` all collections of the graph if you just
want to get rid of the data but keep the collections and graph definition.

## Remove an edge collection

Delete an edge definition from the graph:

`graph._deleteEdgeDefinition(edgeCollectionName, dropCollection)`

- `edgeCollectionName` (string):
  Name of edge collection.
- `dropCollection` (bool, _optional_):
  If `true`, the collection is dropped if it is not used in any other graph.
  Default: `false`.

### Examples

Create an EnterpriseGraph, then delete the edge definition and drop the edge collection:

```js
---
name: enterpriseGraphModify6
description: ''
render: input/output
version: '3.11'
server_name: stable
type: cluster
---
  var graph_module = require("@arangodb/enterprise-graph");
  var relation = graph_module._relation("edges", "vertices", "vertices");
  var graph = graph_module._create("myGraph", [relation], [], {isSmart: true, numberOfShards: 9});
  graph._deleteEdgeDefinition("edges", true);
  graph_module._graph("myGraph");
 ~graph_module._drop("myGraph", true);
```

It is allowed to remove the vertex collection `vertices` if it is not used in
any relation (i.e. after the deletion of the edge definition):

```js
---
name: enterpriseGraphModify7
description: ''
render: input/output
version: '3.11'
server_name: stable
type: cluster
---
 ~var graph_module = require("@arangodb/enterprise-graph");
 ~var relation = graph_module._relation("edges", "vertices", "vertices");
 ~var graph = graph_module._create("myGraph", [relation], [], {isSmart: true, numberOfShards: 9});
  graph._deleteEdgeDefinition("edges");
  graph._removeVertexCollection("vertices");
 ~graph_module._drop("myGraph", true);
 ~db._drop("edges");
 ~db._drop("vertices");
```

Keep in mind that you cannot drop the `vertices` collection until no other
collection references it anymore (`distributeShardsLike` collection property).

## Remove a Graph

Remove a SmartGraph:

`graph_module._drop(graphName, dropCollections)`

- `graphName` (string):
  Name of the Graph.
- `dropCollections` (bool, _optional_):
  Define if collections should be dropped. Default: `false`.

### Examples

Delete an EnterpriseGraph and drop its collections:

```js
---
name: enterpriseGraphRemove1
description: ''
render: input/output
version: '3.11'
server_name: stable
type: cluster
---
 ~var graph_module = require("@arangodb/enterprise-graph");
 ~var relation = graph_module._relation("edges", "vertices", "vertices");
 ~var graph = graph_module._create("myGraph", [relation], ["other"], {isSmart: true, numberOfShards: 9});
  graph_module._drop("myGraph", true);
```

Note that removing a Graph with the option to drop the collections fails if
you removed collections from the Graph but did not drop these collections.
This is because their `distributeShardsLike` attribute still references
collections that are part of the Graph. Dropping collections while others
point to them in this way is not allowed. Make sure to drop the referencing
collections first.

```js
---
name: enterpriseGraphRemove2
description: ''
render: input/output
version: '3.11'
server_name: stable
type: cluster
---
 ~var graph_module = require("@arangodb/enterprise-graph");
 ~var relation = graph_module._relation("edges", "vertices", "vertices");
 ~var graph = graph_module._create("myGraph", [relation], ["other"], {isSmart: true, numberOfShards: 9});
  graph._removeVertexCollection("other");
  graph_module._drop("myGraph", true); // xpError(ERROR_CLUSTER_MUST_NOT_DROP_COLL_OTHER_DISTRIBUTESHARDSLIKE)
 ~db._drop("other");
 ~db._drop("vertices");
```
