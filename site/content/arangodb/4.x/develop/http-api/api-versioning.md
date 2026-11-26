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
upgrade can break your client code, and which features you can rely on:

- **Server upgrades and API changes are separate**: As long as a later
  ArangoDB release serves the same major API version as the release you upgrade
  from, everything that worked before the upgrade continues to work after it.
  This applies even across major ArangoDB releases.
- **Breaking changes are opt-in**: Incompatible API changes are only made in a
  new major API version, which you need to request explicitly in the URL. You
  can adopt it at your own pace, for individual endpoints if you like, while
  the rest of your code keeps using the previous API version.
- **The available features are discoverable**: The minor API version tells you
  which features you can rely on, and the server can reject requests that
  expect features it doesn't have.

## API version identifiers

An API version is identified by a string of the form `vMAJOR.MINOR-BRANCH`,
for example, `v1.0-4`:

- `MAJOR` is the **major API version**. It only increases for changes that can
  break existing clients. You select the major API version with the
  `/_arango/v{MAJOR}` prefix in the URL path, like `/_arango/v1`.
- `MINOR` is the **minor API version**. It increases for changes that are
  compatible with existing clients, like additional endpoints or optional
  attributes.
- `BRANCH` is the major version of the ArangoDB release line that serves the
  API version, for example, `4` for ArangoDB 4.x and `3` for ArangoDB 3.x.
  It makes the identifier unique if the same API version is available in
  different release lines, like `v1.0-3` in ArangoDB 3.12 and `v1.0-4` in
  ArangoDB 4.x.

The experimental API is identified by just `experimental`, without the
`v` prefix, a minor version, or a branch. See
[Experimental API](#experimental-api).

ArangoDB 4.x serves the major API version `v1`. ArangoDB 3.12 serves `v1` as
well (from v3.12.15 onward), so that you can test your client code against the
API of ArangoDB 4.x before you upgrade. ArangoDB 3.12 also serves the legacy
API version `v0`, which is its default. ArangoDB 4.x doesn't support `v0`.

{{< comment >}}
TODO: The vMAJOR.MINOR-BRANCH format (and the x-arango-api-version header) may
not land in 3.12, which currently reports its versions as "v1" and "v0".
Adjust the 3.12 references on this page accordingly.
{{< /comment >}}

## Compatibility guarantees

### No breaking changes within a major API version

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

### Feature availability via minor versions

The major API version tells you whether your client code is compatible with a
server. It doesn't tell you whether a specific feature is available, because
features are added in minor versions. Drivers and other clients should
therefore not assume that a feature is present just because the server serves
`v1`.

A client that is written for a specific API version can rely on all servers
that serve the same major API version with the same or a higher minor version
and the same or a higher branch. For example, a client written for `v1.1-4`
works with `v1.1-4`, `v1.2-4`, and `v1.1-5`, but not necessarily with `v1.0-4`
or `v1.1-3`.

Features can be added in different release lines at different times. For
example (with hypothetical version numbers), ArangoDB 4.1.0 could add a feature
to `v1` and thus serve `v1.1-4`. If the feature is backported to
ArangoDB 3.12.20, that release serves `v1.1-3`. In this case:

- Upgrading from 3.12.20 (`v1.1-3`) to ArangoDB 4.0.x (`v1.0-4`) keeps your
  client code working as far as `v1.0` is concerned, but features that were
  added in `v1.1` are not available.
- Upgrading from 3.12.20 (`v1.1-3`) to ArangoDB 4.1.0 (`v1.1-4`) or later
  preserves all features. A feature is always released in the higher release
  line first and only then backported to a lower one, so `v1.1-3` cannot have
  features that `v1.1-4` lacks.
- The reverse isn't true: `v1.1-4` can include features that were not
  backported to `v1.1-3`. A client written for `v1.1-4` cannot rely on these
  features with a server that serves `v1.1-3`.

You can declare the API version your client code is written for with the
[`x-arango-api-version` header](#the-x-arango-api-version-header) to let the
server check that it can satisfy your requests.

## Select an API version

### The `/_arango/{api-version}` prefix

You select the major API version with a prefix in the URL path. It always
comes first, before the database (`/_db/{database-name}`) and the rest of the
endpoint path:

```
GET /_arango/v1/_db/mydb/_api/document/coll/docKey
```

The prefix is optional. If you omit it, the request uses the default API
version, which is `v1` in ArangoDB 4.x. The following requests are thus
equivalent:

```
GET /_arango/v1/_db/mydb/_api/document/coll/docKey
GET /_db/mydb/_api/document/coll/docKey
```

The endpoint descriptions in the documentation show the paths with the
`/_arango/v1` prefix, like
`GET /_arango/v1/_db/{database-name}/_api/document/{collection}/{key}`.

If you specify an API version that the server doesn't support, like
`/_arango/v0` or `/_arango/v2`, the server responds with an HTTP `404 Not Found`
error that lists the valid prefixes:

```json
{
  "code": 404,
  "error": true,
  "errorMessage": "invalid API version in path '/_arango/v0/_api/version', valid prefixes are: /_arango/v1, /_arango/experimental",
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

### The `x-arango-api-version` header

You can optionally set the `x-arango-api-version` HTTP header in a request to
the full identifier of the API version your client code is written for, like
`v1.0-4`. The server compares it to the API version it serves for the major
version that you select via the URL (or the default API version) and only
processes the request if they are compatible, which is the case if the
following conditions are all met:

- The major versions are equal.
- The requested minor version is less than or equal to the served minor version.
- The requested branch is less than or equal to the served branch.

Otherwise, the server rejects the request with an HTTP `400 Bad Request`
error and the error number `602` (`ERROR_HTTP_API_VERSION_MISMATCH`).
The check takes place before the authentication. For example, if the server
serves `v1.0-4`:

| `x-arango-api-version` | Result |
|:-----------------------|:-------|
| `v1.0-4` | Accepted |
| `v1.0-3` | Accepted (lower branch) |
| `v1.1-4` | Rejected with error `602` (higher minor version) |
| `v1.0-5` | Rejected with error `602` (higher branch) |
| `v2.0-4` | Rejected with error `602` (different major version) |
| `v1` | Rejected with error `10` (invalid format) |

```sh
curl -H "x-arango-api-version: v1.1-4" http://localhost:8529/_api/version
```

```json
{
  "code": 400,
  "error": true,
  "errorMessage": "requested API version v1.1-4 is not compatible with served API version v1.0-4",
  "errorNum": 602
}
```

If the value doesn't have the format `vMAJOR.MINOR-BRANCH`, the request fails
with an HTTP `400 Bad Request` error and the error number `10`
(`ERROR_BAD_PARAMETER`). You cannot use the header together with the
experimental API, which also results in an HTTP `400 Bad Request` error and
the error number `10`.

Responses include the `x-arango-api-version` header with the API version that
the server served the request with, for example:

```
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
X-Arango-Api-Version: v1.0-4
```

For requests to the experimental API, the value is `experimental`.
The header is exposed to browser clients via CORS
(`Access-Control-Expose-Headers`).

## Discover the API versions

### Server version information

The [`GET /_api/version` endpoint](administration.md#get-the-server-version)
returns the following attributes related to API versions:

- `apiVersions`: The API versions the server supports, newest first, like
  `["v1.0-4"]`. There is at most one entry per major API version.
- `deprecatedApiVersions`: The supported API versions that you should no
  longer use because they are going to be removed.
- `requestedApiVersion`: The major API version of the request, like `"v1"`.

### OpenAPI description

```openapi
---
apiVersions: [v1, experimental]
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

New features are added to the current major API version in minor versions, as
long as they are compatible with existing clients. Breaking changes require a
new major API version, like `v2`.

A new major API version starts out with only the endpoints that have breaking
changes. Requests to the other endpoints with the new prefix fail with an
HTTP `404 Not Found` error until they are added to the new major API version,
too. Keep using the previous major API version as the base for your client
code and use the new one only for the endpoints whose new behavior you need,
for example, `/_arango/v2` for the document API and `/_arango/v1` for
everything else.

A server can serve multiple major API versions at the same time, so that you
can migrate gradually. A major API version is first deprecated, which you can
tell by the `deprecatedApiVersions` attribute of the version information, and
can then be removed with a new major ArangoDB release.

The `v0` API version of ArangoDB 3.12 and earlier versions is not supported by
ArangoDB 4.x. The `v1` API version of ArangoDB 4.x is the same as `v0`, except
for the changes listed in the
[API changes in ArangoDB 4.x](../../release-notes/version-4.x/api-changes-in-4-x.md#http-api).
