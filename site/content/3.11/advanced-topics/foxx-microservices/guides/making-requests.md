---
title: Making requests
weight: 65
description: >-
  Making requests
archetype: default
---
ArangoDB is primarily a database, so Foxx doesn't offer the same level of
network access as more general-purpose JavaScript environments like Node.js.
However ArangoDB does provide the
[`@arangodb/request` module](../../../appendix/javascript-modules/request.md)
for making HTTP (or HTTPS) requests:

```js
"use strict";
const request = require("@arangodb/request");
const response = request.get(
  "https://pokeapi.co/api/v2/pokemon/25/"
);
if (response.status < 400) {
  const pikachu = response.json;
  console.log(pikachu);
}
```

{{< warning >}}
Because
[Foxx services are always synchronous](../_index.md#compatibility-caveats)
and network requests can be considerably slower than any other
database operation, you should avoid making requests in your service
if possible or use [queues](scripts-and-scheduling.md#queues) instead.
{{< /warning >}}

By using an absolute path instead of a full URL, you can also use the
request module to talk to ArangoDB itself,
for example in [integration tests](testing-foxx-services.md#integration-testing):

```js
const response = request.get("/_db/_system/myfoxx/something");
```

**Note**: Although making local requests doesn't create the network overhead
as making requests to other servers, special care needs to be taken when
talking to services on the same server. If you want to connect services
in the same database [you should use dependencies instead](linking-services-together.md).
