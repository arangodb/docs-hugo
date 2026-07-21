---
title: Configure the LLM provider
menuTitle: LLM Configuration
weight: 5
description: >-
  Configure the LLM provider and model that Ada uses for the current database
aliases:
  - /agentic-ai-suite/ada/configure-the-llm-provider/
---

Before using Ada you need to configure the LLM provider and model for the
current database.

1. Click the gear icon (⚙) in the top-right corner of the Ada panel to open the
   **Chat Settings** dialog.
2. Select a **Provider** from the dropdown. Supported options are **Anthropic**,
   **OpenAI**, **OpenRouter**, and **Custom Endpoint**.
3. Select a **Model**. The available options depend on the selected provider:
   - **OpenAI**: GPT-5.4, GPT-5.4 Mini, GPT-4.1 (default), GPT-4.1 Mini, o4-mini, and o3.
   - **Anthropic**: Claude Sonnet 4.6, Claude Opus 4.6, and Claude Haiku 4.5.
   - **OpenRouter**: Claude Sonnet 4.6, GPT-5.4, Gemini 3.1 Pro, Gemini 2.5 Pro,
     and Gemini 2.5 Flash.
   - **Custom Endpoint**: Enter the **Model ID** (for example, `claude-sonnet-4-6`)
     and a **Base URL** pointing to your OpenAI-compatible API endpoint.

   For the OpenAI, Anthropic, and OpenRouter providers, you can also enter a
   model identifier not listed in the dropdown using the **Use custom model ID**
   link below the model dropdown.
4. Select an **API Key** from the dropdown. Keys are managed in the
   [Secrets Manager](../../platform-suite/secrets-manager.md).
5. Click **Save**. The top bar updates to reflect the active configuration.

{{< tip >}}
Add your LLM provider API key in the [Secrets Manager](../../platform-suite/secrets-manager.md)
before configuring Ada.
{{< /tip >}}
