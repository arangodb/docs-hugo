---
title: Configure LLMs and Embedding Models
menuTitle: LLM Configuration
description: >-
  Configure OpenAI-compatible APIs or Triton Inference Server for the Retriever service
weight: 20
---

{{< info >}}
**Getting Started Path:** [Overview](./) → **Configure LLMs** → [Search Methods](search-methods.md) → [Execute Queries](executing-queries.md) → [Verify](verify-and-monitor.md)
{{< /info >}}

The Retriever service can be configured to use either Triton Inference Server or any 
OpenAI-compatible API. OpenAI-compatible APIs work with public providers (OpenAI, 
OpenRouter, Gemini, Anthropic) as well as private corporate LLMs that expose an 
OpenAI-compatible endpoint.

## Supported Provider Combinations

The Retriever service supports the following provider configurations:

- **OpenAI/OpenAI-compatible**: Use any OpenAI-compatible API (OpenAI, OpenRouter, 
  Gemini, Anthropic, etc.) for chat and OpenAI for embeddings
- **Triton**: Use Triton Inference Server for both chat and embeddings

{{< warning >}}
Other provider combinations are not supported and will result in a configuration error.
{{< /warning >}}

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
    "genai_project_name": "your_project_name",
    "chat_api_provider": "openai",
    "chat_api_url": "https://api.openai.com/v1",
    "embedding_api_provider": "openai",
    "embedding_api_url": "https://api.openai.com/v1",
    "chat_model": "gpt-4o",
    "embedding_model": "text-embedding-3-small",
    "chat_api_key": "your_openai_api_key",
    "embedding_api_key": "your_openai_api_key",
    "embedding_dim": "512"
  },
}
```

Where:
- `db_name`: Name of the ArangoDB database where the knowledge graph will be stored
- `genai_project_name`: The project name created via the [web interface](../../graphrag/web-interface.md#create-a-graphrag-project) or [Project API](../ai-orchestrator.md#creating-a-project). This name is used as a prefix for all ArangoDB collections (e.g., a project named docs creates docs_Documents, docs_Chunks, etc.)
- `chat_api_provider`: Set to `"openai"` for any OpenAI-compatible API
- `chat_api_url`: API endpoint URL for the chat/language model service. Defaults to `https://api.openai.com/v1` if not provided.
- `embedding_api_provider`: Set to `"openai"` for any OpenAI-compatible API.
- `embedding_api_url`: API endpoint URL for the embedding model service. Defaults to `https://api.openai.com/v1` if not provided.
- `chat_model`: Specific language model to use for text generation and analysis. Defaults to `gpt-4o` when using OpenAI.
- `embedding_model`: Specific model to use for generating text embeddings. Defaults to `text-embedding-3-small` when using OpenAI.
- `chat_api_key`: API key for authenticating with the chat/language model service.
- `embedding_api_key`: API key for authenticating with the embedding model service.
- `embedding_dim`: Optional embedding dimension. The default value is `512` (auto-set to `768` for `nomic-embed-text-v1`). Only set manually if using a custom embedding model with a different dimension. It must match the embedding model's output dimension.

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
{{< /info >}}

**Example using OpenRouter for chat and OpenAI for embedding:**

```json
    {
      "env": {
        "db_name": "your_database_name",
        "genai_project_name": "your_project_name",
        "chat_api_provider": "openai",
        "embedding_api_provider": "openai",
        "chat_api_url": "https://openrouter.ai/api/v1",
        "embedding_api_url": "https://api.openai.com/v1",
        "chat_model": "mistral-nemo",
        "embedding_model": "text-embedding-3-small",
        "chat_api_key": "your_openrouter_api_key",
        "embedding_api_key": "your_openai_api_key",
        "embedding_dim": "512"
      },
    }
```

Where:
- `db_name`: Name of the ArangoDB database where the knowledge graph is stored
- `genai_project_name`: The project name created via the [web interface](../../graphrag/web-interface.md#create-a-graphrag-project) or [Project API](../ai-orchestrator.md#creating-a-project). This name is used as a prefix for all ArangoDB collections (e.g., a project named docs creates docs_Documents, docs_Chunks, etc.).
- `chat_api_provider`: Set to `"openai"` for any OpenAI-compatible API.
- `chat_api_url`: API endpoint URL for the chat/language model service. Must be explicitly provided for OpenRouter and other OpenAI-compatible APIs. The service detects OpenRouter when this URL contains `openrouter.ai`.
- `embedding_api_provider`: Set to `"openai"` for any OpenAI-compatible API.
- `embedding_api_url`: API endpoint URL for the embedding model service. Defaults to `https://api.openai.com/v1` if not provided.
- `chat_model`: Specific language model to use for text generation and analysis. Defaults to `mistralai/mistral-nemo` for OpenRouter or `gpt-4o` for other OpenAI-compatible APIs.
- `embedding_model`: Specific model to use for generating text embeddings. Defaults to `text-embedding-3-small`.
- `chat_api_key`: API key for authenticating with the chat/language model service.
- `embedding_api_key`: API key for authenticating with the embedding model service.
- `embedding_dim`: Optional embedding dimension. The default value is `512` (auto-set to `768` for `nomic-embed-text-v1`). Only set manually if using a custom embedding model with a different dimension. It must match the embedding model's output dimension.

## Using Triton Inference Server for chat and embedding

The first step is to install the LLM Host service with the LLM and
embedding models of your choice. The setup will use the 
Triton Inference Server and MLflow at the backend. 
For more details, please refer to the [Triton Inference Server](../triton-inference-server.md)
and [MLflow](../mlflow.md) documentation.

Once the `llmhost` service is up-and-running, then you can start the Retriever
service using the below configuration:

```json
{
  "env": {
    "db_name": "your_database_name",
    "genai_project_name": "your_project_name",
    "chat_api_provider": "triton",
    "embedding_api_provider": "triton",
    "chat_api_url": "your-arangodb-llm-host-url",
    "embedding_api_url": "your-arangodb-llm-host-url",
    "chat_model": "mistral-nemo-instruct",
    "embedding_model": "nomic-embed-text-v1",
    "embedding_dim": "768"
  },
}
```

Where:
- `db_name`: Name of the ArangoDB database where the knowledge graph will be stored
- `genai_project_name`: The project name created via the [web interface](../../graphrag/web-interface.md#create-a-graphrag-project) or [Project API](../ai-orchestrator.md#creating-a-project). This name is used as a prefix for all ArangoDB collections (e.g., a project named docs creates docs_Documents, docs_Chunks, etc.)
- `chat_api_provider`: Set to `"triton"` to use Triton Inference Server for language model services.
- `embedding_api_provider`: Set to `"triton"` to use Triton Inference Server for embedding model services.
- `chat_api_url`: API endpoint URL for the chat/language model service. Must be explicitly provided when using Triton.
- `embedding_api_url`: API endpoint URL for the embedding model service. Must be explicitly provided when using Triton.
- `chat_model`: Specific language model to use for text generation and analysis. Defaults to `mistral-nemo-instruct` for Triton.
- `embedding_model`: Specific model to use for generating text embeddings. Defaults to `nomic-embed-text-v1` for Triton.
- `embedding_dim`: Optional embedding dimension. The default value is `512` (auto-set to `768` for `nomic-embed-text-v1`). Only set manually if using a custom embedding model with a different dimension. It must match the embedding model's output dimension.

## Next Steps

- **[Learn about search methods](search-methods.md)**: Understand Instant, Deep, Global, and Local search.
- **[Execute queries](executing-queries.md)**: Start querying your knowledge graph.
- **[Explore all parameters](parameters.md)**: Customize your queries.