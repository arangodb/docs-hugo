---
title: Graph Analytics
menuTitle: Graph Analytics
weight: 33
description: >-
  Graph analytics analyzes information networks to extract insights from data
  relationships using algorithms like PageRank for fraud detection,
  recommendations, and network analysis
---
Graph analytics is a branch of data science that deals with analyzing information
networks known as graphs, and extracting information from the data relationships.
It ranges from basic measures that characterize graphs, over PageRank, to complex
algorithms. Common use cases include fraud detection, recommender systems,
and network flow analysis.

ArangoDB offers a feature for running algorithms on your graph data,
called Graph Analytics Engines (GAEs). It is available on request for the
[Arango Managed Platform (AMP)](https://dashboard.arangodb.cloud/home?utm_source=docs&utm_medium=cluster_pages&utm_campaign=docs_traffic)
and included in the [Arango Data Platform](../../data-platform/_index.md).

Key features:

- **Separation of storage and compute**: GAEs are a solution that lets you run
  graph analytics independent of your ArangoDB Core, including on dedicated machines
  optimized for compute tasks. This separation of OLAP and OLTP workloads avoids
  affecting the performance of the transaction-oriented database systems.

- **Fast data loading**: You can easily and efficiently import graph data from
  ArangoDB and export results back to ArangoDB.

- **In-memory processing**: All imported data is held and processed in the
  main memory of the compute machines for very fast execution of graph algorithms
  such as connected components, label propagation, and PageRank.

## Get started

You can interact with Graph Analytics Engines through:

- **[Web Interface](web-interface.md)**: Use the graphical user interface for
  interactive graph analytics workflows.

- **[HTTP API](api.md)**: Programmatically load data, run algorithms,
  and manage engines through HTTP APIs.

## Available Algorithms

- **[PageRank](api.md#pagerank)**: Measures node importance based on incoming connections and their quality.
- **[Weakly Connected Components (WCC)](api.md#weakly-connected-components-wcc)**: Find groups of nodes connected by any path (ignoring direction).
- **[Strongly Connected Components (SCC)](api.md#strongly-connected-components-scc)**: Identifies groups where every node can reach every other node via directed paths.
- **[Betweenness Centrality](api.md#betweenness-centrality)**: Measures how often nodes appear on shortest paths between other nodes.
- **[LineRank](api.md#linerank)**: PageRank applied to edges, measuring the importance of connections.
- **[Label Propagation](api.md#label-propagation)**: Fast community detection algorithm that propagates labels through the network.
- **[Attribute Propagation](api.md#attribute-propagation)**: Propagate and accumulate labels through the graph structure.

See the [HTTP API documentation](api.md#run-algorithms) for detailed parameters and usage examples.
You can also run algorithms using the [web interface](web-interface.md#run-algorithms).