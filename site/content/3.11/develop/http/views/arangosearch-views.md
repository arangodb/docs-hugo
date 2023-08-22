---
title: HTTP interface for arangosearch Views
menuTitle: <code>arangosearch</code> Views
weight: 10
description: >-
  The HTTP API for Views lets you manage `arangosearch` Views, including
  handling the general View properties and View links
---
```openapi
## Create an arangosearch View

paths:
  /_api/view:
    post:
      operationId: createView
      description: |
        Creates a new View with a given name and properties if it does not
        already exist.
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                name:
                  description: |
                    The name of the View.
                  type: string
                type:
                  description: |
                    The type of the View. Must be equal to `"arangosearch"`.
                    This option is immutable.
                  type: string
                links:
                  description: |
                    Expects an object with the attribute keys being names of to be linked collections,
                    and the link properties as attribute values. See
                    [`arangosearch` View Link Properties](../../../index-and-search/arangosearch/arangosearch-views-reference.md#link-properties)
                    for details.
                  type: object
                primarySort:
                  description: "A primary sort order can be defined to enable an AQL\
                    \ optimization. If a query\niterates over all documents of a View,\
                    \ wants to sort them by attribute values\nand the (left-most)\
                    \ fields to sort by as well as their sorting direction match\n\
                    with the `primarySort` definition, then the `SORT` operation is\
                    \ optimized away.\nThis option is immutable.\n\nExpects an array\
                    \ of objects, each specifying a field (attribute path) and a\n\
                    sort direction (`\"asc` for ascending, `\"desc\"` for descending):\n\
                    `[ { \"field\": \"attr\", \"direction\": \"asc\"}, \u2026 ]`"
                  type: array
                  items:
                    type: object
                primarySortCompression:
                  description: |
                    Defines how to compress the primary sort data (introduced in v3.7.1).
                    ArangoDB v3.5 and v3.6 always compress the index using LZ4.

                    This option is immutable.

                    - `"lz4"` (default): use LZ4 fast compression.
                    - `"none"`: disable compression to trade space for speed.
                  type: string
                primarySortCache:
                  description: |
                    If you enable this option, then the primary sort columns are always cached in
                    memory (introduced in v3.9.6, Enterprise Edition only). This can improve the
                    performance of queries that utilize the primary sort order. Otherwise, these
                    values are memory-mapped and it is up to the operating system to load them from
                    disk into memory and to evict them from memory.

                    This option is immutable.

                    See the `--arangosearch.columns-cache-limit` startup option to control the
                    memory consumption of this cache. You can reduce the memory usage of the column
                    cache in cluster deployments by only using the cache for leader shards, see the
                    `--arangosearch.columns-cache-only-leader` startup option (introduced in v3.10.6).
                  type: boolean
                primaryKeyCache:
                  description: |
                    If you enable this option, then the primary key columns are always cached in
                    memory (introduced in v3.9.6, Enterprise Edition only). This can improve the
                    performance of queries that return many documents. Otherwise, these values are
                    memory-mapped and it is up to the operating system to load them from disk into
                    memory and to evict them from memory.

                    This option is immutable.

                    See the `--arangosearch.columns-cache-limit` startup option to control the
                    memory consumption of this cache. You can reduce the memory usage of the column
                    cache in cluster deployments by only using the cache for leader shards, see the
                    `--arangosearch.columns-cache-only-leader` startup option (introduced in v3.10.6).
                  type: boolean
                storedValues:
                  description: |
                    An array of objects to describe which document attributes to store in the View
                    index (introduced in v3.7.1). It can then cover search queries, which means the
                    data can be taken from the index directly and accessing the storage engine can
                    be avoided.

                    This option is immutable.

                    Each object is expected in the following form:

                    `{ "fields": [ "attr1", "attr2", ... "attrN" ], "compression": "none", "cache": false }`

                    - The required `fields` attribute is an array of strings with one or more
                      document attribute paths. The specified attributes are placed into a single
                      column of the index. A column with all fields that are involved in common
                      search queries is ideal for performance. The column should not include too
                      many unneeded fields, however.

                    - The optional `compression` attribute defines the compression type used for
                      the internal column-store, which can be `"lz4"` (LZ4 fast compression, default)
                      or `"none"` (no compression).

                    - The optional `cache` attribute allows you to always cache stored values in
                      memory (introduced in v3.9.5, Enterprise Edition only). This can improve
                      the query performance if stored values are involved. Otherwise, these values
                      are memory-mapped and it is up to the operating system to load them from disk
                      into memory and to evict them from memory.

                      See the `--arangosearch.columns-cache-limit` startup option
                      to control the memory consumption of this cache. You can reduce the memory
                      usage of the column cache in cluster deployments by only using the cache for
                      leader shards, see the `--arangosearch.columns-cache-only-leader` startup
                      option (introduced in v3.10.6).

                      You may use the following shorthand notations on View creation instead of
                      an array of objects as described above. The default compression and cache
                      settings are used in this case:

                      - An array of strings, like `["attr1", "attr2"]`, to place each attribute into
                        a separate column of the index (introduced in v3.10.3).

                      - An array of arrays of strings, like `[["attr1", "attr2"]]`, to place the
                        attributes into a single column of the index, or `[["attr1"], ["attr2"]]`
                        to place each attribute into a separate column. You can also mix it with the
                        full form:

                      ```json
                      [
                        ["attr1"],
                        ["attr2", "attr3"],
                        { "fields": ["attr4", "attr5"], "cache": true }
                      ]
                      ```

                    The `storedValues` option is not to be confused with the `storeValues` option,
                    which allows to store meta data about attribute values in the View index.
                  type: array
                  items:
                    type: object
                cleanupIntervalStep:
                  description: |
                    Wait at least this many commits between removing unused files in the
                    ArangoSearch data directory (default: 2, to disable use: 0).
                    For the case where the consolidation policies merge segments often (i.e. a lot
                    of commit+consolidate), a lower value will cause a lot of disk space to be
                    wasted.
                    For the case where the consolidation policies rarely merge segments (i.e. few
                    inserts/deletes), a higher value will impact performance without any added
                    benefits.

                    _Background:_
                      With every "commit" or "consolidate" operation a new state of the View's
                      internal data structures is created on disk.
                      Old states/snapshots are released once there are no longer any users
                      remaining.
                      However, the files for the released states/snapshots are left on disk, and
                      only removed by "cleanup" operation.
                  type: integer
                commitIntervalMsec:
                  description: |
                    Wait at least this many milliseconds between committing View data store
                    changes and making documents visible to queries (default: 1000, to disable
                    use: 0).
                    For the case where there are a lot of inserts/updates, a lower value, until
                    commit, will cause the index not to account for them and memory usage would
                    continue to grow.
                    For the case where there are a few inserts/updates, a higher value will impact
                    performance and waste disk space for each commit call without any added
                    benefits.

                    _Background:_
                      For data retrieval, ArangoSearch follows the concept of
                      "eventually-consistent", i.e. eventually all the data in ArangoDB will be
                      matched by corresponding query expressions.
                      The concept of ArangoSearch "commit" operations is introduced to
                      control the upper-bound on the time until document addition/removals are
                      actually reflected by corresponding query expressions.
                      Once a "commit" operation is complete, all documents added/removed prior to
                      the start of the "commit" operation will be reflected by queries invoked in
                      subsequent ArangoDB transactions, in-progress ArangoDB transactions will
                      still continue to return a repeatable-read state.
                  type: integer
                consolidationIntervalMsec:
                  description: |
                    Wait at least this many milliseconds between applying `consolidationPolicy` to
                    consolidate the View data store and possibly release space on the filesystem
                    (default: 10000, to disable use: 0).
                    For the case where there are a lot of data modification operations, a higher
                    value could potentially have the data store consume more space and file handles.
                    For the case where there are a few data modification operations, a lower value
                    will impact performance due to no segment candidates available for
                    consolidation.

                    _Background:_
                      For data modification, ArangoSearch follow the concept of a
                      "versioned data store". Thus old versions of data may be removed once there
                      are no longer any users of the old data. The frequency of the cleanup and
                      compaction operations are governed by `consolidationIntervalMsec` and the
                      candidates for compaction are selected via `consolidationPolicy`.
                  type: integer
                consolidationPolicy:
                  description: |
                    The consolidation policy to apply for selecting which segments should be merged
                    (default: {})

                    _Background:_
                      With each ArangoDB transaction that inserts documents, one or more
                      ArangoSearch-internal segments get created.
                      Similarly, for removed documents the segments that contain such documents
                      will have these documents marked as 'deleted'.
                      Over time, this approach causes a lot of small and sparse segments to be
                      created.
                      A "consolidation" operation selects one or more segments and copies all of
                      their valid documents into a single new segment, thereby allowing the
                      search algorithm to perform more optimally and for extra file handles to be
                      released once old segments are no longer used.

                    Sub-properties:
                      - `type` (string, _optional_):
                        The segment candidates for the "consolidation" operation are selected based
                        upon several possible configurable formulas as defined by their types.
                        The currently supported types are:
                        - `"tier"` (default): consolidate based on segment byte size and live
                          document count as dictated by the customization attributes. If this type
                          is used, then below `segments*` and `minScore` properties are available.
                        - `"bytes_accum"`: consolidate if and only if
                          `{threshold} > (segment_bytes + sum_of_merge_candidate_segment_bytes) / all_segment_bytes`
                          i.e. the sum of all candidate segment byte size is less than the total
                          segment byte size multiplied by the `{threshold}`. If this type is used,
                          then below `threshold` property is available.
                      - `threshold` (number, _optional_): value in the range `[0.0, 1.0]`
                      - `segmentsBytesFloor` (number, _optional_): Defines the value (in bytes) to
                        treat all smaller segments as equal for consolidation selection
                        (default: 2097152)
                      - `segmentsBytesMax` (number, _optional_): Maximum allowed size of all
                        consolidated segments in bytes (default: 5368709120)
                      - `segmentsMax` (number, _optional_): The maximum number of segments that will
                        be evaluated as candidates for consolidation (default: 10)
                      - `segmentsMin` (number, _optional_): The minimum number of segments that will
                        be evaluated as candidates for consolidation (default: 1)
                      - `minScore` (number, _optional_): (default: 0)
                  type: object
                writebufferIdle:
                  description: |
                    Maximum number of writers (segments) cached in the pool
                    (default: 64, use 0 to disable, immutable)
                  type: integer
                writebufferActive:
                  description: |
                    Maximum number of concurrent active writers (segments) that perform a
                    transaction. Other writers (segments) wait till current active writers
                    (segments) finish (default: 0, use 0 to disable, immutable)
                  type: integer
                writebufferSizeMax:
                  description: |
                    Maximum memory byte size per writer (segment) before a writer (segment) flush
                    is triggered. `0` value turns off this limit for any writer (buffer) and data
                    will be flushed periodically based on the value defined for the flush thread
                    (ArangoDB server startup option). `0` value should be used carefully due to
                    high potential memory consumption
                    (default: 33554432, use 0 to disable, immutable)
                  type: integer
              required:
                - name
                - type
      responses:
        '400':
          description: |
            If the *name* or *type* attribute are missing or invalid, then an *HTTP 400*
            error is returned.
        '409':
          description: |
            If a View called *name* already exists, then an *HTTP 409* error is returned.
      tags:
        - Views
```

**Examples**



```curl
---
description: ''
name: RestViewPostViewArangoSearch
---

    var url = "/_api/view";
    var body = {
      name: "products",
      type: "arangosearch"
    };
    var response = logCurlRequest('POST', url, body);
    assert(response.code === 201);
    logJsonResponse(response);

    db._dropView("products");
```
```openapi
## Get information about a View

paths:
  /_api/view/{view-name}:
    get:
      operationId: getView
      description: |
        The result is an object briefly describing the View with the following attributes:
        - `id`: The identifier of the View
        - `name`: The name of the View
        - `type`: The type of the View as string
      parameters:
        - name: view-name
          in: path
          required: true
          description: |
            The name of the View.
          schema:
            type: string
      responses:
        '404':
          description: |
            If the `view-name` is unknown, then a *HTTP 404* is returned.
      tags:
        - Views
```

**Examples**



```curl
---
description: |-
  Using an identifier:
name: RestViewGetViewIdentifierArangoSearch
---

    var view = db._createView("productsView", "arangosearch");

    var url = "/_api/view/"+ view._id;
    var response = logCurlRequest('GET', url);
    assert(response.code === 200);
    logJsonResponse(response);

    db._dropView("productsView");
```


```curl
---
description: |-
  Using a name:
name: RestViewGetViewNameArangoSearch
---

    var view = db._createView("productsView", "arangosearch");

    var url = "/_api/view/productsView";
    var response = logCurlRequest('GET', url);
    assert(response.code === 200);
    logJsonResponse(response);

    db._dropView("productsView");
```
```openapi
## Get the properties of a View

paths:
  /_api/view/{view-name}/properties:
    get:
      operationId: getViewProperties
      description: |
        Returns an object containing the definition of the View identified by `view-name`.

        The result is an object with a full description of a specific View, including
        View type dependent properties.
      parameters:
        - name: view-name
          in: path
          required: true
          description: |
            The name of the View.
          schema:
            type: string
      responses:
        '400':
          description: |
            If the `view-name` is missing, then a *HTTP 400* is returned.
        '404':
          description: |
            If the `view-name` is unknown, then a *HTTP 404* is returned.
      tags:
        - Views
```

**Examples**



```curl
---
description: |-
  Using an identifier:
name: RestViewGetViewPropertiesIdentifierArangoSearch
---

    var coll = db._create("books");
    var view = db._createView("productsView", "arangosearch", { links: { books: { fields: { title: { analyzers: ["text_en"] } } } } });

    var url = "/_api/view/"+ view._id + "/properties";
    var response = logCurlRequest('GET', url);
    assert(response.code === 200);
    logJsonResponse(response);

    db._dropView("productsView");
    db._drop("books");
```


```curl
---
description: |-
  Using a name:
name: RestViewGetViewPropertiesNameArangoSearch
---

    var coll = db._create("books");
    var view = db._createView("productsView", "arangosearch", { links: { books: { fields: { title: { analyzers: ["text_en"] } } } } });

    var url = "/_api/view/productsView/properties";
    var response = logCurlRequest('GET', url);
    assert(response.code === 200);
    logJsonResponse(response);

    db._dropView("productsView");
    db._drop("books");
```
```openapi
## List all Views

paths:
  /_api/view:
    get:
      operationId: listViews
      description: |
        Returns an object containing a listing of all Views in a database, regardless
        of their type. It is an array of objects with the following attributes:
        - `id`
        - `name`
        - `type`
      responses:
        '200':
          description: |
            The list of Views
      tags:
        - Views
```

**Examples**



```curl
---
description: |-
  Return information about all Views:
name: RestViewGetAllViews
---

    var viewSearchAlias = db._createView("productsView", "search-alias");
    var viewArangoSearch = db._createView("reviewsView", "arangosearch");

    var url = "/_api/view";
    var response = logCurlRequest('GET', url);
    assert(response.code === 200);
    logJsonResponse(response);

    db._dropView("productsView");
    db._dropView("reviewsView");
```
```openapi
## Replace the properties of an arangosearch View

paths:
  /_api/view/{view-name}/properties:
    put:
      operationId: replaceViewProperties
      description: |
        Changes all properties of a View by replacing them.

        On success an object with the following attributes is returned:
        - `id`: The identifier of the View
        - `name`: The name of the View
        - `type`: The View type
        - all additional `arangosearch` View implementation-specific properties
      parameters:
        - name: view-name
          in: path
          required: true
          description: |
            The name of the View.
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                links:
                  description: |
                    Expects an object with the attribute keys being names of to be linked collections,
                    and the link properties as attribute values. See
                    [`arangosearch` View Link Properties](../../../index-and-search/arangosearch/arangosearch-views-reference.md#link-properties)
                    for details.
                  type: object
                cleanupIntervalStep:
                  description: |
                    Wait at least this many commits between removing unused files in the
                    ArangoSearch data directory (default: 2, to disable use: 0).
                    For the case where the consolidation policies merge segments often (i.e. a lot
                    of commit+consolidate), a lower value will cause a lot of disk space to be
                    wasted.
                    For the case where the consolidation policies rarely merge segments (i.e. few
                    inserts/deletes), a higher value will impact performance without any added
                    benefits.

                    _Background:_
                      With every "commit" or "consolidate" operation, a new state of the View'
                      internal data structures is created on disk.
                      Old states/snapshots are released once there are no longer any users
                      remaining.
                      However, the files for the released states/snapshots are left on disk, and
                      only removed by "cleanup" operation.
                  type: integer
                commitIntervalMsec:
                  description: |
                    Wait at least this many milliseconds between committing View data store
                    changes and making documents visible to queries (default: 1000, to disable
                    use: 0).
                    For the case where there are a lot of inserts/updates, a lower value, until
                    commit, will cause the index not to account for them and memory usage would
                    continue to grow.
                    For the case where there are a few inserts/updates, a higher value will impact
                    performance and waste disk space for each commit call without any added
                    benefits.

                    _Background:_
                      For data retrieval, ArangoSearch follow the concept of
                      "eventually-consistent", i.e. eventually all the data in ArangoDB will be
                      matched by corresponding query expressions.
                      The concept of ArangoSearch "commit" operations is introduced to
                      control the upper-bound on the time until document addition/removals are
                      actually reflected by corresponding query expressions.
                      Once a "commit" operation is complete, all documents added/removed prior to
                      the start of the "commit" operation will be reflected by queries invoked in
                      subsequent ArangoDB transactions, in-progress ArangoDB transactions will
                      still continue to return a repeatable-read state.
                  type: integer
                consolidationIntervalMsec:
                  description: |
                    Wait at least this many milliseconds between applying `consolidationPolicy` to
                    consolidate the View data store and possibly release space on the filesystem
                    (default: 10000, to disable use: 0).
                    For the case where there are a lot of data modification operations, a higher
                    value could potentially have the data store consume more space and file handles.
                    For the case where there are a few data modification operations, a lower value
                    will impact performance due to no segment candidates available for
                    consolidation.

                    _Background:_
                      For data modification, ArangoSearch follow the concept of a
                      "versioned data store". Thus old versions of data may be removed once there
                      are no longer any users of the old data. The frequency of the cleanup and
                      compaction operations are governed by `consolidationIntervalMsec` and the
                      candidates for compaction are selected via `consolidationPolicy`.
                  type: integer
                consolidationPolicy:
                  description: |
                    The consolidation policy to apply for selecting which segments should be merged
                    (default: {})

                    _Background:_
                      With each ArangoDB transaction that inserts documents, one or more
                      ArangoSearch-internal segments get created.
                      Similarly, for removed documents the segments that contain such documents
                      will have these documents marked as 'deleted'.
                      Over time, this approach causes a lot of small and sparse segments to be
                      created.
                      A "consolidation" operation selects one or more segments and copies all of
                      their valid documents into a single new segment, thereby allowing the
                      search algorithm to perform more optimally and for extra file handles to be
                      released once old segments are no longer used.

                    Sub-properties:
                      - `type` (string, _optional_):
                        The segment candidates for the "consolidation" operation are selected based
                        upon several possible configurable formulas as defined by their types.
                        The currently supported types are:
                        - `"tier"` (default): consolidate based on segment byte size and live
                          document count as dictated by the customization attributes. If this type
                          is used, then below `segments*` and `minScore` properties are available.
                        - `"bytes_accum"`: consolidate if and only if
                          `{threshold} > (segment_bytes + sum_of_merge_candidate_segment_bytes) / all_segment_bytes`
                          i.e. the sum of all candidate segment byte size is less than the total
                          segment byte size multiplied by the `{threshold}`. If this type is used,
                          then below `threshold` property is available.
                      - `threshold` (number, _optional_): value in the range `[0.0, 1.0]`
                      - `segmentsBytesFloor` (number, _optional_): Defines the value (in bytes) to
                        treat all smaller segments as equal for consolidation selection
                        (default: 2097152)
                      - `segmentsBytesMax` (number, _optional_): Maximum allowed size of all
                        consolidated segments in bytes (default: 5368709120)
                      - `segmentsMax` (number, _optional_): The maximum number of segments that will
                        be evaluated as candidates for consolidation (default: 10)
                      - `segmentsMin` (number, _optional_): The minimum number of segments that will
                        be evaluated as candidates for consolidation (default: 1)
                      - `minScore` (number, _optional_): (default: 0)
                  type: object
      responses:
        '400':
          description: |
            If the `view-name` is missing, then a *HTTP 400* is returned.
        '404':
          description: |
            If the `view-name` is unknown, then a *HTTP 404* is returned.
      tags:
        - Views
```

**Examples**



```curl
---
description: ''
name: RestViewPutPropertiesArangoSearch
---

    var view = db._createView("productsView", "arangosearch");

    var url = "/_api/view/"+ view.name() + "/properties";
    var response = logCurlRequest('PUT', url, { "locale": "en" });
    assert(response.code === 200);
    logJsonResponse(response);

    db._dropView(view.name());
```
```openapi
## Update the properties of an arangosearch View

paths:
  /_api/view/{view-name}/properties:
    patch:
      operationId: updateViewProperties
      description: |
        Partially changes the properties of a View by updating the specified attributes.

        On success an object with the following attributes is returned:
        - `id`: The identifier of the View
        - `name`: The name of the View
        - `type`: The View type
        - all additional `arangosearch` View implementation-specific properties
      parameters:
        - name: view-name
          in: path
          required: true
          description: |
            The name of the View.
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                links:
                  description: |
                    Expects an object with the attribute keys being names of to be linked collections,
                    and the link properties as attribute values. See
                    [`arangosearch` View Link Properties](../../../index-and-search/arangosearch/arangosearch-views-reference.md#link-properties)
                    for details.
                  type: object
                cleanupIntervalStep:
                  description: |
                    Wait at least this many commits between removing unused files in the
                    ArangoSearch data directory (default: 2, to disable use: 0).
                    For the case where the consolidation policies merge segments often (i.e. a lot
                    of commit+consolidate), a lower value will cause a lot of disk space to be
                    wasted.
                    For the case where the consolidation policies rarely merge segments (i.e. few
                    inserts/deletes), a higher value will impact performance without any added
                    benefits.

                    _Background:_
                      With every "commit" or "consolidate" operation, a new state of the View's
                      internal data structures is created on disk.
                      Old states/snapshots are released once there are no longer any users
                      remaining.
                      However, the files for the released states/snapshots are left on disk, and
                      only removed by "cleanup" operation.
                  type: integer
                commitIntervalMsec:
                  description: |
                    Wait at least this many milliseconds between committing View data store
                    changes and making documents visible to queries (default: 1000, to disable
                    use: 0).
                    For the case where there are a lot of inserts/updates, a lower value, until
                    commit, will cause the index not to account for them and memory usage would
                    continue to grow.
                    For the case where there are a few inserts/updates, a higher value will impact
                    performance and waste disk space for each commit call without any added
                    benefits.

                    _Background:_
                      For data retrieval, ArangoSearch follows the concept of
                      "eventually-consistent", i.e. eventually all the data in ArangoDB will be
                      matched by corresponding query expressions.
                      The concept of ArangoSearch "commit" operations is introduced to
                      control the upper-bound on the time until document addition/removals are
                      actually reflected by corresponding query expressions.
                      Once a "commit" operation is complete, all documents added/removed prior to
                      the start of the "commit" operation will be reflected by queries invoked in
                      subsequent ArangoDB transactions, in-progress ArangoDB transactions will
                      still continue to return a repeatable-read state.
                  type: integer
                consolidationIntervalMsec:
                  description: |
                    Wait at least this many milliseconds between applying `consolidationPolicy` to
                    consolidate the View data store and possibly release space on the filesystem
                    (default: 10000, to disable use: 0).
                    For the case where there are a lot of data modification operations, a higher
                    value could potentially have the data store consume more space and file handles.
                    For the case where there are a few data modification operations, a lower value
                    will impact performance due to no segment candidates available for
                    consolidation.

                    _Background:_
                      For data modification, ArangoSearch follow the concept of a
                      "versioned data store". Thus old versions of data may be removed once there
                      are no longer any users of the old data. The frequency of the cleanup and
                      compaction operations are governed by `consolidationIntervalMsec` and the
                      candidates for compaction are selected via `consolidationPolicy`.
                  type: integer
                consolidationPolicy:
                  description: |
                    The consolidation policy to apply for selecting which segments should be merged
                    (default: {})

                    _Background:_
                      With each ArangoDB transaction that inserts documents, one or more
                      ArangoSearch-internal segments get created.
                      Similarly, for removed documents the segments that contain such documents
                      will have these documents marked as 'deleted'.
                      Over time, this approach causes a lot of small and sparse segments to be
                      created.
                      A "consolidation" operation selects one or more segments and copies all of
                      their valid documents into a single new segment, thereby allowing the
                      search algorithm to perform more optimally and for extra file handles to be
                      released once old segments are no longer used.

                    Sub-properties:
                      - `type` (string, _optional_):
                        The segment candidates for the "consolidation" operation are selected based
                        upon several possible configurable formulas as defined by their types.
                        The currently supported types are:
                        - `"tier"` (default): consolidate based on segment byte size and live
                          document count as dictated by the customization attributes. If this type
                          is used, then below `segments*` and `minScore` properties are available.
                        - `"bytes_accum"`: consolidate if and only if
                          `{threshold} > (segment_bytes + sum_of_merge_candidate_segment_bytes) / all_segment_bytes`
                          i.e. the sum of all candidate segment byte size is less than the total
                          segment byte size multiplied by the `{threshold}`. If this type is used,
                          then below `threshold` property is available.
                      - `threshold` (number, _optional_): value in the range `[0.0, 1.0]`
                      - `segmentsBytesFloor` (number, _optional_): Defines the value (in bytes) to
                        treat all smaller segments as equal for consolidation selection
                        (default: 2097152)
                      - `segmentsBytesMax` (number, _optional_): Maximum allowed size of all
                        consolidated segments in bytes (default: 5368709120)
                      - `segmentsMax` (number, _optional_): The maximum number of segments that will
                        be evaluated as candidates for consolidation (default: 10)
                      - `segmentsMin` (number, _optional_): The minimum number of segments that will
                        be evaluated as candidates for consolidation (default: 1)
                      - `minScore` (number, _optional_): (default: 0)
                  type: object
      responses:
        '400':
          description: |
            If the `view-name` is missing, then a *HTTP 400* is returned.
        '404':
          description: |
            If the `view-name` is unknown, then a *HTTP 404* is returned.
      tags:
        - Views
```

**Examples**



```curl
---
description: ''
name: RestViewPatchPropertiesArangoSearch
---

    var view = db._createView("productsView", "arangosearch");

    var url = "/_api/view/"+ view.name() + "/properties";
    var response = logCurlRequest('PATCH', url, { "locale": "en" });
    assert(response.code === 200);
    logJsonResponse(response);

    db._dropView("productsView");
```
```openapi
## Rename a View

paths:
  /_api/view/{view-name}/rename:
    put:
      operationId: renameView
      description: |
        Renames a View. Expects an object with the attribute(s)
        - `name`: The new name

        It returns an object with the attributes
        - `id`: The identifier of the View.
        - `name`: The new name of the View.
        - `type`: The View type.

        **Note**: This method is not available in a cluster.
      parameters:
        - name: view-name
          in: path
          required: true
          description: |
            The name of the View to rename.
          schema:
            type: string
      responses:
        '400':
          description: |
            If the `view-name` is missing, then a *HTTP 400* is returned.
        '404':
          description: |
            If the `view-name` is unknown, then a *HTTP 404* is returned.
      tags:
        - Views
```

**Examples**



```curl
---
description: ''
name: RestViewPutRename
---

    var view = db._createView("productsView", "arangosearch");

    var url = "/_api/view/" + view.name() + "/rename";
    var response = logCurlRequest('PUT', url, { name: "catalogView" });
    assert(response.code === 200);
    logJsonResponse(response);

    db._dropView("catalogView");
```
```openapi
## Drop a View

paths:
  /_api/view/{view-name}:
    delete:
      operationId: deleteView
      description: |
        Drops the View identified by `view-name`.

        If the View was successfully dropped, an object is returned with
        the following attributes:
        - `error`: `false`
        - `id`: The identifier of the dropped View
      parameters:
        - name: view-name
          in: path
          required: true
          description: |
            The name of the View to drop.
          schema:
            type: string
      responses:
        '400':
          description: |
            If the `view-name` is missing, then a *HTTP 400* is returned.
        '404':
          description: |
            If the `view-name` is unknown, then a *HTTP 404* is returned.
      tags:
        - Views
```

**Examples**



```curl
---
description: |-
  Using an identifier:
name: RestViewDeleteViewIdentifierArangoSearch
---

    var view = db._createView("productsView", "arangosearch");

    var url = "/_api/view/"+ view._id;
    var response = logCurlRequest('DELETE', url);
    assert(response.code === 200);
    logJsonResponse(response);
```


```curl
---
description: |-
  Using a name:
name: RestViewDeleteViewNameArangoSearch
---

    var view = db._createView("productsView", "arangosearch");

    var url = "/_api/view/productsView";
    var response = logCurlRequest('DELETE', url);
    assert(response.code === 200);
    logJsonResponse(response);
```
