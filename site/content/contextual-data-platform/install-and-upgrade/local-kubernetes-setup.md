---
title: Set up a local Kubernetes environment on macOS
menuTitle: Local Kubernetes setup
weight: 3
description: >-
  A step-by-step walkthrough for setting up a local Kubernetes cluster on a Mac,
  from installing the tools to a running cluster, ready for operator-managed
  ArangoDB and the Arango Contextual Data Platform
---
This tutorial walks you through setting up a local Kubernetes cluster on a Mac,
one step at a time, starting from a machine with nothing installed. When you
finish, you have a running cluster that you can use to install operator-managed
ArangoDB and the Arango Contextual Data Platform for evaluation and development.

You run every command in this tutorial in the **Terminal** app. To open it,
press {{< kbd "Cmd Space" >}}, type `Terminal`, and press {{< kbd "Return" >}}.

The tutorial uses [minikube](https://minikube.sigs.k8s.io/), which is the
simplest way to run Kubernetes on a single machine and works well on macOS.
An [alternative using kind](#alternative-use-kind-instead-of-minikube) is
described at the end.

{{< info >}}
A local cluster is meant for evaluation, development, and testing. It is not a
substitute for a properly sized, highly available production cluster.
{{< /info >}}

{{< warning >}}
The Contextual Data Platform and ArangoDB Enterprise Edition images target the
**x86-64 (`amd64`)** architecture. On Apple Silicon Macs (M1, M2, M3, and
later), these images run under emulation, which is slow and may be unreliable.
For a smooth experience, use an Intel-based Mac or an x86-64 host. You can still
follow this tutorial to set up the cluster itself.
{{< /warning >}}

## Step 1: Install Homebrew

[Homebrew](https://brew.sh/) is a package manager for macOS. You use it to
install all the other tools.

To check whether you already have it, run:

```sh
brew --version
```

If you see a version number, skip to [Step 2](#step-2-install-and-start-docker-desktop).
If you instead see `command not found: brew`, install it by running the
following command and following the on-screen prompts (it asks for your Mac
password):

```sh
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

After the installation finishes, it may print two `eval` commands under a
"Next steps" heading. If it does, copy and run them so that the `brew` command
becomes available in your current Terminal. Then confirm it works:

```sh
brew --version
```

## Step 2: Install and start Docker Desktop

minikube runs your Kubernetes cluster inside Docker, so you need Docker running
first.

Install Docker Desktop:

```sh
brew install --cask docker
```

Now start it: open **Launchpad**, click the **Docker** icon, and wait until the
whale icon in the menu bar at the top of the screen stops animating. The first
launch may ask you to accept a license agreement and grant permissions.

Give Docker enough resources for ArangoDB:

1. Click the Docker whale icon in the menu bar and choose **Settings**.
2. Go to **Resources**.
3. Set **CPUs** to at least `4` and **Memory** to at least `8 GB`
   (use `8` CPUs and `16 GB` if you plan to install the full Contextual Data
   Platform).
4. Click **Apply & restart**.

Confirm Docker is running by checking its version in the Terminal:

```sh
docker --version
```

## Step 3: Install the command-line tools

Install the three tools you need with a single command:

```sh
brew install kubectl helm minikube
```

These are:

- `kubectl` — the command you use to talk to the Kubernetes cluster.
- `helm` — the package manager used later to install the ArangoDB Operator.
- `minikube` — the tool that creates and runs the local cluster.

Confirm they all installed correctly:

```sh
kubectl version --client
helm version
minikube version
```

Each command should print a version number.

## Step 4: Start the cluster

Create and start the cluster, telling minikube how many CPUs and how much
memory to use. The `--memory` value is in megabytes, so `8192` means 8 GB:

```sh
minikube start --cpus=4 --memory=8192 --driver=docker
```

The first run downloads a base image and takes a few minutes. When it finishes,
you see a message ending with something like:

```
Done! kubectl is now configured to use "minikube" cluster ...
```

minikube automatically points `kubectl` at the new cluster, so you do not need
to configure anything else.

{{< tip >}}
For the full Contextual Data Platform, start with more resources, for example
`minikube start --cpus=8 --memory=16384 --driver=docker`.
{{< /tip >}}

## Step 5: Check that the cluster is running

Ask Kubernetes for its status:

```sh
kubectl cluster-info
kubectl get nodes
```

The second command should show a single node with the status `Ready`:

```
NAME       STATUS   ROLES           AGE   VERSION
minikube   Ready    control-plane   1m    v1.xx.x
```

If you see `Ready`, your cluster is working.

## Step 6: Check that storage is available

ArangoDB needs to store data on disk, which Kubernetes handles through a
*storage class*. minikube sets one up for you. Verify it exists:

```sh
kubectl get storageclass
```

You should see a class named `standard` marked as `(default)`:

```
NAME                 PROVISIONER                RECLAIMPOLICY   ...
standard (default)   k8s.io/minikube-hostpath   Delete          ...
```

As long as a class is marked `(default)`, you are ready for the next steps.

## Step 7 (optional): Install k9s to watch the cluster

[k9s](https://k9scli.io/) is a text-based dashboard that makes it easy to watch
pods, read logs, and troubleshoot, instead of typing many `kubectl` commands.
It is optional but handy.

Install it:

```sh
brew install k9s
```

Start it:

```sh
k9s
```

Inside k9s, type `:pods` and press {{< kbd "Return" >}} to list pods, use the
arrow keys to select one, press {{< kbd "Return" >}} to see its details, press
{{< kbd "l" >}} to view its logs, and press {{< kbd "?" >}} for help. To quit,
type `:quit` and press {{< kbd "Return" >}}.

## Step 8: Install operator-managed ArangoDB on your cluster

Your cluster is ready. The following steps install the ArangoDB Kubernetes
Operator and create a single ArangoDB instance on it. A single-server
deployment (`spec.mode: Single`) is used to keep resource usage low, which is
the right choice for local work.

{{< info >}}
The ArangoDB Enterprise Edition images and the Operator require **license
credentials** (a client ID and a client secret) that you receive from the
Arango team. You need them in Step 8.2.

If you do not have a license, you can either stop after Step 7 (the cluster is
already complete) or deploy the free Community Edition instead — see
[*No license? Deploy the Community Edition*](#no-license-deploy-the-community-edition).
{{< /info >}}

### No license? Deploy the Community Edition

If you do not have license credentials, you can still see the Operator manage a
database by deploying the free **Community Edition**. It uses a different Helm
chart (without `-enterprise`), needs no license secret, and does not include the
gateway or vector indexes, which are Enterprise features.

Follow these steps instead of Steps 8.1 to 8.5:

1. Create the namespace:

   ```sh
   kubectl create namespace arango
   ```

2. Install the **Community** Operator with Helm. Note that the download URL does
   *not* contain `-enterprise`. You can use a newer version than `1.4.2` if one
   is available on the [releases page](https://github.com/arangodb/kube-arangodb/releases/):

   ```sh
   VERSION_OPERATOR='1.4.2'
   helm upgrade --install operator \
     --namespace arango \
     "https://github.com/arangodb/kube-arangodb/releases/download/${VERSION_OPERATOR}/kube-arangodb-${VERSION_OPERATOR}.tgz"
   ```

   Wait for it to be ready:

   ```sh
   kubectl wait --for=condition=ready pod \
     --selector app.kubernetes.io/name=kube-arangodb \
     --namespace arango --timeout=120s
   ```

3. Save the following as `deployment.yaml`. Note that the image is
   `arangodb/arangodb` (Community), not `arangodb/enterprise`, and there is no
   `license` field:

   ```yaml
   apiVersion: "database.arangodb.com/v1"
   kind: "ArangoDeployment"
   metadata:
     name: "deployment-example"
   spec:
     mode: Single
     image: "arangodb/arangodb:3.12.9"
   ```

4. Apply it and watch the pod start:

   ```sh
   kubectl apply --namespace arango -f deployment.yaml

   kubectl get pods --namespace arango --watch
   ```

   You should see one pod named `deployment-example-sngl-*` reach the status
   `Running`. Press {{< kbd "Ctrl C" >}} to stop watching.

5. Reach it from your Mac. Because there is no gateway, you forward the port of
   the database service `deployment-example` directly (not `deployment-example-ea`):

   ```sh
   kubectl port-forward --namespace arango \
     service/deployment-example 8529:8529
   ```

   Leave this running and open <https://127.0.0.1:8529/> in your browser. Accept
   the self-signed certificate warning to continue.

6. The Operator generates a random `root` password and stores it in a secret.
   Read it with:

   ```sh
   kubectl get secret deployment-example-root-password --namespace arango \
     -o jsonpath='{.data.password}' | base64 --decode
   ```

   If that secret does not exist, list the secrets with
   `kubectl get secrets --namespace arango` and look for the one whose name ends
   in `-root-password`. Log in to the web interface as user `root` with this
   password.

This gives you a working, operator-managed ArangoDB database without a license.
The remaining sections below (Steps 8.1 onward) describe the Enterprise path and
are not needed for the Community Edition.

### Step 8.1: Create a namespace

A *namespace* keeps all the ArangoDB resources grouped together. Create one
called `arango`:

```sh
kubectl create namespace arango
```

### Step 8.2: Store your license credentials

Create a secret that holds your license credentials so the Operator can
activate the deployment. Replace `<license-client-id>` and
`<license-client-secret>` with the actual values you received:

```sh
kubectl create secret generic arango-license-key \
  --namespace arango \
  --from-literal=license-client-id="<license-client-id>" \
  --from-literal=license-client-secret="<license-client-secret>"
```

Check that it was created:

```sh
kubectl get secret arango-license-key --namespace arango
```

You should see:

```
NAME                 TYPE     DATA   AGE
arango-license-key   Opaque   2      10s
```

### Step 8.3: Install the Operator with Helm

The [ArangoDB Kubernetes Operator](https://arangodb.github.io/kube-arangodb/)
(`kube-arangodb`) is the component that creates and manages ArangoDB for you.
Install it with Helm:

You can use a newer version than `1.4.2` if one is available on the
[releases page](https://github.com/arangodb/kube-arangodb/releases/):

```sh
VERSION_OPERATOR='1.4.2'
helm upgrade --install operator \
  --namespace arango \
  "https://github.com/arangodb/kube-arangodb/releases/download/${VERSION_OPERATOR}/kube-arangodb-enterprise-${VERSION_OPERATOR}.tgz" \
  --set "webhooks.enabled=true" \
  --set "operator.args[0]=--deployment.feature.gateway=true" \
  --set "operator.architectures={amd64}"
```

Wait for the Operator to be ready, then confirm it is running:

```sh
kubectl wait --for=condition=ready pod \
  --selector app.kubernetes.io/name=kube-arangodb-enterprise \
  --namespace arango --timeout=120s

kubectl get pods --namespace arango \
  --selector app.kubernetes.io/name=kube-arangodb-enterprise
```

You should see one pod with a status of `Running`:

```
NAME                                        READY   STATUS    RESTARTS   AGE
arango-operator-operator-xxxxxxxxxx-xxxxx   2/2     Running   0          45s
```

### Step 8.4: Create an ArangoDB deployment

Now tell the Operator to create an ArangoDB instance. Save the following as a
file named `deployment.yaml`. It defines a single-server deployment with the
gateway enabled and vector indexes turned on (needed by features such as
GraphRAG):

```yaml
apiVersion: "database.arangodb.com/v1"
kind: "ArangoDeployment"
metadata:
  name: "deployment-example"
spec:
  mode: Single
  image: "arangodb/enterprise:3.12.9"
  gateway:
    enabled: true
    dynamic: true
  single:
    args:
      - --vector-index
  license:
    secretName: arango-license-key
```

Apply the file and watch the pods start:

```sh
kubectl apply --namespace arango -f deployment.yaml

kubectl get pods --namespace arango --watch
```

After a minute or two, you should see two pods reach the status `Running`:

- `deployment-example-sngl-*` (the ArangoDB single server)
- `deployment-example-gway-*` (the gateway)

Press {{< kbd "Ctrl C" >}} to stop watching once they are running.

### Step 8.5: Access ArangoDB from your Mac

The deployment is reachable on port `8529` *inside* the cluster. To reach it
from your Mac, forward that port to your machine:

```sh
kubectl port-forward --namespace arango \
  service/deployment-example-ea 8529:8529
```

Leave this command running. While it runs, open
<https://127.0.0.1:8529/> in your browser to reach the ArangoDB web interface.

{{< info >}}
Your browser shows a security warning because the deployment uses a self-signed
certificate. This is expected for a local setup. Click the advanced or
"proceed anyway" option to continue.
{{< /info >}}

To stop forwarding the port, return to the Terminal and press
{{< kbd "Ctrl C" >}}.

### Step 8.6 (optional): Install the full Contextual Data Platform

The steps above give you operator-managed ArangoDB. To add the rest of the
Arango Contextual Data Platform (the unified web interface, the AI services, and
object storage), continue with the remaining steps of the
[Online setup](online-setup.md) guide, starting from
[*Get the Contextual Data Platform CLI tool*](online-setup.md#step-6-get-the-contextual-data-platform-cli-tool).
Those steps require the package configuration file you receive from the Arango
team.

## Stop, start, and delete the cluster

When you are done for the day, you can stop the cluster without deleting it:

```sh
minikube stop
```

Start it again later with the same command you used in Step 4, or simply:

```sh
minikube start
```

To remove the cluster completely and free up disk space:

```sh
minikube delete
```

## Alternative: use kind instead of minikube

[kind](https://kind.sigs.k8s.io/) (Kubernetes IN Docker) is another way to run a
local cluster. Its advantage is that it can model a multi-node cluster, which is
a closer approximation of a real production setup. The trade-off is that
reaching services from your Mac takes a little more setup.

If you want to use kind instead of minikube, replace Steps 3 and 4 above with
the following. Steps 1 and 2 (Homebrew and Docker) are the same.

1. Install the tools:

   ```sh
   brew install kubectl helm kind
   ```

2. Create a single-node cluster:

   ```sh
   kind create cluster --name arango
   ```

   Or, to create a cluster with one control-plane node and three worker nodes,
   first save the following as `kind-config.yaml`:

   ```yaml
   kind: Cluster
   apiVersion: kind.x-k8s.io/v1alpha4
   nodes:
     - role: control-plane
     - role: worker
     - role: worker
     - role: worker
   ```

   Then create the cluster from that file:

   ```sh
   kind create cluster --name arango --config kind-config.yaml
   ```

kind also configures `kubectl` automatically and provides a default `standard`
storage class, so you can continue from [Step 5](#step-5-check-that-the-cluster-is-running).

{{< info >}}
**Reaching services from your Mac.** Unlike minikube, kind does not expose an
address that your Mac can reach directly. The simplest option is port
forwarding, which works for any service without extra setup:

```sh
kubectl port-forward --namespace arango service/deployment-example-ea 8529:8529
```

You stop port forwarding by pressing {{< kbd "Ctrl C" >}}.
{{< /info >}}

To remove a kind cluster:

```sh
kind delete cluster --name arango
```
