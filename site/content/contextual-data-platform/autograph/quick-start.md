---
title: AutoGraph Quick Start
menuTitle: Quick Start
weight: 2
description: >-
  Turn a pile of documents into a knowledge base you can chat with, with
  answers cited back to the source
---
{{< tag "Agentic AI Suite" >}}

## Prerequisites

- An **Arango Contextual Data Platform** deployment with a valid Agentic AI
  Suite license.
- **LLM and embedding API access** (OpenAI-compatible).
- For the HTTP API, the user name and password of a database user.

## Build your knowledge base

{{< tabs "autograph-qs" >}}

{{< tab "Web Interface" >}}
{{< steps >}}

{{< step "Create a project" >}}
In the sidebar, click **AutoGraph Studio** and create a project. A project is
an isolated workspace: you keep one set of related documents per project and
their data stays separate from everything else.
{{< /step >}}

{{< step "Upload the documents you want answers from" >}}
Add your files (PDF, Office, text, and more). This is the raw material
AutoGraph reads.
{{< /step >}}

{{< step "Connect an AI model / LLM" >}}
Enter your model provider and key (for example, an OpenAI key covers both
the chat and embedding settings). AutoGraph uses the model to read your
documents now and to answer your questions later. Leave the import settings
at their defaults for your first run.
{{< /step >}}

{{< step "Let AutoGraph analyze your documents" >}}
Deploy the service and start the build (shown as the **Corpus Graph** in the
UI). AutoGraph reads every document, groups them by the topics they actually
cover, and picks the right processing depth for each group, so that dense
technical material and simple FAQs are each handled appropriately. This runs
on its own; wait for it to finish.
{{< /step >}}

{{< step "Build the knowledge base" >}}
Click **Generate strategies**. Pick how much of the corpus should lean on graph
extraction with the **Complexity** slider — the balanced default is a good first
run — then review the strategies AutoGraph picked per topic group and click
**Build Knowledge Graph**. AutoGraph turns each topic group into a part of a
searchable knowledge base. Wait for the **Knowledge Graph built** confirmation.
{{< /step >}}

{{< step "Deploy a retriever" >}}
Deploy a retriever against your Context Graph. It is what your questions,
agents, and applications talk to. Wait for it to go **live**.
{{< /step >}}

{{< step "Ask your first question" >}}
Ask a question in plain language. Answers come back with citations linking to the
source documents they came from.
{{< /step >}}

{{< /steps >}}

{{< info >}}
To add, remove, or replace individual documents later, use the API. The web
interface does not offer these operations in Arango Contextual Data Platform
4.1.x. See [Incremental Graph Updates](incremental-graph-updates/_index.md).
{{< /info >}}
{{< /tab >}}

{{< tab "HTTP API" >}}
This example builds a knowledge graph from the 50 tech articles of
[tutorial 2](../../get-started/contextual-data-platform/build-with-autograph.md)
in the project `enterprise-docs-api`, with the category `tech_articles`. It uses
`curl` and [`jq`](https://jqlang.org/). Responses are shortened where marked
with `…`.

Download the articles and set the connection details. Run all commands in the
same shell, from the directory that contains `./files`:

```bash
curl -L https://github.com/arangodb/docs-tutorials/releases/download/autograph-v1/corpus.zip -o corpus.zip
unzip -o corpus.zip -d ./files

ENDPOINT="https://<EXTERNAL_ENDPOINT>:8529"
DB="_system"
PROJECT="enterprise-docs-api"
CATEGORY="tech_articles"
```

AutoGraph accepts request fields in snake_case or camelCase, and its responses
use camelCase. The `-k` option of `curl` accepts a self-signed certificate.

{{< steps >}}

{{< step "Sign in" >}}
{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/_open/auth" >}}

Get a JWT session token:

```bash
TOKEN=$(curl -sk -X POST "$ENDPOINT/_open/auth" \
  -d '{"username": "root", "password": "<your-password>"}' | jq -r .jwt)
echo "$TOKEN" | cut -c1-20
```

If the output is `null`, the user name or password is wrong. If a later
request returns `Unauthorized`, the token has expired. Run this command again.
{{< /step >}}

{{< step "Create the project" >}}
{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/_platform/acp/v1/project" >}}

```bash
curl -sk -X POST "$ENDPOINT/_platform/acp/v1/project" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"project_name\": \"$PROJECT\",
       \"project_type\": \"autograph\",
       \"project_db_name\": \"$DB\"}" | jq
```

```json
{
  "projectName": "enterprise-docs-api",
  "projectType": "autograph",
  "projectDbName": "_system",
  "projectFiles": []
}
```
{{< /step >}}

{{< step "Pick the secret profile of your LLM key" >}}
{{< endpoint "GET" "https://<EXTERNAL_ENDPOINT>:8529/_platform/acp/v1/secrets" >}}

List the [Secrets Manager](../secrets-manager.md) profiles that can hold your
LLM API key:

```bash
curl -sk "$ENDPOINT/_platform/acp/v1/secrets" \
  -H "Authorization: Bearer $TOKEN" \
  | jq '[.. | objects | select(has("profile_id") or has("profileId"))
         | {profile_id: (.profile_id // .profileId), name, provider}]'
```

```json
[
  {
    "profile_id": "73d06448-…",
    "name": "openai-key",
    "provider": "openai"
  }
]
```

Set the ID of the profile to use. If you have none yet, store your key first,
see [How to use the secrets manager API](../secrets-manager.md#how-to-use-the-secrets-manager-api).

```bash
PROFILE_ID="<profile-id>"
```
{{< /step >}}

{{< step "Deploy the AutoGraph service" >}}
{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/_platform/acp/v1/autograph" >}}

For all install keys, see
[Install the service](reference/_index.md#install-the-service).

```bash
curl -sk -X POST "$ENDPOINT/_platform/acp/v1/autograph" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"env\": {
         \"db_name\": \"$DB\",
         \"genai_project_name\": \"$PROJECT\",
         \"fps_recovery_username\": \"root\",
         \"chat_api_provider\": \"openai\",
         \"chat_secret_profile_id\": \"$PROFILE_ID\",
         \"chat_model\": \"gpt-5.4-nano\",
         \"embedding_api_provider\": \"openai\",
         \"embedding_secret_profile_id\": \"$PROFILE_ID\",
         \"embedding_model\": \"text-embedding-3-small\"}}" \
  | tee autograph.json | jq
```

```json
{
  "serviceInfo": {
    "serviceId": "arangodb-autograph-vyk1t",
    "description": "Install complete",
    "status": "DEPLOYED",
    "namespace": "arango",
    "dbName": "_system",
    "managingEntity": "ACP",
    "genaiProjectName": "enterprise-docs-api"
  }
}
```

The AutoGraph API of this project is at `/autograph/{service_id_postfix}`,
where `service_id_postfix` is the end of the `serviceId`, `vyk1t` in this
example. Keep the path in a variable:

```bash
AG="$ENDPOINT/autograph/$(jq -r .serviceInfo.serviceId autograph.json | sed 's/^arangodb-autograph-//')"
echo "$AG"
```

```text
https://<EXTERNAL_ENDPOINT>:8529/autograph/vyk1t
```
{{< /step >}}

{{< step "Wait until the service is ready" >}}
{{< endpoint "GET" "https://<EXTERNAL_ENDPOINT>:8529/autograph/{service_id_postfix}/v1/health" >}}

Repeat this command until it returns the following:

```bash
curl -sk "$AG/v1/health" -H "Authorization: Bearer $TOKEN" | jq
```

```json
{
  "status": "SERVING",
  "message": "Service is healthy"
}
```
{{< /step >}}

{{< step "Upload the documents" >}}
{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/_platform/filemanager/_db/{database}/rag-input" >}}

Upload every article to the
[File Manager](../file-manager/api.md#upload-a-rag-input-file). The scope
`[project, category]` puts the files into the category `tech_articles`:

```bash
for f in ./files/tech_articles/*.md; do
  curl -sk -X POST "$ENDPOINT/_platform/filemanager/_db/$DB/rag-input" \
    -H "Authorization: Bearer $TOKEN" \
    -F "name=$(basename "$f")" \
    -F "scope=$PROJECT" \
    -F "scope=$CATEGORY" \
    -F "file=@$f" | jq -c '{name, version}'
done
```

```json
{"name":"activision_blizzard.md","version":1}
{"name":"alphabet_inc.md","version":1}
{"name":"amazon.md","version":1}
…
```

No collections exist in the database yet.
{{< /step >}}

{{< step "Build the corpus graph" >}}
{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/autograph/{service_id_postfix}/v1/corpus/builds" >}}

AutoGraph reads the documents, links similar ones, and groups them into
clusters. See [Create Corpus Build](reference/corpus-build.md#create-corpus-build).

```bash
CB_ID=$(curl -sk -X POST "$AG/v1/corpus/builds" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"categories\": [\"$CATEGORY\"], \"incremental\": false}" \
  | jq -r .corpusBuildId)
echo "$CB_ID"
```

Wait until the build is done:

```bash
while curl -sk "$AG/v1/corpus/builds/$CB_ID" -H "Authorization: Bearer $TOKEN" \
  | jq -e '.status == "pending" or .status == "running"' > /dev/null; do
  sleep 10
done
curl -sk "$AG/v1/corpus/builds/$CB_ID" -H "Authorization: Bearer $TOKEN" \
  | jq '{status, message, documentCount, clusterCount, error}'
```

```json
{
  "status": "completed",
  "message": "Build completed successfully!",
  "documentCount": 50,
  "clusterCount": 11,
  "error": ""
}
```

The database now has the corpus graph collections, such as
`enterprise-docs-api_sources` with the 50 documents,
`enterprise-docs-api_similarities` with the links between similar documents,
and `enterprise-docs-api_domains` with the 11 clusters. If the build fails, see
[Build error codes](reference/corpus-build.md#build-error-codes).
{{< /step >}}

{{< step "Generate the strategies" >}}
{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/autograph/{service_id_postfix}/v1/rag-strategizer/analyze" >}}

The RAG Strategizer picks a strategy for each cluster, FullGraphRAG or
VectorRAG, and the entity types to extract. `very_high` gives every cluster
FullGraphRAG, see
[How `complexity` is applied](reference/rag-strategizer.md#how-complexity-is-applied).

```bash
JOB_ID=$(curl -sk -X POST "$AG/v1/rag-strategizer/analyze" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"project\": \"$PROJECT\",
       \"complexity\": \"very_high\",
       \"categories\": [\"$CATEGORY\"]}" | jq -r .strategizeJobId)

while curl -sk "$AG/v1/rag-strategizer/jobs/$JOB_ID" -H "Authorization: Bearer $TOKEN" \
  | jq -e '.status == "pending" or .status == "running"' > /dev/null; do
  sleep 10
done
curl -sk "$AG/v1/rag-strategizer/jobs/$JOB_ID" -H "Authorization: Bearer $TOKEN" \
  | jq '{status, clustersDone, clustersTotal, message}'
```

```json
{
  "status": "completed",
  "clustersDone": 11,
  "clustersTotal": 11,
  "message": "Analyzed 11 clusters: 11 stored"
}
```

The strategies are stored in the new `enterprise-docs-api_rags` collection, one
per cluster. See
[Trigger RAG Strategizer](reference/rag-strategizer.md#trigger-rag-strategizer).
{{< /step >}}

{{< step "Build the knowledge graph" >}}
{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/autograph/{service_id_postfix}/v1/orchestrate" >}}

AutoGraph starts Importer workers that extract the entities and relationships of
each cluster. See
[Trigger Orchestration](reference/orchestration.md#trigger-orchestration).

```bash
ORCH_ID=$(curl -sk -X POST "$AG/v1/orchestrate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"project\": \"$PROJECT\",
       \"replicas\": 1,
       \"categories\": [\"$CATEGORY\"]}" | jq -r .orchestrationId)
echo "$ORCH_ID"
```

Wait until the build is done. This prints the progress every minute:

```bash
while [ "$(curl -sk "$AG/v1/orchestrate/$ORCH_ID" \
  -H "Authorization: Bearer $TOKEN" | jq -r .status)" = "running" ]; do
  curl -sk "$AG/v1/orchestrate/$ORCH_ID" -H "Authorization: Bearer $TOKEN" \
    | jq -r '"\(.phase): \(.completedJobs)/\(.totalJobs) parts done"'
  sleep 60
done
curl -sk "$AG/v1/orchestrate/$ORCH_ID" -H "Authorization: Bearer $TOKEN" \
  | jq '{status, message, totalJobs, completedJobs, failedJobs}'
```

```json
{
  "status": "completed",
  "message": "Orchestration completed: 11 succeeded, 0 failed",
  "totalJobs": 11,
  "completedJobs": 11,
  "failedJobs": 0
}
```

Only `completed` means that the knowledge graph is ready. It is stored in new
collections such as `enterprise-docs-api_Documents`,
`enterprise-docs-api_Entities`, `enterprise-docs-api_Relations`, and
`enterprise-docs-api_Communities`.

If the build fails with `no importer worker became ready`, the deployment does
not have enough free resources for the Importer workers.
{{< /step >}}

{{< /steps >}}

To add, remove, or replace documents in this knowledge graph later, continue
with the [Incremental Graph Updates Quick Start](incremental-graph-updates/quick-start.md).

{{< info >}}
Insert and update identify every document by its File Manager `file_id`, which
is why the example uploads through the File Manager. The deprecated
[`POST /v1/import-multiple`](reference/importing-files.md) path uploads files
directly to the service, but a corpus built that way cannot be changed document
by document. See
[Identifying documents for the knowledge graph](incremental-graph-updates/api-reference.md#identifying-documents-for-the-knowledge-graph).
{{< /info >}}

{{< tip >}}
At any point,
[`GET /v1/projects/{project}/overview`](reference/project-operations.md#project-overview)
reports where the project stands: the document and cluster counts, and which
categories still need a build, strategies, or an orchestration.
{{< /tip >}}

Next, query your knowledge base with [AutoRAG](../autorag/quick-start.md).
{{< /tab >}}

{{< /tabs >}}

{{< tip >}}
**You now have** a knowledge base built from your documents and a chat
interface that answers questions about them, with citations back to the
source. To query it programmatically, see [AutoRAG](../autorag/quick-start.md).
{{< /tip >}}

## Next steps

- [Use Cases](use-cases.md): Real-world enterprise scenarios.
- [Incremental Graph Updates](incremental-graph-updates/_index.md): Add, remove, and
  replace documents in the existing categories of a knowledge graph that has
  already been built.
- [Architecture](architecture.md): The three-layer knowledge graph and
  resulting collections.
- [Design Guide](design-guide.md): Structure data with categories, layers, and
  components.
