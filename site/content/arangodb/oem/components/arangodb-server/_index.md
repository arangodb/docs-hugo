---
title: ArangoDB Server
menuTitle: ArangoDB Server
weight: 170
description: >-
  The ArangoDB daemon (arangod) is the central server binary that can run in
  different modes for a variety of setups like single server and clusters
---
The ArangoDB server is the core component of ArangoDB. The executable file to
run it is named `arangod`. The `d` stands for daemon. A daemon is a long-running
background process that answers requests for services.

The server process serves the various client connections to the server via the
TCP/HTTP protocol. It also provides a [web interface](../web-interface/_index.md).

_arangod_ can run in different modes for a variety of setups like single server
and clusters. It differs between the [Community Edition](../../features/community-edition.md)
and [Enterprise Edition](../../features/enterprise-edition.md).

See [Administration](../../operations/administration/_index.md) for server configuration
and [Deploy](../../deploy/_index.md) for operation mode details.
