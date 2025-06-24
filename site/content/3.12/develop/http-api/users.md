---
title: HTTP interface for user management
menuTitle: Users
weight: 15
description: >-
  The HTTP API for user management lets you create, modify, delete, and list
  ArangoDB user accounts, as well as grant and revoke permissions for databases
  and collections
# GET|PUT|DELETE /_api/user/{user}/config and GET /_api/user/{user}/config/{key}
# endpoints not documented on purpose because they are only used by the web interface
---
The interface provides the means to manage database system users. All
users managed through this interface are stored in the protected `_users`
system collection.

You should never manipulate the `_users` collection directly. The specialized
endpoints intentionally have limited functionality compared to the regular
Document API.

See [Managing Users](../../operations/administration/user-management/_index.md)
for details and note that using wildcard database and collection access levels
is discouraged.

{{< info >}}
User management operations are not included in ArangoDB's replication.
{{< /info >}}

## Manage users

### Create a user

```openapi
paths:
  /_db/{database-name}/_api/user:
    post:
      operationId: createUser
      description: |
        Create a new user. You need server access level *Administrate* in order to
        execute this REST call.
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of a database. Which database you use doesn't matter as long
            as the user account you authenticate with has at least read access
            to this database and administrate access to the `_system` database.
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required:
                - user
                - passwd
              properties:
                user:
                  description: |
                    The name of the user as a string. This is mandatory.
                  type: string
                passwd:
                  description: |
                    The user password as a string. If not specified, it will default to an empty
                    string.
                  type: string
                active:
                  description: |
                    Whether the user account should be able to log in to the database system.
                  type: boolean
                  default: true
                extra:
                  description: |
                    A JSON object with extra user information. It is used by the web interface
                    to store graph viewer settings and saved queries. Should not be set or
                    modified by end users, as custom attributes will not be preserved.
                  type: object
      responses:
        '201':
          description: |
            Returned if the user can be added by the server
        '400':
          description: |
            If the JSON representation is malformed or mandatory data is missing
            from the request.
        '401':
          description: |
            Returned if you have *No access* database access level to the `_system`
            database.
        '403':
          description: |
            Returned if you have *No access* server access level.
        '409':
          description: |
            Returned if a user with the same name already exists.
      tags:
        - Users
```

**Examples**

```curl
---
description: ''
name: RestCreateUser
---
try { require("@arangodb/users").remove("admin@example"); } catch (err) {}
var url = "/_api/user";
var data = { user: "admin@example", passwd: "secure" };
var response = logCurlRequest('POST', url, data);

assert(response.code === 201);

logJsonResponse(response);
require("@arangodb/users").remove("admin@example");
```

### Replace a user

```openapi
paths:
  /_db/{database-name}/_api/user/{user}:
    put:
      operationId: replaceUserData
      description: |
        Replaces the data of an existing user. You need server access level
        *Administrate* in order to execute this REST call. Additionally, users can
        change their own data.
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of a database. Which database you use doesn't matter as long
            as the user account you authenticate with has at least read access
            to this database and administrate access to the `_system` database.
          schema:
            type: string
        - name: user
          in: path
          required: true
          description: |
            The name of the user.
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required:
                - passwd
              properties:
                passwd:
                  description: |
                    The user password as a string. If not specified, it will default to an empty
                    string.
                  type: string
                active:
                  description: |
                    Whether the user account should be able to log in to the database system.
                  type: boolean
                  default: true
                extra:
                  description: |
                    A JSON object with extra user information. It is used by the web interface
                    to store graph viewer settings and saved queries. Should not be set or
                    modified by end users, as custom attributes will not be preserved.
                  type: object
      responses:
        '200':
          description: |
            Is returned if the user data can be replaced by the server.
        '400':
          description: |
            The JSON representation is malformed or mandatory data is missing from the request
        '401':
          description: |
            Returned if you have *No access* database access level to the *_system*
            database.
        '403':
          description: |
            Returned if you have *No access* server access level.
        '404':
          description: |
            The specified user does not exist
      tags:
        - Users
```

**Examples**

```curl
---
description: ''
name: RestReplaceUser
---
var users = require("@arangodb/users");
var theUser = "admin@myapp";
users.save(theUser, "secret")

var url = "/_api/user/" + theUser;
var data = { passwd: "secure" };
var response = logCurlRequest('PUT', url, data);

assert(response.code === 200);

logJsonResponse(response);
users.remove(theUser);
```

### Update a user

```openapi
paths:
  /_db/{database-name}/_api/user/{user}:
    patch:
      operationId: updateUserData
      description: |
        Partially modifies the data of an existing user. You need server access level
        *Administrate* in order to execute this REST call. Additionally, users can
        change their own data.
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of a database. Which database you use doesn't matter as long
            as the user account you authenticate with has at least read access
            to this database and administrate access to the `_system` database.
          schema:
            type: string
        - name: user
          in: path
          required: true
          description: |
            The name of the user.
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required:
                - passwd
              properties:
                passwd:
                  description: |
                    The user password as a string.
                  type: string
                active:
                  description: |
                    Whether the user account should be able to log in to the database system.
                  type: boolean
                extra:
                  description: |
                    A JSON object with extra user information. It is used by the web interface
                    to store graph viewer settings and saved queries. Should not be set or
                    modified by end users, as custom attributes will not be preserved.
                  type: object
      responses:
        '200':
          description: |
            Is returned if the user data can be replaced by the server.
        '400':
          description: |
            The JSON representation is malformed or mandatory data is missing from the request.
        '401':
          description: |
            Returned if you have *No access* database access level to the *_system*
            database.
        '403':
          description: |
            Returned if you have *No access* server access level.
        '404':
          description: |
            The specified user does not exist
      tags:
        - Users
```

**Examples**

```curl
---
description: ''
name: RestUpdateUser
---
var users = require("@arangodb/users");
var theUser = "admin@myapp";
users.save(theUser, "secret")

var url = "/_api/user/" + theUser;
var data = { passwd: "secure" };
var response = logCurlRequest('PATCH', url, data);

assert(response.code === 200);

logJsonResponse(response);
users.remove(theUser);
```

### Remove a user

```openapi
paths:
  /_db/{database-name}/_api/user/{user}:
    delete:
      operationId: deleteUser
      description: |
        Removes an existing user, identified by `user`.

        You need *Administrate* permissions for the server access level in order to
        execute this REST call.
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of a database. Which database you use doesn't matter as long
            as the user account you authenticate with has at least read access
            to this database and administrate access to the `_system` database.
          schema:
            type: string
        - name: user
          in: path
          required: true
          description: |
            The name of the user
          schema:
            type: string
      responses:
        '202':
          description: |
            Is returned if the user was removed by the server
        '401':
          description: |
            Returned if you have *No access* database access level to the `_system`
            database.
        '403':
          description: |
            Returned if you have *No access* server access level.
        '404':
          description: |
            The specified user does not exist
      tags:
        - Users
```

**Examples**

```curl
---
description: ''
name: RestDeleteUser
---
var users = require("@arangodb/users");
var theUser = "userToDelete@myapp";
users.save(theUser, "secret")

var url = "/_api/user/" + theUser;
var response = logCurlRequest('DELETE', url, {});

assert(response.code === 202);

logJsonResponse(response);
```

### Get a user

```openapi
paths:
  /_db/{database-name}/_api/user/{user}:
    get:
      operationId: getUser
      description: |
        Fetches data about the specified user. You can fetch information about
        yourself or you need the *Administrate* server access level in order to
        execute this REST call.
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of a database. Which database you use doesn't matter as long
            as the user account you authenticate with has at least read access
            to this database and administrate access to the `_system` database.
          schema:
            type: string
        - name: user
          in: path
          required: true
          description: |
            The name of the user
          schema:
            type: string
      responses:
        '200':
          description: |
            The user was found.
        '401':
          description: |
            Returned if you have *No access* database access level to the `_system`
            database.
        '403':
          description: |
            Returned if you have *No access* server access level.
        '404':
          description: |
            The user with the specified name does not exist.
      tags:
        - Users
```

**Examples**

```curl
---
description: ''
name: RestFetchUser
---
var users = require("@arangodb/users");
var theUser = "admin@myapp";
users.save(theUser, "secret")

var url = "/_api/user/" + theUser;
var response = logCurlRequest('GET', url);

assert(response.code === 200);

logJsonResponse(response);
users.remove(theUser);
```

### List available users

```openapi
paths:
  /_db/{database-name}/_api/user:
    get:
      operationId: listUsers
      description: |
        Fetches data about all users. You need the *Administrate* server access level
        in order to execute this REST call.  Otherwise, you will only get information
        about yourself.

        The call will return a JSON object with at least the following
        attributes on success:

        - `user`: The name of the user as a string.
        - `active`: Whether the user account is able to log in to the database system.
        - `extra`: A JSON object with extra user information. It is used by the web
          interface to store graph viewer settings and saved queries.
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of a database. Which database you use doesn't matter as long
            as the user account you authenticate with has at least read access
            to this database and administrate access to the `_system` database.
          schema:
            type: string
      responses:
        '200':
          description: |
            The users that were found.
        '401':
          description: |
            Returned if you have *No access* database access level to the `_system`
            database.
        '403':
          description: |
            Returned if you have *No access* server access level.
      tags:
        - Users
```

**Examples**

```curl
---
description: ''
name: RestFetchAllUser
---
var url = "/_api/user";
var response = logCurlRequest('GET', url);

assert(response.code === 200);

logJsonResponse(response);
```

## Manage permissions

### Set a user's database access level

```openapi
paths:
  /_db/{database-name}/_api/user/{user}/database/{dbname}:
    put:
      operationId: setUserDatabasePermissions
      description: |
        Sets the database access levels for the database `dbname` of user `user`. You
        need the *Administrate* server access level in order to execute this REST
        call.
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required:
                - grant
              properties:
                grant:
                  description: |
                    - `"rw"`: Set the database access level to *Administrate*.
                    - `"ro"`: Set the database access level to *Access*.
                    - `"none"`: Set the database access level to *No access*.
                  type: string
                  enum: [rw, ro, none]
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of a database. Which database you use doesn't matter as long
            as the user account you authenticate with has at least read access
            to this database and administrate access to the `_system` database.
          schema:
            type: string
        - name: user
          in: path
          required: true
          description: |
            The name of the user.
          schema:
            type: string
        - name: dbname
          in: path
          required: true
          description: |
            The name of the database to set the access level for.
          schema:
            type: string
      responses:
        '200':
          description: |
            Returned if the access level was changed successfully.
        '400':
          description: |
            If the JSON representation is malformed or mandatory data is missing
            from the request.
        '401':
          description: |
            Returned if you have *No access* database access level to the `_system`
            database.
        '403':
          description: |
            Returned if you have *No access* server access level.
      tags:
        - Users
```

**Examples**

```curl
---
description: ''
name: RestGrantDatabase
---
var users = require("@arangodb/users");
var theUser = "admin@myapp";
users.save(theUser, "secret")

var url = "/_api/user/" + theUser + "/database/_system";
var data = { grant: "rw" };
var response = logCurlRequest('PUT', url, data);

assert(response.code === 200);

logJsonResponse(response);
users.remove(theUser);
```

### Set a user's collection access level

```openapi
paths:
  /_db/{database-name}/_api/user/{user}/database/{dbname}/{collection}:
    put:
      operationId: setUserCollectionPermissions
      description: |
        Sets the collection access level for the `collection` in the database `dbname`
        for user `user`. You need the *Administrate* server access level in order to
        execute this REST call.
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required:
                - grant
              properties:
                grant:
                  description: |
                    - `"rw"`: Set the collection access level to *Read/Write*.
                    - `"ro"`: Set the collection access level to *Read Only*.
                    - `"none"`: Set the collection access level to *No access*.
                  type: string
                  enum: [rw, ro, none]
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of a database. Which database you use doesn't matter as long
            as the user account you authenticate with has at least read access
            to this database and administrate access to the `_system` database.
          schema:
            type: string
        - name: user
          in: path
          required: true
          description: |
            The name of the user.
          schema:
            type: string
        - name: dbname
          in: path
          required: true
          description: |
            The name of the database to set the access level for.
          schema:
            type: string
        - name: collection
          in: path
          required: true
          description: |
            The name of the collection to set the access level for.
          schema:
            type: string
      responses:
        '200':
          description: |
            Returned if the access permissions were changed successfully.
        '400':
          description: |
            If the JSON representation is malformed or mandatory data is missing
            from the request.
        '401':
          description: |
            Returned if you have *No access* database access level to the `_system`
            database.
        '403':
          description: |
            Returned if you have *No access* server access level.
      tags:
        - Users
```

**Examples**

```curl
---
description: ''
name: RestGrantCollection
---
var users = require("@arangodb/users");
var theUser = "admin@myapp";
try { users.remove(theUser); } catch (err) {}
try { db_drop("reports"); } catch (err) {}
db._create("reports");
users.save(theUser, "secret")

var url = "/_api/user/" + theUser + "/database/_system/reports";
var data = { grant: "rw" };
var response = logCurlRequest('PUT', url, data);

assert(response.code === 200);
db._drop("reports");

logJsonResponse(response);
users.remove(theUser);
```

### Clear a user's database access level

```openapi
paths:
  /_db/{database-name}/_api/user/{user}/database/{dbname}:
    delete:
      operationId: deleteUserDatabasePermissions
      description: |
        Clears the database access level for the database `dbname` of user `user`. As
        consequence, the default database access level is used. If there is no defined
        default database access level, it defaults to *No access*.

        You need write permissions (*Administrate* access level) for the `_system`
        database in order to execute this REST call.
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of a database. Which database you use doesn't matter as long
            as the user account you authenticate with has at least read access
            to this database and administrate access to the `_system` database.
          schema:
            type: string
        - name: user
          in: path
          required: true
          description: |
            The name of the user.
          schema:
            type: string
        - name: dbname
          in: path
          required: true
          description: |
            The name of the database to clear the access level for.
          schema:
            type: string
      responses:
        '202':
          description: |
            Returned if the access permissions were changed successfully.
        '400':
          description: |
            If the JSON representation is malformed or mandatory data is missing
            from the request.
      tags:
        - Users
```

**Examples**

```curl
---
description: ''
name: RestRevokeDatabase
---
var users = require("@arangodb/users");
var theUser = "admin@myapp";
try { users.remove(theUser); } catch (err) {}
users.save(theUser, "secret")

var url = "/_api/user/" + theUser + "/database/_system";
var response = logCurlRequest('DELETE', url);

assert(response.code === 202);

logJsonResponse(response);
users.remove(theUser);
```

### Clear a user's collection access level

```openapi
paths:
  /_db/{database-name}/_api/user/{user}/database/{dbname}/{collection}:
    delete:
      operationId: deleteUserCollectionPermissions
      description: |
        Clears the collection access level for the collection `collection` in the
        database `dbname` of user `user`. As consequence, the default collection
        access level is used. If there is no defined default collection access level,
        it defaults to *No access*.

        You need write permissions (*Administrate* access level) for the `_system`
        database in order to execute this REST call.
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of a database. Which database you use doesn't matter as long
            as the user account you authenticate with has at least read access
            to this database and administrate access to the `_system` database.
          schema:
            type: string
        - name: user
          in: path
          required: true
          description: |
            The name of the user.
          schema:
            type: string
        - name: dbname
          in: path
          required: true
          description: |
            The name of the database to clear the access level for.
          schema:
            type: string
        - name: collection
          in: path
          required: true
          description: |
            The name of the collection to clear the access level for.
          schema:
            type: string
      responses:
        '202':
          description: |
            Returned if the access permissions were changed successfully.
        '400':
          description: |
            If there was an error
      tags:
        - Users
```

**Examples**

```curl
---
description: ''
name: RestRevokeCollection
---
var users = require("@arangodb/users");
var theUser = "admin@myapp";
try { users.remove(theUser); } catch (err) {}
try { db_drop("reports"); } catch (err) {}
db._create("reports");
users.save(theUser, "secret")
users.grantCollection(theUser, "_system", "reports", "rw");

var url = "/_api/user/" + theUser + "/database/_system/reports";
var response = logCurlRequest('DELETE', url);

assert(response.code === 202);
db._drop("reports");

logJsonResponse(response);
users.remove(theUser);
```

### List a user's accessible databases

```openapi
paths:
  /_db/{database-name}/_api/user/{user}/database:
    get:
      operationId: listUserDatabases
      description: |
        Fetch the list of databases available to the specified `user`.

        You need *Administrate* permissions for the server access level in order to
        execute this REST call.

        The call will return a JSON object with the per-database access
        privileges for the specified user. The `result` object will contain
        the databases names as object keys, and the associated privileges
        for the database as values.

        In case you specified `full`, the result will contain the permissions
        for the databases as well as the permissions for the collections.
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of a database. Which database you use doesn't matter as long
            as the user account you authenticate with has at least read access
            to this database and administrate access to the `_system` database.
          schema:
            type: string
        - name: user
          in: path
          required: true
          description: |
            The name of the user for which you want to query the databases.
          schema:
            type: string
        - name: full
          in: query
          required: false
          description: |
            Return the full set of access levels for all databases and all collections.
          schema:
            type: boolean
      responses:
        '200':
          description: |
            Returned if the list of available databases can be returned.
        '400':
          description: |
            If the access privileges are not right etc.
        '401':
          description: |
            Returned if you have *No access* database access level to the `_system`
            database.
        '403':
          description: |
            Returned if you have *No access* server access level.
      tags:
        - Users
```

**Examples**

```curl
---
description: ''
name: RestFetchUserDatabaseList
---
var users = require("@arangodb/users");
var theUser="anotherAdmin@secapp";
users.save(theUser, "secret");
users.grantDatabase(theUser, "_system", "rw");

var url = "/_api/user/" + theUser + "/database/";
var response = logCurlRequest('GET', url);

assert(response.code === 200);

logJsonResponse(response);
users.remove(theUser);
```

```curl
---
description: |-
  With the full response format:
name: RestFetchUserDatabaseListFull
---
var users = require("@arangodb/users");
var theUser="anotherAdmin@secapp";
users.save(theUser, "secret");
users.grantDatabase(theUser, "_system", "rw");

var url = "/_api/user/" + theUser + "/database?full=true";
var response = logCurlRequest('GET', url);

assert(response.code === 200);

logJsonResponse(response);
users.remove(theUser);
```

### Get a user's database access level

```openapi
paths:
  /_db/{database-name}/_api/user/{user}/database/{dbname}:
    get:
      operationId: getUserDatabasePermissions
      description: |
        Fetch the database access level for a specific database
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of a database. Which database you use doesn't matter as long
            as the user account you authenticate with has at least read access
            to this database and administrate access to the `_system` database.
          schema:
            type: string
        - name: user
          in: path
          required: true
          description: |
            The name of the user for which you want to query the databases.
          schema:
            type: string
        - name: dbname
          in: path
          required: true
          description: |
            The name of the database to query the access level of.
          schema:
            type: string
      responses:
        '200':
          description: |
            Returned if the access level can be returned
        '400':
          description: |
            If the access privileges are not right etc.
        '401':
          description: |
            Returned if you have *No access* database access level to the `_system`
            database.
        '403':
          description: |
            Returned if you have *No access* server access level.
      tags:
        - Users
```

**Examples**

```curl
---
description: ''
name: RestFetchUserDatabasePermission
---
var users = require("@arangodb/users");
var theUser="anotherAdmin@secapp";
users.save(theUser, "secret");
users.grantDatabase(theUser, "_system", "rw");

var url = "/_api/user/" + theUser + "/database/_system";
var response = logCurlRequest('GET', url);

assert(response.code === 200);

logJsonResponse(response);
users.remove(theUser);
```

### Get a user's collection access level

```openapi
paths:
  /_db/{database-name}/_api/user/{user}/database/{dbname}/{collection}:
    get:
      operationId: getUserCollectionPermissions
      description: |
        Returns the collection access level for a specific collection
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of a database. Which database you use doesn't matter as long
            as the user account you authenticate with has at least read access
            to this database and administrate access to the `_system` database.
          schema:
            type: string
        - name: user
          in: path
          required: true
          description: |
            The name of the user for which you want to query the databases.
          schema:
            type: string
        - name: dbname
          in: path
          required: true
          description: |
            The name of the database to query the access level of.
          schema:
            type: string
        - name: collection
          in: path
          required: true
          description: |
            The name of the collection to query the access level of.
          schema:
            type: string
      responses:
        '200':
          description: |
            Returned if the access level can be returned
        '400':
          description: |
            If the access privileges are not right etc.
        '401':
          description: |
            Returned if you have *No access* database access level to the `_system`
            database.
        '403':
          description: |
            Returned if you have *No access* server access level.
      tags:
        - Users
```

**Examples**

```curl
---
description: ''
name: RestFetchUserCollectionPermission
---
var users = require("@arangodb/users");
var theUser="anotherAdmin@secapp";
users.save(theUser, "secret");
users.grantDatabase(theUser, "_system", "rw");

var url = "/_api/user/" + theUser + "/database/_system/_users";
var response = logCurlRequest('GET', url);

assert(response.code === 200);

logJsonResponse(response);
users.remove(theUser);
```
