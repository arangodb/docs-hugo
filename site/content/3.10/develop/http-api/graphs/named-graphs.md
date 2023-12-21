---
title: HTTP interface for named graphs
menuTitle: Named graphs
weight: 5
description: >-
  The HTTP API for named graphs lets you manage General Graphs, SmartGraphs,
  EnterpriseGraphs, and SatelliteGraphs
archetype: default
---
The HTTP API for [named graphs](../../../graphs/_index.md#named-graphs) is called _Gharial_.

You can manage all types of ArangoDB's named graphs with Gharial:
- [General Graphs](../../../graphs/general-graphs/_index.md)
- [SmartGraphs](../../../graphs/smartgraphs/_index.md)
- [EnterpriseGraphs](../../../graphs/enterprisegraphs/_index.md)
- [SatelliteGraphs](../../../graphs/satellitegraphs/_index.md)

The examples use the following example graphs:

[_Social Graph_](../../../graphs/example-graphs.md#social-graph):

![Social Example Graph](../../../../images/social_graph.png)

[_Knows Graph_](../../../graphs/example-graphs.md#knows-graph):

![Social Example Graph](../../../../images/knows_graph.png)

## Management

### List all graphs

```openapi
paths:
  /_api/gharial:
    get:
      operationId: listGraphs
      description: |
        Lists all graphs stored in this database.
      responses:
        '200':
          description: |
            Is returned if the module is available and the graphs can be listed.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - graphs
                properties:
                  error:
                    description: |
                      A flag indicating that no error occurred.
                    type: boolean
                    example: false
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 200
                  graphs:
                    description: |
                      A list of all named graphs.
                    type: array
                    items:
                      type: object
                      properties:
                        graph:
                          description: |
                            The properties of the named graph.
                          type: object
                          required:
                            - name
                            - edgeDefinitions
                            - orphanCollections
                            - numberOfShards
                            - _id
                            - _rev
                            - replicationFactor
                            - isSmart
                            - isDisjoint
                            - isSatellite
                          properties:
                            name:
                              description: |
                                The name of the graph.
                              type: string
                            edgeDefinitions:
                              description: |
                                An array of definitions for the relations of the graph.
                                Each has the following type:
                              type: array
                              items:
                                type: object
                                required:
                                  - collection
                                  - from
                                  - to
                                properties:
                                  collection:
                                    description: |
                                      Name of the edge collection, where the edges are stored in.
                                    type: string
                                  from:
                                    description: |
                                      List of vertex collection names.
                                      Edges in collection can only be inserted if their _from is in any of the collections here.
                                    type: array
                                    items:
                                      type: string
                                  to:
                                    description: |
                                      List of vertex collection names.

                                      Edges in collection can only be inserted if their _to is in any of the collections here.
                                    type: array
                                    items:
                                      type: string
                            orphanCollections:
                              description: |
                                An array of additional vertex collections.
                                Documents in these collections do not have edges within this graph.
                              type: array
                              items:
                                type: string
                            numberOfShards:
                              description: |
                                Number of shards created for every new collection in the graph.
                              type: integer
                            _id:
                              description: |
                                The internal id value of this graph.
                              type: string
                            _rev:
                              description: |
                                The revision of this graph. Can be used to make sure to not override
                                concurrent modifications to this graph.
                              type: string
                            replicationFactor:
                              description: |
                                The replication factor used for every new collection in the graph.
                                For SatelliteGraphs, it is the string `"satellite"` (Enterprise Edition only).
                              type: integer
                            writeConcern:
                              description: |
                                The default write concern for new collections in the graph.
                                It determines how many copies of each shard are required to be
                                in sync on the different DB-Servers. If there are less than these many copies
                                in the cluster, a shard refuses to write. Writes to shards with enough
                                up-to-date copies succeed at the same time, however. The value of
                                `writeConcern` cannot be greater than `replicationFactor`.
                                For SatelliteGraphs, the `writeConcern` is automatically controlled to equal the
                                number of DB-Servers and the attribute is not available. _(cluster only)_
                              type: integer
                            isSmart:
                              description: |
                                Whether the graph is a SmartGraph (Enterprise Edition only).
                              type: boolean
                            isDisjoint:
                              description: |
                                Whether the graph is a Disjoint SmartGraph (Enterprise Edition only).
                              type: boolean
                            smartGraphAttribute:
                              description: |
                                Name of the sharding attribute in the SmartGraph case (Enterprise Edition only).
                              type: string
                            isSatellite:
                              description: |
                                Flag if the graph is a SatelliteGraph (Enterprise Edition only) or not.
                              type: boolean
      tags:
        - Graphs
```

**Examples**

```curl
---
description: ''
name: HttpGharialList
---
var examples = require("@arangodb/graph-examples/example-graph.js");
examples.dropGraph("social");
examples.loadGraph("social");
examples.loadGraph("routeplanner");
var url = "/_api/gharial";
var response = logCurlRequest('GET', url);

assert(response.code === 200);

logJsonResponse(response);
examples.dropGraph("social");
examples.dropGraph("routeplanner");
```

### Create a graph

```openapi
paths:
  /_api/gharial:
    post:
      operationId: createGraph
      description: |
        The creation of a graph requires the name of the graph and a
        definition of its edges.
      parameters:
        - name: waitForSync
          in: query
          required: false
          description: |
            Define if the request should wait until everything is synced to disk.
            Changes the success HTTP response status code.
          schema:
            type: boolean
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required:
                - name
              properties:
                name:
                  description: |
                    Name of the graph.
                  type: string
                edgeDefinitions:
                  description: |
                    An array of definitions for the relations of the graph.
                    Each has the following type:
                  type: array
                  items:
                    type: object
                    required:
                      - collection
                      - from
                      - to
                    properties:
                      collection:
                        description: |
                          Name of the edge collection, where the edges are stored in.
                        type: string
                      from:
                        description: |
                          List of vertex collection names.
                          Edges in collection can only be inserted if their _from is in any of the collections here.
                        type: array
                        items:
                          type: string
                      to:
                        description: |
                          List of vertex collection names.

                          Edges in collection can only be inserted if their _to is in any of the collections here.
                        type: array
                        items:
                          type: string
                orphanCollections:
                  description: |
                    An array of additional vertex collections.
                    Documents in these collections do not have edges within this graph.
                  type: array
                  items:
                    type: string
                isSmart:
                  description: |
                    Define if the created graph should be smart (Enterprise Edition only).
                  type: boolean
                isDisjoint:
                  description: |
                    Whether to create a Disjoint SmartGraph instead of a regular SmartGraph
                    (Enterprise Edition only).
                  type: boolean
                options:
                  description: |
                    a JSON object to define options for creating collections within this graph.
                    It can contain the following attributes:
                  type: object
                  properties:
                    smartGraphAttribute:
                      description: |
                        Only has effect in Enterprise Edition and it is required if isSmart is true.
                        The attribute name that is used to smartly shard the vertices of a graph.
                        Every vertex in this SmartGraph has to have this attribute.
                        Cannot be modified later.
                      type: string
                    satellites:
                      description: |
                        An array of collection names that is used to create SatelliteCollections
                        for a (Disjoint) SmartGraph using SatelliteCollections (Enterprise Edition only).
                        Each array element must be a string and a valid collection name.
                        The collection type cannot be modified later.
                      type: array
                      items:
                        type: string
                    numberOfShards:
                      description: |
                        The number of shards that is used for every collection within this graph.
                        Cannot be modified later.
                      type: integer
                    replicationFactor:
                      description: |
                        The replication factor used when initially creating collections for this graph.
                        Can be set to `"satellite"` to create a SatelliteGraph, which then ignores
                        `numberOfShards`, `minReplicationFactor`, and `writeConcern`
                        (Enterprise Edition only).
                      type: integer
                    writeConcern:
                      description: |
                        Write concern for new collections in the graph.
                        It determines how many copies of each shard are required to be
                        in sync on the different DB-Servers. If there are less than these many copies
                        in the cluster, a shard refuses to write. Writes to shards with enough
                        up-to-date copies succeed at the same time, however. The value of
                        `writeConcern` cannot be greater than `replicationFactor`.
                        For SatelliteGraphs, the `writeConcern` is automatically controlled to equal the
                        number of DB-Servers and the attribute is not available. _(cluster only)_
                      type: integer
                  required:
                    - numberOfShards
                    - replicationFactor
      responses:
        '201':
          description: |
            Is returned if the graph can be created and `waitForSync` is enabled
            for the `_graphs` collection, or given in the request.
            The response body contains the graph configuration that has been stored.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - graph
                properties:
                  error:
                    description: |
                      A flag indicating that no error occurred.
                    type: boolean
                    example: false
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 201
                  graph:
                    description: |
                      The information about the newly created graph.
                    type: object
                    required:
                      - name
                      - edgeDefinitions
                      - orphanCollections
                      - numberOfShards
                      - _id
                      - _rev
                      - replicationFactor
                      - isSmart
                      - isDisjoint
                      - isSatellite
                    properties:
                      name:
                        description: |
                          The name of the graph.
                        type: string
                      edgeDefinitions:
                        description: |
                          An array of definitions for the relations of the graph.
                          Each has the following type:
                        type: array
                        items:
                          type: object
                          required:
                            - collection
                            - from
                            - to
                          properties:
                            collection:
                              description: |
                                Name of the edge collection, where the edges are stored in.
                              type: string
                            from:
                              description: |
                                List of vertex collection names.
                                Edges in collection can only be inserted if their _from is in any of the collections here.
                              type: array
                              items:
                                type: string
                            to:
                              description: |
                                List of vertex collection names.

                                Edges in collection can only be inserted if their _to is in any of the collections here.
                              type: array
                              items:
                                type: string
                      orphanCollections:
                        description: |
                          An array of additional vertex collections.
                          Documents in these collections do not have edges within this graph.
                        type: array
                        items:
                          type: string
                      numberOfShards:
                        description: |
                          Number of shards created for every new collection in the graph.
                        type: integer
                      _id:
                        description: |
                          The internal id value of this graph.
                        type: string
                      _rev:
                        description: |
                          The revision of this graph. Can be used to make sure to not override
                          concurrent modifications to this graph.
                        type: string
                      replicationFactor:
                        description: |
                          The replication factor used for every new collection in the graph.
                          For SatelliteGraphs, it is the string `"satellite"` (Enterprise Edition only).
                        type: integer
                      writeConcern:
                        description: |
                          The default write concern for new collections in the graph.
                          It determines how many copies of each shard are required to be
                          in sync on the different DB-Servers. If there are less than these many copies
                          in the cluster, a shard refuses to write. Writes to shards with enough
                          up-to-date copies succeed at the same time, however. The value of
                          `writeConcern` cannot be greater than `replicationFactor`.
                          For SatelliteGraphs, the `writeConcern` is automatically controlled to equal the
                          number of DB-Servers and the attribute is not available. _(cluster only)_
                        type: integer
                      isSmart:
                        description: |
                          Whether the graph is a SmartGraph (Enterprise Edition only).
                        type: boolean
                      isDisjoint:
                        description: |
                          Whether the graph is a Disjoint SmartGraph (Enterprise Edition only).
                        type: boolean
                      smartGraphAttribute:
                        description: |
                          Name of the sharding attribute in the SmartGraph case (Enterprise Edition only).
                        type: string
                      isSatellite:
                        description: |
                          Flag if the graph is a SatelliteGraph (Enterprise Edition only) or not.
                        type: boolean
        '202':
          description: |
            Is returned if the graph can be created and `waitForSync` is disabled
            for the `_graphs` collection and not given in the request.
            The response body contains the graph configuration that has been stored.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - graph
                properties:
                  error:
                    description: |
                      A flag indicating that no error occurred.
                    type: boolean
                    example: false
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 202
                  graph:
                    description: |
                      The information about the newly created graph.
                    type: object
                    required:
                      - name
                      - edgeDefinitions
                      - orphanCollections
                      - numberOfShards
                      - _id
                      - _rev
                      - replicationFactor
                      - isSmart
                      - isDisjoint
                      - isSatellite
                    properties:
                      name:
                        description: |
                          The name of the graph.
                        type: string
                      edgeDefinitions:
                        description: |
                          An array of definitions for the relations of the graph.
                          Each has the following type:
                        type: array
                        items:
                          type: object
                          required:
                            - collection
                            - from
                            - to
                          properties:
                            collection:
                              description: |
                                Name of the edge collection, where the edges are stored in.
                              type: string
                            from:
                              description: |
                                List of vertex collection names.
                                Edges in collection can only be inserted if their _from is in any of the collections here.
                              type: array
                              items:
                                type: string
                            to:
                              description: |
                                List of vertex collection names.

                                Edges in collection can only be inserted if their _to is in any of the collections here.
                              type: array
                              items:
                                type: string
                      orphanCollections:
                        description: |
                          An array of additional vertex collections.
                          Documents in these collections do not have edges within this graph.
                        type: array
                        items:
                          type: string
                      numberOfShards:
                        description: |
                          Number of shards created for every new collection in the graph.
                        type: integer
                      _id:
                        description: |
                          The internal id value of this graph.
                        type: string
                      _rev:
                        description: |
                          The revision of this graph. Can be used to make sure to not override
                          concurrent modifications to this graph.
                        type: string
                      replicationFactor:
                        description: |
                          The replication factor used for every new collection in the graph.
                          For SatelliteGraphs, it is the string `"satellite"` (Enterprise Edition only).
                        type: integer
                      writeConcern:
                        description: |
                          The default write concern for new collections in the graph.
                          It determines how many copies of each shard are required to be
                          in sync on the different DB-Servers. If there are less than these many copies
                          in the cluster, a shard refuses to write. Writes to shards with enough
                          up-to-date copies succeed at the same time, however. The value of
                          `writeConcern` cannot be greater than `replicationFactor`.
                          For SatelliteGraphs, the `writeConcern` is automatically controlled to equal the
                          number of DB-Servers and the attribute is not available. _(cluster only)_
                        type: integer
                      isSmart:
                        description: |
                          Whether the graph is a SmartGraph (Enterprise Edition only).
                        type: boolean
                      isDisjoint:
                        description: |
                          Whether the graph is a Disjoint SmartGraph (Enterprise Edition only).
                        type: boolean
                      smartGraphAttribute:
                        description: |
                          Name of the sharding attribute in the SmartGraph case (Enterprise Edition only).
                        type: string
                      isSatellite:
                        description: |
                          Flag if the graph is a SatelliteGraph (Enterprise Edition only) or not.
                        type: boolean
        '400':
          description: |
            Returned if the request is in a wrong format.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 400
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '403':
          description: |
            Returned if your user has insufficient rights.
            In order to create a graph, you need to have at least the following privileges:
            - `Administrate` access on the database.
            - `Read Only` access on every collection used within this graph.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 403
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '409':
          description: |
            Returned if there is a conflict storing the graph. This can occur
            either if a graph with this name already exists, or if there is an
            edge definition with the same edge collection but different `from`
            and `to` vertex collections in any other graph.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 409
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
      tags:
        - Graphs
```

**Examples**

```curl
---
description: |-
  Create a General Graph. This graph type does not make use of any sharding
  strategy and is useful on the single server.
name: HttpGharialCreate
---
var graph = require("@arangodb/general-graph");
if (graph._exists("myGraph")) {
  graph._drop("myGraph", true);
}
var url = "/_api/gharial";
body = {
  name: "myGraph",
  edgeDefinitions: [{
    collection: "edges",
    from: [ "startVertices" ],
    to: [ "endVertices" ]
  }]
};

var response = logCurlRequest('POST', url, body);

assert(response.code === 202);

logJsonResponse(response);

graph._drop("myGraph", true);
```

```curl
---
description: |-
  Create a SmartGraph. This graph uses 9 shards and
  is sharded by the "region" attribute.
  Available in the Enterprise Edition only.
name: HttpGharialCreateSmart
---
var graph = require("@arangodb/general-graph");
if (graph._exists("smartGraph")) {
  graph._drop("smartGraph", true);
}
var url = "/_api/gharial";
body = {
  name: "smartGraph",
  edgeDefinitions: [{
    collection: "edges",
    from: [ "startVertices" ],
    to: [ "endVertices" ]
  }],
  orphanCollections: [ "orphanVertices" ],
  isSmart: true,
  options: {
    replicationFactor: 2,
    numberOfShards: 9,
    smartGraphAttribute: "region"
  }
};

var response = logCurlRequest('POST', url, body);

assert(response.code === 202);

logJsonResponse(response);

graph._drop("smartGraph", true);
```

```curl
---
description: |-
  Create a disjoint SmartGraph. This graph uses 9 shards and
  is sharded by the "region" attribute.
  Available in the Enterprise Edition only.
  Note that as you are using a disjoint version, you can only
  create edges between vertices sharing the same region.
name: HttpGharialCreateDisjointSmart
---
var graph = require("@arangodb/general-graph");
 if (graph._exists("disjointSmartGraph")) {
    graph._drop("disjointSmartGraph", true);
}
var url = "/_api/gharial";
body = {
name: "disjointSmartGraph",
edgeDefinitions: [{
collection: "edges",
from: [ "startVertices" ],
to: [ "endVertices" ]
}],
orphanCollections: [ "orphanVertices" ],
isSmart: true,
options: {
isDisjoint: true,
replicationFactor: 2,
numberOfShards: 9,
smartGraphAttribute: "region"
}
};

var response = logCurlRequest('POST', url, body);

assert(response.code === 202);

logJsonResponse(response);

graph._drop("disjointSmartGraph", true);
```

```curl
---
description: |-
  Create a SmartGraph with a satellite vertex collection.
  It uses the collection "endVertices" as a satellite collection.
  This collection is cloned to all servers, all other vertex
  collections are split into 9 shards
  and are sharded by the "region" attribute.
  Available in the Enterprise Edition only.
name: HttpGharialCreateSmartWithSatellites
---
var graph = require("@arangodb/general-graph");
 if (graph._exists("smartGraph")) {
    graph._drop("smartGraph", true);
}
var url = "/_api/gharial";
body = {
name: "smartGraph",
edgeDefinitions: [{
collection: "edges",
from: [ "startVertices" ],
to: [ "endVertices" ]
}],
orphanCollections: [ "orphanVertices" ],
isSmart: true,
options: {
replicationFactor: 2,
numberOfShards: 9,
smartGraphAttribute: "region",
satellites: [ "endVertices" ]
}
};

var response = logCurlRequest('POST', url, body);

assert(response.code === 202);

logJsonResponse(response);

graph._drop("smartGraph", true);
```

```curl
---
description: |-
  Create an EnterpriseGraph. This graph uses 9 shards,
  it does not make use of specific sharding attributes.
  Available in the Enterprise Edition only.
name: HttpGharialCreateEnterprise
---
var graph = require("@arangodb/general-graph");
 if (graph._exists("enterpriseGraph")) {
    graph._drop("enterpriseGraph", true);
}
var url = "/_api/gharial";
body = {
name: "enterpriseGraph",
edgeDefinitions: [{
collection: "edges",
from: [ "startVertices" ],
to: [ "endVertices" ]
}],
orphanCollections: [ ],
isSmart: true,
options: {
replicationFactor: 2,
numberOfShards: 9,
}
};

var response = logCurlRequest('POST', url, body);

assert(response.code === 202);

logJsonResponse(response);

graph._drop("enterpriseGraph", true);
```

```curl
---
description: |-
  Create a SatelliteGraph. A SatelliteGraph does not use
  shards, but uses "satellite" as replicationFactor.
  Make sure to keep this graph small as it is cloned
  to every server.
  Available in the Enterprise Edition only.
name: HttpGharialCreateSatellite
---
var graph = require("@arangodb/general-graph");
 if (graph._exists("satelliteGraph")) {
    graph._drop("satelliteGraph", true);
}
var url = "/_api/gharial";
body = {
name: "satelliteGraph",
edgeDefinitions: [{
collection: "edges",
from: [ "startVertices" ],
to: [ "endVertices" ]
}],
orphanCollections: [ ],
options: {
replicationFactor: "satellite"
}
};

var response = logCurlRequest('POST', url, body);

assert(response.code === 202);

logJsonResponse(response);

graph._drop("satelliteGraph", true);
```

### Get a graph

```openapi
paths:
  /_api/gharial/{graph}:
    get:
      operationId: getGraph
      description: |
        Selects information for a given graph.
        Returns the edge definitions as well as the orphan collections,
        or returns an error if the graph does not exist.
      parameters:
        - name: graph
          in: path
          required: true
          description: |
            The name of the graph.
          schema:
            type: string
      responses:
        '200':
          description: |
            Returns the graph if it can be found.
            The result has the following format:
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - graph
                properties:
                  error:
                    description: |
                      A flag indicating that no error occurred.
                    type: boolean
                    example: false
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 200
                  graph:
                    description: |
                      The information about the newly created graph
                    type: object
                    required:
                      - name
                      - edgeDefinitions
                      - orphanCollections
                      - numberOfShards
                      - _id
                      - _rev
                      - replicationFactor
                      - isSmart
                      - isDisjoint
                      - isSatellite
                    properties:
                      name:
                        description: |
                          The name of the graph.
                        type: string
                      edgeDefinitions:
                        description: |
                          An array of definitions for the relations of the graph.
                          Each has the following type:
                        type: array
                        items:
                          type: object
                          required:
                            - collection
                            - from
                            - to
                          properties:
                            collection:
                              description: |
                                Name of the edge collection, where the edges are stored in.
                              type: string
                            from:
                              description: |
                                List of vertex collection names.
                                Edges in collection can only be inserted if their _from is in any of the collections here.
                              type: array
                              items:
                                type: string
                            to:
                              description: |
                                List of vertex collection names.

                                Edges in collection can only be inserted if their _to is in any of the collections here.
                              type: array
                              items:
                                type: string
                      orphanCollections:
                        description: |
                          An array of additional vertex collections.
                          Documents in these collections do not have edges within this graph.
                        type: array
                        items:
                          type: string
                      numberOfShards:
                        description: |
                          Number of shards created for every new collection in the graph.
                        type: integer
                      _id:
                        description: |
                          The internal id value of this graph.
                        type: string
                      _rev:
                        description: |
                          The revision of this graph. Can be used to make sure to not override
                          concurrent modifications to this graph.
                        type: string
                      replicationFactor:
                        description: |
                          The replication factor used for every new collection in the graph.
                          For SatelliteGraphs, it is the string `"satellite"` (Enterprise Edition only).
                        type: integer
                      writeConcern:
                        description: |
                          The default write concern for new collections in the graph.
                          It determines how many copies of each shard are required to be
                          in sync on the different DB-Servers. If there are less than these many copies
                          in the cluster, a shard refuses to write. Writes to shards with enough
                          up-to-date copies succeed at the same time, however. The value of
                          `writeConcern` cannot be greater than `replicationFactor`.
                          For SatelliteGraphs, the `writeConcern` is automatically controlled to equal the
                          number of DB-Servers and the attribute is not available. _(cluster only)_
                        type: integer
                      isSmart:
                        description: |
                          Whether the graph is a SmartGraph (Enterprise Edition only).
                        type: boolean
                      isDisjoint:
                        description: |
                          Whether the graph is a Disjoint SmartGraph (Enterprise Edition only).
                        type: boolean
                      smartGraphAttribute:
                        description: |
                          Name of the sharding attribute in the SmartGraph case (Enterprise Edition only).
                        type: string
                      isSatellite:
                        description: |
                          Flag if the graph is a SatelliteGraph (Enterprise Edition only) or not.
                        type: boolean
        '404':
          description: |
            Returned if no graph with this name can be found.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 404
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
      tags:
        - Graphs
```

**Examples**

```curl
---
description: ''
name: HttpGharialGetGraph
---
var graph = require("@arangodb/general-graph");
if (graph._exists("myGraph")) {
  graph._drop("myGraph", true);
}
graph._create("myGraph", [{
  collection: "edges",
  from: [ "startVertices" ],
  to: [ "endVertices" ]
}]);
var url = "/_api/gharial/myGraph";

var response = logCurlRequest('GET', url);

assert(response.code === 200);

logJsonResponse(response);

graph._drop("myGraph", true);
```

### Drop a graph

```openapi
paths:
  /_api/gharial/{graph}:
    delete:
      operationId: deleteGraph
      description: |
        Drops an existing graph object by name.
        Optionally all collections not used by other graphs
        can be dropped as well.
      parameters:
        - name: graph
          in: path
          required: true
          description: |
            The name of the graph.
          schema:
            type: string
        - name: dropCollections
          in: query
          required: false
          description: |
            Drop the collections of this graph as well. Collections are only
            dropped if they are not used in other graphs.
          schema:
            type: boolean
      responses:
        '202':
          description: |
            Is returned if the graph can be dropped.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - removed
                properties:
                  error:
                    description: |
                      A flag indicating that no error occurred.
                    type: boolean
                    example: false
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 202
                  removed:
                    description: |
                      Always `true`.
                    type: boolean
                    example: true
        '403':
          description: |
            Returned if your user has insufficient rights.
            In order to drop a graph, you need to have at least the following privileges:
            - `Administrate` access on the database.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 403
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '404':
          description: |
            Returned if no graph with this name can be found.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 404
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
      tags:
        - Graphs
```

**Examples**

```curl
---
description: ''
name: HttpGharialDrop
---
var examples = require("@arangodb/graph-examples/example-graph.js");
examples.dropGraph("social");
examples.loadGraph("social");
var url = "/_api/gharial/social?dropCollections=true";
var response = logCurlRequest('DELETE', url);

assert(response.code === 202);

logJsonResponse(response);
examples.dropGraph("social");
```

### List vertex collections

```openapi
paths:
  /_api/gharial/{graph}/vertex:
    get:
      operationId: listVertexCollections
      description: |
        Lists all vertex collections within this graph, including orphan collections.
      parameters:
        - name: graph
          in: path
          required: true
          description: |
            The name of the graph.
          schema:
            type: string
      responses:
        '200':
          description: |
            Is returned if the collections can be listed.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - collections
                properties:
                  error:
                    description: |
                      A flag indicating that no error occurred.
                    type: boolean
                    example: false
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 200
                  collections:
                    description: |
                      The list of all vertex collections within this graph.
                      Includes the vertex collections used in edge definitions
                      as well as orphan collections.
                    type: array
                    items:
                      type: string
        '404':
          description: |
            Returned if no graph with this name can be found.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 404
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
      tags:
        - Graphs
```

**Examples**

```curl
---
description: ''
name: HttpGharialListVertex
---
var examples = require("@arangodb/graph-examples/example-graph.js");
examples.dropGraph("social");
examples.loadGraph("social");
var url = "/_api/gharial/social/vertex";
var response = logCurlRequest('GET', url);

assert(response.code === 200);

logJsonResponse(response);
examples.dropGraph("social");
```

### Add a vertex collection

Adding a vertex collection on its own to a graph adds it as an orphan collection.
If you want to use an additional vertex collection for graph relations, add it
by [adding a new edge definition](#add-an-edge-definition) or
[modifying an existing edge definition](#replace-an-edge-definition) instead.

```openapi
paths:
  /_api/gharial/{graph}/vertex:
    post:
      operationId: addVertexCollection
      description: |
        Adds a vertex collection to the set of orphan collections of the graph.
        If the collection does not exist, it is created.
      parameters:
        - name: graph
          in: path
          required: true
          description: |
            The name of the graph.
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required:
                - collection
              properties:
                collection:
                  description: |
                    The name of the vertex collection to add to the graph definition.
                  type: string
                options:
                  description: |
                    A JSON object to set options for creating vertex collections.
                  type: object
                  properties:
                    satellites:
                      description: |
                        An array of collection names that is used to create SatelliteCollections
                        for a (Disjoint) SmartGraph using SatelliteCollections (Enterprise Edition only).
                        Each array element must be a string and a valid collection name.
                        The collection type cannot be modified later.
                      type: array
                      items:
                        type: string
      responses:
        '201':
          description: |
            Is returned if the collection can be created and `waitForSync` is enabled
            for the `_graphs` collection, or given in the request.
            The response body contains the graph configuration that has been stored.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - graph
                properties:
                  error:
                    description: |
                      A flag indicating that no error occurred.
                    type: boolean
                    example: false
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 201
                  graph:
                    description: |
                      The information about the modified graph.
                    type: object
                    required:
                      - name
                      - edgeDefinitions
                      - orphanCollections
                      - numberOfShards
                      - _id
                      - _rev
                      - replicationFactor
                      - isSmart
                      - isDisjoint
                      - isSatellite
                    properties:
                      name:
                        description: |
                          The name of the graph.
                        type: string
                      edgeDefinitions:
                        description: |
                          An array of definitions for the relations of the graph.
                          Each has the following type:
                        type: array
                        items:
                          type: object
                          required:
                            - collection
                            - from
                            - to
                          properties:
                            collection:
                              description: |
                                Name of the edge collection, where the edges are stored in.
                              type: string
                            from:
                              description: |
                                List of vertex collection names.
                                Edges in collection can only be inserted if their _from is in any of the collections here.
                              type: array
                              items:
                                type: string
                            to:
                              description: |
                                List of vertex collection names.

                                Edges in collection can only be inserted if their _to is in any of the collections here.
                              type: array
                              items:
                                type: string
                      orphanCollections:
                        description: |
                          An array of additional vertex collections.
                          Documents in these collections do not have edges within this graph.
                        type: array
                        items:
                          type: string
                      numberOfShards:
                        description: |
                          Number of shards created for every new collection in the graph.
                        type: integer
                      _id:
                        description: |
                          The internal id value of this graph.
                        type: string
                      _rev:
                        description: |
                          The revision of this graph. Can be used to make sure to not override
                          concurrent modifications to this graph.
                        type: string
                      replicationFactor:
                        description: |
                          The replication factor used for every new collection in the graph.
                          For SatelliteGraphs, it is the string `"satellite"` (Enterprise Edition only).
                        type: integer
                      writeConcern:
                        description: |
                          The default write concern for new collections in the graph.
                          It determines how many copies of each shard are required to be
                          in sync on the different DB-Servers. If there are less than these many copies
                          in the cluster, a shard refuses to write. Writes to shards with enough
                          up-to-date copies succeed at the same time, however. The value of
                          `writeConcern` cannot be greater than `replicationFactor`.
                          For SatelliteGraphs, the `writeConcern` is automatically controlled to equal the
                          number of DB-Servers and the attribute is not available. _(cluster only)_
                        type: integer
                      isSmart:
                        description: |
                          Whether the graph is a SmartGraph (Enterprise Edition only).
                        type: boolean
                      isDisjoint:
                        description: |
                          Whether the graph is a Disjoint SmartGraph (Enterprise Edition only).
                        type: boolean
                      smartGraphAttribute:
                        description: |
                          Name of the sharding attribute in the SmartGraph case (Enterprise Edition only).
                        type: string
                      isSatellite:
                        description: |
                          Flag if the graph is a SatelliteGraph (Enterprise Edition only) or not.
                        type: boolean
        '202':
          description: |
            Is returned if the collection can be created and `waitForSync` is disabled
            for the `_graphs` collection, or given in the request.
            The response body contains the graph configuration that has been stored.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - graph
                properties:
                  error:
                    description: |
                      A flag indicating that no error occurred.
                    type: boolean
                    example: false
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 202
                  graph:
                    description: |
                      The information about the newly created graph
                    type: object
                    required:
                      - name
                      - edgeDefinitions
                      - orphanCollections
                      - numberOfShards
                      - _id
                      - _rev
                      - replicationFactor
                      - isSmart
                      - isDisjoint
                      - isSatellite
                    properties:
                      name:
                        description: |
                          The name of the graph.
                        type: string
                      edgeDefinitions:
                        description: |
                          An array of definitions for the relations of the graph.
                          Each has the following type:
                        type: array
                        items:
                          type: object
                          required:
                            - collection
                            - from
                            - to
                          properties:
                            collection:
                              description: |
                                Name of the edge collection, where the edges are stored in.
                              type: string
                            from:
                              description: |
                                List of vertex collection names.
                                Edges in collection can only be inserted if their _from is in any of the collections here.
                              type: array
                              items:
                                type: string
                            to:
                              description: |
                                List of vertex collection names.

                                Edges in collection can only be inserted if their _to is in any of the collections here.
                              type: array
                              items:
                                type: string
                      orphanCollections:
                        description: |
                          An array of additional vertex collections.
                          Documents in these collections do not have edges within this graph.
                        type: array
                        items:
                          type: string
                      numberOfShards:
                        description: |
                          Number of shards created for every new collection in the graph.
                        type: integer
                      _id:
                        description: |
                          The internal id value of this graph.
                        type: string
                      _rev:
                        description: |
                          The revision of this graph. Can be used to make sure to not override
                          concurrent modifications to this graph.
                        type: string
                      replicationFactor:
                        description: |
                          The replication factor used for every new collection in the graph.
                          For SatelliteGraphs, it is the string `"satellite"` (Enterprise Edition only).
                        type: integer
                      writeConcern:
                        description: |
                          The default write concern for new collections in the graph.
                          It determines how many copies of each shard are required to be
                          in sync on the different DB-Servers. If there are less than these many copies
                          in the cluster, a shard refuses to write. Writes to shards with enough
                          up-to-date copies succeed at the same time, however. The value of
                          `writeConcern` cannot be greater than `replicationFactor`.
                          For SatelliteGraphs, the `writeConcern` is automatically controlled to equal the
                          number of DB-Servers and the attribute is not available. _(cluster only)_
                        type: integer
                      isSmart:
                        description: |
                          Whether the graph is a SmartGraph (Enterprise Edition only).
                        type: boolean
                      isDisjoint:
                        description: |
                          Whether the graph is a Disjoint SmartGraph (Enterprise Edition only).
                        type: boolean
                      smartGraphAttribute:
                        description: |
                          Name of the sharding attribute in the SmartGraph case (Enterprise Edition only).
                        type: string
                      isSatellite:
                        description: |
                          Flag if the graph is a SatelliteGraph (Enterprise Edition only) or not.
                        type: boolean
        '400':
          description: |
            Returned if the request is in an invalid format.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 400
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '403':
          description: |
            Returned if your user has insufficient rights.
            In order to modify a graph, you need to have at least the following privileges:
            - `Administrate` access on the database.
            - `Read Only` access on every collection used within this graph.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 403
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '404':
          description: |
            Returned if no graph with this name can be found.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 404
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
      tags:
        - Graphs
```

**Examples**

```curl
---
description: ''
name: HttpGharialAddVertexCol
---
var examples = require("@arangodb/graph-examples/example-graph.js");
examples.dropGraph("social");
examples.loadGraph("social");
var url = "/_api/gharial/social/vertex";
body = {
  collection: "otherVertices"
};
var response = logCurlRequest('POST', url, body);

assert(response.code === 202);

logJsonResponse(response);
examples.dropGraph("social");
```

### Remove a vertex collection

```openapi
paths:
  /_api/gharial/{graph}/vertex/{collection}:
    delete:
      operationId: deleteVertexCollection
      description: |
        Removes a vertex collection from the list of the graph's
        orphan collections. It can optionally delete the collection if it is
        not used in any other graph.

        You cannot remove vertex collections that are used in one of the
        edge definitions of the graph. You need to modify or remove the
        edge definition first in order to fully remove a vertex collection from
        the graph.
      parameters:
        - name: graph
          in: path
          required: true
          description: |
            The name of the graph.
          schema:
            type: string
        - name: collection
          in: path
          required: true
          description: |
            The name of the vertex collection.
          schema:
            type: string
        - name: dropCollection
          in: query
          required: false
          description: |
            Drop the collection as well.
            The collection is only dropped if it is not used in other graphs.
          schema:
            type: boolean
      responses:
        '200':
          description: |
            Returned if the vertex collection was removed from the graph successfully
            and `waitForSync` is `true`.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - graph
                properties:
                  error:
                    description: |
                      A flag indicating that no error occurred.
                    type: boolean
                    example: false
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 200
                  graph:
                    description: |
                      The information about the newly created graph
                    type: object
                    required:
                      - name
                      - edgeDefinitions
                      - orphanCollections
                      - numberOfShards
                      - _id
                      - _rev
                      - replicationFactor
                      - isSmart
                      - isDisjoint
                      - isSatellite
                    properties:
                      name:
                        description: |
                          The name of the graph.
                        type: string
                      edgeDefinitions:
                        description: |
                          An array of definitions for the relations of the graph.
                          Each has the following type:
                        type: array
                        items:
                          type: object
                          required:
                            - collection
                            - from
                            - to
                          properties:
                            collection:
                              description: |
                                Name of the edge collection, where the edges are stored in.
                              type: string
                            from:
                              description: |
                                List of vertex collection names.
                                Edges in collection can only be inserted if their _from is in any of the collections here.
                              type: array
                              items:
                                type: string
                            to:
                              description: |
                                List of vertex collection names.

                                Edges in collection can only be inserted if their _to is in any of the collections here.
                              type: array
                              items:
                                type: string
                      orphanCollections:
                        description: |
                          An array of additional vertex collections.
                          Documents in these collections do not have edges within this graph.
                        type: array
                        items:
                          type: string
                      numberOfShards:
                        description: |
                          Number of shards created for every new collection in the graph.
                        type: integer
                      _id:
                        description: |
                          The internal id value of this graph.
                        type: string
                      _rev:
                        description: |
                          The revision of this graph. Can be used to make sure to not override
                          concurrent modifications to this graph.
                        type: string
                      replicationFactor:
                        description: |
                          The replication factor used for every new collection in the graph.
                          For SatelliteGraphs, it is the string `"satellite"` (Enterprise Edition only).
                        type: integer
                      writeConcern:
                        description: |
                          The default write concern for new collections in the graph.
                          It determines how many copies of each shard are required to be
                          in sync on the different DB-Servers. If there are less than these many copies
                          in the cluster, a shard refuses to write. Writes to shards with enough
                          up-to-date copies succeed at the same time, however. The value of
                          `writeConcern` cannot be greater than `replicationFactor`.
                          For SatelliteGraphs, the `writeConcern` is automatically controlled to equal the
                          number of DB-Servers and the attribute is not available. _(cluster only)_
                        type: integer
                      isSmart:
                        description: |
                          Whether the graph is a SmartGraph (Enterprise Edition only).
                        type: boolean
                      isDisjoint:
                        description: |
                          Whether the graph is a Disjoint SmartGraph (Enterprise Edition only).
                        type: boolean
                      smartGraphAttribute:
                        description: |
                          Name of the sharding attribute in the SmartGraph case (Enterprise Edition only).
                        type: string
                      isSatellite:
                        description: |
                          Flag if the graph is a SatelliteGraph (Enterprise Edition only) or not.
                        type: boolean
        '202':
          description: |
            Returned if the request was successful but `waitForSync` is `false`.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - graph
                properties:
                  error:
                    description: |
                      A flag indicating that no error occurred.
                    type: boolean
                    example: false
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 202
                  graph:
                    description: |
                      The information about the newly created graph
                    type: object
                    required:
                      - name
                      - edgeDefinitions
                      - orphanCollections
                      - numberOfShards
                      - _id
                      - _rev
                      - replicationFactor
                      - isSmart
                      - isDisjoint
                      - isSatellite
                    properties:
                      name:
                        description: |
                          The name of the graph.
                        type: string
                      edgeDefinitions:
                        description: |
                          An array of definitions for the relations of the graph.
                          Each has the following type:
                        type: array
                        items:
                          type: object
                          required:
                            - collection
                            - from
                            - to
                          properties:
                            collection:
                              description: |
                                Name of the edge collection, where the edges are stored in.
                              type: string
                            from:
                              description: |
                                List of vertex collection names.
                                Edges in collection can only be inserted if their _from is in any of the collections here.
                              type: array
                              items:
                                type: string
                            to:
                              description: |
                                List of vertex collection names.

                                Edges in collection can only be inserted if their _to is in any of the collections here.
                              type: array
                              items:
                                type: string
                      orphanCollections:
                        description: |
                          An array of additional vertex collections.
                          Documents in these collections do not have edges within this graph.
                        type: array
                        items:
                          type: string
                      numberOfShards:
                        description: |
                          Number of shards created for every new collection in the graph.
                        type: integer
                      _id:
                        description: |
                          The internal id value of this graph.
                        type: string
                      _rev:
                        description: |
                          The revision of this graph. Can be used to make sure to not override
                          concurrent modifications to this graph.
                        type: string
                      replicationFactor:
                        description: |
                          The replication factor used for every new collection in the graph.
                          For SatelliteGraphs, it is the string `"satellite"` (Enterprise Edition only).
                        type: integer
                      writeConcern:
                        description: |
                          The default write concern for new collections in the graph.
                          It determines how many copies of each shard are required to be
                          in sync on the different DB-Servers. If there are less than these many copies
                          in the cluster, a shard refuses to write. Writes to shards with enough
                          up-to-date copies succeed at the same time, however. The value of
                          `writeConcern` cannot be greater than `replicationFactor`.
                          For SatelliteGraphs, the `writeConcern` is automatically controlled to equal the
                          number of DB-Servers and the attribute is not available. _(cluster only)_
                        type: integer
                      isSmart:
                        description: |
                          Whether the graph is a SmartGraph (Enterprise Edition only).
                        type: boolean
                      isDisjoint:
                        description: |
                          Whether the graph is a Disjoint SmartGraph (Enterprise Edition only).
                        type: boolean
                      smartGraphAttribute:
                        description: |
                          Name of the sharding attribute in the SmartGraph case (Enterprise Edition only).
                        type: string
                      isSatellite:
                        description: |
                          Flag if the graph is a SatelliteGraph (Enterprise Edition only) or not.
                        type: boolean
        '400':
          description: |
            Returned if the vertex collection is still used in an edge definition.
            In this case it cannot be removed from the graph yet, it has to be
            removed from the edge definition first.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 400
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '403':
          description: |
            Returned if your user has insufficient rights.
            In order to drop a vertex, you need to have at least the following privileges:
            - `Administrate` access on the database.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 403
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '404':
          description: |
            Returned if no graph with this name can be found.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 404
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
      tags:
        - Graphs
```

**Examples**

```curl
---
description: |-
  You can remove vertex collections that are not used in any edge definition:
name: HttpGharialRemoveVertexCollection
---
var examples = require("@arangodb/graph-examples/example-graph.js");
examples.dropGraph("social");
var g = examples.loadGraph("social");
g._addVertexCollection("otherVertices");
var url = "/_api/gharial/social/vertex/otherVertices";
var response = logCurlRequest('DELETE', url);

assert(response.code === 202);

logJsonResponse(response);
examples.dropGraph("social");
db._drop("otherVertices");
```

```curl
---
description: |-
  You cannot remove vertex collections that are used in edge definitions:
name: HttpGharialRemoveVertexCollectionFailed
---
var examples = require("@arangodb/graph-examples/example-graph.js");
examples.dropGraph("social");
var g = examples.loadGraph("social");
var url = "/_api/gharial/social/vertex/male";
var response = logCurlRequest('DELETE', url);

assert(response.code === 400);

logJsonResponse(response);
db._drop("male");
db._drop("female");
db._drop("relation");
examples.dropGraph("social");
```

### List edge collections

```openapi
paths:
  /_api/gharial/{graph}/edge:
    get:
      operationId: listEdgeCollections
      description: |
        Lists all edge collections within this graph.
      parameters:
        - name: graph
          in: path
          required: true
          description: |
            The name of the graph.
          schema:
            type: string
      responses:
        '200':
          description: |
            Is returned if the edge definitions can be listed.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - collections
                properties:
                  error:
                    description: |
                      A flag indicating that no error occurred.
                    type: boolean
                    example: false
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 200
                  collections:
                    description: |
                      A list of all edge collections used in the edge definitions
                      of this graph.
                    type: array
                    items:
                      type: string
        '404':
          description: |
            Returned if no graph with this name can be found.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 404
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
      tags:
        - Graphs
```

**Examples**

```curl
---
description: ''
name: HttpGharialListEdge
---
var examples = require("@arangodb/graph-examples/example-graph.js");
examples.dropGraph("social");
examples.loadGraph("social");
var url = "/_api/gharial/social/edge";
var response = logCurlRequest('GET', url);

assert(response.code === 200);

logJsonResponse(response);
examples.dropGraph("social");
```

### Add an edge definition

```openapi
paths:
  /_api/gharial/{graph}/edge:
    post:
      operationId: createEdgeDefinition
      description: |
        Adds an additional edge definition to the graph.

        This edge definition has to contain a `collection` and an array of
        each `from` and `to` vertex collections. An edge definition can only
        be added if this definition is either not used in any other graph, or
        it is used with exactly the same definition. For example, it is not
        possible to store a definition "e" from "v1" to "v2" in one graph, and
        "e" from "v2" to "v1" in another graph, but both can have "e" from
        "v1" to "v2".

        Additionally, collection creation options can be set.
      parameters:
        - name: graph
          in: path
          required: true
          description: |
            The name of the graph.
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required:
                - collection
                - from
                - to
              properties:
                collection:
                  description: |
                    The name of the edge collection to be used.
                  type: string
                from:
                  description: |
                    One or many vertex collections that can contain source vertices.
                  type: array
                  items:
                    type: string
                to:
                  description: |
                    One or many vertex collections that can contain target vertices.
                  type: array
                  items:
                    type: string
                options:
                  description: |
                    A JSON object to set options for creating collections within this
                    edge definition.
                  type: object
                  properties:
                    satellites:
                      description: |
                        An array of collection names that is used to create SatelliteCollections
                        for a (Disjoint) SmartGraph using SatelliteCollections (Enterprise Edition only).
                        Each array element must be a string and a valid collection name.
                        The collection type cannot be modified later.
                      type: array
                      items:
                        type: string
      responses:
        '201':
          description: |
            Returned if the definition can be added successfully and
            `waitForSync` is enabled for the `_graphs` collection.
            The response body contains the graph configuration that has been stored.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - graph
                properties:
                  error:
                    description: |
                      A flag indicating that no error occurred.
                    type: boolean
                    example: false
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 201
                  graph:
                    description: |
                      The information about the modified graph.
                    type: object
                    required:
                      - name
                      - edgeDefinitions
                      - orphanCollections
                      - numberOfShards
                      - _id
                      - _rev
                      - replicationFactor
                      - isSmart
                      - isDisjoint
                      - isSatellite
                    properties:
                      name:
                        description: |
                          The name of the graph.
                        type: string
                      edgeDefinitions:
                        description: |
                          An array of definitions for the relations of the graph.
                          Each has the following type:
                        type: array
                        items:
                          type: object
                          required:
                            - collection
                            - from
                            - to
                          properties:
                            collection:
                              description: |
                                Name of the edge collection, where the edges are stored in.
                              type: string
                            from:
                              description: |
                                List of vertex collection names.
                                Edges in collection can only be inserted if their _from is in any of the collections here.
                              type: array
                              items:
                                type: string
                            to:
                              description: |
                                List of vertex collection names.

                                Edges in collection can only be inserted if their _to is in any of the collections here.
                              type: array
                              items:
                                type: string
                      orphanCollections:
                        description: |
                          An array of additional vertex collections.
                          Documents in these collections do not have edges within this graph.
                        type: array
                        items:
                          type: string
                      numberOfShards:
                        description: |
                          Number of shards created for every new collection in the graph.
                        type: integer
                      _id:
                        description: |
                          The internal id value of this graph.
                        type: string
                      _rev:
                        description: |
                          The revision of this graph. Can be used to make sure to not override
                          concurrent modifications to this graph.
                        type: string
                      replicationFactor:
                        description: |
                          The replication factor used for every new collection in the graph.
                          For SatelliteGraphs, it is the string `"satellite"` (Enterprise Edition only).
                        type: integer
                      writeConcern:
                        description: |
                          The default write concern for new collections in the graph.
                          It determines how many copies of each shard are required to be
                          in sync on the different DB-Servers. If there are less than these many copies
                          in the cluster, a shard refuses to write. Writes to shards with enough
                          up-to-date copies succeed at the same time, however. The value of
                          `writeConcern` cannot be greater than `replicationFactor`.
                          For SatelliteGraphs, the `writeConcern` is automatically controlled to equal the
                          number of DB-Servers and the attribute is not available. _(cluster only)_
                        type: integer
                      isSmart:
                        description: |
                          Whether the graph is a SmartGraph (Enterprise Edition only).
                        type: boolean
                      isDisjoint:
                        description: |
                          Whether the graph is a Disjoint SmartGraph (Enterprise Edition only).
                        type: boolean
                      smartGraphAttribute:
                        description: |
                          Name of the sharding attribute in the SmartGraph case (Enterprise Edition only).
                        type: string
                      isSatellite:
                        description: |
                          Flag if the graph is a SatelliteGraph (Enterprise Edition only) or not.
                        type: boolean
        '202':
          description: |
            Returned if the definition can be added successfully and
            `waitForSync` is disabled for the `_graphs` collection.
            The response body contains the graph configuration that has been stored.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - graph
                properties:
                  error:
                    description: |
                      A flag indicating that no error occurred.
                    type: boolean
                    example: false
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 202
                  graph:
                    description: |
                      The information about the modified graph.
                    type: object
                    required:
                      - name
                      - edgeDefinitions
                      - orphanCollections
                      - numberOfShards
                      - _id
                      - _rev
                      - replicationFactor
                      - isSmart
                      - isDisjoint
                      - isSatellite
                    properties:
                      name:
                        description: |
                          The name of the graph.
                        type: string
                      edgeDefinitions:
                        description: |
                          An array of definitions for the relations of the graph.
                          Each has the following type:
                        type: array
                        items:
                          type: object
                          required:
                            - collection
                            - from
                            - to
                          properties:
                            collection:
                              description: |
                                Name of the edge collection, where the edges are stored in.
                              type: string
                            from:
                              description: |
                                List of vertex collection names.
                                Edges in collection can only be inserted if their _from is in any of the collections here.
                              type: array
                              items:
                                type: string
                            to:
                              description: |
                                List of vertex collection names.

                                Edges in collection can only be inserted if their _to is in any of the collections here.
                              type: array
                              items:
                                type: string
                      orphanCollections:
                        description: |
                          An array of additional vertex collections.
                          Documents in these collections do not have edges within this graph.
                        type: array
                        items:
                          type: string
                      numberOfShards:
                        description: |
                          Number of shards created for every new collection in the graph.
                        type: integer
                      _id:
                        description: |
                          The internal id value of this graph.
                        type: string
                      _rev:
                        description: |
                          The revision of this graph. Can be used to make sure to not override
                          concurrent modifications to this graph.
                        type: string
                      replicationFactor:
                        description: |
                          The replication factor used for every new collection in the graph.
                          For SatelliteGraphs, it is the string `"satellite"` (Enterprise Edition only).
                        type: integer
                      writeConcern:
                        description: |
                          The default write concern for new collections in the graph.
                          It determines how many copies of each shard are required to be
                          in sync on the different DB-Servers. If there are less than these many copies
                          in the cluster, a shard refuses to write. Writes to shards with enough
                          up-to-date copies succeed at the same time, however. The value of
                          `writeConcern` cannot be greater than `replicationFactor`.
                          For SatelliteGraphs, the `writeConcern` is automatically controlled to equal the
                          number of DB-Servers and the attribute is not available. _(cluster only)_
                        type: integer
                      isSmart:
                        description: |
                          Whether the graph is a SmartGraph (Enterprise Edition only).
                        type: boolean
                      isDisjoint:
                        description: |
                          Whether the graph is a Disjoint SmartGraph (Enterprise Edition only).
                        type: boolean
                      smartGraphAttribute:
                        description: |
                          Name of the sharding attribute in the SmartGraph case (Enterprise Edition only).
                        type: string
                      isSatellite:
                        description: |
                          Flag if the graph is a SatelliteGraph (Enterprise Edition only) or not.
                        type: boolean
        '400':
          description: |
            Returned if the edge definition can not be added.
            This can be because it is ill-formed, or if there is an
            edge definition with the same edge collection but different `from`
            and `to` vertex collections in any other graph.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 400
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '403':
          description: |
            Returned if your user has insufficient rights.
            In order to modify a graph, you need to have at least the following privileges:
            - `Administrate` access on the database.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 403
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '404':
          description: |
            Returned if no graph with this name can be found.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 404
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
      tags:
        - Graphs
```

**Examples**

```curl
---
description: ''
name: HttpGharialAddEdgeCol
---
var examples = require("@arangodb/graph-examples/example-graph.js");
examples.dropGraph("social");
examples.loadGraph("social");
var url = "/_api/gharial/social/edge";
body = {
  collection: "works_in",
  from: ["female", "male"],
  to: ["city"]
};
var response = logCurlRequest('POST', url, body);

assert(response.code === 202);

logJsonResponse(response);
examples.dropGraph("social");
```

### Replace an edge definition

```openapi
paths:
  /_api/gharial/{graph}/edge/{collection}:
    put:
      operationId: replaceEdgeDefinition
      description: |
        Change one specific edge definition.
        This modifies all occurrences of this definition in all graphs known to your database.
      parameters:
        - name: graph
          in: path
          required: true
          description: |
            The name of the graph.
          schema:
            type: string
        - name: collection
          in: path
          required: true
          description: |
            The name of the edge collection used in the edge definition.
          schema:
            type: string
        - name: waitForSync
          in: query
          required: false
          description: |
            Define if the request should wait until synced to disk.
          schema:
            type: boolean
        - name: dropCollections
          in: query
          required: false
          description: |
            Drop the collection as well.
            The collection is only dropped if it is not used in other graphs.
          schema:
            type: boolean
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required:
                - collection
                - from
                - to
              properties:
                collection:
                  description: |
                    The name of the edge collection to be used.
                  type: string
                from:
                  description: |
                    One or many vertex collections that can contain source vertices.
                  type: array
                  items:
                    type: string
                to:
                  description: |
                    One or many vertex collections that can contain target vertices.
                  type: array
                  items:
                    type: string
                options:
                  description: |
                    A JSON object to set options for modifying collections within this
                    edge definition.
                  type: object
                  properties:
                    satellites:
                      description: |
                        An array of collection names that is used to create SatelliteCollections
                        for a (Disjoint) SmartGraph using SatelliteCollections (Enterprise Edition only).
                        Each array element must be a string and a valid collection name.
                        The collection type cannot be modified later.
                      type: array
                      items:
                        type: string
      responses:
        '201':
          description: |
            Returned if the request was successful and `waitForSync` is `true`.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - graph
                properties:
                  error:
                    description: |
                      A flag indicating that no error occurred.
                    type: boolean
                    example: false
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 201
                  graph:
                    description: |
                      The information about the modified graph.
                    type: object
                    required:
                      - name
                      - edgeDefinitions
                      - orphanCollections
                      - numberOfShards
                      - _id
                      - _rev
                      - replicationFactor
                      - isSmart
                      - isDisjoint
                      - isSatellite
                    properties:
                      name:
                        description: |
                          The name of the graph.
                        type: string
                      edgeDefinitions:
                        description: |
                          An array of definitions for the relations of the graph.
                          Each has the following type:
                        type: array
                        items:
                          type: object
                          required:
                            - collection
                            - from
                            - to
                          properties:
                            collection:
                              description: |
                                Name of the edge collection, where the edges are stored in.
                              type: string
                            from:
                              description: |
                                List of vertex collection names.
                                Edges in collection can only be inserted if their _from is in any of the collections here.
                              type: array
                              items:
                                type: string
                            to:
                              description: |
                                List of vertex collection names.

                                Edges in collection can only be inserted if their _to is in any of the collections here.
                              type: array
                              items:
                                type: string
                      orphanCollections:
                        description: |
                          An array of additional vertex collections.
                          Documents in these collections do not have edges within this graph.
                        type: array
                        items:
                          type: string
                      numberOfShards:
                        description: |
                          Number of shards created for every new collection in the graph.
                        type: integer
                      _id:
                        description: |
                          The internal id value of this graph.
                        type: string
                      _rev:
                        description: |
                          The revision of this graph. Can be used to make sure to not override
                          concurrent modifications to this graph.
                        type: string
                      replicationFactor:
                        description: |
                          The replication factor used for every new collection in the graph.
                          For SatelliteGraphs, it is the string `"satellite"` (Enterprise Edition only).
                        type: integer
                      writeConcern:
                        description: |
                          The default write concern for new collections in the graph.
                          It determines how many copies of each shard are required to be
                          in sync on the different DB-Servers. If there are less than these many copies
                          in the cluster, a shard refuses to write. Writes to shards with enough
                          up-to-date copies succeed at the same time, however. The value of
                          `writeConcern` cannot be greater than `replicationFactor`.
                          For SatelliteGraphs, the `writeConcern` is automatically controlled to equal the
                          number of DB-Servers and the attribute is not available. _(cluster only)_
                        type: integer
                      isSmart:
                        description: |
                          Whether the graph is a SmartGraph (Enterprise Edition only).
                        type: boolean
                      isDisjoint:
                        description: |
                          Whether the graph is a Disjoint SmartGraph (Enterprise Edition only).
                        type: boolean
                      smartGraphAttribute:
                        description: |
                          Name of the sharding attribute in the SmartGraph case (Enterprise Edition only).
                        type: string
                      isSatellite:
                        description: |
                          Flag if the graph is a SatelliteGraph (Enterprise Edition only) or not.
                        type: boolean
        '202':
          description: |
            Returned if the request was successful but `waitForSync` is `false`.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - graph
                properties:
                  error:
                    description: |
                      A flag indicating that no error occurred.
                    type: boolean
                    example: false
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 202
                  graph:
                    description: |
                      The information about the modified graph.
                    type: object
                    required:
                      - name
                      - edgeDefinitions
                      - orphanCollections
                      - numberOfShards
                      - _id
                      - _rev
                      - replicationFactor
                      - isSmart
                      - isDisjoint
                      - isSatellite
                    properties:
                      name:
                        description: |
                          The name of the graph.
                        type: string
                      edgeDefinitions:
                        description: |
                          An array of definitions for the relations of the graph.
                          Each has the following type:
                        type: array
                        items:
                          type: object
                          required:
                            - collection
                            - from
                            - to
                          properties:
                            collection:
                              description: |
                                Name of the edge collection, where the edges are stored in.
                              type: string
                            from:
                              description: |
                                List of vertex collection names.
                                Edges in collection can only be inserted if their _from is in any of the collections here.
                              type: array
                              items:
                                type: string
                            to:
                              description: |
                                List of vertex collection names.

                                Edges in collection can only be inserted if their _to is in any of the collections here.
                              type: array
                              items:
                                type: string
                      orphanCollections:
                        description: |
                          An array of additional vertex collections.
                          Documents in these collections do not have edges within this graph.
                        type: array
                        items:
                          type: string
                      numberOfShards:
                        description: |
                          Number of shards created for every new collection in the graph.
                        type: integer
                      _id:
                        description: |
                          The internal id value of this graph.
                        type: string
                      _rev:
                        description: |
                          The revision of this graph. Can be used to make sure to not override
                          concurrent modifications to this graph.
                        type: string
                      replicationFactor:
                        description: |
                          The replication factor used for every new collection in the graph.
                          For SatelliteGraphs, it is the string `"satellite"` (Enterprise Edition only).
                        type: integer
                      writeConcern:
                        description: |
                          The default write concern for new collections in the graph.
                          It determines how many copies of each shard are required to be
                          in sync on the different DB-Servers. If there are less than these many copies
                          in the cluster, a shard refuses to write. Writes to shards with enough
                          up-to-date copies succeed at the same time, however. The value of
                          `writeConcern` cannot be greater than `replicationFactor`.
                          For SatelliteGraphs, the `writeConcern` is automatically controlled to equal the
                          number of DB-Servers and the attribute is not available. _(cluster only)_
                        type: integer
                      isSmart:
                        description: |
                          Whether the graph is a SmartGraph (Enterprise Edition only).
                        type: boolean
                      isDisjoint:
                        description: |
                          Whether the graph is a Disjoint SmartGraph (Enterprise Edition only).
                        type: boolean
                      smartGraphAttribute:
                        description: |
                          Name of the sharding attribute in the SmartGraph case (Enterprise Edition only).
                        type: string
                      isSatellite:
                        description: |
                          Flag if the graph is a SatelliteGraph (Enterprise Edition only) or not.
                        type: boolean
        '400':
          description: |
            Returned if the new edge definition is ill-formed and cannot be used.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 400
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '403':
          description: |
            Returned if your user has insufficient rights.
            In order to drop a vertex, you need to have at least the following privileges:
            - `Administrate` access on the database.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 403
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '404':
          description: |
            Returned if no graph with this name can be found, or if no edge definition
            with this name is found in the graph.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 404
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
      tags:
        - Graphs
```

**Examples**

```curl
---
description: ''
name: HttpGharialReplaceEdgeCol
---
var examples = require("@arangodb/graph-examples/example-graph.js");
examples.dropGraph("social");
examples.loadGraph("social");
var url = "/_api/gharial/social/edge/relation";
body = {
  collection: "relation",
  from: ["female", "male", "animal"],
  to: ["female", "male", "animal"]
};
var response = logCurlRequest('PUT', url, body);

assert(response.code === 202);

logJsonResponse(response);
examples.dropGraph("social");
```

### Remove an edge definition

```openapi
paths:
  /_api/gharial/{graph}/edge/{collection}:
    delete:
      operationId: deleteEdgeDefinition
      description: |
        Remove one edge definition from the graph. This only removes the
        edge collection from the graph definition. The vertex collections of the
        edge definition become orphan collections but otherwise remain untouched
        and can still be used in your queries.
      parameters:
        - name: graph
          in: path
          required: true
          description: |
            The name of the graph.
          schema:
            type: string
        - name: collection
          in: path
          required: true
          description: |
            The name of the edge collection used in the edge definition.
          schema:
            type: string
        - name: waitForSync
          in: query
          required: false
          description: |
            Define if the request should wait until synced to disk.
          schema:
            type: boolean
        - name: dropCollections
          in: query
          required: false
          description: |
            Drop the collection as well.
            The collection is only dropped if it is not used in other graphs.
          schema:
            type: boolean
      responses:
        '201':
          description: |
            Returned if the edge definition can be removed from the graph
            and `waitForSync` is `true`.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - graph
                properties:
                  error:
                    description: |
                      A flag indicating that no error occurred.
                    type: boolean
                    example: false
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 201
                  graph:
                    description: |
                      The information about the modified graph.
                    type: object
                    required:
                      - name
                      - edgeDefinitions
                      - orphanCollections
                      - numberOfShards
                      - _id
                      - _rev
                      - replicationFactor
                      - isSmart
                      - isDisjoint
                      - isSatellite
                    properties:
                      name:
                        description: |
                          The name of the graph.
                        type: string
                      edgeDefinitions:
                        description: |
                          An array of definitions for the relations of the graph.
                          Each has the following type:
                        type: array
                        items:
                          type: object
                          required:
                            - collection
                            - from
                            - to
                          properties:
                            collection:
                              description: |
                                Name of the edge collection, where the edges are stored in.
                              type: string
                            from:
                              description: |
                                List of vertex collection names.
                                Edges in collection can only be inserted if their _from is in any of the collections here.
                              type: array
                              items:
                                type: string
                            to:
                              description: |
                                List of vertex collection names.

                                Edges in collection can only be inserted if their _to is in any of the collections here.
                              type: array
                              items:
                                type: string
                      orphanCollections:
                        description: |
                          An array of additional vertex collections.
                          Documents in these collections do not have edges within this graph.
                        type: array
                        items:
                          type: string
                      numberOfShards:
                        description: |
                          Number of shards created for every new collection in the graph.
                        type: integer
                      _id:
                        description: |
                          The internal id value of this graph.
                        type: string
                      _rev:
                        description: |
                          The revision of this graph. Can be used to make sure to not override
                          concurrent modifications to this graph.
                        type: string
                      replicationFactor:
                        description: |
                          The replication factor used for every new collection in the graph.
                          For SatelliteGraphs, it is the string `"satellite"` (Enterprise Edition only).
                        type: integer
                      writeConcern:
                        description: |
                          The default write concern for new collections in the graph.
                          It determines how many copies of each shard are required to be
                          in sync on the different DB-Servers. If there are less than these many copies
                          in the cluster, a shard refuses to write. Writes to shards with enough
                          up-to-date copies succeed at the same time, however. The value of
                          `writeConcern` cannot be greater than `replicationFactor`.
                          For SatelliteGraphs, the `writeConcern` is automatically controlled to equal the
                          number of DB-Servers and the attribute is not available. _(cluster only)_
                        type: integer
                      isSmart:
                        description: |
                          Whether the graph is a SmartGraph (Enterprise Edition only).
                        type: boolean
                      isDisjoint:
                        description: |
                          Whether the graph is a Disjoint SmartGraph (Enterprise Edition only).
                        type: boolean
                      smartGraphAttribute:
                        description: |
                          Name of the sharding attribute in the SmartGraph case (Enterprise Edition only).
                        type: string
                      isSatellite:
                        description: |
                          Flag if the graph is a SatelliteGraph (Enterprise Edition only) or not.
                        type: boolean
        '202':
          description: |
            Returned if the edge definition can be removed from the graph and
            `waitForSync` is `false`.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - graph
                properties:
                  error:
                    description: |
                      A flag indicating that no error occurred.
                    type: boolean
                    example: false
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 202
                  graph:
                    description: |
                      The information about the modified graph.
                    type: object
                    required:
                      - name
                      - edgeDefinitions
                      - orphanCollections
                      - numberOfShards
                      - _id
                      - _rev
                      - replicationFactor
                      - isSmart
                      - isDisjoint
                      - isSatellite
                    properties:
                      name:
                        description: |
                          The name of the graph.
                        type: string
                      edgeDefinitions:
                        description: |
                          An array of definitions for the relations of the graph.
                          Each has the following type:
                        type: array
                        items:
                          type: object
                          required:
                            - collection
                            - from
                            - to
                          properties:
                            collection:
                              description: |
                                Name of the edge collection, where the edges are stored in.
                              type: string
                            from:
                              description: |
                                List of vertex collection names.
                                Edges in collection can only be inserted if their _from is in any of the collections here.
                              type: array
                              items:
                                type: string
                            to:
                              description: |
                                List of vertex collection names.

                                Edges in collection can only be inserted if their _to is in any of the collections here.
                              type: array
                              items:
                                type: string
                      orphanCollections:
                        description: |
                          An array of additional vertex collections.
                          Documents in these collections do not have edges within this graph.
                        type: array
                        items:
                          type: string
                      numberOfShards:
                        description: |
                          Number of shards created for every new collection in the graph.
                        type: integer
                      _id:
                        description: |
                          The internal id value of this graph.
                        type: string
                      _rev:
                        description: |
                          The revision of this graph. Can be used to make sure to not override
                          concurrent modifications to this graph.
                        type: string
                      replicationFactor:
                        description: |
                          The replication factor used for every new collection in the graph.
                          For SatelliteGraphs, it is the string `"satellite"` (Enterprise Edition only).
                        type: integer
                      writeConcern:
                        description: |
                          The default write concern for new collections in the graph.
                          It determines how many copies of each shard are required to be
                          in sync on the different DB-Servers. If there are less than these many copies
                          in the cluster, a shard refuses to write. Writes to shards with enough
                          up-to-date copies succeed at the same time, however. The value of
                          `writeConcern` cannot be greater than `replicationFactor`.
                          For SatelliteGraphs, the `writeConcern` is automatically controlled to equal the
                          number of DB-Servers and the attribute is not available. _(cluster only)_
                        type: integer
                      isSmart:
                        description: |
                          Whether the graph is a SmartGraph (Enterprise Edition only).
                        type: boolean
                      isDisjoint:
                        description: |
                          Whether the graph is a Disjoint SmartGraph (Enterprise Edition only).
                        type: boolean
                      smartGraphAttribute:
                        description: |
                          Name of the sharding attribute in the SmartGraph case (Enterprise Edition only).
                        type: string
                      isSatellite:
                        description: |
                          Flag if the graph is a SatelliteGraph (Enterprise Edition only) or not.
                        type: boolean
        '403':
          description: |
            Returned if your user has insufficient rights.
            In order to drop a vertex, you need to have at least the following privileges:
            - `Administrate` access on the database.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 403
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '404':
          description: |
            Returned if no graph with this name can be found,
            or if no edge definition with this name is found in the graph.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 404
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
      tags:
        - Graphs
```

**Examples**

```curl
---
description: ''
name: HttpGharialEdgeDefinitionRemove
---
var examples = require("@arangodb/graph-examples/example-graph.js");
examples.dropGraph("social");
examples.loadGraph("social");
var url = "/_api/gharial/social/edge/relation";
var response = logCurlRequest('DELETE', url);

assert(response.code === 202);

logJsonResponse(response);
db._drop("relation");
examples.dropGraph("social");
```

## Vertices

### Create a vertex

```openapi
paths:
  /_api/gharial/{graph}/vertex/{collection}:
    post:
      operationId: createVertex
      description: |
        Adds a vertex to the given collection.
      parameters:
        - name: graph
          in: path
          required: true
          description: |
            The name of the graph.
          schema:
            type: string
        - name: collection
          in: path
          required: true
          description: |
            The name of the vertex collection the vertex should be inserted into.
          schema:
            type: string
        - name: waitForSync
          in: query
          required: false
          description: |
            Define if the request should wait until synced to disk.
          schema:
            type: boolean
        - name: returnNew
          in: query
          required: false
          description: |
            Define if the response should contain the complete
            new version of the document.
          schema:
            type: boolean
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required:
                - vertex
              properties:
                vertex:
                  description: |
                    The body has to be the JSON object to be stored.
                  type: object
      responses:
        '201':
          description: |
            Returned if the vertex can be added and `waitForSync` is `true`.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - vertex
                properties:
                  error:
                    description: |
                      A flag indicating that no error occurred.
                    type: boolean
                    example: false
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 201
                  vertex:
                    description: |
                      The internal attributes for the vertex.
                    type: object
                    required:
                      - _id
                      - _key
                      - _rev
                    properties:
                      _id:
                        description: |
                          The _id value of the stored data.
                        type: string
                      _key:
                        description: |
                          The _key value of the stored data.
                        type: string
                      _rev:
                        description: |
                          The _rev value of the stored data.
                        type: string
                  new:
                    description: |
                      The complete newly written vertex document.
                      Includes all written attributes in the request body
                      and all internal attributes generated by ArangoDB.
                      Only present if `returnNew` is `true`.
                    type: object
                    required:
                      - _id
                      - _key
                      - _rev
                    properties:
                      _id:
                        description: |
                          The _id value of the stored data.
                        type: string
                      _key:
                        description: |
                          The _key value of the stored data.
                        type: string
                      _rev:
                        description: |
                          The _rev value of the stored data.
                        type: string
        '202':
          description: |
            Returned if the request was successful but `waitForSync` is `false`.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - vertex
                properties:
                  error:
                    description: |
                      A flag indicating that no error occurred.
                    type: boolean
                    example: false
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 202
                  vertex:
                    description: |
                      The internal attributes generated while storing the vertex.
                      Does not include any attribute given in request body.
                    type: object
                    required:
                      - _id
                      - _key
                      - _rev
                    properties:
                      _id:
                        description: |
                          The _id value of the stored data.
                        type: string
                      _key:
                        description: |
                          The _key value of the stored data.
                        type: string
                      _rev:
                        description: |
                          The _rev value of the stored data.
                        type: string
                  new:
                    description: |
                      The complete newly written vertex document.
                      Includes all written attributes in the request body
                      and all internal attributes generated by ArangoDB.
                      Only present if `returnNew` is `true`.
                    type: object
                    required:
                      - _id
                      - _key
                      - _rev
                    properties:
                      _id:
                        description: |
                          The _id value of the stored data.
                        type: string
                      _key:
                        description: |
                          The _key value of the stored data.
                        type: string
                      _rev:
                        description: |
                          The _rev value of the stored data.
                        type: string
        '403':
          description: |
            Returned if your user has insufficient rights.
            In order to insert vertices into the graph, you need to have at least the following privileges:
            - `Read Only` access on the database.
            - `Write` access on the given collection.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 403
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '404':
          description: |
            Returned if no graph with this name can be found.
            Or if a graph is found but this collection is not part of the graph.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 404
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
      tags:
        - Graphs
```

**Examples**

```curl
---
description: ''
name: HttpGharialAddVertex
---
var examples = require("@arangodb/graph-examples/example-graph.js");
examples.dropGraph("social");
examples.loadGraph("social");
var url = "/_api/gharial/social/vertex/male";
body = {
  name: "Francis"
}
var response = logCurlRequest('POST', url, body);

assert(response.code === 202);

logJsonResponse(response);
examples.dropGraph("social");
```

### Get a vertex

```openapi
paths:
  /_api/gharial/{graph}/vertex/{collection}/{vertex}:
    get:
      operationId: getVertex
      description: |
        Gets a vertex from the given collection.
      parameters:
        - name: graph
          in: path
          required: true
          description: |
            The name of the graph.
          schema:
            type: string
        - name: collection
          in: path
          required: true
          description: |
            The name of the vertex collection the vertex belongs to.
          schema:
            type: string
        - name: vertex
          in: path
          required: true
          description: |
            The `_key` attribute of the vertex.
          schema:
            type: string
        - name: rev
          in: query
          required: false
          description: |
            Must contain a revision.
            If this is set a document is only returned if
            it has exactly this revision.
            Also see if-match header as an alternative to this.
          schema:
            type: string
        - name: if-match
          in: header
          required: false
          description: |
            If the "If-Match" header is given, then it must contain exactly one ETag. The document is returned,
            if it has the same revision as the given ETag. Otherwise a HTTP 412 is returned. As an alternative
            you can supply the ETag in an query parameter `rev`.
          schema:
            type: string
        - name: if-none-match
          in: header
          required: false
          description: |
            If the "If-None-Match" header is given, then it must contain exactly one ETag. The document is returned,
            only if it has a different revision as the given ETag. Otherwise a HTTP 304 is returned.
          schema:
            type: string
      responses:
        '200':
          description: |
            Returned if the vertex can be found.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - vertex
                properties:
                  error:
                    description: |
                      A flag indicating that no error occurred.
                    type: boolean
                    example: false
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 200
                  vertex:
                    description: |
                      The complete vertex.
                    type: object
                    required:
                      - _id
                      - _key
                      - _rev
                    properties:
                      _id:
                        description: |
                          The _id value of the stored data.
                        type: string
                      _key:
                        description: |
                          The _key value of the stored data.
                        type: string
                      _rev:
                        description: |
                          The _rev value of the stored data.
                        type: string
        '304':
          description: |
            Returned if the if-none-match header is given and the
            currently stored vertex still has this revision value.
            So there was no update between the last time the vertex
            was fetched by the caller.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 304
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '403':
          description: |
            Returned if your user has insufficient rights.
            In order to update vertices in the graph, you need to have at least the following privileges:
            - `Read Only` access on the database.
            - `Read Only` access on the given collection.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 403
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '404':
          description: |
            Returned in the following cases:
            - No graph with this name could be found.
            - This collection is not part of the graph.
            - The vertex does not exist.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 404
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '412':
          description: |
            Returned if if-match header is given, but the stored documents revision is different.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 412
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
      tags:
        - Graphs
```

**Examples**

```curl
---
description: ''
name: HttpGharialGetVertex
---
var examples = require("@arangodb/graph-examples/example-graph.js");
examples.dropGraph("social");
examples.loadGraph("social");
var url = "/_api/gharial/social/vertex/female/alice";
var response = logCurlRequest('GET', url);

assert(response.code === 200);

logJsonResponse(response);
examples.dropGraph("social");
```

### Update a vertex

```openapi
paths:
  /_api/gharial/{graph}/vertex/{collection}/{vertex}:
    patch:
      operationId: updateVertex
      description: |
        Updates the data of the specific vertex in the collection.
      parameters:
        - name: graph
          in: path
          required: true
          description: |
            The name of the graph.
          schema:
            type: string
        - name: collection
          in: path
          required: true
          description: |
            The name of the vertex collection the vertex belongs to.
          schema:
            type: string
        - name: vertex
          in: path
          required: true
          description: |
            The `_key` attribute of the vertex.
          schema:
            type: string
        - name: waitForSync
          in: query
          required: false
          description: |
            Define if the request should wait until synced to disk.
          schema:
            type: boolean
        - name: keepNull
          in: query
          required: false
          description: |
            Define if values set to `null` should be stored.
            By default (`true`), the given documents attribute(s) are set to `null`.
            If this parameter is set to `false`, top-level attribute and sub-attributes with
            a `null` value in the request are removed from the document (but not attributes
            of objects that are nested inside of arrays).
          schema:
            type: boolean
        - name: returnOld
          in: query
          required: false
          description: |
            Define if a presentation of the deleted document should
            be returned within the response object.
          schema:
            type: boolean
        - name: returnNew
          in: query
          required: false
          description: |
            Define if a presentation of the new document should
            be returned within the response object.
          schema:
            type: boolean
        - name: if-match
          in: header
          required: false
          description: |
            If the "If-Match" header is given, then it must contain exactly one ETag. The document is updated,
            if it has the same revision as the given ETag. Otherwise a HTTP 412 is returned. As an alternative
            you can supply the ETag in an attribute rev in the URL.
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required:
                - vertex
              properties:
                vertex:
                  description: |
                    The body has to contain a JSON object containing exactly the attributes that should be overwritten, all other attributes remain unchanged.
                  type: object
      responses:
        '200':
          description: |
            Returned if the vertex can be updated, and `waitForSync` is `true`.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - vertex
                properties:
                  error:
                    description: |
                      A flag indicating that no error occurred.
                    type: boolean
                    example: false
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 200
                  vertex:
                    description: |
                      The internal attributes for the vertex.
                    type: object
                    required:
                      - _id
                      - _key
                      - _rev
                    properties:
                      _id:
                        description: |
                          The _id value of the stored data.
                        type: string
                      _key:
                        description: |
                          The _key value of the stored data.
                        type: string
                      _rev:
                        description: |
                          The _rev value of the stored data.
                        type: string
                  new:
                    description: |
                      The complete newly written vertex document.
                      Includes all written attributes in the request body
                      and all internal attributes generated by ArangoDB.
                      Only present if `returnNew` is `true`.
                    type: object
                    required:
                      - _id
                      - _key
                      - _rev
                    properties:
                      _id:
                        description: |
                          The _id value of the stored data.
                        type: string
                      _key:
                        description: |
                          The _key value of the stored data.
                        type: string
                      _rev:
                        description: |
                          The _rev value of the stored data.
                        type: string
                  old:
                    description: |
                      The complete overwritten vertex document.
                      Includes all attributes stored before this operation.
                      Only present if `returnOld` is `true`.
                    type: object
                    required:
                      - _id
                      - _key
                      - _rev
                    properties:
                      _id:
                        description: |
                          The _id value of the stored data.
                        type: string
                      _key:
                        description: |
                          The _key value of the stored data.
                        type: string
                      _rev:
                        description: |
                          The _rev value of the stored data.
                        type: string
        '202':
          description: |
            Returned if the request was successful, and `waitForSync` is `false`.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - vertex
                properties:
                  error:
                    description: |
                      A flag indicating that no error occurred.
                    type: boolean
                    example: false
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 202
                  vertex:
                    description: |
                      The internal attributes for the vertex.
                    type: object
                    required:
                      - _id
                      - _key
                      - _rev
                    properties:
                      _id:
                        description: |
                          The _id value of the stored data.
                        type: string
                      _key:
                        description: |
                          The _key value of the stored data.
                        type: string
                      _rev:
                        description: |
                          The _rev value of the stored data.
                        type: string
                  new:
                    description: |
                      The complete newly written vertex document.
                      Includes all written attributes in the request body
                      and all internal attributes generated by ArangoDB.
                      Only present if `returnNew` is `true`.
                    type: object
                    required:
                      - _id
                      - _key
                      - _rev
                    properties:
                      _id:
                        description: |
                          The _id value of the stored data.
                        type: string
                      _key:
                        description: |
                          The _key value of the stored data.
                        type: string
                      _rev:
                        description: |
                          The _rev value of the stored data.
                        type: string
                  old:
                    description: |
                      The complete overwritten vertex document.
                      Includes all attributes stored before this operation.
                      Only present if `returnOld` is `true`.
                    type: object
                    required:
                      - _id
                      - _key
                      - _rev
                    properties:
                      _id:
                        description: |
                          The _id value of the stored data.
                        type: string
                      _key:
                        description: |
                          The _key value of the stored data.
                        type: string
                      _rev:
                        description: |
                          The _rev value of the stored data.
                        type: string
        '403':
          description: |
            Returned if your user has insufficient rights.
            In order to update vertices in the graph, you need to have at least the following privileges:
            - `Read Only` access on the database.
            - `Write` access on the given collection.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 403
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '404':
          description: |
            Returned in the following cases:
            - No graph with this name can be found.
            - This collection is not part of the graph.
            - The vertex to update does not exist.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 404
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '412':
          description: |
            Returned if if-match header is given, but the stored documents revision is different.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 412
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
      tags:
        - Graphs
```

**Examples**

```curl
---
description: ''
name: HttpGharialModifyVertex
---
var examples = require("@arangodb/graph-examples/example-graph.js");
examples.dropGraph("social");
examples.loadGraph("social");
body = {
  age: 26
}
var url = "/_api/gharial/social/vertex/female/alice";
var response = logCurlRequest('PATCH', url, body);

assert(response.code === 202);

logJsonResponse(response);
examples.dropGraph("social");
```

### Replace a vertex

```openapi
paths:
  /_api/gharial/{graph}/vertex/{collection}/{vertex}:
    put:
      operationId: replaceVertex
      description: |
        Replaces the data of a vertex in the collection.
      parameters:
        - name: graph
          in: path
          required: true
          description: |
            The name of the graph.
          schema:
            type: string
        - name: collection
          in: path
          required: true
          description: |
            The name of the vertex collection the vertex belongs to.
          schema:
            type: string
        - name: vertex
          in: path
          required: true
          description: |
            The `_key` attribute of the vertex.
          schema:
            type: string
        - name: waitForSync
          in: query
          required: false
          description: |
            Define if the request should wait until synced to disk.
          schema:
            type: boolean
        - name: keepNull
          in: query
          required: false
          description: |
            Define if values set to `null` should be stored.
            By default (`true`), the given documents attribute(s) are set to `null`.
            If this parameter is set to `false`, top-level attribute and sub-attributes with
            a `null` value in the request are removed from the document (but not attributes
            of objects that are nested inside of arrays).
          schema:
            type: boolean
        - name: returnOld
          in: query
          required: false
          description: |
            Define if a presentation of the deleted document should
            be returned within the response object.
          schema:
            type: boolean
        - name: returnNew
          in: query
          required: false
          description: |
            Define if a presentation of the new document should
            be returned within the response object.
          schema:
            type: boolean
        - name: if-match
          in: header
          required: false
          description: |
            If the "If-Match" header is given, then it must contain exactly one ETag. The document is updated,
            if it has the same revision as the given ETag. Otherwise a HTTP 412 is returned. As an alternative
            you can supply the ETag in an attribute rev in the URL.
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required:
                - vertex
              properties:
                vertex:
                  description: |
                    The body has to be the JSON object to be stored.
                  type: object
      responses:
        '200':
          description: |
            Returned if the vertex can be replaced, and `waitForSync` is `true`.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - vertex
                properties:
                  error:
                    description: |
                      A flag indicating that no error occurred.
                    type: boolean
                    example: false
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 200
                  vertex:
                    description: |
                      The internal attributes for the vertex.
                    type: object
                    required:
                      - _id
                      - _key
                      - _rev
                    properties:
                      _id:
                        description: |
                          The _id value of the stored data.
                        type: string
                      _key:
                        description: |
                          The _key value of the stored data.
                        type: string
                      _rev:
                        description: |
                          The _rev value of the stored data.
                        type: string
                  new:
                    description: |
                      The complete newly written vertex document.
                      Includes all written attributes in the request body
                      and all internal attributes generated by ArangoDB.
                      Only present if `returnNew` is `true`.
                    type: object
                    required:
                      - _id
                      - _key
                      - _rev
                    properties:
                      _id:
                        description: |
                          The _id value of the stored data.
                        type: string
                      _key:
                        description: |
                          The _key value of the stored data.
                        type: string
                      _rev:
                        description: |
                          The _rev value of the stored data.
                        type: string
                  old:
                    description: |
                      The complete overwritten vertex document.
                      Includes all attributes stored before this operation.
                      Only present if `returnOld` is `true`.
                    type: object
                    required:
                      - _id
                      - _key
                      - _rev
                    properties:
                      _id:
                        description: |
                          The _id value of the stored data.
                        type: string
                      _key:
                        description: |
                          The _key value of the stored data.
                        type: string
                      _rev:
                        description: |
                          The _rev value of the stored data.
                        type: string
        '202':
          description: |
            Returned if the vertex can be replaced, and `waitForSync` is `false`.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - vertex
                properties:
                  error:
                    description: |
                      A flag indicating that no error occurred.
                    type: boolean
                    example: false
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 202
                  vertex:
                    description: |
                      The internal attributes for the vertex.
                    type: object
                    required:
                      - _id
                      - _key
                      - _rev
                    properties:
                      _id:
                        description: |
                          The _id value of the stored data.
                        type: string
                      _key:
                        description: |
                          The _key value of the stored data.
                        type: string
                      _rev:
                        description: |
                          The _rev value of the stored data.
                        type: string
                  new:
                    description: |
                      The complete newly written vertex document.
                      Includes all written attributes in the request body
                      and all internal attributes generated by ArangoDB.
                      Only present if `returnNew` is `true`.
                    type: object
                    required:
                      - _id
                      - _key
                      - _rev
                    properties:
                      _id:
                        description: |
                          The _id value of the stored data.
                        type: string
                      _key:
                        description: |
                          The _key value of the stored data.
                        type: string
                      _rev:
                        description: |
                          The _rev value of the stored data.
                        type: string
                  old:
                    description: |
                      The complete overwritten vertex document.
                      Includes all attributes stored before this operation.
                      Only present if `returnOld` is `true`.
                    type: object
                    required:
                      - _id
                      - _key
                      - _rev
                    properties:
                      _id:
                        description: |
                          The _id value of the stored data.
                        type: string
                      _key:
                        description: |
                          The _key value of the stored data.
                        type: string
                      _rev:
                        description: |
                          The _rev value of the stored data.
                        type: string
        '403':
          description: |
            Returned if your user has insufficient rights.
            In order to replace vertices in the graph, you need to have at least the following privileges:
            - `Read Only` access on the database.
            - `Write` access on the given collection.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 403
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '404':
          description: |
            Returned in the following cases:
            - No graph with this name can be found.
            - This collection is not part of the graph.
            - The vertex to replace does not exist.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 404
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '412':
          description: |
            Returned if if-match header is given, but the stored documents revision is different.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 412
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
      tags:
        - Graphs
```

**Examples**

```curl
---
description: ''
name: HttpGharialReplaceVertex
---
var examples = require("@arangodb/graph-examples/example-graph.js");
examples.dropGraph("social");
examples.loadGraph("social");
body = {
  name: "Alice Cooper",
  age: 26
}
var url = "/_api/gharial/social/vertex/female/alice";
var response = logCurlRequest('PUT', url, body);

assert(response.code === 202);

logJsonResponse(response);
examples.dropGraph("social");
```

### Remove a vertex

```openapi
paths:
  /_api/gharial/{graph}/vertex/{collection}/{vertex}:
    delete:
      operationId: deleteVertex
      description: |
        Removes a vertex from the collection.
      parameters:
        - name: graph
          in: path
          required: true
          description: |
            The name of the graph.
          schema:
            type: string
        - name: collection
          in: path
          required: true
          description: |
            The name of the vertex collection the vertex belongs to.
          schema:
            type: string
        - name: vertex
          in: path
          required: true
          description: |
            The `_key` attribute of the vertex.
          schema:
            type: string
        - name: waitForSync
          in: query
          required: false
          description: |
            Define if the request should wait until synced to disk.
          schema:
            type: boolean
        - name: returnOld
          in: query
          required: false
          description: |
            Define if a presentation of the deleted document should
            be returned within the response object.
          schema:
            type: boolean
        - name: if-match
          in: header
          required: false
          description: |
            If the "If-Match" header is given, then it must contain exactly one ETag. The document is updated,
            if it has the same revision as the given ETag. Otherwise a HTTP 412 is returned. As an alternative
            you can supply the ETag in an attribute rev in the URL.
          schema:
            type: string
      responses:
        '200':
          description: |
            Returned if the vertex can be removed.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - removed
                properties:
                  error:
                    description: |
                      A flag indicating that no error occurred.
                    type: boolean
                    example: false
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 200
                  removed:
                    description: |
                      Is set to true if the remove was successful.
                    type: boolean
                  old:
                    description: |
                      The complete deleted vertex document.
                      Includes all attributes stored before this operation.
                      Only present if `returnOld` is `true`.
                    type: object
                    required:
                      - _id
                      - _key
                      - _rev
                    properties:
                      _id:
                        description: |
                          The _id value of the stored data.
                        type: string
                      _key:
                        description: |
                          The _key value of the stored data.
                        type: string
                      _rev:
                        description: |
                          The _rev value of the stored data.
                        type: string
        '202':
          description: |
            Returned if the request was successful but `waitForSync` is `false`.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - removed
                properties:
                  error:
                    description: |
                      A flag indicating that no error occurred.
                    type: boolean
                    example: false
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 202
                  removed:
                    description: |
                      Is set to true if the remove was successful.
                    type: boolean
                  old:
                    description: |
                      The complete deleted vertex document.
                      Includes all attributes stored before this operation.
                      Only present if `returnOld` is `true`.
                    type: object
                    required:
                      - _id
                      - _key
                      - _rev
                    properties:
                      _id:
                        description: |
                          The _id value of the stored data.
                        type: string
                      _key:
                        description: |
                          The _key value of the stored data.
                        type: string
                      _rev:
                        description: |
                          The _rev value of the stored data.
                        type: string
        '403':
          description: |
            Returned if your user has insufficient rights.
            In order to delete vertices in the graph, you need to have at least the following privileges:
            - `Read Only` access on the database.
            - `Write` access on the given collection.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 403
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '404':
          description: |
            Returned in the following cases:
            - No graph with this name can be found.
            - This collection is not part of the graph.
            - The vertex to remove does not exist.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 404
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '412':
          description: |
            Returned if if-match header is given, but the stored documents revision is different.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 412
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
      tags:
        - Graphs
```

**Examples**

```curl
---
description: ''
name: HttpGharialDeleteVertex
---
var examples = require("@arangodb/graph-examples/example-graph.js");
examples.dropGraph("social");
examples.loadGraph("social");
var url = "/_api/gharial/social/vertex/female/alice";
var response = logCurlRequest('DELETE', url);

assert(response.code === 202);

logJsonResponse(response);
examples.dropGraph("social");
```

## Edges

### Create an edge

```openapi
paths:
  /_api/gharial/{graph}/edge/{collection}:
    post:
      operationId: createEdge
      description: |
        Creates a new edge in the specified collection.
        Within the body the edge has to contain a `_from` and `_to` value referencing to valid vertices in the graph.
        Furthermore, the edge has to be valid according to the edge definitions.
      parameters:
        - name: graph
          in: path
          required: true
          description: |
            The name of the graph.
          schema:
            type: string
        - name: collection
          in: path
          required: true
          description: |
            The name of the edge collection the edge belongs to.
          schema:
            type: string
        - name: waitForSync
          in: query
          required: false
          description: |
            Define if the request should wait until synced to disk.
          schema:
            type: boolean
        - name: returnNew
          in: query
          required: false
          description: |
            Define if the response should contain the complete
            new version of the document.
          schema:
            type: boolean
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required:
                - _from
                - _to
              properties:
                _from:
                  description: |
                    The source vertex of this edge. Has to be valid within
                    the used edge definition.
                  type: string
                _to:
                  description: |
                    The target vertex of this edge. Has to be valid within
                    the used edge definition.
                  type: string
      responses:
        '201':
          description: |
            Returned if the edge can be created and `waitForSync` is `true`.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - edge
                properties:
                  error:
                    description: |
                      A flag indicating that no error occurred.
                    type: boolean
                    example: false
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 201
                  edge:
                    description: |
                      The internal attributes for the edge.
                    type: object
                    required:
                      - _id
                      - _key
                      - _rev
                      - _from
                      - _to
                    properties:
                      _id:
                        description: |
                          The _id value of the stored data.
                        type: string
                      _key:
                        description: |
                          The _key value of the stored data.
                        type: string
                      _rev:
                        description: |
                          The _rev value of the stored data.
                        type: string
                      _from:
                        description: |
                          The _from value of the stored data.
                        type: string
                      _to:
                        description: |
                          The _to value of the stored data.
                        type: string
                  new:
                    description: |
                      The complete newly written edge document.
                      Includes all written attributes in the request body
                      and all internal attributes generated by ArangoDB.
                      Only present if `returnNew` is `true`.
                    type: object
                    required:
                      - _id
                      - _key
                      - _rev
                      - _from
                      - _to
                    properties:
                      _id:
                        description: |
                          The _id value of the stored data.
                        type: string
                      _key:
                        description: |
                          The _key value of the stored data.
                        type: string
                      _rev:
                        description: |
                          The _rev value of the stored data.
                        type: string
                      _from:
                        description: |
                          The _from value of the stored data.
                        type: string
                      _to:
                        description: |
                          The _to value of the stored data.
                        type: string
        '202':
          description: |
            Returned if the request was successful but `waitForSync` is `false`.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - edge
                properties:
                  error:
                    description: |
                      A flag indicating that no error occurred.
                    type: boolean
                    example: false
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 202
                  edge:
                    description: |
                      The internal attributes for the edge.
                    type: object
                    required:
                      - _id
                      - _key
                      - _rev
                      - _from
                      - _to
                    properties:
                      _id:
                        description: |
                          The _id value of the stored data.
                        type: string
                      _key:
                        description: |
                          The _key value of the stored data.
                        type: string
                      _rev:
                        description: |
                          The _rev value of the stored data.
                        type: string
                      _from:
                        description: |
                          The _from value of the stored data.
                        type: string
                      _to:
                        description: |
                          The _to value of the stored data.
                        type: string
                  new:
                    description: |
                      The complete newly written edge document.
                      Includes all written attributes in the request body
                      and all internal attributes generated by ArangoDB.
                      Only present if `returnNew` is `true`.
                    type: object
                    required:
                      - _id
                      - _key
                      - _rev
                      - _from
                      - _to
                    properties:
                      _id:
                        description: |
                          The _id value of the stored data.
                        type: string
                      _key:
                        description: |
                          The _key value of the stored data.
                        type: string
                      _rev:
                        description: |
                          The _rev value of the stored data.
                        type: string
                      _from:
                        description: |
                          The _from value of the stored data.
                        type: string
                      _to:
                        description: |
                          The _to value of the stored data.
                        type: string
        '400':
          description: |
            Returned if the input document is invalid.
            This can for instance be the case if the `_from` or `_to` attribute is missing
            or malformed.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 400
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '403':
          description: |
            Returned if your user has insufficient rights.
            In order to insert edges into the graph, you need to have at least the following privileges:
            - `Read Only` access on the database.
            - `Write` access on the given collection.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 403
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '404':
          description: |
            Returned in any of the following cases:
            - No graph with this name can be found.
            - The edge collection is not part of the graph.
            - The vertex collection referenced in the `_from` or `_to` attribute is not part of the graph.
            - The vertex collection is part of the graph, but does not exist.
            - `_from` or `_to` vertex does not exist.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 404
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
      tags:
        - Graphs
```

**Examples**

```curl
---
description: ''
name: HttpGharialAddEdge
---
var examples = require("@arangodb/graph-examples/example-graph.js");
examples.dropGraph("social");
require("internal").db._drop("relation");
require("internal").db._drop("female");
require("internal").db._drop("male");
examples.loadGraph("social");
var url = "/_api/gharial/social/edge/relation";
body = {
  type: "friend",
  _from: "female/alice",
  _to: "female/diana"
};
var response = logCurlRequest('POST', url, body);

assert(response.code === 202);

logJsonResponse(response);
examples.dropGraph("social");
```

### Get an edge

```openapi
paths:
  /_api/gharial/{graph}/edge/{collection}/{edge}:
    get:
      operationId: getEdge
      description: |
        Gets an edge from the given collection.
      parameters:
        - name: graph
          in: path
          required: true
          description: |
            The name of the graph.
          schema:
            type: string
        - name: collection
          in: path
          required: true
          description: |
            The name of the edge collection the edge belongs to.
          schema:
            type: string
        - name: edge
          in: path
          required: true
          description: |
            The `_key` attribute of the edge.
          schema:
            type: string
        - name: rev
          in: query
          required: false
          description: |
            Must contain a revision.
            If this is set a document is only returned if
            it has exactly this revision.
            Also see if-match header as an alternative to this.
          schema:
            type: string
        - name: if-match
          in: header
          required: false
          description: |
            If the "If-Match" header is given, then it must contain exactly one ETag. The document is returned,
            if it has the same revision as the given ETag. Otherwise a HTTP 412 is returned. As an alternative
            you can supply the ETag in an attribute rev in the URL.
          schema:
            type: string
        - name: if-none-match
          in: header
          required: false
          description: |
            If the "If-None-Match" header is given, then it must contain exactly one ETag. The document is returned,
            only if it has a different revision as the given ETag. Otherwise a HTTP 304 is returned.
          schema:
            type: string
      responses:
        '200':
          description: |
            Returned if the edge can be found.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - edge
                properties:
                  error:
                    description: |
                      A flag indicating that no error occurred.
                    type: boolean
                    example: false
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 200
                  edge:
                    description: |
                      The complete edge.
                    type: object
                    required:
                      - _id
                      - _key
                      - _rev
                      - _from
                      - _to
                    properties:
                      _id:
                        description: |
                          The _id value of the stored data.
                        type: string
                      _key:
                        description: |
                          The _key value of the stored data.
                        type: string
                      _rev:
                        description: |
                          The _rev value of the stored data.
                        type: string
                      _from:
                        description: |
                          The _from value of the stored data.
                        type: string
                      _to:
                        description: |
                          The _to value of the stored data.
                        type: string
        '304':
          description: |
            Returned if the if-none-match header is given and the
            currently stored edge still has this revision value.
            So there was no update between the last time the edge
            was fetched by the caller.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 304
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '403':
          description: |
            Returned if your user has insufficient rights.
            In order to update vertices in the graph, you need to have at least the following privileges:
            - `Read Only` access on the database.
            - `Read Only` access on the given collection.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 403
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '404':
          description: |
            Returned in the following cases:
            - No graph with this name can be found.
            - This collection is not part of the graph.
            - The edge does not exist.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 404
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '412':
          description: |
            Returned if if-match header is given, but the stored documents revision is different.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 412
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
      tags:
        - Graphs
```

**Examples**

```curl
---
description: ''
name: HttpGharialGetEdge
---
var examples = require("@arangodb/graph-examples/example-graph.js");
examples.dropGraph("social");
examples.loadGraph("social");
var any = require("@arangodb").db.relation.any();
var url = "/_api/gharial/social/edge/relation/" + any._key;
var response = logCurlRequest('GET', url);

assert(response.code === 200);

logJsonResponse(response);
examples.dropGraph("social");
```

### Update an edge

```openapi
paths:
  /_api/gharial/{graph}/edge/{collection}/{edge}:
    patch:
      operationId: updateEdge
      description: |
        Partially modify the data of the specific edge in the collection.
      parameters:
        - name: graph
          in: path
          required: true
          description: |
            The name of the graph.
          schema:
            type: string
        - name: collection
          in: path
          required: true
          description: |
            The name of the edge collection the edge belongs to.
          schema:
            type: string
        - name: edge
          in: path
          required: true
          description: |
            The `_key` attribute of the vertex.
          schema:
            type: string
        - name: waitForSync
          in: query
          required: false
          description: |
            Define if the request should wait until synced to disk.
          schema:
            type: boolean
        - name: keepNull
          in: query
          required: false
          description: |
            Define if values set to `null` should be stored.
            By default (`true`), the given documents attribute(s) are set to `null`.
            If this parameter is set to `false`, top-level attribute and sub-attributes with
            a `null` value in the request are removed from the document (but not attributes
            of objects that are nested inside of arrays).
          schema:
            type: boolean
        - name: returnOld
          in: query
          required: false
          description: |
            Define if a presentation of the deleted document should
            be returned within the response object.
          schema:
            type: boolean
        - name: returnNew
          in: query
          required: false
          description: |
            Define if a presentation of the new document should
            be returned within the response object.
          schema:
            type: boolean
        - name: if-match
          in: header
          required: false
          description: |
            If the "If-Match" header is given, then it must contain exactly one ETag. The document is updated,
            if it has the same revision as the given ETag. Otherwise a HTTP 412 is returned. As an alternative
            you can supply the ETag in an attribute rev in the URL.
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required:
                - edge
              properties:
                edge:
                  description: |
                    The body has to contain a JSON object containing exactly the attributes that should be overwritten, all other attributes remain unchanged.
                  type: object
      responses:
        '200':
          description: |
            Returned if the edge can be updated, and `waitForSync` is `false`.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - edge
                properties:
                  error:
                    description: |
                      A flag indicating that no error occurred.
                    type: boolean
                    example: false
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 200
                  edge:
                    description: |
                      The internal attributes for the edge.
                    type: object
                    required:
                      - _id
                      - _key
                      - _rev
                      - _from
                      - _to
                    properties:
                      _id:
                        description: |
                          The _id value of the stored data.
                        type: string
                      _key:
                        description: |
                          The _key value of the stored data.
                        type: string
                      _rev:
                        description: |
                          The _rev value of the stored data.
                        type: string
                      _from:
                        description: |
                          The _from value of the stored data.
                        type: string
                      _to:
                        description: |
                          The _to value of the stored data.
                        type: string
                  new:
                    description: |
                      The complete newly written edge document.
                      Includes all written attributes in the request body
                      and all internal attributes generated by ArangoDB.
                      Only present if `returnNew` is `true`.
                    type: object
                    required:
                      - _id
                      - _key
                      - _rev
                      - _from
                      - _to
                    properties:
                      _id:
                        description: |
                          The _id value of the stored data.
                        type: string
                      _key:
                        description: |
                          The _key value of the stored data.
                        type: string
                      _rev:
                        description: |
                          The _rev value of the stored data.
                        type: string
                      _from:
                        description: |
                          The _from value of the stored data.
                        type: string
                      _to:
                        description: |
                          The _to value of the stored data.
                        type: string
                  old:
                    description: |
                      The complete overwritten edge document.
                      Includes all attributes stored before this operation.
                      Only present if `returnOld` is `true`.
                    type: object
                    required:
                      - _id
                      - _key
                      - _rev
                      - _from
                      - _to
                    properties:
                      _id:
                        description: |
                          The _id value of the stored data.
                        type: string
                      _key:
                        description: |
                          The _key value of the stored data.
                        type: string
                      _rev:
                        description: |
                          The _rev value of the stored data.
                        type: string
                      _from:
                        description: |
                          The _from value of the stored data.
                        type: string
                      _to:
                        description: |
                          The _to value of the stored data.
                        type: string
        '202':
          description: |
            Returned if the request was successful but `waitForSync` is `false`.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - edge
                properties:
                  error:
                    description: |
                      A flag indicating that no error occurred.
                    type: boolean
                    example: false
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 202
                  edge:
                    description: |
                      The internal attributes for the edge.
                    type: object
                    required:
                      - _id
                      - _key
                      - _rev
                      - _from
                      - _to
                    properties:
                      _id:
                        description: |
                          The _id value of the stored data.
                        type: string
                      _key:
                        description: |
                          The _key value of the stored data.
                        type: string
                      _rev:
                        description: |
                          The _rev value of the stored data.
                        type: string
                      _from:
                        description: |
                          The _from value of the stored data.
                        type: string
                      _to:
                        description: |
                          The _to value of the stored data.
                        type: string
                  new:
                    description: |
                      The complete newly written edge document.
                      Includes all written attributes in the request body
                      and all internal attributes generated by ArangoDB.
                      Only present if `returnNew` is `true`.
                    type: object
                    required:
                      - _id
                      - _key
                      - _rev
                      - _from
                      - _to
                    properties:
                      _id:
                        description: |
                          The _id value of the stored data.
                        type: string
                      _key:
                        description: |
                          The _key value of the stored data.
                        type: string
                      _rev:
                        description: |
                          The _rev value of the stored data.
                        type: string
                      _from:
                        description: |
                          The _from value of the stored data.
                        type: string
                      _to:
                        description: |
                          The _to value of the stored data.
                        type: string
                  old:
                    description: |
                      The complete overwritten edge document.
                      Includes all attributes stored before this operation.
                      Only present if `returnOld` is `true`.
                    type: object
                    required:
                      - _id
                      - _key
                      - _rev
                      - _from
                      - _to
                    properties:
                      _id:
                        description: |
                          The _id value of the stored data.
                        type: string
                      _key:
                        description: |
                          The _key value of the stored data.
                        type: string
                      _rev:
                        description: |
                          The _rev value of the stored data.
                        type: string
                      _from:
                        description: |
                          The _from value of the stored data.
                        type: string
                      _to:
                        description: |
                          The _to value of the stored data.
                        type: string
        '403':
          description: |
            Returned if your user has insufficient rights.
            In order to update edges in the graph, you need to have at least the following privileges:
            - `Read Only` access on the database.
            - `Write` access on the given collection.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 403
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '404':
          description: |
            Returned in the following cases:
            - No graph with this name can be found.
            - This collection is not part of the graph.
            - The edge to update does not exist.
            - Either `_from` or `_to` vertex does not exist (if updated).
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 404
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '412':
          description: |
            Returned if if-match header is given, but the stored documents revision is different.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 412
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
      tags:
        - Graphs
```

**Examples**

```curl
---
description: ''
name: HttpGharialPatchEdge
---
var examples = require("@arangodb/graph-examples/example-graph.js");
examples.dropGraph("social");
examples.loadGraph("social");
var any = require("@arangodb").db.relation.any();
var url = "/_api/gharial/social/edge/relation/" + any._key;
body = {
  since: "01.01.2001"
}
var response = logCurlRequest('PATCH', url, body);
assert(response.code === 202);

logJsonResponse(response);
examples.dropGraph("social");
```

### Replace an edge

```openapi
paths:
  /_api/gharial/{graph}/edge/{collection}/{edge}:
    put:
      operationId: replaceEdge
      description: |
        Replaces the data of an edge in the collection.
      parameters:
        - name: graph
          in: path
          required: true
          description: |
            The name of the graph.
          schema:
            type: string
        - name: collection
          in: path
          required: true
          description: |
            The name of the edge collection the edge belongs to.
          schema:
            type: string
        - name: edge
          in: path
          required: true
          description: |
            The `_key` attribute of the vertex.
          schema:
            type: string
        - name: waitForSync
          in: query
          required: false
          description: |
            Define if the request should wait until synced to disk.
          schema:
            type: boolean
        - name: keepNull
          in: query
          required: false
          description: |
            Define if values set to `null` should be stored.
            By default (`true`), the given documents attribute(s) are set to `null`.
            If this parameter is set to `false`, top-level attribute and sub-attributes with
            a `null` value in the request are removed from the document (but not attributes
            of objects that are nested inside of arrays).
          schema:
            type: boolean
        - name: returnOld
          in: query
          required: false
          description: |
            Define if a presentation of the deleted document should
            be returned within the response object.
          schema:
            type: boolean
        - name: returnNew
          in: query
          required: false
          description: |
            Define if a presentation of the new document should
            be returned within the response object.
          schema:
            type: boolean
        - name: if-match
          in: header
          required: false
          description: |
            If the "If-Match" header is given, then it must contain exactly one ETag. The document is updated,
            if it has the same revision as the given ETag. Otherwise a HTTP 412 is returned. As an alternative
            you can supply the ETag in an attribute rev in the URL.
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required:
                - _from
                - _to
              properties:
                _from:
                  description: |
                    The source vertex of this edge. Has to be valid within
                    the used edge definition.
                  type: string
                _to:
                  description: |
                    The target vertex of this edge. Has to be valid within
                    the used edge definition.
                  type: string
      responses:
        '201':
          description: |
            Returned if the request was successful but `waitForSync` is `true`.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - edge
                properties:
                  error:
                    description: |
                      A flag indicating that no error occurred.
                    type: boolean
                    example: false
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 201
                  edge:
                    description: |
                      The internal attributes for the edge
                    type: object
                    required:
                      - _id
                      - _key
                      - _rev
                      - _from
                      - _to
                    properties:
                      _id:
                        description: |
                          The _id value of the stored data.
                        type: string
                      _key:
                        description: |
                          The _key value of the stored data.
                        type: string
                      _rev:
                        description: |
                          The _rev value of the stored data.
                        type: string
                      _from:
                        description: |
                          The _from value of the stored data.
                        type: string
                      _to:
                        description: |
                          The _to value of the stored data.
                        type: string
                  new:
                    description: |
                      The complete newly written edge document.
                      Includes all written attributes in the request body
                      and all internal attributes generated by ArangoDB.
                      Only present if `returnNew` is `true`.
                    type: object
                    required:
                      - _id
                      - _key
                      - _rev
                      - _from
                      - _to
                    properties:
                      _id:
                        description: |
                          The _id value of the stored data.
                        type: string
                      _key:
                        description: |
                          The _key value of the stored data.
                        type: string
                      _rev:
                        description: |
                          The _rev value of the stored data.
                        type: string
                      _from:
                        description: |
                          The _from value of the stored data.
                        type: string
                      _to:
                        description: |
                          The _to value of the stored data.
                        type: string
                  old:
                    description: |
                      The complete overwritten edge document.
                      Includes all attributes stored before this operation.
                      Only present if `returnOld` is `true`.
                    type: object
                    required:
                      - _id
                      - _key
                      - _rev
                      - _from
                      - _to
                    properties:
                      _id:
                        description: |
                          The _id value of the stored data.
                        type: string
                      _key:
                        description: |
                          The _key value of the stored data.
                        type: string
                      _rev:
                        description: |
                          The _rev value of the stored data.
                        type: string
                      _from:
                        description: |
                          The _from value of the stored data.
                        type: string
                      _to:
                        description: |
                          The _to value of the stored data.
                        type: string
        '202':
          description: |
            Returned if the request was successful but `waitForSync` is `false`.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - edge
                properties:
                  error:
                    description: |
                      A flag indicating that no error occurred.
                    type: boolean
                    example: false
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 202
                  edge:
                    description: |
                      The internal attributes for the edge
                    type: object
                    required:
                      - _id
                      - _key
                      - _rev
                      - _from
                      - _to
                    properties:
                      _id:
                        description: |
                          The _id value of the stored data.
                        type: string
                      _key:
                        description: |
                          The _key value of the stored data.
                        type: string
                      _rev:
                        description: |
                          The _rev value of the stored data.
                        type: string
                      _from:
                        description: |
                          The _from value of the stored data.
                        type: string
                      _to:
                        description: |
                          The _to value of the stored data.
                        type: string
                  new:
                    description: |
                      The complete newly written edge document.
                      Includes all written attributes in the request body
                      and all internal attributes generated by ArangoDB.
                      Only present if `returnNew` is `true`.
                    type: object
                    required:
                      - _id
                      - _key
                      - _rev
                      - _from
                      - _to
                    properties:
                      _id:
                        description: |
                          The _id value of the stored data.
                        type: string
                      _key:
                        description: |
                          The _key value of the stored data.
                        type: string
                      _rev:
                        description: |
                          The _rev value of the stored data.
                        type: string
                      _from:
                        description: |
                          The _from value of the stored data.
                        type: string
                      _to:
                        description: |
                          The _to value of the stored data.
                        type: string
                  old:
                    description: |
                      The complete overwritten edge document.
                      Includes all attributes stored before this operation.
                      Only present if `returnOld` is `true`.
                    type: object
                    required:
                      - _id
                      - _key
                      - _rev
                      - _from
                      - _to
                    properties:
                      _id:
                        description: |
                          The _id value of the stored data.
                        type: string
                      _key:
                        description: |
                          The _key value of the stored data.
                        type: string
                      _rev:
                        description: |
                          The _rev value of the stored data.
                        type: string
                      _from:
                        description: |
                          The _from value of the stored data.
                        type: string
                      _to:
                        description: |
                          The _to value of the stored data.
                        type: string
        '403':
          description: |
            Returned if your user has insufficient rights.
            In order to replace edges in the graph, you need to have at least the following privileges:
            - `Read Only` access on the database.
            - `Write` access on the given collection.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 403
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '404':
          description: |
            Returned in the following cases:
            - No graph with this name can be found.
            - This collection is not part of the graph.
            - The edge to replace does not exist.
            - Either `_from` or `_to` vertex does not exist.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 404
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '412':
          description: |
            Returned if if-match header is given, but the stored documents revision is different.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 412
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
      tags:
        - Graphs
```

**Examples**

```curl
---
description: ''
name: HttpGharialPutEdge
---
var examples = require("@arangodb/graph-examples/example-graph.js");
examples.dropGraph("social");
examples.loadGraph("social");
var any = require("@arangodb").db.relation.any();
var url = "/_api/gharial/social/edge/relation/" + any._key;
body = {
  type: "divorced",
  _from: "female/alice",
  _to: "male/bob"
}
var response = logCurlRequest('PUT', url, body);

assert(response.code === 202);

logJsonResponse(response);
examples.dropGraph("social");
```

### Remove an edge

```openapi
paths:
  /_api/gharial/{graph}/edge/{collection}/{edge}:
    delete:
      operationId: deleteEdge
      description: |
        Removes an edge from the collection.
      parameters:
        - name: graph
          in: path
          required: true
          description: |
            The name of the graph.
          schema:
            type: string
        - name: collection
          in: path
          required: true
          description: |
            The name of the edge collection the edge belongs to.
          schema:
            type: string
        - name: edge
          in: path
          required: true
          description: |
            The `_key` attribute of the edge.
          schema:
            type: string
        - name: waitForSync
          in: query
          required: false
          description: |
            Define if the request should wait until synced to disk.
          schema:
            type: boolean
        - name: returnOld
          in: query
          required: false
          description: |
            Define if a presentation of the deleted document should
            be returned within the response object.
          schema:
            type: boolean
        - name: if-match
          in: header
          required: false
          description: |
            If the "If-Match" header is given, then it must contain exactly one ETag. The document is updated,
            if it has the same revision as the given ETag. Otherwise a HTTP 412 is returned. As an alternative
            you can supply the ETag in an attribute rev in the URL.
          schema:
            type: string
      responses:
        '200':
          description: |
            Returned if the edge can be removed.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - removed
                properties:
                  error:
                    description: |
                      A flag indicating that no error occurred.
                    type: boolean
                    example: false
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 200
                  removed:
                    description: |
                      Is set to true if the remove was successful.
                    type: boolean
                  old:
                    description: |
                      The complete deleted edge document.
                      Includes all attributes stored before this operation.
                      Only present if `returnOld` is `true`.
                    type: object
                    required:
                      - _id
                      - _key
                      - _rev
                      - _from
                      - _to
                    properties:
                      _id:
                        description: |
                          The _id value of the stored data.
                        type: string
                      _key:
                        description: |
                          The _key value of the stored data.
                        type: string
                      _rev:
                        description: |
                          The _rev value of the stored data.
                        type: string
                      _from:
                        description: |
                          The _from value of the stored data.
                        type: string
                      _to:
                        description: |
                          The _to value of the stored data.
                        type: string
        '202':
          description: |
            Returned if the request was successful but `waitForSync` is `false`.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - removed
                properties:
                  error:
                    description: |
                      A flag indicating that no error occurred.
                    type: boolean
                    example: false
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 202
                  removed:
                    description: |
                      Is set to true if the remove was successful.
                    type: boolean
                  old:
                    description: |
                      The complete deleted edge document.
                      Includes all attributes stored before this operation.
                      Only present if `returnOld` is `true`.
                    type: object
                    required:
                      - _id
                      - _key
                      - _rev
                      - _from
                      - _to
                    properties:
                      _id:
                        description: |
                          The _id value of the stored data.
                        type: string
                      _key:
                        description: |
                          The _key value of the stored data.
                        type: string
                      _rev:
                        description: |
                          The _rev value of the stored data.
                        type: string
                      _from:
                        description: |
                          The _from value of the stored data.
                        type: string
                      _to:
                        description: |
                          The _to value of the stored data.
                        type: string
        '403':
          description: |
            Returned if your user has insufficient rights.
            In order to delete vertices in the graph, you need to have at least the following privileges:
            - `Read Only` access on the database.
            - `Write` access on the given collection.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 403
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '404':
          description: |
            Returned in the following cases:
            - No graph with this name can be found.
            - This collection is not part of the graph.
            - The edge to remove does not exist.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 404
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '412':
          description: |
            Returned if if-match header is given, but the stored documents revision is different.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 412
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
      tags:
        - Graphs
```

**Examples**

```curl
---
description: ''
name: HttpGharialDeleteEdge
---
var examples = require("@arangodb/graph-examples/example-graph.js");
examples.dropGraph("social");
examples.loadGraph("social");
var any = require("@arangodb").db.relation.any();
var url = "/_api/gharial/social/edge/relation/" + any._key;
var response = logCurlRequest('DELETE', url);

assert(response.code === 202);

logJsonResponse(response);
examples.dropGraph("social");
```
