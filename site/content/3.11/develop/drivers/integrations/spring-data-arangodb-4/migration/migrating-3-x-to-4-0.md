---
title: Migrating Spring Data ArangoDB 3.x to 4.0
menuTitle: Migrating 3.x to 4.0
weight: 10
description: ''
archetype: default
---
## JDK 17, Spring Framework 6 and Spring Boot 3

Spring Data ArangoDB 4.0 requires:

- [JDK 17](https://github.com/spring-projects/spring-framework/wiki/Upgrading-to-JDK-17)
- [Spring Framework 6](https://github.com/spring-projects/spring-framework/wiki/Upgrading-to-Spring-Framework-6.x)

[Spring Boot Starter ArangoDB](https://github.com/arangodb/spring-boot-starter) provides integration with 
[Spring Boot 3](https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-3.0-Migration-Guide).


## Java Driver 7

The implementation is now based on 
[Java Driver 7](../../../official-drivers/java-driver/reference-version-7/changes-in-version-7.html).


## Exception Translation

- exceptions in `ArangoOperations.query()` and repository queries (derived queries and `@Query` annotated methods) are
  now translated to Spring Data exceptions (`DataAccessExceptions` and subclasses)
- `OptimisticLockingFailureException` is now thrown in case of `_rev` conflict


## Serialization

- support for data type `VPackSlice` has been removed in favor of Jackson type `com.fasterxml.jackson.databind.JsonNode`
  and its subclasses (`ArrayNode`, `ObjectNode`, ...)

- the underlying Java driver (accessible via `com.arangodb.springframework.core.ArangoOperations#driver()`) uses
  now the `ArangoConverter` bean to serialize and deserialize user data


## API changes

- `CrudRepository.deleteById()`now silently ignores an unknown id (as defined by API contract)
- renamed `ArangoOperations` methods operating on multiple documents with `All` suffix (e.g. `insert(Iterable)` has been
  renamed to `insertAll(Iterable)`
- `ArangoOperations` methods for single document manipulation have now specific return
  types (, `DocumentDeleteEntity<T>`, `DocumentUpdateEntity<T>`, `DocumentCreateEntity<T>`)
- `ArangoOperations` methods for multiple documents manipulation have now specific return types as for single documents,
  wrapped by `MultiDocumentEntity<>`
- `ArangoOperations` methods for documents manipulation accepting options `returnNew(boolean)` or `returnOld(boolean)`
  return now the deserialized entity in the response (accessible via `getNew()` or `getOld()`)
- changed the arguments order of some `ArangoOperations` methods for better API coherence
- changed the arguments type of some `ArangoOperations` methods to be covariant
- return updated entity from `ArangoOperations.repsert()`


## Removed

- removed deprecated `AbstractArangoConfiguration` in favor of `ArangoConfiguration`
- removed support for Joda-Time
- removed `ArangoOperations.insert(String collectionName, ...)` methods
- removed previously deprecated API classes and methods
