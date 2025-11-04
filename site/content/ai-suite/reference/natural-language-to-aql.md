---
title: Natural Language to AQL Translation Service
menuTitle: Natural Language to AQL
description: >-
  Query your ArangoDB database using natural language or get LLM-powered answers
  to general questions
weight: 20
---
## Overview

The Natural Language to AQL Translation Service provides two distinct capabilities:

**1. [Process Text](#process-text)**: Ask general questions and get natural language responses without querying your database. Supports both standard and [streaming](#process-text-stream) responses.
Ideal for:
- General knowledge questions  
- Text analysis and processing
- Real-time response generation with streaming

**2. [Translate Query](#translate-query)**: Convert natural language questions into AQL queries and execute them against your ArangoDB database.
Ideal for:
- Querying your database using natural language
- Converting business questions into database operations
- Exploring data through intuitive interfaces
- Learning AQL by seeing translations

The Natural Language to AQL Translation Service also includes the following features:
- Support for multiple LLM providers (via OpenAI API or a self-hosted OpenAI-compatible models)
- RESTful interfaces
- Health monitoring endpoints
- Flexible output formats (Natural Language, AQL, JSON) for database queries

## Installation and configuration

Deploy the Natural Language to AQL service with a single API call. You provide configuration parameters in the request, and the platform automatically configures them as environment variables for the service runtime.

### Prerequisites

Before deploying, have ready:
- An ArangoDB instance with database name and username credentials
- An API key from your chosen LLM provider (OpenAI, OpenRouter, or other OpenAI-compatible service)
- A Bearer token for API authentication

### Obtaining a Bearer Token

Before you can deploy the service, you need to obtain a Bearer token for authentication. Generate this token using the ArangoDB authentication API:

```bash
curl -X POST https://<ExternalEndpoint>:8529/_open/auth \
  -d '{"username": "your-username", "password": "your-password"}'
```

This returns a JWT token that you can use as your Bearer token in all subsequent API calls. For more details, see the [ArangoDB Authentication](../../arangodb/3.12/develop/http-api/authentication.md/#jwt-user-tokens) documentation.

### Start the service

{{< info >}}
Replace `<ExternalEndpoint>` in all examples below with your Arango Data Platform deployment URL.
{{< /info >}}

Create the service instance with your configuration:

```bash
curl --request POST \
  --url https://<ExternalEndpoint>:8529/ai/v1/graphrag \
  --header 'Authorization: Bearer <your-bearer-token>' \
  --header 'Content-Type: application/json' \
  --data '{
    "env": {
      "db_name": "<your_database_name>",
      "chat_api_provider": "<openai>",
      "chat_api_key": "<your-openai-api-key>",
      "chat_model": "<gpt-4o>",
    }
  }'
```

**Expected Response:**
```json
{
  "serviceInfo": {
    "serviceId": "arangodb-graph-rag-xxxxx",
    "description": "Install complete",
    "status": "DEPLOYED",
    "namespace": "<arangodb>",
    "values": "<eyJhcGlfcHJvdmlkZXIi>..."
  }
}
```

{{< info >}}
Save the `serviceId` from the above response as you will need it for all subsequent API calls.
{{< /info >}}

### Configuration Parameters

All parameters are provided in the `env` object of your deployment request.

You can use OpenAI directly, or OpenAI-compatible services like OpenRouter or self-hosted models.

**Required:**
- `db_name`: Database name
- `chat_api_provider`: Set to `openai` (supports OpenAI and OpenAI-compatible services)
- `chat_api_key`: Your LLM provider API key

**Optional:**
- `chat_model`: Model name (default: `gpt-4o-mini`)
- `chat_api_url`: Base URL for OpenAI-compatible endpoints (only needed for OpenRouter, self-hosted models, etc.)
- `openai_max_retries`: Maximum retry attempts for failed requests

#### Using OpenAI

The [deployment example](#start-the-service) above uses OpenAI directly. Simply provide your OpenAI API key as `chat_api_key`.

#### Using OpenRouter

OpenRouter provides access to multiple LLM providers through an OpenAI-compatible API. To use it:
- Set `chat_api_provider` to `openai` (same as above)
- Set `chat_api_url` to `https://openrouter.ai/api/v1`
- Use your OpenRouter API key as `chat_api_key`
- Choose any model from [OpenRouter's catalog](https://openrouter.ai/models)

#### Using Self-Hosted Models

For self-hosted OpenAI-compatible models:
- Set `chat_api_provider` to `openai`
- Set `chat_api_url` to your model's endpoint
- Configure `chat_api_key` according to your setup

### Verify service status

Check that the service is properly deployed:

```bash
curl --request GET \
  --url https://<ExternalEndpoint>:8529/ai/v1/service/arangodb-graph-rag-<serviceID> \
  --header 'Authorization: Bearer <your-bearer-token>'
```

**Expected Response:**
```json
{
  "serviceInfo": {
    "serviceId": "arangodb-graph-rag-<serviceID>",
    "description": "Install complete",
    "status": "DEPLOYED",
    "namespace": "<arangodb>",
    "values": "<eyJhcGlfcHJvdmlkZXIi>..."
  }
}
```

### Health check

Verify that the service is running and healthy:

```bash
curl --request GET \
  --url <ExternalEndpoint>:8529/graph-rag/<serviceID>/v1/health \
  --header 'Authorization: Bearer <your-bearer-token>'
```

**Expected Response:**
```json
{
  "status": "SERVING"
}
```

{{< info >}}
The `serviceID` in the URL is typically the last part of the full service ID (e.g., `xxxxx` from `arangodb-graph-rag-xxxxx`).
{{< /info >}}

## Process Text

The **Process Text** endpoint allows you to ask general questions to the LLM and receive natural language responses. 

```bash
POST /v1/process_text
```

{{< info >}}
**This endpoint does not query your database**, it is designed for general knowledge questions and text processing.
{{< /info >}}

**Example**:

```json
{
  "input_text": "What are the advantages of graph databases?"
}
```

```bash
curl --request POST \
  --url https://<ExternalEndpoint>:8529/graph-rag/<serviceID>/v1/process_text \
  --header 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  --header 'Content-Type: application/json' \
  --data '{
    "input_text": "What are the advantages of graph databases?"
  }'
```

**Expected output:**

```json
{
  "responseText": "Graph databases offer several key advantages: 1) Efficient relationship handling - they store relationships as first-class citizens, making traversals much faster than traditional SQL JOINs. 2) Flexible data modeling - schema-less design accommodates evolving datasets naturally. 3) High performance for connected data - query performance remains consistent even with large datasets. 4) Intuitive visualization - relationships can be easily visualized and understood. 5) Real-time capabilities - excellent for recommendation systems, fraud detection, and network analysis."
}
```

## Process Text Stream

The **Process Text Stream** endpoint returns responses in real-time as they are generated, rather than waiting for the complete response, which is useful for showing progressive output.

```bash
POST /v1/process_text_stream
```

The endpoint supports two modes described below.

### Default Mode (General Text Processing)

The default mode provides general LLM responses without querying your database.

**Example**:

```bash
curl --request POST \
  --url https://<ExternalEndpoint>:8529/graph-rag/<serviceID>/v1/process_text_stream \
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

{{< info >}}
This mode does not access your database, it provides general knowledge responses.
{{< /info >}}

### AQLizer Mode

The AQLizer mode generates schema-aware AQL queries from natural language by streaming responses from an LLM.

**Example:**

```bash
curl --request POST \
  --url https://<ExternalEndpoint>:8529/graph-rag/<serviceID>/v1/process_text_stream \
  --header 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  --header 'Content-Type: application/json' \
  --data '{
    "input_text": "Find all users who made purchases in the last month",
    "mode": "aqlizer"
  }'
```

**Response:**
```aql
FOR user IN users
  FILTER user.purchases[*].date ANY >= DATE_SUBTRACT(DATE_NOW(), 1, 'month')
  RETURN user
```

The generated AQL is based on your actual database schema, making it immediately usable.

## Translate Query

The **Translate Query** endpoint converts natural language questions into AQL queries and executes them against your ArangoDB database. **This endpoint queries your actual data** and returns results in multiple formats.

```bash
POST /v1/translate_query
```

**Example**:

```json
{
  "input_text": "Find all users who are friends with John",
  "options": {
    "output_formats": ["NL", "AQL", "JSON"]
  }
}
```

```bash
curl --request POST \
  --url https://<ExternalEndpoint>:8529/graph-rag/<serviceID>/v1/translate_query \
  --header 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  --header 'Content-Type: application/json' \
  --data '{
    "input_text": "Find all users who are friends with John",
    "options": {
      "output_formats": ["NL", "AQL", "JSON"]
    }
  }'
```

### Output formats

The `translate_query` endpoint supports multiple output formats that can be specified in the `output_formats` field of your request. Each format serves a different purpose and can be used individually or in combination.

#### Natural Language (NL)

- **Format identifier**: `"NL"`
- **Returns**: A human-readable explanation of the query results
- **Helpful for**: Understanding what the query found in plain English.
- **Example**:
  - **Input**: `Find all users who are friends with John`
  - **Output**: `I found 3 users who are friends with John, including Alice, Bob, and Carol`

#### AQL Query (AQL)

- **Format identifier**: `"AQL"`
- **Returns**: The generated ArangoDB Query Language (AQL) query
- **Useful for**:
  - Debugging query translation
  - Learning AQL syntax
  - Modifying queries for reuse
- **Shows**: Exactly how your natural language was translated into database operations.
- **Example**:
  - **Input**: `Find all users who are friends with John`
  - **Output**: `FOR u IN users FILTER u.friends ANY == 'John' RETURN u`

#### JSON Results (JSON)

- **Format identifier**: `"JSON"`
- **Returns**: The raw query results in JSON format
- **Provides**: Direct access to the complete dataset.
- **Ideal for**:
  - Programmatic processing
  - Data integration
  - Custom formatting needs
- **Example**:
  - **Input**: `Find all users who are friends with John`
  - **Output**: `[{"name":"Alice","age":30},{"name":"Bob","age":25},{"name":"Carol","age":35}]`

#### Examples

```json
{
  "original_query": "Find all users who are friends with John",
  "nl_response": "I found 3 users who are friends with John: Alice, Bob, and Carol",
  "aql_query": "FOR u IN users FILTER u.friends ANY == 'John' RETURN u",
  "aql_result": "[{\"name\":\"Alice\",\"age\":30},{\"name\":\"Bob\",\"age\":25},{\"name\":\"Carol\",\"age\":35}]"
}
```

#### Usage and default behavior

- Request only the formats you need to minimize response size and processing time.
- Use `NL` for user interfaces, human consumption, or when wrapped as an LLM-callable function (e.g., in LLM agent frameworks).
- Use `AQL` for debugging and learning purposes.
- Use `JSON` for programmatic data processing such as API calls.
- If no output formats are specified, the service defaults to `NL` format only.
- Multiple formats can be requested simultaneously.
- Formats are processed efficiently, with results cached where possible.

## Best Practices

1. Be specific in your queries to get more accurate translations.
2. Use appropriate output formats based on your needs.
3. Monitor the health endpoint for service status.
4. Implement proper error handling in your client applications.
5. Use connection pooling for better performance.
6. Consider rate limiting for production deployments.

## Error Handling

The service provides clear error messages for common issues:

- Invalid or missing configuration parameters
- Database connection failures
- Authentication errors
- Invalid query formats
- LLM provider errors

Error responses include appropriate HTTP status codes and descriptive messages.

## Troubleshooting

Common issues and solutions:

1. **Connection issues**:
   - Verify that the ArangoDB endpoint is accessible.
   - Check network/firewall settings.
   - Ensure proper authentication credentials.

2. **Query Translation issues**:
   - Make queries more specific.
   - Check LLM provider configuration.
   - Verify that the database schema matches the query context.
   - The quality of the generated AQL may vary depending on the LLM model used.
     Therefore, it is recommended to use an AQL-capable coding model (e.g., a frontier AQL-capable LLM or a fine-tuned AQL-capable coding model) for better results.

## API Reference

For detailed API documentation, see the
[Natural Language Service API Reference](https://arangoml.github.io/platform-dss-api/natural-language-service/proto/index.html).
