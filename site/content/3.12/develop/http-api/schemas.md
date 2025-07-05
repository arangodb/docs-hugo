---
title: HTTP interface for sampled schemas of collection in graph and view.
menuTitle: Schemas
weight: 15
description: >-
   This HTTP interface gives you sampled document and edge structures
   for collections connected by graphs or linked by views. The interface
   also supports API paths to inspect individual graphs, views and collections.
---
This interface gives you a unified overview of the structure of graphs and views,
along with sampled schemas for the involved collections.  
The interface also supports API paths to inspect a specific graph, view, or collection individually.
---

### Get all graphs, views, collections and their schemas

```openapi
paths:
   /_db/{database-name}/_api/schema:
      get:
         operationId: listSchemas
         description: |
            Show all graphs, views and collections in the database along with their sampled schemas.
            - Each graph shows its name and how it connects collections using edges (`_from` and `_to`).
            - Each view shows its name and which collections and fields it links to.
            - Each collections shows a list of attribute, the data types of each attribute,
              whether the attribute is optional (meaning some documents/edges mat not have it),
              and example documents or edges for reference.
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
                If set to `0`, no examples are returned. Defaults to `1`.
              schema:
                type: integer
                minimum: 0
                default: 1
         
         responses:
            '200':
               description: |
                  The schema overview was successfully returned.
            '400':
               description: |
                  Invalid query parameters (e.g., negative or non-numeric values).
            '500':
               description: |
                  Internal server error.
         tags:
            - Schema
```

**Examples**

```curl
---
description: Create a graph, view and collections, insert sample documents, and fetch their schema
name: create_graph_view_and_collection_and_get_schema
---
var cn1 = "customers";
var cn2 = "restaurants";
var cn3 = "reviewed";
var gn = "reviewGraph";
var vn = "restaurantView";

var gm = require("@arangodb/general-graph");

try { db._drop(cn1); } catch (e) {}
try { db._drop(cn2); } catch (e) {}
try { db._drop(cn3); } catch (e) {}
try { gm._drop(gn, true); } catch (e) {}
try { db._dropView(vn); } catch (e) {}

var coll1 = db._create(cn1, { waitForSync: true });
coll1.save({_key: "Alice", name: "Alice", age: 20, address: "Cologne"});
coll1.save({_key: "Bob", name: "Bob", age: 30, address: "San Francisco"});
coll1.save({_key: "Charlie", name: "Charlie", age: 40, address: "Tokyo"});

var coll2 = db._create(cn2, { waitForSync: true });
coll2.save({_key: "Italian", name: "Italian Restaurant", address: "Milano", description: "Traditional Italian"});
coll2.save({_key: "American", name: "American Diner", address: "New York", description: "Typical American"});
coll2.save({_key: "Sushi", name: "Sushi Bar", address: "Kyoto", description: "Casual Japanese"});

gm._create(gn, [gm._relation(cn3, cn1, cn2)]);
var graph = gm._graph(gn);
graph.reviewed.save({_from: "customers/Alice", _to: "restaurants/Italian", rating: 5});
graph.reviewed.save({_from: "customers/Bob", _to: "restaurants/American", rating: 4});
graph.reviewed.save({_from: "customers/Charlie", _to: "restaurants/Sushi", rating: 3});

db._createView(vn, "arangosearch", { links: { 
   restaurants : { 
      fields: { 
         description: { 
            analyzers: ["text_en"] 
         } 
      } 
   } 
}});

var url = "/_api/schema";
var response = logCurlRequest('GET', url);
assert(response.code === 200);
logJsonResponse(response);

db._drop(cn1);
db._drop(cn2);
db._drop(cn3);
gm._drop(gn, true);
db._dropView(vn);
```

---


### Get a graph, its connected collections, and their schemas

```openapi
paths:
   /_db/{database-name}/_api/schema/graph/{graph-name}:
      get:
         operationId: listGraphsAndSchemas
         description: |
            Show the specified graph and its connected colletions along with their sampled schemas.
            - The graph shows its name and how it connects collections using edges (`_from` and `_to`).
            - Each collection shows a list of attributes, the data types of each attribute,
              whether the attribute is optional (meaning some documents/edges may not have it),
              and example documents or edges for reference.
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
                If set to `0`, no examples are returned. Defaults to `1`.
              schema:
                type: integer
                minimum: 0
                default: 1
         
         responses:
            '200':
               description: |
                  The schema overview was successfully returned.
            '400':
               description: |
                  Invalid query parameters (e.g., negative or non-numeric values).
            '404':
               description: |
                  Unknown path suffix (e.g., /schema/foo/bar). Collection or graph not found on the database.
            '500':
               description: |
                  Internal server error.
         tags:
            - Schema
```

**Examples**

```curl
---
description: Create a graph and collections, insert sample documents, and fetch their schema
name: create_graph_and_collection_and_get_schema
---
var cn1 = "customers";
var cn2 = "restaurants";
var cn3 = "reviewed";
var gn = "reviewGraph";

var gm = require("@arangodb/general-graph");

try { db._drop(cn1); } catch (e) {}
try { db._drop(cn2); } catch (e) {}
try { db._drop(cn3); } catch (e) {}
try { gm._drop(gn, true); } catch (e) {}

var coll1 = db._create(cn1, { waitForSync: true });
coll1.save({_key: "Alice", name: "Alice", age: 20, address: "Cologne"});
coll1.save({_key: "Bob", name: "Bob", age: 30, address: "San Francisco"});
coll1.save({_key: "Charlie", name: "Charlie", age: 40, address: "Tokyo"});

var coll2 = db._create(cn2, { waitForSync: true });
coll2.save({_key: "Italian", name: "Italian Restaurant", address: "Milano", description: "Traditional Italian"});
coll2.save({_key: "American", name: "American Diner", address: "New York", description: "Typical American"});
coll2.save({_key: "Sushi", name: "Sushi Bar", address: "Kyoto", description: "Casual Japanese"});

gm._create(gn, [gm._relation(cn3, cn1, cn2)]);
var graph = gm._graph(gn);
graph.reviewed.save({_from: "customers/Alice", _to: "restaurants/Italian", rating: 5});
graph.reviewed.save({_from: "customers/Bob", _to: "restaurants/American", rating: 4});
graph.reviewed.save({_from: "customers/Charlie", _to: "restaurants/Sushi", rating: 3});

var url = "/_api/schema/graph/" + gn;
var response = logCurlRequest('GET', url);
assert(response.code === 200);
logJsonResponse(response);

db._drop(cn1);
db._drop(cn2);
db._drop(cn3);
gm._drop(gn, true);
```
---

### Get a view, its linked collections, and their schemas

```openapi
paths:
   /_db/{database-name}/_api/schema/view/{view-name}:
      get:
         operationId: listViewsAndSchemas
         description: |
            Show the specified view and its linked collections along with their sample schemas
            - The view shows its name and which collections and fields it links to.
            - Each collection shows a list of attributes, the data types of each attribute
              whether the attribute is optional (meaning some documents/edges may not have it),
              and example documents or edges for reference
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
                If set to `0`, no examples are returned. Defaults to `1`.
              schema:
                type: integer
                minimum: 0
                default: 1
         
         responses:
            '200':
               description: |
                  The schema overview was successfully returned.
            '400':
               description: |
                  Invalid query parameters (e.g., negative or non-numeric values).
            '404':
               description: |
                  Unknown path suffix (e.g., /schema/foo/bar). Collection or view not found on the database.
            '500':
               description: |
                  Internal server error.
         tags:
            - Schema
```

**Examples**

```curl
---
description: Create a view and collections, insert sample documents, and fetch their schema
name: create_view_and_collection_and_get_schema
---
var cn = "restaurants";
var vn = "restaurantView";
try { db._drop(cn); } catch (e) {}
try { db._dropView(vn); } catch (e) {}

var coll = db._create(cn, { waitForSync: true });
coll.save({name: "Italian Restaurant", address: "Milano", description: "Traditional Italian"});
coll.save({name: "American Diner", address: "New York", description: "Typical American"});
coll.save({name: "Sushi Bar", address: "Kyoto", description: "Casual Japanese"});

db._createView(vn, "arangosearch", { links: { 
   restaurants : { 
      fields: { 
         description: { 
            analyzers: ["text_en"] 
         } 
      } 
   } 
}});

var url = "/_api/schema/view/" + vn;
var response = logCurlRequest('GET', url);
assert(response.code === 200);
logJsonResponse(response);

db._dropView(vn);
db._drop(cn)
```

---

### Get a collection, and its schemas

```openapi
paths:
   /_db/{database-name}/_api/schema/collection/{collection-name}:
      get:
         operationId: listCollectionAndSchemas
         description: |
            Show the specified collection and its sampled schemas.
            The schema shows a list of attributes (fields), the data types of each attribute
            whether the attribute is optional (meaning some documents/edges may not have it),
            and example documents or edges for reference
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
                If set to `0`, no examples are returned. Defaults to `1`.
              schema:
                type: integer
                minimum: 0
                default: 1
         
         responses:
            '200':
               description: |
                  The schema overview was successfully returned.
            '400 ':
               description: |
                  Invalid query parameters (e.g., negative or non-numeric values).
            '404':
               description: |
                  Unknown path suffix (e.g., /schema/foo/bar). Collection not found on the database.
            '500':
               description: |
                  Internal server error.
         tags:
            - Schema
```

**Examples**

```curl
---
description: Create a collection, insert sample documents, and fetch its schema
name: create_collection_and_get_schema
---
var cn = "customers";
try { db._drop(cn); } catch (e) {}

var coll = db._create(cn, { waitForSync: true });
coll.save({name: "Alice", age: 20, address: "Cologne"});
coll.save({name: "Bob", age: 30, address: "San Francisco"});
coll.save({name: "Charlie", age: 40, address: "Tokyo"});

var url = "/_api/schema/collection/" + cn;

var response = logCurlRequest('GET', url);

assert(response.code === 200);

logJsonResponse(response);
db._drop(cn);
```