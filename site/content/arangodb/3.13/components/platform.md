---
title: The ArangoDB Platform
menuTitle: Platform
weight: 169
description: >-
  The ArangoDB Platform brings everything ArangoDB offers together to a single
  solution that you can deploy on-prem or use as a managed service
---
{{< tip >}}
The ArangoDB Platform & AI Services are available as a pre-release. To get
exclusive early access, [get in touch](https://arangodb.com/contact/) with
the ArangoDB team.
{{< /tip >}}

The ArangoDB Platform is a technical infrastructure that acts as the umbrella
for hosting the entire ArangoDB offering of products. The Platform makes it easy
to deploy and operate the core ArangoDB database system along with any additional
ArangoDB products for machine learning, data explorations, and more. You can
run it on-premises or in the cloud yourself on top of Kubernetes to access all
of the platform features.

## Features of the ArangoDB Platform

- **Core database system**: The ArangoDB graph database system for storing
  interconnected data.{{< comment >}} You can use the free Community Edition or the commercial
  Enterprise Edition.{{< /comment >}}
- **Graph Visualizer**: A web-based tool for exploring your graph data with an
  intuitive interface and sophisticated querying capabilities.
- **Graph Analytics**: A suite of graph algorithms including PageRank,
  community detection, and centrality measures with support for GPU
  acceleration thanks to Nvidia cuGraph.
- **AI Services**: A set of machine learning services, APIs, and
  user interfaces that are available as a package as well as individual products.
  - **GraphML**: A turnkey solution for graph machine learning for prediction
    use cases such as fraud detection, supply chain, healthcare, retail, and
    cyber security.
  - **GraphRAG**: Leverage ArangoDB's graph, document, key-value,
      full-text search, and vector search features to streamline knowledge
      extraction and retrieval.
      {{< comment >}}TODO: Not available in prerelease version
      - **Txt2AQL**: Unlock natural language querying with a service that converts
        user input into ArangoDB Query Language (AQL), powered by fine-tuned
        private or public LLMs.
      {{< /comment >}}
      - **GraphRAG Importer**: Extract entities and relationships from large
        text-based files, converting unstructured data into a knowledge graph
        stored in ArangoDB.
      - **GraphRAG Retriever**: Perform semantic similarity searches or aggregate
        insights from graph communities with global and local queries.
      - **Public and private LLM support**: Use public LLMs such as OpenAI
        or private LLMs with [Triton Inference Server](../../../ai-services/reference/triton-inference-server.md).
      - **MLflow integration**: Use the popular MLflow as a model registry for private LLMs
        or to run machine learning experiments as part of the ArangoDB Platform.
- **Jupyter notebooks**: Run a Jupyter kernel in the platform for hosting
  interactive notebooks for experimentation and development of applications
  that use ArangoDB as their backend.
{{< comment >}}TODO: Mostly unrelated to Platform, vector index in core, 
- **Vector embeddings**: You can train machine learning models for later use
  in vector search in conjunction with the core database system's `vector`
  index type. It allows you to find similar items in your dataset.
{{< /comment >}}

## Get started with the ArangoDB Platform

### Use the ArangoDB Platform as a managed service

The ArangoDB Platform is not available as a managed service yet, but it will
become available for the [Arango Managed Platform (AMP)](../../../amp/_index.md)
in the future. Until then, you can request early access to the self-hosted
ArangoDB Platform for testing.

### Self-host the ArangoDB Platform

You can set up and run the ArangoDB Platform on-premises or in the cloud and
manage this deployment yourself.

#### Requirements for self-hosting

- **Early access to the ArangoDB Platform**:
  [Get in touch](https://arangodb.com/contact/) with the ArangoDB team to get
  exclusive early access to the pre-release of the ArangoDB Platform & AI Services.

- **Kubernetes**: Orchestrates the selected services that comprise the
  ArangoDB Platform, running them in containers for safety and scalability.

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

  You need to have a container registry for installing the images of the Platform
  services. It can be a local registry.

{{< comment >}}
- **Licenses**: If you want to use any paid features, you need to purchase the
  respective packages.
{{< /comment >}}

#### Setup

1. Obtain a zip package of the ArangoDB Platform for the offline installation.
   It includes helm charts, manifests, and blobs of the container image layers.
   You also receive a package configuration file from the ArangoDB team.

2. Create a Kubernetes namespace for ArangoDB and a secret with your
   Enterprise Edition license key. Substitute `<license-string>` with the actual
   license string:

   ```sh
   kubectl create namespace arangodb

   kubectl create secret generic arango-license-key \
     --namespace arangodb \
     --from-literal=token-v2="<license-string>"
   ```

3. Install the certificate manager. You can check <https://github.com/cert-manager/cert-manager>
   for the available releases.

   ```sh
   VERSION_CERT='1.18.2' # Use a newer version if available
   helm repo add jetstack https://charts.jetstack.io
   helm repo update

   helm upgrade --install cert-manager \
     --namespace cert-manager --create-namespace \
     --version "v${VERSION_CERT}" \
     jetstack/cert-manager \
     --set crds.enabled=true
   ```

4. Install the ArangoDB operator for Kubernetes `kube-arangodb` with helm,
   with options to enable webhooks, certificates, and the gateway feature.

   ```sh
   VERSION_OPERATOR='1.3.0' # Use a newer version if available

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

5. Create an `ArangoDeployment` specification for the ArangoDB Core. See the
   [ArangoDeployment Custom Resource Overview](https://arangodb.github.io/kube-arangodb/docs/deployment-resource-reference.html)
   and the linked reference.

   You need to enable the gateway feature by setting `spec.gateway.enabled` and
   `spec.gateway.dynamic` to `true` in the specification. You also need to set
   `spec.license` to the secret created earlier. Example for an ArangoDB cluster
   deployment using version 3.12.5 with three DB-Servers and two Coordinators:

    ```yaml
    apiVersion: "database.arangodb.com/v1"
    kind: "ArangoDeployment"
    metadata:
      name: "platform-example"
    spec:
      mode: Cluster
      image: "arangodb/enterprise:3.12.5"
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

6. Download the ArangoDB Platform CLI tool `arangodb_operator_platform` from
   <https://github.com/arangodb/kube-arangodb/releases>.
   It is available for Linux and macOS, for the x86-64 as well as 64-bit ARM
   architecture (e.g. `arangodb_operator_platform_linux_amd64`).

   It is recommended to rename the downloaded executable to
   `arangodb_operator_platform` and add it to the `PATH` environment variable
   to make it available as a command in the system.

   The Platform CLI tool simplifies the further setup and later management of
   the Platform's Kubernetes services.

7. Import the zip package of the ArangoDB Platform into the container registry.
   Replace `platform.zip` with the file path of the offline installation package.
   Replace `gcr.io/my-reg` with the address of your registry.

   ```sh
   arangodb_operator_platform package import \
     --registry-docker-credentials \
     gcr.io/my-reg \
     ./platform.zip \
     platform.imported.yaml
   ```

8. Install the package using the package configuration you received from the
   ArangoDB team (`platform.yaml`) and the configuration generated by the
   previous command (`platform.imported.yaml`). These configurations are merged,
   allowing for targeted upgrades and user-defined overrides.

   The package installation creates and enables various services, including
   the unified web interface of the Platform.

   ```sh
   arangodb_operator_platform --context arangodb package install \
     --platform.name platform-example \
     ./platform.yaml \
     ./platform.imported.yaml
   ```

## Interfaces

The ArangoDB Platform uses a gateway to make all its services available via a
single port at the external address of the deployment. For a local deployment,
the base URL is `https://127.0.0.1:8529`.

### Unified web interface

You can access the ArangoDB Platform web interface with a browser by appending
`/ui/` to the base URL, e.g. `https://127.0.0.1:8529/ui/`.

### ArangoDB Core

The HTTP API of the ArangoDB Core database system is available at the base URL.
For example, the URL of the Cursor API for submitting AQL queries (against the `_system` database) is
`https://127.0.0.1:8529/_db/_system/_api/cursor`.
