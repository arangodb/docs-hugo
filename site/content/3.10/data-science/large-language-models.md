---
title: Large Language Models (LLMs)
menuTitle: Large Language Models
weight: 133
description: >-
  Integrate large language models (LLMs) with knowledge graphs using ArangoDB
archetype: default
---
{{< description >}}

Large language models (LLMs) and knowledge graphs are two prominent and
contrasting concepts and each possesses unique characteristics and functionalities
that significantly impact the methods we employ to extract valuable insights from
constantly expanding and complex datasets.

LLMs, exemplified by OpenAI's ChatGPT, represent a class of powerful language
transformers. These models leverage advanced neural networks to exhibit a
remarkable proficiency in understanding, generating, and participating in
contextually-aware conversations.

On the other hand, knowledge graphs contain carefully structured data and are
designed to capture intricate relationships among discrete and seemingly
unrelated information. With knowledge graphs, you can explore contextual
insights and execute structured queries that reveal hidden connections within
complex datasets. 

ArangoDB's unique capabilities and flexible integration of knowledge graphs and
LLMs provide a powerful and efficient solution for anyone seeking to extract
valuable insights from diverse datasets.

## ArangoDB and LangChain

[LangChain](https://www.langchain.com/) is a framework for developing applications
powered by language models.

LangChain enables applications that are:
- Data-aware (connect a language model to other sources of data)
- Agentic (allow a language model to interact with its environment)

The ArangoDB integration with LangChain provides you the ability to analyze
data seamlessly via natural language, eliminating the need for query language
design. By using LLM chat models such as OpenAI’s ChatGPT, you can "speak" to
your data instead of querying it.

## Get started with ArangoDB QA chain

The [ArangoDB QA chain notebook](https://langchain-langchain.vercel.app/docs/use_cases/more/graph/graph_arangodb_qa.html)
shows how to use LLMs to provide a natural language interface to an ArangoDB
instance.