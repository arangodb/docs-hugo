---
title: Natural Language to AQL Quick Start
menuTitle: Quick Start
weight: 2
description: >-
  Ask a question in plain language and get an executable AQL query back, using
  AQLizer
---

## Prerequisites

- An ArangoDB database (note its name).
- An API key for OpenAI or an OpenAI-compatible LLM provider.
- For the API: a bearer token from
  `POST https://<EXTERNAL_ENDPOINT>:8529/_open/auth`.

## Generate your first query

{{< tabs "nl2aql-qs" >}}

{{< tab "Web Interface" >}}
{{< steps >}}

{{< step "Open AQLizer" >}}
In the Contextual Data Platform, select your database and open the **Query
Editor**. Click the **AQLizer** button at the bottom of the query tab.
{{< /step >}}

{{< step "Start the service" >}}
Provide your OpenAI API key, select a model (for example, `gpt-5.4`), and
click **Start Service**.
{{< /step >}}

{{< step "Ask a question" >}}
Type a natural language question - for example, *"Find all users who made
purchases in the last month"* - and click **Ask** (or press Return).
{{< /step >}}

{{< step "Run the generated query" >}}
Click **Open in Editor** to load the generated AQL into a new tab, then click
**Run query** to execute it against your database.
{{< /step >}}

{{< /steps >}}
{{< /tab >}}

{{< tab "HTTP API" >}}
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

{{< step "Translate a question into AQL" >}}
{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/graph-rag/{serviceIdPostfix}/v1/translate_query" >}}

```json
{
  "input_text": "Find all users who are friends with John",
  "options": {
    "output_formats": ["NL", "AQL", "JSON"]
  }
}
```

The response returns the requested formats: a natural language explanation,
the generated AQL, and/or the raw JSON results.
{{< /step >}}

{{< /steps >}}
{{< /tab >}}

{{< /tabs >}}

{{< tip >}}
**You now have** a service that translates plain language into executable AQL
and runs it against your database.
{{< /tip >}}

## Next steps

- [Setup](setup.md): Detailed deployment and configuration.
- [Web Interface](web-interface.md): The full guided experience.
- [API Reference](api-reference.md): All endpoints and options.
