---
title: Architecture overview of ArangoSearch
menuTitle: Architecture
description: >-
  A high-level description of how the ArangoSearch search engine works under the
  hood, from the way documents reach the index to how search results are ranked
weight: 90
---
ArangoSearch essentially consists of two components: a search engine and an
integration layer. The former is responsible for managing the index, querying,
and scoring. The latter exposes search capabilities to the end-user in a
convenient way.

There are three ways of using the search engine, but they are all powered by
the same engine and they all maintain the same kind of index:

- [`arangosearch` Views](arangosearch-views-reference.md), which index the
  documents of the collections you link to them
- [Inverted indexes](../indexing/working-with-indexes/inverted-indexes.md),
  which you define on the collection level
- [`search-alias` Views](search-alias-views-reference.md), which combine
  collection-level inverted indexes so that you can search over multiple
  collections at once

Everything this page describes about the index structure, the data store, and
ranking applies to all three of them. Where they differ is how you configure
them and how the indexed data is grouped for querying.

## How documents get into the index

ArangoDB stores your data as JSON documents, grouped into collections. Whether
you use them as key/value pairs, as documents, or as the vertices and edges of a
graph, what reaches the search engine is always a JSON object, possibly with
nested objects and arrays.

A search index normally belongs to a single collection, which is all you need if
you want to search that one collection. This is what inverted indexes are for.
Views add a layer on top: a View groups multiple such indexes so that a single
query can search all of them at once and rank the results of all of them
together, for instance over the vertex and edge collections that make up a
graph.

{{< embed-svg "ArangoSearch-Data-Flow" "Both View types index documents the same way. What differs is where the settings live and how the indexes are grouped for querying." >}}

With `arangosearch` Views, the connection between a collection and a View is
called a **link**. A link is a unidirectional connection from an ArangoDB
collection to a View. It operates like an index on the collection but does
nothing except pass all incoming requests on to the search engine. A link
defines the following:

- Which fields have to be indexed (or all of them)
- Which Analyzers have to be applied to the fields
- How deep hierarchical JSON documents have to be processed
- How lists/arrays have to be indexed in terms of individual position tracking

All of these properties are important because they affect the querying phase
later on. A View can have an arbitrary number of links to collections of any
type, but only one link per collection. Settings that need to be the same
everywhere, like `primarySort` and `storedValues`, are defined on the View and
internally copied into every link.

A **field** of the index corresponds to a document attribute, but its content is
not necessarily the attribute value as you stored it. What gets indexed are the
tokens that the Analyzer produced from the value. Internally, a field is also
tied to the Analyzer and to the type of the value, so the same attribute
occupies more than one field in the index if you process it with two Analyzers,
or if it holds strings in some documents and numbers in others.

Inverted indexes work the same way but you define them on the collection level,
and every index carries its own settings. You can define multiple inverted
indexes for a collection as long as they index different fields.

You can use an inverted index directly in `FILTER` operations, without a View,
but unlike other index types it is never used automatically. You need to request
it with an index hint because a `FILTER` condition can match different documents
with and without such an index, for instance because a text attribute is matched
token by token, and because the index is only eventually consistent. See
[Utilizing inverted indexes in queries](../indexing/working-with-indexes/inverted-indexes.md#utilizing-inverted-indexes-in-queries).

A `search-alias` View is only a named list of inverted indexes. It stores no
data and no settings of its own, which is why the indexes you add to it need to
have matching `primarySort` and `storedValues` settings, as well as matching
Analyzers for fields that occur in more than one of the indexes. What such a
View adds is the query side: searching all of the listed indexes at once,
ranking the combined results, and search highlighting. None of this is available
for an inverted index that you use on its own in a `FILTER` operation.

Each link and each inverted index maintains its own index, independent of all
others. In cluster deployments, every shard of a collection has its own index.
A View is a logical grouping that lets queries read from all of these indexes
at once.

### Analysis

Analysis is the transformation of a field value in a document into a stream of
**tokens**, for instance the tokenization of a sentence into words. What a
token is depends on the application. The resulting tokens are what the search
engine indexes and what you later match your search terms against.

A text Analyzer for a given language splits a value into words, and the
built-in ones also reduce the words to their stem:

{{< embed-svg "ArangoSearch-Analyzer-Text-En" "The `text_en` Analyzer tokenizes English text and stems the words." >}}

Stemming is what lets a search for `databases` match a document that contains
`database`, because both are reduced to the same token `databas` at index time
and at search time. You can turn it off for Analyzers you create yourself, and
which rules apply depends on the language:

{{< embed-svg "ArangoSearch-Analyzer-Text-Zh" "The `text_zh` Analyzer applies the tokenization rules of Chinese to the same kind of input." >}}

Not every Analyzer splits values. The `identity` Analyzer treats the input as a
single token and passes it through unchanged, which is what you want for values
you intend to match in full:

{{< embed-svg "ArangoSearch-Analyzer-Identity" "The `identity` Analyzer emits the value as a single token." >}}

Analyzers only process **string** values. Numbers, booleans, and `null` are
indexed as they are, using an internal representation per type that keeps them
comparable, which is what makes range queries over numbers possible. The
Analyzer you configure for such an attribute has no effect on them. Objects and
arrays are not values to analyze either but structures that the indexing
traverses, so that the Analyzer is applied to the strings it finds inside of
them. The exception are Analyzers that explicitly accept objects or arrays, like
the [Geo Analyzers](../analyzers.md#geojson), which turn a GeoJSON object into
tokens that describe an area.

In an `arangosearch` View, a value of a different type than expected does not
raise an error. It is simply indexed as its own type, and a search expression
that compares the attribute to a string does not match it.

Inverted indexes are stricter, because you declare per field whether it holds
primitive values or arrays:

- If a field is declared without array expansion and with `searchField` disabled
  (the default), then storing an array or an object in that attribute makes the
  document write fail with an error, unless the Analyzer accepts arrays or
  objects like the Geo Analyzers do. Creating such an index for a collection
  that already holds these values fails for the same reason.
- If a field is declared with array expansion (`attr[*]`), then values that are
  not arrays are silently skipped and remain unindexed.
- If `searchField` is enabled, the index accepts every type like a View does.

Which Analyzer processes a field is part of the link or inverted index
definition. You can also call Analyzers directly in AQL with the `TOKENS()`
function, outside of any search context, which is helpful for debugging.

See [Analyzers](../analyzers.md) for the available Analyzer types and how to
create your own.

### Changing the configuration

How a change to the configuration is applied depends on what you change:

- The properties that tune the data store, like `commitIntervalMsec` and
  `consolidationPolicy`, are picked up by the maintenance tasks at runtime. The
  indexed data is not affected.
- `primarySort`, `primarySortCompression`, and `storedValues` are immutable.
  They determine how the data is laid out on disk and can only be set when you
  create a View or an inverted index.
- Changing what a link indexes, like its `fields` or `analyzers`, internally
  drops that link and creates a new one. The new link starts with an empty data
  store, so the collection has to be indexed from scratch. Only the links you
  actually changed are rebuilt, not the entire View.

The last point is worth keeping in mind for a View that is in use: while a
changed link is being rebuilt, queries already use the new, still incomplete
link, so a `SEARCH` operation can return fewer results than expected, or none
at all, until the rebuild has finished. This is not the same as the usual
eventual consistency, which is a matter of milliseconds, and it can take as long
as indexing the collection takes.

There is no option to exclude a link that is still being built from queries, but
you are told about it: as long as any link of a View is in this state, queries
over that View return a warning with the code `1240`
(`ERROR_ARANGO_INCOMPLETE_READ`), stating that the View building is in progress
and that results can be incomplete, see
[Getting Started with ArangoSearch](_index.md#getting-started-with-arangosearch).

Inverted indexes are not affected by this because index definitions are
immutable. You can only create and drop an index, never modify one, so an
existing index cannot become temporarily incomplete. To change what an inverted
index covers, create a second index with the new definition, and once it is
ready, add it to your `search-alias` View and remove the old one.

## The ArangoSearch index

The concept of an inverted index is the heart of ArangoSearch. The index
structure and index management approach are inspired by the well-known search
engine library Lucene. An index is a combination of two data structures:

- An **inverted index**, which maps every token to the documents it occurs in,
  designed to allow blazingly fast searches
- A **column store**, which is designed to provide fast access to arbitrary
  values by an internal document identifier. It holds the values you configure
  a View or inverted index to store, like the `primarySort` columns and
  `storedValues`, as well as internal columns such as the document keys.

An inverted index owes its name to the fact that it turns the relationship
between documents and their content around. Assume the following two documents:

```json
{ "text": "quick brown fox jumps over the lazy dog" }
{ "text": "quick brown dog leaps over the lazy fox in winter" }
```

Splitting the text into individual words, sorting them, and removing duplicates
results in a list of tokens, each pointing to the documents it occurs in:

| Token  | doc1 | doc2 |
|:-------|:-----|:-----|
| brown  |  x   |  x   |
| dog    |  x   |  x   |
| fox    |  x   |  x   |
| in     |      |  x   |
| jumps  |  x   |      |
| lazy   |  x   |  x   |
| leaps  |      |  x   |
| over   |  x   |  x   |
| quick  |  x   |  x   |
| the    |  x   |  x   |
| winter |      |  x   |

To find the documents that contain any of the words `fox` and `jumps`, the
engine only needs to look up these two tokens and return the documents listed
for them, instead of scanning through every document.

### Segments

An index consists of several independent **segments**, and each index segment
is meant to be treated as a standalone index. Each segment contains the
following components:

- **Term dictionary**: Stores and provides fast access to all terms (and their
  metadata) ever seen in a segment.
- **Posting lists**: Store and provide fast access to information about
  documents, term positions, and payloads for each seen term.
- **Segment metadata**: Stores different segment-related properties.
- **Tombstones**: Contain the index entries that have been deleted but not yet
  purged from the storage.
- **Column store**: Stores and provides fast access to arbitrary information on
  a per-column basis.

In addition, index metadata records which segments form the current, committed
state of the index.

A segment does not store your documents. What it stores are index entries that
reference documents: the tokens that the Analyzers produced, the values you
configured a View or an inverted index to store, and an internal identifier that
ties an entry back to the document in the collection. Returning a full document
as a search result means looking it up in the collection by that identifier.

{{< embed-svg "ArangoSearch-Index-Structure" "An index is made up of independent segments. Each one is a standalone index with its own term dictionary, posting lists, and column store." >}}

A query typically iterates over all segments of all indexes involved, finds the
documents satisfying the search criteria, and returns them to the caller.

### What each feature needs from the index

Most ArangoSearch features are not computed at query time alone. They rely on
information that has to be written into the segments when the documents are
indexed, which is why they need to be enabled in the View or index definition,
or through the [Analyzer features](../analyzers.md#analyzer-features), and
cannot be switched on retroactively:

| Feature | What it needs | Where it is stored |
|:--------|:--------------|:-------------------|
| Matching tokens | The tokens themselves | Term dictionary and posting lists |
| [Scoring](ranking.md) with `BM25()` and `TFIDF()` | How often a term occurs (`frequency`), and how long the field is (`norm`) | Posting lists, and a column of the column store for the normalization factor |
| [Phrase and proximity search](phrase-and-proximity-search.md) | The position of every token (`position`) | Posting lists |
| [Search highlighting](search-highlighting.md) | The offset of every token in the original value (`offset`) | Posting lists |
| [Primary sort order](performance.md#primary-sort-order) (`primarySort`) | The index entries laid out in the sort order | The order of the entries within a segment |
| [Stored values](performance.md#stored-values) (`storedValues`) | Copies of the attribute values | Column store |
| Returning documents | An identifier per index entry | Column store, as the primary key column |

The caching options do not change what is stored. They keep columns that are
otherwise memory-mapped in memory, within the budget of the
[`--arangosearch.columns-cache-limit` startup option](../../components/arangodb-server/options.md#--arangosearchcolumns-cache-limit).
Which column this affects depends on the option:
[`primarySortCache`](performance.md#primary-sort-order) for the primary sort
columns, [`primaryKeyCache`](performance.md#primary-key-caching) for the primary
key column, the [`cache` option of `storedValues`](performance.md#stored-values)
for stored values, and the `cache` option of a field or Analyzer for
[field normalization values and Geo Analyzer data](performance.md#field-normalization-value-caching-and-caching-of-geo-analyzer-auxiliary-data).

## The data store

Every link and every inverted index stores its index in its own **data store**
on disk, in a directory separate from the data of the collections that it
indexes.

### Writing and commits

Changes to linked collections are not written to the index one by one. Writing
a single document into an inverted index is comparatively expensive, because
every write would have to update the term dictionary and the posting lists of
all affected tokens and publish a new state of the index. Instead, the changes
are batched: documents that you add or remove are accumulated in memory, and an
asynchronous job periodically **commits** what has accumulated, creating new
index segments from it. Only after such a commit are the changes visible to
queries. In terms of transaction isolation, this makes Views and inverted
indexes *eventually read committed*.

The batching is independent of your transactions. A transaction does not get an
index segment of its own, and a commit is not tied to a transaction either. It
is the commit that turns whatever has accumulated in the meantime into segments.

How often a commit occurs is governed by the `commitIntervalMsec` property. It
controls the upper bound on the time until document additions and removals are
actually reflected by corresponding query expressions. Once a commit operation
is complete, all documents added and removed prior to the start of the commit
operation are reflected by queries invoked in subsequent ArangoDB transactions.
In-progress ArangoDB transactions still continue to return a repeatable-read
state.

This is the reason why search results can be slightly stale right after a write.
See [Dealing with eventual consistency](_index.md#dealing-with-eventual-consistency)
for what this means in practice.

Commits are executed by a pool of maintenance threads that is shared by all data
stores of a server, see the
[`--arangosearch.commit-threads` startup option](../../components/arangodb-server/options.md#--arangosearchcommit-threads).

### Write buffers

ArangoSearch performs operations in its index based on numerous writer objects
that are mapped to processed segments. The accumulated changes are held by these
writers until the next commit, or until a writer reaches its size limit, in
which case it is flushed to disk early. To control the memory that is used by
these writers (in terms of a "writers pool"), you can use the `writebufferIdle`,
`writebufferActive`, and `writebufferSizeMax` properties.

### Removals and consolidation

ArangoSearch handles removals in a two-step fashion, pretty similar to
collections in ArangoDB. When you remove a document from a collection, the
index entry that references it is not removed from its segment right away. It is
marked as deleted, recorded in the segment's tombstones, and filtered out of
query results, but it continues to occupy space until the segment is rewritten.
The same happens when you update a document, because the index handles an update
as the removal of the old entry and the insertion of a new one. As one can
imagine, there will be a lot of such leftovers eventually, causing slower
queries and higher space consumption on disk and in memory.

Similarly, committing few documents at a time creates a lot of small and sparse
segments over time.

In order to avoid these situations, ArangoSearch has built-in support for index
**consolidation**. Consolidation is the procedure of joining multiple index
segments into a bigger one and discarding the entries that are marked as deleted.
It selects one or more segments and copies all of their valid entries into a
single new segment, leaving the deleted ones behind. Merging also reduces the
number of segments to traverse, which speeds up queries, and it allows extra
file handles to be released once the old segments are no longer used.

How often consolidation occurs is governed by the `consolidationIntervalMsec`
property, and which segments are selected is governed by the
`consolidationPolicy` property. You can tune both for your workload, for
instance based on the number of segments and their sizes.

Consolidation runs independently of committing, in a separate pool of
maintenance threads, see the
[`--arangosearch.consolidation-threads` startup option](../../components/arangodb-server/options.md#--arangosearchconsolidation-threads).
If there is repeatedly nothing to do, the maintenance tasks of a data store back
off and are only scheduled again once there are new changes.

### Cleanup

With every commit or consolidation operation, a new state of the index is
created on disk. Old states/snapshots are released once there are no longer any
users remaining. However, the files of the released states/snapshots are left on
disk and are only removed by a **cleanup** operation.

How often cleanups occur is governed by the `cleanupIntervalStep` property.
A cleanup is not a task of its own. It runs at the end of a commit, after every
`cleanupIntervalStep` commits of the respective data store, which is why the
property counts commits instead of defining an interval in milliseconds.

### Managing data consistency

A View or inverted index relies on the data in the collections it indexes.
This obliges ArangoDB to maintain data consistency between the collections and
the indexes so that in the event of a crash and the following recovery, they
appear to be in a consistent state.

In order to provide such guarantees, every data store records how far it has
caught up with the Write-Ahead Log (WAL) at its last commit. After a restart,
only the changes after that point need to be replayed from the WAL, which is why
the data does not have to be indexed from scratch. If a data store cannot be
brought back into a consistent state, it is marked as out of sync. You can
configure whether queries that use such an index fail with an error or return
possibly incomplete results with the
[`--arangosearch.fail-queries-on-out-of-sync` startup option](../../components/arangodb-server/options.md#--arangosearchfail-queries-on-out-of-sync).

### Tuning the data store

The properties mentioned above are documented in detail here:

- For `arangosearch` Views, see the
  [View Properties](arangosearch-views-reference.md#view-properties)
- For inverted indexes, see the
  [inverted index HTTP API](../../develop/http-api/indexes/inverted.md)

`search-alias` Views have no such settings of their own. They are configured on
the inverted indexes that the View references.

## Searching with `SEARCH` and `FILTER`

A `SEARCH` operation is not a statement of its own but part of the `FOR`
operation that iterates over a View, and there can only be one `SEARCH`
expression per such loop. It is evaluated by the search engine, using the
indexes of the View, which is what makes it efficient.

A `FILTER` operation that follows a View iteration is post-processing instead.
It cannot use the View index and is applied to whatever the View returned.
You can combine the two, letting `SEARCH` narrow down the documents with the
help of the index and `FILTER` apply conditions that the index cannot evaluate.

A few consequences of this division are worth knowing:

- Only attributes that you index are visible to a `SEARCH` expression.
  Attributes that are not indexed are treated as non-existent, whereas a
  `FILTER` operation sees the full documents.
- The ArangoSearch-specific AQL functions, like `PHRASE()`, `NGRAM_MATCH()`,
  `BOOST()`, and `ANALYZER()`, are only allowed in a `SEARCH` expression, and so
  are the [scoring functions](../../aql/functions/arangosearch.md#scoring-functions)
  and [search highlighting](search-highlighting.md).
- The same expression can mean different things in the two contexts. For
  example, `doc.runtime IN 4..6` matches any value in the range including
  fractions like `5.5` in a `SEARCH` expression, but only the integers `4`, `5`,
  and `6` in a `FILTER` operation, see
  [Comparing to a Numeric Range](range-queries.md#comparing-to-a-numeric-range).

It is therefore recommended to express as much as possible in the `SEARCH`
operation. See the [`SEARCH` operation](../../aql/high-level-operations/search.md)
for the full details.

Inverted indexes are the exception to the rule that `FILTER` operations cannot
use an ArangoSearch index. If you point a `FILTER` operation at an inverted
index with an index hint, the conditions are evaluated by the search engine, and
they then behave much more like a `SEARCH` expression than like a regular
`FILTER` operation. A text attribute is matched token by token, string
comparisons do not take a locale into account unless the Analyzer does, and
array elements are indexed individually rather than as a whole. This is what
makes the index opt-in, see
[Utilizing inverted indexes in queries](../indexing/working-with-indexes/inverted-indexes.md#utilizing-inverted-indexes-in-queries).

## How search results are ranked

When you query a large amount of semi-structured or unstructured data, you often
only have a vague idea of what you are looking for. That means you are not only
interested in the documents that satisfy the search criteria, but particularly
in the most relevant ones. To achieve that, ArangoSearch combines two
information retrieval models:

- **Boolean retrieval** decides which documents match at all. This is what the
  [`SEARCH` operation](../../aql/high-level-operations/search.md) and the search
  expressions you write in it express.
- **Ranking retrieval** assigns every matched document a score, so that you can
  sort by relevance.

A naive way of scoring is to count how many of the searched terms a document
contains. In the example above, a search for `fox` and `jumps` matches both
documents, but the first document contains both words whereas the second only
contains one, so the first one can be considered more relevant.

For real-world use cases, ArangoSearch uses the **Vector Space Model** for
ranking. It postulates the following: in the space formed by the terms of the
query, the document vectors that are closer to the query vector are more
relevant.

{{< embed-svg "ArangoSearch-Query-Vector-Space" "A query with the terms `quick` and `brown` spans a space with one dimension per term. The query itself is a vector in that space." >}}

Assume the following three documents and a query that searches for the terms
`quick` and `brown`:

```json
{ "text": "quick dog" }
{ "text": "brown fox" }
{ "text": "quick brown fox" }
```

Every document becomes a vector in the same space, with one component per query
term:

{{< embed-svg "ArangoSearch-Document-Vectors" "The third document contains both query terms and its vector therefore points in the same direction as the query." >}}

The closeness of two vectors is expressed as the cosine of the angle between
them, called the **cosine similarity**. The smaller the angle, the more relevant
a document is for the query:

{{< embed-svg "ArangoSearch-Cosine-Similarity" "The first document encloses a smaller angle with the query than the second one and is thus considered more relevant. The lengths of the vectors do not matter for the angle." >}}

In the example, the third document is the most relevant one for the query
because it contains both of the searched terms.

Only the direction of a vector matters for the cosine, not its length. A longer
document is thus not more relevant merely because it is longer. The scoring
functions do not literally build these vectors and measure an angle, however.
They sum up a weight per query term, and how much the length of a field
influences the score is determined by a normalization factor that is stored in
the index if you enable the `norm`
[Analyzer feature](../analyzers.md#analyzer-features).

To compute such a score, the components of the vectors need to be weighted.
There are a number of probability and statistical weighting models, and
ArangoSearch supports the two most popular ones, Okapi BM25 and TF-IDF. Both
rely on two main components:

- **Term frequency** (TF): in the simplest case defined as the number of times
  a term occurs in a document
- **Inverse document frequency** (IDF): a measure of how much information a term
  provides, i.e. whether it is common or rare across all documents

The information that these models need, like how often a term occurs, is part of
the posting lists in the index segments. Which of it is available depends on the
[Analyzer features](../analyzers.md#analyzer-features) you enable for the
indexed fields. Scoring therefore needs to be prepared at index definition time,
and it cannot be added retroactively to an existing index.

See [Ranking View Query Results](ranking.md) for how to use the scoring
functions in queries and how to fine-tune the scores.
