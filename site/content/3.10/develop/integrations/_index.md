---
title: Integrations
menuTitle: Integrations
weight: 290
description: >-
  Integrations for third-party tools and frameworks let you use ArangoDB as the
  database backend for these products
archetype: chapter
---
Database integrations allow applications to work with different database systems
using a common interface. They are higher-level than database drivers because
they abstract away the details of specific database systems, especially the
low-level network communication.

## Spring Data

The [**Spring Data integration**](spring-data-arangodb/_index.md) for ArangoDB lets you use
ArangoDB as a database system in Spring-based Java applications.

- Online course: [Spring Data Tutorial](https://university.arangodb.com/courses/spring-data-tutorial)
- Repository: [github.com/arangodb/spring-data](https://github.com/arangodb/spring-data)
- [Changelog](https://github.com/arangodb/spring-data/blob/master/ChangeLog.md#readme)

## Apache Spark

The [**ArangoDB Datasource for Apache Spark**](arangodb-datasource-for-apache-spark.md) is a
library that lets you use Apache Spark with ArangoDB for data processing.
Apache Spark has first-party support for the Scala, Java, Python, and R language.

- Repository: [github.com/arangodb/arangodb-spark-datasource](https://github.com/arangodb/arangodb-spark-datasource)
- [Changelog](https://github.com/arangodb/arangodb-spark-datasource/blob/main/ChangeLog.md)

## Apache Kafka

The [**Kafka Connect ArangoDB Sink Connector**](kafka-connect-arangodb-sink-connector/_index.md)
allows you to export data from Apache Kafka to ArangoDB.

- Repository: [github.com/arangodb/kafka-connect-arangodb/](https://github.com/arangodb/kafka-connect-arangodb/)
- [Demo](https://github.com/arangodb/kafka-connect-arangodb/tree/main/demo)
- [ChangeLog](https://github.com/arangodb/kafka-connect-arangodb/blob/main/ChangeLog.md)
