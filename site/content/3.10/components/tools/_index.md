---
title: Programs & Tools
menuTitle: Tools
weight: 175
description: >-
  The full ArangoDB package ships with the following programs and tools
archetype: chapter
---
The full ArangoDB package ships with the following programs and tools:

| Executable name | Brief description |
|-----------------|-------------------|
| `arangod`       | [ArangoDB server](../arangodb-server/_index.md). This server program is intended to run as a daemon process / service to serve the various client connections to the server via TCP / HTTP. It also provides a [web interface](../web-interface/_index.md).
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

The client package comes with a subset of programs and tools:

- `arangosh`
- `arangoimport`
- `arangoexport`
- `arangodump`
- `arangorestore`
- `arangobackup`
- `arangobench`
- `arangoinspect`
- `arangovpack`

Additional tools which are available separately:

| Name            | Brief description |
|-----------------|-------------------|
| [Foxx CLI](foxx-cli/_index.md) | Command line tool for managing and developing Foxx services
| [kube-arangodb](../../deploy/deployment/kubernetes/_index.md) | Operators to manage Kubernetes deployments
| [Oasisctl](../../arangograph/api/oasisctl/_index.md) | Command-line tool for managing the ArangoGraph Insights Platform
