---
title: HTTP API versioning
menuTitle: API versioning
weight: 7
description: >-
  The HTTP API has its own version, independent of the ArangoDB release, so
  that you can upgrade the server without breaking your clients
---
The HTTP API of ArangoDB has a version of its own that is independent of the
version of the ArangoDB server. The API version tells you whether a server
upgrade can break your client code:

- **Server upgrades and API changes are separate**: As long as a later
  ArangoDB release serves the same major API version as the release you upgrade
  from, everything that worked before the upgrade continues to work after it.
  This applies even across major ArangoDB releases.
- **Breaking changes are opt-in**: Incompatible API changes are only made in a
  new major API version, which you need to request explicitly in the URL. You
  can adopt it at your own pace, for individual endpoints if you like, while
  the rest of your code keeps using the previous API version.
- **You can test an upgrade before you do it**: ArangoDB 3.12 serves the API of
  the next major ArangoDB version in addition to its own API, so that you can
  check whether your client code works with it before you upgrade.

## API versions in ArangoDB 3.12

ArangoDB 3.12 serves the following API versions:

- **`v0`**: The API of ArangoDB 3.12 and earlier versions. It is the default
  API version of ArangoDB 3.12.
- **`v1`** (from v3.12.15 onward): The API of ArangoDB 4.x. It is the same as
  `v0` except for the endpoints that have been removed in ArangoDB 4.x and
  some behavior changes, see
  [Differences between `v0` and `v1`](#differences-between-v0-and-v1).
  ArangoDB 4.x only serves `v1`.
- **`experimental`**: The experimental endpoints (from v3.12.8 onward), see
  [Experimental API](#experimental-api).

{{< comment >}}
TODO: If the vMAJOR.MINOR-BRANCH format lands in 3.12 (e.g. v1.0-3), describe
it here, including the minor versions, the branch tag, and the
x-arango-api-version request/response header (see the 4.x version of this page).
{{< /comment >}}

## Compatibility guarantees

If you upgrade to a later ArangoDB release that serves the same major API
version, your client code continues to work. ArangoDB only makes the following
kinds of changes within a major API version, which existing clients can
safely ignore:

- Adding an endpoint
- Adding an optional attribute to a request body
- Adding an optional query parameter or an optional `x-arango-*` HTTP header
- Adding an optional attribute to a response body
- Adding a new possible value for an attribute of a request body

The following changes are considered breaking and are only made in a new major
API version:

- Removing an endpoint
- Removing a request body attribute, query parameter, or `x-arango-*` header,
  or changing its data type or meaning
- Adding a required request body attribute, query parameter, or header, or
  making an optional one required
- Removing a response attribute that is always present or making it optional,
  or changing the data type or meaning of a response attribute
- Adding a new possible value for an attribute of a response body
- Making the validation of the input stricter
- Changing the authentication or permission requirements

The guarantee applies to upgrades only. If you downgrade to an earlier release,
features that were added in the meantime are not available.

To benefit from the guarantee, your client code needs to tolerate additions:

- Ignore unknown attributes in response bodies.
- Ignore unknown HTTP headers in responses, including ones that start with
  `x-arango-`.

## Select an API version

### The `/_arango/{api-version}` prefix

You select the API version with a prefix in the URL path. It always comes
first, before the database (`/_db/{database-name}`) and the rest of the
endpoint path:

```
GET /_arango/v1/_db/mydb/_api/document/coll/docKey
```

The prefix is optional. If you omit it, the request uses the default API
version, which is `v0` in ArangoDB 3.12. The following requests are thus
equivalent:

```
GET /_arango/v0/_db/mydb/_api/document/coll/docKey
GET /_db/mydb/_api/document/coll/docKey
```

If you specify an API version that the server doesn't support, like
`/_arango/v2`, the server responds with an HTTP `404 Not Found` error that
lists the valid prefixes:

```json
{
  "code": 404,
  "error": true,
  "errorMessage": "invalid API version in path '/_arango/v2/_api/version', valid prefixes are: /_arango/v0, /_arango/v1, /_arango/experimental",
  "errorNum": 404
}
```

A prefix in a different position, like in `/_db/mydb/_arango/v1/_api/version`,
is not recognized and the request fails with an HTTP `404 Not Found` error.

### Experimental API

The `/_arango/experimental` prefix gives you access to experimental endpoints.
These endpoints are not covered by any compatibility guarantees. They can
change or be removed in any ArangoDB release, including patch releases. Use
them for testing and development only.

The experimental API only contains the experimental endpoints and none of the
endpoints of the regular API versions. The documentation marks experimental
endpoints with _(experimental)_ in their headline and shows the
`/_arango/experimental` prefix in their paths, like for the
[activities API](monitoring/activities.md).

## API versions in this documentation

The endpoint descriptions in the documentation show the paths without a prefix,
which means they use the default API version `v0`. You can call the same
endpoints with the `/_arango/v1` prefix, with the following exceptions:

- If an endpoint behaves differently in `v1`, the documentation has a tab for
  each API version, like for
  [creating a document](documents.md#create-a-document). The `v1` tab shows the
  path with the `/_arango/v1` prefix.
- Some general behavior changes apply to many endpoints and are not described
  per endpoint, see [Differences between `v0` and `v1`](#differences-between-v0-and-v1).
- Endpoints that are not available in `v1` are marked with the following tag
  below their headline:

  {{< tag "API v0 only" >}}

  They are also listed in
  [Endpoints not available in `v1`](#endpoints-not-available-in-v1).

## Differences between `v0` and `v1`

### Endpoints with different behavior

The following endpoints have tabs for `v0` and `v1` because their behavior
differs between the API versions:

- [Get the server version](administration.md#get-the-server-version)
- [Get the storage engine type](administration.md#get-the-storage-engine-type)
- [Get server status information](administration.md#get-server-status-information)
- [Get the cluster health](cluster.md#get-the-cluster-health)
- [Compact a collection](collections.md#compact-a-collection)
- [Get information about the current database](databases.md#get-information-about-the-current-database)
- [Create a document](documents.md#create-a-document)
- [Create multiple documents](documents.md#create-multiple-documents)
- [Clear the AQL query results cache](queries/aql-query-results-cache.md#clear-the-aql-query-results-cache)
- [Set the AQL query results cache configuration](queries/aql-query-results-cache.md#set-the-aql-query-results-cache-configuration)
- [Get the cluster collections and indexes](replication/replication-dump.md#get-the-cluster-collections-and-indexes)

### Error responses for denied access

The HTTP status codes and error numbers of some error responses for
insufficient permissions are different in `v1`:

- If the user account you authenticate with has no access to the database you
  specify in the URL (`/_db/{database-name}/...`), requests fail with an
  HTTP `403 Forbidden` error in `v1` instead of an HTTP `401 Unauthorized`
  error. The error number is `ERROR_FORBIDDEN` (`11`) in both cases but the
  error message is more detailed in `v1`.

  In `v1`, an HTTP `401 Unauthorized` error only indicates a problem with the
  authentication, for example, wrong credentials, an inactive user account,
  or a database that doesn't exist if the user account has no default access
  to it (so that it isn't revealed whether the database exists).

- If a request requires administrative permissions or you try to read the
  data of another user account but you lack the permission, the request fails
  with an HTTP `403 Forbidden` error in both API versions, but the error number
  is `ERROR_FORBIDDEN` (`11`) in `v1` instead of `ERROR_HTTP_FORBIDDEN` (`403`).
  Requests that require a superuser JWT still report the error number `403`.

- Creating a graph with insufficient permissions reports the error number
  `ERROR_FORBIDDEN` (`11`) in `v1` instead of `ERROR_ARANGO_READ_ONLY` (`1004`).

- Dropping a collection that you only have `ro` access to reports the error
  number `ERROR_ARANGO_READ_ONLY` (`1004`) in `v1` instead of
  `ERROR_FORBIDDEN` (`11`).

### Collections and Views cannot be referenced by ID

In `v1`, you cannot reference a collection by its numeric ID instead of its
name, like `/_api/collection/357` or `/_api/document/357/docKey`. Such requests
fail with an HTTP `400 Bad Request` error and the error number `400`
(`ERROR_HTTP_BAD_PARAMETER`). Specifying a numeric collection ID in the
`collection` query parameter of the `/_api/index` endpoints fails with
an HTTP `400 Bad Request` error and the error number `10` (`ERROR_BAD_PARAMETER`).

You also cannot modify, rename, or drop a View by referencing it via its
numeric ID in `v1`, like `DELETE /_api/view/468`. Such requests fail with
an HTTP `403 Forbidden` error and the error number `11` (`ERROR_FORBIDDEN`).

Reference collections and Views by their names instead.

### Endpoints not available in `v1`

The following endpoints are only available in `v0` because they have been
removed in ArangoDB 4.x. Requests to these endpoints with the `/_arango/v1`
prefix fail, mostly with an HTTP `404 Not Found` error. Exceptions are
`GET /_admin/log` (HTTP `410 Gone`), `PUT /_api/cursor/{cursor-identifier}`
(HTTP `405 Method Not Allowed`), and `GET /_admin/cluster/statistics`
(HTTP `400 Bad Request`).

- [Foxx microservices](../foxx-microservices/_index.md), including the
  [Foxx HTTP API](foxx.md) (`/_api/foxx*`) and the routes of the services
- [JavaScript Transactions](transactions/javascript-transactions.md#execute-a-javascript-transaction)
  (`POST /_api/transaction`)
- [User-defined AQL functions](queries/user-defined-aql-functions.md)
  (`/_api/aqlfunction*`)
- [Tasks](tasks.md) (`/_api/tasks*`)
- [Batch requests](batch-requests.md#execute-a-batch-request) (`POST /_api/batch`)
- [Get the statistics](monitoring/statistics.md#get-the-statistics)
  (`GET /_admin/statistics`) and
  [get the statistics description](monitoring/statistics.md#get-the-statistics-description)
  (`GET /_admin/statistics-description`)
- [Get the statistics of a DB-Server](cluster.md#get-the-statistics-of-a-db-server)
  (`GET /_admin/cluster/statistics`)
- [Get the global server logs](monitoring/logs.md#get-the-global-server-logs-deprecated)
  (`GET /_admin/log`)
- [Get the metrics](monitoring/metrics.md#get-the-metrics-deprecated)
  (`GET /_admin/metrics/v2`)
- [Read the next batch from a cursor](queries/aql-queries.md#read-the-next-batch-from-a-cursor-deprecated)
  via `PUT /_api/cursor/{cursor-identifier}`
- [Load a collection](collections.md#load-a-collection) and
  [unload a collection](collections.md#unload-a-collection)
  (`PUT /_api/collection/{collection-name}/load` and `.../unload`)
- [Get the required database version](administration.md#get-the-required-database-version-deprecated)
  (`GET /_admin/database/target-version`)
- [Reload the routing table](administration.md#reload-the-routing-table)
  (`POST /_admin/routing/reload`)
- [Echo a request](administration.md#echo-a-request) (`POST /_admin/echo`)
- [Execute a script](administration.md#execute-a-script) (`POST /_admin/execute`)
- [List the endpoints of a single server](administration.md#list-the-endpoints-of-a-single-server-deprecated)
  (`GET /_api/endpoint`)
- `GET /_admin/version`: Use `GET /_api/version` instead.
- `/_admin/job*`: Use the [`/_api/job*` endpoints](jobs.md) instead.

You can also not create [full-text indexes](indexes/fulltext.md) in `v1`.
Such requests fail with an HTTP `400 Bad Request` error and the error
number `10` (`ERROR_BAD_PARAMETER`).

The [web interface](../../components/web-interface/_index.md) is only available
without a prefix or with the `/_arango/v0` prefix.

## Discover the API versions

### Server version information

The [`GET /_api/version` endpoint](administration.md#get-the-server-version)
returns the following attributes related to API versions:

- `apiVersions`: The API versions the server supports, newest first, like
  `["v1", "v0"]`.
- `deprecatedApiVersions`: The supported API versions that you should no
  longer use because they are going to be removed.
- `requestedApiVersion`: The API version of the request, like `"v0"`.

### OpenAPI description

```openapi
---
apiVersions: [v0, v1, experimental]
---
paths:
  /openapi.json:
    get:
      operationId: getOpenApiDescription
      x-rbac-access: public
      description: |
        Returns the description of the HTTP API in the
        [OpenAPI 3.1](https://spec.openapis.org/oas/v3.1.0) format for the
        API version you select via the `/_arango/{api-version}` prefix, like
        `/_arango/v1/openapi.json` or `/_arango/experimental/openapi.json`.
        Without a prefix, you get the description of the default API version.

        This endpoint doesn't require authentication.
      responses:
        '200':
          description: |
            The OpenAPI description of the API version.
          content:
            application/json:
              schema:
                type: object
        '404':
          description: |
            The specified API version is not supported.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 404
                  errorNum:
                    description: |
                      The ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
      tags:
        - Administration
```

## Evolution of the API

New features are added to a major API version as long as they are compatible
with existing clients. Breaking changes require a new major API version.

A new major API version starts out with only the endpoints that have breaking
changes. Requests to the other endpoints with the new prefix fail with an
HTTP `404 Not Found` error until they are added to the new major API version,
too. Keep using the previous major API version as the base for your client
code and use the new one only for the endpoints whose new behavior you need.

A server can serve multiple major API versions at the same time, so that you
can migrate gradually. A major API version is first deprecated, which you can
tell by the `deprecatedApiVersions` attribute of the version information, and
can then be removed with a new major ArangoDB release. ArangoDB 4.x doesn't
support `v0`, so you need to adjust your client code to `v1` before you upgrade.
