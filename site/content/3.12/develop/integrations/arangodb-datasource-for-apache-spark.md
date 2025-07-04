---
title: ArangoDB Datasource for Apache Spark
menuTitle: Datasource for Apache Spark
weight: 10
description: >-
  ArangoDB Datasource for Apache Spark allows batch reading and writing Spark DataFrame data
aliases:
- arangodb-spark-connector
- arangodb-spark-connector/getting-started
- arangodb-spark-connector/reference
- arangodb-spark-connector/reference/java
- arangodb-spark-connector/reference/scala
---
ArangoDB Datasource for Apache Spark allows batch reading and writing Spark DataFrame data from and to ArangoDB, by implementing the Spark Data Source V2 API.

Reading tasks are parallelized according to the number of shards of the related ArangoDB collection, and the writing ones - depending on the source DataFrame partitions. The network traffic is load balanced across the available DB Coordinators.

Filter predicates and column selections are pushed down to the DB by dynamically generating AQL queries, which will fetch only the strictly required data, thus saving network and computational resources both on the Spark and the DB side.

The connector is usable from all the Spark supported client languages: Scala, Python, Java, and R.

This library works with all the non-EOLed [ArangoDB versions](https://www.arangodb.com/subscriptions/end-of-life-notice/).

## Supported versions

There are several variants of this library, each one compatible with different Spark and Scala versions:

- `com.arangodb:arangodb-spark-datasource-3.3_2.12` (Spark 3.3, Scala 2.12)
- `com.arangodb:arangodb-spark-datasource-3.3_2.13` (Spark 3.3, Scala 2.13)
- `com.arangodb:arangodb-spark-datasource-3.4_2.12` (Spark 3.4, Scala 2.12) (compatible with Spark `3.4.2+`)
- `com.arangodb:arangodb-spark-datasource-3.4_2.13` (Spark 3.4, Scala 2.13) (compatible with Spark `3.4.2+`)
- `com.arangodb:arangodb-spark-datasource-3.5_2.12` (Spark 3.5, Scala 2.12)
- `com.arangodb:arangodb-spark-datasource-3.5_2.13` (Spark 3.5, Scala 2.13)

The following variants are no longer supported:

- `com.arangodb:arangodb-spark-datasource-2.4_2.11` (Spark 2.4, Scala 2.11)
- `com.arangodb:arangodb-spark-datasource-2.4_2.12` (Spark 2.4, Scala 2.12)
- `com.arangodb:arangodb-spark-datasource-3.1_2.12` (Spark 3.1, Scala 2.12)
- `com.arangodb:arangodb-spark-datasource-3.2_2.12` (Spark 3.2, Scala 2.12)
- `com.arangodb:arangodb-spark-datasource-3.2_2.13` (Spark 3.2, Scala 2.13)

Since version `1.7.0`, due to [breaking changes](https://github.com/apache/spark/commit/ad29290a02fb94a958fd21e301100338c9f5b82a#diff-b25c8acff88c1b4850c6642e80845aac4fb882c664795c3b0aa058e37ed732a0L42-R52)
in Spark `3.4.2`, `arangodb-spark-datasource-3.4` is not compatible anymore with Spark versions `3.4.0` and `3.4.1`.

In the following sections the `${sparkVersion}` and `${scalaVersion}` placeholders refer to the Spark and Scala versions.

## Setup

To import ArangoDB Datasource for Apache Spark in a Maven project:

```xml
  <dependencies>
    <dependency>
      <groupId>com.arangodb</groupId>
      <artifactId>arangodb-spark-datasource-${sparkVersion}_${scalaVersion}</artifactId>
      <version>x.y.z</version>
    </dependency>
  </dependencies>
```

Substitute `x.y.z` with the latest available version that is compatible.

To use in an external Spark cluster, submit your application with the following parameter:

```sh
--packages="com.arangodb:arangodb-spark-datasource-${sparkVersion}_${scalaVersion}:x.y.z"
```

## General Configuration

- `user`: db user, `root` by default
- `password`: db password
- `endpoints`: list of Coordinators, e.g. `c1:8529,c2:8529` (required)
- `acquireHostList`: acquire the list of all known hosts in the cluster (`true` or `false`), `false` by default
- `protocol`: communication protocol (`vst`, `http`, or `http2`), `http2` by default
- `contentType`: content type for driver communication (`json` or `vpack`), `json` by default
- `timeout`: driver connect and request timeout in ms, `300000` by default
- `ssl.enabled`: ssl secured driver connection (`true` or `false`), `false` by default
- `ssl.verifyHost`: whether TLS hostname verification is enabled, `true` by default
- `ssl.cert.value`: Base64 encoded certificate
- `ssl.cert.type`: certificate type, `X.509` by default
- `ssl.cert.alias`: certificate alias name, `arangodb` by default
- `ssl.algorithm`: trust manager algorithm, `SunX509` by default
- `ssl.keystore.type`: keystore type, `jks` by default
- `ssl.protocol`: SSLContext protocol, `TLS` by default
- `ssl.trustStore.path`: trust store path
- `ssl.trustStore.password`: trust store password

### SSL

To use TLS-secured connections to ArangoDB, set `ssl.enabled` to `true` and
configure the certificate to use. This can be achieved in one of the following ways:

- Provide the Base64-encoded certificate as the `ssl.cert.value` configuration entry:

  ```scala
  val spark: SparkSession = SparkSession.builder()
    // ...
    .config("ssl.enabled", "true")
    .config("ssl.cert.value", "<Base64-encoded certificate>")
    .getOrCreate()
  ```

- Set the trust store to use in the `ssl.trustStore.path` configuration entry and
  optionally set `ssl.trustStore.password`:

  ```scala
  val spark: SparkSession = SparkSession.builder()
    // ...
    .config("ssl.enabled", "true")
    .config("ssl.trustStore.path", "<trustStore path>")
    .config("ssl.trustStore.password", "<trustStore password>")
    .getOrCreate()
  ```

- Start the Spark driver and workers with a properly configured trust store:

  ```scala
  val spark: SparkSession = SparkSession.builder()
    // ...
    .config("ssl.enabled", "true")
    .getOrCreate()
  ```

  Set the following in the Spark configuration file:

  ```properties
  spark.executor.extraJavaOptions=-Djavax.net.ssl.trustStore=<trustStore path> -Djavax.net.ssl.trustStorePassword=<trustStore password> 
  spark.driver.extraJavaOptions=-Djavax.net.ssl.trustStore=<trustStore path> -Djavax.net.ssl.trustStorePassword=<trustStore password>
  ```

  Alternatively, you can set this in the command-line when submitting the Spark job:

  ```sh
  ./bin/spark-submit \
    --conf "spark.driver.extraJavaOptions=-Djavax.net.ssl.trustStore=<trustStore path> -Djavax.net.ssl.trustStorePassword=<trustStore password>" \
    --conf "spark.executor.extraJavaOptions=-Djavax.net.ssl.trustStore=<trustStore path> -Djavax.net.ssl.trustStorePassword=<trustStore password>" \
    ...
  ```

### Supported deployment topologies

The connector can work with a single server and cluster deployments of ArangoDB.

## Batch Read

The connector implements support for batch reading from an ArangoDB collection. 

```scala
val df: DataFrame = spark.read
  .format("com.arangodb.spark")
  .options(options) // Map[String, String]
  .schema(schema) // StructType
  .load()
```

The connector can read data from:
- a collection
- an AQL cursor (query specified by the user)

When reading data from a **collection**, the reading job is split into many Spark tasks, one for each shard in the ArangoDB source collection. The resulting Spark DataFrame has the same number of partitions as the number of shards in the ArangoDB collection, each one containing data from the respective collection shard. The reading tasks consist of AQL queries that are load balanced across all the available ArangoDB Coordinators. Each query is related to only one shard, therefore it will be executed locally in the DB-Server holding the related shard.

When reading data from an **AQL cursor**, the reading job cannot be partitioned or parallelized, so it will be less scalable. This mode can be used for reading data coming from different tables, i.e. resulting from an AQL traversal query.

**Example**

```scala
val spark: SparkSession = SparkSession.builder()
  .appName("ArangoDBSparkDemo")
  .master("local[*]")
  .config("spark.driver.host", "127.0.0.1")
  .getOrCreate()

val df: DataFrame = spark.read
  .format("com.arangodb.spark")
  .options(Map(
    "password" -> "test",
    "endpoints" -> "c1:8529,c2:8529,c3:8529",
    "table" -> "users"
  ))
  .schema(new StructType(
    Array(
      StructField("likes", ArrayType(StringType, containsNull = false)),
      StructField("birthday", DateType, nullable = true),
      StructField("gender", StringType, nullable = false),
      StructField("name", StructType(
        Array(
          StructField("first", StringType, nullable = true),
          StructField("last", StringType, nullable = false)
        )
      ), nullable = true)
    )
  ))
  .load()

usersDF.filter(col("birthday") === "1982-12-15").show()
```

### Read Configuration

- `database`: database name, `_system` by default
- `table`: datasource ArangoDB collection name, ignored if `query` is specified. Either `table` or `query` is required.
- `query`: custom AQL read query. If set, `table` will be ignored. Either `table` or `query` is required.
- `batchSize`: reading batch size, `10000` by default
- `sampleSize`: sample size prefetched for schema inference, only used if read schema is not provided, `1000` by default
- `fillBlockCache`: specifies whether the query should store the data it reads in the RocksDB block cache (`true` or `false`), `false` by default
- `stream`: specifies whether the query should be executed lazily, `true` by default
- `ttl`: cursor time to live in seconds, `30` by default
- `mode`: allows setting a mode for dealing with corrupt records during parsing:
  - `PERMISSIVE` : win case of a corrupted record, the malformed string is put into a field configured by 
    `columnNameOfCorruptRecord`, and sets malformed fields to null. To keep corrupt records, a user can set a string 
    type field named `columnNameOfCorruptRecord` in a user-defined schema. If a schema does not have the field, it drops 
    corrupt records during parsing. When inferring a schema, it implicitly adds the `columnNameOfCorruptRecord` field in
    an output schema
  - `DROPMALFORMED`: ignores the whole corrupted records
  - `FAILFAST`: throws an exception in case of corrupted records
- `columnNameOfCorruptRecord`: allows renaming the new field having malformed string created by the `PERMISSIVE` mode

### Predicate and Projection Pushdown

The connector can convert some Spark SQL filter predicates into AQL predicates and push their execution down to the data source. In this way, ArangoDB can apply the filters and return only the matching documents.

The following filter predicates (implementations of `org.apache.spark.sql.sources.Filter`) are pushed down:
- `And`
- `Or`
- `Not`
- `EqualTo`
- `EqualNullSafe`
- `IsNull`
- `IsNotNull`
- `GreaterThan`
- `GreaterThanOrEqualFilter`
- `LessThan`
- `LessThanOrEqualFilter`
- `StringStartsWithFilter`
- `StringEndsWithFilter`
- `StringContainsFilter`
- `InFilter`

Furthermore, the connector will push down the subset of columns required by the Spark query, so that only the relevant documents fields will be returned.

Predicate and projection pushdowns are only performed while reading an ArangoDB collection (set by the `table` configuration parameter). In case of a batch read from a custom query (set by the `query` configuration parameter), no pushdown optimizations are performed.

### Read Resiliency

The data of each partition is read using an AQL cursor. If any error occurs, the read task of the related partition will fail. Depending on the Spark configuration, the task could be retried.

## Batch Write

The connector implements support for batch writing to ArangoDB collection.

```scala
import org.apache.spark.sql.DataFrame

val df: DataFrame = //...
df.write
  .format("com.arangodb.spark")
  .mode(SaveMode.Append)
  .options(Map(
    "password" -> "test",
    "endpoints" -> "c1:8529,c2:8529,c3:8529",
    "table" -> "users"
  ))
  .save()
```

Write tasks are load balanced across the available ArangoDB Coordinators. The data saved into the ArangoDB is sharded according to the related target collection definition and is different from the Spark DataFrame partitioning.

### SaveMode

On writing, `org.apache.spark.sql.SaveMode` is used to specify the expected behavior in case the target collection already exists.

The following save modes are supported:
- `Append`: the target collection is created, if it does not exist.
- `Overwrite`: the target collection is created, if it does not exist, otherwise it is truncated. Use it in combination with the
  `confirmTruncate` write configuration parameter.

Save modes `ErrorIfExists` and `Ignore` behave the same as `Append`.

Use the `overwriteMode` write configuration parameter to specify the document overwrite behavior (if a document with the same `_key` already exists).

### Write Configuration

- `database`: database name, `_system` by default
- `table`: target ArangoDB collection name (required)
- `batchSize`: writing batch size, `10000` by default
- `byteBatchSize`: byte batch size threshold, only considered for `contentType=json`, `8388608` by default (8 MB)
- `table.shards`: number of shards of the created collection (in case of the `Append` or `Overwrite` SaveMode)
- `table.type`: type (`document` or `edge`) of the created collection (in case of the `Append` or `Overwrite` SaveMode), `document` by default
- `waitForSync`: specifies whether to wait until the documents have been synced to disk (`true` or `false`), `false` by default
- `confirmTruncate`: confirms to truncate table when using the `Overwrite` SaveMode, `false` by default
- `overwriteMode`: configures the behavior in case a document with the specified `_key` value already exists. It is only considered for `Append` SaveMode.
  - `ignore` (default for SaveMode other than `Append`): it will not be written
  - `replace`: it will be overwritten with the specified document value
  - `update`: it will be patched (partially updated) with the specified document value. The overwrite mode can be 
    further controlled via the `keepNull` and `mergeObjects` parameter. `keepNull` will also be automatically set to
    `true`, so that null values are kept in the saved documents and not used to remove existing document fields (as for
    default ArangoDB upsert behavior).
  - `conflict` (default for the `Append` SaveMode): return a unique constraint violation error so that the insert operation fails
- `mergeObjects`: in case `overwriteMode` is set to `update`, controls whether objects (not arrays) will be merged.
  - `true` (default): objects will be merged
  - `false`: existing document fields will be overwritten
- `keepNull`: in case `overwriteMode` is set to `update`
  - `true` (default): `null` values are saved within the document (by default)
  - `false`: `null` values are used to delete the corresponding existing attributes
- `retry.maxAttempts`: max attempts for retrying write requests in case they are idempotent, `10` by default
- `retry.minDelay`: min delay in ms between write requests retries, `0` by default
- `retry.maxDelay`: max delay in ms between write requests retries, `0` by default

### Write Resiliency

The data of each partition is saved in batches using the ArangoDB API for
[inserting multiple documents](../http-api/documents.md#multiple-document-operations).
This operation is not atomic, therefore some documents could be successfully written to the database, while others could fail. To make the job more resilient to temporary errors (i.e. connectivity problems), in case of failure the request will be retried (with another Coordinator), if the provided configuration allows idempotent requests, namely: 
- the schema of the dataframe has a **not nullable** `_key` field and
- `overwriteMode` is set to one of the following values:
  - `replace`
  - `ignore`
  - `update` with `keep.null=true`

A failing batch-saving request is retried once for every Coordinator. After that, if still failing, the write task for the related partition is aborted. According to the Spark configuration, the task can be retried and rescheduled on a different executor, if the provided write configuration allows idempotent requests (as described above).

If a task ultimately fails and is aborted, the entire write job will be aborted as well. Depending on the `SaveMode` configuration, the following cleanup operations will be performed:
- `Append`: no cleanup is performed and the underlying data source may require manual cleanup. 
  `DataWriteAbortException` is thrown.
- `Overwrite`: the target collection will be truncated.
- `ErrorIfExists`: the target collection will be dropped.
- `Ignore`: if the collection did not exist before, it will be dropped; otherwise, nothing will be done.

### Write requirements

When writing to an edge collection (`table.type=edge`), the schema of the Dataframe being written must have:
- a non nullable string field named `_from`, and
- a non nullable string field named `_to`

### Write Limitations

- Batch writes are not performed atomically, so sometimes (i.e. in case of `overwrite.mode: conflict`) several documents in the batch may be written and others may return an exception (i.e. due to a conflicting key). 
- Writing records with the `_key` attribute is only allowed on collections sharded by `_key`. 
- In case of the `Append` save mode, failed jobs cannot be rolled back and the underlying data source may require manual cleanup.
- Speculative execution of tasks only works for idempotent write configurations. See [Write Resiliency](#write-resiliency) for more details.
- Speculative execution of tasks can cause concurrent writes to the same documents, resulting in write-write conflicts or lock timeouts

## Mapping Configuration

Serialization and deserialization of Spark Dataframe Row to and from JSON (or Velocypack) can be customized using the following options:
- `ignoreNullFields`: whether to ignore null fields during serialization, `false` by default (only supported in Spark 3.x)

## Supported Spark data types

The following Spark SQL data types (subtypes of `org.apache.spark.sql.types.Filter`) are supported for reading, writing and filter pushdown.

- Numeric types:
  - `ByteType`
  - `ShortType`
  - `IntegerType`
  - `LongType`
  - `FloatType`
  - `DoubleType`

- String types:
  - `StringType`

- Boolean types:
  - `BooleanType`

- Datetime types:
  - `TimestampType`
  - `DateType`

- Complex types:
  - `ArrayType`
  - `MapType` (only with key type `StringType`)
  - `StructType`

## Connect to the ArangoGraph Insights Platform

To connect to SSL secured deployments using X.509 Base64 encoded CA certificate (ArangoGraph):

```scala
val options = Map(
  "database" -> "<dbname>",
  "user" -> "<username>",
  "password" -> "<passwd>",
  "endpoints" -> "<endpoint>:<port>",
  "ssl.cert.value" -> "<base64 encoded CA certificate>",
  "ssl.enabled" -> "true",
  "table" -> "<table>"
)

// read
val myDF = spark.read
        .format("com.arangodb.spark")
        .options(options)
        .load()

// write
import org.apache.spark.sql.DataFrame
val df: DataFrame = //...
df.write
          .format("com.arangodb.spark")
          .options(options)
          .save()
```

## Current limitations

- For `contentType=vpack`, implicit deserialization casts don't work well, i.e.
  reading a document having a field with a numeric value whereas the related
  read schema requires a string value for such a field.
- Dates and timestamps fields are interpreted to be in a UTC time zone.
- In read jobs using `stream=true` (default), possible AQL warnings are only
  logged at the end of each read task (BTS-671).
- Spark SQL `DecimalType` fields are not supported in write jobs when using `contentType=json`.
- Spark SQL `DecimalType` values are written to the database as strings.
- `byteBatchSize` is only considered for `contentType=json` (DE-226)

## Demo

Check out our [demo](https://github.com/arangodb/arangodb-spark-datasource/tree/main/demo)
to learn more about ArangoDB Datasource for Apache Spark.
