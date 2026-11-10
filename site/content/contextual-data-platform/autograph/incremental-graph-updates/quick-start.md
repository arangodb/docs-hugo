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

- **Arango Contextual Data Platform 4.1.x**, where IGU is only available through
  the HTTP API.
- A built knowledge graph, with its files in the
  [File Manager](../../file-manager/api.md#upload-a-rag-input-file).
- Documents in existing categories. For a new category, build the category
  instead, see [When to use IGU](_index.md#when-to-use-igu).
- Retrieval strategies for the category, from the
  [RAG Strategizer](../reference/rag-strategizer.md). Without them, added
  documents only reach the corpus graph. To find categories without strategies,
  check `strategies.categories_without_strategies` in the
  [Project Overview](../reference/project-operations.md#project-overview).

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

This example changes the project of
[tutorial 2](../../../get-started/contextual-data-platform/build-with-autograph.md),
`enterprise-docs`, which has the 50 tech articles in the category
`tech_articles`. You add an article about Anthropic, replace `openai.md` with a
new version, and remove `motorola_mobility.md`. Then you update the knowledge
graph.

Tutorial 2 uses the Arango AI SDK, but IGU is not in the SDK yet, so this
example uses `curl` and [`jq`](https://jqlang.org/). Run all commands in the
same shell, from the directory that contains `./files/tech_articles` from
tutorial 2.

AutoGraph accepts request fields in snake_case or camelCase, but its
responses use camelCase, such as `orchestrationId`. They also leave out fields
that are empty, `0`, or `false`.

{{< steps >}}

{{< step "Sign in" >}}
Set the connection details of tutorial 2 and get a token. The SDK stores the
project in the `_system` database by default.

```bash
ENDPOINT="https://localhost:8529"
DB="_system"
TOKEN=$(curl -sk -X POST "$ENDPOINT/_open/auth" \
  -d '{"username": "root", "password": "test"}' | jq -r .jwt)
echo "$TOKEN" | cut -c1-20
```

The output is the start of the token, such as `eyJhbGciOiJIUzI1NiIs`. If it
is `null`, the user name or password is wrong.

The `-k` option accepts the self-signed certificate of a local deployment.
Leave it out if your deployment has a trusted certificate.
{{< /step >}}

{{< step "Check the starting point" >}}
```bash
curl -sk "$ENDPOINT/autograph/v1/projects/enterprise-docs/overview" \
  -H "Authorization: Bearer $TOKEN" \
  | jq '{documents: .corpusGraph.documentCount,
         knowledge_graph: .knowledgeGraph.status,
         without_strategies: (.strategies.categoriesWithoutStrategies // [])}'
```

```json
{
  "documents": 50,
  "knowledge_graph": "built",
  "without_strategies": []
}
```

Continue if the knowledge graph is `built` and `tech_articles` is not in
`without_strategies`. Otherwise, finish tutorial 2 first.
{{< /step >}}

{{< step "Create the new documents" >}}
Write a new article, and add a section to `openai.md` to make a new version of
it:

```bash
cat > ./files/tech_articles/anthropic.md <<'MD'
# Anthropic

Anthropic is an American artificial intelligence company founded in 2021 by
Dario Amodei, Daniela Amodei, and other former members of OpenAI. It develops
the Claude family of large language models. Amazon and Google are among its
largest investors, and Amazon Web Services is its primary cloud provider.
MD

cat >> ./files/tech_articles/openai.md <<'MD'

## Competition

Several former OpenAI employees founded Anthropic in 2021. Its Claude models
compete with ChatGPT.
MD
```

Both commands print nothing.
{{< /step >}}

{{< step "Upload the documents" >}}
Upload both files to the File Manager, into the scope of the category. Each
response is saved to a file, and the `id` of each file goes into a variable.

```bash
for f in anthropic openai; do
  curl -sk -X POST "$ENDPOINT/_platform/filemanager/_db/$DB/rag-input" \
    -H "Authorization: Bearer $TOKEN" \
    -F "name=$f.md" \
    -F "scope=enterprise-docs" \
    -F "scope=tech_articles" \
    -F "file=@./files/tech_articles/$f.md" \
    | jq '{id, name, version}' | tee "$f.json"
done
ANTHROPIC_ID=$(jq -r .id anthropic.json)
OPENAI_ID=$(jq -r .id openai.json)
```

```json
{
  "id": "rag-input-…",
  "name": "anthropic.md",
  "version": 1
}
{
  "id": "rag-input-…",
  "name": "openai.md",
  "version": 2
}
```

`openai.md` has `version` 2, because it has the same name and scope as the
file from tutorial 2. It keeps the `id` of that file.
{{< /step >}}

{{< step "Add the new article" >}}
```bash
curl -sk -X POST "$ENDPOINT/autograph/v1/graph/insert" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"category\": \"tech_articles\",
       \"files\": [{\"doc_name\": \"anthropic.md\",
                    \"file_id\": \"$ANTHROPIC_ID\"}]}" | jq
```

```json
{
  "results": [
    {
      "docName": "anthropic.md",
      "success": true,
      "ragPartitionId": "…",
      "clusterKey": "…",
      "fileId": "rag-input-…"
    }
  ]
}
```

Adding is synchronous, so the article is in the corpus graph once you get the
response. Check that `success` is `true` and that `ragPartitionId` is there.
If it is missing, the knowledge graph build skips the article, see
[Add documents](api-reference.md#add-documents) for what to do.
{{< /step >}}

{{< step "Replace the revised article" >}}
```bash
curl -sk -X POST "$ENDPOINT/autograph/v1/graph/update" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"category\": \"tech_articles\",
       \"files\": [{\"doc_name\": \"openai.md\",
                    \"file_id\": \"$OPENAI_ID\"}]}" | jq
```

```json
{
  "updateId": "update_…",
  "accepted": true,
  "message": "Update started"
}
```

Replacing runs in the background. Its progress is in the
`importerOrchestration` entry of the project metadata, as a JSON string in
`message`. This command reads it:

```bash
curl -sk "$ENDPOINT/_platform/acp/v1/project_by_name/$DB/enterprise-docs" \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.. | .importerOrchestration? // empty | .message | (fromjson? // .)'
```

```json
{
  "phase": "DONE",
  "status": "completed",
  "summary": "Updated 1 file(s) in Layers 1-2; run orchestrate to re-import Layer 3",
  "files": [
    {
      "file": "openai.md",
      "result": "updated",
      …
    }
  ]
}
```

While replacing runs, the output is only the current phase, such as
`{"phase": "INSERT_L12"}`. Repeat the command until `phase` is `DONE`.
Replacing is done when `status` is
`completed` and the entry for `openai.md` has `result: "updated"` and no
`error`.
{{< /step >}}

{{< step "Remove the outdated article" >}}
```bash
curl -sk -X POST "$ENDPOINT/autograph/v1/graph/delete" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"category": "tech_articles",
       "doc_names": ["motorola_mobility.md"]}' \
  | jq '{overallStatus, results: [.results[] | {status, ragPartitionId}]}'
```

```json
{
  "overallStatus": "COMMITTED",
  "results": [
    {
      "status": "LAYER2_DELETE_STATUS_SUCCESS",
      "ragPartitionId": "…"
    }
  ]
}
```

Removing is synchronous and also removes the entities of the article from the
knowledge graph, so it is done once `overallStatus` is `COMMITTED`. The
category has 50 documents again: one added and one removed.
{{< /step >}}

{{< step "Update the knowledge graph" >}}
Start a knowledge graph build for the added and the replaced article. Removed
articles need no build.

```bash
ORCH_ID=$(curl -sk -X POST "$ENDPOINT/autograph/v1/orchestrate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"project\": \"enterprise-docs\",
       \"replicas\": 1,
       \"file_ids\": [\"$ANTHROPIC_ID\", \"$OPENAI_ID\"]}" \
  | tee orchestrate.json | jq -r .orchestrationId)
jq . orchestrate.json
```

```json
{
  "orchestrationId": "orch_…",
  "success": true,
  "message": "Orchestration started"
}
```

If the response has `unmatchedFileIds`, the build skips those articles, see
[Add documents](api-reference.md#add-documents). Wait until the build is no longer
`running`. This prints the progress every 30 seconds:

```bash
while [ "$(curl -sk "$ENDPOINT/autograph/v1/orchestrate/$ORCH_ID" \
  -H "Authorization: Bearer $TOKEN" | jq -r .status)" = "running" ]; do
  echo "still running"
  sleep 30
done
curl -sk "$ENDPOINT/autograph/v1/orchestrate/$ORCH_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '{status, message, jobs}'
```

```json
{
  "status": "completed",
  "message": "Orchestration completed: …",
  "jobs": [
    {
      "ragPartitionId": "…",
      "strategyType": "FullGraphRAG",
      "status": "completed",
      "divergenceScore": 0.04,
      "needsReclustering": false,
      …
    }
  ]
}
```

The knowledge graph is up to date when `status` is `completed`. Only the
partitions that contain the two articles are processed.
{{< /step >}}

{{< step "Check the result" >}}
```bash
curl -sk "$ENDPOINT/autograph/v1/projects/enterprise-docs/overview" \
  -H "Authorization: Bearer $TOKEN" \
  | jq '{documents: .corpusGraph.documentCount,
         knowledge_graph: .knowledgeGraph.status}'
```

```json
{
  "documents": 50,
  "knowledge_graph": "built"
}
```

The corpus graph has 50 documents: `anthropic.md` instead of
`motorola_mobility.md`, and the new version of `openai.md`.
{{< /step >}}

{{< step "Reorganize, if needed" >}}
Look at `needsReclustering` in the `jobs` of the previous step. After three
changes in 50 articles, it is usually `false`, and you are done. If it is
`true` for a partition, you can rebuild its communities:

```bash
curl -sk -X POST "$ENDPOINT/autograph/v1/graph/recluster" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"partition_ids": ["<ragPartitionId>"]}' | jq
```

Reorganizing blocks every other change to the corpus while it runs. Before you
start it, see
[Divergence and Reorganization](divergence-and-reorganization.md).
{{< /step >}}

{{< /steps >}}
