---
title: Triton LLM Host
menuTitle: Triton LLM Host
description: >-
  Enable your GraphRAG pipeline to use private LLMs via Triton Inference Server 
weight: 30
---

{{< tag "ArangoDB Platform" >}}

The **Triton LLM Host** service provides scalable deployment of Large Language
Models (LLMs) using the NVIDIA Triton Inference Server. It efficiently serves
machine learning models with support for HTTP and gRPC APIs, customizable routing,
and seamless Kubernetes integration.

## Workflow

The Triton LLM Host enables your GraphRAG pipeline to use privately hosted
LLMs directly from the ArangoDB Platform environment. The process involves the
following steps:

1. Install the Triton LLM Host service.
2. Register your LLM model to MLflow by uploading the required files.
3. Configure the [Importer](importer.md#using-triton-inference-server-private-llm) service to use your LLM model.
4. Configure the [Retriever](retriever.md#using-triton-inference-server-private-llm) service to use your LLM model.

{{< tip >}}
Check out the dedicated [ArangoDB MLflow](mlflow.md) documentation page to learn
more about the service and how to interact with it.
{{< /tip >}}

## Deployment

The Triton LLM Host service is deployed as a **Kubernetes application** using Helm charts in
the ArangoDB Platform ecosystem. It integrates with the:
- MLFlow model registry for model management.
- Storage sidecar for artifact storage.

## Installation via GenAI Service API

To install the Triton LLM Host service, send an API request to the
**GenAI service** using the following parameters:

### Required parameters

```json
{
  "models": "model_name",
}
```
You can also specify multiple models:
- Without versions: `"model_name_1, model_name_2"`
- With versions: `"model_name_1@version1, model_name_2@version2"`
- Mixed: `"model_name_1, model_name_2@version4"`

### Optional parameters

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

### Parameter descriptions

| Parameter | Required | Description | Example |
|-----------|----------|-------------|---------|
| `models` | ✅ | Comma-separated list of model_name@version pairs | `"mistral@1,t5@3"` |
| `resources_requests_memory` | ❌ | Minimum memory required | `"8Gi"` |
| `resources_requests_cpu` | ❌ | Minimum CPU cores required | `"2"` |
| `resources_limits_memory` | ❌ | Maximum memory allowed | `"16Gi"` |
| `resources_limits_cpu` | ❌ | Maximum CPU cores allowed | `"4"` |
| `log_level` | ❌ | Logging level | `"INFO"` (default) |
| `profiles` | ❌ | Platform profiles to apply | `"gpu,performance"` |

## Model requirements

### Python Backend

All models **must use the Python backend** to ensure compatibility with the
Triton service. Each model requires the following two files:

1. **`model.py`**
   Implements the Python backend model. Triton uses this file to load and 
   execute your model for inference.
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

2. **`config.pbtxt`**
   This is the Triton model configuration file that defines essential parameters
   such as the model name, backend, and input/output tensors.
   ```
   name: "your_model_name"
   backend: "python"
   max_batch_size: 1
   input: [...]
   output: [...]
   ```

## Model management with MLflow

{{< info >}}
To prepare your Python backend model for the Triton LLM Host, you must first
register it in MLflow. The Triton LLM Host service automatically downloads
and load models from the MLflow registry.
{{< /info >}}

### How to register a model in MLflow

Registering a Python backend model in MLflow involves packaging your
`model.py` and `config.pbtxt` files and passing them as an artifact. The Triton
service will look for a directory named after your model (e.g., `my-private-llm-model`)
within the MLflow registry store and expects to find the `model.py` and `config.pbtxt`
files inside it.

```py
try:
    mlflow.set_tracking_uri(MLFLOW_SERVICE_URI)
    with mlflow.start_run() as run:
        run_id = run.info.run_id
        model_uri = f"runs:/{run_id}/model"
        mlflow.register_model(model_uri=model_uri, name=model_name)
        # Log the entire model directory as an artifact, preserving the Triton structure
        mlflow.log_artifact(local_path=str(local_model_dir))
```

## Service endpoints

Once deployed, the service exposes two endpoints:

| Port | Protocol | Purpose |
|------|----------|---------|
| 8000 | HTTP/REST | Model inference, management, status |
| 8001 | gRPC | High-performance binary communication |


{{< info >}}
The Triton Inference Server is not intended to be used in a standalone mode.
Instead, other services consume these endpoints to send inference
requests for example. Refer to the specific service with which you are using
Triton Inference Server for more details.
{{< /info >}}

- **Internal access (within ArangoDB Platform)**:
  `https://{SERVICE_ID}.{KUBERNETES_NAMESPACE}.svc:8000`
  - `KUBERNETES_NAMESPACE` is available as an environment variable.
  - `SERVICE_ID` is returned by the GenAI service API.

  **Example**:
  To check server health:
  `GET https://{SERVICE_ID}.{KUBERNETES_NAMESPACE}.svc:8000/v2/health/ready`

- **External access (outside ArangoDB Platform)**:
  `https://{BASE_URL}:8529/llm/{SERVICE_POSTFIX}/`
  - `BASE_URL`: Your ArangoDB Platform base URL.
  - `SERVICE_POSTFIX`: Last 5 characters of the service ID.

  **Example**:
  To check server health:
  `GET https://{BASE_URL}:8529/llm/{SERVICE_POSTFIX}/v2/health/ready`

{{< info >}}
Only HTTP protocol is supported for external access (outside the ArangoDB
Platform). For gRPC, use internal endpoints. This limitation applies to model
inference, model management, model status, and health check endpoints.
{{< /info >}}

## Triton Inference Server API

For complete documentation on available endpoints and their usage,
refer to the [Triton Inference Server HTTP API](https://docs.nvidia.com/deeplearning/triton-inference-server/archives/triton_inference_server_1120/triton-inference-server-guide/docs/http_grpc_api.htm) documentation.