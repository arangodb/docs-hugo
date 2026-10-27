---
title: "OneShard: single-server feel, cluster-grade safety"
menuTitle: OneShard databases
weight: 10
description: >-
  Configure the nordweave database as a OneShard database so graph traversals
  run with single-server latency while keeping cluster-grade replication
---

The previous page got the Nordweave spine into ArangoDB. This page covers
the first big architectural decision: how that data should be sharded.

Nordweave's whole spine - 57k vertices and 750k edges - fits comfortably on
one DB-Server. Their queries are graph-heavy:

- *"What are the top 10 bestselling products in the Atelier collection for
  Q3 2025 by revenue?"*
- *"Which suppliers have had more than one SEV1 incident in the past year,
  and which products were affected?"*
- *"List customers in the platinum tier whose return rate exceeded 30% last
  season."*

Each of these chains together 4-6 hops: customer → order → contains →
product → category, or customer → order → contains → product →
manufactured_by → supplier. Graph traversals like these *hate* network
hops.

A naive cluster setup would shard the catalog across, say, five DB-Servers.
A traversal that follows five edges would then bounce between servers five
times, paying a network round-trip each hop. The total query time becomes
"compute time + a *lot* of network time."

OneShard is the answer.

## What OneShard does

A OneShard database restricts every collection in that database to a single
shard, and pins all leader shards to the same DB-Server node. The
Coordinator can then push the *entire query* down to that one server, which
executes it like a single-server database would. The Coordinator only sees
the final result come back.

The result: single-server query latency, with cluster-grade availability.

You enable it at database creation time:

```js
db._createDatabase("nordweave", { sharding: "single" });
```

Or, if you want every database in the cluster to behave this way, set the
startup flag `--cluster.force-one-shard` on the servers.

Once a database is created with `{ sharding: "single" }`, every collection
in it inherits a `numberOfShards` of `1` and lines its leader up on the
same DB-Server. You can verify it by looking for the `cluster-one-shard`
optimizer rule in `db._explain()` output:

```text
Optimization rules applied:
...
5 cluster-one-shard
```

That single line in the explain output is the visible signal that your
query is running fully on the DB-Server, not being scatter-gathered across
the cluster.

{{< tip >}}
This is exactly the database we asked `arangoimport` to create with
`--create-database true`. In production you would create it explicitly up
front with `{ sharding: "single" }` rather than letting the importer create
it with default sharding.
{{< /tip >}}

## "But isn't that just a single server?"

This is the question that always gets asked, and the answer is: no, because
of replication. OneShard databases can - and in production, *should* - set
a `replicationFactor` greater than 1. ArangoDB then keeps synchronous
follower copies of each shard on other DB-Servers. If the leader DB-Server
fails, a follower is promoted and queries resume.

For Nordweave, a `replicationFactor` of `2` means every shard has one
leader and one follower; a value of `3` gives one leader and two followers.
The follower shards are also placed together on a single DB-Server, so
OneShard's "everything on one server" property is preserved on the follower
too - fast failover, no scatter-gather.

## Where the Raft protocol comes in

How does the cluster *agree* which DB-Server holds the leader for a given
shard? How does it agree on a new leader after a failure? How does it
agree which databases exist, which collections they contain, which indexes
are defined, which users have which permissions?

The answer is **Raft**, a consensus algorithm designed to keep a small
group of servers - in ArangoDB called the **Agency** - in agreement about
the state of the cluster, even when individual nodes fail.

A simplified picture:

- The Agency is a small cluster of Agent nodes (typically three or five).
- One Agent is the *Raft leader*; the others are followers.
- Every cluster-wide decision (shard moved, leader changed, collection
  created) is written as a log entry by the leader and replicated to a
  majority of followers before it is considered committed.
- If the leader dies, the followers run a leader election and the cluster
  keeps going.

For OneShard, Raft is the thing that lets ArangoDB say, with confidence,
"the leader for the `products` shard lives on DB-Server D2" - and to update
that assertion atomically when D2 fails. Coordinators read this information
from the Agency to route queries; DB-Servers read it to know which shards
they own.

You don't write Raft, you don't tune Raft, you don't see Raft in your
queries. You just benefit from it: the `nordweave` database keeps
single-server performance characteristics *and* survives node failure,
because the Raft-backed Agency keeps everyone aligned on who is doing what.

{{< info >}}
When OneShard is *not* a good fit: if your dataset grows beyond what a
single DB-Server can hold or serve, you need horizontal sharding. In that
case, look at SmartGraphs (covered in a later chapter), which shard graph
data by an attribute that preserves locality. Nordweave's 57k vertices
comfortably fit on one server. A 57M-vertex catalog probably wouldn't.
{{< /info >}}

## What's next

OneShard solves the "I have one big tightly-connected dataset" case. But
there is a different pattern in the spine worth pulling out on its own:
the org chart. The next page covers
[SatelliteGraphs](satellitegraphs.md) - the right answer for small,
read-heavy reference graphs that need to be local on every DB-Server.
