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
- Support for multiple LLM providers (via OpenAI API or a self-hosted Triton LLM host)
- RESTful and gRPC interfaces
- Health monitoring endpoints
- Flexible output formats (Natural Language, AQL, JSON) for database queries

## Prerequisites

- ArangoDB instance
- OpenAI API key (if using OpenAI as provider)
- Triton URL and model name (if using Triton as provider)

## Installation and configuration

When creating the service, you provide parameters in the API request that become environment variables used at runtime.

{{< info >}}
Replace `<ExternalEndpoint>` in all examples below with your Arango Data Platform deployment URL.
{{< /info >}}

{{< tabs >}}

{{< tab "Required Parameters" >}}
These parameters must be provided in all service creation requests:

- `username`: Database username for authentication
- `db_name`: Name of the ArangoDB database  
- `api_provider`: LLM provider selection (`openai` or `triton`)
- `genai_project_name`: Name of the project created in Step 1
{{< /tab >}}

{{< tab "OpenAI Provider" >}}
Additional parameters required when using `api_provider: "openai"`:

- `openai_api_key`: API key for OpenAI authentication
- `openai_model`: Model name (defaults to `gpt-3.5-turbo` if not specified)

Optional OpenAI parameters:
- `openai_temperature`: Controls randomness (0.0 to 2.0)
- `openai_max_retries`: Maximum number of retry attempts
{{< /tab >}}

{{< tab "Triton Provider" >}}
Additional parameters required when using `api_provider: "triton"`:

- `triton_url`: URL of the Triton inference server
- `triton_model`: Model name to use with Triton

Optional Triton parameters:
- `triton_timeout`: Timeout in seconds for Triton requests
{{< /tab >}}

{{< /tabs >}}

### Step 1: Create a GenAI GraphRAG project

The first step is to create a new project:

```bash
curl --request POST \
  --url https://<ExternalEndpoint>:8529/ai-services/v1/project \
  --header 'Authorization: Bearer <your-bearer-token>' \
  --header 'Content-Type: application/json' \
  --data '{
    "project_name": "your-txt2aql-project",
    "project_type": "graphrag",
    "project_description": "Natural language to AQL translation project"
  }'
```

**Expected Response:**
```json
{
  "projectName": "your-txt2aql-project",
  "projectType": "graphrag",
  "projectDescription": "Natural language to AQL translation project"
}
```

### Step 2: Create the GraphRAG txt2aql service

Create the service instance with your configuration:

```bash
curl --request POST \
  --url https://<ExternalEndpoint>:8529/ai-services/v1/graphrag \
  --header 'Authorization: Bearer <your-bearer-token>' \
  --header 'Content-Type: application/json' \
  --data '{
    "env": {
      "username": "<your-username>",
      "db_name": "<your_database_name>",
      "api_provider": "<openai>",
      "openai_api_key": "<your-openai-api-key>",
      "openai_model": "<gpt-4o>",
      "genai_project_name": "<your-txt2aql-project>"
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
Save the `serviceId` from the above response as you'll need it for subsequent API calls.
{{< /info >}}

### Step 3: Verify the service status

Check that the service is properly deployed:

```bash
curl --request GET \
  --url https://<ExternalEndpoint>:8529/gen-ai/v1/service/arangodb-graph-rag-<serviceID> \
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

### Step 4: Health check

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

### Process Text Stream

The **Process Text Stream** endpoint works like Process Text but streams the response in chunks as they are generated, providing real-time output. This is useful for long-form responses where you want to show progressive results.

```bash
POST /v1/process_text_stream
```

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

The streaming endpoint accepts the same request format as the standard Process Text endpoint but returns the response incrementally as chunks.

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

## gRPC endpoints

The service also provides gRPC endpoints for more efficient communication.

### Process Text (gRPC)

```bash
grpcurl -plaintext -d '{"input_text": "Hello world"}' \
  localhost:9090 txt2aql.Txt2AqlService/ProcessText
```

### Process Text Stream (gRPC)

```bash
grpcurl -plaintext -d '{"input_text": "What are the advantages of graph databases?"}' \
  localhost:9090 txt2aql.Txt2AqlService/ProcessTextStream
```

### Translate Query (gRPC)

```bash
grpcurl -plaintext -d '{
  "input_text": "Find all characters from House Stark",
  "options": {
    "output_formats": ["NL","AQL","JSON"]
  }
}' localhost:9090 txt2aql.Txt2AqlService/TranslateQuery
```

### Health check (gRPC)

```bash
grpcurl -plaintext localhost:9090 txt2aql.Txt2AqlService/HealthCheck
```

## Best Practices

1. Be specific in your queries to get more accurate translations.
2. Use appropriate output formats based on your needs.
3. Monitor the health endpoint for service status.
4. Implement proper error handling in your client applications.
5. Use connection pooling for better performance.
6. Consider rate limiting for production deployments.

## Error Handling

The service provides clear error messages for common issues:

- Invalid or missing environment variables
- Database connection failures
- Authentication errors
- Invalid query formats
- LLM provider errors

Error responses include appropriate HTTP status codes and descriptive messages.

## Troubleshooting

Common issues and solutions:

1. **Connection issues**:
   - Verify that ARANGODB_ENDPOINT is accessible.
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
