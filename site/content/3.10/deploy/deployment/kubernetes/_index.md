---
title: ArangoDB Kubernetes Operator
menuTitle: Kubernetes
weight: 35
description: >-
  ArangoDB Kubernetes Operator
archetype: chapter
---
The ArangoDB Kubernetes Operator (`kube-arangodb`) is a set of operators
that you deploy in your Kubernetes cluster to:

- Manage deployments of the ArangoDB database
- Provide `PersistentVolumes` on local storage of your nodes for optimal storage performance.
- Configure ArangoDB Datacenter-to-Datacenter Replication

Each of these uses involves a different custom resource.

- Use an [`ArangoDeployment` resource](deployment-resource-reference.md) to
  create an ArangoDB database deployment.
- Use an [`ArangoBackup` resource](backup-resource.md) to
  create an ArangoDB backup.
- Use an [`ArangoLocalStorage` resource](storage-resource.md) to
  provide local `PersistentVolumes` for optimal I/O performance.
- Use an [`ArangoDeploymentReplication` resource](deployment-replication-resource-reference.md) to
  configure ArangoDB Datacenter-to-Datacenter Replication.

Continue with [Using the ArangoDB Kubernetes Operator](using-the-operator.md)
to learn how to install the ArangoDB Kubernetes operator and create
your first deployment.

For more information about the production readiness state, please refer to the
[ArangoDB Kubernetes Operator repository](https://github.com/arangodb/kube-arangodb#production-readiness-state).