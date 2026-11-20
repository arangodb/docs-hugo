---
title: The Arango Contextual Data Platform on AMP
menuTitle: Contextual Data Platform
weight: 25
description: >-
  Run the Arango Contextual Data Platform as a managed deployment in AMP, with
  Arango handling infrastructure, upgrades, monitoring, and backups
---
Besides ArangoDB deployments, AMP can run the
[Arango Contextual Data Platform](../contextual-data-platform/_index.md): ArangoDB
together with the platform services and the AI services, such as AutoGraph and
AutoRAG, that turn your documents into a Context Graph.

A Contextual Data Platform deployment belongs to a project, like any other AMP
deployment. Members, groups, roles, and audit logs of your
[organization](organizations/_index.md) apply to it in the same way.

You create it with the same **New Deployment** form as an ArangoDB
deployment, with these differences:

- In the **Sizing** section, you select a **Flavour** of the data platform:
  **Data Science Platform** or **AI Suite**. The default, **Core Database**,
  is a plain ArangoDB deployment.
- Which flavours you can select depends on your organization and the region.
- Not every node size supports every flavour. The form only offers the sizes
  that support the flavour you selected.

On the **Overview** of a data platform deployment, **Platform UI** and
**Open Platform UI** take the place of **Database UI** and
**Open Database UI**. They open the web interface of the data platform.

To change the flavour of an existing deployment, for example to turn a
**Core Database** deployment into an **AI Suite** deployment, open the
deployment's **Overview** and click **Edit**. Select another **Flavour** and
click **Save changes**. The provider and region cannot be changed.

After you save, the **Status summary** shows **Upgrading** while AMP applies
the new flavour, which takes about a minute. The **Configuration** section and
the web interface links show the new flavour right away.

{{< comment >}}
TODO(DOC-952): Confirm whether switching back to Core Database removes the data
platform services and their data.
{{< /comment >}}

## Create a deployment

See [Get started on AMP](../get-started/contextual-data-platform/amp.md) for the
steps to create a deployment, sign in, and build your first Context Graph.

## What Arango manages

- The Kubernetes cluster, the ArangoDB deployment, and the platform services
- Monitoring, backups, and upgrades
- The object storage for files you upload to the
  [File Manager](../contextual-data-platform/file-manager/_index.md)

You do not get `kubectl` or Helm access to the cluster. To change settings that
are only available through Kubernetes resources, contact the AMP support team
via **Request help**.

## Licensing and billing

AMP deployments of the Contextual Data Platform do not use the
[License Manager](../contextual-data-platform/license-management.md), and you do
not install a license. Access is tied to your AMP organization and your
agreement with Arango.

If an agreement is not renewed, its deployments are hibernated. To delete a
hibernated deployment, contact the AMP support team via **Request help**.

Like other AMP deployments, a data platform deployment is billed hourly. The
**Summary** panel of the **New deployment** form shows the **Price/hour** for
the settings you select. See [Billing](organizations/billing.md) and
[Credits and usage](organizations/credits-and-usage.md).

{{< comment >}}
TODO(DOC-952): Confirm that the AI Suite and Data Science Platform flavours
change the Price/hour shown in the Summary panel, and whether the Free Trial,
On-Demand, and Committed packages apply to them.
{{< /comment >}}

## Differences from self-managed deployments

The services and APIs are the same as in a self-managed installation, so the
[Contextual Data Platform documentation](../contextual-data-platform/_index.md)
applies. Pages and sections labeled {{< tag "Self-managed" >}} do not apply on
AMP. For a full comparison, see
[Deployment options](../contextual-data-platform/deployment-options.md).
