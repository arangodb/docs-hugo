---
title: Starting Manually
menuTitle: Manual Start
weight: 5
description: >-
  How to start an ArangoDB stand-alone instance by manually starting the needed
  _arangod_ process
---
## Local Start

We will assume that your IP is 127.0.0.1 and that the port 8529 is free:

```bash
arangod --server.endpoint http://0.0.0.0:8529 \
  --database.directory standalone &
```

## Manual Start in Docker

Manually starting a stand-alone instance via Docker is basically the same as described
in the paragraph above.

A bit of extra care has to be invested due to the way in which Docker isolates its
network. An endpoint like `--server.endpoint http://0.0.0.0:8529` only binds to
all interfaces inside the container, which does not include any external interface
of the host machine.

To let other containers communicate with the server, for example, containers
with the client tools or your application, create a user-defined
[network](https://docs.docker.com/engine/network/) and attach all containers
to it. The containers can then reach each other by their names. To also access
the server from the host machine, for example, with cURL, publish its port
using the `-p` option in addition:

```bash
docker network create arangodb-net

docker run -d --name arangodb --network arangodb-net -p 8529:8529 -e ARANGO_NO_AUTH=1 \
  arangodb/core:4.0.0 arangod --server.endpoint http://0.0.0.0:8529

docker run -it --rm --network arangodb-net arangodb/client-tools:4.0.0 \
  arangosh --server.endpoint http://arangodb:8529
```

With the `-p` option of `docker run`, you can also choose the address and port
of the host machine under which the server is reachable from other machines.
Be sure to check the
[official Docker documentation](https://docs.docker.com/engine/network/port-publishing/).
For example:

```bash
docker run -d -e ARANGO_NO_AUTH=1 -p 192.168.1.1:10000:8529 arangodb/core:4.0.0 arangod \
  --server.endpoint tcp://0.0.0.0:8529
```

This forwards port 10000 of the host's IP address 192.168.1.1 to port 8529
inside the container, where the server binds to all interfaces.

### Authentication

To start a container of the `arangodb/core` image, you have to decide on an authentication
method, otherwise the container will not start.

Provide one of the arguments to Docker as an environment variable. There are three
options:

1. ARANGO_NO_AUTH=1

   Disable authentication completely. Useful for local testing or for operating
   in a trusted network (without a public interface).
        
2. ARANGO_ROOT_PASSWORD=password

   Start ArangoDB with the given password for root.
        
3. ARANGO_RANDOM_ROOT_PASSWORD=1

   Let ArangoDB generate a random root password.
       
For more information about the ArangoDB container images, see
[Install with Docker](../../operations/installation/docker.md).
