---
title: Natural Language to AQL in the Web Interface (AQLizer)
menuTitle: Web Interface
weight: 10
description: >-
  Generate AQL queries from natural language using the AQLizer feature in the
  Query Editor of the Arango Contextual Data Platform web interface
---

The AQLizer feature is integrated into the **Query Editor** of the Arango Contextual
Data Platform. It uses generative AI to translate your plain language descriptions into
AQL queries, so you can explore your data and gain insights without having to learn
the query language first.

## Access the AQLizer

1. In the left-hand sidebar of the Arango Contextual Data Platform, select the database
   you want to query.
2. Click **Query Editor** in the navigation.
3. The Query Editor opens. The **AQLizer** button is visible at the bottom of each
   query tab.

## Set up AQLizer

Before you can generate queries, set up the AQLizer service. This is a one-time step.

1. In the Query Editor, click the **AQLizer** button at the bottom of the query tab.
2. The AQLizer panel opens. On first use, you are prompted to provide:
   - **OpenAI API Key**: Your API key for the LLM provider.
   - **OpenAI Model**: Select the model to use for query generation
     (for example, `gpt-4o`).
3. Click **Start Service** to initialize the AQLizer.

The service is now ready to use. You can check the service status or stop it at any
time from the **Manage Services** dialog.

## Generate AQL queries

Once the AQLizer service is running:

1. Click the **AQLizer** button to open the AQLizer panel.
2. Enter a self-contained question or instruction in plain language. Be specific to
   get accurate results. For example:
   - "List all distinct surnames in the database sorted in descending order"
   - "How many persons are there with the surname 'Stark'?"
   - "Find the parents of 'Arya Stark'"
3. Click **Ask** or press {{< kbd "Return" >}}.
4. The AQLizer generates an AQL query based on your input and your database schema.
5. Review the generated query in the AQLizer panel.
6. Click **Open in Editor** to load the query into a new query tab.
7. Verify the query, make any adjustments, and click **Run query** to execute it.

{{< warning >}}
Always verify AI-generated queries before running them in production.
AI can make mistakes or produce unexpected results.
{{< /warning >}}

![Screenshot of the AQLizer UI with a prompt and the generated query](../../images/data-platform-aqlizer.png)

## Tips for better results

- **Be specific**: The more precise your question, the more accurate the generated
  query. For example, instead of "show me users", try "list all users who registered
  after January 2024, sorted by registration date".
- **Reference your data model**: If you know your collection or attribute names,
  include them in your question.
- **Iterate**: Use the generated query as a starting point. You can refine it in the
  Query Editor and ask the AQLizer again with a more focused question.
- **Use an AQL-capable model**: The quality of the generated AQL depends on the LLM
  model. A model with strong coding capabilities generally produces better results.

For more information about the Query Editor and its other features, see the
[Query Editor](../../platform-suite/query-editor.md) documentation.

For programmatic access to the same functionality, see the [API Reference](api-reference.md).
