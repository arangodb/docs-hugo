---
fileID: data-modeling-documents-document-methods
title: Collection Methods
weight: 80
description: 
layout: default
---
`edge-collection.outEdges(vertices)`

The `outEdges()` operator finds all edges starting from (outbound) a document
from `vertices`, which must a list of documents or document handles.

**Examples**

    
 {{< tabs >}}
{{% tab name="js" %}}
```js
---
name: EDGCOL_02_outEdges
description: ''
render: input/output
version: '3.11'
release: stable
---
  db._create("vertex");
  db._createEdgeCollection("relation");
~ var myGraph = {};
  myGraph.v1 = db.vertex.insert({ name : "vertex 1" });
  myGraph.v2 = db.vertex.insert({ name : "vertex 2" });
  myGraph.e1 = db.relation.insert(myGraph.v1, myGraph.v2,
  { label : "knows"});
  db._document(myGraph.e1);
  db.relation.outEdges(myGraph.v1._id);
  db.relation.outEdges(myGraph.v2._id);
~ db._drop("relation");
~ db._drop("vertex");
```
{{% /tab %}}
{{< /tabs >}}
 
    
    

## Misc

`collection.iterate(iterator, options)`

{{% hints/warning %}}
The `iterate()` method is deprecated from version 3.11.0 onwards and will be
removed in a future version.
{{% /hints/warning %}}

Iterates over some elements of the collection and apply the function
`iterator` to the elements. The function will be called with the
document as first argument and the current number (starting with 0)
as second argument.

`options` must be an object with the following attributes:

  - `limit` (optional, default none): use at most `limit` documents.

  - `probability` (optional, default all): a number between `0` and
    `1`. Documents are chosen with this probability.

**Examples**

Pick 1 out of 4 documents of a collection but at most 5:

    
 {{< tabs >}}
{{% tab name="js" %}}
```js
---
name: collectionIterate
description: ''
render: input/output
version: '3.11'
release: stable
---
~ db._create("example");
  var arr = [];
  for (var i = 0;  i < 10;  i++) {
    arr.push({ i });
  }
  var meta = db.example.save(arr);
  var data = [];
  db.example.iterate( (doc, idx) => data.push({ idx, i: doc.i }), { probability: 0.25, limit: 5 });
  data;
~ db._drop("example");
```
{{% /tab %}}
{{< /tabs >}}
 
    
    
