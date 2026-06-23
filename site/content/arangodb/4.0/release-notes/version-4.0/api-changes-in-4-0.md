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

#### Foxx master removed from server status

The `GET /_admin/status` endpoint no longer includes the sub-attributes
`foxxmaster` and `isFoxxmaster` under `coordinator` due to the removal of Foxx.
As the `coordinator` object doesn't have any other attributes, it is removed
as well.

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

#### Foxx API removed

The following `/_api/foxx` endpoints have been removed due to the removal of Foxx:

- `GET /_db/{database-name}/_api/foxx`
- `POST /_db/{database-name}/_api/foxx`
- `GET /_db/{database-name}/_api/foxx/service`
- `PATCH /_db/{database-name}/_api/foxx/service`
- `PUT /_db/{database-name}/_api/foxx/service`
- `DELETE /_db/{database-name}/_api/foxx/service`
- `GET /_db/{database-name}/_api/foxx/configuration`
- `PATCH /_db/{database-name}/_api/foxx/configuration`
- `PUT /_db/{database-name}/_api/foxx/configuration`
- `GET /_db/{database-name}/_api/foxx/dependencies`
- `PATCH /_db/{database-name}/_api/foxx/dependencies`
- `PUT /_db/{database-name}/_api/foxx/dependencies`
- `GET /_db/{database-name}/_api/foxx/scripts`
- `POST /_db/{database-name}/_api/foxx/scripts/{name}`
- `POST /_db/{database-name}/_api/foxx/tests`
- `POST /_db/{database-name}/_api/foxx/development`
- `DELETE /_db/{database-name}/_api/foxx/development`
- `GET /_db/{database-name}/_api/foxx/readme`
- `GET /_db/{database-name}/_api/foxx/swagger`
- `POST /_db/{database-name}/_api/foxx/download`
- `POST /_db/{database-name}/_api/foxx/commit`

#### Upload API removed

The `POST /_api/upload` endpoint has been removed due to the removal of Foxx.
It was used for service bundle and file uploads.

#### Routing reload API removed

The `POST /_admin/routing/reload` endpoint has been removed due to the removal
of the Action and Foxx features. It was used to reload the routing information
from the `_routing` system collection and make Foxx rebuild its local routing
table on the next request.

#### User-defined AQL functions API removed

The following endpoints for managing UDFs have been removed:

- `GET /_api/aqlfunction`
- `POST /_api/aqlfunction`
- `DELETE /_api/aqlfunction/{name}`

#### Statistics endpoints

The following endpoints have been removed:

- `/_admin/statistics`
- `/_admin/statistics-description`
- `/_admin/cluster/nodeStatistics`
- `/_admin/cluster/statistics`

You can get more detailed information for monitoring ArangoDB via the
[`/_admin/metrics` endpoint](../../develop/http-api/monitoring/metrics.md)
in Prometheus format.

#### Echo API removed

The `/_admin/echo` endpoints supporting the `HEAD`, `GET`, `POST`, `PATCH`,
`PUT`, `DELETE`, and `OPTIONS` HTTP methods have been removed. They returned
an object with the servers request information, the HTTP request headers, or
both and were used for debugging purposes.

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

- `ensureVertexCentricIndex(...fields, options)`

  Use `ensureIndex(description)` with a `persistent` index type over `_from` or
  `_to` and at least one more edge attribute.

  Before:
  - `ensureVertexCentricIndex("type", { direction: "outbound" });`
  - `ensureVertexCentricIndex("type", "subtype", { direction: "inbound" });`

  After:
  - `ensureIndex({ type: "persistent", fields: [ "_from", "type" ] });`
  - `ensureIndex({ type: "persistent", fields: [ "_to", "type", "subtype" ] });`

  You can also use an `mdi-prefixed` index type if you have multi-dimensional data
  and one or more prefix attributes:

  - `ensureIndex({ type: "mdi-prefixed", prefixFields: ["_from", "type"], fields: [ "x", "y" ], fieldValueTypes: "double" });`
  - `ensureIndex({ type: "mdi-prefixed", prefixFields: ["_to", "type", "subtype"], fields: [ "x", "y" ], fieldValueTypes: "double" });`

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
  
### Foxx-related removals

The `@arangodb/foxx` module and the related `@arangodb/locals` module have been
removed from the JavaScript API.

Furthermore, the `global.fm` object has been removed. It provided various
methods for managing Foxx services.

### User-defined AQL functions module removed

The `@arangodb/aql/functions` module has been removed from the JavaScript API.
