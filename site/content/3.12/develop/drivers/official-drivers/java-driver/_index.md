---
title: ArangoDB Java Driver
menuTitle: Java Driver
weight: 10
description: >-
  The official ArangoDB Java Driver
archetype: chapter
---
The official ArangoDB [Java Driver](https://github.com/arangodb/arangodb-java-driver).

- [Java Driver Tutorial](https://university.arangodb.com/courses/java-driver-tutorial-v7/)
- [Reference](reference-(version-7)/_index.md)

## Supported versions

Version 7 is the latest supported and actively developed release.
Version 6 is still supported and maintained, but not actively developed anymore.
Upgrading to version 7 is recommended.

The API changes between version 6 and 7 are documented in
[Changes in version 7.0](reference-(version-7)/changes-in-version-7.md).

Both versions are compatible with all supported stable versions of ArangoDB server, see
[Product Support End-of-life Announcements](https://www.arangodb.com/eol-notice).

They are compatible with JDK 8 and higher versions.

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

### Quarkus and Micronaut examples

The driver can be used from Quarkus and Micronaut applications and does not
require any additional configuration for GraalVM native image generation.
Examples can be found here:

- [arango-quarkus-native-example](https://github.com/arangodb-helper/arango-quarkus-native-example)
- [arango-micronaut-native-example](https://github.com/arangodb-helper/arango-micronaut-native-example)

## ArangoDB Java Driver Shaded

From version 7 onward, a shaded variant of the driver is also published with
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

### Async API

The asynchronous API (formerly under the package `com.arangodb.async`) has been
removed from version 7.0. This has been done because the asynchronous API needs
a substantial refactoring, i.e. supporting the HTTP protocol, fixing the async
client to not block when consuming a cursor, and a better alignment with the
synchronous API. It will be reworked and re-added in a future version 7.x.

## See Also

- [JavaDoc](https://www.javadoc.io/doc/com.arangodb/arangodb-java-driver/latest/index.html)
- [ChangeLog](https://github.com/arangodb/arangodb-java-driver/blob/main/ChangeLog.md)
- [Code examples](https://github.com/arangodb/arangodb-java-driver/tree/main/driver/src/test/java/com/arangodb/example)
- [Tutorial](https://university.arangodb.com/courses/java-driver-tutorial-v7/)
