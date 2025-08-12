---
title: HTTP interface for edges
menuTitle: Edges
weight: 10
description: >-
  The Edge API lets you retrieve the connected edges of a single node,
  optionally restricted to incoming or outgoing edges
# Undocumented on purpose:
#   POST /_api/edges/{coll}  (internal)
---
You can use the general [Document API](../documents.md) to create,
read, modify, and delete edge documents. The only difference to working with
node documents is that the `_from` and `_to` attributes are mandatory and
must contain document identifiers.

The Edge API is useful if you want to look up the inbound and outbound edges of
a node with low overhead. You can also retrieve edges with AQL queries, but
queries need to be parsed and planned, and thus have an overhead. On the other
hand, AQL is far more powerful, letting you perform graph traversals, for
instance.

## Addresses of edges

Edges are a special variation of documents and you can access them like any
document. See [Addresses of documents](../documents.md#addresses-of-documents)
for details.

## Get inbound and outbound edges

```openapi
paths:
  /_db/{database-name}/_api/edges/{collection}:
    get:
      operationId: getVertexEdges
      description: |
        Returns an array of edges starting or ending in the node identified by
        `vertex`.
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of the database.
          schema:
            type: string
        - name: collection
          in: path
          required: true
          description: |
            The name of the collection.
          schema:
            type: string
        - name: vertex
          in: query
          required: true
          description: |
            The document identifier of the start node.
          schema:
            type: string
        - name: direction
          in: query
          required: false
          description: |
            Selects `in` or `out` direction for edges. If not set, any edges are
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

**Examples**

```curl
---
description: |-
  Any direction
name: RestEdgesReadEdgesAny
---
var db = require("@arangodb").db;
db._create("nodes");
db._createEdgeCollection("edges");

db.nodes.save({_key: "1"});
db.nodes.save({_key: "2"});
db.nodes.save({_key: "3"});
db.nodes.save({_key: "4"});

db.edges.save({_from: "nodes/1", _to: "nodes/3", _key: "5", "$label": "v1 -> v3"});
db.edges.save({_from: "nodes/2", _to: "nodes/1", _key: "6", "$label": "v2 -> v1"});
db.edges.save({_from: "nodes/4", _to: "nodes/1", _key: "7", "$label": "v4 -> v1"});

var url = "/_api/edges/edges?vertex=nodes/1";
var response = logCurlRequest('GET', url);

assert(response.code === 200);

logJsonResponse(response);
db._drop("edges");
db._drop("nodes");
```

```curl
---
description: |-
  In edges
name: RestEdgesReadEdgesIn
---
var db = require("@arangodb").db;
db._create("nodes");
db._createEdgeCollection("edges");

db.nodes.save({_key: "1"});
db.nodes.save({_key: "2"});
db.nodes.save({_key: "3"});
db.nodes.save({_key: "4"});

db.edges.save({_from: "nodes/1", _to: "nodes/3", _key: "5", "$label": "v1 -> v3"});
db.edges.save({_from: "nodes/2", _to: "nodes/1", _key: "6", "$label": "v2 -> v1"});
db.edges.save({_from: "nodes/4", _to: "nodes/1", _key: "7", "$label": "v4 -> v1"});

var url = "/_api/edges/edges?vertex=nodes/1&direction=in";
var response = logCurlRequest('GET', url);

assert(response.code === 200);

logJsonResponse(response);
db._drop("edges");
db._drop("nodes");
```

```curl
---
description: |-
  Out edges
name: RestEdgesReadEdgesOut
---
var db = require("@arangodb").db;
db._create("nodes");
db._createEdgeCollection("edges");

db.nodes.save({_key: "1"});
db.nodes.save({_key: "2"});
db.nodes.save({_key: "3"});
db.nodes.save({_key: "4"});

db.edges.save({_from: "nodes/1", _to: "nodes/3", _key: "5", "$label": "v1 -> v3"});
db.edges.save({_from: "nodes/2", _to: "nodes/1", _key: "6", "$label": "v2 -> v1"});
db.edges.save({_from: "nodes/4", _to: "nodes/1", _key: "7", "$label": "v4 -> v1"});

var url = "/_api/edges/edges?vertex=nodes/1&direction=out";
var response = logCurlRequest('GET', url);

assert(response.code === 200);

logJsonResponse(response);
db._drop("edges");
db._drop("nodes");
```
