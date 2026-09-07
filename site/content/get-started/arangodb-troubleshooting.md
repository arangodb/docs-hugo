---
title: Troubleshooting the ArangoDB installation
menuTitle: Troubleshooting the install
weight: 15
description: >-
  Common problems when running ArangoDB in a Docker container for the first
  time, and how to fix them
---
This page covers the problems you are most likely to hit when following
[Get started with ArangoDB](arangodb.md).

Two commands answer most questions:

```bash
docker ps -a                # Is the container running, or did it exit?
docker logs arangodb        # Why did it exit?
```

## The container will not start

### Port 8529 is already allocated

Docker reports something like:

```
Error response from daemon: driver failed programming external connectivity:
Bind for 0.0.0.0:8529 failed: port is already allocated
```

Another process - often an earlier ArangoDB container - is using the port. Either
remove the old container:

```bash
docker rm -f arangodb
```

Or map ArangoDB to a different host port and use that port everywhere else:

```bash
docker run -d --name arangodb -p 8530:8529 \
  -e ARANGO_ROOT_PASSWORD=openSesame -e LANG=en_US.UTF-8 arangodb:3.12
```

### The container exits immediately on Apple silicon or another ARM machine

The logs show an illegal instruction, or the container stops without a clear
error. Docker has selected an `amd64` image and is emulating it, and the
emulation does not provide the AVX instruction set extension that ArangoDB
requires.

Specify the architecture explicitly:

```bash
docker run -d --name arangodb --platform linux/arm64/v8 \
  -p 8529:8529 -e ARANGO_ROOT_PASSWORD=openSesame -e LANG=en_US.UTF-8 arangodb:3.12
```

If you have `DOCKER_DEFAULT_PLATFORM` set in your environment, that is usually
what overrode the default.

### The container is killed shortly after starting

The logs end abruptly, and `docker ps -a` shows exit code `137`. The container
ran out of memory. Raise the memory limit available to Docker (in Docker
Desktop, under **Settings** &rarr; **Resources**) and start it again.

## The server starts but you cannot use it

### Authentication fails with the password you set

`ARANGO_ROOT_PASSWORD` is only applied on the **first** start, when the database
directory is empty. If you reused a container or a volume from an earlier run,
the original password is still in effect.

To start over with a fresh password, remove the container and its volumes:

```bash
docker rm -f arangodb
docker volume rm arangodb-data arangodb-apps   # only if you created volumes
```

Then run the container again.

### The server refuses to start because of the language setting

The logs mention a mismatch between the configured language and the one the
database directory was initialized with. The language is fixed when the
database directory is created and cannot be changed later.

Either start the container with the same `LANG` value as the first run, or
remove the data directory and initialize it again with the language you want.

### Connection refused right after `docker run`

The container is up but `arangod` is still starting - the first start
initializes the database directory, which takes a few seconds. Watch the logs
until the server reports that it is ready:

```bash
docker logs -f arangodb
```

## Your data disappeared

By default the container writes to its own writable layer, which is deleted with
the container. If you ran `docker rm`, the data is gone.

Mount named volumes so the data outlives the container:

```bash
docker run -d --name arangodb \
  -p 8529:8529 \
  -e ARANGO_ROOT_PASSWORD=openSesame \
  -e LANG=en_US.UTF-8 \
  -v arangodb-data:/var/lib/arangodb3 \
  -v arangodb-apps:/var/lib/arangodb3-apps \
  arangodb:3.12
```

## Still stuck?

- [Install with Docker](../arangodb/3.12/operations/installation/docker.md) -
  the complete set of container options.
- [Troubleshooting](../arangodb/3.12/operations/troubleshooting/_index.md) -
  diagnosing a running ArangoDB instance.
- [Known issues](../arangodb/3.12/release-notes/version-3.12/known-issues-in-3-12.md)
  for the current release.
