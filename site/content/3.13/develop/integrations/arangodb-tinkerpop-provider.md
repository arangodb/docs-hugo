---
title: ArangoDB TinkerPop Provider
menuTitle: TinkerPop Provider
weight: 10
description: >-
  Build graph applications using TinkerPop API with ArangoDB's high-performance backend, combining Gremlin traversals and native AQL queries
---
ArangoDB TinkerPop Provider is an implementation of the [Apache TinkerPop OLTP Provider](https://tinkerpop.apache.org/docs/3.7.4/dev/provider) API for
ArangoDB.

It allows using the standard TinkerPop API with ArangoDB as the backend storage. It supports creating,
querying, and manipulating graph data using the Gremlin traversal language, while offering the possibility to use native
AQL (ArangoDB Query Language) for complex queries.

- Repository: <https://github.com/arangodb/arangodb-tinkerpop-provider>
- [Code examples](https://github.com/arangodb/arangodb-tinkerpop-provider/tree/main/src/test/java/example)
- [Demo](https://github.com/arangodb/arangodb-tinkerpop-provider/tree/main/demo)
- [JavaDoc](https://www.javadoc.io/doc/com.arangodb/arangodb-tinkerpop-provider/latest/index.html) (generated reference documentation)
- [ChangeLog](https://github.com/arangodb/arangodb-tinkerpop-provider/blob/main/CHANGELOG.md)

## Compatibility

This Provider is compatible with:

- Apache TinkerPop 3.7
- ArangoDB 3.12+
- ArangoDB Java Driver 7.22+
- Java 8+

## Installation

### Maven

1. Check the [latest version](https://search.maven.org/artifact/com.arangodb/arangodb-tinkerpop-provider) available.
2. Add the following dependency to your `pom.xml` file:

```xml
<dependencies>
    <dependency>
        <groupId>com.arangodb</groupId>
        <artifactId>arangodb-tinkerpop-provider</artifactId>
        <version>x.y.z</version>
    </dependency>
</dependencies>
```

### Gradle

1. Add the following dependency to your `build.gradle`:

```groovy
implementation 'com.arangodb:arangodb-tinkerpop-provider:x.y.z'
```

### Gremlin Console

1. Install the TinkerPop Provider in the Gremlin Console:

```text
:install com.arangodb arangodb-tinkerpop-provider x.y.z
```

2. Restart the console to load the provider.

3. Create a configuration for your ArangoDB connection.

```text
gremlin> conf = [
......1>     "gremlin.graph":"com.arangodb.tinkerpop.gremlin.structure.ArangoDBGraph",
......2>     "gremlin.arangodb.conf.graph.enableDataDefinition":"true",
......3>     "gremlin.arangodb.conf.driver.hosts":"172.28.0.1:8529",
......4>     "gremlin.arangodb.conf.driver.password":"test",
......5> ]
==>gremlin.graph=com.arangodb.tinkerpop.gremlin.structure.ArangoDBGraph
==>gremlin.arangodb.conf.graph.enableDataDefinition=true
==>gremlin.arangodb.conf.driver.hosts=172.28.0.1:8529
==>gremlin.arangodb.conf.driver.password=test
```
4. Open the graph using the configuration.

```text
gremlin> graph = GraphFactory.open(conf)
==>arangodbgraph[ArangoDBGraphConfig{...}]
```

5. Create a traversal source and start using it:

```text
gremlin> g = graph.traversal()
==>graphtraversalsource[arangodbgraph[...], standard]

gremlin> g.addV("person").property("name", "marko")
==>v[4586117]

gremlin> g.V().hasLabel("person").values("name")
==>marko
```

### Server Plugin

Follow the steps below to set up the provider as a Gremlin Server plugin.

1. Install the provider in the Gremlin Server:

   ```bash
   ./bin/gremlin-server.sh install com.arangodb arangodb-tinkerpop-provider x.y.z
   ```

2. Create a graph configuration file (e.g., `conf/arangodb.yaml`):

   ```yaml
   gremlin:
     graph: "com.arangodb.tinkerpop.gremlin.structure.ArangoDBGraph"
     arangodb:
       conf:
         graph:
           enableDataDefinition: true
         driver:
           hosts:
             - "172.28.0.1:8529"
           password: test
   ```

3. Create a server configuration file to load the plugin and graph configuration (e.g., `conf/gremlin-server-arangodb.yaml`):

```yaml
host: 0.0.0.0
port: 8182
graphs: {
  graph: conf/arangodb.yaml}
scriptEngines: {
  gremlin-groovy: {
    plugins: { org.apache.tinkerpop.gremlin.server.jsr223.GremlinServerGremlinPlugin: {},
               org.apache.tinkerpop.gremlin.tinkergraph.jsr223.TinkerGraphGremlinPlugin: {},
               com.arangodb.tinkerpop.gremlin.jsr223.ArangoDBGremlinPlugin: {},
               org.apache.tinkerpop.gremlin.jsr223.ImportGremlinPlugin: {classImports: [java.lang.Math], methodImports: [java.lang.Math#*]},
               org.apache.tinkerpop.gremlin.jsr223.ScriptFileGremlinPlugin: {files: [scripts/empty-sample.groovy]}}}}
serializers:
  - { className: org.apache.tinkerpop.gremlin.util.ser.GraphSONMessageSerializerV3, config: { ioRegistries: [org.apache.tinkerpop.gremlin.tinkergraph.structure.TinkerIoRegistryV3] }}            # application/json
  - { className: org.apache.tinkerpop.gremlin.util.ser.GraphBinaryMessageSerializerV1 }                                                                                                           # application/vnd.graphbinary-v1.0
  - { className: org.apache.tinkerpop.gremlin.util.ser.GraphBinaryMessageSerializerV1, config: { serializeResultToString: true }}                                                                 # application/vnd.graphbinary-v1.0-stringd
processors:
  - { className: org.apache.tinkerpop.gremlin.server.op.session.SessionOpProcessor, config: { sessionTimeout: 28800000 }}
  - { className: org.apache.tinkerpop.gremlin.server.op.traversal.TraversalOpProcessor}
```

4. Start the Gremlin Server with your configuration:

   ```bash
   ./bin/gremlin-server.sh conf/gremlin-server-arangodb.yaml
   ```

5. Connect to the server using the Gremlin Console:

   ```text
   gremlin> :remote connect tinkerpop.server conf/remote.yaml

   gremlin> :remote console
   ==>All scripts will now be sent to Gremlin Server - [localhost/127.0.0.1:8182] - type ':remote console' to return to local mode
   ```

6. Start using the graph:

   ```text
   gremlin> g.addV("person").property("name", "marko")
   ==>v[4587713]

   gremlin> g.V().hasLabel("person").values("name")
   ==>marko
   ```

You can find the reference documentation [here](https://tinkerpop.apache.org/docs/3.7.4/reference/#_configuring_2).


## Quick Start

Follow the steps below to get started with creating nodes, edges, and querying the graph

### Step 1: Configure and Create the Graph

[//]: <> (@formatter:off)
```java
// Create a configuration
Configuration conf = new ArangoDBConfigurationBuilder()
        .hosts("localhost:8529")
        .user("root")
        .password("test")
        .db("myDatabase")
        .name("myGraph")
        .enableDataDefinition(true)  // Allow creating database and graph if they don't exist
        .build();

// Create a graph
ArangoDBGraph graph = (ArangoDBGraph) GraphFactory.open(conf);

// Get a traversal source
GraphTraversalSource g = graph.traversal();
```
### Step 2: Add Nodes (vertices) and Edges

```java
// Add nodes with properties
Vertex person = g.addV("person")
        .property("name", "Alice")
        .property("age", 30)
        .property("country", "Germany")
        .next();

Vertex software = g.addV("software")
        .property("name", "JArango")
        .property("lang", "Java")
        .next();

// Create relationships between nodes
Edge created = g.addE("created")
        .from(person)
        .to(software)
        .property("year", 2025)
        .next();
```

### Step 3: Query the Graph

```java
// Query the graph
List<String> creators = g.V()
        .hasLabel("software")
        .has("name", "JArango")
        .in("created")
        .<String>values("name")
        .toList();

System.out.println("Creators: " + creators);

// Query: Find all software created by Alice
List<String> aliceSoftware = g.V()
        .hasLabel("person")
        .has("name", "Alice")
        .out("created")
        .<String>values("name")
        .toList();

System.out.println("aliceSoftware: " + aliceSoftware);

```

### Step 4: Update Data

```java
// Update a property
g.V()
    .hasLabel("person")
    .has("name", "Alice")
    .property("age", 31)
    .iterate();

// Remove a property
g.V()
    .hasLabel("person")
    .has("name", "Alice")
    .properties("country")
    .drop()
    .iterate();

// Check the updated node
Map<?, ?> alice = g.V()
    .hasLabel("person")
    .has("name", "Alice")
    .valueMap()
    .next();

System.out.println("alice: " + alice);
```

### Step 5: Delete Data and Clean Up

```java
// Remove an edge
g.E()
    .hasLabel("created")
    .where(__.outV()
    .has("name", "Alice"))
    .where(__.inV()
    .has("name", "JArango"))
    .drop()
    .iterate();

// Remove a node (and its incident edges)
g.V()
    .hasLabel("person")
    .has("name", "Alice")
    .drop()
    .iterate();

// Close the graph when done
graph.close();
```
[//]: <> (@formatter:on)

## Configuration

The graph can be created using the methods from `org.apache.tinkerpop.gremlin.structure.util.GraphFactory.open(...)`
(see [javadoc](https://tinkerpop.apache.org/javadocs/3.7.4/full/org/apache/tinkerpop/gremlin/structure/util/GraphFactory.html)).
These methods accept a configuration file (e.g., YAML or properties file), a Java Map, or an Apache Commons Configuration object.

The property `gremlin.graph` must be set to: `com.arangodb.tinkerpop.gremlin.structure.ArangoDBGraph`.

Configuration examples can be found [here](https://github.com/arangodb/arangodb-tinkerpop-provider/tree/main/src/test/java/example).

### Graph Configuration Properties

Graph configuration properties are prefixed with `gremlin.arangodb.conf.graph`:

| Property                                           | Description                           | Default     |
|----------------------------------------------------|---------------------------------------|-------------|
| `gremlin.arangodb.conf.graph.db`                   | ArangoDB database name                | `_system`   |
| `gremlin.arangodb.conf.graph.name`                 | ArangoDB graph name                   | `tinkerpop` |
| `gremlin.arangodb.conf.graph.enableDataDefinition` | Flag to allow data definition changes | `false`     |
| `gremlin.arangodb.conf.graph.type`                 | Graph type: `SIMPLE` or `COMPLEX`     | `SIMPLE`    |
| `gremlin.arangodb.conf.graph.labelField`           | Label field name                      | `_label`    |
| `gremlin.arangodb.conf.graph.orphanCollections`    | List of orphan collections names      | -           |
| `gremlin.arangodb.conf.graph.edgeDefinitions`      | List of edge definitions              | -           |

### Driver Configuration Properties

Driver configuration properties are prefixed with `gremlin.arangodb.conf.driver`. All properties from
`com.arangodb.config.ArangoConfigProperties` are supported. See
the [ArangoDB Java Driver documentation](https://docs.arangodb.com/stable/develop/drivers/java/reference-version-7/driver-setup/#config-file-properties)
for details.

### YAML Configuration

```yaml
gremlin:
  graph: "com.arangodb.tinkerpop.gremlin.structure.ArangoDBGraph"
  arangodb:
    conf:
      graph:
        db: "testDb"
        name: "myFirstGraph"
        enableDataDefinition: true
        type: COMPLEX
        orphanCollections: [ "x", "y", "z" ]
        edgeDefinitions:
          - "e1:[a]->[b]"
          - "e2:[a,b]->[c,d]"
      driver:
        user: "root"
        password: "test"
        hosts:
          - "172.28.0.1:8529"
          - "172.28.0.1:8539"
          - "172.28.0.1:8549"
```

Loading from a YAML file:

[//]: <> (@formatter:off)
```java
ArangoDBGraph graph = (ArangoDBGraph) GraphFactory.open("<path_to_yaml_file>");
```
[//]: <> (@formatter:on)

### Programmatic Configuration

1. Build the configuration using the configuration builder:

   [//]: <> (@formatter:off)
   ```java
   Configuration conf = new ArangoDBConfigurationBuilder()
           .hosts("172.28.0.1:8529")
           .user("root")
           .password("test")
           .database("testDb")
           .name("myGraph")
           .graphType(GraphType.SIMPLE)
           .enableDataDefinition(true)
           .build();
   ```
   [//]: <> (@formatter:on)

2. Create the graph using the configuration:

   [//]: <> (@formatter:off)
   ```java
   ArangoDBGraph graph = (ArangoDBGraph) GraphFactory.open(conf);
   ```
   [//]: <> (@formatter:on)

### SSL Configuration

To use TLS-secured connections to ArangoDB, follow these steps:

1. Enable SSL by setting `gremlin.arangodb.conf.driver.useSsl` to `true` in your configuration.

2. Configure SSL properties as needed (see [ArangoDB Java Driver documentation](https://docs.arangodb.com/stable/develop/drivers/java/reference-version-7/driver-setup/#config-file-properties) for all available options):

   ```yaml
   gremlin:
     graph: "com.arangodb.tinkerpop.gremlin.structure.ArangoDBGraph"
     arangodb:
       conf:
         driver:
           hosts:
             - "172.28.0.1:8529"
           useSsl: true
           verifyHost: false
           sslCertValue: "MIIDezCCAmOgAwIBAgIEeDCzXzANBgkqhkiG9w0BAQsFADBuMRAwDgYDVQQGEwdVbmtub3duMRAwDgYDVQQIEwdVbmtub3duMRAwDgYDVQQHEwdVbmtub3duMRAwDgYDVQQKEwdVbmtub3duMRAwDgYDVQQLEwdVbmtub3duMRIwEAYDVQQDEwlsb2NhbGhvc3QwHhcNMjAxMTAxMTg1MTE5WhcNMzAxMDMwMTg1MTE5WjBuMRAwDgYDVQQGEwdVbmtub3duMRAwDgYDVQQIEwdVbmtub3duMRAwDgYDVQQHEwdVbmtub3duMRAwDgYDVQQKEwdVbmtub3duMRAwDgYDVQQLEwdVbmtub3duMRIwEAYDVQQDEwlsb2NhbGhvc3QwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQC1WiDnd4+uCmMG539ZNZB8NwI0RZF3sUSQGPx3lkqaFTZVEzMZL76HYvdc9Qg7difyKyQ09RLSpMALX9euSseD7bZGnfQH52BnKcT09eQ3wh7aVQ5sN2omygdHLC7X9usntxAfv7NzmvdogNXoJQyY/hSZff7RIqWH8NnAUKkjqOe6Bf5LDbxHKESmrFBxOCOnhcpvZWetwpiRdJVPwUn5P82CAZzfiBfmBZnB7D0l+/6Cv4jMuH26uAIcixnVekBQzl1RgwczuiZf2MGO64vDMMJJWE9ClZF1uQuQrwXF6qwhuP1Hnkii6wNbTtPWlGSkqeutr004+Hzbf8KnRY4PAgMBAAGjITAfMB0GA1UdDgQWBBTBrv9Awynt3C5IbaCNyOW5v4DNkTANBgkqhkiG9w0BAQsFAAOCAQEAIm9rPvDkYpmzpSIhR3VXG9Y71gxRDrqkEeLsMoEyqGnw/zx1bDCNeGg2PncLlW6zTIipEBooixIE9U7KxHgZxBy0Et6EEWvIUmnr6F4F+dbTD050GHlcZ7eOeqYTPYeQC502G1Fo4tdNi4lDP9L9XZpf7Q1QimRH2qaLS03ZFZa2tY7ah/RQqZL8Dkxx8/zc25sgTHVpxoK853glBVBs/ENMiyGJWmAXQayewY3EPt/9wGwV4KmU3dPDleQeXSUGPUISeQxFjy+jCw21pYviWVJTNBA9l5ny3GhEmcnOT/gQHCvVRLyGLMbaMZ4JrPwb+aAtBgrgeiK4xeSMMvrbhw=="
   ```

3. Alternatively, use system properties for truststore configuration. If no `sslCertValue` is provided, the default SSL context is used. In such cases, you can specify the truststore using system properties:
   - `javax.net.ssl.trustStore`
   - `javax.net.ssl.trustStorePassword`

### Data Definition Management

The provider follows this process when instantiating a graph:

1. **Validation**: The provider compares existing data definitions in ArangoDB with the structure expected by your configuration. It checks whether:
   - The database exists
   - The graph exists
   - The graph structure has the same edge definitions and orphan collections

2. **Error handling**: If there's a mismatch, an error is thrown and the graph is not instantiated.

3. **Automatic creation** (optional): To automatically create missing data definitions, set `gremlin.arangodb.conf.graph.enableDataDefinition` to `true`. This allows:
   - Creating a new database if it doesn't exist
   - Creating a new graph if it doesn't exist (along with vertex and edge collections)

{{< info >}}
Existing graphs are never modified automatically for safety reasons.
{{< /info >}}

## Graph Types

The ArangoDB TinkerPop Provider supports two graph types, which can be configured with the property
`gremlin.arangodb.conf.graph.type`: `SIMPLE` and `COMPLEX`.

### SIMPLE Graph Type

From an application perspective, this is the most flexible graph type that is backed by an ArangoDB graph composed of only one vertex collection and one edge definition.

The `label` of each element is stored in a database document field. The label field name is configurable by setting the configuration property `graph.labelField`, `_label` by default.

The `SIMPLE` graph type is the default graph type.

It has the following advantages:

- It closely matches the TinkerPop property graph
- It is simpler to get started and run examples
- It imposes no restrictions about element IDs
- It supports arbitrary labels, i.e., labels not known at graph construction time

It has the following disadvantages:

- All vertex types will be stored in the same vertex collection
- All edge types will be stored in the same edge collection
- It could not leverage the full potential of ArangoDB graph traversal
- It could require an index on the label field to improve performance

Example configuration:

```yaml
gremlin:
  graph: "com.arangodb.tinkerpop.gremlin.structure.ArangoDBGraph"
  arangodb:
    conf:
      graph:
        db: "db"
        name: "myGraph"
        type: SIMPLE
        edgeDefinitions:
          - "e:[v]->[v]"
```

If `edgeDefinitions` are not configured, the default names are used:

- `vertex` will be used for the vertex collection
- `edge` will be used for the edge collection

Using a `SIMPLE` graph configured as in the example above and creating a new element like:

[//]: <> (@formatter:off)
```java
graph.addVertex(T.label, "person", T.id, "foo");
```
[//]: <> (@formatter:on)

would result in creating a document in the vertex collection `v` with `_key` equals to `foo` (and `_id` equals
to `v/foo`).

### COMPLEX Graph Type

The `COMPLEX` graph type is backed by an ArangoDB graph composed potentially of multiple vertex collections and multiple
edge definitions.

The `label` of each element is used as name for the related database collection.

It has the following advantages:

- It closely matches the ArangoDB graph structure
- It allows multiple vertex collections and multiple edge collections
- It partitions the data in a finer way
- It allows indexing and sharding collections independently
- It is more flexible to match pre-existing database graph structures

But on the other side has the following constraints:

- Element IDs must have the format: `<label>/<key>`, where:
    - `<label>` is the element label
    - `<key>` is the database document key
- Only labels corresponding to graph collections can be used

Example configuration:

```yaml
gremlin:
  graph: "com.arangodb.tinkerpop.gremlin.structure.ArangoDBGraph"
  arangodb:
    conf:
      graph:
        db: "db"
        name: "myGraph"
        type: COMPLEX
        edgeDefinitions:
          - "knows:[person]->[person]"
          - "created:[person]->[game,software]"
```

Using a `COMPLEX` graph configured as in the example above and creating a new element like:

[//]: <> (@formatter:off)
```java
graph.addVertex(T.label, "person", T.id, "person/foo");
```
[//]: <> (@formatter:on)

would result in creating a document in the vertex collection `person` with `_key` equals to `foo` (and `_id`
equals to `person/foo`).

## Naming Constraints

When using the ArangoDB TinkerPop Provider, be aware that Element IDs must be strings.

## Persistent Structure

The ArangoDB TinkerPop Provider maps TinkerPop data structures to ArangoDB data as follows:

### Nodes (Vertices)

Nodes (vertices) are stored as documents in vertex collections. In a `SIMPLE` graph, all nodes are stored in a single
collection, by default named `vertex`. In a `COMPLEX` graph, nodes are stored in collections named
`<label>`.

Each vertex document contains:

- Standard ArangoDB fields (`_id`, `_key`, `_rev`)
- Vertex properties as document fields
- Meta-properties nested in the nested map `_meta`

Additionally, in a `SIMPLE` graph:
- The label field (`_label` by default)

For example, the following Java code:

[//]: <> (@formatter:off)
```java
graph
        .addVertex("person")
        .property("name", "Freddie Mercury")
        .property("since", 1970);
```
[//]: <> (@formatter:on)

creates a document like this:

```json
{
  "_key": "4856",
  "_id": "vertex/4856",
  "_rev": "_kFqmbXK---",
  "_label": "person",
  "name": "Freddie Mercury",
  "_meta": {
    "name": {
      "since": 1970
    }
  }
}
```

### Edges

Edges are stored as documents in edge collections. In a `SIMPLE` graph, all edges are stored in a single collection, by
default named `edge`. In a `COMPLEX` graph, edges are stored in collections named `<label>`.

Each edge document contains:

- Standard ArangoDB edge fields (`_id`, `_key`, `_rev`, `_from`, `_to`)
- Edge properties as document fields

Additionally, in a `SIMPLE` graph:
- The label field (`_label` by default)

For example, the following Java code:

[//]: <> (@formatter:off)
```java
Vertex v = graph.addVertex("person");
v.addEdge("knows", v)
        .property("since", 1970);
```
[//]: <> (@formatter:on)

creates a document like this:

```json
{
  "_key": "5338",
  "_id": "edge/5338",
  "_from": "vertex/5335",
  "_to": "vertex/5335",
  "_rev": "_kFq20-u---",
  "_label": "knows",
  "since": 1970
}
```

## Element IDs

Given a Gremlin element, you can get the corresponding ArangoDB document ID (`_id` field) using the
`ArangoDBGraph.elementId(Element)` method:

[//]: <> (@formatter:off)
```java
Vertex v = graph.addVertex("name", "marko");
String id = graph.elementId(v);
```
[//]: <> (@formatter:on)

This is useful when you need to reference the element directly in AQL queries.


## Query Optimization

ArangoDB TinkerPop Provider includes an optimization strategy that can push certain Gremlin traversal steps down to
the database layer for improved performance.
This is applied by `com.arangodb.tinkerpop.gremlin.process.traversal.strategy.optimization.ArangoStepStrategy`.

### HasStep Pushdown

The optimizer analyzes the traversal steps and attempts to convert filter steps of type
`org.apache.tinkerpop.gremlin.process.traversal.step.filter.HasStep` into AQL queries that execute directly on the
database. This reduces the amount of data transferred and processed in the client application.

All Gremlin predefined predicate values from `org.apache.tinkerpop.gremlin.process.traversal.P` are supported:
- **comparison predicates**: `eq`, `neq`, `lt`, `gt`, etc.
- **collection predicates**: `within`, `without`
- **text predicates**: `containing`, `startingWith`, `endingWith`, `regex`
- **logical combinations**: `and`, `or`, `not`

For example, the following traversal is optimized to execute the filtering logic in ArangoDB using AQL and transferring to the client only the matching
nodes, rather than retrieving all nodes and filtering them in the client.

[//]: <> (@formatter:off)
```groovy
g.V().has("value", "foo")
```
[//]: <> (@formatter:on)

### Disabling Optimization

If you need to disable the optimization strategy:

1. **Create a traversal source** without the optimization strategy:

   [//]: <> (@formatter:off)
   ```java
   GraphTraversalSource g = graph.traversal().withoutStrategies(ArangoStepStrategy.class);
   ```
   [//]: <> (@formatter:on)

2. **Use the traversal source** as normal. All traversals will execute without AQL optimization.

## AQL Queries

For complex queries or performance-critical operations, you can use ArangoDB's native query language (AQL) directly:

[//]: <> (@formatter:off)
```java
List<Vertex> alice = graph
        .<Vertex>aql("FOR v IN vertex FILTER v.name == @name RETURN v", Map.of("name", "Alice"))
        .toList();

// Query using document ID
Vertex v = graph.addVertex("name", "marko");
String id = graph.elementId(v);
List<Vertex> result = graph
        .<Vertex>aql("RETURN DOCUMENT(@id)", Map.of("id", id))
        .toList();
```
[//]: <> (@formatter:on)

## Supported Features

This library supports the following features:

```text
> GraphFeatures
>-- Computer: false
>-- Persistence: true
>-- ConcurrentAccess: true
>-- Transactions: false
>-- ThreadedTransactions: false
>-- IoRead: true
>-- IoWrite: true
>-- OrderabilitySemantics: false
>-- ServiceCall: false
> VariableFeatures
>-- Variables: true
>-- LongArrayValues: true
>-- StringArrayValues: true
>-- BooleanValues: true
>-- ByteValues: false
>-- DoubleValues: true
>-- FloatValues: false
>-- IntegerValues: true
>-- LongValues: true
>-- MapValues: true
>-- MixedListValues: true
>-- SerializableValues: false
>-- StringValues: true
>-- UniformListValues: true
>-- BooleanArrayValues: true
>-- ByteArrayValues: false
>-- DoubleArrayValues: true
>-- FloatArrayValues: false
>-- IntegerArrayValues: true
> VertexFeatures
>-- DuplicateMultiProperties: false
>-- AddVertices: true
>-- RemoveVertices: true
>-- MultiProperties: false
>-- MetaProperties: true
>-- Upsert: false
>-- NullPropertyValues: true
>-- AddProperty: true
>-- RemoveProperty: true
>-- UserSuppliedIds: true
>-- NumericIds: false
>-- StringIds: true
>-- UuidIds: false
>-- CustomIds: false
>-- AnyIds: false
> VertexPropertyFeatures
>-- NullPropertyValues: true
>-- RemoveProperty: true
>-- UserSuppliedIds: false
>-- NumericIds: true
>-- StringIds: true
>-- UuidIds: true
>-- CustomIds: true
>-- AnyIds: false
>-- Properties: true
>-- LongArrayValues: true
>-- StringArrayValues: true
>-- BooleanValues: true
>-- ByteValues: false
>-- DoubleValues: true
>-- FloatValues: false
>-- IntegerValues: true
>-- LongValues: true
>-- MapValues: true
>-- MixedListValues: true
>-- SerializableValues: false
>-- StringValues: true
>-- UniformListValues: true
>-- BooleanArrayValues: true
>-- ByteArrayValues: false
>-- DoubleArrayValues: true
>-- FloatArrayValues: false
>-- IntegerArrayValues: true
> EdgeFeatures
>-- Upsert: false
>-- AddEdges: true
>-- RemoveEdges: true
>-- NullPropertyValues: true
>-- AddProperty: true
>-- RemoveProperty: true
>-- UserSuppliedIds: true
>-- NumericIds: false
>-- StringIds: true
>-- UuidIds: false
>-- CustomIds: false
>-- AnyIds: false
> EdgePropertyFeatures
>-- Properties: true
>-- LongArrayValues: true
>-- StringArrayValues: true
>-- BooleanValues: true
>-- ByteValues: false
>-- DoubleValues: true
>-- FloatValues: false
>-- IntegerValues: true
>-- LongValues: true
>-- MapValues: true
>-- MixedListValues: true
>-- SerializableValues: false
>-- StringValues: true
>-- UniformListValues: true
>-- BooleanArrayValues: true
>-- ByteArrayValues: false
>-- DoubleArrayValues: true
>-- FloatArrayValues: false
>-- IntegerArrayValues: true
```

## Current Limitations

- This library implements the Online Transactional Processing Graph Systems (OLTP) API only. The Online Analytics Processing Graph Systems (OLAP) API is currently not implemented.
- This library implements the Structure API only. The Process API is currently not implemented. For optimal query performance, it is recommended to use [AQL queries](#aql-queries).

## Logging

The library uses the `slf4j` API for logging. To log requests and responses to and from the database, enable the `DEBUG` log level for the logger `com.arangodb.internal.net.Communication`.

## Examples and Demo

The [demo](https://github.com/arangodb/arangodb-tinkerpop-provider/tree/main/demo) project contains comprehensive usage examples of this library.

For additional examples, check
the [Gremlin tutorial](https://tinkerpop.apache.org/docs/3.7.4/tutorials/getting-started/).

## Acknowledgments

This repository is based on and extends the original work of
the [arangodb-community/arangodb-tinkerpop-provider](https://github.com/arangodb-community/arangodb-tinkerpop-provider)
project.

We gratefully acknowledge the efforts of [Horacio Hoyos Rodriguez](https://github.com/arcanefoam) and other contributors
of the community repository, see [AUTHORS.md](https://github.com/arangodb/arangodb-tinkerpop-provider/blob/main/AUTHORS.md).
