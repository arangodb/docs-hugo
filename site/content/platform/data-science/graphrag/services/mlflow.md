---
title: ArangoDB MLflow Service
menuTitle: MLflow
description: >-
  The ArangoDB MLflow Service integrates the MLflow platform for managing the
  full machine learning lifecycle into the ArangoDB Platform
weight: 25
---
{{< tag "ArangoDB Platform" >}}

{{< tip >}}
The ArangoDB Platform & GenAI Suite is available as a pre-release. To get
exclusive early access, [get in touch](https://arangodb.com/contact/) with
the ArangoDB team.
{{< /tip >}}

## Overview

The ArangoDB MLflow service is a service that hosts the official MLflow
application in your Kubernetes cluster and connects automatically to the
ArangoDB environment, e.g. for registering the LLM to be self-hosted and
used by services requiring LLMs (such as the Importer and Retriever services).

MLflow is an open-source platform, purpose-built to assist machine learning
practitioners and teams in handling the complexities of the machine learning
process. It focuses on the full lifecycle for machine learning projects, ensuring
that each phase is manageable, traceable, and reproducible.

The main purpose of the ArangoDB's MLflow integration is to provide a seamless
experience to manage your machine learning models and experiments within the
ArangoDB environment. For example, any spawned LLM host service is automatically
linked to the MLflow service and is able to fetch any registered model from the
MLflow model registry.

{{< tip >}}
ArangoDB's MLflow integration is only required when working with private LLMs.
For more information, see the [Triton LLM host](triton-inference-server.md)
documentation.
{{< /tip >}}

{{< info >}}
You can find detailed instructions about how to organize the format of a model for a
dedicated LLM host service in the official [MLflow](https://mlflow.org/docs/latest/index.html)
documentation.
{{< /info >}}

## Core components

MLflow consists of the following core components:

- **Model Registry**: A centralized model store, set of APIs, and UI to
  collaboratively manage the full lifecycle of an MLflow Model, including
  model lineage, versioning, stage transitions, and annotations.
- **Experiment Tracking**: Provides an API and UI for logging parameters,
  code versions, metrics, and artifacts during the ML process, allowing
  for comparison of multiple runs across different users.
- **Model Packaging**: Offers a standard format for packaging models from any framework.
- **Serving**: Facilitates the deployment of models to various platforms.
  Within the ArangoDB environment, this enables the integration with services that utilize self-hosted LLMs.
- **Evaluation**: Provides tools for in-depth model analysis, facilitating objective model comparison.
- **Observability**: Ensures that the ML lifecycle is traceable and reproducible through various metrics and logs.

## Quickstart

The ArangoDB MLflow service is **started by default**.

It is automatically spawned and available at the following URL:

```
https://<ExternalEndpoint>:8529/mlflow/
```

You can interact with the ArangoDB MLflow service in two ways:
- **Programmatically**: Using the official MLflow client
- **Web Interface**: Directly through your browser at the URL above

To use the programmatic API, please use the **official MLflow client**.

{{< info >}}
The ArangoDB MLflow service requires authentication. You need a valid
Bearer token to access the service.
{{< /info >}}

### Obtaining a Bearer Token

Before you can authenticate with the MLflow service, you need to obtain a
Bearer token. You can generate this token using the ArangoDB authentication API:

```bash
curl -X POST https://<ExternalEndpoint>:8529/_open/auth \
  -d '{"username": "your-username", "password": "your-password"}'
```

This returns a JWT token that you can use as your Bearer token.
For more details about ArangoDB authentication and JWT tokens, see the
[ArangoDB Authentication](../../../../3.12/develop/http-api/authentication.md/#jwt-user-tokens)
documentation.

## Installation

First, install the MLflow client:

```bash
pip install mlflow=2.22.1
```
{{< warning >}}
MLflow version 3 introduces a breaking change that affects this workflow, so it is
important to use MLflow version 2.
{{< /warning >}}

There are two approaches for programmatic access to your ArangoDB MLflow service:
- Configuration in Python
- Using environment variables

### Configuration in Python

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

### Using environment variables

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

## Health check

To test whether the service is running, you can use the following snippet:

```bash
curl -H "Authorization: Bearer your-bearer-token-here" https://<ExternalEndpoint>:8529/mlflow/health
```

Expected output on success: HTTP `200` status with response body `OK`.

## API Reference

For detailed API documentation, refer to the official
[MLflow REST API Reference](https://mlflow.org/docs/latest/api_reference/rest-api.html).
