---
title: HTTP interface for Dumps
menuTitle: Dump
weight: 118
description: >-
  The internal HTTP API used by arangodump for fast parallel data dumps
archetype: default
---
{{< tag "ArangoDB Enterprise" "ArangoGraph" >}}

{{< warning >}}
This API is for internal use only!
{{< /warning >}}

```openapi
## Create a dump context

paths:
  /_api/dump/start:
    post:
      operationId: startDump
      description: |
        Create a dump context that contains all associated resources, like
        **RocksDB snapshot**, prefetched batches and threads. It also contains
        the _configuration_ for the dump. 
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                batchSize:
                  description: |
                    The batch size in bytes.
                  type: integer
                shards:
                  description: |
                    A list of shards to read from.
                  type: array
                  items:
                    type: string
              required:
                - batchSize
                - shards

      responses:
        '204':
          description: |
            Returns an opaque string that uniquely identifies the dump context
            for this DB-Server.
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    description: |
                      Flag if there was an error (true) or not (false).
                    type: boolean
                  code:
                    description: |
                      The response code.
                    type: integer
      tags:
        - Dump
```
