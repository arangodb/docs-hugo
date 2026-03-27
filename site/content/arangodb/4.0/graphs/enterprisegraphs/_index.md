---
title: EnterpriseGraphs
menuTitle: EnterpriseGraphs
weight: 100
description: >-
  EnterpriseGraphs enable you to manage graphs at scale with automated sharding
  key selection and co-location of edges with their connected nodes
---
This chapter describes the `enterprise-graph` module, a specialized version of
[SmartGraphs](../smartgraphs/_index.md).
It will give a vast performance benefit for all graphs sharded
in an ArangoDB Cluster, reducing network hops substantially.

In terms of querying there is no difference between SmartGraphs and EnterpriseGraphs.
For graph querying please refer to [AQL Graph Operations](../../aql/graph-queries/_index.md)
and [General Graph Functions](../general-graphs/functions.md) sections.

Creating and modifying the underlying collections of an EnterpriseGraph are
also similar to SmartGraphs. For a detailed API reference, please refer
to [Enterprise Graphs Management](management.md).

See [how to migrate](getting-started.md#migrating-to-enterprisegraphs)
from a `general-graph` to an `enterprise-graph`.

## How EnterpriseGraphs work

The creation and usage of EnterpriseGraphs are similar to [SmartGraphs](../smartgraphs/getting-started.md).
However, the latter require the selection of an appropriate sharding key.
This is known as the `smartGraphAttribute`, a value that is stored in every node,
which ensures data co-location of all nodes sharing this attribute and their
immediate edges.

EnterpriseGraphs use hash-based sharding similar to General Graphs that
pseudo-randomly distribute nodes across shards, but EnterpriseGraphs ensure that
the adjacent edges of nodes are co-located in the same shard. As a consequence,
you **cannot** define `_key` values for edges. You can also **not modify** the
`_from ` and `_to` edge attributes because they contain the sharding key which
cannot be changed.

While not as effective as the sharding of SmartGraphs, your data may not have a
suitable `smartGraphAttribute`. You can use EnterpriseGraphs as the next best
option to get better performance. EnterpriseGraphs can also take advantage of
accidental co-location of nodes on the same DB-Server, which General Graphs cannot.

## EnterpriseGraphs using SatelliteCollections

EnterpriseGraphs are capable of using [SatelliteCollections](../../develop/satellitecollections.md)
within their graph definition. Therefore, edge definitions defined between 
EnterpriseCollections and SatelliteCollections can be created. As SatelliteCollections
(and the edge collections between EnterpriseGraph collections and SatelliteCollections)
are globally replicated to each participating DB-Server, (weighted) graph
traversal and (k-)shortest path(s) query can partially be executed locally on
each DB-Server. This means a larger part of the query can be executed fully
local whenever data from the SatelliteCollections is required.
