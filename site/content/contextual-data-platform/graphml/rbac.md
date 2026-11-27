---
title: Role-based access control for GraphML
menuTitle: RBAC
weight: 20
description: >-
  Which role and scope you need to use GraphML
---
{{< tag "Agentic AI Suite" >}}

If [role-based access control (RBAC)](../access-control/rbac.md) is enabled
in the Arango Contextual Data Platform, GraphML checks a permission for every
request, for example, to create a project, start a training job, or list the
jobs. The permission is the `ai:graphml.use` **action** on the GraphML shared
service, `ai:service:graphml`.

To use GraphML, you thus need:

- The `ai-developer` role. The `ai-user` role doesn't grant access to GraphML,
  because featurization and training use compute resources and write into your
  data.
- A scope for the role assignment that covers the GraphML shared service
  (`ai:service:graphml`), or all shared services. A scope that only covers a
  database is not enough.

{{< warning >}}
GraphML doesn't support RBAC for the ArangoDB core database system yet. If
[ArangoDB RBAC](../access-control/rbac.md#enable-rbac) is enabled for the
deployment (the `rbac-coredb` feature flag), the GraphML service will not
start. Keep ArangoDB RBAC disabled in deployments where you use GraphML. You
can still enable RBAC for the services of the data platform with the
`central-services` and `rbac-enforced` feature flags.
{{< /warning >}}

## Actions

{{% rbac-actions "graphml" %}}

GraphML has a single action that covers all of its operations. The resource is
always the GraphML shared service.

Featurization, training, and prediction run as separate jobs that GraphML
installs with its own service identity. You don't need any permission for the
job services themselves.

## Example

Alice holds the `ai-user` role with a scope of all shared services. Bob holds
the `ai-developer` role with a scope of the `sales` database
(`ai:database:sales`). Carol holds the `ai-developer` role with a scope of the
GraphML shared service (`ai:service:graphml`).

| Task | Alice | Bob | Carol |
|---|---|---|---|
| List the GraphML projects | Denied, her role doesn't grant `ai:graphml.use` | Denied, his scope doesn't cover `ai:service:graphml` | Allowed |
| Run featurization and training on a graph in the `sales` database | Denied | Denied | Allowed |
| Run a prediction job that writes into a collection of the `sales` database | Denied | Denied | Allowed |