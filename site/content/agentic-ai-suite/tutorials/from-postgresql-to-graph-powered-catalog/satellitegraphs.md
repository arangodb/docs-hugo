---
title: "SatelliteGraphs: hot reference data on every server"
menuTitle: SatelliteGraphs
weight: 15
description: >-
  Co-locate the Nordweave org chart on every DB-Server with a SatelliteGraph
  so every attribution query walks it locally
---

OneShard solved the "one big tightly-connected dataset" case. There is a
different pattern in the spine that deserves its own treatment: the org
chart.

- 410 employees
- 30 teams
- 41 stores
- ~980 edges total: `manages` (389), `member_of` (410), `leads` (30),
  `works_at` (154)

This little graph is *small*, *read-heavy*, and *rarely modified* (a few
hires per month, the occasional re-org). And it gets traversed constantly:

- Every "who manages this employee, and who do they manage?" query walks
  `employees → manages*`.
- Every "which team is this person on, and who else is on it?" query walks
  `employees → member_of → teams ← member_of ← employees`.
- Every "which employees work at this store?" query walks
  `stores ← works_at ← employees`.
- Every org-wide rollup - headcount by team, span of control, store
  staffing - walks this graph somewhere.

If Nordweave ever scales beyond one DB-Server - and they will, once they
ingest five years of clickstream data - every one of these queries would
have to fetch employee/team data from whichever node holds the relevant
shard. Multiply by every dashboard and approval flow that reads the org
chart and the cost is real.

This is exactly what SatelliteGraphs are for.

## What a SatelliteGraph does

A SatelliteGraph is a named graph whose underlying collections are
synchronously replicated to every DB-Server in the cluster. The practical
consequence: any DB-Server can traverse the entire graph locally, without
asking any other server for data.

Compare:

| Graph type | Where the graph data lives | Traversal location | Best for |
|---|---|---|---|
| General Graph | Randomly across DB-Servers | Coordinator | Small, simple graphs; prototyping |
| SmartGraph | Sharded by a chosen attribute | DB-Servers, with locality | Large, naturally clustered graphs |
| EnterpriseGraph | Random sharding, edges co-located with adjacent vertices | DB-Servers | Large enterprise graphs balancing scale and locality |
| SatelliteGraph | Fully replicated to every DB-Server | DB-Servers, locally | Small/medium read-heavy reference graphs |

For the Nordweave org chart, SatelliteGraph is the obvious choice.

## Why it can't live in the OneShard database

Here is the constraint that drives everything below: **you cannot put a
SatelliteGraph inside a OneShard database.** The two models are opposites.
OneShard pins every collection's single shard to *one* DB-Server; a
SatelliteGraph replicates its collections to *every* DB-Server. A OneShard
database forces every collection to follow one shared sharding prototype
(`distributeShardsLike`), which overrides the `replicationFactor:
"satellite"` a SatelliteGraph depends on.

Worse, the failure is silent. On a OneShard database the
`replicationFactor: "satellite"` request is downgraded to an ordinary
numeric factor with no error and no warning - you think you created a
SatelliteGraph, but you actually have a regular graph that is *not*
replicated to every DB-Server. (Run the identical create call in a
non-OneShard database and `replicationFactor` correctly comes back as
`"satellite"`.)

So the org chart needs its own database - one created with default
sharding, *not* `{ sharding: "single" }`:

```js
db._createDatabase("nordweave_org");   // default sharding, NOT OneShard
db._useDatabase("nordweave_org");
```

## Creating the SatelliteGraph

Inside `nordweave_org`, create the SatelliteGraph through the
`@arangodb/satellite-graph` module. You don't have to specify shard counts
or replication factors - the module fills those in for you, and because the
database is not OneShard, the satellite properties actually take effect:

```js
const sat = require("@arangodb/satellite-graph");

const orgChart = sat._create("org_chart", [
  sat._relation("manages",    ["employees"], ["employees"]),
  sat._relation("member_of",  ["employees"], ["teams"]),
  sat._relation("leads",      ["employees"], ["teams"]),
  sat._relation("works_at",   ["employees"], ["stores"])
]);
```

Behind the scenes, ArangoDB sets `replicationFactor: "satellite"` on the
prototype collection and forces all sibling collections to follow it
(`distributeShardsLike`). Every DB-Server now holds a complete, in-sync
copy of `employees`, `teams`, `stores`, and the four edge collections.
Confirm it stuck by checking
`db.employees.properties().replicationFactor` - it should read
`"satellite"`, not a number.

With the collections in place, load the org-chart files into them. Because
the collections already exist with their satellite properties, omit
`--create-collection true` so `arangoimport` reuses them instead of
creating plain collections:

```bash
for v in employees teams stores; do
  arangoimport --file "spine/${v}.jsonl" --type jsonl \
    --collection "${v}" --server.database nordweave_org \
    --server.endpoint "http+ssl://<COORDINATOR>:8529" \
    --server.username root --threads 4
done
for e in manages member_of leads works_at; do
  arangoimport --file "spine/edges_${e}.jsonl" --type jsonl \
    --collection "${e}" --server.database nordweave_org \
    --server.endpoint "http+ssl://<COORDINATOR>:8529" \
    --server.username root --threads 4
done
```

{{< warning >}}
Order of operations matters. The satellite properties are immutable after a
collection is created, so the collections must exist *before* any data
lands - load first and you are back to dumping and re-importing. That is
why the [importing the data](importing-data.md) chapter deliberately skips
the org chart: you create the SatelliteGraph here, then import into it.

It is also why `designed_by` (the product → designer edge) is dropped
entirely. An edge cannot span two databases, so once the org chart lives in
`nordweave_org` and products live in `nordweave`, a direct
product-to-employee link is no longer possible. If you need designer
attribution on the catalog side, denormalize it - store the designer's
employee ID as an attribute on the product document rather than as an edge.
{{< /warning >}}

## Why this matches compute-resource locality

The promise is clean: any instance that is spun up of a particular
database, the database can be hosted within its own compute resources.
That is exactly the SatelliteGraph guarantee. When a DB-Server runs a
query that touches the org chart, the relevant data is already present on
that server's disk and in its caches. No cross-machine call. No
deserialize-from-network. The graph traversal is, from the DB-Server's
perspective, a local operation.

You can see the difference in `db._explain()` output: with a
SatelliteGraph, the `TraversalNode` runs on the DB-Server (`DBS`); with a
General Graph, the same node runs on the Coordinator (`COOR`), fetching
adjacent vertices over the network for every step.

## The trade-off

There is no free lunch. SatelliteGraphs replicate writes as well as reads.
Every insert, update, or delete is applied on every DB-Server. So:

- **Read-heavy, write-light reference data** → great fit. The org chart
  qualifies - Nordweave hires a few people a month.
- **Heavy write workloads** → avoid, use SmartGraphs instead. This is why
  the `orders` / `contains` / `purchased` graph stays in OneShard, *not* in
  a SatelliteGraph.
- **Storage-constrained clusters** → be aware, since the graph is
  duplicated everywhere. The org chart at ~480 vertices and ~980 edges is
  trivial; the catalog at 5,000 products and 100k orders would not be a
  sensible satellite.

## What we built so far

By this point, Nordweave has:

- A live ArangoDB database called `nordweave`, created with
  `{ sharding: "single" }` so every collection in it is OneShard. Their
  graph queries run with single-server latency, replicated for safety
  across the cluster, with the Raft-backed Agency keeping everyone aligned.
- The catalog spine imported into `nordweave` from JSON Lines via
  `arangoimport`: 12 vertex collections and 13 edge collections, including
  transactional edges that carry their own payload (`contains.qty`,
  `made_of.pct`).
- A second database, `nordweave_org`, created with default sharding, that
  holds the org chart as a SatelliteGraph (`employees`, `teams`, `stores`
  and the `manages` / `member_of` / `leads` / `works_at` edges), replicated
  to every DB-Server so every org-chart traversal runs locally. The price
  of making it a satellite is that it stands on its own, separate from the
  OneShard catalog.

That is the *foundation*. Everything else this series will build -
GraphRAG over reviews and supplier audits, AutoGraph over design briefs,
an agentic merchandiser asking *"what should we restock for next winter?"*
- sits on top of these three decisions.

## What's next

Next we take the spine we just imported and start looking at it
visually with the Graph Visualizer, then ask real questions of it through
Ada. Start with [opening the Graph Visualizer](graph-visualizer.md).
