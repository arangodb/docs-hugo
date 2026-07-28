---
title: Private LLM hosting in the Agentic AI Suite
menuTitle: Private LLMs
description: >-
  Host and manage private large language models inside the Arango Contextual
  Data Platform with the Triton LLM Host and MLflow
weight: 40
---
The Agentic AI Suite can use either public LLM providers (such as OpenAI) or
**privately hosted LLMs** that run inside your Arango Contextual Data Platform
deployment. Private hosting is useful when data residency, network isolation,
or custom models prevent calling an external LLM provider.

Two services work together to enable this:

- [**Triton LLM Host**](triton-inference-server.md): Serves the LLM itself
  using the NVIDIA Triton Inference Server, exposing HTTP endpoints
  that other services in the suite (such as the Importer and the Retriever)
  call for inference.
- [**MLflow**](mlflow.md): Acts as the model registry. You
  register your model bundle (model code, Triton config, and the MLflow
  metadata) in MLflow, and the Triton LLM Host pulls it from there at
  startup.

## How they fit together

1. Package your model as a Python-backend Triton bundle (`model.py`,
   `config.pbtxt`, `MLmodel`).
2. Register the bundle in the **MLflow** service.
3. Deploy the **Triton LLM Host** service, pointing it at the registered
   model name (and optionally a version).
4. Configure the [Importer](../importer/llm-configuration.md) and
   [Retriever](../retriever/llm-configuration.md) to call the Triton
   endpoint instead of a public LLM provider.

When you only need MLflow as a general-purpose experiment tracker (without
serving a private LLM), the MLflow service can also be used on its own.
