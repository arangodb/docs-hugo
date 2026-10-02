---
title: ArangoSearch Statistics HTTP API
menuTitle: ArangoSearch statistics
weight: 10
description: >-
  The HTTP interface for ArangoSearch statistics is an observability feature
  that lets you inspect the index segments that back `arangosearch` Views and
  inverted indexes
---
Both [`arangosearch` Views](../../../indexes-and-search/arangosearch/arangosearch-views-reference.md)
and [inverted indexes](../../../indexes-and-search/indexing/working-with-indexes/inverted-indexes.md)
store their data in ArangoSearch _data stores_. Every link of an
`arangosearch` View and every inverted index has its own data store, and each
data store is made up of immutable _segments_.
New segments are created by commits, and the background consolidation process
merges small segments into bigger ones and thereby removes documents that have
been marked as deleted, as governed by the
[consolidation properties](../../../indexes-and-search/arangosearch/arangosearch-views-reference.md#view-properties)
of the View or inverted index.

The ArangoSearch statistics API lets you look at these segments to understand
how a data store is laid out, how much of it is occupied by deleted documents,
and whether consolidation keeps up with the write load.

## Get the ArangoSearch statistics (experimental)

```openapi
---
apiVersions: [experimental]
---
paths:
  /_db/{database-name}/_admin/arangosearch/stats:
    get:
      operationId: getArangoSearchStats
      description: |
        <small>Introduced in: v3.12.11</small>

        {{</* warning */>}}
        The ArangoSearch statistics API is incomplete and thus an experimental
        feature. It is only available on single servers, and the reported data
        stores of `arangosearch` Views cannot be mapped back to the View they
        belong to.

        In v3.12.11, the endpoint reports the statistics of a single data store
        that you cannot select, as a flat object without the `numIndexes` and
        `indexes` attributes, and it returns an empty object if the database has
        no `arangosearch` View and no inverted index.
        {{</* /warning */>}}

        Returns the summarized statistics and the per-segment information of the
        ArangoSearch data stores of the specified database.

        The endpoint enumerates the collections of the database and reports the
        statistics of every `arangosearch` View link and every inverted index it
        encounters, identified by the name and type of the index as well as the
        collection it belongs to. The order in which the data stores are
        reported is not defined and can change. If the database has no
        `arangosearch` View and no inverted index, then the list of data stores
        is empty.

        You need at least read access to the specified database.
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of the database that holds the `arangosearch` Views or
            inverted indexes you want the statistics of.
          schema:
            type: string
      responses:
        '200':
          description: |
            The statistics were returned successfully. The `indexes` array is
            empty if the database contains no `arangosearch` View and no
            inverted index.
          content:
            application/json:
              schema:
                type: object
                required:
                  - numIndexes
                  - indexes
                properties:
                  numIndexes:
                    description: |
                      The number of ArangoSearch data stores the statistics are
                      reported for. It is equal to the length of the `indexes`
                      array.
                    type: integer
                    example: 2
                  indexes:
                    description: |
                      The list of ArangoSearch data stores of the database, each
                      with its summarized statistics and per-segment information.
                    type: array
                    items:
                      type: object
                      required:
                        - indexName
                        - indexType
                        - collection
                        - numDocs
                        - numLiveDocs
                        - deletionRatio
                        - numPrimaryDocs
                        - numSegments
                        - numFiles
                        - indexSize
                        - segments
                      properties:
                        indexName:
                          description: |
                            The name of the index the data store belongs to.

                            - For `inverted` indexes, this is the same as the `name`
                              of the index, which can be user-defined.
                            - For the internal indexes of `arangosearch` Views (links),
                              this is an automatically generated name which cannot be
                              mapped back to the View it belongs to.
                          type: string
                          example: "inv-idx"
                        indexType:
                          description: |
                            The type of the index the data store belongs to,
                            which is either `arangosearch` for a View link or
                            `inverted` for an inverted index.
                          type: string
                          example: "inverted"
                          enum: [arangosearch, inverted]
                        collection:
                          description: |
                            The name of the collection the index belongs to.
                          type: string
                          example: "coll"
                        numDocs:
                          description: |
                            The number of documents in the data store, including
                            the documents that are marked as deleted but that are
                            not removed yet.
                          type: integer
                          example: 6
                        numLiveDocs:
                          description: |
                            The number of documents in the data store that are
                            not marked as deleted.
                          type: integer
                          example: 5
                        deletionRatio:
                          description: |
                            The share of documents that are marked as deleted,
                            calculated as `(numDocs - numLiveDocs) / numDocs` and
                            rounded to two decimal places. It is `0` if the data
                            store is empty. A high value indicates that the data
                            store holds a lot of data that consolidation can
                            still reclaim.
                          type: number
                          example: 0.17
                        numPrimaryDocs:
                          description: |
                            The number of top-level documents in the data store.
                            It is equal to `numDocs` unless the View or inverted
                            index indexes nested fields, in which case the child
                            documents are not counted.
                          type: integer
                          example: 6
                        numSegments:
                          description: |
                            The number of segments the data store is made up of.
                          type: integer
                          example: 2
                        numFiles:
                          description: |
                            The number of files that represent the data store.
                            This includes the files of all segments as well as
                            the segments file itself.
                          type: integer
                          example: 12
                        indexSize:
                          description: |
                            The size of the data store in bytes, calculated as
                            the sum of the sizes of all segments.
                          type: integer
                          example: 4118
                        segments:
                          description: |
                            The list of segments the data store is made up of.
                          type: array
                          items:
                            type: object
                            required:
                              - name
                              - numDocs
                              - numLiveDocs
                              - byteSize
                              - deletionRatio
                            properties:
                              name:
                                description: |
                                  The name of the segment as used on disk, for
                                  instance `_1`.
                                type: string
                                example: "_1"
                              numDocs:
                                description: |
                                  The number of documents in the segment,
                                  including the documents that are marked as
                                  deleted but that are not removed yet.
                                type: integer
                                example: 5
                              numLiveDocs:
                                description: |
                                  The number of documents in the segment that are
                                  not marked as deleted.
                                type: integer
                                example: 4
                              byteSize:
                                description: |
                                  The size of the segment in bytes.
                                type: integer
                                example: 3562
                              deletionRatio:
                                description: |
                                  The share of documents in the segment that are
                                  marked as deleted, calculated as
                                  `(numDocs - numLiveDocs) / numDocs` and rounded
                                  to two decimal places. It is `0` if the segment
                                  holds no documents.
                                type: number
                                example: 0.2
        '401':
          description: |
            The credentials are wrong, the user account is inactive, or the
            specified database doesn't exist and the user account has no default
            access to it.
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
                    example: 401
                  errorNum:
                    description: |
                      The ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '403':
          description: |
            The specified database exists but the user account has no access to it.
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
                    example: 403
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
            The specified database doesn't exist.
            revealed.
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
                    example: 1228
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '405':
          description: |
            Returned when an HTTP method other than `GET` is used.
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
                    example: 405
                  errorNum:
                    description: |
                      The ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '500':
          description: |
            An internal error occurred while gathering or serializing the
            statistics.
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
                    example: 500
                  errorNum:
                    description: |
                      The ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '501':
          description: |
            Returned when the endpoint is called on a cluster deployment.
            The statistics are only available on single servers.
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
                    example: 501
                  errorNum:
                    description: |
                      The ArangoDB error number for the error that occurred.
                    type: integer
                    example: 1470
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
      tags:
        - Monitoring
```

**Examples**

{{< comment >}}
Example not generated because the endpoint reports every View link and inverted
index of the database, which in `_system` can include ones from any other
example that runs at the same time. It would need a dedicated database and a
wait for the commit, and the segment layout would still differ on every
regeneration.
{{< /comment >}}

```bash
curl --header 'accept: application/json' --dump - http://localhost:8529/_arango/experimental/_db/_system/_admin/arangosearch/stats
```

{{< details summary="Show output" >}}
```json
{
  "numIndexes": 2,
  "indexes": [
    {
      "indexName": "idx_1780862094262272000",
      "indexType": "arangosearch",
      "collection": "coll",
      "numDocs": 6,
      "numLiveDocs": 5,
      "deletionRatio": 0.17,
      "numPrimaryDocs": 6,
      "numSegments": 2,
      "numFiles": 12,
      "indexSize": 4118,
      "segments": [
        {
          "name": "_1",
          "numDocs": 5,
          "numLiveDocs": 4,
          "byteSize": 3562,
          "deletionRatio": 0.2
        },
        {
          "name": "_2",
          "numDocs": 1,
          "numLiveDocs": 1,
          "byteSize": 556,
          "deletionRatio": 0
        }
      ]
    },
    {
      "indexName": "inv-idx",
      "indexType": "inverted",
      "collection": "coll2",
      "numDocs": 2,
      "numLiveDocs": 2,
      "deletionRatio": 0,
      "numPrimaryDocs": 2,
      "numSegments": 1,
      "numFiles": 6,
      "indexSize": 1247,
      "segments": [
        {
          "name": "_1",
          "numDocs": 2,
          "numLiveDocs": 2,
          "byteSize": 1201,
          "deletionRatio": 0
        }
      ]
    }
  ]
}
```
{{< /details >}}
