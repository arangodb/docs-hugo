---
title: Driver setup
menuTitle: Driver Setup
weight: 5
description: >-
  How to connect your Java application to an ArangoDB server, as well as
  important configuration settings and information about the driver
---
The driver can be configured and instantiated using `com.arangodb.ArangoDB.Builder`:

```java
ArangoDB arangoDB = new ArangoDB.Builder()
        // ...
        .build();
```

To customize the configuration properties can be set programmatically in the builder:

```java
ArangoDB arangoDB = new ArangoDB.Builder()
        .host("127.0.0.1",8529)
        // ...
        .build();
```

or providing an implementation of `com.arangodb.config.ArangoConfigProperties`
to the builder:

```java
ArangoConfigProperties props = ...
ArangoDB arangoDB = new ArangoDB.Builder()
        .loadProperties(props)
        // ...
        .build();
```

Implementations of `com.arangodb.config.ArangoConfigProperties` could supply
configuration properties coming from different sources, eg. system properties,
remote stores, frameworks integrations, etc.
An implementation for loading properties from local files is provided by
`ArangoConfigProperties.fromFile()` and its overloaded variants.

To read config properties prefixed with `arangodb` from `arangodb.properties`
file:

```java
// ## src/main/resources/arangodb.properties
// arangodb.hosts=172.28.0.1:8529
// arangodb.password=test
// ...

ArangoConfigProperties props = ArangoConfigProperties.fromFile();
```

To read config properties from `arangodb-with-prefix.properties` file, where the
config properties are prefixed with `adb`:

```java
// ## src/main/resources/arangodb-with-prefix.properties
// adb.hosts=172.28.0.1:8529
// adb.password=test
// ...

ArangoConfigProperties props = ArangoConfigProperties.fromFile("arangodb-with-prefix.properties", "adb");
```

Here are examples to integrate configuration properties from different sources:
- [Eclipse MicroProfile Config](https://github.com/arangodb-helper/arango-quarkus-native-example/blob/master/src/main/java/com/arangodb/ArangoConfig.java)
- [Micronaut Configuration](https://github.com/arangodb-helper/arango-micronaut-native-example/blob/main/src/main/kotlin/com/example/ArangoConfig.kt)

## Configuration

`ArangoDB.Builder` has the following configuration methods:

- `host(String, int)`:           adds a host (hostname and port) to connect to, multiple hosts can be added
- `protocol(Protocol)`:          communication protocol, possible values are: `HTTP_JSON`, `HTTP_VPACK`, `HTTP2_JSON`, `HTTP2_VPACK`, `VST` (unsupported from ArangoDB v3.12 onward), (default: `HTTP2_JSON`)
- `timeout(Integer)`:            connection and request timeout (ms), (default `0`, no timeout)
- `user(String)`:                username for authentication, (default: `root`)
- `password(String)`:            password for authentication
- `jwt(String)`:                 JWT for authentication
- `useSsl(Boolean)`:             use SSL connection, (default: `false`)
- `sslContext(SSLContext)`:      SSL context
- `sslCertValue(String)`:        SSL certificate value as Base64 encoded String
- `sslAlgorithm(String)`:        name of the SSL Trust manager algorithm (default: `SunX509`)
- `sslProtocol(String)`:         name of the SSLContext protocol (default: `TLS`)
- `verifyHost(Boolean)`:         enable hostname verification, (HTTP only, default: `true`)
- `maxConnections(Integer)`:     max number of connections per host, (default: `1` for `HTTP/2`, `20` for `HTTP/1.1`)
- `connectionTtl(Long)`:         time to live of an inactive connection (ms), (default: `30_000`)
- `acquireHostList(Boolean)`:    acquire the list of available hosts, (default: `false`)
- `acquireHostListInterval(Integer)`:             acquireHostList interval (ms), (default: `3_600_000`, 1 hour)
- `loadBalancingStrategy(LoadBalancingStrategy)`: load balancing strategy, possible values are: `NONE`, `ROUND_ROBIN`, `ONE_RANDOM`, (default: `NONE`)
- `responseQueueTimeSamples(Integer)`:            amount of samples kept for queue time metrics, (default: `10`)
- `compression(Compression)`:      the `content-encoding` and `accept-encoding` to use for HTTP requests, possible values are: `NONE`, `DEFLATE`, `GZIP`, (default: `NONE`)
- `compressionThreshold(Integer)`: the minimum HTTP request body size (in bytes) to trigger compression, (default: `1024`)
- `compressionLevel`:              compression level between 0 and 9, (default: `6`)
- `serde(ArangoSerde)`:            serde to serialize and deserialize user-data
- `serdeProviderClass(Class<? extends ArangoSerdeProvider>)`: serde provider to be used to instantiate the user-data serde
- `protocolConfig(ProtocolConfig)`: configuration specific for the used protocol provider implementation
- `pipelining(Boolean):`:           use HTTP pipelining, (`HTTP/1.1` only, default `false`)

### HTTP Protocol Provider Configuration

The `ProtocolConfig` for the default HTTP protocol provider can be created via:

```java
HttpProtocolConfig.builder()
  // ...
  .build();
```

and configured using the following builder methods:

- `vertx(Vertx)`: Vert.x instance to use. If not set, a new instance is created.

For example, to reuse the existing Vert.x instance:

```java
HttpProtocolConfig.builder()
  .protocolConfig(HttpProtocolConfig.builder()
    .vertx(Vertx.currentContext().owner())
    .build()
  )
  .build();
```

### Config File Properties

`ArangoConfigProperties.fromFile()` reads config properties prefixed with `arangodb`
from `arangodb.properties` file. Different prefix and
file name can be specified using its overloaded variants.

The properties read are:
- `hosts`: comma-separated list of `<hostname>:<port>` entries
- `protocol`: `HTTP_JSON`, `HTTP_VPACK`, `HTTP2_JSON`, `HTTP2_VPACK`, or `VST` (unsupported from ArangoDB v3.12 onward)
- `timeout`
- `user`
- `password`
- `jwt`
- `useSsl`
- `sslCertValue`: SSL certificate as Base64 encoded string
- `sslAlgorithm`: SSL trust manager algorithm (default: `SunX509`)
- `sslProtocol`: SSLContext protocol (default: `TLS`)
- `verifyHost`
- `chunkSize`
- `maxConnections`
- `connectionTtl`
- `keepAliveInterval`
- `acquireHostList`
- `acquireHostListInterval`
- `loadBalancingStrategy`: `NONE`, `ROUND_ROBIN` or `ONE_RANDOM`
- `responseQueueTimeSamples`
- `compression`: `NONE`, `DEFLATE` or `GZIP`
- `compressionThreshold`
- `compressionLevel`
- `serdeProviderClass`: fully qualified name of the provider class
- `pipelining`

## SSL

To use SSL, you have to set the configuration `useSsl` to `true`.
By default, the driver will use the default `SSLContext`.
This can be changed by providing the `SSLContext` instance to be used:

```java
ArangoDB arangoDB = new ArangoDB.Builder()
  .useSsl(true)
  .sslContext(sc)
  .build();
```

Alternatively, the driver can create a new `SSLContext` using the provided configuration. In this case,
it is required to set the configuration `sslCertValue` with the SSL certificate value as Base64 encoded String:

```java
ArangoDB arangoDB = new ArangoDB.Builder()
  .useSsl(true)
  .sslCertValue("<certificate>") // SSL certificate as Base64 encoded String
  .sslAlgorithm("SunX509")       // SSL Trust manager algorithm (optional, default: SunX509)
  .sslProtocol("TLS")            // SSLContext protocol (optional, default: TLS)
  .build();
```

See the [example code](https://github.com/arangodb/arangodb-java-driver/blob/main/test-functional/src/test-ssl/java/com/arangodb/SslExampleTest.java) for more details on SSL configuration.

## Connection Pooling

The driver keeps a pool of connections for each host, the max amount of
connections is configurable.

Inactive connections are released after the configured connection time-to-live
(`ArangoDB.Builder.connectionTtl(Long)`) or when the driver is shut down:

```java
arangoDB.shutdown();
```

## Thread Safety

The driver can be used concurrently by multiple threads. All the following
classes are thread safe:
- `com.arangodb.ArangoDB`
- `com.arangodb.ArangoDatabase`
- `com.arangodb.ArangoCollection`
- `com.arangodb.ArangoGraph`
- `com.arangodb.ArangoVertexCollection`
- `com.arangodb.ArangoEdgeCollection`
- `com.arangodb.ArangoView`
- `com.arangodb.ArangoSearch`

Any other class should not be considered thread safe. In particular classes
representing request options (package `com.arangodb.model`) and response entities
(package `com.arangodb.entity`) are **not** thread safe.

## Fallback hosts

The driver supports configuring multiple hosts. The first host is used to open a
connection to. When this host is not reachable the next host from the list is used.
To use this feature just call the method `host(String, int)` multiple times.

```java
ArangoDB arangoDB = new ArangoDB.Builder()
        .host("host1", 8529)
        .host("host2", 8529)
        .build();
```

The driver is also able to acquire a list of known hosts in a cluster. For this the driver has
to be able to successfully open a connection to at least one host to get the
list of hosts. Then it can use this list when fallback is needed. To enable this
feature:

```java
ArangoDB arangoDB = new ArangoDB.Builder()
        .acquireHostList(true)
        .build();
```

## Load Balancing

The driver supports load balancing for cluster setups in
two different ways.

The first one is a round robin load balancing where the driver iterates
through a list of known hosts and performs every request on a different
host than the request before.

```java
ArangoDB arangoDB = new ArangoDB.Builder()
        .loadBalancingStrategy(LoadBalancingStrategy.ROUND_ROBIN)
        .build();
```

The second load balancing strategy picks a random host from host list
(configured or acquired) and sticks to it as long as the
connection is open.

```java
ArangoDB arangoDB = new ArangoDB.Builder()
        .loadBalancingStrategy(LoadBalancingStrategy.ONE_RANDOM)
        .build();
```

## Connection time to live

The driver supports setting a TTL (time to live) for connections:

```java
ArangoDB arango = new ArangoDB.Builder()
        .connectionTtl(5 * 60 * 1000) // ms
        .build();
```

In this example, inactive connections are closed after 5 minutes.

The default connection TTL is `30` seconds.

If set to `null`, no automatic connection closure is performed.

## Proxy configuration

The driver allows configuring the underlying Vert.x WebClient to work
with HTTP proxies. The configuration is specific to the HTTP protocol
and uses the `io.vertx.core.net.ProxyOptions` class of
[Vert.x Core](https://www.javadoc.io/doc/io.vertx/vertx-core/4.5.7/io/vertx/core/net/ProxyOptions.html):

```java
ArangoDB arango = new ArangoDB.Builder()
        // ...
        .protocolConfig(HttpProtocolConfig.builder()
                .proxyOptions(new ProxyOptions()
                        .setType(ProxyType.HTTP)
                        .setHost("172.28.0.1")
                        .setPort(8888)
                        .setUsername("user")
                        .setPassword("password"))
                .build())
        .build();
```
