---
title: Monitoring tools in the Arango Data Platform
menuTitle: Monitoring
weight: 18
description: >-
  Monitor your Arango Data Platform deployment with integrated Grafana and Prometheus dashboards
---

## Overview

The **Monitoring** section of the Arango Data Platform provides integrated access
to observability tools for tracking the health, performance, and resource
utilization of your deployment. This feature gives you real-time insights into
your clusters and platform components.

The Arango Data Platform includes two monitoring tools embedded
directly in the web interface:

- **Grafana**: A visualization and analytics platform for creating and viewing
  dashboards with metrics, logs, and traces.
- **Prometheus**: A time-series database and monitoring system that collects
  and stores metrics from your deployment.

Both tools are integrated into the platform's unified interface,
providing authenticated access without requiring separate login credentials or
additional configuration.

## How to access the monitoring dashboards

You can access the monitoring dashboards from the Arango Data Platform web interface:

1. Navigate to the **Monitoring** section in the main navigation menu.
2. Select either **Grafana** or **Prometheus** from the sidebar.
3. The selected monitoring dashboard loads in an embedded view within the
   Arango Data Platform interface.

## Grafana

Grafana provides rich visualization capabilities for exploring metrics collected
from your Arango Data Platform deployment. You can monitor:

- **Database performance metrics**: Query response times, throughput, cache hit
  rates, and operation counts.
- **Resource utilization**: CPU, memory, disk I/O, and network usage across
  cluster nodes.
- **Cluster health**: Node status, replication lag, and shard distribution.
- **System metrics**: Operating system and Kubernetes-level metrics for the
  underlying infrastructure.

## Prometheus

Prometheus serves as the metrics collection and storage backend for the
monitoring stack. While Grafana provides visualization, Prometheus offers
direct access to the underlying metrics data through its query language (PromQL).

The embedded Prometheus interface allows you to:

- **Execute PromQL queries**: Write and run custom queries to retrieve specific
  metrics or perform calculations.
- **Explore available metrics**: Browse the complete list of metrics being
  collected from your deployment.
- **View metric metadata**: Inspect metric types, labels, and current values.
- **Debug monitoring issues**: Query raw metric data to troubleshoot visualization
  or alerting problems.