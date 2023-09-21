---
title: Spring Data ArangoDB - Migration
menuTitle: Migration
weight: 10
description: ''
archetype: default
---
## Migrate from Spring Data ArangoDB 3.x to 4.0

### JDK 17, Spring Framework 6 and Spring Boot 3

Spring Data ArangoDB 4.0 requires:

- [JDK 17](https://github.com/spring-projects/spring-framework/wiki/Upgrading-to-JDK-17)
- [Spring Framework 6](https://github.com/spring-projects/spring-framework/wiki/Upgrading-to-Spring-Framework-6.x)

[Spring Boot Starter ArangoDB](https://github.com/arangodb/spring-boot-starter) provides integration with 
[Spring Boot 3](https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-3.0-Migration-Guide).

### Java Driver 7

The implementation is now based on 
[Java Driver 7](../../drivers/java/reference-version-7/changes-in-version-7.md).

### Exception Translation

- exceptions in `ArangoOperations.query()` and repository queries (derived queries and `@Query` annotated methods) are
  now translated to Spring Data exceptions (`DataAccessExceptions` and subclasses)
- `OptimisticLockingFailureException` is now thrown in case of `_rev` conflict

### Serialization

- support for data type `VPackSlice` has been removed in favor of Jackson type `com.fasterxml.jackson.databind.JsonNode`
  and its subclasses (`ArrayNode`, `ObjectNode`, ...)

- the underlying Java driver (accessible via `com.arangodb.springframework.core.ArangoOperations#driver()`) uses
  now the `ArangoConverter` bean to serialize and deserialize user data

### API changes

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

### Removed

- removed deprecated `AbstractArangoConfiguration` in favor of `ArangoConfiguration`
- removed support for Joda-Time
- removed `ArangoOperations.insert(String collectionName, ...)` methods
- removed previously deprecated API classes and methods

## Migrate from Spring Data ArangoDB 2.x to 3.0

### Annotations @Key

The annotation `@Key` is removed. Use `@Id` instead.

### Annotations @Id

The annotation `@Id` is now saved in the database as field `_key` instead of `_id`.
All operations in `ArangoOperations` and `ArangoRepository` still work with `@Id`
and also now supports non-String fields.

If you - for some reason - need the value of `_id` within your application, you
can use the annotation `@ArangoId` on a `String` field instead of `@Id`.

**Note**: The field annotated with `@ArangoId` will not be persisted in the
database. It only exists for reading purposes.

### ArangoRepository

`ArangoRepository` now requires a second generic type. This type `ID` represents
the type of your domain object field annotated with `@Id`.

**Examples**

```java
public class Customer {
  @Id private String id;
}

public interface CustomerRepository extends ArangoRepository<Customer, String> {

}
```

### Annotation @Param

The annotation `com.arangodb.springframework.annotation.Param` is removed. Use `org.springframework.data.repository.query.Param` instead.

### DBEntity

`DBEntity` is removed. Use `VPackSlice` in your converter instead.

### DBCollectionEntity

`DBCollectionEntity` is removed. Use `VPackSlice` in your converter instead.

## Migrate from Spring Data ArangoDB 1.x to 3.0

The steps are the same as for [Migrating from Spring Data ArangoDB 2.x to 3.0](#migrate-from-spring-data-arangodb-2x-to-30).
