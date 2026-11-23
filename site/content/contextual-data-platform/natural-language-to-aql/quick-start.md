---
title: Natural Language to AQL Quick Start
menuTitle: Quick Start
weight: 2
description: >-
  Ask a question in plain language and get an executable AQL query back through
  the Natural Language to AQL API
---
{{< tag "Agentic AI Suite" "Beta" >}}

{{< warning >}}
Natural Language to AQL was the previous version of the AQLizer and is deprecated
in favor of the new [AQLizer](../aqlizer/_index.md). Use the AQLizer to
generate and optimize AQL queries.
{{< /warning >}}

## Prerequisites

- An **Arango Contextual Data Platform** deployment with a valid Agentic AI
  Suite license.
- An ArangoDB database (note its name).
- An API key for OpenAI or an OpenAI-compatible LLM provider.
- A bearer token from
  `POST https://<EXTERNAL_ENDPOINT>:8529/_open/auth`.

## Generate your first query

The web interface no longer offers Natural Language to AQL, so use the HTTP
API.

{{< steps >}}

{{< step "Deploy the service" >}}
{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/_platform/acp/v1/graphrag" >}}

```json
{
  "env": {
    "db_name": "<your_database_name>",
    "chat_api_provider": "openai",
    "chat_api_key": "<your-openai-api-key>",
    "chat_model": "gpt-5.4"
  }
}
```

Save the `serviceIdPostfix` (the trailing segment of `serviceId`) from the
response.
{{< /step >}}

{{< step "Generate an AQL query" >}}
{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/graph-rag/{serviceIdPostfix}/v1/process_text_stream" >}}

```json
{
  "input_text": "Find all users who made purchases in the last month",
  "mode": "aqlizer",
  "response_instruction": "Return concise, executable AQL."
}
```

With `"mode": "aqlizer"`, the endpoint streams back schema-aware AQL generated
from your question. Copy the generated query into the **Query Editor** to run it
against your database.
{{< /step >}}

{{< /steps >}}

{{< tip >}}
**You now have** a service that translates plain language into executable AQL
and runs it against your database.
{{< /tip >}}

## Next steps

- [Setup](setup.md): Detailed deployment and configuration.
- [API Reference](api-reference.md): All endpoints and options.
