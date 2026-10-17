---
title: Access control in the data platform
menuTitle: Access control
weight: 40
description: >-
  How callers prove their identity to the Contextual Data Platform and what
  governs the data they are allowed to access
---
Access control answers two questions for every request that reaches the
Arango Contextual Data Platform: who is making this request, and what is this
caller allowed to do?

## Authentication

Authentication establishes who a caller is. It has to prove its identity with
credentials that the data platform can verify, and requests with missing or
invalid credentials are rejected.

Identities are [ArangoDB user accounts](../../arangodb/3.12/operations/administration/user-management/_index.md).
Authentication is handled centrally in the data platform, and a token obtained
from the credentials of an account is accepted by every service as well as by
the core database system. You therefore don't need to maintain separate accounts
per service.

See [Authentication](authentication.md) for the credentials you can use, how to
obtain a token for the HTTP APIs, and how to log in to the web interface.

## Authorization

Authorization determines what an authenticated caller may do, that is which
operations it may perform and which data it may access.

Which permission system governs a request depends on whether RBAC is enabled
for the deployment:

- [**Role-based access control (RBAC)**](rbac.md) is the permission system of
  the data platform. You assign roles to users and scope each assignment to the
  resources it may act on, covering the core database system as well as the
  services of the data platform.
- [**Classic authorization**](authorization.md) is the traditional permission
  system of the core database system, using access levels that are granted per
  user account for databases and collections. It applies if RBAC is not enabled
  for the data platform. The services of the data platform don't restrict what
  an authenticated user may do in this case, but the access levels still affect
  them because they read from and write to ArangoDB on your behalf.

The choice also determines which credentials the HTTP APIs accept, see
[Authentication](authentication.md).
