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

The vector index implementation uses the [Faiss library](https://github.com/facebookresearch/faiss/).

## How to use vector indexes

{{< warning >}}
You need to enable the vector index feature for the
ArangoDB server with the `--vector-index` startup option.
Once enabled for a deployment, it cannot be disabled anymore because it
permanently changes how the data is managed by the RocksDB storage engine
(it adds an additional column family).

Enabling the feature has no impact on the performance of your deployment. It
only adds an additional RocksDB column family that stays empty and idle until
you actually create a vector index. Regular workloads that don't use vector
indexes are unaffected.

To restore a dump that contains vector indexes, the `--vector-index`
startup option needs to be enabled on the deployment you want to restore to.
{{< /warning >}}

1. Enable the vector index feature.
2. Calculate vector embeddings using [Arango's GraphML](../../../../../agentic-ai-suite/graphml/_index.md)
   capabilities (available in the Arango Contextual Data Platform) or using external tools.
   Store each vector as an attribute in the respective document.
3. Create a vector index over this attribute. You need to choose which
   similarity metric you want to use later for querying. See
   [Vector index properties](#vector-index-properties) for all available
   configuration options.
4. Run AQL queries that use [Vector similarity functions](../../../aql/functions/vector.md)
   to retrieve a given number of similar documents relative to a vector embedding
   you provide.

Up to ArangoDB v3.12.8, a vector index expects the data to already exist in the specified attribute.
This means **you cannot create a vector index for a collection upfront**, unlike
with all other index types. The documents need to already have vector embeddings
stored in an attribute that you then create the index over and train on.

From ArangoDB v3.12.9 onward, you can create a vector index first and the
training is automatically triggered once there is sufficient data. It is still
recommended to load the data first and then create the vector index to ensure
the training uses all of the desired data.

Vector indexes are trained on your data and this cannot be done incrementally
without affecting the quality of the computation.

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
  where the vector embedding is stored in each document.

  If you want to index another vector embedding attribute, you need to create a
  separate vector index.

  Up to ArangoDB v3.12.8, the vector data needs to be populated before creating
  the index. From v3.12.9 onward, you can create the vector index first and then
  populate the collection with vector data. However, it is still recommended to
  load the data first and then create the index to ensure that all documents
  participate in the training process as the training is only executed once.
  The training is triggered automatically if the vector index hasn't been
  trained yet and the number of documents to index exceeds a threshold. The
  threshold is the `nLists` value if you set a fixed number of centroids,
  and the `minNLists` value if you use the scaling mode of `nLists`
  (from v3.12.10 onward). If `sparse` is set to `true`, documents without the
  vector embedding field are not counted toward this threshold.
  Check the `trainingState` to see if the index is
  `"ready"` and `errorMessage` for the reason if it's not.
- **sparse** (boolean): Whether to create a sparse index that excludes documents
  with the attribute for indexing missing or set to `null`. This attribute is
  defined by `fields`. Default: `false`.
- **parallelism** (number):
  The number of threads to use for indexing. Default: `2`.
- **inBackground** (boolean):
  Set this option to `true` to keep the collection/shards available for
  write operations by not using an exclusive write lock for the duration
  of the index creation. Default: `false`.

  If the option is disabled, the call returns only after the index is
  ready (but timeouts may occur), or if an error is encountered.
- **storedValues** (array of strings, introduced in v3.12.7):
  Store additional attributes in the index.

  The maximum number of attributes that you can use in `storedValues` is 32.
  
  - Up to v3.12.9, these are not for covering projections with the index but for
    adding attributes that you filter on. This lets you make the lookup in the
    vector index more efficient because it avoids materializing documents twice,
    once for the filtering and once for the matches.
  - From v3.12.10 onward, these are also used to cover projections. This lets
    you return the attributes directly from the index without materialization.
- **params**: The parameters as used by the Faiss library.
  - **metric** (string): The measure for calculating the vector similarity:
    - `"cosine"`: Angular similarity. Vectors are automatically
      normalized before insertion and search.
    - `"innerProduct"` (introduced in v3.12.6):
      Similarity in terms of angle and magnitude.
      Vectors are not normalized, making it faster than `cosine`.
    - `"l2":` Euclidean distance.
  - **dimension** (number): The vector dimension. The attribute to index needs to
    have this many elements in the array that stores the vector embedding.
  - **nLists** (number\|object): The number of Voronoi cells to partition the
    vector space into, respectively the number of centroids in the index. What
    value to choose depends on the data distribution and chosen metric.
    According to [The Faiss library paper](https://arxiv.org/abs/2401.08281),
    it should scale sublinearly with the document count.
    A bigger value produces more correct results but increases the training time
    and thus how long it takes to build the index. It cannot be bigger than the
    number of documents.

    Up to v3.12.9, you need to set this option to a number. From v3.12.10 onward,
    the option is optional and you can either set a fixed number of centroids or
    let ArangoDB compute the number from the document count:

    - **Fixed mode** (number): Use exactly this number of centroids, for example
      `100`. The recommendation for ArangoDB is to use approximately
      `15 * sqrt(N)` where `N` is the number of documents in the collection,
      respectively the number of documents in the shard for cluster deployments.
    - **Scaling mode** (object, introduced in v3.12.10): Compute the number of
      centroids from the number of documents at training time. In cluster
      deployments, the computation is done per shard using the document count of
      the respective shard. This is especially useful if the data distribution
      across shards is unequal. The attributes of the object are the following:
      - **strategy** (string): How to compute the number of centroids if no tier
        applies. The only available value is `"autoSqrt"`, which computes
        `max(minNLists, multiplier * sqrt(N))` where `N` is the number of
        documents of the shard.
      - **multiplier** (number): The factor to use in the `autoSqrt` strategy.
        It must be `1` or greater.
      - **minNLists** (number): The lower bound for the number of centroids
        computed by the `autoSqrt` strategy. It must be `1` or greater.
        It is also the number of documents required to trigger the training.
      - **tiers** (array of objects, _optional_): Fixed numbers of centroids for
        large document counts. The tier with the highest `threshold` that is less
        than or equal to the number of documents wins and its `fixedValue` is
        used instead of computing a value with the `strategy`.
        Each tier has the following attributes:
        - **threshold** (number): The minimum number of documents for the tier to
          apply. It must be `1` or greater.
        - **fixedValue** (number): The number of centroids to use.
          It must be `1` or greater.

      If you specify `nLists` as an object, you need to set `strategy`,
      `multiplier`, and `minNLists`. Only `tiers` is optional.

    If you don't specify `nLists` at all, the following scaling specification is
    used (the values are taken from the
    [autofaiss](https://github.com/criteo/autofaiss) library):

    ```json
    {
      "nLists": {
        "strategy": "autoSqrt",
        "multiplier": 4,
        "minNLists": 2,
        "tiers": [
          { "threshold": 1000000,   "fixedValue": 16384 },
          { "threshold": 10000000,  "fixedValue": 65536 },
          { "threshold": 300000000, "fixedValue": 131072 }
        ]
      }
    }
    ```

    It resolves to the following numbers of centroids for `N` documents:

    - `N` < 1,000,000: `max(2, 4 * sqrt(N))`
    - 1,000,000 ≤ `N` < 10,000,000: `16384`
    - 10,000,000 ≤ `N` < 300,000,000: `65536`
    - `N` ≥ 300,000,000: `131072`

    Note that the scaling mode cannot resolve a number of centroids for an empty
    collection respectively shard. The index stays `"unusable"` in this case.

    To find out what number of centroids an index has actually been trained
    with, see [Check the number of centroids of a trained index](#check-the-number-of-centroids-of-a-trained-index).
  - **defaultNProbe** (number, _optional_): How many neighboring centroids to
    consider for the search results by default. The larger the number, the slower
    the search but the better the search results. Default: `1`. You should
    generally use a higher value here or per query via the `nProbe` option of
    the vector similarity functions.
  - **trainingIterations** (number, _optional_): The number of iterations in the
    training process. Default: `25`. Smaller values lead to a faster index
    creation but may yield worse search results. 
  - **numberOfDocsPerCentroid** (number, _optional_, introduced in v3.12.10):
    How many vectors per centroid to include in the random sample used for
    training. It must be `1` or greater. Default: `100`.

    Up to v3.12.9, this is not configurable and a fixed value of `256` per
    centroid is used instead.

    The training does not use the full dataset but a sample bounded to
    `nLists` × `numberOfDocsPerCentroid` vectors. A larger value can improve the
    training quality but increases the memory and time required for training.
    See [Resource usage during index creation](#resource-usage-during-index-creation)
    for details.
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

    The number of centroids that the factory string specifies needs to match the
    `nLists` value, otherwise the training fails and the index stays
    `"unusable"`. From v3.12.10 onward, you can use a `{}` placeholder in place
    of the number to avoid this problem, like `"IVF{},SQ4"`. It is substituted
    with the number of centroids that `nLists` resolves to, per shard in cluster
    deployments:

    ```js
    db.coll.ensureIndex({
      name: "vector_l2",
      type: "vector",
      fields: ["embedding"],
      params: {
        metric: "l2",
        dimension: 544,
        factory: "IVF{}_HNSW32,SQ8"
      }
    });
    ```

    A factory string with a fixed number of centroids can be combined with the
    scaling mode of `nLists`, but only if the resolved value happens to match the
    number in the factory string.

## Resource usage during index creation

Building a vector index temporarily increases the CPU and memory usage of the
server. Knowing what happens during the build lets you anticipate how much
additional load to expect.

The index is built in two phases:

1. **Training**

   The index first learns how to partition the vector space into `nLists` groups,
   each represented by a centroid. To do so, it takes a random sample of your
   vectors and runs an iterative clustering algorithm over that sample. The full
   dataset is not loaded into memory. Instead, the number of vectors pulled into
   memory for training is bounded per group and never exceeds the number of vectors
   that actually exist. From v3.12.10 onward, this bound is `numberOfDocsPerCentroid`
   vectors per group (`100` by default and configurable), so up to
   `nLists` × `numberOfDocsPerCentroid` vectors in total. Up to v3.12.9, a fixed
   value of `256` per group is used instead.

   How the sample is picked depends on the version:

   - Up to v3.12.9, the vectors that the storage engine encounters first are used
     until the sample is full, and the remaining documents are skipped. If the
     documents are stored in a non-random order, for example because they were
     imported sorted by a label, then the sample may not be representative of the
     data as a whole, degrading the quality of the clustering.
   - From v3.12.10 onward, the sample is drawn uniformly at random from all
     vectors using reservoir sampling. Every vector has the same chance of ending
     up in the sample, independent of where it is stored. This requires reading
     all documents once, but only the sampled vectors are kept in memory, so the
     memory bound is unchanged.

   The sample is held in memory as plain 32-bit floating-point numbers, so you can
   estimate its peak memory as:

   ```
   nLists × numberOfDocsPerCentroid × dimension × 4 bytes
   ```

   For example, with `nLists` set to `1000`, the default `numberOfDocsPerCentroid`
   of `100`, and a `dimension` of `768`, the sample occupies about 290 MB. Up to
   v3.12.9, the same `nLists` and `dimension` uses `256` per group and occupies
   about 750 MB. The clustering computation needs some more memory on top of that.
   Training is CPU-bound, and a larger `nLists`, `numberOfDocsPerCentroid`, or
   `dimension` makes it take longer.

   Because the sample size does not depend on how many documents you have, the
   memory needed for training stays roughly the same whether the collection holds
   a hundred thousand or a hundred million vectors (as long as there are at least
   `nLists` × `numberOfDocsPerCentroid` of them).

   If you use the scaling mode of `nLists` (from v3.12.10 onward), then the
   number of groups is not known upfront. The estimates above apply to the
   number of centroids that `nLists` resolves to at training time. Keep the
   tiers in mind when sizing your deployment, as they define the upper bounds
   for how large the sample can get.

2. **Indexing**

   Once the centroids are known, every vector is read, assigned to its nearest
   centroid, and encoded into the index. This phase makes a full pass over all
   documents, and its cost thus grows with the number of vectors. It is
   mostly CPU-bound and also determines the final on-disk size of the index.

In short, the number of groups (`nLists`) and the vector `dimension` drive the
clustering cost, while the number of documents drives the indexing cost as well
as, from v3.12.10 onward, the cost of collecting the training sample. The index
size grows with the number of documents and the vector `dimension`, and also
depends on the encoding (the `factory` option). In cluster deployments, these
counts apply per shard, as each shard trains and builds its own index.

## Check the number of centroids of a trained index

<small>Introduced in: v3.12.10</small>

Vector indexes report the number of centroids they have actually been trained
with as `resolvedNLists`. If you set a fixed `nLists` value, it matches this
value. If you use the scaling mode of `nLists`, it is the value that has been
computed from the document count at training time.

The value is reported per shard. To retrieve it, list the indexes of the
collection with the hidden indexes included. Example using _arangosh_:

```js
db.coll.indexes(false, true);
```

The first argument is `withStats`, which only controls whether the index figures
are included and can be left disabled. In the HTTP API, this corresponds to
[`GET /_api/index`](../../../develop/http-api/indexes/_index.md#list-all-indexes-of-a-collection)
with the `withHidden` query parameter set to `true`.

Every vector index of the result has a `shards` attribute with the per-shard
`trainingState`, `error`, and `resolvedNLists`. The keys are the shard names.
Note how the two shards below resolve to a different number of centroids
because they hold a different number of documents:

```json
{
  "id": "coll/68",
  "name": "vector_l2",
  "type": "vector",
  "trainingState": "ready",
  "shards": {
    "s10042": {
      "trainingState": "ready",
      "error": "",
      "resolvedNLists": 400
    },
    "s10043": {
      "trainingState": "ready",
      "error": "",
      "resolvedNLists": 388
    }
  }
}
```

In single server deployments, the collection name is used as the key instead,
mirroring the cluster format.

The top-level `trainingState` is the least-progressed state across all shards,
with `"unusable"` being the lowest and `"ready"` the highest.

## Interfaces

### Create a vector index

{{< tabs "interfaces" >}}

{{< tab "Web interface" >}}
1. In the **Collections** section, click the name or row of the desired collection.
2. Go to the **Indexes** tab.
3. Click **Add index**.
4. Select **Vector** as the **Type**.
5. Enter the name of the attribute that holds the vector embeddings into **Field**.
6. Optionally give the index a user-defined **Name**.
7. Optionally define **Extra stored values** you want to filter on or use to cover projections.
8. Set the parameters for the vector index. See [Vector index properties](#vector-index-properties)
   under `params`. Optionally adjust the index options such as **Sparse**.
9. Click **Create**.
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
  },
  inBackground: false,
  parallelism: 1,
  sparse: false,
  storedValues: ["attr1", "attr2"]
});
```

Also see [`collection.ensureIndex()`](_index.md#creating-an-index)
in the _JavaScript API_.
{{< /tab >}}

{{< tab "cURL" >}}
```sh
curl -d '{"name":"vector_l2","type":"vector","fields":["embedding"],"params":{"metric":"l2","dimension":544,"nLists":100,"defaultNProbe":1,"trainingIterations":25},"inBackground":false,"parallelism":1,"sparse":false,"storedValues":["attr1","attr2"]}' http://localhost:8529/_db/mydb/_api/index?collection=coll
```

See the [`POST /_db/{database-name}/_api/index`](../../../develop/http-api/indexes/vector.md#create-a-vector-index)
endpoint in the _HTTP API_ for details.
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
  },
  inBackground: false,
  parallelism: 1,
  sparse: false,
  storedValues: ["attr1", "attr2"]
});
```

See [`DocumentCollection.ensureIndex()`](https://arangodb.github.io/arangojs/latest/interfaces/collections.DocumentCollection.html#ensureIndex)
in the _arangojs_ documentation for details.
{{< /tab >}}

{{< tab "Go" >}}
The Go driver supports vector indexes from v2.2.0 onward.

```go
import (
  "github.com/arangodb/go-driver/v2/arangodb"
  "github.com/arangodb/go-driver/v2/utils"
  "fmt"
)

// ...

fields := []string{ "embedding" }

params := arangodb.VectorParams{
  DefaultNProbe: utils.NewType(1),
  Dimension: utils.NewType(544),
  Metric: utils.NewType(arangodb.VectorMetricL2),
  NLists: utils.NewType(100),
  TrainingIterations: utils.NewType(25),
}

options := arangodb.CreateVectorIndexOptions{
  InBackground: utils.NewType(false),
  Name: utils.NewType("vector_l2"),
  Parallelism: utils.NewType(1),
  Sparse: utils.NewType(false),
  StoredValues: []string{ "attr1", "attr2" },
}

idx, newlyCreated, err := coll.EnsureVectorIndex(ctx, fields, &params, &options)
if err != nil {
  fmt.Println(err)
} else {
  fmt.Printf("Index %s, new: %v\n", idx.ID, newlyCreated)
}
```

See [`CollectionIndexes.EnsureVectorIndex()`](https://pkg.go.dev/github.com/arangodb/go-driver/v2/arangodb#CollectionIndexes)
in the _go-driver_ v2 documentation for details.
{{< /tab >}}

{{< tab "Java" >}}
The Java driver supports vector indexes from v7.24.0 onward.

```java
Collection<String> fields = Collections.singletonList("embedding");

VectorIndexParams params = new VectorIndexParams()
        .metric(VectorIndexParams.Metric.L2)
        .dimension(544)
        .nLists(100)
        .defaultNProbe(1)
        .trainingIterations(25);

IndexEntity idx = coll.ensureVectorIndex(fields, new VectorIndexOptions()
        .name("vector_l2")
        .params(params)
        .inBackground(false)
        .parallelism(1)
        .sparse(false)
        .storedValues("attr1", "attr2")
);
```

See [`ArangoCollection.ensureVectorIndex()`](https://www.javadoc.io/doc/com.arangodb/arangodb-java-driver/latest/com/arangodb/ArangoCollection.html#ensureVectorIndex%28java.lang.Iterable,com.arangodb.model.VectorIndexOptions%29)
in the _arangodb-java-driver_ documentation for details.
{{< /tab >}}

{{< tab "Python" >}}
```py
info = coll.add_index({
  "name": "vector_l2",
  "type": "vector",
  "fields": ["embedding"],
  "params": {
    "metric": "l2",
    "dimension": 544,
    "nLists": 100,
    "defaultNProbe": 1,
    "trainingIterations": 25
  },
  "inBackground": False,
  "parallelism": 1,
  "sparse": False,
  "storedValues": ["attr1", "attr2"]
})
```

See [`StandardCollection.add_index()`](https://docs.python-arango.com/en/main/specs.html#arango.collection.StandardCollection.add_index)
in the _python-arango_ documentation for details.
{{< /tab >}}

{{< /tabs >}}
