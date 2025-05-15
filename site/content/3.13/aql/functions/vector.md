---
title: Vector search functions in AQL
menuTitle: Vector
weight: 60
description: >-
  The functions for vector search let you utilize indexed vector embeddings to
  quickly find semantically similar documents
---
To use vector search, you need to have vector embeddings stored in documents
and the attribute that stores them needs to be indexed by a
[vector index](../../index-and-search/indexing/working-with-indexes/vector-indexes.md).

{{< warning >}}
The vector index is an experimental feature that you need to enable for the
ArangoDB server with the `--experimental-vector-index` startup option.
Once enabled for a deployment, it cannot be disabled anymore because it
permanently changes how the data is managed by the RocksDB storage engine
(it adds an additional column family).
{{< /warning >}}

{{< comment >}}TODO: Add DSS docs or already mention because of ArangoGraph with ML?
You can calculate vector embeddings using ArangoDB's GraphML capabilities or
external tools.
{{< /comment >}}

## Distance functions

In order to utilize a vector index, you need to use one of the following
vector distance functions in a query, sort by this distance, and specify the
maximum number of similar documents to retrieve with a `LIMIT` operation.
Example:

```aql
FOR doc IN coll
  SORT APPROX_NEAR_L2(doc.vector, @q)
  LIMIT 5
  RETURN doc
```

The `@q` bind variable needs to be vector (array of numbers) with the dimension
as specified in the vector index. It defines the point at which to look for
neighbors (`5` in this case). <!-- TODO how many results depends on the data and nProbe value! -->

The sorting order needs to be **ascending for the L2 metric** (shown above) and
**descending for the cosine metric**:

```aql
FOR doc IN coll
  SORT APPROX_NEAR_COSINE(doc.vector, @q) DESC
  LIMIT 5
  RETURN doc
```

### APPROX_NEAR_COSINE()

`APPROX_NEAR_COSINE(vector1, vector2, options) → dist`

Retrieve the approximate distance using the cosine metric, accelerated by a
matching vector index.

- **vector1** (array of numbers): The first vector. Either this parameter or
  `vector2` needs to reference a stored attribute holding the vector embedding.
  attribute of a stored document that stores a vector, like `doc.vector`
- **vector2** (array of numbers): The second vector. Either this parameter or
  `vector1` needs to reference a stored attribute holding the vector embedding.
- **options** (object, _optional_):
  - **nProbe** (number, _optional_): How many neighboring centroids to consider
    for the search results. The larger the number, the slower the search but the
    better the search results. If not specified, the `defaultNProbe` value of
    the vector index is used.
- returns **dist** (number): The approximate cosine distance between both vectors.

<!-- TODO: generated examples possible? -->

### APPROX_NEAR_L2()

`APPROX_NEAR_L2(vector1, vector2, options) → dist`

Retrieve the approximate distance using the L2 (Euclidean) metric, accelerated
by a matching vector index.

- **vector1** (array of numbers): The first vector. Either this parameter or
  `vector2` needs to reference a stored attribute holding the vector embedding.
  attribute of a stored document that stores a vector, like `doc.vector`
- **vector2** (array of numbers): The second vector. Either this parameter or
  `vector1` needs to reference a stored attribute holding the vector embedding.
- **options** (object, _optional_):
  - **nProbe** (number, _optional_): How many neighboring centroids to consider
    for the search results. The larger the number, the slower the search but the
    better the search results. If not specified, the `defaultNProbe` value of
    the vector index is used.
- returns **dist** (number): The approximate L2 (Euclidean) distance between
  both vectors.

<!-- TODO: generated examples possible? -->
