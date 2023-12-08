---
title: Optimizing View and inverted index query performance
menuTitle: Performance
weight: 75
description: >-
  You can improve the performance of View and inverted index queries with a
  primary sort order, stored values and other optimizations
archetype: default
---
## Primary Sort Order

Inverted indexes and `arangosearch` Views can have a primary sort order.
A direction can be specified upon their creation for each uniquely named
attribute (ascending or descending), to enable an optimization for AQL
queries which iterate over a collection or View and sort by one or multiple of the
indexed attributes. If the field(s) and the sorting direction(s) match, then the
data can be read directly from the index without actual sort operation.

{{< tabs "view-definition">}}

{{< tab "`search-alias` View" >}}
You can define a primary sort order when creating inverted indexes and utilize it
using inverted indexes standalone or via `search-alias` Views.

Definition of an inverted index with a `primarySort` property:

```js
db.coll.ensureIndex({
  name: "inv-idx",
  type: "inverted",
  fields: ["text", "date"],
  primarySort: {
    fields: [
      { field: "date", direction: "desc" }
    ]
  }
});
```

AQL query example:

```aql
FOR doc IN coll OPTIONS { indexHint: "inv-idx", forceIndexHint: true }
  SORT doc.date DESC
  RETURN doc
```

Execution plan **without** a sorted index being used:

```aql
Execution plan:
 Id   NodeType                  Est.   Comment
  1   SingletonNode                1   * ROOT
  2   EnumerateCollectionNode      0     - FOR doc IN coll   /* full collection scan  */
  3   CalculationNode              0       - LET #1 = doc.`date`   /* attribute expression */   /* collections used: doc : coll */
  4   SortNode                     0       - SORT #1 DESC   /* sorting strategy: standard */
  5   ReturnNode                   0       - RETURN doc
```

Execution plan with a the primary sort order of the index being utilized:

```aql
Execution plan:
 Id   NodeType        Est.   Comment
  1   SingletonNode      1   * ROOT
  6   IndexNode          0     - FOR doc IN coll   /* reverse inverted index scan, index scan + document lookup */
  5   ReturnNode         0       - RETURN doc
```

You can add the inverted index to a `search-alias` View. Queries against the
View can benefit from the primary sort order, too:

```js
db._createView("viewName", "search-alias", { indexes: [
  { collection: "coll", index: "inv-idx" }
] });

db._query(`FOR doc IN viewName
  SORT doc.date DESC
  RETURN doc`);
```

To define more than one attribute to sort by, use multiple sub-objects in the
the `primarySort` array:

```js
db.coll.ensureIndex({
  name: "inv-idx",
  type: "inverted",
  fields: ["text", "date"],
  primarySort: {
    fields: [
      { field: "date", direction: "desc" },
      { field: "text", direction: "asc" }
    ]
  }
});
```

{{< info >}}
If you mix directions in the primary sort order, the inverted index cannot be
utilized for fully optimizing out a matching `SORT` operation if you use the
inverted index standalone.
{{< /info >}}

{{< /tab >}}

{{< tab "`arangosearch` View" >}}

{{< youtube id="bKeKzexInm0" >}}

```json
{
  "links": {
    "coll1": {
      "fields": {
        "text": {}
      }
    },
    "coll2": {
      "fields": {
        "text": {}
      }
    },
    "primarySort": [
      {
        "field": "date",
        "direction": "desc"
      }
    ]
  }
}
```

You can only set the `primarySort` option and the related
`primarySortCompression` and `primarySortCache` options on View creation.

AQL query example:

```aql
FOR doc IN viewName
  SORT doc.date DESC
  RETURN doc
```

Execution plan **without** a sorted index being used:

```aql
Execution plan:
 Id   NodeType            Est.   Comment
  1   SingletonNode          1   * ROOT
  2   EnumerateViewNode      1     - FOR doc IN viewName   /* view query */
  3   CalculationNode        1       - LET #1 = doc.`date`   /* attribute expression */
  4   SortNode               1       - SORT #1 DESC   /* sorting strategy: standard */
  5   ReturnNode             1       - RETURN doc
```

Execution plan with a the primary sort order of the index being utilized:

```aql
Execution plan:
 Id   NodeType            Est.   Comment
  1   SingletonNode          1   * ROOT
  2   EnumerateViewNode      1     - FOR doc IN viewName SORT doc.`date` DESC   /* view query */
  5   ReturnNode             1       - RETURN doc
```

To define more than one attribute to sort by, use multiple sub-objects in the
the `primarySort` array:

```json
{
  "links": {
    "coll1": {
      "fields": {
        "text": {}
      }
    },
    "coll2": {
      "fields": {
        "text": {}
      }
    },
    "primarySort": [
      {
        "field": "date",
        "direction": "desc"
      },
      {
        "field": "text",
        "direction": "asc"
      }
    ]
  }
}
```
{{< /tab >}}

{{< /tabs >}}

The optimization can be applied to queries which sort by both fields as
defined (`SORT doc.date DESC, doc.name`), but also if they sort in descending
order by the `date` attribute only (`SORT doc.date DESC`). Queries which sort
by `text` alone (`SORT doc.name`) are not eligible, because the index is sorted
by `date` first. This is similar to persistent indexes, but inverted sorting
directions are not covered by the View index
(e.g. `SORT doc.date, doc.name DESC`).

You can disable the **primary sort compression** on View or index creation to
trade space for speed. The primary sort data is LZ4-compressed by default (`"lz4"`).

- `arangosearch` Views: `primarySortCompression: "none"`
- Inverted indexes: `primarySort: { compression: "none" }` 

You can additionally enable the **primary sort cache** to always cache the primary
sort columns in memory, which can improve the query performance.

{{< tabs "view-definition">}}

{{< tab "`search-alias` View" >}}
For inverted indexes, set the `cache` option of the
[`primarySort` property](../../develop/http-api/indexes/inverted.md) to `true`.

```js
db.coll.ensureIndex({
  name: "inv-idx",
  type: "inverted",
  fields: ["text", "date"],
  primarySort: {
    fields: [
      { field: "date", direction: "desc" },
      { field: "text", direction: "asc" }
    ],
    cache: true
  }
});

db._createView("myView", "search-alias", { indexes: [
  { collection: "coll", index: "inv-idx" }
] });
```
{{< /tab >}}

{{< tab "`arangosearch` View" >}}
Set the [`primarySortCache` View property](arangosearch-views-reference.md#view-properties)
to `true`.

```json
{
  "links": {
    "coll1": {
      "fields": {
        "text": {},
        "date": {}
      }
    },
    "coll2": {
      "fields": {
        "text": {}
      }
    },
    "primarySort": [
      {
        "field": "date",
        "direction": "desc"
      },
      {
        "field": "text",
        "direction": "asc"
      }
    ],
    "primarySortCache": true
  }
}
```
{{< /tab >}}

{{< /tabs >}}

## Stored Values

It is possible to directly store the values of document attributes in
`arangosearch` View indexes and inverted indexes with the `storedValues`
property (not to be confused with `storeValues`). You can only set this
option on View and index creation.

View indexes and inverted indexes may fully cover search queries by using
stored values, improving the query performance.
While late document materialization reduces the amount of fetched documents,
this optimization can avoid to access the storage engine entirely.

{{< tabs "view-definition">}}

{{< tab "`search-alias` View" >}}
```js
db.articles.ensureIndex({
  name: "inv-idx",
  type: "inverted",
  fields: ["categories[*]"],
  primarySort: {
    fields: [
      { field: "publishedAt", direction: "desc" }
    ]
  },
  storedValues: [
    {
      fields: [ "title", "categories" ]
    }
  ]
});

db._createView("articlesView", "search-alias", { indexes: [
  { collection: "articles", index: "inv-idx" }
] });
```
{{< /tab >}}

{{< tab "`arangosearch` View" >}}
```json
{
  "links": {
    "articles": {
      "fields": {
        "categories": {}
      }
    }
  },
  "primarySort": [
    { "field": "publishedAt", "direction": "desc" }
  ],
  "storedValues": [
    { "fields": [ "title", "categories" ] }
  ]
}
```
{{< /tab >}}

{{< /tabs >}}

In above View definitions, the document attribute `categories` is indexed for
searching, `publishedAt` is used as primary sort order, and `title` as well as
`categories` are stored in the index using the new `storedValues` property.

```aql
FOR doc IN articlesView
  SEARCH doc.categories == "recipes"
  SORT doc.publishedAt DESC
  RETURN {
    title: doc.title,
    date: doc.publishedAt,
    tags: doc.categories
  }
```

The query searches for articles which contain a certain tag in the `categories`
array and returns title, date and tags. All three values are stored in the View
(`publishedAt` via `primarySort` and the two other via `storedValues`), thus
no documents need to be fetched from the storage engine to answer the query.
This is shown in the execution plan as a comment to the `EnumerateViewNode`:
`/* view query without materialization */`

```aql
Execution plan:
 Id   NodeType            Est.   Comment
  1   SingletonNode          1   * ROOT
  2   EnumerateViewNode      1     - FOR doc IN articlesView SEARCH (doc.`categories` == "recipes") SORT doc.`publishedAt` DESC LET #1 = doc.`publishedAt` LET #7 = doc.`categories` LET #5 = doc.`title`   /* view query without materialization */
  5   CalculationNode        1       - LET #3 = { "title" : #5, "date" : #1, "tags" : #7 }   /* simple expression */
  6   ReturnNode             1       - RETURN #3

Indexes used:
 none

Optimization rules applied:
 Id   RuleName
  1   move-calculations-up
  2   move-calculations-up-2
  3   handle-arangosearch-views
```

The stored values data is LZ4-compressed by default (`"lz4"`).
Set it to `"none"` on View or index creation to trade space for speed.

{{< tabs "view-definition">}}

{{< tab "`search-alias` View" >}}
```js
db.articles.ensureIndex({
  name: "inv-idx",
  type: "inverted",
  fields: ["categories[*]"],
  primarySort: {
    fields: [
      { field: "publishedAt", direction: "desc" }
    ]
  },
  storedValues: [
    {
      fields: [ "title", "categories"],
      compression: "none"
    }
  ]
});

db._createView("articlesView", "search-alias", { indexes: [
  { collection: "articles", index: "inv-idx" }
] });
```
{{< /tab >}}

{{< tab "`arangosearch` View" >}}
```json
{
  "links": {
    "articles": {
      "fields": {
        "categories": {}
      }
    }
  },
  "primarySort": [
    { "field": "publishedAt", "direction": "desc" }
  ],
  "storedValues": [
    { "fields": [ "title", "categories" ], "compression": "none" }
  ]
}
```
{{< /tab >}}

{{< /tabs >}}

You can additionally enable the ArangoSearch column cache for stored values by
setting the `cache` option in the `storedValues` definition of
`arangosearch` Views or inverted indexes to `true`. This always caches
stored values in memory, which can improve the query performance.

{{< tabs "view-definition">}}

{{< tab "`search-alias` View" >}}
```js
db.articles.ensureIndex({
  name: "inv-idx",
  type: "inverted",
  fields: ["categories[*]"],
  primarySort: {
    fields: [
      { field: "publishedAt", direction: "desc" }
    ]
  },
  storedValues: [
    {
      fields: [ "title", "categories"],
      cache: true
    }
  ]
});

db._createView("articlesView", "search-alias", { indexes: [
  { collection: "articles", index: "inv-idx" }
] });
```

See the [inverted index `storedValues` property](../../develop/http-api/indexes/inverted.md)
for details.
{{< /tab >}}

{{< tab "`arangosearch` View" >}}
```json
{
  "links": {
    "articles": {
      "fields": {
        "categories": {}
      }
    }
  },
  "primarySort": [
    { "field": "publishedAt", "direction": "desc" }
  ],
  "storedValues": [
    { "fields": [ "title", "categories" ], "cache": true }
  ]
}
```

See the [`storedValues` View property](arangosearch-views-reference.md#view-properties)
for details.
{{< /tab >}}

{{< /tabs >}}

## Condition Optimization Options

The `SEARCH` operation in AQL accepts an option `conditionOptimization` to
give you control over the search criteria optimization:

```aql
FOR doc IN myView
  SEARCH doc.val > 10 AND doc.val > 5 /* more conditions */
  OPTIONS { conditionOptimization: "none" }
  RETURN doc
```

By default, all conditions get converted into disjunctive normal form (DNF).
Numerous optimizations can be applied, like removing redundant or overlapping
conditions (such as `doc.val > 10` which is included by `doc.val > 5`).
However, converting to DNF and optimizing the conditions can take quite some
time even for a low number of nested conditions which produce dozens of
conjunctions / disjunctions. It can be faster to just search the index without
optimizations.

Also see the [`SEARCH` operation](../../aql/high-level-operations/search.md#search-options).

## Count Approximation

The `SEARCH` operation in AQL accepts an option `countApproximate` to control
how the total count of rows is calculated if the `fullCount` option is enabled
for a query or when a `COLLECT WITH COUNT` clause is executed.

By default, rows are actually enumerated for a precise count. In some cases, an
estimate might be good enough, however. You can set `countApproximate` to
`"cost"` for a cost-based approximation. It does not enumerate rows and returns
an approximate result with O(1) complexity. It gives a precise result if the
`SEARCH` condition is empty or if it contains a single term query only
(e.g. `SEARCH doc.field == "value"`), the usual eventual consistency
of Views aside.

```aql
FOR doc IN viewName
  SEARCH doc.name == "Carol"
  OPTIONS { countApproximate: "cost" }
  COLLECT WITH COUNT INTO count
  RETURN count
```

Also see [Faceted Search with ArangoSearch](faceted-search.md).

## Field normalization value caching and caching of Geo Analyzer auxiliary data

{{< tag "ArangoDB Enterprise Edition" "ArangoGraph" >}}

<small>Introduced in: v3.9.5, v3.10.2</small>

Normalization values are computed for fields which are processed with Analyzers
that have the [`"norm"` feature](../analyzers.md#analyzer-features) enabled.
These values are used to score fairer if the same tokens occur repeatedly, to
emphasize these documents less.

You can set the `cache` option to `true` for individual View links or fields of
`arangosearch` Views, as well as for inverted indexes as the default or for
specific fields, to always cache the field normalization values in memory.
This can improve the performance of scoring and ranking queries.

You can also enable this option to always cache auxiliary data used for querying
fields that are indexed with Geo Analyzers in memory, as the default or for
specific fields. This can improve the performance of geo-spatial queries.

{{< tabs "view-definition">}}

{{< tab "`search-alias` View" >}}
```js
db.coll1.ensureIndex({
  name: "inv-idx",
  type: "inverted",
  fields: [
    {
      name: "attr",
      analyzer: "text_en",
      cache: true
    }
  ]
});

db.coll2.ensureIndex({
  name: "inv-idx",
  type: "inverted",
  analyzer: "text_en",
  fields: ["attr1", "attr2"],
  cache: true
});

db._createView("myView", "search-alias", { indexes: [
  { collection: "coll1", index: "inv-idx" },
  { collection: "coll2", index: "inv-idx" }
] });
```

See the [inverted index `cache` property](../../develop/http-api/indexes/inverted.md) for details.
{{< /tab >}}

{{< tab "`arangosearch` View" >}}
```json
{
  "links": {
    "coll1": {
      "fields": {
        "attr": {
          "analyzers": ["text_en"],
          "cache": true
        }
      }
    },
    "coll2": {
      "includeAllFields": true,
      "analyzers": ["text_en"],
      "cache": true
    }
  }
}
```

See the [`cache` Link property](arangosearch-views-reference.md#link-properties)
for details.
{{< /tab >}}

{{< /tabs >}}

The `"norm"` Analyzer feature has performance implications even if the cache is
used. You can create custom Analyzers without this feature to disable the
normalization and improve the performance. Make sure that the result ranking
still matches your expectations without normalization. It is recommended to
use normalization for a good scoring behavior.

## Primary key caching

<small>Introduced in: v3.9.6, v3.10.2</small>

You can always cache the primary key columns in memory. This can improve the
performance of queries that return many documents, making it faster to map
document IDs in the index to actual documents.

{{< tabs "view-definition">}}

{{< tab "`search-alias` View" >}}
To enable this feature for inverted indexes and by extension `search-alias` Views,
set the [`primaryKeyCache` property](../../develop/http-api/indexes/inverted.md)
to `true` when creating inverted indexes.

```js
db.articles.ensureIndex({
  name: "inv-idx",
  type: "inverted",
  fields: ["categories[*]"],
  primaryKeyCache: true
});

db._createView("articlesView", "search-alias", { indexes: [
  { collection: "articles", index: "inv-idx" }
] });
```
{{< /tab >}}

{{< tab "`arangosearch` View" >}}
To enable this feature for `arangosearch` Views, set the
[`primaryKeyCache` View property](arangosearch-views-reference.md#view-properties)
to `true` on View creation.

```json
{
  "links": {
    "articles": {
      "fields": {
        "categories": {}
      }
    }
  },
  "primaryKeyCache": true
}
```
{{< /tab >}}

{{< /tabs >}}
