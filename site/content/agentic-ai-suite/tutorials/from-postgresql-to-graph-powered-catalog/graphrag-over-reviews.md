---
title: "GraphRAG: turning reviews and audits into a knowledge graph"
menuTitle: GraphRAG over text
weight: 40
description: >-
  Feed Nordweave's reviews and supplier audits through the GraphRAG Importer to
  build a knowledge graph, then answer cross-document questions with the Retriever
---

So far the whole tutorial has worked with the *structured* spine - vertices,
edges, and the attributes hanging off them. That is the part of Nordweave's
world that already fits neatly into rows and documents. But a clothing
retailer's most valuable context never lived in tables.

It lived in prose:

- **29,897 customer reviews** - "the coral is way more washed-out than in the
  photos", "pilled badly after the first wear", "runs generous, could have
  sized down".
- **200 supplier audits** - factory inspection write-ups, fair-labor findings,
  fabric-defect rates.
- **80 incident post-mortems** - "the SS24 selvedge run shrank two sizes after
  the first wash; root cause traced to supplier `supp_0000`".

This is exactly the data the merchandising and quality teams reach for when a
product starts getting returned, and it is exactly the data a relational
backend turns into a `TEXT` column nobody can query. You can full-text search
it, but you cannot ask it *questions* - and you certainly cannot connect a
complaint in a review to the supplier named three documents away in an audit.

That is what [GraphRAG](../../graphrag/_index.md) is for.

## What GraphRAG does

GraphRAG (graph-based retrieval-augmented generation) turns a pile of documents
into a *knowledge graph* and then answers natural-language questions against
it. Two services do the work:

- The [Importer](../../importer/_index.md) reads your documents (`.txt`, `.md`,
  `.pdf`; Office files and images are converted to PDF first), runs them through
  a language model, and extracts **entities** and the **relationships** between
  them - writing the result back into ArangoDB as a knowledge graph.
- The [Retriever](../../retriever/_index.md) queries that graph. It does not
  just do vector similarity over chunks; it follows the extracted relationships,
  so an answer can be grounded in connections that span several documents.

The difference from classic RAG is the graph. A vector-only system treats every
chunk in isolation: it finds the three chunks most similar to your question and
hands them to the model. GraphRAG *also* knows that the supplier named in an
audit is the same supplier that manufactured the product complained about in a
review, because the Importer captured that as an edge.

## Importing the Nordweave corpus

The corpus lives in the `unstructured/` folder described on the
[section landing page](_index.md#the-dataset). Point the Importer at it through
the [web interface](../../graphrag/web-interface.md) (or its API), pick a
language model, and let it build the graph.

In **Full GraphRAG** mode (the default) the Importer extracts entities,
relationships, and community structure - the full knowledge graph. For
Nordweave's reviews and audits that is the right setting: the value is in the
connections (*this complaint* → *this product* → *this supplier* → *that
audit finding*), not just in retrieving a similar paragraph.

{{< tip >}}
If a document set is simple enough that you only need semantic search over its
chunks - a flat FAQ, say - the Importer's **Vector RAG** mode skips entity
extraction and is faster and cheaper. Nordweave's review and audit corpus is
not that; it is richly interconnected, so it earns Full GraphRAG. The next
chapter on [AutoGraph](autograph-knowledge-domains.md) automates this
per-domain choice for you.
{{< /tip >}}

## Asking cross-document questions

Once the graph is built, the Retriever exposes two search styles through the
[web interface](../../graphrag/web-interface.md) and the
[query API](../../retriever/executing-queries.md):

- **Instant Search** - a fast, single-pass answer for focused questions.
- **Deep Search** - a multi-step traversal for questions that need to gather
  and reconcile context from across the corpus.

Questions Nordweave can finally ask in plain English:

> *"What are the most common complaints about products made from recycled
> wool?"*

Instant Search finds the relevant review chunks, but because the products are
linked to their `made_of` materials in the knowledge graph, the answer is
scoped correctly - it pulls complaints for the *right* products, not every
product that happens to mention wool.

> *"Did any supplier audit flag the same defect that customers later reported in
> reviews?"*

This is a Deep Search question and the one that justifies a graph. The Retriever
walks audit → supplier → manufactured_by → product → reviewed → review, and
surfaces the cases where an inspector's finding and a shopper's complaint point
at the same factory. In PostgreSQL this was three teams, a CSV export, and a
week. Here it is a sentence.

## Where this connects back to the spine

The knowledge graph the Importer builds does not float free of everything you
loaded earlier. The entities it extracts - products, suppliers, materials - are
the same things that already exist as vertices in the `nordweave` spine. That
overlap is what lets a question move fluidly between the *measured* world (an
order was placed, a return was logged, an audit score is 0.72) and the
*described* world (a reviewer hated the drape, an inspector noted a dye-lot
problem).

The structured spine tells you *that* `supp_0000` has a `last_audit_score` of
0.72. The knowledge graph tells you *why*.

## What's next

GraphRAG built one knowledge graph from one curated corpus. But Nordweave has
six different document types - lookbooks, design briefs, trend reports, style
guides, supplier audits, and incident post-mortems - and treating a glossy
lookbook the same way as a forensic post-mortem wastes effort on one and
shortchanges the other. The next chapter,
[AutoGraph](autograph-knowledge-domains.md), discovers those document domains
automatically and gives each one the retrieval strategy it deserves.
