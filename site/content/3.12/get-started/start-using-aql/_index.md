---
title: Start using AQL
menuTitle: Start using AQL
weight: 52
description: >-
  Learn how to run your first queries written in ArangoDB's Query Language
  and how to go from there, using a Game of Thrones dataset
---
This is an introduction to ArangoDB's query language AQL, built around a small
dataset of characters from the novel and fantasy drama television series
Game of Thrones (as of season 1). It includes character traits in two languages,
some family relations, and last but not least a small set of filming locations,
which makes for an interesting mix of data to work with.

There is no need to import the data before you start. It is provided as part
of the AQL queries in this tutorial. You can interact with ArangoDB using its
built-in web interface to manage collections and execute the queries with ease,
but you may also use a different interface.

## How to run AQL queries

{{< tabs "interfaces" >}}

{{< tab "Web interface" >}}
ArangoDB's web interface has a **Queries** section for
[executing AQL queries](../../aql/how-to-invoke-aql/with-the-web-interface.md).

1. If necessary, [switch to the database](../../concepts/data-structure/databases.md#set-the-database-context)
   that you want to run queries in.
2. Click **Queries** in the main navigation.
3. Enter an AQL query in the code editor, e.g. `RETURN CONCAT("Hello, ", @name)`.
4. Specify any needed bind parameters in the panel on the right-hand side on the
   **Bind Variables** tab, e.g. set `name` to a value of `AQL`.
5. Optionally set query options on the **Options** tab.
6. Click the **Execute** button or hit `Ctrl`/`Cmd` + `Return`.
{{< /tab >}}

{{< tab "arangosh" >}}
You can run AQL queries from the ArangoDB Shell (arangosh)
with the [`db._query()`](../../aql/how-to-invoke-aql/with-arangosh.md#with-db_query) and
[`db._createStatement()`](../../aql/how-to-invoke-aql/with-arangosh.md#with-db_createstatement-arangostatement)
methods of the [`db` object](../../develop/javascript-api/@arangodb/db-object.md).

If you use Foxx, see [how to write database queries](../../develop/foxx-microservices/getting-started.md#writing-database-queries)
for examples including tagged template strings.

```js
---
name: arangosh_execute_query_bindvars
description: ''
---
db._query(`RETURN CONCAT("Hello, ", @name)`, { name: "AQL" }).toArray();
// -- or --
var name = "AQL";
db._query(aql`RETURN CONCAT("Hello, ", ${name})`).toArray();
```
See [`db._query()`](../../develop/javascript-api/@arangodb/db-object.md#db_queryquerystring--bindvars--mainoptions--suboptions)
in the _JavaScript API_ for details.
{{< /tab >}}

{{< tab "cURL" >}}
You can use a tool like [cURL](https://curl.se/) to run AQL queries from a
command-line, directly using the HTTP REST API of ArangoDB.

The response bodies are generally compact JSON (without any line breaks and
indentation). You can format them with the [jq](https://jqlang.github.io/jq/)
tool for better readability if you have it installed:

```sh
curl -d '{"query":"RETURN CONCAT(\"Hello, \", @name)","bindVars":{"name":"AQL"}}' http://localhost:8529/_api/cursor | jq
```

See the [`POST /_db/{database-name}/_api/cursor`](../../develop/http-api/queries/aql-queries.md#create-a-cursor)
endpoint in the _HTTP API_ for details.
{{< /tab >}}

{{< tab "JavaScript" >}}
```js
import { Database } from "arangojs";
const db = new Database();

const name = "AQL";
const result = await db.query(aql`RETURN CONCAT("Hello, ", ${name})`);
console.log(result);
```

See [`Database.query()`](https://arangodb.github.io/arangojs/latest/classes/database.Database.html#query)
in the _arangojs_ documentation for details.
{{< /tab >}}

{{< tab "Go" >}}
```go
ctx := context.Background()
query := `RETURN CONCAT("Hello, ", @name)`
options := arangodb.QueryOptions{
    BindVars: map[string]interface{}{
        "name": "AQL",
    }
}
cursor, err := db.Query(ctx, query, &options)
if err != nil {
    // handle error
} else {
    defer cursor.Close()
    var doc map[string]interface{} 
    for cursor.HasMore() {
        meta, err = cursor.ReadDocument(ctx, &doc)
        if err != nil {
            // handle error
        } else {
            fmt.Printf("%+v\n", doc)
        }
    }
}
```

See [`DatabaseQuery.Query()`](https://pkg.go.dev/github.com/arangodb/go-driver/v2/arangodb#DatabaseQuery)
in the _go-driver_ v2 documentation for details.
{{< /tab >}}

{{< tab "Java" >}}
```java
Map<String, Object> bindVars = new MapBuilder().put("name", "AQL").get();
String query = "RETURN CONCAT(\"Hello, \", @name)";
ArangoCursor<String> cursor = db.query(query, BaseDocument.class, bindVars); // TODO
ArrayList<String> result = cursor.asListRemaining();
System.out.println(result);
```

See [`ArangoDatabase.query()`](https://www.javadoc.io/doc/com.arangodb/arangodb-java-driver/latest/com/arangodb/ArangoDatabase.html#query%28java.lang.String,java.lang.Class,java.util.Map,com.arangodb.model.AqlQueryOptions%29)
in the _arangodb-java-driver_ documentation for details.
{{< /tab >}}

{{< tab "Python" >}}
```py
query = "RETURN CONCAT(\"Hello, \", @name)"
bindVars = { "name": "AQL" }
cursor = db.aql.execute(query, bindVars=bindVars)
for doc in cursor:
  print(doc)
```

See [`AQL.execute()`](https://docs.python-arango.com/en/main/specs.html#arango.aql.AQL.execute)
in the _python-arango_ documentation for details.
{{< /tab >}}

{{< /tabs >}}

## Learn the query language

The following pages guide you through important query constructs for storing
and retrieving data, covering basic as well as some advanced features. 

Afterwards, you can read the [AQL documentation](../../aql/_index.md) for the
full language reference. You can also find examples in this chapter.

{{< comment >}}TODO: Advanced data manipulation: attributes, projections, calculations... Aggregation: Grouping techniques{{< /comment >}}
