---
title: Custom Prompts Reference
menuTitle: Custom Prompts
description: >-
  Customize LLM prompts used during query processing for domain-specific behavior
weight: 55
---

## Overview

The Retriever service allows you to customize the LLM prompts used during query
processing. This enables you to:
- Tailor responses to your domain or use case
- Adjust the tone, style, or format of responses
- Provide domain-specific instructions to the LLM

Custom prompts are passed via the `custom_prompts` parameter in the query
request. Only the prompts you specify are overridden; all others use their
defaults.

## Usage

```json
{
  "query": "What are the main features of AI?",
  "query_type": 2,
  "custom_prompts": {
    "local_rag_response": "You are a technical expert. Provide a concise technical explanation focusing on implementation details.",
    "ds_generate_plan": "Break this query into 3-4 specific technical analysis steps."
  }
}
```

## Prompts by query type

Each query type uses a specific set of prompts. The table below shows which
prompts are available for which query type:

| Prompt Key | Local | Global | Unified | Deep Search | Custom Deep Search |
|---|---|---|---|---|---|
| `local_rag_response` | Yes | | Yes | | |
| `global_map_rag_points` | | Yes | | | |
| `global_reduce_rag_response` | | Yes | | | |
| `ds_generate_plan` | | | | Yes | |
| `ds_step_query` | | | | Yes | |
| `ds_completion_check` | | | | Yes | |
| `ds_final_synthesis` | | | | Yes | |
| `no_relevant_data_message` | | | | Yes | Yes |
| `ds_tool_selection` | | | | | Yes |
| `ds_custom_generate_plan` | | | | | Yes |
| `ds_custom_final_synthesis` | | | | | Yes |
| `ds_cr_completion_check` | | | | | Yes |
| `ds_completion_system` | | | | | Yes |
| `ds_no_tools_available` | | | | | Yes |

## Prompt reference

### Local and Unified prompts

- **`local_rag_response`**: Main prompt for generating responses in Local Search
  and Unified Search.
  - **Used by**: Local Search (`query_type=2`), Unified Search (`query_type=3`).
  - Template variables: `{response_instructions}`, `{context_data}`.

### Global prompts

- **`global_map_rag_points`**: Prompt for the **map** stage in Global Search.
  Processes individual community reports to extract key points with importance
  scores.
  - **Used by**: Global Search (`query_type=1`).
  - Template variable: `{context_data}`.

- **`global_reduce_rag_response`**: Prompt for the **reduce** stage in Global
  Search. Synthesizes ranked key points into a comprehensive final answer.
  - **Used by**: Global Search (`query_type=1`).
  - Template variables: `{response_instructions}`, `{report_data}`.

### Deep Search prompts

These prompts are used when `use_llm_planner=true` with Local Search
(`query_type=2`):

- **`ds_generate_plan`**: Generates a multi-step execution plan from the user
  query. Breaks down complex queries into 3-5 sequential steps.
  - Template variables: `{global_context}`, `{original_query}`.

- **`ds_step_query`**: Generates a specific, targeted query for each execution
  step. Fills in placeholders from previous step results.
  - Template variables: `{step_description}`, `{expected_info}`,
    `{query_template}`, `{previous_results}`.

- **`ds_completion_check`**: Evaluates whether the original query has been
  fully answered. Returns `"SOLVED"` or `"CONTINUE"`.
  - Template variables: `{original_query}`, `{execution_summary}`.

- **`ds_final_synthesis`**: Synthesizes all step results into a comprehensive
  final answer.
  - Template variables: `{original_query}`, `{response_instructions}`,
    `{all_step_results}`.

- **`no_relevant_data_message`**: Message returned when no relevant data is
  found. Simple string (no template variables).

### Custom Retriever Deep Search prompts

These prompts are used when `use_llm_planner=true` with Custom Retriever
(`query_type=4`):

- **`ds_tool_selection`**: Selects the best tool for a query based on tool
  descriptions. Used in both pass 1 (custom_retriever tools) and pass 2
  (local/global/unified tools).
  - Template variables: `{tools_description}`, `{user_query}`.

- **`ds_custom_generate_plan`**: Generates a multi-step execution plan tailored
  for custom retriever context.
  - Template variables: `{global_context}`, `{original_query}`.

- **`ds_custom_final_synthesis`**: Synthesizes all step results into a final
  answer for custom retriever queries.
  - Template variables: `{original_query}`, `{response_instructions}`,
    `{all_step_results}`.

- **`ds_cr_completion_check`**: Checks if the query has been fully answered
  after each step. Returns `"SOLVED"` or `"CONTINUE"`.
  - Template variables: `{original_query}`, `{execution_summary}`.

- **`ds_completion_system`**: System prompt for the completion check LLM call.
  Simple string (no template variables).

- **`ds_no_tools_available`**: Message returned when no custom retriever tools
  are available. Simple string (no template variables).

## Best practices

1. **Start with defaults**: Test with default prompts first to understand
   baseline behavior.
2. **Incremental changes**: Override one or two prompts at a time to see the
   impact.
3. **Domain-specific instructions**: Add domain-specific context to prompts
   (e.g., "You are a medical expert analyzing clinical data").
4. **Preserve template variables**: When customizing prompts, keep the required
   `{template_variables}` so the system can inject context data.
5. **Test across query types**: Test custom prompts with various query types to
   ensure they work across different scenarios.

## Validation

If you provide an invalid prompt key, the service returns an error listing
the invalid keys and all valid keys:

```json
{
  "error": "Invalid prompt keys found: ['invalid_key']. Valid keys are: ['ds_completion_check', 'ds_completion_system', 'ds_cr_completion_check', 'ds_custom_final_synthesis', 'ds_custom_generate_plan', 'ds_final_synthesis', 'ds_generate_plan', 'ds_no_tools_available', 'ds_step_query', 'ds_tool_selection', 'global_map_rag_points', 'global_reduce_rag_response', 'local_rag_response', 'no_relevant_data_message']"
}
```
