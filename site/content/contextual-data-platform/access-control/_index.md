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

The services of the data platform do not come with a permission system of their
own. They require every request to be authenticated, but they do not restrict
what an authenticated user may do within a service. What does exist are the
classic access levels of the ArangoDB core database system, granted per user
account for databases and collections. They govern every access to the database
system, including the accesses that data platform services perform on your
behalf.

See [Authorization](authorization.md) for the available access levels, their
particularities, and how they affect the services of the data platform.
