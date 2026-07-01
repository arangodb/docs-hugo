---
title: Ada Quick Start
menuTitle: Quick Start
weight: 2
description: >-
  Configure Ada and get your first natural language answer from your database
  in four steps
---

{{< steps >}}

{{< step "Add your LLM API key" >}}
Store your provider API key (Anthropic, OpenAI, OpenRouter, or a custom
endpoint) in the [Secrets Manager](../../platform-suite/secrets-manager.md)
before configuring Ada.
{{< /step >}}

{{< step "Open Ada" >}}
Select your database in the database selector, then open **Ada** from the
left sidebar.
{{< /step >}}

{{< step "Configure the LLM provider" >}}
Click the gear icon (⚙) in the top-right corner, choose your **Provider**,
**Model**, and **API Key**, and click **Save**. The top bar updates to show
the active configuration.
{{< /step >}}

{{< step "Ask your first question" >}}
Type into the **Ask about your database...** field and press **Enter** - or
click a suggested prompt such as *"What collections do I have?"* to get
started instantly.
{{< /step >}}

{{< /steps >}}

{{< tip >}}
**You now have** a conversational interface to your database: explore
collections, inspect structure, and generate and run AQL - no manual queries
required. See [Configure the LLM provider](llm-configuration.md) and
[Start a conversation](start-a-conversation.md) for the details.
{{< /tip >}}
