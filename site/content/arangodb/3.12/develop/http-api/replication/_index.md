---
title: HTTP interface for replication
menuTitle: Replication
weight: 95
description: >-
  The replication HTTP API is used internally for synchronizing the nodes of an
  ArangoDB cluster, and lets you read data and the logged write operations
---
ArangoDB uses **synchronous** replication between the DB-Servers of a cluster to
keep the data of a shard consistent across its leader and followers and to allow
immediate failover. The replication architecture and components are described in
more detail in [Replication](../../../deploy/architecture/replication.md).

The HTTP replication interface is primarily used internally to synchronize the
nodes of a cluster, for example to bring a new or recovering DB-Server in sync
with the current shard leaders. A subset of the endpoints lets you read data and
the logged write operations of a server, which is what backup tools such as
_arangodump_ rely on. The main purposes are:

- Fetch an inventory of the available collections and indexes, and dump the data
  of collections (for example, for a backup or for the initial synchronization
  of a shard also known as snapshot transfer).
- Query the replication state, such as the state of the write-ahead log.
- Fetch the operations logged in the write-ahead log (used for the incremental
  synchronization of changes).
