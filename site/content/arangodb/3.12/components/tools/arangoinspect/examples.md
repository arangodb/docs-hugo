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

{{< security >}}
Avoid passing secrets as command-line arguments, as they may be visible to other
users of the system, for instance via the process list. This is also why the
`arangod` option `--server.jwt-secret` is deprecated in favor of
`--server.jwt-secret-keyfile`.
{{< /security >}}

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
arangoinspect --server.endpoint tcp://127.0.0.1:8629

Please specify the JWT secret: 
Connected to ArangoDB 'http+tcp://127.0.0.1:8629' version: 3.4.devel [server], database: '_system', username: 'root'

    _                                  ___                           _
   / \   _ __ __ _ _ __   __ _  ___   |_ _|_ __  ___ _ __   ___  ___| |_ ___  _ __
  / _ \ | '__/ _` | '_ \ / _` |/ _ \   | || '_ \/ __| '_ \ / _ \/ __| __/ _ \| '__|
 / ___ \| | | (_| | | | | (_| | (_) |  | || | | \__ \ |_) |  __/ (__| || (_) | |
/_/   \_\_|  \__,_|_| |_|\__, |\___/  |___|_| |_|___/ .__/ \___|\___|\__\___/|_|
                         |___/                      |_|                         

2018-06-05T19:40:10Z [19858] INFO Connected to ArangoDB 'http+tcp://[::1]:4001', version 3.4.devel [server], database '_system', username: 'root'
2018-06-05T19:40:10Z [19858] INFO Connected to ArangoDB 'http+tcp://[::1]:4001', version 3.4.devel [server], database '_system', username: 'root'
INFO changing endpoint for AGNT-01e83a4b-8a51-4919-9f50-ff640accb9fa from http+tcp://[::1]:4001 to tcp://[::1]:4001
INFO changing endpoint for PRMR-9f5b337e-c1de-4b7d-986a-d6ad2eb8f857 from tcp://127.0.0.1:8629 to tcp://[::1]:8629
INFO Analysing agency dump ...
INFO Plan (version 22)
INFO   Databases
INFO     _system
INFO   Collections
INFO     _system
INFO       _graphs
INFO       _users
INFO       _modules
INFO       _iresearch_analyzers
INFO       _routing
INFO       _aqlfunctions
INFO       _frontend
INFO       _queues
INFO       _jobs
INFO       _apps
INFO       _appbundles
INFO       _statisticsRaw
INFO       _statistics
INFO       _statistics15
INFO Server health
INFO   DB Servers
INFO     PRMR-9f5b337e-c1de-4b7d-986a-d6ad2eb8f857(DBServer0001)
INFO     PRMR-90ff8c20-b0f3-49c5-a5dd-7b186bb7db33(DBServer0002)
INFO   Coordinators
INFO     CRDN-0dbf16ec-8a06-4203-9359-447d97757b4e(Coordinator0001)
INFO Supervision activity
INFO   Jobs: undefined(To do: 0, Pending: 0, Finished: 0, Failed: 0)
INFO Summary
INFO   1 databases
INFO   14 collections 
INFO   14 shards 
INFO ... agency analysis finished.
INFO Collecting diagnostics from all servers ... 
2018-06-05T19:40:10Z [19858] INFO Connected to ArangoDB 'http+tcp://[::1]:8629', version 3.4.devel [server], database '_system', username: 'root'
2018-06-05T19:40:11Z [19858] INFO Connected to ArangoDB 'http+tcp://[::1]:4001', version 3.4.devel [server], database '_system', username: 'root'
2018-06-05T19:40:11Z [19858] INFO Connected to ArangoDB 'http+tcp://[::1]:8630', version 3.4.devel [server], database '_system', username: 'root'
2018-06-05T19:40:11Z [19858] INFO Connected to ArangoDB 'http+tcp://[::1]:8530', version 3.4.devel [server], database '_system', username: 'root'
2018-06-05T19:40:11Z [19858] INFO Connected to ArangoDB 'http+tcp://[::1]:4001', version 3.4.devel [server], database '_system', username: 'root'
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
