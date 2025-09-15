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

- Executed the operating system (OS) optimization scripts if you run ArangoDB on Linux.
  See [Installing ArangoDB on Linux](../operations/installation/linux/_index.md) and its sub pages
  [Linux Operating System Configuration](../operations/installation/linux/operating-system-configuration.md) and
  [Linux OS Tuning Script Examples](../operations/installation/linux/linux-os-tuning-script-examples.md) for details.

- Ensure your OS is compatible with your ArangoDB version
  and keep it up to date at all times for security and stability.

- OS monitoring is in place with specific alerting thresholds:
  - **Disk usage**: Alert when reaching 60% (red line threshold).
  - **CPU usage**: Alert when reaching 90% (red line threshold).
  - **Memory usage**: Alert when reaching 85% (red line threshold).

- Disk space monitoring is in place. Consider setting up alerting to avoid out-of-disk situations.

## ArangoDB

- **Use the latest versions**: Deploy the latest version series
  of ArangoDB to benefit from performance improvements and security fixes.

- **Testing environments**: Use QA environments and UAT (User Acceptance Testing)
  to test all changes before going live with production deployments.

### Security

- The user _root_ is not used to run any ArangoDB processes
  (if you run ArangoDB on Linux).

- **Access control**: Restrict access to the deployment to authorized personnel only.
  Implement proper authentication and authorization mechanisms.

- **Encryption**: Enable [Encryption at Rest](../operations/security/encryption-at-rest.md)
  for sensitive data. Make sure to safely store any secret keys you create for this.

### Logging and Monitoring

- The _arangod_ (server) process and the _arangodb_ (_Starter_) process
  (if in use) have some form of logging enabled and logs can easily be
  located and inspected.

- **Third-party monitoring**: Configure third-party metrics monitoring tools like
  Grafana with Prometheus to monitor ArangoDB metrics comprehensively.

- **Configure metrics collection**: Enable the ArangoDB metrics API for production monitoring:
  - Set [`--server.export-metrics-api`](../components/arangodb-server/options.md#--serverexport-metrics-api) to `true` to enable the metrics endpoints
  - Enable [`--server.export-read-write-metrics`](../components/arangodb-server/options.md#--serverexport-read-write-metrics) for additional document read/write metrics
  - Consider enabling [`--server.export-shard-usage-metrics`](../components/arangodb-server/options.md#--serverexport-shard-usage-metrics) for detailed shard usage tracking
  - Configure your monitoring system (Prometheus/Grafana) to scrape the `/_admin/metrics/v2` endpoint
  - See [HTTP interface for server metrics](../develop/http-api/monitoring/metrics.md) for detailed information

- **Enable RocksDB statistics**: Consider enabling [`--rocksdb.enable-statistics`](../components/arangodb-server/options.md#--rocksdbenable-statistics) to `true` for detailed RocksDB performance metrics.

- Monitor the ArangoDB provided metrics with alerting based on the threshold guidelines:
  - Disk usage: 60% (red line)
  - CPU usage: 90% (red line)
  - Memory usage: 85% (red line)

### Memory

- For DB-Servers and Coordinators, override the
  [`ARANGODB_OVERRIDE_DETECTED_TOTAL_MEMORY`](../components/arangodb-server/environment-variables.md)
  environment variable using this rule of thumb:
  - Multiply available memory by 0.9 to leave headspace for OS/Kubernetes, client connections, etc.
  - Use 3/4 of that value for DB-Servers.
  - Use 1/4 of that value for Coordinators.
  - Agents typically don't need much memory and can use the remaining 10% headspace.

- Note that if ArangoDB "sees" x GB of memory in a pod,
  it will try to use those x GB. Memory accounting has been vastly improved in 3.12,
  but overshooting in certain cases may still occur.

- Disable swap space to avoid slowdown which can result in servers being incorrectly 
  detected as failed.

### Service Management

- Ensure ArangoDB will be automatically restarted (e.g. by using a systemd service file). Typically
  you would use the Kubernetes operator or use systemd to launch the _Starter_.

- If you use the _Starter_ to deploy, you stopped - and disabled
  automated start of - the ArangoDB _Single Instance_, e.g. on Ubuntu:

  ```
  service arangodb3 stop
  update-rc.d -f arangodb3 remove
  ```

### Cluster Configuration

- If you have deployed a Cluster, the _replication factor_  and 
  _minimal_replication_factor_ of your collections
  are set to a value equal or higher than 2, otherwise you run the risk of
  losing data in case of a node failure. See
  [cluster startup options](../components/arangodb-server/options.md#cluster).

- **Shard limits**: Keep the total number of shards below 10,000 across your cluster
  to maintain optimal performance and avoid resource exhaustion.

### Disk Performance

- **Storage performance**: Verify that your storage performance is at least 100 IOPS for each
  volume in production mode. This is the bare minimum and it's recommended to
  provide more for performance. It is probably only a concern if you use a
  cloud infrastructure. Note that IOPS might be allotted based on a volume size,
  so make sure to check your storage provider for details. Furthermore, you should
  be careful with burst mode guarantees as ArangoDB requires a sustainable
  high IOPS rate.

- **I/O bandwidth**: Give considerations to I/O bandwidth, especially considering 
  RocksDB write-amplification which can easily be 10x or more.

- **Block storage**: Whenever possible use block storage. Database data is based on append
  operations, so filesystems which support this should be used for best
  performance. ArangoDB does not recommend using NFS for performance reasons,
  furthermore we experienced some issues with hard links required for
  Hot Backup.

### Backup and Recovery

- **Test restore procedures**: Verify your backup and restore procedures are working.
  **TEST YOUR RESTORE PROCEDURE** regularly to ensure you can recover from failures.

- **Hot Backup frequency**: Take Hot Backups with a frequency that matches your
  RTO (Recovery Time Objective) and RPO (Recovery Point Objective) requirements.

- **arangodump backups**: Take backups with arangodump from time to time as an
  additional backup strategy alongside Hot Backups.

- **Retry mechanisms**: Implement exponential retry with jitter in your applications
  when connecting to ArangoDB to handle temporary network issues and failovers gracefully.

## Kubernetes Operator (kube-arangodb)

- Check [supported versions](https://github.com/arangodb/kube-arangodb#production-readiness-state)
  for Kubernetes, operator and supported Kubernetes distributions.

- The [**ReclaimPolicy**](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#reclaiming)
 of your persistent volumes should be set to `Retain` to prevent volumes from premature deletion.

- Use native networking whenever possible to reduce delays.