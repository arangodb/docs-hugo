---
title: The scalability of ArangoDB and its data models
menuTitle: Scalability
weight: 5
description: >-
  ArangoDB supports scaling horizontally and vertically, and each supported
  data model has different properties when scaling to large datasets
---
## Horizontal and vertical scalability

ArangoDB is a distributed database system supporting multiple data models,
and can thus be scaled horizontally, that is, by using many servers,
typically based on commodity hardware. This approach not only delivers 
performance as well as capacity improvements, but also achieves
resilience by means of replication and automatic fail-over. Furthermore,
you can build systems that scale their capacity dynamically up and down 
automatically according to demand.

You can also scale ArangoDB vertically, that is, by using ever larger and more
powerful servers. There is no built-in limitation in ArangoDB, for example, the
server will automatically use more threads if more CPUs are present.
However, scaling vertically has the disadvantage that the costs grow faster than
linear with the size of the server, and none of the resilience and dynamical
capabilities can be achieved in this way.

## Key/value pairs

The key/value store data model is the easiest to scale. In ArangoDB,
this is implemented in the sense that a document collection always has 
a primary key `_key` attribute and in the absence of further secondary
indexes the document collection behaves like a simple key/value store.

The only operations that are possible in this context are single key
lookups and key/value pair insertions and updates. If `_key` is the
only sharding attribute then the sharding is done with respect to the
primary key and all these operations scale linearly. If the sharding is
done using different shard keys, then a lookup of a single key involves
asking all shards and thus does not scale linearly.

## Document store

For the document store case even in the presence of secondary indexes
essentially the same arguments apply, since an index for a sharded
collection is simply the same as a local index for each shard. Therefore,
single document operations still scale linearly with the size of the
cluster, unless a special sharding configuration makes lookups or
write operations more expensive.

## Complex queries and joins

The AQL query language allows complex queries, using multiple
collections, secondary indexes as well as joins. In particular with
the latter, scaling can be a challenge, since if the data to be
joined resides on different machines, a lot of communication
has to happen. The AQL query execution engine organizes a data
pipeline across the cluster to put together the results in the
most efficient way. The query optimizer is aware of the cluster
structure and knows what data is where and how it is indexed.
Therefore, it can arrive at an informed decision about what parts
of the query ought to run where in the cluster.

Nevertheless, for certain complicated joins, there are limits as
to what can be achieved. 

## Graph database

Graph databases are particularly good at queries on graphs that involve
paths in the graph of an a priori unknown length. For example, finding
the shortest path between two vertices in a graph, or finding all
paths that match a certain pattern starting at a given vertex are such
examples.

However, if the vertices and edges along the occurring paths are
distributed across the cluster, then a lot of communication is
necessary between nodes, and performance suffers. To achieve good
performance at scale, it is therefore necessary to get the
distribution of the graph data across the shards in the cluster
right. Most of the time, the application developers and users of
ArangoDB know best, how their graphs are structured. Therefore, 
ArangoDB allows users to specify, according to which attributes
the graph data is sharded. A useful first step is usually to make
sure that the edges originating at a vertex reside on the same
cluster node as the vertex.
