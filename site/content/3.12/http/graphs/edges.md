---
title: HTTP interface for edges
menuTitle: Edges
weight: 10
description: >-
  The Edge API lets you retrieve the connected edges of a single vertex,
  optionally restricted to incoming or outgoing edges
archetype: default
---
You can use the general [Document API](../documents.md) to create,
read, modify, and delete edge documents. The only difference to working with
vertex documents is that the `_from` and `_to` attributes are mandatory and
must contain document identifiers.

The Edge API is useful if you want to look up the inbound and outbound edges of
a vertex with low overhead. You can also retrieve edges with AQL queries, but
queries need to be parsed and planned, and thus have an overhead. On the other
hand, AQL is far more powerful, letting you perform graph traversals, for
instance.

## Addresses of edges

Edges are a special variation of documents and you can access them like any
document. See [Addresses of documents](../documents.md#addresses-of-documents)
for details.

```openapi
## Read in- or outbound edges

paths:
  /_api/edges/{collection-id}:
    get:
      operationId: getVertexEdges
      description: |
        Returns an array of edges starting or ending in the vertex identified by
        *vertex*.
      parameters:
        - name: collection-id
          in: path
          required: true
          description: |
            The id of the collection.
          schema:
            type: string
        - name: vertex
          in: query
          required: true
          description: |
            The id of the start vertex.
          schema:
            type: string
        - name: direction
          in: query
          required: false
          description: |
            Selects *in* or *out* direction for edges. If not set, any edges are
            returned.
          schema:
            type: string
        - name: x-arango-allow-dirty-read
          in: header
          required: false
          description: |
            Set this header to `true` to allow the Coordinator to ask any shard replica for
            the data, not only the shard leader. This may result in "dirty reads".
          schema:
            type: boolean
      responses:
        '200':
          description: |
            is returned if the edge collection was found and edges were retrieved.
        '400':
          description: |
            is returned if the request contains invalid parameters.
        '404':
          description: |
            is returned if the edge collection was not found.
      tags:
        - Graphs
```


```curl
---
description: |-
  Any direction
version: '3.12'
render: input/output
name: RestEdgesReadEdgesAny
server_name: stable
type: single
---

    var db = require("@arangodb").db;
    db._create("vertices");
    db._createEdgeCollection("edges");

    db.vertices.save({_key: "1"});
    db.vertices.save({_key: "2"});
    db.vertices.save({_key: "3"});
    db.vertices.save({_key: "4"});

    db.edges.save({_from: "vertices/1", _to: "vertices/3", _key: "5", "$label": "v1 -> v3"});
    db.edges.save({_from: "vertices/2", _to: "vertices/1", _key: "6", "$label": "v2 -> v1"});
    db.edges.save({_from: "vertices/4", _to: "vertices/1", _key: "7", "$label": "v4 -> v1"});

    var url = "/_api/edges/edges?vertex=vertices/1";
    var response = logCurlRequest('GET', url);

    assert(response.code === 200);

    logJsonResponse(response);
    db._drop("edges");
    db._drop("vertices");
```


```curl
---
description: |-
  In edges
render: input/output
name: RestEdgesReadEdgesIn
server_name: stable
type: single
---

    var db = require("@arangodb").db;
    db._create("vertices");
    db._createEdgeCollection("edges");

    db.vertices.save({_key: "1"});
    db.vertices.save({_key: "2"});
    db.vertices.save({_key: "3"});
    db.vertices.save({_key: "4"});

    db.edges.save({_from: "vertices/1", _to: "vertices/3", _key: "5", "$label": "v1 -> v3"});
    db.edges.save({_from: "vertices/2", _to: "vertices/1", _key: "6", "$label": "v2 -> v1"});
    db.edges.save({_from: "vertices/4", _to: "vertices/1", _key: "7", "$label": "v4 -> v1"});

    var url = "/_api/edges/edges?vertex=vertices/1&direction=in";
    var response = logCurlRequest('GET', url);

    assert(response.code === 200);

    logJsonResponse(response);
    db._drop("edges");
    db._drop("vertices");
```


```curl
---
description: |-
  Out edges
render: input/output
name: RestEdgesReadEdgesOut
server_name: stable
type: single
---

    var db = require("@arangodb").db;
    db._create("vertices");
    db._createEdgeCollection("edges");

    db.vertices.save({_key: "1"});
    db.vertices.save({_key: "2"});
    db.vertices.save({_key: "3"});
    db.vertices.save({_key: "4"});

    db.edges.save({_from: "vertices/1", _to: "vertices/3", _key: "5", "$label": "v1 -> v3"});
    db.edges.save({_from: "vertices/2", _to: "vertices/1", _key: "6", "$label": "v2 -> v1"});
    db.edges.save({_from: "vertices/4", _to: "vertices/1", _key: "7", "$label": "v4 -> v1"});

    var url = "/_api/edges/edges?vertex=vertices/1&direction=out";
    var response = logCurlRequest('GET', url);

    assert(response.code === 200);

    logJsonResponse(response);
    db._drop("edges");
    db._drop("vertices");
```
