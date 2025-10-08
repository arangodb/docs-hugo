---
title: Features and Improvements in ArangoDB 3.12
menuTitle: What's New in 3.12
weight: 5
description: >-
  Improved memory accounting, wildcard search, and dump performance,
  multi-dimensional indexes, external versioning, and transparent compression
---
The following list shows in detail which features have been added or improved in
ArangoDB 3.12. ArangoDB 3.12 also contains several bug fixes that are not listed
here.

## All Enterprise Edition features in Community Edition

<small>Introduced in: v3.12.5</small>

Up to version 3.12.4, the Community Edition of ArangoDB didn't include
certain query, performance, compliance, and security features. They used to
be exclusive to the Enterprise Edition.

From version 3.12.5 onward, the Community Edition includes all
Enterprise Edition features without time restrictions. You still need a
license to use version 3.12 or later for commercial purposes or for a dataset
size over 100 GiB.

The following features are now available in the Community Edition:

**Performance**

- [SmartGraphs](../../graphs/smartgraphs/_index.md)
- [EnterpriseGraphs](../../graphs/enterprisegraphs/_index.md)
- [SmartGraphs using SatelliteCollections](../../graphs/smartgraphs/_index.md)
- [SatelliteGraphs](../../graphs/satellitegraphs/_index.md)
- [SatelliteCollections](../../develop/satellitecollections.md)
- [SmartJoins](../../develop/smartjoins.md)
- [OneShard](../../deploy/oneshard.md)
- [Traversal](../../release-notes/version-3.7/whats-new-in-3-7.md#traversal-parallelization-enterprise-edition)
  [Parallelization](../../release-notes/version-3.10/whats-new-in-3-10.md#parallelism-for-sharded-graphs-enterprise-edition)
- [Traversal Projections](../../release-notes/version-3.10/whats-new-in-3-10.md#traversal-projections-enterprise-edition)
- [Parallel index creation](../../release-notes/version-3.10/whats-new-in-3-10.md#parallel-index-creation-enterprise-edition)
- [`minhash` Analyzer](../../index-and-search/analyzers.md#minhash)
- [`geo_s2` Analyzer](../../index-and-search/analyzers.md#geo_s2)
- [ArangoSearch column cache](../../release-notes/version-3.10/whats-new-in-3-10.md#arangosearch-column-cache-enterprise-edition)
- [ArangoSearch WAND optimization](../../index-and-search/arangosearch/performance.md#wand-optimization)
- [Read from followers in clusters](../../develop/http-api/documents.md#read-from-followers)

**Querying**

- [Search highlighting](../../index-and-search/arangosearch/search-highlighting.md)
- [Nested search](../../index-and-search/arangosearch/nested-search.md)
- [`classification`](../../index-and-search/analyzers.md#classification) and [`nearest_neighbors` Analyzers](../../index-and-search/analyzers.md#nearest_neighbors) (experimental)
- [Skip inaccessible collections](../../aql/how-to-invoke-aql/with-arangosh.md#skipinaccessiblecollections)

**Security**

- [Auditing](../../operations/security/audit-logging.md)
- [Encryption at Rest](../../operations/security/encryption-at-rest.md)
- [Encrypted Backups](../../components/tools/arangodump/examples.md#encryption)
- [Hot Backups](../../operations/backup-and-restore.md#hot-backups)
- [Enhanced Data Masking](../../components/tools/arangodump/maskings.md#masking-functions)
- Key rotation for [JWT secrets](../../develop/http-api/authentication.md#hot-reload-jwt-secrets)
  and [on-disk encryption](../../develop/http-api/security.md#encryption-at-rest)
- [Server Name Indication (SNI)](../../components/arangodb-server/options.md#--sslserver-name-indication)

## ArangoSearch

### WAND optimization (Enterprise Edition)

For `arangosearch` Views and inverted indexes (and by extension `search-alias`
Views), you can define a list of sort expressions that you want to optimize.
This is also known as _WAND optimization_.

If you query a View with the `SEARCH` operation in combination with a
`SORT` and `LIMIT` operation, search results can be retrieved faster if the
`SORT` expression matches one of the optimized expressions.

Only sorting by highest rank is supported, that is, sorting by the result
of a scoring function in descending order (`DESC`).

See [Optimizing View and inverted index query performance](../../index-and-search/arangosearch/performance.md#wand-optimization)
for examples.

This feature is only available in the Enterprise Edition up to v3.12.4 and
included in all Editions from v3.12.5 onward.

### `SEARCH` parallelization

In search queries against Views, you can set the new `parallelism` option for
`SEARCH` operations to optionally process index segments in parallel using
multiple threads. This can speed up search queries.

The default value for the `parallelism` option is defined by the new
`--arangosearch.default-parallelism` startup option that defaults to `1`.

The new `--arangosearch.execution-threads-limit` startup option controls how
many threads can be used in total for search queries. The new
`arangodb_search_execution_threads_demand` metric reports the number of threads
that queries request. If it is below the configured thread limit, it coincides
with the number of active threads. If it exceeds the limit, some queries cannot
currently get the threads as requested and may have to use a single thread until
more become available.

See [`SEARCH` operation in AQL](../../aql/high-level-operations/search.md#parallelism)
for details.

## Analyzers

### `wildcard` Analyzer

You can use the new `wildcard` Analyzer in combination with an inverted index or
View to accelerate wildcard searches, especially if you want to find non-prefix
partial matches in long strings.

The Analyzer can apply another Analyzer of your choice before creating _n_-grams
that are then used in `LIKE` searches with `_` and `%` wildcards.

See [Transforming data with Analyzers](../../index-and-search/analyzers.md#wildcard)
for details.

### `multi_delimiter` Analyzer

The new `multi_delimiter` Analyzer type accepts an array of strings to define
multiple delimiters to split the input at. Each string is considered as one
delimiter that can be one or multiple characters long.

Unlike with the `delimiter` Analyzer, the `multi_delimiter` Analyzer does not
support quoting fields.

If you want to split text using multiple delimiters and don't require CSV-like
quoting, use the `multi_delimiter` Analyzer instead of chaining multiple
`delimiter` Analyzers in a `pipeline` Analyzer.

```js
var analyzers = require("@arangodb/analyzers");
var a = analyzers.save("delimiter_multiple", "multi_delimiter", {
  delimiters: [",", ";", "||"]
}, []);
db._query(`RETURN TOKENS("differently,delimited;words||one|token", "delimiter_multiple")`).toArray();
// [ ["differently", "delimited", "words", "one|token"] ]
```

See [Analyzers](../../index-and-search/analyzers.md#multi_delimiter) for details.

## Improved memory accounting and usage

Version 3.12 features multiple improvements to the observability of ArangoDB
deployments. Memory usage is more accurately tracked and additional metrics have
been added for monitoring the memory consumption.

AQL queries may now report a higher memory usage and thus run into memory limits
sooner, see [Higher reported memory usage for AQL queries](incompatible-changes-in-3-12.md#higher-reported-memory-usage-for-aql-queries).

The RocksDB block cache metric `rocksdb_block_cache_usage` now also includes the
memory used for table building, table reading, file metadata, flushing and
compactions by default.

Furthermore, the memory usage of some subsystems has been optimized. When
dropping a database, all contained collections are now marked as dropped
immediately. Ongoing operations on these collections can be stopped earlier, and
memory for the underlying collections and indexes can be reclaimed sooner.
Memory used for index selectively estimates is now also released early.
ArangoSearch has a smaller memory footprint for removal operations now.

The following new metrics have been added for memory observability:

| Label | Description |
|:------|:------------|
| `arangodb_agency_node_memory_usage` | Memory used by Agency store/cache. |
| `arangodb_aql_cursors_memory_usage` | Total memory usage of active AQL query result cursors.  |
| `arangodb_index_estimates_memory_usage` | Total memory usage of all index selectivity estimates. |
| `arangodb_internal_cluster_info_memory_usage` | Amount of memory spent in ClusterInfo. |
| `arangodb_requests_memory_usage` | Memory consumed by incoming, queued, and currently processed requests. |
| `arangodb_revision_tree_buffered_memory_usage` | Total memory usage of buffered updates for all revision trees. |
| `arangodb_scheduler_queue_memory_usage` | Number of bytes allocated for tasks in the scheduler queue. |
| `arangodb_scheduler_stack_memory_usage` | Approximate stack memory usage of worker threads. |
| `arangodb_search_consolidations_memory_usage` | Amount of memory in bytes that is used for consolidating an ArangoSearch index. |
| `arangodb_search_mapped_memory` | Amount of memory in bytes that is mapped for an ArangoSearch index. |
| `arangodb_search_readers_memory_usage` | Amount of memory in bytes that is used for reading from an ArangoSearch index. |
| `arangodb_search_writers_memory_usage` | Amount of memory in bytes that is used for writing to an ArangoSearch index. |
| `arangodb_transactions_internal_memory_usage` | Total memory usage of internal transactions. |
| `arangodb_transactions_rest_memory_usage` | Total memory usage of user transactions (excluding top-level AQL queries). |

## Web interface

### Shard rebalancing

The feature for rebalancing shards in cluster deployments has been moved from
the **Rebalance Shards** tab in the **Nodes** section to the **Distribution**
tab in the **Cluster** section of the web interface.

The updated interface now offers the following options:
- **Move Leaders**
- **Move Followers**
- **Include System Collections**

### Unified list view

ArangoDB 3.12 brings a significant enhancement to the display of collections,
Views, graphs, users, services, and databases in the web interface.
The previous tile format has been replaced with a user-friendly tabular
layout, providing a consistent and intuitive experience that is visually
aligned across all components. The existing tabular views have also been
reworked to ensure a seamless transition.

The new tabular format includes the following features:
- **Dynamic filters on columns**: Each column now has a dynamic filter box,
  allowing you to efficiently search and filter based on keywords. This makes
  it easy to locate specific items within the list.
- **Dynamic sorting on columns**: Sort elements easily based on column data
  such as name, date, or size. This functionality provides a flexible way to
  organize and view your data.

### Options & optimizer rules management in the Query Editor

You can now specify extra options for your queries via the query editor.
You can find all available options in the new **Options** tab in the
right-hand pane of the editor view, positioned alongside the **Bind Variables**
tab.

In the new **Options** tab, you also have access to the
[optimizer rules](../../aql/execution-and-performance/query-optimization.md#optimizer-rules).
This section allows you to selectively disable multiple optimizer rules, giving
you more control over query optimization according to your specific requirements.

### Swagger UI

The interactive tool for exploring HTTP APIs has been updated to version 5.4.1.
You can find it in the web interface in the **Rest API** tab of the **Support**
section, as well as in the **API** tab of Foxx services and Foxx routes that use
`module.context.createDocumentationRouter()`.

The new version adds support for OpenAPI 3.x specifications in addition to
Swagger 2.x compatibility.

## External versioning support

Document operations that update or replace documents now support a `versionAttribute` option.
If set, the attribute with the name specified by the option is looked up in the
stored document and the attribute value is compared numerically to the value of
the versioning attribute in the supplied document that is supposed to update/replace it.
The document is only changed if the new number is higher.

This simple versioning can help to avoid overwriting existing data with older
versions in case data is transferred from an external system into ArangoDB
and the copies are currently not in sync.

This new feature is supported in AQL, the JavaScript API, and the HTTP API for
the respective operations to update and replace documents, including the insert
operations when used to update/replace a document with `overwriteMode: "update"`
or `overwriteMode: "replace"`.

**Examples:**

Insert a new document normally using _arangosh_:

```js
db.collection.insert({ _key: "123", externalVersion: 1 });
```

Update the document if the versioning attribute is higher in the new document,
which is true in this case:

```js
db.collection.update("123",
  { externalVersion: 5, anotherAttribute: true },
  { versionAttribute: "externalVersion" });
```

Updating the document is skipped if the versioning attribute is lower or equal
in the supplied document compared to what is currently stored in ArangoDB:

```js
db.collection.update("123",
  { externalVersion: 4, anotherAttribute: false },
  { versionAttribute: "externalVersion" });
```

You can also make use of the `versionAttribute` option in an insert-update
operation for the update case, including in AQL:

```js
db.collection.insert({ _key: "123", externalVersion: 6, value: "foo" },
  { overwriteMode: "update", versionAttribute: "externalVersion" });

db._query(`UPDATE { _key: "123", externalVersion: 7, value: "bar" } IN collection 
  OPTIONS { versionAttribute: "externalVersion"}`);
```

External versioning is opt-in and no version checking is performed for
operations for which the `versionAttribute` option isn't set. Document removal
operations do not support external versioning. Removal operations are always
carried out normally.

Note that version checking is performed only if both the existing version of
the document in the database and the new document version contain the version
attribute with numeric values of `0` or greater. If neither the existing document
in the database nor the new document contains the version attribute, or if the
version attribute in any of the two is not a number inside the valid range, the
update/replace operations behave as if no version checking was requested.
This may overwrite the versioning attribute in the database.

Also see:
- The AQL [INSERT](../../aql/high-level-operations/insert.md#versionattribute),
  [UPDATE](../../aql/high-level-operations/update.md#versionattribute) and
  [REPLACE](../../aql/high-level-operations/update.md#versionattribute) operations
- The `insert()`, `update()`, `replace()` methods of the
  [_collection_ object](../../develop/javascript-api/@arangodb/collection-object.md#collectioninsertdata--options)
  in the JavaScript API
- The endpoints to create, update, and replace a single or multiple documents
  in the [HTTP API](../../develop/javascript-api/@arangodb/collection-object.md#collectioninsertdata--options)

## AQL

### Improved joins

The AQL optimizer now automatically recognizes whether a better strategy for
joining collections can be used, using the new `join-index-nodes` optimizer rule.

If two or more collections are joined using nested `FOR` loops and the
attributes you join on are indexed by primary indexes or persistent indexes,
then a merge join can be performed because they are sorted.

Note that returning document attributes from the outer loop is limited to
attributes covered by the index, or the improved join strategy cannot be used.

The following example query shows an inner join between orders and users on
user ID. Each document in the `orders` collection references a `user`, and the
`users` collection stores the user ID in the `_key` attribute. The query returns
the `total` attribute of every order along with the user information:

```aql
FOR o IN orders
  FOR u IN users
    FILTER o.user == u._key
    RETURN { orderTotal: o.total, user: u }
```

The `_key` attribute is covered by the primary index of the `users` collection.
If the `orders` collection has a persistent index defined over the `user`
attribute and additionally includes the `total` attribute in
[`storedValues`](../../index-and-search/indexing/working-with-indexes/persistent-indexes.md#storing-additional-values-in-indexes),
then the query is eligible for a merge join.

```aql
Execution plan:
 Id   NodeType          Par     Est.   Comment
  1   SingletonNode                1   * ROOT
 10   JoinNode            ✓   500000     - JOIN
 10   JoinNode                500000       - FOR o IN orders   LET #8 = o.`total`   /* index scan (projections: `total`) */
 10   JoinNode                     1       - FOR u IN users   /* index scan + document lookup */
  6   CalculationNode     ✓   500000     - LET #4 = { "orderTotal" : #8, "user" : u }   /* simple expression */   /* collections used: u : users */
  7   ReturnNode              500000     - RETURN #4

Indexes used:
 By   Name                      Type         Collection   Unique   Sparse   Cache   Selectivity   Fields       Stored values   Ranges
 10   idx_1784521139132825600   persistent   orders       false    false    false      100.00 %   [ `user` ]   [ `total` ]     *
 10   primary                   primary      users        true     false    false      100.00 %   [ `_key` ]   [  ]            (o.`user` == u.`_key`)
```

### Filter matching syntax for `UPSERT` operations

Version 3.12 introduces an alternative syntax for
[`UPSERT` operations](../../aql/high-level-operations/upsert.md) that allows
you to use more flexible filter conditions to look up documents. Previously,
the expression used to look up a document had to be an object literal, and this
is now called the "exact-value matching" syntax.

The new "filter matching" syntax lets you use a `FILTER` statement for the
`UPSERT` operation. The filter condition for the lookup can make use of the
`CURRENT` pseudo-variable to access the lookup document.

{{< tabs "upsert-syntax" >}}

{{< tab "Filter matching" >}}
```aql
UPSERT FILTER CURRENT.name == 'superuser'
INSERT { name: 'superuser', logins: 1, dateCreated: DATE_NOW() }
UPDATE { logins: OLD.logins + 1 } IN users
```
{{< /tab >}}

{{< tab "Exact-value matching" >}}
```aql
UPSERT { name: 'superuser' }
INSERT { name: 'superuser', logins: 1, dateCreated: DATE_NOW() }
UPDATE { logins: OLD.logins + 1 } IN users
```
{{< /tab >}}

{{< /tabs >}}

The `FILTER` expression can contain operators such as `AND` and `OR` to create
complex filter conditions, and you can apply more filters on the `CURRENT`
pseudo-variable than just equality matches.

```aql
UPSERT FILTER CURRENT.age < 30 AND (STARTS_WITH(CURRENT.name, "Jo") OR CURRENT.gender IN ["f", "x"])
INSERT { name: 'Jordan', age: 29, logins: 1, dateCreated: DATE_NOW() }
UPDATE { logins: OLD.logins + 1 } IN users
```

Read more about [`UPSERT` operations](../../aql/high-level-operations/upsert.md) in AQL.

### `readOwnWrites` option for `UPSERT` operations

A `readOwnWrites` option has been added for `UPSERT` operations. The default
value is `true` and the behavior is identical to previous versions of ArangoDB that
do not have this option. When enabled, an `UPSERT` operation processes its
inputs one by one. This way, the operation can observe its own writes and can
handle modifying the same target document multiple times in the same query.

When the option is set to `false`, an `UPSERT` operation processes its inputs
in batches. Normally, a batch has 1000 inputs, which can lead to a faster execution.
However, when using batches, the `UPSERT` operation cannot observe its own writes.
Therefore, you should only set the `readOwnWrites` option to `false` if you can
guarantee that the input of the `UPSERT` leads to disjoint documents being
inserted, updated, or replaced.

### Parallel execution within an AQL query

The new `async-prefetch` optimizer rule allows certain operations of a query to
asynchronously prefetch the next batch of data while processing the current batch,
allowing parts of the query to run in parallel. This can lead to performance
improvements if there is still reserve (scheduler) capacity.

The new `Par` column in a query explain output shows which nodes of a query are
eligible for asynchronous prefetching. Write queries, graph execution nodes,
nodes inside subqueries, `LIMIT` nodes and their dependencies above, as well as
all query parts that include a `RemoteNode` are not eligible.

```aql
Execution plan:
 Id   NodeType                  Par   Est.   Comment
  1   SingletonNode                      1   * ROOT
  2   EnumerateCollectionNode     ✓     18     - FOR doc IN places   /* full collection scan  */   FILTER (doc.`label` IN [ "Glasgow", "Aberdeen" ])   /* early pruning */
  5   CalculationNode             ✓     18       - LET #2 = doc.`label`   /* attribute expression */   /* collections used: doc : places */
  6   SortNode                    ✓     18       - SORT #2 ASC   /* sorting strategy: standard */
  7   ReturnNode                        18       - RETURN doc
```

The profiling output for queries includes a new `Par` column as well, but it
shows the number of successful parallel asynchronous prefetch calls.

To not overwhelm the server, async prefetching is restricted and the limits are adjustable.
See [Configurable async prefetch limits](#configurable-async-prefetch-limits).

### Added AQL functions

The new `PARSE_COLLECTION()` and `PARSE_KEY()` functions let you extract the
collection name respectively the document key from a document identifier with
less overhead.

See [Document and object functions in AQL](../../aql/functions/document-object.md#parse_collection).

The new `REPEAT()` function repeats the input value a given number of times,
optionally with a separator between repetitions, and returns the resulting string.
The new `TO_CHAR()` functions lets you specify a numeric Unicode codepoint and
returns the corresponding character as a string.

See [String functions in AQL](../../aql/functions/string.md#repeat).

A numeric function `RANDOM()` has been added as an alias for the existing `RAND()`.

---

<small>Introduced in: v3.12.1</small>

The new `ENTRIES()` functions returns the top-level attributes of an object in
pairs of attribute keys and values.

See [Document and object functions in AQL](../../aql/functions/document-object.md#entries).

### Timezone parameter for date functions

The following AQL date functions now accept an optional timezone argument to
perform date and time calculations in certain timezones:

- `DATE_DAYOFWEEK(date, timezone)`
- `DATE_YEAR(date, timezone)`
- `DATE_MONTH(date, timezone)`
- `DATE_DAY(date, timezone)`
- `DATE_HOUR(date, timezone)`
- `DATE_MINUTE(date, timezone)`
- `DATE_DAYOFYEAR(date, timezone)`
- `DATE_ISOWEEK(date, timezone)`
- `DATE_ISOWEEKYEAR(date, timezone)`
- `DATE_LEAPYEAR(date, timezone)`
- `DATE_QUARTER(date, timezone)`
- `DATE_DAYS_IN_MONTH(date, timezone)`
- `DATE_TRUNC(date, unit, timezone)`
- `DATE_ROUND(date, amount, unit, timezone)`
- `DATE_FORMAT(date, format, timezone)`
- `DATE_ADD(date, amount, unit, timezone)`
- `DATE_SUBTRACT(date, amount, unit, timezone)`

The following two functions accept up to two timezone arguments. If you only
specify the first, then both input dates are assumed to be in this one timezone.
If you specify two timezones, then the first date is assumed to be in the first
timezone, and the second date in the second timezone:

- `DATE_DIFF(date1, date2, unit, asFloat, timezone1, timezone2)` (`asFloat` can be left out)
- `DATE_COMPARE(date1, date2, unitRangeStart, unitRangeEnd, timezone1, timezone2)`

See [Date functions in AQL](../../aql/functions/date.md#date_dayofweek)

### Improved `move-filters-into-enumerate` optimizer rule

The `move-filters-into-enumerate` optimizer rule can now also move filters into
`EnumerateListNodes` for early pruning. This can significantly improve the
performance of queries that do a lot of filtering on longer lists of
non-collection data.

### Improved late document materialization

When `FILTER` operations can be covered by `primary`, `edge`, or `persistent`
indexes, ArangoDB utilizes the index information to only request documents from
the storage engine that fulfill the criteria. This late document materialization
has been improved to load documents in batches for efficiency. It now also
supports projections to fetch subsets of the documents if only a few attributes
are accessed in an AQL query.

For example, a query like below can use late materialization if there is a
`persistent` index over the `x` attribute:

```aql
FOR doc IN coll
  FILTER doc.x > 5
  RETURN [doc.y, doc.z, doc.a]
```

If the `y`, `z`, and `a` attributes are not covered by the index (e.g. `storedValues`),
then they need to be fetched from the storage engine. This no longer requires to
load the full documents, as indicated by the `/* (projections: … ) /*` comment
on the `MaterializeNode` due to an improved `reduce-extraction-to-projection`
optimizer rule. The loading is performed in batches due to the new
`batch-materialize-documents` optimization.

```aql
Execution plan:
 Id   NodeType          Par   Est.   Comment
  1   SingletonNode              1   * ROOT
  7   IndexNode           ✓   1000     - FOR doc IN coll   /* persistent index scan, index scan + document lookup */    /* with late materialization */
  8   MaterializeNode         1000       - MATERIALIZE doc /* (projections: `a`, `y`, `z`) */
  5   CalculationNode     ✓   1000       - LET #2 = [ doc.`y`, doc.`z`, doc.`a` ]   /* simple expression */   /* collections used: doc : coll */
  6   ReturnNode              1000       - RETURN #2

Indexes used:
 By   Name                      Type         Collection   Unique   Sparse   Cache   Selectivity   Fields    Stored values   Ranges
  7   idx_1788354556957032448   persistent   coll         false    false    false      100.00 %   [ `x` ]   [ `b` ]         (doc.`x` > 5)

Optimization rules applied:
 Id   Rule Name                                 Id   Rule Name                                 Id   Rule Name                        
  1   move-calculations-up                       5   use-indexes                                9   batch-materialize-documents      
  2   move-filters-up                            6   remove-filter-covered-by-index            10   async-prefetch                   
  3   move-calculations-up-2                     7   remove-unnecessary-calculations-2
  4   move-filters-up-2                          8   reduce-extraction-to-projection  
```

The number of document lookups caused by late materialization is now reported
under `extra.stats.documentLookups` by the Cursor HTTP API and shown in a column
of the query profile output:

```aql
Query Statistics:
 Writes Exec      Writes Ign      Doc. Lookups      Scan Full      Scan Index      Cache Hits/Misses      Filtered      Peak Mem [b]      Exec Time [s]
           0               0               290              0            3708                  0 / 0          3418             32768            0.01247
```

---

<small>Introduced in: v3.12.1</small>

The late materialization has been further improved via two new optimizer rules:
- `push-down-late-materialization`
- `materialize-into-separate-variable`

Loading documents is deferred in more cases, namely when attributes accessed in
`FILTER` and `SORT` operations are covered by an index.

For example, if you have a collection `coll` with a `persistent` index over the
attribute `x` and additionally the attribute `b` in `storedValues`, then the
materialization would previously occur before the `SORT` operation of the
following query:

```aql
FOR doc IN coll
  FILTER doc.x > 5
  SORT doc.b
  RETURN doc
```

```aql
Execution plan:
 Id   NodeType          Par   Est.   Comment
  1   SingletonNode              1   * ROOT
  8   IndexNode           ✓    120     - FOR doc IN coll   /* persistent index scan, scan only */    /* with late materialization */
  9   MaterializeNode          120       - MATERIALIZE doc INTO #4
  5   CalculationNode     ✓    120       - LET #2 = #4.`b`   /* attribute expression */
  6   SortNode            ✓    120       - SORT #2 ASC   /* sorting strategy: standard */
  7   ReturnNode               120       - RETURN #4

Indexes used:
 By   Name                      Type         Collection   Unique   Sparse   Cache   Selectivity   Fields    Stored values   Ranges
  8   idx_1799108758565027840   persistent   coll         false    false    false       83.33 %   [ `x` ]   [ `b` ]         (doc.`x` > 5)
```

The `push-down-late-materialization` rule moves the materialization down in the
execution plan, below the `SORT` operation:

```aql
Execution plan:
 Id   NodeType          Par   Est.   Comment
  1   SingletonNode              1   * ROOT
  8   IndexNode           ✓    120     - FOR doc IN coll   /* persistent index scan, index only (projections: `b`) */    LET #5 = doc.`b`   /* with late materialization */
  6   SortNode            ✓    120       - SORT #5 ASC   /* sorting strategy: standard */
  9   MaterializeNode          120       - MATERIALIZE doc INTO #4
  7   ReturnNode               120       - RETURN #4

Indexes used:
 By   Name                      Type         Collection   Unique   Sparse   Cache   Selectivity   Fields    Stored values   Ranges
  8   idx_1799108758565027840   persistent   coll         false    false    false       83.33 %   [ `x` ]   [ `b` ]         (doc.`x` > 5)
```

The rule can also push the materialization past `FOR` loops in case they are
optimized to a merge join (`JoinNode`, see [Improved joins](#improved-joins)).

The `materialize-into-separate-variable` rule optimizes how projections of
materializations are managed. Using separate internal variables for projected
attributes avoids the creation of temporary objects and having to look up the
attributes by key in these objects, which is faster. Example:

```aql
FOR doc IN coll
  FILTER doc.x > 5
  RETURN [doc.a, doc.b]
```

In previous versions, the execution plan looks like this:

```aql
Execution plan:
 Id   NodeType          Est.   Comment
  1   SingletonNode        1   * ROOT
  7   IndexNode          100     - FOR doc IN coll   /* persistent index scan, index scan + document lookup (projections: `a`, `b`) */    
  5   CalculationNode    100       - LET #3 = [ doc.`a`, doc.`b` ]   /* simple expression */   /* collections used: doc : coll */
  6   ReturnNode         100       - RETURN #3
```

While not directly visible, the extracted document attributes `a` and `b` are
internally stored in a temporary object with only these two attributes.
The attributes need to be looked up in the object for constructing the result.

From v3.12.1 onward, the execution plan indicates the use of separate internal
variables and that no attribute access is needed to construct the result:

```aql
Execution plan:
 Id   NodeType          Par   Est.   Comment
  1   SingletonNode              1   * ROOT
  7   IndexNode           ✓    100     - FOR doc IN coll   /* persistent index scan, scan only */    /* with late materialization */
  8   MaterializeNode          100       - MATERIALIZE doc INTO #4 /* (projections: `a`, `b`) */   LET #5 = #4.`a`, #6 = #4.`b`
  5   CalculationNode     ✓    100       - LET #2 = [ #5, #6 ]   /* simple expression */
  6   ReturnNode               100       - RETURN #2
```

### Short-circuiting subquery evaluation

<small>Introduced in: v3.12.1</small>

A ternary operator generally evaluates a condition to decide whether to execute
the true branch or the false branch. For example, `count < 5 ? "few" : "many"`
evaluates to the string `"few"` if the `count` variable is less than five,
or to the string `"many"` otherwise.

In AQL, the branches are not limited to simple expressions but they can also be
subqueries. Up until ArangoDB v3.12.0, the catch is that subqueries are pulled
out by the query optimizer into separate `LET` operations that are executed
before the condition is evaluated. Regardless of which branch is taken,
the subquery code is always executed.

Similarly, when you use subqueries as sub-expressions that are combined with
logical `AND` or `OR`, the subqueries are executed unconditionally. This is
typically not what you want and can lead to logical errors.

Ternary operator example:

```aql
LET doc = FIRST(FOR d IN coll FILTER d._key == "A" RETURN d)
RETURN doc ?: FIRST(INSERT { _key: "A" } INTO coll RETURN NEW)
// doc ?: FIRST(...) is a shorthand for doc ? doc : FIRST(...)
```

The above query looks up a document with the key `A` in a collection called `coll`.
If it exists (the `doc` variable is truthy), then it is returned. Otherwise, the
document is supposed to be created. However, the false branch is a subquery that
gets executed unconditionally. If the document with key `A` already exists, an
attempt to create this document is still made (but fails because of a key conflict).

```aql
Execution plan:
 Id   NodeType            Est.   Comment
  1   SingletonNode          1   * ROOT
 10   CalculationNode        1     - LET #9 = { "_key" : "A" }   /* json expression */   /* const assignment */
 20   SubqueryStartNode      1     - LET #5 = ( /* subquery begin */
 11   InsertNode             1       - INSERT #9 IN coll 
 21   SubqueryEndNode        1       - RETURN  $NEW ) /* subquery end */
 18   SubqueryStartNode      1     - LET #1 = ( /* subquery begin */
 17   IndexNode              1       - FOR d IN coll   /* primary index scan, index scan + document lookup */    
 16   LimitNode              1         - LIMIT 0, 1
 19   SubqueryEndNode        1         - RETURN  d ) /* subquery end */
 14   CalculationNode        1     - LET #11 = (FIRST(#1) ?: #5)   /* simple expression */
 15   ReturnNode             1     - RETURN #11
```

As you can see, the false branch execution starts at node `18`, and the
evaluation of the ternary operator happens afterwards in node `14`.

From v3.12.1 onward, the evaluation behavior is changed so that only the
applicable branch of a ternary operator is executed and subqueries that are used
as sub-expressions are effectively evaluated lazily. For example, you can observe
the query optimizer rewriting ternary operators differently to support
short-circuiting when using subqueries:

```aql
Execution plan:
 Id   NodeType            Par   Est.   Comment
  1   SingletonNode                1   * ROOT
 22   SubqueryStartNode            1     - LET #1 = ( /* subquery begin */
 19   IndexNode                    1       - FOR d IN coll   /* primary index scan, index scan + document lookup */    
 18   LimitNode                    1         - LIMIT 0, 1
 23   SubqueryEndNode              1         - RETURN  d ) /* subquery end */
  8   CalculationNode              1     - LET doc = FIRST(#1)   /* simple expression */
 20   SubqueryStartNode            1     - LET #6 = ( /* subquery begin */
 10   CalculationNode              1       - LET #9 = ! doc   /* simple expression */
 11   FilterNode                   1       - FILTER #9
 12   CalculationNode              1       - LET #10 = { "_key" : "A" }   /* json expression */   /* const assignment */
 13   InsertNode                   1       - INSERT #10 IN coll 
 21   SubqueryEndNode              1       - RETURN  $NEW ) /* subquery end */
 16   CalculationNode              1     - LET #11 = (doc ?: FIRST(#6))   /* simple expression */
 17   ReturnNode                   1     - RETURN #11
```

The false branch subquery starts at node `20`, still before the evaluation of
the ternary operator at node `16`. However, the subquery has a `FILTER` operation
using the negated condition. This prevents the `INSERT` operation from running
when the `doc` variable is truthy because the opposite is false and
`FILTER false` leaves nothing to process.

Also see [Evaluation of subqueries](../../aql/fundamentals/subqueries.md#evaluation-of-subqueries).

### Index hints for traversals

<small>Introduced in: v3.12.1</small>

For graph traversals, you can now specify index hints in AQL.

If vertex-centric indexes are known to perform better than the edge index but
aren't chosen automatically, you can make the optimizer prefer the indexes you
specify. This can be done per edge collection, direction, and level/depth:

```aql
FOR v, e, p IN 1..4 OUTBOUND startNode edgeCollection
OPTIONS {
  indexHint: {
    "edgeCollection": {
      "outbound": {
        "base": ["edge"],
        "1": "myIndex1",
        "2": ["myIndex2", "myIndex1"],
        "3": "myIndex3",
      }
    }
  }
}
FILTER p.edges[1].foo == "bar" AND
       p.edges[2].foo == "bar" AND
       p.edges[2].baz == "qux"
```

See the [Traversal options](../../aql/graphs/traversals.md#traversal-options)
for details.


### Query logging

<small>Introduced in: v3.12.2</small>

A new feature for logging metadata of past AQL queries has been added.

You can optionally let ArangoDB store information such as run time, memory usage,
and failure reasons to the `_queries` system collection in the `_system` database
with a configurable sampling probability and retention period. This allows you
to analyze the metadata directly in the database system to debug query issues
and understand usage patterns.

See [Query logging](../../aql/execution-and-performance/query-logging.md) for details.


### Bypass edge cache for graph operations

<small>Introduced in: v3.12.2</small>

The `useCache` option is now supported for graph traversals and path searches.

You can set this option to `false` to not make a large graph operation pollute
the edge cache.

```aql
FOR v, e, p IN 1..5 OUTBOUND "nodes/123" edges
  OPTIONS { useCache: false }
  ...
```



### Push limit into index optimization

<small>Introduced in: v3.12.2</small>

A new `push-limit-into-index` optimizer rule has been added to better utilize
`persistent` indexes over multiple fields when there are a subsequent `SORT` and
`LIMIT` operation. The following conditions need to be met for the rule to be
applied:

- The index must be a compound index
- The index condition must use the `IN` comparison operator
- The attributes used for the `IN` comparison must be the ones used by the index
- There must not be an outer loop and there must not be post-filtering
- The attributes to sort by must be the same ones as in index and in the same
  order, and they must all be in the same direction (all `ASC` or all `DESC`).

Under these circumstances, fetching all the data to sort it is unnecessary
because it is already sorted in the index. This makes it possible to get results
from the index in batches. This can greatly improve the performance of certain
queries.

Example query:

```aql
FOR doc IN coll
  FILTER doc.x IN ["foo", "bar"]
  SORT doc.y
  LIMIT 10
  RETURN doc
```

With a persistent index over `x` and `y` but without the optimization, the
query explain output looks as follows:

```aql
Execution plan:
 Id   NodeType          Par   Est.   Comment
  1   SingletonNode              1   * ROOT 
  9   IndexNode                500     - FOR doc IN coll   /* persistent index scan, index only (projections: `y`) */    LET #5 = doc.`y`   /* with late materialization */
  6   SortNode                 500       - SORT #5 ASC   /* sorting strategy: constrained heap */
  7   LimitNode                 10       - LIMIT 0, 10
 10   MaterializeNode           10       - MATERIALIZE doc INTO #4
  8   ReturnNode                10       - RETURN #4

Indexes used:
 By   Name                      Type         Collection   Unique   Sparse   Cache   Selectivity   Fields         Stored values   Ranges
  9   idx_1806008994935865344   persistent   coll         false    false    false      100.00 %   [ `x`, `y` ]   [  ]            (doc.`x` IN [ "bar", "foo" ])
```

With the optimization, the `LIMIT 10` is pushed into the index node with the
comment `/* early reducing results */`:

```aql
Execution plan:
 Id   NodeType          Par   Est.   Comment
  1   SingletonNode              1   * ROOT 
  9   IndexNode                500     - FOR doc IN coll   /* persistent index scan, index only (projections: `y`) */    LET #5 = doc.`y`   LIMIT 10 /* early reducing results */   /* with late materialization */
  6   SortNode                 500       - SORT #5 ASC   /* sorting strategy: constrained heap */
  7   LimitNode                 10       - LIMIT 0, 10
 10   MaterializeNode           10       - MATERIALIZE doc INTO #4
  8   ReturnNode                10       - RETURN #4

Indexes used:
 By   Name                      Type         Collection   Unique   Sparse   Cache   Selectivity   Fields         Stored values   Ranges
  9   idx_1806008994935865344   persistent   coll         false    false    false      100.00 %   [ `x`, `y` ]   [  ]            (doc.`x` IN [ "bar", "foo" ])
```

### Array and object destructuring

<small>Introduced in: v3.12.2</small>

Destructuring lets you assign array values and object attributes to one or
multiple variables with a single `LET` operation and as part of regular `FOR`
loops. This can be convenient to extract a subset of values and name them in a
concise manner.

Array values are assigned by position and you can skip elements by leaving out
variable names.

Object attributes are assigned by name but you can also map them to different
variable names.

You can mix both array and object destructuring.

```aql
LET [x, y] = [1, 2, 3]   // Assign 1 to variable x and 2 to y
LET [, y, z] = [1, 2, 3] // Assign 2 to variable y and 3 to z

// Assign "Luna Miller" to variable name and 39 to age
LET { name, age } = { vip: true, age: 39, name: "Luna Miller" }

// Assign the vip attribute value to variable status
LET { vip: status } = { vip: true, age: 39, name: "Luna Miller" }

// Assign 1 to variable x, 2 to y, and 3 to z
LET { obj: [x, [y, z]] } = { obj: [1, [2, 3]] }

// Iterate over array of objects and extract the firstName attribute
LET names = [ { firstName: "Luna"}, { firstName: "Sam" } ]
FOR { firstName } IN names
  RETURN firstName
```

See [Array destructuring](../../aql/operators.md#array-destructuring) and
[Object destructuring](../../aql/operators.md#object-destructuring) for details.

### Improved utilization of sorting order for `COLLECT`

<small>Introduced in: v3.12.3</small>

The query optimizer now automatically recognizes additional cases that allow
using the faster sorted method for a `COLLECT` operation. For example, the
following query previously created a query plan with two `SORT` operations and
used the hash method for `COLLECT`.

```aql
FOR doc IN coll
  SORT doc.value DESC
  COLLECT val = doc.value
  RETURN val
```

```aql
Execution plan:
 Id   NodeType                  Par   Est.   Comment
  1   SingletonNode                      1   * ROOT 
  2   EnumerateCollectionNode     ✓     36     - FOR doc IN coll   /* full collection scan (projections: `value`)  */   LET #4 = doc.`value`
  4   SortNode                    ✓     36       - SORT #4 DESC   /* sorting strategy: standard */
  6   CollectNode                 ✓     28       - COLLECT val = #4   /* hash */
  8   SortNode                    ✓     28       - SORT val ASC   /* sorting strategy: standard */
  7   ReturnNode                        28       - RETURN val
```

Now, the optimizer checks whether all grouping values are covered by the
user-requested `SORT`, ignoring the direction, and doesn't create an additional
`SORT` node in that case. A sort in descending order can thus now be utilized
for grouping using the sorted method, and possibly even utilize an index.

```aql
Execution plan:
 Id   NodeType                  Par   Est.   Comment
  1   SingletonNode                      1   * ROOT 
  2   EnumerateCollectionNode     ✓     36     - FOR doc IN coll   /* full collection scan (projections: `value`)  */   LET #5 = doc.`value`
  4   SortNode                    ✓     36       - SORT #5 DESC   /* sorting strategy: standard */
  6   CollectNode                 ✓     28       - COLLECT val = #5   /* sorted */
  7   ReturnNode                        28       - RETURN val
```

### Fast object enumeration with `ENTRIES()`

<small>Introduced in: v3.12.3</small>

A new optimization has been implemented to improve the efficiency of the
[`ENTRIES()` function](../../aql/functions/document-object.md#entries) in AQL.

The new `replace-entries-with-object-iteration` optimizer rule can recognize a
query pattern like `FOR obj IN source FOR [key, value] IN ENTRIES(obj) ...`
and use a faster code path for iterating over the object that avoids copying a
lot of key/value pairs and storing intermediate results.

```aql
LET source = [ { a: 1, b: 2 }, { c: 3 } ]

FOR doc IN source // collection or array of objects
  FOR [key, value] IN ENTRIES(doc)
  RETURN CONCAT(key, value)
```

Without the optimization, the node with ID `6` uses a regular list iteration:

```aql
Execution plan:
 Id   NodeType            Par   Est.   Comment
  1   SingletonNode                1   * ROOT
  2   CalculationNode       ✓      1     - LET source = [ { "a" : 1, "b" : 2 }, { "c" : 3 } ]   /* json expression */   /* const assignment */
  4   EnumerateListNode     ✓      2     - FOR doc IN source   /* list iteration */
  5   CalculationNode       ✓      2       - LET #7 = ENTRIES(doc)   /* simple expression */
  6   EnumerateListNode     ✓    200       - FOR #4 IN #7   /* list iteration */
  9   CalculationNode       ✓    200         - LET #8 = CONCAT(#4[0], #4[1])   /* simple expression */
 10   ReturnNode                 200         - RETURN #8
```

With the optimization applied, the faster object iteration is used:

```aql
Execution plan:
 Id   NodeType            Par   Est.   Comment
  1   SingletonNode                1   * ROOT
  2   CalculationNode       ✓      1     - LET source = [ { "a" : 1, "b" : 2 }, { "c" : 3 } ]   /* json expression */   /* const assignment */
  4   EnumerateListNode     ✓      2     - FOR doc IN source   /* list iteration */
  6   EnumerateListNode     ✓    200       - FOR [key, value] OF doc   /* object iteration */
  9   CalculationNode       ✓    200         - LET #8 = CONCAT(key, value)   /* simple expression */
 10   ReturnNode                 200         - RETURN #8
```

### Improved graph path searches

<small>Introduced in: v3.12.3</small>

Due to a refactoring in version 3.11, the performance of certain graph queries
regressed while others improved. In particular shortest path queries like
`K_SHORTEST_PATHS` queries became slower for certain datasets compared to
version 3.10. The performance should now be similar again due to a switch from
a Dijkstra-like algorithm back to Yen's algorithm and by re-enabling caching
of neighbor nodes in one case.

In addition, shortest path searches may finish earlier now due to some
optimizations to disregard candidate paths for which better candidates have been
found already.

### Cache for query execution plans (experimental)

<small>Introduced in: v3.12.4</small>

An optional execution plan cache for AQL queries has been added to let you skip query
planning and optimization when running the same queries repeatedly. This can
significantly reduce the total time for running particular queries where a lot
of time is spent on the query planning and optimization passes in proportion to
the actual execution.

Query plans are not cached by default. You need to set the new `usePlanCache`
query option to `true` to utilize cached plans as well as to add plans to the
cache. Otherwise, the plan cache is bypassed.

```js
db._query("FOR doc IN coll FILTER doc.attr == @val RETURN doc", { val: "foo" }, { usePlanCache: true });
```

Not all AQL queries are eligible for plan caching. You can generally not cache
plans of queries where bind variables affect the structure of the execution plan
or the index utilization.
See [Cache eligibility](../../aql/execution-and-performance/caching-query-plans.md#cache-eligibility)
for details.

HTTP API endpoints and a JavaScript API module have been added for clearing the
contents of the query plan cache and for retrieving the current plan cache entries.
See [The execution plan cache for AQL queries](../../aql/execution-and-performance/caching-query-plans.md#interfaces)
for details.

```js
require("@arangodb/aql/plan-cache").toArray();
```

```json
[
  {
    "hash" : "2757239675060883499",
    "query" : "FOR doc IN coll FILTER doc.attr == @val RETURN doc",
    "queryHash" : 11382508862770890000,
    "bindVars" : {
    },
    "fullCount" : false,
    "dataSources" : [
      "coll"
    ],
    "created" : "2024-11-20T17:21:34Z",
    "hits" : 0,
    "memoryUsage" : 3070
  }
]
```

The following startup options have been added to let you configure the plan cache:

- `--query.plan-cache-max-entries`: The maximum number of plans in the
  query plan cache per database. The default value is `128`.
- `--query.plan-cache-max-memory-usage`: The maximum total memory usage for the
  query plan cache in each database. The default value is `8MB`.
- `--query.plan-cache-max-entry-size`: The maximum size of an individual entry
  in the query plan cache in each database. The default value is `2MB`.
- `--query.plan-cache-invalidation-time`: The time in seconds after which a
  query plan is invalidated in the query plan cache.

The following metrics have been added to monitor the query plan cache:

| Label | Description |
|:------|:------------|
| `arangodb_aql_query_plan_cache_hits_total` | Total number of lookup hits in the AQL query plan cache. |
| `arangodb_aql_query_plan_cache_memory_usage` | Total memory usage of all query plan caches across all databases. |
| `arangodb_aql_query_plan_cache_misses_total` | Total number of lookup misses in the AQL query plan cache. |

### `PUSH()` function available for aggregations

<small>Introduced in: v3.12.4</small>

The `COLLECT` and `WINDOW` operations now support the `PUSH()` function in
`AGGREGATE` expressions.

For grouping data with `COLLECT`, it means that you can rewrite a
`COLLECT ... INTO var = <projectionExpression>` construct to
`COLLECT ... AGGREGATE var = PUSH(<projectionExpression>)`, for instance.
You can add more assignments to the `AGGREGATE` clause to perform additional
calculations in one go, making it more powerful than `COLLECT ... INTO`.

For sliding window calculations with `WINDOW`, the `PUSH()` function can be handy
when developing queries to understand what values are in the sliding window:

```aql
FOR t IN observations
  SORT t.time
  WINDOW { preceding: "unbounded", following: 0 }
  AGGREGATE sum = SUM(t.val), values = PUSH(t.val)
  RETURN { sum, values }
```

| sum | values |
|----:|:-------|
|  10 | [10]
|  10 | [10,0]
|  19 | [10,0,9]
|  29 | [10,0,9,10]
|  54 | [10,0,9,10,25]
|  59 | [10,0,9,10,25,5]
|  79 | [10,0,9,10,25,5,20]
| 109 | [10,0,9,10,25,5,20,30]
| 134 | [10,0,9,10,25,5,20,30,25]

See the [`COLLECT` operation](../../aql/high-level-operations/collect.md#aggregation)
and the [`WINDOW` operation](../../aql/high-level-operations/window.md) for details.

### Improved index utilization for `SORT`

<small>Introduced in: v3.12.4</small>

The existing `use-index-for-sort` optimizer rule has been extended to take
advantage of persistent indexes for sorting in more cases, namely when only a
prefix of the indexed fields are used to sort by.

Persistent indexes are sorted and could already be utilized to optimize `SORT`
operations away if the attributes you sort by match the attributes the index is
over. Now, the sortedness can be further exploited if there is a persistent index
(e.g. over `["a", "b"]`) that starts with the same fields as the `SORT` operation
(e.g. `a`), but you sort by additional attributes not covered by the index (e.g. `c`):

```aql
FOR { a, b, c } IN coll
  SORT a, c
  RETURN { a, b, c }
```

The data is already sorted in the index by the first attributes (here: `a`) and
each group of values only needs to be sorted by the remaining attributes (here: `c`).
This reduces the amount of work necessary to establish the total sorting order.

The grouped sorting strategy that is applied in such cases is indicated in the
query explain output:

```aql
Execution plan:
 Id   NodeType          Par   Est.   Comment
  1   SingletonNode              1   * ROOT 
  9   IndexNode           ✓    100     - FOR #3 IN coll   /* persistent index scan, index only (projections: `a`) */    LET #10 = #3.`a`   /* with late materialization */
 10   MaterializeNode          100       - MATERIALIZE #3 INTO #7 /* (projections: `b`, `c`) */   LET #8 = #7.`b`, #9 = #7.`c`
  6   SortNode            ✓    100       - SORT #9 ASC; GROUPED BY #10   /* sorting strategy: grouped */
  7   CalculationNode     ✓    100       - LET #5 = { "a" : #10, "b" : #8, "c" : #9 }   /* simple expression */
  8   ReturnNode               100       - RETURN #5

Indexes used:
 By   Name                      Type         Collection   Unique   Sparse   Cache   Selectivity   Fields         Stored values   Ranges
  9   idx_1821511732613349376   persistent   coll         false    false    false      100.00 %   [ `a`, `b` ]   [  ]            *

Optimization rules applied:
 Id   Rule Name                                  Id   Rule Name                                  Id   Rule Name                         
  1   move-calculations-up                        6   move-calculations-down                     11   optimize-projections              
  2   remove-unnecessary-calculations             7   reduce-extraction-to-projection            12   remove-unnecessary-calculations-4 
  3   move-calculations-up-2                      8   batch-materialize-documents                13   async-prefetch                    
  4   use-indexes                                 9   push-down-late-materialization    
  5   use-index-for-sort                         10   materialize-into-separate-variable
```

### Improved index utilization for `COLLECT`

<small>Introduced in: v3.12.4</small>

When grouping data with `COLLECT` to determine distinct values, such operations
can now benefit from persistent indexes. The new `use-index-for-collect`
optimizer rule speeds up the scanning for distinct values up to orders of
magnitude if the selectivity is low, i.e. if there are few different values.

```aql
FOR doc IN coll
  COLLECT a = doc.a, b = doc.b
  RETURN { a, b }
```

If there is a persistent index over the attributes `a` and `b`, then the query
explain output looks like this with the optimization applied:

```aql
Execution plan:
 Id   NodeType           Par   Est.   Comment
  1   SingletonNode               1   * ROOT 
 10   IndexCollectNode          100     - FOR doc IN coll COLLECT a = doc.`a`, b = doc.`b` /* distinct value index scan */
  6   CalculationNode      ✓    100     - LET #5 = { "a" : a, "b" : b }   /* simple expression */
  7   ReturnNode                100     - RETURN #5

Indexes used:
 By   Name                      Type         Collection   Unique   Sparse   Cache   Selectivity   Fields         Stored values   Ranges
 10   idx_1821499964373598208   persistent   coll         false    false    false       10.00 %   [ `a`, `b` ]   [  ]            *

Optimization rules applied:
 Id   Rule Name                               Id   Rule Name                               Id   Rule Name                      
  1   move-calculations-up                     4   use-index-for-sort                       7   async-prefetch                 
  2   move-calculations-up-2                   5   reduce-extraction-to-projection
  3   use-indexes                              6   use-index-for-collect   
```

You can disable the optimization for individual `COLLECT` operations by setting
the new `disableIndex` option to `true`:

```aql
FOR doc IN coll
  COLLECT a = doc.a, b = doc.b OPTIONS { disableIndex: true }
  RETURN { a, b }
```

```aql
Execution plan:
 Id   NodeType          Par   Est.   Comment
  1   SingletonNode              1   * ROOT 
  9   IndexNode           ✓   1000     - FOR doc IN coll   /* persistent index scan, index only (projections: `a`, `b`) */    LET #8 = doc.`a`, #9 = doc.`b`   
  5   CollectNode         ✓    800       - COLLECT a = #8, b = #9   /* sorted */
  6   CalculationNode     ✓    800       - LET #5 = { "a" : a, "b" : b }   /* simple expression */
  7   ReturnNode               800       - RETURN #5

Indexes used:
 By   Name                      Type         Collection   Unique   Sparse   Cache   Selectivity   Fields         Stored values   Ranges
  9   idx_1821499964373598208   persistent   coll         false    false    false       10.00 %   [ `a`, `b` ]   [  ]            *

Optimization rules applied:
 Id   Rule Name                                 Id   Rule Name                                 Id   Rule Name                        
  1   move-calculations-up                       4   use-index-for-sort                         7   remove-unnecessary-calculations-4
  2   move-calculations-up-2                     5   reduce-extraction-to-projection            8   async-prefetch                   
  3   use-indexes                                6   optimize-projections         
```

The optimization is automatically disabled if the selectivity is high, i.e.
there are many different values, or if there is filtering or an `INTO` or
`AGGREGATE` clause. Other optimizations may still be able to utilize the index
to some extent.

See the [`COLLECT` operation](../../aql/high-level-operations/collect.md#disableindex)
for details.

---

<small>Introduced in: v3.12.5</small>

The `use-index-for-collect` optimizer rule has been further extended.
Queries where a `COLLECT` operation has an `AGGREGATE` clause that exclusively
refers to attributes covered by a persistent index (and no other variables nor
contains calls of aggregation functions with constant values) can now utilize
this index. The index must not be sparse.

Reading the data from the index instead of the stored documents for aggregations
can increase the performance by a factor of two.

```aql
FOR doc IN coll
  COLLECT a = doc.a AGGREGATE b = MAX(doc.b)
  RETURN { a, b }
```

If there is a persistent index over the attributes `a` and `b`, then the above
example query has an `IndexCollectNode` in the explain output and the index
usage is indicated if the optimization is applied:

```aql
Execution plan:
 Id   NodeType           Par   Est.   Comment
  1   SingletonNode               1   * ROOT 
 10   IndexCollectNode         4999     - FOR doc IN coll COLLECT a = doc.`a` AGGREGATE b = MAX(doc.`b`) /* full index scan */
  6   CalculationNode      ✓   4999     - LET #5 = { "a" : a, "b" : b }   /* simple expression */
  7   ReturnNode               4999     - RETURN #5

Indexes used:
 By   Name                      Type         Collection   Unique   Sparse   Cache   Selectivity   Fields         Stored values   Ranges
 10   idx_1836452431376941056   persistent   coll   
```

### Deduction of node collection for graph queries

<small>Introduced in: v3.12.6</small>

AQL graph traversals and path searches using anonymous graphs / collection sets
require that you declare all involved node collections upfront for cluster
deployments. That is, you need to use the `WITH` operation to list the collections
edges may point to, as well as the start vertex collection if not declared
otherwise. This also applies to single servers if the `--query.require-with`
startup option is enabled for parity between both deployment modes.

For example, the node collection of the start vertex is `person` and the edges
stored in the `acts_in` edge collection point to a `movie` node collection.
Both need to be declared at the beginning of the query:

```aql
WITH person, movie
FOR v,e,p IN 1..1 OUTBOUND "person/1544" acts_in
  RETURN v.label
```

From v3.12.6 onward, the vertex collections can be automatically inferred if
there is a named graph using the same edge collection(s) or if you use
`OPTIONS { vertexCollections: ... }` in queries to restrict which
node collections a traversal may visit.

For example, assume there is a named graph that includes an edge definition for
the `acts_in` edge collection, with `person` as the _from_ collection and `movie`
as the _to_ collection. If you now specify `acts_in` as an edge collection in
an anonymous graph query, all named graphs are checked for this edge collection,
and if there is a matching edge definition, its node collections are automatically
added as data sources to the query. You no longer have to manually declare the
`person` and `movie` collections:

```aql
FOR v,e,p IN 1..1 OUTBOUND "person/1544" acts_in
  RETURN v.label
```

You can still declare collections manually, in which case they are also added
as data sources in addition to automatically deduced collections.

## Indexing

### Multi-dimensional indexes

The previously experimental `zkd` index type is now stable and has been renamed
to `mdi`. Existing indexes keep the `zkd` type.

Multi-dimensional indexes can now be declared as `sparse` to exclude documents
from the index that do not have the defined attributes or are explicitly set to
`null` values. If a value other than `null` is set, it still needs to be numeric.

Multi-dimensional indexes now support `storedValues` to cover queries for better
performance.

An additional `mdi-prefixed` index variant has been added that lets you specify
additional attributes for the index to narrow down the search space using
equality checks. It can be used as a vertex-centric index for graph traversals
if created on an edge collection with the first attribute in `prefixFields` set
to `_from` or `_to`.

See [Multi-dimensional indexes](../../index-and-search/indexing/working-with-indexes/multi-dimensional-indexes.md)
for details.

#### Native strict ranges

<small>Introduced in: v3.12.3</small>

Multi-dimensional indexes no longer require post-filtering when using strict
ranges like in the following query:

```aql
FOR d IN coll
  FILTER 0 < d.x && d.x < 1
  RETURN d.x
```

```aql
Execution plan:
 Id   NodeType        Par   Est.   Comment
  1   SingletonNode            1   * ROOT
  7   IndexNode         ✓     71     - FOR d IN coll   /* mdi index scan, index scan + document lookup (filter projections: `x`) (projections: `x`) */    LET #3 = d.`x`   FILTER ((d.`x` > 0) && (d.`x` < 1))   /* early pruning */   
  6   ReturnNode              71       - RETURN #3

Indexes used:
 By   Name                      Type   Collection   Unique   Sparse   Cache   Selectivity   Fields         Stored values   Ranges
  7   idx_1812443690233233408   mdi    coll         false    false    false           n/a   [ `x`, `y` ]   [  ]            ((d.`x` >= 0) && (d.`x` <= 1))
```

Native support for strict ranges removes a potential bottleneck when working
with large datasets.

```aql
Execution plan:
 Id   NodeType        Par   Est.   Comment
  1   SingletonNode            1   * ROOT 
  7   IndexNode         ✓     71     - FOR d IN coll   /* mdi index scan, index scan + document lookup (projections: `x`) */    LET #3 = d.`x`   
  6   ReturnNode              71       - RETURN #3

Indexes used:
 By   Name                      Type   Collection   Unique   Sparse   Cache   Selectivity   Fields         Stored values   Ranges
  7   idx_1812443856099082240   mdi    coll         false    false    false           n/a   [ `x`, `y` ]   [  ]            ((d.`x` > 0) && (d.`x` < 1))
```

#### Extended utilization of sparse indexes

<small>Introduced in: v3.12.3</small>

The `null` value is less than all other values in AQL. Therefore, range queries
without a lower bound need to include `null` but sparse indexes do not include
`null` values. However, if you explicitly exclude `null` in range queries,
sparse indexes can be utilized after all. This was not previously supported for
multi-dimensional indexes. Even with a sparse `mdi` index over the fields `x`
and `y` and the exclusion of `null`, the following example query cannot take
advantage of the index up to v3.12.2:

```aql
FOR d IN coll
  FILTER d.x < 10 && d.x != null RETURN d
```

```aql
Execution plan:
 Id   NodeType                  Par   Est.   Comment
  1   SingletonNode                      1   * ROOT
  2   EnumerateCollectionNode     ✓    100     - FOR d IN coll   /* full collection scan  */   FILTER ((d.`x` < 10) && (d.`x` != null))   /* early pruning */
  5   ReturnNode                       100       - RETURN d
```

From v3.13.3 onward, such a query gets optimized to utilize the sparse
multi-dimensional index and the condition for excluding `null` is removed from
the query plan because it is unnecessary – a sparse index contains values other
than `null` only:

Execution plan:
 Id   NodeType        Par   Est.   Comment
  1   SingletonNode            1   * ROOT 
  6   IndexNode         ✓     71     - FOR d IN coll   /* mdi index scan, index scan + document lookup */    
  5   ReturnNode              71       - RETURN d

Indexes used:
 By   Name                      Type   Collection   Unique   Sparse   Cache   Selectivity   Fields         Stored values   Ranges
  6   idx_1812445012396343296   mdi    coll         false    true     false           n/a   [ `x`, `y` ]   [  ]            (d.`x` < 10)

### Stored values can contain the `_id` attribute

The usage of the `_id` system attribute was previously disallowed for
`persistent` indexes inside of `storedValues`. This is now allowed in v3.12.

Note that it is still forbidden to use `_id` as a top-level attribute or
sub-attribute in `fields` of persistent indexes. On the other hand, inverted
indexes have been allowing to index and store the `_id` system attribute.

### Vector indexes (experimental)

<small>Introduced in: v3.12.4</small>

A new `vector` index type has been added as an experimental feature that enables
you to find items with similar properties by comparing vector embeddings, which
are numerical representations generated by machine learning models.

To try out this feature, start an ArangoDB server (`arangod`) with the
`--experimental-vector-index` startup option. You need to generate
vector embeddings before creating a vector index. For more information about
the vector index type including the available settings, see the
[Vector indexes](../../index-and-search/indexing/working-with-indexes/vector-indexes.md)
documentation.

You can also follow the guide in this blog post:
[Vector Search in ArangoDB: Practical Insights and Hands-On Examples](https://arangodb.com/2024/11/vector-search-in-arangodb-practical-insights-and-hands-on-examples/)

If the vector index type is enabled, the following new AQL functions are
available to retrieve similar documents:

- `APPROX_NEAR_COSINE()`
- `APPROX_NEAR_L2()`

For how to use these functions as well as query examples, see
[Vector search functions in AQL](../../aql/functions/vector.md).

Two startup options for the storage engine related to vector indexes
have been added:
- `--rocksdb.max-write-buffer-number-vector`
- `--rocksdb.partition-files-for-vector-index`

The new `use-vector-index` AQL optimizer ruler is responsible for
utilizing vector indexes in queries.

Furthermore, a new error code `ERROR_QUERY_VECTOR_SEARCH_NOT_APPLIED` (1554)
has been added.

## Server options

### Effective and available startup options

The new `GET /_admin/options` and `GET /_admin/options-description` HTTP API
endpoints allow you to return the effective configuration and the available
startup options of the queried _arangod_ instance.

Previously, it was only possible to fetch the current configuration on
single servers and Coordinators using a JavaScript Transaction, and to list
the available startup options with `--dump-options`.

See the [HTTP interface for administration](../../develop/http-api/administration.md#startup-options)
for details.

### Protocol aliases for endpoints

You can now use `http://` and `https://` as aliases for `tcp://` and `ssl://`
in the `--server.endpoint` startup option of the server.

### Adjustable Stream Transaction size

The previously fixed limit of 128 MiB for [Stream Transactions](../../develop/transactions/stream-transactions.md)
can now be configured with the new `--transaction.streaming-max-transaction-size`
startup option. The default value remains 128 MiB up to v3.12.3.
From v3.12.4 onward, the default value is 512 MiB.

### Transparent compression of requests and responses between ArangoDB servers and client tools

The following startup options have been added to all
[client tools](../../components/tools/_index.md) (except the ArangoDB Starter)
and can be used to enable transparent compression of the data that is sent
between a client tool and an ArangoDB server:

- `--compress-transfer`
- `--compress-request-threshold`

If the `--compress-transfer` option is set to `true`, the client tool adds an
extra `Accept-Encoding: deflate` HTTP header to all requests made to the server.
This allows the server to compress its responses before sending them back to the
client tool.

The client also transparently compresses its own requests to the server if the
size of the request body (in bytes) is at least the value of the
`--compress-request-threshold` startup option. The default value is `0`, which
disables the compression of the request bodies in the client tool. To opt in to
sending compressed data, set the option to a value greater than `0`.
The client tool adds a `Content-Encoding: deflate` HTTP header to the request
if the request body is compressed using the deflate compression algorithm.

The following options have been added to the ArangoDB server:

- `--http.compress-response-threshold`
- `--http.handle-content-encoding-for-unauthenticated-requests`

The value of the `--http.compress-response-threshold` startup option specifies
the threshold value (in bytes) from which on response bodies are sent out
compressed by the server. The default value is `0`, which disables sending out
compressed response bodies. To enable compression, the option should be set to a
value greater than `0`. The selected value should be large enough to justify the
compression overhead. Regardless of the value of this option, the client has to
signal that it expects a compressed response body by sending an
`Accept-Encoding: gzip` or `Accept-Encoding: deflate` HTTP header with its request.
If that header is missing, no response compression is performed by the server.

If the `--http.handle-content-encoding-for-unauthenticated-requests`
startup option is set to `true`, the ArangoDB server automatically decompresses
incoming HTTP requests with `Content-Encodings: gzip` or
`Content-Encoding: deflate` HTTP header even if the request is not authenticated.
If the option is set to `false`, any unauthenticated request that has a
`Content-Encoding` header set is rejected. This is the default setting.

{{< info >}}
As compression uses CPU cycles, it should be activated only when the network
communication between the server and clients is slow and there is enough CPU
capacity left for the extra compression/decompression work.

Furthermore, requests and responses should only be compressed when they exceed a
certain minimum size, e.g. 250 bytes.
{{< /info >}}

### LZ4 compression for values in the in-memory edge cache

<small>Introduced in: v3.11.2</small>

LZ4 compression of edge index cache values allows you to store more data in main
memory than without compression, so the available memory can be used more
efficiently. The compression is transparent and does not require any change to
queries or applications.
The compression can add CPU overhead for compressing values when storing them
in the cache, and for decompressing values when fetching them from the cache.

The new startup option `--cache.min-value-size-for-edge-compression` can be
used to set a threshold value size for compression edge index cache payload
values. The default value is `1GB`, which effectively turns compression
off. Setting the option to a lower value (i.e. `100`) turns on the
compression for any payloads whose size exceeds this value.
  
The new startup option `--cache.acceleration-factor-for-edge-compression` can
be used to fine-tune the compression. The default value is `1`.
Higher values typically mean less compression but faster speeds.

The following new metrics can be used to determine the usefulness of
compression:
  
- `rocksdb_cache_edge_inserts_effective_entries_size_total`: returns the total
  number of bytes of all entries that were stored in the in-memory edge cache,
  after compression was attempted/applied. This metric is populated regardless
  of whether compression is used or not.
- `rocksdb_cache_edge_inserts_uncompressed_entries_size_total`: returns the total
  number of bytes of all entries that were ever stored in the in-memory edge
  cache, before compression was applied. This metric is populated regardless of
  whether compression is used or not.
- `rocksdb_cache_edge_compression_ratio`: returns the effective
  compression ratio for all edge cache entries ever stored in the cache.

Note that these metrics are increased upon every insertion into the edge
cache, but not decreased when data gets evicted from the cache.

### Limit the number of databases in a deployment

<small>Introduced in: v3.10.10, v3.11.2</small>

The `--database.max-databases` startup option allows you to limit the
number of databases that can exist in parallel in a deployment. You can use this
option to limit the resources used by database objects. If the option is used
and there are already as many databases as configured by this option, any
attempt to create an additional database fails with error
`32` (`ERROR_RESOURCE_LIMIT`). Additional databases can then only be created
if other databases are dropped first. The default value for this option is
unlimited, so an arbitrary amount of databases can be created.

### `--database.extended-names` enabled by default

The `--database.extended-names` startup option is now enabled by default.
This allows you to use Unicode characters inside database names, collection names,
view names and index names by default, unless you explicitly turn off the
functionality.

Note that once a server in your deployment has been started with the flag set to
`true`, it stores this setting permanently. Switching the startup option back to
`false` raises a warning about the option change at startup, but it is not
blockig the startup.

Existing databases, collections, views and indexes with extended names can still
be used even with the option set back to `false`, but no new database objects
with extended names can be created with the option disabled. This state is only
meant to facilitate downgrading or reverting the option change. When the option
is set to `false`, all database objects with extended names that were created
in the meantime should be removed manually.

### Cluster-internal connectivity checks

<small>Introduced in: v3.11.5</small>

This feature makes Coordinators and DB-Servers in a cluster periodically send
check requests to each other, in order to see if all nodes can connect to
each other.
If a cluster-internal connection to another Coordinator or DB-Server cannot
be established within 10 seconds, a warning is now logged.

The new `--cluster.connectivity-check-interval` startup option can be used
to control the frequency of the connectivity check, in seconds.
If set to a value greater than zero, the initial connectivity check is
performed approximately 15 seconds after the instance start, and subsequent
connectivity checks are executed with the specified frequency.
If set to `0`, connectivity checks are disabled.

You can also use the following metrics to monitor and detect temporary or
permanent connectivity issues:
- `arangodb_network_connectivity_failures_coordinators`: Number of failed
  connectivity check requests sent by this instance to Coordinators.
- `arangodb_network_connectivity_failures_dbservers_total`: Number of failed
  connectivity check requests sent to DB-Servers.

### Configurable maximum for queued log entries

<small>Introduced in: v3.10.12, v3.11.5</small>

The new `--log.max-queued-entries` startup option lets you configure how many
log entries are queued in a background thread.

Log entries are pushed on a queue for asynchronous writing unless you enable the
`--log.force-direct` startup option. If you use a slow log output (e.g. syslog),
the queue might grow and eventually overflow.

You can configure the upper bound of the queue with this option. If the queue is
full, log entries are written synchronously until the queue has space again.

### Configurable maximal size for cache entries

<small>Introduced in: v3.12.1</small>

A new `--cache.max-cache-value-size` startup option has been added to limit the
maximum size of individual values stored in the in-memory cache. The cache is
used for edge indexes, persistent indexes with caching enabled, and collections
with document caches enabled.

The startup option defaults to 4 MiB, meaning that no individual values larger
than this are stored in the in-memory cache. It avoids storing very large values
in the cache for huge documents or for all the connections of super nodes, and
thus leaves more memory for other purposes.

### Configurable async prefetch limits

<small>Introduced in: v3.12.1</small>

While [async prefetching](#parallel-execution-within-an-aql-query) is normally
beneficial for query performance, the async prefetch operations may cause
congestion in the ArangoDB scheduler and interfere with other operations.
The amount of prefetch operations is limited and you adjust these limits with 
he following startup options:

- `--query.max-total-async-prefetch-slots`:
  The maximum total number of slots available for asynchronous prefetching,
  across all AQL queries. Default: `256`
- `--query.max-query-async-prefetch-slots`:
  The maximum per-query number of slots available for asynchronous prefetching
  inside any AQL query. Default: `32`
  
The total number of concurrent prefetch operations across all AQL queries can be
limited using the first option, and the maximum number of prefetch operations in
every single AQL query can be capped with the second option.

These options prevent that running a lot of AQL queries with async
prefetching fully congests the scheduler queue, and also they prevent large
AQL queries to use up all async prefetching capacity on their own.

### New server scheduler type

<small>Introduced in: v3.12.1</small>

A new `--server.scheduler` startup option has been added to let you select the
scheduler type. The scheduler currently used by ArangoDB has the value
`supervised`. A new work-stealing scheduler is being implemented and can be
selected using the value `threadpools`. This new scheduler is experimental and
should not be used in production.

### Query logging options

<small>Introduced in: v3.12.2</small>

The following startup options related to the [Query logging](#query-logging)
feature have been added:

- `--query.collection-logger-enabled`:
  Whether to enable the logging of metadata for past AQL queries
- `--query.collection-logger-include-system-database`:
  Whether to log queries that run in the `_system` database
- `--query.collection-logger-probability`:
  The sampling probability for logging queries (in percent)
- `--query.collection-logger-all-slow-queries`:
  Whether to always log slow queries regardless of whether they are selected for
  sampling or not
- `--query.collection-logger-retention-time`:
  The retention period for entries in the `_queries` system collection (in seconds)
- `--query.collection-logger-cleanup-interval`:
  The interval for running the cleanup process for the retention configuration
  (in milliseconds)
- `--query.collection-logger-push-interval`:
  How long to buffer query log entries in memory before they are actually
  written to the system collection (in milliseconds)
- `--query.collection-logger-max-buffered-queries`:
  The number of query log entries to buffer in memory before they are flushed to
  the system collection, discarding additional query metadata if the logging
  thread cannot keep up

### Cluster management options

<small>Introduced in: v3.12.4</small>

The following startup options for cluster deployments have been added:

- `--agency.supervision-expired-servers-grace-period`:
  The supervision time after which a server is removed from the Agency if it
  does no longer send heartbeats (in seconds).

- `--cluster.no-heartbeat-delay-before-shutdown`:
  The delay (in seconds) before shutting down a Coordinator if no heartbeat can
  be sent. Set to `0` to deactivate this shutdown.

### Limit for shard synchronization actions

<small>Introduced in: v3.11.14, v3.12.5</small>

The number of `SynchronizeShard` actions that can be scheduled internally by the
cluster maintenance has been restricted to prevent these actions from blocking
`TakeoverShardLeadership` actions with a higher priority, which could lead to
service interruption during upgrades and after failovers.

The new `--server.maximal-number-sync-shard-actions` startup option controls
how many `SynchronizeShard` actions can be queued at any given time.

### Full RocksDB compaction on upgrade

<small>Introduced in: v3.12.5-2</small>

A new `--database.auto-upgrade-full-compaction` startup option has been added
that you can use together with `--database.auto-upgrade` for upgrading.

With the new option enabled, the server will perform a full RocksDB compaction
after the database upgrade has completed successfully but before shutting down.
This performs a complete compaction of all column families with the `changeLevel`
and `compactBottomMostLevel` options enabled, which can help optimize the
database files after an upgrade.

The server process terminates with the new exit code 30
(`EXIT_FULL_COMPACTION_FAILED`) if the compaction fails.

## Miscellaneous changes

### V8 and ICU library upgrades

The bundled V8 JavaScript engine has been upgraded from version 7.9.317 to
12.1.165. As part of this upgrade, the Unicode character handling library
ICU has been upgraded as well, from version 64.2 to 73.1 (but only for
JavaScript contexts, see [Incompatible changes in ArangoDB 3.12](incompatible-changes-in-3-12.md#incompatibilities-with-unicode-text-between-core-and-javascript)).

Note that ArangoDB's build of V8 has pointer compression disabled to allow for
more than 4 GB of heap memory.

The V8 upgrade brings various language features to JavaScript contexts in
ArangoDB, like arangosh and Foxx. These features are part of the ECMAScript
specifications ES2020 through ES2024. The following list is non-exhaustive:

- Optional chaining, like `obj.foo?.bar?.length` to easily access an object
  property or call a function but stop evaluating the expression as soon as the
  value is `undefined` or `null` and return `undefined` instead of throwing an error

- Nullish coalescing operator, like `foo ?? bar` to evaluate to the value of `bar`
  if `foo` is `null` or `undefined`, otherwise to the value of `foo`

- Return the array element at the given index, allowing positive as well as
  negative integer values, like `[1,2,3].at(-1)`

- Copying versions of the array methods `reverse()`, `sort()`, and `splice()`
  that perform in-place operations, and a copying version of the bracket notation
  for changing the value at a given index
  - Return a new array with the elements in reverse order, like `[1,2,3].toReversed()`
  - Return a new array with the elements sorted in ascending order, like `[2,3,1].toSorted()`
  - Return a new array with elements removed and optionally inserted at a given
    index, like `[1,2,3,4].toSpliced(1,2,"new", "items")`
  - Return a new array with one element replaced at a given index, allowing
    positive and negative integer values, like `[1,2,3,4].with(-2, "three")`

- Find array elements from the end with `findLast()` and `findLastIndex()`, like
  `[1,2,3,4].findLast(v => v % 2 == 1)`

- Return a new string with all matches of a pattern replaced with a provided value,
  not requiring a regular expression, like `"foo bar foo".replaceAll("foo", "baz")`

- If the `matchAll()` method of a string is used with a regular expression that
  misses the global `g` flag, an error is thrown

- A new regular expression flag `d` to include capture group start and end indices,
  like `/f(o+)/d.exec("foobar").indices[1]`

- A new regular expression flag `v` to enable the Unicode sets mode, like
  `/^\p{RGI_Emoji}$/v.test("👨🏾‍⚕️")` or `/[\p{Script_Extensions=Greek}--[α-γ]]/v.test('β')`

- A static method to check whether an object directly defines a property, like
  `Object.hasOwn({ foo: 42 }, "toString")`, superseding
  `Object.prototype.hasOwnProperty.call(…)`

- `Object.groupBy()` and `Map.groupBy()` to group the elements of an iterable
  according to the string values returned by a provided callback function

- Logical assignment operators `&&=`, `||=`, `??=`

- Private properties that cannot be referenced outside of the class,
  like `class P { #privField = 42; #privMethod() { } }`

- Static initialization blocks in classes that run when the class itself is
  evaluated, like `class S { static { console.log("init block") } }`

- `WeakRef` to hold a weak reference to another object, without preventing that
  object from getting garbage-collected

- A `cause` property for Error instances to indicate the original cause of the error

- Extended internationalization APIs. Examples:

  ```js
  let egyptLocale = new Intl.Locale("ar-EG")
  egyptLocale.numberingSystems // [ "arab" ]
  egyptLocale.calendars  // [ "gregory", "coptic", "islamic", "islamic-civil", "islamic-tbla" ]
  egyptLocale.hourCycles // [ "hc12" ]
  egyptLocale.timeZones  // [ "Africa/Cairo" ]
  egyptLocale.textInfo   // { "direction": "rtl" }
  egyptLocale.weekInfo   // { "firstDay": 6, "weekend" : [5, 6], "minimalDays": 1 }

  Intl.supportedValuesOf("collation"); // [ "compat", "emoji", "eor", "phonebk", ... ]
  Intl.supportedValuesOf("calendar"); // [ "buddhist", "chinese", "coptic", "dangi", ... ]
  // Other supported values: "currency", "numberingSystem", "timeZone", "unit"

  let germanLocale = new Intl.Locale("de")
  germanLocale.collations // [ "emoji", "eor", "phonebk" ]
  germanLocale.weekInfo   // { "firstDay": 1, "weekend" : [6, 7], "minimalDays": 4 }

  let ukrainianCalendarNames = new Intl.DisplayNames(["uk"], { type: "calendar" })
  ukrainianCalendarNames.of("buddhist") // "буддійський календар"

  let frenchDateTimeFieldNames = new Intl.DisplayNames(["fr"], { type: "dateTimeField" })
  frenchDateTimeFieldNames.of("day") // "jour"

  let japaneseDialectLangNames = new Intl.DisplayNames(["ja"], { type: "language" })
  let japaneseStandardLangNames = new Intl.DisplayNames(["ja"], { type: "language", languageDisplay: "standard" })
  japaneseDialectLangNames.of('en-US')  // "アメリカ英語"
  japaneseDialectLangNames.of('en-GB')  // "イギリス英語"
  japaneseStandardLangNames.of('en-US') // "英語 (アメリカ合衆国)"
  japaneseStandardLangNames.of('en-GB') // "英語 (イギリス)"

  let americanDateTimeFormat = new Intl.DateTimeFormat("en-US", { timeZoneName: "longGeneric" })
  americanDateTimeFormat.formatRange(new Date(0), new Date()) // e.g. with a German local time:
  // "1/1/1970, Central European Standard Time – 1/16/2024, Central European Time"
  
  let swedishCurrencyNames = new Intl.DisplayNames(["sv"], { type: "currency" })
  swedishCurrencyNames.of("TZS") // "tanzanisk shilling"

  let americanNumberFormat = new Intl.NumberFormat("en-US", {
    style: "currency", currency: "EUR", maximumFractionDigits: 0 })
  americanNumberFormat.formatRange(1.5, 10) // "€2 – €10"

  let welshPluralRules = new Intl.PluralRules("cy")
  welshPluralRules.selectRange(1, 3) // "few"
  ```

### Active AQL query cursors metric

The `arangodb_aql_cursors_active` metric has been added and shows the number
of active AQL query cursors.

AQL query cursors are created for queries that produce more results than
specified in the `batchSize` query option (default value: `1000`). Such results
can be fetched incrementally by client operations in chunks.
As it is unclear if and when a client will fetch any remaining data from a
cursor, every cursor has a server-side timeout value (TTL) after which it is
considered inactive and garbage-collected.

### Per-collection compaction in cluster

The `PUT /_api/collection/{collection-name}/compact` endpoint of the HTTP API
can now be used to start the compaction for a specific collection in cluster
deployments. This feature was previously available for single servers only.

### RocksDB .sst file partitioning (experimental)

The following experimental startup options for RockDB .sst file partitioning
have been added:

- `--rocksdb.partition-files-for-documents`
- `--rocksdb.partition-files-for-primary-index`
- `--rocksdb.partition-files-for-edge-index`
- `--rocksdb.partition-files-for-persistent-index`

Enabling any of these options makes RocksDB's compaction write the 
data for different collections/shards/indexes into different .sst files. 
Otherwise, the document data from different collections/shards/indexes 
can be mixed and written into the same .sst files.

When these options are enabled, the RocksDB compaction is more efficient since
a lot of different collections/shards/indexes are written to in parallel.
The disadvantage of enabling these options is that there can be more .sst
files than when the option is turned off, and the disk space used by
these .sst files can be higher.
In particular, on deployments with many collections/shards/indexes
this can lead to a very high number of .sst files, with the potential
of outgrowing the maximum number of file descriptors the ArangoDB process 
can open. Thus, these options should only be enabled on deployments with a
limited number of collections/shards/indexes.

### ArangoSearch file descriptor metric

The following metric has been added:

- `arangodb_search_file_descriptors`:
  Current count of opened file descriptors for an ArangoSearch index.

### More instant Hot Backups

<small>Introduced in: v3.10.10, v3.11.3</small>

Cluster deployments no longer wait for all in-progress transactions to get
committed when a user requests a Hot Backup. The waiting could cause deadlocks
and thus Hot Backups to fail, in particular in ArangoGraph. Now, Hot Backups are
created immediately and commits have to wait until the backup process is done.

### In-memory edge cache startup options and metrics

<small>Introduced in: v3.11.4</small>

The following startup options have been added:

- `--cache.max-spare-memory-usage`: the maximum memory usage for spare tables
  in the in-memory cache.

- `--cache.high-water-multiplier`: controls the cache's effective memory usage
  limit. The user-defined memory limit (i.e. `--cache.size`) is multiplied with
  this value to create the effective memory limit, from which on the cache tries
  to free up memory by evicting the oldest entries. The default value is `0.56`,
  matching the previously hardcoded 56% for the cache subsystem.

  You can increase the multiplier to make the cache subsystem use more memory, but
  this may overcommit memory because the cache memory reclamation procedure is
  asynchronous and can run in parallel to other tasks that insert new data.
  In case a deployment's memory usage is already close to the maximum, increasing
  the multiplier can lead to out-of-memory (OOM) kills.

The following metrics have been added:

| Label | Description |
|:------|:------------|
| `rocksdb_cache_edge_compressed_inserts_total` | Total number of compressed inserts into the in-memory edge cache. |
| `rocksdb_cache_edge_empty_inserts_total` | Total number of insertions into the in-memory edge cache for non-connected edges. |
| `rocksdb_cache_edge_inserts_total` | Total number of insertions into the in-memory edge cache. |

### Observability of in-memory cache subsystem

<small>Introduced in: v3.10.11, v3.11.4</small>

The following metrics have been added to improve the observability of the in-memory
cache subsystem:
- `rocksdb_cache_free_memory_tasks_total`: Total number of free memory tasks
  that were scheduled by the in-memory edge cache subsystem. This metric will
  be increased whenever the cache subsystem schedules a task to free up memory
  in one of the managed in-memory caches. It is expected to see this metric
  rising when the cache subsystem hits its global memory budget.
- `rocksdb_cache_free_memory_tasks_duration_total`: Total amount of time spent
  inside the free memory tasks of the in-memory cache subsystem. Free memory
  tasks are scheduled by the cache subsystem to free up memory in existing cache
  hash tables.
- `rocksdb_cache_migrate_tasks_total`: Total number of migrate tasks that were
  scheduled by the in-memory edge cache subsystem. This metric will be increased 
  whenever the cache subsystem schedules a task to migrate an existing cache hash
  table to a bigger or smaller size.
- `rocksdb_cache_migrate_tasks_duration_total`: Total amount of time spent inside
  the migrate tasks of the in-memory cache subsystem. Migrate tasks are scheduled
  by the cache subsystem to migrate existing cache hash tables to a bigger or
  smaller table.

### Detached scheduler threads

<small>Introduced in: v3.10.13, v3.11.5</small>

A scheduler thread now has the capability to detach itself from the scheduler
if it observes the need to perform a potentially long running task, like waiting
for a lock. This allows a new scheduler thread to be started and prevents
scenarios where all threads are blocked waiting for a lock, which has previously
led to deadlock situations. From v3.12.1 onward, coroutines are used instead of
detaching threads as the underlying mechanism.

Threads waiting for more than 1 second on a collection lock will detach
themselves.

The following startup option has been added:
- `--server.max-number-detached-threads`: The maximum number of detached scheduler
  threads. Note that this startup option is **deprecated** from v3.12.1 onward
  because a different mechanism than detaching is used, obsoleting the option
  and no longer having an effect.

The following metric as been added:
- `arangodb_scheduler_num_detached_threads`: The number of worker threads
  currently started and detached from the scheduler. 

### Monitoring per collection/database/user

<small>Introduced in: v3.10.13, v3.11.7</small>

The following metrics have been introduced to track per-shard requests on
DB-Servers:
- `arangodb_collection_leader_reads_total`: The number of read requests on 
  leaders, per shard, and optionally also split by user.
- `arangodb_collection_leader_writes_total`: The number of write requests on
  leaders, per shard, and optionally also split by user.
- `arangodb_collection_requests_bytes_read_total`: The number of bytes read in
  read requests on leaders.
- `arangodb_collection_requests_bytes_written_total`: The number of bytes written
  in write requests on leaders and followers.  

To opt into these metrics, you can use the new `--server.export-shard-usage-metrics`
startup option. It can be set to one of the following values on DB-Servers:
- `disabled`: No shard usage metrics are recorded nor exported. This is the
  default value.
- `enabled-per-shard`: This makes DB-Servers collect per-shard usage metrics.
- `enabled-per-shard-per-user`: This makes DB-Servers collect per-shard
  and per-user metrics. This is more granular than `enabled-per-shard` but
  can produce a lot of metrics.

Whenever a shard is accessed in read or write mode by one of the following 
operations, the metrics are populated dynamically, either with a per-user
label or not, depending on the above setting.
The metrics are retained in memory on DB-Servers. Removing databases,
collections, or users that are already included in the metrics won't remove
the metrics until the DB-Server is restarted.

The following operations increase the metrics:
- AQL queries: an AQL query increases the read or write counters exactly
  once for each involved shard. For shards that are accessed in read/write 
  mode, only the write counter is increased.
- Single-document insert, update, replace, and remove operations: for each
  such operation, the write counter is increased once for the affected
  shard.
- Multi-document insert, update, replace, and remove operations: for each
  such operation, the write counter is increased once for each shard
  that is affected by the operation. Note that this includes collection
  truncate operations.
- Single and multi-document read operations: for each such operation, the
  read counter is increased once for each shard that is affected by the
  operation.

The metrics are increased when any of the above operations start, and they
are not decreased should an operation abort or if an operation does not
lead to any actual reads or writes.

As there can be many of these dynamic metrics based on the number of shards
and/or users in the deployment, these metrics are turned off by default.
When turned on, the metrics are exposed only via the new
`GET /_admin/usage-metrics` endpoint. They are not exposed via the existing
metrics `GET /_admin/metrics` endpoint.

Note that internal operations, such as internal queries executed for statistics
gathering, internal garbage collection, and TTL index cleanup are not counted in
these metrics. Additionally, all requests that are using the superuser JWT for 
authentication and that do not have a specific user set are not counted.

Enabling these metrics can likely result in a small latency overhead of a few
percent for write operations. The exact overhead depends on
several factors, such as the type of operation (single or multi-document operation),
replication factor, network latency, etc.

### Compression for cluster-internal traffic

The following startup options have been added to optionally compress relevant
cluster-internal traffic:
- `--network.compression-method`: The compression method used for cluster-internal
  requests.
- `--network.compress-request-threshold`: The HTTP request body size from which on
  cluster-internal requests are transparently compressed.

If the `--network.compression-method` startup option is set to `none` (default), then no
compression is performed. To enable compression for cluster-internal requests,
you can set this option to either `deflate`, `gzip`, `lz4`, or `auto`.

The `deflate` and `gzip` compression methods are general purpose but can
have significant CPU overhead for performing the compression work.
The `lz4` compression method compresses slightly worse but has a lot lower
CPU overhead for performing the compression.
The `auto` compression method uses `deflate` by default and `lz4` for
requests that have a size that is at least 3 times the configured threshold
size.

The compression method only matters if `--network.compress-request-threshold`
is set to a value greater than zero. This option configures a threshold value
from which on the outgoing requests will be compressed. If the threshold is
set to a value of 0, then no compression is performed. If the threshold
is set to a value greater than 0, then the size of the request body is
compared against the threshold value, and compression happens if the
uncompressed request body size exceeds the threshold value.
The threshold can thus be used to avoid futile compression attempts for too
small requests.

Compression for all Agency traffic is disabled regardless of the settings
of these options.

### Read-only shards metric

<small>Introduced in: v3.12.1</small>

The following cluster health metric has been added:

| Label | Description |
|:------|:------------|
| `arangodb_vocbase_shards_read_only_by_write_concern` | Number of shards that are read-only due to an undercut of the write concern. |

### Log queue overwhelm metric

<small>Introduced in: v3.12.1</small>

The following metric has been added, indicating whether the log queue is
overwhelmed:

| Label | Description |
|:------|:------------|
| `arangodb_logger_messages_dropped_total` | Total number of dropped log messages. |

The related startup option for controlling the size of the log queue has a
default of `16384` instead of `10000` now.

### Scheduler dequeue time metrics

<small>Introduced in: v3.12.1</small>

The following scheduler metrics have been added, reporting how long it takes to
pick items from different job queues.

| Label | Description |
|:------|:------------|
| `arangodb_scheduler_high_prio_dequeue_hist` | Time required to take an item from the high priority queue. |
| `arangodb_scheduler_medium_prio_dequeue_hist` | Time required to take an item from the medium priority queue. |
| `arangodb_scheduler_low_prio_dequeue_hist` | Time required to take an item from the low priority queue. |
| `arangodb_scheduler_maintenance_prio_dequeue_hist` | Time required to take an item from the maintenance priority queue. |

### Option to skip fast lock round for Stream Transactions

<small>Introduced in: v3.12.1</small>

A `skipFastLockRound` option has been added to let you disable the fast lock
round for Stream Transactions. The option defaults to `false` so that
fast locking is tried.

Disabling the fast lock round is not necessary unless there are many concurrent
Stream Transactions queued that all try to lock the same collection exclusively.
In this case, the fast locking is subpar because exclusive locks will prevent it
from succeeding. Skipping the fast locking makes each actual locking operation
take longer than with fast locking but it guarantees a deterministic locking order.
This avoids deadlocking and retrying which can occur with the fast locking.
Overall, skipping the fast lock round can be faster in this scenario.

The fast lock round should not be skipped for read-only Stream Transactions as
it degrades performance if there are no concurrent transactions that use
exclusive locks on the same collection.

See the [JavaScript API](../../develop/transactions/stream-transactions.md#javascript-api)
and the [HTTP API](../../develop/http-api/transactions/stream-transactions.md#begin-a-stream-transaction)
for details.

### Individual log levels per log output

<small>Introduced in: v3.12.2</small>

You can now configure the log level for each log topic per log output. You can
use this feature to log verbosely to a file but print less information in the
command-line, for instance.

The repeatable `--log.level` startup option lets you set the log levels for
log topics as before. You can now additionally specify the levels for individual
topics in `--log.output` by appending a semicolon and a comma-separated mapping
of log topics and levels after the destination to override the `--log.level`
configuration:

```sh
--log.level memory=warning
--log.output "file:///path/to/file;queries=trace,requests=info"
--log.output "-;all=error"
```

This sets the log level to `warning` for the `memory` topic, which applies to
all outputs unless overridden. The first output is a file with verbose `trace`
logging for the `queries` topic, `info`-level logging for `requests`,
`warning`-level logging for `memory`, and default levels for all other topics.
The second output is to the standard output (command-line), using the `all`
pseudo-topic to set the log levels to `error` for all topics. 

Furthermore, the [HTTP API](../../develop/http-api/monitoring/logs.md#get-the-server-log-levels)
has been extended to let you query and set the log levels for individual outputs
at runtime.

### Lost subordinate transactions metric

<small>Introduced in: v3.12.4</small>

The following metric about partially committed or aborted transactions on
DB-Servers in a cluster has been added:

| Label | Description |
|:------|:------------|
| `arangodb_vocbase_transactions_lost_subordinates_total` | Counts the number of lost subordinate transactions on database servers. |

### API call recording

<small>Introduced in: v3.12.5</small>

A new `/_admin/server/api-calls` endpoint has been added to let you retrieve a
list of the most recent requests with a timestamp and the endpoint. This feature
is for debugging purposes.

You can configure the memory limit for this feature with the following startup option:

- `--server.api-recording-memory-limit`:
  Size limit for the list of API call records (default: `25600000`).

This means that 25 MB of memory is reserved by default.

API call recording is enabled by default but you can disable it via the new
`--server.api-call-recording` startup option.

The `/_admin/server/api-calls` endpoint exposes the recorded API calls.
It is enabled by default. You can disable it altogether by setting the new
`--log.recording-api-enabled` startup option to `false`.

A metric has been added for the time spent on API call recording to track the
impact of this feature:

| Label | Description |
|:------|:------------|
| `arangodb_api_recording_call_time` | Execution time histogram for API recording calls in nanoseconds. |

See [HTTP interface for server logs](../../develop/http-api/monitoring/logs.md#get-recent-api-calls)
for details.

### Access tokens

<small>Introduced in: v3.12.5</small>

A new authentication feature has been added that lets you use access tokens
for either creating JWT session tokens or directly authenticate with an
access token instead of a password.

You can create multiple access tokens for a single user account, set expiration
dates, and individually revoke tokens.

See the [HTTP API](../../develop/http-api/authentication.md#access-tokens)
documentation.

## Client tools

### Protocol aliases for endpoints

You can now use `http://` and `https://` as aliases for `tcp://` and `ssl://`
in the `--server.endpoint` startup option with all client tools.

### arangodump

#### `--ignore-collection` startup option

_arangodump_ now supports a `--ignore-collection` startup option that you can
specify multiple times to exclude the specified collections from a dump.

It cannot be used together with the existing `--collection` option for specifying
collections to include.

#### Improved dump performance and size

_arangodump_ has extended parallelization capabilities
to work not only at the collection level, but also at the shard level.
In combination with the newly added support for the VelocyPack format that
ArangoDB uses internally, database dumps can now be created and restored more
quickly and occupy less disk space. This major performance boost makes dumps and
restores up to several times faster, which is extremely useful when dealing
with large shards.

- Whether the new parallel dump variant is used is controlled by the newly added
  `--use-parallel-dump` startup option. The default value is `true`.

- To achieve the best dump performance and the smallest data dumps in terms of
  size, you can additionally use the `--dump-vpack` option. The resulting dump data
  is then stored in the more compact but binary VelocyPack format instead of the
  text-based JSON format. The output file size can be less even compared to
  compressed JSON. It can also lead to faster dumps because there is less data to
  transfer and no conversion from the server-internal format (VelocyPack) to JSON
  is needed. Note, however, that this option is **experimental** and disabled by
  default.

- Optionally, you can make _arangodump_ write multiple output files per
  collection/shard. The file splitting allows for better parallelization when
  writing the results to disk, which in case of non-split files must be serialized.
  You can enable it by setting the `--split-files` option to `true`. This option
  is disabled by default because dumps created with this option enabled cannot
  be restored into previous versions of ArangoDB.

- You can enable the new `--compress-transfer` startup option for compressing the
  dump data on the server for a faster transfer. This is helpful especially if
  the network is slow or its capacity is maxed out. The data is decompressed on
  the client side and recompressed if you enable the  `--compress-output` option.

#### Server-side resource usage limits and metrics

The following `arangod` startup options can be used to limit
the resource usage of parallel _arangodump_ invocations:

- `--dump.max-memory-usage`: Maximum memory usage (in bytes) to be
  used by the server-side parts of all ongoing _arangodump_ invocations.
  This option can be used to limit the amount of memory for prefetching
  and keeping results on the server side when _arangodump_ is invoked
  with the `--parallel-dump` option. It does not have an effect for
  _arangodump_ invocations that did not use the `--parallel-dump` option.
  Note that the memory usage limit is not exact and that it can be
  slightly exceeded in some situations to guarantee progress.
- -`-dump.max-docs-per-batch`: Maximum number of documents per batch
  that can be used in a dump. If an _arangodump_ invocation requests
  higher values than configured here, the value is automatically
  capped to this value. Will only be followed for _arangodump_ invocations
  that use the `--parallel-dump` option.
- `--dump.max-batch-size`: Maximum batch size value (in bytes) that
  can be used in a dump. If an _arangodump_ invocation requests larger
  batch sizes than configured here, the actual batch sizes is capped
  to this value. Will only be followed for _arangodump_ invocations that
  use the -`-parallel-dump` option.
- `--dump.max-parallelism`: Maximum parallelism (number of server-side
  threads) that can be used in a dump. If an _arangodump_ invocation requests
  a higher number of prefetch threads than configured here, the actual
  number of server-side prefetch threads is capped to this value.
  Will only be followed for _arangodump_ invocations that use the
  `--parallel-dump` option.

The following metrics have been added to observe the behavior of parallel
_arangodump_ operations on the server:

- `arangodb_dump_memory_usage`: Current memory usage of all ongoing
  _arangodump_ operations on the server.
- `arangodb_dump_ongoing`: Number of currently ongoing _arangodump_
  operations on the server.
- `arangodb_dump_threads_blocked_total`: Number of times a server-side
  dump thread was blocked because it honored the server-side memory
  limit for dumps.

#### Automatic retries

<small>Introduced in: v3.12.1</small>

_arangodump_ retries dump requests to the server in more cases: read, write and
connection errors. This makes the creation of dumps more likely to succeed
despite any temporary errors that can occur.

### arangorestore

The following startup option has been added that allows _arangorestore_ to override
the `writeConcern` value specified in a database dump when creating new
collections:

- `--write-concern`: Override the `writeConcern` value for collections.
  Can be specified multiple times, e.g. `--write-concern 2 --write-concern myCollection=3`
  to set the write concern for the collection called `myCollection` to 3 and
  for all other collections to 2.

### arangoimport

#### Maximum number of import errors

The following startup option has been added to _arangoimport_:

- `--max-errors`: The maximum number of errors after which the import is stopped.
  The default value is `20`.

You can use this option to limit the amount of errors displayed by _arangoimport_,
and to abort the import after this value has been reached.

#### Automatic file format detection

The default value for the `--type` startup option has been changed from `json`
to `auto`. *arangoimport* now automatically detects the type of the import file
based on the file extension.

The following file extensions are automatically detected:
- `.json`
- `.jsonl`
- `.csv`
- `.tsv`

If the file extension doesn't correspond to any of the mentioned types, the
import defaults to the `json` format.

### Transparent compression of requests and responses

Startup options to enable transparent compression of the data that is sent
between a client tool and the ArangoDB server have been added. See the
[Server options](#transparent-compression-of-requests-and-responses-between-arangodb-servers-and-client-tools)
section above that includes a description of the added client tool options.

## Internal changes

### Upgraded bundled library versions

For ArangoDB 3.12, the bundled version of rclone is 1.65.2. Check if your
rclone configuration files require changes.

The bundled version of the OpenSSL library has been upgraded to 3.2.1.

From version 3.11.10 onward, ArangoDB uses the glibc C standard library
implementation with an LGPL-3.0 license instead of libmusl. Notably, it features
string functions that are better optimized for common CPUs.
