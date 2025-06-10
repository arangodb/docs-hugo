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
                    where the vector embedding is stored in each document. The vector data needs
                    to be populated before creating the index.
                    
                    If you want to index another vector embedding attribute, you need to create a
                    separate vector index.
                  type: array
                  minItems: 1
                  maxItems: 1
                  items:
                    type: string
                parallelism:
                  description: |
                    The number of threads to use for indexing. Default: `2`
                  type: integer
                inBackground:
                  description: |
                    Set this option to `true` to keep the collection/shards available for
                    write operations by not using an exclusive write lock for the duration
                    of the index creation.
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
                        Whether to use `cosine` or `l2` (Euclidean) distance calculation.
                      type: string
                      enum: ["cosine", "l2"]
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
                        [The Faiss library paper](https://arxiv.org/abs/2401.08281), it should be
                        around `15 * sqrt(N)` where `N` is the number of documents in the collection,
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
