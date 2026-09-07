---
title: What is Arango?
menuTitle: What is Arango?
weight: 5
description: >-
  How the Arango products relate to each other, what each one adds, and which
  one to install for your use case
---
{{< comment >}}
DRAFT - the two-product framing on this page follows the docs restructuring
proposal and still needs Product sign-off before it is published. The
"Editions and capabilities" section deliberately links to the per-product
license pages instead of restating a capability matrix, because Product owns
the authoritative edition mapping.
{{< /comment >}}

Arango is a database and a data platform built on top of it.

[**ArangoDB**](../arangodb/_index.md) is the multi-model database: graph,
document, key-value, full-text search, and vector, all reachable through a
single query language. It is open source and you can run it on your laptop in a
container.

The [**Arango Contextual Data Platform**](../contextual-data-platform/_index.md)
is the licensed, Kubernetes-native system that runs on top of ArangoDB. It adds
the ingestion, graph construction, retrieval, and governance services that
agentic AI applications need.

Choosing the platform does not mean giving up anything in the database. The
query language, the drivers, and the HTTP API are the same.

## Which product do I need?

| | ArangoDB | Contextual Data Platform |
|---|---|---|
| **Use it for** | Storing and querying connected data in your own application | Turning a document corpus into context that agents and co-pilots can use |
| **You write** | AQL queries, driver code | Documents in, natural-language questions out |
| **Runs on** | A container, a VM, or bare metal | Kubernetes |
| **Licensing** | Community Edition is free and open source; Enterprise Edition adds clustering and security features | Licensed; requires ArangoDB Enterprise Edition 3.12.9 or later |
| **Install time** | About 2 minutes | About 10 minutes |
| **Start here** | [Get started with ArangoDB](arangodb.md) | [Get started with the data platform](../contextual-data-platform/get-started.md) |

If you are building an application that stores and traverses connected data,
you want ArangoDB. If you are building something that has to answer questions
over a body of documents, you want the Contextual Data Platform.

## How the products fit together

The platform is layered. Every platform service reads and writes through
ArangoDB - nothing bypasses it. This is why storage, indexing, AQL, and the
HTTP API are documented once, in the ArangoDB manual, and apply unchanged when
you run the platform.

{{< embed-svg "Arango-Contextual-Data-Platform-Overview" >}}

The platform itself comes in two parts:

- The [**Platform Suite**](../platform-suite/_index.md) is always included. It
  provides the Kubernetes orchestration, the unified web interface with the
  [Graph Visualizer](../platform-suite/graph-visualizer.md) and the
  [Query Editor](../platform-suite/query-editor.md), the
  [Control Plane](../platform-suite/control-plane-acp/_index.md), and the
  operational services around them.

- The [**Agentic AI Suite**](../agentic-ai-suite/_index.md) is the optional
  capability layer on top. It adds
  [AutoGraph](../agentic-ai-suite/autograph/_index.md) with AutoRAG,
  [GraphRAG](../agentic-ai-suite/graphrag/_index.md),
  [GraphML](../agentic-ai-suite/graphml/_index.md),
  [Graph Analytics](../agentic-ai-suite/graph-analytics/_index.md),
  the [Reasoner](../agentic-ai-suite/reasoner/_index.md),
  [Ada](../agentic-ai-suite/ada/_index.md), and
  [natural language to AQL](../agentic-ai-suite/natural-language-to-aql/_index.md).

## What each product adds

**ArangoDB** gives you the data model and the query engine. One record can be a
JSON document, a node in a graph, or both. AQL composes across the models in a
single query, so a traversal can filter on document attributes and rank results
with a vector or full-text search without leaving the query. See
[Features](../arangodb/3.12/features/_index.md) for what each edition includes.

**The Contextual Data Platform** gives you everything between a folder of
documents and a grounded answer. AutoGraph discovers knowledge domains in your
data and builds a contextual knowledge graph per domain, GraphRAG extracts
entities and relationships from raw text, and the retrieval services answer
questions against the resulting graph instead of against a flat index. The
platform also supplies the operational layer - deployment, scaling, monitoring,
backup, and access control - through the ArangoDB Kubernetes Operator.

## Where the managed option fits

[**Arango Managed Platform (AMP)**](../amp/_index.md) runs ArangoDB for you as a
service on Google Cloud Platform or Amazon Web Services, with 24/7 monitoring,
automatic upgrades, and managed backups. Use it when you want the database
without operating it yourself.

AMP provides the database. The Contextual Data Platform is deployed and licensed
separately - see
[Install and upgrade](../contextual-data-platform/install-and-upgrade/_index.md).

## Where the drivers live

Drivers, the MCP server, framework integrations, and data science adapters are
documented under [Ecosystem](../ecosystem/_index.md). They work against both
products, because both speak the same HTTP API.

## Editions and licensing

- ArangoDB is available in a free Community Edition and a commercial Enterprise
  Edition. See [Features](../arangodb/3.12/features/_index.md) for the
  per-edition breakdown.
- The Contextual Data Platform is licensed, and the Agentic AI Suite is licensed
  on top of it. Licenses are activated and renewed automatically by the
  ArangoDB Kubernetes Operator - see
  [License Management](../contextual-data-platform/license-management.md).

## Next step

Pick an installation path:

- [Get started with the Arango Contextual Data Platform](../contextual-data-platform/get-started.md)
- [Get started with ArangoDB](arangodb.md)
