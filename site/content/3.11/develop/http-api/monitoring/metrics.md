---
title: Metrics
menuTitle: Metrics
weight: 15
description: >-
  You can use ArangoDB server metrics to monitor the healthiness and performance
  of the system
pageToc:
  maxHeadlineLevel: 3
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

Whether the `/_admin/metrics*` endpoints are available depends on the setting of
the [`--server.export-metrics-api` startup option](../../../components/arangodb-server/options.md#--serverexport-metrics-api).
For additional document read and write metrics, the
[`--server.export-read-write-metrics` startup option](../../../components/arangodb-server/options.md#--serverexport-read-write-metrics)
needs to be enabled.

## Metrics API v2

### Get the metrics

```openapi
paths:
  /_db/{database-name}/_admin/metrics/v2:
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
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of a database. Which database you use doesn't matter as long
            as the user account you authenticate with has at least read access
            to this database. If the `--server.harden` startup option is enabled,
            administrate access to the `_system` database is required.
          schema:
            type: string
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

## Get usage metrics

```openapi
paths:
  /_db/{database-name}/_admin/usage-metrics:
    get:
      operationId: getUsageMetrics
      description: |
        Returns detailed shard usage metrics on DB-Servers.
        
        These metrics can be enabled by setting the `--server.export-shard-usage-metrics`
        startup option to `enabled-per-shard` to make DB-Servers collect per-shard
        usage metrics, or to `enabled-per-shard-per-user` to make DB-Servers collect
        usage metrics per shard and per user whenever a shard is accessed.
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of a database. Which database you use doesn't matter as long
            as the user account you authenticate with has at least read access
            to this database. If the `--server.harden` startup option is enabled,
            administrate access to the `_system` database is required.
          schema:
            type: string
        - name: serverId
          in: query
          required: false
          description: |
            Returns the usage metrics of the specified server. If no `serverId` is given,
            the asked server will reply. This parameter is only meaningful on Coordinators.
          schema:
            type: string
      responses:
        '200':
          description: |
            Metrics were returned successfully.
      tags:
        - Monitoring
```

## Metrics API

### Get the metrics (deprecated)

```openapi
paths:
  /_db/{database-name}/_admin/metrics:
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
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of a database. Which database you use doesn't matter as long
            as the user account you authenticate with has at least read access
            to this database. If the `--server.harden` startup option is enabled,
            administrate access to the `_system` database is required.
          schema:
            type: string
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
