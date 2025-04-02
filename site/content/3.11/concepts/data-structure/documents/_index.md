---
title: Documents
menuTitle: Documents
weight: 15
description: >-
  Documents are self-contained units of information, each typically representing
  a single record or instance of an entity
---
Documents in ArangoDB are JSON objects that contain structured or semi-structured
data. They are stored in [collections](../collections.md).

Each document has an immutable key that identifies it within a collection, and
an identifier derived from the key that uniquely identifies it within a
[database](../databases.md).

<!-- TODO: better explain what they are used for and how
Documents can be stored, updated, and retrieved using various database management techniques, such as indexing, querying, and aggregation. They provide a flexible and scalable way to organize and manage data, particularly for applications that deal with unstructured or semi-structured data, such as content management systems, social media platforms, and e-commerce websites.

Maybe also: You can store unstructured data in the form of text as attribute values.
-->

## Data types

Documents can store primitive values, lists of values, and nested objects
(to any depth). JSON and thus ArangoDB supports the following data types:

- `null` to represent the absence of a value, also known as _nil_ or _none_ type.
- `true` and `false`, the Boolean values, to represent _yes_ and
  _no_, _on_ and _off_, etc.
- **numbers** to store integer and floating-point values.
- **strings** to store character sequences for text, encoded as UTF-8.
- **arrays** to store lists that can contain any of the supported data types
  as elements, including nested arrays and objects.
- **objects** to map keys to values like a dictionary, also known as
  associative arrays or hash maps. The keys are strings and the values can be
  any of the supported data types, including arrays and nested objects.

Example document:

```json
{
  "_id" : "myusers/3456789",
  "_key" : "3456789",
  "_rev" : "14253647",
  "firstName" : "John",
  "lastName" : "Doe",
  "address" : {
    "street" : "Road To Nowhere 1",
    "city" : "Gotham"
  },
  "hobbies" : [
    { "name": "swimming", "howFavorite": 10 },
    { "name": "biking", "howFavorite": 6 },
    { "name": "programming", "howFavorite": 4 }
  ]
}
```

## System attributes

All documents contain special attributes at the top-level that start with an 
underscore, known as **system attributes**:

- The **document key** is stored as a string in the `_key` attribute.
- The **document identifier** is stored as a string in the `_id` attribute.
- The **document revision** is stored as a string in the `_rev` attribute.

You can specify a value for the `_key` attribute when creating a document.
The `_id` attribute is automatically set based on the collection and `_key`.
The `_id` and `_key` values are immutable once the document has been created.
The `_rev` value is maintained by ArangoDB automatically.

Edge documents in edge collections have two additional system attributes:

- The document identifier of the source vertex stored in the `_from` attribute.
- The document identifier of the target vertex stored in the `_to` attribute.

More system attributes may get added in the future without notice. Therefore,
you should avoid using own attribute names starting with an underscore.

### Document keys

Each document has a unique **document key** (or _primary key_) which identifies
it within its collection.

To distinguish between documents from multiple collections, see
[Document identifiers](#document-identifiers).

A document key uniquely identifies a document in the collection it is
stored in. It can and should be used by clients when specific documents
are queried. The document key is stored in the `_key` attribute of
each document. The key values are automatically indexed by ArangoDB in
a collection's primary index. Thus looking up a document by its
key is a fast operation. The `_key` value of a document is
immutable once the document has been created, which means it cannot be changed.

Keys are case-sensitive, i.e. `myKey` and `MyKEY` are considered to be
different keys.

By default, ArangoDB generates a document key automatically if no `_key`
attribute is specified. Otherwise, it uses the `_key` you provide.
This behavior can be changed on a per-collection level by creating
collections with the `keyOptions` attribute. Using `keyOptions`, it is possible
to disallow user-specified keys completely, or to force a specific regime for
auto-generating the `_key` values.

{{< warning >}}
You should not use both user-specified and automatically generated document keys
in the same collection in cluster deployments for collections with more than a
single shard. Mixing the two can lead to conflicts because Coordinators that
auto-generate keys in this case are not aware of all keys which are already used.
{{< /warning >}}

#### User-specified keys

If you allow user-specified keys, you can pick the key values as required,
provided that the values conform to the following restrictions:

- The key must be a string value. Numeric keys are not allowed, but any numeric
  value can be put into a string and can then be used as document key.
- The key must be at least 1 byte and at most 254 bytes long. Empty keys are 
  disallowed when specified (though it may be valid to completely omit the
  `_key` attribute from a document).
- It must consist of the letters `A` to `Z` (lower- and uppercase), the digits
  `0` to `9`, or any of the following punctuation characters:
  `_` `-` `.` `@` `(` `)` `+` `,` `=` `;` `$` `!` `*` `'` `%` `:`
  {{< info >}}
  Avoid using `:` in document keys as this can conflict with the requirements of
  [EnterpriseGraphs](../../../graphs/enterprisegraphs/_index.md),
  [SmartGraphs](../../../graphs/smartgraphs/_index.md), and
  [SmartJoins](../../../develop/smartjoins.md#smartjoins-using-smartjoinattribute)
  which use the colon character as a separator in keys.
  {{< /info >}}
- Any other characters, especially multi-byte UTF-8 sequences, whitespace, or 
  punctuation characters not listed above cannot be used inside key values.
- The key must be unique within the collection it is used in.

{{< info >}}
When working with named graphs, their names are used as document keys in the
`_graphs` system collection. Therefore, the same document key restrictions apply.
{{< /info >}}

#### Automatically generated keys

There are no guarantees about the format and pattern of auto-generated document
keys other than the above restrictions. Clients should therefore treat
auto-generated document keys as opaque values and not rely on their format.

The default format for generated keys is a string containing numeric digits.
The numeric values reflect chronological time in the sense that `_key` values
generated later contain higher numbers than `_key` values generated earlier.
However, the exact value that is generated by the server is not predictable.
Note that if you sort on the `_key` attribute, string comparison is used,
which means `"100"` is less than `"99"` etc.

### Document identifiers

A document identifier (or _document handle_) uniquely identifies a document
across all collections within the same database. It consists of the collection's
name and the document key (the value of the `_key` attribute), separated by a
forward slash (`/`), like `collection-name/document-key`.

See [Collection names](../collections.md#collection-names) and
[Document keys](#document-keys) for information about the allowed characters.

When working with documents from multiple collections, you can see what
collections they are from by looking at the `_id` attribute values and tell
documents from different collections but the same keys apart.

### Document revisions

Every document in ArangoDB has a revision, stored in the system attribute
`_rev`. It is fully managed by the server and read-only for the user.

Its value should be treated as opaque, no guarantees regarding its format
and properties are given except that it will be different after a
document update. More specifically, `_rev` values are unique across all
documents and all collections in a single server setup. In a cluster setup,
within one shard it is guaranteed that two different document revisions
have a different `_rev` string, even if they are written in the same
millisecond.

The `_rev` attribute can be used as a pre-condition for queries, to avoid
_lost update_ situations. That is, if a client fetches a document from the server,
modifies it locally (but with the `_rev` attribute untouched) and sends it back
to the server to update the document, but meanwhile the document has been changed by
another operation, then the revisions do not match anymore and the operation
is cancelled by the server. Without this mechanism, the client would
accidentally overwrite changes made to the document without knowing about it.

When an existing document is updated or replaced, ArangoDB writes a new
version of this document to the write-ahead logfile (regardless of the
storage engine). When the new version of the document has been written, the
old version(s) is still present, at least on disk. The same is true when
an existing document (version) gets removed: the old version of the document
plus the removal operation are on disk for some time.

On disk, it is therefore possible that multiple revisions of the same document
(as identified by the same `_key` value) exist at the same time. However,
stale revisions **are not accessible**. Once a document has been updated or removed
successfully, no query or other data retrieval operation done by the user
is able to see it any more. Every transaction only ever sees a single revision
of a document. Furthermore, after some time, old revisions
are removed internally. This is to avoid ever-growing disk usage.

{{< warning >}}
From a **user perspective**, there is just **one single document revision
present per different `_key`** at every point in time. There is no built-in
system to automatically keep a history of all changes done to a document
and old versions of a document cannot be restored via the `_rev` value.
{{< /warning >}}

## Attribute names

You can pick attribute names for document attributes as desired, provided the
following naming constraints are not violated:

- Attribute names starting with an underscore are considered to be system
  attributes for ArangoDB's internal use. You should avoid using own
  attribute names starting with an underscore.

- Theoretically, attribute names can include punctuation and special characters
  as desired, provided the name is a valid UTF-8 string. For maximum
  portability, special characters should be avoided, however.
  
  For example, attribute names may contain the dot character (`.`), but it has a
  special meaning in JavaScript and also in AQL. When using such attribute names
  in one of these languages, the attribute name needs to be quoted.

  Overall, it is recommended to use attribute names which don't require any
  quoting or escaping in all languages used. This includes languages used by
  clients, such as Ruby and PHP, if the attributes are automatically mapped to
  object members.

- Attribute names starting with an at sign (`@`) need to be enclosed in
  backticks or forward ticks when used in AQL queries to tell them apart from
  bind variables. Similarly, characters like `+`, `-`, `*`, `/`, and `%` are
  operators in AQL and require the use of backticks or forward ticks, too.
  This does not apply if you use the bracket notation with the attribute name as
  a string.

- The dot character (`.`) and the character sequence `[*]` are special in
  ArangoDB index definitions, preventing you from creating indexes over
  attributes that include them in their names.

- ArangoDB does not enforce a length limit for attribute names. However, long
  attribute names may use more memory in result sets etc. Therefore the use
  of long attribute names is discouraged.

- Attributes with empty names (using an empty string `""`) are possible but
  discouraged. For example, indexes cannot be created over such attributes and
  drivers may not support empty names.

- Attribute names are case-sensitive.

## Document interfaces

The following sections show examples of how you can use the APIs of ArangoDB and
the official drivers, as well as the ArangoDB shell and the built-in web interface,
to perform common operations related to documents. For less common operations
and other drivers, see the corresponding reference documentation.

### Create documents

{{< tabs "interfaces" >}}

{{< tab "Web interface" >}}
1. Click **COLLECTIONS** in the main navigation.
2. Click the card of the desired collection.
3. Go to the **Content** tab.
4. Click the plus icon on the right-hand side.
5. In the **Create Document** dialog, optionally enter a document key (**_key**)
   and a **Document body**.
6. Click the **Create** button.

You can also create documents with AQL queries using the
[`INSERT` operation](../../../aql/high-level-operations/insert.md)
in the **Queries** section.
{{< /tab >}}

{{< tab "arangosh" >}}
```js
---
name: arangosh_create_documents
description: ''
---
~db._create("coll");
var coll = db._collection("coll");

// Single document
coll.insert({
  _key: "the-document-key",
  name: "ArangoDB",
  tags: ["graph", "database", "NoSQL"],
  scalable: true,
  company: {
    name: "ArangoDB Inc.",
    founded: 2015
  }
});

// Multiple documents
coll.insert([ { _key: "one" }, { _key: "two" }, { _key: "three" } ]);
~db._drop("coll");
```
See [`collection.insert()`](../../../develop/javascript-api/@arangodb/collection-object.md#collectioninsertdata--options)
(and the `collection.save()` alias) in the _JavaScript API_ for details.
{{< /tab >}}

{{< tab "cURL" >}}
```sh
# Single document
curl -d '{"_key":"the-document-key","name":"ArangoDB","tags":["graph","database","NoSQL"],"scalable":true,"company":{"name":"ArangoDB Inc.","founded":2015}}' http://localhost:8529/_db/mydb/_api/document/coll

# Multiple documents
curl -d '[{"_key":"one"},{"_key":"two"},{"_key":"three"}]' http://localhost:8529/_db/mydb/_api/document/coll
```

See the `POST /_db/{database-name}/_api/document/{collection-name}` endpoint for
[a single document](../../../develop/http-api/documents.md#create-a-document)
and [multiple documents](../../../develop/http-api/documents.md#create-multiple-documents)
in the _HTTP API_ for details.
{{< /tab >}}

{{< tab "JavaScript" >}}
```js
let coll = db.collection("coll");

// Single document
const result = await coll.save({
  _key: "the-document-key",
  name: "ArangoDB",
  tags: ["graph", "database", "NoSQL"],
  scalable: true,
  company: {
    name: "ArangoDB Inc.",
    founded: 2015
  }
});

// Multiple documents
const results = await coll.saveAll([ { _key: "one" }, { _key: "two" }, { _key: "three" } ]);
```

See [`DocumentCollection.save()`](https://arangodb.github.io/arangojs/latest/interfaces/collection.DocumentCollection.html#save)
and [`DocumentCollection.saveAll()`](https://arangodb.github.io/arangojs/latest/interfaces/collection.DocumentCollection.html#saveAll)
in the _arangojs_ documentation for details.
{{< /tab >}}

{{< tab "Go" >}}
```go
ctx := context.Background()
coll, err := db.GetCollection(ctx, "coll", nil)

// Single document
createRes, err := coll.CreateDocument(ctx, map[string]interface{} {
  "_key": "the-document-key",
  "name": "ArangoDB",
  "tags": []interface{} { "graph", "database", "NoSQL" },
  "scalable": true,
  "company": map[string]interface{} {
    "name": "ArangoDB Inc.",
    "founded": 2015,
  },
})

if err != nil {
  fmt.Println(err)
} else {
  fmt.Printf("Metadata: $+v\n", createRes.DocumentMeta)
}

// Multiple documents
var createdDoc map[string]interface{}

createResReader, err := coll.CreateDocumentsWithOptions(ctx, []interface{} {
  map[string]interface{} { "_key": "one" },
  map[string]interface{} { "_key": "two" },
  map[string]interface{} { "_key": "three" },
}, &arangodb.CollectionDocumentCreateOptions{
		NewObject: &newDoc,
})

for {
  createdDoc = nil // Reset to not leak attributes of previous documents
  meta, err := createResReader.Read()
  if shared.IsNoMoreDocuments(err) {
    break
  } else if err != nil {
    fmt.Println(err)
  } else {
    fmt.Printf("Metadata: %+v\n", meta.DocumentMeta)
    fmt.Printf("New document: %v\n", newDoc)
  }
}
```

See the following functions 
in the [_go-driver_ v2 documentation](https://pkg.go.dev/github.com/arangodb/go-driver/v2/arangodb#CollectionDocumentCreate)
for details:
- `CollectionDocumentCreate.CreateDocument()`
- `CollectionDocumentCreate.CreateDocumentWithOptions()`
- `CollectionDocumentCreate.CreateDocuments()`
- `CollectionDocumentCreate.CreateDocumentsWithOptions()`
{{< /tab >}}

{{< tab "Java" >}}
```java
ArangoCollection coll = db.collection("coll");

// Single document
BaseDocument doc = new BaseDocument("the-document-key");
doc.addAttribute("name", "ArangoDB");
doc.addAttribute("tags", List.of("graph", "database", "NoSQL"));
doc.addAttribute("scalable", true);
doc.addAttribute("company", Map.of(
        "name", "ArangoDB Inc.",
        "founded", 2015
));
doc.addAttribute("name", "ArangoDB");
coll.insertDocument(doc);

// Multiple documents
coll.insertDocuments(List.of(
        new BaseDocument("one"),
        new BaseDocument("two"),
        new BaseDocument("three")
));
```

See [`ArangoCollection.insertDocument()`](https://www.javadoc.io/doc/com.arangodb/arangodb-java-driver/latest/com/arangodb/ArangoCollection.html#insertDocument%28java.lang.Object%29)
and [`ArangoCollection.insertDocuments()`](https://www.javadoc.io/doc/com.arangodb/arangodb-java-driver/latest/com/arangodb/ArangoCollection.html#insertDocuments%28java.lang.Iterable%29)
in the _arangodb-java-driver_ documentation for details.
{{< /tab >}}

{{< tab "Python" >}}
```py
coll = db.collection("coll")

# Single document
meta = coll.insert({
  "_key": "the-document-key",
  "name": "ArangoDB",
  "tags": { "graph", "database", "NoSQL" },
  "scalable": True,
  "company": {
    "name": "ArangoDB Inc.",
    "founded": 2015,
  }
})

# Multiple documents
meta = coll.insert_many([
  { "_key": "one" },
  { "_key": "two" },
  { "_key": "three" }
])
```

See [`StandardCollection.insert()`](https://docs.python-arango.com/en/main/specs.html#arango.collection.StandardCollection.insert)
and [`StandardCollection.insert_many()`](https://docs.python-arango.com/en/main/specs.html#arango.collection.StandardCollection.insert_many)
in the _python-arango_ documentation for details.
{{< /tab >}}

{{< /tabs >}}

### Get documents

{{< tabs "interfaces" >}}

{{< tab "Web interface" >}}
1. Click **COLLECTIONS** in the main navigation.
2. Click the card of the desired collection.
3. Go to the **Content** tab.
4. You may click the filter icon to filter and sort by document attributes.
5. Click a row to open the full document.

You can also retrieve documents with AQL queries using the
[`FOR` operation](../../../aql/high-level-operations/insert.md)
in the **Queries** section.
{{< /tab >}}

{{< tab "arangosh" >}}
```js
---
name: arangosh_get_documents
description: ''
---
~db._create("coll");
var coll = db._collection("coll");

~coll.insert({
~  _key: "the-document-key",
~  name: "ArangoDB",
~  tags: ["graph", "database", "NoSQL"],
~  scalable: true,
~  company: {
~    name: "ArangoDB Inc.",
~    founded: 2015
~  }
~});
~coll.insert([ { _key: "one" }, { _key: "two" }, { _key: "three" } ]);

// Single document
coll.document("the-document-key");

// Multiple documents
coll.document([ "one", "two", { _key: "three" } ]);

~db._drop("coll");
```

See [`collection.document()`](../../../develop/javascript-api/@arangodb/collection-object.md#collectiondocumentobject--options)
in the _JavaScript API_ for details.
{{< /tab >}}

{{< tab "cURL" >}}
```sh
# Single document
curl http://localhost:8529/_db/mydb/_api/document/coll/the-document-key

# Multiple documents
# Note the PUT method in combination with the onlyget=true query parameter!
curl -XPUT -d '["one","two",{"_key":"three"}]' http://localhost:8529/_db/mydb/_api/document/coll?onlyget=true
```

See the following endpoints in the _HTTP API_ for details:
- [`GET /_db/{database-name}/_api/document/{collection-name}/{document-key}`](../../../develop/http-api/documents.md#get-a-document)
- [`PUT /_db/{database-name}/_api/document/{collection-name}?onlyget=true`](../../../develop/http-api/documents.md#get-multiple-documents)
{{< /tab >}}

{{< tab "JavaScript" >}}
```js
let coll = db.collection("coll");

// Single document
const result = await coll.document("the-document-key");

// Multiple documents
const results = await coll.documents(["one", "two", { _key: "three" } ]);
```

See [`DocumentCollection.document()`](https://arangodb.github.io/arangojs/latest/interfaces/collection.DocumentCollection.html#document)
and [`DocumentCollection.documents()`](https://arangodb.github.io/arangojs/latest/interfaces/collection.DocumentCollection.html#documents)
in the _arangojs_ documentation for details.
{{< /tab >}}

{{< tab "Go" >}}
```go
ctx := context.Background()
coll, err := db.GetCollection(ctx, "coll", nil)

// Single document
var doc map[string]interface{}{}
meta, err := coll.ReadDocument(ctx, "the-document-key", &doc)
if err != nil {
  fmt.Println(err)
} else {
  fmt.Printf("Metadata: %+v\n", meta.DocumentMeta)
  fmt.Printf("Read document: %v\n", doc)
}

// Multiple documents
result, err := coll.ReadDocuments(ctx, []string{ "one", "two", "three" })
for {
    doc = nil // Reset to not leak attributes of previous documents
    meta, err = result.Read(&doc)
    if shared.IsNoMoreDocuments(err) {
        break
    }else if err != nil {
    fmt.Println(err)
  } else {
    fmt.Printf("Metadata: %+v\n", meta.DocumentMeta)
    fmt.Printf("Read document: %v\n", doc)
  }
}
```

See the following functions 
in the [_go-driver_ v2 documentation](https://pkg.go.dev/github.com/arangodb/go-driver/v2/arangodb#CollectionDocumentRead)
for details:
- `CollectionDocumentRead.ReadDocument()`
- `CollectionDocumentRead.ReadDocumentWithOptions()`
- `CollectionDocumentRead.ReadDocuments()`
- `CollectionDocumentRead.ReadDocumentsWithOptions()`
{{< /tab >}}

{{< tab "Java" >}}
```java
ArangoCollection coll = db.collection("coll");

// Single document
BaseDocument doc = coll.getDocument("the-document-key", BaseDocument.class);

// Multiple documents
MultiDocumentEntity<BaseDocument> docs = coll.getDocuments(List.of("one", "two", "three"), BaseDocument.class);
```

See [`ArangoCollection.getDocument()`](https://www.javadoc.io/doc/com.arangodb/arangodb-java-driver/latest/com/arangodb/ArangoCollection.html#getDocument%28java.lang.String,java.lang.Class%29)
and [`ArangoCollection.getDocuments()`](https://www.javadoc.io/doc/com.arangodb/arangodb-java-driver/latest/com/arangodb/ArangoCollection.html#getDocuments%28java.lang.Iterable,java.lang.Class%29)
in the _arangodb-java-driver_ documentation for details.
{{< /tab >}}

{{< tab "Python" >}}
```py
coll = db.collection("coll")

# Single document
doc = coll.get("the-document-key")

# Multiple documents
docs = coll.get_many(["one", "two", { "_key": "three" } ])
```

See [`StandardCollection.get()`](https://docs.python-arango.com/en/main/specs.html#arango.collection.StandardCollection.get)
and [`StandardCollection.get_many()`](https://docs.python-arango.com/en/main/specs.html#arango.collection.StandardCollection.get_many)
in the _python-arango_ documentation for details.
{{< /tab >}}

{{< /tabs >}}

### Update documents

{{< tabs "interfaces" >}}

{{< tab "Web interface" >}}
1. Click **COLLECTIONS** in the main navigation.
2. Click the card of the desired collection.
3. Go to the **Content** tab.
4. You may click the filter icon to filter and sort by document attributes.
5. Click a row to open the full document.
6. Adjust the document in the editor.
7. Click the **Save** button at the bottom.

You can also partially modify documents with AQL queries using the
[`UPDATE` operation](../../../aql/high-level-operations/update.md)
in the **Queries** section.
{{< /tab >}}

{{< tab "arangosh" >}}
```js
---
name: arangosh_update_documents
description: ''
---
~db._create("coll");
var coll = db._collection("coll");

~coll.insert({
~  _key: "the-document-key",
~  name: "ArangoDB",
~  tags: ["graph", "database", "NoSQL"],
~  scalable: true,
~  company: {
~    name: "ArangoDB Inc.",
~    founded: 2015
~  }
~});
~coll.insert([ { _key: "one" }, { _key: "two" }, { _key: "three" } ]);

coll.update("the-document-key", { logo: "avocado" }, { returnNew: true });
coll.update([ "one", "two", { _key: "three" } ], [ { val: 1 }, { val: 2 }, { val: 3 } ]);
~db._drop("coll");
```

See [`collection.update()`](../../../develop/javascript-api/@arangodb/collection-object.md#collectionupdatedocument-data--options)
in the _JavaScript API_ for details.
{{< /tab >}}

{{< tab "cURL" >}}
```sh
# Single document
curl -XPATCH -d '{"logo":"avocado"}' http://localhost:8529/_db/mydb/_api/document/coll/the-document-key?returnNew=true

# Multiple documents
curl -XPATCH -d '[{"_key":"one","val":1},{"_key":"two","val":2},{"_key":"three","val":3}]' http://localhost:8529/_db/mydb/_api/document/coll
```

See the following endpoints in the _HTTP API_ for details:
- [`PATCH /_db/{database-name}/_api/document/{collection-name}/{document-key}`](../../../develop/http-api/documents.md#update-a-document)
- [`PATCH /_db/{database-name}/_api/document/{collection-name}`](../../../develop/http-api/documents.md#update-multiple-documents)
{{< /tab >}}

{{< tab "JavaScript" >}}
```js
let coll = db.collection("coll");

// Single document
const result = await coll.update("the-document-key", { logo: "avocado" }, { returnNew: true });

// Multiple documents
const results = await coll.updateAll([ { _key: "one", val: 1 }, { _key: "two", val: 2 }, { _key: "three", val: 3 } ]);
```

See [`DocumentCollection.update()`](https://arangodb.github.io/arangojs/latest/interfaces/collection.DocumentCollection.html#update)
and [`DocumentCollection.updateAll()`](https://arangodb.github.io/arangojs/latest/interfaces/collection.DocumentCollection.html#updateAll)
in the _arangojs_ documentation for details.
{{< /tab >}}

{{< tab "Go" >}}
```go
ctx := context.Background()
coll, err := db.GetCollection(ctx, "coll", nil)

var newDoc map[string]interface{}

// Single document
newAttributes := map[string]interface{}{
  "logo": "avocado",
}
meta, err := coll.UpdateDocumentWithOptions(ctx, "the-document-key", newAttributes, &arangodb.CollectionDocumentUpdateOptions{
  NewObject: &newDoc,
})
if err != nil {
  fmt.Println(err)
} else {
  fmt.Printf("Metadata: %+v\n", meta.DocumentMeta)
  fmt.Printf("Updated document: %v\n", newDoc)
}

// Multiple documents
updateDocs := []interface{}{
  map[string]interface{}{"_key": "one", "val": 1},
  map[string]interface{}{"_key": "two", "val": 2},
  map[string]interface{}{"_key": "three", "val": 3},
}

updateReader, err := coll.UpdateDocumentsWithOptions(ctx, updateDocs, &arangodb.CollectionDocumentUpdateOptions{
  NewObject: &newDoc,
})
for {
  newDoc = nil // Reset to not leak attributes of previous documents
  meta, err := updateReader.Read()
  if shared.IsNoMoreDocuments(err) {
    break
  } else if err != nil {
    fmt.Println(err)
  } else {
    fmt.Printf("Metadata: %+v\n", meta.DocumentMeta)
    fmt.Printf("Updated document: %v\n", newDoc)
  }
}
```

See the following functions 
in the [_go-driver_ v2 documentation](https://pkg.go.dev/github.com/arangodb/go-driver/v2/arangodb#CollectionDocumentUpdate)
for details:
- `CollectionDocumentUpdate.UpdateDocument()`
- `CollectionDocumentUpdate.UpdateDocumentWithOptions()`
- `CollectionDocumentUpdate.UpdateDocuments()`
- `CollectionDocumentUpdate.UpdateDocumentsWithOptions()`
{{< /tab >}}

{{< tab "Java" >}}
```java
ArangoCollection coll = db.collection("coll");

// Single document
BaseDocument doc = new BaseDocument("the-document-key");
doc.addAttribute("logo", "avocado");
DocumentUpdateEntity<BaseDocument> result = coll.updateDocument(
        "the-document-key",
        doc,
        new DocumentUpdateOptions().returnNew(true),
        BaseDocument.class
);

// Multiple documents
BaseDocument doc1 = new BaseDocument("one");
doc1.addAttribute("val", 1);
BaseDocument doc2 = new BaseDocument("two");
doc2.addAttribute("val", 2);
BaseDocument doc3 = new BaseDocument("three");
doc3.addAttribute("val", 3);
MultiDocumentEntity<DocumentUpdateEntity<Void>> updatedDocs =
        coll.updateDocuments(List.of(doc1, doc2, doc3));
```

See [`ArangoCollection.updateDocument()`](https://www.javadoc.io/doc/com.arangodb/arangodb-java-driver/latest/com/arangodb/ArangoCollection.html#updateDocument%28java.lang.String,java.lang.Object,com.arangodb.model.DocumentUpdateOptions,java.lang.Class%29)
and [`ArangoCollection.updateDocuments()`](https://www.javadoc.io/doc/com.arangodb/arangodb-java-driver/latest/com/arangodb/ArangoCollection.html#updateDocuments%28java.lang.Iterable%29)
in the _arangodb-java-driver_ documentation for details.
{{< /tab >}}

{{< tab "Python" >}}
```py
coll = db.collection("coll")

# Single document
meta = coll.update({ "_key": "the-document-key", "logo": "avocado" }, return_new=True)

# Multiple documents
meta = coll.update_many([
  { "_key": "one", "val": 1 },
  { "_key": "two", "val": 2 },
  { "_key": "three", "val": 3 }
])
```

See [`StandardCollection.update()`](https://docs.python-arango.com/en/main/specs.html#arango.collection.StandardCollection.update)
and [`StandardCollection.update_many()`](https://docs.python-arango.com/en/main/specs.html#arango.collection.StandardCollection.update_many)
in the _python-arango_ documentation for details.
{{< /tab >}}

{{< /tabs >}}

### Replace documents

{{< tabs "interfaces" >}}

{{< tab "Web interface" >}}
1. Click **COLLECTIONS** in the main navigation.
2. Click the card of the desired collection.
3. Go to the **Content** tab.
4. You may click the filter icon to filter and sort by document attributes.
5. Click a row to open the full document.
6. Delete the document content in the editor and set new attributes.
7. Click the **Save** button at the bottom.

You can also set new content for documents with AQL queries using the
[`REPLACE` operation](../../../aql/high-level-operations/replace.md)
in the **Queries** section.
{{< /tab >}}

{{< tab "arangosh" >}}
```js
---
name: arangosh_replace_documents
description: ''
---
~db._create("coll");
var coll = db._collection("coll");

~coll.insert({
~  _key: "the-document-key",
~  name: "ArangoDB",
~  tags: ["graph", "database", "NoSQL"],
~  scalable: true,
~  company: {
~    name: "ArangoDB Inc.",
~    founded: 2015
~  }
~});
~coll.insert([ { _key: "one" }, { _key: "two" }, { _key: "three" } ]);

coll.replace("the-document-key", { logo: "avocado" }, { returnNew: true });
coll.replace([ "one", "two", { _key: "three" } ], [ { val: 1 }, { val: 2 }, { val: 3 } ]);
~db._drop("coll");
```

See [`collection.replace()`](../../../develop/javascript-api/@arangodb/collection-object.md#collectionreplacedocument-data--options)
in the _JavaScript API_ for details.
{{< /tab >}}

{{< tab "cURL" >}}
```sh
# Single document
curl -XPUT -d '{"logo":"avocado"}' http://localhost:8529/_db/mydb/_api/document/coll/the-document-key?returnNew=true

# Multiple documents
curl -XPUT -d '[{"_key":"one","val":1},{"_key":"two","val":2},{"_key":"three","val":3}]' http://localhost:8529/_db/mydb/_api/document/coll
```

See the following endpoints in the _HTTP API_ for details:
- [`PUT /_db/{database-name}/_api/document/{collection-name}/{document-key}`](../../../develop/http-api/documents.md#replace-a-document)
- [`PUT /_db/{database-name}/_api/document/{collection-name}`](../../../develop/http-api/documents.md#replace-multiple-documents)
{{< /tab >}}

{{< tab "JavaScript" >}}
```js
let coll = db.collection("coll");

// Single document
const result = await coll.replace("the-document-key", { logo: "avocado" }, { returnNew: true });

// Multiple documents
const results = await coll.replaceAll([ { _key: "one", val: 1 }, { _key: "two", val: 2 }, { _key: "three", val: 3 } ]);
```

See [`DocumentCollection.replace()`](https://arangodb.github.io/arangojs/latest/interfaces/collection.DocumentCollection.html#replace)
and [`DocumentCollection.replaceAll()`](https://arangodb.github.io/arangojs/latest/interfaces/collection.DocumentCollection.html#replaceAll)
in the _arangojs_ documentation for details.
{{< /tab >}}

{{< tab "Go" >}}
```go
ctx := context.Background()
coll, err := db.GetCollection(ctx, "coll", nil)

var newDoc map[string]interface{}

// Single document
newAttributes := map[string]interface{}{
  "logo": "avocado",
}
meta, err := coll.ReplaceDocumentWithOptions(ctx, "the-document-key", newAttributes, &arangodb.CollectionDocumentReplaceOptions{
  NewObject: &newDoc,
})
if err != nil {
  fmt.Println(err)
} else {
  fmt.Printf("Metadata: %+v\n", meta.DocumentMeta)
  fmt.Printf("Replaced document: %v\n", newDoc)
}

// Multiple documents
replaceDocs := []interface{}{
  map[string]interface{}{"_key": "one", "val": 1},
  map[string]interface{}{"_key": "two", "val": 2},
  map[string]interface{}{"_key": "three", "val": 3},
}

replaceReader, err := coll.ReplaceDocumentsWithOptions(ctx, replaceDocs, &arangodb.CollectionDocumentReplaceOptions{
  NewObject: &newDoc,
})
for {
  newDoc = nil // Reset to not leak attributes of previous documents
  meta, err := replaceReader.Read()
  if shared.IsNoMoreDocuments(err) {
    break
  } else if err != nil {
    fmt.Println(err)
  } else {
    fmt.Printf("Metadata: %+v\n", meta.DocumentMeta)
    fmt.Printf("Replaced document: %v\n", newDoc)
  }
}
```

See the following functions 
in the [_go-driver_ v2 documentation](https://pkg.go.dev/github.com/arangodb/go-driver/v2/arangodb#CollectionDocumentReplace)
for details:
- `CollectionDocumentReplace.ReplaceDocument()`
- `CollectionDocumentReplace.ReplaceDocumentWithOptions()`
- `CollectionDocumentReplace.ReplaceDocuments()`
- `CollectionDocumentReplace.ReplaceDocumentsWithOptions()`
{{< /tab >}}

{{< tab "Java" >}}
```java
ArangoCollection coll = db.collection("coll");

// Single document
BaseDocument doc = new BaseDocument("the-document-key");
doc.addAttribute("logo", "avocado");
DocumentUpdateEntity<BaseDocument> result = coll.replaceDocument(
        "the-document-key",
        doc,
        new DocumentReplaceOptions().returnNew(true),
        BaseDocument.class
);

// Multiple documents
BaseDocument doc1 = new BaseDocument("one");
doc1.addAttribute("val", 1);
BaseDocument doc2 = new BaseDocument("two");
doc2.addAttribute("val", 2);
BaseDocument doc3 = new BaseDocument("three");
doc3.addAttribute("val", 3);
MultiDocumentEntity<DocumentUpdateEntity<Void>> replacedDocs =
        coll.replaceDocuments(List.of(doc1, doc2, doc3));
```

See [`ArangoCollection.replaceDocument()`](https://www.javadoc.io/doc/com.arangodb/arangodb-java-driver/latest/com/arangodb/ArangoCollection.html#replaceDocument%28java.lang.String,java.lang.Object,com.arangodb.model.DocumentUpdateOptions,java.lang.Class%29)
and [`ArangoCollection.replaceDocuments()`](https://www.javadoc.io/doc/com.arangodb/arangodb-java-driver/latest/com/arangodb/ArangoCollection.html#replaceDocuments%28java.lang.Iterable%29)
in the _arangodb-java-driver_ documentation for details.
{{< /tab >}}

{{< tab "Python" >}}
```py
coll = db.collection("coll")

# Single document
meta = coll.replace({ "_key": "the-document-key", "logo": "avocado" }, return_new=True)

# Multiple documents
meta = coll.replace_many([
  { "_key": "one", "val": 1 },
  { "_key": "two", "val": 2 },
  { "_key": "three", "val": 3 }
])
```

See [`StandardCollection.replace()`](https://docs.python-arango.com/en/main/specs.html#arango.collection.StandardCollection.replace)
and [`StandardCollection.replace_many()`](https://docs.python-arango.com/en/main/specs.html#arango.collection.StandardCollection.replace_many)
in the _python-arango_ documentation for details.
{{< /tab >}}

{{< /tabs >}}

### Remove documents

{{< tabs "interfaces" >}}

{{< tab "Web interface" >}}
1. Click **COLLECTIONS** in the main navigation.
2. Click the card of the desired collection.
3. Go to the **Content** tab.
4. You may click the filter icon to filter and sort by document attributes.
5. In the row of the document you want to delete, you can click the minus icon
   on the right-hand side and confirm the deletion.
6. Alternatively, click a row to open the full document, then click the
   **Delete** button at the bottom and confirm the deletion.

You can also delete documents with AQL queries using the
[`REMOVE` operation](../../../aql/high-level-operations/remove.md)
in the **Queries** section.
{{< /tab >}}

{{< tab "arangosh" >}}
```js
---
name: arangosh_delete_documents
description: ''
---
~db._create("coll");
var coll = db._collection("coll");
~coll.insert({ _key: "the-document-key" });
~coll.insert([ { _key: "one" }, { _key: "two" }, { _key: "three" } ]);
coll.remove("the-document-key");
coll.remove([ "one", "two", { _key: "three" } ]);
~db._drop("coll");
```

See [`collection.remove()`](../../../develop/javascript-api/@arangodb/collection-object.md#collectionremoveobject)
in the _JavaScript API_ for details.
{{< /tab >}}

{{< tab "cURL" >}}
```sh
# Single document
curl -XDELETE http://localhost:8529/_db/mydb/_api/document/coll/the-document-key

# Multiple documents
curl -XDELETE -d '["one","two",{"_key":"three"}]' http://localhost:8529/_db/mydb/_api/document/coll
```

See the following endpoints in the _HTTP API_ for details:
- [`DELETE /_db/{database-name}/_api/document/{collection-name}/{document-key}`](../../../develop/http-api/documents.md#remove-a-document)
- [`DELETE /_db/{database-name}/_api/document/{collection-name}`](../../../develop/http-api/documents.md#remove-multiple-documents)
{{< /tab >}}

{{< tab "JavaScript" >}}
```js
let coll = db.collection("coll");

// Single document
const result = await coll.remove("the-document-key");

// Multiple documents
const results = await coll.removeAll(["one", "two", { _key: "three" } ]);
```

See [`DocumentCollection.remove()`](https://arangodb.github.io/arangojs/latest/interfaces/collection.DocumentCollection.html#remove)
and [`DocumentCollection.removeAll()`](https://arangodb.github.io/arangojs/latest/interfaces/collection.DocumentCollection.html#removeAll)
in the _arangojs_ documentation for details.
{{< /tab >}}

{{< tab "Go" >}}
```go
ctx := context.Background()
coll, err := db.GetCollection(ctx, "coll", nil)

// Single document
result, err := coll.DeleteDocument(ctx, "the-document-key")
if err != nil {
  fmt.Println(err)
} else {
  fmt.Printf("Metadata: %+v\n", result.DocumentMeta)
}

// Multiple documents
var oldDoc map[string]interface{}
removeReader, err := coll.DeleteDocumentsWithOptions(ctx, []string{ "one", "two", "three" }, &arangodb.CollectionDocumentRemoveOptions{
  OldObject: &oldDoc,
})
for {
  oldDoc = nil // Reset to not leak attributes of previous documents
  meta, err := removeReader.Read()
  if shared.IsNoMoreDocuments(err) {
    break
  } else if err != nil {
    fmt.Println(err)
  } else {
    fmt.Printf("Metadata: %+v\n", meta.DocumentMeta)
    fmt.Printf("Removed document: %v\n", oldDoc)
  }
}
```

See the following functions 
in the [_go-driver_ v2 documentation](https://pkg.go.dev/github.com/arangodb/go-driver/v2/arangodb#CollectionDocumentDelete)
for details:
- `CollectionDocumentRead.DeleteDocument()`
- `CollectionDocumentRead.DeleteDocumentsWithOptions()`
- `CollectionDocumentRead.DeleteDocument()`
- `CollectionDocumentRead.DeleteDocumentsWithOptions()`
{{< /tab >}}

{{< tab "Java" >}}
```java
ArangoCollection coll = db.collection("coll");

// Single document
DocumentDeleteEntity<Void> result = coll.deleteDocument("the-document-key");

// Multiple documents
MultiDocumentEntity<DocumentDeleteEntity<Void>> multipleResult = 
        coll.deleteDocuments(List.of("one", "two", "three"));
```

See [`ArangoCollection.deleteDocument()`](https://www.javadoc.io/doc/com.arangodb/arangodb-java-driver/latest/com/arangodb/ArangoCollection.html#deleteDocument%28java.lang.String%29)
and [`ArangoCollection.deleteDocuments()`](https://www.javadoc.io/doc/com.arangodb/arangodb-java-driver/latest/com/arangodb/ArangoCollection.html#getDocuments%28java.lang.Iterable,java.lang.Class%29)
in the _arangodb-java-driver_ documentation for details.
{{< /tab >}}

{{< tab "Python" >}}
```py
coll = db.collection("coll")

# Single document
meta = coll.delete("the-document-key")

# Multiple documents
meta = coll.delete_many(["one", "two", { "_key": "three" } ])
```

See [`StandardCollection.delete()`](https://docs.python-arango.com/en/main/specs.html#arango.collection.StandardCollection.delete)
and [`StandardCollection.delete_many()`](https://docs.python-arango.com/en/main/specs.html#arango.collection.StandardCollection.delete_many)
in the _python-arango_ documentation for details.
{{< /tab >}}

{{< /tabs >}}
