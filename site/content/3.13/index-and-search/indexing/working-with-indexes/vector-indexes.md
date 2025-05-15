---
title: Vector indexes
menuTitle: Vector Indexes
weight: 40
description: >-
  You can index vector embeddings to allow queries to quickly find semantically
  similar documents
---
Vector indexes let you index vector embeddings stored in documents. Such
vectors are arrays of numbers that represent the meaning and relationships of
data numerically. You can you quickly find a given number of semantically
similar documents by searching for close neighbors in a high-dimensional
vector space.

The vector index implementation uses the [Faiss library](https://github.com/facebookresearch/faiss/)
to support L2 and cosine metrics. The index used is IndexIVFFlat, the quantizer
for L2 is IndexFlatL2, and the cosine uses IndexFlatIP, where vectors are
normalized before insertion and search.

Sometimes, if there is no relevant data found in the list, the faiss might not
produce the top K requested results. Therefore, only the found results is provided. <!-- TODO -->

{{< warning >}}
The vector index is an experimental feature that you need to enable for the
ArangoDB server with the `--experimental-vector-index` startup option.
Once enabled for a deployment, it cannot be disabled anymore because it
permanently changes how the data is managed by the RocksDB storage engine
(it adds an additional column family).
{{< /warning >}}

### How to use vector indexes

Creating an index triggers training the index on top of real data, which is a limitation that assumes the data already exists for the vector field upon which the index is created.
The number of training points depends on the nLists parameter; a bigger nLists will produce more correct results but will increase the training time necessary to build the index.


## Vector index properties

- **name** (_optional_): A user-defined name for the index for easier
  identification. If not specified, a name is automatically generated.
- **type**: The index type. Needs to be `"vector"`.
- **fields** (array of strings): A list with a single attribute path to specify
  where the vector embedding is stored in each document. The vector data needs
  to be populated before creating the index.
  
  If you want to index another vector embedding attribute, you need to create a
  separate vector index.
- **params**: The parameters as used by the Faiss library.
  - **metric** (string): Whether to use `cosine` or `l2` (Euclidean) distance calculation.
  - **dimension** (number): The vector dimension. The attribute to index needs to
    have this many elements in the array that stores the vector embedding.
  - **nLists** (number): The number of centroids in the index. What value to choose
    depends on the data distribution and chosen metric. According to
    [The Faiss library paper](https://arxiv.org/abs/2401.08281), it should be
    around `15 * N` where `N` is the number of documents in the collection,
    respectively the number of documents in the shard for cluster deployments.
  - **defaultNProbe** (number, _optional_): How many neighboring centroids to
    consider for the search results by default. The larger the number, the slower
    the search but the better the search results. The default is `1`. <!-- TODO: recommend higher -->
  - **trainingIterations** (number, _optional_): The number of iterations in the
    training process. The default is `25`. Smaller values lead to a faster index
    creation but may yield worse search results. 
  - **factory** (string, _optional_): You can specify a factory string to pass
    through to the underlying Faiss library, allowing you to combine different
    options, for example:
    - `"IVF100_HNSW10,Flat"`
    - `"IVF100,SQ4"`
    - `"IVF10_HNSW5,Flat"`
    - `"IVF100_HNSW5,PQ256x16"`
    The base index must be an IVF to work with ArangoDB. For more information on
    how to create these custom indexes, see the
    [Faiss Wiki](https://github.com/facebookresearch/faiss/wiki/The-index-factory).

## Interfaces

### Create a vector index

{{< tabs "interfaces" >}}

{{< tab "Web interface" >}}
1. In the **Collections** section, click the name or row of the desired collection.
2. Go to the **Indexes** tab.
3. Click **Add index**.
4. Select **Vector** as the **Type**.
5. Enter the name of the attribute that holds the vector embeddings into **Fields**.
6. Set the parameters for the vector index, see [Vector index parameters](#vector-index-parameters).
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
