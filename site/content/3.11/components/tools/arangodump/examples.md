---
title: _arangodump_ Examples
menuTitle: Examples
weight: 5
description: ''
---
_arangodump_ can be invoked in a command line by executing the following command:

```
arangodump --output-directory "dump"
```

This connects to an ArangoDB server and dump all non-system collections from
the default database (`_system`) into an output directory named `dump`.
Invoking _arangodump_ fails if the output directory already exists. This is
an intentional security measure to prevent you from accidentally overwriting already
dumped data. If you are positive that you want to overwrite data in the output
directory, you can use the parameter `--overwrite true` to confirm this:

```
arangodump --output-directory "dump" --overwrite true
```

_arangodump_ connects to the `_system` database by default using the default
endpoint. To override the endpoint, or specify a different user, use one of the
following startup options:

- `--server.endpoint <string>`: endpoint to connect to
- `--server.username <string>`: username
- `--server.password <string>`: password to use (omit this and you'll be prompted for the
  password)
- `--server.authentication <bool>`: whether or not to use authentication

If you want to connect to a different database or dump all databases you can additionally
use the following startup options:

- `--all-databases true`: must have access to all databases, and not specify a database.
- `--server.database <string>`: name of the database to connect to

Note that the specified user must have access to the databases.

Here's an example of dumping data from a non-standard endpoint, using a dedicated
[database name](../../../concepts/data-structure/databases.md#database-names):

```
arangodump \
  --server.endpoint tcp://192.168.173.13:8531 \
  --server.username backup \
  --server.database mydb \
  --output-directory "dump"
```

In contrast to the above call `--server.database` must not be specified when dumping
all databases using `--all-databases true`:

```
arangodump \
  --server.endpoint tcp://192.168.173.13:8531 \
  --server.username backup \
  --all-databases true \
  --output-directory "dump-multiple"
```

When finished, _arangodump_ prints out a summary line with some aggregate
statistics about what it did, e.g.:

```
Processed 43 collection(s), wrote 408173500 byte(s) into datafiles, sent 88 batch(es)
```

Also, more than one endpoint can be provided, such as:

```
arangodump \
  --server.endpoint tcp://192.168.173.13:8531 \
  --server.endpoint tcp://192.168.173.13:8532 \
  --server.username backup \
  --all-databases true \
  --output-directory "dump-multiple"
```

By default, _arangodump_ dumps both structural information and documents from all
non-system collections. To adjust this, there are the following command-line
arguments:

- `--dump-data <bool>`: set to `true` to include documents in the dump. Set to `false`
  to exclude documents. The default value is `true`.
- `--include-system-collections <bool>`: whether or not to include system collections
  in the dump. The default value is `false`. **Set to _true_ if you are using named
  graphs that you are interested in restoring.**

For example, to only dump structural information of all collections (including system
collections), use:

```
arangodump --dump-data false --include-system-collections true --output-directory "dump"
```

To restrict the dump to just specific collections, use the `--collection` option.
You can specify it multiple times if required:

```
arangodump --collection myusers --collection myvalues --output-directory "dump"
```

Structural information for a collection is saved in files with name pattern
`<collection-name>.structure.json`. Each structure file contains a JSON object
with these attributes:
- `parameters`: contains the collection properties
- `indexes`: contains the collection indexes

Document data for a collection is saved in files with name pattern
`<collection-name>.data.json`. Each line in a data file is a document insertion/update or
deletion marker, alongside with some meta data.

## Cluster Backup

The _arangodump_ tool supports sharding and can be used to backup data from a Cluster.
Simply point it to one of the _Coordinators_ and it
behaves exactly as described above, working on sharded collections
in the Cluster.

Please see the [Limitations](limitations.md).

As above, the output is one structure description file and one data
file per sharded collection. Note that the data in the data file is
sorted first by shards and within each shard by ascending timestamp. The
structural information of the collection contains the number of shards
and the shard keys.

Note that the version of the arangodump client tool needs to match the
version of the ArangoDB server it connects to.

### Dumping collections with sharding prototypes

Collections may be created with the shard distribution identical to an existing
prototypical collection (see [`distributeShardsLike`](../../../develop/javascript-api/@arangodb/db-object.md#db_createcollection-name--properties--type--options));
i.e. shards are distributed in the very same pattern as in the prototype collection.
Such collections cannot be dumped without the referenced collection or arangodump
yields an error.

```
arangodump --collection clonedCollection --output-directory "dump"

ERROR [f7ff5] {dump} An error occurred: Collection clonedCollection's shard distribution is based on that of collection prototypeCollection, which is not dumped along.
```

You need to dump the prototype collection as well:

```
arangodump --collection clonedCollection --collection prototypeCollection --output-directory "dump"

...
INFO [66c0e] {dump} Processed 2 collection(s) from 1 database(s) in 0.132990 s total time. Wrote 0 bytes into datafiles, sent 6 batch(es) in total.
```

## Encryption

{{< tag "ArangoDB Enterprise Edition" "ArangoGraph" >}}

You can encrypt dumps using an encryption keyfile, which must contain exactly 32
bytes of data (required by the AES block cipher).

The keyfile can be created by an external program, or, on Linux, by using a command
like the following:

```
dd if=/dev/random bs=1 count=32 of=yourSecretKeyFile
```

For security reasons, it is best to create these keys offline (away from your
database servers) and directly store them in your secret management
tool.

In order to create an encrypted backup, add the `--encryption.keyfile`
option when invoking _arangodump_, in addition to any other option you
are already using. The following example assumes that your secret key
is stored in ~/SECRET-KEY:

```
arangodump --collection "secret-collection" dump --encryption.keyfile ~/SECRET-KEY
```

Note that _arangodump_ does not store the key anywhere. It is the responsibility
of the user to find a safe place for the key. However, _arangodump_ stores
the used encryption method in a file named `ENCRYPTION` in the dump directory.
That way _arangorestore_ can later find out whether it is dealing with an
encrypted dump or not.

Trying to restore the encrypted dump without specifying the key fails
and _arangorestore_ reports an error:

```
arangorestore --collection "secret-collection" dump --create-collection true
...
the dump data seems to be encrypted with aes-256-ctr, but no key information was specified to decrypt the dump
it is recommended to specify either `--encryption.keyfile` or `--encryption.key-generator` when invoking arangorestore with an encrypted dump
```

It is required to use the exact same key when restoring the data. Again this is
done by providing the `--encryption.keyfile` parameter:

```
arangorestore --collection "secret-collection" dump --create-collection true --encryption.keyfile ~/SECRET-KEY
```

Using a different key leads to the backup being non-recoverable.

Note that encrypted backups can be used together with the already existing
RocksDB encryption-at-rest feature.

## Compression

`--compress-output`

Data can optionally be dumped in a compressed format to save space on disk.
The `--compress-output` option cannot be used together with [Encryption](#encryption).

If compression is enabled, no `.data.json` files are written. Instead, the
collection data gets compressed using the Gzip algorithm and for each collection
a `.data.json.gz` file is written. Metadata files such as `.structure.json` and
`.view.json` do not get compressed.

```
arangodump --output-directory "dump" --compress-output
```

Compressed dumps can be restored with _arangorestore_, which automatically
detects whether the data is compressed or not based on the file extension.

```
arangorestore --input-directory "dump"
```

## Dump output format

<small>Introduced in: v3.8.0</small>

Since its inception, _arangodump_ wrapped each dumped document into an extra
JSON envelope, such as follows:

```json
{"type":2300,"key":"test","data":{"_key":"test","_rev":..., ...}}
```

This original dump format was useful when there was the MMFiles storage engine,
which could use different `type` values in its datafiles.
However, the RocksDB storage engine only uses `"type":2300` (document) when
dumping data, so the JSON wrapper provides no further benefit except
compatibility with older versions of ArangoDB.

In case a dump taken with v3.8.0 or higher is known to never be used in older
ArangoDB versions, the JSON envelopes can be turned off. The startup option
`--envelope` controls this. The option defaults to `true`, meaning dumped
documents are wrapped in envelopes, which makes new dumps compatible with
older versions of ArangoDB.

If that is not needed, the `--envelope` option can be set to `false`.
In this case, the dump files only contain the raw documents, without any
envelopes around them:

```json
{"_key":"test","_rev":..., ...}
```

Disabling the envelopes can **reduce dump sizes** a lot, especially if documents
are small on average and the relative cost of the envelopes is high. Omitting
the envelopes can also help to **save a bit on memory usage and bandwidth** for
building up the dump results and sending them over the wire.

As a bonus, turning off the envelopes turns _arangodump_ into a fast, concurrent
JSONL exporter for one or multiple collections:

```
arangodump --collection "collection" --threads 8 --envelope false --compress-output false dump
```

The JSONL format is also supported by _arangoimport_ natively.

{{< warning >}}
Dumps created with the `--envelope false` setting cannot be restored into any
ArangoDB versions older than v3.8.0!
{{< /warning >}}

## Threads

_arangodump_ can use multiple threads for dumping database data in 
parallel. To speed up the dump of a database with multiple collections, it is
often beneficial to increase the number of _arangodump_ threads.
The number of threads can be controlled via the `--threads` option. The default
value is the maximum of `2` and the number of available CPU cores.

The `--threads` option works dynamically, its value depends on the number of
available CPU cores. If the amount of available CPU cores is less than `3`, a
threads value of `2` is used. Otherwise the value of threads is set to the
number of available CPU cores.

For example:

- If a system has 8 cores, then max(2,8) = 8, i.e. 8 threads are used.
- If it has 1 core, then max(2,1) = 2, i.e. 2 threads are used.

_arangodump_ versions prior to v3.8.0 distribute dump jobs for individual
collections to concurrent worker threads, which is optimal for dumping many
collections of approximately the same size, but does not help for dumping few
large collections or few large collections with many shards.

Since v3.8.0, _arangodump_ can also dispatch dump jobs for individual shards of
each collection, allowing higher parallelism if there are many shards to dump
but only few collections. Keep in mind that even when concurrently dumping the
data from multiple shards of the same collection in parallel, the individual
shards' results are still written into a single result file for the collection.
With a massive number of concurrent dump threads, some contention on that shared
file should be expected. Also note that when dumping the data of multiple shards
from the same collection, each thread's results are written to the result 
file in a non-deterministic order. This should not be a problem when restoring
such dump, as _arangorestore_ does not assume any order of input.
