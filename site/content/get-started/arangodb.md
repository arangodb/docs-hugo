---
title: Get started with ArangoDB
menuTitle: ArangoDB
weight: 10
description: >-
  Run the open-source ArangoDB database in a Docker container, store your first
  documents, and query them with AQL
---
Run a single-node ArangoDB instance on your machine, store a few documents, and
query them. Takes about two minutes, most of it pulling the container image.

## Prerequisites

- **Docker**: [Docker Desktop](https://www.docker.com/products/docker-desktop/)
  or Docker Engine installed and running.
- **Resources**: 2 GB of available memory.
- **Ports**: Port `8529` free on `localhost`.

{{< steps >}}

{{< step "Start the container" >}}
```bash
docker run -d --name arangodb \
  -p 8529:8529 \
  -e ARANGO_ROOT_PASSWORD=openSesame \
  -e LANG=en_US.UTF-8 \
  arangodb:3.12
```

The `LANG` variable sets the language the server is initialized to. It only
takes effect on the first run, when the database directory is created, and
cannot be changed afterwards without re-initializing.

`openSesame` is a placeholder. Pick your own password - it is set once, on the
first run, and this instance is only meant for local evaluation.

On Apple silicon and other ARM machines, add `--platform linux/arm64/v8` to the
command. See [Install with Docker](../arangodb/3.12/operations/installation/docker.md)
for the full set of container options.
{{< /step >}}

{{< step "Confirm it is running" >}}
```bash
curl http://localhost:8529/_api/version
```

You should see a response like the following:

```json
{"server":"arango","license":"community","version":"3.12.4"}
```

If the request is refused, the server may still be starting up. Check the logs
with `docker logs arangodb`.
{{< /step >}}

{{< step "Open the web interface" >}}
Go to <http://localhost:8529> and log in as `root` with the password you set.

The web interface gives you a query editor, a collection browser, and a graph
viewer.
{{< /step >}}

{{< step "Store and query some data" >}}
Open the ArangoDB shell inside the running container:

```bash
docker exec -it arangodb arangosh --server.password openSesame
```

Create a collection and insert three documents:

```js
db._create("people");

db.people.save({ _key: "einstein", name: "Albert Einstein", field: "Physics", nobel: 1921 });
db.people.save({ _key: "bohr", name: "Niels Bohr", field: "Physics", nobel: 1922 });
db.people.save({ _key: "heisenberg", name: "Werner Heisenberg", field: "Physics", nobel: 1932 });
```

Query them with AQL:

```js
db._query(`
  FOR p IN people
    FILTER p.nobel < 1930
    SORT p.nobel
    RETURN p.name
`).toArray();
```

You should see this:

```
[
  "Albert Einstein",
  "Niels Bohr"
]
```

Type `exit` to leave the shell.
{{< /step >}}

{{< /steps >}}

{{< tip >}}
**You now have** a running ArangoDB instance with a collection you can query.
The same AQL runs unchanged from every [driver](../ecosystem/drivers/_index.md)
and against the [HTTP API](../arangodb/3.12/develop/http-api/_index.md).
{{< /tip >}}

## Keep your data between restarts

The container above stores its data inside the container. Removing the container
removes the data. To keep it, mount a volume:

```bash
docker run -d --name arangodb \
  -p 8529:8529 \
  -e ARANGO_ROOT_PASSWORD=openSesame \
  -e LANG=en_US.UTF-8 \
  -v arangodb-data:/var/lib/arangodb3 \
  -v arangodb-apps:/var/lib/arangodb3-apps \
  arangodb:3.12
```

## Clean up

```bash
docker stop arangodb
docker rm arangodb
```

## Next steps

- [Troubleshooting the ArangoDB installation](arangodb-troubleshooting.md) if
  something did not work.
- [Start using AQL](../arangodb/3.12/get-started/start-using-aql/_index.md) for a
  longer tutorial covering CRUD, filtering, joins, and graph traversals.
- [Graphs](../arangodb/3.12/graphs/_index.md) to connect your documents with
  edges and traverse them.
- [Deploy](../arangodb/3.12/deploy/_index.md) when you are ready to run
  something other than a single container.
