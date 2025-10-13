---
title: Spring Data ArangoDB
menuTitle: Spring Data
weight: 5
description: >-
  The Spring Data ArangoDB integration is a library for accessing data stored in
  ArangoDB from Spring-based Java application
---
Spring Data provides a consistent interface for
accessing various types of data sources. Spring Data ArangoDB implements this
for ArangoDB and provides mapping of Java objects to ArangoDB documents (ODM).

- [Repository](https://github.com/arangodb/spring-data)
- [Demo without Spring Boot Starter](https://github.com/arangodb/spring-data/tree/main/tutorial/src/main/java/com/arangodb/spring/demo)
- [Demo with Spring Boot Starter](https://github.com/arangodb/spring-boot-starter/tree/main/demo)
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

## Get started

This tutorial is about how to configure [Spring Data ArangoDB](https://github.com/arangodb/spring-data)
without using Spring Boot Starter ArangoDB.

For a more extensive tutorial about the features of Spring Data ArangoDB and
Spring Boot support, see the [Spring Boot Starter](../spring-boot-arangodb.md)
documentation.

### Build a project with Maven

Set up a project and add every needed dependency. This demo uses Maven and
Spring Boot.

Create a Maven `pom.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <relativePath/>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>x.y.z</version>
    </parent>

    <groupId>com.arangodb</groupId>
    <artifactId>spring-data-arangodb-tutorial</artifactId>
    <version>1.0.0</version>

    <name>spring-data-arangodb-tutorial</name>
    <description>ArangoDB Spring Data Tutorial</description>

    <properties>
        <java.version>21</java.version>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter</artifactId>
        </dependency>
        <dependency>
            <groupId>com.arangodb</groupId>
            <artifactId>arangodb-spring-data</artifactId>
            <version>x.y.z</version>
        </dependency>
    </dependencies>

</project>
```

Substitute `x.y.z` with the latest available versions that are compatible.
See the [Supported versions](#supported-versions) for details.
You may also adjust the Java version.

### Entity classes

For this tutorial we will model our entity with a Java record class:

```java
@Document("characters")
public record Character(
        @Id
        String id,
        String name,
        String surname
) {
}
```

### Create a repository

Now that we have our data model, we want to store data. For this, we create a repository interface which
extends `ArangoRepository`. This gives us access to CRUD operations, paging, and query by example mechanics.

```java
public interface CharacterRepository extends ArangoRepository<Character, String> {
}
```

### Create a Configuration class

{{< tabs "spring-data" >}}

{{< tab "Version 4" >}}
We need a configuration class to set up everything to connect to our ArangoDB instance and to declare that all
needed Spring Beans are processed by the Spring container.

- `@EnableArangoRepositories`: Defines where Spring can find your repositories
- `arango()`: Method to configure the connection to the ArangoDB instance
- `database()`: Method to define the database name
- `returnOriginalEntities()`: Method to configures the behavior of repository save methods to either return the  
  original entities (updated where possible) or new ones. Set to `false` to use java records.

```java
@Configuration
@EnableArangoRepositories(basePackages = {"com.arangodb.spring.demo"})
public class AdbConfig implements ArangoConfiguration {

    @Override
    public ArangoDB.Builder arango() {
        return new ArangoDB.Builder()
                .host("localhost", 8529)
                .user("root")
                .password("test");
    }

    @Override
    public String database() {
        return "spring-demo";
    }

    @Override
    public boolean returnOriginalEntities() {
        return false;
    }
}
```

Note that, in case the driver is configured to use a protocol with `VPACK`
content type (i.e. `HTTP_VPACK` or `HTTP2_VPACK`), then the
`ArangoConfiguration#contentType()` method must be overridden to return
`ContentType.VPACK` as shown in the following example:

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

### Create a CommandLineRunner

To run our demo as command line application, we have to create a class implementing `CommandLineRunner`:

```java
@ComponentScan("com.arangodb.spring.demo")
public class CrudRunner implements CommandLineRunner {

    @Autowired
    private ArangoOperations operations;

    @Autowired
    private CharacterRepository repository;

    @Override
    public void run(String... args) {
        // first drop the database so that we can run this multiple times with the same dataset
        operations.dropDatabase();

        System.out.println("# CRUD operations");

        // save a single entity in the database
        // there is no need of creating the collection first. This happen automatically
        Character nedStark = new Character(null, "Ned", "Stark");
        Character saved = repository.save(nedStark);
        System.out.println("Ned Stark saved in the database: " + saved);
    }
}
```

### Run the application

Finally, we create a main class:

```java
@SpringBootApplication
public class DemoApplication {
  public static void main(final String... args) {
    System.exit(SpringApplication.exit(
            SpringApplication.run(CrudRunner.class, args)
    ));
  }
}
```

And run it with:

```shell
mvn spring-boot:run
```

This should produce a console output similar to:

```
Ned Stark saved in the database: Character[id=2029, name=Ned, surname=Stark]
```

## Using the underlying Java Driver

The underlying Java driver can be obtained via `ArangoOperations.driver()`.
This driver instance is configured by default to use `ArangoConverter` bean to
serialize and deserialize user data, therefore keeping the same
Spring Data ArangoDB serialization behavior.

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
