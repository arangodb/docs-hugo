---
title: Reasoner Quick Start
menuTitle: Quick Start
weight: 2
description: >-
  Turn slow AQL queries into fast ones - let AI find the bottleneck and
  rewrite the query, with results verified to match
---

## Prerequisites

- An ArangoDB instance with the **ArangoDB MCP Server** running and connected.
- An OpenAI API key.
- An Agentic AI Suite license (for the web interface).

## Optimize your first query

{{< tabs "reasoner-qs" >}}

{{< tab "Web Interface" >}}
{{< steps >}}

{{< step "Open the Reasoner" >}}
In the Query Editor, click **Open Reasoner** in the Welcome tab - or click
**Optimize** from any query tab.
{{< /step >}}

{{< step "Start the service" >}}
In the Setup Reasoner panel, enter your OpenAI API key, select a model, and
click **Start Service**. Wait for the **MCP Connected** status.
{{< /step >}}

{{< step "Describe what you want" >}}
Type your request, for example:

> Optimize this query: `FOR u IN users FILTER u.status == 'active' SORT u.created_at DESC RETURN u`

Press Enter.
{{< /step >}}

{{< step "Review and apply" >}}
Read the **AI Reasoning Response** with the optimization report, then click
**Open in Editor** to apply the rewritten query.
{{< /step >}}

{{< /steps >}}
{{< /tab >}}

{{< tab "HTTP API" >}}
With the Reasoner service running (port `8080`, MCP connected), send your
request:

{{< steps >}}

{{< step "Send an optimization request" >}}
{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8080/query" >}}

```json
{
  "request": "Optimize this query: FOR u IN users FILTER u.status == 'active' SORT u.created_at DESC RETURN u",
  "stream": true
}
```
{{< /step >}}

{{< step "Consume the response" >}}
With `"stream": true`, consume the Server-Sent Events (`phase`, `tool_call`,
`tool_result`, `text`, `done`) to follow progress. Set `"stream": false` to
receive a single JSON response whose `result` field holds the full markdown
report.
{{< /step >}}

{{< /steps >}}
{{< /tab >}}

{{< /tabs >}}

{{< tip >}}
**You now have** an AI-generated optimization report: performance metrics, a
rewritten query, and validation that it returns identical results.
{{< /tip >}}

## Next steps

- [Web Interface](web-interface.md): The full guided experience.
- [API Reference](api-reference.md): Endpoints, streaming, and event types.
