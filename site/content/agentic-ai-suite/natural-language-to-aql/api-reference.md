---
title: Natural Language to AQL API Reference
menuTitle: API Reference
weight: 20
description: >-
  REST API reference for the Natural Language to AQL service, including
  endpoints for text processing, AQL generation, and query execution
---

This page documents the runtime REST endpoints of the Natural Language to AQL
service. For deployment and configuration, see [Setup](setup.md).

## Authentication

All endpoints require a valid platform-issued JWT sent as a Bearer token:

```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

Use your platform external endpoint and service ID in all request URLs:

```
https://<ExternalEndpoint>/graph-rag/<serviceID>/v1/<endpoint>
```

## Endpoints

### Process Text

Ask general questions to the LLM and receive natural language responses.
This endpoint does not query your database.

```
POST /v1/process_text
```

**Request body:**

| Field | Type | Required | Description |
|---|---|---|---|
| `input_text` | string | Yes | The question or text to process |

**Example:**

```bash
curl --request POST \
  --url https://<ExternalEndpoint>/graph-rag/<serviceID>/v1/process_text \
  --header 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  --header 'Content-Type: application/json' \
  --data '{
    "input_text": "What are the advantages of graph databases?"
  }'
```

**Response:**

```json
{
  "responseText": "Graph databases offer several key advantages: 1) Efficient relationship handling - they store relationships as first-class citizens, making traversals much faster than traditional SQL JOINs. 2) Flexible data modeling - schema-less design accommodates evolving datasets naturally. 3) High performance for connected data - query performance remains consistent even with large datasets. 4) Intuitive visualization - relationships can be easily visualized and understood. 5) Real-time capabilities - excellent for recommendation systems, fraud detection, and network analysis."
}
```

### Process Text Stream

Stream responses in real-time as they are generated, rather than waiting for the
complete response.

```
POST /v1/process_text_stream
```

**Request body:**

| Field | Type | Required | Description |
|---|---|---|---|
| `input_text` | string | Yes | The question or instruction |
| `mode` | string | No | Set to `aqlizer` for AQL-oriented output. Omit for general text processing. |
| `response_instruction` | string | No | Guidance for response style or content |

Stream responses include chunk metadata: `event`, `completion_reason`, and an
optional `error` field.

#### Default mode

When `mode` is omitted, the endpoint returns general LLM responses without
querying your database.

```bash
curl --request POST \
  --url https://<ExternalEndpoint>/graph-rag/<serviceID>/v1/process_text_stream \
  --header 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  --header 'Content-Type: application/json' \
  --data '{
    "input_text": "What are the advantages of graph databases?"
  }'
```

**Response:**
```
Graph databases offer several key advantages: 1) Efficient relationship handling...
```

#### AQLizer mode

Set `"mode": "aqlizer"` to generate schema-aware AQL from natural language.
Use `response_instruction` to guide the output style.

```bash
curl --request POST \
  --url https://<ExternalEndpoint>/graph-rag/<serviceID>/v1/process_text_stream \
  --header 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  --header 'Content-Type: application/json' \
  --data '{
    "input_text": "Find all users who made purchases in the last month",
    "mode": "aqlizer",
    "response_instruction": "Return concise, executable AQL."
  }'
```

**Response:**
```aql
FOR user IN users
  FILTER user.purchases[*].date ANY >= DATE_SUBTRACT(DATE_NOW(), 1, 'month')
  RETURN user
```

The generated AQL is based on your actual database schema, making it immediately
usable.

**Example prompts:**
- "List all distinct surnames in the database sorted in descending order"
- "How many persons are there with the surname 'Stark'?"
- "Find the parents of 'Arya Stark'"

### Translate Query

Convert a natural language question into an AQL query and execute it against your
database. Returns results in one or more formats.

```
POST /v1/translate_query
```

**Request body:**

| Field | Type | Required | Description |
|---|---|---|---|
| `input_text` | string | Yes | The natural language question |
| `options.output_formats` | array | No | One or more of `"NL"`, `"AQL"`, `"JSON"`. Defaults to `["NL"]`. |
| `options.request_timeout` | integer | No | Timeout in seconds for the database connection (default: 300, max: 300) |

**Example:**

```bash
curl --request POST \
  --url https://<ExternalEndpoint>/graph-rag/<serviceID>/v1/translate_query \
  --header 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  --header 'Content-Type: application/json' \
  --data '{
    "input_text": "Find all users who are friends with John",
    "options": {
      "output_formats": ["NL", "AQL", "JSON"]
    }
  }'
```

#### Output formats

| Format | Identifier | Returns | Best used for |
|---|---|---|---|
| Natural Language | `"NL"` | Human-readable explanation of the results | User interfaces, human consumption, LLM agent frameworks |
| AQL Query | `"AQL"` | The generated AQL query | Debugging, learning AQL, modifying queries for reuse |
| JSON Results | `"JSON"` | Raw query results | Programmatic processing, data integration |

- If no formats are specified, the service defaults to `NL` only.
- Multiple formats can be requested simultaneously.
- Request only the formats you need to minimize response size.

**Example response (all three formats):**

```json
{
  "original_query": "Find all users who are friends with John",
  "nl_response": "I found 3 users who are friends with John: Alice, Bob, and Carol",
  "aql_query": "FOR u IN users FILTER u.friends ANY == 'John' RETURN u",
  "aql_result": "[{\"name\":\"Alice\",\"age\":30},{\"name\":\"Bob\",\"age\":25},{\"name\":\"Carol\",\"age\":35}]"
}
```

#### Request timeout

Control how long the service waits for database operations before aborting.
Set `request_timeout` (in seconds) in the `options` object.

| Scenario | Result |
|---|---|
| `request_timeout` omitted or `null` | Defaults to **300 seconds** (5 minutes) |
| Positive value up to 300 | Used as-is for the database connection timeout |
| Zero or negative value | Rejected with an `INVALID_ARGUMENT` error |
| Value exceeding 300 | Rejected with an `INVALID_ARGUMENT` error |

**Example:**

```bash
curl --request POST \
  --url https://<ExternalEndpoint>/graph-rag/<serviceID>/v1/translate_query \
  --header 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  --header 'Content-Type: application/json' \
  --data '{
    "input_text": "Run a complex graph traversal",
    "options": {
      "output_formats": ["NL", "AQL"],
      "request_timeout": 60
    }
  }'
```

### Health Check

Check whether the service is running and healthy.

```
GET /v1/health
```

**Example:**

```bash
curl --request GET \
  --url https://<ExternalEndpoint>/graph-rag/<serviceID>/v1/health \
  --header 'Authorization: Bearer YOUR_ACCESS_TOKEN'
```

**Response:**

```json
{
  "status": "SERVING"
}
```

## Error handling

The service returns appropriate HTTP status codes with descriptive messages for
common errors:

- Authentication errors (invalid or missing token)
- Database connection failures
- Invalid query format or unsupported parameters
- LLM provider errors

## Troubleshooting

**Connection issues:**
- Verify that the ArangoDB endpoint is accessible.
- Check network and firewall settings.
- Ensure authentication credentials are correct.

**Query translation issues:**
- Make your query more specific.
- Check LLM provider configuration.
- Verify that your database schema matches the query context.
- The quality of generated AQL depends on the model. Use a frontier or
  fine-tuned AQL-capable model for best results.
