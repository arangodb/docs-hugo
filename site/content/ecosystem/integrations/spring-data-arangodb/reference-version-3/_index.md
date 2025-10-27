---
title: Spring Data ArangoDB - Reference (version 3)
menuTitle: Reference version 3
weight: 6
description: ''
---
{{< warning >}}
Spring Data ArangoDB version 3 reached End of Life (EOL) and is not actively
developed anymore. Upgrading to version 4 is recommended.
{{< /warning >}}

## Supported versions

Spring Data ArangoDB version 3 is compatible with:

- Spring Boot 2.7.x and related Spring Framework versions
- ArangoDB 3.11 and 3.12

## Maven

To use Spring Data ArangoDB in your project, your build automation tool needs to
be configured to include and use the Spring Data ArangoDB dependency.
Example with Maven (substitute `3.x.x` with the latest Spring Data ArangoDB version):

```xml
<dependency>
  <groupId>com.arangodb</groupId>
  <artifactId>arangodb-spring-data</artifactId>
  <version>3.x.x</version>
</dependency>
```

## Configuration

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

## Using the underlying Java Driver

The underlying Java driver can be obtained via `ArangoOperations.driver()`.
This driver instance is configured by default to use `ArangoConverter` bean to
serialize and deserialize user data, therefore keeping the same
Spring Data ArangoDB serialization behavior.

## Spring Boot

Spring Boot support is offered by [Spring Boot Starter ArangoDB](https://github.com/arangodb/spring-boot-starter).

## Limitations

- Java Record classes and Kotlin Data classes are not supported (DE-539)
- Spring Data REST is not supported (DE-43)
- Spring Data Reactive is not supported (DE-678)
