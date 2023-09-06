---
title: Authentication
menuTitle: Authentication
weight: 10
description: >-
  You can gain access to a protected ArangoDB server via HTTP authentication
  using a username and password, or a JSON Web Tokens (JWT) generated from the
  user credentials or the JWT secret of the deployment
archetype: default
---
{{< description >}}

Client authentication can be achieved by using the `Authorization` HTTP header
in client requests. ArangoDB supports authentication via HTTP Basic or JWT.

Authentication is turned on by default for all internal database APIs but
turned off for custom Foxx apps. To toggle authentication for incoming
requests to the internal database APIs, use the
[`--server.authentication`](../../components/arangodb-server/options.md#--serverauthentication)
startup option. This option is turned on by default so authentication is
required for the database APIs.

{{< security >}}
Requests using the HTTP `OPTIONS` method are answered by
ArangoDB in any case, even if no authentication data is sent by the client or if
the authentication data is wrong. This is required for handling CORS preflight
requests (see [Cross Origin Resource Sharing requests](general-request-handling.md#cross-origin-resource-sharing-cors-requests)).
The response to an HTTP `OPTIONS` request is generic and doesn't expose any
private data.
{{< /security >}}

There is an additional option to control authentication for custom Foxx apps. The
[`--server.authentication-system-only`](../../components/arangodb-server/options.md#--serverauthentication-system-only)
startup option controls whether authentication is required only for requests to
the internal database APIs and the admin interface. It is turned on by default,
meaning that other APIs (this includes custom Foxx apps) do not require
authentication.

The default values allow exposing a public custom Foxx API built with ArangoDB
to the outside world without the need for HTTP authentication, but still
protecting the usage of the internal database APIs (i.e. `/_api/`, `/_admin/`)
with HTTP authentication.

If the server is started with the `--server.authentication-system-only`
option set to `false`, all incoming requests need HTTP authentication
if the server is configured to require HTTP authentication
(i.e. `--server.authentication true`). Setting the option to `true`
makes the server require authentication only for requests to the internal
database APIs and allows unauthenticated requests to all other URLs.

Here is a short summary:

- `--server.authentication true --server.authentication-system-only true`:
  This requires authentication for all requests to the internal database
  APIs but not custom Foxx apps. This is the default setting.
- `--server.authentication true --server.authentication-system-only false`:
  This requires authentication for all requests (including custom Foxx apps).
- `--server.authentication false`: Authentication is disabled for all requests.

Whenever authentication is required and the client has not yet authenticated,
ArangoDB returns **HTTP 401** (Unauthorized). It also sends the
`Www-Authenticate` response header, indicating that the client should prompt
the user for username and password if supported. If the client is a browser,
then sending back this header normally triggers the display of the
browser-side HTTP authentication dialog. As showing the browser HTTP
authentication dialog is undesired in AJAX requests, ArangoDB can be told to
not send the `Www-Authenticate` header back to the client. Whenever a client
sends the `X-Omit-Www-Authenticate` HTTP header (with an arbitrary value) to
the server, ArangoDB only sends status code 401, but no `Www-Authenticate`
header. This allows clients to implement credentials handling and bypassing
the browser's built-in dialog.

## HTTP Basic Authentication

ArangoDB supports basic authentication with a user name and password. The name
and the password of an ArangoDB user account need to be separated by a colon and
the entire string needs to be Base64-encoded. The resulting value can be used
in the `Authorization` header of an HTTP request, indicating that the
authorization scheme is `Basic`.

For example, if the name is `user` and the password `pass`, the temporary string
that needs to be encoded is `user:pass`. The Base64-encoded value is
`dXNlcjpwYXNz` (e.g. using the `btoa()` JavaScript function in a browser).
The HTTP request header to authenticate is a follows:

```
Authorization: Basic dXNlcjpwYXNz
```

If you use a tool like cURL, you can manually specify this header as follows:

```
curl -H 'Authorization: Basic dXNlcjpwYXNz' ...
```

However, cURL can also take care of the authentication for you:

```
curl -u user:pass ...
```

{{< security >}}
Encoding credentials using the Base64 scheme does not encrypt them.
Base64-encoded strings can easily be decoded. Be careful not to expose the
encoded credentials by accident. It is recommended to secure connections with
ArangoDB servers using TLS for encryption in transit.
{{< /security >}}

## Bearer Token Authentication

ArangoDB uses a standard JWT-based authentication method.
To authenticate via JWT, you must first obtain a JWT token with a signature
generated via HMAC with SHA-256. The secret may either be set using
`--server.jwt-secret` or it is randomly generated on server startup.

For more information on JWT please consult RFC7519 and [jwt.io](https://jwt.io).

### JWT user tokens

To authenticate with a specific user you need to supply a JWT token containing
the `preferred_username` field with the username.
You can either let ArangoDB generate this token for you via an API call
or you can generate it yourself (only if you know the JWT secret).

ArangoDB offers a RESTful API to generate user tokens for you if you know the
username and password. To do so send a POST request to:

```
/_open/auth
```

… containing `username` and `password` JSON-encoded like so:

```json
{
  "username": "root",
  "password": "rootPassword"
}
```

On success, the endpoint returns a **200 OK** and an answer containing
the JWT in a JSON-encoded object like so:

```json
{ "jwt": "eyJhbGciOiJIUzI1NiI..x6EfI" }
```

This JWT should then be used within the Authorization HTTP header in subsequent
requests:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiI..x6EfI
```

{{< security >}}
The JWT token expires after **one hour** by default and needs to be updated.
You can configure the token lifetime via the `--server.session-timeout`
startup option.
{{< /security >}}

You can find the expiration date of the JWT token in the `exp` field, encoded as
Unix timestamp in seconds.
Please note that all JWT tokens must contain the `iss` field with string value
`arangodb`. As an example the decoded JWT body would look like this:

```json
{
  "exp": 1540381557,
  "iat": 1537789.55727901,
  "iss": "arangodb",
  "preferred_username": "root"
}
```

```openapi
#### Create a JWT session token

paths:
  /_open/auth:
    post:
      operationId: createSessionToken
      description: |
        Obtain a JSON Web Token (JWT) from the credentials of an ArangoDB user account.
        You can use the JWT in the `Authorization` HTTP header as a `Bearer` token to
        authenticate requests.

        The lifetime for the token is controlled by the `--server.session-timeout`
        startup option.
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                username:
                  description: |
                    The name of an ArangoDB user.
                  type: string
                password:
                  description: |
                    The password of the ArangoDB user.
                  type: string
              required:
                - username
                - password
      responses:
        '200':
          description: ''
          content:
            application/json:
              schema:
                type: object
                properties:
                  jwt:
                    description: |
                      The encoded JWT session token.
                    type: string
                required:
                  - jwt
        '400':
          description: |
            An HTTP `400 Bad Request` status code is returned if the request misses required
            attributes or if it is otherwise malformed.
        '401':
          description: |
            An HTTP `401 Unauthorized` status code is returned if the user credentials are
            incorrect.
        '404':
          description: |
            An HTTP `404 Not Found` status code is returned if the server has authentication
            disabled and the endpoint is thus not available.
      tags:
        - Authentication
```

### JWT superuser tokens

To access specific internal APIs as well as Agency and DB-Server instances a
token generated via `POST /open/auth` is not good enough. For these special
APIs, you need to generate a special JWT token which grants superuser
access. Note that using superuser access for normal database operations is
**not advised**.

{{< security >}}
It is only possible to generate this JWT token with the knowledge of the
JWT secret.
{{< /security >}}

For your convenience it is possible to generate this token via the
[ArangoDB starter CLI](../../components/tools/arangodb-starter/security.md#using-authentication-tokens).

Should you wish to generate the JWT token yourself with a tool of your choice,
you need to include the correct body. The body must contain the `iss` field
with string value `arangodb` and the `server_id` field with an arbitrary string
identifier:

```json
{
  "exp": 1537900279,
  "iat": 1537800279,
  "iss": "arangodb",
  "server_id": "myclient"
}
```

For example to generate a token via the
[jwtgen tool](https://www.npmjs.com/package/jwtgen)
(note the lifetime of one hour):

```
jwtgen -s <my-secret> -e 3600 -v -a "HS256" -c 'iss=arangodb' -c 'server_id=myclient'
curl -v -H "Authorization: bearer $(jwtgen -s <my-secret> -e 3600 -a "HS256" -c 'iss=arangodb' -c 'server_id=myclient')" http://<database-ip>:8529/_api/version
```

## Hot-reload JWT secrets

<small>Introduced in: v3.7.0</small>

{{< tag "ArangoDB Enterprise Edition" >}}

To reload the JWT secrets of a local arangod process without a restart, you
may use the following RESTful API. A `POST` request reloads the secret, a
`GET` request may be used to load information about the currently used secrets.

```openapi
### Get information about the loaded JWT secrets

paths:
  /_admin/server/jwt:
    get:
      operationId: getServerJwtSecrets
      description: |
        Get information about the currently loaded secrets.

        To utilize the API a superuser JWT token is necessary, otherwise the response
        will be _HTTP 403 Forbidden_.
      responses:
        '200':
          description: ''
          content:
            application/json:
              schema:
                description: |
                  The reply with the JWT secrets information.
                type: object
                properties:
                  error:
                    description: |
                      boolean flag to indicate whether an error occurred (`false` in this case)
                    type: boolean
                  code:
                    description: |
                      the HTTP status code - 200 in this case
                    type: integer
                  result:
                    description: |
                      The result object.
                    type: object
                    properties:
                      active:
                        description: |
                          An object with the SHA-256 hash of the active secret.
                        type: object
                      passive:
                        description: |
                          An array of objects with the SHA-256 hashes of the passive secrets.

                          Can be empty.
                        type: array
                        items:
                          type: object
                    required:
                      - active
                      - passive
                required:
                  - error
                  - code
                  - result
        '403':
          description: |
            if the request was not authenticated as a user with sufficient rights
      tags:
        - Authentication
```
```openapi
### Hot-reload the JWT secret(s) from disk

paths:
  /_admin/server/jwt:
    post:
      operationId: reloadServerJwtSecrets
      description: |
        Sending a request without payload to this endpoint reloads the JWT secret(s)
        from disk. Only the files specified via the arangod startup option
        `--server.jwt-secret-keyfile` or `--server.jwt-secret-folder` are used.
        It is not possible to change the locations where files are loaded from
        without restarting the process.

        To utilize the API a superuser JWT token is necessary, otherwise the response
        will be _HTTP 403 Forbidden_.
      responses:
        '200':
          description: ''
          content:
            application/json:
              schema:
                description: |
                  The reply with the JWT secrets information.
                type: object
                properties:
                  error:
                    description: |
                      boolean flag to indicate whether an error occurred (`false` in this case)
                    type: boolean
                  code:
                    description: |
                      the HTTP status code - 200 in this case
                    type: integer
                  result:
                    description: |
                      The result object.
                    type: object
                    properties:
                      active:
                        description: |
                          An object with the SHA-256 hash of the active secret.
                        type: object
                      passive:
                        description: |
                          An array of objects with the SHA-256 hashes of the passive secrets.

                          Can be empty.
                        type: array
                        items:
                          type: object
                    required:
                      - active
                      - passive
                required:
                  - error
                  - code
                  - result
        '403':
          description: |
            if the request was not authenticated as a user with sufficient rights
      tags:
        - Authentication
```

Example result:

```json
{
  "error": false,
  "code": 200,
  "result": {
    "active": {
      "sha256": "c6c1021286dfe870b7050f9e704df93c7f1de3c89dbdadc3fb30394bebd81e97"
    },
    "passive": [
      {
        "sha256": "6d2fe32dc4249ef7e7359c6d874fffbbf335e832e49a2681236e1b686af78794"
      },
      {
        "sha256": "448a28491967ea4f7599f454af261a685153c27a7d5748456022565947820fb9"
      },
      {
        "sha256": "6745d49264bdfc2e89d4333fe88f0fce94615fdbdb8990e95b5fda0583336da8"
      }
    ]
  }
}
```