---
title: ArangoDB database system
menuTitle: ArangoDB
weight: 6
description: >-
  ArangoDB is a scalable graph database system to drive value from connected
  data, faster
---
ArangoDB combines the analytical power of native graphs with an integrated
search engine, JSON support, vector indexes, and a variety of data access
patterns via a single, composable query language.

ArangoDB is available in a community and a commercial [edition](3.12/features/_index.md).
You can use it for on-premises deployments, self-managed cloud deployments,
as well as a fully managed cloud service, the [Arango Managed Platform (AMP)](../amp/_index.md).

## What are Graphs?

Graphs are information networks composed of nodes and edges.

![An arrow labeled as "Edge" pointing from one circle to another, both labeled "Node"](../images/data-model-graph-relation-abstract-edge.svg)

A social network is a common example of a graph. People are represented by nodes
and their friendships by relations.

![Two circles labeled "Mary" and "John", with an arrow labeled "isFriendOf" pointing from "Mary" to "John"](../images/data-model-graph-relation-concrete.svg)

Nodes are also called vertices (singular: vertex), and edges are relations that
connect nodes.
A node typically represents a specific entity (a person, a book, a sensor
reading, etc.) and an edge defines how one entity relates to another.

![Four nodes with properties: Person nodes Mary and John, a Book node Arango, and an Author node Sara. Mary isFriendOf John since 2019, Mary bought Arango, John rated Arango with 5 stars, and Sara wrote Arango in 2024](../images/data-model-graph-relations.svg)

This paradigm of storing data feels natural because it closely matches the
cognitive model of humans. It is an expressive data model that allows you to
represent many problem domains and solve them with semantic queries and graph
analytics.

## Beyond Graphs

Not everything is a graph use case. ArangoDB lets you equally work with
structured, semi-structured, and unstructured data in the form of schema-free
JSON objects, without having to connect these objects to form a graph.

![Three collections as folders with documents as pages: Person with Mary, aged 34, and John, aged 31, Book with Arango, 320 pages, and Author with Sara from DE](../images/data-model-document.svg)

Depending on your needs, you may mix graphs and unconnected data.
ArangoDB is designed from the ground up to support multiple data models with a
single, composable query language.

```aql
FOR book IN Book
  FILTER book.title == "Arango"
  FOR person IN 2..2 INBOUND book bought, OUTBOUND isFriendOf
    RETURN person.name
```

ArangoDB also comes with an integrated search engine for information retrieval,
such as full-text search with relevance ranking.

ArangoDB is written in C++ for high performance and built to work at scale, in
the cloud or on-premises.

<!-- deployment options, move from features page, on-prem vs cloud? -->
