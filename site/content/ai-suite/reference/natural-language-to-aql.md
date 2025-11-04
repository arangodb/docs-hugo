---
title: Natural Language to AQL Translation Service (txt2aql)
menuTitle: txt2aql
description: >-
  The Natural Language to AQL Translation Service is a powerful tool that allows
  you to interact with your ArangoDB database using natural language queries
weight: 20
---
## Overview

This service translates your questions and commands into AQL (ArangoDB Query Language),
executes the queries, and provides responses in natural language.

## Features

- Natural language to AQL query translation
- Support for multiple LLM providers (via OpenAI API or a self-hosted Triton Inference Server)
- RESTful and gRPC interfaces
- Health monitoring endpoints
- Flexible output formats (Natural Language, AQL, JSON)

## Getting Started

### Prerequisites

- ArangoDB instance
- OpenAI API key (if using OpenAI as provider)
- Triton URL and model name (if using Triton as provider)


### Configuration

The following environment variables are set at installation time and used at runtime:

```bash
# Required Database Configuration
ARANGODB_NAME=<your_database_name>
ARANGODB_USER=<your_username>

# LLM Provider Configuration
API_PROVIDER=<provider>                # "openai" or "triton"

# If using OpenAI
OPENAI_API_KEY=<your_api_key>
OPENAI_MODEL=<model_name>              # Optional, defaults to GPT-4
OPENAI_TEMPERATURE=<temperature>       # Optional
OPENAI_MAX_RETRIES=<retries>           # Optional

# If using Triton
TRITON_URL=<triton_server_url>
TRITON_MODEL=<model_name>
TRITON_TIMEOUT=<timeout_seconds>       # Optional
```

### Starting the Service

To start the service, use AI service endpoint `CreateGraphRag`. Please refer to the documentation of AI service for more information on how to use it.

### Required Parameters

These parameters must be provided in the install request sent to AI service.

- `username`: Database username for authentication
- `db_name`: Name of the ArangoDB database
- `api_provider`: LLM provider selection (`openai`, `triton`)

### Provider-Specific Required Parameters

#### OpenAI Provider

- `openai_api_key`: API key for OpenAI authentication
- `openai_model`: Model name (defaults to "gpt-3.5-turbo" if not specified)

#### Triton Provider

- `triton_url`: URL of the Triton inference server
- `triton_model`: Model name to use with Triton

## API Reference

### REST Endpoints

1. **Process Text** - Ask general questions to the LLM and get a natural language response. This endpoint does not query the database.
   ```bash
   POST /v1/process_text
   Content-Type: application/json
 
   {
     "input_text": "What are the advantages of graph databases?"
   }
   ```

2. **Translate Query** - Convert natural language to AQL and query the database
   ```bash
   POST /v1/translate_query
   Content-Type: application/json
   
   {
     "input_text": "Find all users who are friends with John",
     "options": {
       "output_formats": ["NL", "AQL", "JSON"]
     }
   }
   ```

3. **Health Check** - Monitor service health
   ```bash
   GET /v1/health
   ```

### gRPC Endpoints

The service also provides gRPC endpoints for more efficient communication:

1. **Process Text**
   ```bash
   grpcurl -plaintext -d '{"input_text": "Hello world"}' \
     localhost:9090 txt2aql.Txt2AqlService/ProcessText
   ```

2. **Translate Query**
   ```bash
   grpcurl -plaintext -d '{
     "input_text": "Find all characters from House Stark",
     "options": {
       "output_formats": ["NL","AQL","JSON"]
     }
   }' localhost:9090 txt2aql.Txt2AqlService/TranslateQuery
   ```

3. **Health Check**
   ```bash
   grpcurl -plaintext localhost:9090 txt2aql.Txt2AqlService/HealthCheck
   ```

## Output Formats

The `translate_query` endpoint of the txt2aql service supports multiple output formats that can be specified in the `output_formats` field of your request. Each format serves a different purpose and can be used individually or in combination:

### Natural Language (NL)

- **Format identifier**: `"NL"`
- **Returns**: A human-readable explanation of the query results
- **Helpful for**: Understanding what the query found in plain English
- **Example**:
  - **Input**: `Find all users who are friends with John`
  - **Output**: `I found 3 users who are friends with John, including Alice, Bob, and Carol`

### AQL Query (AQL)

- **Format identifier**: `"AQL"`
- **Returns**: The generated ArangoDB Query Language (AQL) query
- **Useful for**:
  - Debugging query translation
  - Learning AQL syntax
  - Modifying queries for reuse
- **Shows**: Exactly how your natural language was translated into database operations
- **Example**:
  - **Input**: `Find all users who are friends with John`
  - **Output**: `FOR u IN users FILTER u.friends ANY == 'John' RETURN u`

### JSON Results (JSON)

- **Format identifier**: `"JSON"`
- **Returns**: The raw query results in JSON format
- **Provides**: Direct access to the complete dataset
- **Ideal for**:
  - Programmatic processing
  - Data integration
  - Custom formatting needs
- **Example**:
  - **Input**: `Find all users who are friends with John`
  - **Output**: `[{"name":"Alice","age":30},{"name":"Bob","age":25},{"name":"Carol","age":35}]`

### Example Response

```json
{
  "original_query": "Find all users who are friends with John",
  "nl_response": "I found 3 users who are friends with John: Alice, Bob, and Carol",
  "aql_query": "FOR u IN users FILTER u.friends ANY == 'John' RETURN u",
  "aql_result": "[{\"name\":\"Alice\",\"age\":30},{\"name\":\"Bob\",\"age\":25},{\"name\":\"Carol\",\"age\":35}]"
}
```

### Usage Tips

1. Request only the formats you need to minimize response size and processing time
2. Use `NL` for user interfaces, human consumption or when wrapped as an LLM-callable function (e.g. in LLM agent frameworks)
3. Use `AQL` for debugging and learning purposes
4. Use `JSON` for programmatic data processing such as API calls.

### Default Behavior

- If no output formats are specified, the service defaults to `NL` format only
- Multiple formats can be requested simultaneously
- Formats are processed efficiently, with results cached where possible

## Error Handling

The service provides clear error messages for common issues:

- Invalid or missing environment variables
- Database connection failures
- Authentication errors
- Invalid query formats
- LLM provider errors

Error responses include appropriate HTTP status codes and descriptive messages.

## Best Practices

1. Be specific in your queries to get more accurate translations
2. Use appropriate output formats based on your needs
3. Monitor the health endpoint for service status
4. Implement proper error handling in your client applications
5. Use connection pooling for better performance
6. Consider rate limiting for production deployments

## Troubleshooting

Common issues and solutions:

1. **Connection Issues**
   - Verify ARANGODB_ENDPOINT is accessible
   - Check network/firewall settings
   - Ensure proper authentication credentials

2. **Query Translation Issues**
   - Make queries more specific
   - Check LLM provider configuration
   - Verify database schema matches query context
   - The quality of the generated AQL may vary depending on the LLM model used.
     Therefore we recommend using an AQL-capable coding model (e.g. a frontier AQL-capable
     LLM or a fine-tuned AQL-capable coding model) for better results.

## API Reference

For detailed API documentation, see the
[Natural Language Service API Reference](https://arangoml.github.io/platform-dss-api/natural-language-service/proto/index.html).
