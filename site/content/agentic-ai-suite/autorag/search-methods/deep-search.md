---
title: AutoRAG Deep Search
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

You can also send [`"mode": "DEEP_SEARCH"`](../parameters.md#mode) instead of
setting `query_type` and `use_llm_planner`. The service then uses Custom
Retriever tools when they are available, and Local Search otherwise.

{{< diagram src="/images/retriever-deep-search-architecture.svg" 
           alt="Deep Search Architecture showing LLM-guided research process" >}}

{{< info >}}
Deep Search is also available via the
[web interface](../../autograph/web-interface.md).
{{< /info >}}

{{< warning >}}
Standard Deep Search is not supported on a **VectorRAG** partition, because its
Local Search retriever needs entities and communities that VectorRAG does not
build. Use Custom Deep Search with tools that search chunks, or
[Instant Search](unified-search.md). See
[VectorRAG and FullGraphRAG partitions](_index.md#vectorrag-and-fullgraphrag-partitions).
{{< /warning >}}

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
If omitted, all tools are auto-loaded from the `Tools` collection.

{{< diagram src="/images/custom-retriever-deep-search.svg"
           alt="Custom Deep Search: resolve the tool list, read global context, create the plan, match tools in two passes, execute the steps in order with a completion check, and synthesize the answer; a direct path matches and runs tools when global context is empty" >}}

## How Deep Search works

Both modes plan and execute the search in steps. Tool matching (step 3) only
applies to Custom Deep Search:

1. **Get global context**: Runs a Global Search over the community reports so
   the planner knows what data is available.

2. **Create execution plan**: The LLM reads the global context and the query,
   then breaks the query into steps. Each step has a description, a query
   template, and the information it is expected to find. Later steps can reuse
   the results of earlier steps.

3. **Match tools**: The LLM selects tools based on their descriptions, in two
   passes:
   - **Pass 1**: LLM picks one or more `custom_retriever` tools.
   - **Pass 2**: If no `custom_retriever` tool matches, LLM picks one
     service-retriever tool (`local`, `global`, or `unified`).
   - If `custom_tools` is not provided, the system auto-loads all
     `custom_retriever`, `local`, `global`, and `unified` tools from the
     `Tools` collection.

   The matched tools are used for all steps in the plan. If no tool matches,
   the steps have nothing to run.

4. **Execute each step**: Steps run in order. For each step, the LLM fills the
   `{{placeholders}}` in the query template with results from earlier steps to
   write one concrete query. The matched tools then run, in parallel if there
   are several. A completion check follows each step:
   - If the query is already answered, execution stops early.
   - If the step found no results, execution continues with the next step.
   - If a tool reports a configuration error, execution stops and the error
     is returned.

5. **Synthesize final answer**: Citations from all steps are merged by
   `chunk_id`, each step result is summarized, and the LLM produces the final
   answer, which can be streamed.

If the global context is empty, for example because there are no communities,
Custom Deep Search skips planning. The LLM matches tools directly against all
tool descriptions, the matched tools run in parallel, and their results are
summarized and synthesized into the answer. If no tool matches, the service
answers that no relevant data was found.

## Writing good tool descriptions

For Deep Search tool selection, the LLM reads each tool's `description` and
picks the tools that match. Description quality directly affects which tools
are chosen.

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
