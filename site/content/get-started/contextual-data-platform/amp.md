---
title: Get started with the Contextual Data Platform on AMP
menuTitle: Get started on AMP
weight: 3
description: >-
  Sign up for a free Contextual Data Platform deployment in the Arango Managed
  Platform (AMP), open it in the dashboard, and connect to it with the
  Arango AI SDK
---
With the [Arango Developer Edition](https://arango.ai/arango-developer-edition/),
you can run the data platform on AMP. Arango creates and runs the deployment for
you, so there is nothing to install except the Python SDK. This page takes you
from signing up to a client that is connected to your deployment. From there,
you continue with the Build and Query steps of
[Tutorial 1](quickstart/_index.md#build).

To run the data platform on your own machine or Kubernetes cluster instead, see
[Tutorial 1: Install and try it out](quickstart/_index.md).

## Prerequisites

- A work email address, or a GitHub, Google, or Microsoft account to sign up
  with.
- An API key for an OpenAI-compatible LLM provider. See
  [Supported LLM providers and models](../../contextual-data-platform/llm-models.md).
- `git`, `make`, [uv](https://docs.astral.sh/uv/getting-started/installation/),
  and Python 3.12 or later, for the Arango AI SDK.

## Sign up

{{< comment >}}
TODO(DOC-952): Confirm the production sign-up URL. Tested on stage at
/arango-trial/ on 2026-11-27.
{{< /comment >}}

1. Go to [arango.ai/arango-trial](https://arango.ai/arango-trial/) and select the
   **Cloud** tab.
2. Sign up with your email address, or with your GitHub, Google, or Microsoft
   account.
3. If you signed up with an email address, open the email from Arango and click
   **Verify my email address**. Then go back to the sign-up page and click
   **Continue**. If the email does not arrive within a few minutes, check
   your spam folder.
4. Enter your name, company, and country, accept the terms, and click
   **Create my deployment**.

The page shows **Your deployment is starting** and checks off each step as it
completes: **Organization**, **Project**, **Deployment**, and
**Services starting**. The deployment usually finishes setting up within a few
minutes.

The sign-up also creates an AMP organization for you, named after the company
you entered, with you as its owner.

{{< comment >}}
TODO(DOC-952): Confirm what happens if you sign up again with the same account.
{{< /comment >}}

## Open your deployment

1. Click **Open the dashboard**. The AMP dashboard opens. Sign in with the same
   account you signed up with if it asks you to.
2. The dashboard shows your new deployment, **My first deployment**, in the
   project **My first project**. If you left the page before the deployment
   was ready, sign in to the
   [AMP dashboard](https://dashboard.arangodb.cloud/home) and open it from
   **Deployments**.
3. Wait until the **Status summary** on the **Overview** shows **OK**.

The **Configuration** section shows the **Contextual Data Platform** flavor on a
single server. The **Deployment details** show the URLs and credentials you
need:

- **Platform UI**: the web interface of the data platform, a URL that ends in
  `/ui/`.
- **Application endpoint**: the URL that the SDK connects to, ending in `:8529`.
- **Root password**: the password of the `root` user. Click the eye icon to show
  it, or the copy icon to copy it.

## Sign in to the Platform UI

Click **Open Platform UI**. If **Use auto login for Platform UI** is on, you are
signed in as `root` without entering the password.

You can use the web interface to explore your data with the
[Query Editor](../../contextual-data-platform/query-editor.md) and the
[Graph Visualizer](../../contextual-data-platform/graph-visualizer.md).

## Connect with the Arango AI SDK

The **Connect with the Arango AI SDK** section of the **Overview** has the
commands for your deployment, with the endpoint already filled in. You can copy
them from there or follow the steps below.

1. Install the SDK:

   ```bash
   git clone https://github.com/arangoml/arango-ai-sdk
   cd arango-ai-sdk
   make install
   source .venv/bin/activate
   ```

   For other shells and Windows, see
   [Install the Arango AI SDK](quickstart/_index.md#install-the-arango-ai-sdk).

2. Set your credentials. Replace the URL with your **Application endpoint** and
   the password with your **Root password**:

   ```bash
   export ARANGO_URL="https://<host>:8529"
   export ARANGODB_PASSWORD="<root password>"
   ```

3. Save the following code as `quickstart.py` and run it with
   `python quickstart.py`. It signs in, creates a project, stores your LLM API
   key, and starts AutoGraph. Replace `YOUR_LLM_API_KEY` with your key:

   ```py
   import os

   from arango_ai_sdk import ArangoAIClient

   client = ArangoAIClient(
       base_url=os.environ["ARANGO_URL"],
       username="root",
       password=os.environ["ARANGODB_PASSWORD"],
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
   print("AutoGraph is ready")
   ```

The deployment has a
[well-known certificate](../../amp/security-and-access-control/x-509-certificates.md#well-known-x509-certificates),
so keep certificate verification on. Unlike the local setup in Tutorial 1, you
do not need a port-forward.

A project name can only be created once. If you already ran the `quickstart.py`
from the dashboard, the `quickstart` project exists, so use
`client.project.get(project_name="quickstart")` instead of `create`.

For what each call does, see [Connect](quickstart/_index.md#connect) in
Tutorial 1.

## Free credits

Your organization starts with 100 free credits. They have no time limit. To see
how many are left, click your organization in the dashboard and then
**Usage**. The balance is updated once a day, after the day has ended (UTC).

With the free credits, you have one deployment. To create more or larger
deployments, or to keep your deployment running after the credits are used,
add a payment method: in your organization, click **Unlock All Features**,
enter your billing address, and add a payment method.

{{< comment >}}
TODO(DOC-952): Confirm how fast a deployment uses credits and what happens to
it when the credits run out (paused, then deleted?).
{{< /comment >}}

## Next steps

- Continue with [Build](quickstart/_index.md#build) and
  [Query](quickstart/_index.md#query) in Tutorial 1. Skip the `kubectl` and
  port-forward notes there; they apply only to a local installation.
- Work with a larger document set in
  [Tutorial 2: From documents to answers](build-with-autograph.md).
