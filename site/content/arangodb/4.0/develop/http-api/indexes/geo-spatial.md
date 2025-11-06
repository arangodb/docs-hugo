---
title: HTTP interface for geo-spatial indexes
menuTitle: Geo-Spatial
weight: 25
description: ''
---
## Create a geo-spatial index

```openapi
paths:
  /_db/{database-name}/_api/index#geo:
    post:
      operationId: createIndexGeo
      description: |
        Creates a geo-spatial index in the collection `collection`, if
        it does not already exist.

        Geo indexes are always sparse, meaning that documents that do not contain
        the index attributes or have non-numeric values in the index attributes
        will not be indexed.
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of the database.
          schema:
            type: string
        - name: collection
          in: query
          required: true
          description: |
            The collection name.
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required:
                - type
                - fields
              properties:
                type:
                  description: |
                    Must be equal to `"geo"`.
                  type: string
                  example: geo
                name:
                  description: |
                    An easy-to-remember name for the index to look it up or refer to it in index hints.
                    Index names are subject to the same character restrictions as collection names.
                    If omitted, a name is auto-generated so that it is unique with respect to the
                    collection, e.g. `idx_832910498`.
                  type: string
                fields:
                  description: |
                    An array with one or two attribute paths.

                    If it is an array with one attribute path `location`, then a geo-spatial
                    index on all documents is created using `location` as path to the
                    coordinates. The value of the attribute must be an array with at least two
                    double values. The array must contain the latitude (first value) and the
                    longitude (second value). All documents, which do not have the attribute
                    path or with value that are not suitable, are ignored.

                    If it is an array with two attribute paths `latitude` and `longitude`,
                    then a geo-spatial index on all documents is created using `latitude`
                    and `longitude` as paths the latitude and the longitude. The values of
                    the `latitude` and `longitude` attributes must each be a number (double).
                    All documents which do not have the attribute paths or which have
                    values that are not suitable are ignored.
                  type: array
                  minItems: 1
                  maxItems: 2
                  uniqueItems: true
                  items:
                    type: string
                geoJson:
                  description: |
                    If you create a geo-spatial index over a single attribute and `geoJson`
                    is `true`, then the coordinate order within the attribute's array is
                    longitude followed by latitude. This corresponds to the format described in
                    <http://geojson.org/geojson-spec.html#positions>
                  type: boolean
                  default: false
                legacyPolygons:
                  description: |
                    If `geoJson` is set to `true`, then this option controls how GeoJSON Polygons
                    are interpreted.

                    - If `legacyPolygons` is `true`, the smaller of the two regions defined by a
                      linear ring is interpreted as the interior of the ring and a ring can at most
                      enclose half the Earth's surface.
                    - If `legacyPolygons` is `false`, the area to the left of the boundary ring's
                      path is considered to be the interior and a ring can enclose the entire
                      surface of the Earth.

                    The default is `true` for geo indexes that were created in versions before 3.10,
                    and `false` for geo indexes created in 3.10 or later.
                  type: boolean
                inBackground:
                  description: |
                    Set this option to `true` to keep the collection/shards available for
                    write operations by not using an exclusive write lock for the duration
                    of the index creation.
                  type: boolean
                  default: false
      responses:
        '200':
          description: |
            The index exists already.
        '201':
          description: |
            The index is created as there is no such existing index.
        '404':
          description: |
            The collection is unknown.
      tags:
        - Indexes
```

**Examples**

```curl
---
description: |-
  Creating a geo index with a location attribute
name: RestIndexCreateGeoLocation
---
var cn = "products";
db._drop(cn);
db._create(cn);

var url = "/_api/index?collection=" + cn;
var body = {
  type: "geo",
  fields : [ "b" ]
};

var response = logCurlRequest('POST', url, body);

assert(response.code === 201);

logJsonResponse(response);
db._drop(cn);
```

```curl
---
description: |-
  Creating a geo index with latitude and longitude attributes
name: RestIndexCreateGeoLatitudeLongitude
---
var cn = "products";
db._drop(cn);
db._create(cn);

var url = "/_api/index?collection=" + cn;
var body = {
  type: "geo",
  fields: [ "e", "f" ]
};

var response = logCurlRequest('POST', url, body);

assert(response.code === 201);

logJsonResponse(response);
db._drop(cn);
```
