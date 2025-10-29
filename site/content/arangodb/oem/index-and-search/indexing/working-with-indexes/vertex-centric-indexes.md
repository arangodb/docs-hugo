---
title: Vertex-Centric Indexes
menuTitle: Vertex-Centric Indexes
weight: 35
description: >-
  You can create persistent indexes over the `_from` or `_to` attribute and one
  or more additional edge attributes to improve certain graph traversals
---
All edge collections in ArangoDB have a special edge index that enables fast
graph operations. If you have graphs that contain supernodes (vertices that have
an exceptionally high amount of connected edges) and you apply filters in graph
traversal queries, you can create so-called vertex-centric indexes that can
perform better than the default edge indexes. You can use the `persistent`
index type for this purpose.

## Motivation

The idea of a vertex-centric index is to index a combination of a vertex, the
direction, and an arbitrary set of attributes on the edges. This can be achieved
by indexing the `_from` or `_to` attribute of an edge as the first field,
which contains the document identifier of a vertex and implicitly captures the
direction, followed by any number of other attributes of an edge.

To support traversals in `OUTBOUND` direction, you need to index the `_from`
attribute as the first attribute. For the `INBOUND` direction, you need to use
the `_to` attribute. To support both (`ANY` or mixed `INBOUND` and `OUTBOUND`
directions), you need to create two indexes, using `_from` in one and `_to` in
the other as the first attribute the index is over.

For example, if you have an attribute called `type` on the edges and traverse
in `OUTBOUND` direction, you can create a vertex-centric `persistent` index over
`["_from", "type"]` to find all edges attached to a vertex with a given `type`.
The following query can benefit from such an index:

```aql
FOR v, e, p IN 3..5 OUTBOUND @start GRAPH @graphName
  FILTER p.edges[*].type ALL == "friend"
  RETURN v
```

Using the built-in edge-index, ArangoDB can find the list of all edges attached
to the vertex fast but it still it has to walk through this list and check if
all of them have the attribute `type == "friend"`. A vertex-centric index allows
ArangoDB to find all edges with the attribute `type == "friend"` for the vertex
in one go, saving the iteration to verify the condition.

## Index creation

A vertex-centric has to be of the type [Persistent Index](persistent-indexes.md)
and is created like any other index of this type. However, in the list
of fields used to create the index over, you need to use either `_from` or `_to`
as the first field.

For example, if you want to create a vertex-centric index on the `type` attribute
that supports traversing in the `OUTBOUND` direction, you would create the index
in the following way:

```js
---
name: ensureVertexCentricIndex
description: ''
---
~db._createEdgeCollection("edgeCollection");
db.edgeCollection.ensureIndex({ type: "persistent", fields: [ "_from", "type" ] });
~db._drop("edgeCollection");
```

All options that are supported by persistent indexes are supported by the
vertex-centric index as well.

## Index usage

The AQL optimizer can decide to use a vertex-centric whenever suitable. However,
it is not guaranteed that this index is used. The optimizer may estimate that
another index, in particular the built-in edge index, is a better fit.

The optimizer considers vertex-centric indexes in pattern matching queries:

```aql
FOR v, e, p IN 3..5 OUTBOUND @start GRAPH @graphName
  FILTER p.edges[*].type ALL == "friend"
  RETURN v
```

It also considers them when you iterate over an edge collection directly and
explicitly filter on `_from` respectively `_to` and the other indexed attributes:


```aql
FOR edge IN edgeCollection
  FILTER edge._from == "vertices/123456" AND edge.type == "friend"
  RETURN edge
```
