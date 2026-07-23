---
title: Ada Quick Start
menuTitle: Quick Start
weight: 2
description: >-
  Ask questions about your data in plain language and get answers back, no AQL
  required
---

{{< steps >}}

{{< step "Open Ada" >}}
In the Arango Contextual Data Platform web interface, select your database in
the database selector, then open **Ada** from the left sidebar.
{{< /step >}}

{{< step "Configure the LLM provider" >}}
Click the gear icon (⚙) in the top-right corner and choose your **Provider**
and **Model**. For the **API Key**, either add your provider key (Anthropic,
OpenAI, OpenRouter, or a custom endpoint) or pick an existing one from the
[Secrets Manager](../../platform-suite/secrets-manager.md). Click **Save** and
the top bar updates to show the active configuration.
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
