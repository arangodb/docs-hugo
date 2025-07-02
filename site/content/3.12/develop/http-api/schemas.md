---

title: HTTP interface for database structures (schema, graph, view)
menuTitle: Schemas
description: >-
   HTTP interface for database structures gives you information about 
   graphs, views, collections and schemas in the database.
# GET /_api/schema
# GET /_api/schema/graph/{graph-name}
# GET /_api/schema/view/{view-name}
# GET /_api/schema/collection/{collection-name}

---

The interface provides the means to collect information on database 
structures including graphs, views, collections and their schemas 
at one stop. This information is helpful if you want to understand 
the overall shape and structure of the database.

---

## Information the interface gives you
1. **graphs** – each graph shows its name and how it connects collections using edges (`_from` and `_to`).
2. **views** – each view shows its name and which collections and fields it links to.
3. **collections** – each collection shows:
    - a list of attributes (fields)
    - the data types of each attribute (`string`, `number`, `bool`, or `object`)
    - whether the attribute is optional (meaning some documents/edges may not have it)
    - and example documents or edges for reference

---

## Paths the interface supports
1. [**GET /_api/schema**](#api-schema-graphgraph-name) - Gives you all the information above on the database.
1. [**GET /_api/schema/graph/&lt;graph-name&gt;**](#api-schema-graphgraph-name) - Provides the specified graph and the connected collections. 
2. [**GET /_api/schema/view/&lt;view-name&gt;**](#api-schema-viewview-name) - Shows the specified view and the linked collections.
3. [**GET /_api/schema/collection/&lt;collection-name&gt;**](#api-schema-collectioncollection-name) - Displays the specified collection.

---

## GET /_api/schema

```openapi
paths:
   /_db/{database-name}/_api/schema:
      get:
         operationId: getAllSchemas
         description: |
            Show all the information on the database including graphs, views and collections.
         parameters:
            - name: database-name
              in: path
              required: true
              example: _system
              description: |
                The name of a database that you want to examine its structures and schemas.
              schema:
                type: string
                
            - name: sampleNum
              in: query
              required: false
              description: |
                The number of documents/edges to examine per collection when determining
                attribute types and whether an attribute is optional.
                Must be a positive integer. Defaults to `100`.
                If larger than the number of documents, it will only use the available ones.
              schema:
                type: integer
                minimum: 1
                default: 100
            
            - name: exampleNum
              in: query
              required: false
              description: |
                The number of example documents/edges to return per collection.
                Must be a non-negative integer and not be larger than `sampleNum`.
                If `0`, no examples will be returned. Defaults to `1`.
              schema:
                type: integer
                minimum: 0
                default: 1
         
         responses:
            '200 OK':
               description: |
                  The schema overview was successfully returned.
            '400 Bad Request':
               description: |
                  Invalid query parameters (e.g., negative or non-numeric values).
            '404 Not Found':
               description: |
                  Collection, view or graph not found on the database.
            '405 Method Not Allowed':
               description: |
                  When request method is not GET. This endpoint only supports GET.
            '500 Internal Server Error':
               description: |
                  Internal server error.
         tags:
            - Schema
```

**Examples**
<summary>HTTP Request</summary>

```http request
GET /_db/_system/_api/schema?sampleNum=100&exampleNum=1
```
<details>
<summary>HTTP Response (click to show)</summary>

```json
{
  "graphs": [
    {
      "name": "purchaseHistory",
      "relations": [
        {
          "collection": "purchased",
          "from": [
            "customers"
          ],
          "to": [
            "products"
          ]
        }
      ]
    },
    {
      "name": "manufacture",
      "relations": [
        {
          "collection": "manufactured",
          "from": [
            "company"
          ],
          "to": [
            "products"
          ]
        }
      ]
    }
  ],
  "views": [
    {
      "viewName": "descView",
      "links": [
        {
          "collectionName": "customers",
          "fields": [
            {
              "attribute": "comment",
              "analyzers": [
                "text_en"
              ]
            }
          ]
        },
        {
          "collectionName": "products",
          "fields": [
            {
              "attribute": "description",
              "analyzers": [
                "text_en"
              ]
            }
          ]
        }
      ]
    }
  ],
  "collections": [
    {
      "collectionName": "company",
      "collectionType": "document",
      "numOfDocuments": 3,
      "schema": [
        {
          "attribute": "_id",
          "types": [
            "string"
          ],
          "optional": false
        },
        {
          "attribute": "_key",
          "types": [
            "string"
          ],
          "optional": false
        },
        {
          "attribute": "address",
          "types": [
            "string"
          ],
          "optional": false
        },
        {
          "attribute": "established",
          "types": [
            "number",
            "string"
          ],
          "optional": false
        },
        {
          "attribute": "name",
          "types": [
            "string"
          ],
          "optional": false
        },
        {
          "attribute": "public",
          "types": [
            "bool"
          ],
          "optional": true
        }
      ],
      "examples": [
        {
          "_id": "company/224680",
          "_key": "224680",
          "address": "San Francisco",
          "established": 1989,
          "name": "Company A"
        }
      ]
    },
    {
      "collectionName": "customers",
      "collectionType": "document",
      "numOfDocuments": 10,
      "schema": [
        {
          "attribute": "_id",
          "types": [
            "string"
          ],
          "optional": false
        },
        {
          "attribute": "_key",
          "types": [
            "string"
          ],
          "optional": false
        },
        {
          "attribute": "address",
          "types": [
            "string",
            "object"
          ],
          "optional": true
        },
        {
          "attribute": "age",
          "types": [
            "number",
            "string"
          ],
          "optional": false
        },
        {
          "attribute": "comment",
          "types": [
            "string"
          ],
          "optional": true
        },
        {
          "attribute": "name",
          "types": [
            "string"
          ],
          "optional": false
        }
      ],
      "examples": [
        {
          "_id": "customers/263",
          "_key": "263",
          "age": 35,
          "name": "Ken"
        }
      ]
    },
    {
      "collectionName": "manufactured",
      "collectionType": "edge",
      "numOfEdges": 2,
      "schema": [
        {
          "attribute": "_from",
          "types": [
            "string"
          ],
          "optional": false
        },
        {
          "attribute": "_id",
          "types": [
            "string"
          ],
          "optional": false
        },
        {
          "attribute": "_key",
          "types": [
            "string"
          ],
          "optional": false
        },
        {
          "attribute": "_to",
          "types": [
            "string"
          ],
          "optional": false
        },
        {
          "attribute": "amount",
          "types": [
            "number"
          ],
          "optional": false
        }
      ],
      "examples": [
        {
          "_from": "company/224680",
          "_id": "manufactured/224827",
          "_key": "224827",
          "_to": "products/32291",
          "amount": 1200
        }
      ]
    },
    {
      "collectionName": "products",
      "collectionType": "document",
      "numOfDocuments": 5,
      "schema": [
        {
          "attribute": "_id",
          "types": [
            "string"
          ],
          "optional": false
        },
        {
          "attribute": "_key",
          "types": [
            "string"
          ],
          "optional": false
        },
        {
          "attribute": "description",
          "types": [
            "string"
          ],
          "optional": false
        },
        {
          "attribute": "name",
          "types": [
            "string"
          ],
          "optional": false
        },
        {
          "attribute": "price",
          "types": [
            "number"
          ],
          "optional": false
        },
        {
          "attribute": "version",
          "types": [
            "string"
          ],
          "optional": true
        }
      ],
      "examples": [
        {
          "_id": "products/32235",
          "_key": "32235",
          "description": "This car was made in Japan, and used",
          "name": "car",
          "price": 120.95
        }
      ]
    },
    {
      "collectionName": "purchased",
      "collectionType": "edge",
      "numOfEdges": 1,
      "schema": [
        {
          "attribute": "_from",
          "types": [
            "string"
          ],
          "optional": false
        },
        {
          "attribute": "_id",
          "types": [
            "string"
          ],
          "optional": false
        },
        {
          "attribute": "_key",
          "types": [
            "string"
          ],
          "optional": false
        },
        {
          "attribute": "_to",
          "types": [
            "string"
          ],
          "optional": false
        },
        {
          "attribute": "date",
          "types": [
            "string"
          ],
          "optional": false
        }
      ],
      "examples": [
        {
          "_from": "customers/273",
          "_id": "purchased/100727",
          "_key": "100727",
          "_to": "products/32235",
          "date": "5/25/2026"
        }
      ]
    }
  ]
}
```
</details>

---

## GET /_api/schema/graph/{graph-name}

```openapi
paths:
   /_db/{database-name}/_api/schema/graph/{graph-name}:
      get:
         operationId: getGraph
         description: |
            Show the specified graph information and its connected colletions.
         parameters:
            - name: database-name
              in: path
              required: true
              example: _system
              description: |
                The name of a database that you want to examine its structures and schemas.
              schema:
                type: string
            
            - name: graph-name
              in: path
              required: true
              description: |
                The name of a graph that you want to examine its structures and schemas.
              schema:
                type: string
                
            - name: sampleNum
              in: query
              required: false
              description: |
                The number of documents/edges to examine per collection
                when determining attribute types and whether an attribute is optional.
                Must be a positive integer. Defaults to `100`.
                If larger than the number of documents, it will only use the available ones.
              schema:
                type: integer
                minimum: 1
                default: 100
            
            - name: exampleNum
              in: query
              required: false
              description: |
                The number of example documents/edges to return per collection.
                Must be a non-negative integer and not be larger than `sampleNum`.
                If `0`, no examples will be returned. Defaults to `1`.
              schema:
                type: integer
                minimum: 0
                default: 1
         
         responses:
            '200 OK':
               description: |
                  The schema overview was successfully returned.
            '400 Bad Request':
               description: |
                  Invalid query parameters (e.g., negative or non-numeric values).
            '404 Not Found':
               description: |
                  Unknown path suffix (e.g., /schema/foo/bar). Collection or graph not found on the database.
            '405 Method Not Allowed':
               description: |
                  When request method is not GET. This endpoint only supports GET.
            '500 Internal Server Error':
               description: |
                  Internal server error.
         tags:
            - Schema
```

**Examples**
<summary>HTTP Request</summary>

```http request
GET /_db/_system/_api/schema/graph/purchaseHistory?sampleNum=100&exampleNum=1
```
<details>
<summary>HTTP Response (click to show)</summary>

```json
{
  "graphs": [
    {
      "name": "purchaseHistory",
      "relations": [
        {
          "collection": "purchased",
          "from": [
            "customers"
          ],
          "to": [
            "products"
          ]
        }
      ]
    }
  ],
  "collections": [
    {
      "collectionName": "customers",
      "collectionType": "document",
      "numOfDocuments": 10,
      "schema": [
        {
          "attribute": "_id",
          "types": [
            "string"
          ],
          "optional": false
        },
        {
          "attribute": "_key",
          "types": [
            "string"
          ],
          "optional": false
        },
        {
          "attribute": "address",
          "types": [
            "string",
            "object"
          ],
          "optional": true
        },
        {
          "attribute": "age",
          "types": [
            "number",
            "string"
          ],
          "optional": false
        },
        {
          "attribute": "comment",
          "types": [
            "string"
          ],
          "optional": true
        },
        {
          "attribute": "name",
          "types": [
            "string"
          ],
          "optional": false
        }
      ],
      "examples": [
        {
          "_id": "customers/263",
          "_key": "263",
          "age": 35,
          "name": "Ken"
        }
      ]
    },
    {
      "collectionName": "products",
      "collectionType": "document",
      "numOfDocuments": 5,
      "schema": [
        {
          "attribute": "_id",
          "types": [
            "string"
          ],
          "optional": false
        },
        {
          "attribute": "_key",
          "types": [
            "string"
          ],
          "optional": false
        },
        {
          "attribute": "description",
          "types": [
            "string"
          ],
          "optional": false
        },
        {
          "attribute": "name",
          "types": [
            "string"
          ],
          "optional": false
        },
        {
          "attribute": "price",
          "types": [
            "number"
          ],
          "optional": false
        },
        {
          "attribute": "version",
          "types": [
            "string"
          ],
          "optional": true
        }
      ],
      "examples": [
        {
          "_id": "products/32235",
          "_key": "32235",
          "description": "This car was made in Japan, and used",
          "name": "car",
          "price": 120.95
        }
      ]
    },
    {
      "collectionName": "purchased",
      "collectionType": "edge",
      "numOfEdges": 1,
      "schema": [
        {
          "attribute": "_from",
          "types": [
            "string"
          ],
          "optional": false
        },
        {
          "attribute": "_id",
          "types": [
            "string"
          ],
          "optional": false
        },
        {
          "attribute": "_key",
          "types": [
            "string"
          ],
          "optional": false
        },
        {
          "attribute": "_to",
          "types": [
            "string"
          ],
          "optional": false
        },
        {
          "attribute": "date",
          "types": [
            "string"
          ],
          "optional": false
        }
      ],
      "examples": [
        {
          "_from": "customers/273",
          "_id": "purchased/100727",
          "_key": "100727",
          "_to": "products/32235",
          "date": "5/25/2026"
        }
      ]
    }
  ]
}
```
</details>

---

## GET /_api/schema/view/{view-name}

```openapi
paths:
   /_db/{database-name}/_api/schema/view/{view-name}:
      get:
         operationId: getView
         description: |
            Show the specified view information and its linked colletions.
         parameters:
            - name: database-name
              in: path
              required: true
              example: _system
              description: |
                The name of a database that you want to examine its structures and schemas.
              schema:
                type: string
            
            - name: view-name
              in: path
              required: true
              description: |
                The name of a view that you want to examine its structures and schemas.
              schema:
                type: string
                
            - name: sampleNum
              in: query
              required: false
              description: |
                The number of documents/edges to examine per collection
                when determining attribute types and whether an attribute is optional.
                Must be a positive integer. Defaults to `100`.
                If larger than the number of documents, it will only use the available ones.
              schema:
                type: integer
                minimum: 1
                default: 100
            
            - name: exampleNum
              in: query
              required: false
              description: |
                The number of example documents/edges to return per collection.
                Must be a non-negative integer and not be larger than `sampleNum`.
                If `0`, no examples will be returned. Defaults to `1`.
              schema:
                type: integer
                minimum: 0
                default: 1
         
         responses:
            '200 OK':
               description: |
                  The schema overview was successfully returned.
            '400 Bad Request':
               description: |
                  Invalid query parameters (e.g., negative or non-numeric values).
            '404 Not Found':
               description: |
                  Unknown path suffix (e.g., /schema/foo/bar). Collection or view not found on the database.
            '405 Method Not Allowed':
               description: |
                  When request method is not GET. This endpoint only supports GET.
            '500 Internal Server Error':
               description: |
                  Internal server error.
         tags:
            - Schema
```

**Examples**
<summary>HTTP Request</summary>

```http request
GET /_db/_system/_api/schema/view/descViewy?sampleNum=100&exampleNum=1
```
<details>
<summary>HTTP Response (click to show)</summary>

```json
{
  "views": [
    {
      "viewName": "descView",
      "links": [
        {
          "collectionName": "customers",
          "fields": [
            {
              "attribute": "comment",
              "analyzers": [
                "text_en"
              ]
            }
          ]
        },
        {
          "collectionName": "products",
          "fields": [
            {
              "attribute": "description",
              "analyzers": [
                "text_en"
              ]
            }
          ]
        }
      ]
    }
  ],
  "collections": [
    {
      "collectionName": "customers",
      "collectionType": "document",
      "numOfDocuments": 10,
      "schema": [
        {
          "attribute": "_id",
          "types": [
            "string"
          ],
          "optional": false
        },
        {
          "attribute": "_key",
          "types": [
            "string"
          ],
          "optional": false
        },
        {
          "attribute": "address",
          "types": [
            "string",
            "object"
          ],
          "optional": true
        },
        {
          "attribute": "age",
          "types": [
            "number",
            "string"
          ],
          "optional": false
        },
        {
          "attribute": "comment",
          "types": [
            "string"
          ],
          "optional": true
        },
        {
          "attribute": "name",
          "types": [
            "string"
          ],
          "optional": false
        }
      ],
      "examples": [
        {
          "_id": "customers/263",
          "_key": "263",
          "age": 35,
          "name": "Ken"
        }
      ]
    },
    {
      "collectionName": "products",
      "collectionType": "document",
      "numOfDocuments": 5,
      "schema": [
        {
          "attribute": "_id",
          "types": [
            "string"
          ],
          "optional": false
        },
        {
          "attribute": "_key",
          "types": [
            "string"
          ],
          "optional": false
        },
        {
          "attribute": "description",
          "types": [
            "string"
          ],
          "optional": false
        },
        {
          "attribute": "name",
          "types": [
            "string"
          ],
          "optional": false
        },
        {
          "attribute": "price",
          "types": [
            "number"
          ],
          "optional": false
        },
        {
          "attribute": "version",
          "types": [
            "string"
          ],
          "optional": true
        }
      ],
      "examples": [
        {
          "_id": "products/32235",
          "_key": "32235",
          "description": "This car was made in Japan, and used",
          "name": "car",
          "price": 120.95
        }
      ]
    }
  ]
}
```
</details>

---

## GET /_api/schema/collection/{collection-name}

```openapi
paths:
   /_db/{database-name}/_api/schema/collection/{collection-name}:
      get:
         operationId: getCollection
         description: |
            Show the specified collection information and its schemas.
         parameters:
            - name: database-name
              in: path
              required: true
              example: _system
              description: |
                The name of a database that you want to examine its structures and schemas.
              schema:
                type: string
            
            - name: collection-name
              in: path
              required: true
              description: |
                The name of a collection that you want to examine its schemas.
              schema:
                type: string
                
            - name: sampleNum
              in: query
              required: false
              description: |
                The number of documents/edges to examine per collection
                when determining attribute types and whether an attribute is optional.
                Must be a positive integer. Defaults to `100`.
                If larger than the number of documents, it will only use the available ones.
              schema:
                type: integer
                minimum: 1
                default: 100
            
            - name: exampleNum
              in: query
              required: false
              description: |
                The number of example documents/edges to return per collection.
                Must be a non-negative integer and not be larger than `sampleNum`.
                If `0`, no examples will be returned. Defaults to `1`.
              schema:
                type: integer
                minimum: 0
                default: 1
         
         responses:
            '200 OK':
               description: |
                  The schema overview was successfully returned.
            '400 Bad Request':
               description: |
                  Invalid query parameters (e.g., negative or non-numeric values).
            '404 Not Found':
               description: |
                  Unknown path suffix (e.g., /schema/foo/bar). Collection not found on the database.
            '405 Method Not Allowed':
               description: |
                  When request method is not GET. This endpoint only supports GET.
            '500 Internal Server Error':
               description: |
                  Internal server error.
         tags:
            - Schema
```

**Examples**
<summary>HTTP Request</summary>

```http request
GET /_db/_system/_api/schema/view/descViewy?sampleNum=100&exampleNum=1
```
<details>
<summary>HTTP Response (click to show)</summary>

```json
{
      "collectionName": "products",
      "collectionType": "document",
      "numOfDocuments": 5,
      "schema": [
        {
          "attribute": "_id",
          "types": [
            "string"
          ],
          "optional": false
        },
        {
          "attribute": "_key",
          "types": [
            "string"
          ],
          "optional": false
        },
        {
          "attribute": "description",
          "types": [
            "string"
          ],
          "optional": false
        },
        {
          "attribute": "name",
          "types": [
            "string"
          ],
          "optional": false
        },
        {
          "attribute": "price",
          "types": [
            "number"
          ],
          "optional": false
        },
        {
          "attribute": "version",
          "types": [
            "string"
          ],
          "optional": true
        }
      ],
      "examples": [
        {
          "_id": "products/32235",
          "_key": "32235",
          "description": "This car was made in Japan, and used",
          "name": "car",
          "price": 120.95
        }
      ]
    }
```
</details>