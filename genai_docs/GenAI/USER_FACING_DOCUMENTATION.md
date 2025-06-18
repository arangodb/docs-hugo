# GenAI-Service

## Description

The GenAI orchestrator service is a service that is able to install, manage, and run AI-based services in your Kubernetes cluster.

The basic operations are:
- Install a service
- Uninstall a service
- Get the status of a service

Each unique service does have its own API endpoint for the deployment.

**Endpoint LLM Host:**
`https://<ExternalEndpoint>:8529/gen-ai/v1/llmhost`

While they have their own unique endpoint, all services share the same creation request body and the same response body structure. While the env field is used to define the service specific parameters, like e.g. the model name to use for a llm host service, the labels can be used to filter and identify the services in the platform. All services do support the 'profiles' field, which can be used to define the profile to use for the service. One use case is defining a GPU profile that enables the service to run an LLM on GPU resources.

## Examples

### LLM Host Service Creation Request Body

```json
{
    "env": {
        "model_name": "<registered_model_name>"
    }
}
```

### Using Labels in Creation Request Body

```json
{
    "env": {
        "model_name": "<registered_model_name>"
    },
    "labels": {
        "key1": "value1",
        "key2": "value2"
    }
}
```

**Note:** Labels are optional. Labels can be used to filter and identify services in the platform. If you want to use labels, define them as a key-value pair in the `labels` within the `env` field.

### Using Profiles in Creation Request Body

```json
{
    "env": {
        "model_name": "<registered_model_name>",
        "profiles": "gpu,internal"
    }
}
```

**Note:** The `profiles` field is optional. If it is not set, the service will be created with the default profile. Profiles must be present and created in the platform before they can be used. If you want to use profiles, define them as a comma-separated string in the `profiles` within the `env` field.

The service specific required parameters for the deployment are defined in the corresponding service documentation.

## Obtaining a Bearer Token

Before you can authenticate with the GenAI service, you need to obtain a Bearer token. You can generate this token using the ArangoDB authentication API:

```bash
curl -X POST https://<ExternalEndpoint>:8529/_open/auth \
  -d '{"username": "your-username", "password": "your-password"}'
```

This will return a JWT token that you can use as your Bearer token. For more details about ArangoDB authentication and JWT tokens, see the [ArangoDB Authentication Documentation](https://docs.arangodb.com/stable/develop/http-api/authentication/#jwt-user-tokens).

## Complete Service Lifecycle Example

Here's a complete example showing how to install, monitor, and uninstall a RAGLoader service:

### Step 1: Install the Service

```bash
curl -X POST https://<ExternalEndpoint>:8529/gen-ai/v1/graphragimporter \
  -H "Authorization: Bearer <your-bearer-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "env": {
      "username": "<your-username>",
      "db_name": "<your-database-name>",
      "api_provider": "<your-api-provider>",
      "triton_url": "<your-arangodb-llm-host-url>",
      "triton_model": "<your-triton-model>"
    }
  }'
```

**Response:**
```json
{
  "serviceInfo": {
    "serviceId": "arangodb-graphrag-importer-of1ml",
    "description": "Install complete",
    "status": "DEPLOYED",
    "namespace": "arangodb-platform-dev"
  }
}
```

### Step 2: Check Service Status

```bash
curl -X GET https://<ExternalEndpoint>:8529/gen-ai/v1/service/arangodb-graphrag-importer-of1ml \
  -H "Authorization: Bearer <your-bearer-token>"
```

**Response:**
```json
{
  "serviceInfo": {
    "serviceId": "arangodb-graphrag-importer-of1ml",
    "description": "Install complete",
    "status": "DEPLOYED",
    "namespace": "arangodb-platform-dev"
  }
}
```

### Step 3: Uninstall the Service

```bash
curl -X DELETE https://<ExternalEndpoint>:8529/gen-ai/v1/service/arangodb-graphrag-importer-of1ml \
  -H "Authorization: Bearer <your-bearer-token>"
```

**Response:**
```json
{
  "serviceInfo": {
    "serviceId": "arangodb-graphrag-importer-of1ml",
    "description": "Uninstall complete",
    "status": "UNINSTALLED", 
    "namespace": "arangodb-platform-dev"
  }
}
```

**Notes:**

- **Service ID**: The `serviceId` from Step 1's response (`arangodb-graphrag-importer-of1ml`) is used in Steps 2 and 3
- **Authentication**: All requests use the same Bearer token in the `Authorization` header

### Customizing the Example

Replace the following values with your actual configuration:
- `<your-username>` - Your database username
- `<your-database-name>` - Target database name
- `<your-api-provider>` - Your API provider (e.g., "triton")
- `<your-arangodb-llm-host-url>` - Your LLM host service URL
- `<your-triton-model>` - Your Triton model name (e.g., "mistral-nemo-instruct")
- `<your-bearer-token>` - Your authentication token

## Service Configuration

The GenAI orchestrator service is **started by default**. 

It will be available at the following URL:
`https://<ExternalEndpoint>:8529/gen-ai/v1/service`

### Health Check

To test whether the service is running, you can use the following snippet:

```bash
curl -X GET https://<ExternalEndpoint>:8529/gen-ai/v1/health
```

Expected output on success: `{"status":"OK"}`

**Note:** Keep in mind that this request requires a valid Bearer token. Without a valid Bearer token, the request will fail.

## API Reference

For detailed API documentation, visit: [GenAI-Service API Reference](https://arangoml.github.io/platform-dss-api/GenAI-Service/proto/index.html)