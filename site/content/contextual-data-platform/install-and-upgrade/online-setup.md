---
title: Install the data platform on-premises online
menuTitle: Online setup
weight: 5
description: >-
  How to set up the Contextual Data Platform on your own hardware in an
  environment with internet access
---
## Step 1: Get the installation information

You receive a package configuration file and license credentials from the
Arango team.

The Contextual Data Platform **package configuration** is a YAML file that defines which
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

Create a Kubernetes secret with your license credentials. The ArangoDB
Kubernetes Operator uses them to activate the deployment and renew the
license automatically. For the renewal lifecycle, required network access
(`*.license.arango.ai`), and configuration options, see
[License Management](../license-management.md).

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
deployments and the Contextual Data Platform. It watches for custom resources and creates
the necessary Kubernetes resources.

You can find the latest release on GitHub:
<https://github.com/arangodb/kube-arangodb/releases/>

Make sure to set the options as shown below to enable webhooks, certificates,
the gateway feature, and machine learning:

```sh
VERSION_OPERATOR='1.4.5' # Use a newer version if available

helm upgrade --install operator \
  --namespace arango \
  "https://github.com/arangodb/kube-arangodb/releases/download/${VERSION_OPERATOR}/kube-arangodb-enterprise-${VERSION_OPERATOR}.tgz" \
  --set "webhooks.enabled=true" \
  --set "operator.args[0]=--deployment.feature.gateway=true" \
  --set "operator.architectures={amd64}"
```

{{< tip >}}
Use `--set "operator.architectures={arm64}"` instead if your Kubernetes nodes
run on ARM CPUs, such as on Macs with Apple silicon (M1 and later). If the
configured architecture doesn't match the nodes, the operator cannot start the
deployment.
{{< /tip >}}

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
You have installed Kubernetes ArangoDB Operator in version 1.4.5

To access ArangoDeployments you can use:

kubectl --namespace "arango" get arangodeployments

More details can be found on https://github.com/arangodb/kube-arangodb/tree/1.4.5/docs
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
required by features such as GraphRAG (from ArangoDB version 4.0.0 onward, the
vector index feature is enabled by default). You also need to set `spec.license` to
the secret created earlier.

Example for an ArangoDB cluster deployment using version 3.12.11 with three
DB-Servers and two Coordinators with the name `deployment-example`:

```yaml
apiVersion: "database.arangodb.com/v1"
kind: "ArangoDeployment"
metadata:
  name: "deployment-example"
spec:
  mode: Cluster
  image: "arangodb/enterprise:3.12.11"
  gateway:
    enabled: true
    dynamic: true
  gateways:
    count: 1
  dbservers:
    count: 3
    args:
      - --vector-index  # For ArangoDB versions before 4.0.0
  coordinators:
    count: 2
    args:
      - --vector-index  # For ArangoDB versions before 4.0.0
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

## Step 6: Get the Contextual Data Platform CLI tool

Download the Arango Contextual Data Platform CLI tool `arangodb_operator_platform` from
<https://github.com/arangodb/kube-arangodb/releases>.
It is available for Linux, macOS, and Windows for the x86-64 as well as 64-bit ARM
architecture (e.g. `arangodb_operator_platform_linux_amd64`).

It is recommended to rename the downloaded executable to
`arangodb_operator_platform` (with an `.exe` extension on Windows) and add it to
the `PATH` environment variable to make it available as a command in the system.

The Platform CLI tool simplifies the further setup and later management of
the Platform's Kubernetes services.

## Step 7: Install the Contextual Data Platform package

Install the package using the package configuration you received from the
Arango team (`platform.yaml`).

The package installation creates and enables various services, including
the unified web interface of the Contextual Data Platform.

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

The command can take a while to complete because it pulls the container images
of all the services in the package.

## Step 8: Set up object storage

Features like MLflow and GraphML require an additional storage system to save
model training data, for instance.

The following example shows how to set up a local MinIO and integrate it with
the Arango Contextual Data Platform, but you can also use a remote object storage like S3.
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
        image: cgr.dev/chainguard/minio:latest
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
  backoffLimit: 6
  template:
    spec:
      restartPolicy: OnFailure
      containers:
        - name: mc
          image: cgr.dev/chainguard/minio-client:latest
          args:
            - mb
            - --ignore-existing
            - local/arango-platform-storage
          env:
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
            - name: MC_HOST_local
              value: http://$(MINIO_ACCESS_KEY):$(MINIO_SECRET_KEY)@minio.minio.svc.cluster.local:9000
```

{{< info >}}
The MinIO images come from the Chainguard registry because the `minio/minio`
and `minio/mc` images have been removed from Docker Hub.
{{< /info >}}

Set up the MinIO service by applying the configuration file:

```sh
kubectl apply -f ./minio.yaml
```

Create another file to configure the storage for the Contextual Data Platform and call the
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

Integrate the object storage with the Contextual Data Platform by applying the file:

```sh
kubectl apply -f ./platform-storage.yaml
```

## Step 9: Verify the installation

The Operator downloads and starts the platform services. Watch the pods until
they are all up:

```sh
kubectl get pods --namespace arango --watch
```

The first run takes several minutes because the service images are large and
are pulled for the first time. Eventually, every pod reaches the `Running`
state with all of its containers ready.

The pod list shows the readiness at a glance, but the reliable way to confirm
that the platform is fully up is to check the platform services. They should
all report `READY` as `True`:

```sh
kubectl get arangoplatformservices --namespace arango
```

If a pod stays in `Pending` or keeps restarting, the nodes most likely ran out
of resources. To find out why a pod doesn't start, describe it and check its
events and logs. Most platform pods run multiple containers, so pass
`--all-containers=true` to get the logs of all of them:

```sh
kubectl describe pod <pod-name> --namespace arango
kubectl logs <pod-name> --namespace arango --all-containers=true
```

## Step 10: Open the web interface

The platform exposes all of its services through the gateway on port `8529`
inside Kubernetes. Forward that port to your machine:

```sh
kubectl port-forward --namespace arango \
  service/deployment-example-ea 8529:8529
```

Leave that command running and open the unified web interface in your browser:

<https://127.0.0.1:8529/ui/>

Log in with the default user `root` and an empty password. These defaults are
fine for a local evaluation but are not secure; set a password before you
expose a deployment beyond your own machine.

For the browser warning about the self-signed certificate, how to stop the port
forwarding, and how to reach the other interfaces, see
[Interfaces](_index.md#interfaces).