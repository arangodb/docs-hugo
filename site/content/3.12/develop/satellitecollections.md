---
title: SatelliteCollections
menuTitle: SatelliteCollections
weight: 250
description: >-
  Collections synchronously replicated to all servers to enable local joins
---
When doing joins in an ArangoDB cluster data has to be exchanged between different servers.

Joins are executed on a Coordinator. It prepares an execution plan
and executes it. When executing, the Coordinator contacts all shards of the
starting point of the join and ask for their data. The DB-Servers carrying
out this operation loads all its local data and then ask the cluster for
the other part of the join. Again, this is distributed to all involved shards
of this join part.

In sum this results in much network traffic and slow results depending of the
amount of data that has to be sent throughout the cluster.

SatelliteCollections are collections that are intended to address this issue.
They facilitate the synchronous replication and replicate all their data
to all DB-Servers that are part of the cluster.

This enables the DB-Servers to execute that part of any join locally.

This greatly improves performance for such joins at the costs of increased
storage requirements and poorer write performance on this data.

To create a SatelliteCollection set the `replicationFactor` of this collection
to "satellite".

Using arangosh:

```js
db._create("satellite", {"replicationFactor": "satellite"});
```

## A full example

```js
arangosh> var explain = require("@arangodb/aql/explainer").explain
arangosh> db._create("satellite", {"replicationFactor": "satellite"})
arangosh> db._create("nonsatellite", {numberOfShards: 8})
arangosh> db._create("nonsatellite2", {numberOfShards: 8})
```

Let's analyze a normal join not involving SatelliteCollections:

```js
arangosh> explain("FOR doc in nonsatellite FOR doc2 in nonsatellite2 RETURN 1")

Query string:
 FOR doc in nonsatellite FOR doc2 in nonsatellite2 RETURN 1

Execution plan:
 Id   NodeType                  Site       Est.   Comment
  1   SingletonNode             DBS           1   * ROOT
  4   CalculationNode           DBS           1     - LET #2 = 1   /* json expression */   /* const assignment */
  2   EnumerateCollectionNode   DBS           0     - FOR doc IN nonsatellite   /* full collection scan */
 12   RemoteNode                COOR          0       - REMOTE
 13   GatherNode                COOR          0       - GATHER
  6   ScatterNode               COOR          0       - SCATTER
  7   RemoteNode                DBS           0       - REMOTE
  3   EnumerateCollectionNode   DBS           0       - FOR doc2 IN nonsatellite2   /* full collection scan */
  8   RemoteNode                COOR          0         - REMOTE
  9   GatherNode                COOR          0         - GATHER
  5   ReturnNode                COOR          0         - RETURN #2

Indexes used:
 none

Optimization rules applied:
 Id   RuleName
  1   move-calculations-up
  2   scatter-in-cluster
  3   remove-unnecessary-remote-scatter
```

All shards involved querying the `nonsatellite` collection fan out via the
Coordinator to the shards of `nonsatellite`. In sum, 8 shards open 8 connections
to the Coordinator, asking for the results of the `nonsatellite2` join. The Coordinator
fans out to the 8 shards of `nonsatellite2`. So there us quite some
network traffic.

Let's now have a look at the same using SatelliteCollections:

```js
arangosh> db._query("FOR doc in nonsatellite FOR doc2 in satellite RETURN 1")

Query string:
 FOR doc in nonsatellite FOR doc2 in satellite RETURN 1

Execution plan:
 Id   NodeType                  Site       Est.   Comment
  1   SingletonNode             DBS           1   * ROOT
  4   CalculationNode           DBS           1     - LET #2 = 1   /* json expression */   /* const assignment */
  2   EnumerateCollectionNode   DBS           0     - FOR doc IN nonsatellite   /* full collection scan */
  3   EnumerateCollectionNode   DBS           0       - FOR doc2 IN satellite   /* full collection scan, satellite */
  8   RemoteNode                COOR          0         - REMOTE
  9   GatherNode                COOR          0         - GATHER
  5   ReturnNode                COOR          0         - RETURN #2

Indexes used:
 none

Optimization rules applied:
 Id   RuleName
  1   move-calculations-up
  2   scatter-in-cluster
  3   remove-unnecessary-remote-scatter
  4   remove-satellite-joins
```

In this scenario all shards of `nonsatellite` are contacted. However,
as the join is a satellite join all shards can do the join locally
as the data is replicated to all servers reducing the network overhead
dramatically.

## Caveats

The cluster automatically keeps all SatelliteCollections on all servers in sync
by facilitating the synchronous replication. This means that writes are executed
on the leader only, and this server coordinates replication to the followers.
If a follower doesn't answer in time (due to network problems, temporary shutdown, etc.)
it may be removed as a follower. This is being reported to the Agency.

The follower (once back in business) then periodically checks the Agency and knows
that it is out of sync. It then automatically catches up. This may take a while
depending on how much data has to be synced. When doing a join involving the `satellite`
you can specify how long the DB-Server is allowed to wait for sync until the query
is being aborted. See [Cursors](http-api/queries/aql-queries.md#create-a-cursor) for details.

During network failure there is also a minimal chance that a query was properly
distributed to the DB-Servers but that a previous satellite write could not be
replicated to a follower and the leader dropped the follower. The follower however
only checks every few seconds if it is really in sync so it might indeed deliver
stale results.
