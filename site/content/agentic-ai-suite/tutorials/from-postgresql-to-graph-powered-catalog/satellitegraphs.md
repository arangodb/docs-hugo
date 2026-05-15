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
hires per month, the occasional re-org). And it gets joined against
constantly:

- Every "who designed this product?" query traverses
  `products → designed_by → employees → member_of → teams`.
- Every "which store manager handled this incident?" query traverses
  `stores.manager_employee_id → employees → manages*`.
- Every audit, every incident attribution, every approval flow walks this
  graph somewhere.

If Nordweave ever scales beyond one DB-Server - and they will, once they
ingest five years of clickstream data - every one of these queries has to
fetch employee/team data from another node. Multiply by every page load
that shows "designed by X" and the cost is real.

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

## Creating one

You create a SatelliteGraph through the `@arangodb/satellite-graph` module.
You don't have to specify shard counts or replication factors - the module
fills those in for you.

```js
const sat = require("@arangodb/satellite-graph");

const orgChart = sat._create("org_chart", [
  sat._relation("manages",    ["employees"], ["employees"]),
  sat._relation("member_of",  ["employees"], ["teams"]),
  sat._relation("leads",      ["employees"], ["teams"]),
  sat._relation("works_at",   ["employees"], ["stores"])
]);
```

That's it. Behind the scenes, ArangoDB sets
`replicationFactor: "satellite"` on the prototype collection and forces all
sibling collections to follow it (`distributeShardsLike`). Every DB-Server
now holds a complete, in-sync copy of `employees`, `teams`, `stores`, and
the four edge collections.

{{< warning >}}
Order of operations matters. Make the org-chart collections satellite
*before* loading their data, or be prepared to dump and re-import them.
SatelliteGraphs require special collection properties that are immutable
after creation. The `arangoimport` script in the [importing the
data](importing-data.md) page loads them as regular collections - fine for
a fresh tutorial run, but in a real migration you would:

1. Create the `nordweave` database with `{ sharding: "single" }`.
2. Create the org-chart collections via the satellite-graph module.
3. *Then* run `arangoimport` against those existing collections (skip
   `--create-collection true` for that subset).
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
- The full v0.1 spine imported from JSON Lines via `arangoimport`: 15
  vertex collections (~57k documents) and 18 edge collections (~750k
  edges), including transactional edges that carry their own payload
  (`contains.qty`, `made_of.pct`).
- A small SatelliteGraph holding the org chart (`employees`, `teams`,
  `stores` and the `manages` / `member_of` / `leads` / `works_at` edges),
  replicated to every DB-Server so every attribution query walks it
  locally.

That is the *foundation*. Everything else this series will build -
GraphRAG over reviews and supplier audits, AutoGraph over design briefs,
an agentic merchandiser asking *"what should we restock for next winter?"*
- sits on top of these three decisions.

## What's next

Next we take the spine we just imported and start looking at it
visually with the Graph Visualizer, then ask real questions of it through
Ada. Start with [opening the Graph Visualizer](graph-visualizer.md).
