---
title: Other Replication Commands
weight: 20
description: ''
archetype: default
---
```openapi
## Return server id

paths:
  /_api/replication/server-id:
    get:
      operationId: getReplicationServerId
      description: |
        Returns the servers id. The id is also returned by other replication API
        methods, and this method is an easy means of determining a server's id.

        The body of the response is a JSON object with the attribute *serverId*. The
        server id is returned as a string.
      responses:
        '200':
          description: |
            is returned if the request was executed successfully.
        '405':
          description: |
            is returned when an invalid HTTP method is used.
        '500':
          description: |
            is returned if an error occurred while assembling the response.
      tags:
        - Replication
```


```curl
---
render: input/output
name: RestReplicationServerId
release: stable_single
version: '3.11'
---
var url = "/_api/replication/server-id";
var response = logCurlRequest('GET', url);

assert(response.code === 200);
logJsonResponse(response);
```
