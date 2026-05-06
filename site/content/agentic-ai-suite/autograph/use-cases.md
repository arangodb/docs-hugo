---
title: Use Cases
menuTitle: Use Cases
weight: 10
description: >-
  Practical applications for AutoGraph: turning a corpus of uploaded
  documents into a domain-partitioned knowledge graph that AI agents
  and copilots can query through the Retriever service.
---

AutoGraph turns a body of documents you upload into a partitioned knowledge
graph with retrieval strategies chosen per domain. The use cases below assume
the standard workflow: documents are uploaded in a supported format
(see [Supported file formats](quickstart.md#supported-file-formats)),
AutoGraph discovers domains and builds the corpus, and the
[Retriever service](../retriever/) answers questions against the
resulting knowledge graph.

{{< info >}}
AutoGraph does not include connectors to third-party systems such as
SharePoint, Google Drive, Confluence, ticketing systems, or telemetry
pipelines. To use content from those systems, export the documents in a
[supported format](quickstart.md#supported-file-formats) and upload them
through the web interface or the API.
{{< /info >}}

## Customer support AI agents

**Scenario**: A support team wants an assistant that surfaces the right
runbook, known-issue note, or resolution policy without forcing the agent
to search across many documents by hand.

**How AutoGraph fits**: Export your support documentation; runbooks,
product docs, known-issue write-ups, escalation policies, into a
[supported format](quickstart.md#supported-file-formats) and ingest it
through AutoGraph. AutoGraph turns the corpus into a knowledge graph
automatically, populating ArangoDB collections without any pre-modeling
on your side.
[Modules](design-guide.md#designing-modules) keep product lines or
tiers separated, and [Deep Search](../retriever/search-methods/deep-search.md)
can plan multi-step retrieval across the resulting graph.

**What you bring**: The documentation files. AutoGraph has no connectors
to ticketing systems, CRMs, or log pipelines and does not ingest live
event streams. If the assistant needs to reason over data that is not in
document form, such as current ticket state or product telemetry, that
data has to reach ArangoDB through your own pipelines.

**What you get**:
- A documentation-grounded assistant with citations to the originating runbook or policy
- Per-product-line or per-tier partitions instead of a flat index
- Multi-step Deep Search for issues that span several documents

## Enterprise knowledge assistants

**Scenario**: An organization wants an assistant that reflects what the
business actually knows across teams, surfaces, and content types,
rather than returning the nearest chunk from a single document store.

**How AutoGraph fits**: AutoGraph ingests your documents and
automatically builds a domain-partitioned knowledge graph,
with per-domain ontologies and citations; you do not pre-model the
graph. When the same assistant also needs to answer from data that is
not in document form, pair AutoGraph with
[AQLizer](../natural-language-to-aql/_index.md), which translates
natural-language questions into AQL over collections you already keep
in ArangoDB.

**What you bring**: Documents in a
[supported format](quickstart.md#supported-file-formats) for AutoGraph.

**What you get**:
- A domain-partitioned knowledge graph rather than a flat vector index
- A path to combine document retrieval with AQL queries over structured data
- Citations and graph context that make answers explainable

## Product and developer documentation

**Scenario**: A product team maintains design docs, architecture notes, API
references, and release notes. New engineers and field teams need a faster
way to find the right document and understand how concepts relate.

**How AutoGraph fits**: Use [modules](design-guide.md#designing-modules)
to keep different surfaces isolated (for example, `"docs"`, `"api"`,
`"internal"`). Within each module, clustering separates topics so the
Retriever can route queries to the relevant partition.

**What you get**:
- Separation between public documentation and internal notes
- Per-domain ontologies that capture product-specific entity types
- A graph view of how documents relate, via the
  [Graph Visualizer](../../platform-suite/graph-visualizer.md)

## Research and development

**Scenario**: A research team works through a corpus of papers, reports,
and white papers and wants to explore how concepts and findings relate
across the corpus.

**How AutoGraph fits**: With the FullGraphRAG strategy, AutoGraph extracts
entities and communities and builds explicit relationships between them.
Deep Search exposes those communities and lets the model reason
over the corpus rather than retrieve a single passage.

**What you get**:
- Entity and community-level views over the literature
- Multi-step Deep Search for questions that span several documents
- A queryable graph of concepts, not just a vector index

## Legal and contract review

**Scenario**: A team reviews contracts, agreements, and case material in
PDF or Office formats and wants to surface clauses, parties, and
precedents across the corpus.

**How AutoGraph fits**: Generates a domain-specific
ontology (for example, `CONTRACT`, `PARTY`, `JURISDICTION`,
`OBLIGATION`) and then extracts only entities matching that
ontology, producing a graph aligned with the way legal teams reason
about documents.

**What you get**:
- Ontology tuned to the legal domain rather than a generic one
- Cross-document relationships (parties, clauses, precedents)
- Citations back to the originating clause

## Network, asset, and infrastructure operations

**Scenario**: An operations team wants an assistant that explains a
degraded service or a change-related incident by tying the symptom back
to the runbooks, design docs, and post-incident reports the team has
written over time.

**How AutoGraph fits**: AutoGraph ingests the documentation layer of
operations; runbooks, post-incident reports, design docs, network
diagrams in PDF, change-management notes, and automatically builds a
knowledge graph from the corpus, with citations back into the source
documents. Modules can separate environments, regions, or product lines
so retrieval stays scoped.

**What you bring**: Operational documentation in a
[supported format](quickstart.md#supported-file-formats).

**What you get**:
- A citation-backed assistant over runbooks and post-incident knowledge
- Per-environment or per-region partitioning via modules