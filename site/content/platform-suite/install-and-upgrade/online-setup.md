---
title: Install the Arango Data Platform (v4.0) on-premises online
menuTitle: Online on-prem setup
weight: 5
description: >-
  How to set up the Data Platform on your own hardware in an environment with
  internet access
---
## Step 1: Get the installation files and information

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

## Step 2: Create a namespace

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

## Step 3: Create a secret for the license

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

## Step 4: Install the Operator

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

## Step 5: Create a deployment

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

## Step 6: Get the Data Platform CLI tool

Download the Arango Data Platform CLI tool `arangodb_operator_platform` from
<https://github.com/arangodb/kube-arangodb/releases>.
It is available for Linux, macOS, and Windows for the x86-64 as well as 64-bit ARM
architecture (e.g. `arangodb_operator_platform_linux_amd64`).

It is recommended to rename the downloaded executable to
`arangodb_operator_platform` (with an `.exe` extension on Windows) and add it to
the `PATH` environment variable to make it available as a command in the system.

The Platform CLI tool simplifies the further setup and later management of
the Platform's Kubernetes services.

## Step 7: Install the Data Platform package

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
and in case of the Arango Contextual Data Platform, also the Agentic AI Suite.

## Step 8: Set up object storage

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
