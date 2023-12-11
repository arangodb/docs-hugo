---
title: HTTP interfaces for security features
menuTitle: Security
weight: 105
description: >-
  The security-related endpoints let you can configure audit logging,
  encryption at rest, and encryption in transit
archetype: default
---
## Audit logging

You can get and set the log level for the `audit-*` log topics using the regular
endpoints for the log levels. See [Logs](monitoring/logs.md).

The audit logging feature can otherwise only be configured using startup options.
See [Audit logging](../../operations/security/audit-logging.md#configuration).

## Encryption in transit

### Get the TLS data

```openapi
paths:
  /_admin/server/tls:
    get:
      operationId: getServerTls
      description: |
        Return a summary of the TLS data. The JSON response will contain a field
        `result` with the following components:

          - `keyfile`: Information about the key file.
          - `clientCA`: Information about the Certificate Authority (CA) for
            client certificate verification.

        If server name indication (SNI) is used and multiple key files are
        configured for different server names, then there is an additional
        attribute `SNI`, which contains for each configured server name
        the corresponding information about the key file for that server name.

        In all cases the value of the attribute will be a JSON object, which
        has a subset of the following attributes (whatever is appropriate):

          - `sha256`: The value is a string with the SHA256 of the whole input
            file.
          - `certificates`: The value is a JSON array with the public
            certificates in the chain in the file.
          - `privateKeySha256`: In cases where there is a private key (`keyfile`
            but not `clientCA`), this field is present and contains a
            JSON string with the SHA256 of the private key.

        This API requires authentication.
      responses:
        '200':
          description: |
            This API will return HTTP 200 if everything is ok
      tags:
        - Security
```

### Reload the TLS data

```openapi
paths:
  /_admin/server/tls:
    post:
      operationId: reloadServerTls
      description: |
        This API call triggers a reload of all the TLS data (server key, client-auth CA)
        and then returns a summary. The JSON response is exactly as in the corresponding
        GET request.

        This is a protected API and can only be executed with superuser rights.
      responses:
        '200':
          description: |
            This API will return HTTP 200 if everything is ok
        '403':
          description: |
            This API will return HTTP 403 Forbidden if it is not called with
            superuser rights.
      tags:
        - Security
```

## Encryption at rest

### Rotate the encryption at rest key

```openapi
paths:
  /_admin/server/encryption:
    post:
      operationId: rotateEncryptionAtRestKey
      description: |
        Change the user-supplied encryption at rest key by sending a request without
        payload to this endpoint. The file supplied via `--rocksdb.encryption-keyfolder`
        will be reloaded and the internal encryption key will be re-encrypted with the
        new user key.

        This is a protected API and can only be executed with superuser rights.
        This API is not available on Coordinator nodes.
      responses:
        '200':
          description: |
            This API will return HTTP 200 if everything is ok
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - result
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
                    required:
                      - encryption-keys
                    properties:
                      encryption-keys:
                        description: |
                          An array of objects with the SHA-256 hashes of the key secrets.
                          Can be empty.
                        type: array
                        items:
                          type: object
        '403':
          description: |
            This API will return HTTP 403 FORBIDDEN if it is not called with
            superuser rights.
        '404':
          description: |
            This API will return HTTP 404 in case encryption key rotation is disabled.
      tags:
        - Security
```
