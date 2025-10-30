---
title: The error codes of the ArangoDB Core and their meanings
menuTitle: Error codes
weight: 280
description: >-
  Error replies from ArangoDB servers contain a code, error number, and message
  and you can look up additional information for a specific kind of error here
pageToc:
  maxHeadlineLevel: 3
aliases:
  - error-codes-and-meanings
---
## Numbers, names, and descriptions of errors

When an error occurs in an operation of an ArangoDB server, the
[HTTP REST API](http-api/_index.md) responds to a request with an
**HTTP status code** like `400 Bad Request`, `401 Unauthorized`,
`503 Service Unavailable`, or similar. This code is typically also included in
the body of the response, specifically the `code` attribute, along with the
`error` attribute set to `true`.

```
HTTP/1.1 401 Unauthorized
...

{"code":401,"error":true,"errorNum":11,"errorMessage":"not authorized to execute this request"}
```

The **error code** only indicates the broad category of an error, based on the
status codes defined by the HTTP protocol.

A more detailed **error number** is provided in the `errorNum` attribute.
Error numbers are specific to ArangoDB. Each ArangoDB error kind has a number,
a unique name, an error message, and a description.

The **error message** is a brief description of the error and provided in the
`errorMessage` attribute.

Error names are used in code to refer to an error kind, in the server's own code
as well as in other code like drivers. For instance, the name for the error with
the number `11` is `ERROR_FORBIDDEN`. The **error name** is not visible in the
HTTP API response.

In the [JavaScript API](javascript-api/_index.md), the `@arangodb` module maps
error names to objects with the error number and message:

```js
require("@arangodb").errors.ERROR_FORBIDDEN
```

```json
{
  "code" : 11,
  "message" : "forbidden"
}
```

Note that the error message in the HTTP API response deviates from the above
shown message ("not authorized to execute this request" versus "forbidden").
ArangoDB does not necessarily return the error message as defined internally but
can override it in order to provide more details. You should therefore check
against the error number in your own code and never rely on the error message,
as it can be different in under different circumstances for the same error kind.

An **error description** is a more detailed description of the error kind than
the error message. It is not visible in the HTTP API response. It is mainly
used to provide context for developers.

## List of error codes

In the following, you find the error kinds that exist in ArangoDB, grouped into
categories. Each error has a headline with the format `number - name` and the
error description as the text.

{{% error-codes %}}
