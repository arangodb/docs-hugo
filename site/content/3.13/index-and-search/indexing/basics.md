---
title: Index basics
menuTitle: Index Basics
weight: 5
description: >-
  Indexes allow fast access to documents by maintaining special data structures
  to accelerate queries that use indexed attributes
---
ArangoDB automatically indexes some system attributes but you are free to create
additional indexes on other attributes of documents. You generally need to strike
a balance between creating indexes for often-used attributes to improve the
performance of read queries and the cost that indexes incur during writes to
maintain them.

User-defined indexes can be created on collection level. Most user-defined indexes 
can be created by specifying the names of the index attributes.
Some index types allow indexing just one attribute (e.g. a `ttl` index) whereas 
other index types allow indexing multiple attributes at the same time.

The system attributes `_id`, `_key`, `_from` and `_to` are automatically indexed
by ArangoDB, without the user being required to create extra indexes for them.
`_id` and `_key` are covered by a collection's primary key, and `_from` and `_to`
are covered by an edge collection's edge index automatically.

You cannot use the `_id` system attribute, nor sub-attributes with this name, in
user-defined indexes (except the inverted index type). This applies to the
`fields` the index is defined over but not the additional attributes you can
store in a persistent index using `storedValues`. Indexing and storing
the `_key`, `_rev`, `_from`, and `_to` system attributes is possible.

You cannot index fields that contain `.` in their attribute names because dots
are interpreted as paths of nested attributes. For example, `fields: ["foo.bar"]`
indexes the value of the nested attribute `bar` under the top-level attribute
`foo` (`{ "foo": { "bar": "value" } }`) and not a top-level attribute
`foo.bar` (`{ "foo.bar": "value" }`).

You can also not index fields whose names either start or end with `:`, for
example, `fields: ["foo:"]`. This notation is reserved for internal use.

Creating new indexes is by default done under an exclusive collection lock. The collection is not
available while the index is being created. This "foreground" index creation can be undesirable, 
if you have to perform it on a live system without a dedicated maintenance window.

For potentially long running index creation operations, creating indexes in the
"background" is supported. The collection remains (mostly) available during the index creation,
see the section [Creating Indexes in Background](#creating-indexes-in-background) for more information.

## Primary Index

For each collection there will always be a *primary index* which is a persistent index
for the [document keys](../../concepts/data-structure/documents/_index.md#document-keys) (`_key` attribute)
of all documents in the collection. The primary index allows quick selection
of documents in the collection using either the `_key` or `_id` attributes. It will
be used from within AQL queries automatically when performing equality lookups on
`_key` or `_id`. 

There are also dedicated functions to find a document given its `_key` or `_id`
that will always make use of the primary index:

```js
db.collection.document("<document-key>");
db._document("<document-id>");
```

The primary index can be used for range queries and sorting as persistent
indexes are sorted.

The primary index of a collection cannot be dropped or changed, and there is no
mechanism to create user-defined primary indexes.

## Edge Index

Every [edge collection](../../concepts/data-models.md#graph-model) also has an 
automatically created *edge index*. The edge index provides quick access to
documents by either their `_from` or `_to` attributes. It can therefore be
used to quickly find connections between vertex documents and is invoked when 
the connecting edges of a vertex are queried.

Edge indexes are used from within AQL when performing equality lookups on `_from`
or `_to` values in an edge collections. There are also dedicated functions to 
find edges given their `_from` or `_to` values that will always make use of the 
edge index:

```js
db.collection.edges("<from-value>");
db.collection.edges("<to-value>");
db.collection.outEdges("<from-value>");
db.collection.outEdges("<to-value>");
db.collection.inEdges("<from-value>");
db.collection.inEdges("<to-value>");
```

The edge index stores the union of all `_from` and `_to` attributes.
It can be used for equality lookups, but not for range queries or for sorting.
Edge indexes are automatically created for edge collections.

It is not possible to create user-defined edge indexes.
However, it is possible to freely use the `_from` and `_to` attributes in
user-defined indexes.

An edge index cannot be dropped or changed.

## Vertex-centric indexes

As mentioned above, the most important indexes for graphs are the edge
indexes, indexing the `_from` and `_to` attributes of edge collections.
They provide very quick access to all edges originating in or arriving
at a given vertex, which allows you to quickly find all neighbors of a vertex
in a graph.

In many cases one would like to run more specific queries, for example
finding amongst the edges originating from a given vertex only those
with a timestamp greater than or equal to some date and time. Exactly this
is achieved with "vertex-centric indexes". In a sense these are localized
indexes for an edge collection, which sit at every single vertex.

Technically, they are implemented in ArangoDB as indexes, which sort the 
complete edge collection first by `_from` and then by other attributes
for _OUTBOUND_ traversals, or first by `_to` and then by other attributes
for _INBOUND_ traversals. For traversals in _ANY_ direction two indexes
are needed, one with `_from` and the other with `_to` as first indexed field.

If we for example have a persistent index on the attributes `_from` and 
`timestamp` of an edge collection, we can answer the above question
very quickly with a single range lookup in the index.

You can create sorted persistent indexes that index the special edge attributes
`_from` or `_to` and additionally other attributes. These are used
in graph traversals, when appropriate `FILTER` statements are found
by the optimizer.

For example, to create a vertex-centric index of the above type, you 
would simply do

```js
db.edges.ensureIndex({"type": "persistent", "fields": ["_from", "timestamp"]});
```

in arangosh. Then, queries like

```aql
FOR v, e, p IN 1..1 OUTBOUND "V/1" edges
  FILTER e.timestamp >= "2018-07-09"
  RETURN p
```

will be considerably faster in case there are many edges originating
from vertex `"V/1"` but only few with a recent timestamp. Note that the
optimizer may prefer the default edge index over vertex-centric indexes
based on the costs it estimates, even if a vertex-centric index might
in fact be faster. Vertex-centric indexes are more likely to be chosen
for highly connected graphs.

You can also use use prefixed multi-dimensional indexes to combine graph
traversals with range queries:

```aql
FOR v, e, p in 0..3 INBOUND @start GRAPH @graphName
  OPTIONS { order: "bfs", uniqueVertices: "path" }
  FILTER p.edges[*].type ALL == "friend"
     AND p.edges[*].x ALL >= 5
     AND p.edges[*].y ALL <= 7
  RETURN p
```

## Persistent Index

The persistent index is a sorted index with logarithmic complexity for insert,
update, and remove operations.

You can create a persistent index on one or multiple document attributes.
It is a sorted index structure. It can be used to quickly find
documents with specific attribute values (point lookups / equality comparisons),
for range queries, and for returning documents from the index in sorted order,
but only if either all index attributes is provided in a query, or if a leftmost
prefix of the index attributes is specified.

For example, if a persistent index is created on attributes `value1` and `value2`, the
following filter conditions can use the index (note: the `<=` and `>=` operators are
intentionally omitted here for the sake of brevity):

```aql
FILTER doc.value1 == ...
FILTER doc.value1 < ...
FILTER doc.value1 > ...
FILTER doc.value1 > ... && doc.value1 < ...

FILTER doc.value1 == ... && doc.value2 == ...
FILTER doc.value1 == ... && doc.value2 > ...
FILTER doc.value1 == ... && doc.value2 > ... && doc.value2 < ...
```

In order to use a persistent index for sorting, the index attributes must be specified in
the `SORT` clause of the query in the same order as they appear in the index definition.
Persistent indexes are always created in ascending order, but they can be used to access
the indexed elements in both ascending or descending order. However, for a combined index
(an index on multiple attributes) this requires that the sort orders in a single query
as specified in the `SORT` clause must be either all ascending (optionally omitted
as ascending is the default) or all descending.

For example, if a persistent index is created on attributes `value1` and `value2`
(in this order), then the following sorts clauses can use the index for sorting:

- `SORT value1 ASC, value2 ASC` (and its equivalent `SORT value1, value2`)
- `SORT value1 DESC, value2 DESC`
- `SORT value1 ASC` (and its equivalent `SORT value1`)
- `SORT value1 DESC`

The following sort clauses cannot make use of the index order, and require an extra
sort step:

- `SORT value1 ASC, value2 DESC`
- `SORT value1 DESC, value2 ASC`
- `SORT value2` (and its equivalent `SORT value2 ASC`)
- `SORT value2 DESC` (because first indexed attribute `value1` is not used in sort clause)

Note: the latter two sort clauses cannot use the index because the sort clause does not
refer to a leftmost prefix of the index attributes.

Persistent indexes support [indexing array values](#indexing-array-values) if
the index attribute name is extended with a `[*]`.

Persistent indexes can optionally be declared unique, disallowing saving the
same value in the indexed attribute. They can be sparse or non-sparse.

The different types of persistent indexes have the following characteristics:

- **unique persistent index**: all documents in the collection must have different values for
  the attributes covered by the unique index. Trying to insert a document with the same
  key value as an already existing document will lead to a unique constraint
  violation.

  This type of index is not sparse. Documents that do not contain the index attributes or
  that have a value of `null` in the index attribute(s) will still be indexed.
  A key value of `null` may only occur once in the index, so this type of index cannot
  be used for optional attributes.

  The unique option can also be used to ensure that
  [no duplicate edges](#ensuring-uniqueness-of-relations-in-edge-collections) are
  created, by adding a combined index for the fields `_from` and `_to` to an edge collection.

- **unique, sparse persistent index**: all documents in the collection must have different
  values for the attributes covered by the unique index. Documents in which at least one
  of the index attributes is not set or has a value of `null` are not included in the
  index. This type of index can be used to ensure that there are no duplicate keys in
  the collection for documents that have the indexed attributes set. As the index will
  exclude documents for which the indexed attributes are `null` or not set, it can be
  used for optional attributes.

- **non-unique persistent index**: all documents in the collection will be indexed. This type
  of index is not sparse. Documents that do not contain the index attributes or that have
  a value of `null` in the index attribute(s) will still be indexed. Duplicate key values
  can occur and do not lead to unique constraint violations.

- **non-unique, sparse persistent index**: only those documents will be indexed that have all
  the indexed attributes set to a value other than `null`. It can be used for optional
  attributes.

## Inverted index

Inverted indexes store mappings from values (of document attributes) to their
locations in collections. You can add an arbitrary number of document attributes
to an inverted index. For each attribute, you can specify an Analyzer to process
the input with. This enables you tokenize strings for full-text search,
for example. You can also index multiple levels of nested objects in arrays.

The index can optionally be sorted to optimize away `SORT` operations if the
sort direction of the fields match. You can also store additional attributes in
the index to cover projections.

Inverted indexes are eventually consistent. They are updated near real-time when
documents are changed, but you may get stale values until the index catches up
with the changes.

To accelerate queries with inverted indexes, you need to specify index hints in
these queries. Inverted indexes are not utilized automatically, unlike with
other index types, even if they would be capable of accelerating the queries.

## TTL (time-to-live) Index

You can use the TTL index type for automatically removing expired documents
from a collection.

A TTL index is set up by setting an `expireAfter` value and by picking a single 
document attribute which contains the documents' reference point in time. Documents
are expired after `expireAfter` seconds after their reference time has been reached.
The document's reference point in time is specified as either a numeric timestamp
(Unix timestamp) or a date string in the format `YYYY-MM-DDTHH:MM:SS`, optionally
with milliseconds after a decimal point in the format `YYYY-MM-DDTHH:MM:SS.MMM`
and an optional timezone offset. All date strings without a timezone offset are
interpreted as UTC dates.

For example, if `expireAfter` is set to 600 seconds (10 minutes) and the index
attribute is "creationDate" and there is the following document:

```json
{ "creationDate" : 1550165973 }
```

This document will be indexed with a creation date time value of `1550165973`,
which translates to the human-readable date `2019-02-14T17:39:33.000Z`. The document
will expire 600 seconds afterwards, which is at timestamp `1550166573` (or
`2019-02-14T17:49:33.000Z` in the human-readable version).

The actual removal of expired documents will not necessarily happen immediately. 
Expired documents will eventually be removed by a background thread that is
periodically going through all TTL indexes. The frequency for invoking this
background thread can be configured using the `--ttl.frequency` startup option.

There is no guarantee when exactly the removal of expired documents will be carried
out, so queries may still find and return documents that have already expired. These
will eventually be removed when the background thread kicks in and has capacity to
remove the expired documents. It is guaranteed however that only documents which are
past their expiration time will actually be removed.

Please note that the numeric date time values for the index attribute has to be
specified **in seconds** since January 1st 1970 (Unix timestamp). To calculate the current
timestamp from JavaScript in this format, there is `Date.now() / 1000`; to calculate it
from an arbitrary Date instance, there is `Date.getTime() / 1000`. In AQL you can do
`DATE_NOW() / 1000` or divide an arbitrary Unix timestamp that is in milliseconds
by 1000 to convert it to seconds.

Alternatively, the index attribute values can be specified as a date string in format
`YYYY-MM-DDTHH:MM:SS`, optionally with milliseconds after a decimal point in the
format `YYYY-MM-DDTHH:MM:SS.MMM` and an optional timezone offset. All date strings
without a timezone offset will be interpreted as UTC dates.

The above example document using a date string attribute value would be

```json
{ "creationDate" : "2019-02-14T17:39:33.000Z" }
```

In case the index attribute does not contain a numeric value nor a proper date string,
the document will not be stored in the TTL index and thus will not become a candidate 
for expiration and removal. Providing either a non-numeric value or even no value for 
the index attribute is a supported way of keeping documents from being expired and removed.

TTL indexes are designed exactly for the purpose of removing expired documents from
a collection. It is *not recommended* to rely on TTL indexes for user-land AQL queries. 
This is because TTL indexes internally may store a transformed, always numerical version 
of the index attribute value even if it was originally passed in as a date string. As a
result TTL indexes will likely not be used for filtering and sort operations in user-land
AQL queries.

## Geo Index

Users can create additional geo indexes on one or multiple attributes in collections. 
A geo-spatial index can accelerate queries that filter and sort by the distance
between stored points and points provided in a query.

The geo index stores two-dimensional coordinate pairs. It can be created on either two 
separate document attributes (latitude and longitude) or a single array attribute that
contains both latitude and longitude. Latitude and longitude must be numeric values.

Furthermore, a geo index can also index standard
[GeoJSON objects](https://datatracker.ietf.org/doc/html/rfc7946).
GeoJSON uses the JSON syntax to describe geometric objects on the surface
of the Earth. It supports points, lines, and polygons.
See [Geo-Spatial Indexes](working-with-indexes/geo-spatial-indexes.md).

The geo index provides operations to find documents with locations nearest to a given 
comparison location, and to find documents with locations that are within a specifiable
radius around a comparison location.

The geo index is used via dedicated functions in AQL
and it is implicitly applied when a `SORT` or `FILTER` is used with
the `GEO_DISTANCE()` function, or if `FILTER` conditions with `GEO_CONTAINS()`
or `GEO_INTERSECTS()` are used. It will not be used for other types of queries
or conditions.

## Vector Index

Vector indexes let you index vector embeddings stored in documents. Such
vectors are arrays of numbers that represent the meaning and relationships of
data numerically. You can you quickly find a given number of semantically
similar documents by searching for close neighbors in a high-dimensional
vector space.

See [Vector Indexes](working-with-indexes/vector-indexes.md) for details.

## Fulltext Index

{{< warning >}}
The fulltext index type is deprecated from version 3.10 onwards.
It is recommended to use [ArangoSearch](../arangosearch/_index.md) for advanced full-text search capabilities.
{{< /warning >}}

A fulltext index can be used to find words, or prefixes of words inside documents. 
A fulltext index can be created on a single attribute only, and will index all words 
contained in documents that have a textual value in that attribute. Only words with a (specifiable) 
minimum length are indexed. Word tokenization is done using the word boundary analysis 
provided by libicu, which is taking into account the selected language provided at 
server start. Words are indexed in their lower-cased form. The index supports complete 
match queries (full words) and prefix queries, plus basic logical operations such as 
`and`, `or` and `not` for combining partial results.

The fulltext index is sparse, meaning it will only index documents for which the index
attribute is set and contains a string value. Additionally, only words with a configurable
minimum length will be included in the index.

The fulltext index is used via dedicated functions in AQL, but will
not be enabled for other types of queries or conditions.

## Indexes and non-ASCII texts

Before strings are inserted into an index, they are
[normalized by using ICU](http://www.unicode.org/reports/tr15/).

There are several characters in the Unicode space, that have a similar meaning.
In order to have all their variants in a result set when querying, the strings
are normalized for the index. This slightly changes the behavior of `FILTER`
statements with equality comparisons (`==`) when ran on non-indexed document
attributes.

While the index may still be useful by fetching a little more results than
you want to actually work with, you may want to have an additional
`FILTER MD5(doc.attr) == MD5(@comparisonstring)` to make sure that the result
only contains the actual values you need in the end.

## Indexing attributes and sub-attributes

Top-level as well as nested attributes can be indexed. For attributes at the top level,
the attribute names alone are required. To index a single field, pass an array with a
single element (string of the attribute key) to the `fields` parameter of the
[ensureIndex() method](working-with-indexes/_index.md#creating-an-index). To create a
combined index over multiple fields, simply add more members to the `fields` array:

```js
// { name: "Smith", age: 35 }
db.posts.ensureIndex({ type: "persistent", fields: [ "name" ] })
db.posts.ensureIndex({ type: "persistent", fields: [ "name", "age" ] })
```

To index sub-attributes, specify the attribute path using the dot notation:

```js
// { name: {last: "Smith", first: "John" } }
db.posts.ensureIndex({ type: "persistent", fields: [ "name.last" ] })
db.posts.ensureIndex({ type: "persistent", fields: [ "name.last", "name.first" ] })
```

## Indexing array values

If an index attribute contains an array, ArangoDB will store the entire array as the index value
by default. Accessing individual members of the array via the index is not possible this
way. 

To make an index insert the individual array members into the index instead of the entire array
value, a special array index needs to be created for the attribute. Array indexes can be set up 
like regular persistent indexes using the `collection.ensureIndex()` function. To make a 
persistent index an array index, the index attribute name needs to be extended with `[*]`
when creating the index and when filtering in an AQL query using the `IN` operator.

The following example creates an persistent array index on the `tags` attribute in a collection named
`posts`:

```js
db.posts.ensureIndex({ type: "persistent", fields: [ "tags[*]" ] });
db.posts.insert({ tags: [ "foobar", "baz", "quux" ] });
```

This array index can then be used for looking up individual `tags` values from AQL queries via 
the `IN` operator:

```aql
FOR doc IN posts
  FILTER 'foobar' IN doc.tags
  RETURN doc
```

It is possible to add the [array expansion operator](../../aql/operators.md#array-expansion)
`[*]`, but it is not mandatory. You may use it to indicate that an array index is used,
it is purely cosmetic however:

```aql
FOR doc IN posts
  FILTER 'foobar' IN doc.tags[*]
  RETURN doc
```

The following FILTER conditions will **not use** the array index:

```aql
FILTER doc.tags ANY == 'foobar'
FILTER doc.tags ANY IN 'foobar'
FILTER doc.tags IN 'foobar'
FILTER doc.tags == 'foobar'
FILTER 'foobar' == doc.tags
```

It is also possible to create an index on subattributes of array values. This makes sense
if the index attribute is an array of objects, e.g.

```js
db.posts.ensureIndex({ type: "persistent", fields: [ "tags[*].name" ] });
db.posts.insert({ tags: [ { name: "foobar" }, { name: "baz" }, { name: "quux" } ] });
```

The following query will then use the array index (this does require the
[array expansion operator](../../aql/operators.md#array-expansion)):

```aql
FOR doc IN posts
  FILTER 'foobar' IN doc.tags[*].name
  RETURN doc
```

If you store a document having the array which does contain elements not having
the sub-attributes this document will also be indexed with the value `null`, which
in ArangoDB is equal to attribute not existing.

ArangoDB supports creating array indexes with a single `[*]` operator per index 
attribute. For example, creating an index as follows is **not supported**:

```js
db.posts.ensureIndex({ type: "persistent", fields: [ "tags[*].name[*].value" ] });
```

Array values will automatically be de-duplicated before being inserted into an array index.
For example, if the following document is inserted into the collection, the duplicate array
value `bar` will be inserted only once:

```js
db.posts.insert({ tags: [ "foobar", "bar", "bar" ] });
```

This is done to avoid redundant storage of the same index value for the same document, which
would not provide any benefit.

If an array index is declared **unique**, the de-duplication of array values will happen before 
inserting the values into the index, so the above insert operation with two identical values
`bar` will not necessarily fail

It will always fail if the index already contains an instance of the `bar` value. However, if
the value `bar` is not already present in the index, then the de-duplication of the array values will
effectively lead to `bar` being inserted only once.

To turn off the deduplication of array values, it is possible to set the **deduplicate** attribute
on the array index to `false`. The default value for **deduplicate** is `true` however, so 
de-duplication will take place if not explicitly turned off.

```js
db.posts.ensureIndex({ type: "persistent", fields: [ "tags[*]" ], deduplicate: false });

// will fail now
db.posts.insert({ tags: [ "foobar", "bar", "bar" ] }); 
```

If an array index is declared and you store documents that do not have an array at the specified attribute
this document will not be inserted in the index. Hence the following objects will not be indexed:

```js
db.posts.ensureIndex({ type: "persistent", fields: [ "tags[*]" ] });
db.posts.insert({ something: "else" });
db.posts.insert({ tags: null });
db.posts.insert({ tags: "this is no array" });
db.posts.insert({ tags: { content: [1, 2, 3] } });
```

An array index is able to index explicit `null` values. When queried for `null`values, it 
will only return those documents having explicitly `null` stored in the array, it will not 
return any documents that do not have the array at all.

```js
db.posts.ensureIndex({ type: "persistent", fields: [ "tags[*]" ] });
db.posts.insert({tags: null}) // Will not be indexed
db.posts.insert({tags: []})  // Will not be indexed
db.posts.insert({tags: [null]}); // Will be indexed for null
db.posts.insert({tags: [null, 1, 2]}); // Will be indexed for null, 1 and 2
```

Declaring an array index as **sparse** does not have an effect on the array part of the index,
this in particular means that explicit `null` values are also indexed in the **sparse** version.
If an index is combined from an array and a normal attribute the sparsity will apply for the attribute e.g.:

```js
db.posts.ensureIndex({ type: "persistent", fields: [ "tags[*]", "name" ], sparse: true });
db.posts.insert({tags: null, name: "alice"}) // Will not be indexed
db.posts.insert({tags: [], name: "alice"}) // Will not be indexed
db.posts.insert({tags: [1, 2, 3]}) // Will not be indexed
db.posts.insert({tags: [1, 2, 3], name: null}) // Will not be indexed
db.posts.insert({tags: [1, 2, 3], name: "alice"})
// Will be indexed for [1, "alice"], [2, "alice"], [3, "alice"]
db.posts.insert({tags: [null], name: "bob"})
// Will be indexed for [null, "bob"] 
```

Please note that filtering using array indexes only works from within AQL queries and
only if the query filters on the indexed attribute using the `IN` operator. The other
comparison operators (`==`, `!=`, `>`, `>=`, `<`, `<=`, `ANY`, `ALL`, `NONE`)
cannot use array indexes currently.

## Ensuring uniqueness of relations in edge collections

You can create a combined index over the edge attributes `_from` and `_to`
with the unique option enabled to prevent duplicate relations from being created.

For example, a document collection `users` might contain vertices with the document
handles `user/A`, `user/B` and `user/C`. Relations between these documents can
be stored in an edge collection `knows`, for instance. You may want to make sure
that the vertex `user/A` is never linked to `user/B` by an edge more than once.
This can be achieved by adding a unique, non-sparse persistent index for the
fields `_from` and `_to`:

```js
db.knows.ensureIndex({ type: "persistent", fields: [ "_from", "_to" ], unique: true });
```

Creating an edge `{ _from: "user/A", _to: "user/B" }` in `knows` will be accepted,
but only once. Another attempt to store an edge with the relation **A** → **B** will
be rejected by the server with a *unique constraint violated* error. This includes
updates to the `_from` and `_to` fields.

Note that adding a relation **B** → **A** is still possible, so are **A** → **A**
and **B** → **B**, because they are all different relations in a directed graph.
Each one can only occur once however.

## Creating Indexes in Background

Creating new indexes is by default done under an exclusive collection lock. This means
that the collection (or the respective shards) are not available for write operations
as long as the index is being created. This "foreground" index creation can be undesirable,
if you have to perform it on a live system without a dedicated maintenance window.

Indexes can also be created in "background", not using an 
exclusive lock during the entire index creation. The collection remains basically available, 
so that other CRUD operations can run on the collection while the index is being created.
This can be achieved by setting the `inBackground` attribute when creating an index.

To create an index in the background in *arangosh* just specify `inBackground: true`, 
like in the following examples:

```js
// create the persistent indexes in the background
db.collection.ensureIndex({ type: "persistent", fields: [ "value" ], unique: false, inBackground: true });
db.collection.ensureIndex({ type: "persistent", fields: [ "email" ], unique: true, inBackground: true });

// also supported for geo and fulltext indexes
db.collection.ensureIndex({ type: "geo", fields: [ "location"], inBackground: true });
db.collection.ensureIndex({ type: "geo", fields: [ "latitude", "longitude"], inBackground: true });
db.collection.ensureIndex({ type: "fulltext", fields: [ "text" ], minLength: 4, inBackground: true })
```

### Behavior

Indexes that are still in the build process will not be visible via the ArangoDB APIs. 
Nevertheless it is not possible to create the same index twice via the `ensureIndex()` method
while an index is still begin created. AQL queries also will not use these indexes until
the index reports back as fully created. Note that the initial `ensureIndex()` call or HTTP 
request will still block until the index is completely ready. Existing single-threaded 
client programs can thus safely set the `inBackground` option to `true` and continue to 
work as before.

{{< info >}}
Should you be building an index in the background you cannot rename or drop the collection.
These operations will block until the index creation is finished. This is equally the case
with foreground indexing.
{{< /info >}}

After an interrupted index build (i.e. due to a server crash) the partially built index
will the removed. In the ArangoDB cluster the index might then be automatically recreated 
on affected shards.

### Performance

Background index creation might be slower than the "foreground" index creation and require 
more RAM. Under a write heavy load (specifically many remove, update or replace operations), 
the background index creation needs to keep a list of removed documents in RAM. This might 
become unsustainable if this list grows to tens of millions of entries.

Building an index is always a write heavy operation (internally), it is always a good idea to build indexes
during times with less load.

Non-unique indexes can be created with multiple
threads in parallel. The number of parallel index creation threads is currently 
set to 2, but future versions of ArangoDB may increase this value.
Parallel index creation is only triggered for collections with at least 120,000
documents.
