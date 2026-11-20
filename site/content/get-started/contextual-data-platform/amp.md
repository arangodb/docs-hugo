---
title: Get started with the Contextual Data Platform on AMP
menuTitle: Get started on AMP
weight: 3
description: >-
  Create a Contextual Data Platform deployment in the Arango Managed Platform
  (AMP), sign in, and connect to it with the Arango AI SDK
---
On AMP, Arango runs the data platform for you, so there is nothing to install
except the Python SDK. This page takes you from an AMP account to a client that
is connected to your deployment. From there, you continue with the Build and
Query steps of [Tutorial 1](quickstart/_index.md#build).

To run the data platform on your own machine or Kubernetes cluster instead, see
[Tutorial 1: Install and try it out](quickstart/_index.md).

## Prerequisites

- An AMP account. Sign up or sign in at
  [dashboard.arangodb.cloud](https://dashboard.arangodb.cloud/home).
- Access to the AI Suite flavour in your AMP organization. It is available as
  part of the
  [Arango Developer Edition](https://arango.ai/arango-developer-edition/).
  {{< comment >}}
  TODO(DOC-952): Describe how access is granted through the Developer Edition
  once the PLG team decides. Draft pending PLG team review of this guide.
  {{< /comment >}}
- An API key for an OpenAI-compatible LLM provider. See
  [Supported LLM providers and models](../../contextual-data-platform/llm-models.md).
- `git`, [uv](https://docs.astral.sh/uv/getting-started/installation/), and
  Python 3.12 or later, for the Arango AI SDK.

## Create a deployment

1. In the AMP dashboard, click **Deployments** in the sidebar.
2. Click **New Deployment**.
3. Select the project for the deployment. If you have no project yet,
   [create a project](../../amp/projects.md#how-to-create-a-new-project) first.
4. In the **General** section, enter a **Name**, and select the **Provider** and
   **Region**. You cannot change the provider and region later.
5. In the **Sizing** section, select a **Model**.
6. In the **Flavour** list, select **AI Suite**. It includes the AutoGraph and
   AutoRAG services that the tutorials use. The other flavours are
   **Core Database**, the default, which creates a plain ArangoDB deployment,
   and **Data Science Platform**. Which flavours you can choose from depends on
   your organization and the region.
7. Select a node size. The list only shows the sizes that support the selected
   flavour.
   {{< comment >}}
   TODO(DOC-952): An A4 configuration is not enough for AI Suite. Collect the
   minimum node size and all other prerequisites and limitations (ask Hari).
   {{< /comment >}}
8. Check the **Summary** panel, then click **Create deployment**.

{{< comment >}}
TODO(DOC-952): Confirm whether the AI Suite flavour changes the Price/hour in
the Summary panel, and whether the Free Trial, On-Demand, and Committed packages
apply to it.
{{< /comment >}}

The deployment page shows **Deployment creation in progress, please wait.**
Provisioning takes a few minutes. The deployment is ready when the
**Status summary** on its **Overview** shows **OK**.

{{< comment >}}
TODO(DOC-952): Confirm that AI Suite includes AutoGraph and AutoRAG and what
Data Science Platform includes (API values aisuite and datascience). Add
screenshots of the form and the ready deployment. The Overview labels below
were taken from a Data Science Platform deployment on 2026-11-20; check them on
an AI Suite deployment.
{{< /comment >}}

## Sign in

1. Open the deployment in the **Deployments** list. Its **Overview** shows the
   **Deployment details**.
2. Note the **Application endpoint**, a URL that ends in `:8529`. You need it
   for the SDK.
3. Next to **Root password**, click the eye icon to show the password, or the
   copy icon to copy it.
4. Click **Open Platform UI**. If **Use auto login for Platform UI** is on, you
   are signed in as `root` without entering the password.

The web interface of the data platform opens at the **Platform UI** URL, which
ends in `/ui/`. You can use it to explore your data with the
[Query Editor](../../contextual-data-platform/query-editor.md) and the
[Graph Visualizer](../../contextual-data-platform/graph-visualizer.md).

## Connect with the Arango AI SDK

Install the SDK as described in
[Install the Arango AI SDK](quickstart/_index.md#install-the-arango-ai-sdk).

Then create a client with your endpoint URL and password. The deployment has a
[well-known certificate](../../amp/security-and-access-control/x-509-certificates.md#well-known-x509-certificates)
on port 8529, so keep certificate verification on.
Unlike the local setup in Tutorial 1, you do not need a port-forward.

```py
from arango_ai_sdk import ArangoAIClient

client = ArangoAIClient(
    base_url="<application-endpoint>",  # for example https://<host>:8529
    username="root",
    password="<your-root-password>",
)

project = client.project.create(
    project_name="quickstart",
    project_type="autograph",
)

profile = client.secret_profile.create(
    name="quickstart-openai",
    secret="YOUR_LLM_API_KEY",
    provider="openai",
)

project.autograph.deploy(
    chat_api_provider="openai",
    embedding_api_provider="openai",
    chat_secret_profile_id=profile.profile_id,
    embedding_secret_profile_id=profile.profile_id,
    fps_recovery_username="root",
    chat_model="gpt-4o",
    embedding_model="text-embedding-3-small",
)

if not project.autograph.wait_until_ready():
    raise RuntimeError("AutoGraph did not become ready in time")
```


For what each call does, see [Connect](quickstart/_index.md#connect) in
Tutorial 1.

## Next steps

- Continue with [Build](quickstart/_index.md#build) and
  [Query](quickstart/_index.md#query) in Tutorial 1. Skip the `kubectl` and
  port-forward notes there; they apply only to a local installation.
- Work with a larger document set in
  [Tutorial 2: From documents to answers](build-with-autograph.md).
- See [Deployment options](../../contextual-data-platform/deployment-options.md)
  for what differs between AMP and a self-managed installation.
