---
title: Replication
menuTitle: Replication
weight: 20
description: >-
  Replication synchronizes state between different machines, like the data of
  different cluster nodes
archetype: default
---
Replication allows you to *replicate* data onto another machine. It
forms the base of all scalability and failover features ArangoDB
offers. 

ArangoDB uses **synchronous** replication between the _DB-Servers_ of an
ArangoDB Cluster.

Synchronous replication is typically used for mission critical data which must be
accessible at all times. Synchronous replication generally stores a copy of a shard's
data on another DB-Server and keeps it in sync. Essentially, when storing
data after enabling synchronous replication, the Cluster waits for
all replicas to write all the data before green-lighting the write
operation to the client. This naturally increases the latency a
bit, since one more network hop is needed for each write. However, it
enables the cluster to immediately fail over to a replica whenever
an outage is detected, without losing any committed data, and
mostly without even signaling an error condition to the client. 

Synchronous replication is organized such that every _shard_ has a
_leader_ and `r - 1` _followers_, where `r` denotes the **replication factor**.
The replication factor is the total number of copies that are kept, that is, the
leader and follower count combined. For example, with a replication factor of
`3`, there is one _leader_ and `3 - 1 = 2` _followers_. You can control the
number of _followers_ using the `replicationFactor` parameter whenever you
create a _collection_, by setting a `replicationFactor` one higher than the
desired number of followers. You can also adjust the value later.

You cannot set a `replicationFactor` higher than the number of available
DB-Servers by default. You can bypass the check when creating a collection by
setting the `enforceReplicationFactor` option to `false`. You cannot bypass it
when adjusting the replication factor later. Note that the replication factor
is not decreased but remains the same during a DB-Server node outage.

In addition to the replication factor, there is a **writeConcern** that
specifies the minimum number of in-sync followers required for write operations.
If you specify the `writeConcern` parameter with a value greater than `1`, the
collection's leader shards are locked down for writing as soon as too few
followers are available.
