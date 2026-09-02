---
title: ArangoSearch Statistics HTTP API
menuTitle: ArangoSearch statistics
weight: 10
description: >-
  The HTTP interface for ArangoSearch statistics is an observability feature
  that lets you inspect the index segments that back `arangosearch` Views and
  inverted indexes
---
Both `arangosearch` Views and inverted indexes store their data in an
ArangoSearch data store that is made up of immutable _segments_.
New segments are created by commits, and the background consolidation process
merges small segments into bigger ones and thereby removes documents that have
been marked as deleted.

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
        {{</* warning */>}}
        The ArangoSearch statistics API is incomplete and thus an experimental
        feature. It reports the statistics of a single ArangoSearch data store
        that you cannot select, and it is only available on single servers.
        {{</* /warning */>}}

        Returns the summarized statistics and the per-segment information of one
        ArangoSearch data store of the specified database.

        The endpoint enumerates the collections of the database and reports the
        statistics of the first `arangosearch` View link or inverted index it
        encounters. Which data store this is, is not defined and can change, and
        the statistics of the remaining data stores are neither reported nor
        aggregated. If the database has no `arangosearch` View and no inverted
        index, then an empty object is returned.

        You need at least read access to the specified database.
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of the database that holds the `arangosearch` View or
            inverted index you want the statistics of.
          schema:
            type: string
      responses:
        '200':
          description: |
            The statistics were returned successfully. The response body is an
            empty object if the database contains no `arangosearch` View and no
            inverted index.
          content:
            application/json:
              schema:
                type: object
                properties:
                  numDocs:
                    description: |
                      The number of documents in the data store, including the
                      documents that are marked as deleted but that are not
                      removed yet.
                    type: integer
                    example: 6
                  numLiveDocs:
                    description: |
                      The number of documents in the data store that are not
                      marked as deleted.
                    type: integer
                    example: 5
                  deletionRatio:
                    description: |
                      The share of documents that are marked as deleted,
                      calculated as `(numDocs - numLiveDocs) / numDocs` and
                      rounded to two decimal places. It is `0` if the data store
                      is empty. A high value indicates that the data store holds
                      a lot of data that consolidation can still reclaim.
                    type: number
                    example: 0.17
                  numPrimaryDocs:
                    description: |
                      The number of top-level documents in the data store.
                      It is equal to `numDocs` unless the View or inverted index
                      indexes nested fields, in which case the child documents
                      are not counted (Enterprise Edition).
                    type: integer
                    example: 6
                  numSegments:
                    description: |
                      The number of segments the data store is made up of.
                    type: integer
                    example: 2
                  numFiles:
                    description: |
                      The number of files that represent the data store. This
                      includes the files of all segments as well as the segments
                      file itself.
                    type: integer
                    example: 12
                  indexSize:
                    description: |
                      The size of the data store in bytes, calculated as the sum
                      of the sizes of all segments.
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
                            The number of documents in the segment, including the
                            documents that are marked as deleted but that are not
                            removed yet.
                          type: integer
                          example: 5
                        numLiveDocs:
                          description: |
                            The number of documents in the segment that are not
                            marked as deleted.
                          type: integer
                          example: 4
                        byteSize:
                          description: |
                            The size of the segment in bytes.
                          type: integer
                          example: 3562
                        deletionRatio:
                          description: |
                            The share of documents in the segment that are marked
                            as deleted, calculated as
                            `(numDocs - numLiveDocs) / numDocs` and rounded to
                            two decimal places. It is `0` if the segment holds no
                            documents.
                          type: number
                          example: 0.2
        '401':
          description: |
            The credentials are wrong or the user account is inactive.
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
        '404':
          description: |
            The specified database doesn't exist, or the user account you
            authenticated with has no access to it. Both cases are reported as the
            database not being found so that the existence of databases is not
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
Example not generated because it requires an arangosearch View or inverted index
with committed data and the segment layout depends on the commit and
consolidation timing.
{{< /comment >}}

```bash
curl --header 'accept: application/json' --dump - http://localhost:8529/_arango/experimental/_db/_system/_admin/arangosearch/stats
```

{{< details summary="Show output" >}}
```json
{
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
}
```
{{< /details >}}

How eagerly segments are merged is governed by the `consolidationPolicy` and
`consolidationIntervalMsec` properties of `arangosearch` Views and inverted
indexes, whereas the `cleanupIntervalStep` property controls how often unused
files are removed. See
[View Properties](../../../indexes-and-search/arangosearch/arangosearch-views-reference.md#view-properties)
for details.
