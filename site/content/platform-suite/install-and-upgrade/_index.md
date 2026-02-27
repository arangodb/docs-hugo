---
title: Install and upgrade the Arango Data Platform (v4.0)
menuTitle: Install & Upgrade
weight: 13
description: >-
  How to set up and upgrade the Data Platform online and offline
---
## Requirements for self-hosting

- **Early access to the Arango Data Platform**:
  [Get in touch](https://arango.ai/contact-us/) with the Arango team to get
  exclusive early access to the pre-release of the Arango Data Platform & Agentic AI Suite.

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

## Install the Data Platform

Follow the guide for deploying the Arango Data Platform that matches your needs:

- [**Online on-prem setup**](online-setup.md): Install with internet access.
- [**Offline on-prem setup**](offline-setup.md): Install without internet access,
  including fully air-gapped environments.

## Upgrade the Data Platform

- [**Upgrade from ArangoDB**](upgrade-from-arangodb.md): Migrate your existing
  ArangoDB deployment to a Kubernetes-managed Data Platform deployment.
- [**Upgrade version**](upgrade-version.md): Upgrade to a newer version of the
  Data Platform.

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
