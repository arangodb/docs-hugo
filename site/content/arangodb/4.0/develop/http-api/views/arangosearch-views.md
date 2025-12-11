---
title: HTTP interface for arangosearch Views
menuTitle: '`arangosearch` Views'
weight: 10
description: >-
  The HTTP API for Views lets you manage `arangosearch` Views, including
  handling the general View properties and View links
---
## Create an arangosearch View

```openapi
paths:
  /_db/{database-name}/_api/view:
    post:
      operationId: createView
      description: |
        Creates a new View with a given name and properties if it does not
        already exist.
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of the database.
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required:
                - name
                - type
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
                  example: arangosearch
                links:
                  description: |
                    Expects an object with the attribute keys being names of to be linked collections,
                    and the link properties as attribute values. Example:

                    ```json
                    {
                      "name": "arangosearch",
                      "links": {
                        "coll": {
                          "fields": {
                            "my_attribute": {
                              "fields": {
                                "my_sub_attribute": {
                                  "analyzers": ["text_en"]
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                    ```

                    See [`arangosearch` View Link Properties](../../../indexes-and-search/arangosearch/arangosearch-views-reference.md#link-properties)
                    for details.
                  type: object
                primarySort:
                  description: |
                    You can define a primary sort order to enable an AQL
                    optimization. If a query iterates over all documents of a View,
                    wants to sort them by attribute values and the (left-most)
                    fields to sort by as well as their sorting direction match
                    with the `primarySort` definition, then the `SORT` operation is
                    optimized away. This option is immutable.

                    Expects an array of objects, each specifying a field
                    (attribute path) and a sort direction:
                    `[ { "field": "attr", "direction": "asc"}, … ]`
                  type: array
                  default: []
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
                          The sort direction.

                          - `"asc"` for ascending
                          - `"desc"` for descending
                        type: string
                        enum: [asc, desc]
                primarySortCompression:
                  description: |
                    Defines how to compress the primary sort data.

                    - `"lz4"`: use LZ4 fast compression.
                    - `"none"`: disable compression to trade space for speed.

                    This option is immutable.
                  type: string
                  enum: [lz4, none]
                  default: lz4
                primarySortCache:
                  description: |
                    If you enable this option, then the primary sort columns are always cached in
                    memory. This can improve the
                    performance of queries that utilize the primary sort order. Otherwise, these
                    values are memory-mapped and it is up to the operating system to load them from
                    disk into memory and to evict them from memory.

                    This option is immutable.

                    See the `--arangosearch.columns-cache-limit` startup option to control the
                    memory consumption of this cache. You can reduce the memory usage of the column
                    cache in cluster deployments by only using the cache for leader shards, see the
                    `--arangosearch.columns-cache-only-leader` startup option.
                  type: boolean
                primaryKeyCache:
                  description: |
                    If you enable this option, then the primary key columns are always cached in
                    memory (introduced in v3.9.6). This can improve the
                    performance of queries that return many documents. Otherwise, these values are
                    memory-mapped and it is up to the operating system to load them from disk into
                    memory and to evict them from memory.

                    This option is immutable.

                    See the `--arangosearch.columns-cache-limit` startup option to control the
                    memory consumption of this cache. You can reduce the memory usage of the column
                    cache in cluster deployments by only using the cache for leader shards, see the
                    `--arangosearch.columns-cache-only-leader` startup option (introduced in v3.10.6).
                  type: boolean
                optimizeTopK:
                  description: |
                    An array of strings defining sort expressions that you want to optimize.
                    This is also known as _WAND optimization_ (introduced in v3.12.0).

                    This option is immutable.

                    If you query a View with the `SEARCH` operation in combination with a
                    `SORT` and `LIMIT` operation, search results can be retrieved faster if the
                    `SORT` expression matches one of the optimized expressions.

                    Only sorting by highest rank is supported, that is, sorting by the result
                    of a scoring function in descending order (`DESC`). Use `@doc` in the expression
                    where you would normally pass the document variable emitted by the `SEARCH`
                    operation to the scoring function.

                    You can define up to 64 expressions per View.

                    Example: `["BM25(@doc) DESC", "TFIDF(@doc, true) DESC"]`
                  type: array
                  default: []
                  items:
                    type: string
                storedValues:
                  description: |
                    An array of objects to describe which document attributes to store in the View
                    index. It can then cover search queries, which means the
                    data can be taken from the index directly and accessing the storage engine can
                    be avoided.

                    This option is immutable.

                    Each object is expected in the following form:

                    `{ "fields": [ "attr1", "attr2", ... "attrN" ], "compression": "none", "cache": false }`

                    You may use the following shorthand notations on View creation instead of
                    an array of objects as described above. The default compression and cache
                    settings are used in this case:

                    - An array of strings, like `["attr1", "attr2"]`, to place each attribute into
                      a separate column of the index.

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
                    which allows you to store meta data about attribute values in the View index.
                  type: array
                  default: []
                  items:
                    type: object
                    required:
                      - fields
                    properties:
                      fields:
                        description: |
                          An array of strings with one or more document attribute paths.
                          The specified attributes are placed into a single column of the index.
                          A column with all fields that are involved in common search queries is
                          ideal for performance. The column should not include too many unneeded
                          fields, however.
                        type: array
                        items:
                          type: string
                      compression:
                        description: |
                          Defines the compression type used for the internal column-store.
                          
                          - `"lz4"`: LZ4 fast compression
                          - `"none"`: no compression
                        type: string
                        enum: [lz4, none]
                        default: lz4
                      cache:
                        description: |
                          Whether to always cache stored values in memory.
                          This can improve the query performance if stored values are involved.
                          Otherwise, these values are memory-mapped and it is up to the operating system
                          to load them from disk into memory and to evict them from memory.

                          See the `--arangosearch.columns-cache-limit` startup option to control the
                          memory consumption of this cache. You can reduce the memory usage of the
                          column cache in cluster deployments by only using the cache for leader shards,
                          see the `--arangosearch.columns-cache-only-leader` startup option.
                        type: boolean
                        default: false
                cleanupIntervalStep:
                  description: |
                    Wait at least this many commits between removing unused files in the
                    ArangoSearch data directory (`0` = disable).
                    For the case where the consolidation policies merge segments often (i.e. a lot
                    of commit+consolidate), a lower value causes a lot of disk space to be
                    wasted.
                    For the case where the consolidation policies rarely merge segments (i.e. few
                    inserts/deletes), a higher value impacts performance without any added
                    benefits.

                    _Background:_
                      With every "commit" or "consolidate" operation, a new state of the View's
                      internal data structures is created on disk.
                      Old states/snapshots are released once there are no longer any users
                      remaining.
                      However, the files for the released states/snapshots are left on disk, and
                      only removed by "cleanup" operation.
                  type: integer
                  default: 2
                commitIntervalMsec:
                  description: |
                    Wait at least this many milliseconds between committing View data store
                    changes and making documents visible to queries (`0` = disable).
                    For the case where there are a lot of inserts/updates, a higher value causes the
                    index not to account for them and memory usage continues to grow until the commit.
                    A lower value impacts performance, including the case where there are no or only a
                    few inserts/updates because of synchronous locking, and it wastes disk space for
                    each commit call.

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
                  default: 1000
                consolidationIntervalMsec:
                  description: |
                    Wait at least this many milliseconds between applying `consolidationPolicy` to
                    consolidate the View data store and possibly release space on the filesystem
                    (`0` = disable).
                    For the case where there are a lot of data modification operations, a higher
                    value could potentially have the data store consume more space and file handles.
                    For the case where there are a few data modification operations, a lower value
                    impacts performance due to no segment candidates being available for
                    consolidation.

                    _Background:_
                      For data modification, ArangoSearch follows the concept of a
                      "versioned data store". Thus old versions of data may be removed once there
                      are no longer any users of the old data. The frequency of the cleanup and
                      compaction operations are governed by `consolidationIntervalMsec` and the
                      candidates for compaction are selected via `consolidationPolicy`.
                  type: integer
                  default: 5000
                consolidationPolicy:
                  description: |
                    The consolidation policy to apply for selecting which segments should be merged.

                    - If the `tier` type is used, then the `segments*` and `minScore` properties are available.
                    - If the `bytes_accum` type is used, then the `threshold` property is available.

                    _Background:_
                      With each ArangoDB transaction that inserts documents, one or more
                      ArangoSearch-internal segments get created.
                      Similarly, for removed documents, the segments that contain such documents
                      have these documents marked as 'deleted'.
                      Over time, this approach causes a lot of small and sparse segments to be
                      created.
                      A "consolidation" operation selects one or more segments and copies all of
                      their valid documents into a single new segment, thereby allowing the
                      search algorithm to perform more optimally and for extra file handles to be
                      released once old segments are no longer used.
                  type: object
                  required:
                    - type
                  properties:
                    type:
                      description: |
                        The segment candidates for the "consolidation" operation are selected based
                        upon several possible configurable formulas as defined by their types.
                        The currently supported types are:
                        - `"tier"`: consolidate based on segment byte size and live
                          document count as dictated by the customization attributes. 
                        - `"bytes_accum"`: consolidate if and only if
                          `{threshold} > (segment_bytes + sum_of_merge_candidate_segment_bytes) / all_segment_bytes`
                          i.e. the sum of all candidate segment byte size is less than the total
                          segment byte size multiplied by the `{threshold}`.
                      type: string
                      enum: [tier, bytes_accum]
                      default: tier
                    threshold:
                      description: |
                        A value in the range `[0.0, 1.0]`.
                      type: number
                      default: 0
                      minimum: 0.0
                      maximum: 1.0
                    segmentsBytesMax:
                      description: |
                        Maximum allowed size of all consolidated segments in bytes.
                      type: integer
                      default: 8589934592
                    maxSkewThreshold:
                      description: |
                        The skew describes how much segment files vary in file size. It is a number
                        between `0.0` and `1.0` and is calculated by dividing the largest file size
                        of a set of segment files by the total size. For example, the skew of a
                        200 MiB, 300 MiB, and 500 MiB segment file is `0.5` (`500 / 1000`).

                        A large `maxSkewThreshold` value allows merging large segment files with
                        smaller ones, consolidation occurs more frequently, and there are fewer
                        segment files on disk at all times. While this may potentially improve the
                        read performance and use fewer file descriptors, frequent consolidations
                        cause a higher write load and thus a higher write amplification.
                        
                        On the other hand, a small threshold value triggers the consolidation only
                        when there are a large number of segment files that don't vary in size a lot.
                        Consolidation occurs less frequently, reducing the write amplification, but
                        it can result in a greater number of segment files on disk.

                        Multiple combinations of candidate segments are checked and the one with
                        the lowest skew value is selected for consolidation. The selection process
                        picks the greatest number of segments that together have the lowest skew value
                        while ensuring that the size of the new consolidated segment remains under
                        the configured `segmentsBytesMax`.
                      type: number
                      minimum: 0.0
                      maximum: 1.0
                      default: 0.4
                    minDeletionRatio:
                      description: |
                        The `minDeletionRatio` represents the minimum required deletion ratio
                        in one or more segments to perform a cleanup of those segments.
                        It is a number between `0.0` and `1.0`.

                        The deletion ratio is the percentage of deleted documents across one or
                        more segment files and is calculated by dividing the number of deleted
                        documents by the total number of documents in a segment or a group of
                        segments. For example, if there is a segment with 1000 documents of which
                        300 are deleted and another segment with 1000 documents of which 700 are
                        deleted, the deletion ratio is `0.5` (50%, calculated as `1000 / 2000`).

                        The `minDeletionRatio` threshold must be carefully selected. A smaller
                        value leads to earlier cleanup of deleted documents from segments and
                        thus reclamation of disk space but it generates a higher write load.
                        A very large value lowers the write amplification but at the same time
                        the system can be left with a large number of segment files with a high
                        percentage of deleted documents that occupy disk space unnecessarily.

                        During cleanup, the segment files are first arranged in decreasing
                        order of their individual deletion ratios. Then the largest subset of
                        segments whose collective deletion ratio is greater than or equal to
                        `minDeletionRatio` is picked.
                      type: integer
                      minimum: 0.0
                      maximum: 1.0
                      default: 0.5
                writebufferIdle:
                  description: |
                    Maximum number of writers (segments) cached in the pool
                    (immutable, `0` = disable).
                  type: integer
                  default: 64
                writebufferActive:
                  description: |
                    Maximum number of concurrent active writers (segments) that perform a
                    transaction. Other writers (segments) wait till current active writers
                    (segments) finish (immutable, `0` = disable).
                  type: integer
                  default: 0
                writebufferSizeMax:
                  description: |
                    Maximum memory byte size per writer (segment) before a writer (segment) flush
                    is triggered. The value `0` turns off this limit for any writer (buffer) and data
                    is flushed periodically based on the value defined for the flush thread
                    (ArangoDB server startup option). This should be used carefully due to
                    high potential memory consumption (immutable, `0` = disable).
                  type: integer
                  default: 33554432
      responses:
        '201':
          description: |
            The View has been created.
          content:
            application/json:
              schema:
                type: object
                required:
                  - links
                  - primarySort
                  - primarySortCompression
                  # primarySortCache # omitted if disabled
                  # primaryKeyCache  # omitted if disabled
                  - optimizeTopK
                  - storedValues
                  - cleanupIntervalStep
                  - commitIntervalMsec
                  - consolidationIntervalMsec
                  - consolidationPolicy
                  - writebufferIdle
                  - writebufferActive
                  - writebufferSizeMax
                  - id
                  - name
                  - type
                  - globallyUniqueId
                properties:
                  name:
                    description: |
                      The name of the View.
                    type: string
                    example: coll
                  type:
                    description: |
                      The type of the View (`"arangosearch"`).
                    type: string
                    example: arangosearch
                  id:
                    description: |
                      A unique identifier of the View (deprecated).
                    type: string
                  globallyUniqueId:
                    description: |
                      A unique identifier of the View. This is an internal property.
                    type: string
                  links:
                    description: |
                      An object with the attribute keys being names of to be linked collections,
                      and the link properties as attribute values. See
                      [`arangosearch` View Link Properties](../../../indexes-and-search/arangosearch/arangosearch-views-reference.md#link-properties)
                      for details.
                    type: object
                  primarySort:
                    description: |
                      The primary sort order, described by an array of objects, each specifying
                      a field (attribute path) and a sort direction.
                    type: array
                    items:
                      type: object
                      required:
                        - field
                        - asc
                      properties:
                        field:
                          description: |
                            An attribute path. The `.` character denotes sub-attributes.
                          type: string
                        asc:
                          description: |
                            The sort direction.

                            - `true` for ascending
                            - `false` for descending
                          type: boolean
                  primarySortCompression:
                    description: |
                      Defines how the primary sort data is compressed.

                      - `"lz4"`: LZ4 fast compression
                      - `"none"`: no compression
                    type: string
                    enum: [lz4, none]
                  primarySortCache:
                    description: |
                      Whether the primary sort columns are always cached in memory.
                    type: boolean
                  primaryKeyCache:
                    description: |
                      Whether the primary key columns are always cached in memory.
                    type: boolean
                  optimizeTopK:
                    description: |
                      An array of strings defining sort expressions that can be optimized.
                      This is also known as _WAND optimization_ (introduced in v3.12.0).
                    type: array
                    items:
                      type: string
                  storedValues:
                    description: |
                      An array of objects that describes which document attributes are stored
                      in the View index for covering search queries, which means the data can
                      be taken from the index directly and accessing the storage engine can
                      be avoided.
                    type: array
                    items:
                      type: object
                      required:
                        - fields
                      properties:
                        fields:
                          description: |
                            An array of strings with one or more document attribute paths.
                          type: array
                          items:
                            type: string
                        compression:
                          description: |
                            The compression type used for the internal column-store.
                            
                            - `"lz4"`: LZ4 fast compression
                            - `"none"`: no compression
                          type: string
                          enum: [lz4, none]
                        cache:
                          description: |
                            Whether stored values are always cached in memory.
                          type: boolean
                  cleanupIntervalStep:
                    description: |
                      Wait at least this many commits between removing unused files in the
                      ArangoSearch data directory (`0` = disabled).
                    type: integer
                  commitIntervalMsec:
                    description: |
                      Wait at least this many milliseconds between committing View data store
                      changes and making documents visible to queries (`0` = disabled).
                    type: integer
                  consolidationIntervalMsec:
                    description: |
                      Wait at least this many milliseconds between applying `consolidationPolicy` to
                      consolidate the View data store and possibly release space on the filesystem
                      (`0` = disabled).
                    type: integer
                  consolidationPolicy:
                    description: |
                      The consolidation policy to apply for selecting which segments should be merged.

                      - If the `tier` type is used, then the `segments*` and `minScore` properties are available.
                      - If the `bytes_accum` type is used, then the `threshold` property is available.
                    type: object
                    properties:
                      type:
                        description: |
                          The segment candidates for the "consolidation" operation are selected based
                          upon several possible configurable formulas as defined by their types.
                          The currently supported types are:
                          - `"tier"`: consolidate based on segment byte size and live
                            document count as dictated by the customization attributes.
                          - `"bytes_accum"`: consolidate if and only if
                            `{threshold} > (segment_bytes + sum_of_merge_candidate_segment_bytes) / all_segment_bytes`
                            i.e. the sum of all candidate segment byte size is less than the total
                            segment byte size multiplied by the `{threshold}`.
                        type: string
                        enum: [tier, bytes_accum]
                      threshold:
                        description: |
                          A value in the range `[0.0, 1.0]`
                        type: number
                        minimum: 0.0
                        maximum: 1.0
                      segmentsBytesMax:
                        description: |
                          Maximum allowed size of all consolidated segments in bytes.
                        type: integer
                      maxSkewThreshold:
                        description: |
                          The skew describes how much segment files vary in file size. It is a number
                          between `0.0` and `1.0` and is calculated by dividing the largest file size
                          of a set of segment files by the total size. For example, the skew of a
                          200 MiB, 300 MiB, and 500 MiB segment file is `0.5` (`500 / 1000`).

                          A large `maxSkewThreshold` value allows merging large segment files with
                          smaller ones, consolidation occurs more frequently, and there are fewer
                          segment files on disk at all times. While this may potentially improve the
                          read performance and use fewer file descriptors, frequent consolidations
                          cause a higher write load and thus a higher write amplification.
                          
                          On the other hand, a small threshold value triggers the consolidation only
                          when there are a large number of segment files that don't vary in size a lot.
                          Consolidation occurs less frequently, reducing the write amplification, but
                          it can result in a greater number of segment files on disk.

                          Multiple combinations of candidate segments are checked and the one with
                          the lowest skew value is selected for consolidation. The selection process
                          picks the greatest number of segments that together have the lowest skew value
                          while ensuring that the size of the new consolidated segment remains under
                          the configured `segmentsBytesMax`.
                        type: number
                        minimum: 0.0
                        maximum: 1.0
                      minDeletionRatio:
                        description: |
                          The `minDeletionRatio` represents the minimum required deletion ratio
                          in one or more segments to perform a cleanup of those segments.
                          It is a number between `0.0` and `1.0`.

                          The deletion ratio is the percentage of deleted documents across one or
                          more segment files and is calculated by dividing the number of deleted
                          documents by the total number of documents in a segment or a group of
                          segments. For example, if there is a segment with 1000 documents of which
                          300 are deleted and another segment with 1000 documents of which 700 are
                          deleted, the deletion ratio is `0.5` (50%, calculated as `1000 / 2000`).

                          The `minDeletionRatio` threshold must be carefully selected. A smaller
                          value leads to earlier cleanup of deleted documents from segments and
                          thus reclamation of disk space but it generates a higher write load.
                          A very large value lowers the write amplification but at the same time
                          the system can be left with a large number of segment files with a high
                          percentage of deleted documents that occupy disk space unnecessarily.

                          During cleanup, the segment files are first arranged in decreasing
                          order of their individual deletion ratios. Then the largest subset of
                          segments whose collective deletion ratio is greater than or equal to
                          `minDeletionRatio` is picked.
                        type: integer
                        minimum: 0.0
                        maximum: 1.0
                  writebufferIdle:
                    description: |
                      Maximum number of writers (segments) cached in the pool (`0` = disabled).
                    type: integer
                  writebufferActive:
                    description: |
                      Maximum number of concurrent active writers (segments) that perform a
                      transaction. Other writers (segments) wait till current active writers
                      (segments) finish (`0` = disabled).
                    type: integer
                  writebufferSizeMax:
                    description: |
                      Maximum memory byte size per writer (segment) before a writer (segment) flush
                      is triggered. `0` value turns off this limit for any writer (buffer) and data
                      is flushed periodically based on the value defined for the flush thread
                      (`0` = disabled).
                    type: integer
        '400':
          description: |
            The `name` or `type` attribute is missing or invalid.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 400
                  errorNum:
                    description: |
                      The ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '409':
          description: |
            A View called `name` already exists.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 409
                  errorNum:
                    description: |
                      The ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
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

## Get information about a View

```openapi
paths:
  /_db/{database-name}/_api/view/{view-name}:
    get:
      operationId: getView
      description: |
        Returns the basic information about a specific View.
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of the database.
          schema:
            type: string
        - name: view-name
          in: path
          required: true
          description: |
            The name of the View.
          schema:
            type: string
      responses:
        '200':
          description: |
            The basic information about the View.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - name
                  - type
                  - id
                  - globallyUniqueId
                properties:
                  error:
                    description: |
                      A flag indicating that no error occurred.
                    type: boolean
                    example: false
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 200
                  name:
                    description: |
                      The name of the View.
                    type: string
                    example: coll
                  type:
                    description: |
                      The type of the View (`"arangosearch"`).
                    type: string
                    example: arangosearch
                  id:
                    description: |
                      A unique identifier of the View (deprecated).
                    type: string
                  globallyUniqueId:
                    description: |
                      A unique identifier of the View. This is an internal property.
                    type: string
        '404':
          description: |
            A View called `view-name` could not be found.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 404
                  errorNum:
                    description: |
                      The ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
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

## Get the properties of a View

```openapi
paths:
  /_db/{database-name}/_api/view/{view-name}/properties:
    get:
      operationId: getViewProperties
      description: |
        Returns an object containing the definition of the View identified by `view-name`.
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of the database.
          schema:
            type: string
        - name: view-name
          in: path
          required: true
          description: |
            The name of the View.
          schema:
            type: string
      responses:
        '200':
          description: |
            An object with a full description of the specified View, including
            `arangosearch` View type-dependent properties.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - links
                  - primarySort
                  - primarySortCompression
                  # primarySortCache # omitted if disabled
                  # primaryKeyCache  # omitted if disabled
                  - optimizeTopK
                  - storedValues
                  - cleanupIntervalStep
                  - commitIntervalMsec
                  - consolidationIntervalMsec
                  - consolidationPolicy
                  - writebufferIdle
                  - writebufferActive
                  - writebufferSizeMax
                  - id
                  - name
                  - type
                  - globallyUniqueId
                properties:
                  error:
                    description: |
                      A flag indicating that no error occurred.
                    type: boolean
                    example: false
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 200
                  name:
                    description: |
                      The name of the View.
                    type: string
                    example: coll
                  type:
                    description: |
                      The type of the View (`"arangosearch"`).
                    type: string
                    example: arangosearch
                  id:
                    description: |
                      A unique identifier of the View (deprecated).
                    type: string
                  globallyUniqueId:
                    description: |
                      A unique identifier of the View. This is an internal property.
                    type: string
                  links:
                    description: |
                      An object with the attribute keys being names of to be linked collections,
                      and the link properties as attribute values. See
                      [`arangosearch` View Link Properties](../../../indexes-and-search/arangosearch/arangosearch-views-reference.md#link-properties)
                      for details.
                    type: object
                  primarySort:
                    description: |
                      The primary sort order, described by an array of objects, each specifying
                      a field (attribute path) and a sort direction.
                    type: array
                    items:
                      type: object
                      required:
                        - field
                        - asc
                      properties:
                        field:
                          description: |
                            An attribute path. The `.` character denotes sub-attributes.
                          type: string
                        asc:
                          description: |
                            The sort direction.

                            - `true` for ascending
                            - `false` for descending
                          type: boolean
                  primarySortCompression:
                    description: |
                      Defines how the primary sort data is compressed.

                      - `"lz4"`: LZ4 fast compression
                      - `"none"`: no compression
                    type: string
                    enum: [lz4, none]
                  primarySortCache:
                    description: |
                      Whether the primary sort columns are always cached in memory.
                    type: boolean
                  primaryKeyCache:
                    description: |
                      Whether the primary key columns are always cached in memory.
                    type: boolean
                  optimizeTopK:
                    description: |
                      An array of strings defining sort expressions that can be optimized.
                      This is also known as _WAND optimization_ (introduced in v3.12.0).
                    type: array
                    items:
                      type: string
                  storedValues:
                    description: |
                      An array of objects that describes which document attributes are stored
                      in the View index for covering search queries, which means the data can
                      be taken from the index directly and accessing the storage engine can
                      be avoided.
                    type: array
                    items:
                      type: object
                      required:
                        - fields
                      properties:
                        fields:
                          description: |
                            An array of strings with one or more document attribute paths.
                          type: array
                          items:
                            type: string
                        compression:
                          description: |
                            The compression type used for the internal column-store.
                            
                            - `"lz4"`: LZ4 fast compression
                            - `"none"`: no compression
                          type: string
                          enum: [lz4, none]
                        cache:
                          description: |
                            Whether stored values are always cached in memory.
                          type: boolean
                  cleanupIntervalStep:
                    description: |
                      Wait at least this many commits between removing unused files in the
                      ArangoSearch data directory (`0` = disabled).
                    type: integer
                  commitIntervalMsec:
                    description: |
                      Wait at least this many milliseconds between committing View data store
                      changes and making documents visible to queries (`0` = disabled).
                    type: integer
                  consolidationIntervalMsec:
                    description: |
                      Wait at least this many milliseconds between applying `consolidationPolicy` to
                      consolidate the View data store and possibly release space on the filesystem
                      (`0` = disabled).
                    type: integer
                  consolidationPolicy:
                    description: |
                      The consolidation policy to apply for selecting which segments should be merged.

                      - If the `tier` type is used, then the `segments*` and `minScore` properties are available.
                      - If the `bytes_accum` type is used, then the `threshold` property is available.
                    type: object
                    properties:
                      type:
                        description: |
                          The segment candidates for the "consolidation" operation are selected based
                          upon several possible configurable formulas as defined by their types.
                          The currently supported types are:
                          - `"tier"`: consolidate based on segment byte size and live
                            document count as dictated by the customization attributes.
                          - `"bytes_accum"`: consolidate if and only if
                            `{threshold} > (segment_bytes + sum_of_merge_candidate_segment_bytes) / all_segment_bytes`
                            i.e. the sum of all candidate segment byte size is less than the total
                            segment byte size multiplied by the `{threshold}`.
                        type: string
                        enum: [tier, bytes_accum]
                      threshold:
                        description: |
                          A value in the range `[0.0, 1.0]`
                        type: number
                        minimum: 0.0
                        maximum: 1.0
                      segmentsBytesMax:
                        description: |
                          Maximum allowed size of all consolidated segments in bytes.
                        type: integer
                      maxSkewThreshold:
                        description: |
                          The skew describes how much segment files vary in file size. It is a number
                          between `0.0` and `1.0` and is calculated by dividing the largest file size
                          of a set of segment files by the total size. For example, the skew of a
                          200 MiB, 300 MiB, and 500 MiB segment file is `0.5` (`500 / 1000`).

                          A large `maxSkewThreshold` value allows merging large segment files with
                          smaller ones, consolidation occurs more frequently, and there are fewer
                          segment files on disk at all times. While this may potentially improve the
                          read performance and use fewer file descriptors, frequent consolidations
                          cause a higher write load and thus a higher write amplification.
                          
                          On the other hand, a small threshold value triggers the consolidation only
                          when there are a large number of segment files that don't vary in size a lot.
                          Consolidation occurs less frequently, reducing the write amplification, but
                          it can result in a greater number of segment files on disk.

                          Multiple combinations of candidate segments are checked and the one with
                          the lowest skew value is selected for consolidation. The selection process
                          picks the greatest number of segments that together have the lowest skew value
                          while ensuring that the size of the new consolidated segment remains under
                          the configured `segmentsBytesMax`.
                        type: number
                        minimum: 0.0
                        maximum: 1.0
                      minDeletionRatio:
                        description: |
                          The `minDeletionRatio` represents the minimum required deletion ratio
                          in one or more segments to perform a cleanup of those segments.
                          It is a number between `0.0` and `1.0`.

                          The deletion ratio is the percentage of deleted documents across one or
                          more segment files and is calculated by dividing the number of deleted
                          documents by the total number of documents in a segment or a group of
                          segments. For example, if there is a segment with 1000 documents of which
                          300 are deleted and another segment with 1000 documents of which 700 are
                          deleted, the deletion ratio is `0.5` (50%, calculated as `1000 / 2000`).

                          The `minDeletionRatio` threshold must be carefully selected. A smaller
                          value leads to earlier cleanup of deleted documents from segments and
                          thus reclamation of disk space but it generates a higher write load.
                          A very large value lowers the write amplification but at the same time
                          the system can be left with a large number of segment files with a high
                          percentage of deleted documents that occupy disk space unnecessarily.

                          During cleanup, the segment files are first arranged in decreasing
                          order of their individual deletion ratios. Then the largest subset of
                          segments whose collective deletion ratio is greater than or equal to
                          `minDeletionRatio` is picked.
                        type: integer
                        minimum: 0.0
                        maximum: 1.0
                  writebufferIdle:
                    description: |
                      Maximum number of writers (segments) cached in the pool (`0` = disabled).
                    type: integer
                  writebufferActive:
                    description: |
                      Maximum number of concurrent active writers (segments) that perform a
                      transaction. Other writers (segments) wait till current active writers
                      (segments) finish (`0` = disabled).
                    type: integer
                  writebufferSizeMax:
                    description: |
                      Maximum memory byte size per writer (segment) before a writer (segment) flush
                      is triggered. `0` value turns off this limit for any writer (buffer) and data
                      is flushed periodically based on the value defined for the flush thread
                      (`0` = disabled).
                    type: integer
        '400':
          description: |
            The `view-name` path parameter is missing or invalid.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 400
                  errorNum:
                    description: |
                      The ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '404':
          description: |
            A View called `view-name` could not be found.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 404
                  errorNum:
                    description: |
                      The ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
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

## List all Views

```openapi
paths:
  /_db/{database-name}/_api/view:
    get:
      operationId: listViews
      description: |
        Returns an object containing a listing of all Views in the current database,
        regardless of their type.
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of the database.
          schema:
            type: string
      responses:
        '200':
          description: |
            The list of Views.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - result
                properties:
                  error:
                    description: |
                      A flag indicating that no error occurred.
                    type: boolean
                    example: false
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 200
                  result:
                    description: |
                      The result object.
                    type: array
                    items:
                      type: object
                      required:
                        - name
                        - type
                        - id
                        - globallyUniqueId
                      properties:
                        name:
                          description: |
                            The name of the View.
                          type: string
                          example: coll
                        type:
                          description: |
                            The type of the View.
                          type: string
                          enum: [arangosearch, search-alias]
                        id:
                          description: |
                            A unique identifier of the View (deprecated).
                          type: string
                        globallyUniqueId:
                          description: |
                            A unique identifier of the View. This is an internal property.
                          type: string
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

## Replace the properties of an arangosearch View

```openapi
paths:
  /_db/{database-name}/_api/view/{view-name}/properties:
    put:
      operationId: replaceViewProperties
      description: |
        Changes all properties of a View by replacing them, except for immutable properties.
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of the database.
          schema:
            type: string
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
                    and the link properties as attribute values. Example:

                    ```json
                    {
                      "name": "arangosearch",
                      "links": {
                        "coll": {
                          "fields": {
                            "my_attribute": {
                              "fields": {
                                "my_sub_attribute": {
                                  "analyzers": ["text_en"]
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                    ```

                    See [`arangosearch` View Link Properties](../../../indexes-and-search/arangosearch/arangosearch-views-reference.md#link-properties)
                    for details.
                  type: object
                cleanupIntervalStep:
                  description: |
                    Wait at least this many commits between removing unused files in the
                    ArangoSearch data directory (`0` = disable).
                    For the case where the consolidation policies merge segments often (i.e. a lot
                    of commit+consolidate), a lower value causes a lot of disk space to be
                    wasted.
                    For the case where the consolidation policies rarely merge segments (i.e. few
                    inserts/deletes), a higher value impacts performance without any added
                    benefits.

                    _Background:_
                      With every "commit" or "consolidate" operation, a new state of the View's
                      internal data structures is created on disk.
                      Old states/snapshots are released once there are no longer any users
                      remaining.
                      However, the files for the released states/snapshots are left on disk, and
                      only removed by "cleanup" operation.
                  type: integer
                  default: 2
                commitIntervalMsec:
                  description: |
                    Wait at least this many milliseconds between committing View data store
                    changes and making documents visible to queries (`0` = disable).
                    For the case where there are a lot of inserts/updates, a higher value causes the
                    index not to account for them and memory usage continues to grow until the commit.
                    A lower value impacts performance, including the case where there are no or only a
                    few inserts/updates because of synchronous locking, and it wastes disk space for
                    each commit call.

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
                  default: 1000
                consolidationIntervalMsec:
                  description: |
                    Wait at least this many milliseconds between applying `consolidationPolicy` to
                    consolidate the View data store and possibly release space on the filesystem
                    (`0` = disable).
                    For the case where there are a lot of data modification operations, a higher
                    value could potentially have the data store consume more space and file handles.
                    For the case where there are a few data modification operations, a lower value
                    impacts performance due to no segment candidates being available for
                    consolidation.

                    _Background:_
                      For data modification, ArangoSearch follows the concept of a
                      "versioned data store". Thus old versions of data may be removed once there
                      are no longer any users of the old data. The frequency of the cleanup and
                      compaction operations are governed by `consolidationIntervalMsec` and the
                      candidates for compaction are selected via `consolidationPolicy`.
                  type: integer
                  default: 5000
                consolidationPolicy:
                  description: |
                    The consolidation policy to apply for selecting which segments should be merged.

                    - If the `tier` type is used, then the `segments*` and `minScore` properties are available.
                    - If the `bytes_accum` type is used, then the `threshold` property is available.

                    _Background:_
                      With each ArangoDB transaction that inserts documents, one or more
                      ArangoSearch-internal segments get created.
                      Similarly, for removed documents, the segments that contain such documents
                      have these documents marked as 'deleted'.
                      Over time, this approach causes a lot of small and sparse segments to be
                      created.
                      A "consolidation" operation selects one or more segments and copies all of
                      their valid documents into a single new segment, thereby allowing the
                      search algorithm to perform more optimally and for extra file handles to be
                      released once old segments are no longer used.
                  type: object
                  required:
                    - type
                  properties:
                    type:
                      description: |
                        The segment candidates for the "consolidation" operation are selected based
                        upon several possible configurable formulas as defined by their types.
                        The currently supported types are:
                        - `"tier"`: consolidate based on segment byte size and live
                          document count as dictated by the customization attributes. 
                        - `"bytes_accum"`: consolidate if and only if
                          `{threshold} > (segment_bytes + sum_of_merge_candidate_segment_bytes) / all_segment_bytes`
                          i.e. the sum of all candidate segment byte size is less than the total
                          segment byte size multiplied by the `{threshold}`.
                      type: string
                      enum: [tier, bytes_accum]
                      default: tier
                    threshold:
                      description: |
                        A value in the range `[0.0, 1.0]`.
                      type: number
                      default: 0
                      minimum: 0.0
                      maximum: 1.0
                    segmentsBytesMax:
                      description: |
                        Maximum allowed size of all consolidated segments in bytes.
                      type: integer
                      default: 8589934592
                    maxSkewThreshold:
                      description: |
                        The skew describes how much segment files vary in file size. It is a number
                        between `0.0` and `1.0` and is calculated by dividing the largest file size
                        of a set of segment files by the total size. For example, the skew of a
                        200 MiB, 300 MiB, and 500 MiB segment file is `0.5` (`500 / 1000`).

                        A large `maxSkewThreshold` value allows merging large segment files with
                        smaller ones, consolidation occurs more frequently, and there are fewer
                        segment files on disk at all times. While this may potentially improve the
                        read performance and use fewer file descriptors, frequent consolidations
                        cause a higher write load and thus a higher write amplification.
                        
                        On the other hand, a small threshold value triggers the consolidation only
                        when there are a large number of segment files that don't vary in size a lot.
                        Consolidation occurs less frequently, reducing the write amplification, but
                        it can result in a greater number of segment files on disk.

                        Multiple combinations of candidate segments are checked and the one with
                        the lowest skew value is selected for consolidation. The selection process
                        picks the greatest number of segments that together have the lowest skew value
                        while ensuring that the size of the new consolidated segment remains under
                        the configured `segmentsBytesMax`.
                      type: number
                      minimum: 0.0
                      maximum: 1.0
                      default: 0.4
                    minDeletionRatio:
                      description: |
                        The `minDeletionRatio` represents the minimum required deletion ratio
                        in one or more segments to perform a cleanup of those segments.
                        It is a number between `0.0` and `1.0`.

                        The deletion ratio is the percentage of deleted documents across one or
                        more segment files and is calculated by dividing the number of deleted
                        documents by the total number of documents in a segment or a group of
                        segments. For example, if there is a segment with 1000 documents of which
                        300 are deleted and another segment with 1000 documents of which 700 are
                        deleted, the deletion ratio is `0.5` (50%, calculated as `1000 / 2000`).

                        The `minDeletionRatio` threshold must be carefully selected. A smaller
                        value leads to earlier cleanup of deleted documents from segments and
                        thus reclamation of disk space but it generates a higher write load.
                        A very large value lowers the write amplification but at the same time
                        the system can be left with a large number of segment files with a high
                        percentage of deleted documents that occupy disk space unnecessarily.

                        During cleanup, the segment files are first arranged in decreasing
                        order of their individual deletion ratios. Then the largest subset of
                        segments whose collective deletion ratio is greater than or equal to
                        `minDeletionRatio` is picked.
                      type: integer
                      minimum: 0.0
                      maximum: 1.0
                      default: 0.5
      responses:
        '200':
          description: |
            The View has been updated successfully.
          content:
            application/json:
              schema:
                type: object
                required:
                  - links
                  - primarySort
                  - primarySortCompression
                  # primarySortCache # omitted if disabled
                  # primaryKeyCache  # omitted if disabled
                  - optimizeTopK
                  - storedValues
                  - cleanupIntervalStep
                  - commitIntervalMsec
                  - consolidationIntervalMsec
                  - consolidationPolicy
                  - writebufferIdle
                  - writebufferActive
                  - writebufferSizeMax
                  - id
                  - name
                  - type
                  - globallyUniqueId
                properties:
                  name:
                    description: |
                      The name of the View.
                    type: string
                    example: coll
                  type:
                    description: |
                      The type of the View (`"arangosearch"`).
                    type: string
                    example: arangosearch
                  id:
                    description: |
                      A unique identifier of the View (deprecated).
                    type: string
                  globallyUniqueId:
                    description: |
                      A unique identifier of the View. This is an internal property.
                    type: string
                  links:
                    description: |
                      An object with the attribute keys being names of to be linked collections,
                      and the link properties as attribute values. See
                      [`arangosearch` View Link Properties](../../../indexes-and-search/arangosearch/arangosearch-views-reference.md#link-properties)
                      for details.
                    type: object
                  primarySort:
                    description: |
                      The primary sort order, described by an array of objects, each specifying
                      a field (attribute path) and a sort direction.
                    type: array
                    items:
                      type: object
                      required:
                        - field
                        - asc
                      properties:
                        field:
                          description: |
                            An attribute path. The `.` character denotes sub-attributes.
                          type: string
                        asc:
                          description: |
                            The sort direction.

                            - `true` for ascending
                            - `false` for descending
                          type: boolean
                  primarySortCompression:
                    description: |
                      Defines how the primary sort data is compressed.

                      - `"lz4"`: LZ4 fast compression
                      - `"none"`: no compression
                    type: string
                    enum: [lz4, none]
                  primarySortCache:
                    description: |
                      Whether the primary sort columns are always cached in memory.
                    type: boolean
                  primaryKeyCache:
                    description: |
                      Whether the primary key columns are always cached in memory.
                    type: boolean
                  optimizeTopK:
                    description: |
                      An array of strings defining sort expressions that can be optimized.
                      This is also known as _WAND optimization_ (introduced in v3.12.0).
                    type: array
                    items:
                      type: string
                  storedValues:
                    description: |
                      An array of objects that describes which document attributes are stored
                      in the View index for covering search queries, which means the data can
                      be taken from the index directly and accessing the storage engine can
                      be avoided.
                    type: array
                    items:
                      type: object
                      required:
                        - fields
                      properties:
                        fields:
                          description: |
                            An array of strings with one or more document attribute paths.
                          type: array
                          items:
                            type: string
                        compression:
                          description: |
                            The compression type used for the internal column-store.
                            
                            - `"lz4"`: LZ4 fast compression
                            - `"none"`: no compression
                          type: string
                          enum: [lz4, none]
                        cache:
                          description: |
                            Whether stored values are always cached in memory.
                          type: boolean
                  cleanupIntervalStep:
                    description: |
                      Wait at least this many commits between removing unused files in the
                      ArangoSearch data directory (`0` = disabled).
                    type: integer
                  commitIntervalMsec:
                    description: |
                      Wait at least this many milliseconds between committing View data store
                      changes and making documents visible to queries (`0` = disabled).
                    type: integer
                  consolidationIntervalMsec:
                    description: |
                      Wait at least this many milliseconds between applying `consolidationPolicy` to
                      consolidate the View data store and possibly release space on the filesystem
                      (`0` = disabled).
                    type: integer
                  consolidationPolicy:
                    description: |
                      The consolidation policy to apply for selecting which segments should be merged.

                      - If the `tier` type is used, then the `segments*` and `minScore` properties are available.
                      - If the `bytes_accum` type is used, then the `threshold` property is available.
                    type: object
                    properties:
                      type:
                        description: |
                          The segment candidates for the "consolidation" operation are selected based
                          upon several possible configurable formulas as defined by their types.
                          The currently supported types are:
                          - `"tier"`: consolidate based on segment byte size and live
                            document count as dictated by the customization attributes.
                          - `"bytes_accum"`: consolidate if and only if
                            `{threshold} > (segment_bytes + sum_of_merge_candidate_segment_bytes) / all_segment_bytes`
                            i.e. the sum of all candidate segment byte size is less than the total
                            segment byte size multiplied by the `{threshold}`.
                        type: string
                        enum: [tier, bytes_accum]
                      threshold:
                        description: |
                          A value in the range `[0.0, 1.0]`
                        type: number
                        minimum: 0.0
                        maximum: 1.0
                      segmentsBytesMax:
                        description: |
                          Maximum allowed size of all consolidated segments in bytes.
                        type: integer
                      maxSkewThreshold:
                        description: |
                          The skew describes how much segment files vary in file size. It is a number
                          between `0.0` and `1.0` and is calculated by dividing the largest file size
                          of a set of segment files by the total size. For example, the skew of a
                          200 MiB, 300 MiB, and 500 MiB segment file is `0.5` (`500 / 1000`).

                          A large `maxSkewThreshold` value allows merging large segment files with
                          smaller ones, consolidation occurs more frequently, and there are fewer
                          segment files on disk at all times. While this may potentially improve the
                          read performance and use fewer file descriptors, frequent consolidations
                          cause a higher write load and thus a higher write amplification.
                          
                          On the other hand, a small threshold value triggers the consolidation only
                          when there are a large number of segment files that don't vary in size a lot.
                          Consolidation occurs less frequently, reducing the write amplification, but
                          it can result in a greater number of segment files on disk.

                          Multiple combinations of candidate segments are checked and the one with
                          the lowest skew value is selected for consolidation. The selection process
                          picks the greatest number of segments that together have the lowest skew value
                          while ensuring that the size of the new consolidated segment remains under
                          the configured `segmentsBytesMax`.
                        type: number
                        minimum: 0.0
                        maximum: 1.0
                      minDeletionRatio:
                        description: |
                          The `minDeletionRatio` represents the minimum required deletion ratio
                          in one or more segments to perform a cleanup of those segments.
                          It is a number between `0.0` and `1.0`.

                          The deletion ratio is the percentage of deleted documents across one or
                          more segment files and is calculated by dividing the number of deleted
                          documents by the total number of documents in a segment or a group of
                          segments. For example, if there is a segment with 1000 documents of which
                          300 are deleted and another segment with 1000 documents of which 700 are
                          deleted, the deletion ratio is `0.5` (50%, calculated as `1000 / 2000`).

                          The `minDeletionRatio` threshold must be carefully selected. A smaller
                          value leads to earlier cleanup of deleted documents from segments and
                          thus reclamation of disk space but it generates a higher write load.
                          A very large value lowers the write amplification but at the same time
                          the system can be left with a large number of segment files with a high
                          percentage of deleted documents that occupy disk space unnecessarily.

                          During cleanup, the segment files are first arranged in decreasing
                          order of their individual deletion ratios. Then the largest subset of
                          segments whose collective deletion ratio is greater than or equal to
                          `minDeletionRatio` is picked.
                        type: integer
                        minimum: 0.0
                        maximum: 1.0
                  writebufferIdle:
                    description: |
                      Maximum number of writers (segments) cached in the pool (`0` = disabled).
                    type: integer
                  writebufferActive:
                    description: |
                      Maximum number of concurrent active writers (segments) that perform a
                      transaction. Other writers (segments) wait till current active writers
                      (segments) finish (`0` = disabled).
                    type: integer
                  writebufferSizeMax:
                    description: |
                      Maximum memory byte size per writer (segment) before a writer (segment) flush
                      is triggered. `0` value turns off this limit for any writer (buffer) and data
                      is flushed periodically based on the value defined for the flush thread
                      (`0` = disabled).
                    type: integer
        '400':
          description: |
            The `view-name` path parameter is missing or invalid.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 400
                  errorNum:
                    description: |
                      The ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '404':
          description: |
            A View called `view-name` could not be found.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 404
                  errorNum:
                    description: |
                      The ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
      tags:
        - Views
```

**Examples**

```curl
---
name: RestViewPutPropertiesArangoSearch
description: |
  Replace the properties of an `arangosearch` View including any links with new
  properties. All mutable properties that are not specified are reset to their
  default values.
---
db._create("users");
db._create("products");
var view = db._createView("productsView", "arangosearch", {
  commitIntervalMsec: 1337,
  links: {
    users: {},
    products: {}
  }
});

var url = "/_api/view/"+ view.name() + "/properties";
var body = {
  cleanupIntervalStep: 12,
  links: {
    products: {
      fields: {
        description: {
          analyzers: ["text_en"]
        }
      }
    }
  }
};
var response = logCurlRequest('PUT', url, body);
assert(response.code === 200);
assert(Object.keys(response.parsedBody.links).length === 1);
assert(response.parsedBody.commitIntervalMsec !== 1337);
logJsonResponse(response);

db._dropView(view.name());
db._drop("users");
db._drop("products");
```

## Update the properties of an arangosearch View

```openapi
paths:
  /_db/{database-name}/_api/view/{view-name}/properties:
    patch:
      operationId: updateViewProperties
      description: |
        Partially changes the properties of a View by updating the specified attributes.
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of the database.
          schema:
            type: string
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
                    and the link properties as attribute values. Example:
                    
                    ```json
                    {
                      "name": "arangosearch",
                      "links": {
                        "coll": {
                          "fields": {
                            "my_attribute": {
                              "fields": {
                                "my_sub_attribute": {
                                  "analyzers": ["text_en"]
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                    ```

                    See [`arangosearch` View Link Properties](../../../indexes-and-search/arangosearch/arangosearch-views-reference.md#link-properties)
                    for details.
                  type: object
                cleanupIntervalStep:
                  description: |
                    Wait at least this many commits between removing unused files in the
                    ArangoSearch data directory (`0` = disable).
                    For the case where the consolidation policies merge segments often (i.e. a lot
                    of commit+consolidate), a lower value causes a lot of disk space to be
                    wasted.
                    For the case where the consolidation policies rarely merge segments (i.e. few
                    inserts/deletes), a higher value impacts performance without any added
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
                    changes and making documents visible to queries (`0` = disable).
                    For the case where there are a lot of inserts/updates, a higher value causes the
                    index not to account for them and memory usage continues to grow until the commit.
                    A lower value impacts performance, including the case where there are no or only a
                    few inserts/updates because of synchronous locking, and it wastes disk space for
                    each commit call.

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
                    (`0` = disable).
                    For the case where there are a lot of data modification operations, a higher
                    value could potentially have the data store consume more space and file handles.
                    For the case where there are a few data modification operations, a lower value
                    impacts performance due to no segment candidates being available for
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
                    The consolidation policy to apply for selecting which segments should be merged.

                    - If the `tier` type is used, then the `segments*` and `minScore` properties are available.
                    - If the `bytes_accum` type is used, then the `threshold` property is available.

                    _Background:_
                      With each ArangoDB transaction that inserts documents, one or more
                      ArangoSearch-internal segments get created.
                      Similarly, for removed documents, the segments that contain such documents
                      have these documents marked as 'deleted'.
                      Over time, this approach causes a lot of small and sparse segments to be
                      created.
                      A "consolidation" operation selects one or more segments and copies all of
                      their valid documents into a single new segment, thereby allowing the
                      search algorithm to perform more optimally and for extra file handles to be
                      released once old segments are no longer used.
                  type: object
                  required:
                    - type
                  properties:
                    type:
                      description: |
                        The segment candidates for the "consolidation" operation are selected based
                        upon several possible configurable formulas as defined by their types.
                        The currently supported types are:
                        - `"tier"`: consolidate based on segment byte size and live
                          document count as dictated by the customization attributes. 
                        - `"bytes_accum"`: consolidate if and only if
                          `{threshold} > (segment_bytes + sum_of_merge_candidate_segment_bytes) / all_segment_bytes`
                          i.e. the sum of all candidate segment byte size is less than the total
                          segment byte size multiplied by the `{threshold}`.
                      type: string
                      enum: [tier, bytes_accum]
                    threshold:
                      description: |
                        A value in the range `[0.0, 1.0]`.
                      type: number
                      default: 0
                      minimum: 0.0
                      maximum: 1.0
                    segmentsBytesMax:
                      description: |
                        Maximum allowed size of all consolidated segments in bytes.
                      type: integer
                      default: 8589934592
                    maxSkewThreshold:
                      description: |
                        The skew describes how much segment files vary in file size. It is a number
                        between `0.0` and `1.0` and is calculated by dividing the largest file size
                        of a set of segment files by the total size. For example, the skew of a
                        200 MiB, 300 MiB, and 500 MiB segment file is `0.5` (`500 / 1000`).

                        A large `maxSkewThreshold` value allows merging large segment files with
                        smaller ones, consolidation occurs more frequently, and there are fewer
                        segment files on disk at all times. While this may potentially improve the
                        read performance and use fewer file descriptors, frequent consolidations
                        cause a higher write load and thus a higher write amplification.
                        
                        On the other hand, a small threshold value triggers the consolidation only
                        when there are a large number of segment files that don't vary in size a lot.
                        Consolidation occurs less frequently, reducing the write amplification, but
                        it can result in a greater number of segment files on disk.

                        Multiple combinations of candidate segments are checked and the one with
                        the lowest skew value is selected for consolidation. The selection process
                        picks the greatest number of segments that together have the lowest skew value
                        while ensuring that the size of the new consolidated segment remains under
                        the configured `segmentsBytesMax`.
                      type: number
                      minimum: 0.0
                      maximum: 1.0
                      default: 0.4
                    minDeletionRatio:
                      description: |
                        The `minDeletionRatio` represents the minimum required deletion ratio
                        in one or more segments to perform a cleanup of those segments.
                        It is a number between `0.0` and `1.0`.

                        The deletion ratio is the percentage of deleted documents across one or
                        more segment files and is calculated by dividing the number of deleted
                        documents by the total number of documents in a segment or a group of
                        segments. For example, if there is a segment with 1000 documents of which
                        300 are deleted and another segment with 1000 documents of which 700 are
                        deleted, the deletion ratio is `0.5` (50%, calculated as `1000 / 2000`).

                        The `minDeletionRatio` threshold must be carefully selected. A smaller
                        value leads to earlier cleanup of deleted documents from segments and
                        thus reclamation of disk space but it generates a higher write load.
                        A very large value lowers the write amplification but at the same time
                        the system can be left with a large number of segment files with a high
                        percentage of deleted documents that occupy disk space unnecessarily.

                        During cleanup, the segment files are first arranged in decreasing
                        order of their individual deletion ratios. Then the largest subset of
                        segments whose collective deletion ratio is greater than or equal to
                        `minDeletionRatio` is picked.
                      type: integer
                      minimum: 0.0
                      maximum: 1.0
                      default: 0.5
      responses:
        '200':
          description: |
            The View has been updated successfully.
          content:
            application/json:
              schema:
                type: object
                required:
                  - links
                  - primarySort
                  - primarySortCompression
                  # primarySortCache # omitted if disabled
                  # primaryKeyCache  # omitted if disabled
                  - optimizeTopK
                  - storedValues
                  - cleanupIntervalStep
                  - commitIntervalMsec
                  - consolidationIntervalMsec
                  - consolidationPolicy
                  - writebufferIdle
                  - writebufferActive
                  - writebufferSizeMax
                  - id
                  - name
                  - type
                  - globallyUniqueId
                properties:
                  name:
                    description: |
                      The name of the View.
                    type: string
                    example: coll
                  type:
                    description: |
                      The type of the View (`"arangosearch"`).
                    type: string
                    example: arangosearch
                  id:
                    description: |
                      A unique identifier of the View (deprecated).
                    type: string
                  globallyUniqueId:
                    description: |
                      A unique identifier of the View. This is an internal property.
                    type: string
                  links:
                    description: |
                      An object with the attribute keys being names of to be linked collections,
                      and the link properties as attribute values. See
                      [`arangosearch` View Link Properties](../../../indexes-and-search/arangosearch/arangosearch-views-reference.md#link-properties)
                      for details.
                    type: object
                  primarySort:
                    description: |
                      The primary sort order, described by an array of objects, each specifying
                      a field (attribute path) and a sort direction.
                    type: array
                    items:
                      type: object
                      required:
                        - field
                        - asc
                      properties:
                        field:
                          description: |
                            An attribute path. The `.` character denotes sub-attributes.
                          type: string
                        asc:
                          description: |
                            The sort direction.

                            - `true` for ascending
                            - `false` for descending
                          type: boolean
                  primarySortCompression:
                    description: |
                      Defines how the primary sort data is compressed.

                      - `"lz4"`: LZ4 fast compression
                      - `"none"`: no compression
                    type: string
                    enum: [lz4, none]
                  primarySortCache:
                    description: |
                      Whether the primary sort columns are always cached in memory.
                    type: boolean
                  primaryKeyCache:
                    description: |
                      Whether the primary key columns are always cached in memory.
                    type: boolean
                  optimizeTopK:
                    description: |
                      An array of strings defining sort expressions that can be optimized.
                      This is also known as _WAND optimization_ (introduced in v3.12.0).
                    type: array
                    items:
                      type: string
                  storedValues:
                    description: |
                      An array of objects that describes which document attributes are stored
                      in the View index for covering search queries, which means the data can
                      be taken from the index directly and accessing the storage engine can
                      be avoided.
                    type: array
                    items:
                      type: object
                      required:
                        - fields
                      properties:
                        fields:
                          description: |
                            An array of strings with one or more document attribute paths.
                          type: array
                          items:
                            type: string
                        compression:
                          description: |
                            The compression type used for the internal column-store.
                            
                            - `"lz4"`: LZ4 fast compression
                            - `"none"`: no compression
                          type: string
                          enum: [lz4, none]
                        cache:
                          description: |
                            Whether stored values are always cached in memory.
                          type: boolean
                  cleanupIntervalStep:
                    description: |
                      Wait at least this many commits between removing unused files in the
                      ArangoSearch data directory (`0` = disabled).
                    type: integer
                  commitIntervalMsec:
                    description: |
                      Wait at least this many milliseconds between committing View data store
                      changes and making documents visible to queries (`0` = disabled).
                    type: integer
                  consolidationIntervalMsec:
                    description: |
                      Wait at least this many milliseconds between applying `consolidationPolicy` to
                      consolidate the View data store and possibly release space on the filesystem
                      (`0` = disabled).
                    type: integer
                  consolidationPolicy:
                    description: |
                      The consolidation policy to apply for selecting which segments should be merged.

                      - If the `tier` type is used, then the `segments*` and `minScore` properties are available.
                      - If the `bytes_accum` type is used, then the `threshold` property is available.
                    type: object
                    properties:
                      type:
                        description: |
                          The segment candidates for the "consolidation" operation are selected based
                          upon several possible configurable formulas as defined by their types.
                          The currently supported types are:
                          - `"tier"`: consolidate based on segment byte size and live
                            document count as dictated by the customization attributes.
                          - `"bytes_accum"`: consolidate if and only if
                            `{threshold} > (segment_bytes + sum_of_merge_candidate_segment_bytes) / all_segment_bytes`
                            i.e. the sum of all candidate segment byte size is less than the total
                            segment byte size multiplied by the `{threshold}`.
                        type: string
                        enum: [tier, bytes_accum]
                      threshold:
                        description: |
                          A value in the range `[0.0, 1.0]`
                        type: number
                        minimum: 0.0
                        maximum: 1.0
                      segmentsBytesMax:
                        description: |
                          Maximum allowed size of all consolidated segments in bytes.
                        type: integer
                      maxSkewThreshold:
                        description: |
                          The skew describes how much segment files vary in file size. It is a number
                          between `0.0` and `1.0` and is calculated by dividing the largest file size
                          of a set of segment files by the total size. For example, the skew of a
                          200 MiB, 300 MiB, and 500 MiB segment file is `0.5` (`500 / 1000`).

                          A large `maxSkewThreshold` value allows merging large segment files with
                          smaller ones, consolidation occurs more frequently, and there are fewer
                          segment files on disk at all times. While this may potentially improve the
                          read performance and use fewer file descriptors, frequent consolidations
                          cause a higher write load and thus a higher write amplification.
                          
                          On the other hand, a small threshold value triggers the consolidation only
                          when there are a large number of segment files that don't vary in size a lot.
                          Consolidation occurs less frequently, reducing the write amplification, but
                          it can result in a greater number of segment files on disk.

                          Multiple combinations of candidate segments are checked and the one with
                          the lowest skew value is selected for consolidation. The selection process
                          picks the greatest number of segments that together have the lowest skew value
                          while ensuring that the size of the new consolidated segment remains under
                          the configured `segmentsBytesMax`.
                        type: number
                        minimum: 0.0
                        maximum: 1.0
                      minDeletionRatio:
                        description: |
                          The `minDeletionRatio` represents the minimum required deletion ratio
                          in one or more segments to perform a cleanup of those segments.
                          It is a number between `0.0` and `1.0`.

                          The deletion ratio is the percentage of deleted documents across one or
                          more segment files and is calculated by dividing the number of deleted
                          documents by the total number of documents in a segment or a group of
                          segments. For example, if there is a segment with 1000 documents of which
                          300 are deleted and another segment with 1000 documents of which 700 are
                          deleted, the deletion ratio is `0.5` (50%, calculated as `1000 / 2000`).

                          The `minDeletionRatio` threshold must be carefully selected. A smaller
                          value leads to earlier cleanup of deleted documents from segments and
                          thus reclamation of disk space but it generates a higher write load.
                          A very large value lowers the write amplification but at the same time
                          the system can be left with a large number of segment files with a high
                          percentage of deleted documents that occupy disk space unnecessarily.

                          During cleanup, the segment files are first arranged in decreasing
                          order of their individual deletion ratios. Then the largest subset of
                          segments whose collective deletion ratio is greater than or equal to
                          `minDeletionRatio` is picked.
                        type: integer
                        minimum: 0.0
                        maximum: 1.0
                  writebufferIdle:
                    description: |
                      Maximum number of writers (segments) cached in the pool (`0` = disabled).
                    type: integer
                  writebufferActive:
                    description: |
                      Maximum number of concurrent active writers (segments) that perform a
                      transaction. Other writers (segments) wait till current active writers
                      (segments) finish (`0` = disabled).
                    type: integer
                  writebufferSizeMax:
                    description: |
                      Maximum memory byte size per writer (segment) before a writer (segment) flush
                      is triggered. `0` value turns off this limit for any writer (buffer) and data
                      is flushed periodically based on the value defined for the flush thread
                      (`0` = disabled).
                    type: integer
        '400':
          description: |
            The `view-name` path parameter is missing or invalid.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 400
                  errorNum:
                    description: |
                      The ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '404':
          description: |
            A View called `view-name` could not be found.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 404
                  errorNum:
                    description: |
                      The ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
      tags:
        - Views
```

**Examples**

```curl
---
name: RestViewPatchPropertiesArangoSearch
description: |
  Update the properties of an `arangosearch` View, only changing one setting
  and removing a link. All other mutable properties that are not specified
  keep their current values.
---
var coll = db._create("users");
var coll = db._create("products");
var view = db._createView("productsView", "arangosearch", {
  cleanupIntervalStep: 666,
  commitIntervalMsec: 666,
  consolidationIntervalMsec: 666,
  links: {
    users: {
      includeAllFields: true
    },
    products: {
      fields: {
        description: {
          analyzers: ["text_en"]
        }
      }
    }
  }
});

var url = "/_api/view/"+ view.name() + "/properties";
var body = {
  cleanupIntervalStep: 12,
  links: {
    products: null
  }
};
var response = logCurlRequest('PATCH', url, body);
assert(response.code === 200);
assert(response.parsedBody.links.products === undefined);
assert(response.parsedBody.links.users !== undefined);
logJsonResponse(response);

db._dropView("productsView");
db._drop("users");
db._drop("products");
```

## Rename a View

```openapi
paths:
  /_db/{database-name}/_api/view/{view-name}/rename:
    put:
    # The PATCH method can be used as an alias
      operationId: renameView
      description: |
        Renames a View.

        {{</* info */>}}
        Renaming Views is not supported in cluster deployments.
        {{</* /info */>}}
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of the database.
          schema:
            type: string
        - name: view-name
          in: path
          required: true
          description: |
            The name of the View to rename.
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required:
                - name
              properties:
                name:
                  description: |
                    The new name for the View.
                  type: string
      responses:
        '200':
          description: |
            The View has been renamed successfully.
          content:
            application/json:
              schema:
                type: object
                required:
                  - links
                  - primarySort
                  - primarySortCompression
                  # primarySortCache # omitted if disabled
                  # primaryKeyCache  # omitted if disabled
                  - optimizeTopK
                  - storedValues
                  - cleanupIntervalStep
                  - commitIntervalMsec
                  - consolidationIntervalMsec
                  - consolidationPolicy
                  - writebufferIdle
                  - writebufferActive
                  - writebufferSizeMax
                  - id
                  - name
                  - type
                  - globallyUniqueId
                properties:
                  name:
                    description: |
                      The name of the View.
                    type: string
                    example: coll
                  type:
                    description: |
                      The type of the View (`"arangosearch"`).
                    type: string
                    example: arangosearch
                  id:
                    description: |
                      A unique identifier of the View (deprecated).
                    type: string
                  globallyUniqueId:
                    description: |
                      A unique identifier of the View. This is an internal property.
                    type: string
                  links:
                    description: |
                      An object with the attribute keys being names of to be linked collections,
                      and the link properties as attribute values. See
                      [`arangosearch` View Link Properties](../../../indexes-and-search/arangosearch/arangosearch-views-reference.md#link-properties)
                      for details.
                    type: object
                  primarySort:
                    description: |
                      The primary sort order, described by an array of objects, each specifying
                      a field (attribute path) and a sort direction.
                    type: array
                    items:
                      type: object
                      required:
                        - field
                        - asc
                      properties:
                        field:
                          description: |
                            An attribute path. The `.` character denotes sub-attributes.
                          type: string
                        asc:
                          description: |
                            The sort direction.

                            - `true` for ascending
                            - `false` for descending
                          type: boolean
                  primarySortCompression:
                    description: |
                      Defines how the primary sort data is compressed.

                      - `"lz4"`: LZ4 fast compression
                      - `"none"`: no compression
                    type: string
                    enum: [lz4, none]
                  primarySortCache:
                    description: |
                      Whether the primary sort columns are always cached in memory.
                    type: boolean
                  primaryKeyCache:
                    description: |
                      Whether the primary key columns are always cached in memory.
                    type: boolean
                  optimizeTopK:
                    description: |
                      An array of strings defining sort expressions that can be optimized.
                      This is also known as _WAND optimization_ (introduced in v3.12.0).
                    type: array
                    items:
                      type: string
                  storedValues:
                    description: |
                      An array of objects that describes which document attributes are stored
                      in the View index for covering search queries, which means the data can
                      be taken from the index directly and accessing the storage engine can
                      be avoided.
                    type: array
                    items:
                      type: object
                      required:
                        - fields
                      properties:
                        fields:
                          description: |
                            An array of strings with one or more document attribute paths.
                          type: array
                          items:
                            type: string
                        compression:
                          description: |
                            The compression type used for the internal column-store.
                            
                            - `"lz4"`: LZ4 fast compression
                            - `"none"`: no compression
                          type: string
                          enum: [lz4, none]
                        cache:
                          description: |
                            Whether stored values are always cached in memory.
                          type: boolean
                  cleanupIntervalStep:
                    description: |
                      Wait at least this many commits between removing unused files in the
                      ArangoSearch data directory (`0` = disabled).
                    type: integer
                  commitIntervalMsec:
                    description: |
                      Wait at least this many milliseconds between committing View data store
                      changes and making documents visible to queries (`0` = disabled).
                    type: integer
                  consolidationIntervalMsec:
                    description: |
                      Wait at least this many milliseconds between applying `consolidationPolicy` to
                      consolidate the View data store and possibly release space on the filesystem
                      (`0` = disabled).
                    type: integer
                  consolidationPolicy:
                    description: |
                      The consolidation policy to apply for selecting which segments should be merged.

                      - If the `tier` type is used, then the `segments*` and `minScore` properties are available.
                      - If the `bytes_accum` type is used, then the `threshold` property is available.
                    type: object
                    properties:
                      type:
                        description: |
                          The segment candidates for the "consolidation" operation are selected based
                          upon several possible configurable formulas as defined by their types.
                          The currently supported types are:
                          - `"tier"`: consolidate based on segment byte size and live
                            document count as dictated by the customization attributes.
                          - `"bytes_accum"`: consolidate if and only if
                            `{threshold} > (segment_bytes + sum_of_merge_candidate_segment_bytes) / all_segment_bytes`
                            i.e. the sum of all candidate segment byte size is less than the total
                            segment byte size multiplied by the `{threshold}`.
                        type: string
                        enum: [tier, bytes_accum]
                      threshold:
                        description: |
                          A value in the range `[0.0, 1.0]`
                        type: number
                        minimum: 0.0
                        maximum: 1.0
                      segmentsBytesMax:
                        description: |
                          Maximum allowed size of all consolidated segments in bytes.
                        type: integer
                      maxSkewThreshold:
                        description: |
                          The skew describes how much segment files vary in file size. It is a number
                          between `0.0` and `1.0` and is calculated by dividing the largest file size
                          of a set of segment files by the total size. For example, the skew of a
                          200 MiB, 300 MiB, and 500 MiB segment file is `0.5` (`500 / 1000`).

                          A large `maxSkewThreshold` value allows merging large segment files with
                          smaller ones, consolidation occurs more frequently, and there are fewer
                          segment files on disk at all times. While this may potentially improve the
                          read performance and use fewer file descriptors, frequent consolidations
                          cause a higher write load and thus a higher write amplification.
                          
                          On the other hand, a small threshold value triggers the consolidation only
                          when there are a large number of segment files that don't vary in size a lot.
                          Consolidation occurs less frequently, reducing the write amplification, but
                          it can result in a greater number of segment files on disk.

                          Multiple combinations of candidate segments are checked and the one with
                          the lowest skew value is selected for consolidation. The selection process
                          picks the greatest number of segments that together have the lowest skew value
                          while ensuring that the size of the new consolidated segment remains under
                          the configured `segmentsBytesMax`.
                        type: number
                        minimum: 0.0
                        maximum: 1.0
                      minDeletionRatio:
                        description: |
                          The `minDeletionRatio` represents the minimum required deletion ratio
                          in one or more segments to perform a cleanup of those segments.
                          It is a number between `0.0` and `1.0`.

                          The deletion ratio is the percentage of deleted documents across one or
                          more segment files and is calculated by dividing the number of deleted
                          documents by the total number of documents in a segment or a group of
                          segments. For example, if there is a segment with 1000 documents of which
                          300 are deleted and another segment with 1000 documents of which 700 are
                          deleted, the deletion ratio is `0.5` (50%, calculated as `1000 / 2000`).

                          The `minDeletionRatio` threshold must be carefully selected. A smaller
                          value leads to earlier cleanup of deleted documents from segments and
                          thus reclamation of disk space but it generates a higher write load.
                          A very large value lowers the write amplification but at the same time
                          the system can be left with a large number of segment files with a high
                          percentage of deleted documents that occupy disk space unnecessarily.

                          During cleanup, the segment files are first arranged in decreasing
                          order of their individual deletion ratios. Then the largest subset of
                          segments whose collective deletion ratio is greater than or equal to
                          `minDeletionRatio` is picked.
                        type: integer
                        minimum: 0.0
                        maximum: 1.0
                  writebufferIdle:
                    description: |
                      Maximum number of writers (segments) cached in the pool (`0` = disabled).
                    type: integer
                  writebufferActive:
                    description: |
                      Maximum number of concurrent active writers (segments) that perform a
                      transaction. Other writers (segments) wait till current active writers
                      (segments) finish (`0` = disabled).
                    type: integer
                  writebufferSizeMax:
                    description: |
                      Maximum memory byte size per writer (segment) before a writer (segment) flush
                      is triggered. `0` value turns off this limit for any writer (buffer) and data
                      is flushed periodically based on the value defined for the flush thread
                      (`0` = disabled).
                    type: integer
        '400':
          description: |
            The `view-name` path parameter is missing or invalid.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 400
                  errorNum:
                    description: |
                      The ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '404':
          description: |
            A View called `view-name` could not be found.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 404
                  errorNum:
                    description: |
                      The ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
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

## Drop a View

```openapi
paths:
  /_db/{database-name}/_api/view/{view-name}:
    delete:
      operationId: deleteView
      description: |
        Deletes the View identified by `view-name`.
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of the database.
          schema:
            type: string
        - name: view-name
          in: path
          required: true
          description: |
            The name of the View to drop.
          schema:
            type: string
      responses:
        '200':
          description: |
            The View has been dropped successfully.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - result
                properties:
                  error:
                    description: |
                      A flag indicating that no error occurred.
                    type: boolean
                    example: false
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 200
                  result:
                    description: |
                      The value `true`.
                    type: boolean
                    example: true
        '400':
          description: |
            The `view-name` path parameter is missing or invalid.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 400
                  errorNum:
                    description: |
                      The ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '404':
          description: |
            A View called `view-name` could not be found.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 404
                  errorNum:
                    description: |
                      The ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
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
