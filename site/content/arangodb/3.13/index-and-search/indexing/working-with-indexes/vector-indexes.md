---
title: Vector indexes
menuTitle: Vector Indexes
weight: 40
description: >-
  You can index vector embeddings to allow queries to quickly find semantically
  similar documents
---
<small>Introduced in: v3.12.4</small>

Vector indexes let you index vector embeddings stored in documents. Such
vectors are arrays of numbers that represent the meaning and relationships of
data numerically and can be generated with machine learning models.
You can then quickly find a given number of semantically similar documents by
searching for close neighbors in a high-dimensional vector space.

The vector index implementation uses the [Faiss library](https://github.com/facebookresearch/faiss/)
to support L2 and cosine metrics. The index used is IndexIVFFlat, the quantizer
for L2 is IndexFlatL2, and the cosine uses IndexFlatIP, where vectors are
normalized before insertion and search.

## How to use vector indexes

{{< warning >}}
The vector index is an experimental feature that you need to enable for the
ArangoDB server with the `--experimental-vector-index` startup option.
Once enabled for a deployment, it cannot be disabled anymore because it
permanently changes how the data is managed by the RocksDB storage engine
(it adds an additional column family).

To restore a dump that contains vector indexes, the `--experimental-vector-index`
startup option needs to be enabled on the deployment you want to restore to.
{{< /warning >}}

1. Enable the experimental vector index feature.
2. Calculate vector embeddings using [ArangoDB's GraphML](../../../../../gen-ai/graphml/_index.md)
   capabilities (available in ArangoGraph) or using external tools.
   Store each vector as an attribute in the respective document.
3. Create a vector index over this attribute. You need to choose which
   similarity metric you want to use later for querying. See
   [Vector index properties](#vector-index-properties) for all available
   configuration options.
4. Run AQL queries that use [Vector similarity functions](../../../aql/functions/vector.md)
   to retrieve a given number of similar documents relative to a vector embedding
   you provide.

Creating a vector index triggers training the index on top of real data and it
cannot be done incrementally without affecting the quality of the computation.
A vector index expects the data to already exist in the specified attribute.
This means **you cannot create a vector index for a collection upfront**, unlike
with all other index types. The documents need to already have vector embeddings
stored in an attribute that you then create the index over and train on.

While it is possible to add more documents with vector embeddings over time,
they can only be assigned to existing clusters in the high-dimensional vector
space as determined by the original vector index training. This can be suboptimal
as the new data points might warrant a different clustering with different
centroids and the quality of vector search thus degrades.

## Vector index properties

- **name** (_optional_): A user-defined name for the index for easier
  identification. If not specified, a name is automatically generated.
- **type**: The index type. Needs to be `"vector"`.
- **fields** (array of strings): A list with a single attribute path to specify
  where the vector embedding is stored in each document. The vector data needs
  to be populated before creating the index.
  
  If you want to index another vector embedding attribute, you need to create a
  separate vector index.
- **parallelism** (number):
  The number of threads to use for indexing. The default is `2`.
- **inBackground** (boolean):
  Set this option to `true` to keep the collection/shards available for
  write operations by not using an exclusive write lock for the duration
  of the index creation. The default is `false`.
- **params**: The parameters as used by the Faiss library.
  - **metric** (string): Whether to use `cosine` or `l2` (Euclidean) distance calculation.
  - **dimension** (number): The vector dimension. The attribute to index needs to
    have this many elements in the array that stores the vector embedding.
  - **nLists** (number): The number of Voronoi cells to partition the vector space
    into, respectively the number of centroids in the index. What value to choose
    depends on the data distribution and chosen metric. According to
    [The Faiss library paper](https://arxiv.org/abs/2401.08281), it should be
    around `N / 15` where `N` is the number of documents in the collection,
    respectively the number of documents in the shard for cluster deployments.
    A bigger value produces more correct results but increases the training time
    and thus how long it takes to build the index. It cannot be bigger than the
    number of documents.
  - **defaultNProbe** (number, _optional_): How many neighboring centroids to
    consider for the search results by default. The larger the number, the slower
    the search but the better the search results. The default is `1`. You should
    generally use a higher value here or per query via the `nProbe` option of
    the vector similarity functions.
  - **trainingIterations** (number, _optional_): The number of iterations in the
    training process. The default is `25`. Smaller values lead to a faster index
    creation but may yield worse search results. 
  - **factory** (string, _optional_): You can specify an index factory string that is
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

## Interfaces

### Create a vector index

{{< tabs "interfaces" >}}

{{< tab "Web interface" >}}
1. In the **Collections** section, click the name or row of the desired collection.
2. Go to the **Indexes** tab.
3. Click **Add index**.
4. Select **Vector** as the **Type**.
5. Enter the name of the attribute that holds the vector embeddings into **Fields**.
6. Set the parameters for the vector index. See [Vector index properties](#vector-index-properties)
   under `param`.
7. Optionally give the index a user-defined name.
8. Click **Create**.
{{< /tab >}}

{{< tab "arangosh" >}}
```js
db.coll.ensureIndex({
  name: "vector_l2",
  type: "vector",
  fields: ["embedding"],
  params: { 
    metric: "l2",
    dimension: 544,
    nLists: 100,
    defaultNProbe: 1,
    trainingIterations: 25
  }
});
```
{{< /tab >}}

{{< tab "cURL" >}}
```sh
curl -d '{"name":"vector_l2","type":"vector","fields":["embedding"],"params":{"metric":"l2","dimension":544,"nLists":100,"defaultNProbe":1,"trainingIterations":25}}' http://localhost:8529/_db/mydb/_api/index?collection=coll
```
{{< /tab >}}

{{< tab "JavaScript" >}}
```js
const info = await coll.ensureIndex({
  name: "vector_l2",
  type: "vector",
  fields: ["embedding"],
  params: {
    metric: "l2",
    dimension: 544,
    nLists: 100,
    defaultNProbe: 1,
    trainingIterations: 25
  }
});
```
{{< /tab >}}

{{< tab "Go" >}}
The Go driver does not support vector indexes yet.
{{< /tab >}}

{{< tab "Java" >}}
The Java driver does not support vector indexes yet.
{{< /tab >}}

{{< tab "Python" >}}
```py
info = coll.add_index({
  "name": "vector_l2",
  "type": "vector",
  "fields": ["embedding"],
  "params": {
    "metric": "l2",
    "dimension": 544
    "nLists": 100,
    "defaultNProbe": 1,
    "trainingIterations": 25
  }
})
```
{{< /tab >}}

{{< /tabs >}}
