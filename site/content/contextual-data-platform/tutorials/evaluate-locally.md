---
title: Get started with the Arango Contextual Data Platform (v4.0) locally
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

This is a self-hosted evaluation setup meant for learning and experimentation on
a single machine. It is not a production deployment. When you are ready to run
the platform for real, follow the [Online setup](../install-and-upgrade/online-setup.md) or
[Offline setup](../install-and-upgrade/offline-setup.md) how-to guides instead.

## Step 1: Check the system requirements

Confirm your machine can run the platform locally and that the command-line
tools you need are installed. You also gather the two things provided by the
Arango team: your license credentials and the chart you downloaded from the
website.

Your machine should have:

- An **x86-64 (amd64)** or **64-bit ARM (arm64)** CPU with at least 4 cores.
- At least 16 GB of RAM.
- At least 50 GB of free disk space for the container images.

The platform runs around a dozen pods on a single node, so give your container
runtime enough memory. If you use **Docker Desktop**, open its
**Settings > Resources** and raise the memory limit to at least 16 GiB
(20 GiB is comfortable). The default is often too low, which leaves pods stuck
`Pending` later.

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
This tutorial was validated on an Apple Silicon (arm64) Mac, so the examples use
`arm64`. On an x86-64 machine, replace `arm64` with `amd64` in Step 4 and
Step 5.
{{< /info >}}

## Step 2: Set up a local cluster

Create a throwaway Kubernetes cluster on your own machine:

```sh
kind create cluster --name arango-platform
```

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

You can find the latest release on GitHub:
<https://github.com/arangodb/kube-arangodb/releases/>

Set the options as shown below to enable webhooks and the gateway feature. Set
`operator.architectures` to match your machine (`arm64` on Apple Silicon,
`amd64` on x86-64):

```sh
VERSION_OPERATOR='1.4.2' # Use a newer version if available

helm upgrade --install operator \
  --namespace arango \
  "https://github.com/arangodb/kube-arangodb/releases/download/${VERSION_OPERATOR}/kube-arangodb-enterprise-${VERSION_OPERATOR}.tgz" \
  --set "webhooks.enabled=true" \
  --set "operator.args[0]=--deployment.feature.gateway=true" \
  --set "operator.architectures={arm64}"
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

## Step 5: Create a deployment

Declare a small, single-server ArangoDB deployment sized for a local machine.
You give the deployment a name you reuse when you install the platform; this
tutorial names it `deployment`.

The gateway feature is enabled so the platform can expose all of its services
through a single port, and vector indexes are enabled because they are required
by features such as GraphRAG. The `license` field points at the secret you
created in Step 3, and `architecture` must match your CPU (`arm64` or `amd64`).

Save the following specification as `deployment.yaml`:

```yaml
apiVersion: "database.arangodb.com/v1"
kind: "ArangoDeployment"
metadata:
  name: "deployment"
spec:
  mode: Single
  image: "arangodb/enterprise:3.12.9"
  architecture:
    - arm64
  gateway:
    enabled: true
    dynamic: true
  gateways:
    count: 1
  single:
    args:
      - --vector-index
  license:
    secretName: arango-license-key
```

Apply the specification and watch the pods start:

```sh
kubectl apply --namespace arango -f deployment.yaml

kubectl get pods --namespace arango --watch  # Ctrl+C to stop watching
```

After a few minutes, a database pod (`deployment-sngl-*`) and a gateway pod
(`deployment-gway-*`) reach the `Running` state. The first start is slow because
container images are being pulled; this is expected and only happens once.

## Step 6: Install the Contextual Data Platform chart

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

## Step 7: Verify the installation

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
deployment-gway-xxxxxxxx-xxxxx                          2/2     Running   0          169m
deployment-ml-0                                         2/2     Running   0          16m
deployment-sngl-xxxxxxxx-xxxxx                          1/1     Running   0          169m
file-manager-xxxxxxxxx-xxxxx                            2/2     Running   0          16m
platform-monitoring-grafana-xxxxxxxxx-xxxxx             2/2     Running   0          16m
platform-monitoring-prometheus-server-xxxxxxxxx-xxxxx   3/3     Running   0          16m
```

You can also check the higher-level platform services, which should all report
`READY` as `True`:

```sh
kubectl get arangoplatformservices --namespace arango
```

If a pod stays in `Pending` or keeps restarting, the machine most likely ran out
of resources; revisit the memory advice in Step 1. To see why a specific pod is
not starting, describe it and check its events and logs:

```sh
kubectl describe pod <pod-name> --namespace arango
kubectl logs <pod-name> --namespace arango
```

## Step 8: Open the web interface

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
- Build contextual retrieval with AutoGraph and GraphRAG.

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
kubectl delete --namespace arango -f deployment.yaml
helm uninstall operator --namespace arango
kubectl delete namespace arango
```

Because the whole setup is reversible, you can run this tutorial again from
scratch whenever you want to explore.
