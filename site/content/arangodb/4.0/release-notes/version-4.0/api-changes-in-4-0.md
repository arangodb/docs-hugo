---
title: API Changes in ArangoDB 4.0
menuTitle: API changes in 4.0
weight: 20
description: >-
  A summary of the changes to the HTTP API and other interfaces that are relevant
  for developers, like maintainers of drivers and integrations for ArangoDB
---
## HTTP RESTful API

### Behavior changes

#### Version API

The `GET /_api/version` endpoint no longer includes the `mode` sub-attribute
under `details` when requesting the detailed version information. This is
due to the removal of the emergency console (`arangod --console`) and the
V8 JavaScript engine in general from the server-side.

#### Status API

The `GET /_admin/status` endpoint no longer includes the following attributes
due to the removal of Foxx microservices, the emergency console
(`arangod --console`), and the V8 JavaScript engine in general from the
server-side:

- `mode`
- `operationMode`
- `foxxApi`

### Privilege changes



### Endpoint return value changes



### Endpoints added



### Endpoints augmented



### Endpoints moved



### Endpoints deprecated



### Endpoints removed

#### Metrics API v2

Since ArangoDB v3.10.0, the `/_admin/metrics` and `/_admin/metrics/v2` endpoints
returned the same metrics. The redundant `/_admin/metrics/v2` endpoint has now
been removed.

#### Batch request API

<small>Removed in: v3.12.3</small>

The `/_api/batch` endpoints that let you send multiple operations in a single
HTTP request was deprecated in v3.8.0 and has now been removed.

To send multiple documents at once to an ArangoDB instance, please use the
[HTTP interface for documents](../../develop/http-api/documents.md#multiple-document-operations)
that can insert, update, replace, or remove arrays of documents.

## JavaScript API

### Removed collection methods

The following methods have been removed from
[_collection_ objects](../../develop/javascript-api/@arangodb/collection-object.md)
as they are either obsolete or didn't provide much value and better alternatives exist:

- `closedRange(name, left, right)`:

  Use an AQL query like this:

  ```js
  db._query(`FOR doc IN @@collection
    FILTER doc.@attribute >= @left && doc.@attribute <= @right
    RETURN doc`, { "@collection": "coll", attribute: "name", left: "bert", right: "emily" });
  ```

- `documents(keys)`:

  Use `document(keys)`, which also returns a list of documents but without
  wrapping it with `{ "documents": ... }`.

- `ensureFulltextIndex(field, minLength)`:

  The full-text index type has been removed. Use `inverted` indexes or
  ArangoSearch Views instead.

- `ensureGeoConstraint(lat, lon)`:

  Use `ensureIndex(description)` with a `geo` index type.

- `ensureGeoIndex(lat, lon)`:

  Use `ensureIndex(description)` with a `geo` index type.

- `ensureHashIndex(description)`:

  Use `ensureIndex(description)` with a `persistent` index type.

- `ensureSkiplist(description)`:

  Use `ensureIndex(description)` with a `persistent` index type.

- `ensureUniqueConstraint(description)`:

  Use `ensureIndex(description)` with a `persistent` index type and `unique`
  set to `true`.

- `ensureUniqueSkiplist(description)`

  Use `ensureIndex(description)` with a `persistent` index type and `unique`
  set to `true`.

- `fulltext(attribute, query)`:

  The full-text index type has been removed. Use `inverted` indexes or
  ArangoSearch Views instead. You can query them with AQL.

- `geo(loc, order)`:

  You can list the geo-spatial indexes of a collection with
  `indexes().filter(idx => idx.type === "geo")` and run geo-spatial
  queries with AQL.

- `iterate(iterator [, options])`:

  You can iterate over the documents of a collection in _arangosh_
  (on the client-side) like this if necessary:

  ```js
  var it = db.<coll>.all();
  while (it.hasNext()) {
    var doc = it.next();
    // ...
  }
  ```

  The original method also supported sampling a subset of documents, which you
  can do with AQL:

  ```aql
  FOR doc IN @@collection
    FILTER RAND() <= @probability
    LIMIT @limit
    RETURN doc
  ```

- `load()`:

  Obsolete, collections are always loaded.

- `lookupByKeys(keys)`

  Use `document(keys)`, which also returns a list of documents but without
  wrapping it with `{ "documents": ... }`.

- `near(lat, lon)`:

  Use an AQL query like this:

  ```js
  db._query(`FOR doc IN @@collection
    SORT DISTANCE(doc.latitude, doc.longitude, @latitude, @longitude) ASC
    RETURN doc`, { "@collection": "coll", latitude: 50.93, longitude: 6.93 });
  ```

- `range(name, left, right)`:

  Use an AQL query like this:

  ```js
  db._query(`FOR doc IN @@collection
    FILTER doc.@attribute >= @left && doc.@attribute < @right
    RETURN doc`, { "@collection": "coll", attribute: "name", left: "bert", right: "emily" });
  ```

- `removeByKeys(keys)`:

  Use `remove(keys)`, which can also remove multiple documents, but it returns
  either the document metadata or an error object. To get an object like
  `{ "removed": 3, "ignored": 1 }` as was returned by `removeByKeys(keys)`,
  you can do the following:

  ```js
  var removed = 0;
  var ignored = 0;
  db.<coll>.remove(<keys>).forEach( doc => {
    doc.error ? ignored++ : removed++;
  });
  ({ removed, ignored })
  ```

- `unload()`:

  Obsolete, collections are always loaded.

- `within(lat, lon, radius)`

  Use an AQL query like this:

  ```js
  db._query(`FOR doc IN @@collection
    LET dist = DISTANCE(doc.latitude, doc.longitude, @latitude, @longitude)
    FILTER dist <= @radius
    SORT dist ASC
    RETURN doc`, { "@collection": "coll", latitude: 50.93, longitude: 6.93, radius: 250 });
  ```

- `withinRectangle(lat1, lon1, lat2, lon2)`

  Use an AQL query like this, but note that a GeoJSON polygon uses geodesic lines
  from version 3.10.0 onward (see [GeoJSON interpretation](../../aql/functions/geo.md#geojson-interpretation)):

  ```js
  db._query(`LET rect = GEO_POLYGON([ [
      [lon1, lat1], // bottom-left
      [lon2, lat1], // bottom-right
      [lon2, lat2], // top-right
      [lon1, lat2], // top-left
      [lon1, lat1], // bottom-left
    ] ])
    FOR doc IN @@collection
      FILTER GEO_CONTAINS(rect, [doc.longitude, doc.latitude])
      RETURN doc`, { "@collection": "coll", lat1: 50.93, lon1: 6.93, lat2: 50.94, lon2: 6.94 });
  ```
