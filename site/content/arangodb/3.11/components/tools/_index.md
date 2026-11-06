---
title: Tools
menuTitle: Tools
weight: 180
description: >-
  ArangoDB provides command-line tools for deploying ArangoDB, accessing server
  instances, creating backups, importing data, and more
---
## Standalone tools

The following tools are independent programs that you can obtain separately.
They have their own options for connecting to ArangoDB, if any.

| Name            | Brief description |
|-----------------|-------------------|
| [ArangoDB Starter](arangodb-starter/_index.md) | Tool (`arangodb`) for easy deployment of ArangoDB instances. It is bundled with the full ArangoDB installation package but also available as a separate [download](https://github.com/arangodb-helper/arangodb/releases).
| [Foxx CLI](foxx-cli/_index.md) | Command line tool for managing and developing Foxx services
| [kube-arangodb](../../deploy/kubernetes.md) | Operators to manage Kubernetes deployments
| [oasisctl](../../../../amp/oasisctl/_index.md) | Command-line tool for managing the Arango Managed Platform (AMP)
| [ArangoDB Datasets](../../../../ecosystem/arango-datasets.md) | A Python package for loading sample datasets into ArangoDB

## Client tools

A full ArangoDB installation package contains the [ArangoDB server](../arangodb-server/_index.md)
(_arangod_), the ArangoDB Starter, and the client tools. A client installation
package only contains the client tools.

The client tools are:

| Executable name | Brief description |
|-----------------|-------------------|
| `arangosh`      | [ArangoDB shell](arangodb-shell/_index.md). A client that implements a read-eval-print loop (REPL) and provides functions to access and administrate the ArangoDB server.
| `arangodump`    | Tool to [create backups](arangodump/_index.md) of an ArangoDB database.
| `arangorestore` | Tool to [load backups](arangorestore/_index.md) back into an ArangoDB database.
| `arangobackup`  | Tool to [perform hot backup operations](arangobackup/_index.md) on an ArangoDB installation.
| `arangoimport`  | [Bulk importer](arangoimport/_index.md) for the ArangoDB server. It supports JSON and CSV.
| `arangoexport`  | [Bulk exporter](arangoexport/_index.md) for the ArangoDB server. It supports JSON, CSV and XML.
| `arangobench`   | [Benchmark and test tool](arangobench/_index.md). It can be used for performance and server function testing.
| `arangovpack`   | Utility to validate and [convert VelocyPack](arangovpack/_index.md) and JSON data.
| `arangoinspect` | [Inspection tool](arangoinspect/_index.md) that gathers server setup information.

### Connect to an ArangoDB server

All client tools except _arangovpack_ work with a running ArangoDB server and
share the same startup options for connecting and authenticating.

Unless you specify otherwise, the client tools connect to the `_system` database
of the server at the endpoint `tcp://127.0.0.1:8529` as the `root` user, and prompt
you for a password (_arangoinspect_ prompts you for the JWT secret of the server
instead).

- `--server.endpoint`: The endpoint of the server to connect to, like
  `tcp://192.168.173.13:8529` or `ssl://example.com:8529` for a TLS-secured
  connection. In a cluster, connect to a Coordinator. For the supported
  schemas, see the [_arangosh_ examples](arangodb-shell/examples.md#connecting-to-a-server).
- `--server.database`: The name of the database to connect to.
- `--server.username` and `--server.password`: The credentials to authenticate with.
- `--server.authentication`: Whether to authenticate at all. Set it to `false`
  if authentication is disabled on the server.

For all options, see the _Options_ page of each tool.

#### Authentication methods

The tools support the following methods of authenticating with the server:

| Method | Startup options | Supported by |
|:-------|:----------------|:-------------|
| Username and password | `--server.username`, `--server.password` | All tools |
| JWT secret of the server (to let the tool generate [JWT superuser tokens](../../develop/http-api/authentication.md#jwt-superuser-tokens)) | `--server.jwt-secret-keyfile`, `--server.ask-jwt-secret` | _arangosh_, _arangoinspect_, _arangodump_, _arangorestore_ |

The JWT secret options cannot be combined with each other or with a username
and password.

#### Keep credentials out of the process list

Values of startup options you specify on the command line are visible to other
users of the system, for example, in the process list. To avoid exposing
passwords and secrets this way, you can:

- Omit `--server.password` to be prompted for the password.
- Use `--server.ask-jwt-secret` to be prompted for the JWT secret, or
  `--server.jwt-secret-keyfile` to load it from a file.
- Reference an environment variable using the
  [`@VARIABLE@` syntax](../../operations/administration/configuration.md#environment-variables-as-parameters),
  like `--server.password @ARANGO_PASSWORD@`. Note that you need to escape
  literal at signs in passwords as `@@`.
- Set the options in a [configuration file](../../operations/administration/configuration.md#configuration-file-format).
