---
title: How to Interact With ArangoDB
menuTitle: How to Interact with ArangoDB
weight: 50
description: ''
archetype: default
---
## How to Communicate with the Server

The core component of ArangoDB is the [ArangoDB server](../components/arangodb-server/_index.md)
(`arangod`) that stores data and handles requests. You have different options
for talking to the server, through the web interface, command-line tools, 
drivers, and the server's REST API.

### Web Interface

The easiest way to get started with ArangoDB is to use the included
[web interface](../components/web-interface/_index.md). The ArangoDB server serves this
graphical user interface (GUI) and you can access it by pointing your browser to
the server's endpoint, which is `http://localhost:8529` by default if you run a
local server.

The web interface lets you perform all essential actions like creating
collections, viewing documents, and running queries. You can also view graphs
and the server logs and metrics, as well as administrate user accounts.

### Interactive Command-line Interface (CLI)

If you are a developer, you may feel more comfortable to work in a terminal.
You can use [arangosh](../components/tools/arangodb-shell/_index.md), an interactive shell that ships
with ArangoDB, and its [JavaScript API](../develop/javascript-api/@arangodb/db-object.md), to
interact with the server. You can also use it for automating tasks.

### Drivers and Integrations

When you start using ArangoDB in your project, you will likely use an official
or community-made [driver](../develop/drivers/_index.md) written in the same language as your project.
Drivers implement a programming interface that should feel natural for that
programming language, and do all the talking to the server.

Integrations combine a third-party technology with ArangoDB and can be seen as
a translation layer that takes over the low-level communication with the server.

### REST API

Under the hood, all interactions with the server make use of its REST API.
A [REST](https://en.wikipedia.org/wiki/Representational_state_transfer)
API is an application programming interface based on the HTTP protocol that
powers the world wide web.

All requests from the outside to the server need to made against the respective
endpoints of this API to perform actions. This includes the web interface, _arangosh_,
as well as the drivers and integrations for different programming languages and
environments. They all provide a convenient way to work with ArangoDB, but you
may use the low-level REST API directly as needed.

See the [HTTP](../develop/http/_index.md) documentation to learn more about the API, how requests
are handled and what endpoints are available.

## Set Up and Deploy ArangoDB

[ArangoDB Starter](../components/tools/arangodb-starter/_index.md) (`arangodb` binary) helps you set up
and deploy ArangoDB instances on bare-metal servers and supports all ArangoDB
deployment modes, such as a single server instance, Active Failover, and cluster
(including Datacenter-to-Datacenter Replication).

In addition to the Starter, there are also other ways that you can use to deploy
ArangoDB:
- Run the `arangod` executable directly
- [Docker containers](../operations/installation/docker.md)
- [Kubernetes](../deploy/deployment/kubernetes/_index.md)
- Use installation packages

## How to Get Data In and Out of ArangoDB

With the [*arangoimport*](../components/tools/arangoimport/_index.md) command-line tool, you can
import data from JSON, JSONL, CSV, and TSV formats into a database collection in
ArangoDB. Thanks to its multi-threaded architecture and bulk import capabilities,
you can import your data at high speeds.

Similarly, with [*arangoexport*](../components/tools/arangoexport/_index.md) you can export data
from your database collection to JSON, JSONL, CSV, TSV, XML, and XGMML formats.

There are also other alternatives, such as using drivers to write custom importers
or directly using the server's HTTP API.

## How to Back Up and Restore Data in ArangoDB

[*arangodump*](../components/tools/arangodump/_index.md) is a command-line tool that lets you
create backups of your data and structural information in a flexible and
efficient manner and can be used for all ArangoDB deployment modes.
With *arangodump*, you can create backups for selected collections or for all
collections of a database, including system collections. Additionally, you can
back up the structural information of your collections (name, indexes, sharding, etc.)
with or without the data stored in them.  

To restore backups created by *arangodump*, you can use 
[*arangorestore*](../components/tools/arangorestore/_index.md). Similarly to the backup process,
you can restore either all collections or just specific ones and choose whether
to restore structural information with or without data.

[*arangobackup*](../components/tools/arangobackup/_index.md) is a command-line tool that enables
you to create instantaneous and consistent [hot backups](../operations/backup-and-restore.md#hot-backups)
of the data and structural information stored in ArangoDB, without interrupting
the database operations. It can be used for all ArangoDB deployment modes.
It is only available in the Enterprise Edition.

<!--
## How to Import Data



## How to Operate ArangoDB



TODO: Aspects to incorporate in other content:

Even for a single document as result, we still get an array at the top level.

You may have noticed that the order of the returned documents is not necessarily
the same as they were inserted. There is no order guaranteed unless you explicitly
sort them.

This does still not return the desired result: James (10074) is returned before
John (9883) and Katie (9915). The reason is that the `_key` attribute is a string
in ArangoDB, and not a number. The individual characters of the strings are
compared. `1` is lower than `9` and the result is therefore "correct". If we
wanted to use the numerical value of the `_key` attributes instead, we could
convert the string to a number and use it for sorting. 

It is called a projection if only a subset of attributes is returned. Another
kind of projection is to change the structure of the results.
It is also possible to compute new values, for example by concatenation:

Pro tip: when defining objects, if the desired attribute key and the variable
to use for the attribute value are the same, you can use a shorthand notation:
`{ sumOfAges }` instead of `{ sumOfAges: sumOfAges }`.

-->
