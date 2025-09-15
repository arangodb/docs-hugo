---
title: Vector search functions in AQL
menuTitle: Vector
weight: 60
description: >-
  The functions for vector search let you quickly find semantically similar
  documents utilizing indexed vector embeddings
---
<small>Introduced in: v3.12.4</small>

To use vector search, you need to have vector embeddings stored in documents
and the attribute that stores them needs to be indexed by a
[vector index](../../index-and-search/indexing/working-with-indexes/vector-indexes.md).

You can calculate vector embeddings using [ArangoDB's GraphML](../../data-science/graphml/_index.md)
capabilities (available in ArangoGraph) or using external tools.

{{< warning >}}
The vector index is an experimental feature that you need to enable for the
ArangoDB server with the `--experimental-vector-index` startup option.
Once enabled for a deployment, it cannot be disabled anymore because it
permanently changes how the data is managed by the RocksDB storage engine
(it adds an additional column family).

To restore a dump that contains vector indexes, the `--experimental-vector-index`
startup option needs to be enabled on the deployment you want to restore to.
{{< /warning >}}

## Vector similarity functions

In order to utilize a vector index, you need to do the following in an AQL query:

- Use one of the following vector similarity functions in a query.
- `SORT` by the similarity so that the most similar documents come first.
- Specify the maximum number of documents to retrieve with a `LIMIT` operation.

As a result, you get up to the specified number of documents whose vector embeddings
are the most similar to the reference vector embedding you provided in the query,
as approximated by the vector index.

Example:

```aql
FOR doc IN coll
  SORT APPROX_NEAR_COSINE(doc.vector, @q) DESC
  LIMIT 5
  RETURN doc
```

For this query, a vector index over the `vector` attribute and with the `cosine`
metric is required. The `@q` bind variable needs to be a vector (array of numbers)
with the dimension as specified in the vector index. It defines the point at
which to look for similar documents (up to `5` in this case). How many documents can
be found depends on the data as well as the search effort (see the `nProbe` option).

{{< info >}}
- If there is more than one suitable vector index over the same attribute, it is
  undefined which one is selected.
- You cannot have any `FILTER` operation between `FOR` and `LIMIT` for
  pre-filtering.
{{< /info >}}

### APPROX_NEAR_COSINE()

`APPROX_NEAR_COSINE(vector1, vector2, options) → similarity`

Retrieve the approximate angular similarity using the cosine metric, accelerated
by a matching vector index.

The higher the cosine similarity value is, the more similar the two vectors
are. The closer it is to 0, the more different they are. The value can also
be negative, indicating that the vectors are not similar and point in opposite
directions. You need to sort in descending order so that the most similar
documents come first, which is what a vector index using the `cosine` metric
can provide.

- **vector1** (array of numbers): The first vector. Either this parameter or
  `vector2` needs to reference a stored attribute holding the vector embedding.
- **vector2** (array of numbers): The second vector. Either this parameter or
  `vector1` needs to reference a stored attribute holding the vector embedding.
- **options** (object, _optional_):
  - **nProbe** (number, _optional_): How many neighboring centroids respectively
    closest Voronoi cells to consider for the search results. The larger the number,
    the slower the search but the better the search results. If not specified, the
    `defaultNProbe` value of the vector index is used.
- returns **similarity** (number): The approximate angular similarity between
  both vectors.

**Examples**

Return up to `10` similar documents based on their closeness to the vector
`@q` according to the cosine metric:

```aql
FOR doc IN coll
  SORT APPROX_NEAR_COSINE(doc.vector, @q) DESC
  LIMIT 10
  RETURN doc
```

Return up to `5` similar documents as well as the similarity value,
considering `20` neighboring centroids respectively closest Voronoi cells:

```aql
FOR doc IN coll
  LET similarity = APPROX_NEAR_COSINE(doc.vector, @q, { nProbe: 20 })
  SORT similarity DESC
  LIMIT 5
  RETURN MERGE( { similarity }, doc)
```

Return the similarity value and the document keys of up to `3` similar documents
for multiple input vectors using a subquery. In this example, the input vectors
are taken from ten random documents of the same collection:

```aql
FOR docOuter IN coll
  LIMIT 10
  LET neighbors = (
    FOR docInner IN coll
      LET similarity = APPROX_NEAR_COSINE(docInner.vector, docOuter.vector)
      SORT similarity DESC
      LIMIT 3
      RETURN { key: docInner._key, similarity }
  )
  RETURN { key: docOuter._key, neighbors }
```

### APPROX_NEAR_L2()

`APPROX_NEAR_L2(vector1, vector2, options) → similarity`

Retrieve the approximate distance using the L2 (Euclidean) metric, accelerated
by a matching vector index.

The closer the distance is to 0, the more similar the two vectors are. The higher
the value, the more different the they are. You need to sort in ascending order
so that the most similar documents come first, which is what a vector index using
the `l2` metric can provide.

- **vector1** (array of numbers): The first vector. Either this parameter or
  `vector2` needs to reference a stored attribute holding the vector embedding.
- **vector2** (array of numbers): The second vector. Either this parameter or
  `vector1` needs to reference a stored attribute holding the vector embedding.
- **options** (object, _optional_):
  - **nProbe** (number, _optional_): How many neighboring centroids to consider
    for the search results. The larger the number, the slower the search but the
    better the search results. If not specified, the `defaultNProbe` value of
    the vector index is used.
- returns **similarity** (number): The approximate L2 (Euclidean) distance between
  both vectors.

**Examples**

Return up to `10` similar documents based on their closeness to the vector
`@q` according to the L2 (Euclidean) metric:

```aql
FOR doc IN coll
  SORT APPROX_NEAR_L2(doc.vector, @q)
  LIMIT 10
  RETURN doc
```

Return up to `5` similar documents as well as the similarity value,
considering `20` neighboring centroids respectively closest Voronoi cells:

```aql
FOR doc IN coll
  LET similarity = APPROX_NEAR_L2(doc.vector, @q, { nProbe: 20 })
  SORT similarity
  LIMIT 5
  RETURN MERGE( { similarity }, doc)
```

Return the similarity value and the document keys of up to `3` similar documents
for multiple input vectors using a subquery. In this example, the input vectors
are taken from ten random documents of the same collection:

```aql
FOR docOuter IN coll
  LIMIT 10
  LET neighbors = (
    FOR docInner IN coll
      LET similarity = APPROX_NEAR_L2(docInner.vector, docOuter.vector)
      SORT similarity
      LIMIT 3
      RETURN { key: docInner._key, similarity }
  )
  RETURN { key: docOuter._key, neighbors }
```
