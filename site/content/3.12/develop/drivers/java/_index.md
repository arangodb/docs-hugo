---
title: ArangoDB Java driver
menuTitle: Java driver
weight: 10
description: ''
---
The official ArangoDB [Java Driver](https://github.com/arangodb/arangodb-java-driver).

- [Tutorial](https://university.arangodb.com/courses/java-driver-tutorial-v7/)
- [Code examples](https://github.com/arangodb/arangodb-java-driver/tree/main/driver/src/test/java/com/arangodb/example)
- [Reference](reference-version-7/_index.md)
- [JavaDoc](https://www.javadoc.io/doc/com.arangodb/arangodb-java-driver/latest/index.html)
- [ChangeLog](https://github.com/arangodb/arangodb-java-driver/blob/main/ChangeLog.md)

## Supported versions

Version 7 is the latest supported and actively developed release.

{{< warning >}}
Version 6 reached EOL and is not actively developed anymore.
Upgrading to version 7 is recommended.
{{< /warning >}}

The API changes between version 6 and 7 are documented in
[Changes in version 7](reference-version-7/changes-in-version-7.md).

The driver is compatible with all supported stable versions of ArangoDB server, see
[Product Support End-of-life Announcements](https://www.arangodb.com/eol-notice).

The driver is compatible with JDK 8 and higher versions.

## Maven

To add the driver to your project with Maven, add the following code to your
`pom.xml` (substitute `7.x.x` with the latest driver version):

```xml
<dependencies>
  <dependency>
    <groupId>com.arangodb</groupId>
    <artifactId>arangodb-java-driver</artifactId>
    <version>7.x.x</version>
  </dependency>
</dependencies>
```

## Gradle

To add the driver to your project with Gradle, add the following code to your
`build.gradle` (substitute `7.x.x` with the latest driver version):

```groovy
repositories {
    mavenCentral()
}

dependencies {
    implementation 'com.arangodb:arangodb-java-driver:7.x.x'
}
```

## GraalVM Native Image

The driver supports GraalVM Native Image compilation.
To compile with `--link-at-build-time` when `http-protocol` module is present in
the classpath, additional substitutions are required for transitive dependencies
`Netty` and `Vert.x`. See this
[example](https://github.com/arangodb/arangodb-java-driver/tree/main/driver/src/test/java/graal)
for reference. Such substitutions are not required when compiling the shaded driver.

### Framework compatibility

The driver can be used in the following frameworks that support
GraalVM Native Image generation:

- [Quarkus](https://quarkus.io), see [arango-quarkus-native-example](https://github.com/arangodb-helper/arango-quarkus-native-example)
- [Helidon](https://helidon.io), see [arango-helidon-native-example](https://github.com/arangodb-helper/arango-helidon-native-example)
- [Micronaut](https://micronaut.io), see [arango-micronaut-native-example](https://github.com/arangodb-helper/arango-micronaut-native-example)

## ArangoDB Java Driver Shaded

A shaded variant of the driver is also published with
Maven coordinates: `com.arangodb:arangodb-java-driver-shaded`.

It bundles and relocates the following packages:
- `com.fasterxml.jackson`
- `com.arangodb.jackson.dataformat.velocypack`
- `io.vertx`
- `io.netty`

Note that the **internal serde** internally uses Jackson classes from
`com.fasterxml.jackson` that are relocated to `com.arangodb.shaded.fasterxml.jackson`.
Therefore, the **internal serde** of the shaded driver is not compatible with
Jackson annotations and modules from package`com.fasterxml.jackson`, but only
with their relocated variants. In case the **internal serde** is used as
**user-data serde**, the annotations from package `com.arangodb.serde` can be
used to annotate fields, parameters, getters and setters for mapping values
representing ArangoDB documents metadata (`_id`, `_key`, `_rev`, `_from`, `_to`):
- `@InternalId`
- `@InternalKey`
- `@InternalRev`
- `@InternalFrom`
- `@InternalTo`

These annotations are compatible with relocated Jackson classes.
Note that the **internal serde** is not part of the public API and could change
in future releases without notice, thus breaking client applications relying on
it to serialize or deserialize user-data. It is therefore recommended also in
this case either:
- using the default user-data serde `JacksonSerde`
  (from packages `com.arangodb:jackson-serde-json` or `com.arangodb:jackson-serde-vpack`), or
- providing a custom user-data serde implementation via `ArangoDB.Builder.serde(ArangoSerde)`.

## Support for extended naming constraints

The driver supports ArangoDB's **extended** naming constraints/convention,
allowing most UTF-8 characters in the names of:
- Databases
- Collections
- Views
- Indexes

These names must be NFC-normalized, otherwise the server returns an error.
To normalize a string, use the function
`com.arangodb.util.UnicodeUtils.normalize(String): String`:

```java 
String normalized = UnicodeUtils.normalize("𝔸𝕣𝕒𝕟𝕘𝕠𝔻𝔹");
```

To check if a string is already normalized, use the
function `com.arangodb.util.UnicodeUtils.isNormalized(String): boolean`:

```java 
boolean isNormalized = UnicodeUtils.isNormalized("𝔸𝕣𝕒𝕟𝕘𝕠𝔻𝔹");
```

## Async API

The asynchronous API is accessible via `ArangoDB#async()`, for example:

```java
ArangoDB adb = new ArangoDB.Builder()
    // ...
    .build();
ArangoDBAsync adbAsync = adb.async();
CompletableFuture<ArangoDBVersion> version = adbAsync.getVersion();
// ...
```

Under the hood, both synchronous and asynchronous API use the same internal
communication layer, which has been reworked and re-implemented in an
asynchronous way. The synchronous API blocks and waits for the result, while the
asynchronous one returns a `CompletableFuture<>` representing the pending
operation being performed.
Each asynchronous API method is equivalent to the corresponding synchronous
variant, except for the Cursor API.

### Async Cursor API

The Cursor API (`ArangoCursor` and `ArangoCursorAsync`) is intrinsically different,
because the synchronous Cursor API is based on Java's `java.util.Iterator`, which
is an interface only suitable for synchronous scenarios.
On the other side, the asynchronous Cursor API provides a method
`com.arangodb.ArangoCursorAsync#nextBatch()`, which returns a
`CompletableFuture<ArangoCursorAsync<T>>` and can be used to consume the next
batch of the cursor, for example:

```java
CompletableFuture<ArangoCursorAsync<Integer>> future1 = adbAsync.db()
        .query("FOR i IN i..10000", Integer.class);
CompletableFuture<ArangoCursorAsync<Integer>> future2 = future1
        .thenCompose(c -> {
            List<Integer> batch = c.getResult();
            // ...
            // consume batch
            // ...
            return c.nextBatch();
        });
// ...
```

## Data Definition Classes

Classes used to exchange data definitions, in particular classes in the packages 
`com.arangodb.entity.**` and `com.arangodb.model.**`, are meant to be serialized 
and deserialized internally by the driver.

The behavior to serialize and deserialize these classes is considered an internal 
implementation detail, and as such, it might change without prior notice.
The API with regard to the public members of these classes is kept compatible.
