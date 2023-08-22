---
title: Scaling
menuTitle: Scaling
weight: 45
description: >-
  The ArangoDB Kubernetes Operator supports up and down scaling of the number of DB-Servers & Coordinators
---
The ArangoDB Kubernetes Operator supports up and down scaling of
the number of DB-Servers & Coordinators.

Currently it is not possible to change the number of
Agents of a cluster.

The scale up or down, change the number of servers in the custom
resource.

E.g. change `spec.dbservers.count` from `3` to `4`.

Then apply the updated resource using:

```bash
kubectl apply -f yourCustomResourceFile.yaml
```

Inspect the status of the custom resource to monitor
the progress of the scaling operation.
