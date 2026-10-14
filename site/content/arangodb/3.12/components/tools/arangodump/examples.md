---
title: _arangodump_ Examples
menuTitle: Examples
weight: 5
description: >-
  How to create database dumps of an ArangoDB server and use encryption,
  compression, multi-threading, and other features of _arangodump_
---
## Create a dump

To create a dump of all collections of the `_system` database, run _arangodump_
with an output directory and enable the `--include-system-collections` startup
option:

```
arangodump --include-system-collections true --output-directory "dump"
```

System collections hold data that other features depend on, for example, the
definitions of named graphs in the `_graphs` collection. Without them, you
cannot fully restore such features. In the `_system` database, the system
collections also include the user accounts (`_users` collection). You can
leave out the system collections if you only want to dump your own collections,
see [Choose the collections and data to dump](#choose-the-collections-and-data-to-dump).

Without further startup options, _arangodump_ connects to the ArangoDB server at
the default endpoint `http://127.0.0.1:8529` as the `root` user and prompts you
for the password. It writes the dump into a directory named `dump`.

_arangodump_ fails if the output directory already exists. This is an
intentional security measure to prevent you from accidentally overwriting
previously dumped data. If you are sure that you want to overwrite the data in
the output directory, set the `--overwrite` startup option to `true`:

```
arangodump --include-system-collections true --output-directory "dump" --overwrite true
```

When finished, _arangodump_ prints out a summary line with some aggregate
statistics about what it did, for example:

```
Processed 43 collection(s), wrote 408173500 byte(s) into datafiles, sent 88 batch(es)
```

## Connect and authenticate

To connect to a different server or as a different user, use the following
startup options:

- `--server.endpoint <string>`: The endpoint to connect to. In a cluster,
  specify a Coordinator.
- `--server.username <string>`: The username.
- `--server.password <string>`: The password or access token. If you omit it,
  you are prompted for the password.
- `--server.jwt-token <string>`: A JWT to authenticate with instead of a username
  and password. Set it to `-` to be prompted for the token.
- `--server.jwt-secret-keyfile <string>`: A file with the JWT secret of the
  server, to authenticate with superuser rights instead of a username and password.
- `--server.authentication <bool>`: Whether to authenticate. Set it to
  `false` if authentication is disabled on the server.

For example, to dump a database from a server at a non-standard endpoint
as the `backup` user:

```
arangodump \
  --server.endpoint http://192.168.173.13:8531 \
  --server.username backup \
  --server.database mydb \
  --output-directory "dump"
```

You can specify more than one endpoint, for example, multiple Coordinators of a
cluster. _arangodump_ then distributes the connections of its threads across
the endpoints:

```
arangodump \
  --server.endpoint http://192.168.173.13:8531 \
  --server.endpoint http://192.168.173.13:8532 \
  --server.username backup \
  --all-databases true \
  --output-directory "dump-multiple"
```

The specified user needs to have access to the databases you want to dump.

From v3.12.13 onward, _arangodump_ renews JWTs automatically before they
expire, including the token it obtains for a username and password, so that
long-running dumps don't fail with an HTTP `401 Unauthorized` error.
For details about the authentication methods, how to avoid exposing
credentials in the process list, and how the token renewal works, see
[Connect to an ArangoDB server](../_index.md#connect-to-an-arangodb-server).

## Choose the databases to dump

_arangodump_ dumps the `_system` database by default. To dump a different
database, specify its [name](../../../concepts/data-structure/databases.md#database-names)
with the `--server.database` startup option:

```
arangodump --server.database mydb --output-directory "dump"
```

To dump all databases, set the `--all-databases` startup option to `true` and
don't specify `--server.database`. The user needs to have access to all
databases. _arangodump_ creates a subdirectory in the output directory for each
database:

```
arangodump --all-databases true --output-directory "dump-multiple"
```

## Choose the collections and data to dump

By default, _arangodump_ dumps both the structural information and the documents
of all non-system collections. To adjust this, use the following startup options:

- `--dump-data <bool>`: Whether to include the documents in the dump. The
  default is `true`. Set it to `false` to only dump the structural information.
- `--include-system-collections <bool>`: Whether to include system collections
  in the dump. The default is `false`. **Set it to `true` if you use named
  graphs or other features that store data in system collections and that you
  want to restore.**

For example, to only dump the structural information of all collections,
including system collections, use:

```
arangodump --dump-data false --include-system-collections true --output-directory "dump"
```

To restrict the dump to specific collections, use the `--collection` option.
You can specify it multiple times:

```
arangodump --collection myusers --collection myvalues --output-directory "dump"
```

To exclude specific collections from the dump, use the `--ignore-collection`
option instead:

```
arangodump --ignore-collection myusers --ignore-collection myvalues --output-directory "dump"
```

## Dump files

_arangodump_ saves the structural information of each collection in a file with
the name pattern `<collection-name>.structure.json`. Each structure file contains
a JSON object with these attributes:

- `parameters`: The collection properties.
- `indexes`: The collection indexes.

The document data of each collection is saved in files with the name pattern
`<collection-name>.data.json`. Each line in a data file is a document
insertion/update or deletion marker.

## Cluster Backup

The _arangodump_ tool supports sharding and can be used to backup data from a Cluster.
Simply point it to one of the _Coordinators_ and it
behaves exactly as described above, working on sharded collections
in the Cluster.

{{< warning >}}
In a cluster, _arangodump_ does not guarantee to dump a consistent snapshot
if write operations happen while the dump is in progress. It is therefore
recommended not to perform any data-modification operations on the cluster
while _arangodump_ is running, or to use [Hot Backups](../../../operations/backup-and-restore.md#hot-backups)
instead. This is in contrast to a single server, where the dump is consistent
even if write operations are ongoing, as a snapshot is taken when the dump starts.
{{< /warning >}}

As above, the output is one structure description file and one data
file per sharded collection. Note that the data in the data file is
sorted first by shards and within each shard by ascending timestamp. The
structural information of the collection contains the number of shards
and the shard keys.

Note that the version of the _arangodump_ client tool needs to match the
version of the ArangoDB server it connects to.

### Dumping collections with sharding prototypes

Collections may be created with the shard distribution identical to an existing
prototypical collection (see [`distributeShardsLike`](../../../develop/javascript-api/@arangodb/db-object.md#db_createcollection-name--properties--type--options));
i.e. shards are distributed in the very same pattern as in the prototype collection.
Such collections cannot be dumped without the referenced collection or _arangodump_
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

The size of dumps can be reduced using compression, for storing but also for the
data transfer.

### Compressed dumps on disk

You can optionally store data in a compressed format to save space on disk with
the `--compress-output` startup option. It cannot be used together with
[Encryption](#encryption).

If output compression is enabled, no `.data.json` files are written. Instead, the
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

### Compressed dumps on the wire

You can optionally let the server compress the data for the network transfer
with the `--compress-transfer` startup option. This can reduce the traffic and
thus save time and money.

The data is automatically decompressed on the client side. You can use the option
independent of the `--compress-output` option, which controls whether to store
the dump compressed or not but without affecting the transfer size.

```
arangodump --output-directory "dump" --compress-transfer --compress-output false
```

## Storage format

{{< warning >}}
Dumps in VelocyPack format is an **experimental** feature.
{{< /warning >}}

The default output format for dumps is JSON.

To achieve the best dump performance and the smallest data dumps in terms of
size, you can enable the `--dump-vpack` startup option. The resulting dump data
is then stored in the more compact but binary [VelocyPack](http://github.com/arangodb/velocypack)
format instead of the text-based JSON format. The output file size can be less
even compared to compressed JSON. It can also lead to faster dumps because there
is less data to transfer and no conversion from the server-internal VelocyPack
format to JSON is needed.

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

From v3.12.0 onward, you can make _arangodump_ write multiple output files per
collection/shard. The file splitting allows for better parallelization when
writing the results to disk, which in case of non-split files must be serialized.
You can enable it with the `--split-files` startup option. It is disabled by
default because dumps created with this option enabled cannot be restored into
previous versions of ArangoDB.
