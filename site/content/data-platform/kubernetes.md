---
title: Kubernetes Integration
menuTitle: Kubernetes
weight: 15
description: >-
  The Arango Data Platform is built exclusively for Kubernetes, leveraging
  container orchestration for automated deployment, scaling, and management
---
The Arango Data Platform is **Kubernetes-native** by design, meaning it is built
from the ground up to run on [Kubernetes](https://kubernetes.io/) and requires
it to function. This is not an optional feature, Kubernetes is the foundation
that powers the entire platform architecture.

{{< info >}}
**Kubernetes Required**: The Arango Data Platform cannot operate without Kubernetes.
It relies on Kubernetes orchestration and the 
[ArangoDB Kubernetes Operator](https://arangodb.github.io/kube-arangodb/) for
all deployment, scaling, and management operations.
{{< /info >}}

## Why Kubernetes?

By building exclusively on Kubernetes, the Arango Data Platform delivers
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

The Arango Data Platform is powered by the official
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

All components of the Arango Data Platform, from the core database to the optional
AI Suite, are deployed and managed as native Kubernetes resources. This
means you can do the following:

- Use standard Kubernetes tools (`kubectl`, Helm, etc.) to manage your deployment
- Monitor platform health using Kubernetes-native observability tools
- Integrate with existing Kubernetes infrastructure and workflows
- Apply your organization's Kubernetes policies and security controls

This Kubernetes-native approach ensures the Arango Data Platform fits naturally
into modern cloud-native environments and DevOps practices.

