---
title: Arango Documentation
menuTitle: Home
weight: 1
description: >-
  Arango provides the trusted data foundation for the next wave of AI grounded
  in business context
#aliases:
#  - data-science/overview
---
## User manuals by product

{{< cards >}}

{{% card title="ArangoDB" link="arangodb/" icon="avo-core.svg" %}}
Native multi-model database system that unifies graph, document,
key-value, vector, and full-text search with one query language.
{{% /card %}}

{{% card title="Arango Data Platform" link="data-platform/" icon="avo-middle.svg" %}}
Adds platform services for scalability, reliability, governance, and a graph exploration tool.
{{% /card %}}

{{% card title="AI Suite" link="ai-suite/" icon="avo-full.svg" %}}
Supercharge your Data Platform with GraphRAG, GraphML,
and queries generated from natural language for AI-powered insights.
{{% /card %}}

{{% card title="Arango Managed Platform (AMP)" link="amp/" %}}
Arango's fully-managed cloud offering for a faster time to value,
formerly known as ArangoGraph Insights Platform.
{{% /card %}}

{{< /cards >}}

## From graph to AI

### Data Persistence

ArangoDB is a scalable database system that you can use to store
[JSON documents](arangodb/3.12/concepts/data-structure/documents/_index.md),
which allows a flexible data structure for each record. ArangoDB natively supports
[graphs](arangodb/3.12/graphs/_index.md), letting you connect documents with
edges to express relationships between records and build complex
information networks. 

### Data Retrieval

You can query your data in various ways using the core database system.
The native support for multiple data models lets you access information in
different ways with a single query language called [AQL](arangodb/3.12/aql/_index.md).
It has built-in support for aggregation, vector and full-text search, geo-spatial
queries, and more.

### Data Exploration

You can visually explore and interact with your ArangoDB graphs through an
intuitive web interface called the [Graph Visualizer](data-platform/graph-visualizer.md).
It is part of the [Arango Data Platform](data-platform/_index.md) that builds on
ArangoDB, extending it to a Kubernetes-native environment that unifies
data management, monitoring, and automation.

### Graph Queries

Utilizing connected data starts with running simple [graph queries](arangodb/3.12/aql/graph-queries/_index.md).
Using ArangoDB and its query language, you can determine the shortest paths between nodes as well as execute graph traversals. A traversal starts at a
given node of a graph and follows the directly connected edges. The edges indicate
what the next connected nodes are, and this discovery of neighbors can repeat.
 
Graph queries can answer questions like **Who can introduce me to person X?**

### Graph Analytics

The next level of utilizing connected data in terms of complexity is to use
graph analytics or graph algorithms to aggregate information about a graph.
Unlike with graph queries, this involves the entire graph at once.

Graph analytics can answer questions like **Who are the most connected persons?**

Arango offers a [Graph Analytics](ai-suite/graph-analytics.md) solution as part
of the [Arango AI Data Platform](data-platform/features.md) to run algorithms
such as connected components, label propagation, and PageRank on your data.

### GraphML

For higher-level insights, you can use advanced graph-based data science.
Applying machine learning on graphs lets you predict connections, get better
product recommendations, and also classify nodes, edges, and graphs.

GraphML can answer questions like:
- **Is there a connection between person X and person Y?**
- **Will a customer churn?**
- **Is this particular transaction anomalous?**

Arango's enterprise-ready, graph-powered machine learning capabilities are
included in the [AI Suite](ai-suite/_index.md) as part of the
Arango AI Data Platform. See [Arango GraphML](ai-suite/graphml/_index.md).

### GraphRAG

Generative AI often struggle with hallucinations because the connectedness of
data is not properly or cleanly represented. GraphRAG is a technique that
turbocharges GenAI applications using the power of graph relationships and
vector embeddings.

Arango's [GraphRAG](ai-suite/graphrag/_index.md) included in the
[AI Suite](ai-suite/_index.md) is a turn-key solution to transform your
organization's data into a knowledge graph and let everyone utilize the
knowledge by asking questions in natural language.

It automatically creates a knowledge graph from raw text by identifying and
extracting entities and relationships within the data, groups and summarizes
semantically similar entities, and stores everything in ArangoDB. When you ask a
question, the large language model (LLM) is supplied with additional context
from the knowledge graph, using lexical and semantic search. This enables
accurate, context-aware intelligence grounded in enterprise data.
