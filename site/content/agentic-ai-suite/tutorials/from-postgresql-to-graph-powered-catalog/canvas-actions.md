---
title: "Canvas Actions: interactive graph investigation"
menuTitle: Canvas Actions
weight: 30
description: >-
  Turn the Graph Visualizer canvas into an investigation tool with Canvas
  Actions - selection-driven AQL queries tailored to the Nordweave graph
---

Queries in the Graph Visualizer come in two flavors:

- **Regular queries** - you write AQL, you run it, results appear on the
  canvas. These are great for known questions with known starting points.
- **Canvas Actions** - you select nodes on the canvas first, then run a
  query that uses your selection as input. The query has access to two
  special bind variables: `@nodes` (an array of the selected node IDs) and
  `@edges` (an array of the selected edge IDs).

Canvas Actions are what turn the Graph Visualizer from a viewing tool
into an investigation tool. They let you point at something and say "show
me more about this."

## Setting up your first Canvas Action

1. Click **Queries** in the top bar.
2. Go to the **Canvas actions** tab.
3. Click **New action**.
4. Enter an AQL query that uses `@nodes`, `@edges`, or both.
5. Give it a name and description, then save.

Below are five Canvas Actions tailored to the Nordweave dataset. Each one
answers a real question that a Nordweave team member would ask.

## Action 1: "Who else bought this?"

Select one or more products on the canvas. This action finds customers who
purchased the selected products and brings them onto the canvas along with
the purchase path.

- **Name:** Who Bought This?
- **Description:** Select products to see which customers purchased them.

```aql
FOR prod IN @nodes
  FOR v, e, p IN 2..2 INBOUND prod
    GRAPH "nordweave_catalog"
    FILTER p.edges[0]._id LIKE "contains/%"
    FILTER p.edges[1]._id LIKE "placed/%"
    LIMIT 50
    RETURN p
```

How it works: starting from the selected product, it traverses inbound
two hops - first from the product to an order (via the `contains` edge),
then from the order to a customer (via the `placed` edge). The result is
the full path: customer → order → product.

## Action 2: "What's the supply chain?"

Select a product. This action reveals its full material and supplier
story.

- **Name:** Supply Chain Trace
- **Description:** Select a product to see its materials and suppliers.

```aql
WITH products, materials, suppliers
FOR prod IN @nodes
  LET productMaterials = (
    FOR v, e IN 1..1 OUTBOUND prod made_of
      RETURN { vertex: v, edge: e }
  )
  LET productSupplier = (
    FOR v, e IN 1..1 OUTBOUND prod manufactured_by
      RETURN { vertex: v, edge: e }
  )
  FOR item IN APPEND(productMaterials, productSupplier)
    RETURN item
```

This fans out the product node to show every material (with percentage)
and the supplier - all in one click. The `WITH` clause is required on a
cluster: a traversal over bare edge collections must declare the vertex
collections it touches up front, or it fails with
`ArangoError 1521: collection not known to traversal`.

## Action 3: "Similar products and their reviews"

Select a product. Find products that share a style tag with it, then pull
in who reviewed those similar products.

- **Name:** Similar Products + Reviews
- **Description:** Select a product to find items that share a style tag
  and see who reviewed them.

```aql
WITH products, style_tags, customers
FOR prod IN @nodes
  FOR tag, prodTagEdge IN 1..1 OUTBOUND prod tagged_as
    FOR similar, simTagEdge IN 1..1 INBOUND tag tagged_as
      FILTER similar._id != prod
      LIMIT 10
      LET reviewers = (
        FOR reviewer, reviewEdge IN 1..1 INBOUND similar reviewed
          LIMIT 5
          RETURN { vertices: [reviewer], edges: [reviewEdge] }
      )
      RETURN APPEND(
        [{ vertices: [tag, similar], edges: [prodTagEdge, simTagEdge] }],
        reviewers
      )
```

Nordweave has no explicit "similar product" edge, so this action defines
similarity as *sharing a style tag*: it hops from the product out to its
`style_tags` and back in to every other product carrying that tag, then
walks `reviewed` inbound to surface the reviewers. As with Action 2, the
`WITH` clause declares the vertex collections the bare-collection traversal
touches.

## Action 4: "Show me this customer's return pattern"

Select a customer. This action pulls all their returns and the associated
products, making the return pattern visually obvious.

- **Name:** Return Pattern
- **Description:** Select a customer to see all their returns and
  affected products.

```aql
WITH customers, products
FOR cust IN @nodes
  FOR product, e, p IN 1..1 OUTBOUND cust returned
    RETURN p
```

This traverses a bare edge collection (`returned`) rather than the named
graph, so the `WITH customers, products` clause is required on a cluster -
without it the query fails with `ArangoError 1521: collection not known to
traversal: 'products'`. (Action 1 needs no `WITH` because it goes through
the named `GRAPH`.)

When you run this on Christine Palmer (`cust_00289`), the canvas fills
with red `RETURNED` edges radiating outward. Combined with the Customer
Journey theme (where return edges are thick and red), the fraud pattern is
unmistakable.

## Action 5: "What connects these two?"

Select exactly two nodes - any two. This action runs `ALL_SHORTEST_PATHS`
between them to reveal every shortest connection.

- **Name:** All Shortest Paths
- **Description:** Select exactly two nodes to find all shortest paths
  between them.

```aql
LET nodeList = @nodes
LET startNode = nodeList[0]
LET endNode = nodeList[1]
FOR p IN ANY ALL_SHORTEST_PATHS startNode TO endNode
  GRAPH "nordweave_catalog"
  LIMIT 20
  RETURN p
```

This is the general-purpose investigation tool. Select a customer and a
supplier - you'll see the chain: customer → order → product → supplier.
Select two products - you might find they share a material, a customer,
or a style tag. The graph tells you how things are connected, even when
you didn't know to ask.

## Using Canvas Actions in practice

Once the actions are saved, the workflow is:

1. Select one or more nodes on the canvas (click, Shift+click, or
   Shift+drag for a box selection).
2. Right-click the canvas.
3. Click **Canvas Action** and choose from your saved actions.
4. New nodes and edges appear on the canvas, expanding your view.
5. Apply a theme if you haven't already - the new nodes pick up the
   theme's styling automatically.

This is the investigative loop: select, act, read, narrow, repeat. Each
action brings new data onto the canvas, each theme highlights the signal
in that data, and dismissing irrelevant nodes keeps the view focused.
After a few iterations, you'll have a focused subgraph that tells a
specific story - a supply-chain risk, a customer cohort, a product
cluster - without writing a single query from scratch.

## What's next

Visual investigation is powerful, but it still assumes you know the
schema, know AQL, and know what question you are asking. The final page
of this tutorial introduces [Ada](meeting-ada.md) - the conversational
interface that lets anyone on the team ask Nordweave questions in plain
English.
