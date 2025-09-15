---
title: Mapping
menuTitle: Mapping
weight: 20
description: >-
  The features and conventions for mapping Java objects to documents and how to
  override those conventions with annotation based mapping metadata
---
## Conventions

- The Java class name is mapped to the collection name
- The non-static fields of a Java object are used as fields in the stored document
- The Java field name is mapped to the stored document field name
- All nested Java object are stored as nested objects in the stored document
- The Java class needs a constructor which meets the following criteria:
  - in case of a single constructor:
    - a non-parameterized constructor or
    - a parameterized constructor
  - in case of multiple constructors:
    - a non-parameterized constructor or
    - a parameterized constructor annotated with `@PersistenceConstructor`

## Type mapping

As collections in ArangoDB can contain documents of various types, a mechanism
to retrieve the correct Java class is required. The type information of
properties declared in a class may not be enough to restore the original class
(due to inheritance). If the declared complex type and the actual type do not
match, information about the actual type is stored together with the document.
This is necessary to restore the correct type when reading from the DB.
Consider the following example:

```java
public class Person {
    private String name;
    private Address homeAddress;
    // ...

    // getters and setters omitted
}

public class Employee extends Person {
    private Address workAddress;
    // ...

    // getters and setters omitted
}

public class Address {
    private final String street;
    private final String number;
    // ...

    public Address(String street, String number) {
        this.street = street;
        this.number = number;
    }

    // getters omitted
}

@Document
public class Company {
    @Key
    private String key;
    private Person manager;

    // getters and setters omitted
}

Employee manager = new Employee();
manager.setName("Jane Roberts");
manager.setHomeAddress(new Address("Park Avenue", "432/64"));
manager.setWorkAddress(new Address("Main Street",  "223"));
Company comp = new Company();
comp.setManager(manager);
```

The serialized document for the DB looks like this:

```json
{
  "manager": {
    "name": "Jane Roberts",
    "homeAddress": {
      "street": "Park Avenue",
      "number": "432/64"
    },
    "workAddress": {
      "street": "Main Street",
      "number": "223"
    },
    "_class": "com.arangodb.Employee"
  },
  "_class": "com.arangodb.Company"
}
```

Type hints are written for top-level documents (as a collection can contain
different document types) as well as for every value if it's a complex type and
a sub-type of the property type declared. `Map`s and `Collection`s are excluded
from type mapping. Without the additional information about the concrete classes
used, the document couldn't be restored in Java. The type information of the
`manager` property is not enough to determine the `Employee` type.
The `homeAddress` and `workAddress` properties have the same actual and defined
type, thus no type hint is needed.

### Customizing type mapping

By default, the fully qualified class name is stored in the documents as a type
hint. A custom type hint can be set with the `@TypeAlias("my-alias")` annotation
on an entity. Make sure that it is an unique identifier across all entities.
If we would add a `TypeAlias("employee")` annotation to the `Employee` class
above, it would be persisted as `"_class": "employee"`.

The default type key is `_class` and can be changed by overriding the `typeKey()`
method of the `ArangoConfiguration` class.

If you need to further customize the type mapping process, the `arangoTypeMapper()`
method of the configuration class can be overridden. The included
`DefaultArangoTypeMapper` can be customized by providing a list of
[`TypeInformationMapper`](https://docs.spring.io/spring-data/commons/docs/current/api/org/springframework/data/convert/TypeInformationMapper.html)s
that create aliases from types and vice versa.

In order to fully customize the type mapping process you can provide a custom
type mapper implementation by extending the `DefaultArangoTypeMapper` class.

### Deactivating type mapping

To deactivate the type mapping process, you can return `null` from the `typeKey()`
method of the `ArangoConfiguration` class. No type hints are stored in the
documents with this setting. If you make sure that each defined type corresponds
to the actual type, you can disable the type mapping, otherwise it can lead to
exceptions when reading the entities from the DB.

### Security considerations

The default polymorphic type handling strategy used by Spring Data ArangoDB uses
the type hint stored in the `_class` field, which is the fully qualified class
name by default.

In particular, when reading a property of type `java.lang.Object`, any class
referenced by the `_class` field could be instantiated.

In addition, the framework instantiates deserialized objects by invoking
constructors with arguments and setting properties invoking the related setters.

This represents a security vulnerability when dealing with untrusted data, which
could cause deserialization to arbitrary target classes, trigger gadget chain
attacks, and potentially lead to remote code execution. See
[Insecure deserialization](https://learn.snyk.io/lesson/insecure-deserialization)
for details.

Therefore, using the type `java.lang.Object` for persistent entities properties
is strongly discouraged, in particular when used for modeling untrusted data,
i.e. arbitrary JSON data coming from web users. Note that this also applies to
generics type parameters, i.e. `Map<String, Object>`, `List<Object>`, and so on.

As work-around, it is recommended to use specific user-defined types for
persistent entities properties.

Properties containing arbitrary JSON data can be safely typed using Jackson types
like the following:
- `com.fasterxml.jackson.databind.JsonNode`
- `com.fasterxml.jackson.databind.node.ObjectNode`
- `com.fasterxml.jackson.databind.node.ArrayNode`

## Annotations

### Annotation overview

| annotation                     | level                     | description                                                                                                                                                               |
|--------------------------------| ------------------------- |---------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| @Document                      | class                     | marks this class as a candidate for mapping                                                                                                                               |
| @Edge                          | class                     | marks this class as a candidate for mapping                                                                                                                               |
| @Id                            | field                     | stores the field as the system field \_key                                                                                                                                |
| @ArangoId                      | field                     | stores the field as the system field \_id                                                                                                                                 |
| @Rev                           | field                     | stores the field as the system field \_rev                                                                                                                                |
| @Field("alt-name")             | field                     | stores the field with an alternative name                                                                                                                                 |
| @Ref                           | field                     | stores the \_id of the referenced document and not the nested document                                                                                                    |
| @From                          | field                     | stores the \_id of the referenced document as the system field \_from                                                                                                     |
| @To                            | field                     | stores the \_id of the referenced document as the system field \_to                                                                                                       |
| @Relations                     | field                     | nodes which are connected over edges                                                                                                                                      |
| @Transient                     | field, method, annotation | marks a field to be transient for the mapping framework, thus the property is not persisted and not further inspected by the mapping framework                            |
| @PersistenceConstructor        | constructor               | marks a given constructor - even a package protected one - to use when instantiating the object from the database                                                         |
| @TypeAlias("alias")            | class                     | set a type alias for the class when persisted to the DB                                                                                                                   |
| @ArangoComputedValueDefinition | class                     | describes a computed value data definition                                                                                                                                |
| @ArangoComputedValue           | field                     | marks the field for the mapping framework so that the property is updated with the value coming from the server and optionally describes a computed value data definition |
| @PersistentIndex               | class                     | describes a persistent index                                                                                                                                              |
| @PersistentIndexed             | field                     | describes how to index the field                                                                                                                                          |
| @GeoIndex                      | class                     | describes a geo index                                                                                                                                                     |
| @GeoIndexed                    | field                     | describes how to index the field                                                                                                                                          |
| @FulltextIndex                 | class                     | describes a fulltext index                                                                                                                                                |
| @FulltextIndexed               | field                     | describes how to index the field                                                                                                                                          |
| @TtlIndex                      | class                     | describes a TTL index                                                                                                                                                     |
| @TtlIndexed                    | field                     | describes how to index the field                                                                                                                                          |
| @MDIndex                       | class                     | describes a Multi Dimensional index                                                                                                                                       |
| @MDPrefixedIndex               | class                     | describes a Multi Dimensional Prefixed index                                                                                                                              |
| @CreatedBy                     | field                     | Declares a field as the one representing the principal that created the entity containing the field.                                                                      |
| @CreatedDate                   | field                     | Declares a field as the one representing the date the entity containing the field was created.                                                                            |
| @LastModifiedBy                | field                     | Declares a field as the one representing the principal that recently modified the entity containing the field.                                                            |
| @LastModifiedDate              | field                     | Declares a field as the one representing the date the entity containing the field was recently modified.                                                                  |

## Invoking conversion manually

In order to invoke entity serialization and deserialization to and from Jackson
`JsonNode` manually, you can inject an instance of `ArangoConverter` and
respectively call the methods `write` and `read` on it, e.g.:

```java
// ...

@Autowired
ArangoConverter arangoConverter;

  // ...
  JsonNode jn = converter.write(entity);

  // ...
  MyEntity entity = converter.read(MyEntity.class, jn);
```

## Object Mapping

Spring Data ArangoDB delegates object mapping, object creation, field and property access to
[Spring Data Commons](https://docs.spring.io/spring-data/commons/reference/object-mapping.html).

Methods in `ArangoOperations` try modifying the domain objects accepted as parameters,
updating the properties potentially modified by the server side, if the related fields
are mutable. This applies to the fields annotated with:
- `@ArangoId`
- `@Id` 
- `@Rev`

In addition, the following methods also try to update the fields annotated with
`@ArangoComputedValue`:
- `ArangoOperations#repsert(Object)`
- `ArangoOperations#repsertAll(Iterable<Object>, Class<?>)`

## Object Identity

The most of the methods in `ArangoOperations` and `ArangoRepository` return new
entity instances, except the following:
- `ArangoRepository#save(Object)`
- `ArangoRepository#saveAll(Iterable<Object>)`

These methods return by default the same instance(s) of the domain object(s)
accepted as parameter(s) and update the properties potentially modified by the
server side, if the related fields are mutable.
This applies to the fields annotated with:
- `@ArangoId`
- `@Id`
- `@Rev`
- `@ArangoComputedValue`

This behavior can be changed by overriding `ArangoConfiguration#returnOriginalEntities()`,
which by default returns `true`. For example:

```java
@Configuration
@EnableArangoRepositories
public class MyConfiguration implements ArangoConfiguration {

  // ...

  @Override
  public boolean returnOriginalEntities() {
    return false; 
  }
  
}
```

Note that also in this case, input parameters properties are still updated, if mutable.

## Working with immutable objects

Spring Data ArangoDB can work with immutable entity classes, like Java Records,
Kotlin data classes and final classes with immutable properties. In this case,
to use `ArangoRepository#save(Object)` and `ArangoRepository#saveAll(Iterable<Object>)`
is required overriding `ArangoConfiguration#returnOriginalEntities()` to make it
return `false`, see [Object Identity](#object-identity).
