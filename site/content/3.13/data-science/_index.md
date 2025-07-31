---
title: Generative Artificial Intelligence (GenAI) and Data Science
menuTitle: GenAI & Data Science
weight: 115
description: >-
  ArangoDB's set of tools and technologies enables analytics, machine learning,
  and GenAI applications powered by graph data
aliases:
  - data-science/overview
---
{{< tag "ArangoDB Platform" >}} 

{{< tip >}}
The ArangoDB Platform & GenAI Suite is available as a pre-release. To get
exclusive early access, [get in touch](https://arangodb.com/contact/) with
the ArangoDB team.
{{< /tip >}}

ArangoDB provides a wide range of functionality that can be utilized for
data science applications. The core database system includes multi-model storage
of information with scalable graph and information retrieval capabilities that
you can directly use for your research and product development.

ArangoDB also offers a dedicated GenAI Suite, using the database core
as the foundation for higher-level features. Whether you want to turbocharge
generative AI applications with a GraphRAG solution or apply analytics and
machine learning to graph data at scale, ArangoDB covers these needs.

<!--
ArangoDB's Graph Analytics and GraphML capabilities provide various solutions
in data science and data analytics. Multiple data science personas within the
engineering space can make use of ArangoDB's set of tools and technologies that
enable analytics and machine learning on graph data. 
-->

## GenAI Suite

The GenAI Suite is comprised of two major components:

- [**GraphRAG**](#graphrag): A complete solution for extracting entities
  from text files to create a knowledge graph that you can then query with a
  natural language interface.
- [**GraphML**](#graphml): Apply machine learning to graphs for link prediction,
  classification, and similar tasks.

Each component has an intuitive graphical user interface integrated into the
ArangoDB Platform web interface, guiding you through the process.

Alongside these components, you also get the following additional features:

- [**Graph Visualizer**](../graphs/graph-visualizer.md): A web-based tool for exploring your graph data with an
  intuitive interface and sophisticated querying capabilities.
- [**Jupyter notebooks**](notebook-servers.md): Run a Jupyter kernel in the platform for hosting
  interactive notebooks for experimentation and development of applications
  that use ArangoDB as their backend.
- [**MLflow integration**](./graphrag/services/mlflow.md): Built-in support for the popular management tool for
  the machine learning lifecycle.
- [**Integrations**](./integrations/_index.md): Use ArangoDB together with cuGraph, NetworkX,
  and other data science tools. 
- **Application Programming Interfaces**: Use the underlying APIs of the
  GenAI Suite services and build your own integrations. See the
  [API reference](https://arangoml.github.io/platform-dss-api/GenAI-Service/proto/index.html) documentation
  for more details.

## Other tools and features

The ArangoDB Platform includes the following features independent of the
GenAI Suite:

- [**Graph Analytics**](../graphs/graph-analytics.md): Run graph algorithms such as PageRank
  on dedicated compute resources.

## From graph to AI

This section classifies the complexity of the queries you can answer with
ArangoDB and gives you an overview of the respective feature.

It starts with running a simple query that shows what is the path that goes from
one node to another, continues with more complex tasks like graph classification,
link prediction, and node classification, and ends with generative AI solutions
powered by graph relationships and vector embeddings.

### Graph Queries

When you run an AQL query on a graph, a traversal query can go from a vertex to
multiple edges, and then the edges indicate what the next connected vertices are.
Graph queries can also determine the shortest paths between vertices.

Graph queries can answer questions like _**Who can introduce me to person X**_?

![Graph Query](../../images/graph-query.png)

See [Graphs in AQL](../aql/graphs/_index.md) for the supported graph queries.

### Graph Analytics

Graph analytics or graph algorithms is what you run on a graph if you want to 
know aggregate information about your graph, while analyzing the entire graph.

Graph analytics can answer questions like _**Who are the most connected persons**_?

![Graph Analytics](../../images/graph-analytics.png)

ArangoDB offers _Graph Analytics Engines_ to run algorithms such as
connected components, label propagation, and PageRank on your data. This feature
is available for the ArangoGraph Insights Platform. See 
[Graph Analytics](../graphs/graph-analytics.md) for details.

### GraphML

When applying machine learning on a graph, you can predict connections, get 
better product recommendations, and also classify vertices, edges, and graphs.

GraphML can answer questions like:
- _**Is there a connection between person X and person Y?**_
- _**Will a customer churn?**_ 
- _**Is this particular transaction Anomalous?**_

![Graph ML](../../images/graph-ml.png)

For ArangoDB's enterprise-ready, graph-powered machine learning offering,
see [ArangoGraphML](graphml/_index.md).

### GraphRAG

GraphRAG is ArangoDB's turn-key solution to transform your organization's data into
a knowledge graph and let everyone utilize the knowledge by asking questions in
natural language.

The overall process of GraphRAG involves:
- **Creating a Knowledge Graph** from raw text data.
- **Identifying and extract entities and relationships** within the data.
- **Storing the structured information** in ArangoDB.
- **Clustering each closely connected set of entities into semantic contexts** via topology-based algorithms and summarization.
- **Using such semantically augmented structured representation** as the foundation for efficient and accurate information retrieval via lexical and semantic search.
- **Integrating retrieval methods with LLMs (privately or publicly hosted)** to augment responses using both structured and unstructured data, providing accurate responses with the desired format and degree of detail for each query.

To learn more, see the [GraphRAG](graphrag/_index.md) documentation.

## Knowledge Graphs

A knowledge graph can be thought of as a dynamic and interconnected network of
real-world entities and the intricate relationships that exist between them.

Key aspects of knowledge graphs:
- **Domain-specific knowledge**: You can tailor knowledge graphs to specific
  domains and industries.
- **Structured information**: Makes it easy to query, analyze, and extract
  meaningful insights from your data.
- **Accessibility**: You can build a Semantic Web knowledge graph or using
  custom data.

LLMs can help distill knowledge graphs from natural language by performing
the following tasks:
- Entity discovery
- Relation extraction
- Coreference resolution
- End-to-end knowledge graph construction
- (Text) Embeddings

## Sample datasets

If you want to try out ArangoDB's data science features, you may use the
[`arango-datasets` Python package](../components/tools/arango-datasets.md)
to load sample datasets into a deployment.
