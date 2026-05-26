---
title: Configure LLMs and Embedding Models
menuTitle: LLM Configuration
description: >-
  Configure OpenAI-compatible APIs or Triton Inference Server for the Retriever service
weight: 20
---

{{< info >}}
**Getting Started Path:** [Overview](./) → **Configure LLMs** → [Search Methods](search-methods/_index.md) → [Execute Queries](executing-queries.md) → [Verify](verify-and-monitor.md)
{{< /info >}}

The Retriever service can be configured to use either Triton Inference Server or any 
OpenAI-compatible API. OpenAI-compatible APIs work with public providers (OpenAI, 
OpenRouter, Gemini, Anthropic) as well as private corporate LLMs that expose an 
OpenAI-compatible endpoint.

## Supported Provider Combinations

The Retriever service supports the following provider configurations:

1. **OpenAI/OpenAI-Compatible for Chat, OpenAI for Embeddings**: Use OpenAI API, OpenAI-compatible (such as OpenRouter) for chat, and OpenAI for embeddings:
   - OpenAI is detected when `chat_api_url` is `"https://api.openai.com/v1"` or not provided (defaults to OpenAI).
   - OpenRouter is detected when `chat_api_url` contains `"openrouter.ai"`.
   - Other OpenAI-compatible APIs are used when `chat_api_url` points to a compatible endpoint.
2. **Triton for Chat, Triton for Embeddings**: Use Triton for both chat and embeddings.

{{< warning >}}
Any other provider combinations will result in a configuration error. The system will reject invalid combinations.
{{< /warning >}}

**URL Defaults**: When using OpenAI provider, `chat_api_url` and `embedding_api_url` default to `"https://api.openai.com/v1"` if not specified. For Triton provider, these URLs are required and must be explicitly provided. For OpenAI-compatible APIs, you must explicitly provide the `chat_api_url` pointing to your compatible endpoint.

**Model Defaults**:
The following default models are automatically applied when `chat_model` or `embedding_model` are not specified:

- **OpenAI**: `gpt-5.4-nano` for chat, `text-embedding-3-small` for embeddings
- **OpenRouter**: `mistralai/mistral-nemo` for chat, `text-embedding-3-small` for embeddings (OpenRouter is detected via `chat_api_url` containing "openrouter.ai")
- **Triton**: `mistral-nemo-instruct` for chat, `nomic-embed-text-v1` for embeddings

{{< info >}}
These defaults are applied automatically by the service when the corresponding model parameters are not provided.
{{< /info >}}

## Using OpenAI-compatible APIs

The `openai` provider works with any OpenAI-compatible API, including:
- OpenAI (official API)
- OpenRouter
- Google Gemini
- Anthropic Claude
- Corporate or self-hosted LLMs with OpenAI-compatible endpoints

Set the `chat_api_url` and `embedding_api_url` to point to your provider's endpoint.

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
Both `chat_api_provider` and `embedding_api_provider` must be set to the same value 
(either both `"openai"` or both `"triton"`). You cannot mix Triton and OpenAI-compatible 
APIs. However, you can use different OpenAI-compatible services (like OpenRouter, OpenAI, 
Gemini, etc.) by setting both providers to `"openai"` and differentiating them with 
different URLs in `chat_api_url` and `embedding_api_url`.
See [Supported Provider Combinations](#supported-provider-combinations) for details.
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
  Set to `"openai"` for any OpenAI-compatible API, or `"triton"` for Triton
  Inference Server.
- `chat_api_url`: API endpoint URL for the chat/language model service.
  - **OpenAI**: Defaults to `https://api.openai.com/v1` if not provided.
  - **OpenRouter and other OpenAI-compatible APIs**: Must be explicitly provided.
    The service detects OpenRouter when this URL contains `openrouter.ai`.
  - **Triton**: Must be explicitly provided.
- `chat_api_key` (**required for OpenAI and OpenAI-compatible providers**): API key
  for authenticating with the chat/language model service.
- `chat_model`: Specific language model to use for text generation and analysis.
  - **OpenAI**: Defaults to `gpt-5.4-nano`.
  - **OpenRouter**: Defaults to `mistralai/mistral-nemo`.
  - **Other OpenAI-compatible APIs**: Defaults to `gpt-5.4-nano`.
  - **Triton**: Defaults to `mistral-nemo-instruct`.

### Embedding API parameters

- `embedding_api_provider` (**required**): The provider for embedding services.
  Set to `"openai"` for any OpenAI-compatible API, or `"triton"` for Triton
  Inference Server.
- `embedding_api_url`: API endpoint URL for the embedding model service.
  - **OpenAI**: Defaults to `https://api.openai.com/v1` if not provided.
  - **Triton**: Must be explicitly provided.
- `embedding_api_key` (**required for OpenAI and OpenAI-compatible providers**): API key
  for authenticating with the embedding model service.
- `embedding_model`: Specific model to use for generating text embeddings.
  - **OpenAI and OpenRouter**: Defaults to `text-embedding-3-small`.
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

## Chat payload compatibility

Set `chat_model` to the model your provider exposes (for example `gpt-5.4-nano`,
`gpt-5.4-mini`, `gpt-5.4`, `gpt-4.1`, `gpt-4o`, or other GPT-5 family names such
as `gpt-5`, `gpt-5-mini`, `gpt-5.1`). Different model families accept different optional fields on chat
completions. The Retriever builds the request from service environment variables
and retries once if the API returns an unsupported-parameter error.

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
   - `chat_api_url` and `embedding_api_url` (optional for OpenAI with defaults, required for Triton)
   - `chat_api_key` and `embedding_api_key` (required for OpenAI and OpenAI-compatible providers)
3. **Follow provider-specific requirements**:
   - OpenAI provider requires valid API keys
   - Triton provider requires valid server URLs

The service will validate your configuration and reject any unsupported combinations or missing required parameters with an error message.

## Next Steps

- [**Learn about search methods**](search-methods/_index.md):
  Understand Instant, Deep, Global, and Local search.
- [**Execute queries**](executing-queries.md):
  Start querying your knowledge graph.
- [**Explore all parameters**](parameters.md):
  Customize your queries.
