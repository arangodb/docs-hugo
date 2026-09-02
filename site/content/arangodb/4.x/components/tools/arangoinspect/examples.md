---
title: _arangoinspect_ Examples
menuTitle: Examples
weight: 5
description: >-
  How to use the `arangoinspect` tool to collection information for troubleshooting
---
If you are asked by Arango support to provide an inspector output, run
the _arangoinspect_ binary to generate a file in the current working folder.

The resulting JSON file is a collection of meta data acquired from all
involved instances. The data includes relevant operating system parameters,
ArangoDB process parameters, local database information etc.

{{< warning >}}
Please open the file locally and check if it contains anything that you are
not allowed/willing to share and obfuscate it before sharing (user names,
files paths etc.).
{{< /warning >}}

## Invoking *arangoinspect*

Point the tool to an ArangoDB endpoint. In case of a single server, there
is only one. You can connect to any node in case of a cluster (_DB-Server_,
_Coordinator_, _Agent_).

```
arangoinspect --server.endpoint tcp://127.0.0.1:8529
```

This tries to connect to the specified ArangoDB server. As _arangoinspect_
needs to query the Agency, you generally have to authenticate with the JWT
secret of the deployment, that is, the content of the file that the `arangod`
option [`--server.jwt-secret-keyfile`](../../arangodb-server/options.md#--serverjwt-secret-keyfile)
points to (or of one of the files in a `--server.jwt-secret-folder`).

Let _arangoinspect_ read the secret from this file:

```
arangoinspect --server.endpoint tcp://127.0.0.1:8529 --server.jwt-secret-keyfile /etc/arangodb.secret
```

Alternatively, you can use the `--server.ask-jwt-secret` option to get prompted
for the secret and type it in. This is only feasible if the secret is a string
you can type, however. It may contain arbitrary bytes, like the secrets that the
[ArangoDB Starter](../arangodb-starter/security.md#jwt-tokens) creates, in which
case you need to use `--server.jwt-secret-keyfile`.

You can also authenticate with an existing authentication token using the
`--server.jwt-token` option. Set the value to `-` to get prompted for the token
instead of passing it as a command-line argument:

```
arangoinspect --server.endpoint tcp://127.0.0.1:8529 --server.jwt-token -
```

For non-cluster deployments, you may authenticate with a user name and password
(or access token) instead. The prompt for the JWT secret is enabled by default
for _arangoinspect_ and cannot be combined with a user name and password, so you
need to disable it:

```
arangoinspect --server.ask-jwt-secret false --server.username "root" --server.password "foobar"
```

The password can be omitted and entered interactively.

## Example outputs

If _arangoinspect_ succeeds to authenticate, it starts to gather information
and writes the result to `arangodb-inspector.json`, then exits:

```
arangoinspect --server.endpoint tcp://127.0.0.1:9730

Please specify the JWT secret: 
Connected to ArangoDB 'http+tcp://localhost:9730, version: 4.0.0 [COORDINATOR, unknown mode], database: '_system', username: 'root'

    _                                  ___                           _
   / \   _ __ __ _ _ __   __ _  ___   |_ _|_ __  ___ _ __   ___  ___| |_ ___  _ __
  / _ \ | '__/ _` | '_ \ / _` |/ _ \   | || '_ \/ __| '_ \ / _ \/ __| __/ _ \| '__|
 / ___ \| | | (_| | | | | (_| | (_) |  | || | | \__ \ |_) |  __/ (__| || (_) | |
/_/   \_\_|  \__,_|_| |_|\__, |\___/  |___|_| |_|___/ .__/ \___|\___|\__\___/|_|
                         |___/                      |_|

INFO changing endpoint for CRDN-803fd418-f44e-4e7e-8e1e-5e3c0b6c5a0e from undefined to tcp://localhost:9730
INFO Analysing agency dump ...
INFO Plan (version 10)
INFO   Databases
INFO     _system
INFO   Collections
INFO     _system
INFO       _users
INFO       _graphs
INFO       _analyzers
INFO Server health
INFO   DB Servers
INFO     PRMR-933e8aaf-0e07-4379-a38e-735f100fe4f7(DBServer0003)
INFO     PRMR-0e53c515-d46e-46dd-8e2a-84be01727ec2(DBServer0002)
INFO     PRMR-3b6d09c4-8975-43e9-8648-cf9fe5fbefaa(DBServer0001)
INFO   Coordinators
INFO     CRDN-803fd418-f44e-4e7e-8e1e-5e3c0b6c5a0e(Coordinator0002)
INFO Supervision activity
INFO   Jobs: undefined(To do: 0, Pending: 0, Finished: 0, Failed: 0)
INFO Summary
INFO   1 databases
INFO   3 collections
INFO   3 shards
INFO ... agency analysis finished.
INFO Collecting diagnostics from all servers ...
INFO ... diagnostics collected.
INFO Report written to arango-inspector.json.
```

If _arangoinspect_ cannot connect or authentication/authorization fails, then a fatal error
is raised and the tool shuts down:

```
Could not connect to endpoint 'http+tcp://127.0.0.1:8529', database: '_system', username: 'root'
Error message: '401: Unauthorized'

    _                                  ___                           _
   / \   _ __ __ _ _ __   __ _  ___   |_ _|_ __  ___ _ __   ___  ___| |_ ___  _ __
  / _ \ | '__/ _` | '_ \ / _` |/ _ \   | || '_ \/ __| '_ \ / _ \/ __| __/ _ \| '__|
 / ___ \| | | (_| | | | | (_| | (_) |  | || | | \__ \ |_) |  __/ (__| || (_) | |
/_/   \_\_|  \__,_|_| |_|\__, |\___/  |___|_| |_|___/ .__/ \___|\___|\__\___/|_|
                         |___/                      |_|                         

FATAL cannot connect to server 'http+tcp://127.0.0.1:8529': 401: Unauthorized
```
