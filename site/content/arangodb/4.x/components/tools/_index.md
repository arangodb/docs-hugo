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
| `arangovpack`   | Utility to validate and [convert VelocyPack](arangovpack/_index.md) and JSON data.
| `arangoinspect` | [Inspection tool](arangoinspect/_index.md) that gathers server setup information.

### Connect to an ArangoDB server

All client tools except _arangovpack_ work with a running ArangoDB server and
share the same startup options for connecting and authenticating.

Unless you specify otherwise, the client tools connect to the `_system` database
of the server at the endpoint `http://127.0.0.1:8529` as the `root` user, and prompt
you for a password (_arangoinspect_ prompts you for the JWT secret of the server
instead).

- `--server.endpoint`: The endpoint of the server to connect to, like
  `http://192.168.173.13:8529` or `https://example.com:8529` for a TLS-secured
  connection. In a cluster, connect to a Coordinator. For the supported
  schemas, see the [_arangosh_ examples](arangodb-shell/examples.md#connecting-to-a-server).
- `--server.database`: The name of the database to connect to.
- `--server.username` and `--server.password`: The credentials to authenticate
  with. You can also specify an [access token](../../develop/http-api/authentication.md#access-tokens)
  instead of a password.
- `--server.authentication`: Whether to authenticate at all. Set it to `false`
  if authentication is disabled on the server.

For all options, see the _Options_ page of each tool.

#### Authentication methods

The tools support the following methods of authenticating with the server:

| Method | Startup options |
|:-------|:----------------|
| Username and password or access token | `--server.username`, `--server.password` |
| [JWT session token](../../develop/http-api/authentication.md#create-a-jwt-session-token), [user token](../../develop/http-api/authentication.md#jwt-user-tokens), or [superuser token](../../develop/http-api/authentication.md#jwt-superuser-tokens) | `--server.jwt-token` |
| JWT secret of the server (to let the tool generate superuser tokens) | `--server.jwt-secret-keyfile`, `--server.ask-jwt-secret` |

The JWT options cannot be combined with each other or with a username and password.
Which of these options a tool provides is listed on its _Options_ page.

If you specify a username and a password or access token, the tools exchange
these credentials for a JWT session token via the
[`POST /_open/auth` endpoint](../../develop/http-api/authentication.md#create-a-jwt-session-token)
when they start and use this token for all further requests. _arangosh_ and
_arangoinspect_ do so since v3.12.6, the other tools since v3.12.13. Before,
the tools used HTTP Basic Authentication, which doesn't work with deployments
that use [RBAC](../../release-notes/version-3.12/whats-new-in-3-12.md#external-service-for-rbac)
for authorization. If the server doesn't issue tokens, for example, because
authentication is disabled, the tools still fall back to HTTP Basic Authentication.

#### Keep credentials out of the process list

Values of startup options you specify on the command line are visible to other
users of the system, for example, in the process list. To avoid exposing
passwords, tokens, and secrets this way, you can:

- Omit `--server.password` to be prompted for the password.
- Set `--server.jwt-token` to `-` to be prompted for the token.
- Use `--server.ask-jwt-secret` to be prompted for the JWT secret, or
  `--server.jwt-secret-keyfile` to load it from a file.
- Reference an environment variable using the
  [`@VARIABLE@` syntax](../../operations/administration/configuration.md#environment-variables-as-parameters),
  like `--server.password @ARANGO_PASSWORD@`. Note that you need to escape
  literal at signs in passwords as `@@`.
- Set the options in a [configuration file](../../operations/administration/configuration.md#configuration-file-format).

#### Automatic JWT renewal

<small>Introduced in: v3.12.13</small>

JWT session tokens are only valid for a limited time. The server issues them
via the `POST /_open/auth` endpoint, for example, when the tools log in with a
username and password, and they expire after the duration that the server's
`--server.session-timeout` startup option defines, which is one hour by default.
User tokens and superuser tokens that you generate with the JWT secret normally
have no expiry time.

To prevent long-running operations like dumps and restores from failing with an
HTTP `401 Unauthorized` error once a token expires, the tools renew tokens with
an expiry time automatically before they expire:

- **Username and password or access token**: The tools obtain a new session
  token using the same credentials, so the renewal works for as long as the
  credentials are valid. If you use an access token, this means until the access
  token itself expires. _arangosh_ and _arangoinspect_ renew such tokens since
  v3.12.6.
- **JWT session token** (`--server.jwt-token`): The tools ask the server for a
  new session token for the same user. The server only issues a new token if the
  current one expires within the next 150 seconds. Until then, the tools retry
  every five seconds.
- **JWT user token or superuser token** (`--server.jwt-token`): Without an
  expiry time (`exp`), these tokens stay valid until the JWT secret of the
  server changes, so there is nothing to renew. If you generate a user token with
  an expiry time, it is renewed like a session token, and the tools continue
  with regular session tokens. Superuser tokens are not bound to a user and
  cannot be renewed. If you generate one with an expiry time, make sure it is
  long enough for the entire operation.
- **JWT secret** (`--server.jwt-secret-keyfile`, `--server.ask-jwt-secret`):
  The superuser tokens that the tools generate have no expiry time, so
  there is nothing to renew.

The [`--server.jwt-renewal-threshold`](arangodump/options.md#--serverjwt-renewal-threshold)
startup option controls how many seconds before the expiry a renewal is attempted.
To avoid renewing the token on every check, the tools don't attempt
a renewal before half of the token's lifetime has passed, regardless of the
threshold. If a renewal attempt fails, the tools log a warning, keep using the
current token, and retry every five seconds until the token expires.
A higher threshold therefore gives the tools more time to recover from
temporary errors, like an unreachable server. _arangosh_ and _arangoinspect_
handle tokens obtained via username and password differently: they check whether
the token expires within the threshold whenever they send a request, and if so,
obtain a new token before sending it.

With a threshold of `0`, the tools only attempt a renewal once the token has
expired. Requests sent between the expiry and the renewal fail, and an expired
token passed via `--server.jwt-token` cannot be renewed at all. You cannot
disable the automatic renewal, but it doesn't happen for tokens without an
expiry time.
