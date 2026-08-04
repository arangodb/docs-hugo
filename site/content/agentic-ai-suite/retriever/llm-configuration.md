---
title: Configure LLMs and Embedding Models for the Retriever
menuTitle: LLM Configuration
description: >-
  Configure OpenAI-compatible APIs or Triton Inference Server for the Retriever service
weight: 20
---
{{< info >}}
**Getting Started Path:** [Overview](./) → **Configure LLMs** → [Search Methods](search-methods/_index.md) → [Execute Queries](executing-queries.md) → [Verify](verify-and-monitor.md)
{{< /info >}}

The Retriever service can be configured to use either Triton Inference Server or any
OpenAI-compatible API. That covers the OpenAI API itself, which is the recommended
setup, as well as any other endpoint implementing the same contract — OpenRouter,
Gemini, Anthropic, Azure, or a private corporate LLM.

"OpenAI-compatible" means the endpoint must implement the contract used by the
OpenAI Chat Completions client (`/v1/chat/completions`, and `/v1/embeddings` for
embedding models). An endpoint that exposes only a different API surface is not
supported.

## Supported models

The following models are validated for use with the Retriever service. For the full
list across all services, see
[Supported LLM and embedding models](../_index.md#supported-llm-and-embedding-models).

The recommended provider is `openai` with the OpenAI models below. That is the
combination ArangoDB tests, so prefer it where you can; other endpoints can
differ in behavior such as latency.

You can still point the Retriever at any other OpenAI-compatible endpoint —
OpenRouter, Google Gemini, Anthropic, Azure, or a corporate LLM — and run a model
that is not on the list. Configure these with the `custom` provider and the
`chat_api_url` / `embedding_api_url` of your endpoint, as described in
[Using OpenAI-compatible APIs](#using-openai-compatible-apis). Models beyond the
list below are outside ArangoDB's testing, so validate them in your own
environment. For the models served through Triton, see
[Using Triton Inference Server for chat and embedding](#using-triton-inference-server-for-chat-and-embedding).

{{% llm-models "retriever" %}}

## Supported Provider Combinations

The Retriever service supports the following provider configurations:

1. **OpenAI-compatible for Chat, OpenAI for Embeddings**: Use the OpenAI API
   (`openai`), or any other OpenAI-compatible endpoint (`custom`), for chat, and
   OpenAI for embeddings.
2. **Triton for Chat, Triton for Embeddings**: Use Triton for both chat and embeddings.

{{< warning >}}
Any other provider combinations will result in a configuration error. The system will reject invalid combinations.
{{< /warning >}}

**URL Defaults**: When using the `openai` provider, `chat_api_url` and `embedding_api_url` default to `"https://api.openai.com/v1"` if not specified. For the `custom` and `triton` providers, these URLs are required and must be explicitly provided.

**Model Defaults**:
The following default models are automatically applied when `chat_model` or `embedding_model` are not specified:

- **OpenAI**: `gpt-5.4-nano` for chat, `text-embedding-3-small` for embeddings
- **Triton**: `mistral-nemo-instruct` for chat, `nomic-embed-text-v1` for embeddings
- **Custom**: no defaults. Supply `chat_model` and `embedding_model` yourself;
  the service does not fall back to an OpenAI model name for a third-party
  endpoint.

{{< info >}}
These defaults are applied automatically by the service when the corresponding model parameters are not provided.
{{< /info >}}

{{< warning >}}
One URL-based special case survives in the Retriever: when `chat_api_url`
contains `openrouter.ai` and `chat_model` is not set, the service resolves the
chat model to `mistralai/mistral-nemo` rather than leaving it unset. Do not
rely on this — always set `chat_model` explicitly with the `custom` provider.
{{< /warning >}}

## Using OpenAI-compatible APIs

The Retriever reaches OpenAI-compatible APIs through two provider values:

- `openai` for the official OpenAI API. The URLs default to
  `https://api.openai.com/v1`, so you can omit them.
- `custom` for every other OpenAI-compatible endpoint, including OpenRouter,
  Google Gemini, Anthropic Claude, Azure (Azure OpenAI in Microsoft Foundry),
  and corporate or self-hosted LLMs. Set `chat_api_url` and `embedding_api_url`
  to your endpoint; they have no defaults under `custom`.

Pointing the `openai` provider at a non-OpenAI URL is **not supported**. Use
`custom` for those endpoints.

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

For a full description of all parameters, see
[Configuration Parameters Reference](#configuration-parameters-reference).

### Using different OpenAI-compatible services for chat and embedding

You can use different OpenAI-compatible services for chat and embedding. For example, 
you might use OpenRouter for chat and OpenAI for embeddings, depending 
on your needs for performance, cost, or model availability.

{{< info >}}
You cannot mix Triton with OpenAI-compatible APIs: if one of
`chat_api_provider` and `embedding_api_provider` is `"triton"`, both must be.
You can, however, combine `"openai"` and `"custom"`, which is how you serve
chat and embeddings from two different OpenAI-compatible services.
See [Supported Provider Combinations](#supported-provider-combinations) for details.
{{< /info >}}

**Example using OpenRouter for chat and OpenAI for embedding:**

```json
{
  "env": {
    "db_name": "your_database_name",
    "project_name": "your_project_name",
    "chat_api_provider": "custom",
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

For a full description of all parameters, see
[Configuration Parameters Reference](#configuration-parameters-reference).

### Using Azure as a chat and embedding provider

Models hosted on Azure (Azure OpenAI in Microsoft Foundry) expose an
OpenAI-compatible endpoint, so the Retriever reaches them through the `custom`
provider. Three things are specific to Azure:

- Provision the models yourself before you start. An Azure resource serves only
  the models you have explicitly deployed into it, so deploy both a chat model
  and an embedding model first. This is unlike an aggregator such as OpenRouter,
  which exposes a large catalog of models without you provisioning anything.
- Append `/openai/v1` to your Azure resource endpoint, for example
  `https://your-resource.cognitiveservices.azure.com/openai/v1/`. This is
  Azure's OpenAI-compatible v1 API, which removes the need for an
  `api-version` query parameter. See the
  [Azure v1 API documentation](https://learn.microsoft.com/en-us/azure/foundry/openai/api-version-lifecycle?view=foundry-classic&tabs=python#code-changes)
  for details.
- Set `chat_api_provider` and `embedding_api_provider` to `"custom"`. Azure is
  addressed as an OpenAI-compatible endpoint, not as a separate provider type.

Use the model deployment names from your Azure resource as `chat_model` and
`embedding_model`, and your Azure API keys as `chat_api_key` and
`embedding_api_key`.

```json
{
  "env": {
    "db_name": "your_database_name",
    "project_name": "your_project_name",
    "chat_api_provider": "custom",
    "embedding_api_provider": "custom",
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

For a full description of all parameters, see
[Configuration Parameters Reference](#configuration-parameters-reference).

## Using Triton Inference Server for chat and embedding

The first step is to install the LLM Host service with the LLM and
embedding models of your choice. The setup will use the 
Triton Inference Server and MLflow at the backend. 
For more details, please refer to the [Triton Inference Server](../private-llms/triton-inference-server.md)
and [MLflow](../private-llms/mlflow.md) documentation.

Once the `llmhost` service is up-and-running, then you can start the Retriever
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
    "embedding_model": "nomic-embed-text-v1",
    "embedding_dim": "768"
  }
}
```

For a full description of all parameters, see
[Configuration Parameters Reference](#configuration-parameters-reference).

## Configuration Parameters Reference

The following parameters are available when configuring the Retriever service.
Provider-specific defaults and requirements are noted where applicable.

### General parameters

- `db_name`: Name of the ArangoDB database where the knowledge graph will be stored.
- `project_name`: The project name created via the
  [web interface](../graphrag/web-interface.md#create-a-graphrag-project) or
  [Project API](../../platform-suite/control-plane-acp.md#creating-a-project).
  This name is used as a prefix for all ArangoDB collections (for example, a
  project named `docs` creates `docs_Documents`, `docs_Chunks`, etc.).

### Chat API parameters

- `chat_api_provider` (**required**): The provider for chat/LLM services.
  Set to `"openai"` for the OpenAI API, `"custom"` for any other
  OpenAI-compatible API, or `"triton"` for Triton Inference Server.
- `chat_api_url`: API endpoint URL for the chat/language model service.
  - **OpenAI**: Defaults to `https://api.openai.com/v1` if not provided.
  - **Custom**: Must be explicitly provided.
  - **Triton**: Must be explicitly provided.
- `chat_api_key` (**required for the `openai` and `custom` providers**): API key
  for authenticating with the chat/language model service.
- `chat_model`: Specific language model to use for text generation and analysis.
  - **OpenAI**: Defaults to `gpt-5.4-nano`.
  - **Custom**: Required; there is no default. The one exception is a
    `chat_api_url` containing `openrouter.ai`, which still resolves to
    `mistralai/mistral-nemo` when `chat_model` is unset — do not rely on it.
  - **Triton**: Defaults to `mistral-nemo-instruct`.

### Embedding API parameters

- `embedding_api_provider` (**required**): The provider for embedding services.
  Set to `"openai"` for the OpenAI API, `"custom"` for any other
  OpenAI-compatible API, or `"triton"` for Triton Inference Server.
- `embedding_api_url`: API endpoint URL for the embedding model service.
  - **OpenAI**: Defaults to `https://api.openai.com/v1` if not provided.
  - **Custom**: Must be explicitly provided.
  - **Triton**: Must be explicitly provided.
- `embedding_api_key` (**required for the `openai` and `custom` providers**): API key
  for authenticating with the embedding model service.
- `embedding_model`: Specific model to use for generating text embeddings.
  - **OpenAI**: Defaults to `text-embedding-3-small`.
  - **Custom**: Required; there is no default.
  - **Triton**: Defaults to `nomic-embed-text-v1`.
- `embedding_dim`: Optional embedding dimension. The default value is `512`
  (auto-set to `768` for `nomic-embed-text-v1`). Only set manually if using a
  custom embedding model with a different dimension. It must match the
  embedding model's output dimension.

{{< tip >}}
Instead of inline API keys, you can use `chat_secret_profile_id` and
`embedding_secret_profile_id` when your platform supports secret profiles
for the Retriever install.
{{< /tip >}}

{{< info >}}
An API key is required for both `openai` and `custom`. If your endpoint does
not authenticate — a self-hosted model, for example — supply a placeholder
value rather than omitting the key.
{{< /info >}}

## Chat payload compatibility

Set `chat_model` to the model your provider exposes. With the `openai` provider,
use one of the chat models in [Supported models](#supported-models) above, such
as `gpt-5.4-nano`, `gpt-5.4-mini`, or `gpt-5`. With the `custom` provider, your
endpoint may serve model families that are not in that table, including older
ones such as the GPT-4 series; the options below exist so you can match their
payload requirements. Different model families accept different optional fields
on chat completions. The Retriever builds the request from service environment
variables and retries once if the API returns an unsupported-parameter error.

Optional environment variables (also accepted in lowercase, e.g. `chat_parameter_policy`):

| Variable | Default | Purpose |
|----------|---------|---------|
| `CHAT_PARAMETER_POLICY` | `safe` | In `safe` mode, only baseline fields are sent unless you add overrides below. Use `legacy` when you want older behavior such as sending `temperature` where the code path supplies it. |
| `CHAT_TOKEN_LIMIT_PARAM` | `none` | One of `none`, `max_tokens`, `max_completion_tokens`, or `auto` (`auto` sends `max_completion_tokens`). Unrecognized values are ignored and no token limit is sent. A warning is logged when a limit was requested. |
| `CHAT_DISABLED_PARAMS` | (empty) | Comma-separated optional parameters to strip from the outgoing payload (for example `temperature,max_tokens,max_completion_tokens,reasoning_effort`). |
| `CHAT_EXTRA_PARAMS_JSON` | (empty) | JSON object merged into the chat request (for example `{"reasoning_effort":"low"}`). Invalid JSON is rejected at startup or when read. |
| `CHAT_REASONING_EFFORT` | (unset) | Shorthand to set `reasoning_effort` on models that support it. |

**GPT-4 series (typical usage):** Defaults (`safe`, no token limit param) work for many deployments. If you need explicit limits compatible with newer chat APIs, set `CHAT_TOKEN_LIMIT_PARAM` to `auto` or `max_completion_tokens` and, if required, `CHAT_PARAMETER_POLICY` to `legacy`.

**GPT-5 series (typical usage):** Start with defaults (`safe`, `CHAT_TOKEN_LIMIT_PARAM=none`). If the provider rejects specific fields, add them to `CHAT_DISABLED_PARAMS` or rely on the built-in unsupported-parameter retry. Tune latency for reasoning-capable models with `CHAT_REASONING_EFFORT` or `CHAT_EXTRA_PARAMS_JSON` per your provider's documentation.

{{< warning >}}
**Access errors:** Messages about organization verification or model access come from the provider account, not from the Retriever configuration.
{{< /warning >}}

**Defaults vs. older behavior:** With defaults (`safe`, `none` for token limit), requests omit `temperature` and omit a token-limit field unless you configure otherwise - by design for compatibility. To approximate prior behavior (temperature plus a completion token cap where the code supplies a limit), use `CHAT_PARAMETER_POLICY=legacy` and `CHAT_TOKEN_LIMIT_PARAM=auto` (or an explicit `max_*` mode).

**Per-process cache:** After a successful completion, the service remembers which optional parameters worked for each model name in the same process and reuses that shape on later calls. If the first success uses only `model` and `messages`, later calls for that model drop other optional keys until the process restarts. Streaming requests still pass `stream`.

## Configuration Validation

When configuring the service, ensure you:

1. **Use only supported provider combinations** listed above.
2. **Provide all required parameters**:
   - `chat_api_provider` and `embedding_api_provider` (both required)
   - `chat_api_url` and `embedding_api_url` (optional for `openai` with defaults, required for `custom` and `triton`)
   - `chat_api_key` and `embedding_api_key` (required for the `openai` and `custom` providers)
3. **Follow provider-specific requirements**:
   - The `openai` provider requires valid API keys
   - The `custom` provider requires valid API keys and explicit endpoint URLs
   - The `triton` provider requires valid server URLs

The service will validate your configuration and reject any unsupported combinations or missing required parameters with an error message.

## Next Steps

- [**Learn about search methods**](search-methods/_index.md):
  Understand Instant, Deep, Global, and Local search.
- [**Execute queries**](executing-queries.md):
  Start querying your knowledge graph.
- [**Explore all parameters**](parameters.md):
  Customize your queries.
