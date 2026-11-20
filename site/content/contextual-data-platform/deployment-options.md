---
title: Deployment options for the Contextual Data Platform
menuTitle: Deployment Options
group: Install
weight: 10
description: >-
  Run the Arango Contextual Data Platform on the Arango Managed Platform (AMP)
  or on your own Kubernetes cluster, and what each option means for operations,
  licensing, upgrades, and networking
---
You can run the Arango Contextual Data Platform in two ways:

- Managed on the
  [Arango Managed Platform (AMP)](../amp/contextual-data-platform.md): Arango
  runs the data platform for you in Google Cloud or AWS. You create a
  deployment in the AMP dashboard and connect to it.
- Self-managed on your own Kubernetes cluster: you install the data platform
  with the ArangoDB Kubernetes Operator (`kube-arangodb`), on-premises, in the
  cloud, or in an air-gapped environment.

The services, APIs, web interface, and Arango AI SDK are the same in both
cases. What differs is who operates the data platform and how you pay for it.
Pages and sections that apply only to your own cluster carry the
{{< tag "Self-managed" >}} label.

## Comparison

| | Managed (AMP) | Self-managed |
|:--|:--------------|:-------------|
| **Infrastructure** | Arango provisions and runs it in Google Cloud or AWS | You provide the Kubernetes cluster and object storage |
| **Install** | Create a deployment in the AMP dashboard | [Online or offline setup](install-and-upgrade/_index.md) with `kubectl` and Helm |
| **Monitoring and backups** | Handled by Arango | You set them up |
| **Upgrades** | Applied by Arango | [You upgrade](install-and-upgrade/upgrade-version.md) the operator and platform packages |
| **Licensing and billing** | Billed through your AMP organization, no license key | [License Manager](license-management.md) activates and renews licenses through the operator |
| **LLM configuration** | Bring your own LLM API key, stored in the [Secrets Manager](secrets-manager.md) | Same, or point the services at an [OpenAI-compatible endpoint](llm-models.md) in your network |
| **Cluster access** | No `kubectl` or Helm access | Full access to the cluster and the platform resources |
| **Network access** | Public endpoint, with AMP IP allowlists and private endpoints | Whatever your cluster and ingress allow, including air-gapped setups |
| **Authentication** | ArangoDB users of the deployment | ArangoDB users of the deployment |

## Managed on AMP

Arango provisions the Kubernetes cluster, the database, and the platform
services, and keeps them monitored, backed up, and up to date. You work with the
deployment through its web interface, the HTTP APIs, and the Arango AI SDK.

You do not get access to the underlying Kubernetes cluster. Steps in these docs
that use `kubectl`, Helm, port-forwarding, or edits to platform packages do not
apply on AMP. If you need a setting that such a step changes, for example
resource limits of a service, contact the AMP support team via **Request help**
in the sidebar of the AMP dashboard.

### Licensing and billing on AMP

AMP deployments do not use the License Manager, and you do not install a
license. Access is tied to your AMP organization:

- Paid access follows your agreement with Arango.
- Proof-of-concept access is arranged by the Arango sales team.

If an agreement is not renewed, its deployments are hibernated: they stop
running, but the data is kept. To delete a hibernated deployment, contact the
AMP support team via **Request help**.

### Upgrades on AMP

Arango applies data platform upgrades. See
[Upgrades and versioning](../amp/deployments/upgrades-and-versioning.md) for how
AMP schedules them.
{{< comment >}}
TODO(DOC-952): Confirm whether CDP versions follow the same AMP upgrade policy
as ArangoDB deployments.
{{< /comment >}}

## Self-managed on Kubernetes

You install and operate everything yourself:

- [Install and upgrade](install-and-upgrade/_index.md) the platform, online or
  offline.
- [Manage licenses](license-management.md). The operator activates and renews
  them through the License Manager, which needs outbound network access unless
  you use offline licenses.
- Tune resources, scheduling, and service settings through the platform's
  Kubernetes resources.

Choose this option if you need to run in your own data center or an air-gapped
environment, or you need control over the cluster.

## Get started

- [Get started on AMP](../get-started/contextual-data-platform/amp.md)
- [Tutorial 1: Install and try it out](../get-started/contextual-data-platform/quickstart/_index.md)
  (self-managed, local evaluation)
