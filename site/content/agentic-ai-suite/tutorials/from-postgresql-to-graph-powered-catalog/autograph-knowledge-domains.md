---
title: "AutoGraph: one corpus, many knowledge domains"
menuTitle: AutoGraph
weight: 45
description: >-
  Let AutoGraph discover the natural domains in Nordweave's full document corpus
  and assign each one its own RAG strategy, then retrieve across partitions
---

The [previous chapter](graphrag-over-reviews.md) built a single knowledge graph
from a single corpus and that is the right move when your documents are
homogeneous. Nordweave's are not. Their long-form text spans six very different
kinds of writing:

| Document type | Count | Character |
|---|---|---|
| Lookbooks | 80 | Aspirational, image-led, light on facts |
| Design briefs | 120 | Dense, structured, full of materials and specs |
| Trend reports | 40 | Analytical, forward-looking, market-wide |
| Style guides | 60 | Prescriptive, taxonomy-heavy |
| Supplier audits | 200 | Forensic, factual, entity-rich |
| Incident post-mortems | 80 | Causal, time-stamped, deeply interconnected |

Running all 580 documents through one pipeline with one strategy is a mistake in
both directions. A lookbook does not need expensive entity extraction - there
are barely any entities to extract. An incident post-mortem needs *all* of it -
miss the supplier-to-defect-to-product chain and the document is worthless for
retrieval. One global setting cannot be right for both.

This is the problem [AutoGraph](../../autograph/_index.md) solves.

## What AutoGraph does

AutoGraph is a self-organizing layer on top of GraphRAG. Instead of you sorting
documents into buckets and hand-tuning a pipeline for each, it:

1. **Analyzes document relationships** across the whole corpus.
2. **Discovers natural domain clusters** using graph algorithms - building a
   *Corpus Graph*, the map of your knowledge.
3. **Assigns each domain a RAG strategy** via the RAG Strategizer.
4. **Builds a specialized partition** per domain.
5. **Routes queries** to the partitions that actually hold the answer.

You do not tell it "these are the audits and these are the lookbooks." It finds
those groupings itself, from how the documents cluster.

## The RAG Strategizer in action

The [RAG Strategizer](../../autograph/_index.md) is the part that decides how
hard to work on each domain. It inspects each cluster in the Corpus Graph and
picks:

- **FullGraphRAG** for complex, entity-rich domains - it extracts entities and
  relationships *and* generates a domain-specific ontology, so the knowledge
  graph reflects the concepts that matter in that content.
- **VectorRAG** for simpler domains - it skips entity extraction and just builds
  chunk embeddings for semantic search.

For Nordweave, you would expect the Strategizer to land on something like:

- **Supplier audits** and **incident post-mortems** → FullGraphRAG, with an
  ontology rich in *supplier*, *factory*, *defect*, *material*, *product*,
  *root cause*. These are the documents where relationships carry the meaning.
- **Design briefs** → FullGraphRAG, ontology around *material*, *collection*,
  *silhouette*, *style tag*.
- **Lookbooks** and **trend reports** → VectorRAG. You mostly want "find me the
  passage about oversized tailoring for FW25", not a graph of extracted
  entities.

The point is that you did not make those calls; AutoGraph made them from the
shape of the data, and you can override them if you disagree.

{{< info >}}
This is the same trade-off you met in the GraphRAG chapter - Full GraphRAG
versus Vector RAG - but applied *per domain* instead of once for the whole
import. On a 580-document corpus that is a modest saving. On the millions of
documents a mature enterprise accumulates, matching processing intensity to
content complexity is the difference between a feasible bill and an absurd one.
{{< /info >}}

## Retrieving across partitions

Because AutoGraph builds *partitioned* knowledge graphs, the
[Retriever](../../retriever/_index.md) queries them a little differently than in
the standalone GraphRAG case. It uses a **two-stage retrieval pattern**:

1. **Identify the relevant partitions** for the question (which domains could
   possibly hold the answer).
2. **Deep-search within them**, using `partition_ids` to target only those
   domains.

A question like *"which suppliers had a fabric-defect incident that traces back
to a material flagged in a design brief?"* spans two domains - post-mortems and
briefs. AutoGraph routes to both, retrieves within each, and the model
reconciles the result. A question like *"what's the mood of the SS24 lookbook?"*
touches only the lookbook partition, and the Retriever never wastes a call on
the audit graph.

## Why this matters for Nordweave

Nordweave started this tutorial because the *shape* of their problem had shifted
from rows to relationships. AutoGraph extends that shift to their unstructured
data: the document corpus stops being a search index and becomes a connected,
queryable, domain-aware knowledge base - one that an AI agent can reason across
without anyone first deciding which folder holds the answer.

That "an AI agent can reason across it" is not a throwaway line. It is where the
whole tutorial has been heading.

## What's next

The structured spine and the unstructured corpus are now both *graphs*. The next
two chapters stop *retrieving* from the graph and start *learning* from its
structure - first with classic [Graph Analytics](graph-analytics.md) algorithms
like PageRank and community detection, then with
[GraphML](graphml-predictions.md) to predict what a customer buys next and which
returns are fraud.
