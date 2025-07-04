---
title: Using the ArangoDB Starter
menuTitle: Using the ArangoDB Starter
weight: 10
description: >-
  How to start an ArangoDB stand-alone instance using the ArangoDB Starter
---
The [_Starter_](../../components/tools/arangodb-starter/_index.md) tool
(the _arangodb_ executable) supports starting a single server.

As a precondition you should create a _secret_ to activate authentication.
The _Starter_ provides a handy functionality to generate such a file:

```bash
arangodb create jwt-secret --secret=arangodb.secret
```

Set appropriate privilege on the generated _secret_ file, e.g. on Linux:

```bash
chmod 400 arangodb.secret
```

## Local Start

If you want to start a stand-alone instance of ArangoDB (single server), use the
`--starter.mode=single` option of the _Starter_: 

```bash
arangodb --starter.mode=single --auth.jwt-secret=/etc/arangodb.secret
```

Please adapt the path to your _secret_ file accordingly.

## Using the ArangoDB Starter in Docker

The _Starter_ can also be used to launch a stand-alone instance based on _Docker_
containers:

```bash
export IP=<IP of docker host>
docker volume create arangodb
docker run -it --name=adb --rm -p 8528:8528 \
    -v arangodb:/data \
    -v /var/run/docker.sock:/var/run/docker.sock \
    arangodb/arangodb-starter \
    --starter.address=$IP \
    --starter.mode=single \
    --docker.net-mode=default
```

If you have a license for the Enterprise Edition, set the license key
in an environment variable by adding this option to the above `docker` command
(replace `<the-key>` with the actual license key):

```
    -e ARANGO_LICENSE_KEY=<the-key>
```

The Starter hands the license key to the Docker containers it launches for ArangoDB.

### TLS-verified Docker services

Oftentimes, one needs to harden Docker services using client certificate 
and TLS verification. The Docker API allows subsequently only certified access.
As the ArangoDB starter starts the ArangoDB cluster instances using this Docker API, 
it is mandatory that the ArangoDB starter is deployed with the proper certificates
handed to it, so that the above command is modified as follows:

```bash
export IP=<IP of docker host>
export DOCKER_TLS_VERIFY=1
export DOCKER_CERT_PATH=/path/to/certificate
docker volume create arangodb
docker run -it --name=adb --rm -p 8528:8528 \
    -v arangodb:/data \
    -v /var/run/docker.sock:/var/run/docker.sock \
    -v /path/to/certificate:/path/to/certificate
    arangodb/arangodb-starter \
    --starter.address=$IP \
    --starter.mode=single \
    --docker.net-mode=default
```

Note that the environment variables `DOCKER_TLS_VERIFY` and `DOCKER_CERT_PATH` 
as well as the additional mountpoint containing the certificate have been added above. 
directory. The assignment of `DOCKER_CERT_PATH` is optional, in which case it 
is mandatory that the certificates are stored in `$HOME/.docker`. So
the command would then be as follows

```bash
export IP=<IP of docker host>
docker volume create arangodb
docker run -it --name=adb --rm -p 8528:8528 \
    -v arangodb:/data \
    -v /var/run/docker.sock:/var/run/docker.sock \
    -v /path/to/cert:/root/.docker \
    -e DOCKER_TLS_VERIFY=1 \
    arangodb/arangodb-starter \
    --starter.address=$IP \
    --starter.mode=single \
    --docker.net-mode=default
```
