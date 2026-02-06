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
  to install the ArangoDB Kubernetes Operator as part of the Data Platform setup.

- **Container registry**: A repository for storing and accessing container images.

  For offline installation such as for air-gapped environments, you need to have
  a container registry that available in your environment. It can be a local
  registry. It is needed for importing and installing the images of the
  Platform Suite.

  In environments with internet access, you don't need your own container registry
  but you can optionally use one.

{{< comment >}}
- **Licenses**: If you want to use any paid features, you need to purchase the
  respective packages.
{{< /comment >}}

## On-premises setup

### Step 1: Get the installation files and information

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

### Step 2: Create a namespace

Ensure `kubectl` is properly configured and can communicate with your
Kubernetes cluster, e.g. by running the following commands:

```sh
kubectl cluster-info
kubectl get nodes
```

Create a Kubernetes namespace for ArangoDB and the Platform Suite resources.
The namespace used throughout this guide is called `arango`, but you can use
a different name.

```sh
kubectl create namespace arango
```

{{< info >}}
When you specify the namespace for a command, you can do that in two ways:

- `--namespace arango` (long-form option)
- `-n arango` (short-form option)

This guide uses long-form options for clarity.
{{< /info >}}

### Step 3: Create a secret for the license

Create a Kubernetes secret with your license credentials.

Substitute `<license-client-id>` and `<license-client-secret>`
with the actual license credentials:

```sh
kubectl create secret generic arango-license-key \
  --namespace arango \
  --from-literal=license-client-id="<license-client-id>" \
  --from-literal=license-client-secret="<license-client-secret>"
```

You may run the following command to verify that the secret was created:

```sh
kubectl get secret arango-license-key --namespace arango
```

Expected output:

```
NAME                 TYPE     DATA   AGE
arango-license-key   Opaque   2      10s
```

### Step 4: Install the Operator

Install the [ArangoDB Kubernetes Operator](https://arangodb.github.io/kube-arangodb/)
(`kube-arangodb`) with Helm. It is the core component that manages ArangoDB
deployments and the Data Platform. It watches for custom resources and creates
the necessary Kubernetes resources.

You can find the latest release on GitHub:
<https://github.com/arangodb/kube-arangodb/releases/>

Make sure set the the options as shown below to enable webhooks, certificates,
the gateway feature, and machine learning:

{{< tabs "cpu-arch" >}}

{{< tab "x86-64" >}}
```sh
VERSION_OPERATOR='1.4.1' # Use a newer version if available

helm upgrade --install operator \
  --namespace arango \
  "https://github.com/arangodb/kube-arangodb/releases/download/${VERSION_OPERATOR}/kube-arangodb-enterprise-${VERSION_OPERATOR}.tgz" \
  --set "operator.args[0]=--deployment.feature.gateway=true" \
  --set "operator.features.platform=true" \
  --set "operator.features.ml=true" \
  --set "operator.architectures={amd64}"
```
{{< /tab >}}

{{< tab "ARM" >}}
```sh
VERSION_OPERATOR='1.4.1' # Use a newer version if available

helm upgrade --install operator \
  --namespace arango \
  "https://github.com/arangodb/kube-arangodb/releases/download/${VERSION_OPERATOR}/kube-arangodb-enterprise-arm64-${VERSION_OPERATOR}.tgz" \
  --set "operator.args[0]=--deployment.feature.gateway=true" \
  --set "operator.features.platform=true" \
  --set "operator.features.ml=true" \
  --set "operator.architectures={arm64}"
```
{{< /tab >}}

{{< /tabs >}}

The output looks similar to the following on success:

```
Release "operator" does not exist. Installing it now.
NAME: operator
LAST DEPLOYED: Thu Feb  5 16:12:21 2026
NAMESPACE: arango
STATUS: deployed
REVISION: 1
DESCRIPTION: Install complete
TEST SUITE: None
NOTES:
You have installed Kubernetes ArangoDB Operator in version 1.4.1

To access ArangoDeployments you can use:

kubectl --namespace "arango" get arangodeployments

More details can be found on https://github.com/arangodb/kube-arangodb/tree/1.4.1/docs
```

You may use the following commands to wait for the operator to be ready and
verify it is running:

```bash
kubectl wait --for=condition=ready pod --selector app.kubernetes.io/name=kube-arangodb-enterprise --namespace arango --timeout=120s

kubectl get deployment --namespace arango --selector app.kubernetes.io/name=kube-arangodb-enterprise
kubectl get pods --namespace arango --selector app.kubernetes.io/name=kube-arangodb-enterprise
```

Expected output (`x` stands for varying letter or digit):

```
NAME                       READY   UP-TO-DATE   AVAILABLE   AGE
arango-operator-operator   1/1     1            1           45s

NAME                                        READY   STATUS    RESTARTS   AGE
arango-operator-operator-xxxxxxxxxx-xxxxx   2/2     Running   0          45s
```

### Step 5: Create a deployment

Create an `ArangoDeployment` specification for ArangoDB. See the
[ArangoDeployment Custom Resource Overview](https://arangodb.github.io/kube-arangodb/docs/deployment-resource-reference.html)
and the linked reference.

You need to enable the gateway feature by setting `spec.gateway.enabled` and
`spec.gateway.dynamic` to `true` in the specification. Enable vector indexes
(on DB-Servers and Coordinators respectively on single server) because they are
required by features such as GraphRAG. You also need to set `spec.license` to
the secret created earlier.

Example for an ArangoDB cluster deployment using version 3.12.7 with three
DB-Servers and two Coordinators with the name `deployment-example`:

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
    args:
      - --vector-index
  coordinators:
    count: 2
    args:
      - --vector-index
  license:
    secretName: arango-license-key
  # ...
```

You can save the specification as a YAML file, e.g. `deployment.yaml`.

Apply the specification using the previously created name (here: `arango`)
and wait for the pods to be ready:

```sh
kubectl apply --namespace arango -f deployment.yaml

kubectl get pods --namespace arango --watch  # Ctrl+C to stop watching
```

Given the above specification using the name `deployment-example`, you should
eventually see pods with the following names with a status of `Running`:
- `deployment-example-agnt-*` (3 Agents)
- `deployment-example-crdn-*` (2 Coordinators)
- `deployment-example-prmr-*` (3 DB-Servers)
- `deployment-example-gway-*` (1 Gateway)

### Step 6: Get the Data Platform CLI tool

Download the Arango Data Platform CLI tool `arangodb_operator_platform` from
<https://github.com/arangodb/kube-arangodb/releases>.
It is available for Linux, macOS, and Windows for the x86-64 as well as 64-bit ARM
architecture (e.g. `arangodb_operator_platform_linux_amd64`).

It is recommended to rename the downloaded executable to
`arangodb_operator_platform` (with an `.exe` extension on Windows) and add it to
the `PATH` environment variable to make it available as a command in the system.

The Platform CLI tool simplifies the further setup and later management of
the Platform's Kubernetes services.

### Step 7: Install the Data Platform package

Install the package using the package configuration you received from the
Arango team (`platform.yaml`).

The package installation creates and enables various services, including
the unified web interface of the Data Platform.

Substitute `<license-client-id>` and `<license-client-secret>`
with the actual license credentials and `./platform.yaml` with the path to the
package configuration file. The platform name (`deployment-example`) needs to
match the name as specified in the `ArangoDeployment` configuration.

```sh
arangodb_operator_platform --namespace arango package install \
  --license.client.id "<license-client-id>" \
  --license.client.secret "<license-client-secret>" \
  --platform.name deployment-example \
  ./platform.yaml
```

It can take a while to run this command because it downloads the Platform Suite,
and in case of the AI Data Platform, also the AI Suite.

### Step 8: Set up object storage

Features like MLflow and GraphML require an additional storage system to save
model training data, for instance.

The following example shows how to set up a local MinIO and integrate it with
the Arango Data Platform, but you can also use a remote object storage like S3.
For the supported storage systems, see the
[`kube-arangodb` documentation](https://arangodb.github.io/kube-arangodb/docs/platform/storage.html).

Create a Kubernetes namespace for MinIO, then create a secret in this namespace
with the username and password to use for the MinIO root user (replace `minioadmin`
and `miniopassword` with the credentials you actually want to use). Create another
secret with the same credentials but in the namespace of your `ArangoDeployment`,
which is `arango` in this example:

```sh
kubectl create namespace minio

kubectl create secret generic minio-root \
  --namespace minio \
  --from-literal=MINIO_ROOT_USER=minioadmin \
  --from-literal=MINIO_ROOT_PASSWORD=miniopassword

kubectl create secret generic minio-credentials \
  --namespace arango \
  --from-literal=accessKey=minioadmin \
  --from-literal=secretKey=miniopassword
```

Create a file to configure MinIO service and call it e.g. `minio.yaml`.
Example using a Persistent Volume Claim (PVC) of five gibibytes:

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
 name: minio-data-pvc
 namespace: minio
spec:
 accessModes:
   - ReadWriteOnce
 resources:
   requests:
     storage: 5Gi
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: minio
  namespace: minio
spec:
  replicas: 1
  selector:
    matchLabels:
      app: minio
  template:
    metadata:
      labels:
        app: minio
    spec:
      containers:
      - name: minio
        image: minio/minio:latest
        args:
          - server
          - /data
        envFrom:
          - secretRef:
              name: minio-root
        ports:
          - containerPort: 9000
        volumeMounts:
          - name: data
            mountPath: /data
      volumes:
        - name: data
          persistentVolumeClaim:
            claimName: minio-data-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: minio
  namespace: minio
spec:
  selector:
    app: minio
  ports:
    - port: 9000
      targetPort: 9000
---
apiVersion: batch/v1
kind: Job
metadata:
  name: minio-create-bucket
  namespace: minio
spec:
  backoffLimit: 1
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: mc
          image: minio/mc
          env:
            - name: MINIO_ENDPOINT
              value: http://minio.minio.svc.cluster.local:9000
            - name: MINIO_ACCESS_KEY
              valueFrom:
                secretKeyRef:
                  name: minio-root
                  key: MINIO_ROOT_USER
            - name: MINIO_SECRET_KEY
              valueFrom:
                secretKeyRef:
                  name: minio-root
                  key: MINIO_ROOT_PASSWORD
          command:
            - sh
            - -c
            - |
              mc alias set local $MINIO_ENDPOINT $MINIO_ACCESS_KEY $MINIO_SECRET_KEY
              mc mb local/arango-platform-storage || true
```

Set up the MinIO service by applying the configuration file:

```sh
kubectl apply -f ./minio.yaml
```

Create another file to configure the storage for the Data Platform and call the
file e.g. `platform-storage.yaml`. Note that the name of the `ArangoPlatformStorage`
must be the same as for the `ArangoDeployment`:

```yaml
apiVersion: platform.arangodb.com/v1beta1
kind: ArangoPlatformStorage
metadata:
  name: deployment-example
  namespace: arango
spec:
  backend:
    s3:
      bucketName: arango-platform-storage
      credentialsSecret:
        name: minio-credentials
      endpoint: http://minio.minio.svc.cluster.local:9000
```

Integrate the object storage with the Data Platform by applying the file:

```sh
kubectl apply -f ./platform-storage.yaml
```

## Air-gapped setup

For offline installation and the special case of a fully air-gapped environment,
you need another environment with internet access to download data and for
generating license keys. Data needs to be transferred in both directions between
the offline and the online environment at different steps, but only small amounts
from the offline to the online system for the licensing.

What needs to be done in which environemnt is indicated by each step:

- **Air-gapped system**: The offline environment.

- **Internet-connected system**: The online environment. Can also be the
  offline environment if temporary or restricted internet access is possible.

### Step 1: Download the installation files and information

{{< tag "Internet-connected system" >}}

In case of an installation on hardware without internet access, everything needed
to install the services of the Platform Suite has to be downloaded on a system
with internet access and needs to be transferred to the offline or air-gapped
system before the setup.


- You receive **license credentials** from the Arango team. Store them securely
  on the system with internet access for repeated use.

  The license credentials are composed of a **client ID** and **client secret**
  that you need to activate a deployment online or to generate license keys for
  offline deployments (e.g. air-gapped).

- You either receive a package configuration file or a pre-made package for
  download.
  
  A **platform package** is a zipped file that contains manifests and container
  images of various services for installing the Data Platform. You can import
  the platform package into your container registry from where Kubernetes can
  pull the images.

  A Data Platform **package configuration** is a YAML file that defines which
  services to install and their configurations. You can use it to create a
  platform package yourself by exporting from Arango's container registry.

- Download the latest enterprise version of the ArangoDB Kubernetes Operator
  `kube-arangodb` from <https://github.com/arangodb/kube-arangodb/releases>.

  Look for the files called `kube-arangodb-enterprise-x.x.x.tgz` and
  `kube-arangodb-enterprise-arm64-x.x.x.tgz` (where `x.x.x` is the version number).
  You may need to click **Show all # assets** to reveal all files.
  The former is the operator for x86-64 CPUs and the latter for 64-bit ARM chips.

- Download the Arango Data Platform CLI tool `arangodb_operator_platform` from
  <https://github.com/arangodb/kube-arangodb/releases>.
  It is available for Linux, macOS, and Windows for the x86-64 as well as 64-bit ARM
  architecture (e.g. `arangodb_operator_platform_linux_amd64`).

  It is recommended to rename the downloaded executable to
  `arangodb_operator_platform` (with an `.exe` extension on Windows) and add it to
  the `PATH` environment variable to make it available as a command in the system.

  The Platform CLI tool simplifies the further setup and later management of
  the Platform's Kubernetes services. You also need it on the system with
  internet access for generating license keys.

<!-- TODO
- Pull operator image? `arangodb/kube-arangodb-enterprise:1.4.1`

- If you want to set up a local object storage, make sure to download the
  installation files or the container image. For example,
  `minio/minio:latest`
-->

### Step 2: Create a namespace

{{< tag "Air-gapped system" >}}

Ensure `kubectl` is properly configured and can communicate with your
Kubernetes cluster, e.g. by running the following commands:

```sh
kubectl cluster-info
kubectl get nodes
```

Create a Kubernetes namespace for ArangoDB and the Platform Suite resources.
The namespace used throughout this guide is called `arango`, but you can use
a different name.

```sh
kubectl create namespace arango
```

{{< info >}}
When you specify the namespace for a command, you can do that in two ways:

- `--namespace arango` (long-form option)
- `-n arango` (short-form option)

This guide uses long-form options for clarity.
{{< /info >}}

### Step 3: Install the Operator

{{< tag "Air-gapped system" >}}

Install the [ArangoDB Kubernetes Operator](https://arangodb.github.io/kube-arangodb/)
(`kube-arangodb`) from the downloaded `.tgz` file with Helm.

This operator is the core component that manages ArangoDB
deployments and the Data Platform. It watches for custom resources and creates
the necessary Kubernetes resources.

Make sure set the the options as shown below to enable the gateway feature and
machine learning feature:
<!-- TODO:
--set "certificate.enabled=true" \
Is this related to cert-manager that we no longer need with 1.4.0+?
-->

{{< tabs "cpu-arch" >}}

{{< tab "x86-64" >}}
```sh
VERSION_OPERATOR='1.4.1' # Use a newer version if available

helm upgrade --install operator \
  --namespace arango \
  kube-arangodb-enterprise-${VERSION_OPERATOR}.tgz" \
  --set "operator.args[0]=--deployment.feature.gateway=true" \
  --set "operator.features.platform=true" \
  --set "operator.features.ml=true" \
  --set "operator.architectures={amd64}"
```
{{< /tab >}}

{{< tab "ARM" >}}
```sh
VERSION_OPERATOR='1.4.1' # Use a newer version if available

helm upgrade --install operator \
  --namespace arango \
  kube-arangodb-enterprise-arm64-${VERSION_OPERATOR}.tgz" \
  --set "operator.args[0]=--deployment.feature.gateway=true" \
  --set "operator.features.platform=true" \
  --set "operator.features.ml=true" \
  --set "operator.architectures={arm64}"
```
{{< /tab >}}

{{< /tabs >}}

The output looks similar to the following on success:

```
Release "operator" does not exist. Installing it now.
NAME: operator
LAST DEPLOYED: Thu Feb  5 16:12:21 2026
NAMESPACE: arango
STATUS: deployed
REVISION: 1
DESCRIPTION: Install complete
TEST SUITE: None
NOTES:
You have installed Kubernetes ArangoDB Operator in version 1.4.1

To access ArangoDeployments you can use:

kubectl --namespace "arango" get arangodeployments

More details can be found on https://github.com/arangodb/kube-arangodb/tree/1.4.1/docs
```

You may use the following commands to wait for the operator to be ready and
verify it is running:

```bash
kubectl wait --for=condition=ready pod --selector app.kubernetes.io/name=kube-arangodb-enterprise --namespace arango --timeout=120s

kubectl get deployment --namespace arango --selector app.kubernetes.io/name=kube-arangodb-enterprise
kubectl get pods --namespace arango --selector app.kubernetes.io/name=kube-arangodb-enterprise
```

Expected output (`x` stands for varying letter or digit):

```
pod/arango-operator-operator-xxxxxxxxxx-xxxxx condition met

NAME                       READY   UP-TO-DATE   AVAILABLE   AGE
arango-operator-operator   1/1     1            1           45s

NAME                                        READY   STATUS    RESTARTS   AGE
arango-operator-operator-xxxxxxxxxx-xxxxx   2/2     Running   0          45s
```

### Step 4: Create a deployment

{{< tag "Air-gapped system" >}}

Create an `ArangoDeployment` specification for ArangoDB. See the
[ArangoDeployment Custom Resource Overview](https://arangodb.github.io/kube-arangodb/docs/deployment-resource-reference.html)
and the linked reference. The example below is a minimal specification

You need to enable the gateway feature by setting `spec.gateway.enabled` and
`spec.gateway.dynamic` to `true` in the specification. Enable vector indexes
(on DB-Servers and Coordinators respectively on single server) because they are
required by features such as GraphRAG.<!-- TODO: Default enabled 4.0.0 --> You also need to set `spec.license` to
a secret that you will create later.

Example for an ArangoDB cluster deployment using version 3.12.7 with three
DB-Servers and two Coordinators with the name `deployment-example`:

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
    args:
      - --vector-index
  coordinators:
    count: 2
    args:
      - --vector-index
  license:
    secretName: arango-license-key
  # ...
```

You can save the specification as a YAML file, e.g. `deployment.yaml`.

Apply the specification using the previously created name (here: `arango`)
and wait for the pods to be ready:

```sh
kubectl apply --namespace arango -f deployment.yaml

kubectl get pods --namespace arango --watch  # Ctrl+C to stop watching
```

Given the above specification using the name `deployment-example`, you should
eventually see pods with the following names with a status of `Running`:
- `deployment-example-agnt-*` (3 Agents)
- `deployment-example-crdn-*` (2 Coordinators)
- `deployment-example-prmr-*` (3 DB-Servers)
- `deployment-example-gway-*` (1 Gateway)

### Step 5: Collect information for the licensing

{{< tag "Air-gapped system" >}}

Before you can create a license key that you can apply on the air-gapped system,
you need to get some information about the ArangoDB deployment.

Use the Platform CLI tool to create an inventory file. You need to specify the
authentication method for ArangoDB (`Disabled`, `Basic`, `Token`), additional
authentication details depending on the selected authentication method, where the
ArangoDB instance can be reached, as well as a file path for the inventory file:

```sh
arangodb_operator_platform license inventory \
  --arango.authentication <auth-method> \
  ...
  --arango.endpoint <arangodb-endpoint> \
  inventory.json
```

The required authentication options per authentication method:

- **Disabled**: \
  If the ArangoDB instance has authentication disabled, then you don't need to
  specify any additional authentication details. You can also leave out
  `--arango.authentication Disabled` because `Disabled` is the default value.

- **Basic**: \
  If you want to use ArangoDB user credentials, you need to specify that you want
  to use HTTP Basic Authentication together with a user name and their password:

  ```sh
    --arango.authentication Basic \
    --arango.basic.username "<user-name>" \
    --arango.basic.password "<password>" \
  ```

- **Token**: \
  If you want to use a JWT session token, you need to specify that you want to
  use a token as well as the JWT itself:

  ```sh
    --arango.authentication Token \
    --arango.token <jwt> \
  ```

If the ArangoDB instance uses a self-signed certificate, you need to specify
the following additional option to skip TLS certificate validation:

```sh
  --arango.insecure
```

Expected output:

```
2026-02-05T17:03:07+01:00 INF Connecting to the server...
2026-02-05T17:03:07+01:00 INF Discovered Arango 3.12.7-2 (enterprise)
2026-02-05T17:03:07+01:00 INF Starting executor name=server.mode thread=0
2026-02-05T17:03:07+01:00 INF Starting executor name=server.info thread=0
2026-02-05T17:03:07+01:00 INF Starting executor name=aql.timestamp thread=0
2026-02-05T17:03:07+01:00 INF Starting executor name=deployment.id thread=0
```

Finally, get the deployment ID using an endpoint of ArangoDB's HTTP API.
Substitute `https://127.0.0.1:8529` with the endpoint at which ArangoDB can be
reached. You may need to specify additional options for authentication in place
of `...`:

```sh
curl ... https://127.0.0.1:8529/_admin/deployment/id
```

The authentication options:

- **Disabled**: \
  If the ArangoDB instance has authentication disabled, then you don't need to
  specify any additional authentication options.

- **Username and password**: \
  If you want to use ArangoDB user credentials, set cURL's `-u` option and
  provide the user name and password separated by a colon:

  ```sh
  curl -u "<user-name>:<password>" https://...
  ```

- **Token**: \
  If you want to use a JWT session token, use cURL's `-H` option to set an
  HTTP header with the token:

  ```sh
  curl -H "Authorization: bearer <token>" https://...
  ```

If the ArangoDB instance uses self-signed certificates, you additionally need to
set the `--insecure` / `-k` option to skip TLS certificate validation:

```sh
curl --insecure ...
```

Expected output (`x` stands for varying letter or digit):

```json
{"id":"xxxxxxxx-xxxx-4xxx-xxxx-xxxxxxxxxxxx"}
```

The UUID wrapped in quote marks is the deployment ID.

### Step 6: Generate a license key

{{< tag "Internet-connected system" >}}

Use your license credentials as well as the information from the previous step
to create a license key.

Substitute `<license-client-id>` and `<license-client-secret>`
with the actual license credentials. Specify the path to the inventory file
`inventory.json` and replace `<deployment-id>` with the deployment ID from
the previous step:

```sh
arangodb_operator_platform license generate \
  --license.client.id <license-client-id> \
  --license.client.secret <license-client-secret> \
  --inventory ./inventory.json \
  --deployment.id <deployment-id>
```

### Step 7: Create a secret for the license

Create a Kubernetes secret with your license credentials.

Substitute `<license-string>` with the license key you generated:

```sh
kubectl create secret generic arango-license-key \
  --namespace arango \
  --from-literal=token-v2="<license-string>"
```

You may run the following command to verify that the secret was created:

```sh
kubectl get secret arango-license-key --namespace arango
```

Expected output:

```
NAME                 TYPE     DATA   AGE
arango-license-key   Opaque   2      10s
```

### Step 8: Create a Data Platform package

{{< tag "Internet-connected system" >}}

If the Arango team provided you a pre-made platform package, download it and
continue with the next step. Otherwise, create a platform package yourself as
described below.

Use the Platform CLI tool to download the manifests and container images of the
Platform Suite from Arango's public container registry. This requires
license credentials and internet access to `*.license.arango.ai`.

What to download is defined by the package configuration file that you received
from the Arango team. The Platform CLI tool creates a single `.zip` file out of
the downloaded data. Depending on the configuration, it can be over 40 GiB.

Substitute `<license-client-id>` and `<license-client-secret>`
with the actual license credentials and `./platform.yaml` with the path to the
package configuration file. Specify the path and a file name for the output file,
e.g. `platform.zip`:

```sh
arangodb_operator_platform package export \
  --license.client.id "<license-client-id>" \
  --license.client.secret "<license-client-secret>" \
  ./platform.yaml \
  platform.zip
```

It can take a while to download everything. If you get errors because of
internet connection issues or timeouts, re-run the command. The Platform CLI tool
caches what it downloads in a `cache` folder in the current working directory. <!-- TODO: or relative to executable? -->
You can therefore retry and continue the download where it left off.

<!-- TODO
You need both the package configuration file (`platform.yaml`) and the zipped
package (`platform.zip`) on the air-gapped system.
-->

### Step 9: Import the Data Platform package

Load the manifests and container images stored in the zipped package into your
container registry using the Platform CLI tool.

Specify the address under which the container registry is available and the
path to the `platform.zip` file. Furthermore, provide a file path for the
Platform CLI tool to write the package configuration to. This file will be used
in the next step:

```sh
arangodb_operator_platform package import \
  <your-registry-address:5000> \
  ./platform.zip \
  platform.imported.yaml
```
<!-- TODO: In case of a pre-made package, do we also share a package config, or does it work without? -->

If the container registry uses the HTTP protocol instead of HTTPS, you need to
specify the following option in addition:

```sh
  --registry.docker.insecure <your-registry-address:5000>
```

### Step 10: Install the Data Platform package

{{< tag "Air-gapped system" >}}

Install the platform package using the Platform CLI tool.

The package installation creates and enables various services, including
the unified web interface of the Data Platform.

The platform name (`deployment-example`) needs to match the name as specified in
the `ArangoDeployment` configuration. Substitute  `./platform.imported.yaml` with the
path to the package configuration file from the previous step:

```sh
arangodb_operator_platform --namespace arango package install \
  --platform.name deployment-example \
  ./platform.imported.yaml
```

It can take a while to import everything into the container registry.

### Step 11: Set up object storage

{{< tag "Air-gapped system" >}}

Features like MLflow and GraphML require an additional storage system to save
model training data, for instance.

The following example shows how to set up a local MinIO and integrate it with
the Arango Data Platform, but you can also use a remote object storage like S3.
For the supported storage systems, see the
[`kube-arangodb` documentation](https://arangodb.github.io/kube-arangodb/docs/platform/storage.html).

Create a Kubernetes namespace for MinIO, then create a secret in this namespace
with the username and password to use for the MinIO root user (replace `minioadmin`
and `miniopassword` with the credentials you actually want to use). Create another
secret with the same credentials but in the namespace of your `ArangoDeployment`,
which is `arango` in this example:

```sh
kubectl create namespace minio

kubectl create secret generic minio-root \
  --namespace minio \
  --from-literal=MINIO_ROOT_USER=minioadmin \
  --from-literal=MINIO_ROOT_PASSWORD=miniopassword

kubectl create secret generic minio-credentials \
  --namespace arango \
  --from-literal=accessKey=minioadmin \
  --from-literal=secretKey=miniopassword
```

Create a file to configure MinIO service and call it e.g. `minio.yaml`.
Example using a Persistent Volume Claim (PVC) of five gibibytes:

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
 name: minio-data-pvc
 namespace: minio
spec:
 accessModes:
   - ReadWriteOnce
 resources:
   requests:
     storage: 5Gi
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: minio
  namespace: minio
spec:
  replicas: 1
  selector:
    matchLabels:
      app: minio
  template:
    metadata:
      labels:
        app: minio
    spec:
      containers:
      - name: minio
        image: minio/minio:latest
        args:
          - server
          - /data
        envFrom:
          - secretRef:
              name: minio-root
        ports:
          - containerPort: 9000
        volumeMounts:
          - name: data
            mountPath: /data
      volumes:
        - name: data
          persistentVolumeClaim:
            claimName: minio-data-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: minio
  namespace: minio
spec:
  selector:
    app: minio
  ports:
    - port: 9000
      targetPort: 9000
---
apiVersion: batch/v1
kind: Job
metadata:
  name: minio-create-bucket
  namespace: minio
spec:
  backoffLimit: 1
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: mc
          image: minio/mc
          env:
            - name: MINIO_ENDPOINT
              value: http://minio.minio.svc.cluster.local:9000
            - name: MINIO_ACCESS_KEY
              valueFrom:
                secretKeyRef:
                  name: minio-root
                  key: MINIO_ROOT_USER
            - name: MINIO_SECRET_KEY
              valueFrom:
                secretKeyRef:
                  name: minio-root
                  key: MINIO_ROOT_PASSWORD
          command:
            - sh
            - -c
            - |
              mc alias set local $MINIO_ENDPOINT $MINIO_ACCESS_KEY $MINIO_SECRET_KEY
              mc mb local/arango-platform-storage || true
```

Set up the MinIO service by applying the configuration file:

```sh
kubectl apply -f ./minio.yaml
```

Create another file to configure the storage for the Data Platform and call the
file e.g. `platform-storage.yaml`. Note that the name of the `ArangoPlatformStorage`
must be the same as for the `ArangoDeployment`:

```yaml
apiVersion: platform.arangodb.com/v1beta1
kind: ArangoPlatformStorage
metadata:
  name: deployment-example
  namespace: arango
spec:
  backend:
    s3:
      bucketName: arango-platform-storage
      credentialsSecret:
        name: minio-credentials
      endpoint: http://minio.minio.svc.cluster.local:9000
```

Integrate the object storage with the Data Platform by applying the file:

```sh
kubectl apply -f ./platform-storage.yaml
```

## Interfaces

The Arango Data Platform uses a gateway to make all its services available via a
single port at the external address of the deployment. The service port of the
Data Platform is `8529` inside Kubernetes, but outside it can be different
depending on the configuration.

For a local deployment, you can use temporary port forwarding to access the
Data Platform from your host machine. You can select the gateway pod
(`deployment-example-gway-*`) via the higher-level service resource for
external access (`-ea`) and specify the ports like `targetPort:servicePort`:

```sh
kubectl port-forward --namespace arango \
  service/deployment-example-ea 8529:8529
```

In this case, the base URL to access the Data Platform is `https://127.0.0.1:8529`.

You can stop the port forwarding in the command-line with the key combination
{{< kbd "Ctrl C" >}}.

### Unified web interface

You can access the Arango Data Platform web interface with a browser by appending
`/ui/` to the base URL, e.g. `https://127.0.0.1:8529/ui/`.

For a local deployment without further certificate configuration, your browser
will show a warning because a self-signed certificate is used. Continue anyway
to access the web interface. Depending on your browser, the option to continue
may require that you click a button for advanced options.

### ArangoDB

The HTTP API of the ArangoDB core database system is available at the base URL.
For example, the URL of the Cursor API for running AQL queries
(in the `_system` database) is `https://127.0.0.1:8529/_db/_system/_api/cursor`.

For a local deployment without further certificate configuration, you may need
to explicitly allow self-signed certificates in drivers or tools to access the
Data Platform. For example, cURL requires that you specify the `-k` / `--insecure`
option:

```sh
curl -k -u root: -d '{"query":"RETURN 42"}' https://127.0.0.1:8529/_db/_system/_api/cursor
```
