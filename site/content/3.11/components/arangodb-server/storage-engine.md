---
title: Storage Engine
menuTitle: Storage Engine
weight: 20
description: >-
  The storage engine is responsible for persisting data on disk, holding copies
  in memory, providing indexes and caches to speed up queries
aliases:
  - ../../deploy/architecture/storage-engine
---
ArangoDB's storage engine is based on Facebook's **RocksDB** and the only
storage engine available in ArangoDB 3.7 and above. It is the bottom layer of
the database system.

## RocksDB

RocksDB is an embeddable persistent key-value store. It is a log
structure database and is optimized for fast storage.

The RocksDB engine is optimized for large data-sets and allows for a
steady insert performance even if the data-set is much larger than the
main memory. Indexes are always stored on disk but caches are used to
speed up performance. RocksDB uses document-level locks allowing for
concurrent writes. Writes do not block reads. Reads do not block writes.

### Advantages

RocksDB is a very flexible engine that can be configured for various use cases.

The main advantages of RocksDB are:

- document-level locks
- support for large data-sets
- persistent indexes

### Caveats

RocksDB allows concurrent writes. However, when touching the same document at
the same time, a write conflict is raised. It is possible to exclusively lock
collections when executing AQL. This avoids write conflicts, but also inhibits
concurrent writes.

ArangoDB uses RocksDB transactions to implement the transaction handling for
standalone AQL queries (outside of JavaScript Transactions and Stream Transactions).

RocksDB imposes a limit on the transaction size. It is optimized to handle small
transactions very efficiently, but is effectively limiting the total size of
transactions. If you have an AQL query that modifies a lot of documents, it is
necessary to commit data in-between. Transactions that get too big (in terms of
number of operations involved or the total size of data modified by the transaction)
are committed automatically. Effectively, this means that big user transactions
are split into multiple smaller RocksDB transactions that are committed individually.
The entire user transaction does not necessarily have ACID properties in this case.

The threshold values for transaction sizes can be configured globally as well as
overridden per transaction. See
[Known limitations for AQL queries](../../aql/fundamentals/limitations.md#storage-engine-properties).

### Write-ahead log

Write-ahead logging is used for data recovery after a server crash and for
replication.

ArangoDB's RocksDB storage engine stores all data-modification operation in a
write-ahead log (WAL). The WAL is sequence of append-only files containing
all the write operations that were executed on the server.
It is used to run data recovery after a server crash, and can also be used in
a replication setup when Followers need to replay the same sequence of operations as
on the Leader.

The individual RocksDB WAL files are per default about 64 MiB big.
The size is always proportionally sized to the value specified via
`--rocksdb.write-buffer-size`. The value specifies the amount of data to build
up in memory (backed by the unsorted WAL on disk) before converting it to a
sorted on-disk file.

Larger values can increase performance, especially during bulk loads.
Up to `--rocksdb.max-write-buffer-number` write buffers may be held in memory
at the same time, so you may wish to adjust this parameter to control memory
usage. A larger write buffer results in a longer recovery time the next
time the database is opened.

The RocksDB WAL only contains committed transactions. This means you never
see partial transactions in the replication log, but it also means transactions
are tracked completely in-memory. In practice this causes RocksDB transaction
sizes to be limited, for more information see the
[RocksDB Configuration](../../components/arangodb-server/options.md#rocksdb)

### Performance

RocksDB is based on a log-structured merge tree. A good introduction can be
found in:

- [www.benstopford.com/2015/02/14/log-structured-merge-trees/](http://www.benstopford.com/2015/02/14/log-structured-merge-trees/)
- [blog.acolyer.org/2014/11/26/the-log-structured-merge-tree-lsm-tree/](https://web.archive.org/web/20241108174258/https://blog.acolyer.org/2014/11/26/the-log-structured-merge-tree-lsm-tree/)

The basic idea is that data is organized in levels were each level is a factor
larger than the previous. New data resides in smaller levels while old data
is moved down to the larger levels. This allows to support high rate of inserts
over an extended period. In principle it is possible that the different levels
reside on different storage media. The smaller ones on fast SSD, the larger ones
on bigger spinning disks.

RocksDB itself provides a lot of different knobs to fine tune the storage
engine according to your use-case. ArangoDB supports the most common ones
using the options below.

Performance reports for the storage engine can be found here:

- [github.com/facebook/rocksdb/wiki/performance-benchmarks](https://github.com/facebook/rocksdb/wiki/performance-benchmarks)
- [github.com/facebook/rocksdb/wiki/RocksDB-Tuning-Guide](https://github.com/facebook/rocksdb/wiki/RocksDB-Tuning-Guide)

### Compression

RocksDB can compress the content it stores to save disk space and improve the
I/O performance at the cost of an increased CPU utilization. It is controlled
by the `--rocksdb.compression-type` startup option of the ArangoDB server.

ArangoDB has compression enabled by default using the LZ4 algorithm. It is
optimized for compressing and decompressing with a low CPU overhead instead of a
high compression ratio but can still achieve a 1:6 ratio for lexical content.
The Snappy compression algorithm has similar characteristics but is slower at
decompression.

No compression is used for the lowest levels of the RocksDB LSM tree as this
data gets rewritten into the higher levels quickly. By default, only level 2
and higher use compression. This is configurable via the
`--rocksdb.num-uncompressed-levels` startup option.

### ArangoDB options

ArangoDB has a cache for the persistent indexes in RocksDB. The total size
of this cache is controlled by the option

```
--cache.size
```

RocksDB also has a cache for the blocks stored on disk. The size of
this cache is controlled by the option

```
--rocksdb.block-cache-size
```

ArangoDB distributes the available memory equally between the two
caches by default.

ArangoDB chooses a size for the various levels in RocksDB that is
suitable for general purpose applications.

RocksDB log structured data levels have increasing size

```
MEM: --
L0:  --
L1:  -- --
L2:  -- -- -- --
...
```

New or updated Documents are first stored in memory. If this memtable
reaches the limit given by

```
--rocksdb.write-buffer-size
```

it is converted to an SST file and inserted at level 0.

The following option controls the size of each level and the depth:

```
--rocksdb.num-levels N
```

It limits the number of levels to `N`. By default, it is `7` and there is
seldom a reason to change this. A new level is only opened if there is
too much data in the previous one.

```
--rocksdb.max-bytes-for-level-base B
```

L0 holds at most `B` bytes.

```
--rocksdb.max-bytes-for-level-multiplier M
```

Each level is at most `M` times as much bytes as the previous
one. Therefore the maximum number of bytes-for-level `L` can be
calculated as follows:

```
max-bytes-for-level-base * (max-bytes-for-level-multiplier ^ (L-1))
```

Also see [Reducing the Memory Footprint of ArangoDB servers](../../operations/administration/reduce-memory-footprint.md)
and [ArangoDB Server Options](options.md#rocksdb) for descriptions of RocksDB options.
