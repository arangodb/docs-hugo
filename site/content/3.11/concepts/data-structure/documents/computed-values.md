---
title: Computed Values
menuTitle: Computed Values
weight: 10
description: >-
  You can configure collections to generate document attributes when documents
  are created or modified, using an AQL expression
---
<small>Introduced in: v3.10.0</small>

If you want to add default values to new documents, maintain auxiliary
attributes for search queries, or similar, you can set these attributes manually
in every operation that inserts or modifies documents. However, it is more
convenient and reliable to let the database system take care of it.

The computed values feature lets you define expressions on the collection level
that run on inserts, modifications, or both. You can access the data of the
current document to compute new values using a subset of AQL. The result of each
expression becomes the value of a top-level attribute. These attributes are
stored like any other attribute, which means that you may use them in indexes,
but also that the schema validation is applied if you use one.

Possible use cases are to add timestamps of the creation or last modification to
every document, to add default attributes, or to automatically process attributes
for indexing purposes. For example, you can combine multiple attributes into one,
filter out array elements, and convert text to lowercase characters, to then index
the new attribute and use it to perform case-insensitive searches.

## Using Computed Values

Computed values are defined per collection using the `computedValues` property,
either when creating the collection or by modifying the collection later on.
If you add or modify computed value definitions at a later point, then they only
affect subsequent write operations. Existing documents remain in their state.

Computed value definitions are included in dumps, and the attributes they added,
too, but no expressions are executed when restoring dumps. The collections and
documents are restored as they are in the dump and no attributes are recalculated.

## Interfaces

The `computedValues` collection property accepts an array of objects.

Each object represents a computed value and can have the following attributes:

- `name` (string, _required_):
  The name of the target attribute. Can only be a top-level attribute, but you
  may return a nested object. Cannot be `_key`, `_id`, `_rev`, `_from`, `_to`,
  or a shard key attribute.

- `expression` (string, _required_):
  An AQL `RETURN` operation with an expression that computes the desired value.
  See [Computed Value Expressions](#computed-value-expressions) for details.

- `overwrite` (boolean, _required_):
  Whether the computed value shall take precedence over a user-provided or
  existing attribute.

- `computeOn` (array, _optional_):
  An array of strings to define on which write operations the value shall be
  computed. The possible values are `"insert"`, `"update"`, and `"replace"`.
  The default is `["insert", "update", "replace"]`.

- `keepNull` (boolean, _optional_):
  Whether the target attribute shall be set if the expression evaluates to `null`.
  You can set the option to `false` to not set (or unset) the target attribute if
  the expression returns `null`. The default is `true`.

- `failOnWarning` (boolean, _optional_):
  Whether to let the write operation fail if the expression produces a warning.
  The default is `false`.

The names and data types differ in some of the drivers.

{{< tabs "interfaces" >}}

{{< tab "Web interface" >}}
1. If necessary, [switch to the database](../databases.md#set-the-database-context)
   that contains the desired collection.
2. Click **COLLECTIONS** in the main navigation.
3. Click the card of the desired collection.
4. Go to the **Computed Values** tab.
5. Edit the configuration in JSON format. Example:
   ```json
   [
     {
       "name": "title",
       "expression": "RETURN \"TBA\"",
       "overwrite": false,
       "computeOn": ["insert", "update", "replace"],
       "failOnWarning": false,
       "keepNull": true
     }
   ]
   ```
6. Click the **Save** button.
{{< /tab >}}

{{< tab "arangosh" >}}
```js
---
name: arangosh_set_collection_computed_values
description: ''
---
var computedValues = [
  {
    name: "title",
    expression: "RETURN \"TBA\"",
    overwrite: false,
    computeOn: ["insert", "update", "replace"],
    failOnWarning: false,
    keepNull: true
  }
];

/* Create a new collection with computed values */
var coll = db._create("compValCollection", { computedValues });

/* Update the computed values of an existing collection */
db.compValCollection.properties({ computedValues });
~addIgnoreCollection(coll.name());
```
To remove the computed values configuration from a collection, set the
`computedValues` property to `null` or `[]` (empty array):

```js
---
name: arangosh_unset_collection_properties_computed_values
description: ''
---
~var coll = db._collection("compValCollection");
/* Remove the computed values of an existing collection */
db.compValCollection.properties({ computedValues: null });
~removeIgnoreCollection(coll.name());
~db._drop(coll.name());
```

See [`db._create()`](../../../develop/javascript-api/@arangodb/db-object.md#db_createcollection-name--properties--type--options)
and [`collection.properties()`](../../../develop/javascript-api/@arangodb/collection-object.md#collectionpropertiesproperties)
in the _JavaScript API_ for details.
{{< /tab >}}

{{< tab "cURL" >}}
```sh
curl -XPUT -d '{"computedValues":[{"name":"title","expression":"RETURN \"TBA\"","overwrite":false,"computeOn":["insert","update","replace"],"failOnWarning":false,"keepNull":true}]' http://localhost:8529/_db/mydb/_api/collection/coll/properties
```

See the [`PUT /_db/{database-name}/_api/collection/{collection-name}/properties`](../../../develop/http-api/collections.md#change-the-properties-of-a-collection)
endpoint in the _HTTP API_for details.
{{< /tab >}}

{{< tab "JavaScript" >}}
```js
let coll = db.collection("coll");
const props = await coll.properties({
  computedValues: [
    {
      name: "title",
      expression: "RETURN \"TBA\"",
      overwrite: false,
      computeOn: ["insert", "update", "replace"],
      failOnWarning: false,
      keepNull: true
    }
  ]
});
```

See [`DocumentCollection.properties()`](https://arangodb.github.io/arangojs/latest/interfaces/collections.DocumentCollection.html#properties.properties-2)
in the _arangojs_ documentation for details.
{{< /tab >}}

{{< tab "Go" >}}
```go
ctx := context.Background()
coll, err := db.GetCollection(ctx, "coll", nil)
err = coll.SetProperties(ctx, arangodb.SetCollectionPropertiesOptions{
  ComputedValues: []arangodb.ComputedValue {
    {
      Name: "title",
      Expression: "RETURN \"TBA\"",
      Overwrite: false,
      ComputeOn: []arangodb.ComputeOn {
        arangodb.ComputeOnInsert,
        arangodb.ComputeOnUpdate,
        arangodb.ComputeOnReplace,
      },
      FailOnWarning: utils.NewType(false), // pointer to bool
      KeepNull: utils.NewType(true), // pointer to bool
    },
  },
})
```

See [`Collection.SetProperties()`](https://pkg.go.dev/github.com/arangodb/go-driver/v2/arangodb#Collection)
in the _go-driver_ v2 documentation for details.
{{< /tab >}}

{{< tab "Java" >}}
```java
CollectionPropertiesOptions options = new CollectionPropertiesOptions()
    .computedValues(new ComputedValue()
        .name("title")
        .expression("RETURN \"TBA\"")
        .overwrite(false)
        .computeOn(ComputedValue.ComputeOn.insert, ComputedValue.ComputeOn.update, ComputedValue.ComputeOn.replace)
        .failOnWarning(false)
        .keepNull(true)
        );

ArangoCollection coll = db.collection("coll");
CollectionPropertiesEntity props = coll.changeProperties(options);
```

See [`ArangoCollection.changeProperties()`](https://www.javadoc.io/doc/com.arangodb/arangodb-java-driver/latest/com/arangodb/ArangoCollection.html#changeProperties%28com.arangodb.model.CollectionPropertiesOptions%29)
in the _arangodb-java-driver_ documentation for details.
{{< /tab >}}

{{< tab "Python" >}}
```py
coll = db.collection("coll")
props = coll.configure(
  computed_values=[
    {
      "name": "title",
      "expression": "RETURN \"TBA\"",
      "overwrite": False,
      "computeOn": ["insert", "update", "replace"],
      "failOnWarning": False,
      "keepNull": True
    }
  ]
)
```

See [`Collection.configure()`](https://docs.python-arango.com/en/main/specs.html#arango.collection.Collection.configure)
in the _python-arango_ documentation for details.
{{< /tab >}}

{{< /tabs >}}

## Computed Value Expressions

You can use a subset of AQL for computed values, namely a single
[`RETURN` operation](../../../aql/high-level-operations/return.md) with an expression that
computes the value. 

You can access the document data via the `@doc` bind variable. It contains the
data as it will be stored, including the `_key`, `_id`, and `_rev`
system attributes. On inserts, you get the user-provided values (plus the
system attributes), and on modifications, you get the updated or replaced
document to work with, including the user-provided values.

Computed value expressions have the following properties:

- The expression must start with a `RETURN` operation and cannot contain any
  other operations. No `FOR` loops, `LET` statements, and subqueries are allowed
  in the expression. `FOR` loops can be substituted using the
  [array expansion operator `[*]`](../../../aql/operators.md#inline-expressions),
  for example, with an inline expressions like the following:

  `RETURN @doc.values[* FILTER CURRENT > 42 RETURN CURRENT * 2]`

- You cannot access any stored data other than the current document via the
  `@doc` bind parameter. AQL functions that read from the database system cannot
  be used in the expression (e.g. `DOCUMENT()`, `PREGEL_RESULT()`,
  `COLLECTION_COUNT()`).

- You cannot access the result of another computed value that is generated on
  the same `computeOn` event.
  
  For example, two computed values that are generated on `insert` cannot see
  the result of the other. Referencing the attributes results in an implicit
  `null` value. Computed values that are generated on `update` or `replace` can
  see the results of the previous `insert` computations, however. They cannot
  see the new values of other `update` and `replace` computations, regardless of
  the order of the computed value definitions in the `computedValues` property.

- You can use AQL functions in the expression but only those that can be
  executed on DB-Servers, regardless of your deployment mode. The following
  functions cannot be used in the expression:
  - `CALL()`
  - `APPLY()`
  - `DOCUMENT()`
  - `V8()`
  - `SCHEMA_GET()`
  - `SCHEMA_VALIDATE()`
  - `VERSION()`
  - `COLLECTIONS()`
  - `CURRENT_USER()`
  - `CURRENT_DATABASE()`
  - `COLLECTION_COUNT()`
  - `NEAR()`
  - `WITHIN()`
  - `WITHIN_RECTANGLE()`
  - `FULLTEXT()`
  - [User-defined functions (UDFs)](../../../aql/user-defined-functions.md)

Expressions that do not meet the requirements or that are syntactically invalid
are rejected immediately, when setting or modifying the computed value definitions
of a collection.

## Examples

The following examples show a few ways you can use computed values using
_arangosh_.

Add an attribute with the creation timestamp to new documents:

```js
---
name: computedValuesCreatedAt
description: ''
---
var coll = db._create("users", {
  computedValues: [
    {
      name: "createdAt",
      expression: "RETURN DATE_NOW()",
      overwrite: true,
      computeOn: ["insert"]
    }
  ]
});
var doc = db.users.save({ name: "Paula Plant" });
db.users.toArray();
~db._drop("users");
```

Add an attribute with the date and time of the last modification, only taking
update and replace operations into (not inserts), and allowing to manually
set this value instead of using the computed value:

```js
---
name: computedValuesModifiedAt
description: ''
---
var coll = db._create("users", {
  computedValues: [
    {
      name: "modifiedAt",
      expression: "RETURN ZIP(['date', 'time'], SPLIT(DATE_ISO8601(DATE_NOW()), 'T'))",
      overwrite: false,
      computeOn: ["update", "replace"]
    }
  ]
});
var doc = db.users.save({ _key: "123", name: "Paula Plant" });
doc = db.users.update("123", { email: "gardener@arangodb.com" });
db.users.toArray();
doc = db.users.update("123", { email: "greenhouse@arangodb.com", modifiedAt: { date: "2019-01-01", time: "20:30:00.000Z" } });
db.users.toArray();
~db._drop("users");
```

Compute an attribute from two arrays, filtering one of the lists, and calculating
new values to implement a case-insensitive search using a persistent array index:

```js
---
name: computedValuesCombine
description: ''
---
var coll = db._create("users", {
  computedValues: [
    {
      name: "searchTags",
      expression: "RETURN APPEND(@doc.is[* FILTER CURRENT.public == true RETURN LOWER(CURRENT.name)], @doc.loves[* RETURN LOWER(CURRENT)])",
      overwrite: true
    }
  ]
});
var doc = db.users.save({ name: "Paula Plant", is: [ { name: "Gardener", public: true }, { name: "female" } ], loves: ["AVOCADOS", "Databases"] });
var idx = db.users.ensureIndex({ type: "persistent", fields: ["searchTags[*]"] });
db._query(`FOR u IN users FILTER "avocados" IN u.searchTags RETURN u`).toArray();
~db._drop("users");
```

Set `keepNull` to `false` and let an expression return `null` to not set or
unset the target attribute. If you set `overwrite` to `false` at the same time,
then the target attribute is not actively unset:

```js
---
name: computedValuesKeepNull
description: ''
---
var coll = db._create("users", {
  computedValues: [
    {
      name: "fullName",
      expression: "RETURN @doc.firstName != null AND @doc.lastName != null ? CONCAT_SEPARATOR(' ', @doc.firstName, @doc.lastName) : null",
      overwrite: false,
      keepNull: false
    }
  ]
});
var docs = db.users.save([
  { firstName: "Paula", lastName: "Plant" },
  { firstName: "James" },
  { lastName: "Barrett", fullName: "Andy J. Barrett" }
]);
db.users.toArray();
~db._drop("users");
```

Add a computed value as a sub-attribute to documents. This is not possible
directly because the target attribute needs to be a top-level attribute, but the
AQL expression can merge a nested object with the top-level attribute to achieve
this. The expression checks whether the attributes it wants to calculate a new
value from exist and are strings. If the preconditions are not met, then it
returns the original `name` attribute:

```js
---
name: computedValuesSubattribute
description: ''
---
var coll = db._create("users", {
  computedValues: [
    {
      name: "name",
      expression: "RETURN IS_STRING(@doc.name.first) AND IS_STRING(@doc.name.last) ? MERGE(@doc.name, { 'full': CONCAT_SEPARATOR(' ', @doc.name.first, @doc.name.last) }) : @doc.name",
      overwrite: true // must be true to replace the top-level "name" attribute
    }
  ]
});
var docs = db.users.save([
  { name: { first: "James" } },
  { name: { first: "Paula", last: "Plant" } }
]);
db.users.toArray();
~db._drop("users");
```
