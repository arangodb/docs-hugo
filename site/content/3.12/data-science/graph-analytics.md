---
title: Graph Analytics
menuTitle: Graph Analytics
weight: 123
description: |
  ArangoGraph offers Graph Analytics Engines to run graph algorithms on your
  data separately from your ArangoDB deployments
---
Graph analytics is a branch of data science that deals with analyzing information
networks known as graphs, and extracting information from the data relationships.
It ranges from basic measures that characterize graphs, over PageRank, to complex
algorithms. Common use cases include fraud detection, recommender systems,
and network flow analysis.

ArangoDB offers a feature for running algorithms on your graph data,
called Graph Analytics Engines (GAEs). It is available on request for the
[ArangoGraph Insights Platform](https://dashboard.arangodb.cloud/home?utm_source=docs&utm_medium=cluster_pages&utm_campaign=docs_traffic).

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

{{< info >}}
Before you can use Graph Analytics Engines, you need to request the feature
via __Request help__ in the ArangoGraph dashboard for a deployment.

The deployment needs to use **AWS** as the cloud provider.
{{< /info >}}

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
- **Disabled**: You need use a JWT user token created from ArangoDB credentials.
  These session tokens need to be renewed every hour by default. See
  [HTTP API Authentication](../develop/http-api/authentication.md#jwt-user-tokens)
  for details.

## Management API

You can save an ArangoGraph access token created with `oasisctl login` in a
variable to ease scripting. Note that this should be the token string only and
not include quote marks. The following examples assume Bash as the shell and
that the `curl` and `jq` commands are available.

```bash
ARANGO_GRAPH_TOKEN="$(oasisctl login --key-id "<AG_KEY_ID>" --key-secret "<AG_KEY_SECRET>")"
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

Request and response payloads are JSON-encoded in the management API.

### Get the API version

`GET <BASE_URL>/api-version`

Retrieve the version information of the management API.

```bash
curl -H "Authorization: bearer $ARANGO_GRAPH_TOKEN" "$BASE_URL/api-version"
```

### List engine sizes

`GET <BASE_URL>/enginesizes`

List the available engine sizes, which is a combination of the number of cores
and the size of the RAM, starting at 1 CPU and 4 GiB of memory (`e4`).

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

All requests to the engine API start jobs, each representing an operation.
You can check the progress of operations and check if errors occurred.
You can submit jobs concurrently and they also run concurrently.

You can find the API reference documentation with detailed descriptions of the
request and response data structures at <https://arangodb.github.io/graph-analytics>.

Request and response payloads are JSON-encoded in the engine API.

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
until the execution converges. To run for a fixed number of iterations, use the
`maximum_supersteps` parameter.

The rank of a vertex is a positive real number. The algorithm starts with every
vertex having the same rank (one divided by the number of vertices) and sends its
rank to its out-neighbors. The computation proceeds in iterations. In each iteration,
the new rank is computed according to the formula
`( (1 - damping_factor) / total number of vertices) + (damping_factor * the sum of all incoming ranks)`.
The value sent to each of the out-neighbors is the new rank divided by the number
of those neighbors, thus every out-neighbor gets the same part of the new rank.

The algorithm stops when at least one of the two conditions is satisfied:
- The maximum number of iterations is reached. This is the same `maximum_supersteps`
  parameter as for the other algorithms.
- Every vertex changes its rank in the last iteration by less than a certain
  threshold. The threshold is hardcoded to `0.0000001`.

It is possible to specify an initial distribution for the vertex documents in
your graph. To define these seed ranks / centralities, you can specify a
`seeding_attribute` in the properties for this algorithm. If the specified field is
set on a document _and_ the value is numeric, then it is used instead of
the default initial rank of `1 / numVertices`.

Parameters:
- `graph_id`
- `damping_factor`
- `maximum_supersteps`
- `seeding_attribute` (optional, for seeded PageRank)

Result: the rank of each vertex

```bash
GRAPH_ID="234"
curl -H "Authorization: bearer $ADB_TOKEN" -XPOST -d "{\"graph_id\":$GRAPH_ID,\"damping_factor\":0.85,\"maximum_supersteps\":500,\"seeding_attribute\":\"seed_attr\"}" "$ENGINE_URL/v1/pagerank"
```

#### Single-Source Shortest Path (SSSP)

`POST <ENGINE_URL>/v1/single_source_shortest_path`

The algorithm computes the shortest path from a given source vertex to all other
vertices and returns the length of this path (distance). The algorithm returns a
distance of `-1` for a vertex that cannot be reached from the source, and `0`
for the source vertex itself.

Parameters:
- `graph_id`
- `source_vertex`: The document ID of the source vertex.
- `undirected`: Determines whether the algorithm respects the direction of edges.

Result: the distance of each vertex to the `source_vertex`

```bash
GRAPH_ID="234"
curl -H "Authorization: bearer $ADB_TOKEN" -XPOST -d "{\"graph_id\":$GRAPH_ID,\"source_vertex\":\"vertex/345\",\"undirected\":false}" "$ENGINE_URL/v1/single_source_shortest_path"
```

#### Weakly Connected Components (WCC)

`POST <ENGINE_URL>/v1/wcc`

The weakly connected component algorithm determines all disjoint groups of
vertices that are connected by at least one edge, ignoring edge directions.

In other words, each weakly connected component is a maximal subgraph such that
there is a path between each pair of vertices where one can also follow edges
against their direction in a directed graph.

Parameters:
- `graph_id`

Result: a component ID for each vertex. All vertices from the same component
obtain the same component ID, every two vertices from different components
obtain different IDs.

```bash
GRAPH_ID="234"
curl -H "Authorization: bearer $ADB_TOKEN" -XPOST -d "{\"graph_id\":$GRAPH_ID}" "$ENGINE_URL/v1/wcc"
```

#### Strongly Connected Components (SCC)

`POST <ENGINE_URL>/v1/scc`

The strongly connected components algorithm determines all groups of vertices
with mutual reachability within a directed graph, i.e. there exists a directed
path between every pair of vertices in both directions.

In other words, a strongly connected component is a maximal subgraph, where for
every two vertices, there is a path from one of them to the other, forming a
cycle. In contrast to a weakly connected component, one cannot follow edges
against their directions.

Parameters:

- `graph_id`

Result: a component ID for each vertex. All vertices from the same component
obtain the same component ID, every two vertices from different components
obtain different IDs.

```bash
GRAPH_ID="234"
curl -H "Authorization: bearer $ADB_TOKEN" -XPOST -d "{\"graph_id\":$GRAPH_ID}" "$ENGINE_URL/v1/scc"
```

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

![Illustration of an execution of different centrality measures (Freeman 1977)](../../images/centrality_visual.png)

##### Betweenness Centrality 

`POST <ENGINE_URL>/v1/betweennesscentrality`

A relatively expensive algorithm with complexity `O(V*E)` where `V` is the
number of vertices and `E` is the number of edges in the graph.

Betweenness-centrality can be approximated by cheaper algorithms like
Line Rank but this algorithm strives to compute accurate centrality measures.

Parameters:
- `graph_id`
- `k` (number of start vertices, 0 = all)
- `undirected`
- `normalized`
- `parallelism`

Result: a centrality measure for each vertex

```bash
GRAPH_ID="234"
curl -H "Authorization: bearer $ADB_TOKEN" -XPOST -d "{\"graph_id\":$GRAPH_ID,\"k\":0,\"undirected\":false,\"normalized\":true}" "$ENGINE_URL/v1/betweennesscentrality"
```

##### Effective Closeness

A common definitions of centrality is the **closeness centrality**
(or closeness). The closeness of a vertex in a graph is the inverse average
length of the shortest path between the vertex and all other vertices.
For vertices *x*, *y* and shortest distance `d(y, x)` it is defined as:

![Vertex Closeness Formula](../../images/closeness.png)

Effective Closeness approximates the closeness measure. The algorithm works by
iteratively estimating the number of shortest paths passing through each vertex.
The score approximates the real closeness score, since it is not possible
to actually count all shortest paths due to the horrendous `O(n^2 * d)` memory
requirements. The algorithm is from the paper
*Centralities in Large Networks: Algorithms and Observations (U Kang et.al. 2011)*.

ArangoDBs implementation approximates the number of shortest paths in each
iteration by using a HyperLogLog counter with 64 buckets. This should work well
on large graphs and on smaller ones as well. The memory requirements should be
**O(n * d)** where *n* is the number of vertices and *d* the diameter of your
graph. Each vertex stores a counter for each iteration of the algorithm.

Parameters:
- `graph_id`

Result: a closeness measure for each vertex

<!-- TODO: missing endpoint and example because it is not implemented yet -->

##### LineRank

`POST <ENGINE_URL>/v1/linerank`

Another common measure is the [*betweenness* centrality](https://en.wikipedia.org/wiki/Betweenness_centrality):
It measures the number of times a vertex is part of shortest paths between any
pairs of vertices. For a vertex *v* betweenness is defined as:

![Vertex Betweenness Formula](../../images/betweenness.png)

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

Parameters:
- `graph_id`
- `damping_factor`
- `maximum_supersteps`

Result: the line rank of each vertex

```bash
GRAPH_ID="234"
curl -H "Authorization: bearer $ADB_TOKEN" -XPOST -d "{\"graph_id\":$GRAPH_ID,\"damping_factor\":0.0000001,\"maximum_supersteps\":500}" "$ENGINE_URL/v1/linerank"
```

#### Community Detection

Graphs based on real world networks often have a community structure.
This means it is possible to find groups of vertices such that each vertex
group is internally more densely connected than outside the group.
This has many applications when you want to analyze your networks, for example
Social networks include community groups (the origin of the term, in fact)
based on common location, interests, occupation, etc.

##### Label Propagation

`POST <ENGINE_URL>/v1/labelpropagation`

*Label Propagation* can be used to implement community detection on large graphs.
The algorithm assigns an initial community identifier to every vertex in the
graph using a user-defined attribute. The idea is that each vertex should be in
the community that most of its neighbors are in at the end of the computation.

In each iteration of the computation, a vertex sends its current community ID to
all its neighbor vertices, inbound and outbound (ignoring edge directions).
After that, each vertex adopts the community ID it received most frequently in
the last step.

It can happen that a vertex receives multiple most frequent community IDs.
In this case, one is chosen either randomly or using a deterministic choice
depending on a setting for the algorithm. The rules for a deterministic tiebreak
are as follows:
- If a vertex obtains only one community ID and the ID of the vertex from the
  previous step, its old ID, is less than the obtained ID, the old ID is kept.
- If a vertex obtains more than one ID, its new ID is the lowest ID among the
  most frequently obtained IDs. For example, if the initial IDs are numbers and
  the obtained IDs are 1, 2, 2, 3, 3, then 2 is the new ID.
- If, however, no ID arrives more than once, the new ID is the minimum of the
  lowest obtained IDs and the old ID. For example, if the old ID is 5 and the
  obtained IDs are 3, 4, 6, then the new ID is 3. If the old ID is 2, it is kept.

The algorithm runs until it converges or reaches the maximum iteration bound.
It may not converge on large graphs if the synchronous variant is used.
<!-- TODO: Describe sync/async from the original paper -->

Parameters:
- `graph_id`
- `start_label_attribute`
- `synchronous`
- `random_tiebreak`
- `maximum_supersteps`

Result: a community ID for each vertex

```bash
GRAPH_ID="234"
curl -H "Authorization: bearer $ADB_TOKEN" -XPOST -d "{\"graph_id\":$GRAPH_ID,\"start_label_attribute\":\"start_attr\",\"synchronous\":false,\"random_tiebreak\":false,\"maximum_supersteps\":500}" "$ENGINE_URL/v1/labelpropagation"
```

##### Attribute Propagation

`POST <ENGINE_URL>/v1/attributepropagation`

The attribute propagation algorithm can be used to implement community detection.
It works similar to the label propagation algorithm, but every node additionally
accumulates a memory of observed labels instead of forgetting all but one label.

The algorithm assigns an initial value to every vertex in the graph using a
user-defined attribute. The attribute value can be a list of strings to
initialize the set of labels with multiple labels.

In each iteration of the computation, the following steps are executed:

1. Each vertex propagates its set of labels along the edges to all direct
   neighbor vertices. Whether inbound or outbound edges are followed depends on
   an algorithm setting.
2. Each vertex adds the labels it receives to its own set of labels.

  After a specified maximal number of iterations or if no label set changes any
  more, the algorithm stops.
  
  {{< warning >}}
  If there are many labels and the graph is well-connected, the result set can
  be very large.
  {{< /warning >}}

Parameters:
- `graph_id`
- `start_label_attribute`: The attribute to initialize labels with.
   Use `"@id"` to use the document IDs of the vertices.
- `synchronous`: Whether synchronous or asynchronous label propagation is used.
- `backwards`: Whether labels are propagated in edge direction (`false`) or the
  opposite direction (`true`).
- `maximum_supersteps`: Maximum number of iterations.

Result: The set of accumulated labels of each vertex.

#### Custom Python code

`POST <ENGINE_URL>/v1/python`

Use NetworkX:

def worker(graph): return nx.pagerank(graph, 0.85)

Parameters:
- `graph_id`
- `function`: A string with Python code. It must define a function `def worker(graph):`
  that returns a dataframe or dictionary with the results. The key inside that
  dict must represent the vertex ID. The value can be of any type.
- `use_cugraph`: Use cugraph (or regular pandas/pyarrow).

### Store job results

`POST <ENGINE_URL>/v1/storeresults`

You need to specify to which ArangoDB `database` and `target_collection` to save
the results to. They need to exist already.

You also need to specify a list of `job_ids` with one or more jobs that have run
graph algorithms.

Each algorithm outputs one value for each vertex, and you can define the target
attribute to store the information in with `attribute_names`. It has to be a
list with one attribute name for every job in the `job_ids` list.

You can optionally set the degree of `parallelism` and the `batch_size` for
saving the data.

Parameters:
- `database`
- `target_collection`
- `job_ids`
- `attribute_names`
- `parallelism`
- `batch_size`

```bash
JOB_ID="123"
curl -H "Authorization: bearer $ADB_TOKEN" -X POST -d "{\"database\":\"_system\",\"target_collection\":\"coll\",\"job_ids\":[$JOB_ID],\"attribute_names\":[\"attr\"]}" "$ENGINE_URL/v1/storeresults"
```

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

### Delete a job

`DELETE <ENGINE_URL>/v1/jobs/<JOB_ID>`

Delete a specific job.

```bash
JOB_ID="123"
curl -H "Authorization: bearer $ADB_TOKEN" -X DELETE "$ENGINE_URL/v1/jobs/$JOB_ID"
```

### List all graphs

`GET <ENGINE_URL>/v1/graphs`

List all loaded sets of graph data that reside in the memory of the engine node.

```bash
curl -H "Authorization: bearer $ADB_TOKEN" "$ENGINE_URL/v1/graphs"
```

### Get a graph

`GET <ENGINE_URL>/v1/graphs/<GRAPH_ID>`

Get detailed information about a specific set of graph data.

```bash
GRAPH_ID="234"
curl -H "Authorization: bearer $ADB_TOKEN" "$ENGINE_URL/v1/graphs/$GRAPH_ID"
```

### Delete a graph

`DELETE <ENGINE_URL>/v1/graphs/<GRAPH_ID>`

Delete a specific set of graph data, removing it from the memory of the engine node.

```bash
GRAPH_ID="234"
curl -H "Authorization: bearer $ADB_TOKEN" -X DELETE "$ENGINE_URL/v1/graphs/$GRAPH_ID"
```
