---
title: Set up a local Kubernetes environment on macOS
menuTitle: Local Kubernetes setup
weight: 3
description: >-
  A step-by-step walkthrough for setting up a local Kubernetes cluster on a Mac,
  from installing the tools to a running cluster, ready for the ArangoDB
  Kubernetes Operator and the Arango Contextual Data Platform
---
This tutorial walks you through setting up a local Kubernetes cluster on a Mac,
one step at a time, starting from a machine with nothing installed. When you
finish, you have a running cluster that you can use to install the ArangoDB
Kubernetes Operator and the Arango Contextual Data Platform for evaluation and
development.

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

{{< info >}}
**Apple Silicon (arm64) Macs.** ArangoDB publishes `linux/arm64` images. Like all
containers on macOS, they run inside Docker's lightweight Linux VM rather than
directly on macOS, but on Apple Silicon the `arm64` CPU instructions run as-is,
without the translation or emulation that `amd64` images would need. You just
need to tell the Operator and the deployment to use `arm64`. The [Online setup](online-setup.md) steps show
how, and the [handoff at the end of this tutorial](#next-install-the-contextual-data-platform)
points the settings out. Some individual Contextual Data Platform components
(such as certain AI services) may only ship for `amd64`; if you plan to run the
full Platform locally on Apple Silicon, check availability with the Arango team.
{{< /info >}}

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

minikube can run your Kubernetes cluster on several container or virtual machine
tools. This guide uses minikube's Docker driver, so Docker is the one you install
here and it must be running before you start the cluster.

Install Docker Desktop:

```sh
brew install --cask docker
```

Now start it: open **Launchpad**, click the **Docker** icon, and wait until the
whale icon in the menu bar at the top of the screen stops animating. The first
launch may ask you to accept a license agreement and grant permissions.

Give Docker enough resources for ArangoDB. On the Docker driver, minikube runs
inside Docker and cannot use more CPU or memory than Docker itself is given, so
set Docker higher than the values you pass to minikube in
[Step 4](#step-4-start-the-cluster) and leave some headroom for the host:

1. Click the cog wheel icon in the menu bar and choose **Resources**.
2. Set **CPUs** to at least `6` and **Memory** to at least `10 GB`. minikube
   later requests `4` CPUs and `8 GB`, and requesting all of Docker's memory
   leaves nothing for Docker or macOS. (For the full Contextual Data Platform,
   set **CPUs** to at least `10` and **Memory** to at least `20 GB`, since
   minikube then requests `8` CPUs and `16 GB`.)
3. Click **Apply**.

Confirm Docker is running by checking its version in the Terminal:

```sh
docker --version
```

## Step 3: Install the command-line tools

Install the two tools you need with a single command:

```sh
brew install kubectl minikube
```

These are:

- `kubectl`: the command you use to talk to the Kubernetes cluster.
- `minikube`: the tool that creates and runs the local cluster.

Confirm they both installed correctly:

```sh
kubectl version --client
minikube version
```

Each command should print a version number.

## Step 4: Start the cluster

Create and start the cluster, telling minikube how many CPUs and how much
memory to use. The `--memory` value is in megabytes, so `8192` means 8 GB. These
values stay below the resources you gave Docker in
[Step 2](#step-2-install-and-start-docker-desktop), leaving headroom for Docker
and macOS:

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

On a fresh cluster the `default` namespace is empty, so `:pods` shows nothing at
first. Press {{< kbd "0" >}} to show all namespaces and see Kubernetes' own
system pods in `kube-system`. Your ArangoDB pods appear here later, once you
install the Operator and create a deployment by following the
[Online setup](online-setup.md) guide.

## Next: install the Contextual Data Platform

Your local Kubernetes cluster is now ready. It provides the Kubernetes
environment that the Arango Contextual Data Platform needs. Installing the
ArangoDB Kubernetes Operator, creating a deployment, and installing the Platform
services is covered by the platform installation guide, so this tutorial does not
repeat those steps.

Continue with the [Online setup](online-setup.md) guide. Your local cluster
already satisfies the cluster requirement checked in
[Step 2](online-setup.md#step-2-create-a-namespace) (`kubectl cluster-info` and
`kubectl get nodes`), so you can run that check to confirm, then follow the guide
through creating the namespace, installing the Operator, and deploying the
Platform. You receive the package configuration file and license credentials that
it references from the Arango team.

{{< info >}}
**On an Apple Silicon (arm64) Mac**, apply the `arm64` settings highlighted in
the Online setup guide: include `arm64` in
`--set "operator.architectures={amd64,arm64}"` when installing the Operator, and
add `spec.architecture: [arm64]` to the `ArangoDeployment`. Without them, the
pods stay `Pending`.
{{< /info >}}

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
a closer approximation of a real production setup.

If you want to use kind instead of minikube, replace Steps 3 and 4 above with
the following. Steps 1 and 2 (Homebrew and Docker) are the same.

1. Install the tools:

   ```sh
   brew install kubectl kind
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
**Reaching services from your Mac.** With any local cluster, including minikube
and kind, services running inside the cluster are not reachable from your Mac by
default and need port forwarding. This applies once you have installed the
Platform; see [Interfaces](_index.md#interfaces) for how to reach the web
interface.
{{< /info >}}

To remove a kind cluster:

```sh
kind delete cluster --name arango
```
