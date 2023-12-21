---
title: Working with inverted indexes
menuTitle: Inverted
weight: 10
description: ''
archetype: default
---

## Create an inverted index

```openapi
paths:
  /_api/index#inverted:
    post:
      operationId: createIndexInverted
      description: |
        Creates an inverted index for the collection `collection-name`, if
        it does not already exist. The call expects an object containing the index
        details.
      parameters:
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
                    Must be equal to `"inverted"`.
                  type: string
                name:
                  description: |
                    An easy-to-remember name for the index to look it up or refer to it in index hints.
                    Index names are subject to the same character restrictions as collection names.
                    If omitted, a name is auto-generated so that it is unique with respect to the
                    collection, e.g. `idx_832910498`.
                  type: string
                fields:
                  description: |
                    An array of attribute paths. You can use strings to index the fields with the
                    default options, or objects to specify options for the fields (with the
                    attribute path in the `name` property), or a mix of both.
                  type: array
                  items:
                    type: object
                    required:
                      - name
                    properties:
                      name:
                        description: |
                          An attribute path. The `.` character denotes sub-attributes.
                          You can expand one array attribute with `[*]`.
                        type: string
                      analyzer:
                        description: |
                          The name of an Analyzer to use for this field.

                          Default: the value defined by the top-level `analyzer` option.
                        type: string
                      features:
                        description: |
                          A list of Analyzer features to use for this field. You can set this option to
                          overwrite what features are enabled for the `analyzer`. Possible features:
                          - `"frequency"`
                          - `"norm"`
                          - `"position"`
                          - `"offset"`

                          Default: the features as defined by the Analyzer itself, or inherited from the
                          top-level `features` option if the `analyzer` option adjacent to this option is
                          not set.
                        type: array
                        items:
                          type: string
                      includeAllFields:
                        description: |
                          This option only applies if you use the inverted index in a `search-alias` Views.

                          If set to `true`, then all sub-attributes of this field are indexed, excluding
                          any sub-attributes that are configured separately by other elements in the
                          `fields` array (and their sub-attributes). The `analyzer` and `features`
                          properties apply to the sub-attributes.

                          If set to `false`, then sub-attributes are ignored.

                          Default: the value defined by the top-level `includeAllFields` option.
                        type: boolean
                      searchField:
                        description: |
                          This option only applies if you use the inverted index in a `search-alias` Views.

                          You can set the option to `true` to get the same behavior as with `arangosearch`
                          Views regarding the indexing of array values for this field. If enabled, both,
                          array and primitive values (strings, numbers, etc.) are accepted. Every element
                          of an array is indexed according to the `trackListPositions` option.

                          If set to `false`, it depends on the attribute path. If it explicitly expands an
                          array (`[*]`), then the elements are indexed separately. Otherwise, the array is
                          indexed as a whole, but only `geopoint` and `aql` Analyzers accept array inputs.
                          You cannot use an array expansion if `searchField` is enabled.

                          Default: the value defined by the top-level `searchField` option.
                        type: boolean
                      trackListPositions:
                        description: |
                          This option only applies if you use the inverted index in a `search-alias` Views,
                          and `searchField` needs to be `true`.

                          If set to `true`, then track the value position in arrays for array values.
                          For example, when querying a document like `{ attr: [ "valueX", "valueY", "valueZ" ] }`,
                          you need to specify the array element, e.g. `doc.attr[1] == "valueY"`.

                          If set to `false`, all values in an array are treated as equal alternatives.
                          You don't specify an array element in queries, e.g. `doc.attr == "valueY"`, and
                          all elements are searched for a match.

                          Default: the value defined by the top-level `trackListPositions` option.
                        type: boolean
                      cache:
                        description: |
                          Enable this option to always cache the field normalization values in memory
                          for this specific field. This can improve the performance of scoring and
                          ranking queries. Otherwise, these values are memory-mapped and it is up to the
                          operating system to load them from disk into memory and to evict them from memory.

                          Normalization values are computed for fields which are processed with Analyzers
                          that have the `"norm"` feature enabled. These values are used to score fairer if
                          the same tokens occur repeatedly, to emphasize these documents less.

                          You can also enable this option to always cache auxiliary data used for querying
                          fields that are indexed with Geo Analyzers in memory for this specific field.
                          This can improve the performance of geo-spatial queries.

                          Default: the value defined by the top-level `cache` option.

                          This property is available in the Enterprise Edition only.

                          See the `--arangosearch.columns-cache-limit` startup option to control the
                          memory consumption of this cache. You can reduce the memory usage of the column
                          cache in cluster deployments by only using the cache for leader shards, see the
                          `--arangosearch.columns-cache-only-leader` startup option (introduced in v3.10.6).
                        type: boolean
                      nested:
                        description: |
                          Index the specified sub-objects that are stored in an array. Other than with the
                          `fields` property, the values get indexed in a way that lets you query for
                          co-occurring values. For example, you can search the sub-objects and all the
                          conditions need to be met by a single sub-object instead of across all of them.

                          This property is available in the Enterprise Edition only.
                        type: array
                        items:
                          type: object
                          required:
                            - name
                          properties:
                            name:
                              description: |
                                An attribute path. The `.` character denotes sub-attributes.
                              type: string
                            analyzer:
                              description: |
                                The name of an Analyzer to use for this field.
                                Default: the value defined by the parent field, or the top-level `analyzer` option.
                              type: string
                            features:
                              description: |
                                A list of Analyzer features to use for this field. You can set this option to
                                overwrite what features are enabled for the `analyzer`. Possible features:
                                - `"frequency"`
                                - `"norm"`
                                - `"position"`
                                - `"offset"`

                                Default: the features as defined by the Analyzer itself, or inherited from the
                                parent field's or top-level `features` option if no `analyzer` option is set
                                at a deeper level, closer to this option.
                              type: array
                              items:
                                type: string
                            searchField:
                              description: |
                                This option only applies if you use the inverted index in a `search-alias` Views.

                                You can set the option to `true` to get the same behavior as with `arangosearch`
                                Views regarding the indexing of array values for this field. If enabled, both,
                                array and primitive values (strings, numbers, etc.) are accepted. Every element
                                of an array is indexed according to the `trackListPositions` option.

                                If set to `false`, it depends on the attribute path. If it explicitly expands an
                                array (`[*]`), then the elements are indexed separately. Otherwise, the array is
                                indexed as a whole, but only `geopoint` and `aql` Analyzers accept array inputs.
                                You cannot use an array expansion if `searchField` is enabled.

                                Default: the value defined by the top-level `searchField` option.
                              type: boolean
                            cache:
                              description: |
                                Enable this option to always cache the field normalization values in memory
                                for this specific nested field. This can improve the performance of scoring and
                                ranking queries. Otherwise, these values are memory-mapped and it is up to the
                                operating system to load them from disk into memory and to evict them from memory.

                                Normalization values are computed for fields which are processed with Analyzers
                                that have the `"norm"` feature enabled. These values are used to score fairer if
                                the same tokens occur repeatedly, to emphasize these documents less.

                                You can also enable this option to always cache auxiliary data used for querying
                                fields that are indexed with Geo Analyzers in memory for this specific nested field.
                                This can improve the performance of geo-spatial queries.

                                Default: the value defined by the top-level `cache` option.

                                This property is available in the Enterprise Edition only.

                                See the `--arangosearch.columns-cache-limit` startup option to control the
                                memory consumption of this cache. You can reduce the memory usage of the column
                                cache in cluster deployments by only using the cache for leader shards, see the
                                `--arangosearch.columns-cache-only-leader` startup option (introduced in v3.10.6).
                              type: boolean
                            nested:
                              description: |
                                You can recursively index sub-objects. See the above description of the
                                `nested` option.
                              type: array
                              items:
                                type: object
                searchField:
                  description: |
                    This option only applies if you use the inverted index in a `search-alias` Views.

                    You can set the option to `true` to get the same behavior as with `arangosearch`
                    Views regarding the indexing of array values as the default. If enabled, both,
                    array and primitive values (strings, numbers, etc.) are accepted. Every element
                    of an array is indexed according to the `trackListPositions` option.

                    If set to `false`, it depends on the attribute path. If it explicitly expands an
                    array (`[*]`), then the elements are indexed separately. Otherwise, the array is
                    indexed as a whole, but only `geopoint` and `aql` Analyzers accept array inputs.
                    You cannot use an array expansion if `searchField` is enabled.

                    Default: `false`
                  type: boolean
                cache:
                  description: |
                    Enable this option to always cache the field normalization values in memory
                    for all fields by default. This can improve the performance of scoring and
                    ranking queries. Otherwise, these values are memory-mapped and it is up to the
                    operating system to load them from disk into memory and to evict them from memory.

                    Normalization values are computed for fields which are processed with Analyzers
                    that have the `"norm"` feature enabled. These values are used to score fairer if
                    the same tokens occur repeatedly, to emphasize these documents less.

                    You can also enable this option to always cache auxiliary data used for querying
                    fields that are indexed with Geo Analyzers in memory for all fields by default.
                    This can improve the performance of geo-spatial queries.

                    Default: `false`

                    This property is available in the Enterprise Edition only.

                    See the `--arangosearch.columns-cache-limit` startup option to control the
                    memory consumption of this cache. You can reduce the memory usage of the column
                    cache in cluster deployments by only using the cache for leader shards, see the
                    `--arangosearch.columns-cache-only-leader` startup option (introduced in v3.10.6).
                  type: boolean
                storedValues:
                  description: |
                    The optional `storedValues` attribute can contain an array of objects with paths
                    to additional attributes to store in the index. These additional attributes
                    cannot be used for index lookups or for sorting, but they can be used for
                    projections. This allows an index to fully cover more queries and avoid extra
                    document lookups.

                    You may use the following shorthand notations on index creation instead of
                    an array of objects. The default compression and cache settings are used in
                    this case:

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
                  type: array
                  items:
                    type: object
                    required:
                      - fields
                    properties:
                      fields:
                        description: |
                          A list of attribute paths. The `.` character denotes sub-attributes.
                        type: array
                        items:
                          type: string
                      compression:
                        description: |
                          Defines how to compress the attribute values. Possible values:
                          - `"lz4"` (default): use LZ4 fast compression.
                          - `"none"`: disable compression to trade space for speed.
                        type: string
                      cache:
                        description: |
                          Enable this option to always cache stored values in memory. This can improve the
                          query performance if stored values are involved. Otherwise, these values are
                          memory-mapped and it is up to the operating system to load them from disk into
                          memory and to evict them from memory.

                          Default: `false`

                          This property is available in the Enterprise Edition only.

                          See the `--arangosearch.columns-cache-limit` startup option to control the
                          memory consumption of this cache. You can reduce the memory usage of the column
                          cache in cluster deployments by only using the cache for leader shards, see the
                          `--arangosearch.columns-cache-only-leader` startup option (introduced in v3.10.6).
                        type: boolean
                primarySort:
                  description: |
                    You can define a primary sort order to enable an AQL optimization. If a query
                    iterates over all documents of a collection, wants to sort them by attribute values,
                    and the (left-most) fields to sort by, as well as their sorting direction, match
                    with the `primarySort` definition, then the `SORT` operation is optimized away.
                  type: object
                  required:
                    - fields
                  properties:
                    fields:
                      description: |
                        An array of the fields to sort the index by and the direction to sort each field in.
                      type: array
                      items:
                        type: object
                        required:
                          - field
                          - direction
                        properties:
                          field:
                            description: |
                              An attribute path. The `.` character denotes sub-attributes.
                            type: string
                          direction:
                            description: |
                              The sorting direction. Possible values:
                              - `"asc` for ascending
                              - `"desc"` for descending
                            type: string
                    compression:
                      description: |
                        Defines how to compress the primary sort data. Possible values:
                        - `"lz4"` (default): use LZ4 fast compression.
                        - `"none"`: disable compression to trade space for speed.
                      type: string
                    cache:
                      description: |
                        Enable this option to always cache the primary sort columns in memory. This can
                        improve the performance of queries that utilize the primary sort order.
                        Otherwise, these values are memory-mapped and it is up to the operating system
                        to load them from disk into memory and to evict them from memory.

                        Default: `false`

                        This property is available in the Enterprise Edition only.

                        See the `--arangosearch.columns-cache-limit` startup option to control the
                        memory consumption of this cache. You can reduce the memory usage of the column
                        cache in cluster deployments by only using the cache for leader shards, see the
                        `--arangosearch.columns-cache-only-leader` startup option (introduced in v3.10.6).
                      type: boolean
                primaryKeyCache:
                  description: |
                    Enable this option to always cache the primary key column in memory. This can
                    improve the performance of queries that return many documents. Otherwise, these
                    values are memory-mapped and it is up to the operating system to load them from
                    disk into memory and to evict them from memory.

                    Default: `false`

                    See the `--arangosearch.columns-cache-limit` startup option to control the
                    memory consumption of this cache. You can reduce the memory usage of the column
                    cache in cluster deployments by only using the cache for leader shards, see the
                    `--arangosearch.columns-cache-only-leader` startup option (introduced in v3.10.6).
                  type: boolean
                analyzer:
                  description: |
                    The name of an Analyzer to use by default. This Analyzer is applied to the
                    values of the indexed fields for which you don't define Analyzers explicitly.

                    Default: `identity`
                  type: string
                features:
                  description: |
                    A list of Analyzer features. You can set this option to overwrite what features
                    are enabled for the default `analyzer`. Possible features:
                    - `"frequency"`
                    - `"norm"`
                    - `"position"`
                    - `"offset"`

                    Default: the features as defined by the Analyzer itself.
                  type: array
                  items:
                    type: string
                includeAllFields:
                  description: |
                    This option only applies if you use the inverted index in a `search-alias` Views.

                    If set to `true`, then all document attributes are indexed, excluding any
                    sub-attributes that are configured in the `fields` array (and their sub-attributes).
                    The `analyzer` and `features` properties apply to the sub-attributes.

                    Default: `false`

                    **Warning**: Using `includeAllFields` for a lot of attributes in combination
                    with complex Analyzers may significantly slow down the indexing process.
                  type: boolean
                trackListPositions:
                  description: |
                    This option only applies if you use the inverted index in a `search-alias` Views,
                    and `searchField` needs to be `true`.

                    If set to `true`, then track the value position in arrays for array values.
                    For example, when querying a document like `{ attr: [ "valueX", "valueY", "valueZ" ] }`,
                    you need to specify the array element, e.g. `doc.attr[1] == "valueY"`.

                    If set to `false`, all values in an array are treated as equal alternatives.
                    You don't specify an array element in queries, e.g. `doc.attr == "valueY"`, and
                    all elements are searched for a match.
                  type: boolean
                parallelism:
                  description: |
                    The number of threads to use for indexing the fields. Default: `2`
                  type: integer
                inBackground:
                  description: |
                    This attribute can be set to `true` to create the index
                    in the background, not write-locking the underlying collection for
                    as long as if the index is built in the foreground. The default value is `false`.
                  type: boolean
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
                      With every "commit" or "consolidate" operation, a new state of the
                      inverted index' internal data structures is created on disk.
                      Old states/snapshots are released once there are no longer any users
                      remaining.
                      However, the files for the released states/snapshots are left on disk, and
                      only removed by "cleanup" operation.
                  type: integer
                commitIntervalMsec:
                  description: |
                    Wait at least this many milliseconds between committing inverted index data store
                    changes and making documents visible to queries (default: 1000, to disable
                    use: 0).
                    For the case where there are a lot of inserts/updates, a higher value causes the
                    index not to account for them and memory usage continues to grow until the commit.
                    For the case where there are a few inserts/updates, a lower value impacts
                    performance (because of synchronous locking) and wastes disk space for each
                    commit call.

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
                    consolidate the inverted index data store and possibly release space on the filesystem
                    (default: 1000, to disable use: 0).
                    For the case where there are a lot of data modification operations, a higher
                    value could potentially have the data store consume more space and file handles.
                    For the case where there are a few data modification operations, a lower value
                    will impact performance due to no segment candidates available for
                    consolidation.

                    _Background:_
                      For data modification, ArangoSearch follows the concept of a
                      "versioned data store". Thus old versions of data may be removed once there
                      are no longer any users of the old data. The frequency of the cleanup and
                      compaction operations are governed by `consolidationIntervalMsec` and the
                      candidates for compaction are selected via `consolidationPolicy`.
                  type: integer
                consolidationPolicy:
                  description: |
                    The consolidation policy to apply for selecting which segments should be merged
                    (default: {}).

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
                  type: object
                  properties:
                    type:
                      description: |
                        The segment candidates for the "consolidation" operation are selected based
                        upon several possible configurable formulas as defined by their types.
                        The supported types are:

                        - `"tier"` (default): consolidate based on segment byte size and live
                          document count as dictated by the customization attributes.
                      type: string
                    segmentsBytesFloor:
                      description: |
                        Defines the value (in bytes) to treat all smaller segments as equal for
                        consolidation selection. Default: `2097152`
                      type: integer
                    segmentsBytesMax:
                      description: |
                        The maximum allowed size of all consolidated segments in bytes.
                        Default: `5368709120`
                      type: integer
                    segmentsMax:
                      description: |
                        The maximum number of segments that are evaluated as candidates for
                        consolidation. Default: `10`
                      type: integer
                    segmentsMin:
                      description: |
                        The minimum number of segments that are evaluated as candidates for
                        consolidation. Default: `1`
                      type: integer
                    minScore:
                      description: |
                        Filter out consolidation candidates with a score less than this. Default: `0`
                      type: integer
                writebufferIdle:
                  description: |
                    Maximum number of writers (segments) cached in the pool
                    (default: 64, use 0 to disable)
                  type: integer
                writebufferActive:
                  description: |
                    Maximum number of concurrent active writers (segments) that perform a
                    transaction. Other writers (segments) wait till current active writers
                    (segments) finish (default: 0, use 0 to disable)
                  type: integer
                writebufferSizeMax:
                  description: |
                    Maximum memory byte size per writer (segment) before a writer (segment) flush
                    is triggered. `0` value turns off this limit for any writer (buffer) and data
                    will be flushed periodically based on the value defined for the flush thread
                    (ArangoDB server startup option). `0` value should be used carefully due to
                    high potential memory consumption
                    (default: 33554432, use 0 to disable)
                  type: integer
      responses:
        '200':
          description: |
            If the index already exists, then a *HTTP 200* is returned.
        '201':
          description: |
            If the index does not already exist and can be created, then a *HTTP 201*
            is returned.
        '404':
          description: |
            If the `collection-name` is unknown, then a *HTTP 404* is returned.
      tags:
        - Indexes
```

**Examples**

```curl
---
description: |-
  Creating an inverted index:
name: RestIndexCreateNewInverted
---
var cn = "products";
db._create(cn);

var url = "/_api/index?collection=" + cn;
var body = {
  type: "inverted",
  fields: [ "a", { name: "b", analyzer: "text_en" } ]
};

var response = logCurlRequest('POST', url, body);

assert(response.code === 201);

logJsonResponse(response);
db._drop(cn);
```
