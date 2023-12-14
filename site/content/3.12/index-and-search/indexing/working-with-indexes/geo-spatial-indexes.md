---
title: Geo-Spatial Indexes
menuTitle: Geo-spatial Indexes
weight: 30
description: >-
  Indexing GeoJSON geometry and latitude/longitude pairs can accelerate
  geo-spatial queries
archetype: default
---
The geo-spatial index type in ArangoDB is based on [Google S2](http://s2geometry.io/).
Indexing is supported for a subset of the [**GeoJSON**](../../../aql/functions/geo.md#geojson)
geometry types as well as simple latitude/longitude pairs.

AQL's geospatial functions and GeoJSON constructors are described in
[Geo functions](../../../aql/functions/geo.md).

You can also perform
[geospatial searches with ArangoSearch](../../arangosearch/geospatial-search.md).

## Using a Geo-Spatial Index

The geospatial index supports distance, containment, and intersection
queries for various geometric 2D shapes. You should mainly be using AQL queries
to perform these types of operations. The index can operate in **two different
modes**, depending on if you want to use the GeoJSON data-format or not. The modes
are mainly toggled by using the `geoJson` field when creating the index.

This index assumes coordinates with the latitude between -90 and 90 degrees and the
longitude between -180 and 180 degrees. A geo index ignores all 
documents which do not fulfill these requirements.

### GeoJSON Mode

To create an index in GeoJSON mode execute:

```js
collection.ensureIndex({ type: "geo", fields: [ "geometry" ], geoJson: true })
```

This creates the index on all documents and uses _geometry_ as the attributed
field where the value is either a
[Geometry Object](https://tools.ietf.org/html/rfc7946#section-3.1)
**or** a _coordinate array_. The array must contain at least two numeric values
with longitude (first value) and latitude (second value). This corresponds
to the format described in
[RFC 7946 Position](https://tools.ietf.org/html/rfc7946#section-3.1.1).

All documents, that do not have the attribute path or have a non-conforming
value in it, are excluded from the index.

A geo index is implicitly sparse, and there is no way to control its
sparsity.
In case that the index was successfully created, an object with the index
details, including the index-identifier, is returned.

For technical details on how ArangoDB interprets GeoJSON objects, see
[GeoJSON Interpretation](../../../aql/functions/geo.md#geojson-interpretation).
In short: the **syntax** of GeoJSON is used, but polygon boundaries and lines
between points are interpreted as geodesics (pieces of great circles on Earth).

### Non-GeoJSON mode

This index mode exclusively supports indexing on coordinate arrays. Values that
contain GeoJSON or other types of data are ignored. In the non-GeoJSON mode
the index can be created on one or two fields.

The following examples work in the _arangosh_ command shell.

To create a geo-spatial index on all documents using `latitude` and
`longitude` as separate attribute paths, two paths need to be specified
in the `fields` array:

`collection.ensureIndex({ type: "geo", fields: [ "latitude", "longitude" ] })`

The first field is always defined to be the _latitude_ and the second is the
_longitude_. The `geoJson` flag is implicitly _false_ in this mode.

Alternatively you can specify only one field:

`collection.ensureIndex({ type: "geo", fields: [ "location" ], geoJson:false })`

It creates a geospatial index on all documents using `location` as the path to the
coordinates. The value of the attribute has to be an array with at least two
numeric values. The array must contain the latitude (first value) and the
longitude (second value).

All documents, which do not have the attribute path(s) or have a non-conforming
value in it, are excluded from the index.

A geo index is implicitly sparse, and there is no way to control its
sparsity.
In case that the index was successfully created, an object with the index
details, including the index-identifier, is returned.

In case that the index was successfully created, an object with the index
details, including the index-identifier, is returned.

{{< warning >}}
If the `geoJson` option is `false`, GeoJSON data is **not indexed**.
Some queries can have different results with and without such a geo-spatial index.

For example, if you have documents with proper GeoJSON data in an attribute
called `geo`, then the following query matches all of them:

```aql
FOR doc IN coll
  FILTER GEO_DISTANCE(doc.geo, GEO_POINT(10, 10)) >= 0
  RETURN doc
```

The `GEO_DISTANCE()` function correctly parses the data, takes the centroid,
computes the distance to `GEO_POINT(10, 10)` (which is non-negative regardless
of the `geo` object), and lets the document through.

However, a geo-spatial index with `geoJson` set to `false` doesn't index the
`geo` attribute if it contains GeoJSON data and ignores these documents. If the
same query is executed with the geo-spatial index, it doesn't find the documents.
{{< /warning >}}

### Legacy Polygons

Between ArangoDB 3.10 and earlier versions, two things have changed:

- boundaries of polygons are now geodesics and there is no special
  and inconsistent treatment of "rectangles" any more
- linear rings are interpreted according to the rules and no longer
  "normalized"

See [GeoJSON Interpretation](../../../aql/functions/geo.md#geojson-interpretation)
for details.

For backward compatibility, a `legacyPolygons` option has been introduced
for geo indexes. It is relevant for those that have `geoJson` set to
`true` only. Geo indexes created in versions before 3.10 always
implicitly have the `legacyPolygons` option set to `true`. Newly generated
geo indexes from 3.10 onward have the `legacyPolygons` option set to `false`
by default. However, you can still explicitly overwrite the setting with
`true` to create a legacy index, but it is not recommended.

A geo index with `legacyPolygons` set to `true` uses the old, pre-3.10
rules for the parsing GeoJSON polygons. This allows you to let old indexes
produce the same, potentially wrong results as before an upgrade. A geo index
with `legacyPolygons` set to `false` uses the new, correct and consistent
method for parsing of GeoJSON polygons.

If you use a geo index and upgrade from a version below 3.10 to a version of
3.10 or higher, it is recommended that you drop your old geo indexes
and create new ones with `legacyPolygons` set to `false`.

If you use `geojson` Analyzers and upgrade from a version below 3.10 to a
version of 3.10 or higher, the interpretation of GeoJSON Polygons changes.
See the `legacy` property of the [`geojson` Analyzer](../../analyzers.md#geojson).

{{< warning >}}
It is possible that you might have been relying on the old (wrong) parsing of
GeoJSON polygons unknowingly. If you have polygons in your data that mean to
refer to a relatively small region, but have the boundary running clockwise
around the intended interior, they are interpreted as intended prior to 3.10,
but from 3.10 onward, they are interpreted as "the other side" of the boundary.

Whether a clockwise boundary specifies the complement of the small region
intentionally or not cannot be determined automatically. Please test the new
behavior manually.
{{< /warning >}}

### *arangosh* Examples

Ensures that a geo index exists:

`collection.ensureIndex({ type: "geo", fields: [ "location" ] })`

Creates a geospatial index on all documents using `location` as the path to the
coordinates. The value of the attribute has to be an array with at least two
numeric values. The array must contain the latitude (first value) and the
longitude (second value).

All documents, which do not have the attribute path or have a non-conforming
value in it, are excluded from the index.

A geo index is implicitly sparse, and there is no way to control its
sparsity.

The index does not provide a `unique` option because of its limited usability.
It would prevent identical coordinate pairs from being inserted only, but even a
slightly different location (like 1 inch or 1 cm off) would be unique again and
not considered a duplicate, although it probably should. The desired threshold
for detecting duplicates may vary for every project (including how to calculate
the distance even) and needs to be implemented on the application layer as
needed. You can write a [Foxx service](../../../develop/foxx-microservices/_index.md) for this purpose and
make use of the AQL [geo functions](../../../aql/functions/geo.md) to find nearby
locations supported by a geo index.

In case that the index was successfully created, an object with the index
details, including the index-identifier, is returned.

---

To create a geo index on an array attribute that contains longitude first, set
the `geoJson` attribute to `true`. This corresponds to the format described in
[RFC 7946 Position](https://tools.ietf.org/html/rfc7946#section-3.1.1)

`collection.ensureIndex({ type: "geo", fields: [ "location" ], geoJson: true })`

---

To create a geo-spatial index on all documents using `latitude` and `longitude`
as separate attribute paths, two paths need to be specified in the `fields`
array:

`collection.ensureIndex({ type: "geo", fields: [ "latitude", "longitude" ] })`

In case that the index was successfully created, an object with the index
details, including the index-identifier, is returned.

**Examples**

Create a geo index for an array attribute:

```js
---
name: geoIndexCreateForArrayAttribute1
description: ''
---
~db._create("geo");
db.geo.ensureIndex({ type: "geo", fields: [ "loc" ] });
~db._drop("geo");
```

Create a geo index for an array attribute:

```js
---
name: geoIndexCreateForArrayAttribute2
description: ''
---
~db._create("geo2");
db.geo2.ensureIndex({ type: "geo", fields: [ "location.latitude", "location.longitude" ] });
~db._drop("geo2");
```

Use a geo index with the AQL `SORT` operation:

```js
---
name: geoIndexSortOptimization
description: ''
---
~db._create("geoSort");
var idx = db.geoSort.ensureIndex({ type: "geo", fields: [ "latitude", "longitude" ] });
for (i = -90;  i <= 90;  i += 10) {
  for (j = -180; j <= 180; j += 10) {
    db.geoSort.save({ name : "Name/" + i + "/" + j, latitude : i, longitude : j });
  }
}
var query = "FOR doc in geoSort SORT DISTANCE(doc.latitude, doc.longitude, 0, 0) LIMIT 5 RETURN doc"
db._explain(query, {}, {colors: false});
db._query(query).toArray();
~db._drop("geoSort");
```

Use a geo index with the AQL `FILTER` operation:

```js
---
name: geoIndexFilterOptimization
description: ''
---
~db._create("geoFilter");
var idx = db.geoFilter.ensureIndex({ type: "geo", fields: [ "latitude", "longitude" ] });
for (i = -90;  i <= 90;  i += 10) {
  for (j = -180; j <= 180; j += 10) {
    db.geoFilter.save({ name : "Name/" + i + "/" + j, latitude : i, longitude : j });
  }
}
var query = "FOR doc in geoFilter FILTER DISTANCE(doc.latitude, doc.longitude, 0, 0) < 2000 RETURN doc"
db._explain(query, {}, {colors: false});
db._query(query).toArray();
~db._drop("geoFilter");
```

## Indexed GeoSpatial Queries

The geospatial index supports a variety of AQL queries, which can be built with the help
of the [geo utility functions](../../../aql/functions/geo.md). There are three specific
geo functions that can be optimized, provided they are used correctly:
`GEO_DISTANCE()`, `GEO_CONTAINS()`, `GEO_INTERSECTS()`. Additionally, there is a built-in support to optimize
the older geo functions `DISTANCE()`, `NEAR()`, and `WITHIN()` (the last two
only if they are used in their 4 argument version, without `distanceName`).

When in doubt whether your query is being properly optimized, 
check the [AQL explain](../../../aql/execution-and-performance/explaining-queries.md)
output to check for index usage.

### Query for Results near Origin (NEAR type query)

A basic example of a query for results near an origin point:

```aql
FOR x IN geo_collection
  FILTER GEO_DISTANCE([@lng, @lat], x.geometry) <= 100000
  RETURN x._key
```

or

```aql
FOR x IN geo_collection
  FILTER GEO_DISTANCE(@geojson, x.geometry) <= 100000
  RETURN x._key
```

The function `GEO_DISTANCE()` always returns the distance in meters, so this
query receives results up until _100km_.

The first parameter can be a GeoJSON object or a coordinate array in
`[longitude, latitude]` ordering. The second parameter is the document field
on that the index was created.

In case of a GeoJSON object in the first parameter, the distance is measured
from the **centroid of the object to the indexed point**. If the index has
`geoJson` set to `true`, then the distance is measured from the
**centroid of the object to the centroid of the indexed object**. This can
be unexpected if not all GeoJSON objects are points, but it is what the index
can actually provide.

### Query for Sorted Results near Origin (NEAR type query)

A basic example of a query for the 1000 nearest results to an origin point (ascending sorting):

```aql
FOR x IN geo_collection
  SORT GEO_DISTANCE([@lng, @lat], x.geometry) ASC
  LIMIT 1000
  RETURN x._key
```

The first parameter can be a GeoJSON object or a coordinate array in
`[longitude, latitude]` ordering. The second parameter is the document field
on that the index was created.

In case of a GeoJSON object in the first parameter, the distance is measured
from the **centroid of the object to the indexed point**. If the index has
`geoJson` set to `true`, then the distance is measured from the
**centroid of the object to the centroid of the indexed object**. This can
be unexpected if not all GeoJSON objects are points, but it is what the index
can actually provide.

You may also get results farthest away (distance sorted in descending order):

```aql
FOR x IN geo_collection
  SORT GEO_DISTANCE([@lng, @lat], x.geometry) DESC
  LIMIT 1000
  RETURN x._key
```

### Query for Results within a Distance Range

A query which returns documents at a distance of _1km_ or farther away,
and up to _100km_ from the origin: 

```aql
FOR x IN geo_collection
  FILTER GEO_DISTANCE([@lng, @lat], x.geometry) <= 100000
  FILTER GEO_DISTANCE([@lng, @lat], x.geometry) >= 1000
  RETURN x
```

This returns the documents with a GeoJSON value that is located in
the specified search annulus.

The first parameter can be a GeoJSON object or a coordinate array in
`[longitude, latitude]` ordering. The second parameter is the document field
on that the index was created.

In case of a GeoJSON object in the first parameter, the distance is measured
from the **centroid of the object to the indexed point**. If the index has
`geoJson` set to `true`, then the distance is measured from the
**centroid of the object to the centroid of the indexed object**. This can
be unexpected if not all GeoJSON objects are points, but it is what the index
can actually provide.

Note that all these `FILTER GEO_DISTANCE(...)` queries can be combined with a
`SORT` clause on `GEO_DISTANCE()` (provided they use the same basis point),
resulting in a sequence of findings sorted by distance, but limited to the given
`GEO_DISTANCE()` boundaries.

### Query for Results contained in Polygon

A query which returns documents whose stored geometry is contained within a
GeoJSON Polygon.

```aql
LET polygon = GEO_POLYGON([[[60,35],[50,5],[75,10],[70,35],[60,35]]])
FOR x IN geo_collection
  FILTER GEO_CONTAINS(polygon, x.geometry)
  RETURN x
```

The first parameter of `GEO_CONTAINS()` must be a polygon. Other types
are not really sensible, since for example a point cannot contain other GeoJSON
objects than itself, and for others like lines, containment is not defined in a
numerically stable way. The second parameter must contain the document field on
that the index was created.

This `FILTER` clause can be combined with a `SORT` clause using `GEO_DISTANCE()`.

Note that containment in the opposite direction is currently not supported by
geo indexes:

```aql
LET polygon = GEO_POLYGON([[[60,35],[50,5],[75,10],[70,35],[60,35]]])
FOR x IN geo_collection
  FILTER GEO_CONTAINS(x.geometry, polygon)
  RETURN x
```

### Query for Results Intersecting a Polygon

A query that returns documents with an intersection of their stored
geometry and a GeoJSON Polygon.

```aql
LET polygon = GEO_POLYGON([[[60,35],[50,5],[75,10],[70,35],[60,35]]])
FOR x IN geo_collection
  FILTER GEO_INTERSECTS(polygon, x.geometry)
  RETURN x
```

The first parameter of `GEO_INTERSECTS()` is usually a polygon.

The second parameter must contain the document field on that the index
was created.

This `FILTER` clause can be combined with a `SORT` clause using `GEO_DISTANCE()`.
