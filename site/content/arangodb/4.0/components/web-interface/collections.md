---
title: Collections
menuTitle: Collections
weight: 15
description: ''
---
The collections section displays all available collections. From here you can
create new collections and jump into a collection for details (click on a
collection tile).

Functions:

 - Create collections
 - Filter by collection properties
 - Show collection details (click row)

Information:

 - Collection name
 - Collection type
 - Collection source (system or custom)
 - Collection status

## Collection

There are four view categories: 

- Content:
   - Create a document
   - Delete a document
   - Filter documents
   - Download documents
   - Upload documents

- Indexes:
   - Create indexes
   - Delete indexes

- Info:
   - Detailed collection information and statistics 

- Settings:
   - Configure name, journal size, index buckets, wait for sync 
   - Delete collection 
   - Truncate collection 
   - Unload/Load collection 
   - Save modified properties (name, journal size, index buckets, wait for sync) 

Additional information:

Upload format:

I. Line-wise

```js
{ "_key": "key1", ... }
{ "_key": "key2", ... }
```

II. JSON documents in a list

```js
[
  { "_key": "key1", ... },
  { "_key": "key2", ... }
]
```
