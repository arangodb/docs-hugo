---
title: Deep Search
menuTitle: Deep Search
description: >-
  LLM-orchestrated multi-step research for complex queries requiring thorough analysis
weight: 25
---

## Overview

Deep Search uses an LLM planner to break complex queries into multiple steps
and execute them sequentially, building on results from earlier steps. It is
designed for highly detailed, accurate responses where short latency is not
the primary concern.

There are two Deep Search modes depending on the query type:

- **Standard Deep Search** (`query_type: 2` + `use_llm_planner: true`): Uses
  the built-in Local Search retriever.
- **Custom Deep Search** (`query_type: 4` + `use_llm_planner: true`): Uses
  [Custom Retriever](custom-retriever.md) tools, with automatic tool selection.

{{< diagram src="/images/retriever-deep-search-architecture.png" 
           alt="Deep Search Architecture showing LLM-guided research process" >}}

{{< info >}}
Deep Search is also available via the
[web interface](../../graphrag/web-interface.md).
{{< /info >}}

## Standard Deep Search

Standard Deep Search uses Local Search as the underlying retriever.

### Configuration

```json
{
  "query_type": 2,
  "use_llm_planner": true
}
```

{{< info >}}
When `use_llm_planner` is not specified for LOCAL queries, it defaults to
`true` (Deep Search mode).
{{< /info >}}

## Custom Deep Search

Custom Deep Search uses [Custom Retriever](custom-retriever.md) tools. Instead
of specifying which tools to run, the LLM automatically plans and executes the
search across multiple steps.

### Configuration

```json
{
  "query_type": 4,
  "use_llm_planner": true
}
```

You can optionally provide `custom_tools` to limit which tools are available.
If omitted, all tools are auto-loaded from the Tools collection.

## How Deep Search works

Both modes follow the same pipeline:

1. **Get global context**: Fetches global context to understand what data is
   available. If global context is empty, skips to direct tool matching.

2. **Create execution plan and match best tool**: The LLM reads the global
   context and the query, then creates a multi-step plan by breaking the query
   into sub-questions. It then selects the best tool in two passes:
   - **Pass 1**: LLM picks the best `custom_retriever` tool from available
     tools based on tool descriptions.
   - **Pass 2**: If no `custom_retriever` tool matches, LLM picks from
     service-retriever tools (`local`, `global`, `unified`).
   - If `custom_tools` is not provided, the system auto-loads all supported
     tool types from the Tools collection.

   The selected tool is used for all steps in the plan.

3. **Execute each step**: Each step runs sequentially using the matched tool.
   Results from earlier steps feed into later steps. If the query is fully
   answered at any step, execution stops early.

4. **Synthesize final answer**: All step results are combined and sent to the
   LLM to produce a final answer.

## Writing good tool descriptions

For Deep Search tool selection, the LLM reads each tool's `description` and
picks the best match. Description quality directly affects which tool is chosen.

Use this pattern:
- **What this tool searches**
- **Best question type**
- **When to use this tool**

Example descriptions:

- **`local` tool**: "Use this for customer/account-level investigations in our
  support and CRM data (ticket timelines, owner changes, SLA breaches). Best
  for 'why did this specific case fail' questions."
- **`global` tool**: "Use this for org-level trend summaries across quarterly
  reports, KPI dashboards, and region performance docs. Best for leadership
  questions about overall patterns."
- **`unified` tool**: "Use this for end-to-end analysis that combines business
  summary and concrete evidence from policy docs, tickets, and metrics tables
  in one response."

## Best use cases

- Complex multi-part questions that require multiple search steps.
- Queries where the right tool is not known upfront.
- When you want the LLM to plan the search strategy automatically.
- Aggregation of highly technical details across the knowledge graph.

## Next Steps

- **[Custom Retriever](custom-retriever.md)**: Create custom tools for Deep Search to use.
- **[Custom Prompts](../custom-prompts.md)**: Customize the planning and synthesis prompts.
- **[Execute queries](../executing-queries.md)**: Learn how to call the search endpoints.
