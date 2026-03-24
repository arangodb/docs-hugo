---
title: ArangoDB Production Checklist
menuTitle: Production Checklist
weight: 45
description: >-
  Important steps to perform before you go live with ArangoDB deployments
---
The following checklist can help to understand if important steps
have been performed on your production system before you go live.

## Operating System

- **OS tuning**: Execute the operating system (OS) optimization scripts if you
  run ArangoDB on Linux. See
  [Installing ArangoDB on Linux](../operations/installation/linux/_index.md)
  and its sub pages
  [Linux Operating System Configuration](../operations/installation/linux/operating-system-configuration.md)
  and [Linux OS Tuning Script Examples](../operations/installation/linux/linux-os-tuning-script-examples.md)
  for details.

- **System updates**: Ensure your OS is compatible with your ArangoDB version
  and keep it up to date at all times for security and stability.

- **System monitoring**: Make sure that OS monitoring is in place with specific
  alerting thresholds:
  - **Disk usage**: Alert when reaching 60% (red line threshold)
    to avoid out-of-disk situations.
  - **CPU usage**: Alert when reaching 90% (red line threshold).
  - **Memory usage**: Alert when reaching 85% (red line threshold).

## ArangoDB

- **Use the latest versions**: Deploy the latest version series of ArangoDB
  to benefit from performance improvements and security fixes.

- **Testing environments**: Use QA environments and UAT (User Acceptance
  Testing) to test all changes, in particular queries, before going live
  with production deployments.

### Security

- **Non-root user**: Create a dedicated system user and group (like `arango`)
  to run ArangoDB processes. Never use the `root` user to run any ArangoDB
  processes (if you run ArangoDB on Linux).

- **Access control**: Restrict access to the deployment to authorized
  personnel only. Implement proper authentication and authorization mechanisms.

- **JWT authentication**: Enable JWT authentication for production
  deployments. See [JWT authentication](../develop/http-api/authentication.md#jwt-user-tokens)
  for more details.

- **Encryption**: Enable [Encryption at Rest](../operations/security/encryption-at-rest.md)
  for sensitive data. Make sure to safely store any secret keys you create
  for this.

- **JavaScript hardening**: Enable JavaScript hardening to restrict what
  server-side JavaScript code like Foxx, user-defined AQL functions (UDFs), and
  JavaScript Transactions can access. Add the following startup options
  to your configuration:

  {{< tabs "startup-options" >}}

  {{< tab "Command-line" >}}
  ```sh
  arangod ... \
  --server.harden \
  --javascript.harden \
  --javascript.environment-variables-allowlist '^$' \
  --javascript.files-allowlist '^$' \
  --javascript.endpoints-allowlist '^$' \
  --javascript.startup-options-allowlist '^$'
  ```
  {{< /tab >}}

  {{< tab "Configuration file" >}}
  ```cfg
  [server]
  harden = true

  [javascript]
  harden = true
  environment-variables-allowlist = ^$
  files-allowlist = ^$
  endpoints-allowlist = ^$
  startup-options-allowlist = ^$
  ```
  {{< /tab >}}

  {{< /tabs >}}

  {{< security >}}
  When `--javascript.environment-variables-allowlist`,
  `--javascript.files-allowlist`, `--javascript.endpoints-allowlist`,
  and `--javascript.startup-options-allowlist`
  are left unset (the default), they permit **all** access rather than
  no access. You must explicitly set them to restrict JavaScript code
  from reading and writing arbitrary files, accessing environment variables,
  reading startup configuration values, or making outbound HTTP requests
  from within the server process. A value of `^$` for an allowlist will
  allow nothing.

  Note that these options restrict all JavaScript execution within the
  _arangod_ process, not just a single feature like UDFs. Foxx microservices and
  server-side operations initiated through _arangosh_ are also subject to these
  restrictions. In particular, `--javascript.files-allowlist` is the most
  likely to cause visible side effects, as file operations are fundamental
  to Foxx app installation and server-side administration. Deployments that
  rely on Foxx or make outbound HTTP calls from Foxx services should
  evaluate these settings before applying them.
  {{< /security >}}

  See [Server security options](../operations/security/security-options.md#javascript-security-options)
  for the full list of JavaScript security settings.

- **User-defined AQL functions (UDFs)**: If your deployment does not use
  [User-defined functions](../aql/user-defined-functions.md),
  disable them by setting `--javascript.user-defined-functions` to
  `false`. This prevents the registration of custom JavaScript functions via the
  `/_api/aqlfunction` endpoint and no custom functions can be executed in AQL.

- **Tasks / Queues**: If your deployment does not use the higher-level
  [Foxx queues](../develop/foxx-microservices/reference/related-modules/queues.md),
  or the underlying [Tasks](../develop/javascript-api/tasks.md) feature, you can
  disable these features by setting `--foxx.queues` and `--javascript.tasks` to
  `false`. This prevents the registration and timed execution of custom
  JavaScript code.

- **Foxx**: If your deployment does not use custom
  [Foxx microservices](../develop/foxx-microservices/_index.md), you can disable
  this feature by setting `--foxx.enable` to `false`. This prevents the
  installation of custom Foxx apps as well as the execution of already installed
  ones (excluding system services that require Foxx).

- **JavaScript Transactions**: If your deployment does not use
  [JavaScript Transactions](../develop/transactions/javascript-transactions.md),
  you can disable them by setting `--javascript.transactions` to `false`.
  This prevents running JavaScript code as transactions, but doesn't affect
  [Stream Transactions](../develop/transactions/stream-transactions.md).

### Logging and Monitoring

- **Log visibility**: The _arangod_ (server) process and the _arangodb_
  (_Starter_) process (if in use) have some form of logging enabled and logs can
  easily be located and inspected.

- **Third-party monitoring**: Configure third-party metrics monitoring tools
  like Grafana with Prometheus to monitor ArangoDB metrics comprehensively.

- **Metrics collection**: Enable the ArangoDB metrics API for
  production monitoring:
  - Set [`--server.export-metrics-api`](../components/arangodb-server/options.md#--serverexport-metrics-api)
    to `true` to enable the metrics endpoints
  - Enable [`--server.export-read-write-metrics`](../components/arangodb-server/options.md#--serverexport-read-write-metrics)
    for additional document read/write metrics
  - Consider enabling [`--server.export-shard-usage-metrics`](../components/arangodb-server/options.md#--serverexport-shard-usage-metrics)
    for detailed shard usage tracking
  - Configure your monitoring system (Prometheus/Grafana) to scrape the
    `/_admin/metrics/v2` endpoint
  - See [HTTP interface for server metrics](../develop/http-api/monitoring/metrics.md)
    for detailed information

- **RocksDB statistics**: Consider enabling
  [`--rocksdb.enable-statistics`](../components/arangodb-server/options.md#--rocksdbenable-statistics)
  to `true` for detailed RocksDB performance metrics.

- **Metrics monitoring**: Monitor the ArangoDB-provided metrics with alerting
  based on these threshold guidelines:
  - Disk usage: 60% (red line)
  - CPU usage: 90% (red line)
  - Memory usage: 85% (red line)

### Memory

- **Total memory limit**: For DB-Servers and Coordinators, override the
  [`ARANGODB_OVERRIDE_DETECTED_TOTAL_MEMORY`](../components/arangodb-server/environment-variables.md)
  environment variable using this rule of thumb:
  - Multiply available memory by 0.9 to leave headspace for
    OS/Kubernetes, client connections, etc.
  - Use 3/4 of that value for DB-Servers.
  - Use 1/4 of that value for Coordinators.
  - Agents typically don't need much memory and can use the remaining
    10% headspace.

- **Memory overuse**: Note that if ArangoDB "sees" x GB of memory in a pod, it
  will try to use those x GB. Memory accounting has been vastly improved in
  3.12, but overshooting in certain cases may still occur.

- **Memory paging**: Disable swap space to avoid slowdown which can result in
  servers being incorrectly detected as failed.

- **Query memory limits**: Configure appropriate memory limits for AQL queries:
  - Set [`--query.memory-limit`](../components/arangodb-server/options.md#--querymemory-limit)
    to limit the memory used per individual query.
  - Consider setting [`--query.global-memory-limit`](../components/arangodb-server/options.md#--queryglobal-memory-limit)
    to limit the total memory used by all concurrent queries (per _arangod_ process).

### Service Management

- **Auto restart**: Ensure ArangoDB is automatically restarted (e.g. by using a
  systemd service file). Typically you would use the Kubernetes operator or use
  systemd to launch the _Starter_.

- **Conflict with single server**: If you installed an ArangoDB package and now
  want to deploy with the _Starter_, make sure to stop - and disable the
  automated start of - the ArangoDB _Single Instance_ that the package may have
  set up automatically, e.g. on Ubuntu:

  ```sh
  service arangodb3 stop
  update-rc.d -f arangodb3 remove
  ```

### Cluster Configuration

- **Replication configuration**: For production clusters, configure
  collections with:
  - A replication factor of 3 for optimal data availability and fault
    tolerance.
  - A minimal replication factor of a value equal or higher than 2.
  - A write concern of 2.
  See [cluster startup options](../components/arangodb-server/options.md#cluster).

- **Shard limits**: Keep the total number of shards below 10,000 across
  your cluster to maintain optimal performance and avoid resource exhaustion.

### Disk Performance

- **Storage performance**: Verify that your storage performance is at least
  100 IOPS for each volume in production mode. This is the bare minimum and
  it's recommended to provide more for performance. It is probably only a
  concern if you use a cloud infrastructure. Note that IOPS might be allotted
  based on a volume size, so make sure to check your storage provider for
  details. Furthermore, you should be careful with burst mode guarantees as
  ArangoDB requires a sustainable high IOPS rate.

- **DB-Server storage limit**: Keep individual DB-Server storage below 2TB
  per server to maintain optimal performance.

- **I/O bandwidth**: Give considerations to I/O bandwidth, especially
  considering RocksDB write-amplification which can easily be 10x or more.

- **Block storage**: Whenever possible use block storage. Database data is
  based on append operations, so filesystems which support this should be
  used for best performance. ArangoDB does not recommend using NFS for
  performance reasons, furthermore we experienced some issues with hard links
  required for Hot Backup.

### Backup and Recovery

- **Test restore procedures**: Verify your backup and restore procedures
  are working.
  
  {{< warning >}}
  Test your restore procedure regularly to ensure you can recover from failures.
  {{< /warning >}}

- **Hot Backup frequency**: Take Hot Backups with a frequency that matches
  your RTO (Recovery Time Objective) and RPO (Recovery Point Objective)
  requirements.

- **arangodump backups**: Take backups with _arangodump_ from time to time as
  an additional backup strategy alongside Hot Backups.

- **Secure backup storage**: Store backups in a secure, separate location
  from your production systems. Use encrypted storage and ensure backups are
  geographically distributed to protect against regional disasters. Implement
  proper access controls for backup storage locations.

- **Retry mechanisms**: Implement exponential retry with jitter in your
  applications when connecting to ArangoDB to handle temporary network issues
  and failovers gracefully.

## Kubernetes Operator (`kube-arangodb`)

- **Supported versions**: Check the
  [supported versions](https://github.com/arangodb/kube-arangodb#production-readiness-state)
  for Kubernetes, the operator, and supported Kubernetes distributions.

- **Volume reclaim policy**: The
  [ReclaimPolicy](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#reclaiming)
  of your persistent volumes should be set to `Retain` to prevent volumes
  from premature deletion.

- **Native networking**: Use native networking whenever possible to reduce delays.
