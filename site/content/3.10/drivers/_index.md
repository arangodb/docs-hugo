---
title: ArangoDB Drivers Documentation
menuTitle: Drivers
weight: 25
description: >-
  ArangoDB drivers and integrations allow you to use ArangoDB as a database
  system for your applications
archetype: chapter
---
## Drivers

Database drivers, also called connectors, adapters, or client libraries, let you
access and manage database systems. ArangoDB drivers are interfaces between
programming languages and ArangoDB, which enable software developers to connect
to and manipulate ArangoDB deployments from within compiled programs or using
scripting languages.

From a language perspective, documents and database structures can be integrated
with data types and their methods. The precise mapping of concepts and methods
depends on the capabilities and practices of each language.

Programming is a powerful way of automating interactions and control of the
database, as well as to integrate database operations into your own software.
The drivers listed below are officially maintained and supported by ArangoDB.
If your programming language or environment is not listed, 

### Java driver

The [**ArangoDB Java driver**](official-drivers/java-driver/_index.md) lets you work with ArangoDB in the
Java programming language.

- Online course: [Java Driver v7 Tutorial](https://university.arangodb.com/courses/java-driver-tutorial-v7/)
- Repository: [github.com/arangodb/arangodb-java-driver](https://github.com/arangodb/arangodb-java-driver)
- [Changelog](https://github.com/arangodb/arangodb-java-driver/blob/main/ChangeLog.md#readme)

### Go driver

The [**Go driver**](official-drivers/arangodb-go-driver.md) lets you work with ArangoDB in the Go programming
language.

- Tutorial: [Go Driver Tutorial](https://university.arangodb.com/courses/go-driver-tutorial/)
- Repository: [github.com/arangodb/go-driver](https://github.com/arangodb/go-driver)
- [Changelog](https://github.com/arangodb/go-driver/blob/master/CHANGELOG.md#readme)

### C#/.NET driver

The [**arangodb-net-standard driver**](official-drivers/arangodb-csharp-dotnet-driver.md) lets you work with ArangoDB
using the C# programming language and the .NET ecosystem.

- Online course: [C#/.NET Driver Tutorial](https://university.arangodb.com/courses/csharp-dotnet-driver-tutorial/)
- Repository: [github.com/ArangoDB-Community/arangodb-net-standard](https://github.com/ArangoDB-Community/arangodb-net-standard)
- [Changelog](https://github.com/ArangoDB-Community/arangodb-net-standard/blob/master/ChangeLog.md)

### Node.js driver

The [**ArangoJS driver**](official-drivers/arangojs-javascript-driver.md) lets you work with ArangoDB in Node.js, using
the JavaScript scripting language. You can also use it in web browsers.

- Repository: [github.com/arangodb/arangojs](https://github.com/arangodb/arangojs)
- [Changelog](https://github.com/arangodb/arangojs/blob/main/CHANGELOG.md#readme)

### Python driver

The [**Python-Arango**](official-drivers/python-arango-driver.md) driver lets you work with ArangoDB in the
Python scripting language.

- Online course: [Python Driver Tutorial](https://www.arangodb.com/tutorials/tutorial-python/)
- Repository: [github.com/ArangoDB-Community/python-arango](https://github.com/ArangoDB-Community/python-arango)
- [Releases](https://github.com/ArangoDB-Community/python-arango/releases)

## Integrations

Database integrations allow applications to work with different database systems
using a common interface. They are higher-level than database drivers because
they abstract away the details of specific database systems, especially the
low-level network communication.

### Spring Data

The [**Spring Data integration**](integrations/spring-data-arangodb/_index.md) for ArangoDB lets you use
ArangoDB as a database system in Spring-based Java applications.

- Online course: [Spring Data Tutorial](https://university.arangodb.com/courses/spring-data-tutorial)
- Repository: [github.com/arangodb/spring-data](https://github.com/arangodb/spring-data)
- [Changelog](https://github.com/arangodb/spring-data/blob/master/ChangeLog.md#readme)

### Apache Spark

The [**ArangoDB Datasource for Apache Spark**](integrations/arangodb-datasource-for-apache-spark.md) is a
library that lets you use Apache Spark with ArangoDB for data processing.
Apache Spark has first-party support for the Scala, Java, Python, and R language.

- Repository: [github.com/arangodb/arangodb-spark-datasource](https://github.com/arangodb/arangodb-spark-datasource)
- [Changelog](https://github.com/arangodb/arangodb-spark-datasource/blob/main/ChangeLog.md)

The [**ArangoDB-Spark-Connector**](integrations/arangodb-spark-connector/_index.md) is the predecessor of
the ArangoDB Datasource library for the Scala and Java programming languages,
but it is recommended to use the new library instead.

 - Repository: [github.com/arangodb/arangodb-spark-connector](https://github.com/arangodb/arangodb-spark-connector)
 - [Changelog](https://github.com/arangodb/arangodb-spark-connector/blob/master/ChangeLog.md#readme)
