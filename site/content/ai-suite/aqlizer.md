---
title: The AQLizer feature of the Arango AI Data Platform
menuTitle: AQLizer
weight: 17
description: >-
  Generate AQL queries from natural language with the AQLizer feature of the
  AI Suite
---
## Overview

The AQLizer feature makes it very easy to query your data in the AI Data Platform.
It automatically translates your requests written in plain language to ArangoDB's
query language AQL using generative AI. You can start to explore your data and
gain insights without having to learn the query language first.

For example, you can ask questions or use instructions like the following:
- List all distinct surnames in the database and sorted in descending order
- How many persons are there with the surname "Stark"?
- Find the parents of "Arya Stark"

## Interfaces

The AQLizer feature is integrated into the AI Data Platform web interface.
You can access it directly from the **Query Editor**. You can generate, verify,
and refine queries in one place. To learn more about how to set up and generate
queries, see the [Query Editor](../data-platform/query-editor.md#generate-queries-aqlizer)
documentation of the Data Platform.

You can also utilize the AQLizer feature programmatically using an API.
See the [Natural Language to AQL Translation Service](reference/natural-language-to-aql.md)
documentation for details.
