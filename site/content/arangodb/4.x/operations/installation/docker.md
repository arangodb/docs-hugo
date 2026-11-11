---
title: Install with Docker
menuTitle: Docker
weight: 5
description: >-
  You can use Docker images to run ArangoDB in containers on Linux, macOS, and Windows
---
The recommended way of using ArangoDB is via ArangoDB container images with,
for instance, [Docker Desktop](https://www.docker.com/products/docker-desktop/)
or [Podman](https://podman.io/). The commands below use the `docker` CLI, but
you can substitute `podman` for `docker`.

ArangoDB provides the following images:
- `arangodb/core`: The ArangoDB server (_arangod_) and the
  [ArangoDB Starter](../../components/tools/arangodb-starter/_index.md).
- `arangodb/client-tools`: The [client tools](../../components/tools/_index.md)
  like the ArangoDB Shell (_arangosh_), _arangodump_, and _arangorestore_.

The server image doesn't contain the client tools. To use them with a server
that runs in a container, run them in a separate container of the
`arangodb/client-tools` image.

Check also the following resources:
- [Manually starting a stand-alone instance via Docker](../../deploy/single-instance/manual-start.md#manual-start-in-docker)
- [Manually starting a Cluster via Docker](../../deploy/cluster/deployment/manual-start.md#manual-start-in-docker)

## Start an ArangoDB instance

In order to start an ArangoDB instance, run:

```
docker run -e ARANGO_RANDOM_ROOT_PASSWORD=1 -d --name arangodb-instance arangodb/core:4.0.0
```

{{< tip >}}
Docker chooses the processor architecture for the image that matches your host
CPU by default. If this is not the case, for example, because you have the
`DOCKER_DEFAULT_PLATFORM` environment variable set to a different architecture,
you can pass the `--platform` flag to the `docker run` command to specify the
appropriate operating system and architecture for the container. For x86-64,
use `linux/amd64`. On ARM, especially Apple silicon with no emulation for the
required AVX instruction set extension, use `linux/arm64/v8`:

```
docker run --platform linux/arm64/v8 -p 8529:8529 -e ARANGO_RANDOM_ROOT_PASSWORD=1 --name arangodb-instance arangodb/core:4.0.0
```
{{< /tip >}}

This creates and launches the ArangoDB Docker instance as a background process.
The identifier of the process is printed. By default, ArangoDB listens on port
`8529` for requests and the image includes `EXPOSE 8529`.

## Initialize the server language

When using Docker, you need to specify the language you want to initialize the
server to on the first run in one of the following ways:

- Set the environment variable `LANG` to a locale in the `docker run` command,
  e.g. `-e LANG=sv` for a Swedish locale.

- Use an `arangod.conf` configuration file that sets a language and mount it
  into the container. For example, create a configuration file on your
  host system in which you set `icu-language = sv` at the top (before any
  `[section]`) and then mount the file over the default configuration file like
  `docker run -v /your-host-path/arangod.conf:/etc/arangodb4/arangod.conf ...`.

Note that you cannot set the language using only a startup option on the
command-line, like `docker run ... arangodb/core:4.0.0 --icu-language sv`.

If you don't specify a language explicitly, the default is `en_US` up to
ArangoDB v3.11 and `en_US_POSIX` from ArangoDB v3.12 onward.

## Using the instance

To access the instance from other containers, like an application or the
client tools, create a network and attach the containers to it. The containers
can then reach the instance by its name. To also access the instance from the
host machine, publish its port with `-p` in addition:

```
docker network create arangodb-net
docker run -e ARANGO_RANDOM_ROOT_PASSWORD=1 -d --name arangodb-instance --network arangodb-net -p 8529:8529 arangodb/core:4.0.0
docker run -it --rm --network arangodb-net arangodb/client-tools:4.0.0 \
  arangosh --server.endpoint http://arangodb-instance:8529
```

## Exposing the port to the outside world

If you want to expose the port to the outside world, run:

```
docker run -e ARANGO_RANDOM_ROOT_PASSWORD=1 -p 8529:8529 -d arangodb/core:4.0.0
```

ArangoDB listens on port `8529` for requests and the image includes `EXPOSE 8529`.
The `-p 8529:8529` publishes this port on the host so that you can access the
server from the host machine and, depending on your firewall, from other
machines. Client tools in a container can also connect to a published port via
the address of the host machine, for example, to a remote Coordinator. For
containers on the same host machine, use a shared network as described in
[Using the instance](#using-the-instance).

## Choosing an authentication method

The ArangoDB server image provides several authentication methods which can be
specified via environment variables (-e) when using `docker run`.

1. `ARANGO_RANDOM_ROOT_PASSWORD=1`

   Generates a random root password when starting. The password is printed to
   `stdout` (and may be inspected later using `docker logs`).

2. `ARANGO_NO_AUTH=1`
    
   Disables authentication. Useful for testing.

   {{< warning >}}
   Disabling authentication in production environments exposes all your data.
   Make sure that ArangoDB is not directly accessible from the internet.
   {{< /warning >}}

3. `ARANGO_ROOT_PASSWORD=somepassword`

   Specify your own root password.

4. `ARANGO_ROOT_PASSWORD_FILE=/path/to/file`

   Read the root password from a file in the container, for example, a mounted
   secret, so that the password doesn't appear in the container configuration.

{{< tip >}}
These authentication methods only apply to single server installations. For
clusters you have to provision the users via the root user with an empty
password once the system is up and running.
{{< /tip >}}

## Command line options

You can pass arguments to the ArangoDB server by appending them at the end of
the Docker command.

```
docker run -e ARANGO_RANDOM_ROOT_PASSWORD=1 arangodb/core:4.0.0 --help
```

The entry point script starts the _arangod_ binary by default and forwards
your arguments.

To use the ArangoDB Shell (_arangosh_) or other client tools, run them in a
container of the `arangodb/client-tools` image. It starts _arangosh_ by default
and runs as a non-root user. Attach it to the network of the server container
as described in [Using the instance](#using-the-instance):

```
docker run -it --rm --network arangodb-net arangodb/client-tools:4.0.0 \
  arangosh --server.endpoint http://arangodb-instance:8529 --server.database myDB
```

Note that `localhost` inside a container refers to the container itself, so the
client tools cannot reach a server container via a port that is only published
on `localhost` of the host machine. Use a shared network instead.

For more information, see the [Configuration](../administration/configuration.md) section.

## Limiting resource utilization

_arangod_ checks the following environment variables, which can be used to
restrict how much memory and how many CPU cores it should use.

- `ARANGODB_OVERRIDE_DETECTED_TOTAL_MEMORY`

  This variable can be used to override the automatic detection of the total
  amount of RAM present in the system. You can specify a decimal number
  (in bytes). Furthermore, if `G` or `g` is appended, the value is multiplied
  by `2^30`. If `M` or `m` is appended, the value is multiplied by `2^20`.
  If `K` or `k` is appended, the value is multiplied by `2^10`. That is, `64G`
  meaning 64 gigabytes.

  The total amount of RAM detected is logged as an INFO message at server start.
  If the variable is set, the overridden value is shown. Various default sizes
  are calculated based on this value (i.e. RocksDB buffer cache size).

  Setting this option can be useful in two cases:

  - If _arangod_ is running in a container and its cgroup has a RAM limitation,
    then you should specify this limitation in this environment variable, since
    it is currently not automatically detected.

  - If _arangod_ is running alongside other services on the same machine and
    thus sharing the RAM with them, you should limit the amount of memory using
    this environment variable.

- `ARANGODB_OVERRIDE_DETECTED_NUMBER_OF_CORES`

  This variable can be used to override the automatic detection of the number
  of CPU cores present on the system.

  The number of CPU cores detected is logged as an INFO message at server start.
  If the variable is set, the overridden value is shown. Various default values
  for threading are calculated based on this value.

  Setting this option is useful if _arangod_ is running in a container or alongside
  other services on the same machine and shall not use all available CPUs.

## Using host directories

You can map the database directory of the container to a directory on the host,
so that the data is kept between the runs of the container.

```
mkdir /tmp/arangodb
docker run -e ARANGO_RANDOM_ROOT_PASSWORD=1 -p 8529:8529 -d \
    -v /tmp/arangodb:/var/lib/arangodb4 \
    arangodb/core:4.0.0
```

This uses the `/tmp/arangodb` directory of the host as database directory for
ArangoDB inside the container.

## Using a named volume

Alternatively, you can create a named volume and use it as the database
directory of your ArangoDB container:

```
docker volume create arangodb-data
docker run -e ARANGO_RANDOM_ROOT_PASSWORD=1 -p 8529:8529 -d \
    -v arangodb-data:/var/lib/arangodb4 \
    arangodb/core:4.0.0
```

## Usage as a base image

If you use the server image as a base image, make sure to write any `CMD`
instructions in the [*exec* form](https://docs.docker.com/engine/reference/builder/#cmd).
Otherwise, the default entry point will not do its bootstrapping work.

When deriving the image, you can control the instantiation via putting files
into `/docker-entrypoint-initdb.d/`. Files with the extension `*.sh` are run as
shell scripts when the database directory is initialized.

The server image doesn't contain _arangosh_ and _arangorestore_. Unlike in
previous versions, you therefore cannot place `*.js` files for _arangosh_ or a
`dumps/` directory with database dumps in `/docker-entrypoint-initdb.d/`. The
initialization fails if any are present. To run JavaScript code or to restore
[dumps](../../components/tools/arangodump/_index.md) after the server has
started, use the `arangodb/client-tools` image.
