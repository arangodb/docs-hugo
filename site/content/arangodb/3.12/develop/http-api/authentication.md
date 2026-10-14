---
title: Authentication HTTP API
menuTitle: Authentication
weight: 10
description: >-
  You can gain access to a protected ArangoDB server via HTTP authentication
  using a username and password, or a JSON Web Tokens (JWT) generated from the
  user credentials or the JWT secret of the deployment
---
Client authentication can be achieved by using the `Authorization` HTTP header
in client requests. ArangoDB supports authentication via the following:

- [**HTTP Basic Authentication**](#http-basic-authentication) with a username
  and either a password or access token.
- [**Bearer Token Authentication**](#bearer-token-authentication) using JWT,
  which can be session tokens for regular users or non-expiring superuser tokens.

Authentication is enabled by default for all internal database APIs but
disabled for custom Foxx apps. To toggle authentication for incoming
requests to the internal database APIs, use the
[`--server.authentication`](../../components/arangodb-server/options.md#--serverauthentication)
startup option. This option is enabled by default so authentication is
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

However, cURL can also take care of the authentication and specifically the
encoding of the credentials for you:

```
curl -u user:pass ...
```

{{< security >}}
Encoding credentials using the Base64 scheme does not encrypt them.
Base64-encoded strings can easily be decoded. Be careful not to expose the
encoded credentials by accident. It is recommended to secure connections with
ArangoDB servers using TLS for encryption in transit.
{{< /security >}}

You can also authenticate with [Access tokens](#access-tokens). Use the
access token as the password. You can omit the user name in this case:

```
curl -u:the_access_token
```

If you specify the user name, it must match the name encoded in the token.

## Bearer Token Authentication

ArangoDB supports authentication with JSON Web Tokens (JWT). For more
information on JWT, please consult [RFC 7519](https://datatracker.ietf.org/doc/html/rfc7519)
and [jwt.io](https://jwt.io).

To authenticate via JWT, send the token in the `Authorization` HTTP header of
your requests:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiI..x6EfI
```

The server signs tokens with its active JWT secret.
You can set the JWT secrets on server startup in one of the following ways:
- Set [`--server.jwt-secret-keyfile`](../../components/arangodb-server/options.md#--serverjwt-secret-keyfile)
  to let the server read the JWT secret from the specified file.
- Set [`--server.jwt-secret-folder`](../../components/arangodb-server/options.md#--serverjwt-secret-folder)
  to specify a path and let the server read JWT secrets from multiple files
  (only one is used for signing).
- Not specify either option to let the server generate a random JWT secret.
- Don't use the deprecated `--server.jwt-secret` startup option to set a
  JWT secret directly, as this may leak the secret (e.g. via the process list).

A JWT secret can be one of the following:

- A shared secret with a length of up to 64 bytes. Tokens are signed via HMAC
  with SHA-256 (`HS256`). Everyone who knows the secret can both verify and sign
  tokens.
- From v3.12.8 onward, a private key for the P-256 elliptic curve in PEM format.
  Tokens are signed via ECDSA with SHA-256 (`ES256`). The corresponding public
  key can only verify tokens but not sign them. The active JWT secret that the
  server uses for signing needs to be a private key, but if you use
  `--server.jwt-secret-folder`, the other files can also contain public keys in
  PEM format, for example, to accept tokens that another party signs with its
  private key.

For example, you can create a private key and the corresponding public key for
`ES256` with OpenSSL like this:

```sh
openssl ecparam -name prime256v1 -genkey -noout -out jwt-private.pem
openssl ec -in jwt-private.pem -pubout -out jwt-public.pem
```

### JWT types

ArangoDB distinguishes the following kinds of JWTs:

| Type | How to obtain | Authenticates as | Expiry time |
|:-----|:--------------|:-----------------|:------------|
| [Session token](#jwt-session-tokens) | Request it from the server with a username and password or an access token. No JWT secret is needed. | The user, with the user's permissions | Always, after one hour by default |
| [User token](#jwt-user-tokens) | Generate and sign it yourself using the active JWT secret. | The user, with the user's permissions | Optional, usually none |
| [Superuser token](#jwt-superuser-tokens) | Generate and sign it yourself using the active JWT secret. | No user, with full access including internal APIs | Optional, usually none |

The decoded payload of a JWT can contain the following fields (claims):

| Claim | Description |
|:------|:------------|
| `iss` | Required. Must be the string `"arangodb"`. |
| `preferred_username` | The name of the user account to authenticate as. Session tokens and user tokens contain it. The user account must exist and be active. |
| `server_id` | An arbitrary string identifier. Required if `preferred_username` is not set, which makes the token a superuser token. |
| `exp` | The expiry time as Unix timestamp in seconds. Optional, but session tokens always have it. |
| `iat` | The time the token has been issued as Unix timestamp in seconds. Optional. |
| `allowed_paths` | An array of request paths that the token can be used for, without the `/_arango/<api-version>` and `/_db/<database-name>` prefixes, like `"/_api/version"`. Requests to other paths are rejected. Optional. |

If you generate tokens yourself, set the `alg` field in the JWT header to the
algorithm that matches the active JWT secret, `HS256` for a shared secret or `ES256`
for a private key.

### Validity and revocation of JWTs

JWTs are stateless: the server doesn't store the tokens it issues. It accepts
every token with a valid signature, and it cannot revoke individual tokens.
A JWT is valid until one of the following happens:

- It reaches its expiry time (`exp`), if it has one.
- The server no longer has a JWT secret that can verify the token.
  If you rotate the secret using the
  [`--server.jwt-secret-folder`](../../components/arangodb-server/options.md#--serverjwt-secret-folder)
  startup option, tokens signed with a previous secret remain valid as long as
  the folder contains that secret as a passive secret. Any of the JWT secrets
  can verify tokens, but only the active one signs them. You can
  [hot-reload the JWT secrets](#hot-reload-jwt-secrets) without a restart.
- For session tokens and user tokens, no active user account exists for the
  username in the token's `preferred_username` field. This is the case if the
  account has been removed or, from v3.12.12 onward, deactivated by setting
  `active` to `false` with the [User Management API](users.md).

Changing the password of a user account doesn't invalidate tokens that have
already been issued for it. Tokens also aren't bound to a particular user
account instance, only to the username: if you remove a user account and later
create a new account with the same username, previously issued tokens for that
username become valid again, regardless of the new account's password. User
tokens and superuser tokens without an expiry time stay valid until the JWT
secret that signed them is removed, so treat them as sensitive as the JWT
secrets themselves.

### JWT session tokens

A session token is a JWT that the server issues for a user account. You don't
need to know the JWT secret, only the credentials of the user account. The web
interface and the client tools use session tokens, for example.

To obtain a session token, send a POST request to the following endpoint:

{{< endpoint "POST" "/_open/auth" >}}

The request body needs to contain the `username` and `password` JSON-encoded like so:

```json
{
  "username": "root",
  "password": "rootPassword"
}
```

You can also use [Access tokens](#access-tokens) for creating JWTs. Provide the
access token as the `password`. You can omit the `username`:

```json
{
  "password": "theAccessToken"
}
```

If you specify the user name, it must match the name encoded in the token.

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

From v3.12.6 onward, you can request a different lifetime for a token by
specifying the `expiryTime` attribute in the request body, in seconds. It needs
to be within the bounds that the `--auth.minimal-jwt-expiry-time` (default:
`10`) and `--auth.maximal-jwt-expiry-time` (default: `3600`) startup options
define:

```json
{
  "username": "root",
  "password": "rootPassword",
  "expiryTime": 600
}
```

You can find the expiration date of the JWT token in the `exp` field, encoded as
Unix timestamp in seconds. As an example, the decoded JWT body of a session
token looks like this:

```json
{
  "exp": 1540381557,
  "iat": 1540377957,
  "iss": "arangodb",
  "preferred_username": "root"
}
```

#### Create a JWT session token

```openapi
paths:
  /_open/auth:
  # Independent of database
    post:
      operationId: createSessionToken
      description: |
        Obtain a JSON Web Token (JWT) from the credentials of an ArangoDB user account
        or a user's access token.
        You can use the JWT in the `Authorization` HTTP header as a `Bearer` token to
        authenticate requests.

        The lifetime for the token is controlled by the `--server.session-timeout`
        startup option, unless you specify a different lifetime with the
        `expiryTime` attribute.
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required:
                - password
              properties:
                username:
                  description: |
                    The name of an ArangoDB user.
                    
                    It is optional if you specify an access token in `password`
                    but required if you use the user's password.
                  type: string
                password:
                  description: |
                    The password of the ArangoDB user or an access token.
                  type: string
                expiryTime:
                  description: |
                    <small>Introduced in: v3.12.6</small>

                    The lifetime of the token in seconds. Fractional values are
                    truncated.

                    It needs to be greater than or equal to the value of the
                    `--auth.minimal-jwt-expiry-time` startup option and less than
                    or equal to the value of the `--auth.maximal-jwt-expiry-time`
                    startup option.

                    If not specified, the value of the `--server.session-timeout`
                    startup option is used.
                  type: number
      responses:
        '200':
          description: |
            Successfully created a session token.
          content:
            application/json:
              schema:
                type: object
                required:
                  - jwt
                properties:
                  jwt:
                    description: |
                      The encoded JWT session token.
                    type: string
        '400':
          description: |
            An HTTP `400 Bad Request` status code is returned if the request misses required
            attributes, if `expiryTime` is not a number or outside the allowed bounds,
            or if the request is otherwise malformed.
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

### JWT user tokens

If you know the active JWT secret, you can generate and sign a token for a user
account yourself. A user token authenticates as the user specified in the
`preferred_username` field and grants the permissions of this user, the same as
a session token.

Unlike for session tokens, you decide which claims the token contains. In
particular, a user token doesn't need an expiry time. Without one, it stays valid
until the JWT secret that signed it is removed or the user account is removed or
deactivated. See [Validity and revocation of JWTs](#validity-and-revocation-of-jwts).

{{< security >}}
Anyone who knows any of the JWT secrets of the server, active or passive, can
generate this JWT token, because the server accepts tokens signed with either.
{{< /security >}}

You can generate a user token with the
[ArangoDB Starter CLI](../../components/tools/arangodb-starter/security.md#using-authentication-tokens)
by specifying the user with the `--auth.user` option.

Should you wish to generate the JWT token yourself with a tool of your choice,
the body must contain the `iss` field with string value `arangodb` and the
`preferred_username` field with the name of the user account:

```json
{
  "iat": 1537800279,
  "iss": "arangodb",
  "preferred_username": "root"
}
```

For example, to generate such a token via the
[jwtgen tool](https://www.npmjs.com/package/jwtgen):

```
jwtgen -s <my-secret> -v -a "HS256" -c 'iss=arangodb' -c 'preferred_username=root'
```

### JWT superuser tokens

To access specific internal APIs as well as Agency and DB-Server instances a
session token or user token is not good enough. For these special
APIs, you need to generate a special JWT token which grants superuser
access. Note that using superuser access for normal database operations is
**not advised**.

{{< security >}}
Anyone who knows any of the JWT secrets of the server, active or passive, can
generate this JWT token, because the server accepts tokens signed with either.
{{< /security >}}

For your convenience it is possible to generate this token via the
[ArangoDB Starter CLI](../../components/tools/arangodb-starter/security.md#using-authentication-tokens).

Should you wish to generate the JWT token yourself with a tool of your choice,
you need to include the correct body. The body must contain the `iss` field
with string value `arangodb` and the `server_id` field with an arbitrary string
identifier, but no `preferred_username` field. The `exp` field is optional.
Without it, the token stays valid until the JWT secret that signed it is removed.
The following example body includes an expiry time:

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

## Access tokens

Access tokens act like passwords in authentication. Unlike normal credentials
comprised of a username and a password, you can create multiple access tokens
for a single user account. This is akin to having multiple passwords. You can
set a desired expiration date for each access token (typically a few weeks or months)
and individually revoke tokens on the server-side if necessary. You can use
every access tokens for a different purpose, like different services that access
ArangoDB using the same account, for fine-grained access control without having
to change the password if you want to revoke access for one of the services.

You can use access tokens instead of the password to generate
[JWT session tokens](#create-a-jwt-session-token) (recommended) or use them
directly as password in [HTTP Basic Authentication](#http-basic-authentication)
(for backwards compatibility).

You need to create any user accounts first that you want to add access tokens to,
see [Create a user](users.md#create-a-user).

### Create an access token

```openapi
paths:
  /_api/token/{user}:
    post:
      operationId: createAccessToken
      description: |
        Create a new access token for the given user.

        The response includes the actual access token string that you need to
        store in a secure manner. It is only shown once.

        The user account you authenticate with needs to have administrate access
        to the `_system` database if you want to create an access token for a
        different user. You can always create an access token for yourself,
        regardless of database access levels.

        Creating access tokens is not possible if the server is in read-only
        mode, with the exception of the superuser (introduced in v3.12.11).
      parameters:
        - name: user
          in: path
          required: true
          description: |
            The name of the user.
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required:
                - name
                - valid_until
              properties:
                name:
                  description: |
                    A name for the access token to make identification easier,
                    like a short description.
                  type: string
                valid_until:
                  description: |
                    A Unix timestamp in seconds with the desired expiration date and time.

                    The server caps it to the moment of the request plus the maximum
                    configured lifetime for access tokens (introduced in v3.12.10-1), see the
                    [`--auth.maximal-access-token-expiry-time` startup option](../../components/arangodb-server/options.md#--authmaximal-access-token-expiry-time).
                  type: integer
      responses:
        '200':
          description: |
            Is returned if the user data can be replaced by the server.
          content:
            application/json:
              schema:
                required:
                  - id
                  - name
                  - valid_until
                  - created_at
                  - fingerprint
                  - active
                  - token
                type: object
                properties:
                  id:
                    description: |
                      A unique identifier. It is only needed for calling the
                      endpoint for revoking an access token.
                    type: integer
                  name:
                    description: |
                      The name for the access token you specified to make
                      identification easier.
                    type: string
                  valid_until:
                    description: |
                      A Unix timestamp in seconds with the expiration date and time.
                    type: integer
                  created_at:
                    description: |
                      A Unix timestamp in seconds with the creation date and time of the access token.
                    type: integer
                  fingerprint:
                    description: |
                      The beginning and end of the access token string, showing the
                      version and the last few hexadecimal digits for identification,
                      like `v1...54227d`.
                    type: string
                  active:
                    description: |
                      Whether the access token is valid based on the expiration date
                      and time (`valid_until`).
                    type: boolean
                  token:
                    description: |
                      The actual access token string. Store it in a secure manner.
                      This is the only time it is shown to you.
                    type: string
        '400':
          description: |
            The JSON representation is malformed or mandatory data is missing from the request.
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
                    example: 400
                  errorNum:
                    description: |
                      The ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '401':
          description: |
            The request is not authenticated correctly (e.g. wrong credentials, inactive user account).
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
                    example: 401
                  errorNum:
                    description: |
                      The ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '403':
          description: |
            The request is not authorized. The reason can be one of the following:

            - The access level of the user account you authenticated with is too
              low for the `_system` database. It needs to be *Administrate* to
              manage access tokens for other users. The error number is
              `ERROR_FORBIDDEN` (`11`).
            - The server is in read-only mode, which doesn't allow to create
              access tokens, except for the superuser. The error number is
              `ERROR_ARANGO_READ_ONLY` (`1004`) (introduced in v3.12.11).
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
                    example: 403
                  errorNum:
                    description: |
                      The ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '404':
          description: |
            The user specified in the path does not exist.
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
        '409':
          description: |
            Duplicate access token `name`.
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
                    example: 409
                  errorNum:
                    description: |
                      The ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
      tags:
        - Authentication
```

```curl
---
description: |-
  Create an access token for the `root` user:
name: RestAccessTokenCreate
---
var nextYear = new Date().getFullYear() + 1;
var expires = Date.UTC(nextYear, 6, 1) / 1000;

var url = "/_api/token/root";
var body = {
  name: "Token for Service A",
  valid_until: expires,
};

var response = logCurlRequest('POST', url, body);
assert(response.code === 200);
assert(response.parsedBody.active === true);
logJsonResponse(response);
```

### List all access tokens

```openapi
paths:
  /_api/token/{user}:
    get:
      operationId: listAccessTokens
      description: |
        List the access tokens for a given user.

        This only returns the access token metadata.
        The actual access token strings are only shown when creating tokens. 

        The user account you authenticate with needs to have administrate access
        to the `_system` database if you want to list the access tokens for a
        different user. You can always list your own access tokens,
        regardless of database access levels.
      parameters:
        - name: user
          in: path
          required: true
          description: |
            The name of the user.
          schema:
            type: string
      responses:
        '200':
          description: |
            The metadata of the user's access tokens.
          content:
            application/json:
              schema:
                type: object
                required:
                  - tokens
                properties:
                  tokens:
                    description: |
                      A list with information about the user's access tokens.
                    type: array
                    items:
                      type: object
                      required:
                        - id
                        - name
                        - valid_until
                        - created_at
                        - fingerprint
                        - active
                      properties:
                        id:
                          description: |
                            A unique identifier. It is only needed for calling the
                            endpoint for revoking an access token.
                          type: integer
                        name:
                          description: |
                            The name for the access token you specified to make
                            identification easier.
                          type: string
                        valid_until:
                          description: |
                            A Unix timestamp in seconds with the expiration date and time.
                          type: integer
                        created_at:
                          description: |
                            A Unix timestamp in seconds with the creation date and time of the access token.
                          type: integer
                        fingerprint:
                          description: |
                            The beginning and end of the access token string, showing the
                            version and the last few hexadecimal digits for identification,
                            like `v1...54227d`.
                          type: string
                        active:
                          description: |
                            Whether the access token is valid based on the expiration date
                            and time (`valid_until`).
                          type: boolean
        '401':
          description: |
            The request is not authenticated correctly (e.g. wrong credentials, inactive user account).
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
                    example: 401
                  errorNum:
                    description: |
                      The ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '403':
          description: |
            The user's access level for the `_system` database is too low.
            It needs to be *Administrate* to manage access tokens for other users.
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
                    example: 403
                  errorNum:
                    description: |
                      The ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '404':
          description: |
            The user specified in the path does not exist.
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
        - Authentication
```

```curl
---
description: |-
  List the access tokens of the `root` user:
name: RestAccessTokenList
---
var url = "/_api/token/root";
var response = logCurlRequest('GET', url);

assert(response.code === 200);
assert(response.parsedBody.tokens?.length === 1);
logJsonResponse(response);
```

### Delete an access token

```openapi
paths:
  /_api/token/{user}/{token-id}:
    delete:
      operationId: deleteAccessToken
      description: |
        Delete an access token with the specified identifier for the given user.

        The user account you authenticate with needs to have administrate access
        to the `_system` database if you want to delete an access token for a
        different user. You can always delete your own access tokens,
        regardless of database access levels.

        Deleting access tokens is not possible if the server is in read-only
        mode, with the exception of the superuser (introduced in v3.12.11).
      parameters:
        - name: user
          in: path
          required: true
          description: |
            The name of the user.
          schema:
            type: string
        - name: token-id
          in: path
          required: true
          description: |
            The identifier of the access token.
          schema:
            type: integer
      responses:
        '200':
          description: |
            The request is valid and the access token has been deleted if it
            existed. However, the request also succeeds if the specified user
            doesn't have an access token with the given identifier.
          content:
            application/json:
              schema:
                description: |
                  The response does not have a body.
        '401':
          description: |
            The request is not authenticated correctly (e.g. wrong credentials, inactive user account).
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
                    example: 401
                  errorNum:
                    description: |
                      The ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '403':
          description: |
            The request is not authorized. The reason can be one of the following:

            - The access level of the user account you authenticated with is too
              low for the `_system` database. It needs to be *Administrate* to
              manage access tokens for other users. The error number is
              `ERROR_FORBIDDEN` (`11`).
            - The server is in read-only mode, which doesn't allow to delete
              access tokens, except for the superuser. The error number is
              `ERROR_ARANGO_READ_ONLY` (`1004`) (introduced in v3.12.11).
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
                    example: 403
                  errorNum:
                    description: |
                      The ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '404':
          description: |
            The user specified in the path does not exist.
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
        - Authentication
```

```curl
---
description: |-
  Delete an access tokens of the `root` user:
name: RestAccessTokenDelete
---
var url = "/_api/token/root";
var response = internal.arango.GET(url);
assert(response.tokens?.length === 1);

response = logCurlRequest('DELETE', url + "/" + response.tokens[0].id);
assert(response.code === 200);
logRawResponse(response);

response = internal.arango.GET(url);
assert(response.tokens?.length === 0);
```

## Hot-reload JWT secrets

{{< tip >}}
In the Arango Managed Platform (AMP), authentication secrets are managed and
therefore this feature isn't available.
{{< /tip >}}

To reload the JWT secrets of a local _arangod_ process without a restart, you
may use the following HTTP API. A `POST` request reloads the secret, a
`GET` request may be used to load information about the currently used secrets.

### Get information about the loaded JWT secrets

```openapi
paths:
  /_db/{database-name}/_admin/server/jwt:
    get:
      operationId: getServerJwtSecrets
      description: |
        Get information about the currently loaded secrets.

        To utilize the API a superuser JWT token is necessary, otherwise the response
        will be _HTTP 403 Forbidden_.
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of a database. Which database you use doesn't matter as long
            as the user account you authenticate with has at least read access
            to this database. If the `--server.harden` startup option is enabled,
            administrate access to the `_system` database is required.
          schema:
            type: string
      responses:
        '200':
          description: |
            Successfully retrieved the JWT secret information.
          content:
            application/json:
              schema:
                description: |
                  The reply with the JWT secrets information.
                type: object
                required:
                  - error
                  - code
                  - result
                properties:
                  error:
                    description: |
                      A flag indicating that no error occurred.
                    type: boolean
                    example: false
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 200
                  result:
                    description: |
                      The result object.
                    type: object
                    required:
                      - active
                      - passive
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
        '403':
          description: |
            if the request was not authenticated as a user with sufficient rights
      tags:
        - Authentication
```

### Hot-reload the JWT secret(s) from disk

```openapi
paths:
  /_admin/server/jwt:
  # Independent of database (superuser has access to all databases that exist)
    post:
      operationId: reloadServerJwtSecrets
      description: |
        Sending a request without payload to this endpoint reloads the JWT secret(s)
        from disk. Only the files specified via the _arangod_ startup option
        `--server.jwt-secret-keyfile` or `--server.jwt-secret-folder` are used.
        It is not possible to change the locations where files are loaded from
        without restarting the process.

        To utilize the API a superuser JWT token is necessary, otherwise the response
        will be _HTTP 403 Forbidden_.
      responses:
        '200':
          description: |
            Successfully reloaded the JWT secrets.
          content:
            application/json:
              schema:
                description: |
                  The reply with the JWT secrets information.
                type: object
                required:
                  - error
                  - code
                  - result
                properties:
                  error:
                    description: |
                      A flag indicating that no error occurred.
                    type: boolean
                    example: false
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 200
                  result:
                    description: |
                      The result object.
                    type: object
                    required:
                      - active
                      - passive
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
        '400':
          description: |
            The JWT secrets cannot be reloaded because no JWT secret file is
            configured. This is the case if the server has been started with the
            deprecated `--server.jwt-secret` startup option or with no JWT secret
            at all.
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
                    example: 400
                  errorNum:
                    description: |
                      The ArangoDB error number for the error that occurred.
                    type: integer
                    example: 10
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
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
