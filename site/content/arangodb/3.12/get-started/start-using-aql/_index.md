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
6. Click the **Execute** button or press {{< kbd "Ctrl Return" >}} respectively {{< kbd "Cmd Return" >}}.
{{< /tab >}}

{{< tab "arangosh" >}}
You can run AQL queries from the ArangoDB Shell ([arangosh](../../components/tools/arangodb-shell/_index.md))
with the [`db._query()`](../../aql/how-to-invoke-aql/with-arangosh.md#with-db_query) and
[`db._createStatement()`](../../aql/how-to-invoke-aql/with-arangosh.md#with-db_createstatement-arangostatement)
methods of the [`db` object](../../develop/javascript-api/@arangodb/db-object.md).

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

If you use Foxx, see [how to write database queries](../../develop/foxx-microservices/getting-started.md#writing-database-queries)
for examples including tagged template strings.
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
import { Database, aql } from "arangojs";
const db = new Database();

const name = "AQL";
const cursor = await db.query(aql`RETURN CONCAT("Hello, ", ${name})`);
const result = cursor.all();
console.log(result);
```

See [`Database.query()`](https://arangodb.github.io/arangojs/latest/classes/databases.Database.html#query)
in the _arangojs_ documentation for details.
{{< /tab >}}

{{< tab "Go" >}}
```go
ctx := context.Background()
query := `RETURN CONCAT("Hello, ", @name)`
options := arangodb.QueryOptions{
    BindVars: map[string]interface{}{
        "name": "AQL",
    },
}
cursor, err := db.Query(ctx, query, &options)
if err != nil {
    log.Fatalf("Failed to run query:\n%v\n", err)
} else {
    defer cursor.Close()
    var str string
    for cursor.HasMore() {
        meta, err := cursor.ReadDocument(ctx, &str)
        _ = meta // No document metadata with this query, it only returns a string
        if err != nil {
            log.Fatalf("Failed to read cursor:\n%v\n", err)
        } else {
            fmt.Println(str)
        }
    }
}
```

See [`DatabaseQuery.Query()`](https://pkg.go.dev/github.com/arangodb/go-driver/v2/arangodb#DatabaseQuery)
in the _go-driver_ v2 documentation for details.
{{< /tab >}}

{{< tab "Java" >}}
```java
String query = "RETURN CONCAT(\"Hello, \", @name)";
Map<String, Object> bindVars = Map.of("name", "AQL");
ArangoCursor<Object> cursor = db.query(query, Object.class, bindVars);
cursor.forEach(result -> System.out.println(result));
```

See [`ArangoDatabase.query()`](https://www.javadoc.io/doc/com.arangodb/arangodb-java-driver/latest/com/arangodb/ArangoDatabase.html#query%28java.lang.String,java.lang.Class,java.util.Map%29)
in the _arangodb-java-driver_ documentation for details.
{{< /tab >}}

{{< tab "Python" >}}
```py
query = "RETURN CONCAT('Hello, ', @name)"
bind_vars = { "name": "AQL" }
cursor = db.aql.execute(query, bind_vars=bind_vars)
for result in cursor:
  print(result)
```

See [`AQL.execute()`](https://docs.python-arango.com/en/main/specs.html#arango.aql.AQL.execute)
in the _python-arango_ documentation for details.
{{< /tab >}}

{{< /tabs >}}

## Learn the query language

The following pages guide you through important query constructs for storing
and retrieving data, covering basic as well as some advanced features. 

Afterwards, you can read the [AQL documentation](../../aql/_index.md) for the
full language reference and query examples.

{{< comment >}}TODO: Advanced data manipulation: attributes, projections, calculations... Aggregation: Grouping techniques{{< /comment >}}
