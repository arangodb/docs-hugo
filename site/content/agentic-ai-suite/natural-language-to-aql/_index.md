---
title: Natural Language to AQL
menuTitle: Natural Language to AQL
weight: 17
description: >-
  Query your ArangoDB database using natural language with the AQLizer feature,
  which automatically translates plain language into AQL queries using generative AI
---

{{< embed-svg "AQLizer-Flow" "Natural Language to AQL flow." >}}

## Introduction

Natural Language to AQL (txt2aql) is a service of the Arango Contextual Data Platform
that lets you interact with your ArangoDB database using plain language. You can describe
what you want to find or do, and the service automatically translates your request into
AQL (ArangoDB Query Language), executes the query, and returns results in your preferred
format.

Instead of writing complex queries by hand, you can ask questions or give instructions
like the following:

- "List all distinct surnames in the database sorted in descending order"
- "How many persons are there with the surname 'Stark'?"
- "Find the parents of 'Arya Stark'"

## How it works

The Natural Language to AQL service uses a Large Language Model (LLM) to interpret
natural language input and generate corresponding AQL queries. The workflow is as follows:

1. You provide your question or instruction in plain language.
2. The service reads your database schema to understand the available data structure.
3. The LLM translates your input into an AQL query tailored to your schema.
4. The generated AQL is executed against your ArangoDB database.
5. Results are returned in your chosen format: natural language explanation, the AQL
   query itself, or raw JSON data.

### Schema-aware, data-private

The AQLizer is schema-aware: it inspects your graphs, collections, and indexes,
and also samples a small number of documents to understand the document
structure. It rechecks the schema after 15 minutes. This lets the AQLizer
generate queries that are accurate and efficient. The LLM
acts purely as a translator. It receives the schema metadata, not your actual
data. Your raw data never leaves ArangoDB; only the resulting AQL query is sent
to the database for execution.

## Capabilities

The service offers two main capabilities:

**AQLizer: Natural language to AQL**\
Converts plain language questions into executable AQL queries and runs them against
your database. Returns results in natural language, AQL, or JSON format. This is the
primary capability for querying your data without knowing AQL.

**General text processing**\
Ask general questions and get LLM-powered responses without querying your database.
Useful for general knowledge questions, text analysis, and AQL-related explanations.

## Key features

- **Natural language to AQL translation**: Describe your data needs in plain language
  and get executable AQL queries.
- **Schema-aware query generation**: Uses your actual database schema to produce
  accurate, immediately usable queries.
- **Flexible output formats**: Receive results as a natural language explanation,
  the AQL query, or raw JSON: individually or combined.
- **Streaming responses**: Get results incrementally as they are generated, for a
  faster, more interactive experience.
- **Multiple LLM provider support**: Use OpenAI, OpenRouter, or any OpenAI-compatible
  endpoint, including self-hosted models.
- **Secrets Manager integration**: Reference API keys stored in the Contextual Data
  Platform [Secrets Manager](../../platform-suite/secrets-manager.md) instead of
  embedding them directly in configuration.

## How to access

### Web interface

The AQLizer feature is integrated directly into the **Query Editor** of the Arango
Contextual Data Platform. You can generate AQL queries from natural language, verify
them, and run them without leaving the editor.

See [Web Interface](web-interface.md) for step-by-step instructions.

### API

The Natural Language to AQL service exposes a REST API for programmatic access.
You can integrate it into your applications, call it from the command line, or use
it as part of a larger workflow.

- [Setup](setup.md): Deploy the service, configure LLM providers, and verify
  the deployment.
- [API Reference](api-reference.md): Runtime endpoint documentation with request
  and response examples.
