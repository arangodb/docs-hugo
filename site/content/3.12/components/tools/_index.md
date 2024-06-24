---
title: Tools
menuTitle: Tools
weight: 180
description: >-
  ArangoDB ships with command-line tools like for accessing server instances
  programmatically, deploying clusters, creating backups, and importing data
---
A full ArangoDB installation package contains the [ArangoDB server](../arangodb-server/_index.md)
(`arangod`) as well as the following client tools:

| Executable name | Brief description |
|-----------------|-------------------|
| `arangosh`      | [ArangoDB shell](arangodb-shell/_index.md). A client that implements a read-eval-print loop (REPL) and provides functions to access and administrate the ArangoDB server.
| `arangodb`      | [ArangoDB Starter](arangodb-starter/_index.md) for easy deployment of ArangoDB instances.
| `arangodump`    | Tool to [create backups](arangodump/_index.md) of an ArangoDB database.
| `arangorestore` | Tool to [load backups](arangorestore/_index.md) back into an ArangoDB database.
| `arangobackup`  | Tool to [perform hot backup operations](arangobackup/_index.md) on an ArangoDB installation.
| `arangoimport`  | [Bulk importer](arangoimport/_index.md) for the ArangoDB server. It supports JSON and CSV.
| `arangoexport`  | [Bulk exporter](arangoexport/_index.md) for the ArangoDB server. It supports JSON, CSV and XML.
| `arangobench`   | [Benchmark and test tool](arangobench/_index.md). It can be used for performance and server function testing.
| `arangovpack`   | Utility to validate and [convert VelocyPack](arangovpack/_index.md) and JSON data.
| `arangoinspect` | [Inspection tool](arangoinspect/_index.md) that gathers server setup information.

A client installation package comes without the `arangod` server executable and
the ArangoDB Starter.

Additional tools which are available separately:

| Name            | Brief description |
|-----------------|-------------------|
| [Foxx CLI](foxx-cli/_index.md) | Command line tool for managing and developing Foxx services
| [kube-arangodb](../../deploy/kubernetes.md) | Operators to manage Kubernetes deployments
| [Oasisctl](../../arangograph/oasisctl/_index.md) | Command-line tool for managing the ArangoGraph Insights Platform
| [ArangoDB Datasets](arango-datasets.md) | A Python package for loading sample datasets into ArangoDB