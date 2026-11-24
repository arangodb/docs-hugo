---
title: Single instance deployments
menuTitle: Single instance
weight: 5
description: >-
  Running a single server instance of ArangoDB is the most simple way to get
  started
---
Using a _single server_ or _single instance_ means to run the ArangoDB server
binary _arangod_ stand-alone, without replication, without failover opportunity,
and not as a cluster together with other nodes.

You may run multiple processes of _arangod_ side-by-side on the same machine as
single instances, as long as they are configured for different ports and data
folders.

Unlike other setups (*Cluster*, *OneShard*)
which require some specific procedure to be started once ArangoDB
has been installed, deploying a single instance is straightforward.

The following are two ways that can be used to start the stand-alone
instance:

- Using the [ArangoDB Starter tool](using-the-arangodb-starter.md), or
- [manually](manual-start.md).
