---
title: Spring Boot Starter ArangoDB
menuTitle: Spring Boot Starter
weight: 7
description: >-
  Spring Boot Starter ArangoDB
archetype: default
---

## Supported versions

Spring Boot Starter ArangoDB is compatible with all supported versions of ArangoDB.
For more information, see the [End-of-life announcements](https://www.arangodb.com/subscriptions/end-of-life-notice/).

This integration has multiple versions released, and each one is compatible with
the corresponding versions of Spring Boot, Spring Framework, Spring Data ArangoDB,
and ArangoDB Java Driver:

| Spring Boot Starter ArangoDB | Spring Boot | Spring Framework | Spring Data ArangoDB | ArangoDB Java Driver |
|------------------------------|-------------|------------------|----------------------|----------------------|
| 3.1-x                        | 3.1         | 6.0              | 4.0                  | 7.1                  |
| 3.0-x                        | 3.0         | 6.0              | 4.0                  | 7.1                  |
| 2.7-x                        | 2.7         | 5.3              | 3.10                 | 6.25                 |

Note that the adopted versioning scheme does not honor the semantic versioning
rules, i.e. minor or patch releases may introduce new features or breaking
changes. Please refer to [releases](https://github.com/arangodb/spring-boot-starter/releases)
for details.

## Maven

Add `arangodb-spring-boot-starter` to your project to auto-configure Spring
Data ArangoDB.

```xml
<dependency>
  <groupId>com.arangodb</groupId>
  <artifactId>arangodb-spring-boot-starter</artifactId>
  <version>3.x-y</version>
</dependency>
```

## Configuration

Configure the properties files of your application with the properties of
[ArangoProperties](https://github.com/mpv1989/spring-boot-starter/blob/master/src/main/java/com/arangodb/springframework/boot/autoconfigure/ArangoProperties.java).

```
arangodb.spring.data.database=mydb
arangodb.spring.data.user=root
arangodb.spring.data.password=1234
```

## Monitor
ArangoDB health monitoring can be applied to your application by adding
`spring-boot-starter-actuator` to your project and calling the `GET /actuator/health` 
endpoint against your application.

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```