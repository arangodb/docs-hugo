---
title: Enterprise Edition License Management
menuTitle: License Management
weight: 20
description: >-
  How to activate a deployment, obtain and apply a license key, and check the
  licensing status of an ArangoDB deployment
---
The Enterprise Edition of ArangoDB requires a license so that you can use
ArangoDB for commercial purposes and have a dataset size over 100 GiB. See
[ArangoDB Editions](../../features/_index.md#arangodb-editions)
for details.

## Which method applies to you?

Which approach you use depends on how you run ArangoDB and whether the
deployment has internet access:

| Your deployment | How to license it | Run the Platform CLI tool? |
|---|---|---|
| **Standalone ArangoDB** with internet access | [Activate the deployment](#activate-a-deployment) with the Platform CLI tool (recommended for unattended renewal) or the [License Activation web UI](https://activate.license.arango.ai/) in **Managed** mode (one-off). | **Optional** — only if you use the Platform CLI tool |
| **Standalone ArangoDB**, offline / air-gapped | [Generate a license key](#generate-a-license-key) on a separate internet-connected machine, then [apply it](#apply-a-license-key) via arangosh, the Web UI, or the HTTP API. | **Yes** — on the internet-connected machine only |
| **Kubernetes with internet access** (incl. Contextual Data Platform) | Create a Kubernetes secret with your client ID and client secret. The [ArangoDB Kubernetes Operator (kube-arangodb)](https://github.com/arangodb/kube-arangodb) activates the deployment and renews the license automatically. | **No** — the operator does everything |
| **Air-gapped Kubernetes** (no internet access) | Generate a license key on a separate internet-connected machine, then apply it as a Kubernetes secret on the air-gapped cluster. | **Yes** — on the internet-connected machine only |

{{< info >}}
**Legacy deployments (pre-v3.12.6):** Arango issued a ready-made license
key directly to customers — there were no client ID and client secret
credentials, and no Platform CLI tool. If you are on v3.12.5 or earlier,
skip the activation and generation steps and go directly to
[Apply a license key](#apply-a-license-key).
{{< /info >}}

{{< info >}}
If you run ArangoDB on Kubernetes — whether it's a Kubernetes-managed
standalone ArangoDB deployment or the Contextual Data Platform — the
Contextual Data Platform
[License Management](../../../../contextual-data-platform/license-management.md)
page covers both Kubernetes methods end-to-end (operator lifecycle, secret
format, network access). The same operator and `spec.license` field are
used in both cases; see the
[kube-arangodb reference](https://arangodb.github.io/kube-arangodb/docs/how-to/set_license.html)
for the field details.
{{< /info >}}

The rest of this page describes each method in detail. The Platform CLI tool
sections and the [container walkthrough](#walkthrough-generate-a-key-in-a-container)
apply to every row except **Kubernetes with internet access** — for that case,
the operator handles everything, so you can skip to the
[Kubernetes-managed deployment](#kubernetes-managed-deployment) subsection
under _Activate a deployment_.

{{< info >}}
The Platform CLI tool (`arangodb_operator_platform`) is
compatible with ArangoDB v3.12.6 and later. It does not need to run on the
same host as ArangoDB — you can run it from any system that can reach an
ArangoDB endpoint over the network, including from inside a container
you use only for license generation.
{{< /info >}}

{{< tip >}}
The [License Activation web UI](https://activate.license.arango.ai/) is a
graphical alternative to the Platform CLI tool. It supports two modes:

- **Inventory** — upload an `inventory.json` file produced by
  `arangodb_operator_platform license inventory`. Recommended for offline /
  air-gapped flows.
- **Managed** — provide just the deployment ID. Skips the inventory step;
  suited to one-off activation of an online deployment.

See the **Web UI** entries in
[Activate a deployment](#license-activation-web-ui-managed-mode),
[Generate a license key](#generate-a-license-key), and the
[container walkthrough](#walkthrough-generate-a-key-in-a-container).
{{< /tip >}}

## License methods summary

- **Activate a deployment** (from v3.12.6 onward):\
  Customers receive license credentials composed of a client ID and a client secret.
  You can use the Platform CLI tool to activate deployments with these credentials,
  either one-off or continuously.

  An activation is generally valid for two weeks and it is recommended to
  renew the activation weekly.

- **Apply a license key**:\
  Up to v3.12.5, customers received a license key directly and it was typically
  valid for one year. From v3.12.6 onward, customers receive license credentials
  instead. You can use the Platform CLI tool to generate a license key using these
  credentials, and the license key generally expires every two weeks.

  You can also activate a deployment instead of generating a license key, but
  this requires an internet connection. For air-gapped environments for example,
  the license key method is required and the license key has a longer validity.

## Activate a deployment

### Standalone deployment

You can activate a standalone deployment with the Platform CLI tool or with
the License Activation web UI. The CLI is the recommended option for ongoing
operation because it can re-activate the deployment automatically on a fixed
interval. The web UI is a quick, graphical alternative for one-off activation.

#### Platform CLI tool

1. Download the Platform CLI tool `arangodb_operator_platform` from
   <https://github.com/arangodb/kube-arangodb/releases>.
   It is available for Linux, macOS, and Windows for the x86-64 as well as 64-bit ARM
   architecture (e.g. `arangodb_operator_platform_linux_amd64`).

   It is recommended to rename the downloaded executable to
   `arangodb_operator_platform` (with an `.exe` extension on Windows) and add it to
   the `PATH` environment variable to make it available as a command in the system.

2. Activate a deployment once using the Platform CLI tool. Point it to a running
   ArangoDB deployment (running on `http://localhost:8529` in this example) and
   supply the license credentials:

   ```sh
   arangodb_operator_platform license activate \
     --arango.endpoint http://localhost:8529 \
     --license.client.id "your-company" \
     --license.client.secret "00000000-0000-0000-0000-000000000000"
   ```

   Unless authentication is disabled for the deployment, you need to additionally
   supply either ArangoDB user credentials or a JWT session token and specify the
   authentication method (case-sensitive):

   ```sh
   # User credentials
   arangodb_operator_platform license activate \
     --arango.authentication Basic \
     --arango.basic.username "root" \
     --arango.basic.password "" \
     ...

   # JWT session token
   arangodb_operator_platform license activate \
     --arango.authentication Token \
     --arango.token "eyJh..." \
     ...
   ```

3. By default, the Platform CLI tool activates the deployment once and exits.
   This one-shot mode is suited to scheduled invocations — for example, from
   a cron job or a systemd timer that runs the command once a week. Each run
   is independent, so a failed activation surfaces through the scheduler's
   normal failure reporting.

   Alternatively, you can specify an activation interval to keep the tool
   running and have it re-activate the deployment automatically, e.g. once
   a week:

   ```sh
   arangodb_operator_platform license activate \
     --license.interval 168h \
     ...
   ```

   In this continuous mode, run the Platform CLI tool under a process supervisor
   (for example a systemd unit with `Restart=always`, a container
   with a restart policy, or Kubernetes) so renewals resume automatically
   if the process exits unexpectedly.

#### License Activation web UI (Managed mode)

The web UI generates a license key for a deployment without running the
Platform CLI tool. It is suited to one-off activation; for unattended renewal,
use the CLI's `--license.interval` instead.

1. Get the deployment ID from a running ArangoDB instance:

   ```sh
   # User credentials (-u username:password)
   curl -u root: http://localhost:8529/_admin/deployment/id

   # Example result:
   # {"id":"6172616e-676f-4000-0000-05c958168340"}
   ```

2. Open <https://activate.license.arango.ai/>.
3. Enter your **License Client ID** and **License Client Secret**.
4. Select **Managed — Deployment ID only** and paste the deployment ID.
5. Optionally enable **Custom TTL** to override the default license duration.
6. Click **Activate** and copy the generated license key.
7. Apply the license key to ArangoDB using one of the interfaces in
   [Apply a license key](#apply-a-license-key) — for example `arangosh` or
   the Web interface.

Repeat this procedure when the license is close to expiry. If you want
unattended renewal, use the [Platform CLI tool](#platform-cli-tool) with
`--license.interval` instead.

### Kubernetes-managed deployment

With a Kubernetes-managed deployment, the ArangoDB Kubernetes Operator activates
and re-activates the deployment for you. You only need to make your license
credentials available as a Kubernetes secret and reference it in the
`ArangoDeployment` spec. The Kubernetes cluster must be able to reach
`*.license.arango.ai`.

1. Create a Kubernetes secret from your license credentials. Substitute
   `<license-client-id>` and `<license-client-secret>` with the actual values:

   ```sh
   kubectl create secret generic arango-license-key \
     --namespace arango \
     --from-literal=license-client-id="<license-client-id>" \
     --from-literal=license-client-secret="<license-client-secret>"
   ```

2. Reference the secret in the `spec.license.secretName` field of the
   `ArangoDeployment`:

   ```yaml
   apiVersion: "database.arangodb.com/v1"
   kind: "ArangoDeployment"
   metadata:
     name: "deployment-example"
   spec:
     # ...
     license:
       secretName: arango-license-key
   ```

See [Contextual Data Platform — License Management](../../../../contextual-data-platform/license-management.md)
for the operator's renewal cycle, the required network access, and the
configuration options that let you tune TTL and grace periods.

## Generate a license key

1. Download the Platform CLI tool `arangodb_operator_platform` from
   <https://github.com/arangodb/kube-arangodb/releases>.
   It is available for Linux, macOS, and Windows for the x86-64 as well as 64-bit ARM
   architecture (e.g. `arangodb_operator_platform_linux_amd64`).

   It is recommended to rename the downloaded executable to
   `arangodb_operator_platform` (with an `.exe` extension on Windows) and add it to
   the `PATH` environment variable to make it available as a command in the system.

2. Create an inventory file using the Platform CLI tool. Point it to a running
   ArangoDB deployment (running on `http://localhost:8529` in this example):

   ```sh
   arangodb_operator_platform license inventory \
     --arango.endpoint="http://localhost:8529" \
     inventory.json
   ```

   Unless authentication is disabled for the deployment, you need to additionally
   supply either ArangoDB user credentials or a JWT session token and specify the
   authentication method (case-sensitive):

   ```sh
   # User credentials
   arangodb_operator_platform license inventory \
     --arango.authentication Basic \
     --arango.basic.username "root" \
     --arango.basic.password "" \
     ...

   # JWT session token
   arangodb_operator_platform license inventory \
     --arango.authentication Token \
     --arango.token "eyJh..." \
     ...
   ```

3. Determine the ID of the ArangoDB deployment by calling the
   [`GET /_admin/deployment/id` endpoint](../../develop/http-api/administration.md#get-the-deployment-id).
   Querying the deployment directly confirms that you are generating a
   license key for the intended instance, rather than trusting whatever is
   recorded in the inventory file:

   ```sh
   # User credentials (-u username:password)
   curl -u root: http://localhost:8529/_admin/deployment/id

   # JWT session token
   curl -H "Authorization: Bearer eyJh..." http://localhost:8529/_admin/deployment/id

   # Example result:
   # {"id":"6172616e-676f-4000-0000-05c958168340"}
   ```

4. Generate the license key using the deployment ID, the inventory file, and
   the license credentials. You can do this with the License Activation web UI
   or with the Platform CLI tool — both produce an equivalent license key.

   {{< tabs "generate-license-key" >}}

   {{< tab "Web UI" >}}
   1. Open <https://activate.license.arango.ai/>.
   2. Enter your **License Client ID** and **License Client Secret**.
   3. Choose how to identify the deployment:
      - **Inventory** (default): drop the `inventory.json` file into the upload
        area, or click to select it. Captures the full deployment shape and is
        recommended for offline / air-gapped environments.
      - **Managed — Deployment ID only**: enter the deployment ID directly.
        The license server tracks the deployment state; no inventory file is
        needed. Use this when you want a one-off key for a known online
        deployment without running `license inventory`.
   4. Optionally enable **Custom TTL** to override the default license duration.
      Accepts values like `24h`, `168h`, `7d`, or `3600s`.
   5. Click **Activate** and copy the generated license key.

   The web UI is a convenient alternative for users who would otherwise run
   `arangodb_operator_platform license generate`. Inventory mode still requires
   the Platform CLI tool to produce the inventory file in the previous step;
   Managed mode skips that step entirely.
   {{< /tab >}}

   {{< tab "Platform CLI" >}}
   Run the Platform CLI tool with the deployment ID, the inventory file, and
   the license credentials, and write the key to a file:

   ```sh
   arangodb_operator_platform license generate \
     --deployment.id "6172616e-676f-4000-0000-05c958168340" \
     --inventory inventory.json \
     --license.client.id "your-company" \
     --license.client.secret "00000000-0000-0000-0000-000000000000" \
     2> license_key.txt
   ```
   {{< /tab >}}

   {{< /tabs >}}

### Walkthrough: generate a key in a container

{{< info >}}
**When this walkthrough applies**

Use this walkthrough if you need to run
`arangodb_operator_platform license generate` yourself — that is, you are:

- Running **standalone ArangoDB** (no Kubernetes) and want a license key
  file you can apply via arangosh or the Web UI, or
- Preparing an **air-gapped Kubernetes** install and need to generate a key
  on an internet-connected machine to carry into the air-gapped cluster.

If you run Kubernetes **with internet access**, you do not need this
walkthrough — the operator generates and renews the license automatically
from credentials. See
[Online setup](../../../../contextual-data-platform/install-and-upgrade/online-setup.md)
instead.
{{< /info >}}

This walkthrough runs the Platform CLI tool inside a container alongside
a throwaway ArangoDB instance — a convenient self-contained setup for
trying out the license generation process. The same `license inventory`
and `license generate` commands work in any environment that can reach an
ArangoDB endpoint over the network, so you can also run them against a
local install, a virtual machine, or an existing production host.

{{< warning >}}
A license key generated against the throwaway instance is only valid for
that throwaway deployment. Every ArangoDB deployment has its own
deployment ID, and the license is bound to that ID, so you cannot apply
a key generated here to a different deployment. The target deployment
may also have a different configuration (hardware, cluster topology,
etc.) that the throwaway-instance license does not cover. Use this
walkthrough to rehearse the process, and regenerate the key against
your real deployment when you are ready to apply it.
{{< /warning >}}

The commands below use the `docker` CLI. `podman` provides
Docker-compatible CLI commands, so the same invocations work by
substituting `podman` for `docker`; for other container runtimes, use
the equivalent commands.

{{< info >}}
The Platform CLI tool (`arangodb_operator_platform`) is compatible with
ArangoDB v3.12.6 and later.
{{< /info >}}

#### 1. Download the Platform CLI tool

On the host machine, download the Platform CLI tool
`arangodb_operator_platform` from
<https://github.com/arangodb/kube-arangodb/releases>.

Pick the build that matches the container image's OS and CPU architecture.
For a standard Linux x86-64 ArangoDB image, download
`arangodb_operator_platform_linux_amd64` and rename it to
`arangodb_operator_platform` for convenience. Make it executable:

```sh
chmod +x ./arangodb_operator_platform
```

#### 2. Start an ArangoDB container with the CLI tool mounted

Pull and run an ArangoDB Enterprise image, for example v3.12.8. Expose the
default port `8529`, set a root password, and bind-mount the Platform CLI
binary into the container at `/usr/local/bin/` so it is immediately
available on `PATH`:

```sh
docker run -d --name arangodb \
  -p 8529:8529 \
  -e ARANGO_ROOT_PASSWORD="<root-password>" \
  -v "$(pwd)/arangodb_operator_platform:/usr/local/bin/arangodb_operator_platform:ro" \
  arangodb/enterprise:3.12.8
```

Verify the instance is up with cURL:

```sh
curl -u "root:<root-password>" http://localhost:8529/_api/version
```

#### 3. Open a shell inside the container

```sh
docker exec -it arangodb sh
```

All of the remaining steps run inside the container.

#### 4. Generate the inventory file

Create an `inventory.json` file containing information about the ArangoDB
deployment, including the deployment ID. Point the Platform CLI tool at the
ArangoDB endpoint and supply the authentication options for your instance.
The example below uses HTTP Basic Authentication with the `root` user:

```sh
arangodb_operator_platform license inventory \
  --arango.endpoint http://localhost:8529 \
  --arango.authentication Basic \
  --arango.basic.username root \
  --arango.basic.password "<root-password>" \
  inventory.json
```

If authentication is disabled on the ArangoDB instance, you can omit the
`--arango.authentication` flag (the default is `Disabled`) as well as the
credential flags. To use a JWT session token instead, pass
`--arango.authentication Token` together with `--arango.token "<jwt>"`.

#### 5. Get the deployment ID

Query the ArangoDB deployment directly for its ID. This confirms that you
are generating a license key for the deployment you expect, rather than
trusting whatever is recorded in the inventory file:

```sh
curl -u "root:<root-password>" http://localhost:8529/_admin/deployment/id
```

The response looks like `{"id":"6172616e-676f-4000-0000-05c958168340"}`.
Copy the `id` value for the next step.

#### 6. Generate the license key

Generate the license key using the deployment ID, the inventory file, and
the license credentials you received from Arango (a client ID and a client
secret). You can do this with the License Activation web UI (no extra tool
needed) or with the Platform CLI tool inside the container. Both options
produce an equivalent license key.

{{< tabs "walkthrough-generate-license-key" >}}

{{< tab "Web UI" >}}
1. Open <https://activate.license.arango.ai/>.
2. Enter your **License Client ID** and **License Client Secret**.
3. Choose how to identify the deployment:
   - **Inventory** (default): copy `inventory.json` out of the container so
     you can upload it from your browser, then drop it into the upload area:

     ```sh
     docker cp arangodb:/inventory.json ./inventory.json
     ```

   - **Managed — Deployment ID only**: enter the deployment ID from the
     previous step. No inventory file is needed.
4. Optionally enable **Custom TTL** to override the default license duration.
5. Click **Activate** and copy the generated license key into a local
   `license_key.txt` file.

The web UI is a convenient alternative for users who would otherwise run
`arangodb_operator_platform license generate`.
{{< /tab >}}

{{< tab "Platform CLI" >}}
Call the Platform CLI tool with the deployment ID, the inventory file, and
the license credentials. The command writes log output to standard output
and writes the license key itself to standard error — redirect standard
error to a file:

```sh
arangodb_operator_platform license generate \
  --deployment.id "<deployment-id>" \
  --inventory inventory.json \
  --license.client.id "<license-client-id>" \
  --license.client.secret "<license-client-secret>" \
  2> license_key.txt
```

`license_key.txt` contains your license key.

If you are working inside a short-lived container, copy the license key
out of the container before you stop it:

```sh
docker cp arangodb:/license_key.txt ./license_key.txt
```
{{< /tab >}}

{{< /tabs >}}

#### 7. Apply the license key to ArangoDB

Copy the license string from `license_key.txt` and apply it to your ArangoDB
deployment using any of the interfaces documented in the next section,
[Apply a license key](#apply-a-license-key) — for example `arangosh` or
the web interface.

## Apply a license key

### Standalone deployment

Apply a generated license key to a running ArangoDB deployment via one of
the interfaces below.

{{< tabs "interfaces" >}}

{{< tab "Web interface" >}}
1. Click **Support** in the main navigation.
2. Go to the **Rest API** tab.
3. Expand the **Administration** panel.
4. Expand the **PUT /_admin/license** sub-panel.
5. Click the **Try it out** button.
6. Paste the license key into the text area below the **Request body** label.
   Make sure the key is wrapped in double quotes.
7. Make sure the license key is surrounded by double quote marks.
8. Click the **Execute** button.
9. Scroll down to **Server response** to check the result.
{{< /tab >}}

{{< tab "arangosh" >}}
```js
db._setLicense("<license-string>");
```

See [`db._setLicense()`](../../develop/javascript-api/@arangodb/db-object.md#db_setlicenselicensestring-force)
in the _JavaScript API_ for details.
{{< /tab >}}

{{< tab "cURL" >}}
Make sure to put the license string in quotes as shown:

```sh
curl -d '"<licenseString>"' -XPUT http://localhost:8529/_db/mydb/_admin/license
```

See the [`PUT /_admin/license`](../../develop/http-api/administration.md#set-a-new-license)
endpoint in the _HTTP API_ for details.
{{< /tab >}}

{{< tab "JavaScript" >}}
Make sure to put the license string in quotes as shown:

```js
await db.setLicense('"<licenseString>"');
```

See [`Database.setLicense()`](https://arangodb.github.io/arangojs/latest/classes/databases.Database.html#setLicense)
in the _arangojs_ documentation for details.
{{< /tab >}}

{{< tab "Go" >}}
```go
ctx := context.Background()
err := client.SetLicense(ctx, "<licenseString>", false)
if err != nil {
  fmt.Println(err)
}
```

See [`ClientAdminLicense.SetLicense()`](https://pkg.go.dev/github.com/arangodb/go-driver/v2/arangodb#ClientAdminLicense)
in the _go-driver_ v2 documentation for details.
{{< /tab >}}

{{< tab "Java" >}}
{{< info >}}
The Java driver does not support setting a license key.
{{< /info >}}
{{< /tab >}}

{{< tab "Python" >}}
Make sure to put the license string in quotes as shown:

```py
err = db.set_license('"<licenseString>"')
```

See [`StandardDatabase.setLicense()`](https://docs.python-arango.com/en/main/specs.html#arango.database.StandardDatabase.set_license)
in the _python-arango_ documentation for details.
{{< /tab >}}

{{< /tabs >}}

Check the response whether the operation succeeded, for example:

```json
{ "error": false, "code": 201 }
```

Please be careful to copy the exact license key string.

### Kubernetes-managed deployment

In a Kubernetes-managed deployment — including air-gapped environments where
the Kubernetes cluster cannot reach the Arango license service — you apply a
license key by creating a Kubernetes secret and referencing it in the
`ArangoDeployment` spec. The operator takes care of setting the license on
the ArangoDB servers.

1. Generate the license key on an internet-connected system using the
   Platform CLI tool, as described in
   [Generate a license key](#generate-a-license-key) above. You need the
   deployment ID and an inventory file collected from the air-gapped
   ArangoDB instance.

2. On the cluster, create a Kubernetes secret with the generated license key.
   Substitute `<license-string>` with the key contents:

   ```sh
   kubectl create secret generic arango-license-key \
     --namespace arango \
     --from-literal=token-v2="<license-string>"
   ```

3. Reference the secret in the `spec.license.secretName` field of the
   `ArangoDeployment`:

   ```yaml
   apiVersion: "database.arangodb.com/v1"
   kind: "ArangoDeployment"
   metadata:
     name: "deployment-example"
   spec:
     # ...
     license:
       secretName: arango-license-key
   ```

Because the generated license key has a limited validity, repeat the
generation step and update the secret before the key expires. The operator
applies the updated key on its next reconciliation cycle.

If the key expires before the secret is updated, the deployment enters
read-only mode — reads keep working, but no data or data-definition
changes are possible. See [Check the license](#check-the-license) for the
full set of status values.

See [Contextual Data Platform — License Management](../../../../contextual-data-platform/license-management.md)
for the full lifecycle, including how to choose between license credentials
(online) and a generated license key (offline / air-gapped).

## Check the license

At any point, you may check the current state of your license like so:

{{< tabs "interfaces" >}}

{{< tab "Web interface" >}}
1. Click **Support** in the main navigation.
2. Go to the **Rest API** tab.
3. Expand the **Administration** panel.
4. Expand the **GET /_admin/license** sub-panel.
5. Click the **Try it out** button.
6. Click the **Execute** button.
7. Scroll down to **Server response** to check the result.
{{< /tab >}}

{{< tab "arangosh" >}}
```js
db._getLicense();
```

See [`db._getLicense()`](../../develop/javascript-api/@arangodb/db-object.md#db_getlicense)
in the _JavaScript API_ for details.
{{< /tab >}}

{{< tab "cURL" >}}
```sh
curl http://localhost:8529/_db/mydb/_admin/license
```

See the [`GET /_admin/license`](../../develop/http-api/administration.md#get-information-about-the-current-license)
endpoint in the _HTTP API_ for details.
{{< /tab >}}

{{< tab "JavaScript" >}}
```js
const license = await db.getLicense();
```

See [`Database.getLicense()`](https://arangodb.github.io/arangojs/latest/classes/databases.Database.html#getLicense)
in the _arangojs_ documentation for details.
{{< /tab >}}

{{< tab "Go" >}}
```go
ctx := context.Background()
license, err := client.GetLicense(ctx)
if err != nil {
  fmt.Println(err)
} else {
  _ = license // Use license info here
}
```

See [`ClientAdminLicense.GetLicense()`](https://pkg.go.dev/github.com/arangodb/go-driver/v2/arangodb#ClientAdminLicense)
in the _go-driver_ v2 documentation for details.
{{< /tab >}}

{{< tab "Java" >}}
{{< info >}}
The Java driver does not support getting the license information.
{{< /info >}}
{{< /tab >}}

{{< tab "Python" >}}
```py
license = db.license()
```

See [`StandardDatabase.license()`](https://docs.python-arango.com/en/main/specs.html#arango.database.StandardDatabase.license)
in the _python-arango_ documentation for details.
{{< /tab >}}

{{< /tabs >}}

The server response is different for the Community Edition and the
Enterprise Edition.

{{< tabs "arangodb-edition" >}}

{{< tab "Community Edition" >}}
```json
{
  "upgrading": false,
  "diskUsage": {
    "bytesUsed": 127316844,
    "bytesLimit": 107374182400,
    "limitReached": false,
    "secondsUntilReadOnly": 315569520,
    "secondsUntilShutDown": 315569520,
    "status": "good"
  }
}
```

The `diskUsage.status` attribute tells you the state of your Community Edition
deployment with regard to the dataset size limit at a glance and can have the
following values:

- `good`: The dataset size of your deployment is below the 100 GiB limit.
- `limit-reached`: Your deployment exceeds the size limit and you have two days
  to bring the deployment back below 100 GiB. Consider acquiring an
  Enterprise Edition license to lift the limit.
- `read-only`: Your deployment is in read-only mode because it exceeded the
  size limit for two days. All read operations to the instance keep functioning
  for two more days. However, no data or data definition changes can be made.
- `shutdown`: The server shuts down after two days of read-only mode.

The other sub-attributes of `diskUsage` indicate the dataset size limit, the
size determined for your deployment, whether it exceeds the limit, as well as
the time until the read-only mode and the shutdown are expected to occur if
you are over the limit.
{{< /tab >}}

{{< tab "Enterprise Edition" >}}
```json
{
  "upgrading": false,
  "features": {
    "expires": 1743568356
  },
  "hash": "95af ... 3de1",
  "license": "JD4E ... dnDw==",
  "version": 1,
  "status": "good"
}
```

The `status` attribute is the executive summary of your license and
can have the following values:

- `good`: Your license is valid for more than another 1 week.
- `expiring`: Your license is about to expire shortly. Please contact
  your Arango sales representative to acquire a new license or
  extend your old license.
- `read-only`: Your license has expired at which
  point the deployment will be in read-only mode. All read operations to the
  instance will keep functioning. However, no data or data definition changes
  can be made. Please contact your Arango sales representative immediately.

The attribute `expires` in `features` denotes the expiry date as Unix timestamp
(in seconds since January 1st, 1970 UTC).

The `license` field holds an encrypted and base64-encoded version of the
applied license for reference and support from Arango.
{{< /tab >}}

{{< /tabs >}}

## Monitoring

In order to monitor the remaining validity of the license, the metric
`arangodb_license_expires` is exposed by Coordinators and DB-Servers, see the
[Metrics API](../../develop/http-api/monitoring/metrics.md).

## Managing Your License

Backups, restores, exports and imports and the license management do not
interfere with each other. In other words, the license is not backed up
and restored with any of the above mechanisms.

Make sure that you store your license in a safe place, and potentially the
email with which you received it, should you require the license key to
re-activate a deployment.
