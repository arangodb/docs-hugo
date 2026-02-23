---
title: Install the Arango Data Platform (v4.0) on-premises offline
menuTitle: Offline on-prem setup
weight: 10
description: >-
  How to set up the Data Platform on your own hardware in an environment without
  internet access, including air-gapped environments
---
For offline installation and the special case of a fully air-gapped environment,
you need another environment with internet access to download data and for
generating license keys. Data needs to be transferred in both directions between
the offline and the online environment at different steps, but mainly from the
online to offline system and only small amounts from the offline to the online
system (for the licensing).

What needs to be done in which environemnt is indicated by each step:

- **Air-gapped system**: The offline environment.
- **Internet-connected system**: The online environment.

## Step 1: Download the installation files and information

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
  architecture, for example:
  
  - `arangodb_operator_platform_darwin_arm64` for macOS with Apple M1 and later CPUs
  - `arangodb_operator_platform_linux_amd64` for Linux-based systems with x86-64 CPU
  - `arangodb_operator_platform_linux_arm64` for Linux-based systems with 64-bit ARM CPU
  - `arangodb_operator_platform_windows_amd64` for Windows with 64-bit x86-64 CPU

  The Platform CLI tool simplifies the further setup and later management of
  the Platform's Kubernetes services. You also need it on the system with
  internet access for generating license keys.

  It is recommended to rename the downloaded executable to
  `arangodb_operator_platform` (with an `.exe` extension on Windows) and add it to
  the `PATH` environment variable to make it available as a command in the system.

  On Linux and macOS, you need to make the file executable. Your file manager
  may allow that in a visual way, or you can use a command-line to run
  `chmod +x arangodb_operator_platform`.

  On macOS, you may additionally need to run `xattr -r -d com.apple.quarantine arangodb_operator_platform`
  in a command-line to remove the flag that marks it as downloadead from the
  internet to be able to run it.

- Pull the necessary images from the internet and save them to files in order to
  copy them to the air-gapped system.

  You can use container management tool like Docker but you can also use a
  dedicated tool like `regctl` instead. Keep in mind that you also need this tool
  in the air-gapped environment to load the images into the container registry.

  You need at least the image of the ArangoDB Kubernetes Operator
  (`arangodb/kube-arangodb-enterprise`). If you want to use a local MinIO
  instance for blob storage, make sure to also get this image
  (e.g. `minio/minio:latest`). The process is the same for any image.

  {{< tabs "container-management" >}}

  {{< tab "Docker" >}}
  ```sh
  docker pull docker.io/arangodb/kube-arangodb-enterprise:1.4.1
  docker save docker.io/arangodb/kube-arangodb-enterprise:1.4.1 -o kube-arangodb-enterprise.tar
  ```
  {{< /tab >}}

  {{< tab "regctl" >}}
  Download the `regctl` executables that match your systems from
  <https://github.com/regclient/regclient/releases/>.

  In the following, the assumed name of the executable is `regctl`.

  On Linux and macOS, you need to make the file executable. Your file manager
  may allow that in a visual way, or you can use a command-line to run
  `chmod +x regctl`.

  On macOS, you may additionally need to run `xattr -r -d com.apple.quarantine regctl`
  in a command-line to remove the flag that marks it as downloadead from the
  internet to be able to run it.

  To pull the image and save it to a file as follows:

  ```sh
  regctl image export docker.io/arangodb/kube-arangodb-enterprise:1.4.1 kube-arangodb-enterprise.tar
  ```
  {{< /tab >}}

  {{< /tabs >}}

## Step 2: Import the images

{{< tag "Air-gapped system" >}}

You need to import at least the image of the ArangoDB Kubernetes Operator into
your local container registry. The operator can then pull this and any other
image you may need from there without internet access.

{{< tabs "container-management" >}}

{{< tab "Docker" >}}
```sh
docker load -i kube-arangodb-enterprise.tar

docker tag arangodb/kube-arangodb-enterprise:1.4.1 \
  <YOUR_REGISTRY_ADDRESS:5000>/arangodb/kube-arangodb-enterprise:1.4.1

docker push <YOUR_REGISTRY_ADDRESS:5000>/arangodb/kube-arangodb-enterprise:1.4.1
```
{{< /tab >}}

{{< tab "regctl" >}}
The `--host` parameter is only needed if your container registry uses HTTP as
opposed to HTTPS:

```sh
regctl image import \
  <YOUR_REGISTRY_ADDRESS:5000>/arangodb/kube-arangodb-enterprise:1.4.1 \
  kube-arangodb-enterprise.tar \
  --host "reg=<YOUR_REGISTRY_ADDRESS:5000>,tls=disabled"
```
{{< /tab >}}

{{< /tabs >}}

## Step 3: Create a namespace

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

## Step 4: Install the Operator

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
  "kube-arangodb-enterprise-${VERSION_OPERATOR}.tgz" \
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
  "kube-arangodb-enterprise-arm64-${VERSION_OPERATOR}.tgz" \
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

## Step 5: Create a deployment

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

## Step 6: Collect information for the licensing

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
  ... # See below
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

If the ArangoDB instance uses a **self-signed certificate**, you need to specify
the following additional option to skip TLS certificate validation:

```sh
  --arango.insecure \
```

Full command example:

```sh
arangodb_operator_platform license inventory \
  --arango.authentication Basic \
  --arango.basic.username root \
  --arango.basic.password "" \
  --arango.insecure \
  --arango.endpoint https://127.0.0.1:8529 \
  inventory.json
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

Full command example:

```sh
curl -u "root:" --insecure https://127.0.0.1:8529/_admin/deployment/id
```

Expected output (`x` stands for varying letter or digit):

```json
{"id":"xxxxxxxx-xxxx-4xxx-xxxx-xxxxxxxxxxxx"}
```

The UUID wrapped in quote marks is the deployment ID.

## Step 7: Generate a license key

{{< tag "Internet-connected system" >}}

Use your license credentials as well as the information from the previous step
to create a license key.

Substitute `<license-client-id>` and `<license-client-secret>`
with the actual license credentials. Specify the path to the inventory file
`inventory.json` and replace `<deployment-id>` with the deployment ID from
the previous step.

```sh
arangodb_operator_platform license generate \
  --license.client.id <license-client-id> \
  --license.client.secret <license-client-secret> \
  --inventory ./inventory.json \
  --deployment.id <deployment-id>
```

The command logs information to the standard output (also known as _stdout_)
and writes the license key to the standard error stream (also known as _stderr_).
You may want to redirect _stderr_ and thus the license key to a file by appending
`2> license.txt` to the above command (with a leading space).

{{< tip >}}
You can also set the license credentials as environment variables
`LICENSE_CLIENT_ID` and `LICENSE_CLIENT_SECRET`. You can then leave out the
`--license.client.id` and `--license.client.secret` command-line options.

```sh
export LICENSE_CLIENT_ID=<license-client-id>
export LICENSE_CLIENT_SECRET=<license-client-secret>

arangodb_operator_platform license generate \
  --inventory ./inventory.json \
  --deployment.id <deployment-id>
```
{{< /tip >}}

Expected output (_stdout_, `x` stands for varying letter or digit):

```
2026-02-05T17:27:28+01:00 INF Using identity for client identity={}
2026-02-05T17:27:28+01:00 INF Generating License ClusterID=<deployment-id> Inventory=true
2026-02-05T17:27:28+01:00 INF License Generated and printed to STDERR ClusterID=<deployment-id> Inventory=true LicenseID=xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

## Step 8: Create a secret for the license

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

## Step 9: Create a Data Platform package

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

## Step 10: Import the Data Platform package

Load the manifests and container images stored in the zipped package into your
container registry using the Platform CLI tool.

Specify the address under which the container registry is available and the
path to the `platform.zip` file. Furthermore, provide a file path for the
Platform CLI tool to write the package configuration to. This file will be used
in the next step:

```sh
arangodb_operator_platform package import \
  <YOUR_REGISTRY_ADDRESS:5000> \
  ./platform.zip \
  platform.imported.yaml
```
<!-- TODO: In case of a pre-made package, do we also share a package config, or does it work without? -->

If the container registry uses the HTTP protocol instead of HTTPS, you need to
specify the following option in addition:

```sh
  --registry.docker.insecure <YOUR_REGISTRY_ADDRESS:5000>
```

## Step 11: Install the Data Platform package

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

## Step 12: Set up object storage

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
