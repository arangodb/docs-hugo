---
title: Graph Analytics Quick Start
menuTitle: Quick Start
weight: 2
description: >-
  Start a compute engine, load a graph, and run PageRank to find your most
  influential nodes
---

## Prerequisites

- Access to an ArangoDB deployment (Contextual Data Platform or Arango
  Managed Platform).
- An existing **graph** in ArangoDB (node and edge collections).
- An API key or authentication token (for API access).

## Run PageRank

{{< tabs "ga-qs" >}}

{{< tab "Web Interface" >}}
{{< steps >}}

{{< step "Start an engine" >}}
In the **Running Engines** panel, click **Start New Engine**, choose an
engine size, and click **Start Engine**. The engine is the dedicated compute
resource your algorithms run on.
{{< /step >}}

{{< step "Load your graph" >}}
In the **Select Graph** dropdown, click **Load New Graph**, pick your graph
from the database, and click **Load Graph**.
{{< /step >}}

{{< step "Run PageRank" >}}
In **Algorithm Execution**, select your engine and loaded graph, choose
**PageRank**, set parameters such as `damping_factor` and
`maximum_supersteps`, and click **Run Algorithm**.
{{< /step >}}

{{< step "View and store results" >}}
Click **View Jobs History** to monitor execution. When the job completes,
use the download icon to store the results into a collection.
{{< /step >}}

{{< /steps >}}
{{< /tab >}}

{{< tab "HTTP API" >}}
{{< steps >}}

{{< step "Start an ephemeral engine" >}}
{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/_platform/acp/v1/graphanalytics" >}}
Send an empty body, then save the `serviceId` postfix to build the engine
URL (`https://<EXTERNAL_ENDPOINT>:8529/gral/{serviceIdPostfix}/v1/...`).
{{< /step >}}

{{< step "Load your graph" >}}
{{< endpoint "POST" "<ENGINE_URL>/v1/loaddata" >}}

```json
{ "database": "_system", "graph_name": "yourGraphName" }
```

Returns a `job_id` and a `graph_id`.
{{< /step >}}

{{< step "Run PageRank" >}}
{{< endpoint "POST" "<ENGINE_URL>/v1/pagerank" >}}

```json
{ "graph_id": "234", "damping_factor": 0.85, "maximum_supersteps": 500 }
```

Returns a `job_id`.
{{< /step >}}

{{< step "Store the results" >}}
{{< endpoint "POST" "<ENGINE_URL>/v1/storeresults" >}}

```json
{
  "database": "_system",
  "target_collection": "results",
  "job_ids": ["<job_id>"],
  "attribute_names": ["pagerank_score"]
}
```
{{< /step >}}

{{< /steps >}}
{{< /tab >}}

{{< /tabs >}}

{{< tip >}}
**You now have** your nodes ranked by PageRank score, persisted to an
ArangoDB collection - your most influential nodes are at the top.
{{< /tip >}}

## Next steps

- [Web Interface](web-interface.md): Engines, graphs, and jobs in detail.
- [API](api.md): All algorithms, endpoints, and parameters.
