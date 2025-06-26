---
title: ArangoDB MLflow Service
menuTitle: MLflow
description: >-
  The ArangoDB MLflow Service integrates the MLflow platform for managing the
  full machine learning lifecycle into the ArangoDB Platform
weight: 25
---
## Overview

The ArangoDB MLflow service is a service that hosts the official MLflow application in your Kubernetes cluster and connects it automatically to the ArangoDB environment, e.g. for registering the LLM to be self-hosted and used by services requiring LLMs (natural-language-service, RAGLoader, RAGRetriever).

MLflow is an open-source platform, purpose-built to assist machine learning practitioners and teams in handling the complexities of the machine learning process. It focuses on the full lifecycle for machine learning projects, ensuring that each phase is manageable, traceable, and reproducible.

The main purpose of our MLflow integration is to provide a seamless experience for users to manage their machine learning models and experiments within the ArangoDB environment. For example, any spawned LLM host service will automatically be linked to the MLflow service and will be able to fetch any registered model from the MLflow model registry.

**Note:** The detailed instructions about how to organize the format of a model for the dedicated LLM host service can be found in their respective documentation.

## Core Components

MLflow consists of the following core components:

- **Model Registry**: A centralized model store, set of APIs, and UI to collaboratively manage the full lifecycle of an MLflow Model, including model lineage, versioning, stage transitions, and annotations.

- **Experiment Tracking**: Provides an API and UI for logging parameters, code versions, metrics, and artifacts during the ML process, allowing for comparison of multiple runs across different users.

- **Model Packaging**: Offers a standard format for packaging models from any framework.

- **Serving**: Facilitates the deployment of models to various platforms. Within the ArangoDB environment, this enables the integration with services that utilize self-hosted LLMs.

- **Evaluation**: Provides tools for in-depth model analysis, facilitating objective model comparison.

- **Observability**: Ensures that the ML lifecycle is traceable and reproducible through various metrics and logs.

## Getting Started

The ArangoDB MLflow service is **started by default**.

It will be automatically spawned and available at the following URL:

```
https://<ExternalEndpoint>:8529/mlflow/
```

You can interact with the ArangoDB MLflow service in two ways:
- **Programmatically**: Using the official MLflow client
- **Web Interface**: Directly through your browser at the URL above

To use the programmatic API, please use the **official MLflow client**.

**Note:** The ArangoDB MLflow service requires authentication. You need a valid Bearer token to access the service.

#### Obtaining a Bearer Token

Before you can authenticate with the MLflow service, you need to obtain a Bearer token. You can generate this token using the ArangoDB authentication API:

```bash
curl -X POST https://<ExternalEndpoint>:8529/_open/auth \
  -d '{"username": "your-username", "password": "your-password"}'
```

This will return a JWT token that you can use as your Bearer token. For more details about ArangoDB authentication and JWT tokens, see the [ArangoDB Authentication Documentation](https://docs.arangodb.com/stable/develop/http-api/authentication/#jwt-user-tokens).

### Installation

First, install the MLflow client:

```bash
pip install mlflow
```

### Programmatic Access

There are two approaches for programmatic access to your ArangoDB MLflow service:

#### Approach 1: Configure in Python Code

```python
import mlflow
import os

# Set authentication and tracking URI
os.environ['MLFLOW_TRACKING_TOKEN'] = 'your-bearer-token-here'
mlflow.set_tracking_uri("https://<ExternalEndpoint>:8529/mlflow/")

# Start logging your experiments
with mlflow.start_run():
    mlflow.log_artifact("local_file.txt")
```

#### Approach 2: Use Environment Variables

Set the environment variables in your shell:

```bash
export MLFLOW_TRACKING_URI="https://<ExternalEndpoint>:8529/mlflow/"
export MLFLOW_TRACKING_TOKEN="your-bearer-token-here"
```

Then use MLflow normally in your Python code:

```python
import mlflow

# MLflow automatically uses the environment variables
with mlflow.start_run():
    mlflow.log_artifact("local_file.txt")
```

### Health Check

To test whether the service is running, you can use the following snippet:

```bash
curl -H "Authorization: Bearer your-bearer-token-here" https://<ExternalEndpoint>:8529/mlflow/health
```

Expected output on success: HTTP `200` status with response body `OK`

## API Reference

For detailed API documentation, refer to the official MLflow REST API documentation:
[MLflow REST API Reference](https://mlflow.org/docs/latest/api_reference/rest-api.html)

## Additional Resources

The official MLflow documentation can be found at:
[MLflow Documentation](https://mlflow.org/docs/latest/index.html)
