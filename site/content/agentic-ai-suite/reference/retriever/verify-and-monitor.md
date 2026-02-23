---
title: Verify and Monitor
menuTitle: Verify and Monitor
description: >-
  Check service health and verify the status of your Retriever service
weight: 50
---

{{< info >}}
**Getting Started Path:** [Overview](./) → [Configure LLMs](llm-configuration.md) → [Search Methods](search-methods.md) → [Execute Queries](executing-queries.md) → **Verify**
{{< /info >}}

## Health Check

You can monitor the Retriever service health using the health endpoint:

{{< endpoint "GET" "https://<EXTERNAL_ENDPOINT>:8529/ai/v1/health" >}}

## Verify Service Status

You can verify the state of the Retriever service via the project endpoint:

{{< endpoint "GET" "https://<EXTERNAL_ENDPOINT>:8529/ai/v1/project_by_name/<your_project>" >}}

For example, the `status` object found within `retrieverServices` may contain the following
properties:

```json
"status": {
    "status": "service_started",
    "progress": 100,
}
```

## Next Steps

- **[Execute queries](executing-queries.md)**: Start querying your knowledge graph.
- **[Explore all parameters](parameters.md)**: Customize your queries.
- **[Learn about search methods](search-methods.md)**: Understand when to use each search type.
