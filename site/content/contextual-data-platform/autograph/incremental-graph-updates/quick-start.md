---
title: Incremental Graph Updates Quick Start
menuTitle: Quick Start
weight: 5
description: >-
  Keep an AutoGraph knowledge graph up-to-date by adding, removing, and
  replacing documents in its existing categories
---
{{< tag "Agentic AI Suite" >}}

Change individual documents in an existing category without rebuilding the
knowledge graph.

## Prerequisites

- Arango Contextual Data Platform 4.1.0 (API only).
- A built knowledge graph, with its files in the
  [File Manager](../../file-manager/api.md#upload-a-rag-input-file).
- Documents in **existing categories**. For a new category, run the full build,
  see [When to use IGU](_index.md#when-to-use-igu).

## How it works

1. Upload the new files to the File Manager, into their existing category.
2. [Add](api-reference.md#add-documents),
   [replace](api-reference.md#replace-documents), or
   [remove](api-reference.md#remove-documents) documents.
3. Start a [knowledge graph build](api-reference.md#build-the-knowledge-graph-for-changed-documents)
   for the added and replaced documents.
4. Optional: [reorganize](divergence-and-reorganization.md) if the build says
   so.

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
