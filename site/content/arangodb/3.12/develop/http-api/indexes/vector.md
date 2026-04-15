---
title: HTTP interface for vector indexes
menuTitle: Vector
weight: 35
description: ''
---
<small>Introduced in: v3.12.4</small>

## Create a vector index

```openapi
paths:
  /_db/{database-name}/_api/index#vector:
    post:
      operationId: createIndexVector
      description: |
        Creates a vector index for the collection `collection-name`, if
        it does not already exist.
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
                - params
              properties:
                type:
                  description: |
                    The index type. Needs to be `"vector"`.
                  type: string
                  example: vector
                name:
                  description: |
                    A user-defined name for the index for easier
                    identification. If not specified, a name is automatically generated.
                  type: string
                fields:
                  description: |
                    A list with exactly one attribute path to specify
                    where the vector embedding is stored in each document.

                    If you want to index another vector embedding attribute, you need to create a
                    separate vector index.

                    Up to ArangoDB v3.12.8, the vector data needs to be populated before creating
                    the index. From v3.12.9 onward, you can create the vector index first and then
                    populate the collection with vector data. However, it is still recommended to
                    load the data first and then create the index to ensure that all documents
                    participate in the training process as the training is only executed once.
                    The training is triggered automatically if the vector index hasn't been
                    trained yet and the number of documents to index exceeds the threshold of
                    `nLists` documents. If `sparse` is set to `true`, documents without the
                    vector embedding field are not counted toward this threshold.
                    Check the `trainingState` to see if the index is
                    `"ready"` and `errorMessage` for the reason if it's not.
                  type: array
                  minItems: 1
                  maxItems: 1
                  items:
                    type: string
                storedValues:
                  description: |
                    Store additional attributes in the index (introduced in v3.12.7).
                    Unlike with other index types, this is not for covering projections
                    with the index but for adding attributes that you filter on.
                    This lets you make the lookup in the vector index more efficient
                    because it avoids materializing documents twice, once for the
                    filtering and once for the matches.

                    The maximum number of attributes that you can use in `storedValues` is 32.
                  type: array
                  uniqueItems: true
                  items:
                    description: |
                      A list of attribute paths. The `.` character denotes sub-attributes.
                      type: string
                    type: string
                sparse:
                  description: |
                    Whether to create a sparse index that excludes documents with
                    the attribute for indexing missing or set to `null`. This
                    attribute is defined by `fields`.
                  type: boolean
                  default: false
                parallelism:
                  description: |
                    The number of threads to use for indexing.
                  type: integer
                  default: 2
                inBackground:
                  description: |
                    Set this option to `true` to keep the collection/shards available for
                    write operations by not using an exclusive write lock for the duration
                    of the index creation.

                    If the option is disabled, the call returns only after the index is
                    ready (but timeouts may occur), or if an error is encountered.
                  type: boolean
                  default: false
                params:
                  description: |
                    The parameters as used by the Faiss library.
                  type: object
                  required:
                    - metric
                    - dimension
                    - nLists
                  properties:
                    metric:
                      description: |
                        The measure for calculating the vector similarity:
                        - `"cosine"`: Angular similarity. Vectors are automatically
                          normalized before insertion and search.
                        - `"innerProduct"` (introduced in v3.12.6):
                          Similarity in terms of angle and magnitude.
                          Vectors are not normalized, making it faster than `cosine`.
                        - `"l2":` Euclidean distance.
                      enum: ["cosine", "innerProduct", "l2"]
                    dimension:
                      description: |
                        The vector dimension. The attribute to index needs to
                        have this many elements in the array that stores the vector embedding.
                      type: integer
                    nLists:
                      description: |
                        The number of Voronoi cells to partition the vector space
                        into, respectively the number of centroids in the index. What value to choose
                        depends on the data distribution and chosen metric. According to
                        [The Faiss library paper](https://arxiv.org/abs/2401.08281), it should scale
                        sublinearly with the document count. The recommendation for ArangoDB is to use
                        approximately `15 * sqrt(N)` where `N` is the number of documents in the collection,
                        respectively the number of documents in the shard for cluster deployments.
                        A bigger value produces more correct results but increases the training time
                        and thus how long it takes to build the index. It cannot be bigger than the
                        number of documents.
                      type: integer
                    defaultNProbe:
                      description: |
                        How many neighboring centroids to
                        consider for the search results by default. The larger the number, the slower
                        the search but the better the search results. The default is `1`. You should
                        generally use a higher value here or per query via the `nProbe` option of
                        the vector similarity functions.
                      type: integer
                      default: 1
                    trainingIterations:
                      description: |
                        The number of iterations in the
                        training process. The default is `25`. Smaller values lead to a faster index
                        creation but may yield worse search results.
                      type: integer
                      default: 25
                    factory:
                      description: |
                        You can specify an index factory string that is
                        forwarded to the underlying Faiss library, allowing you to combine different
                        advanced options. Examples:
                        - `"IVF100_HNSW10,Flat"`
                        - `"IVF100,SQ4"`
                        - `"IVF10_HNSW5,Flat"`
                        - `"IVF100_HNSW5,PQ256x16"`

                        The base index must be an inverted file (IVF) to work with ArangoDB.
                        If you don't specify an index factory, the value is equivalent to
                        `IVF<nLists>,Flat`. For more information on how to create these custom
                        indexes, see the [Faiss Wiki](https://github.com/facebookresearch/faiss/wiki/The-index-factory).
                      type: string
      responses:
        '200':
          description: |
            The index already exists. The `isNewlyCreated` field is `false`.
          content:
            application/json:
              schema:
                type: object
                required:
                  - code
                  - error
                  - id
                  - isNewlyCreated
                  - type
                  - name
                  - fields
                  - params
                  - sparse
                  - unique
                  - trainingState
                properties:
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 200
                  error:
                    description: |
                      A flag indicating that no error occurred.
                    type: boolean
                    example: false
                  errorMessage:
                    description: |
                      An optional message with details about the
                      training state, for example, `"not enough training data for vector index"`.
                      Only present if there is a problem with the index.
                    type: string
                  id:
                    description: |
                      The identifier of the index in the format `<collection-name>/<index-identifier>`.
                    type: string
                    example: products/68
                  isNewlyCreated:
                    description: |
                      Whether the index was newly created (`true`) or already existed (`false`).
                    type: boolean
                    example: false
                  type:
                    description: |
                      The index type (`"vector"`).
                    type: string
                    example: vector
                  name:
                    description: |
                      The user-defined name of the index or an auto-generated name.
                    type: string
                  unique:
                    description: |
                      Whether the index is a unique index. Always `false` for vector indexes.
                    type: boolean
                    example: false
                  sparse:
                    description: |
                      Whether the index is a sparse index that excludes documents
                      with the indexed attribute missing or set to `null`.
                    type: boolean
                  fields:
                    description: |
                      The list with exactly one attribute path the index is created on.
                    type: array
                    minItems: 1
                    maxItems: 1
                    items:
                      type: string
                  storedValues:
                    description: |
                      The list of additionally stored attribute paths. Only
                      present if `storedValues` was specified during index creation.
                    type: array
                    items:
                      type: string
                  trainingState:
                    description: |
                      The current training state of the vector index:
                      - `"unusable"`: The index is not yet trained or cannot be
                        trained, for example, because of insufficient training data.
                      - `"training"`: The index is currently being trained.
                      - `"ingesting"`: The index has been trained and data is being
                        ingested.
                      - `"ready"`: The index is fully trained and ready for queries.
                    type: string
                    enum:
                      - unusable
                      - training
                      - ingesting
                      - ready
                  params:
                    description: |
                      The parameters of the vector index.
                    type: object
                    required:
                      - metric
                      - dimension
                      - nLists
                      - trainingIterations
                      - defaultNProbe
                    properties:
                      metric:
                        description: |
                          The distance metric used for similarity calculations.
                        type: string
                        enum: [cosine, innerProduct, l2]
                      dimension:
                        description: |
                          The vector dimension.
                        type: integer
                      nLists:
                        description: |
                          The number of Voronoi cells.
                        type: integer
                      trainingIterations:
                        description: |
                          The number of iterations used in the training process.
                        type: integer
                      defaultNProbe:
                        description: |
                          The default number of neighboring centroids to consider
                          in search queries.
                        type: integer
                      factory:
                        description: |
                          The Faiss index factory string, if one was specified
                          during index creation.
                        type: string
        '201':
          description: |
            The index is newly created. The `isNewlyCreated` field is `true`.
          content:
            application/json:
              schema:
                type: object
                required:
                  - code
                  - error
                  - id
                  - isNewlyCreated
                  - type
                  - name
                  - fields
                  - params
                  - sparse
                  - unique
                  - trainingState
                properties:
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 201
                  error:
                    description: |
                      A flag indicating that no error occurred.
                    type: boolean
                    example: false
                  errorMessage:
                    description: |
                      An optional message with details about the
                      training state, for example, `"not enough training data for vector index"`.
                      Only present if there is a problem with the index.
                    type: string
                  id:
                    description: |
                      The identifier of the index in the format `<collection-name>/<index-identifier>`.
                    type: string
                    example: products/68
                  isNewlyCreated:
                    description: |
                      Whether the index was newly created (`true`) or already existed (`false`).
                    type: boolean
                    example: true
                  type:
                    description: |
                      The index type (`"vector"`).
                    type: string
                    example: vector
                  name:
                    description: |
                      The user-defined name of the index or an auto-generated name.
                    type: string
                  unique:
                    description: |
                      Whether the index is a unique index. Always `false` for vector indexes.
                    type: boolean
                    example: false
                  sparse:
                    description: |
                      Whether the index is a sparse index that excludes documents
                      with the indexed attribute missing or set to `null`.
                    type: boolean
                  fields:
                    description: |
                      The list with exactly one attribute path the index is created on.
                    type: array
                    minItems: 1
                    maxItems: 1
                    items:
                      type: string
                  storedValues:
                    description: |
                      The list of additionally stored attribute paths. Only
                      present if `storedValues` was specified during index creation.
                    type: array
                    items:
                      type: string
                  trainingState:
                    description: |
                      The current training state of the vector index:
                      - `"unusable"`: The index is not yet trained or cannot be
                        trained, for example, because of insufficient training data.
                      - `"training"`: The index is currently being trained.
                      - `"ingesting"`: The index has been trained and data is being
                        ingested.
                      - `"ready"`: The index is fully trained and ready for queries.
                    type: string
                    enum:
                      - unusable
                      - training
                      - ingesting
                      - ready
                  params:
                    description: |
                      The parameters of the vector index.
                    type: object
                    required:
                      - metric
                      - dimension
                      - nLists
                      - trainingIterations
                      - defaultNProbe
                    properties:
                      metric:
                        description: |
                          The distance metric used for similarity calculations.
                        type: string
                        enum: [cosine, innerProduct, l2]
                      dimension:
                        description: |
                          The vector dimension.
                        type: integer
                      nLists:
                        description: |
                          The number of Voronoi cells.
                        type: integer
                      trainingIterations:
                        description: |
                          The number of iterations used in the training process.
                        type: integer
                      defaultNProbe:
                        description: |
                          The default number of neighboring centroids to consider
                          in search queries.
                        type: integer
                      factory:
                        description: |
                          The Faiss index factory string, if one was specified
                          during index creation.
                        type: string
        '400':
          description: |
            The request body or its content is invalid, for example,
            because of a missing or malformed `params` attribute.
          content:
            application/json:
              schema:
                type: object
                required:
                  - code
                  - error
                  - errorMessage
                  - errorNum
                properties:
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 400
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
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
            The collection is unknown.
          content:
            application/json:
              schema:
                type: object
                required:
                  - code
                  - error
                  - errorMessage
                  - errorNum
                properties:
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 404
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  errorNum:
                    description: |
                      The ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
      tags:
        - Indexes
```
