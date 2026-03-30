---
title: The Arango Platform Suite (v4.0)
menuTitle: Platform Suite
weight: 3
description: >-
  The Platform Suite is a set of services and features for operating ArangoDB
  with Kubernetes and includes a Graph Visualizer and advanced Query Editor
aliases:
  - data-platform/get-started
---
## What Makes Up the Arango Platform Suite

- [**ArangoDB Enterprise Edition**](../arangodb/_index.md):
  The multi-model database foundation supporting graphs, documents, key-value,
  vector search, and full-text search capabilities.

- [**Graph Visualizer**](graph-visualizer.md):
  A sophisticated web-based interface for graph exploration, smart search, and
  visual layouts.

- [**Query Editor**](query-editor.md):
  Write, run, and analyze AQL queries using an IDE-like interface with tabs,
  result history, query management, and more.

- [**Container Manager**](./container-manager/_index.md)
  Deploy and manage custom services using your own code packages or container images.

## Operational features

- **Scaling Capabilities for Multi-Model Workloads:**
  The platform supports Kubernetes-native scaling for multi-model workloads,
  including both horizontal and vertical autoscaling. By integrating with standard
  Kubernetes primitives such as `Deployments` and `StatefulSets`, as well as with
  operators that provide availability and shard awareness, the platform enables
  online scaling operations with minimal service disruption.
  
  For storage, the platform relies on `Persistent Volume Claims` (PVCs) and
  therefore inherits the elasticity and scaling capabilities of the underlying
  storage provider. The architecture also supports compute-storage decoupling,
  depending on the workload and storage backend, which enables compute resources
  to scale independently from persistent storage. Combined with shard-aware
  orchestration and rolling operational patterns, this helps enable zero-downtime or near-zero-downtime scaling for supported deployments.

- **Multi-AZ and High Availability:**
  By relying on Kubernetes, the platform natively supports multi-availability
  zone (multi-AZ) deployments. Workloads can be distributed across zones using
  built-in scheduling, anti-affinity rules, and topology-aware routing, enabling
  high availability and fault tolerance. Stateful workloads can also be deployed with replication and shard awareness to maintain resilience across zones.
  
  Comprehensive health checks, metrics collection, alerting, and automatic
  failover mechanisms ensure your data platform stays operational. Real-time
  monitoring dashboards provide visibility into cluster performance,
  resource utilization, and query patterns.

- **Cloud-Native Architecture:** 
  The platform is fully cloud-native, built on top of Kubernetes, and leverages
  standard Kubernetes primitives and ecosystem components. This ensures portability
  across environments, including public cloud, private cloud, and hybrid deployments.

All components are orchestrated through Kubernetes, providing automated deployment,
scaling, and management with enterprise-grade reliability.

For a detailed breakdown of each component, its architecture and features, see
[The Arango Contextual Data Platform](../contextual-data-platform/_index.md).

## Extend the Arango Contextual Data Platform with AI capabilities

Extend the Arango Contextual Data Platform and its Platform Suite with the
[**Agentic AI Suite**](../agentic-ai-suite/_index.md) to get the fully featured
data platform with all its services. It offers advanced AI and machine learning
capabilities that integrate seamlessly into the platform's unified web interface.

{{< tip >}}
The Agentic AI Suite requires a separate license.
{{< /tip >}}

## Deployment options

### Use the Arango Contextual Data Platform as a managed service

You can request the Arango Contextual Data Platform as a managed service for the
[Arango Managed Platform (AMP)](../../amp/_index.md).

[Get in touch](https://arango.ai/contact-us/) with the Arango team to learn more.

### Self-host the Arango Contextual Data Platform

You can set up and run the Arango Contextual Data Platform on-premises or in the cloud and
manage this deployment yourself.

For a guide how to set up the Contextual Data Platform yourself, see
[Install and upgrade the Arango Contextual Data Platform](../contextual-data-platform/install-and-upgrade/_index.md).

{{< info >}}
**Kubernetes-Native**: The Arango Contextual Data Platform is built specifically for Kubernetes 
environments and relies on the official [ArangoDB Kubernetes Operator](https://arangodb.github.io/kube-arangodb/) 
to provide automated deployment, scaling, and management capabilities.
{{< /info >}}

## Recommended resources

{{< cards >}}

{{% card title="Graph Visualizer" link="graph-visualizer/" %}}
Explore your graph data with an intuitive web interface and sophisticated querying capabilities.
{{% /card %}}

{{% card title="Query Editor" link="query-editor/" %}}
Learn about the Kubernetes-native foundation that the Arango Contextual Data Platform is purpose-built on.
{{% /card %}}

{{< /cards >}}
