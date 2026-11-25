---
title: AQLizer Quick Start
menuTitle: Quick Start
weight: 2
description: >-
  Ask a question in natural language, get an AQL query back, and make it
  faster with the AQLizer
---
{{< tag "Agentic AI Suite" "Beta" >}}

Turn a question into an AQL query, then optimize the query.

## Prerequisites

- An **Arango Contextual Data Platform** deployment with a valid Agentic AI
  Suite license.
- A database with data to query.
- An API key for your language model provider. During setup, you either pick
  a secret saved in the [Secrets Manager](../secrets-manager.md) or click
  **Add new secret** to enter and save the key.

## Translate your first query

{{< tabs "aqlizer-qs-generate" >}}

{{< tab "Web Interface" >}}
{{< steps >}}

{{< step "Open the AQLizer" >}}
Select your database and open the **Query Editor**. In the **Welcome** tab,
click **Ask AQLizer**.
{{< /step >}}

{{< step "Start the AQLizer" >}}
Under **API Key**, select a saved API key, or click **Add new secret** to save
a new one in the [Secrets Manager](../secrets-manager.md). Then click
**Start AQLizer**. Wait until the input field for questions appears.
{{< /step >}}

{{< step "Ask a question" >}}
Type a question about your data, for example
*List all surnames in the database*, and click **Generate**.
{{< /step >}}

{{< step "Open the query" >}}
Review the query and the explanation below it, then click **Open in editor**
and **Run query**.
{{< /step >}}

{{< /steps >}}
{{< /tab >}}

{{< tab "HTTP API" >}}
{{< steps >}}

{{< step "Start the AQLizer" >}}
In the **Query Editor** of your database, click **Ask AQLizer**, select a
saved API key under **API Key** or add a new one, and click **Start AQLizer**.
{{< /step >}}

{{< step "Sign in" >}}
Set the connection details and get a JWT session token:

```bash
ENDPOINT="https://<EXTERNAL_ENDPOINT>:8529"
TOKEN=$(curl -sSk -X POST "$ENDPOINT/_open/auth" \
  -d '{"username": "root", "password": "<your-password>"}' | jq -r .jwt)
```
{{< /step >}}

{{< step "Set the AQLizer path" >}}
In the Query Editor, click **Manage services** and copy the **Service ID** of
the AQLizer for your database, for example `mxsli`:

```bash
AQ="$ENDPOINT/reasoner/mxsli"
```
{{< /step >}}

{{< step "Ask a question" >}}
```bash
curl -sSk -X POST "$AQ/txt2aql" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "What are the top 5 performing stores based on revenue?"}' | jq
```

```json
{
  "aql": "FOR s IN stores SORT s.revenue DESC LIMIT 5 RETURN { name: s.name, revenue: s.revenue }",
  "json": [
    {"name": "North", "revenue": 1250000},
    …
  ],
  "nl": "The top 5 stores by revenue are North (1,250,000), Central (1,180,000), East (970,000), West (940,000), and South (880,000). This answer is based on 5 rows.",
  "error": null,
  "added_template_id": null
}
```

`aql` is the generated query, `json` holds up to 50 result rows, and `nl` is
the answer in natural language.
{{< /step >}}

{{< /steps >}}
{{< /tab >}}

{{< /tabs >}}

## Optimize the query

{{< tabs "aqlizer-qs-optimize" >}}

{{< tab "Web Interface" >}}
{{< steps >}}

{{< step "Optimize the generated query" >}}
Below the generated query, click **Optimize query**. To optimize a query you
wrote yourself, paste it into the input field and click **Optimize**.
{{< /step >}}

{{< step "Review the report" >}}
The **Optimization Summary** lists what changed, why the query is faster, and
the **Final Optimized Query**.
{{< /step >}}

{{< step "Apply the query" >}}
Click **Open in editor** below the final query, then **Run query**.
{{< /step >}}

{{< /steps >}}
{{< /tab >}}

{{< tab "HTTP API" >}}
{{< steps >}}

{{< step "Send the query" >}}
Pass the query with an instruction to optimize it:

```bash
curl -sSk -X POST "$AQ/query" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"request": "Optimize this query: FOR s IN stores SORT s.revenue DESC LIMIT 5 RETURN { name: s.name, revenue: s.revenue }", "stream": false}' \
  | jq -r .result
```
{{< /step >}}

{{< step "Read the report" >}}
`result` is a markdown report with a performance comparison, what changed, why
the query is faster, and the final optimized query:

````markdown
## Optimization Summary

### Performance Comparison
| Metric         | Original | Optimized   |
|----------------|----------|-------------|
| Execution time | 0.412s   | 0.038s      |
…

### Final Optimized Query
```aql
…
```
````
{{< /step >}}

{{< /steps >}}
{{< /tab >}}

{{< /tabs >}}

{{< tip >}}
**You now have** an AQL query generated from a question, and a faster version
of it that returns the same results.
{{< /tip >}}

## Next steps

- [Web Interface](web-interface.md): Chat history, services, and errors.
- [API Reference](api-reference.md): Streaming, templates, and all response
  fields.
