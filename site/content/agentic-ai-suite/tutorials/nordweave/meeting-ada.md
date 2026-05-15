---
title: "Chapter 2.4 - Meeting Ada: your AI-powered database assistant"
menuTitle: Meeting Ada
weight: 35
description: >-
  Configure Ada and ask Nordweave questions in plain English, then learn
  when to reach for the Graph Visualizer vs. the chat interface
---

Everything we have done so far - loading data, visualizing it, building
themes, writing Canvas Actions - requires you to know the schema, know
AQL, and know what question you are asking. That is powerful, but it is
also a barrier. Not everyone on Nordweave's team writes AQL. The
merchandising lead wants to know "which style tags grew fastest last
season" - she doesn't want to think about edge traversals and `COLLECT`
statements.

This is where Ada comes in.

## What Ada is

[Ada](../../ada.md) is the ArangoDB AI Digital Assistant, built directly
into the Arango Contextual Data Platform. It is a chat interface - you
type a question in plain English, and Ada generates the AQL query, runs
it against your database, and shows you the results. It is powered by an
external LLM of your choice (Anthropic, OpenAI, OpenRouter, or a custom
endpoint), and it is scoped to whichever database you have selected.

Ada is the first tool in what ArangoDB calls the
[Agentic AI Suite](../../_index.md) - a collection of AI-native
capabilities built on top of the graph database. Where the Graph
Visualizer gives you visual investigation, Ada gives you conversational
investigation.

## Setting up Ada

Before using Ada, you need two things: an API key for your chosen LLM
provider, and a one-time configuration.

1. Go to the **Secrets Manager** (in the Platform Suite navigation) and
   add your LLM API key - for example, your Anthropic or OpenAI key.
2. Open Ada from the left sidebar. Click the gear icon in the top right
   of the Ada panel.
3. Select your **Provider** (Anthropic, OpenAI, OpenRouter, or Custom
   Endpoint), choose a **Model**, select the API key you just stored,
   and click **Save**.

That's it. The top bar updates to show your active configuration - for
example, `nordweave  anthropic/claude-sonnet-4-20250514`.

## Asking Nordweave questions in plain English

Here is where the value becomes tangible. Instead of writing AQL, you
simply type what you want to know. Walk through a few questions that map
to the graph structures explored visually earlier in this chapter.

### Question 1: "What collections do I have?"

This is the starter question - it orients you. Ada responds with a list
of all collections in the `nordweave` database, their types (document or
edge), and document counts. It is the equivalent of glancing at the
Legend panel in the Graph Visualizer, but for someone who hasn't opened
the visualizer yet.

### Question 2: "Show me the top 10 products by number of reviews"

Ada generates an AQL query that traverses the `reviewed` edges, groups by
product, counts, sorts, and returns the top 10. You see the results
inline - product names, review counts, maybe average ratings. Behind the
scenes, Ada wrote something like:

```aql
FOR product IN products
  LET reviewCount = LENGTH(
    FOR v IN 1..1 INBOUND product reviewed
      RETURN 1
  )
  SORT reviewCount DESC
  LIMIT 10
  RETURN { name: product.name, reviews: reviewCount }
```

You didn't write that. You asked a question and got an answer.

### Question 3: "Which suppliers have audit scores below 0.5?"

This is the same data you highlighted in red in the Supply Chain theme -
but now you are getting a precise list with names, countries, and scores,
without needing to scroll through a visual canvas.

### Question 4: "Compare return rates between online and in-store orders"

Ada can generate queries that aggregate across the order channel, join
in return data, and produce a comparison. If the result lends itself to
a chart, Ada can render it as a React artifact - an interactive Recharts
visualization right in the chat panel. A bar chart comparing online vs.
in-store return rates appears inline, no dashboard setup required.

### Question 5: "Find customers who bought from the Atelier collection and have a return rate above 30%"

This is the query that motivated Nordweave's move to a graph database in
the first place - the one that was "deeply nested SQL joins that pegged
the database CPU" in Chapter 1. In Ada, it is a single sentence. Ada
builds the traversal (customer → order → product → collection, filtered
by `return_rate_pct`), runs it, and returns the results.

## Artifacts: when Ada goes beyond text

Ada doesn't just return text and tables. It can produce two types of
rendered output:

- **React artifacts** - interactive data visualizations built with
  Recharts. Ask "chart the distribution of product prices by category"
  and you get a bar chart. Ask "show me a pie chart of orders by
  channel" and you get a pie chart. These render directly in the chat
  panel.
- **HTML artifacts** - diagrams, styled tables, SVG visualizations. Ask
  "draw the relationship between the Atelier collection and its
  products" and Ada might render an entity-relationship diagram as SVG.

These artifacts aren't throwaway - you can reference them in follow-up
questions, and they give you a richer answer than plain text ever could.

## Ada and the Graph Visualizer: complementary tools

Ada and the Graph Visualizer aren't competitors - they are two
interfaces to the same data, optimized for different workflows.

**Use the Graph Visualizer when:**

- You want to explore visually, following connections you didn't
  anticipate.
- You need spatial intuition - seeing clusters, outliers, and patterns.
- You are building a focused subgraph for a presentation or
  investigation.
- You want to customize the visual layer with themes for your team.

**Use Ada when:**

- You know what you are looking for and want a fast, precise answer.
- You don't want to write AQL yourself.
- You want aggregations, charts, or comparisons - things that are
  easier in tabular/chart form than on a graph canvas.
- You are onboarding someone who isn't fluent in the schema yet.

The most effective workflow combines both: use Ada to find interesting
entities ("which products have the highest return rates?"), then pull
those products into the Graph Visualizer to see their supply chain,
customer overlap, and style-tag context. Or start in the visualizer,
notice a cluster of red-flagged suppliers, and ask Ada "what incidents
have been logged against `supplier_042` in the past year?"

## What's next for Ada - and the Agentic AI Suite

Ada is the conversational entry point, but it is just the beginning. The
Agentic AI Suite includes several other tools that build on the same
foundation:

- [**AQLizer / Natural Language to AQL**](../../natural-language-to-aql/_index.md) -
  natural language to AQL, embedded directly in the Query Editor for
  users who want to write and refine queries rather than chat.
- [**AutoGraph**](../../autograph/_index.md) - takes unstructured
  documents (PDFs, Markdown, plain text) and extracts entities and
  relationships, writing them back into ArangoDB as a knowledge graph.
  This is how Nordweave's lookbooks, supplier audits, and incident
  post-mortems will become part of the graph in a later chapter.
- [**GraphRAG**](../../graphrag/_index.md) - retrieval-augmented
  generation that uses graph traversals to find context, not just
  vector similarity. When you ask "what did the FW25 trend report say
  about oversized silhouettes?" GraphRAG can follow the chain: trend
  report → mentions → products → style tags → "oversized" - and ground
  its answer in the actual documents and graph connections.
- [**Graph Analytics**](../../graph-analytics/_index.md) - community
  detection (Louvain), centrality (PageRank), and path analysis,
  running natively on the graph. Nordweave can use these to find
  product clusters, identify critical suppliers, and analyze customer
  cohorts.

## What we built in Chapter 2

By the end of Chapter 2, Nordweave has moved from "data in a database"
to "data you can see, style, and interact with":

- A named graph (`nordweave_catalog`) that registers the vertex and
  edge collections as a coherent, traversable structure in the Graph
  Visualizer.
- An understanding of the relationship patterns - the product star, the
  customer journey, the supply chain spine, and the org chart bridge -
  that give shape to the data.
- Three custom themes - Supply Chain View, Customer Journey View, and
  Editorial View - that let different teams see different signals in
  the same graph, using attribute-based color rules, icons, labels, and
  edge styling.
- Five Canvas Actions - "Who Bought This?", "Supply Chain Trace",
  "Similar Products + Reviews", "Return Pattern", and "All Shortest
  Paths" - that turn node selections into interactive investigations,
  no AQL knowledge required from the person clicking.
- Ada configured and running, translating natural language questions
  into AQL queries and visual artifacts, making the Nordweave data
  accessible to anyone on the team.

This is the bridge between the raw infrastructure of Chapter 1 and the
agentic AI workflows that follow. You have the data, you can see it, you
can ask questions of it in English. The next step is to enrich it - with
unstructured documents, knowledge graphs extracted from text, and
ultimately a fully agentic merchandising assistant that plans multi-step
retrievals across the whole platform.

Right now, go expand a node. Switch a theme. Run a Canvas Action. Ask Ada
something it shouldn't know. The graph is alive - play with it.
