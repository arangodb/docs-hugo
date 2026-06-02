---
title: "GraphML: predicting the next purchase and catching return fraud"
menuTitle: GraphML
weight: 55
description: >-
  Use ArangoDB GraphML to predict a customer's next purchase with link
  prediction and flag return-fraud customers with node classification
---

Graph Analytics told Nordweave about the graph's *current* structure. The
natural next question is predictive: given everything in the graph, what
*hasn't happened yet but is about to* - and which patterns are quietly hiding in
plain sight?

That is graph machine learning. And the reason it belongs in this tutorial,
rather than in a separate data-science project, is the whole thesis Nordweave
signed up for: the connections *are* the signal. A customer's next purchase is
not predicted well by their attributes alone (age, country, loyalty tier) - it
is predicted by the *shape* of their neighborhood in the buying graph. That is
precisely what [ArangoDB GraphML](../../graphml/_index.md) learns from.

## How GraphML learns from structure

ArangoDB's GraphML is built on **GraphSAGE**, a graph neural network framework.
Where traditional ML sees a flat row of features, GraphSAGE also samples each
node's neighborhood - up to 25 direct neighbors, and 10 neighbors of each of
those - and aggregates their features into a rich embedding for the node. The
embedding captures both *what a node is* and *where it sits* in the graph.

You do not implement any of that. You point GraphML at a graph, tell it which
nodes and which task, and the managed service handles featurization (booleans to
0/1, numbers normalized, text run through sentence transformers, dimensionality
reduced with incremental PCA), training, and writing predictions back into
ArangoDB. You can run the whole flow from the [web interface](../../graphml/ui.md)
or [programmatically](../../graphml/notebooks-api.md).

GraphML supports two task types, and Nordweave has a textbook use for each.

## Link prediction: the next purchase

**The task.** Given the `purchased` graph (customer → product), predict the
edges that *don't exist yet but are likely to form* - i.e. the products a
customer is most likely to buy next.

This is the canonical graph-ML success story, the one customers grasp
instantly: "predict what this shopper will buy next." It works because
GraphSAGE learns from shared neighborhoods - two customers who bought
overlapping products, and the style tags / collections those products connect
to, end up with similar embeddings, so a product bought by one becomes a strong
candidate for the other, *even if they have never interacted*.

For Nordweave this drives recommendations on the storefront, "complete the
look" suggestions, and restock prioritization - all grounded in the same graph
the rest of the platform already serves, with no separate feature store to keep
in sync.

## Node classification: return fraud

**The task.** Some customers are running a *return-to-wear* pattern - buy, wear,
return for a refund. In the Nordweave data, **192 customers** carry an
`is_return_fraud` label (average return rate ~88%, average lifetime value
~$8,200). Use those labels to train a model that flags the *unlabeled* customers
behaving the same way.

Node classification is supervised: a portion of the nodes is labeled, the model
learns from both **node features** (return rate, loyalty tier, lifetime value)
*and* **structural relationships** (what they buy, return, and review, and how
that overlaps with known fraud customers), and then predicts labels for everyone
else.

The structural part is what makes this more than a SQL `WHERE return_rate >
0.5`. A first-time fraudster with only a few orders has no damning rate yet - but
if their `purchased` / `returned` neighborhood looks like the neighborhoods of
known fraud customers, the model catches them anyway. With 192 positives in
20,000 customers, this is a realistically imbalanced classification problem - the
kind GraphML is built for.

{{< info >}}
The same node-classification machinery handles less adversarial tasks too -
predicting which loyalty tier an unclassified customer belongs in, or which
style segment a new product fits. The recipe is identical: label some nodes,
let the model learn from features *and* connections, predict the rest.
{{< /info >}}

## Predictions go back into the graph

GraphML persists its output back into ArangoDB - a `predicted_next_products`
list on a customer, a `fraud_score` attribute, a predicted tier. The moment they
land, they are ordinary graph data: Ada can answer "which gold-tier customers
have a fraud score above 0.8?", a Custom Theme can color the canvas by predicted
segment, and - crucially for the next chapter - an agent can *read* them while
planning a multi-step task.

{{< tip >}}
GraphML tracks every experiment - source data, featurization, training runs,
prediction jobs - in a metadata graph called **ArangoPipe**, stored in an
`arangopipe` database inside your own deployment. It never leaves your
environment and is never visible to ArangoDB, so the full ML lineage stays
auditable without shipping data anywhere.
{{< /tip >}}

## What we have built

Step back and look at what `nordweave` is now, compared to the PostgreSQL
database this tutorial started with:

- a OneShard, Raft-backed graph database holding the structured spine, with the
  org chart as a SatelliteGraph;
- a visual and conversational surface - Graph Visualizer, themes, Canvas
  Actions, and Ada;
- a knowledge graph extracted from reviews, audits, and post-mortems via
  GraphRAG, organized into domains by AutoGraph;
- analytics scores (PageRank, communities, centrality) written back as
  attributes;
- ML predictions (next purchase, fraud, tier) written back as attributes.

Every one of those layers reads and writes the *same graph*. Nothing was
exported to a second system. That single property is what makes the final
chapter possible.

## What's next

Each capability has, so far, been driven by a human asking one question at a
time. The [final chapter](agentic-merchandiser.md) hands the keys to an agent: a
merchandising assistant that takes a goal in plain English, plans a multi-step
path across the structured spine, the knowledge graph, and the ML predictions,
and comes back with a grounded, explainable recommendation.
