---
title: Computed Values
menuTitle: Computed Values
weight: 25
description: ''
archetype: default
---
Spring Data ArangoDB provides annotations to allow mapping computed values to entity properties and to include computed 
values data definitions during collection creation.

For reference see the
[indexing](../../../../../concepts/data-structure/documents/computed-values.md) documentation.

## Mapping

Computed values can be mapped to entity properties by annotating the related fields with `@ComputedValueField`. 
 
If the property is mutable, then the field is automatically updated in place with the value coming from the server 
in the following methods:
- `ArangoOperations#repsert(Object)`
- `ArangoOperations#repsertAll(Iterable, Class)`
- `ArangoRepository#save(Object)`
- `ArangoRepository#saveAll(Iterable)`

## Data Definitions

Computed values data definitions can be specified through parameters of the following annotations:
- `@ComputedValueField` on fields
- `@ComputedValueEntry` on classes (optionally within `@ComputedValues`)

For example:
```java
@Document
@ComputedValueEntry(
        name = "username",
        expression = "RETURN \"unknown\"",
        computeOn = ComputedValue.ComputeOn.insert
)
class MyEntity {

    @ComputedValueField
    String username;

    @ComputedValueField("RETURN 0")
    int age;
    
    // ...

}
```

On database collection creation, the computed values metadata will be included.
Note that the data definitions will not be updated, in case the database collection already exists. 
