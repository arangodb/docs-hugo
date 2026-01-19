---
title: Incompatible changes in ArangoDB OEM / Embedded
menuTitle: Incompatible changes in OEM
weight: 15
description: >-
  Check the following list of potential breaking changes **before** upgrading to
  this ArangoDB version and adjust any client applications if necessary
---
## `PERCENTILE()` AQL function inclusive of lower end 

<small>Introduced in: v3.11.14-1</small>

The `PERCENTILE()` AQL function is now inclusive on the lower end, which means
requesting the 0th percentile no longer raises a query warning. Moreover, when
using the `interpolation` method, a percentile greater than or equal to `0` now
returns the lowest number of the list where it would previously return `null`.

```aql
PERCENTILE( [1, 2, 3, 4],  0 ) // now 1 instead of null and a query warning
PERCENTILE( [1, 2, 3, 4],  0, "interpolation") // now 1 instead of null and a query warning
PERCENTILE( [1, 2, 3, 4], 10, "interpolation") // now 1 instead of null
PERCENTILE( [1, 2, 3, 4], 20, "interpolation") // 1 as before
```

## Optional elevation for GeoJSON Points

<small>Introduced in: v3.11.14-2</small>

GeoJSON Point may now have three coordinates: `[longitude, latitude, elevation]`.
However, ArangoDB does not take any elevation into account in geo-spatial
calculations.

Points with an elevation do no longer fail the validation in the `GEO_POLYGON()`
and `GEO_MULTIPOLYGON()` functions. Moreover, GeoJSON with three coordinates is
now indexed by geo indexes and thus also matched by geo-spatial queries, which
means you may find more results than before.

Also see [Geo-spatial functions in AQL](../../aql/functions/geo.md).

## Resolving known issues with versions up to 3.11.11

Due to an issue with the versions up to 3.11.11, please read the
information below and follow the linked procedures to avoid a potential problem.
Not following these procedures can cause your deployment to become
read-only in rare cases.

{{< warning >}}
If you are a paying customer with a self-hosted deployment, contact the
Arango support for direct assistance.
Arango Managed Platform (AMP) customers do not need to take any action.
{{< /warning >}}

**Issues that has been discovered that requires action:**

- [Issues with the comparison of large indexed numbers](#corrected-sorting-order-for-numbers-in-velocypack-indexes)

**Who should check for a potential issue:**

- Deployments created with a version prior to 3.11.11

**Deployments not impacted:**

- Deployments created with 3.11.11 or later 3.11.x version, including the
  OEM / Embedded version based on 3.11.14.

**Overview of impact**

There is a risk of the RocksDB storage engine entering a state where no write operations are
possible anymore, should it discover index entries that are in an unexpected order.

This can occur at any time, even if a previous check reported no affected indexes,
as there is no protection against storing and indexing data that may cause issues.
To prevent RocksDB from becoming read-only at some point in the future, it is
essential to follow the linked procedures.

{{< tip >}}
It is recommended to schedule a maintenance time window for taking the ArangoDB
deployment offline to perform the upgrade procedure in the safest possible manner. 
{{< /tip >}}

**Paths to resolution:**

| Current version | Resolved version | Steps to take |
|-----------------|------------------|---------------|
| 3.11.10 (or older) | 3.11.11 (or newer 3.11.x, including OEM / Embedded) | Create a backup, upgrade normally (following the standard [Upgrade path](../../operations/upgrading/_index.md#upgrade-paths) all the way to the latest 3.11.x version), then check for [affected numbers in indexes](#corrected-sorting-order-for-numbers-in-velocypack-indexes) and fix them. |
| 3.11.11 (or newer 3.11.x) | 3.12.4 (or newer) | **Do not upgrade to version 3.12.0, 3.12.1, 3.12.2, or 3.12.3**. Create a backup, check for [affected numbers in indexes](#corrected-sorting-order-for-numbers-in-velocypack-indexes) and fix them (if you haven't done so already or created the deployment with 3.11.11 or a later 3.11.x version), then upgrade to the latest 3.11.x version first, and finally upgrade to version 3.12.4 or later. |

## Datacenter-to-Datacenter Replication (DC2DC) removed

The _Datacenter-to-Datacenter Replication_ (DC2DC) for clusters including the
_arangosync_ tool is no longer supported from v3.12 onward.

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
   sorting issue in [Resolving known issues with versions prior to 3.12.4](../../../3.12/release-notes/version-3.12/incompatible-changes-in-3-12.md#resolving-known-issues-with-versions-prior-to-3124)
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

4. For the corrected sorting order to take effect, restart the ArangoDB server,
   respectively restart the DB-Servers of the cluster.

5. Complete the procedure by resuming writes to the database systems.

### If the deployment is affected

{{< info >}}
If you are a customer, please contact the Arango support to assist you with
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
     (v3.12.2 only addresses this but not [another issue](../../../3.12/release-notes/version-3.12/incompatible-changes-in-3-12.md#corrected-sorting-order-for-strings-in-velocypack-indexes)).
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
