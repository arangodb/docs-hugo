---
title: Configure LLMs and Embedding Models
menuTitle: LLM Configuration
description: >-
  Configure OpenAI-compatible APIs or Triton Inference Server for the Importer service
weight: 20
---

{{< info >}}
**Getting Started Path:** [Overview](./) → **Configure LLMs** → [Import Files](importing-files.md) → [Semantic Units](semantic-units.md) (optional) → [Verify Results](verify-and-explore.md)
{{< /info >}}

The Importer service can be configured to use either Triton Inference Server or any
OpenAI-compatible API. OpenAI-compatible APIs work with public providers (OpenAI,
OpenRouter, Gemini, Anthropic) as well as private corporate LLMs that expose an
OpenAI-compatible endpoint.

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
- `genai_project_name`: Name of the AI project
- `chat_api_provider`: Set to `"openai"` for any OpenAI-compatible API
- `chat_api_url`: API endpoint URL for the chat/language model service
- `embedding_api_provider`: Set to `"openai"` for any OpenAI-compatible API
- `embedding_api_url`: API endpoint URL for the embedding model service
- `chat_model`: Specific language model to use for text generation and analysis
- `embedding_model`: Specific model to use for generating text embeddings
- `chat_api_key`: API key for authenticating with the chat/language model service
- `embedding_api_key`: API key for authenticating with the embedding model service
- `embedding_dim`: Optional embedding dimension 

{{< info >}}
When using the official OpenAI API, the service defaults to `gpt-4o` and 
`text-embedding-3-small` models.
{{< /info >}}

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
- `genai_project_name`: Name of the AI project
- `chat_api_provider`: Set to `"openai"` for any OpenAI-compatible API
- `chat_api_url`: API endpoint URL for the chat/language model service (in this example, OpenRouter)
- `embedding_api_provider`: Set to `"openai"` for any OpenAI-compatible API
- `embedding_api_url`: API endpoint URL for the embedding model service (in this example, OpenAI)
- `chat_model`: Specific language model to use for text generation and analysis
- `embedding_model`: Specific model to use for generating text embeddings
- `chat_api_key`: API key for authenticating with the chat/language model service
- `embedding_api_key`: API key for authenticating with the embedding model service
- `embedding_dim`: Optional embedding dimension 

## Using Triton Inference Server

The first step is to install the LLM Host service with the LLM and
embedding models of your choice. The setup will use the 
Triton Inference Server and MLflow at the backend. 
For more details, please refer to the [Triton Inference Server](../triton-inference-server.md)
and [MLflow](../mlflow.md) documentation.

Once the `llmhost` service is up-and-running, then you can start the Importer
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
    "embedding_model": "nomic-embed-text-v1"
  },
}
```

Where:
- `db_name`: Name of the ArangoDB database where the knowledge graph will be stored
- `genai_project_name`: Name of the AI project
- `chat_api_provider`: Specifies which LLM provider to use for language model services
- `embedding_api_provider`: API provider for embedding model services (e.g., "triton")
- `chat_api_url`: API endpoint URL for the chat/language model service
- `embedding_api_url`: API endpoint URL for the embedding model service
- `chat_model`: Specific language model to use for text generation and analysis
- `embedding_model`: Specific model to use for generating text embeddings

## Choosing the right deployment option

| Feature | OpenAI-compatible APIs | Triton Inference Server |
|---------|----------------------|------------------------|
| **Setup Complexity** | Simple | Moderate to complex |
| **Data Privacy** | Data sent to external services | Data stays in your infrastructure |
| **Model Selection** | Wide variety available | Limited to self-hosted models |
| **Maintenance** | Managed by provider | Self-managed |
| **Best For** | Quick prototyping, public data | Air-gapped environments, sensitive data |

## Next Steps

- **[Import your first document](importing-files.md)**: Learn how to import files to build your knowledge graph.
- **[Explore all import parameters](parameters.md)**: Customize your import process.
- **[Enable semantic units](semantic-units.md)**: Process images and multimedia content.