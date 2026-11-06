---
title: Incremental Graph Updates Quick Start
menuTitle: Quick Start
weight: 5
description: >-
  Keep an AutoGraph knowledge graph up-to-date by adding, removing, and
  replacing documents in its existing categories
---
{{< tag "Agentic AI Suite" >}}

Add, replace, and remove documents in an existing category without rebuilding
the knowledge graph.

## Prerequisites

- Arango Contextual Data Platform 4.1.x. IGU is only available through the API.
- A built knowledge graph, with its files in the
  [File Manager](../../file-manager/api.md#upload-a-rag-input-file).
- Documents in existing categories. For a new category, build the category
  instead, see [When to use IGU](_index.md#when-to-use-igu).

## How it works

1. Upload each new document, and each new version of an existing document, to
   the [File Manager](../../file-manager/api.md#upload-a-rag-input-file) with
   `POST /_platform/filemanager/_db/{database}/rag-input`. Use the scope
   `[project, category]` of its existing category. The response contains the
   `id` of the file, which is its `file_id`. A new version keeps the `id` of the
   old version.
2. Change the documents in the category by `file_id`:
   - `POST /v1/graph/insert` [adds](api-reference.md#add-documents) documents
     that are not in the category yet.
   - `POST /v1/graph/update` [replaces](api-reference.md#replace-documents)
     documents in the category with their new version. It runs in the
     background, so wait until it is done.
   - `POST /v1/graph/delete` [removes](api-reference.md#remove-documents)
     documents from the category, including their entities in the knowledge
     graph.
3. Start a knowledge graph build for the added and replaced documents with
   [`POST /v1/orchestrate`](api-reference.md#build-the-knowledge-graph-for-changed-documents)
   and their `file_ids`. Wait until `GET /v1/orchestrate/{orchestration_id}`
   reports `completed`. Removed documents need no build.
4. If the build status reports `needs_reclustering: true` for a partition, you
   can rebuild its communities with
   [`POST /v1/graph/recluster`](api-reference.md#reorganize-partitions). To
   decide whether to do this, see
   [Divergence and Reorganization](divergence-and-reorganization.md).

## Example

You built the 50 tech articles of
[tutorial 2](../../../get-started/contextual-data-platform/build-with-autograph.md)
into the project `enterprise-docs`, category `tech_articles`. Now you add
`anthropic.md`, replace `openai.md` with a new version, and remove
`motorola_mobility.md`.

```bash
ENDPOINT="https://<EXTERNAL_ENDPOINT>:8529"
TOKEN="<your-jwt>"
DB="<database-of-the-project>"
```

{{< steps >}}

{{< step "Upload the new files" >}}
```bash
FM="$ENDPOINT/_platform/filemanager/_db/$DB"
for f in anthropic.md openai.md; do
  curl -X POST "$FM/rag-input" \
    -H "Authorization: Bearer $TOKEN" \
    -F "name=$f" \
    -F "scope=enterprise-docs" \
    -F "scope=tech_articles" \
    -F "file=@./files/tech_articles/$f"
done
```
Note the `id` of each file. `openai.md` keeps its old `id`.
{{< /step >}}

{{< step "Add the new article" >}}
```bash
curl -X POST "$ENDPOINT/autograph/v1/graph/insert" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"category": "tech_articles",
       "files": [{"doc_name": "anthropic.md",
                  "file_id": "<anthropic-id>"}]}'
```
{{< /step >}}

{{< step "Replace the revised article" >}}
```bash
curl -X POST "$ENDPOINT/autograph/v1/graph/update" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"category": "tech_articles",
       "files": [{"doc_name": "openai.md",
                  "file_id": "<openai-id>"}]}'
```
This runs in the background. Wait until it is done, see
[Replace documents](api-reference.md#replace-documents).
{{< /step >}}

{{< step "Remove the outdated article" >}}
```bash
curl -X POST "$ENDPOINT/autograph/v1/graph/delete" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"category": "tech_articles",
       "doc_names": ["motorola_mobility.md"]}'
```
{{< /step >}}

{{< step "Update the knowledge graph" >}}
```bash
curl -X POST "$ENDPOINT/autograph/v1/orchestrate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"project": "enterprise-docs",
       "replicas": 1,
       "file_ids": ["<anthropic-id>", "<openai-id>"]}'
```
Only the two articles are processed. Wait until
`GET /v1/orchestrate/{orchestration_id}` reports `completed`.
{{< /step >}}

{{< step "Reorganize, if needed" >}}
If the build reports `needs_reclustering: true` for a partition:

```bash
curl -X POST "$ENDPOINT/autograph/v1/graph/recluster" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"partition_ids": ["<rag_partition_id>"]}'
```
After three changes in 50 articles, you usually do not need this.
{{< /step >}}

{{< /steps >}}
