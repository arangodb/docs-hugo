---
title: Graph Analytics
menuTitle: Graph Analytics
weight: 123
description: |
  ArangoGraph offers Graph Analytics Engines to run graph algorithms on your
  data separately from your ArangoDB deployments
---
Graph analytics is branch of data science that deals with analyzing information
networks known as graphs, and extracting information from the data relationships.
It ranges from basic measures that characterize graphs to complex algorithms
such as page rank. Common use cases include fraud detection, recommender systems,
and network flow analysis.

ArangoDB offers an experimental feature for running algorithms on your graph data,
called Graph Analytics Engines (GAEs). It is available on request for the
[ArangoGraph Insights Platform](https://dashboard.arangodb.cloud/home?utm_source=docs&utm_medium=cluster_pages&utm_campaign=docs_traffic)
and free of charge during the beta phase. Your ArangoDB deployment needs to use
AWS as the provider.

Key features:

- **Separation of storage and compute**: GAEs are a solution that lets you run
  graph analytics independent of your ArangoDB deployments on dedicated machines
  optimized for compute tasks. This separation of OLAP and OLTP workloads avoids
  affecting the performance of the transaction-oriented database systems.

- **Fast data loading**: You can easily and efficiently import graph data from
  ArangoDB and export results back to ArangoDB.

- **In-memory processing**: All imported data is held and processed in the
  main memory of the compute machines for very fast execution of graph algorithms
  such as connected components, label propagation, and PageRank.

## Workflow

The following lists outlines how you can use Graph Analytics Engines (GAEs).
How to perform the steps is detailed in the subsequent sections.

0. Request beta access to the feature via __Request help__ in the
   ArangoGraph dashboard.
1. Determine the approximate size of the data that you will load into the GAE
   to select an engine size with sufficient memory. The data as well as the
   temporarily needed space for computations and results needs to fit in memory.
2. Deploy an engine of the desired size and of type `gral`. It only takes a few
   seconds until the engine can be used. The engine runs adjacent to a particular
   ArangoGraph deployment.
3. Load graph data from ArangoDB into the engine. You can load named graphs or
   sets of vertex and edge collections. This loads the edge information and a
   configurable subset of the vertex attributes.
4. Run graph algorithms on the data. You only need to load the data once per
   engine and can then run various algorithms with different settings.
5. Write the computation results back to ArangoDB.
6. Delete the engine once you are done.

## Authentication

The [Management API](#management-api) for deploying and deleting engines requires
an ArangoGraph **API key**. See
[Generating an API Key](../arangograph/api/get-started.md#generating-an-api-key)
on how to create one.

You then need to generate an **access token** using the API key. See
[Authenticating with Oasisctl](../arangograph/api/get-started.md#authenticating-with-oasisctl)
on how to do so using `oasisctl login`.

The [Engine API](#engine-api) uses one of two authentication methods, depending
on the [__auto login to database UI__](../arangograph/deployments/_index.md#auto-login-to-database-ui)
setting in ArangoGraph:
- **Enabled**: You can use an ArangoGraph access token created with an API key
  (see above), allowing you to use one token for both the Management API and
  the Engine API.
- **Disabled**: You need use an JWT user token created from ArangoDB credentials.
  These session tokens need to be renewed every hour by default. See
  [HTTP API Authentication](../develop/http-api/authentication.md#jwt-user-tokens)
  for details.

## Management API

You can save an ArangoGraph access token created with `oasisctl login` in a
variable to ease scripting. Note that this should be the token string only and
not include quote marks. The following examples assume Bash as the shell and
that the `curl` and `jq` commands are available.

```bash
ARANGO_GRAPH_TOKEN="$(oasisctl login --key-id "<AG_KEY_ID>" --key-secret "<AG_KEY_SECRET>" | jq -r '.jwt')"
```

To determine the base URL of the management API, use the ArangoGraph dashboard
and copy the __APPLICATION ENDPOINT__ of the deployment that holds the graph data
you want to analyze. Replace the port with `8829` and append
`/graph-analytics/api/graphanalytics/v1`, e.g.
`https://123456abcdef.arangodb.cloud:8829/graph-analytics/api/graphanalytics/v1`.

Store the base URL in a variable called `BASE_URL`:

```bash
BASE_URL='https://...'
```

To authenticate requests, you need to use the following HTTP header:

```
Authorization: bearer <ARANGO_GRAPH_TOKEN>
```

For example, with cURL and using the token variable:

```bash
curl -H "Authorization: bearer $ARANGO_GRAPH_TOKEN" "$BASE_URL/api-version"
```

### Get the API version

`GET <BASE_URL>/api-version`

```bash
curl -H "Authorization: bearer $ARANGO_GRAPH_TOKEN" "$BASE_URL/api-version"
```

### List engine sizes

`GET <BASE_URL>/enginesizes`

List the available engine sizes, starting at 4 GiB of memory (`e4`).

```bash
curl -H "Authorization: bearer $ARANGO_GRAPH_TOKEN" "$BASE_URL/enginesizes"
```

### List engine types

`GET <BASE_URL>/enginetypes`

List the available engine types. The only type supported for GAE workloads is
called `gral`.

```bash
curl -H "Authorization: bearer $ARANGO_GRAPH_TOKEN" "$BASE_URL/enginetypes"
```

### Deploy an engine

`POST <BASE_URL>/engines`

Set up a GAE adjacent to the ArangoGraph deployment, for example, using an
engine size of `e4`.

```bash
curl -H "Authorization: bearer $ARANGO_GRAPH_TOKEN" -X POST -d '{"type_id":"gral","size_id":"e4"}' "$BASE_URL/engines"
```

### List all engines

`GET <BASE_URL>/engines`

List all deployed GAEs of a ArangoGraph deployment.

```bash
curl -H "Authorization: bearer $ARANGO_GRAPH_TOKEN" "$BASE_URL/engines"
```

### Get an engine

`GET <BASE_URL>/engines/<ENGINE_ID>`

List the detailed information about a specific GAE.

```bash
ENGINE_ID="zYxWvU9876"
curl -H "Authorization: bearer $ARANGO_GRAPH_TOKEN" "$BASE_URL/engines/$ENGINE_ID"
```

### Delete an engine

`DELETE <BASE_URL>/engines/<ENGINE_ID>`

Delete a no longer needed GAE, freeing any data it holds in memory.

```bash
ENGINE_ID="zYxWvU9876"
curl -H "Authorization: bearer $ARANGO_GRAPH_TOKEN" -X DELETE "$BASE_URL/engines/$ENGINE_ID"
```

## Engine API

To determine the base URL of the engine API, use the ArangoGraph dashboard
and copy the __APPLICATION ENDPOINT__ of the deployment that holds the graph data
you want to analyze. Replace the port with `8829` and append
`/graph-analytics/engines/<ENGINE_ID>`, e.g.
`https://<123456abcdef>.arangodb.cloud:8829/graph-analytics/engines/zYxWvU9876`.

Store the base URL in a variable called `ENGINE_URL`:

```bash
ENGINE_URL='https://...'
```

To authenticate requests, you need to use a bearer token in HTTP header:
```
Authorization: bearer <TOKEN>
```

- If __Auto login to database UI__ is enabled for the ArangoGraph deployment,
  this can be the same access token as used for the management API.
- If it is disabled, use an ArangoDB session token (JWT user token) instead.

You can save the token in a variable to ease scripting. Note that this should be
the token string only and not include quote marks. The following examples assume
Bash as the shell and that the `curl` and `jq` commands are available.

An example of authenticating a request using cURL and a session token:

```bash
APPLICATION_ENDPOINT="https://123456abcdef.arangodb.cloud:8529"

ADB_TOKEN=$(curl -X POST -d "{\"username\":\"<ADB_USER>\",\"password\":\"<ADB_PASS>\"}" "$APPLICATION_ENDPOINT/_open/auth" | jq -r '.jwt')

curl -H "Authorization: bearer $ADB_TOKEN" "$ENGINE_URL/v1/jobs"
```

All requests to the engine API queue jobs, each representing an operation.
You can check the progress of operations and check if errors occurred.

You can find the API reference documentation with detailed descriptions of the
request and response data structures at <https://arangodb.github.io/graph-analytics>.

### Load data

`POST <ENGINE_URL>/v1/loaddata`

Import graph data from a database of the ArangoDB deployment. You can import
named graphs as well as sets of vertex and edge collections (see
[Managed and unmanaged graphs](../graphs/_index.md#managed-and-unmanaged-graphs)).

```bash
curl -H "Authorization: bearer $ADB_TOKEN" -XPOST -d '{"database":"_system","graph_name":"connectedComponentsGraph"}' "$ENGINE_URL/v1/loaddata"
```

### Run algorithms

#### PageRank

`POST <ENGINE_URL>/v1/pagerank`

PageRank is a well known algorithm to rank vertices in a graph: the more
important a vertex, the higher rank it gets. It goes back to L. Page and S. Brin's
[paper](http://infolab.stanford.edu/pub/papers/google.pdf) and
is used to rank pages in in search engines (hence the name). The algorithm runs
until the execution converges. To specify a custom threshold, use the `threshold`
parameter; to run for a fixed number of iterations, use the `maximum_supersteps` parameter.

The rank of a vertex is a positive real number. The algorithm starts with every
vertex having the same rank (one divided by the number of vertices) and sends its
rank to its out-neighbors. The computation proceeds in iterations. In each iteration,
the new rank is computed according to the formula
`(0.15/total number of vertices) + (0.85 * the sum of all incoming ranks)`.
The value sent to each of the out-neighbors is the new rank divided by the number
of those neighbors, thus every out-neighbor gets the same part of the new rank.

The algorithm stops when at least one of the two conditions is satisfied:
- The maximum number of iterations is reached. This is the same `maximum_supersteps`
  parameter as for the other algorithms.
- Every vertex changes its rank in the last iteration by less than a certain
  threshold. The default threshold is  0.00001, a custom value can be set with
  the `threshold` parameter.

<!-- TODO: is threshold the same as damping_factor? -->

Result: rank

Parameters:
- `graph_id`
- `damping_factor`
- `maximum_supersteps`

#### Seeded PageRank

It is possible to specify an initial distribution for the vertex documents in
your graph. To define these seed ranks / centralities, you can specify a
`seeding_attribute` in the properties for this algorithm. If the specified field is
set on a document _and_ the value is numeric, then it is used instead of
the default initial rank of `1 / numVertices`.

Result: rank

Parameters:
- `graph_id`
- `damping_factor`
- `maximum_supersteps`
- `seeding_attribute`

#### Single-Source Shortest Path

Calculates the distances, that is, the lengths of shortest paths from the
given source to all other vertices, called _targets_. The result is written
to the specified property of the respective target.
The distance to the source vertex itself is returned as `0` and a length above
`9007199254740991` (max safe integer) means that there is no path from the
source to the vertex in the graph.

The algorithm runs until all distances are computed. The number of iterations is bounded by the
diameter of your graph (the longest distance between two vertices).

A call of the algorithm requires the `source_vertex` parameter whose value is the
document ID of the source vertex.

Result: distance

Parameters:
- `graph_id`
- `source_vertex`
- `undirected`

#### Weakly Connected Components (WCC)

A _weakly connected component_ in a directed graph is a maximal subgraph such
that there is a path between each pair of vertices where we can walk also
against the direction of edges. More formally, it is a connected component
(see the definition above) in the underlying undirected graph, i.e., in the
undirected graph obtained by adding an edge from vertex B to vertex A (if it
does not already exist), if there is an edge from vertex A to vertex B.

The result is a component ID for each vertex. All vertices from the same component
obtain the same component ID, every two vertices from different components
obtain different IDs.

Result: component ID

Parameters:
- `graph_id`

#### Strongly Connected Components (SCC)

A _strongly connected component_ is a maximal subgraph, where for every two
vertices, there is a path from one of them to the other. It is thus defined as a
weakly connected component, but one is not allowed to run against the edge
directions.

The algorithm is more complex than the WCC algorithm and, in general, requires
more memory. <!-- TODO: does this still apply? -->

The result is a component ID for each vertex. All vertices from the same component
obtain the same component ID, every two vertices from different components
obtain different IDs.

Result: component ID

Parameters:

- `graph_id`

#### Vertex Centrality

Centrality measures help identify the most important vertices in a graph.
They can be used in a wide range of applications:
to identify influencers in social networks, or middlemen in terrorist
networks.

There are various definitions for centrality, the simplest one being the
vertex degree. These definitions were not designed with scalability in mind.
It is probably impossible to discover an efficient algorithm which computes
them in a distributed way. Fortunately there are scalable substitutions
available, which should be equally usable for most use cases.

![Illustration of an execution of different centrality measures (Freeman 1977)](../../../images/centrality_visual.png)

Parameters:
- `graph_id`
- `k` (number of start vertices, 0 = all)
- `undirected`
- `normalized`
- `parallelism`

#### Effective Closeness

A common definitions of centrality is the **closeness centrality**
(or closeness). The closeness of a vertex in a graph is the inverse average
length of the shortest path between the vertex and all other vertices.
For vertices *x*, *y* and shortest distance `d(y, x)` it is defined as:

![Vertex Closeness Formula](../../../images/closeness.png)

Effective Closeness approximates the closeness measure. The algorithm works by
iteratively estimating the number of shortest paths passing through each vertex.
The score approximates the real closeness score, since it is not possible
to actually count all shortest paths due to the horrendous `O(n^2 * d)` memory
requirements. The algorithm is from the paper
*Centralities in Large Networks: Algorithms and Observations (U Kang et.al. 2011)*.

ArangoDBs implementation approximates the number of shortest path in each
iteration by using a HyperLogLog counter with 64 buckets. This should work well
on large graphs and on smaller ones as well. The memory requirements should be
**O(n * d)** where *n* is the number of vertices and *d* the diameter of your
graph. Each vertex stores a counter for each iteration of the algorithm.

Result: closeness

Parameters:
- `graph_id`

#### LineRank

Another common measure is the [*betweenness* centrality](https://en.wikipedia.org/wiki/Betweenness_centrality):
It measures the number of times a vertex is part of shortest paths between any
pairs of vertices. For a vertex *v* betweenness is defined as:

![Vertex Betweenness Formula](../../../images/betweenness.png)

Where the &sigma; represents the number of shortest paths between *x* and *y*,
and &sigma;(v) represents the number of paths also passing through a vertex *v*.
By intuition a vertex with higher betweenness centrality has more
information passing through it.

**LineRank** approximates the random walk betweenness of every vertex in a
graph. This is the probability that someone, starting on an arbitrary vertex,
visits this node when they randomly choose edges to visit.

The algorithm essentially builds a line graph out of your graph
(switches the vertices and edges), and then computes a score similar to PageRank.
This can be considered a scalable equivalent to vertex betweenness, which can
be executed distributedly in ArangoDB. The algorithm is from the paper
*Centralities in Large Networks: Algorithms and Observations (U Kang et.al. 2011)*.

Result: line rank

Parameters:
- `graph_id`
- `damping_factor`
- `maximum_supersteps`

#### Community Detection

Graphs based on real world networks often have a community structure.
This means it is possible to find groups of vertices such that each vertex
group is internally more densely connected than outside the group.
This has many applications when you want to analyze your networks, for example
Social networks include community groups (the origin of the term, in fact)
based on common location, interests, occupation, etc.

##### Label Propagation

*Label Propagation* can be used to implement community detection on large
graphs. The algorithm assigns a community, more precisely, a Community ID 
(a natural number), to every vertex in the graph. 
The idea is that each vertex should be in the community that most of
its neighbors are in. 

At first, the algorithm assigns unique initial Community IDs to the vertices. 
The assignment is deterministic given the graph and the distribution of vertices
on the shards, but there is no guarantee that a vertex obtains
the same initial ID in two different runs of the algorithm, even if the graph does not change 
(because the sharding may change). Moreover, there is no guarantee on a particular
distribution of the initial IDs over the vertices.

Then, in each iteration, a vertex sends its current Community
ID to all its neighbor vertices. After that each vertex adopts the Community ID it
received most frequently in the last step. 

Note that, in a usual implementation of Label Propagation, if there are
multiple most frequently received Community IDs, one is chosen randomly.
An advantage of our implementation is that this choice is deterministic.
This comes for the price that the choice rules are somewhat involved: 
If a vertex obtains only one ID and the ID of the vertex from the previous step,
its old ID, is less than the obtained ID, the old ID is kept. 
(IDs are numbers and thus comparable to each other.) If a vertex obtains
more than one ID, its new ID is the lowest ID among the most frequently 
obtained IDs. (For example, if the obtained IDs are 1, 2, 2, 3, 3,
then 2 is the new ID.) If, however, no ID arrives more than once, the new ID is
the minimum of the lowest obtained IDs and the old ID. (For example, if the
old ID is 5 and the obtained IDs are 3, 4, 6, then the new ID is 3. 
If the old ID is 2, it is kept.) 

If a vertex keeps its ID 20 times or more in a row, it does not send its ID.
Vertices that did not obtain any IDs do not update their ID and do not send it.

The algorithm runs until it converges, which likely never really happens on
large graphs. Therefore you need to specify a maximum iteration bound.
The default bound is 500 iterations, which is too large for
common applications. 

The algorithm should work best on undirected graphs. On directed
graphs, the resulting partition into communities might change, if the number 
of performed steps changes. How strong the dependence is
may be influenced by the density of the graph.

Result: community ID

Parameters:
- `graph_id`
- `start_label_attribute`
- `synchronous`
- `random_tiebreak`
- `maximum_supersteps`

##### Speaker-Listener Label Propagation

The [Speaker-listener Label Propagation](https://arxiv.org/pdf/1109.5720.pdf)
(SLPA) can be used to implement community detection. It works similar to the
label propagation algorithm, but now every node additionally accumulates a
memory of observed labels (instead of forgetting all but one label).

Before the algorithm run, every vertex is initialized with an unique ID
(the initial community label).
During the run three steps are executed for each vertex:

1. Current vertex is the listener, all other vertices are speakers.
2. Each speaker sends out a label from memory, we send out a random label with a
   probability proportional to the number of times the vertex observed the label.
3. The listener remembers one of the labels, we always choose the most
   frequently observed label.

Result: community ID

Parameters:
- `graph_id`

<!-- TODO: max communities?
You can also execute SLPA with the `maxCommunities` parameter to limit the
number of output communities. Internally the algorithm still keeps the
memory of all labels, but the output is reduced to just the `n` most frequently
observed labels.
-->

<!-- TODO: anything else to integrate into new text?
The following API calls are available, all start with the `BASE_URL` from above:

 - `GET $BASE_URL/api-version`: return a JSON document describing the API version
 - `GET $BASE_URL/enginetypes`: return a JSON document describing the available
   GAE types, currently, there is only one called `gral` available
 - `GET $BASE_URL/enginesizes`: return a JSON document describing the available
   GAE sizes, currently, there are a certain number of choices available,
   which basically choose the number of cores and the size of the RAM
 - `GET $BASE_URL/engines`: return a list of currently deployed GAEs for this
   database deployment
 - `GET $BASE_URL/engine/<id>`: return information about a specific GAE
 - `POST $BASE_URL/engines` with a body like this:

```json
{"type_id":"gral", "size_id": "e32"}'
```

   This will deploy an engine of type `gral` with size `e32`, which means
   32 GB of RAM and 8 cores.

 - `DELETE $BASE_URL/engine/<id>`: undeploy (delete) a specific GAE

All these API calls can be executed conveniently with the provided `gae` shell script. Just set the environment variables `ARANGO_GRAPH_TOKEN` to the access token described above and `DEPLOYMENT_URL` to the URL of your deployment (leaving out the port part :8529).

## Interacting with a running GAE

You can access a running GAE via API calls to ArangoGraph which are forwarded to the respective GAE. Here the authentication depends on the database deployment mode.

### Authentication

In ArangoGraph there are two modes, in which your database deployment can be:

 1. Platform authentication switched on.
 2. Platform authentication switched off.

The authentication for API calls to the GAE works differently for these two
cases.

In Case 1. you have to give the exact same authorization header [as above](#platform-authentication) with an ArangoGraph access token. The platform will automatically
verify the validity of the token and, if authenticated, will change
the authorization header on the fly to provide one with a JWT token,
which the GAE can use to access the database deployment! This means
in particular, that the GAE will have the access permissions of the
ArangoGraph platform user, which also exists as an ArangoDB user in the
database deployment!

In Case 2. you have to directly provide a valid JWT user token from the ArangoDB server (`POST /_open/auth`) in the
`Authorization` header, for some user which is configured in the
database deployment. See [JWT user tokens](../develop/http-api/authentication.md#jwt-user-tokens) on how to acquire it. Then, the authorization header for the API calls need to be
```
Authorization: bearer $JWT_TOKEN
```

### Base URL

To access a running engine, you need the engine url. You get this url via the `GET $BASE_URL/engine/<id>` ArangoGraph request described in the [deployment api](#deploy-api), under `status` and `endpoint` entry. Let's call this
```
export ENGINE_URL
```
-->

### Store job results

You need to specify to which ArangoDB `database` and `target_collection` to save
the results to. They need to exist already.

You also need to specify a list of `job_ids` with one or more jobs that have run
graph algorithms.

Each algorithm outputs one value for each vertex, and you can define the target
attribute to store the information in with `attribute_names`. It has to be a
list with one attribute name for every job in the `job_ids` list.

You can optionally set the degree of `parallelism` and the `batch_size` for
saving the data.

### List all jobs

`GET <ENGINE_URL>/v1/jobs`

List all active and finished jobs.

```bash
curl -H "Authorization: bearer $ADB_TOKEN" "$ENGINE_URL/v1/jobs"
```

### Get a job

`GET <ENGINE_URL>/v1/jobs/<JOB_ID>`

Get detailed information about a specific job.

```bash
JOB_ID="123"
curl -H "Authorization: bearer $ADB_TOKEN" "$ENGINE_URL/v1/jobs/$JOB_ID"
```
