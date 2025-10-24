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

You can calculate vector embeddings using [ArangoDB's GraphML](../../../../ai-suite/graphml/_index.md)
capabilities (available in the Arango Managed Platform (AMP)) or using external tools.

{{< warning >}}
You need to enable the vector index feature for the
ArangoDB server with the `--vector-index` startup option.
Once enabled for a deployment, it cannot be disabled anymore because it
permanently changes how the data is managed by the RocksDB storage engine
(it adds an additional column family).

To restore a dump that contains vector indexes, the `--vector-index`
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

- In v3.12.4 and v3.12.5, you cannot have any `FILTER` operation between `FOR`
  and `LIMIT` for pre-filtering. From v3.12.6 onward, you can add `FILTER`
  operations between `FOR` and `SORT` that are then applied during the lookup in
  the vector index. Example:

  ```aql
  FOR doc IN coll
    FILTER doc.val > 3
    SORT APPROX_NEAR_COSINE(doc.vector, @q) DESC
    LIMIT 5
    RETURN doc
  ```

  Note that e.g. `LIMIT 5` does not ensure that you get 5 results by searching
  as many neighboring Voronoi cells as necessary, but it rather considers only as
  many as configured via the `nProbes` parameter.
{{< /info >}}

### APPROX_NEAR_COSINE()

`APPROX_NEAR_COSINE(vector1, vector2, options) → similarity`


Retrieve the approximate cosine of the angle between two vectors, accelerated
by a matching vector index with the `cosine` metric.

The closer the similarity value is to 1, the more similar the two vectors
are. The closer it is to 0, the more different they are. The value can also be
negative up to -1, indicating that the vectors are not similar and point in opposite
directions. You need to **sort in descending order** so that the most similar
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
- returns **similarity** (number): The approximate cosine similarity of
  both normalized vectors. The value range is `[-1, 1]`.

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

### APPROX_NEAR_INNER_PRODUCT()

<small>Introduced in: v3.12.6</small>

`APPROX_NEAR_INNER_PRODUCT(vector1, vector2, options) → similarity`

Retrieve the approximate dot product of two vectors, accelerated by a matching
vector index with the `innerProduct` metric.

The higher the similarity value is, the more similar the two vectors
are. The closer it is to 0, the more different they are. The value can also
be negative, indicating that the vectors are not similar and point in opposite
directions. You need to **sort in descending order** so that the most similar
documents come first, which is what a vector index using the `innerProduct`
metric can provide.

- **vector1** (array of numbers): The first vector. Either this parameter or
  `vector2` needs to reference a stored attribute holding the vector embedding.
- **vector2** (array of numbers): The second vector. Either this parameter or
  `vector1` needs to reference a stored attribute holding the vector embedding.
- **options** (object, _optional_):
  - **nProbe** (number, _optional_): How many neighboring centroids respectively
    closest Voronoi cells to consider for the search results. The larger the number,
    the slower the search but the better the search results. If not specified, the
    `defaultNProbe` value of the vector index is used.
- returns **similarity** (number): The approximate dot product
  of both vectors without normalization. The value range is unbounded.

**Examples**

Return up to `10` similar documents based on their closeness to the vector
`@q` according to the inner product metric:

```aql
FOR doc IN coll
  SORT APPROX_NEAR_INNER_PRODUCT(doc.vector, @q) DESC
  LIMIT 10
  RETURN doc
```

Return up to `5` similar documents as well as the similarity value,
considering `20` neighboring centroids respectively closest Voronoi cells:

```aql
FOR doc IN coll
  LET similarity = APPROX_NEAR_INNER_PRODUCT(doc.vector, @q, { nProbe: 20 })
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
      LET similarity = APPROX_NEAR_INNER_PRODUCT(docInner.vector, docOuter.vector)
      SORT similarity DESC
      LIMIT 3
      RETURN { key: docInner._key, similarity }
  )
  RETURN { key: docOuter._key, neighbors }
```

### APPROX_NEAR_L2()

`APPROX_NEAR_L2(vector1, vector2, options) → distance`

Retrieve the approximate distance using the L2 (Euclidean) metric, accelerated
by a matching vector index with the `l2` metric.

The closer the distance is to 0, the more similar the two vectors are. The higher
the value, the more different the they are. You need to **sort in ascending order**
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
- returns **distance** (number): The approximate L2 (Euclidean) distance between
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
