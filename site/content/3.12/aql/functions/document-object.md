---
title: Document functions
menuTitle: Document / Object
weight: 25
description: >-
  AQL provides below listed functions to operate on objects / document values
archetype: default
---
AQL provides below listed functions to operate on objects / document values.
Also see [object access](../aql-fundamentals/data-types.md#objects--documents) for
additional language constructs.

## ATTRIBUTES()

`ATTRIBUTES(document, removeSystemAttrs, sort) → strArray`

Return the top-level attribute keys of the `document` as an array.
Optionally omit system attributes and sort the array.

- **document** (object): an arbitrary document / object
- **removeSystemAttrs** (bool, *optional*): whether all system attributes
  (starting with an underscore, such as `_key` and `_id`) shall be omitted in
  the result. The default is `false`.
- **sort** (bool, *optional*): optionally sort the resulting array alphabetically.
  The default is `false` and will return the attribute names in any order.
- returns **strArray** (array): the attribute keys of the input `document` as an
  array of strings

**Examples**

Return the attribute keys of an object:

```aql
---
name: aqlAttributes
description: ''
render: input/output
version: '3.12'
server_name: stable
type: single
---
RETURN ATTRIBUTES( { "foo": "bar", "_key": "123", "_custom": "yes" } )
```

Return the attribute keys of an object but omit system attributes:

```aql
---
name: aqlAttributesRemoveInternal
description: ''
render: input/output
version: '3.12'
server_name: stable
type: single
---
RETURN ATTRIBUTES( { "foo": "bar", "_key": "123", "_custom": "yes" }, true )
```

Return the attribute keys of an object in alphabetic order:

```aql
---
name: aqlAttributesSort
description: ''
render: input/output
version: '3.12'
server_name: stable
type: single
---
RETURN ATTRIBUTES( { "foo": "bar", "_key": "123", "_custom": "yes" }, false, true )
```

Complex example to count how often every top-level attribute key occurs in the
documents of a collection (expensive on large collections):

```aql
LET attributesPerDocument = (
    FOR doc IN collection RETURN ATTRIBUTES(doc, true)
)
FOR attributeArray IN attributesPerDocument
    FOR attribute IN attributeArray
        COLLECT attr = attribute WITH COUNT INTO count
        SORT count DESC
        RETURN {attr, count}
```

## COUNT()

This is an alias for [LENGTH()](#length).

## HAS()

`HAS(document, attributeName) → isPresent`

Test whether an attribute is present in the provided document.

- **document** (object): an arbitrary document / object
- **attributeName** (string): the attribute key to test for
- returns **isPresent** (bool): `true` if `document` has an attribute named
  `attributeName`, and `false` otherwise. Also returns `true` if the attribute
  has a falsy value (`null`, `0`, `false`, empty string `""`)

The function checks if the specified attribute exists, regardless of its value.
Other ways of testing for the existence of an attribute may behave differently
if the attribute has a falsy value or is not present (implicitly `null` on
object access):

```aql
!!{ name: "" }.name        // false
HAS( { name: "" }, "name") // true

{ name: null }.name == null   // true
{ }.name == null              // true
HAS( { name: null }, "name" ) // true
HAS( { }, "name" )            // false
```

Note that `HAS()` cannot utilize indexes. If it is not necessary to distinguish
between explicit and implicit *null* values in your query, you may use an equality
comparison to test for *null* and create a non-sparse index on the attribute you
want to test against:

```aql
FILTER !HAS(doc, "name")    // cannot use indexes
FILTER IS_NULL(doc, "name") // cannot use indexes
FILTER doc.name == null     // can utilize non-sparse indexes
```

**Examples**

Check whether the example object has a `name` attribute key:

```aql
---
name: aqlHas_1
description: ''
render: input/output
version: '3.12'
server_name: stable
type: single
---
RETURN HAS( { name: "Jane" }, "name" )
```

Check whether the example object has an `age` attribute key:

```aql
---
name: aqlHas_2
description: ''
render: input/output
version: '3.12'
server_name: stable
type: single
---
RETURN HAS( { name: "Jane" }, "age" )
```

Falsy attribute values like `null` still count as the attribute being present:

```aql
---
name: aqlHas_3
description: ''
render: input/output
version: '3.12'
server_name: stable
type: single
---
RETURN HAS( { name: null }, "name" )
```

## IS_SAME_COLLECTION()

`IS_SAME_COLLECTION(collectionName, documentIdentifier) → isSame`

Test whether the `documentIdentifier` has `collectionName` as collection.

The function does not validate whether the collection actually contains the
specified document. It only compares the name of the specified collection
with the collection name part of the specified document.

- **collectionName** (string): the name of a collection as string
- **documentIdentifier** (string\|object): a document identifier string
  (e.g. `_users/1234`) or an object with an `_id` attribute (e.g. a document
  from a collection).
- returns **isSame** (bool): `true` if the collection of `documentIdentifier` is the
  same as `collectionName`, or `false` if it is not. If `documentIdentifier` is an
  object without an `_id` attribute or anything other than a string or object,
  then `null` is returned and a warning is raised.

**Examples**

```aql
---
name: aqlIsSameCollection
description: ''
render: input/output
version: '3.12'
server_name: stable
type: single
---
RETURN [
  IS_SAME_COLLECTION( "_users", "_users/my-user" ),
  IS_SAME_COLLECTION( "_users", { _id: "_users/my-user" } ),
  IS_SAME_COLLECTION( "_users", "foobar/baz"),
  IS_SAME_COLLECTION( "_users", { _id: "something/else" } )
]
```

## KEEP()

`KEEP(document, attributeName1, attributeName2, ... attributeNameN) → doc`

Keep only the attributes `attributeName` to `attributeNameN` of `document`.
All other attributes will be removed from the result.

To do the opposite, see [UNSET()](#unset).

- **document** (object): a document / object
- **attributeNames** (string, *repeatable*): an arbitrary number of attribute
  names as multiple arguments
- returns **doc** (object): a document with only the specified attributes at
  the top-level

**Examples**

Keep the top-level `foo` attribute, preserving its nested object:

```aql
---
name: aqlKeep_1
description: ''
render: input/output
version: '3.12'
server_name: stable
type: single
---
LET doc = { foo: { bar: { foo: 1, baz: 2 }, baz: 3 }, baz: 4 }
RETURN KEEP(doc, "foo")
```

Keep the top-level `bar` attribute, which the example object does not have,
resulting in an empty object:

```aql
---
name: aqlKeep_2
description: ''
render: input/output
version: '3.12'
server_name: stable
type: single
---
LET doc = { foo: { bar: { foo: 1, baz: 2 }, baz: 3 }, baz: 4 }
RETURN KEEP(doc, "bar")
```

Keep the top-level `baz` attribute:

```aql
---
name: aqlKeep_3
description: ''
render: input/output
version: '3.12'
server_name: stable
type: single
---
LET doc = { foo: { bar: { foo: 1, baz: 2 }, baz: 3 }, baz: 4 }
RETURN KEEP(doc, "baz")
```

Keep multiple top-level attributes (`foo` and `baz`):

```aql
---
name: aqlKeep_4
description: ''
render: input/output
version: '3.12'
server_name: stable
type: single
---
LET doc = { foo: { bar: { foo: 1, baz: 2 }, baz: 3 }, baz: 4 }
RETURN KEEP(doc, "foo", "baz")
```


`KEEP(document, attributeNameArray) → doc`

- **document** (object): a document / object
- **attributeNameArray** (array): an array of attribute names as strings
- returns **doc** (object): a document with only the specified attributes at
  the top-level

**Examples**

Keep multiple top-level attributes (`foo` and `baz`), by passing an array of the
attribute keys instead of individual arguments:

```aql
---
name: aqlKeep_5
description: ''
render: input/output
version: '3.12'
server_name: stable
type: single
---
LET doc = { foo: { bar: { foo: 1, baz: 2 }, baz: 3 }, baz: 4 }
RETURN KEEP(doc, ["foo", "baz"])
```

## KEEP_RECURSIVE()

`KEEP_RECURSIVE(document, attributeName1, attributeName2, ... attributeNameN) → doc`

Recursively preserve the attributes `attributeName1` to `attributeNameN` from
`document` and its sub-documents. All other attributes will be removed.

To do the opposite, use [UNSET_RECURSIVE()](#unset_recursive).

- **document** (object): a document / object
- **attributeNames** (string, *repeatable*): an arbitrary number of attribute
  names as multiple arguments (at least 1)
- returns **doc** (object): `document` with only the specified attributes at
  all levels (top-level as well as nested objects)

**Examples**

Recursively preserve `foo` attributes, but not nested attributes that have
parents with other names:

```aql
---
name: aqlKeepRecursive_1
description: ''
render: input/output
version: '3.12'
server_name: stable
type: single
---
LET doc = { foo: { bar: { foo: 1, baz: 2 }, baz: 3 }, baz: 4 }
RETURN KEEP_RECURSIVE(doc, "foo")
```

Recursively preserve `bar` attributes, but there is none at the top-level, leading
to an empty object:

```aql
---
name: aqlKeepRecursive_2
description: ''
render: input/output
version: '3.12'
server_name: stable
type: single
---
LET doc = { foo: { bar: { foo: 1, baz: 2 }, baz: 3 }, baz: 4 }
RETURN KEEP_RECURSIVE(doc, "bar")
```

Recursively preserve `baz` attributes, but not nested attributes that have
parents with other names:

```aql
---
name: aqlKeepRecursive_3
description: ''
render: input/output
version: '3.12'
server_name: stable
type: single
---
LET doc = { foo: { bar: { foo: 1, baz: 2 }, baz: 3 }, baz: 4 }
RETURN KEEP_RECURSIVE(doc, "baz")
```

Recursively preserve multiple attributes (`foo` and `bar`):

```aql
---
name: aqlKeepRecursive_4
description: ''
render: input/output
version: '3.12'
server_name: stable
type: single
---
LET doc = { foo: { bar: { foo: 1, baz: 2 }, baz: 3 }, baz: 4 }
RETURN KEEP_RECURSIVE(doc, "foo", "bar")
```

Recursively preserve multiple attributes (`foo` and `baz`), but not nested
attributes that have parents with other names:

```aql
---
name: aqlKeepRecursive_5
description: ''
render: input/output
version: '3.12'
server_name: stable
type: single
---
LET doc = { foo: { bar: { foo: 1, baz: 2 }, baz: 3 }, baz: 4 }
RETURN KEEP_RECURSIVE(doc, "foo", "baz")
```

Recursively preserve multiple attributes (`foo`, `bar`, and `baz`), preserving all
attributes of the example object:

```aql
---
name: aqlKeepRecursive_6
description: ''
render: input/output
version: '3.12'
server_name: stable
type: single
---
LET doc = { foo: { bar: { foo: 1, baz: 2 }, baz: 3 }, baz: 4 }
RETURN KEEP_RECURSIVE(doc, "foo", "bar", "baz")
```


`KEEP_RECURSIVE(document, attributeNameArray) → doc`

- **document** (object): a document / object
- **attributeNameArray** (array): an array of attribute names as strings
- returns **doc** (object): *document* with only the specified attributes at
  all levels (top-level as well as nested objects)

**Examples**

Recursively preserve multiple attributes (`foo` and `baz`), by passing an array of the
attribute keys instead of individual arguments:

```aql
---
name: aqlKeepRecursive_7
description: ''
render: input/output
version: '3.12'
server_name: stable
type: single
---
LET doc = { foo: { bar: { foo: 1, baz: 2 }, baz: 3 }, baz: 4 }
RETURN KEEP_RECURSIVE(doc, ["foo", "baz"])
```

## LENGTH()

`LENGTH(doc) → attrCount`

Determine the number of attribute keys of an object / document.

`LENGTH()` can also determine the [number of elements](array.md#length) in an array,
the [amount of documents](miscellaneous.md#length) in a collection and
the [character length](string.md#length) of a string.

- **doc** (object): a document / object
- returns **attrCount** (number): the number of attribute keys in `doc`, regardless
  of their values

**Examples**

```aql
---
name: aqlLengthObject
description: ''
render: input/output
version: '3.12'
server_name: stable
type: single
---
RETURN LENGTH({ name: "Emma", age: 36, phone: { mobile: "..." } })
```

## MATCHES()

`MATCHES(document, examples, returnIndex) → match`

Compare the given `document` against each example document provided. The comparisons
will be started with the first example. All attributes of the example will be compared
against the attributes of `document`. If all attributes match, the comparison stops
and the result is returned. If there is a mismatch, the function will continue the
comparison with the next example until there are no more examples left.

The `examples` can be an array of 1..n example documents or a single document,
with any number of attributes each.

An attribute value of `null` will match documents with an explicit attribute value
of `null` as well as documents with this attribute missing (implicitly `null`).
Only [HAS()](#has) can differentiate between an attribute being absent and having
a stored `null` value.

An empty object `{}` will match all documents. Be careful not to ask for all
documents accidentally. For example, the [arangojs](../../develop/drivers/official-drivers/arangojs-javascript-driver.md) driver
skips attributes with a value of `undefined`, turning `{attr: undefined}` into `{}`.

{{< info >}}
`MATCHES()` cannot utilize indexes. You may use plain `FILTER` conditions instead
to potentially benefit from existing indexes:

```aql
FOR doc IN coll
  FILTER (cond1 AND cond2 AND cond3) OR (cond4 AND cond5) ...
```
{{< /info >}}

- **document** (object): document to determine whether it matches any example
- **examples** (object\|array): a single document, or an array of documents to compare
  against. Specifying an empty array is not allowed.
- **returnIndex** (bool): by setting this flag to `true`, the index of the example that
  matched will be returned (starting at offset 0), or `-1` if there was no match.
  The default is `false` and makes the function return a boolean.
- returns **match** (bool\|number): if `document` matches one of the examples, `true` is
  returned, otherwise `false`. A number is returned instead if `returnIndex` is enabled.

**Examples**

Check whether all attributes of the example are present in the document:

```aql
---
name: aqlMatches_1
description: ''
render: input/output
version: '3.12'
server_name: stable
type: single
---
LET doc = {
  name: "jane",
  age: 27,
  active: true
}
RETURN MATCHES(doc, { age: 27, active: true } )
```

Check whether one of the examples matches the document and return the index of
the matching example:

```aql
---
name: aqlMatches_2
description: ''
render: input/output
version: '3.12'
server_name: stable
type: single
---
RETURN MATCHES(
  { "test": 1 },
  [
{ "test": 1, "foo": "bar" },
{ "foo": 1 },
{ "test": 1 }
  ],
true)
```

## MERGE()

`MERGE(document1, document2, ... documentN) → mergedDocument`

Merge the documents `document1` to `documentN` into a single document.
If document attribute keys are ambiguous, the merged result will contain the values
of the documents contained later in the argument list.

Note that merging will only be done for top-level attributes. If you wish to
merge sub-attributes, use [MERGE_RECURSIVE()](#merge_recursive) instead.

- **documents** (object, *repeatable*): an arbitrary number of documents as
  multiple arguments (at least 2)
- returns **mergedDocument** (object): a combined document

**Examples**

Two documents with distinct attribute names can easily be merged into one:

```aql
---
name: aqlMerge_1
description: ''
render: input/output
version: '3.12'
server_name: stable
type: single
---
RETURN MERGE(
  { "user1": { "name": "Jane" } },
  { "user2": { "name": "Tom" } }
)
```

When merging documents with identical attribute names, the attribute values of the
latter documents will be used in the end result:

```aql
---
name: aqlMerge_2
description: ''
render: input/output
version: '3.12'
server_name: stable
type: single
---
RETURN MERGE(
  { "users": { "name": "Jane" } },
  { "users": { "name": "Tom" } }
)
```


`MERGE(docArray) → mergedDocument`

`MERGE()` also accepts a single array parameter. This variant allows combining the
attributes of multiple objects in an array into a single object.

- **docArray** (array): an array of documents, as sole argument
- returns **mergedDocument** (object): a combined document

**Examples**

```aql
---
name: aqlMerge_3
description: ''
render: input/output
version: '3.12'
server_name: stable
type: single
---
RETURN MERGE(
  [
{ foo: "bar" },
{ quux: "quetzalcoatl", ruled: true },
{ bar: "baz", foo: "done" }
  ]
)
```

{{< tip >}}
Consider to use [`ZIP()`](#zip) instead of `MERGE()` if you want to merge a set
of disjoint keys and their associated values into a single object.

This could be a pattern like the following where objects with dynamic attribute
keys are created and then merged together (here to return a map of distinct
attribute values and how often they occur):

```aql
RETURN MERGE(
  FOR doc IN coll
    COLLECT value = doc.attr WITH COUNT INTO count
    RETURN { [value]: count }
)
```

This creates many temporary objects and can be slow if there are thousands of
objects to merge. The following pattern using `ZIP()` is more efficient:

```aql
LET counts = (
  FOR doc IN coll
    COLLECT value = doc.attr WITH COUNT INTO count
    RETURN [value, count]
)
RETURN ZIP(counts[*][0], counts[*][1])
```
{{< /tip >}}

## MERGE_RECURSIVE()

`MERGE_RECURSIVE(document1, document2, ... documentN) → mergedDocument`

Recursively merge the documents `document1` to `documentN` into a single document.
If document attribute keys overlap, the merged result contains the values
of the documents contained later in the argument list.

- **documents** (object, *repeatable*): an arbitrary number of documents as
  multiple arguments (at least 1)
- returns **mergedDocument** (object): a combined document

**Examples**

Merge two documents with the same top-level attribute, combining the `name`,
`age`, and `livesIn` sub-attributes:

```aql
---
name: aqlMergeRecursive_1
description: ''
render: input/output
version: '3.12'
server_name: stable
type: single
---
RETURN MERGE_RECURSIVE(
  { "user-1": { "name": "Jane", "livesIn": { "city": "LA" } } },
  { "user-1": { "age": 42, "livesIn": { "state": "CA" } } }
)
```

`MERGE_RECURSIVE(documents) → mergedDocument`

Recursively merge the list of documents into a single document.
If document attribute keys overlap, the merged result contains the values
of the documents specified later in the list.

- **documents** (array): an array with an arbitrary number of objects
- returns **mergedDocument** (object): a combined document

**Examples**

Merge a list of two documents with the same top-level attribute, combining the
`name` and `age` sub-attributes but overwriting the `city` value in the
`livesIn` sub-attribute:

```aql
---
name: aqlMergeRecursive_2
description: ''
render: input/output
version: '3.12'
server_name: stable
type: single
---
RETURN MERGE_RECURSIVE(
  [
{ "user-1": { "name": "Jane", "livesIn": { "city": "LA" } } },
{ "user-1": { "age": 42, "livesIn": { "city": "NY" } } }
  ]
)
```

## PARSE_IDENTIFIER()

`PARSE_IDENTIFIER(documentIdentifier) → parts`

Parse a [document ID](../../concepts/data-structure/documents/_index.md#document-identifiers) and
return its individual parts as separate attributes.

This function can be used to easily determine the
[collection name](../../concepts/data-structure/collections.md#collection-names) and key of a given document.

- **documentIdentifier** (string\|object): a document identifier string (e.g. `_users/1234`)
  or a regular document from a collection. Passing either a non-string or a non-document
  or a document without an `_id` attribute will result in an error.
- returns **parts** (object): an object with the attributes *collection* and *key*

**Examples**

Parse a document identifier string:

```aql
---
name: aqlParseIdentifier_1
description: ''
render: input/output
version: '3.12'
server_name: stable
type: single
---
RETURN PARSE_IDENTIFIER("_users/my-user")
```

Parse the document identifier string of a document (`_id` attribute):

```aql
---
name: aqlParseIdentifier_2
description: ''
render: input/output
version: '3.12'
server_name: stable
type: single
---
RETURN PARSE_IDENTIFIER( { "_id": "mycollection/mykey", "value": "some value" } )
```

## TRANSLATE()

`TRANSLATE(value, lookupDocument, defaultValue) → mappedValue`

Look up the specified `value` in the `lookupDocument`. If `value` is a key in
`lookupDocument`, then `value` will be replaced with the lookup value found.
If `value` is not present in `lookupDocument`, then `defaultValue` will be returned
if specified. If no `defaultValue` is specified, `value` will be returned unchanged.

- **value** (string): the value to encode according to the mapping
- **lookupDocument** (object): a key/value mapping as document
- **defaultValue** (any, *optional*): a fallback value in case `value` is not found
- returns **mappedValue** (any): the encoded value, or the unaltered `value` or `defaultValue`
  (if supplied) in case it could not be mapped

**Examples**

Translate a country code to a country name:

```aql
---
name: aqlTranslate_1
description: ''
render: input/output
version: '3.12'
server_name: stable
type: single
---
RETURN TRANSLATE("FR", { US: "United States", UK: "United Kingdom", FR: "France" } )
```

The unaltered input value is returned if no match is found in the mapping:

```aql
---
name: aqlTranslate_2
description: ''
render: input/output
version: '3.12'
server_name: stable
type: single
---
RETURN TRANSLATE(42, { foo: "bar", bar: "baz" } )
```

If you specify a fallback value and no match is found in the mapping, then the
fallback value returned instead of the input value:

```aql
---
name: aqlTranslate_3
description: ''
render: input/output
version: '3.12'
server_name: stable
type: single
---
RETURN TRANSLATE(42, { foo: "bar", bar: "baz" }, "not found!")
```

Note that any non-string input value is implicitly cast to a string before the
lookup:

```aql
---
name: aqlTranslate_4
description: ''
render: input/output
version: '3.12'
server_name: stable
type: single
---
RETURN TRANSLATE(42, { "42": true } )
```

## UNSET()

`UNSET(document, attributeName1, attributeName2, ... attributeNameN) → doc`

Remove the attributes `attributeName1` to `attributeNameN` from `document`.
All other attributes will be preserved.

To do the opposite, see [KEEP()](#keep).

- **document** (object): a document / object
- **attributeNames** (string, *repeatable*): an arbitrary number of attribute
  names as multiple arguments (at least 1)
- returns **doc** (object): `document` without the specified attributes at the
  top-level

**Examples**

Remove the top-level `foo` attribute, including its nested objects:

```aql
---
name: aqlUnset_1
description: ''
render: input/output
version: '3.12'
server_name: stable
type: single
---
LET doc = { foo: { bar: { foo: 1, baz: 2 }, baz: 3 }, baz: 4 }
RETURN UNSET(doc, "foo")
```

Remove the top-level `bar` attribute, which the example object does not have,
resulting in an unchanged object:

```aql
---
name: aqlUnset_2
description: ''
render: input/output
version: '3.12'
server_name: stable
type: single
---
LET doc = { foo: { bar: { foo: 1, baz: 2 }, baz: 3 }, baz: 4 }
RETURN UNSET(doc, "bar")
```

Remove the top-level `baz` attribute:

```aql
---
name: aqlUnset_3
description: ''
render: input/output
version: '3.12'
server_name: stable
type: single
---
LET doc = { foo: { bar: { foo: 1, baz: 2 }, baz: 3 }, baz: 4 }
RETURN UNSET(doc, "baz")
```

Remove multiple top-level attributes (`foo` and `baz`), resulting in an empty
object in this example:

```aql
---
name: aqlUnset_4
description: ''
render: input/output
version: '3.12'
server_name: stable
type: single
---
LET doc = { foo: { bar: { foo: 1, baz: 2 }, baz: 3 }, baz: 4 }
RETURN UNSET(doc, "foo", "baz")
```


`UNSET(document, attributeNameArray) → doc`

- **document** (object): a document / object
- **attributeNameArray** (array): an array of attribute names as strings
- returns **doc** (object): *document* without the specified attributes at the
  top-level

**Examples**

Remove multiple top-level attributes (`foo` and `baz`), by passing an array of the
attribute keys instead of individual arguments:

```aql
---
name: aqlUnset_5
description: ''
render: input/output
version: '3.12'
server_name: stable
type: single
---
LET doc = { foo: { bar: { foo: 1, baz: 2 }, baz: 3 }, baz: 4 }
RETURN UNSET(doc, ["foo", "bar"])
```


## UNSET_RECURSIVE()

`UNSET_RECURSIVE(document, attributeName1, attributeName2, ... attributeNameN) → doc`

Recursively remove the attributes `attributeName1` to `attributeNameN` from
`document` and its sub-documents. All other attributes will be preserved.

To do the opposite, use [KEEP_RECURSIVE()](#keep_recursive).

- **document** (object): a document / object
- **attributeNames** (string, *repeatable*): an arbitrary number of attribute
  names as multiple arguments (at least 1)
- returns **doc** (object): `document` without the specified attributes at
  all levels (top-level as well as nested objects)

**Examples**

Recursively remove `foo` attributes:

```aql
---
name: aqlUnsetRecursive_1
description: ''
render: input/output
version: '3.12'
server_name: stable
type: single
---
LET doc = { foo: { bar: { foo: 1, baz: 2 }, baz: 3 }, baz: 4 }
RETURN UNSET_RECURSIVE(doc, "foo")
```

Recursively remove `bar` attributes:

```aql
---
name: aqlUnsetRecursive_2
description: ''
render: input/output
version: '3.12'
server_name: stable
type: single
---
LET doc = { foo: { bar: { foo: 1, baz: 2 }, baz: 3 }, baz: 4 }
RETURN UNSET_RECURSIVE(doc, "bar")
```

Recursively remove `baz` attributes:

```aql
---
name: aqlUnsetRecursive_3
description: ''
render: input/output
version: '3.12'
server_name: stable
type: single
---
LET doc = { foo: { bar: { foo: 1, baz: 2 }, baz: 3 }, baz: 4 }
RETURN UNSET_RECURSIVE(doc, "baz")
```

Recursively remove multiple attributes (`foo` and `bar`):

```aql
---
name: aqlUnsetRecursive_4
description: ''
render: input/output
version: '3.12'
server_name: stable
type: single
---
LET doc = { foo: { bar: { foo: 1, baz: 2 }, baz: 3 }, baz: 4 }
RETURN UNSET_RECURSIVE(doc, "foo", "bar")
```

Recursively remove multiple attributes (`foo` and `baz`), removing all
attributes of the example object:

```aql
---
name: aqlUnsetRecursive_5
description: ''
render: input/output
version: '3.12'
server_name: stable
type: single
---
LET doc = { foo: { bar: { foo: 1, baz: 2 }, baz: 3 }, baz: 4 }
RETURN UNSET_RECURSIVE(doc, "foo", "baz")
```

Recursively remove multiple attributes (`foo`, `bar`, and `baz`), removing all
attributes of the example object:

```aql
---
name: aqlUnsetRecursive_6
description: ''
render: input/output
version: '3.12'
server_name: stable
type: single
---
LET doc = { foo: { bar: { foo: 1, baz: 2 }, baz: 3 }, baz: 4 }
RETURN UNSET_RECURSIVE(doc, "foo", "bar", "baz")
```


`UNSET_RECURSIVE(document, attributeNameArray) → doc`

- **document** (object): a document / object
- **attributeNameArray** (array): an array of attribute names as strings
- returns **doc** (object): *document* without the specified attributes at
  all levels (top-level as well as nested objects)

**Examples**

Recursively remove `baz` attributes, by passing an array with the attribute key:

```aql
---
name: aqlUnsetRecursive_7
description: ''
render: input/output
version: '3.12'
server_name: stable
type: single
---
LET doc = { foo: { bar: { foo: 1, baz: 2 }, baz: 3 }, baz: 4 }
RETURN UNSET_RECURSIVE(doc, ["baz"])
```

## VALUE()

`VALUE(document, path) → value`

Return the specified attribute value of the `document`.

- **document** (object): a document / object
- **path** (array): an array of strings and numbers that describes the
  attribute path. You can select object keys with strings and array elements
  with numbers.
- returns **value** (any): the selected value of `document`

**Examples**

Dynamically get the inner string, like `obj.foo.bar` would:

```aql
---
name: aqlValue_1
description: ''
render: input/output
version: '3.12'
server_name: stable
type: single
---
  LET obj = { foo: { bar: "baz" } }
  RETURN VALUE(obj, ["foo", "bar"])
```

Dynamically get the inner object of the second array element of a top-level
attribute, like `obj.foo[1].bar` would:

```aql
---
name: aqlValue_2
description: ''
render: input/output
version: '3.12'
server_name: stable
type: single
---
  LET obj = { foo: [ { bar: "baz" }, { bar: { inner: true } } ] }
  RETURN VALUE(obj, ["foo", 1, "bar"])
```

## VALUES()

`VALUES(document, removeSystemAttrs) → anyArray`

Return the attribute values of the `document` as an array. Optionally omit
system attributes.

- **document** (object): a document / object
- **removeSystemAttrs** (bool, *optional*): if set to `true`, then all
  system attributes (starting with an underscore, such as `_id`, `_key` etc.)
  are removed from the result
- returns **anyArray** (array): the values of `document` returned in any order

**Examples**

Get the attribute values of an object:

```aql
---
name: aqlValues_1
description: ''
render: input/output
version: '3.12'
server_name: stable
type: single
---
RETURN VALUES( { "_id": "users/jane", "name": "Jane", "age": 35 } )
```

Get the attribute values of an object, omitting system attributes:

```aql
---
name: aqlValues_2
description: ''
render: input/output
version: '3.12'
server_name: stable
type: single
---
RETURN VALUES( { "_id": "users/jane", "name": "Jane", "age": 35 }, true )
```

## ZIP()

`ZIP(keys, values) → doc`

Return a document object assembled from the separate parameters `keys` and `values`.

`keys` and `values` must be arrays and have the same length.

- **keys** (array): an array of strings, to be used as attribute names in the result
- **values** (array): an array with elements of arbitrary types, to be used as
  attribute values
- returns **doc** (object): a document with the keys and values assembled

**Examples**

```aql
---
name: aqlZip
description: ''
render: input/output
version: '3.12'
server_name: stable
type: single
---
RETURN ZIP( [ "name", "active", "hobbies" ], [ "some user", true, [ "swimming", "riding" ] ] )
```
