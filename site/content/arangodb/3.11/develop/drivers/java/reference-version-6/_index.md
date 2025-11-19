---
title: ArangoDB Java Driver version 6
menuTitle: Reference version 6
weight: 10
description: >-
  The official ArangoDB Java Driver version 6
---
{{< warning >}}
Version 6 reached End of Life (EOL) and is not actively developed anymore.
Upgrading to version 7 is recommended.
{{< /warning >}}

- Repository: <https://github.com/arangodb/arangodb-java-driver/tree/v6>
- [Code examples](https://github.com/arangodb/arangodb-java-driver/tree/v6/src/test/java/com/arangodb/example)
- [JavaDoc](https://javadoc.io/doc/com.arangodb/arangodb-java-driver/6.25.0/index.html) (generated reference documentation)
- [ChangeLog](https://github.com/arangodb/arangodb-java-driver/blob/v6/ChangeLog.md)
- [Java VelocyPack](https://github.com/arangodb/java-velocypack) ([JavaDoc](https://www.javadoc.io/doc/com.arangodb/velocypack/latest/index.html))

## Supported versions

Only the latest version of this driver is maintained to support the most recent
ArangoDB server features. 
It is compatible with all supported stable versions of ArangoDB server, see 
[Product Support End-of-life Announcements](https://arango.ai/arangodb-product-support-end-of-life-announcements/).

The minimum required Java version is 1.8+ (since driver version 6.x.x).

## Sync and async usage

The driver can be used synchronously as well as asynchronously. The formerly separate async
driver with the same API as the synchronous driver, except that it returned a
`CompletableFuture<T>` instead of the result `T` directly, was merged into this
driver in version 6.2.0. See
[async examples](https://github.com/arangodb/arangodb-java-driver/tree/v6/src/test/java/com/arangodb/async/example).

## Maven

To add the driver to your project with Maven, add the following code to your
pom.xml (substitute `x.x.x` with the latest driver version):

```xml
<dependencies>
  <dependency>
    <groupId>com.arangodb</groupId>
    <artifactId>arangodb-java-driver</artifactId>
    <version>x.x.x</version>
  </dependency>
</dependencies>
```

## Compile the Java Driver

```
mvn clean install -DskipTests=true -Dgpg.skip=true -Dmaven.javadoc.skip=true -B
```

## GraalVM Native Image

The driver supports GraalVM Native Image generation since version `6.6.1`.
The related configuration can be found here:

- [native-image](https://github.com/arangodb/arangodb-java-driver/tree/v6/src/main/resources/META-INF/native-image)

### Quarkus and Helidon support

The driver can be used from Quarkus and Helidon applications and does not
require any additional configuration for GraalVM native image generation.
Examples can be found here:

- [arango-quarkus-native-example](https://github.com/arangodb-helper/arango-quarkus-native-example)
- [arango-helidon-native-example](https://github.com/arangodb-helper/arango-helidon-native-example)
