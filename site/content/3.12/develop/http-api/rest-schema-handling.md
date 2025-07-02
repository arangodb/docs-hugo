---
title: GET Schema Endpoint
menuTitle: http-api
description: Returns information about graphs, views, and collections in the database.
---

## GET Schema Endpoint `/_api/schema`

### Introduction
This endpoint shows the structure of the current database. It returns three types of information:

1. **graphs** – each graph shows its name and how it connects collections using edges (`_from` and `_to`).
2. **views** – each view shows its name and which collections and fields it links to.
3. **collections** – each collection shows:
    - a list of attributes (fields)
    - the data types of each attribute (`string`, `number`, `bool`, or `object`)
    - whether the attribute is optional (meaning some documents/edges may not have it)
    - and example documents or edges for reference

This information is helpful if you want to understand the overall shape and structure of the data in the database.
Additionally, this endpoint also support the following paths:
1. [**/_api/schema/graph/&lt;graph-name&gt;**](#api-schema-graphgraph-name)
2. [**/_api/schema/view/&lt;view-name&gt;**](#api-schema-viewview-name)
3. [**/_api/schema/collection/&lt;collection-name&gt;**](#api-schema-collectioncollection-name)

---

### Parameters

The endpoint supports two optional query parameters:

#### `sampleNum` (default value: 100)

- This tells the endpoint how many documents/edges to look at when examining the schema of each collection.
- For example, if `sampleNum` is 100, it will examine up to 100 documents/edges from each collection.
- That is, the more samples you use, the more accurate the schema result becomes.
- If a collection has fewer documents/edges than the number you pass, it will just use all of them.
- This must be a **natural number**.
- If you pass `0`, a negative number, a decimal, or a non-number, it will result in an error.

#### `exampleNum` (default value: 1)

- This controls how many example documents/edges will be shown for each collection.
- If you set it to `0`, no examples will be shown.
- If the number is larger than the actual number of documents/edges, it will just show all of them.
- Like `sampleNum`, this must be a non-negative whole number. Invalid input will cause an error.

---

### Example Request and Response
#### HTTP Request
```http request
GET /_db/<database-name>/_api/schema?sampleNum=100&exampleNum=1
```
#### HTTP Response (JSON format)
```http response
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

### /_api/schema/graph/<graph-name>

This endpoint returns the structure of a specific graph, including its edge definitions and the `_from` and `_to` collections.

#### Example Request
```http request
GET /_db/<database-name>/_api/schema/graph/purchaseHistory?sampleNum=100&exampleNum=1
```
#### Example Response (JSON format)
```http response
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

### /_api/schema/view/<view-name>

This endpoint shows the configuration of an specified ArangoSearch view, including its linked collections and fields.

#### Example Request
```http request
GET /_db/<database-name>/_api/schema/view/descView?sampleNum=100&exampleNum=1
```
#### Example Response (JSON format)
```http response
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
### /_api/schema/collection/<collection-name>

This endpoint returns schema information for a specific collection, such as attribute names, types, and example documents.

#### Example Request
```http request
GET /_db/<database-name>/_api/schema/collection/products?sampleNum=100&exampleNum=1
```
#### Example Response (JSON format)
```http response
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