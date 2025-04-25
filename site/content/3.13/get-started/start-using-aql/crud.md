---
title: AQL CRUD operations
menuTitle: CRUD operations
weight: 5
description: >-
  Learn how to **c**reate, **r**ead, **u**pdate, and **d**elete documents with
  the ArangoDB Query Language
---
## Create documents

Before you can insert documents with AQL, you need a place to put them in – a
collection. You can [manage collections](../../concepts/data-structure/collections.md#collection-interfaces)
via different interfaces including the web interface, arangosh, or a driver.
It is not possible to do so with AQL, however.

1. In the web interface, click **Collections** in the main navigation.
2. Click the **Add Collection** button.
3. Enter `Characters` as the **Name**.
4. Leave the **Type** set to the default value of **Document**.
5. Click the **Create** button.

The new collection should appear in the list. Next, click **Queries** in the
main navigation. To create the first document for the collection with AQL,
use the following AQL query, which you can paste into the query textbox and
run by clicking the **Execute** button:

```aql
INSERT {
  _key: "test",
  name: "First",
  surname: "Test",
  alive: false,
  age: 123,
  traits: [ "X", "Y" ]
} INTO Characters RETURN NEW
```

The syntax is `INSERT document INTO collectionName`. The document is an object
like you may know it from JavaScript or JSON, which is comprised of attribute
key and value pairs. The quotes around the attribute keys are optional in AQL.
Keys are always character sequences (strings), whereas attribute values can
have [different types](../../aql/fundamentals/data-types.md):

- `null`
- boolean (`true`, `false`)
- number (integer and floating point values)
- string
- array
- object

The name and surname of the character document you inserted are both string
values. The alive state uses a boolean value. Age is a numeric value.
The traits are an array of strings. The entire document is an object.

The `RETURN NEW` part is optional and makes the query return the document
including any system attributes that may get added by ArangoDB. If you don't
specify the `_key` attribute then a document key is automatically generated.

Next, add several characters with a single query:

```aql
FOR d IN @data
  INSERT d INTO Characters
```

The `FOR` loop iterates over `@data`, which is a placeholder in the query for
binding the list of characters in JSON format.

In the web interface, there is a tab called **Bind Variables** on the right-hand
side of the query editor. When you enter a placeholder like `@data` in the editor,
a row appears in the **Bind Variables** tab to specify the value for the placeholder.
Paste the following text into the field for the `data` bind variable:

```json
[
  { "_key": "ned", "name": "Ned", "surname": "Stark", "alive": true, "age": 41, "traits": ["A","H","C","N","P"] },
  { "_key": "robert", "name": "Robert", "surname": "Baratheon", "alive": false, "traits": ["A","H","C"] },
  { "_key": "jaime", "name": "Jaime", "surname": "Lannister", "alive": true, "age": 36, "traits": ["A","F","B"] },
  { "_key": "catelyn", "name": "Catelyn", "surname": "Stark", "alive": false, "age": 40, "traits": ["D","H","C"] },
  { "_key": "cersei", "name": "Cersei", "surname": "Lannister", "alive": true, "age": 36, "traits": ["H","E","F"] },
  { "_key": "daenerys", "name": "Daenerys", "surname": "Targaryen", "alive": true, "age": 16, "traits": ["D","H","C"] },
  { "_key": "jorah", "name": "Jorah", "surname": "Mormont", "alive": false, "traits": ["A","B","C","F"] },
  { "_key": "petyr", "name": "Petyr", "surname": "Baelish", "alive": false, "traits": ["E","G","F"] },
  { "_key": "viserys", "name": "Viserys", "surname": "Targaryen", "alive": false, "traits": ["O","L","N"] },
  { "_key": "jon", "name": "Jon", "surname": "Snow", "alive": true, "age": 16, "traits": ["A","B","C","F"] },
  { "_key": "sansa", "name": "Sansa", "surname": "Stark", "alive": true, "age": 13, "traits": ["D","I","J"] },
  { "_key": "arya", "name": "Arya", "surname": "Stark", "alive": true, "age": 11, "traits": ["C","K","L"] },
  { "_key": "robb", "name": "Robb", "surname": "Stark", "alive": false, "traits": ["A","B","C","K"] },
  { "_key": "theon", "name": "Theon", "surname": "Greyjoy", "alive": true, "age": 16, "traits": ["E","R","K"] },
  { "_key": "bran", "name": "Bran", "surname": "Stark", "alive": true, "age": 10, "traits": ["L","J"] },
  { "_key": "joffrey", "name": "Joffrey", "surname": "Baratheon", "alive": false, "age": 19, "traits": ["I","L","O"] },
  { "_key": "sandor", "name": "Sandor", "surname": "Clegane", "alive": true, "traits": ["A","P","K","F"] },
  { "_key": "tyrion", "name": "Tyrion", "surname": "Lannister", "alive": true, "age": 32, "traits": ["F","K","M","N"] },
  { "_key": "khal", "name": "Khal", "surname": "Drogo", "alive": false, "traits": ["A","C","O","P"] },
  { "_key": "tywin", "name": "Tywin", "surname": "Lannister", "alive": false, "traits": ["O","M","H","F"] },
  { "_key": "davos", "name": "Davos", "surname": "Seaworth", "alive": true, "age": 49, "traits": ["C","K","P","F"] },
  { "_key": "samwell", "name": "Samwell", "surname": "Tarly", "alive": true, "age": 17, "traits": ["C","L","I"] },
  { "_key": "stannis", "name": "Stannis", "surname": "Baratheon", "alive": false, "traits": ["H","O","P","M"] },
  { "_key": "melisandre", "name": "Melisandre", "alive": true, "traits": ["G","E","H"] },
  { "_key": "margaery", "name": "Margaery", "surname": "Tyrell", "alive": false, "traits": ["M","D","B"] },
  { "_key": "jeor", "name": "Jeor", "surname": "Mormont", "alive": false, "traits": ["C","H","M","P"] },
  { "_key": "bronn", "name": "Bronn", "alive": true, "traits": ["K","E","C"] },
  { "_key": "varys", "name": "Varys", "alive": true, "traits": ["M","F","N","E"] },
  { "_key": "shae", "name": "Shae", "alive": false, "traits": ["M","D","G"] },
  { "_key": "talisa", "name": "Talisa", "surname": "Maegyr", "alive": false, "traits": ["D","C","B"] },
  { "_key": "gendry", "name": "Gendry", "alive": false, "traits": ["K","C","A"] },
  { "_key": "ygritte", "name": "Ygritte", "alive": false, "traits": ["A","P","K"] },
  { "_key": "tormund", "name": "Tormund", "surname": "Giantsbane", "alive": true, "traits": ["C","P","A","I"] },
  { "_key": "gilly", "name": "Gilly", "alive": true, "traits": ["L","J"] },
  { "_key": "brienne", "name": "Brienne", "surname": "Tarth", "alive": true, "age": 32, "traits": ["P","C","A","K"] },
  { "_key": "ramsay", "name": "Ramsay", "surname": "Bolton", "alive": true, "traits": ["E","O","G","A"] },
  { "_key": "ellaria", "name": "Ellaria", "surname": "Sand", "alive": true, "traits": ["P","O","A","E"] },
  { "_key": "daario", "name": "Daario", "surname": "Naharis", "alive": true, "traits": ["K","P","A"] },
  { "_key": "missandei", "name": "Missandei", "alive": true, "traits": ["D","L","C","M"] },
  { "_key": "tommen", "name": "Tommen", "surname": "Baratheon", "alive": true, "traits": ["I","L","B"] },
  { "_key": "jaqen", "name": "Jaqen", "surname": "H'ghar", "alive": true, "traits": ["H","F","K"] },
  { "_key": "roose", "name": "Roose", "surname": "Bolton", "alive": true, "traits": ["H","E","F","A"] },
  { "_key": "high-sparrow", "name": "The High Sparrow", "alive": true, "traits": ["H","M","F","O"] }
]
```

The data is an array of objects, like `[ {...}, {...}, ... ]`.

`FOR variableName IN expression` is used to iterate over each element of the
array. In each loop, one element is assigned to the variable `d` (`FOR d IN @data`).
This variable is then used in the `INSERT` statement instead of a literal
object definition. What it does is basically the following:

```aql
// Invalid query

INSERT {
  "_key": "robert",
  "name": "Robert",
  "surname": "Baratheon",
  "alive": false,
  "traits": ["A","H","C"]
} INTO Characters

INSERT {
  "_key": "jaime",
  "name": "Jaime",
  "surname": "Lannister",
  "alive": true,
  "age": 36,
  "traits": ["A","F","B"]
} INTO Characters

...
```

{{< info >}}
AQL does not permit multiple `INSERT` operations that target the same
collection in a single query. However, you can use a `FOR` loop like in the
above query to insert multiple documents into a collection using a single
`INSERT` operation.
{{< /info >}}

## Read documents

There are a couple of documents in the `Characters` collection by now. You can
retrieve them all using a `FOR` loop again. This time, however, it is for
going through all documents in the collection instead of an array:

```aql
FOR c IN Characters
  RETURN c
```

The syntax of the loop is `FOR variableName IN collectionName`. For each
document in the collection, `c` is assigned a document, which is then returned
as per the loop body. The query returns all characters you previously stored.

Among them should be `Ned Stark`, similar to this example:

```json
[
  {
    "_key": "ned",
    "_id": "Characters/ned",
    "_rev": "_V1bzsXa---",
    "name": "Ned",
    "surname": "Stark",
    "alive": true,
    "age": 41,
    "traits": ["A","H","C","N","P"]
  },
  ...
]
```

The document features the attributes you stored, plus a few more added by
the database system. Each document needs a unique `_key`, which identifies it
within a collection. The `_id` is a computed property, a concatenation of the
collection name, a forward slash `/` and the document key. It uniquely identifies
a document within a database. `_rev` is a revision ID managed by the system.

Document keys can be provided by the user upon document creation, or a unique
value is assigned automatically. It can not be changed later. All three system
attributes starting with an underscore `_` are read-only.

You can use either the document key or the document ID to retrieve a specific
document with the help of an AQL function `DOCUMENT()`:

```aql
RETURN DOCUMENT("Characters", "ned")
// --- or ---
RETURN DOCUMENT("Characters/ned")
```

```json
[
  {
    "_key": "ned",
    "_id": "Characters/ned",
    "_rev": "_V1bzsXa---",
    "name": "Ned",
    "surname": "Stark",
    "alive": true,
    "age": 41,
    "traits": ["A","H","C","N","P"]
  }
]
```

The `DOCUMENT()` function also allows to fetch multiple documents at once:

```aql
RETURN DOCUMENT("Characters", ["ned", "catelyn"])
// --- or ---
RETURN DOCUMENT(["Characters/ned", "Characters/catelyn"])
```

```json
[
  [
    {
      "_key": "ned",
      "_id": "Characters/ned",
      "_rev": "_V1bzsXa---",
      "name": "Ned",
      "surname": "Stark",
      "alive": true,
      "age": 41,
      "traits": ["A","H","C","N","P"]
    },
    {
      "_key": "catelyn",
      "_id": "Characters/catelyn",
      "_rev": "_V1bzsXa--B",
      "name": "Catelyn",
      "surname": "Stark",
      "alive": false,
      "age": 40,
      "traits": ["D","H","C"]
    }
  ]
]
```

See the [`DOCUMENT()` function](../../aql/functions/miscellaneous.md#document)
documentation for more details.

The `DOCUMENT()` does not let you match documents based on the value of arbitrary
document attributes. It is also not ideal to use the function if the documents
you want to look up are all in the same collection for performance reasons.

You can replace the call of the `DOCUMENT()` function with the powerful
combination of a `FOR` loop and a `FILTER` operation:

```aql
FOR c IN Characters
  FILTER c._key IN ["ned", "catelyn"]
  RETURN c
```

This approach enables you to find documents using arbitrary conditions by
changing the filter criteria, but more about this later.

## Update documents

According to our `Ned Stark` document, he is alive. When we get to know that he
died, we need to change the `alive` attribute. Modify the existing document:

```aql
UPDATE "ned" WITH { alive: false } IN Characters
```

The syntax is `UPDATE documentKey WITH object IN collectionName`. It updates the
specified document with the attributes listed (or adds them if they don't exist),
but leaves the rest untouched. To replace the entire document content, you may
use `REPLACE` instead of `UPDATE`:

```aql
REPLACE "ned" WITH {
  name: "Ned",
  surname: "Stark",
  alive: false,
  age: 41,
  traits: ["A","H","C","N","P"]
} IN Characters
```

This also works in a loop, to add a new attribute to all documents for instance:

```aql
FOR c IN Characters
  UPDATE c WITH { season: 1 } IN Characters
```

A variable is used instead of a literal document key, to update each document.
The query adds an attribute `season` to the documents' top-level. You can
inspect the result by re-running the query that returns all documents in
collection:

```aql
FOR c IN Characters
    RETURN c
```

```json
[
  [
    {
      "_key": "ned",
      "_id": "Characters/ned",
      "_rev": "_V1bzsXa---",
      "name": "Ned",
      "surname": "Stark",
      "alive": false,
      "age": 41,
      "traits": ["A","H","C","N","P"],
      "season": 1
    },
    {
      "_key": "catelyn",
      "_id": "Characters/catelyn",
      "_rev": "_V1bzsXa--B",
      "name": "Catelyn",
      "surname": "Stark",
      "alive": false,
      "age": 40,
      "traits": ["D","H","C"],
      "season": 1
    },
    {
      ...
    }
  ]
]
```

## Delete documents

To fully remove documents from a collection, there is the `REMOVE` operation.
It works similar to the other modification operations, yet without a `WITH` clause:

```aql
REMOVE "test" IN Characters
```

It can also be used in a loop body to effectively truncate a collection
(but less efficient than the dedicated feature to truncate a collection):

```aql
FOR c IN Characters
  REMOVE c IN Characters
```

Before you continue with the next chapter, re-run the query that
[creates the character documents](#create-documents) from above to get the data back.
