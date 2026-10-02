---
title: Get started with the Arango Contextual Data Platform locally
menuTitle: Evaluate locally
weight: 5
description: >-
  A hands-on tutorial that takes you from an empty machine to a running
  Arango Contextual Data Platform you can open in your browser, ready for the
  follow-up tutorials
---
In this tutorial, we install ArangoDB and the Arango Contextual Data Platform
on our own machine, going from an empty local Kubernetes cluster to a running
platform that we can open in the browser. Along the way we meet the tools that
operate every Arango Platform deployment: kind for the cluster, kubectl to talk
to it, and Helm to install the Operator and the platform itself.

By the end, you will have:

- A local Kubernetes cluster running on your machine.
- The ArangoDB Kubernetes Operator and an ArangoDB deployment.
- The Contextual Data Platform installed from the chart you downloaded and
  reachable in a browser.
- A running platform you can build on in the follow-up tutorials, plus a simple
  way to remove everything when you are done.

## Step 1: Check the system requirements

Confirm your machine can run the platform locally and that the command-line
tools you need are installed. You also gather the two things provided by the
Arango team: your license credentials and the chart you downloaded from the
website.

Your machine should have:

- An **x86-64 (amd64)** or **64-bit ARM (arm64)** CPU with at least 4 cores.
- At least 16 GB of RAM.
- At least 50 GB of free disk space for the container images.

The platform runs around a dozen pods, plus an ArangoDB cluster, on a single
node, so give your container runtime enough memory. If you use **Docker
Desktop**, open its **Settings > Resources** and raise the memory limit to at
least 16 GiB (20 GiB is comfortable). The default is often too low, which leaves
pods stuck `Pending` later.

Install the following tools:

- [Docker](https://docs.docker.com/get-docker/) or another container runtime
  that kind supports. kind runs the Kubernetes cluster inside containers.
- [kind](https://kind.sigs.k8s.io/docs/user/quick-start/#installation) to create
  the local cluster.
- [kubectl](https://kubernetes.io/docs/tasks/tools/#kubectl) to talk to the
  cluster.
- [Helm](https://helm.sh/docs/intro/install/), version 3.10.3 or newer (Helm 4
  works too), to install the Operator and the platform chart.

If a tool is missing, install it before continuing; the rest of this tutorial
assumes all prerequisites are in place.

Finally, make sure you have the two items from the Arango team ready on disk:

- Your **license credentials**, composed of a client ID and a client secret.
- The **platform chart** you downloaded from the website, a file named
  `chart.tgz`.

{{< info >}}
This tutorial was validated on both Apple Silicon (arm64) and x86-64 (amd64)
machines. In Step 4 you set an `ARCH` variable to match your CPU, and the later
commands read it, so you choose your architecture only once.
{{< /info >}}

## Step 2: Set up a local cluster

Create a throwaway Kubernetes cluster on your own machine. The `--image` flag
pins the Kubernetes version this tutorial was validated with, so your cluster
matches the examples that follow:

```sh
kind create cluster --name arango-platform --image kindest/node:v1.33.1
```

If you already run a Kubernetes cluster and would rather use it, you can skip
this step, but that path is outside the scope of this tutorial.

kind automatically points kubectl at the new cluster, so you don't have to
configure anything by hand. Confirm that a single-node cluster is up and that
kubectl is talking to it:

```sh
kubectl cluster-info --context kind-arango-platform
kubectl get nodes
```

The node should eventually report a status of `Ready`.

Create the namespace that will hold ArangoDB and all of the platform resources.
This tutorial uses the name `arango`:

```sh
kubectl create namespace arango
```

## Step 3: Create a secret for the license

Store your license credentials in the cluster as a secret so that the Operator
can activate the deployment and keep the license renewed automatically.

License activation and renewal need ongoing internet access. For the renewal
lifecycle, the required network access (`*.license.arango.ai`), and the
configuration options, see [License Management](../license-management.md).

Substitute `<license-client-id>` and `<license-client-secret>` with your actual
license credentials. Keep the whole command on one logical line (the backslashes
continue it):

```sh
kubectl create secret generic arango-license-key \
  --namespace arango \
  --from-literal=license-client-id="<license-client-id>" \
  --from-literal=license-client-secret="<license-client-secret>"
```

Verify that the secret was created:

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
(`kube-arangodb`) with Helm. It watches your declarations and creates the
matching Kubernetes resources; nothing database-related runs until you declare
it in the next step. For how the pieces fit together, see the
[architecture overview](../architecture.md).

This tutorial installs and was validated with ArangoDB Kubernetes Operator version `1.4.2`.
Newer releases are listed on [GitHub](https://github.com/arangodb/kube-arangodb/releases/),
but staying on the tested version keeps your output matching the examples below.

First, set an `ARCH` variable to match your CPU. Every command that needs your
architecture reads this variable, so you set it only once here. Then install the
Operator with the options shown to enable webhooks and the gateway feature:

```sh
ARCH=arm64 # Apple Silicon; use amd64 on x86-64
VERSION_OPERATOR='1.4.2' # Tested version for this tutorial

helm upgrade --install operator \
  --namespace arango \
  "https://github.com/arangodb/kube-arangodb/releases/download/${VERSION_OPERATOR}/kube-arangodb-enterprise-${VERSION_OPERATOR}.tgz" \
  --set "webhooks.enabled=true" \
  --set "operator.args[0]=--deployment.feature.gateway=true" \
  --set "operator.architectures={${ARCH}}"
```

The output looks similar to the following on success:

```
Release "operator" does not exist. Installing it now.
NAME: operator
LAST DEPLOYED: Thu Jul  9 12:52:39 2026
NAMESPACE: arango
STATUS: deployed
REVISION: 1
DESCRIPTION: Install complete
TEST SUITE: None
NOTES:
You have installed Kubernetes ArangoDB Operator in version 1.4.2
```

Wait for the Operator pod to become ready and verify it is running:

```sh
kubectl wait --for=condition=ready pod --selector app.kubernetes.io/name=kube-arangodb-enterprise --namespace arango --timeout=120s

kubectl get pods --namespace arango --selector app.kubernetes.io/name=kube-arangodb-enterprise
```

Expected output (`x` stands for a varying letter or digit):

```
NAME                                        READY   STATUS    RESTARTS   AGE
arango-operator-operator-xxxxxxxxxx-xxxxx   1/1     Running   0          45s
```

If `kubectl wait` times out and the Operator pod never becomes ready, it was
most likely installed for a different architecture than your nodes provide (for
example, an `arm64` Operator on `amd64` machines). Check the deployment status:

```sh
kubectl get deployment arango-operator-operator --namespace arango -o yaml
```

The `status` section reports an error about unschedulable pods or a node
affinity mismatch. If so, correct the `ARCH` value and rerun the `helm upgrade`
command above.

## Step 5: Create a deployment

Declare an ArangoDB cluster deployment. You give the deployment a name you reuse
when you install the platform; this tutorial names it `deployment`.

The gateway feature is enabled so the platform can expose all of its services
through a single port, and vector indexes are enabled on the DB-Servers and
Coordinators because they are required by features such as GraphRAG. The
`license` field points at the secret you created in Step 3, and the deployment
reads the `ARCH` variable from Step 4, so you do not set the architecture by
hand here.

Apply the specification directly so the `ARCH` variable is filled in. This
deployment uses three DB-Servers and two Coordinators:

```sh
cat <<EOF | kubectl apply --namespace arango -f -
apiVersion: "database.arangodb.com/v1"
kind: "ArangoDeployment"
metadata:
  name: "deployment"
spec:
  mode: Cluster
  image: "arangodb/enterprise:3.12.9"
  architecture:
    - ${ARCH}
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
EOF
```

Watch the pods start:

```sh
kubectl get pods --namespace arango --watch  # Ctrl+C to stop watching
```

After a few minutes, the Agent, DB-Server, and Coordinator pods
(`deployment-agnt-*`, `deployment-prmr-*`, `deployment-crdn-*`) and a gateway
pod (`deployment-gway-*`) reach the `Running` state. The first start is slow
because container images are being pulled; this is expected and only happens
once. Because `--watch` refreshes only when something changes, a long pause with
no new output is normal while images download.

If the pods stay `Pending` and `--watch` never makes progress, the deployment
architecture most likely does not match your nodes (for example, an `arm64`
deployment on `amd64` machines). List the pods and inspect the stuck one:

```sh
kubectl get pods --namespace arango
kubectl get pod <deployment-pod> --namespace arango -o yaml
```

In the `status` section, a message such as `0/1 nodes are available: 1 node(s)
didn't match Pod's node affinity/selector` confirms an architecture mismatch. To
fix it, set `ARCH` to the architecture your nodes provide, rerun the
`kubectl apply` command above, then delete the stuck pod so the Operator
recreates it with the correct architecture:

```sh
kubectl delete pod <deployment-pod> --namespace arango
```

## Step 6: Set up object storage

Some platform features, including file upload in the Agentic AI Suite, store
their data in an object store rather than in the database. Without one, these
uploads hang with no error message, so set up storage before you install the
platform chart. This tutorial runs a local MinIO instance.

Create a namespace for MinIO and store the MinIO root credentials as a secret in
it. Create a second secret with the same credentials in the `arango` namespace
so the platform can access the store. Replace `minioadmin` and `miniopassword`
with credentials of your choosing:

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

Save the following specification as `minio.yaml`. It defines a MinIO deployment
backed by a 5 GiB volume, a service, and a one-off job that waits for MinIO to
accept connections and then creates the `arango-platform-storage` bucket:

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
  backoffLimit: 6
  template:
    spec:
      restartPolicy: OnFailure
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
              until mc alias set local "$MINIO_ENDPOINT" "$MINIO_ACCESS_KEY" "$MINIO_SECRET_KEY"; do
                echo "Waiting for MinIO to be ready..."
                sleep 2
              done
              mc mb --ignore-existing local/arango-platform-storage
```

Apply the specification and wait for the bucket job to finish. The job only
completes once MinIO is reachable and the bucket exists:

```sh
kubectl apply -f minio.yaml

kubectl wait --for=condition=complete job/minio-create-bucket \
  --namespace minio --timeout=120s
```

Confirm that MinIO is running and the bucket job completed:

```sh
kubectl get pods --namespace minio
```

Expected output:

```
NAME                          READY   STATUS      RESTARTS   AGE
minio-xxxxxxxxxx-xxxxx        1/1     Running     0          40s
minio-create-bucket-xxxxx     0/1     Completed   0          40s
```

Finally, register the store with the platform by creating an
`ArangoPlatformStorage` resource. Save the following as `platform-storage.yaml`.
Its `metadata.name` must match the name of the `ArangoDeployment` from Step 5,
which is `deployment`:

```yaml
apiVersion: platform.arangodb.com/v1beta1
kind: ArangoPlatformStorage
metadata:
  name: deployment
  namespace: arango
spec:
  backend:
    s3:
      bucketName: arango-platform-storage
      credentialsSecret:
        name: minio-credentials
      endpoint: http://minio.minio.svc.cluster.local:9000
```

Apply it and confirm that it reports `READY` as `True`:

```sh
kubectl apply -f platform-storage.yaml

kubectl get arangoplatformstorage --namespace arango
```

Expected output:

```
NAME         READY
deployment   True
```

Because you set up storage before installing the platform chart in the next
step, the platform services pick it up automatically as they start.

## Step 7: Install the Contextual Data Platform chart

Install the platform from the `chart.tgz` file you downloaded from the website.
The chart creates the platform's services as custom resources, and the Operator
then pulls each service and runs it.

Run the command from the directory that contains `chart.tgz`. The
`--set deployment=deployment` option tells the chart which ArangoDB deployment
to attach to; the value must match the `metadata.name` of the `ArangoDeployment`
from Step 5:

```sh
helm upgrade platform --install ./chart.tgz \
  --namespace arango \
  --set deployment=deployment
```

On success, Helm reports the release as deployed and lists the platform charts
and services it created:

```
Release "platform" does not exist. Installing it now.
NAME: platform
NAMESPACE: arango
STATUS: deployed
REVISION: 1
NOTES:
Arango Platform Release has been installed!

Charts:
ArangoPlatformChart arango-control-plane in Version v0.0.21
...

Services:
ArangoPlatformService arangodb-platform-ui
...
```

You do not edit the chart; you simply point Helm at it.

## Step 8: Verify the installation

The Operator now downloads and starts each platform service. Watch the pods
until they are all up:

```sh
kubectl get pods --namespace arango --watch  # Ctrl+C to stop watching
```

The first run takes several minutes because the service images are large and are
being pulled for the first time. Eventually every pod reaches a `Running` state
and reports all of its containers ready, similar to:

```
NAME                                                    READY   STATUS    RESTARTS   AGE
arango-control-plane-xxxxxxxxxx-xxxxx                   3/3     Running   0          16m
arangodb-core-ui-xxxxxxxxx-xxxxx                        2/2     Running   0          16m
arangodb-mlflow-0                                       2/2     Running   0          16m
arangodb-platform-ui-xxxxxxxxxx-xxxxx                   2/2     Running   0          16m
arangodb-platform-ui-server-xxxxxxxxxx-xxxxx            2/2     Running   0          16m
deployment-agnt-xxxxxxxx-xxxxx                          1/1     Running   0          18m
deployment-agnt-xxxxxxxx-xxxxx                          1/1     Running   0          18m
deployment-agnt-xxxxxxxx-xxxxx                          1/1     Running   0          18m
deployment-crdn-xxxxxxxx-xxxxx                          1/1     Running   0          18m
deployment-crdn-xxxxxxxx-xxxxx                          1/1     Running   0          18m
deployment-gway-xxxxxxxx-xxxxx                          2/2     Running   0          18m
deployment-ml-0                                         2/2     Running   0          16m
deployment-prmr-xxxxxxxx-xxxxx                          1/1     Running   0          18m
deployment-prmr-xxxxxxxx-xxxxx                          1/1     Running   0          18m
deployment-prmr-xxxxxxxx-xxxxx                          1/1     Running   0          18m
file-manager-xxxxxxxxx-xxxxx                            2/2     Running   0          16m
platform-monitoring-grafana-xxxxxxxxx-xxxxx             2/2     Running   0          16m
platform-monitoring-prometheus-server-xxxxxxxxx-xxxxx   3/3     Running   0          16m
```

Because `--watch` refreshes only when something changes, it never prints a clear
"finished" line. The reliable way to confirm the platform is fully up is to
check the higher-level platform services, which should all report `READY` as
`True`:

```sh
kubectl get arangoplatformservices --namespace arango
```

If a pod stays in `Pending` or keeps restarting, the machine most likely ran out
of resources; revisit the memory advice in Step 1. To see why a specific pod is
not starting, describe it and check its events and logs. Most platform pods run
several containers, so pass `--all-containers=true` to see logs from all of
them:

```sh
kubectl describe pod <pod-name> --namespace arango
kubectl logs <pod-name> --namespace arango --all-containers=true
```

## Step 9: Open the web interface

The platform exposes all of its services through the gateway on port `8529`
inside Kubernetes. Forward that port to your machine:

```sh
kubectl port-forward --namespace arango \
  service/deployment-ea 8529:8529
```

Leave that command running and open the unified web interface in your browser:

<https://127.0.0.1:8529/ui/>

Your browser warns about a self-signed certificate; for a local setup this is
expected, so continue past it. Depending on your browser, you may need to click
a button for advanced options first.

Log in with the default user `root` and an empty password. These defaults are
fine for a local evaluation but are not secure; set a password before you
expose a deployment beyond your own machine.

The Contextual Data Platform web interface loads, and the platform you installed
is now something you can see and use. This is the payoff moment of the whole
tutorial.

Stop the port forwarding when you are done by pressing {{< kbd "Ctrl C" >}} in
the terminal that runs it.

## What's next

You now have a healthy Arango Contextual Data Platform running on your machine
and reachable in the browser. This is the launch pad for the tutorials that
follow, which pick up exactly where this one ends:

- Explore the core database: load data and query it.
- Build contextual retrieval with AutoGraph and AutoRAG.

To continue with those, leave your cluster running.

## Clean up

You can leave the platform running for the follow-up tutorials. When you are
finished experimenting and want to uninstall, remove everything by deleting
the cluster:

```sh
kind delete cluster --name arango-platform
```

If you would rather keep the cluster and remove only the platform, uninstall the
Helm releases and delete the resources you created instead:

```sh
helm uninstall platform --namespace arango
kubectl delete arangodeployment deployment --namespace arango
helm uninstall operator --namespace arango
kubectl delete namespace arango
kubectl delete namespace minio
```

Because the whole setup is reversible, you can run this tutorial again from
scratch whenever you want to explore.