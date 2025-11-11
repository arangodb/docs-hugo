---
title: Load your data into the Arango Managed Platform (AMP)
menuTitle: Data Loader
weight: 22
description: >-
   Load your data into AMP and transform it into richly-connected graph
   structures, without needing to write any code or deploy any infrastructure
---

The Arango Managed Platform (AMP) provides different ways of loading your data
into the platform, based on your migration use case.

## Transform data into a graph

The AMP Data Loader allows you to transform existing data from CSV file
formats into data that can be analyzed in AMP.

You provide your data in CSV format, a common format used for exports of data
from various systems. Then, using a no-code editor, you can model the schema of
this data and the relationships between them. This allows you to ingest your
existing datasets into your AMP database, without the need for any
development effort.

You can get started in a few easy steps.

1. **Create database**:
   Choose an existing database or create a new one and enter a name for your new graph.

2. **Add files**:
   Drag and drop your data files in CSV format.

3. **Design your graph**:
   Model your graph schema by adding nodes and connecting them via edges.

4. **Import data**:
   Once you are ready, save and start the import. The resulting graph is an
   [EnterpriseGraph](../../arangodb/3.12/graphs/enterprisegraphs/_index.md) with its
   corresponding collections, available in your ArangoDB web interface.

Follow this [working example](../data-loader/example.md) to see how easy it is
to transform existing data into a graph.

## Import data to the cloud

To import data from various files into collections **without creating a graph**,
get the ArangoDB client tools for your operating system from the
[download page](https://arangodb.com/download-major/).

- To import data to AMP from an existing ArangoDB instance, see
  [arangodump](../../arangodb/3.12/components/tools/arangodump/) and
  [arangorestore](../../arangodb/3.12/components/tools/arangorestore/).
- To import pre-existing data in JSON, CSV, or TSV format, see
  [arangoimport](../../arangodb/3.12/components/tools/arangoimport/).

## How to access the Data Loader

1. If you do not have a deployment yet, [create a deployment](../deployments/_index.md#how-to-create-a-new-deployment) first.
2. Open the deployment you want to load data into.
3. In the **Load Data** section, click the **Load your data** button.
4. Select your migration use case.