---
title: Install the Arango Data Platform (v3.0)
menuTitle: Installation
weight: 13
description: >-
  How to set up the Data Platform on-premises, on hardware with internet access
---
{{< tip >}}
The Arango Data Platform is available as a pre-release. To get
exclusive early access, [get in touch](https://arango.ai/contact-us/) with
the Arango team.
{{< /tip >}}

## Requirements for self-hosting

- **Early access to the Arango Data Platform**:
  [Get in touch](https://arango.ai/contact-us/) with the Arango team to get
  exclusive early access to the pre-release of the Arango Data Platform & AI Suite.

- **Kubernetes**: Orchestrates the selected services that comprise the
  Arango Data Platform, running them in containers for safety and scalability.

  Set up a [Kubernetes](https://kubernetes.io/) cluster if you don't have one
  available yet.

- **kubectl**: A command line tool for communicating with a Kubernetes cluster's
  control plane.

  Install [kubectl](https://kubernetes.io/docs/tasks/tools/#kubectl) for applying
  specifications such as for creating the ArangoDB Core deployment, as well as
  for checking pods, logs, etc.

- **Helm**: A package manager for Kubernetes.

  You need to have [helm](https://helm.sh/docs/intro/install/) installed in order
  to install the required certificate manager and the ArangoDB Kubernetes Operator
  as part of the Platform setup.

- **Container registry**: A repository for storing and accessing container images.

  For offline installation such as for air-gapped environments, you need to have
  a container registry that available in your environment. It can be a local
  registry. It is needed for important and installing the images of the
  Platform Suite.

{{< comment >}}
- **Licenses**: If you want to use any paid features, you need to purchase the
  respective packages.
{{< /comment >}}

## On-premises setup

#### Step 1: Get the installation files and information

You receive a package configuration file and license credentials from the
Arango team.

The Data Platform **package configuration** is a YAML file that defines which
services to install and their configurations.

The **license credentials** are composed of a client ID and client secret that
you need to activate a deployment online or to generate license keys for
offline deployments (e.g. air-gapped).

In case of an installation on hardware with internet access, everything needed
to install the services of the Platform Suite is downloaded during the setup.

The internet access needs to be persistent for the license activation and
continuous renewal of the license.

#### Step 2: Create a namespace

Ensure `kubectl` is properly configured and can communicate with your
Kubernetes cluster, e.g. by running the following commands:

```sh
kubectl cluster-info
kubectl get nodes
```

Create a Kubernetes namespace for ArangoDB and the Platform Suite resources.
The namespace used throughout this guide is called `arangodb`, but you can use
a different name.

```sh
kubectl create namespace arangodb
```

#### Step 3: Create a secret for the license

Create a Kubernetes secret with your license credentials.

Substitute `<license-client-id>` and `<license-client-secret>`
with the actual license credentials:

```sh
kubectl create secret generic arango-license-key \
  --namespace arangodb \
  --from-literal=license-client-id="<license-client-id>" \
  --from-literal=license-client-secret="<license-client-secret>"
```

You may run the following command to verify that the secret was created:

```sh
kubectl get secret arango-license-key -n arangodb
```

Expected output:

```
NAME                 TYPE     DATA   AGE
arango-license-key   Opaque   2      10s
```

#### Step 4: Install the certificate manager

Install the certificate manager via the Jetstack Helm repository.

The `cert-manager` creates and renews TLS certificates for WebHooks in the
ArangoDB Kubernetes Operator.

You can check <https://github.com/cert-manager/cert-manager>
for the available releases.

```sh
VERSION_CERT='1.19.2' # Use a newer version if available

helm repo add jetstack https://charts.jetstack.io
helm repo update

helm upgrade --install cert-manager \
  --namespace cert-manager --create-namespace \
  --version "v${VERSION_CERT}" \
  jetstack/cert-manager \
  --set crds.enabled=true
```

You may use the following commands to wait for `cert-manager` to be ready and
verify that it is running:

```sh
kubectl wait --for=condition=ready pod -l app.kubernetes.io/instance=cert-manager -n cert-manager --timeout=120s
kubectl get pods -n cert-manager
```

Expected output (`x` stands for varying letter or digit):

```
NAME                                       READY   STATUS    RESTARTS   AGE
cert-manager-xxxxxxxxxx-xxxxx              1/1     Running   0          20s
cert-manager-cainjector-xxxxxxxxxx-xxxxx   1/1     Running   0          20s
cert-manager-webhook-xxxxxxxxx-xxxxx       1/1     Running   0          20s
```

#### Step 5: Install the Operator

Install the [ArangoDB Kubernetes Operator](https://arangodb.github.io/kube-arangodb/)
(`kube-arangodb`) with Helm. It is the core component that manages ArangoDB
deployments and the Data Platform. It watches for custom resources and creates
the necessary Kubernetes resources.

You can find the latest release on GitHub:
<https://github.com/arangodb/kube-arangodb/releases/>

Make sure set the the options as shown below to enable webhooks, certificates,
the gateway feature, and machine learning:

```sh
VERSION_OPERATOR='1.3.3' # Use a newer version if available

helm upgrade --install operator \
  --namespace arangodb \
  "https://github.com/arangodb/kube-arangodb/releases/download/${VERSION_OPERATOR}/kube-arangodb-enterprise-${VERSION_OPERATOR}.tgz" \
  --set "webhooks.enabled=true" \
  --set "certificate.enabled=true" \
  --set "operator.args[0]=--deployment.feature.gateway=true" \
  --set "operator.features.platform=true" \
  --set "operator.features.ml=true" \
  --set "operator.architectures={amd64}" # or {arm64} for ARM-based CPUs
```

You may use the following commands to wait for the operator to be ready and
verify it is running:

```bash
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=kube-arangodb-enterprise -n arangodb --timeout=120s

kubectl get deployment -n arangodb -l app.kubernetes.io/name=kube-arangodb-enterprise
kubectl get pods -n arangodb -l app.kubernetes.io/name=kube-arangodb-enterprise
```

Expected output (`x` stands for varying letter or digit):

```
NAME                       READY   UP-TO-DATE   AVAILABLE   AGE
arango-operator-operator   1/1     1            1           45s

NAME                                        READY   STATUS    RESTARTS   AGE
arango-operator-operator-xxxxxxxxxx-xxxxx   2/2     Running   0          45s
```

#### Step 6: Create a deployment

Create an `ArangoDeployment` specification for ArangoDB. See the
[ArangoDeployment Custom Resource Overview](https://arangodb.github.io/kube-arangodb/docs/deployment-resource-reference.html)
and the linked reference.

You need to enable the gateway feature by setting `spec.gateway.enabled` and
`spec.gateway.dynamic` to `true` in the specification. You also need to set
`spec.license` to the secret created earlier. Example for an ArangoDB cluster
deployment using version 3.12.7 with three DB-Servers and two Coordinators:

```yaml
apiVersion: "database.arangodb.com/v1"
kind: "ArangoDeployment"
metadata:
  name: "deployment-example"
spec:
  mode: Cluster
  image: "arangodb/enterprise:3.12.7"
  gateway:
    enabled: true
    dynamic: true
  gateways:
    count: 1
  dbservers:
    count: 3
  coordinators:
    count: 2
  license:
    secretName: arango-license-key
  # ...
```

You can save the specification as a YAML file, e.g. `deployment.yaml`.

Apply the specification and wait for the pods to be ready:

```sh
kubectl apply -f deployment.yaml

kubectl get pods --namespace arangodb --watch  # Ctrl+C to stop watching
```

Given the above specification, you should eventually see pods with the following
names with a status of `Running`:
- `deployment-example-agnt-*` (3 Agents)
- `deployment-example-crdn-*` (2 Coordinators)
- `deployment-example-prmr-*` (3 DB-Servers)
- `deployment-example-gway-*` (1 Gateway)

#### Step 7: Get the Data Platform CLI tool

Download the Arango Data Platform CLI tool `arangodb_operator_platform` from
<https://github.com/arangodb/kube-arangodb/releases>.
It is available for Linux, macOS, and Windows for the x86-64 as well as 64-bit ARM
architecture (e.g. `arangodb_operator_platform_linux_amd64`).

It is recommended to rename the downloaded executable to
`arangodb_operator_platform` (with an `.exe` extension on Windows) and add it to
the `PATH` environment variable to make it available as a command in the system.

The Platform CLI tool simplifies the further setup and later management of
the Platform's Kubernetes services.

#### Step 8: Install the Data Platform package

Install the package using the package configuration you received from the
Arango team (`platform.yaml`).

The package installation creates and enables various services, including
the unified web interface of the Data Platform.

Substitute `<license-client-id>` and `<license-client-secret>`
with the actual license credentials and `./platform.yaml` with the path to the
package configuration file.

```sh
arangodb_operator_platform --context arangodb package install \
  --license.client.id "<license-client-id>" \
  --license.client.secret "<license-client-secret>" \
  --platform.name deployment-example \
  ./platform.yaml
```

It can take a while to run this command because it downloads the Platform Suite,
and in case of the AI Data Platform, also the AI Suite.

## Interfaces

The Arango Data Platform uses a gateway to make all its services available via a
single port at the external address of the deployment. For a local deployment,
the base URL is `https://127.0.0.1:8529`.

### Unified web interface

You can access the Arango Data Platform web interface with a browser by appending
`/ui/` to the base URL, e.g. `https://127.0.0.1:8529/ui/`.

### ArangoDB Core

The HTTP API of the ArangoDB Core database system is available at the base URL.
For example, the URL of the Cursor API for submitting AQL queries (against the
`_system` database) is `https://127.0.0.1:8529/_db/_system/_api/cursor`.
