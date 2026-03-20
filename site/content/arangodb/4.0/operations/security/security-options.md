---
title: Server security options
menuTitle: Security Options
weight: 5
description: >-
  You can harden an ArangoDB server by restricting APIs, limiting what can be 
  accessed in JavaScript contexts, and disable unused features
---
_arangod_ provides a variety of options to make a setup more secure. 
Administrators can use these options to limit access to certain ArangoDB
server functionality as well as preventing the leakage of information about
the environment that a server is running in.

## Server hardening

If the [`--server.harden` startup option](../../components/arangodb-server/options.md#--serverharden)
is set to `true` and authentication is enabled, non-admin users are denied
access to the following HTTP APIs:

- `/_admin/cluster/numberOfServers`
- `/_admin/license`
- `/_admin/metrics`
- `/_admin/status`
- `/_admin/system-report`
- `/_admin/usage-metrics`
- `/_api/engine/stats`

Additionally, no version details are revealed by the version HTTP API at
`/_api/version`.

The default value for this option is `false`.

## API availability and access

Certain administrative endpoints can be restricted with startup options. Some
only let you control the availability of APIs endpoint while others let you
specify the access permissions and required level of authentication, or both.
Disabling APIs you don't use and increasing the access restriction help to
reduce the attack surface.

- [`--server.support-info-api`](../../components/arangodb-server/options.md#--serversupport-info-api)\
  [`--server.options-api`](../../components/arangodb-server/options.md#--serveroptions-api):

  - `disabled`: Disable the API.
  - `jwt`: The API can only be accessed via superuser JWTs.
  - `admin` (default): The API can only be accessed by admin users
    and superuser JWTs.
  - `public`: Everyone with access to the `_system` database can access the API.

- [`--backup.api-enabled`](../../components/arangodb-server/options.md#--backupapi-enabled)\
  [`--log.api-enabled`](../../components/arangodb-server/options.md#--logapi-enabled)\
  [`--log.recording-api-enabled`](../../components/arangodb-server/options.md#--logrecording-api-enabled):
  - `false`: Disable the API.
  - `jwt`: Enable the API but restrict it to superuser JWTs.
  - `true` (default): Enable the API.

- [`--cluster.api-jwt-policy`](../../components/arangodb-server/options.md#--clusterapi.jwt-policy):
  - `jwt-all`: Superuser JWT required to access all operations
  - `jwt-write`: Superuser JWT required for `POST`/`PUT`/`DELETE` operations
  - `jwt-compat` (default): ArangoDB v3.7 compatibility mode

- [`--activities.only-superuser-enabled`](../../components/arangodb-server/options.md#--activitiesonly-superuser-enabled):
  - `true`: The API can only be accessed via superuser JWTs.
  - `false`: The API can only be accessed by admin users
    and superuser JWTs.

- [`--server.export-metrics-api`](../../components/arangodb-server/options.md#--serverexport-metrics-api):
  - `false`: Disable the API.
  - `true`: Enable the API.
