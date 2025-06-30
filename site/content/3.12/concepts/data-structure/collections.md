---
title: Collections
menuTitle: Collections
weight: 10
description: >-
  Collections allow you to store documents and you can use them to group records
  of similar kinds together
---
A collection can contain a set of documents, similar to how a folder contains
files. You can store documents with varying data structures in a single
collection, but a collection is typically used to only store one type of
entities. For example, you can use one collection for products, another for
customers, and yet another for orders.

## Collection types

- The regular type of collection is a **document collection**. If you use
  document collections for a graph, then they are referred to as
  **vertex collections**.

- To store connections between the vertices of a graph, you need to use
  **edge collections**. The documents they contain have a `_from` and a `_to`
  attribute to reference documents by their ID.

- Collection that are used internally by ArangoDB are prefixed with an
  underscore (like `_users`) and are called **system collections**. They can be
  document collections as well as edge collections.

You need to specify whether you want a document collection or an edge collection
when you create the collection. The type cannot be changed later.

## Collection names

You can give each collection a name to identify and access it. The name needs to
be unique within a [database](databases.md), but not globally
for the entire ArangoDB instance.

The namespace for collections is shared with [Views](views.md).
There cannot exist a collection and a View with the same name in the same database.

The collection name needs to be a string that adheres to either the **traditional**
or the **extended** naming constraints. Whether the former or the latter is
active depends on the `--database.extended-names` startup option.
The extended naming constraints are used if enabled, allowing many special and
UTF-8 characters in database, collection, View, and index names. If set to
`false` (default), the traditional naming constraints are enforced.

{{< info >}}
The extended naming constraints are an **experimental** feature but they will
become the norm in a future version. Check if your drivers and client applications
are prepared for this feature before enabling it.
{{< /info >}}

The restrictions for collection names are as follows:

- For the **traditional** naming constraints:
  - The names must only consist of the letters `A` to `Z` (both in lower 
    and upper case), the digits `0` to `9`, and underscore (`_`) and dash (`-`)
    characters. This also means that any non-ASCII names are not allowed.
  - Names of user-defined collections must always start with a letter.
    System collection names must start with an underscore. You should not use
    system collection names for your own collections.
  - The maximum allowed length of a name is 256 bytes.
  - Collection names are case-sensitive.

- For the **extended** naming constraints:
  - Names can consist of most UTF-8 characters, such as Japanese or Arabic
    letters, emojis, letters with accentuation. Some ASCII characters are
    disallowed, but less compared to the  _traditional_ naming constraints.
  - Names cannot contain the characters `/` or `:` at any position, nor any
    control characters (below ASCII code 32), such as `\n`, `\t`, `\r`, and `\0`.
  - Spaces are accepted, but only in between characters of the name. Leading
    or trailing spaces are not allowed.
  - `.` (dot), `_` (underscore) and the numeric digits `0`-`9` are not allowed
    as first character, but at later positions.
  - Collection names are case-sensitive.
  - Collection names containing UTF-8 characters must be 
    [NFC-normalized](https://en.wikipedia.org/wiki/Unicode_equivalence#Normal_forms).
    Non-normalized names are rejected by the server.
  - The maximum length for a collection name is 256 bytes after normalization. 
    As a UTF-8 character may consist of multiple bytes, this does not necessarily 
    equate to 256 characters.

  Example collection names that can be used with the _extended_ naming constraints:
  `España`, `😀`, `犬`, `كلب`, `@abc123`, `København`, `München`, `Бишкек`, `abc? <> 123!`

{{< warning >}}
While it is possible to change the value of the
`--database.extended-names` option from `false` to `true` to enable
extended names, the reverse is not true. Once the extended names have been
enabled, they remain permanently enabled so that existing databases,
collections, Views, and indexes with extended names remain accessible.

Please be aware that dumps containing extended names cannot be restored
into older versions that only support the traditional naming constraints. In a
cluster setup, it is required to use the same naming constraints for all
Coordinators and DB-Servers of the cluster. Otherwise, the startup is
refused.
{{< /warning >}}

You can rename collections (except in cluster deployments). This changes the
collection name, but not the collection identifier.

## Collection identifiers

A collection identifier lets you refer to a collection in a database, similar to
the name. It is a string value and is unique within a database. Unlike
collection names, ArangoDB assigns collection IDs automatically and you have no
control over them.

ArangoDB internally uses collection IDs to look up collections. However, you
should use the collection name to access a collection instead of its identifier.

ArangoDB uses 64-bit unsigned integer values to maintain collection IDs
internally. When returning collection IDs to clients, ArangoDB returns them as
strings to ensure the identifiers are not clipped or rounded by clients that do
not support big integers. Clients should treat the collection IDs returned by
ArangoDB as opaque strings when they store or use them locally.

## Key generators

ArangoDB allows using key generators for each collection. Key generators
have the purpose of auto-generating values for the `_key` attribute of a document
if none was specified by the user. By default, ArangoDB uses the traditional
key generator. The traditional key generator auto-generates key values that
are strings with ever-increasing numbers. The increment values it uses are
non-deterministic.

Contrary, the auto-increment key generator auto-generates deterministic key
values. Both the start value and the increment value can be defined when the
collection is created. The default start value is `0` and the default increment
is `1`, meaning the key values it creates by default are:

1, 2, 3, 4, 5, ...

When creating a collection with the auto-increment key generator and an
increment of `5`, the generated keys would be:

1, 6, 11, 16, 21, ...

The auto-increment values are increased and handed out on each document insert
attempt. Even if an insert fails, the auto-increment value is never rolled back.
That means there may exist gaps in the sequence of assigned auto-increment values
if inserts fails.

## Synchronous replication of collections

Distributed ArangoDB setups offer synchronous replication,
which means that there is the option to replicate all data
automatically within an ArangoDB cluster. This is configured for sharded
collections on a per-collection basis by specifying a **replication factor**.
A replication factor of `k` means that altogether `k` copies of each shard are
kept in the cluster on `k` different servers, and are kept in sync. That is,
every write operation is automatically replicated on all copies.

This is organized using a leader/follower model. At all times, one of the
servers holding replicas for a shard is "the leader" and all others
are "followers", this configuration is held in the Agency (see 
[Cluster](../../deploy/cluster/_index.md) for details of the ArangoDB
cluster architecture). Every write operation is sent to the leader
by one of the Coordinators, and then replicated to all followers
before the operation is reported to have succeeded. The leader keeps
a record of which followers are currently in sync. In case of network
problems or a failure of a follower, a leader can and will drop a follower 
temporarily after 3 seconds, such that service can resume. In due course,
the follower will automatically resynchronize with the leader to restore
resilience.

If a leader fails, the cluster Agency automatically initiates a failover
routine after around 15 seconds, promoting one of the followers to
leader. The other followers (and the former leader, when it comes back),
automatically resynchronize with the new leader to restore resilience.
Usually, this whole failover procedure can be handled transparently
for the Coordinator, such that the user code does not even see an error 
message.

This fault tolerance comes at a cost of increased latency.
Each write operation needs an additional network roundtrip for the
synchronous replication of the followers (but all replication operations
to all followers happen concurrently). Therefore, the default replication
factor is `1`, which means no replication.

## Collection interfaces

The following sections show examples of how you can use the APIs of ArangoDB and
the official drivers, as well as the ArangoDB Shell and the built-in web interface,
to perform common operations related to collections. For less common operations
and other drivers, see the corresponding reference documentation.

### Create a collection

{{< tabs "interfaces" >}}

{{< tab "Web interface" >}}
1. Click **Collections** in the main navigation.
2. Click **Add collection**.
3. Set a **Name** and optionally configuration options.
4. Click **Create**.
{{< /tab >}}

{{< tab "arangosh" >}}
```js
---
name: arangosh_create_collection
description: ''
---
coll = db._create("coll");
~db._drop("coll");
```
See [`db._create()`](../../develop/javascript-api/@arangodb/db-object.md#db_createcollection-name--properties--type--options)
in the _JavaScript API_ for details.
{{< /tab >}}

{{< tab "cURL" >}}
```sh
curl -d '{"name":"coll"}' http://localhost:8529/_db/mydb/_api/collection
```

See the [`POST /_db/{database-name}/_api/collection`](../../develop/http-api/collections.md#create-a-collection)
endpoint in the _HTTP API_ for details.
{{< /tab >}}

{{< tab "JavaScript" >}}
```js
let coll = await db.createCollection("coll");
// -- or --
coll = db.collection("coll");
const info = await coll.create();
```

See [`Database.createCollection()`](https://arangodb.github.io/arangojs/latest/classes/databases.Database.html#createCollection)
and [`DocumentCollection.create()`](https://arangodb.github.io/arangojs/latest/interfaces/collections.DocumentCollection.html#create)
in the _arangojs_ documentation for details.
{{< /tab >}}

{{< tab "Go" >}}
```go
ctx := context.Background()
coll, err := db.CreateCollection(ctx, "coll", nil)
if err != nil {
  fmt.Println(err)
} else {
  _ = coll // Use coll here
}
```

See [`DatabaseCollection.CreateCollection()`](https://pkg.go.dev/github.com/arangodb/go-driver/v2/arangodb#DatabaseCollection)
in the _go-driver_ v2 documentation for details.
{{< /tab >}}

{{< tab "Java" >}}
```java
CollectionEntity coll = db.createCollection("coll");
// -- or --
CollectionEntity coll = db.collection("coll").create();
```

See [`ArangoDB.createCollection()`](https://www.javadoc.io/doc/com.arangodb/arangodb-java-driver/latest/com/arangodb/ArangoDB.html#db%28java.lang.String%29)
and [`ArangoCollection.create()`](https://www.javadoc.io/doc/com.arangodb/arangodb-java-driver/latest/com/arangodb/ArangoCollection.html#create%28%29)
in the _arangodb-java-driver_ documentation for details.
{{< /tab >}}

{{< tab "Python" >}}
```py
coll = db.create_collection("coll")
```

See [`StandardDatabase.create_collection()`](https://docs.python-arango.com/en/main/specs.html#arango.database.StandardDatabase.create_collection)
in the _python-arango_ documentation for details.
{{< /tab >}}

{{< /tabs >}}

### Get a collection

{{< tabs "interfaces" >}}

{{< tab "Web interface" >}}
1. If necessary, [switch to the database](databases.md#set-the-database-context)
   that contains the desired collection.
2. Click **Collections** in the main navigation.
3. Click the name or row of the desired collection.
{{< /tab >}}

{{< tab "arangosh" >}}
```js
---
name: arangosh_get_collection
description: ''
---
~db._create("coll");
coll = db._collection("coll");
~db._drop("coll");
```

There is a short-cut that you can use:

```js
let coll = db.coll
// or
let coll = db["coll"]
```

See [`db._collection()`](../../develop/javascript-api/@arangodb/db-object.md#db_collectioncollection)
in the _JavaScript API_ for details.
{{< /tab >}}

{{< tab "cURL" >}}
```sh
curl http://localhost:8529/_db/mydb/_api/collection/coll
```

See the [`GET /_db/{database-name}/_api/collection/{collection-name}`](../../develop/http-api/collections.md#get-the-collection-information)
endpoint in the _HTTP API_ for details.
{{< /tab >}}

{{< tab "JavaScript" >}}
```js
let coll = db.collection("coll");
const info = await coll.get();
```

See [`Database.collection()`](https://arangodb.github.io/arangojs/latest/classes/databases.Database.html#collection)
in the _arangojs_ documentation for details.
{{< /tab >}}

{{< tab "Go" >}}
```go
ctx := context.Background()
coll, err := db.GetCollection(ctx, "coll", nil)
if err != nil {
  fmt.Println(err)
} else {
  _ = coll // Use coll here
}
```

See [`DatabaseCollection.GetCollection()`](https://pkg.go.dev/github.com/arangodb/go-driver/v2/arangodb#DatabaseCollection)
in the _go-driver_ v2 documentation for details.
{{< /tab >}}

{{< tab "Java" >}}
```java
ArangoCollection coll = db.collection("coll");
CollectionEntity info = coll.getInfo();
```

See [`ArangoDB.collection()`](https://www.javadoc.io/doc/com.arangodb/arangodb-java-driver/latest/com/arangodb/ArangoDB.html#db%28java.lang.String%29)
and [`ArangoCollection.getInfo()`](https://www.javadoc.io/doc/com.arangodb/arangodb-java-driver/latest/com/arangodb/ArangoCollection.html#getInfo%28%29)
in the _arangodb-java-driver_ documentation for details.
{{< /tab >}}

{{< tab "Python" >}}
```py
coll = db.collection("coll")
```

See [`StandardDatabase.collection()`](https://docs.python-arango.com/en/main/specs.html#arango.database.StandardDatabase.collection)
in the _python-arango_ documentation for details.
{{< /tab >}}

{{< /tabs >}}

### List all collections

{{< tabs "interfaces" >}}

{{< tab "Web interface" >}}
1. If necessary, [switch to the database](databases.md#set-the-database-context)
   that you want to list the collection of.
2. Click **Collections** in the main navigation.
3. All collections are listed, given that no **Filters** are applied and you
   have at least read access for all collections.
{{< /tab >}}

{{< tab "arangosh" >}}
```js
---
name: arangosh_list_collections
description: ''
---
~db._createDatabase("mydb");
~db._useDatabase("mydb");
~db._create("products");
~db._create("users");
db._collections();
~db._useDatabase("_system");
~db._dropDatabase("mydb");
```

See [`db._collections()`](../../develop/javascript-api/@arangodb/db-object.md#collections)
in the _JavaScript API_ for details.
{{< /tab >}}

{{< tab "cURL" >}}
```sh
curl http://localhost:8529/_db/mydb/_api/collection
```

See the [`GET /_db/{database-name}/_api/collection`](../../develop/http-api/collections.md#list-all-collections)
endpoint in the _HTTP API_ for details.
{{< /tab >}}

{{< tab "JavaScript" >}}
```js
const colls = await db.collections();
colls.forEach(c => console.log(c.name))
```

See [`Database.collections()`](https://arangodb.github.io/arangojs/latest/classes/databases.Database.html#collections)
in the _arangojs_ documentation for details.
{{< /tab >}}

{{< tab "Go" >}}
```go
ctx := context.Background()
colls, err := db.Collections(ctx)
if err != nil {
  fmt.Println(err)
} else {
  for _, c := range colls {
    fmt.Println(c.Name())
  }
}
```

See [`DatabaseCollection.Collections()`](https://pkg.go.dev/github.com/arangodb/go-driver/v2/arangodb#DatabaseCollection)
in the _go-driver_ v2 documentation for details.
{{< /tab >}}

{{< tab "Java" >}}
```java
Collection<CollectionEntity> colls = db.getCollections();
colls.forEach(c -> System.out.println(c.getName()));
```

See [`ArangoDatabase.getCollections()`](https://www.javadoc.io/doc/com.arangodb/arangodb-java-driver/latest/com/arangodb/ArangoDatabase.html#getCollections%28%29)
in the _arangodb-java-driver_ documentation for details.
{{< /tab >}}

{{< tab "Python" >}}
```py
colls = db.collections()
for c in colls:
  print(c["name"])
```

See [`StandardDatabase.collections()`](https://docs.python-arango.com/en/main/specs.html#arango.database.StandardDatabase.collections)
in the _python-arango_ documentation for details.
{{< /tab >}}

{{< /tabs >}}

### Get the collection properties

{{< tabs "interfaces" >}}

{{< tab "Web interface" >}}
1. If necessary, [switch to the database](databases.md#set-the-database-context)
   that contains the desired collection.
2. Click **Collections** in the main navigation.
3. Click the name or row of the desired collection.
4. The properties are listed in the **Info**, **Computed Values**, and
   **Schema** tabs.
{{< /tab >}}

{{< tab "arangosh" >}}
```js
---
name: arangosh_get_collection_properties
description: ''
---
~db._create("coll");
var coll = db._collection("coll");
coll.properties();
~db._drop("coll");
```

See [`collection.properties()`](../../develop/javascript-api/@arangodb/collection-object.md#collectionpropertiesproperties)
in the _JavaScript API_ for details.
{{< /tab >}}

{{< tab "cURL" >}}
```sh
curl http://localhost:8529/_db/mydb/_api/collection/coll/properties
```

See the [`GET /_db/{database-name}/_api/collection/{collection-name}/properties`](../../develop/http-api/collections.md#get-the-properties-of-a-collection)
endpoint in the _HTTP API_ for details.
{{< /tab >}}

{{< tab "JavaScript" >}}
```js
let coll = db.collection("coll");
const props = await coll.properties();
console.log(props);
```

See [`DocumentCollection.properties()`](https://arangodb.github.io/arangojs/latest/interfaces/collections.DocumentCollection.html#properties)
in the _arangojs_ documentation for details.
{{< /tab >}}

{{< tab "Go" >}}
```go
ctx := context.Background()
coll, err := db.GetCollection(ctx, "coll", nil)
if err != nil {
  fmt.Println(err)
} else {
  props, err := coll.Properties(ctx)
  if err != nil {
    fmt.Println(err)
  } else {
    fmt.Printf("%+v", props)
  }
}
```

See [`Collection.Properties()`](https://pkg.go.dev/github.com/arangodb/go-driver/v2/arangodb#Collection)
in the _go-driver_ v2 documentation for details.
{{< /tab >}}

{{< tab "Java" >}}
```java
ArangoCollection coll = db.collection("coll");
CollectionPropertiesEntity props = coll.getProperties();
```

See [`ArangoCollection.getProperties()`](https://www.javadoc.io/doc/com.arangodb/arangodb-java-driver/latest/com/arangodb/ArangoCollection.html#getProperties%28%29)
in the _arangodb-java-driver_ documentation for details.
{{< /tab >}}

{{< tab "Python" >}}
```py
coll = db.collection("coll")
props = coll.properties()
```

See [`Collection.properties()`](https://docs.python-arango.com/en/main/specs.html#arango.collection.Collection.properties)
in the _python-arango_ documentation for details.
{{< /tab >}}

{{< /tabs >}}

### Set the collection properties

{{< tabs "interfaces" >}}

{{< tab "Web interface" >}}
1. If necessary, [switch to the database](databases.md#set-the-database-context)
   that contains the desired collection.
2. Click **Collections** in the main navigation.
3. Click the name or row of the desired collection.
4. The properties you can change are listed in the **Settings**,
   **Computed Values**, and **Schema** tabs.
5. Make the desired changes and click the **Save** button.
{{< /tab >}}

{{< tab "arangosh" >}}
```js
---
name: arangosh_set_collection_properties
type: cluster
description: ''
---
~db._create("coll");
var coll = db._collection("coll");
coll.properties({
  waitForSync: true,
  replicationFactor: 3
});
~db._drop("coll");
```

See [`collection.properties()`](../../develop/javascript-api/@arangodb/collection-object.md#collectionpropertiesproperties)
in the _JavaScript API_ for details.
{{< /tab >}}

{{< tab "cURL" >}}
```sh
curl -XPUT -d '{"waitForSync":true,"replicationFactor":3}' http://localhost:8529/_db/mydb/_api/collection/coll/properties
```

See the [`PUT /_db/{database-name}/_api/collection/{collection-name}/properties`](../../develop/http-api/collections.md#change-the-properties-of-a-collection)
endpoint in the _HTTP API_ for details.
{{< /tab >}}

{{< tab "JavaScript" >}}
```js
let coll = db.collection("coll");
const props = await coll.properties({
  waitForSync: true,
  replicationFactor: 3
});
```

See [`DocumentCollection.properties()`](https://arangodb.github.io/arangojs/latest/interfaces/collections.DocumentCollection.html#properties.properties-2)
in the _arangojs_ documentation for details.
{{< /tab >}}

{{< tab "Go" >}}
```go
ctx := context.Background()
coll, err := db.GetCollection(ctx, "coll", nil)
if err != nil {
  fmt.Println(err)
} else {
  err := coll.SetProperties(ctx, arangodb.SetCollectionPropertiesOptions{
    WaitForSync:       utils.NewType(true),
    ReplicationFactor: 3,
  })
  if err != nil {
    fmt.Println(err)
  }
}
```

See [`Collection.SetProperties()`](https://pkg.go.dev/github.com/arangodb/go-driver/v2/arangodb#Collection)
in the _go-driver_ v2 documentation for details.
{{< /tab >}}

{{< tab "Java" >}}
```java
CollectionPropertiesOptions options = new CollectionPropertiesOptions()
  .waitForSync(true)
  .replicationFactor(ReplicationFactor.of(3));

ArangoCollection coll = db.collection("coll");
CollectionPropertiesEntity props = coll.changeProperties(options);
```

See [`ArangoCollection.changeProperties()`](https://www.javadoc.io/doc/com.arangodb/arangodb-java-driver/latest/com/arangodb/ArangoCollection.html#changeProperties%28com.arangodb.model.CollectionPropertiesOptions%29)
and [`CollectionPropertiesEntity`](https://www.javadoc.io/doc/com.arangodb/arangodb-java-driver/latest/com/arangodb/entity/CollectionPropertiesEntity.html)
in the _arangodb-java-driver_ documentation for details.
{{< /tab >}}

{{< tab "Python" >}}
```py
coll = db.collection("coll")
props = coll.configure(
  sync=True,
  replication_factor=3
)
```

See [`Collection.configure()`](https://docs.python-arango.com/en/main/specs.html#arango.collection.Collection.configure)
in the _python-arango_ documentation for details.
{{< /tab >}}

{{< /tabs >}}

### Remove a collection

{{< tabs "interfaces" >}}

{{< tab "Web interface" >}}
1. If necessary, [switch to the database](databases.md#set-the-database-context)
   that contains the desired collection.
2. Click **Collections** in the main navigation.
3. Click the name or row of the desired collection.
4. Go to the **Settings** tab.
5. Click the **Delete** button and confirm the deletion.
{{< /tab >}}

{{< tab "arangosh" >}}
```js
---
name: arangosh_delete_collection
render: input
description: ''
---
~db._create("coll");
db._drop("coll");
```

See [`db._drop()`](../../develop/javascript-api/@arangodb/db-object.md#db_dropcollection--options)
in the _JavaScript API_ for details.
{{< /tab >}}

{{< tab "cURL" >}}
```sh
curl -XDELETE http://localhost:8529/_db/mydb/_api/collection/coll
```

See the [`DELETE /_db/{database-name}/_api/collection/{collection-name}`](../../develop/http-api/collections.md#drop-a-collection)
endpoint in the _HTTP API_ for details.
{{< /tab >}}

{{< tab "JavaScript" >}}
```js
let coll = db.collection("coll");
const status = await coll.drop();
```

See [`DocumentCollection.drop()`](https://arangodb.github.io/arangojs/latest/interfaces/collections.DocumentCollection.html#drop)
in the _arangojs_ documentation for details.
{{< /tab >}}

{{< tab "Go" >}}
```go
ctx := context.Background()
coll, err := db.GetCollection(ctx, "coll", nil)
if err != nil {
  fmt.Println(err)
} else {
  err = coll.Remove(ctx)
  if err != nil {
    fmt.Println(err)
  }
}
```

See [`Collection.Remove()`](https://pkg.go.dev/github.com/arangodb/go-driver/v2/arangodb#Collection)
in the _go-driver_ v2 documentation for details.
{{< /tab >}}

{{< tab "Java" >}}
```java
ArangoCollection coll = db.collection("coll");
coll.drop();
```

See [`ArangoCollection.drop()`](https://www.javadoc.io/doc/com.arangodb/arangodb-java-driver/latest/com/arangodb/ArangoCollection.html#drop%28%29)
in the _arangodb-java-driver_ documentation for details.
{{< /tab >}}

{{< tab "Python" >}}
```py
ok = db.delete_collection("coll")
```

See [`StandardDatabase.delete_collection()`](https://docs.python-arango.com/en/main/specs.html#arango.database.StandardDatabase.delete_collection)
in the _python-arango_ documentation for details.
{{< /tab >}}

{{< /tabs >}}
