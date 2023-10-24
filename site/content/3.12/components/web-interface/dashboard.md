---
title: Dashboard
menuTitle: Dashboard
weight: 5
description: ''
archetype: default
---
The **DASHBOARD** section provides statistics which are polled regularly from the
ArangoDB server.

![Web Interface Dashboard](../../../images/ui-dashboard.webp)

There is a different interface for [Cluster](cluster.md) deployments.

Statistics:

 - Requests per second
 - Request types
 - Number of client connections
 - Transfer size
 - Transfer size (distribution)
 - Average request time
 - Average request time (distribution)

System Resources:

- Number of threads
- Memory
- Virtual size
- Major page faults
- Used CPU time

Metrics:

- Various server metrics, see [Monitoring](../../develop/http-api/monitoring.md#metrics)
