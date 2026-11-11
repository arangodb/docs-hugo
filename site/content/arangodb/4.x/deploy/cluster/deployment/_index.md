---
title: Cluster deployment options
menuTitle: Deployment
weight: 5
description: >-
  You can deploy an ArangoDB cluster with the ArangoDB Starter, by starting the
  server processes manually, with the Kubernetes operator, or use the fully
  managed Arango Managed Platform (AMP)
---
{{< cards >}}

{{% card title="ArangoDB Starter" link="using-the-arangodb-starter" %}}
Start a cluster with one command per machine and let the Starter launch and
supervise the Agents, DB-Servers, and Coordinators.
{{% /card %}}

{{% card title="Manual start" link="manual-start" %}}
Start and configure the Agents, DB-Servers, and Coordinators yourself, directly
on your machines or in containers.
{{% /card %}}

{{% card title="Kubernetes" link="../../kubernetes" %}}
Deploy and manage clusters on Kubernetes with the ArangoDB Kubernetes Operator
(kube-arangodb).
{{% /card %}}

{{% card title="Arango Managed Platform (AMP)" link="/amp/" %}}
Use fully managed ArangoDB clusters on AWS and GCP without having to run the
deployment yourself.
{{% /card %}}

{{< /cards >}}
