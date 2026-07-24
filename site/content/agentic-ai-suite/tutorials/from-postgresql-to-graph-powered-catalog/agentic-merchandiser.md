---
title: "The agentic merchandiser: putting the whole platform to work"
menuTitle: Agentic merchandiser
weight: 60
description: >-
  Combine NL2AQL, the Reasoner, the Retriever, and the MCP Server into an
  agentic merchandising assistant that plans multi-step retrievals across the
  whole Nordweave platform
---

This is where the tutorial has been heading since the first chapter. Nordweave
no longer has "a database." They have a **Contextual Data Platform**: a
structured spine, a knowledge graph extracted from their documents, analytics
scores, and ML predictions - all living in the same graph, all queryable.

The last step is to stop asking it one question at a time. A merchandiser does
not think in single queries; they think in *goals*:

> *"We're planning the FW25 buy. What should we restock, what should we drop,
> and what's at supply risk - and tell me why."*

No single query answers that. It needs the order graph, the review knowledge
graph, the supplier audit findings, the PageRank scores, *and* the next-purchase
predictions - reconciled into one recommendation. That is an agentic task: many
steps, several tools, a plan.

## The pieces that make an agent possible

You have already met most of the platform. The agentic layer is what lets a
model *use* it autonomously.

### Natural Language to AQL (AQLizer)

[NL2AQL](../../natural-language-to-aql/_index.md) is the schema-aware translator
that turns "list customers in the platinum tier whose return rate exceeded 30%
last season" into AQL, runs it, and returns results. It is the agent's hands on
the *structured* spine - the tool it calls whenever the answer is a query over
orders, products, customers, or their edges. Where Ada is a chat surface for a
person, NL2AQL is the same capability exposed so it can be called as a step in a
larger plan.

### The Retriever

The [Retriever](../../retriever/_index.md) is the agent's hands on the
*unstructured* knowledge graph built by GraphRAG and AutoGraph. When a step needs
"what did reviewers and auditors actually say about this supplier's fabric," the
agent calls the Retriever - Instant Search for a quick fact, Deep Search across
AutoGraph partitions for a question that spans domains.

### The Reasoner

When a plan generates a heavy AQL query, the [Reasoner](../../reasoner/_index.md)
makes it fast. It inspects the query with **Explain** and **Profile**, examines
indexes and collection statistics, and rewrites it - iterating up to three times
and validating that the optimized query returns identical results. An agent
running dozens of queries to satisfy one goal benefits directly: each step lands
faster, and the whole plan finishes in a usable amount of time.

### The MCP Server

The thread tying it together is the **ArangoDB MCP Server**. The Model Context
Protocol is how an external agent or LLM discovers and calls these capabilities
as *tools* - explore the schema, run a query, retrieve from the knowledge graph,
optimize a query - over a standard interface. (The Reasoner already requires the
MCP Server to be running; the same bridge is what a custom agent connects to.)

## How the agent answers the FW25 question

Walk through what the merchandising agent actually does with that one sentence.
Each step uses a capability from an earlier chapter:

1. **Decompose the goal.** The agent breaks "what to restock / drop / flag" into
   sub-questions: top sellers, declining products, supply risk, demand
   forecast.
2. **Query the spine (NL2AQL + Reasoner).** It asks for FW24 bestsellers by
   revenue and for products with falling sell-through - traversals over `placed`
   → `contains` → `product`, optimized by the Reasoner before they run.
3. **Pull qualitative context (Retriever).** For the shortlist, it retrieves
   review and audit context from the knowledge graph: are the strong sellers
   also well-reviewed, or are returns climbing? Any open supplier findings?
4. **Read the analytics and ML attributes.** It reads the PageRank scores from
   [Graph Analytics](graph-analytics.md) (which products anchor the most
   baskets) and the next-purchase predictions from
   [GraphML](graphml-predictions.md) (where demand is heading), plus
   `manufactured_by` centrality to flag concentration risk.
5. **Reconcile and explain.** It assembles a recommendation - restock these
   (high PageRank, strong predicted demand, clean audits), drop those (declining,
   poorly reviewed), watch this supplier (central *and* low audit score) - with
   the supporting evidence attached to each call.

Notice that no step left the platform. The structured query, the document
retrieval, the analytics scores, the ML predictions, and the query optimization
all ran against the one `nordweave` graph through one set of tools. That is the
entire argument for a *contextual* data platform: an agent can reason across
everything because everything is in one place, connected.

{{< info >}}
This is also the answer to the gap Nordweave hit on day one. The "customers who
bought from the Atelier collection and returned fewer than 20%" question that
"pegged the database CPU" in PostgreSQL is now not even a question a human types
- it is one sub-step an agent runs on the way to a much larger goal.
{{< /info >}}

## From PostgreSQL to here

Trace the journey this tutorial walked:

- It started with a relational database that modeled Nordweave's world as rows
  and tables, and a set of questions - connections between customers, products,
  suppliers, and reviews - that rows and tables answered slowly or not at all.
- It moved the data into ArangoDB with `arangoimport`, made the right
  architectural calls (OneShard, SatelliteGraphs, Raft-backed safety), and gave
  the team ways to *see* and *ask* (Graph Visualizer, themes, Canvas Actions,
  Ada).
- It enriched the graph with everything that had been trapped in prose -
  reviews, audits, post-mortems - via GraphRAG and AutoGraph.
- It learned from the graph's structure with Graph Analytics and GraphML.
- And it handed the result to an agent that plans across all of it.

Everything agentic ultimately rests on the database. That is why this tutorial
started with the database itself - and why, by the end, the same data you
imported in the very first chapter is the data an autonomous merchandising
assistant reasons over today.

## Where to go next

- Build the knowledge graph for real with the
  [GraphRAG web interface](../../graphrag/web-interface.md) and the
  [Importer](../../importer/_index.md).
- Wire up an agent against the [ArangoDB MCP Server](../../reasoner/_index.md)
  and the [Retriever query API](../../retriever/executing-queries.md).
- Explore the full [Agentic AI Suite](../../_index.md) for the capabilities this
  tutorial only had room to introduce.
