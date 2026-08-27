---
title: Access control in the data platform
menuTitle: Access control
weight: 40
description: >-
  How callers prove their identity to the Contextual Data Platform, and how
  role-based access control governs what they are allowed to do
---
Access control answers two questions for every request that reaches the
Arango Contextual Data Platform:

- [**Authentication**](authentication.md): who is making this request? The
  caller has to prove its identity with credentials that the data platform can
  verify.
- [**Authorization**](rbac.md): what is this caller allowed to do? Once the
  identity is established, role-based access control (RBAC) decides which
  operations and which data the caller may access.

Both are handled centrally in the data platform. Identities are ArangoDB user
accounts, and a token obtained from those credentials is accepted by every
service, so you don't need to maintain separate accounts per service.
