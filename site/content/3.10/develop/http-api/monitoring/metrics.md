---
title: Metrics
menuTitle: Metrics
weight: 15
description: >-
  You can use ArangoDB server metrics to monitor the healthiness and performance
  of the system
pageToc:
  maxHeadlineLevel: 3
archetype: default
---
_arangod_ exports metrics in the
[Prometheus format](https://prometheus.io/docs/instrumenting/exposition_formats/).
The thresholds for alerts are described for relevant metrics.

{{< warning >}}
The list of exposed metrics is subject to change in every minor version.
While they should stay backwards compatible for the most part, some metrics are
coupled to specific internals that may be replaced by other mechanisms in the
future.
{{< /warning >}}

## Metrics API v2

### Get the metrics

```openapi
paths:
  /_admin/metrics/v2:
    get:
      operationId: getMetricsV2
      description: |
        Returns the instance's current metrics in Prometheus format. The
        returned document collects all instance metrics, which are measured
        at any given time and exposes them for collection by Prometheus.

        The document contains different metrics and metrics groups dependent
        on the role of the queried instance. All exported metrics are
        published with the prefix `arangodb_` or `rocksdb_` to distinguish them from
        other collected data.

        The API then needs to be added to the Prometheus configuration file
        for collection.
      parameters:
        - name: serverId
          in: query
          required: false
          description: |
            Returns metrics of the specified server. If no serverId is given, the asked
            server will reply. This parameter is only meaningful on Coordinators.
          schema:
            type: string
      responses:
        '200':
          description: |
            Metrics were returned successfully.
        '404':
          description: |
            The metrics API may be disabled using `--server.export-metrics-api false`
            setting in the server. In this case, the result of the call indicates the API
            to be not found.
      tags:
        - Monitoring
```

**Examples**

```curl
---
description: ''
name: RestAdminMetricsV2
---
var url = "/_admin/metrics/v2";
var response = logCurlRequest('GET', url);

assert(response.code === 200);

logPlainResponse(response);
```

{{% metrics %}}

## Metrics API

### Get the metrics (deprecated)

```openapi
paths:
  /_admin/metrics:
    get:
      operationId: getMetrics
      description: |
        {{</* warning */>}}
        This endpoint should no longer be used. It is deprecated from version 3.8.0 on.
        Use `/_admin/metrics/v2` instead. From version 3.10.0 onward, `/_admin/metrics`
        returns the same metrics as `/_admin/metrics/v2`.
        {{</* /warning */>}}

        Returns the instance's current metrics in Prometheus format. The
        returned document collects all instance metrics, which are measured
        at any given time and exposes them for collection by Prometheus.

        The document contains different metrics and metrics groups dependent
        on the role of the queried instance. All exported metrics are
        published with the `arangodb_` or `rocksdb_` string to distinguish
        them from other collected data.

        The API then needs to be added to the Prometheus configuration file
        for collection.
      parameters:
        - name: serverId
          in: query
          required: false
          description: |
            Returns metrics of the specified server. If no serverId is given, the asked
            server will reply. This parameter is only meaningful on Coordinators.
          schema:
            type: string
      responses:
        '200':
          description: |
            Metrics were returned successfully.
        '404':
          description: |
            The metrics API may be disabled using `--server.export-metrics-api false`
            setting in the server. In this case, the result of the call indicates the API
            to be not found.
      tags:
        - Monitoring
```

**Examples**

```curl
---
description: ''
name: RestAdminMetrics
---
var url = "/_admin/metrics";
var response = logCurlRequest('GET', url);

assert(response.code === 200);

logPlainResponse(response);
```
