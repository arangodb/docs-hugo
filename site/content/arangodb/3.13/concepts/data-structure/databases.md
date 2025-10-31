---
title: Databases
menuTitle: Databases
weight: 5
description: >-
  Databases let you create fully isolated sets of collections for multi-tenancy
  applications
---
ArangoDB can handle multiple databases in the same server instance. Databases
can be used to logically group and separate data. An ArangoDB database consists
of collections and dedicated database-specific worker processes. A database
contains its own collections (which cannot be accessed from other databases),
Foxx applications, and replication loggers and appliers. Each ArangoDB database
contains its own system collections (e.g. `_users`, `_graphs`, ...).

There is always at least one database in ArangoDB. This is the default
database named `_system`. This database cannot be dropped and provides special
operations for creating, dropping, and enumerating databases.

You can create additional databases and give them unique names to access them
later. You need to be in the `_system` database for executing database management
operations. They cannot be initiated while in a user-defined database.

## Database names

You can give each database you create a name to identify and access it.
The name needs to be unique and conform to the naming constraints for databases.

There are two naming constraints available for database names: the **traditional**
and the **extended** naming constraints. Whether the former or the latter are
active depends on the `--database.extended-names` startup option.
The extended naming constraints are used if enabled, allowing many special and
UTF-8 characters in database names. If set to `false` (default), the traditional
naming constraints are enforced.

{{< info >}}
The extended naming constraints are an **experimental** feature
but they will become the norm in a future version. Check if your drivers and
client applications are prepared for this feature before enabling it.
{{< /info >}}

The restrictions for database names are as follows:

- For the **traditional** naming constraints:
  - Database names must only consist of the letters `a` to `z` (both lower and
    upper case allowed), the numbers `0` to `9`, and the underscore (`_`) or
    dash (`-`) symbols.
    This also means that any non-ASCII database names are not allowed.
  - Database names must always start with a letter. Database names starting
    with an underscore are considered to be system databases, and users should
    not create or delete those.
  - The maximum allowed length of a database name is 64 bytes.
  - Database names are case-sensitive.

- For the **extended** naming constraints:
  - Names can consist of most UTF-8 characters, such as Japanese or Arabic
    letters, emojis, letters with accentuation. Some ASCII characters are
    disallowed, but less compared to the  _traditional_ naming constraints.
  - Names cannot contain the characters `/` or `:` at any position, nor any
    control characters (below ASCII code 32), such as `\n`, `\t`, `\r`, and `\0`.
  - Spaces are accepted, but only in between characters of the name. Leading
    or trailing spaces are not allowed.
  - `.` (dot), `_` (underscore) and the numeric digits `0`-`9` are not allowed
    as first character, but at later positions.
  - Database names are case sensitive.
  - Database names containing UTF-8 characters must be 
    [NFC-normalized](https://en.wikipedia.org/wiki/Unicode_equivalence#Normal_forms).
    Non-normalized names will be rejected by arangod.
  - The maximum length of a database name is 128 bytes after normalization. 
    As a UTF-8 character may consist of multiple bytes, this does not necessarily 
    equate to 128 characters.

  Example database names that can be used with the _extended_ naming constraints:
  `España`, `😀`, `犬`, `كلب`, `@abc123`, `København`, `München`, `Бишкек`, `abc? <> 123!`

{{< warning >}}
While it is possible to change the value of the
`--database.extended-names` option from `false` to `true` to enable
extended names, the reverse is not true. Once the extended names have been
enabled, they remain permanently enabled so that existing databases,
collections, Views, and indexes with extended names remain accessible.

Please be aware that dumps containing extended names cannot be restored
into older versions that only support the traditional naming constraints. In a
cluster setup, it is required to use the same naming constraints for all
Coordinators and DB-Servers of the cluster. Otherwise, the startup is
refused.
{{< /warning >}}

## Notes

- Each database contains its own system collections, which ArangoDB has to set
  up when a database is created. This makes the creation of a database take a while.
- Replication can be configured globally or on a per-database level. In the
  latter case, you need to configure any replication logging or applying for new
  databases explicitly after they have been created.
- Foxx applications are only available in the context of the database they have
  been installed in. A new database only provides access to the system
  applications shipped with ArangoDB (mainly the web interface). You need to
  explicitly install other Foxx applications.

## Database organization on disk

Data is physically stored in `.sst` files in a sub-directory `engine-rocksdb`
that resides in the instance's data directory. A single file can contain
documents of various collections and databases.

ArangoSearch stores data in database-specific directories underneath the
`databases` folder.

Foxx applications are also organized in database-specific directories but inside
the application path. The filesystem layout could look like this:

```
apps/                   # the instance's application directory
  system/               # system applications (can be ignored)
  _db/                  # sub-directory containing database-specific applications
    <database-dir>/     # sub-directory for a single database
      <mountpoint>/APP  # sub-directory for a single application
      <mountpoint>/APP  # sub-directory for a single application
    <database-dir>/     # sub-directory for another database
      <mountpoint>/APP  # sub-directory for a single application
```

The name of `<database-dir>` will be the database's original name or the
database's ID if its name contains special characters.

## Database interfaces

The following sections show examples of how you can use the APIs of ArangoDB and
the official drivers, as well as the ArangoDB Shell and the built-in web interface,
to perform common operations related to databases. For less common operations
and other drivers, see the corresponding reference documentation.

### Set the database context

Connections in ArangoDB do not contain any state information. All state
information is contained in the request/response data of the HTTP API that all
clients use under the hood. If the database is changed, client drivers need to
store the current database name on their side to later make requests with the
selected database as the context.

Note that commands, actions, scripts, or AQL queries should never
access multiple databases, even if they exist. The only intended and
supported way in ArangoDB is to use one database at a time for a command,
an action, a script, or a query. Operations started in one database must
not switch the database later and continue operating in another.

Foxx applications are only available in the context of the database they have
been installed in. A new database only provides access to the system
applications shipped with ArangoDB (the web interface) and no other Foxx
applications until they are explicitly installed for a particular database.

{{< tabs "interfaces" >}}

{{< tab "Web interface" >}}
1. If you are logged in, click the name of the current database or the swap icon
   in the top-right corner.
2. Select a database from the dropdown list. It only lists databases you have at
   least read access to.
3. Click **Select DB**.
{{< /tab >}}

{{< tab "arangosh" >}}
When you have an established connection to ArangoDB, the current
database can be changed explicitly using the `db._useDatabase()`
method. This switches to the specified database (provided it
exists and the user can connect to it). From this point on, any
following action in the same shell or connection uses the
specified database, unless specified otherwise.

```js
---
name: arangosh_use_database
description: ''
---
~db._createDatabase("mydb");
db._useDatabase("mydb");
~db._useDatabase("_system");
~db._dropDatabase("mydb");
```

See [`db._useDatabase()`](../../develop/javascript-api/@arangodb/db-object.md#db_usedatabasename)
in the _JavaScript API_ for details.

It is also possible to specify a database name when invoking arangosh. For this
purpose, use the `--server.database` startup option:

```sh
arangosh --server.database mydb
```
{{< /tab >}}

{{< tab "cURL" >}}
Setting the database context is not an operation, you rather specify the database in
the URL like a prefix for the path of an endpoint. Omitting `/_db/{database-name}`
is the same as specifying `/_db/_system`.

```sh
curl http://localhost:8529/_db/mydb/...
```

See [Addresses of databases](../../develop/http-api/databases.md#addresses-of-databases)
in the _HTTP API_ for details.
{{< /tab >}}

{{< tab "JavaScript" >}}
```js
// Default host and the _system database
const db = new Database();

// New connection pool
const myDb = new Database("http://localhost:8529", "mydb");

// Same connection pool
const otherDb = myDb.database("other");
```

See [`new Database()`](https://arangodb.github.io/arangojs/latest/classes/databases.Database.html#constructor)
and [`Database.database()`](https://arangodb.github.io/arangojs/latest/classes/databases.Database.html#database)
in the _arangojs_ documentation for details.
{{< /tab >}}

{{< tab "Go" >}}
```go
ctx := context.Background()
db, err := client.GetDatabase(ctx, "_system", /* options */ nil)
if err != nil {
  fmt.Println(err)
} else {
  _ = db // Use db here
}
```

See [`ClientDatabase.GetDatabase()`](https://pkg.go.dev/github.com/arangodb/go-driver/v2/arangodb#ClientDatabase)
in the _go-driver_ v2 documentation for details.
{{< /tab >}}

{{< tab "Java" >}}
```java
ArangoDatabase db = arangoDB.db(); // Default _system database
ArangoDatabase mydb = arangoDB.db("mydb");
```

See [`ArangoDB.db()`](https://www.javadoc.io/doc/com.arangodb/arangodb-java-driver/latest/com/arangodb/ArangoDB.html#db%28java.lang.String%29)
in the _arangodb-java-driver_ documentation for details.
{{< /tab >}}

{{< tab "Python" >}}
```py
sys_db = client.db() // Default _system database

db = client.db("mydb")
```

See [`ArangoClient.db()`](https://docs.python-arango.com/en/main/specs.html#arango.client.ArangoClient.db)
in the _python-arango_ documentation for details.
{{< /tab >}}

{{< /tabs >}}

### Create a database

Each database contains its own system collections, which need to be set up when
a database is created. The creation of a database can therefore take a moment.

{{< tabs "interfaces" >}}

{{< tab "Web interface" >}}
1. Switch to the `_system` database.
2. Click **Databases** in the main navigation.
3. Click **Add database**.
4. Set a **Name** and optionally configuration options.
5. Click **Create**.
{{< /tab >}}

{{< tab "arangosh" >}}
```js
---
name: arangosh_create_database
description: ''
---
var ok = db._useDatabase("_system"); // _system database context required
db._createDatabase("mydb");
~db._dropDatabase("mydb");
```

See [`db._createDatabase()`](../../develop/javascript-api/@arangodb/db-object.md#db_createdatabasename--options--users)
in the _JavaScript API_ for details.
{{< /tab >}}

{{< tab "cURL" >}}
```sh
curl -d '{"name":"mydb"}' http://localhost:8529/_api/database
```

See the [`POST /_db/_system/_api/database`](../../develop/http-api/databases.md#create-a-database)
endpoint in the _HTTP API_ for details.
{{< /tab >}}

{{< tab "JavaScript" >}}
```js
const myDb = await db.createDatabase("mydb");
```

See [`Database.createDatabase()`](https://arangodb.github.io/arangojs/latest/classes/databases.Database.html#createDatabase)
in the _arangojs_ documentation for details.
{{< /tab >}}

{{< tab "Go" >}}
```go
ctx := context.Background()
mydb, err := client.CreateDatabase(ctx, "mydb", /* options */ nil)
_ = mydb
```

See [`ClientDatabase.CreateDatabase()`](https://pkg.go.dev/github.com/arangodb/go-driver/v2/arangodb#ClientDatabase)
in the _go-driver_ v2 documentation for details.
{{< /tab >}}

{{< tab "Java" >}}
```java
Boolean ok = arangoDB.createDatabase("mydb");
// -- or --
ArangoDatabase db = arangoDB.db("mydb");
Boolean ok = db.create(); 
```

See [`ArangoDB.createDatabase()`](https://www.javadoc.io/doc/com.arangodb/arangodb-java-driver/latest/com/arangodb/ArangoDB.html#createDatabase%28java.lang.String%29)
and [`ArangoDatabase.create()`](https://www.javadoc.io/doc/com.arangodb/arangodb-java-driver/latest/com/arangodb/ArangoDatabase.html#create%28%29)
in the _arangodb-java-driver_ documentation for details.
{{< /tab >}}

{{< tab "Python" >}}
```py
sys_db = client.db("_system") # _system database context required
ok = sys_db.create_database("mydb")
db = client.db("mydb")
```

See [`StandardDatabase.create_database()`](https://docs.python-arango.com/en/main/specs.html#arango.database.StandardDatabase.create_database)
in the _python-arango_ documentation for details.
{{< /tab >}}

{{< /tabs >}}

### Get a database

{{< tabs "interfaces" >}}

{{< tab "Web interface" >}}
1. Switch to the `_system` database.
2. Click **Databases** in the main navigation.
3. Click the name or the row of the database.

To switch to the desired database, see [Set the database context](#set-the-database-context).
{{< /tab >}}

{{< tab "arangosh" >}}
```js
---
name: arangosh_get_database
description: ''
---
~db._createDatabase("mydb");
var ok = db._useDatabase("mydb");
db._properties();
~db._useDatabase("_system");
~db._dropDatabase("mydb");
```

See [`db._properties()`](../../develop/javascript-api/@arangodb/db-object.md#db_properties)
in the _JavaScript API_ for details.
{{< /tab >}}

{{< tab "cURL" >}}
```sh
curl http://localhost:8529/_db/mydb/_api/database/current
```

See the [`GET /_db/{database-name}/_api/database/current`](../../develop/http-api/databases.md#get-information-about-the-current-database)
endpoint in the _HTTP API_ for details.
{{< /tab >}}

{{< tab "JavaScript" >}}
```js
const myDb = db.database("mydb");
const info = await myDb.get();
```

See [`Database.get()`](https://arangodb.github.io/arangojs/latest/classes/databases.Database.html#get)
in the _arangojs_ documentation for details.
{{< /tab >}}

{{< tab "Go" >}}
```go
ctx := context.Background()
db, err := client.GetDatabase(ctx, "mydb", nil)
if err != nil {
  fmt.Println(err)
} else {
  info, err := db.Info(ctx)
  if err != nil {
    fmt.Println(err)
  } else {
    fmt.Printf("%+v", info)
  }
}
```

See [`Database.GetDatabase()`](https://pkg.go.dev/github.com/arangodb/go-driver/v2/arangodb#Database)
in the _go-driver_ v2 documentation for details.
{{< /tab >}}

{{< tab "Java" >}}
```java
ArangoDatabase db = arangoDB.db("mydb");
DatabaseEntity info = db.getInfo();
```

See [`ArangoDatabase.getInfo()`](https://www.javadoc.io/doc/com.arangodb/arangodb-java-driver/latest/com/arangodb/ArangoDatabase.html#getInfo%28%29)
in the _arangodb-java-driver_ documentation for details.
{{< /tab >}}

{{< tab "Python" >}}
```py
db = client.db("mydb")
info = db.properties()
```

See [`StandardDatabase.properties()`](https://docs.python-arango.com/en/main/specs.html#arango.database.StandardDatabase.properties)
in the _python-arango_ documentation for details.
{{< /tab >}}

{{< /tabs >}}

### List all databases

{{< tabs "interfaces" >}}

{{< tab "Web interface" >}}
1. Switch to the `_system` database.
2. Click **Databases** in the main navigation.
3. All databases are listed, given that no **Filters** are applied.
{{< /tab >}}

{{< tab "arangosh" >}}
```js
---
name: arangosh_list_databases
description: ''
---
~db._createDatabase("mydb");
var ok = db._useDatabase("_system"); // _system database context required
db._databases();
~db._dropDatabase("mydb");
```

See [`db._databases()`](../../develop/javascript-api/@arangodb/db-object.md#db_databases)
in the _JavaScript API_ for details.
{{< /tab >}}

{{< tab "cURL" >}}
```sh
curl http://localhost:8529/_api/database
```

See the [`GET /_db/_system/_api/database`](../../develop/http-api/databases.md#list-all-databases)
endpoint in the _HTTP API_ for details.
{{< /tab >}}

{{< tab "JavaScript" >}}
```js
const dbs = await db.databases();
console.log(dbs.map(d => d.name))
```

See [`Database.databases()`](https://arangodb.github.io/arangojs/latest/classes/databases.Database.html#databases)
in the _arangojs_ documentation for details.
{{< /tab >}}

{{< tab "Go" >}}
```go
ctx := context.Background()
dbs, err := client.Databases(ctx)
if err != nil {
  fmt.Println(err)
} else {
  for _, d := range dbs {
    fmt.Println(d.Name())
  }
}
```

See [`ClientDatabase.Databases()`](https://pkg.go.dev/github.com/arangodb/go-driver/v2/arangodb#ClientDatabase)
in the _go-driver_ v2 documentation for details.
{{< /tab >}}

{{< tab "Java" >}}
```java
Collection<String> dbNames = arangoDB.getDatabases();
```

See [`ArangoDB.getDatabases()`](https://www.javadoc.io/doc/com.arangodb/arangodb-java-driver/latest/com/arangodb/ArangoDB.html#getDatabases%28%29)
in the _arangodb-java-driver_ documentation for details.
{{< /tab >}}

{{< tab "Python" >}}
```py
sys_db = client.db("_system") # _system database context required
db_names = sys_db.databases()
```

See [`StandardDatabase.databases()`](https://docs.python-arango.com/en/main/specs.html#arango.database.StandardDatabase.databases)
in the _python-arango_ documentation for details.
{{< /tab >}}

{{< /tabs >}}

### Remove a database

{{< tabs "interfaces" >}}

{{< tab "Web interface" >}}
1. Switch to the `_system` database.
2. Click **Databases** in the main navigation.
3. Click the name or the row of the database you want to delete.
4. Click the **Delete** button and confirm the deletion.
{{< /tab >}}

{{< tab "arangosh" >}}
```js
---
name: arangosh_delete_database
description: ''
---
~db._createDatabase("mydb");
var ok = db._useDatabase("_system"); // _system database context required
db._dropDatabase("mydb");
```

See [`db._dropDatabase()`](../../develop/javascript-api/@arangodb/db-object.md#db_dropdatabasename)
in the _JavaScript API_ for details.
{{< /tab >}}

{{< tab "cURL" >}}
```sh
curl -XDELETE http://localhost:8529/_api/database/mydb
```

See the [`DELETE /_db/_system/_api/database/{database-name}`](../../develop/http-api/databases.md#drop-a-database)
endpoint in the _HTTP API_ for details.
{{< /tab >}}

{{< tab "JavaScript" >}}
```js
const ok = await db.dropDatabase("mydb");
```

See [`Database.dropDatabase()`](https://arangodb.github.io/arangojs/latest/classes/databases.Database.html#dropDatabase)
in the _arangojs_ documentation for details.
{{< /tab >}}

{{< tab "Go" >}}
```go
ctx := context.Background()
db, err := client.GetDatabase(ctx, "mydb", nil)
if err != nil {
  fmt.Println(err)
} else {
  err = db.Remove(ctx)
  if err != nil {
    fmt.Println(err)
  }
}
```

See [`Database.Remove()`](https://pkg.go.dev/github.com/arangodb/go-driver/v2/arangodb#Database)
in the _go-driver_ v2 documentation for details.
{{< /tab >}}

{{< tab "Java" >}}
```java
ArangoDatabase db = arangoDB.db("mydb");
Boolean ok = db.drop();
```

See [`ArangoDatabase.drop()`](https://www.javadoc.io/doc/com.arangodb/arangodb-java-driver/latest/com/arangodb/ArangoDatabase.html#drop%28%29)
in the _arangodb-java-driver_ documentation for details.
{{< /tab >}}

{{< tab "Python" >}}
```py
sys_db = client.db("_system") # _system database context required
ok = sys_db.delete_database("mydb")
```

See [`StandardDatabase.delete_database()`](https://docs.python-arango.com/en/main/specs.html#arango.database.StandardDatabase.delete_database)
in the _python-arango_ documentation for details.
{{< /tab >}}

{{< /tabs >}}
