---
fileID: data-modeling-collections-database-methods
title: Database Methods
weight: 65
description: 
layout: default
---
`db._truncate(collection-name)`

Truncates a collection named `collection-name`. No error is thrown if
there is no such collection.

**Examples**

Truncates a collection:

    
 {{< tabs >}}
{{% tab name="js" %}}
```js
---
name: collectionDatabaseTruncateByObject
description: ''
render: input/output
version: '3.11'
release: stable
---
~ db._create("example");
  col = db.example;
  col.save({ "Hello" : "World" });
  col.count();
  db._truncate(col);
  col.count();
~ db._drop("example");
```
{{% /tab %}}
{{< /tabs >}}
 
    
    

Truncates a collection identified by name:

    
 {{< tabs >}}
{{% tab name="js" %}}
```js
---
name: collectionDatabaseTruncateName
description: ''
render: input/output
version: '3.11'
release: stable
---
~ db._create("example");
  col = db.example;
  col.save({ "Hello" : "World" });
  col.count();
  db._truncate("example");
  col.count();
~ db._drop("example");
```
{{% /tab %}}
{{< /tabs >}}
 
    
    
