---
title: "Graph Analytics: PageRank, communities, and centrality on the spine"
menuTitle: Graph Analytics
weight: 50
description: >-
  Run PageRank, community detection, and centrality on the Nordweave graph with
  Graph Analytics Engines, without slowing the transactional database
---

Up to now every question has been a *lookup* or a *traversal* - find these
products, follow these edges, retrieve this context. Those are queries: they
start from something you name and walk outward. But some of the most valuable
questions a retailer can ask have no starting point. They are about the
*structure of the whole graph*:

- Which products quietly sit at the center of everything customers buy
  *together*?
- Do Nordweave's 5,000 products fall into natural style communities that nobody
  designed on purpose?
- Which suppliers are so central that an incident at one of them would ripple
  across the catalog?
- Which influencers actually move the graph, versus just having a big follower
  count?

These are graph *analytics* questions, and answering them means running
algorithms over the entire structure at once.

## Why a separate engine

There is a tension here. PageRank over hundreds of thousands of edges is a
heavy, compute-bound, OLAP-style job. Nordweave's `nordweave` database is an
OLTP system - it is serving the storefront, logging orders, accepting returns.
You do not want a multi-minute analytics sweep competing with checkout for CPU.

ArangoDB resolves this with **[Graph Analytics Engines](../../graph-analytics/_index.md)**
(GAEs): a separation of storage and compute. A GAE is a dedicated, in-memory
compute layer that:

- imports the graph data it needs from ArangoDB,
- runs the algorithm entirely in main memory on machines sized for compute, and
- exports the results back into ArangoDB as document attributes.

Your transactional database keeps serving the store at full speed while the
analytics run on separate hardware. This is the OLAP/OLTP split that mature data
platforms insist on, available here without moving your data to a second system.

## The analyses Nordweave actually wants

### PageRank on the co-purchase graph

Build (or reuse) a product-to-product graph from the `purchased` and `contains`
edges - products connected when they are bought by the same customers - and run
**PageRank**. The high-scoring products are the ones that anchor the most
shopping baskets: the staples that, if they went out of stock, would drag the
most other sales down with them. That is a merchandising and inventory signal
you cannot get from raw sales counts, because it weights *connection*, not just
volume.

### Community detection on style

Run a community-detection algorithm (Louvain or label propagation) over the
products linked through shared `tagged_as` style tags and co-purchase behavior.
The communities that fall out are *emergent* style segments - clusters of
products that hang together in how customers actually treat them, regardless of
the 105 style tags the team assigned by hand. Sometimes they confirm the
taxonomy; sometimes they reveal a "quiet luxury meets gym" cross-segment that
nobody had a label for, which is exactly the kind of insight a buyer acts on.

### Centrality on the supply chain

Run a centrality measure over `manufactured_by` (product → supplier) and the
materials graph. Suppliers with high centrality are single points of failure:
many products, across many collections, depend on them. Cross-reference the top
of that list with the low `last_audit_score` suppliers from the
[GraphRAG chapter](graphrag-over-reviews.md) and you have a ranked supply-chain
risk register - centrality times audit risk - that updates itself as the graph
changes.

### Connected components and influencer reach

Connected-components and PageRank over the influencer graph (`has_style_pref`,
the style tags an influencer represents, and the customers who share them) tells
you which influencers actually sit on the paths between style segments and
buying customers - distinct from `follower_count`, which only measures audience
size, not graph reach.

## Running it

You drive Graph Analytics Engines from the
[web interface](../../graph-analytics/web-interface.md) for interactive work, or
through the API to fold an analysis into a pipeline. The typical loop is: define
the subgraph to load, pick the algorithm, run it on the engine, and write the
scores back as attributes (`product.pagerank`, `product.community_id`,
`supplier.centrality`). Once they are attributes on the documents, every tool
you have already met - Ada, the Graph Visualizer, a Custom Theme that colors by
`community_id` - can use them immediately.

{{< tip >}}
This is the payoff of writing results *back* into ArangoDB rather than into a
separate analytics store. The PageRank score you computed on the GAE becomes a
field you can color a theme by, filter an Ada question on, or feed into the
machine-learning features in the next chapter - all without an export step.
{{< /tip >}}

## What's next

Graph Analytics describes the graph as it *is* - its centers, its communities,
its critical nodes. The next chapter, [GraphML](graphml-predictions.md), uses
that same structure to predict what the graph will *become*: what a customer
buys next, and which customers are quietly running a return-fraud pattern.
