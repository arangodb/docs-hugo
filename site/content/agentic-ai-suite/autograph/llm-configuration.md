---
title: Configure LLMs and Embedding Models in AutoGraph
menuTitle: LLM Configuration
description: >-
  Configure OpenAI-compatible APIs or Triton Inference Server for the chat and
  embedding models AutoGraph uses
weight: 28
---
AutoGraph uses two kinds of models:

- A **chat (LLM) model**, used by the
  [RAG Strategizer](reference/rag-strategizer.md) to generate the per-cluster
  ontology (the entity types for each domain).
- An **embedding model**, used during the
  [corpus build](reference/corpus-build.md) to embed documents for similarity
  and clustering, and by the [embed-field endpoint](reference/embeddings.md).

Each model can be backed by either any OpenAI-compatible API or a Triton
Inference Server. That covers the OpenAI API itself, which is the recommended
setup, as well as any other endpoint implementing the same contract — OpenRouter,
Gemini, Anthropic, or a private corporate LLM.

"OpenAI-compatible" means the endpoint must implement the contract used by the
OpenAI Chat Completions client (`/v1/chat/completions`, and `/v1/embeddings` for
embedding models). An endpoint that exposes only a different API surface is not
supported. Some newer OpenAI models require the Responses API (`/v1/responses`)
instead; AutoGraph detects this and falls back automatically (see
[Chat payload compatibility](#chat-payload-compatibility)).

## Supported models

The following models are validated for use with the AutoGraph service. For the full
list across all services, see
[Supported LLM and embedding models](../_index.md#supported-llm-and-embedding-models).

The recommended provider is `openai` with the OpenAI models below. That is the
combination ArangoDB tests, so prefer it where you can; other endpoints can
differ in behavior such as latency.

You can still point AutoGraph at any other OpenAI-compatible endpoint —
OpenRouter, Google Gemini, Anthropic, Azure, or a corporate LLM — and run a model
that is not on the list. Configure these with the `custom` provider and the
`chat_api_url` / `embedding_api_url` of your endpoint, as described in
[Using OpenAI-compatible APIs](#using-openai-compatible-apis). Models beyond the
list below are outside ArangoDB's testing, so validate them in your own
environment. For the models served through Triton, see
[Using Triton Inference Server](#using-triton-inference-server).

{{% llm-models "autograph" %}}

## Supported providers

For both the chat model and the embedding model, AutoGraph supports three
provider values:

- `openai`: the OpenAI API itself.
- `custom`: any other OpenAI-compatible API, such as OpenRouter, Google Gemini,
  Anthropic, Azure, or a corporate LLM.
- `triton`: a Triton Inference Server.

The chat provider (`chat_api_provider`) and the embedding provider
(`embedding_api_provider`) are configured **independently**: AutoGraph does not
require them to match. In most deployments both are set to the same value
(typically `openai`). Mixing providers (for example, `openai` for chat and
`triton` for embeddings) is not rejected, but it is not a routinely tested
combination, so validate it in your environment before relying on it.

{{< info >}}
Any value other than `openai`, `custom`, or `triton` for `chat_api_provider` or
`embedding_api_provider` is rejected with a configuration error.
{{< /info >}}

**URL defaults**: When a provider is set to `openai`, `chat_api_url` and
`embedding_api_url` default to `https://api.openai.com/v1` if not specified.
For `triton`, these URLs are required and must be provided explicitly.

**Model defaults**: The following default models are applied automatically when
`chat_model` or `embedding_model_name` are not specified:

| Provider | Chat model (`chat_model`) | Embedding model (`embedding_model_name`) |
|----------|---------------------------|------------------------------------------|
| `openai` | `gpt-5.4-nano` | `text-embedding-3-small` |
| `custom` | `gpt-5.4-nano` | `text-embedding-3-small` |
| `triton` | required, no default | `nomic-embed-text-v1` |

{{< warning >}}
AutoGraph applies the OpenAI defaults to the `custom` provider as well: if you
set `chat_api_provider` or `embedding_api_provider` to `custom` and leave the
model or the URL unset, AutoGraph falls back to `gpt-5.4-nano`,
`text-embedding-3-small`, and `https://api.openai.com/v1` — sending your
requests to OpenAI rather than to your own endpoint. Always set
`chat_api_url` / `embedding_api_url` and the model names explicitly with
`custom`. Note that the Importer behaves differently and has no model default
for `custom`.
{{< /warning >}}

{{< info >}}
For the `triton` chat provider, `chat_model` is required; there is no default.
The embedding dimension defaults to `512` and must match your embedding
model's output dimension. The default Triton embedding model
`nomic-embed-text-v1` produces 768-dimensional vectors, so set
`embedding_dimensions` to `768` for that model. Always match the embedding
dimension to your model's output when configuring Triton embeddings.
{{< /info >}}

## Using OpenAI-compatible APIs

AutoGraph reaches OpenAI-compatible APIs through two provider values:

- `openai` for the official OpenAI API. The URLs default to
  `https://api.openai.com/v1`, so you can omit them.
- `custom` for every other OpenAI-compatible endpoint, including OpenRouter,
  Google Gemini, Anthropic Claude, Azure, and corporate or self-hosted LLMs.
  Always set `chat_api_url` and `embedding_api_url` to your endpoint: AutoGraph
  otherwise falls back to the OpenAI URL, silently sending requests to OpenAI.

Pointing the `openai` provider at a non-OpenAI URL is **not supported**. Use
`custom` for those endpoints.

### Example using OpenAI

```json
{
  "env": {
    "db_name": "your_database_name",
    "genai_project_name": "your_project_name",
    "chat_api_provider": "openai",
    "chat_api_url": "https://api.openai.com/v1",
    "chat_model": "gpt-5.4-nano",
    "chat_api_key": "your_openai_api_key",
    "embedding_api_provider": "openai",
    "embedding_api_url": "https://api.openai.com/v1",
    "embedding_model_name": "text-embedding-3-small",
    "embedding_api_key": "your_openai_api_key",
    "embedding_dimensions": "512"
  }
}
```

For a full description of all parameters, see
[Chat and Embedding Parameters](#chat-and-embedding-parameters).

### Using different OpenAI-compatible services for chat and embedding

You can use different OpenAI-compatible services for chat and embedding. For
example, you might use OpenRouter for chat and OpenAI for embeddings, depending
on your needs for performance, cost, or model availability. Because the two
providers are configured independently, set `chat_api_provider` to `custom`
with the OpenRouter URL and leave `embedding_api_provider` on `openai`.

```json
{
  "env": {
    "db_name": "your_database_name",
    "genai_project_name": "your_project_name",
    "chat_api_provider": "custom",
    "chat_api_url": "https://openrouter.ai/api/v1",
    "chat_model": "mistralai/mistral-nemo",
    "chat_api_key": "your_openrouter_api_key",
    "embedding_api_provider": "openai",
    "embedding_api_url": "https://api.openai.com/v1",
    "embedding_model_name": "text-embedding-3-small",
    "embedding_api_key": "your_openai_api_key",
    "embedding_dimensions": "512"
  }
}
```

For a full description of all parameters, see
[Chat and Embedding Parameters](#chat-and-embedding-parameters).

## Using Triton Inference Server

The first step is to install the LLM Host service with the LLM and embedding
models of your choice. The setup uses the Triton Inference Server and MLflow at
the backend. For more details, see the
[Triton Inference Server](../private-llms/triton-inference-server.md) and
[MLflow](../private-llms/mlflow.md) documentation.

Once the `llmhost` service is up and running, configure AutoGraph to use it for
chat, embeddings, or both. The `chat_api_url` and `embedding_api_url` are
required for Triton, and `chat_model` is required for the Triton chat provider.

```json
{
  "env": {
    "db_name": "your_database_name",
    "genai_project_name": "your_project_name",
    "chat_api_provider": "triton",
    "chat_api_url": "your-arangodb-llm-host-url",
    "chat_model": "mistral-nemo-instruct",
    "embedding_api_provider": "triton",
    "embedding_api_url": "your-arangodb-llm-host-url",
    "embedding_model_name": "nomic-embed-text-v1",
    "embedding_dimensions": "768"
  }
}
```

For a full description of all parameters, see
[Chat and Embedding Parameters](#chat-and-embedding-parameters).

### Mixing providers

Because the chat and embedding providers are configured independently, nothing
prevents you from mixing them. The example below uses an OpenAI-compatible API
for chat and a Triton Inference Server for embeddings. This combination is not
routinely tested, so verify it works in your environment before relying on it.

```json
{
  "env": {
    "db_name": "your_database_name",
    "genai_project_name": "your_project_name",
    "chat_api_provider": "openai",
    "chat_api_url": "https://api.openai.com/v1",
    "chat_model": "gpt-5.4-nano",
    "chat_api_key": "your_openai_api_key",
    "embedding_api_provider": "triton",
    "embedding_api_url": "your-arangodb-llm-host-url",
    "embedding_model_name": "nomic-embed-text-v1",
    "embedding_dimensions": "768"
  }
}
```

## Chat and Embedding Parameters

This reference section covers the chat and embedding model parameters.
Provider-specific defaults and requirements are noted where applicable.
Parameter names are also accepted in uppercase (for example, `CHAT_API_URL`).

### General parameters

- `db_name` (**required**): Name of the ArangoDB database where the corpus
  graph and knowledge graph are stored.
- `genai_project_name` (**required**): The project name, used as a prefix for
  all ArangoDB collections (for example, a project named `docs` creates
  `docs_sources`, `docs_domains`, `docs_CorpusGraph`, and so on). Set it to the
  same name you chose when creating the project via the
  [web interface](web-interface.md) or the
  [Project API](../../platform-suite/control-plane-acp.md#creating-a-project).
  The Project API names this field `project_name`; the AutoGraph install
  request uses `genai_project_name` for the same value.

### Chat API parameters

- `chat_api_provider` (**required**): The provider for the chat/LLM model. Set
  to `openai` for the OpenAI API, `custom` for any other OpenAI-compatible API,
  or `triton` for Triton Inference Server.
- `chat_api_url`: API endpoint URL for the chat model.
  - **OpenAI**: Defaults to `https://api.openai.com/v1` if not provided.
  - **Custom**: Set it explicitly. AutoGraph falls back to
    `https://api.openai.com/v1` when it is omitted, which sends requests to
    OpenAI instead of your endpoint.
  - **Triton**: Must be provided explicitly.
- `chat_api_key` (**required for the `openai` and `custom` providers**): API key
  for authenticating with the chat model. Alternatively, use
  `chat_secret_profile_id`.
- `chat_model`: Language model used for ontology generation and analysis.
  - **OpenAI**: Defaults to `gpt-5.4-nano`.
  - **Custom**: Also defaults to `gpt-5.4-nano`; set it explicitly to a model
    your endpoint exposes.
  - **Triton**: Required; there is no default.

### Embedding API parameters

- `embedding_api_provider` (**required**): The provider for the embedding
  model. Set to `openai` for the OpenAI API, `custom` for any other
  OpenAI-compatible API, or `triton` for Triton Inference Server.
- `embedding_api_url`: API endpoint URL for the embedding model.
  - **OpenAI**: Defaults to `https://api.openai.com/v1` if not provided.
  - **Custom**: Set it explicitly. AutoGraph falls back to
    `https://api.openai.com/v1` when it is omitted, which sends requests to
    OpenAI instead of your endpoint.
  - **Triton**: Must be provided explicitly.
- `embedding_api_key` (**required for the `openai` and `custom` providers**):
  API key for authenticating with the embedding model. Alternatively, use
  `embedding_secret_profile_id`.
- `embedding_model_name`: Model used to generate text embeddings.
  - **OpenAI**: Defaults to `text-embedding-3-small`.
  - **Custom**: Also defaults to `text-embedding-3-small`; set it explicitly to
    a model your endpoint exposes.
  - **Triton**: Defaults to `nomic-embed-text-v1`.
- `embedding_dimensions`: Embedding dimension. Defaults to `512`. It must match
  the embedding model's output dimension; set it explicitly when using a model
  with a different dimension. For example, the default Triton embedding model
  `nomic-embed-text-v1` produces 768-dimensional vectors, so set this to `768`
  for that model. Always match the embedding dimension to your model's output
  when configuring Triton embeddings.
- `embedding_api_keys`: Optional comma-separated list of OpenAI-compatible API
  keys. When more than one key is provided, AutoGraph rotates across them in a
  round-robin pool to increase the effective rate limit. Falls back to
  `embedding_api_key` when not set.
- `embedding_input_type`: Optional input type (for example, `passage` or
  `query`) required by some providers, such as NVIDIA models.
- `disabled_params`: Optional JSON array of embedding parameters to strip from
  outgoing embedding requests, for example `["dimensions"]`. This applies to
  embedding calls only, not chat.

### Advanced parameters

- `OPENAI_MAX_RETRIES`: Maximum retries on the OpenAI-compatible HTTP client
  for chat. Defaults to `6`.
- `TRITON_TIMEOUT`: Request timeout in seconds for the Triton chat provider.
  Defaults to `300`.

{{< tip >}}
Instead of inline API keys, you can use `chat_secret_profile_id` and
`embedding_secret_profile_id`. These secret profile IDs are resolved to API
keys at startup and held in memory only; they are never written to environment
variables, files, or logs.
{{< /tip >}}

{{< info >}}
An API key is required for both `openai` and `custom`. If your endpoint does
not authenticate — a self-hosted model, for example — supply a placeholder
value rather than omitting the key.
{{< /info >}}

## Chat payload compatibility

These options apply when `chat_api_provider` is `openai` or `custom`, not for
`triton`. OpenAI-style
chat requests (used by the RAG Strategizer) are built from environment
variables, with a one-shot retry when the API rejects an optional parameter,
per-model caching of the working parameter shape within the process, and a
Responses API fallback when a model rejects `/v1/chat/completions`.

Set `chat_model` to the model your provider exposes. With the `openai` provider,
use one of the chat models in [Supported models](#supported-models) above, such
as `gpt-5.4-nano`, `gpt-5.4-mini`, or `gpt-5`. With the `custom` provider, your
endpoint may serve model families that are not in that table, including older
ones such as the GPT-4 series; the options below exist so you can match their
payload requirements. Different model families accept different optional fields
on chat completions.

Optional parameters (also accepted in uppercase, for example
`CHAT_PARAMETER_POLICY`):

| Parameter | Default | Purpose |
|-----------|---------|---------|
| `chat_parameter_policy` | `safe` | In `safe` mode, only baseline fields are sent unless you add overrides below. Use `legacy` for older behavior, such as sending `temperature` where the code path supplies it. |
| `chat_token_limit_param` | `auto` | One of `none`, `max_tokens`, `max_completion_tokens`, or `auto` (`auto` sends `max_completion_tokens` when a limit is supplied). Unrecognized values are ignored and no token limit is sent. |
| `chat_disabled_params` | (empty) | Comma-separated optional parameters to strip from the chat payload (for example `temperature,max_tokens,reasoning_effort`). |
| `chat_extra_params_json` | (empty) | JSON object merged into the chat request (for example `{"reasoning_effort":"low"}`). Invalid JSON is rejected. |
| `chat_reasoning_effort` | (unset) | Shorthand to set `reasoning_effort` on models that support it. |

{{< info >}}
For embedding requests, use `disabled_params` to suppress parameters; the
`chat_disabled_params` option applies to chat only.
{{< /info >}}

{{< warning >}}
**Access errors**: Messages about organization verification or model access
come from the provider account, not from the AutoGraph configuration.
{{< /warning >}}

## Configuration Validation

When configuring AutoGraph, ensure you:

1. **Use a supported provider** for each model: `chat_api_provider` and
   `embedding_api_provider` must each be `openai`, `custom`, or `triton`. They
   are independent and do not need to match.
2. **Provide all required parameters**:
   - `chat_api_provider` and `embedding_api_provider` (both required).
   - `chat_api_key` and `embedding_api_key` (required for the `openai` and
     `custom` providers, or supply the corresponding secret profile ID).
   - `chat_api_url` and `embedding_api_url` (optional for `openai` and
     `custom`, which both fall back to the OpenAI URL, but always set them for
     `custom`; required for `triton`).
   - `chat_model` (required for the `triton` chat provider).
3. **Follow provider-specific requirements**:
   - The `openai` provider requires valid API keys.
   - The `custom` provider requires valid API keys, and you should always set
     the endpoint URLs and model names rather than rely on the OpenAI
     fallbacks.
   - The `triton` provider requires valid server URLs.

AutoGraph validates your configuration at startup and rejects an unsupported
provider or a missing required parameter with an error message.

## Next Steps

- [**Build a corpus**](reference/corpus-build.md): Generate document embeddings
  and similarity edges.
- [**Run the RAG Strategizer**](reference/rag-strategizer.md): Assign retrieval
  strategies and generate per-cluster ontologies with the chat model.
- [**Embed a field**](reference/embeddings.md): Add embeddings to an existing
  ArangoDB collection.