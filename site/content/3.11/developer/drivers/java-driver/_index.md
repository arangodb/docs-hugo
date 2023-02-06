---
fileID: java
title: ArangoDB Java Driver
weight: 3875
description: 
layout: default
---
The official ArangoDB [Java Driver](https://github.com/arangodb/arangodb-java-driver).

- [Java Driver v6 Tutorial](https://university.arangodb.com/courses/java-driver-tutorial-v6/)
- [Reference](reference/)

## Supported versions

Only the latest version of this driver is maintained to support the most recent
ArangoDB server features. 
It is compatible with all supported stable versions of ArangoDB server, see 
[Product Support End-of-life Announcements](https://www.arangodb.com/eol-notice).

The minimum required Java version is 1.8+ (since driver version 6.x.x).

## Sync and async usage

The driver can be used synchronously as well as asynchronously. The formerly separate async
driver with the same API as the synchronous driver, except that it returned a
`CompletableFuture<T>` instead of the result `T` directly, was merged into this
driver in version 6.2.0. See
[async examples](https://github.com/arangodb/arangodb-java-driver/tree/master/src/test/java/com/arangodb/async/example).

## Maven

To add the driver to your project with maven, add the following code to your
pom.xml (substitute `x.x.x` with the latest driver version):

{{< tabs >}}
{{% tab name="xml" %}}
```xml
<dependencies>
  <dependency>
    <groupId>com.arangodb</groupId>
    <artifactId>arangodb-java-driver</artifactId>
    <version>x.x.x</version>
  </dependency>
</dependencies>
```
{{% /tab %}}
{{< /tabs >}}

## Compile the Java Driver

{{< tabs >}}
{{% tab name="" %}}
```
mvn clean install -DskipTests=true -Dgpg.skip=true -Dmaven.javadoc.skip=true -B
```
{{% /tab %}}
{{< /tabs >}}

## GraalVM Native Image

The driver supports GraalVM Native Image generation since version `6.6.1`.
The related configuration can be found here:

- [native-image](https://github.com/arangodb/arangodb-java-driver/tree/master/src/main/resources/META-INF/native-image)

### Quarkus and Helidon support

The driver can be used from Quarkus and Helidon applications and does not
require any additional configuration for GraalVM native image generation.
Examples can be found here:

- [arango-quarkus-native-example](https://github.com/arangodb-helper/arango-quarkus-native-example)
- [arango-helidon-native-example](https://github.com/arangodb-helper/arango-helidon-native-example)

## See Also
  
- [JavaDoc](https://arangodb.github.io/arangodb-java-driver/) (reference)
- [ChangeLog](https://github.com/arangodb/arangodb-java-driver/blob/master/ChangeLog.md)
- [Code examples](https://github.com/arangodb/arangodb-java-driver/tree/master/src/test/java/com/arangodb/example)
- [Java VelocyPack](https://github.com/arangodb/java-velocypack) ([JavaDoc](https://arangodb.github.io/java-velocypack))
