---
title: Access control in the data platform
menuTitle: Access control
weight: 40
description: >-
  How callers prove their identity to the Contextual Data Platform, and which
  permission system governs what they are allowed to do
---
Access control answers two questions for every request that reaches the
Arango Contextual Data Platform:

- [**Authentication**](authentication.md): who is making this request? The
  caller has to prove its identity with credentials that the data platform can
  verify.
- **Authorization**: what is this caller allowed to do? Once the identity is
  established, a permission system decides which operations and which data the
  caller may access.

Authentication is handled centrally in the data platform. Identities are
ArangoDB user accounts, and a token obtained from those credentials is accepted
by every service, so you don't need to maintain separate accounts per service.

## Authorization systems

Which permission system governs a request depends on whether RBAC is enabled
for the deployment:

- [**Role-based access control (RBAC)**](rbac.md) is the permission system of
  the data platform. You assign roles to users and scope each assignment to the
  resources it may act on, covering the core database system as well as the
  services of the data platform.
- [**ArangoDB user permissions**](../../arangodb/3.12/operations/administration/user-management/_index.md)
  are the classic access levels of the core database system, granted per user
  for databases and collections. They apply where RBAC is not enabled.

The choice also determines which credentials the HTTP APIs accept, see
[Authentication](authentication.md).
