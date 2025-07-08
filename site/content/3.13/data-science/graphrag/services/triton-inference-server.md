---
title: Triton Inference Server
menuTitle: Triton Inference Server
description: >-
  Private LLM using the Triton Inference Server 
weight: 30
---

## Overview

The **LLM Host Triton** service provides scalable deployment of Large Language Models (LLMs) using NVIDIA Triton Inference Server. It enables efficient serving of machine learning models with support for HTTP/gRPC APIs, customizable routing, and seamless Kubernetes integration.

## Service Deployment

The service is deployed as a **Kubernetes application** using Helm charts in the ArangoDB platform ecosystem. It integrates with:
- MLFlow model registry for model management
- Storage sidecar for artifact storage

## Installation via Gen-AI Service API

To install the LLM Host Triton service, send an API request to the **gen-ai service** with the following parameters:

### Required Parameters

```json
{
  "models": "model_name@version,model_name2@version2",


}
```

### Optional Parameters

```json
{
  "log_level": "INFO",
  "profiles": "profile1,profile2"
  "resources_requests_memory": "",     // Minimum memory required for the container
  "resources_requests_cpu": "",        // Minimum CPU required for the container
  "resources_limits_memory": "",       // Maximum memory the container can use
  "resources_limits_cpu": "",          // Maximum CPU the container can use
  "resources_requests_ephemeral_storage": "",  // Minimum ephemeral storage required for the container
  "resources_limits_ephemeral_storage": ""     // Maximum ephemeral storage the container can use
}
```

### Parameter Descriptions

| Parameter | Required | Description | Example |
|-----------|----------|-------------|---------|
| `models` | ✅ | Comma-separated list of model_name@version pairs | `"mistral@1,t5@3"` |
| `resources_requests_memory` | ❌ | Minimum memory required | `"8Gi"` |
| `resources_requests_cpu` | ❌ | Minimum CPU cores required | `"2"` |
| `resources_limits_memory` | ❌ | Maximum memory allowed | `"16Gi"` |
| `resources_limits_cpu` | ❌ | Maximum CPU cores allowed | `"4"` |
| `log_level` | ❌ | Logging level | `"INFO"` (default) |
| `profiles` | ❌ | Platform profiles to apply | `"gpu,performance"` |

## Model Requirements

### Python Backend Mandatory

All models deployed on this service **must use the Python backend**. Each model requires:

1. **`model.py`** - Python implementation with:
   ```python
   class TritonPythonModel:
       def initialize(self, args):
           # Load your model here
           pass
       
       def execute(self, requests):
           # Process inference requests
           pass
           
       def finalize(self):
           # Cleanup resources
           pass
   ```

2. **`config.pbtxt`** - Triton configuration:
   ```
   name: "your_model_name"
   backend: "python"
   max_batch_size: 1
   input: [...]
   output: [...]
   ```

### Model Storage

Models must be stored in the **MLFlow model registry** and will be automatically downloaded and loaded by the service.

For detailed guidance on creating and uploading a python-backend model, refer to the [LLM Host Registry Services documentation](https://arangodb.atlassian.net/wiki/spaces/TUP/pages/2724757505/LLM+Host+Registry+Services).

## Service Endpoints

Once deployed, the service exposes two endpoints:

| Port | Protocol | Purpose |
|------|----------|---------|
| 8000 | HTTP/REST | Model inference, management, status |
| 8001 | gRPC | High-performance binary communication |

Triton Inference Server is not intended to be used in a standalone mode, but rather through other services
consuming these endpoints to send infer requests for example. So please refer to the service with which you are using Triton Inference Server for more details.

Therefore, Triton service http endpoint can be accessed from inside the ArangoDB platform as follows: `https://{SERVICE_ID}.{KUBERNETES_NAMESPACE}.svc:8000`,
where KUBERNETES_NAMESPACE is the namespace of the ArangoDB platform and you can find it in an environment
variable called `KUBERNETES_NAMESPACE`. And SERVICE_ID is the ID of the LLM Host Triton service, which can be found in the `gen-ai service` response. For example, to check the server health, you need to send a GET request to `https://{SERVICE_ID}.{KUBERNETES_NAMESPACE}.svc:8000/v2/health/ready`.

Similarly, you can access gRPC endpoints on port 8001, please refer to the official Triton documentation below for more details.

From outside the ArangoDB platform, you can access the Triton Inference Server http endpoints using the following URL: `https://{BASE_URL}:8529/llm/{SERVICE_POSTFIX}/`, where BASE_URL is the base URL of the ArangoDB platform and service_postfix is the postfix of the LLM Host Triton service, it is the last 5 characters of the service ID.
For example, to check the server health from outside the platform, send a GET request to `https://{BASE_URL}:8529/llm/{SERVICE_POSTFIX}/v2/health/ready`.

## Triton Inference Server Endpoints

The service exposes all standard Triton Inference Server endpoints at port 8000 for http protocol or port 8001 for gRPC protocol for internal uage inside ArangoDB platform, and only http protocol is supported from outside the ArangoDB platform. This includes the following endpoints: model inference, model management, model status, and health check.

For complete documentation on available endpoints and their usage, refer to the [Triton Inference Server HTTP API documentation](https://docs.nvidia.com/deeplearning/triton-inference-server/archives/triton_inference_server_1120/triton-inference-server-guide/docs/http_grpc_api.html#section-api-health).