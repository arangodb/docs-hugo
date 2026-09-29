---
title: Supported LLM providers and models
menuTitle: LLM Providers and Models
group: Build
weight: 130
description: >-
  Which LLM providers and models the AI services of the Arango Contextual Data
  Platform support, how OpenAI-compatible endpoints are reached, and where each
  service is configured
---
The AI services of the Arango Contextual Data Platform work with
OpenAI-compatible APIs as well as self-hosted models served through Triton
Inference Server. The recommended setup is the `openai` provider with the
OpenAI models listed below: that is the combination ArangoDB tests, and other
endpoints can differ in behavior such as latency.

You can still use any other OpenAI-compatible endpoint (OpenRouter, Google
Gemini, Anthropic, Azure, or a corporate LLM) and run a model that is not on the
list. In the Importer, AutoGraph, and AutoRAG, use the `custom` provider for
these: it is the intended way to point a service at an OpenAI-compatible
endpoint that is not the OpenAI API itself, and you should always set
`chat_api_url` / `embedding_api_url` explicitly with it. In those three
services, pointing the `openai` provider at a non-OpenAI URL is **not
supported**. Natural Language to AQL has no `custom` provider and reaches such
endpoints with `openai` plus a `chat_api_url`, see
[Natural Language to AQL setup](natural-language-to-aql/setup.md). Models
beyond the ones listed below are outside ArangoDB's testing, so validate them in
your own environment.

"OpenAI-compatible" here has a specific meaning: the services talk to providers
through the OpenAI Chat Completions client, so an endpoint must implement the
`/v1/chat/completions` contract that client expects (and `/v1/embeddings` for
embedding models). An endpoint that exposes only a different API surface is not
supported, even if it is marketed as OpenAI-compatible. Some newer OpenAI models
require the Responses API (`/v1/responses`) instead; the Importer and AutoGraph
detect this and fall back automatically.

A model is listed as supported only if it works seamlessly across
the Importer, AutoRAG, and AutoGraph services. Individual services may also
work with additional models. For the full list available to a specific
service, see that service's own documentation (for example,
[Importer LLM Configuration](autograph-studio/autograph/importer/llm-configuration.md#supported-models)).

{{% llm-models %}}

## Where each service is configured

The provider and model are set per service, because their parameters differ:

- [AutoGraph service](autograph-studio/autograph/llm-configuration.md)
- [Importer](autograph-studio/autograph/importer/llm-configuration.md)
- [AutoRAG](autograph-studio/autorag/llm-configuration.md)
- [Natural Language to AQL](natural-language-to-aql/setup.md)
- [Ada](ada/llm-configuration.md)

API keys are stored once in the [Secrets Manager](secrets-manager.md) and
selected in each service's configuration.

## Private models

To serve a model inside your own deployment instead of calling a public
provider, for example for data residency or network isolation, see
[Private LLM hosting](private-llms/_index.md). It covers the Triton LLM Host
that serves the model and the MLflow service that acts as its model registry.
