---
title: Data Platform Architecture
menuTitle: Architecture
weight: 5
description: >-
  The Arango Contextual Data Platform is purpose-built for Kubernetes, leveraging
  container orchestration for automated deployment, scaling, and management
---
The Arango Contextual Data Platform is **Kubernetes-native** by design, meaning it is built
from the ground up to run on [Kubernetes](https://kubernetes.io/) and requires
it to function. This is not an optional feature, Kubernetes is the foundation
that powers the entire platform architecture.

{{< embed-svg "Platform-Architecture" "High-level architecture of the Arango Contextual Data Platform. Everything runs inside a single Kubernetes cluster. Click a component to open its documentation." >}}

The diagram above shows the platform's high-level architecture. Everything runs
inside a single Kubernetes cluster, with user traffic
entering through Envoy, which acts as the API gateway and HTTP frontend for
all services behind it. From there, requests are routed to the
ArangoDB Platform Services, which group together the core building blocks:

- **Platform Enablers**: the [File Manager](file-manager/_index.md)
  for object storage and the [Secret Manager](secrets-manager.md)
  for credentials and other sensitive configuration.
- **ArangoDB**: the distributed multi-model database at the heart of the platform,
  deployed as Coordinators, DB-Servers, and Agents and managed by the
  [ArangoDB Kubernetes Operator](https://arangodb.github.io/kube-arangodb/).
- **AI services**: the optional AI components (AutoGraph and AutoRAG,
  GraphML, Graph Analytics, and others) that sit alongside ArangoDB and consume
  its data.

Alongside the built-in services, the cluster can also host
[user-defined services (BYOC)](container-manager/_index.md), your
own containers, deployed and routed through the same Envoy gateway so they
share authentication, networking, and lifecycle management with the rest of
the platform.

{{< info >}}
**Kubernetes Required**: The Arango Contextual Data Platform cannot operate without Kubernetes.
It relies on Kubernetes orchestration and the
[ArangoDB Kubernetes Operator](https://arangodb.github.io/kube-arangodb/)
(`kube-arangodb`) for all deployment, scaling, and management operations.
{{< /info >}}

## Why Kubernetes?

By building exclusively on Kubernetes, the Arango Contextual Data Platform delivers
enterprise-grade capabilities that would be difficult or impossible to achieve
with traditional deployment approaches:

- **Automated Management and Self-Healing**: Kubernetes handles deployment,
  scaling, node failures, and rolling updates automatically, with self-healing
  capabilities that restart failed containers and maintain high availability
  without manual intervention.

- **Dynamic Scalability and Resource Optimization**: Scale your database cluster
  up or down based on workload demands, with efficient resource allocation and
  scheduling ensuring optimal utilization of CPU, memory, and storage.

- **Declarative Configuration and Zero-Downtime Updates**: Define your desired
  state using Kubernetes manifests and deploy updates with zero downtime through
  controlled rolling updates and easy rollback capabilities.

- **Cloud and On-Premises Flexibility**: Run on any Kubernetes-compatible
  environment—public cloud providers (AWS, Azure, GCP), private cloud, or
  on-premises infrastructure—with consistent deployment across all environments.

## The ArangoDB Kubernetes Operator

The Arango Contextual Data Platform is powered by the official
[ArangoDB Kubernetes Operator](https://arangodb.github.io/kube-arangodb/)
(`kube-arangodb`), which provides the following features:

- **Custom Resource Definitions (CRDs)**: Extend Kubernetes with ArangoDB-specific
  resources like `ArangoDeployment`, `ArangoBackup`, and more.

- **Intelligent Orchestration**: The operator understands ArangoDB's architecture
  and requirements, ensuring deployments follow best practices automatically.

- **Backup and Restore**: Automated backup management integrated directly into
  the Kubernetes workflow.

- **High Availability**: Built-in support for multi-datacenter replication,
  automatic failover, and disaster recovery scenarios.

- **Enterprise Features**: Full support for ArangoDB Enterprise Edition features
  including encryption, auditing, and advanced security controls.

For detailed information about the operator, see the
[ArangoDB Kubernetes Operator documentation](https://arangodb.github.io/kube-arangodb/docs/).

## Platform Services as Kubernetes Resources

All components of the Arango Contextual Data Platform, from the core database to the optional
AI Suite, are deployed and managed as native Kubernetes resources. This
means you can do the following:

- Use standard Kubernetes tools (`kubectl`, Helm, etc.) to manage your deployment
- Monitor platform health using Kubernetes-native observability tools
- Integrate with existing Kubernetes infrastructure and workflows
- Apply your organization's Kubernetes policies and security controls

This Kubernetes-native approach ensures the Arango Contextual Data Platform fits naturally
into modern cloud-native environments and DevOps practices.

## Operational model

- **Scaling Capabilities for Multi-Model Workloads:**
  The platform supports Kubernetes-native scaling for multi-model workloads,
  including both horizontal and vertical autoscaling. By integrating with standard
  Kubernetes primitives such as Deployments and Stateful Sets, as well as with
  operators that provide availability and shard awareness, the platform enables
  online scaling operations with minimal service disruption.

  For storage, the platform relies on Persistent Volume Claims (PVCs) and
  therefore inherits the elasticity and scaling capabilities of the underlying
  storage provider. The architecture also supports compute-storage decoupling,
  depending on the workload and storage backend, which enables compute resources
  to scale independently from persistent storage. Combined with shard-aware
  orchestration and rolling operational patterns, this helps enable zero-downtime
  or near-zero-downtime scaling for supported deployments.

- **Multi-AZ and High Availability:**
  By relying on Kubernetes, the platform natively supports multiple availability
  zone (multi-AZ) deployments. Workloads can be distributed across zones using
  built-in scheduling, anti-affinity rules, and topology-aware routing, enabling
  high availability and fault tolerance. Stateful workloads can also be deployed
  with replication and shard awareness to maintain resilience across zones.

  Comprehensive health checks, metrics collection, alerting, and automatic
  failover mechanisms ensure your data platform stays operational. Real-time
  [monitoring](monitoring.md) dashboards provide visibility into cluster performance,
  resource utilization, and query patterns.

- **Cloud-Native Architecture:**
  The platform is fully cloud-native, built on top of Kubernetes, and leverages
  standard Kubernetes primitives and ecosystem components. This ensures portability
  across environments, including public cloud, private cloud, and hybrid deployments.

All components are orchestrated through Kubernetes, providing automated deployment,
scaling, and management with enterprise-grade reliability.


## Third-party components used by the platform

- **Helm**: A package manager for Kubernetes that enables consistent, repeatable
  installations and version control.

- **Envoy**: A high-performance service proxy that acts as the gateway for the
  Arango Contextual Data Platform for centralizing authentication and routing.
