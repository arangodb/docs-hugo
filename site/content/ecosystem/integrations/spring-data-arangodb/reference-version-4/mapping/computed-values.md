---
title: Computed Values
menuTitle: Computed Values
weight: 27
description: ''
archetype: default
---
Spring Data ArangoDB provides annotations to allow mapping computed values to
entity properties and to include computed values data definitions during
collection creation.

For reference, see the [computed values](../../../../../../arangodb/3.12/concepts/data-structure/documents/computed-values.md)
documentation.

## Mapping

Computed values can be mapped to entity properties by annotating the related
fields with `@ArangoComputedValue`. 
 
If the property is mutable, then the field is automatically updated in place
with the value coming from the server in the following methods:
- `ArangoOperations#repsert(Object)`
- `ArangoOperations#repsertAll(Iterable, Class)`
- `ArangoRepository#save(Object)`
- `ArangoRepository#saveAll(Iterable)`

## Data Definitions

Computed values data definitions can be specified through parameters of the
following annotations:
- `@ArangoComputedValue` on fields
- `@ArangoComputedValueDefinition` on classes (optionally within `@ArangoComputedValueDefinitions`)

**Example**

```java
@Document
@ArangoComputedValueDefinition(
        name = "username",
        expression = "RETURN \"unknown\"",
        computeOn = ComputedValue.ComputeOn.insert
)
class MyEntity {

    @ArangoComputedValue
    String username;

    @ArangoComputedValue("RETURN 0")
    int age;
    
    // ...

}
```

On database collection creation, the computed values metadata is included.
Note that the data definitions are not updated in case the database collection
already exists. 
