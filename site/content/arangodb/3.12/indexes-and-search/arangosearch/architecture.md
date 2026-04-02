---
title: Architecture overview of ArangoSearch
menuTitle: Architecture
description: >-
  A high-level description of how the ArangoSearch search engine works under the hood
weight: 85
---
ArangoSearch essentially consists of two components: a search engine and an
integration layer. The former is responsible for managing the index, querying,
and scoring. The latter exposes search capabilities to the end-user in a
convenient way.

## ArangoSearch index

The concept of an inverted index is the heart of ArangoSearch. The index structure
and index management approach are inspired by well-known search engine Lucene.

An inverted index consists of several independent segments and the index segment
itself is meant to be treated as a standalone index. Each segment contains the
following components:

- **Term dictionary**: Stores and provides fast access to all terms (and its
  metadata) ever seen in a segment.
- **Posting lists**: Store and provide fast access to information about
  documents, term positions, and payloads for each seen term.
- **Segment metadata**: Stores different segment-related properties.
- **Tombstones**: Contain documents that have been deleted but not yet purged
  from the storage.
- **Columnstore**: Stores and provides fast access to arbitrary information on
  a per-column basis.

The following picture gives you a basic understanding of how an ArangoSearch
index logically looks like:

![High-level diagram of the ArangoSearch index data structure]()

An ArangoSearch query typically iterates over all segments in the index, finds
documents satisfying the search criteria and returns them to the caller.
<!-- TODO: Any content to add about the integration layer? -->

## ArangoSearch integration layer

The integration layer tries to hide all complexity behind maintaining the index
and exposes all functionality via convenient ArangoDB APIs. <!-- TODO: HTTP API, AQL -->

### DML integration

ArangoDB's native multi-model approach makes a seamless integration of a
search engine challenging.

The following diagram gives you an idea of how data gets into an ArangoSearch index:

![Diagram of the ArangoSearch data flow]()

Once created, an `arangosearch` View may have arbitrary number of ArangoSearch
links between collections of any type and a View. A link is essentially a
unidirectional connection from an ArangoDB collection to an ArangoSearch View.
The ArangoSearch link created on a collection operates like an index with the
only difference that it does nothing but delegate all incoming requests to a
corresponding View. The ArangoSearch link contains information of how data is
coming from a collection should be indexed, in particular the following:

- Which fields have to be indexed (or all).
- Which analyzers have to be applied to a fields.
- How deep hierarchical JSON documents have to be processed.
- How lists/arrays have to be indexed in terms of individual position tracking.
- All these properties are very important since they affect the upcoming querying phase.

### Eventually read committed

In order to speed up indexing, the ArangoSearch View processes modification
requests coming from an ArangoSearch link in batches. From time to time, an
asynchronous job commits accumulated data, creating new index segments. Data is
visible right after the commit, so in terms of transaction isolation, an
ArangoSearch View is on the eventually read committed level.

There are two separate indexes per each View:

- in-memory index
- persistent index

All documents coming from the links first get into the in memory index and
eventually (in asynchronous fashion) appear to be in the latter. Having two
separate indexes is the crucial part for fast startup and recovery since
ArangoSearch Views don't need to reindex all data from linked collections.
Merging memory part into persistent store is also quite important since
ArangoSearch View doesn't want to consume all your RAM.

### Managing data consistency

An ArangoSearch View does not store any data except the "references" to documents,
which means that View always relies on data in the linked collections.
That actually obliges ArangoDB to maintain data consistency between data in
collections and Views so that in the event of a crash and the following recovery,
an ArangoSearch View appears to be in a consistent state.

In order to provide such guarantees, ArangoDB stores some information about the
View's current state in the Write-Ahead Log (WAL) and uses it later for recovery.
Since an ArangoSearch View eventually reads documents from linked collections
within a scope of transaction, it guarantees to be consistent with the data.

### Removals and consolidation

ArangoSearch View handles removals in a two steps fashion, pretty similar to
collections in ArangoDB. When a removal request arrives, an ArangoSearch View first
marks a document as deleted, which means that the particular document is filtered
out of query result. At this point, the document is still in the index but the data
itself is obsolete. As one can imagine, there will be a lot of such leftovers
eventually, causing slower queries and higher space consumption on disk and in
memory.

In order to avoid this, ArangoSearch has built-in support for index consolidation.
Index consolidation is the procedure of joining multiple index segments into a
bigger one and removing garbage documents. Merging also reduces the number of
segments to traverse, which speeds up queries. You can tune the consolidation
for your workload using different parameters, e.g. the frequency of cleanup and
merges based on segment size or number of deleted documents per segment.
