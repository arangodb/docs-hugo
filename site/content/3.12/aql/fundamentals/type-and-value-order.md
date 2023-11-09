---
title: Type and value order in AQL
menuTitle: Type and value order
weight: 20
description: >-
  AQL uses a set of rules for equality checks and comparisons that takes both
  the data types and the actual values into account
archetype: default
---
When checking for equality or inequality, or when determining the sort order of
values, AQL uses a deterministic algorithm for the comparison.

The compared operands are first compared by their data types, and only by their
data values if the operands have the same data types.

The following type order is used when comparing data types:

```
null  <  bool  <  number  <  string  <  array (or list)  <  object (or document)
```

This means `null` is the smallest type in AQL and *object* is the type with
the highest order. If the compared operands have a different type, then the
comparison result is determined and the comparison is finished.

For example, the boolean `true` value is always less than any numeric or
string value, any array (even an empty array), and any object. Additionally, any
string value (even an empty string) is always greater than any numeric
value and a boolean value (`true` and `false`).

```aql
null  <  false
null  <  true
null  <  0
null  <  ''
null  <  ' '
null  <  '0'
null  <  'abc'
null  <  [ ]
null  <  { }

false  <  true
false  <  0
false  <  ''
false  <  ' '
false  <  '0'
false  <  'abc'
false  <  [ ]
false  <  { }

true  <  0
true  <  ''
true  <  ' '
true  <  '0'
true  <  'abc'
true  <  [ ]
true  <  { }

0  <  ''
0  <  ' '
0  <  '0'
0  <  'abc'
0  <  [ ]
0  <  { }

''  <  ' '
''  <  '0'
''  <  'abc'
''  <  [ ]
''  <  { }

[ ]  <  { }
```

If the two compared operands have the same data types, then the operands values
are compared. For the primitive types (null, boolean, number, and string), the
result is defined as follows:

- **null**: `null` is equal to `null`
- **boolean**: `false` is less than `true`
- **number**: numeric values are ordered by their cardinal value
- **string**: string values are ordered using a localized comparison, using the configured
  [server language](../../components/arangodb-server/options.md#--default-language)
  for sorting according to the alphabetical order rules of that language

Note: unlike in SQL, `null` can be compared to any value, including `null`
itself, without the result being converted into `null` automatically.

For compound types (array and object), the following special rules are applied:

Two **array** values are compared by comparing their individual elements position by
position, starting at the first element. For each position, the element types
are compared first. If the types are not equal, the comparison result is
determined, and the comparison is finished. If the types are equal, then the
values of the two elements are compared. If one of the arrays is finished and
the other array still has an element at a compared position, then `null` is
used as the element value of the fully traversed array.

If an array element is itself a compound value (an array or an object), then the
comparison algorithm checks the element's sub-values recursively. The element's
sub-elements are compared recursively.

```aql
[ ]  <  [ 0 ]
[ 1 ]  <  [ 2 ]
[ 1, 2 ]  <  [ 2 ]
[ 99, 99 ]  <  [ 100 ]
[ false ]  <  [ true ]
[ false, 1 ]  <  [ false, '' ]
```

Two **object** operands are compared by checking attribute names and value. The
attribute names are compared first. Before attribute names are compared, a
combined array of all attribute names from both operands is created and sorted
lexicographically. This means that the order in which attributes are declared
in an object is not relevant when comparing two objects.

The combined and sorted array of attribute names is then traversed, and the
respective attributes from the two compared operands are then looked up. If one
of the objects does not have an attribute with the sought name, its attribute
value is considered to be `null`. Finally, the attribute value of both
objects is compared using the aforementioned data type and value comparison.
The comparisons are performed for all object attributes until there is an
unambiguous comparison result. If an unambiguous comparison result is found, the
comparison is finished. If there is no unambiguous comparison result, the two
compared objects are considered equal.

```aql
{ }  ==  { "a" : null }

{ }  <  { "a" : 1 }
{ "a" : 1 }  <  { "a" : 2 }
{ "b" : 1 }  <  { "a" : 0 }
{ "a" : { "c" : true } }  <  { "a" : { "c" : 0 } }
{ "a" : { "c" : true, "a" : 0 } }  <  { "a" : { "c" : false, "a" : 1 } }

{ "a" : 1, "b" : 2 }  ==  { "b" : 2, "a" : 1 }
```
