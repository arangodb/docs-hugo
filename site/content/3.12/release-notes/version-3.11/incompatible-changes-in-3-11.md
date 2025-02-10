---
title: Incompatible changes in ArangoDB 3.11
menuTitle: Incompatible changes in 3.11
weight: 15
description: >-
  Check the following list of potential breaking changes **before** upgrading to
  this ArangoDB version and adjust any client applications if necessary
---
## Resolving known issues with versions up to 3.11.11

Due to an issue with the versions up to 3.11.11, please read the
information below and follow the linked procedures to avoid a potential problem.
Not following these procedures can cause your deployment to become
read-only in rare cases.

**Issues that has been discovered that requires action:**

- [Issues with the comparison of large indexed numbers](#corrected-sorting-order-for-numbers-in-velocypack-indexes)

**Who should check for a potential issue:**

- Deployments on versions prior to 3.11.11
- Deployments on or previously upgraded from 3.11.11

**Deployments not impacted:**

- Deployments created with 3.11.11 or later 3.11.x version

**Overview of impact**

There is a risk of the RocksDB storage engine entering a state where no write operations are
possible anymore, should it discover index entries that are in an unexpected order.

{{< tip >}}
It is recommended to schedule a maintenance time window for taking the ArangoDB
deployment offline to perform the upgrade procedure in the safest possible manner. 
{{< /tip >}}

**Paths to resolution:**

| Current version | Resolved version | Steps to take |
|-----------------|------------------|---------------|
| 3.11.10 (or older) | 3.11.11 (or newer 3.11.x) | Create a backup, upgrade normally, then check for [affected numbers in indexes](#corrected-sorting-order-for-numbers-in-velocypack-indexes) and fix them. |
| 3.11.11 (or newer 3.11.x) | 3.12.4 (or later) | **Do not upgrade to version 3.12.0, 3.12.1, 3.12.2, or 3.12.3**. Create a backup, check for [affected numbers in indexes](#check-if-you-are-affected) and fix them (if you haven't done so already or created the deployment with 3.11.11 or later 3.11.x version), then upgrade to the latest 3.11.x version first, and finally upgrade to version 3.12.4 or later. |

{{< warning >}}
If you are a paying customer with a self-hosted deployment, contact the
ArangoDB support for direct assistance.
ArangoGraph customers do not need to take any action.
{{< /warning >}}

## Incompatibilities due to switch to glibc

From version 3.11.10 onward, ArangoDB uses the glibc C standard library
implementation instead of libmusl. Even though glibc is statically linked into
the ArangoDB server and client tool executables, it may load additional modules
at runtime that are installed on your system. Under rare circumstances, it is
possible that ArangoDB crashes when performing host name or address lookups.
This is only the case if all of the following conditions are true:

- You either use ArangoDB version 3.11.10 (non-hotfix), or you use a 3.11 version
  from 3.11.10-1 onward with the `--honor-nsswitch` startup option enabled.
- You use an ArangoDB package on bare metal (not a Docker container)
- Your operating system uses glibc (like Ubuntu, Debian, RedHat, Centos, or
  most other Linux distributions, but not Alpine for instance)
- The glibc version of your system is different than the one used by ArangoDB,
  in particular if the system glibc is older than version 2.35
- The `libnss-*` dynamic libraries are installed
- The `/etc/nsswitch.conf` configuration file contains settings other than for
  `files` and `dns` in the `hosts:` line, or the `passwd:` and `group:` lines
  contain something other than `files`

If you are affected, consider using Docker containers, `chroot`, or change
`nsswitch.conf`.

## VelocyStream protocol deprecation

ArangoDB's own bi-directional asynchronous binary protocol VelocyStream (VST) is
deprecated in v3.11 and removed in v3.12.0.

While VelocyStream support is still available in v3.11, it is highly recommended
to already switch to the HTTP(S) protocol because of better performance and
reliability. ArangoDB supports both VelocyPack and JSON over HTTP(S).

## Active Failover deployment mode deprecation

Running a single server with asynchronous replication to one or more passive
single servers for automatic failover is deprecated and will no longer be
supported in the next minor version of ArangoDB, from v3.12 onward.

## Extended naming constraints for collections, Views, and indexes

In ArangoDB 3.9, the `--database.extended-names-databases` startup option was
added to optionally allow database names to contain most UTF-8 characters.
The startup option has been renamed to `--database.extended-names` in 3.11 and
now controls whether you want to use the extended naming constraints for
database, collection, View, and index names.

The old `--database.extended-names-databases` startup option should no longer
be used, but if you do, it behaves the same as the new
`--database.extended-names` option.

The feature is disabled by default to ensure compatibility with existing client
drivers and applications that only support ASCII names according to the
traditional naming constraints used in previous ArangoDB versions.

If the feature is enabled, then any endpoints that contain database, collection,
View, or index names in the URL may contain special characters that were
previously not allowed (percent-encoded). They are also to be expected in
payloads that contain database, collection, View, or index names, as well as
document identifiers (because they are comprised of the collection name and the
document key). If client applications assemble URLs with extended names
programmatically, they need to ensure that extended names are properly
URL-encoded.

When using extended names, any Unicode characters in names need to be 
[NFC-normalized](http://unicode.org/reports/tr15/#Norm_Forms).
If you try to create a database, collection, View, or index with a non-NFC-normalized
name, the server rejects it.

The ArangoDB web interface as well as the _arangobench_, _arangodump_,
_arangoexport_, _arangoimport_, _arangorestore_, and _arangosh_ client tools
ship with support for the extended naming constraints, but they require you
to provide NFC-normalized names.

Please be aware that dumps containing extended names cannot be restored
into older versions that only support the traditional naming constraints. In a
cluster setup, it is required to use the same naming constraints for all
Coordinators and DB-Servers of the cluster. Otherwise, the startup is
refused. In DC2DC setups, it is also required to use the same naming
constraints for both datacenters to avoid incompatibilities.

Also see:
- [Collection names](../../concepts/data-structure/collections.md#collection-names)
- [View names](../../concepts/data-structure/views.md#view-names)
- Index names have the same character restrictions as collection names

## No AQL user-defined functions (UDF) in `PRUNE`

AQL user-defined functions (UDFs) cannot be used inside traversal PRUNE conditions
nor inside FILTER conditions that can be moved into the traversal execution on DB-Servers. 
This limitation also applies to single servers to keep the differences to cluster 
deployments minimal.

## Stricter validation of Unicode surrogate values in JSON data

ArangoDB 3.11 employs a stricter validation of Unicode surrogate pairs in
incoming JSON data, for all REST APIs.

In previous versions, the following loopholes existed when validating UTF-8 
surrogate pairs in incoming JSON data:

- a high surrogate, followed by something other than a low surrogate
  (or the end of the string)
- a low surrogate, not preceded by a high surrogate

These validation loopholes have been closed in 3.11, which means that any JSON
inputs containing such invalid surrogate pair data are rejected by the server.

This is normally the desired behavior, as it helps invalid data from entering
the database. However, in situations when a database is known to contain invalid
data and must continue supporting it (at least temporarily), the extended
validation can be disabled by setting the server startup option
`--server.validate-utf8-strings` to `false`. This is not recommended long-term,
but only during upgrading or data cleanup.

## Restriction of indexable fields

It is now forbidden to create indexes that cover fields whose attribute names
start or end with `:` , for example, `fields: ["value:"]`. This notation is
reserved for internal use.

Existing indexes are not affected but you cannot create new indexes with a
preceding or trailing colon.

## Write-write conflict improvements

Writes to the same document in quick succession can result in write-write
conflicts, requiring you to retry the operations. In v3.11, single document
operations via the [HTTP Interface for Documents](../../develop/http-api/documents.md) try to
avoid conflicts by locking the key of the document before performing the
modification. This serializes the write operations on the same document.
The behavior of AQL queries, Stream Transactions, and multi-document operations
remains unchanged.

It is still possible for write-write conflicts to occur, and in these cases the
reported error is now slightly different.

The lock acquisition on the key of the document that is supposed to be
inserted/modified has a hard-coded timeout of 1 second. If the lock cannot be
acquired, the error message is as follows:

```
Timeout waiting to lock key - in index primary of type primary over '_key'; conflicting key: <key>
```

The `<key>` corresponds to the document key of the write attempt. In addition,
the error object contains `_key`, `_id`, and `_rev` attributes. The `_key` and
`_id` correspond to the document of the write attempt, and `_rev` corresponds
to the current revision of the document as stored in the database (if available,
otherwise empty).

If the lock cannot be acquired on a unique index entry, the error message is as
follows:

```
Timeout waiting to lock key - in index <indexName> of type persistent over '<fields>'; document key: <key>; indexed values: [<values>]
```

The `<indexName>` is the name of the index in which the write attempt tried to
lock the entry, `<fields>` is the list of fields included in that index, `<key>`
corresponds to the document key of the write attempt, and `<values>`
corresponds to the indexed values of the document. In addition, the error object
contains `_key`, `_id`, and `_rev` attributes. The `_key` and `_id` correspond
to the document of the write attempt, and `_rev` corresponds to the current
revision of the document as stored in the database (if available, otherwise empty).

## Deprecated and removed Pregel features

- The experimental _Custom Pregel_ feature, also known as
  _programmable Pregel algorithms_ (PPA), has been removed.

- The built-in _DMID_ Pregel algorithm has been deprecated and will be removed
  in a future release.

- The `async` option for Pregel jobs has been removed. Some algorithms supported
  an asynchronous mode to run without synchronized global iterations. This is no
  longer supported.

- The `useMemoryMaps` option for Pregel jobs to use memory-mapped files as a
  backing storage for large datasets has been removed. Memory paging/swapping
  provided by the operating system is equally effective.

## New query stage

- When profiling a query (`profile` option `true`, `1`, or `2`), the `profile`
  object returned under `extra` now includes a new `"instantiating executors"`
  attribute with the time needed to create the query executors, and in cluster
  mode, this also includes the time needed for physically distributing the query
  snippets to the participating DB-Servers. Previously, the time spent for
  instantiating executors and the physical distribution was contained in the
  `optimizing plan` stage.

- The `state` of a query can now additionally be `"instantiating executors"` in
  the list of currently running queries.

## Limit for the normalization of `FILTER` conditions

Converting complex AQL `FILTER` conditions with a lot of logical branches
(`AND`, `OR`, `NOT`) into the internal DNF (disjunctive normal form) format can
take a large amount of processing time and memory. The new `maxDNFConditionMembers`
query option is a threshold for the maximum number of `OR` sub-nodes in the
internal representation and defaults to `786432`.

You can also set the threshold globally instead of per query with the
[`--query.max-dnf-condition-members` startup option](../../components/arangodb-server/options.md#--querymax-dnf-condition-members).

If the threshold is hit, the query continues with a simplified representation of
the condition, which is **not usable in index lookups**. However, this should
still be better than overusing memory or taking a very long time to compute the
DNF version.

## Validation of `smartGraphAttribute` in SmartGraphs

<small>Introduced in: v3.10.13, v3.11.7</small>

The attribute defined by the `smartGraphAttribute` graph property is not allowed to be
changed in the documents of SmartGraph vertex collections. This is now strictly enforced.
See [API Changes in ArangoDB 3.11](api-changes-in-3-11.md#validation-of-smartgraphattribute-in-smartgraphs)
for details and instructions on how to repair affected attributes.

## Validation of traversal collection restrictions

<small>Introduced in: v3.9.11, v3.10.7</small>

In AQL graph traversals, you can restrict the vertex and edge collections in the
traversal options like so:

```aql
FOR v, e, p IN 1..3 OUTBOUND 'products/123' components
  OPTIONS {
    vertexCollections: [ "bolts", "screws" ],
    edgeCollections: [ "productsToBolts", "productsToScrews" ]
  }
  RETURN v 
```

If you specify collections that don't exist, queries now fail with
a "collection or view not found" error (code `1203` and HTTP status
`404 Not Found`). In previous versions, unknown vertex collections were ignored,
and the behavior for unknown edge collections was undefined.

Additionally, the collection types are now validated. If a document collection
or View is specified in `edgeCollections`, an error is raised
(code `1218` and HTTP status `400 Bad Request`).

Furthermore, it is now an error if you specify a vertex collection that is not
part of the specified named graph (code `1926` and HTTP status `404 Not Found`).
It is also an error if you specify an edge collection that is not part of the
named graph's definition or of the list of edge collections (code `1939` and
HTTP status `400 Bad Request`).

## Batch insertions of documents with key errors no longer fail the entire operation

<small>Introduced in: v3.11.1</small>

When inserting multiple documents/edges at once in a cluster, the Document API
used to let the entire request fail if any of the documents/edges failed to be
saved due to a key error. More specifically, if the value of a `_key` attribute
contains illegal characters or if the key doesn't meet additional requirements,
for instance, coming from the collection being used in a Disjoint SmartGraph,
the `POST /_api/document/{collection}` endpoint would not reply with the usual
array of either the document metadata or the error object for each attempted
document insertion. Instead, it used to return an error object for the first
offending document only, and aborted the operation so that none of the documents
were saved. Example:

```bash
> curl -d '[{"_key":"valid"},{"_key":"invalid space"}]' http://localhost:8529/_api/document/coll
{"code":400,"error":true,"errorMessage":"illegal document key","errorNum":1221}

> curl http://localhost:8529/_api/document/coll/valid
{"code":404,"error":true,"errorMessage":"document not found","errorNum":1202}
```

Now, such key errors in cluster deployments no longer fail the entire request,
matching the behavior of single server deployments. Any errors are reported in
the result array for the respective documents, along with the successful ones:

```bash
> curl -d '[{"_key":"valid"},{"_key":"invalid space"}]' http://localhost:8529/_api/document/coll
[{"_id":"coll/valid","_key":"valid","_rev":"_gG9JHsW---"},{"error":true,"errorNum":1221,"errorMessage":"illegal document key"}]

> curl http://localhost:8529/_api/document/coll/valid
{"_key":"valid","_id":"coll/valid","_rev":"_gG9JHsW---"}
```

## Exit code adjustments

<small>Introduced in: v3.10.13, v3.11.7</small>

For some fatal errors like a required database upgrade or a failed version check,
_arangod_ set the generic exit code of `1`. It now returns a different, more
specific exit code in these cases.

## Batch-reading an empty list of documents succeeds

<small>Introduced in: v3.11.1</small>

Using the Document API for reading multiple documents used to return an error
if the request body was an empty array. Example:

```bash
> curl -XPUT -d '[]' 'http://localhost:8529/_api/document/coll?onlyget=true'
{"code":500,"error":true,"errorMessage":"internal error","errorNum":4}
```

Now, a request like this succeeds and returns an empty array as response.

## Corrected sorting order for numbers in VelocyPack indexes

<small>Introduced in: v3.11.11, v3.12.2</small>

- [Issues with the comparison of large indexed numbers](#issues-with-the-comparison-of-large-indexed-numbers)
- [Check if you are affected](#check-if-you-are-affected)
- [If the deployment is NOT affected](#if-the-deployment-is-not-affected)
- [If the deployment is affected](#if-the-deployment-is-affected)

### Issues with the comparison of large indexed numbers

If you store very large numeric values in ArangoDB – greater than/equal to
2<sup>53</sup> (9,007,199,254,740,992) or less than/equal to
-2<sup>53</sup> (-9,007,199,254,740,992) – and index them with an affected
index type, the values may not be in the correct order. This is due to how the
comparison is executed in versions before v3.11.11 and v3.12.2. If the numbers
are represented using different VelocyPack types internally, they are converted
to doubles and then compared. This conversion is lossy for integers with a very
large absolute value, resulting in an incorrect ordering of the values.

The possibly affected index types are the following that allow storing
VelocyPack data in them:
- `persistent` (including vertex-centric indexes)
- `mdi-prefixed` (but not `mdi` indexes; only available from v3.12.0 onward)
- `hash` (legacy alias for persistent indexes)
- `skiplist` (legacy alias for persistent indexes)

{{< warning >}}
The incorrect sort order in an index can lead to the RocksDB storage engine
discovering out-of-order keys and then refusing further write operations with
errors and warnings.
{{< /warning >}}

To prevent ArangoDB deployments from entering a read-only mode due to this issue,
please follow the below procedures to check if your deployment is affected and
how to correct it if necessary.

### Check if you are affected

The following procedure is recommended for every deployment unless it has been
created with v3.11.11, v3.12.2, or any later version.

1. Create a backup as a precaution. If you run the Enterprise Edition, you can
   create a Hot Backup. Otherwise, create a full dump with _arangodump_
   (including all databases and system collections).

2. If your deployment is on a 3.11.x version older than 3.11.11, upgrade to
   the latest 3.11 version that is available.

   If your deployment is on version 3.12.0 or 3.12.1, upgrade to the latest
   3.12 version that is available but be sure to also read about the string
   sorting issue in [Resolving known issues with versions 3.12.0 through 3.12.3](../version-3.12/incompatible-changes-in-3-12.md#resolving-known-issues-with-versions-3120-through-3123)
   and the linked upgrade procedures.

3. Call the `GET /_admin/cluster/vpackSortMigration/check` endpoint to let
   ArangoDB check all indexes. As it can take a while for large deployments,
   it is recommended to run this operation as an asynchronous job
   (`x-arango-async: store` header) so that you can check the result later.

   The endpoint is available for all deployment modes, not only in clusters.
   In case of a cluster, send the request to one of the Coordinators.
   Example with ArangoDB running locally on the default port:

   ```shell
   curl --dump-header - -H "x-arango-async: store" http://localhost:8529/_admin/cluster/vpackSortMigration/check
   ```

4. Inspect the response to find the job ID in the `X-Arango-Async-Id` HTTP header.
   The job ID is `12345` in the following example:

   ```
   HTTP/1.1 202 Accepted
   X-Arango-Queue-Time-Seconds: 0.000000
   Strict-Transport-Security: max-age=31536000 ; includeSubDomains
   Expires: 0
   Pragma: no-cache
   Cache-Control: no-cache, no-store, must-revalidate, pre-check=0, post-check=0, max-age=0, s-maxage=0
   Content-Security-Policy: frame-ancestors 'self'; form-action 'self';
   X-Content-Type-Options: nosniff
   X-Arango-Async-Id: 12345
   Server: ArangoDB
   Connection: Keep-Alive
   Content-Type: text/plain; charset=utf-8
   Content-Length: 0
   ```

5. Call the `PUT /_api/job/12345` endpoint, substituting `12345` with your
   actual job ID. It returns nothing if the job is still ongoing. You can repeat
   this call every once in a while to check again.

   ```shell
   curl -XPUT http://localhost:8529/_api/job/12345
   ```

6. If there are no issues with your deployment, the check result reports an
   empty list of affected indexes and an according message.
   
   ```json
   {
     "error": false,
     "code": 200,
     "result": {
       "affected": [],
       "error": false,
       "errorCode": 0,
       "errorMessage": "all good with sorting order"
     }
   }
   ```

   If this is the case, continue with
   [If the deployment is NOT affected](#if-the-deployment-is-not-affected).

   If affected indexes are found, the check result looks similar to this:

   ```json
   {
     "error": false,
     "code": 200,
     "result": {
       "affected": [
         {
           "database": "_system",
           "collection": "coll",
           "indexId": 195,
           "indexName": "idx_1806192152446763008"
         }
       ],
       "error": true,
       "errorCode": 1242,
       "errorMessage": "some indexes have legacy sorted keys"
     }
   }
   ```

   If this is the case, continue with
   [If the deployment is affected](#if-the-deployment-is-affected).

### If the deployment is NOT affected

1. Make sure that no problematic values are written to or removed from an index
   between checking for affected indexes and completing the procedure.
   To be safe, you may want to stop all writes to the database system.

2. You can perform a regular in-place upgrade and mark the deployment as correct
   using a special HTTP API endpoint in the next step.

   That is, create a backup and upgrade your deployment to the
   latest bugfix version with the same major and minor version (e.g. from 3.11.x
   to at least 3.11.11 or from 3.12.x to at least 3.12.2).
   
3. Call the `PUT /_admin/cluster/vpackSortMigration/migrate` endpoint to mark
   the deployment as having the correct sorting order. This requires
   [superuser permissions](../../develop/http-api/authentication.md#jwt-superuser-tokens)
   unless authentication is disabled.

   ```shell
   curl -H "Authorization: bearer <superuser-token>" -XPUT http://localhost:8529/_admin/cluster/vpackSortMigration/migrate
   ```

   ```json
   {
     "error": false,
     "code": 200,
     "result": {
       "error": false,
       "errorCode": 0,
       "errorMessage": "VPack sorting migration done."
     }
   }
   ```

4. For the corrected sorting order to take effect, restart the ArangODB server,
   respectively restart the DB-Servers of the cluster.

5. Complete the procedure by resuming writes to the database systems.

### If the deployment is affected

{{< info >}}
If you are a customer, please contact the ArangoDB support to assist you with
the following steps.
{{< /info >}}

1. This step depends on the deployment mode:

   - **Single server**: Create a new server. Then create a full dump with
     [arangodump](../../components/tools/arangodump/_index.md) of the old server,
     using the `--all-databases` and `--include-system-collections` startup options
     and a user account with administrate access to the `_system` database and
     at least read access to all other databases to ensure all data including
     the `_users` system collection are dumped.
     
     Restore the dump to the new single server using at least v3.11.11 or v3.12.4
     (v3.12.2 only addresses this but not [another issue](../version-3.12/incompatible-changes-in-3-12.md#corrected-sorting-order-for-strings-in-velocypack-indexes)).
     You need to use a new database directory.

   - **Active Failover**: You need to replace all servers of the deployment.
     You can do so in a rolling manner.
   
     Create a new server and add it as a new follower to the deployment.
     When it is in-sync with the leader, remove one of the old followers.
     Replace any other old followers in the same manner. Then create
     one more new server, add it as a follower, and wait until it is in-sync.
     Then remove the old leader, failing over to one of the new followers.
     You should stop all writes temporarily before and after the failover so
     that nothing is lost, as the Active Failover replication is asynchronous.

     You can also follow the single server instructions if it's acceptable to
     have downtime.

   - **Cluster**: Replace the DB-Server nodes until they all run at least
     v3.11.11 or v3.12.4 (rolling upgrade). Syncing new nodes writes the data in
     the correct order. This deployment mode and approach avoids downtimes.

     For each DB-Server, add a new DB-Server node to the cluster. Wait until all
     new DB-Servers are in sync, then clean out the old DB-Server nodes.

2. New instances using the fixed versions initialize the database directory
   with the sorting order marked as correct and also restore data from dumps
   correctly. There is no need to call the `.../vpackSortMigration/migrate`
   HTTP API endpoint like in the unaffected case.

3. If you revert to an older state with affected indexes by restoring a
   Hot Backup, you need to repeat the procedure.

## Changed JSON serialization and VelocyPack format for replication

<small>Introduced in: v3.11.12, v3.12.3</small>

While there is only one number type in JSON, the VelocyPack format that ArangoDB
uses supports different numeric data types. When converting between VelocyPack
and JSON, it was previously possible for precision loss to occur in edge cases.
This also affected creating and restoring dumps with arangodump and arangorestore.

A double (64-bit floating-point) value `1152921504606846976.0` (2<sup>60</sup>)
used to be serialized to `1152921504606847000` in JSON, which deserializes back
to `1152921504606846976` when using a double. However, the serialized value got
parsed as an unsigned integer, resulting in an incorrect value of
`1152921504606847000`.

Numbers with an absolute value greater or equal to 2<sup>53</sup> and less than
2<sup>64</sup> (which always represents an integer) are now serialized faithfully
to JSON using an integer conversion routine and then `.0` is appended (e.g.
`1152921504606846976.0`) to ensure that they get parsed back to the exact same
double value. All other values are serialized as before, e.g. small integral
values don't get `.0` appended, and they get parsed back to integers with the
same numerical value.

Moreover, replication-related APIs such as the `/_api/wal/tail` endpoint now
support the VelocyPack format. The cluster replication has been changed to use
VelocyPack instead of JSON to avoid unnecessary conversions and avoiding any
risk of deviations due to the serialization.

## JavaScript API

### Database creation

The `db._createDatabase()` method for creating a new database has changed.
If the specified database name is invalid/illegal, it now returns the error code
`1208` (`ERROR_ARANGO_ILLEGAL_NAME`). It previously returned `1229`
(`ERROR_ARANGO_DATABASE_NAME_INVALID`) in this case.
  
This is a downwards-incompatible change, but unifies the behavior for database
creation with the behavior of collection and View creation, which also return
the error code `1208` in case the specified name is not allowed.

### Index methods

Calling `collection.dropIndex(...)` or `db._dropIndex(...)` now raises an error
if the specified index does not exist or cannot be dropped (for example, because
it is a primary index or edge index). The methods previously returned `false`.
In case of success, they still return `true`.

You can wrap calls to these methods with a `try { ... }` block to catch errors,
for example, in _arangosh_ or in Foxx services.

## Startup options

### `--server.disable-authentication` and `--server.disable-authentication-unix-sockets` obsoleted

The `--server.disable-authentication` and `--server.disable-authentication-unix-sockets`
startup options are now obsolete. Specifying them is still tolerated but has
no effect anymore. These options were deprecated in v3.0 and mapped to
`--server.authentication` and `--server.authentication-unix-sockets`, which
made them do the opposite of what their names suggest.

### `--database.force-sync-properties` deprecated

The `--database.force-sync-properties` option was useful with the MMFiles
storage engine, which has been removed in v3.7. The option does not have any
useful effect if you use the RocksDB storage engine. From v3.11.0 onwards, it
has no effect at all, is deprecated, and will be removed in a future version.

### `--agency.pool-size` deprecated

The `--agency.pool-size` option was effectively not properly supported in any
version of ArangoDB. Setting the option to anything but the value of
`--agency.size` should be avoided.

From v3.11.0 onwards, this option is deprecated, and setting it to a value
different than the value of `--agency.size` leads to a startup error.

### `--query.parallelize-gather-writes` obsoleted

Parallel gather is now enabled by default and supported for most queries.
The `--query.parallelize-gather-writes` startup option has no effect anymore,
but specifying it still tolerated.

See [Features and Improvements in ArangoDB 3.11](whats-new-in-3-11.md#parallel-gather)
for details.

### `--pregel.memory-mapped-files*` obsoleted

Pregel no longer supports use memory-mapped files as a backing storage.
The following startup options have therefore been removed:

- `--pregel.memory-mapped-files`
- `--pregel.memory-mapped-files-custom-path`
- `--pregel.memory-mapped-files-location-type`

You can still specify them on startup without raising errors but they have no
effect anymore.

## Client tools

### arangoexport

The default output file type produced by arangoexport, controlled by the `--type`
startup option, has been changed from `json` to `jsonl`.
This allows for more efficient processing of the files produced by arangoexport
with other tools, such as arangoimport, by default.
