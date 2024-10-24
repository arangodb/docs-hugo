---
title: Spring Data ArangoDB
menuTitle: Spring Data
weight: 5
description: ''
---
This integration is a library for accessing data stored in ArangoDB in
Spring-based Java application. Spring Data provides a consistent interface for
accessing various types of data sources. Spring Data ArangoDB implements this
for ArangoDB and provides mapping of Java objects to ArangoDB documents (ODM).

- [Spring Data Tutorial](https://university.arangodb.com/courses/spring-data-tutorial)
- [Demo](https://github.com/arangodb/spring-data-demo)
- [Reference (version 4)](reference-version-4/_index.md)
- [Reference (version 3)](reference-version-3/_index.md)
- [JavaDoc](https://www.javadoc.io/doc/com.arangodb/arangodb-spring-data/latest)
- [Changelog](https://github.com/arangodb/spring-data/blob/master/ChangeLog.md#changelog)
- [Migration](migration/_index.md)

## Supported versions

Spring Data ArangoDB is compatible with:

{{< tabs "spring-data" >}}

{{< tab "Version 4" >}}
- all the still supported Spring Boot 3.x [versions](https://spring.io/projects/spring-boot#support)
  and related Spring Framework versions
- all the still supported ArangoDB [versions](https://arangodb.com/subscriptions/end-of-life-notice/)
{{< /tab >}}

{{< tab "Version 3" >}}
- all the still supported Spring Boot 2.x [versions](https://spring.io/projects/spring-boot#support)
  and related Spring Framework versions
- all the still supported ArangoDB [versions](https://arangodb.com/subscriptions/end-of-life-notice/)
{{< /tab >}}

{{< /tabs >}}

## Maven

To use Spring Data ArangoDB in your project, your build automation tool needs to
be configured to include and use the Spring Data ArangoDB dependency.
Example with Maven (substitute `x.x.x` with the latest Spring Data ArangoDB version):

```xml
<dependency>
  <groupId>com.arangodb</groupId>
  <artifactId>arangodb-spring-data</artifactId>
  <version>x.x.x</version>
</dependency>
```

There is a [demonstration app](https://github.com/arangodb/spring-data-demo), which contains common use cases and examples of how to use Spring Data ArangoDB's functionality.

## Configuration

{{< tabs "spring-data" >}}

{{< tab "Version 4" >}}
You can use Java to configure your Spring Data environment as show below.
Setting up the underlying driver (`ArangoDB.Builder`) with default configuration
automatically loads a properties file `arangodb.properties`, if it exists in the
classpath.

```java
@Configuration
@EnableArangoRepositories(basePackages = { "com.company.mypackage" })
public class MyConfiguration implements ArangoConfiguration {

  @Override
  public ArangoDB.Builder arango() {
    return new ArangoDB.Builder();
  }

  @Override
  public String database() {
    // Name of the database to be used
    return "example-database";
  }

}
```

The driver configuration can be customized by implementing `ArangoConfiguration#arango()`:

```java
@Override
public ArangoDB.Builder arango() {
  return new ArangoDB.Builder()
      .host("127.0.0.1", 8529)
      .user("root")
      .password("xxx");
}
```

Note that, in case the driver is configured to use a protocol with `VPACK` content type 
(i.e. `VST`, `HTTP_VPACK` or `HTTP2_VPACK`), then the method
`ArangoConfiguration#contentType()` must be overridden to return `ContentType.VPACK`, for example:

```java
@Override
public ArangoDB.Builder arango() {
  new ArangoDB.Builder()
      // ...    
      .protocol(Protocol.HTTP2_VPACK);
}

@Override
public ContentType contentType() {
  return ContentType.VPACK;
}
```

{{< /tab >}}

{{< tab "Version 3" >}}
You can use Java to configure your Spring Data environment as show below.
Setting up the underlying driver (`ArangoDB.Builder`) with default configuration
automatically loads a properties file `arangodb.properties`, if it exists in the
classpath.

```java
@Configuration
@EnableArangoRepositories(basePackages = { "com.company.mypackage" })
public class MyConfiguration implements ArangoConfiguration {

  @Override
  public ArangoDB.Builder arango() {
    return new ArangoDB.Builder();
  }

  @Override
  public String database() {
    // Name of the database to be used
    return "example-database";
  }

}
```

The driver is configured with some default values:

| property-key      | description                         | default value |
| ----------------- | ----------------------------------- | ------------- |
| arangodb.host     | ArangoDB host                       | 127.0.0.1     |
| arangodb.port     | ArangoDB port                       | 8529          |
| arangodb.timeout  | socket connect timeout(millisecond) | 0             |
| arangodb.user     | Basic Authentication User           |
| arangodb.password | Basic Authentication Password       |
| arangodb.useSsl   | use SSL connection                  | false         |

To customize the configuration, the parameters can be changed in the Java code.

```java
@Override
public ArangoDB.Builder arango() {
  ArangoDB.Builder arango = new ArangoDB.Builder()
    .host("127.0.0.1")
    .port(8529)
    .user("root");
  return arango;
}
```

In addition you can use the _arangodb.properties_ or a custom properties file to supply credentials to the driver.

_Properties file_

```
arangodb.hosts=127.0.0.1:8529
arangodb.user=root
arangodb.password=
```

_Custom properties file_

```java
@Override
public ArangoDB.Builder arango() {
  InputStream in = MyClass.class.getResourceAsStream("my.properties");
  ArangoDB.Builder arango = new ArangoDB.Builder()
    .loadProperties(in);
  return arango;
}
```

{{< /tab >}}

{{< /tabs >}}

## Using the underlying Java Driver

The underlying Java driver can be obtained via `ArangoOperations.driver()`.
This driver instance is configured by default to use `ArangoConverter` bean to
serialize and deserialize user data, therefore keeping the same
Spring Data ArangoDB serialization behavior.

## Spring Boot

Spring Boot support is offered by [Spring Boot Starter ArangoDB](https://github.com/arangodb/spring-boot-starter).

## Limitations

{{< tabs "spring-data" >}}

{{< tab "Version 4" >}}
- GraalVM Native Image (available with Spring Boot 3) is not supported (DE-677)
- Spring Data REST is not supported (DE-43)
- Spring Data Reactive is not supported (DE-678)
{{< /tab >}}

{{< tab "Version 3" >}}
- Java Record classes and Kotlin Data classes are not supported (DE-539)
- Spring Data REST is not supported (DE-43)
- Spring Data Reactive is not supported (DE-678)
{{< /tab >}}

{{< /tabs >}}
