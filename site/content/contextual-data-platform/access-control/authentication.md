---
title: Authentication in the data platform
menuTitle: Authentication
weight: 5
description: >-
  How to log in to the Contextual Data Platform web interface and how to
  authenticate requests to its services as well as to the ArangoDB core
  database system
---
Every request to the Arango Contextual Data Platform has to prove which
ArangoDB user account it is made on behalf of. How you do so depends on whether
you use the web interface or the HTTP APIs, and in the latter case on which
service you address and whether [Role-Based Access Control (RBAC)](rbac.md) is
enabled.

There are the following ways to authenticate:

- **Username and password** of an ArangoDB user account.
- **Username and access token**. Access tokens act like passwords, but you can
  create multiple of them for the same user account, give each an expiration
  date, and revoke them individually on the server-side.
- **Session token**, a JSON Web Token (JWT) that you obtain by exchanging one of
  the above credentials at the authentication endpoint. It is bound to the user
  account it was issued for and expires after a while.
- **Superuser token**, a non-expiring JWT that you can only generate if you know
  the JWT secret of the deployment. It grants unrestricted access and is meant
  for internal APIs and administrative tooling.

In the web interface, you don't need to deal with tokens. The
[login screen](#log-in-to-the-web-interface) asks for a username and a password
and the browser session takes care of the rest.

For the HTTP APIs, which credentials a given endpoint accepts is summarized
below:

| Credentials | `/_open` endpoints | ArangoDB endpoints | Other data platform endpoints |
|:---|:---|:---|:---|
| Username and password (`Basic`) | Not required | Only without RBAC | Not accepted |
| Username and access token (`Basic`) | Not required | Only without RBAC | Not accepted |
| Session token (`Bearer`) | Not required | Accepted | Accepted |
| Superuser token (`Bearer`) | Not required | Accepted | Accepted |

- **`/_open` endpoints**: endpoints under the `/_open/` path never require
  authentication. The important one is `/_open/auth`, where you trade a
  password or an access token for a session token. It expects the credentials
  in the request body, not in an `Authorization` header.
- **ArangoDB endpoints**: the HTTP API of the core database system with the
  paths starting with `/_arango/`, `/_db/`, `/_api/`, and `/_admin/`. The
  `/_open/*` endpoints are excluded here but are also handled by ArangoDB.
  If RBAC is off, all of the usual
  [ArangoDB authentication methods](../../arangodb/3.12/develop/http-api/authentication.md)
  work. With RBAC enabled, only JWTs are accepted.
- **Other data platform endpoints**: everything else the gateway exposes,
  including the [Platform Suite](../../platform-suite/_index.md) services and
  the [Agentic AI Suite](../../agentic-ai-suite/_index.md) services. They only
  accept JWTs, independent of whether RBAC is enabled.

A session token is therefore the credential that works everywhere. You can
obtain it once and reuse it for all services until it expires.

## Log in to the web interface

The unified web interface of the data platform is available in a browser by
appending `/ui/` to the base URL of the deployment:

`https://<EXTERNAL_ENDPOINT>:8529/ui/`

The login screen asks for the following:

1. **Username**: the name of an ArangoDB user account, for example `root`.
2. **Password**: either the password of that account, or one of the
   [access tokens](#access-tokens) created for it. The field accepts both.
3. Click **Continue**. If the credentials are rejected, the screen reports a
   error and you can retry.
4. **Select a database**: the database you want to start in. Only the databases
   your account has access to are listed in the dropdown menu. You can quickly
   switch between databases later.
5. Click **Log in** to get to the **Home** screen of the
   Arango Contextual Data Platform web interface.

What you can see and do is governed by the roles assigned to the user if
[RBAC](rbac.md) is enabled. If RBAC is off, the classic permission system of
ArangoDB may limit your access at the level of databases and collections, see
[User Management](../../arangodb/3.12/operations/administration/user-management/_index.md).

## Authenticate requests to data platform services

The services of the data platform accept **only** `Bearer` tokens, regardless of
whether RBAC is enabled. This applies to the
[Platform Suite](../../platform-suite/_index.md) services such as the Control
Plane, File Manager, and Container Manager, to the
[Agentic AI Suite](../../agentic-ai-suite/_index.md) services such as AutoGraph,
GraphRAG, and Graph Analytics, and to built-in services provided by the
ArangoDB Kubernetes operator (`kube-arangodb`) like for configuring RBAC.

A JWT is accepted by every part of the data platform, including the endpoints of
the ArangoDB core database system. The database system is only special in that
it accepts additional credentials in deployments without RBAC, as described in
[Authenticate requests to ArangoDB endpoints](#authenticate-requests-to-arangodb-endpoints).
If you obtain a session token, you can use it for everything and don't need to
think about the differences.

### Obtain a session token

You exchange your credentials for a session token at the ArangoDB
authentication endpoint. This endpoint is under the `/_open/` path and thus
available regardless of the RBAC configuration:

{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/_open/auth" >}}

There are two kinds of credentials you can exchange:

- **Username and password** of an ArangoDB user account:

  ```bash
  curl -X POST https://<EXTERNAL_ENDPOINT>:8529/_open/auth \
    -d '{"username": "<USERNAME>", "password": "<PASSWORD>"}'
  ```

- **Username and access token**. Pass the access token as the `password`. The
  `username` is optional, but if you specify it, it has to match the user the
  token was created for:

  ```bash
  curl -X POST https://<EXTERNAL_ENDPOINT>:8529/_open/auth \
    -d '{"username": "<USERNAME>", "password": "<ACCESS_TOKEN>"}'
  ```

On success, the endpoint returns the session token in the `jwt` attribute:

```json
{ "jwt": "eyJhbGciOiJIUzI1NiI..x6EfI" }
```

{{< security >}}
The session token expires after **one hour** by default and needs to be
renewed by requesting a new one. You can configure the token lifetime with the
[`--server.session-timeout`](../../arangodb/3.12/components/arangodb-server/options.md#--serversession-timeout)
startup option of ArangoDB. The token grants the permissions of the user
account it was issued for. Treat it like a password and only transmit it over
TLS-secured connections.
{{< /security >}}

### Use a session token

Send the token in the `Authorization` HTTP header of subsequent requests,
using the `Bearer` scheme:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiI..x6EfI
```

For example:

```bash
curl -H "Authorization: Bearer <JWT>" \
  https://<EXTERNAL_ENDPOINT>:8529/_platform/acp/v1/health
```

The same token is accepted by the ArangoDB endpoints, so you can address the
database system with it as well:

```bash
curl -H "Authorization: Bearer <JWT>" \
  https://<EXTERNAL_ENDPOINT>:8529/_db/_system/_api/version
```

{{< info >}}
HTTP Basic authentication with a username and password is not supported for the
data platform services, not even in deployments without RBAC where ArangoDB
itself would accept it. Always obtain a session token for them.
{{< /info >}}

### Superuser tokens

A superuser token is a JWT that you sign yourself with the JWT secret of the
deployment. It is not bound to a user account, does not expire, and bypasses
the permission system. It is required for certain internal APIs and accepted by
the data platform services as well as by the ArangoDB endpoints, independent of
the RBAC configuration.

Using superuser access for regular operations is **not advised**. See
[JWT superuser tokens](../../arangodb/3.12/develop/http-api/authentication.md#jwt-superuser-tokens)
for how to generate one.

## Authenticate requests to ArangoDB endpoints

Which methods the [HTTP API of the core database system](../../arangodb/3.12/develop/http-api/_index.md)
accepts depends on whether RBAC is enabled for the deployment:

- **RBAC disabled**: all standard ArangoDB authentication methods are available,
  that is HTTP Basic authentication with a username and password or an access
  token, as well as `Bearer` authentication with a session token or a
  superuser token.
- **RBAC enabled**: only `Bearer` authentication with a JWT is accepted, be it a
  session token or a superuser token. HTTP Basic authentication is rejected.
  The only exception is the `/_open/auth` endpoint, which continues to accept a
  username and a password or access token so that you can obtain a session
  token in the first place.

If you want your requests to work in either configuration, use a
[session token](#obtain-a-session-token).

### HTTP Basic authentication

If RBAC is disabled, you can send the username and password with every request
using the `Basic` scheme. Tools like cURL can encode the credentials for you:

```bash
curl -u "<USERNAME>:<PASSWORD>" \
  https://<EXTERNAL_ENDPOINT>:8529/_db/_system/_api/version
```

You can use an access token instead of the password. The username is optional in
this case, but if you specify it, it has to match the user the token was created
for:

```bash
curl -u ":<ACCESS_TOKEN>" \
  https://<EXTERNAL_ENDPOINT>:8529/_db/_system/_api/version
```

See [HTTP Basic Authentication](../../arangodb/3.12/develop/http-api/authentication.md#http-basic-authentication)
for details about the header format.

## Access tokens

Access tokens are an alternative to passwords that you can create per user
account. Unlike a password, you can have several of them at the same time, give
each an expiration date, and revoke them individually on the server-side. You
can use them wherever a password is expected, in particular for the login screen
of the web interface and for obtaining a session token.

See [Access tokens](../../arangodb/3.12/develop/http-api/authentication.md#access-tokens)
for how to create, list, and revoke them.
