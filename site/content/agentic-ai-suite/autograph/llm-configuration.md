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
Inference Server. OpenAI-compatible APIs work with public providers (OpenAI,
OpenRouter, Gemini, Anthropic) as well as private corporate LLMs that expose an
OpenAI-compatible endpoint.

## Supported providers

For both the chat model and the embedding model, AutoGraph supports two
provider values:

- `openai`: any OpenAI-compatible API.
- `triton`: a Triton Inference Server.

The chat provider (`chat_api_provider`) and the embedding provider
(`embedding_api_provider`) are configured **independently**: AutoGraph does not
require them to match. In most deployments both are set to the same value
(typically `openai`). Mixing providers (for example, `openai` for chat and
`triton` for embeddings) is not rejected, but it is not a routinely tested
combination, so validate it in your environment before relying on it.

{{< info >}}
Any value other than `openai` or `triton` for `chat_api_provider` or
`embedding_api_provider` is rejected with a configuration error.
{{< /info >}}

**URL defaults**: When a provider is set to `openai`, `chat_api_url` and
`embedding_api_url` default to `https://api.openai.com/v1` if not specified.
For `triton`, these URLs are required and must be provided explicitly. For
other OpenAI-compatible APIs (OpenRouter and so on), you must provide the
corresponding URL pointing to your endpoint.

**Model defaults**: The following default models are applied automatically when
`chat_model` or `embedding_model_name` are not specified:

| Provider | Chat model (`chat_model`) | Embedding model (`embedding_model_name`) |
|----------|---------------------------|------------------------------------------|
| `openai` | `gpt-5.4-nano` | `text-embedding-3-small` |
| `triton` | required, no default | `nomic-embed-text-v1` |

{{< info >}}
For the `triton` chat provider, `chat_model` is required; there is no default.
The embedding dimension defaults to `512` and must match your embedding
model's output dimension. The default Triton embedding model
`nomic-embed-text-v1` produces 768-dimensional vectors, so set
`embedding_dimensions` to `768` for that model. Always match the embedding
dimension to your model's output when configuring Triton embeddings.
{{< /info >}}

## Using OpenAI-compatible APIs

The `openai` provider works with any OpenAI-compatible API, including:

- OpenAI (official API)
- OpenRouter
- Google Gemini
- Anthropic Claude
- Corporate or self-hosted LLMs with OpenAI-compatible endpoints

Set `chat_api_url` and `embedding_api_url` to point to your provider's
endpoint.

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
on your needs for performance, cost, or model availability. Keep both
providers set to `openai` and differentiate them with different URLs in
`chat_api_url` and `embedding_api_url`.

```json
{
  "env": {
    "db_name": "your_database_name",
    "genai_project_name": "your_project_name",
    "chat_api_provider": "openai",
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
  to `openai` for any OpenAI-compatible API, or `triton` for Triton Inference
  Server.
- `chat_api_url`: API endpoint URL for the chat model.
  - **OpenAI**: Defaults to `https://api.openai.com/v1` if not provided.
  - **OpenRouter and other OpenAI-compatible APIs**: Must be provided
    explicitly.
  - **Triton**: Must be provided explicitly.
- `chat_api_key` (**required for the `openai` provider**): API key for
  authenticating with the chat model. Alternatively, use
  `chat_secret_profile_id`.
- `chat_model`: Language model used for ontology generation and analysis.
  - **OpenAI**: Defaults to `gpt-5.4-nano`.
  - **Triton**: Required; there is no default.

### Embedding API parameters

- `embedding_api_provider` (**required**): The provider for the embedding
  model. Set to `openai` for any OpenAI-compatible API, or `triton` for Triton
  Inference Server.
- `embedding_api_url`: API endpoint URL for the embedding model.
  - **OpenAI**: Defaults to `https://api.openai.com/v1` if not provided.
  - **Triton**: Must be provided explicitly.
- `embedding_api_key` (**required for the `openai` provider**): API key for
  authenticating with the embedding model. Alternatively, use
  `embedding_secret_profile_id`.
- `embedding_model_name`: Model used to generate text embeddings.
  - **OpenAI**: Defaults to `text-embedding-3-small`.
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

## Chat payload compatibility

These options apply only when `chat_api_provider` is `openai`. OpenAI-style
chat requests (used by the RAG Strategizer) are built from environment
variables, with a one-shot retry when the API rejects an optional parameter,
per-model caching of the working parameter shape within the process, and a
Responses API fallback when a model rejects `/v1/chat/completions`.

Set `chat_model` to the model your provider exposes (for example
`gpt-5.4-nano`, `gpt-5.4-mini`, `gpt-4.1`, `gpt-4o`, or other GPT-5 family
names). Different model families accept different optional fields on chat
completions.

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
   `embedding_api_provider` must each be `openai` or `triton`. They are
   independent and do not need to match.
2. **Provide all required parameters**:
   - `chat_api_provider` and `embedding_api_provider` (both required).
   - `chat_api_key` and `embedding_api_key` (required for the `openai`
     provider, or supply the corresponding secret profile ID).
   - `chat_api_url` and `embedding_api_url` (optional for `openai` with
     defaults, required for `triton`).
   - `chat_model` (required for the `triton` chat provider).
3. **Follow provider-specific requirements**:
   - The `openai` provider requires valid API keys.
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