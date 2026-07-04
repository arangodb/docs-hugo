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

#### Unsupported HTTP methods disallowed

The following endpoints could previously be called using any HTTP method of
`HEAD`, `GET`, `POST`, `PATCH`, `PUT`, `DELETE`:

 - `/_api/version`
 - `/_admin/time`
 - `/_admin/status`
 - `/_admin/support-info`
 
The HTTP method is now checked and only `GET` requests are allowed for these
endpoints. Only the `GET` variants were documented.

#### `overwrite` option removed from document API

The `POST /_api/document/{collection}` endpoint for creating a single document
or multiple documents no longer supports the `overwrite` query parameter.
If you want to replace existing documents that have the same document keys,
specify how to resolve collisions with the `overwriteMode` query parameter.
You can set `overwriteMode` to `"replace"` to achieve the same as formerly
setting `overwrite` to `true`.

#### `minReplicationFactor` removed from collections

The deprecated alias for `writeConcern` has been removed. You can no longer set
the write concern using `minReplicationFactor` for collections and collections
also don't report this attribute anymore. Use `writeConcern` instead.

#### Collection statuses removed

Collections used to have different states like being loaded or unloaded.
This was relevant for the MMFiles storage engine that held the data in memory.
RocksDB doesn't have or need such statuses and the endpoints to load or unload
collections have no effect on it.

The `status` and `statusString` attributes have now been removed from responses
of the collections API (`/_api/collection*` endpoints).

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

Moreover, the following deprecated sub-attribute has been removed from the endpoint:
- `serverInfo.writeOpsEnabled`

#### Metrics API

The following metrics have been removed from the `GET /_admin/metrics` endpoint
due to feature removals:

- `arangodb_request_statistics_memory_usage`
- `arangodb_connection_statistics_memory_usage`
- `arangodb_v8_context_alive`
- `arangodb_v8_context_busy`
- `arangodb_v8_context_dirty`
- `arangodb_v8_context_free`
- `arangodb_v8_context_max`
- `arangodb_v8_context_min`

#### Log API

The `security` log topic has been removed.
The `/_admin/log/level` endpoints no longer include this log topic in responses
and attempts to set the log level for this topic are ignored.

### Privilege changes



### Endpoint return value changes

#### Foxx master removed from server status

The `GET /_admin/status` endpoint no longer includes the sub-attributes
`foxxmaster` and `isFoxxmaster` under `coordinator` due to the removal of Foxx.
As the `coordinator` object doesn't have any other attributes, it is removed
as well.

#### Timestamp removed from cluster health API

The `GET /_admin/cluster/health` endpoint no longer includes the previously
deprecated `Timestamp` sub-attribute of the last heartbeat received under
`Health.<nodeID>` for Coordinators.

### Endpoints added



### Endpoints augmented



### Endpoints moved



### Endpoints deprecated



### Endpoints removed

#### Simple Queries endpoints removed

The following endpoints that were deprecated since v3.4.0 have now been removed:

- `PUT /_api/simple/lookup-by-keys`: Find documents by their keys
- `PUT /_api/simple/remove-by-keys`: Remove documents by their keys
- `PUT /_api/simple/all`: Return all documents
- `PUT /_api/simple/all-keys`: Read all document keys
- `PUT /_api/simple/any`: Return a random document
- `PUT /_api/simple/by-example`: Simple query by-example
- `PUT /_api/simple/first-example`: Find documents matching an example
- `PUT /_api/simple/fulltext`: Fulltext index query
- `PUT /_api/simple/near`: Return documents near coordinates
- `PUT /_api/simple/range`: Simple range query
- `PUT /_api/simple/remove-by-example`: Remove documents by example
- `PUT /_api/simple/replace-by-example`: Replace documents by example
- `PUT /_api/simple/update-by-example`: Update documents by example
- `PUT /_api/simple/within`: Find documents within a radius around coordinates
- `PUT /_api/simple/within-rectangle`: Find documents within a rectangular area

You can use AQL queries instead.

#### JavaScript Transactions API

The `POST /_api/transaction` endpoint for executing a JavaScript Transaction
has been removed. It was deprecated since v3.12.0.

You may use [AQL queries](../../develop/http-api/queries/aql-queries.md#create-a-cursor) or
[Stream Transactions](../../develop/http-api/transactions/stream-transactions.md) instead.

#### Metrics API v2

Since ArangoDB v3.10.0, the `/_admin/metrics` and `/_admin/metrics/v2` endpoints
returned the same metrics. The redundant `/_admin/metrics/v2` endpoint has now
been removed.

#### Legacy log API

The long-deprecated `GET /_admin/log` endpoint and the associated
`DELETE /_admin/log` endpoint have been removed.

The structure of this legacy log was parallel lists that required you to pick
the elements with the same index from each array of the returned object to
determine what belongs together for a given log entry.

A more intuitive log format where each log entry is an object is available
with the `GET /_admin/log/entries` endpoint. See
[HTTP interface for server logs](../../develop/http-api/monitoring/logs.md#get-the-global-server-logs)
for details.

#### Database target version API

The `GET /_admin/database/target-version` endpoint has been removed in favor of
the more general version API with the endpoint `GET /_api/version`.
The endpoint was deprecated since v3.11.3.

#### Obsolete replication APIs

The following endpoints related to replication functionality that is no longer
used have been removed:

- `GET /_api/replication/logger-follow`
- `GET /_api/replication/logger-first-tick`
- `GET /_api/replication/logger-tick-ranges`
- `GET /_api/wal/open-transactions`
- `GET /_admin/wal/transactions`
- `GET /_admin/wal/properties`
- `PUT /_admin/wal/properties`

#### Endpoint API

The long-deprecated `GET /_api/endpoint` for retrieving all configured endpoints
the server is listening on has been removed. For cluster deployments, you can
use `GET /_api/cluster/endpoints` to find all current Coordinator endpoints.
See [HTTP interface for clusters](../../develop/http-api/cluster.md#endpoints).

#### Job and version admin APIs

The `/_admin/job*` endpoints as well as the `/_admin/version` endpoint have
been removed. The identical functionality is now only available using the
corresponding `/_api/job*` and `/_api/version` endpoints.

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

#### Deprecated `PUT` cursor endpoint removed

The deprecated `PUT /_api/cursor/{cursor-identifier}` endpoint to
read the next batch from a cursor has been removed.

Use `POST /_api/cursor/{cursor-identifier}` instead.

#### Endpoints to load and unload collections removed

The deprecated `PUT /_api/collection/load` and `PUT /_api/collection/unload`
endpoints to load and unload collections have been removed. There is no
concept of loading status anymore and the endpoints didn't have any effect for
a while.

#### Echo API removed

The `/_admin/echo` endpoints supporting the `HEAD`, `GET`, `POST`, `PATCH`,
`PUT`, `DELETE`, and `OPTIONS` HTTP methods have been removed. They returned
an object with the servers request information, the HTTP request headers, or
both and were used for debugging purposes.

## JavaScript API

### `db._executeTransaction()` removed

The `_executeTransaction` function has been removed from the `db` object due to
the removal of JavaScript Transactions.

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

- `ensureUniqueSkiplist(description)`:

  Use `ensureIndex(description)` with a `persistent` index type and `unique`
  set to `true`.

- `ensureVertexCentricIndex(...fields, options)`:

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

- `lookupByKeys(keys)`:

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

- `status()`:

  Obsolete, the server no longer reports a collection state (loaded, unloaded, etc.)
  and collection statuses have no meaning with the RocksDB storage engine anyway.

- `unload()`:

  Obsolete, collections are always loaded.

- `within(lat, lon, radius)`:

  Use an AQL query like this:

  ```js
  db._query(`FOR doc IN @@collection
    LET dist = DISTANCE(doc.latitude, doc.longitude, @latitude, @longitude)
    FILTER dist <= @radius
    SORT dist ASC
    RETURN doc`, { "@collection": "coll", latitude: 50.93, longitude: 6.93, radius: 250 });
  ```

- `withinRectangle(lat1, lon1, lat2, lon2)`:

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
