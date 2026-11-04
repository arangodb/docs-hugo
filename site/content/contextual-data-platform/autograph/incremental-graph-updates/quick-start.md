---
title: Incremental Graph Updates Quick Start
menuTitle: Quick Start
weight: 5
description: >-
  Keep an AutoGraph knowledge graph up-to-date by adding, removing, and
  replacing documents in its existing categories
---
{{< tag "Agentic AI Suite" >}}

Your knowledge graph is built, but your documents keep changing: new ones
arrive, existing ones get revised, and some become outdated. You do not have to
build the knowledge graph again for that. In this quick start, you learn how to
change individual documents in an existing category instead:

- [How it works](#how-it-works): the four steps of every update, in short.
- [Example: update the tech articles](#example-update-the-tech-articles): the
  same steps with real requests, on the example articles from
  [tutorial 2](../../../get-started/contextual-data-platform/build-with-autograph.md).

## Prerequisites

- **Arango Contextual Data Platform 4.1.0**, where Incremental Graph Updates are
  only available through the HTTP API.
- **A built knowledge graph**: An AutoGraph project whose corpus build, RAG
  Strategizer, and knowledge graph build have run, with its files uploaded to
  the [File Manager](../../file-manager/api.md#upload-a-rag-input-file).
- **Existing categories**: The documents you want to change are in categories
  that already exist. To add a new category, run the full build for it instead,
  see [When to use IGU](_index.md#when-to-use-igu).
- **A valid JWT** for the API. Every request uses an
  `Authorization: Bearer <token>` header.

## How it works

Every update follows the same four steps:

1. **Upload the new files** to the File Manager, into the scope of their
   existing category. A new version of a document goes under the same name as
   the old one, so it keeps its `file_id`.
2. **Change the documents** in the category:
   - [Add](api-reference.md#add-documents) documents that are not in the
     category yet.
   - [Replace](api-reference.md#replace-documents) documents that are already
     in the category with their new version.
   - [Remove](api-reference.md#remove-documents) documents that are in the
     category and that you no longer need.
3. **Add the changes to the knowledge graph.** Start a
   [knowledge graph build](api-reference.md#build-the-knowledge-graph-for-changed-documents)
   for the documents you added and replaced. Removing needs no build, it cleans
   up the knowledge graph by itself.
4. **Reorganize, if needed.** If the build reports that a part of the knowledge
   graph has changed a lot, you can
   [reorganize](divergence-and-reorganization.md) it. This step is optional.

That is all. The rest of the knowledge graph stays as it is, and only the
documents that changed are processed.

## Example: update the tech articles

Let's take an example. In
[tutorial 2](../../../get-started/contextual-data-platform/build-with-autograph.md),
you built a knowledge graph from 50 articles about technology companies,
products, and people, in the project `enterprise-docs` and the category
`tech_articles`. Since then, three things have changed:

- You have written a new article about Anthropic, `anthropic.md`.
- The article about OpenAI, `openai.md`, has been revised.
- The article about Motorola Mobility, `motorola_mobility.md`, is outdated, and
  you no longer want answers to be based on it.

The examples use the following shell variables. Set them to match your
deployment:

```bash
ENDPOINT="https://<EXTERNAL_ENDPOINT>:8529"
TOKEN="<your-jwt>"
DATABASE="<database-of-your-project>"
```

### Upload the new files

Upload the new article and the revised one into the existing category, under
the scope `["enterprise-docs", "tech_articles"]`:

```bash
for f in anthropic.md openai.md; do
  curl -X POST "$ENDPOINT/_platform/filemanager/_db/$DATABASE/rag-input" \
    -H "Authorization: Bearer $TOKEN" \
    -F "name=$f" \
    -F "scope=enterprise-docs" \
    -F "scope=tech_articles" \
    -F "file=@./files/tech_articles/$f"
done
```

Each response contains the `id` of the file. Note both of them: this is the
`file_id` you pass to the next requests. As `openai.md` is uploaded under the
same name and scope as before, it gets the same `id` as the old version, and the
File Manager stores it as version 2.

### Add the new article

`anthropic.md` is not in the category yet, so you add it:

```bash
curl -X POST "$ENDPOINT/autograph/v1/graph/insert" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "files": [{ "doc_name": "anthropic.md", "file_id": "<anthropic-file-id>" }],
    "category": "tech_articles"
  }'
```

The response lists the cluster that the article has joined. The article is now
in the corpus graph, next to the most similar articles, but not in the
knowledge graph yet.

### Replace the revised article

`openai.md` is already in the category, so you replace it with the new version:

```bash
curl -X POST "$ENDPOINT/autograph/v1/graph/update" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "files": [{ "doc_name": "openai.md", "file_id": "<openai-file-id>" }],
    "category": "tech_articles"
  }'
```

Replacing runs in the background, and the response only confirms that it has
started. To see when it is done, read the `importerOrchestration` entry in the
metadata of your project, with
[`GET /_platform/acp/v1/project_by_name/{database}/{project}`](../../control-plane-acp/api.md).
Wait until its `phase` is `DONE`, and check that the entry for `openai.md` says
`updated`.

### Remove the outdated article

`motorola_mobility.md` is in the category, so you can remove it. Removing works
by `file_id` or by file name:

```bash
curl -X POST "$ENDPOINT/autograph/v1/graph/delete" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "doc_names": ["motorola_mobility.md"],
    "category": "tech_articles"
  }'
```

The response is the final result: if `overall_status` is `COMMITTED`, the
article and everything that was extracted from it are gone.

### Add the changes to the knowledge graph

The new and the revised article are in the corpus graph, but their entities
are not in the knowledge graph yet. Start a knowledge graph build for both of
them:

```bash
curl -X POST "$ENDPOINT/autograph/v1/orchestrate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "project": "enterprise-docs",
    "replicas": 1,
    "file_ids": ["<anthropic-file-id>", "<openai-file-id>"]
  }'
```

Only these two articles are processed, not the whole category. The response
contains an `orchestration_id`. Check the build until its `status` is
`completed`:

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "$ENDPOINT/autograph/v1/orchestrate/<orchestration_id>"
```

### Check whether to reorganize

Each entry in the `jobs` of the build status shows how much its part of the
knowledge graph has changed since it was last organized, as
`divergence_score`. Three articles out of 50 is a small change, so you will
most likely see `needs_reclustering: false`, and you are done.

After many more changes, the build reports `needs_reclustering: true` for a
partition. You can then reorganize it, ideally at a quiet time, as it blocks
other changes while it runs:

```bash
curl -X POST "$ENDPOINT/autograph/v1/graph/recluster" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "partition_ids": ["<rag_partition_id>"] }'
```

For how the divergence is calculated and when reorganizing is worth it, see
[Divergence and Reorganization](divergence-and-reorganization.md).

### Ask about the new content

Your knowledge graph now knows about Anthropic, has the latest information
about OpenAI, and no longer answers from the Motorola Mobility article. Ask a
question about the changes, for example *What does Anthropic build?*, the same
way as in
[tutorial 2](../../../get-started/contextual-data-platform/build-with-autograph.md#start-asking-questions).

## Next steps

- [Incremental Graph Updates](_index.md): What each operation does to the
  corpus graph and the knowledge graph.
- [Divergence and Reorganization](divergence-and-reorganization.md): How the
  divergence is calculated and when to reorganize.
- [API Reference](api-reference.md): All requests, responses, and status codes.
