---
title: Configure LLMs and Embedding Models
menuTitle: LLM Configuration
description: >-
  Configure OpenAI-compatible APIs or Triton Inference Server for the Importer service
weight: 40
---

The Importer service can be configured to use either Triton Inference Server or any
OpenAI-compatible API. OpenAI-compatible APIs work with public providers (OpenAI,
OpenRouter, Gemini, Anthropic) as well as private corporate LLMs that expose an
OpenAI-compatible endpoint.

"OpenAI-compatible" means the endpoint must implement the contract used by the
OpenAI Chat Completions client (`/v1/chat/completions`, and `/v1/embeddings` for
embedding models). An endpoint that exposes only a different API surface is not
supported. Some newer OpenAI models require the Responses API (`/v1/responses`)
instead; the Importer detects this and falls back automatically (see
[OpenAI Responses API fallback](#openai-responses-api-fallback)).

## Supported models

The following models are validated for use with the Importer service. For the full
list across all services, see
[Supported LLM and embedding models](../_index.md#supported-llm-and-embedding-models).

{{% llm-models "importer" %}}

## Using OpenAI-compatible APIs

The `openai` provider works with any OpenAI-compatible API, including:
- OpenAI (official API)
- OpenRouter
- Google Gemini
- Anthropic Claude
- Azure (Azure OpenAI in Microsoft Foundry)
- Corporate or self-hosted LLMs with OpenAI-compatible endpoints

Set the `chat_api_url` and `embedding_api_url` to point to your provider's endpoint.
For the chat and embedding models validated for the Importer, see
[Supported models](#supported-models) above.

Some newer OpenAI model identifiers (for example `o3-pro`) require the OpenAI
Responses API instead of `/v1/chat/completions`. The Importer detects this
automatically; see [OpenAI Responses API fallback](#openai-responses-api-fallback)
below.

### Example using OpenAI

```json
{
  "env": {
    "db_name": "your_database_name",
    "project_name": "your_project_name",
    "chat_api_provider": "openai",
    "chat_api_url": "https://api.openai.com/v1",
    "embedding_api_provider": "openai",
    "embedding_api_url": "https://api.openai.com/v1",
    "chat_model": "gpt-5.4-nano",
    "embedding_model": "text-embedding-3-small",
    "chat_api_key": "your_openai_api_key",
    "embedding_api_key": "your_openai_api_key",
    "embedding_dim": "512"
  }
}
```

Where:
- `db_name`: Name of the ArangoDB database where the knowledge graph will be stored
- `project_name`: The project name created via the
   [web interface](../graphrag/web-interface.md#create-a-graphrag-project) or
  [Project API](../../platform-suite/control-plane-acp.md#creating-a-project).
  This name is used as a prefix for all ArangoDB collections (for example, a
  project named `docs` creates `docs_Documents`, `docs_Chunks`, etc.)
- `chat_api_provider`: Set to `"openai"` for any OpenAI-compatible API
- `chat_api_url`: API endpoint URL for the chat/language model service
- `embedding_api_provider`: Set to `"openai"` for any OpenAI-compatible API
- `embedding_api_url`: API endpoint URL for the embedding model service
- `chat_model`: Specific language model to use for text generation and analysis
- `embedding_model`: Specific model to use for generating text embeddings
- `chat_api_key`: API key for authenticating with the chat/language model service
- `embedding_api_key`: API key for authenticating with the embedding model service
- `embedding_dim`: Optional embedding dimension. The default value is `512`
  (auto-set to `768` for `nomic-embed-text-v1`). Only set manually if using a
  custom embedding model with a different dimension. It must match the
  embedding model's output dimension.

{{< info >}}
When using the official OpenAI API, the service defaults to `gpt-5.4-nano` and 
`text-embedding-3-small` models. When an OpenRouter URL is detected, the
chat model defaults to `mistralai/mistral-nemo`.
{{< /info >}}

{{< tip >}}
Instead of inline API keys, you can use `chat_secret_profile_id` and
`embedding_secret_profile_id` when your platform supports secret profiles
for the Importer install.
{{< /tip >}}

### Using different OpenAI-compatible services

You can use different OpenAI-compatible services for chat and embedding. For example, 
you might use OpenRouter for chat and OpenAI for embeddings, depending 
on your needs for performance, cost, or model availability.

{{< info >}}
Both `chat_api_provider` and `embedding_api_provider` must be set to the same value 
(either both `"openai"` or both `"triton"`). You cannot mix Triton and OpenAI-compatible 
APIs. However, you can use different OpenAI-compatible services (like OpenRouter, OpenAI, 
Gemini, etc.) by setting both providers to `"openai"` and differentiating them with 
different URLs in `chat_api_url` and `embedding_api_url`.
{{< /info >}}

**Example using OpenRouter for chat and OpenAI for embedding:**

```json
{
  "env": {
    "db_name": "your_database_name",
    "project_name": "your_project_name",
    "chat_api_provider": "openai",
    "embedding_api_provider": "openai",
    "chat_api_url": "https://openrouter.ai/api/v1",
    "embedding_api_url": "https://api.openai.com/v1",
    "chat_model": "mistralai/mistral-nemo",
    "embedding_model": "text-embedding-3-small",
    "chat_api_key": "your_openrouter_api_key",
    "embedding_api_key": "your_openai_api_key",
    "embedding_dim": "512"
  }
}
```

The fields are the same as in the [example using OpenAI](#example-using-openai).
The difference is that `chat_api_url` and `embedding_api_url` point to different
OpenAI-compatible services (here, OpenRouter for chat and OpenAI for embedding),
each authenticated with its own API key.

### Using Azure as a chat and embedding provider

Models hosted on Azure (Azure OpenAI in Microsoft Foundry) expose an
OpenAI-compatible endpoint, so the Importer can use them through the same
`openai` provider. Two things are specific to Azure:

- Append `/openai/v1` to your Azure resource endpoint, for example
  `https://your-resource.cognitiveservices.azure.com/openai/v1/`. This is
  Azure's OpenAI-compatible v1 API, which removes the need for an
  `api-version` query parameter. See the
  [Azure v1 API documentation](https://learn.microsoft.com/en-us/azure/foundry/openai/api-version-lifecycle?view=foundry-classic&tabs=python#code-changes)
  for details.
- Keep `chat_api_provider` and `embedding_api_provider` set to `"openai"`.
  Azure is addressed as an OpenAI-compatible endpoint, not as a separate
  provider type.

Use the model deployment names from your Azure resource as `chat_model` and
`embedding_model`, and your Azure API keys as `chat_api_key` and
`embedding_api_key`.

```json
{
  "env": {
    "db_name": "your_database_name",
    "project_name": "your_project_name",
    "chat_api_provider": "openai",
    "embedding_api_provider": "openai",
    "chat_api_url": "https://your-resource.cognitiveservices.azure.com/openai/v1/",
    "embedding_api_url": "https://your-resource.cognitiveservices.azure.com/openai/v1/",
    "chat_model": "gpt-4.1-mini",
    "embedding_model": "text-embedding-3-small",
    "chat_api_key": "your_azure_api_key",
    "embedding_api_key": "your_azure_api_key",
    "embedding_dim": "512"
  }
}
```

## Using Triton Inference Server

The first step is to install the LLM Host service with the LLM and
embedding models of your choice. The setup will use the 
Triton Inference Server and MLflow at the backend. 
For more details, please refer to the [Triton Inference Server](../private-llms/triton-inference-server.md)
and [MLflow](../private-llms/mlflow.md) documentation.

Once the `llmhost` service is up-and-running, then you can start the Importer
service using the below configuration:

```json
{
  "env": {
    "db_name": "your_database_name",
    "project_name": "your_project_name",
    "chat_api_provider": "triton",
    "embedding_api_provider": "triton",
    "chat_api_url": "your-arangodb-llm-host-url",
    "embedding_api_url": "your-arangodb-llm-host-url",
    "chat_model": "mistral-nemo-instruct",
    "embedding_model": "nomic-embed-text-v1"
  }
}
```

The fields are the same as in the [example using OpenAI](#example-using-openai),
with these differences:
- `chat_api_provider` and `embedding_api_provider` are set to `"triton"` instead
  of `"openai"`.
- `chat_api_url` and `embedding_api_url` point to your ArangoDB LLM Host service.
- No API keys or `embedding_dim` are required.

## Token budget for chat models

The Importer maps a single completion cap to OpenAI-style chat calls
(`max_completion_tokens` for newer models that require it, `max_tokens` otherwise)
and derives an internal prompt-packing budget that GraphRAG uses when building
community reports. The values are auto-detected from the chat model name, so
common OpenAI models work without manual tuning. You can override them with the
following environment variables (also accepted as lower-case JSON keys in the
install request):

| Variable | Default | Purpose |
|----------|---------|---------|
| `CHAT_MAX_COMPLETION_TOKENS` | model-aware (`8192` fallback) | Maximum completion tokens requested per chat call. When unset, the Importer picks a value that fits the chat model's known context window — for example `2048` for `gpt-4` (8k), `768` for `gpt-3.5-turbo` (4k), `4096` for the 16k variants, and `8192` for `gpt-4o` / `gpt-4-turbo` / `gpt-5.4-nano` / `o1` / `o3` and unknown models. Lower it explicitly to leave more room for the prompt. |
| `CHAT_MODEL_CONTEXT_TOKENS` | model-aware | Approximate total context window for the chat model. When unset, the Importer falls back to a built-in mapping that covers the common OpenAI models (see below). Set this explicitly when using a model the Importer does not recognize, such as a private fine-tune. |
| `GRAPHRAG_LLM_PROMPT_TOKEN_BUDGET` | (unset) | Explicit prompt-packing description budget passed to GraphRAG as `best_model_max_token_size` and `cheap_model_max_token_size`. Overrides the value derived from `CHAT_MODEL_CONTEXT_TOKENS`. Useful for sparse graphs (short entity names, few relationships) where the conservative auto-derived budget is unnecessarily small. |

The built-in context-window mapping covers:

- `gpt-4o` / `gpt-4o-mini`, `gpt-4-turbo` / `gpt-4-1106` / `gpt-4-0125` / `gpt-4-vision`, `gpt-5.4-nano`, `o1-preview` / `o1-mini` → `128000`
- `o1` / `o3` / `o3-mini` → `200000`
- `gpt-4-32k` → `32768`
- `gpt-3.5-turbo-1106` / `gpt-3.5-turbo-0125` → `16385`
- `gpt-3.5-turbo-16k` → `16384`
- `gpt-4` → `8192`
- `gpt-3.5-turbo` → `4096`

Prefix-matching is longest-match-wins, so for example `gpt-4-32k` matches before
the generic `gpt-4` root.

{{< warning >}}
OpenAI has scheduled `gpt-4` for deprecation and shutdown on October 23, 2026.
Use `gpt-4o` or `gpt-4-turbo` for new deployments.
{{< /warning >}}

{{< info >}}
Independent of the static budget calculation, the Importer re-tokenizes the
actual rendered prompt right before every chat-completion call. If the request
would exceed the model's known context window, the user prompt is truncated with
`tiktoken` so the request always fits, the Importer logs a warning, and the job
continues rather than failing with `context_length_exceeded`. The guard is a
no-op for chat models the Importer does not recognize, so historical behavior is
preserved for custom or private fine-tunes.
{{< /info >}}

## OpenAI Responses API fallback

Some newer OpenAI model identifiers (for example `gpt-5.4-pro`, `o3-pro`) reject
`/v1/chat/completions` and require `/v1/responses`. The Importer detects these
errors automatically — matching phrasings such as *"not supported in the
v1/chat/completions"*, *"not a chat model"*, or an explicit `v1/responses` hint
— retries the call against `client.responses.create`, and caches the model name
so subsequent calls in the same process skip the failing chat-completion attempt.

Chat-shaped fields are mapped to Responses fields automatically:

- System prompts → `instructions`
- User turns → `input_text`
- Prior assistant turns → `output_text`
- `max_completion_tokens` / `max_tokens` → `max_output_tokens`
- `CHAT_REASONING_EFFORT` → `reasoning.effort`

No configuration is required. The official chart pins a compatible `openai`
Python package version, so the fallback is available out of the box.

## Error messages on graph build failure

When the OpenAI provider fails during graph build, the Importer maps common SDK
exceptions into concise remediation messages and stores them on the service
status and job metadata, so operators see actionable text instead of raw JSON
error bodies. Mapped errors include insufficient quota or billing, invalid API
key, rate limits, timeouts, 5xx server errors, and context-length exceeded.

The context-length message points at `CHAT_MAX_COMPLETION_TOKENS`,
`CHAT_MODEL_CONTEXT_TOKENS`, and `GRAPHRAG_LLM_PROMPT_TOKEN_BUDGET` (and the
equivalent lower-case install request keys) so you can adjust the budget without
diving into raw logs.

## Choosing the right deployment option

| Feature | OpenAI-compatible APIs | Triton Inference Server |
|---------|----------------------|------------------------|
| **Setup Complexity** | Simple | Moderate to complex |
| **Data Privacy** | Data sent to external services | Data stays in your infrastructure |
| **Model Selection** | Wide variety available | Limited to self-hosted models |
| **Maintenance** | Managed by provider | Self-managed |
| **Best For** | Quick prototyping, public data | Air-gapped environments, sensitive data |

## Next Steps

- [**Import your first document**](importing-files.md):
  Learn how to import files to build your knowledge graph.
- [**Explore all import parameters**](reference/parameters.md):
  Customize your import process.
- [**Enable semantic units**](semantic-units.md):
  Process images and multimedia content.
