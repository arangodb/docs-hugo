---
title: HTTP interface for server administration
menuTitle: Administration
weight: 110
description: >-
  You can get information about ArangoDB servers, toggle the maintenance mode,
  shut down server nodes, and start actions like compaction
# Undocumented on purpose:
#   /_admin/debug       (internal)
#   /_api/test          (internal)
#   /_admin/telemetrics (internal)
---
## Information

### Get the server version

```openapi
paths:
  /_db/{database-name}/_api/version:
  # /_admin/version is an (undocumented) alias
    get:
    # Technically accepts all of the following methods: HEAD, GET, POST, PATCH, PUT, DELETE
      operationId: getVersion
      description: |
        Returns the server name and version number. The response is a JSON object
        with the following attributes:
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of a database. Which database you use doesn't matter as long
            as the user account you authenticate with has at least read access
            to this database.
          schema:
            type: string
        - name: details
          in: query
          required: false
          description: |
            If set to `true` and if the user account you authenticate with has
            administrate access to the `_system` database, the response contains
            a `details` attribute with additional information about included
            components and their versions. The attribute names and internals of
            the `details` object may vary depending on platform and ArangoDB version.
          schema:
            type: boolean
      responses:
        '200':
          description: |
            is returned in all cases.
          content:
            application/json:
              schema:
                type: object
                required:
                  - server
                  - version
                properties:
                  server:
                    description: |
                      will always contain `arango`
                    type: string
                  version:
                    description: |
                      the server version string. The string has the format
                      `major.minor.sub`. `major` and `minor` will be numeric, and `sub`
                      may contain a number or a textual version.
                    type: string
                  details:
                    description: |
                      an optional JSON object with additional details. This is
                      returned only if the `details` query parameter is set to `true` in the
                      request.
                    type: object
                    properties:
                      architecture:
                        description: |
                          The CPU architecture, i.e. `64bit`
                        type: string
                      arm:
                        description: |
                          `false` - this is not running on an ARM cpu
                        type: string
                      asan:
                        description: |
                          has this been compiled with the asan address sanitizer turned on? (should be false)
                        type: string
                      assertions:
                        description: |
                          do we have assertions compiled in (=> developer version)
                        type: string
                      boost-version:
                        description: |
                          which boost version do we bind
                        type: string
                      build-date:
                        description: |
                          the date when this binary was created
                        type: string
                      build-repository:
                        description: |
                          reference to the git-ID this was compiled from
                        type: string
                      compiler:
                        description: |
                          which compiler did we use
                        type: string
                      cplusplus:
                        description: |
                          C++ standards version
                        type: string
                      debug:
                        description: |
                          `false` for production binaries
                        type: string
                      endianness:
                        description: |
                          currently only `little` is supported
                        type: string
                      failure-tests:
                        description: |
                          `false` for production binaries (the facility to invoke fatal errors is disabled)
                        type: string
                      fd-client-event-handler:
                        description: |
                          which method do we use to handle fd-sets, `poll` should be here on linux.
                        type: string
                      fd-setsize:
                        description: |
                          if not `poll` the fd setsize is valid for the maximum number of file descriptors
                        type: string
                      full-version-string:
                        description: |
                          The full version string
                        type: string
                      icu-version:
                        description: |
                          Which version of ICU do we bundle
                        type: string
                      jemalloc:
                        description: |
                          `true` if we use jemalloc
                        type: string
                      maintainer-mode:
                        description: |
                          `false` if this is a production binary
                        type: string
                      openssl-version:
                        description: |
                          which openssl version do we link?
                        type: string
                      platform:
                        description: |
                          the host operating system, always `linux`
                        type: string
                      reactor-type:
                        description: |
                          `epoll`
                        type: string
                      rocksdb-version:
                        description: |
                          the rocksdb version this release bundles
                        type: string
                      server-version:
                        description: |
                          the ArangoDB release version
                        type: string
                      sizeof int:
                        description: |
                          number of bytes for integers
                        type: string
                      sizeof void*:
                        description: |
                          number of bytes for void pointers
                        type: string
                      sse42:
                        description: |
                          do we have a SSE 4.2 enabled cpu?
                        type: string
                      unaligned-access:
                        description: |
                          does this system support unaligned memory access?
                        type: string
                      v8-version:
                        description: |
                          the bundled V8 javascript engine version
                        type: string
                      vpack-version:
                        description: |
                          the version of the used velocypack implementation
                        type: string
                      zlib-version:
                        description: |
                          the version of the bundled zlib
                        type: string
                      mode:
                        description: |
                          The mode arangod runs in.
                        type: string
                        enum: [server, console, script]
                      host:
                        description: |
                          the host ID
                        type: string
      tags:
        - Administration
```

**Examples**

```curl
---
description: |-
  Return the version information
name: RestVersion
---
var response = logCurlRequest('GET', '/_api/version');

assert(response.code === 200);

logJsonResponse(response);
```

```curl
---
description: |-
  Return the version information with details
name: RestVersionDetails
---
var response = logCurlRequest('GET', '/_api/version?details=true');

assert(response.code === 200);

logJsonResponse(response);
```

### Get the storage engine type

```openapi
paths:
  /_db/{database-name}/_api/engine:
    get:
      operationId: getEngine
      description: |
        Returns the storage engine the server is configured to use.
        The response is a JSON object with the following attributes:
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of a database. Which database you use doesn't matter as long
            as the user account you authenticate with has at least read access
            to this database.
          schema:
            type: string
      responses:
        '200':
          description: |
            is returned in all cases.
          content:
            application/json:
              schema:
                type: object
                required:
                  - name
                properties:
                  name:
                    description: |
                      will be `rocksdb`
                    type: string
      tags:
        - Administration
```

**Examples**

```curl
---
description: |-
  Return the active storage engine:
name: RestEngine
---
var response = logCurlRequest('GET', '/_api/engine');

assert(response.code === 200);

logJsonResponse(response);
```

### Get the system time

```openapi
paths:
  /_db/{database-name}/_admin/time:
    get:
    # Technically accepts all of the following methods: HEAD, GET, POST, PATCH, PUT, DELETE
      operationId: getTime
      description: |
        The call returns an object with the `time` attribute. This contains the
        current system time as a Unix timestamp with microsecond precision.
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of a database. Which database you use doesn't matter as long
            as the user account you authenticate with has at least read access
            to this database.
          schema:
            type: string
      responses:
        '200':
          description: |
            Time was returned successfully.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - time
                properties:
                  error:
                    description: |
                      boolean flag to indicate whether an error occurred (`false` in this case)
                    type: boolean
                  code:
                    description: |
                      the HTTP status code
                    type: integer
                  time:
                    description: |
                      The current system time as a Unix timestamp with microsecond precision of the server
                    type: number
      tags:
        - Administration
```

### Get server status information

```openapi
paths:
  /_db/{database-name}/_admin/status:
    get:
    # Technically accepts all of the following methods: HEAD, GET, POST, PATCH, PUT, DELETE
      operationId: getStatus
      description: |
        Returns status information about the server.
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of a database. Which database you use doesn't matter as long
            as the user account you authenticate with has at least read access
            to this database. If the `--server.harden` startup option is enabled,
            administrate access to the `_system` database is required.
          schema:
            type: string
      responses:
        '200':
          description: |
            Status information was returned successfully.
          content:
            application/json:
              schema:
                type: object
                required:
                  - server
                  - license
                  - version
                  - mode
                  - operationMode
                  - foxxApi
                  - host
                  - pid
                  - serverInfo
                properties:
                  server:
                    description: |
                      Always `"arango"`.
                    type: string
                  license:
                    description: |
                      ArangoDB Edition, either `"community"` or `"enterprise"`.
                    type: string
                  version:
                    description: |
                      The server version as a string.
                    type: string
                  mode:
                    description: |
                      Either `"server"` or `"console"`. **Deprecated**, use `operationMode` instead.
                    type: string
                  operationMode:
                    description: |
                      Either `"server"` or `"console"`.
                    type: string
                  foxxApi:
                    description: |
                      Whether the Foxx API is enabled.
                    type: boolean
                  host:
                    description: |
                      A host identifier defined by the `HOST` or `NODE_NAME` environment variable,
                      or a fallback value using a machine identifier or the cluster/Agency address.
                    type: string
                  hostname:
                    description: |
                      A hostname defined by the `HOSTNAME` environment variable.
                    type: string
                  pid:
                    description: |
                      The process ID of _arangod_.
                    type: number
                  serverInfo:
                    description: |
                      Information about the server status.
                    type: object
                    required:
                      - progress
                      - role
                      - writeOpsEnabled
                      - readOnly
                      - maintenance
                    properties:
                      progress:
                        description: |
                          Startup and recovery information.

                          You can check for changes to determine whether progress was made between two
                          calls, but you should not rely on specific values as they may change between
                          ArangoDB versions. The values are only expected to change during the startup and
                          shutdown, i.e. while `maintenance` is `true`.

                          You need to start _arangod_ with the `--server.early-connections` startup option
                          enabled to be able to query the endpoint during the startup process.
                          If authentication is enabled, then you need to use the super-user JWT for the
                          request because the user management is not available during the startup.
                        type: object
                        required:
                          - phase
                          - feature
                          - recoveryTick
                        properties:
                          phase:
                            description: |
                              Name of the lifecycle phase the instance is currently in. Normally one of
                              `"in prepare"`, `"in start"`, `"in wait"`, `"in shutdown"`, `"in stop"`,
                              or `"in unprepare"`.
                            type: string
                          feature:
                            description: |
                              Internal name of the feature that is currently being prepared, started,
                              stopped or unprepared.
                            type: string
                          recoveryTick:
                            description: |
                              Current recovery sequence number value, if the instance is currently recovering.
                              If the instance is already past the recovery, this attribute will contain the
                              last handled recovery sequence number.
                            type: number
                      role:
                        description: |
                          Either `"SINGLE"`, `"COORDINATOR"`, `"PRIMARY"` (DB-Server), or `"AGENT"`.
                        type: string
                      writeOpsEnabled:
                        description: |
                          Whether writes are enabled. **Deprecated**, use `readOnly` instead.
                        type: boolean
                      readOnly:
                        description: |
                          Whether writes are disabled.
                        type: boolean
                      maintenance:
                        description: |
                          Whether the maintenance mode is enabled.
                        type: boolean
                      persistedId:
                        description: |
                          The persisted ID, e. g. `"CRDN-e427b441-5087-4a9a-9983-2fb1682f3e2a"`.
                          *Cluster only* (Agents, Coordinators, and DB-Servers).
                        type: string
                      rebootId:
                        description: |
                          The reboot ID. Changes on every restart.
                          *Cluster only* (Agents, Coordinators, and DB-Servers).
                        type: number
                      state:
                        description: |
                          Either `"STARTUP"`, `"SERVING"`, or `"SHUTDOWN"`.
                          *Cluster only* (Coordinators and DB-Servers).
                        type: string
                      address:
                        description: |
                          The address of the server, e.g. `tcp://[::1]:8530`.
                          *Cluster only* (Coordinators and DB-Servers).
                        type: string
                      serverId:
                        description: |
                          The server ID, e.g. `"CRDN-e427b441-5087-4a9a-9983-2fb1682f3e2a"`.
                          *Cluster only* (Coordinators and DB-Servers).
                        type: string
                  agency:
                    description: |
                      Information about the Agency.
                      *Cluster only* (Coordinators and DB-Servers).
                    type: object
                    properties:
                      agencyComm:
                        description: |
                          Information about the communication with the Agency.
                          *Cluster only* (Coordinators and DB-Servers).
                        type: object
                        properties:
                          endpoints:
                            description: |
                              A list of possible Agency endpoints.
                            type: array
                            items:
                              type: string
                  coordinator:
                    description: |
                      Information about the Coordinators.
                      *Cluster only* (Coordinators)
                    type: object
                    properties:
                      foxxmaster:
                        description: |
                          The server ID of the Coordinator that is the Foxx master.
                        type: array
                        items:
                          type: string
                      isFoxxmaster:
                        description: |
                          Whether the queried Coordinator is the Foxx master.
                        type: array
                        items:
                          type: string
                  agent:
                    description: |
                      Information about the Agents.
                      *Cluster only* (Agents)
                    type: object
                    properties:
                      id:
                        description: |
                          Server ID of the queried Agent.
                        type: string
                      leaderId:
                        description: |
                          Server ID of the leading Agent.
                        type: string
                      leading:
                        description: |
                          Whether the queried Agent is the leader.
                        type: boolean
                      endpoint:
                        description: |
                          The endpoint of the queried Agent.
                        type: string
                      term:
                        description: |
                          The current term number.
                        type: number
      tags:
        - Administration
```

**Examples**

```curl
---
description: ''
name: RestAdminStatus
type: cluster
---
var url = "/_admin/status";
var response = logCurlRequest("GET", url);

assert(response.code === 200);

logJsonResponse(response);
```

### Return whether or not a server is available

```openapi
paths:
  /_admin/server/availability:
  # Independent of database
    get:
      operationId: getServerAvailability
      description: |
        Return availability information about a server.

        The response is a JSON object with an attribute "mode". The "mode" can either
        be "readonly", if the server is in read-only mode, or "default", if it is not.
        Please note that the JSON object with "mode" is only returned in case the server
        does not respond with HTTP response code 503.

        This is a public API so it does *not* require authentication. It is meant to be
        used only in the context of server monitoring.
      responses:
        '200':
          description: |
            This API will return HTTP 200 in case the server is up and running and usable for
            arbitrary operations, is not set to read-only mode.
        '503':
          description: |
            HTTP 503 will be returned during startup and shutdown, and in case
            the server is set to read-only mode.

            In addition, HTTP 503 will be returned in case the fill grade of the scheduler
            queue exceeds the configured high-water mark (adjustable via startup option
            `--server.unavailability-queue-fill-grade`), which by default is set to 75 % of
            the maximum queue length.
      tags:
        - Administration
```

### Get information about the deployment

```openapi
paths:
  /_db/_system/_admin/support-info:
    get:
      # Technically accepts all of the following methods: HEAD, GET, POST, PATCH, PUT, DELETE
      operationId: getSupportInfo
      description: |
        Retrieves deployment information for support purposes. The endpoint returns data
        about the ArangoDB version used, the host (operating system, server ID, CPU and
        storage capacity, current utilization, a few metrics) and the other servers in
        the deployment (in case of cluster deployments).

        As this API may reveal sensitive data about the deployment, it can only be
        accessed from inside the `_system` database. In addition, there is a policy
        control startup option `--server.support-info-api` that controls if and to whom
        the API is made available.
      responses:
        '200':
          description: ''
          content:
            application/json:
              schema:
                type: object
                required:
                  - date
                  - deployment
                properties:
                  date:
                    description: |
                      ISO 8601 datetime string of when the information was requested.
                    type: string
                  deployment:
                    description: |
                      An object with at least a `type` attribute, indicating the deployment mode.

                      In case of a `"single"` server, additional information is provided in the
                      top-level `host` attribute.

                      In case of a `"cluster"`, there is a `servers` object that contains a nested
                      object for each Coordinator and DB-Server, using the server ID as key. Each
                      object holds information about the ArangoDB instance as well as the host machine.
                      There are additional attributes for the number of `agents`, `coordinators`,
                      `dbServers`, and `shards`.
                    type: object
                  host:
                    description: |
                      An object that holds information about the ArangoDB instance as well as the
                      host machine. Only set in case of single servers.
                    type: object
        '404':
          description: |
            The support info API is turned off.
      tags:
        - Administration
```

**Examples**

```curl
---
description: |-
  Query support information from a single server
name: RestAdminSupportInfo
---
var url = "/_db/_system/_admin/support-info";
var response = logCurlRequest("GET", url);
assert(response.code === 200);
assert(response.parsedBody.host !== undefined);
logJsonResponse(response);
```

```curl
---
description: |-
  Query support information from a cluster
name: RestAdminSupportInfo
type: cluster
---
var url = "/_db/_system/_admin/support-info";
var response = logCurlRequest("GET", url);
assert(response.code === 200);
assert(response.parsedBody.deployment.servers !== undefined);
logJsonResponse(response);
```

## Startup options

The permissions required to use the `/_admin/options*` endpoints depends on the
setting of the [`--server.options-api` startup option](../../components/arangodb-server/options.md#--serveroptions-api).

### Get the startup option configuration

```openapi
paths:
  /_db/_system/_admin/options:
    get:
      operationId: getEffectiveStartupOptions
      description: |
        Return the effective configuration of the queried _arangod_ instance as
        set by startup options on the command-line and via a configuration file.

        {{</* security */>}}
        This endpoint may reveal sensitive information about the deployment!
        {{</* /security */>}}

        The endpoint can only be accessed via the `_system` database.
        In addition, the `--server.options-api` startup option controls the
        required privileges to access the option endpoints and allows you to
        disable them entirely. The option can have the following values:
        - `disabled`: the option endpoints are disabled
        - `jwt`: the option endpoints can only be accessed using a superuser JWT (default)
        - `admin`: the option endpoints can only be accessed by users with
          *Administrate* access level for the `_system` database
        - `public`: every user with access to the `_system` database can access
          the option endpoints
      responses:
        '200':
          description: |
            An object with startup option names as keys and their effective
            value as values. The values can be of different data types, typically
            numbers, strings, or arrays thereof.
          content:
            application/json:
              schema:
                type: object
      tags:
        - Administration
```

### Get the available startup options

```openapi
paths:
  /_db/_system/_admin/options-description:
    get:
      operationId: getAvailableStartupOptions
      description: |
        Return the startup options available to configure the queried _arangod_
        instance, similar to the `--dump-options` startup option.

        The endpoint can only be accessed via the `_system` database.
        In addition, the `--server.options-api` startup option controls the
        required privileges to access the option endpoints and allows you to
        disable them entirely. The option can have the following values:
        - `disabled`: the option endpoints are disabled
        - `jwt`: the option endpoints can only be accessed using a superuser JWT (default)
        - `admin`: the option endpoints can be accessed by admin users in the `_system`
          database only.
        - `public`: every user with access to the `_system` database can access
          the option endpoints.
      responses:
        '200':
          description: |
            An object with startup option names as keys and sub-objects as values.
            The structure of each sub-object is as follows:
            - `section` (string): The part before the dot of a startup option
              (`--section.param`), or `""` if it is a general option that doesn't
              belong to a section
            - `description` (string): A succinct explanation of the startup option
            - `longDescription` (string, *optional*): Additional details about the
              startup option if available
            - `category` (string): Either `"option"` for regular options or `"command"`
              if using the option performs an action and then terminates the process
            - `hidden` (boolean): Whether the option is uncommon. If yes, then
              the `--help` command does not list it, but `--help-all` lists every
              startup option
            - `type` (string): the data type of the option, typically one of
              `"uint64"`, `"uint32"`, `"int64"`, `"int32"`, `"double"`, `"boolean"`,
              `"string"`, `"string..."`
            - `experimental` (boolean): Whether the option relates to a feature
              that is not ready for production yet
            - `obsolete` (boolean): Whether the option has been deprecated and
              no effect anymore
            - `enterpriseOnly` (boolean): Whether the option is only available in
              the Enterprise Edition. The Community Edition does have most of the
              Enterprise Edition startup options and they are thus not reported
            - `requiresValue` (boolean): Whether the option can be specified
              without a value to enable it
            - `os` (array of strings): The operating systems the startup option
              is supported on, always `["linux"]`
            - `component` (array of strings): A list of server roles the startup
              option is available on. If it is supported by all cluster node types
              as well as the single server deployment mode, then the value is
              `["coordinator", "dbserver", "agent", "single"]`
            - `introducedIn` (array of strings\|null): A list of versions the
              startup option has been added in. Does not include later minor and
              major versions then the current version, and the information may
              get removed once all listed versions reach their end of life
            - `deprecatedIn` (array of strings\|null): A list of versions the
              startup option has been marked for deprecation in. It can still
              be used until fully removed. Does not include later minor and
              major versions then the current version, and the information may
              get removed once all listed versions reach their end of life
            - `values` (string, *optional*):
              A description of the possible values you can set
            - `default` (any, *optional*): The standard value if the option is not set
            - `dynamic` (boolean): Whether the default value is calculated based
              on the target host configuration, e.g. available memory
            - `required` (boolean): Whether the option must be specified
            - `base` (number, *optional*): the unit for a numeric option
            - `minValue` (number, *optional*): The minimum value for a numeric option
            - `maxValue` (number, *optional*): The maximum value for a numeric option
            - `minInclusive` (boolean, *optional*): Whether the minimum value is
              included in the allowed value range
            - `maxInclusive` (boolean, *optional*): Whether the maximum value is
              included in the allowed value range
          content:
            application/json:
              schema:
                type: object
      tags:
        - Administration
```

## Server mode

### Return whether or not a server is in read-only mode

```openapi
paths:
  /_db/{database-name}/_admin/server/mode:
    get:
      operationId: getServerMode
      description: |
        Return mode information about a server. The json response will contain
        a field `mode` with the value `readonly` or `default`. In a read-only server
        all write operations will fail with an error code of `1004` (_ERROR_READ_ONLY_).
        Creating or dropping of databases and collections will also fail with error code `11` (_ERROR_FORBIDDEN_).

        This API requires authentication.
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of a database. Which database you use doesn't matter as long
            as the user account you authenticate with has at least read access
            to this database.
          schema:
            type: string
      responses:
        '200':
          description: |
            This API will return HTTP 200 if everything is ok
      tags:
        - Administration
```

### Set the server mode to read-only or default

```openapi
paths:
  /_db/{database-name}/_admin/server/mode:
    put:
      operationId: setServerMode
      description: |
        Update mode information about a server. The JSON response will contain
        a field `mode` with the value `readonly` or `default`. In a read-only server
        all write operations will fail with an error code of `1004` (_ERROR_READ_ONLY_).
        Creating or dropping of databases and collections will also fail with error
        code `11` (_ERROR_FORBIDDEN_).

        This is a protected API. It requires authentication and administrative
        server rights.
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
                - mode
              properties:
                mode:
                  description: |
                    The mode of the server `readonly` or `default`.
                  type: string
      responses:
        '200':
          description: |
            This API will return HTTP 200 if everything is ok
        '401':
          description: |
            if the request was not authenticated as a user with sufficient rights
      tags:
        - Administration
```

## License

The endpoints for license management allow you to view the current license
status and update the license of your ArangoDB Enterprise Edition deployment.

### Get information about the current license

```openapi
paths:
  /_db/{database-name}/_admin/license:
    get:
      operationId: getLicense
      description: |
        View the license information and status of an Enterprise Edition instance.
        Can be called on single servers, Coordinators, and DB-Servers.
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of a database. Which database you use doesn't matter as long
            as the user account you authenticate with has at least read access
            to this database. If the `--server.harden` startup option is enabled,
            administrate access to the `_system` database is required.
          schema:
            type: string
      responses:
        '200':
          description: |
            Returns the license information.
          content:
            application/json:
              schema:
                type: object
                required:
                  - license
                properties:
                  features:
                    description: |
                      The properties of the license.
                    type: object
                    required:
                      - expires
                    properties:
                      expires:
                        description: |
                          The `expires` key lists the expiry date as Unix timestamp (seconds since
                          January 1st, 1970 UTC).
                        type: number
                        example: 1683173040
                  license:
                    description: |
                      The encrypted license key in Base64 encoding, or `"none"`
                      in the Community Edition.
                    type: string
                    example: V0h/W...wEDw==
                  hash:
                    description: |
                      The hash value of the license.
                    type: string
                    example: 982db5...44f3
                  version:
                    description: |
                      The license version number.
                    type: number
                    example: 1
                  status:
                    description: |
                      The `status` key allows you to confirm the state of the installed license on a
                      glance.

                      - `good`: The license is valid for more than 2 weeks.
                      - `expiring`: The license is valid for less than 2 weeks.
                      - `expired`: The license has expired. In this situation, no new
                        Enterprise Edition features can be utilized.
                      - `read-only`: The license is expired over 2 weeks. The instance is now
                        restricted to read-only mode.
                    type: string
                    enum: [good, expiring, expired, read-only]
                    example: good
                  upgrading:
                    description: |
                      Whether the server is performing a database upgrade.
                    type: boolean
                    example: false
      tags:
        - Administration
```

**Examples**

```curl
---
description: ''
name: RestAdminLicenseGet
type: cluster
---
var url = "/_admin/license";
var response = logCurlRequest('GET', url);
assert(response.code === 200);
logJsonResponse(response);
```

### Set a new license

```openapi
paths:
  /_db/{database-name}/_admin/license:
    put:
      operationId: setLicense
      description: |
        Set a new license for an Enterprise Edition instance.
        Can be called on single servers, Coordinators, and DB-Servers.
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of a database. Which database you use doesn't matter as long
            as the user account you authenticate with has at least read access
            to this database. If the `--server.harden` startup option is enabled,
            administrate access to the `_system` database is required.
          schema:
            type: string
        - name: force
          in: query
          required: false
          description: |
            Set to `true` to change the license even if it expires sooner than the current one.
          schema:
            type: boolean
            default: false
      requestBody:
        content:
          application/json:
            schema:
              description: |
                The request body has to contain the Base64-encoded string wrapped in double quotes.
              type: string
              example: eyJncmFudCI6...(Base64-encoded license string)...
      responses:
        '201':
          description: |
            License successfully deployed.
          content:
            application/json:
              schema:
                type: object
                required:
                  - result
                properties:
                  result:
                    type: object
                    required:
                      - error
                      - code
                    properties:
                      error:
                        description: |
                          A flag indicating that no error occurred.
                        type: boolean
                        example: false
                      code:
                        description: |
                          The HTTP status code.
                        type: integer
                        example: 201
        '400':
          description: |
            If the license expires earlier than the previously installed one,
            or if the supplied license string is invalid.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP status code.
                    type: integer
                    example: 400
                  errorNum:
                    description: |
                      The ArangoDB error number.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '501':
          description: |
            If you try to apply a license in the Community Edition.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP status code.
                    type: integer
                    example: 501
                  errorNum:
                    description: |
                      The ArangoDB error number.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
      tags:
        - Administration
```

**Examples**

{{< comment >}}
Example not generated because it would require a valid license to demonstrate the API.
{{< /comment >}}

```bash
curl --header 'accept: application/json' --dump - --data '"eyJncmFudCI6...(Base64-encoded license string)..."' -X PUT http://localhost:8529/_admin/license
```

{{< expand title="Show output" >}}
```bash
HTTP/1.1 201 Created
content-type: application/json
cache-control: no-cache, no-store, must-revalidate, pre-check=0, post-check=0, max-age=0, s-maxage=0
connection: Keep-Alive
content-length: 37
content-security-policy: frame-ancestors 'self'; form-action 'self';
expires: 0
pragma: no-cache
server: ArangoDB
strict-transport-security: max-age=31536000 ; includeSubDomains
x-arango-queue-time-seconds: 0.000000
x-content-type-options: nosniff

{
  "result": {
    "error": false,
    "code": 201
  }
}
```
{{< /expand >}}

## Shutdown

### Start the shutdown sequence

```openapi
paths:
  /_db/{database-name}/_admin/shutdown:
    delete:
      operationId: startShutdown
      description: |
        This call initiates a clean shutdown sequence. Requires administrative privileges.
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
        - name: soft
          in: query
          required: false
          description: |
            <small>Introduced in: v3.7.12, v3.8.1, v3.9.0</small>

            If set to `true`, this initiates a soft shutdown. This is only available
            on Coordinators. When issued, the Coordinator tracks a number of ongoing
            operations, waits until all have finished, and then shuts itself down
            normally. It will still accept new operations.

            This feature can be used to make restart operations of Coordinators less
            intrusive for clients. It is designed for setups with a load balancer in front
            of Coordinators. Remove the designated Coordinator from the load balancer before
            issuing the soft-shutdown. The remaining Coordinators will internally forward
            requests that need to be handled by the designated Coordinator. All other
            requests will be handled by the remaining Coordinators, reducing the designated
            Coordinator's load.

            The following types of operations are tracked:

             - AQL cursors (in particular streaming cursors)
             - Transactions (in particular stream transactions)
             - Ongoing asynchronous requests (using the `x-arango-async: store` HTTP header)
             - Finished asynchronous requests, whose result has not yet been
               collected
             - Queued low priority requests (most normal requests)
             - Ongoing low priority requests
          schema:
            type: boolean
      responses:
        '200':
          description: |
            is returned in all cases, `OK` will be returned in the result buffer on success.
      tags:
        - Administration
```

### Query the soft shutdown progress

```openapi
paths:
  /_db/{database-name}/_admin/shutdown:
    get:
      operationId: getShutdownProgress
      description: |
        <small>Introduced in: v3.7.12, v3.8.1, v3.9.0</small>

        This call reports progress about a soft Coordinator shutdown (see
        documentation of `DELETE /_admin/shutdown?soft=true`).
        In this case, the following types of operations are tracked:

         - AQL cursors (in particular streaming cursors)
         - Transactions (in particular stream transactions)
         - Ongoing asynchronous requests (using the `x-arango-async: store` HTTP header)
         - Finished asynchronous requests, whose result has not yet been
           collected
         - Queued low priority requests (most normal requests)
         - Ongoing low priority requests

        This API is only available on Coordinators.
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
            The response indicates the fact that a soft shutdown is ongoing and the
            number of active operations of the various types. Once all numbers have gone
            to 0, the flag `allClear` is set and the Coordinator shuts down automatically.
          content:
            application/json:
              schema:
                type: object
                required:
                  - softShutdownOngoing
                  - AQLcursors
                  - transactions
                  - pendingJobs
                  - doneJobs
                  - lowPrioOngoingRequests
                  - lowPrioQueuedRequests
                  - allClear
                properties:
                  softShutdownOngoing:
                    description: |
                      Whether a soft shutdown of the Coordinator is in progress.
                    type: boolean
                  AQLcursors:
                    description: |
                      Number of AQL cursors that are still active.
                    type: number
                  transactions:
                    description: |
                      Number of ongoing transactions.
                    type: number
                  pendingJobs:
                    description: |
                      Number of ongoing asynchronous requests.
                    type: number
                  doneJobs:
                    description: |
                      Number of finished asynchronous requests, whose result has not yet been collected.
                    type: number
                  lowPrioOngoingRequests:
                    description: |
                      Number of queued low priority requests.
                    type: number
                  lowPrioQueuedRequests:
                    description: |
                      Number of ongoing low priority requests.
                    type: number
                  allClear:
                    description: |
                      Whether all active operations finished.
                    type: boolean
      tags:
        - Administration
```

## Miscellaneous actions

### Compact all databases

```openapi
paths:
  /_admin/compact:
  # Independent of database (superuser has access to all databases that exist)
    put:
      operationId: compactAllDatabases
      description: |
        {{</* warning */>}}
        This command can cause a full rewrite of all data in all databases, which may
        take very long for large databases. It should thus only be used with care and
        only when additional I/O load can be tolerated for a prolonged time.
        {{</* /warning */>}}

        This endpoint can be used to reclaim disk space after substantial data
        deletions have taken place, by compacting the entire database system data.

        The endpoint requires superuser access.
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                changeLevel:
                  description: |
                    whether or not compacted data should be moved to the minimum possible level.
                    The default value is `false`.
                  type: boolean
                compactBottomMostLevel:
                  description: |
                    Whether or not to compact the bottommost level of data.
                    The default value is `false`.
                  type: boolean
      responses:
        '200':
          description: |
            Compaction started successfully
        '401':
          description: |
            if the request was not authenticated as a user with sufficient rights
      tags:
        - Administration
```

**Examples**

```curl
---
description: ''
name: RestAdminCompact
---
var response = logCurlRequest('PUT', '/_admin/compact', '');

assert(response.code === 200);

logJsonResponse(response);
```

### Reload the routing table

```openapi
paths:
  /_db/{database-name}/_admin/routing/reload:
    post:
    # Technically accepts all of the following methods: HEAD, GET, POST, PATCH, PUT, DELETE
      operationId: reloadRouting
      description: |
        Reloads the routing information from the `_routing` system collection if it
        exists, and makes Foxx rebuild its local routing table on the next request.
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of a database. Which database you use doesn't matter as long
            as the user account you authenticate with has at least read access
            to this database.
          schema:
            type: string
      responses:
        '200':
          description: |
            The routing information has been reloaded successfully.
      tags:
        - Administration
```

### Echo a request

```openapi
paths:
  /_db/{database-name}/_admin/echo:
    post:
      operationId: echoRequest
      description: |
        The call returns an object with the servers request information
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required:
                - body
              properties:
                body:
                  description: |
                    The request body can be of any type and is simply forwarded.
                  type: string
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of a database. Which database you use doesn't matter as long
            as the user account you authenticate with has at least read access
            to this database.
          schema:
            type: string
      responses:
        '200':
          description: |
            Echo was returned successfully.
          content:
            application/json:
              schema:
                type: object
                required:
                  - authorized
                  - user
                  - isAdminUser
                  - database
                  - url
                  - protocol
                  - portType
                  - server
                  - client
                  - internals
                  - prefix
                  - headers
                  - requestType
                  - requestBody
                  - rawRequestBody
                  - parameters
                  - cookies
                  - suffix
                  - rawSuffix
                  - path
                properties:
                  authorized:
                    description: |
                      Whether the session is authorized
                    type: boolean
                  user:
                    description: |
                      The name of the current user that sent this request
                    type: string
                  isAdminUser:
                    description: |
                      Whether the current user is an administrator
                    type: boolean
                  database:
                    description: |
                      The name of the database this request was executed on
                    type: string
                  url:
                    description: |
                      The raw request URL
                    type: string
                  protocol:
                    description: |
                      The transport protocol, one of `"http"`, `"https"`
                    type: string
                  portType:
                    description: |
                      The type of the socket, one of `"tcp/ip"`, `"unix"`, `"unknown"`
                    type: string
                  server:
                    description: |
                      Attributes of the server connection
                    type: object
                    required:
                      - address
                      - port
                      - endpoint
                    properties:
                      address:
                        description: |
                          The bind address of the endpoint this request was sent to
                        type: string
                      port:
                        description: |
                          The port this request was sent to
                        type: integer
                      endpoint:
                        description: |
                          The endpoint this request was sent to
                        type: string
                  client:
                    description: |
                      Attributes of the client connection
                    type: object
                    required:
                      - address
                      - port
                      - id
                    properties:
                      address:
                        description: |
                          The IP address of the client
                        type: integer
                      port:
                        description: |
                          The port of the TCP connection on the client-side
                        type: integer
                      id:
                        description: |
                          A server generated ID
                        type: string
                  internals:
                    description: |
                      Contents of the server internals struct
                    type: object
                  prefix:
                    description: |
                      The prefix of the database
                    type: object
                  headers:
                    description: |
                      The list of the HTTP headers you sent
                    type: object
                  requestType:
                    description: |
                      The HTTP method that was used for the request (`"POST"`). The endpoint can be
                      queried using other verbs, too (`"GET"`, `"PUT"`, `"PATCH"`, `"DELETE"`).
                    type: string
                  requestBody:
                    description: |
                      Stringified version of the request body you sent
                    type: string
                  rawRequestBody:
                    description: |
                      The sent payload as a JSON-encoded Buffer object
                    type: object
                  parameters:
                    description: |
                      An object containing the query parameters
                    type: object
                  cookies:
                    description: |
                      A list of the cookies you sent
                    type: object
                  suffix:
                    description: |
                      A list of the decoded URL path suffixes. You can query the endpoint with
                      arbitrary suffixes, e.g. `/_admin/echo/foo/123`
                    type: array
                    items:
                      type: string
                  rawSuffix:
                    description: |
                      A list of the percent-encoded URL path suffixes
                    type: array
                    items:
                      type: string
                  path:
                    description: |
                      The relative path of this request (decoded, excluding `/_admin/echo`)
                    type: string
      tags:
        - Administration
```

### Execute a script

```openapi
paths:
  /_db/{database-name}/_admin/execute:
    post:
    # Technically accepts all of the following methods: HEAD, GET, POST, PATCH, PUT, DELETE
      operationId: executeCode
      description: |
        Executes the JavaScript code in the body on the server as the body
        of a function with no arguments. If you have a `return` statement
        then the return value you produce will be returned as content type
        `application/json`. If the parameter `returnAsJSON` is set to
        `true`, the result will be a JSON object describing the return value
        directly, otherwise a string produced by JSON.stringify will be
        returned.

        Note that this API endpoint will only be present if the server was
        started with the option `--javascript.allow-admin-execute true`.

        The default value of this option is `false`, which disables the execution of
        user-defined code and disables this API endpoint entirely.
        This is also the recommended setting for production.
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of the database.
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required:
                - body
              properties:
                body:
                  description: |
                    The request body is the JavaScript code to be executed.
                  type: string
      responses:
        '200':
          description: |
            is returned when everything went well, or if a timeout occurred. In the
            latter case a body of type application/json indicating the timeout
            is returned. depending on `returnAsJSON` this is a json object or a plain string.
        '403':
          description: |
            is returned if ArangoDB is not running in cluster mode.
        '404':
          description: |
            is returned if ArangoDB was not compiled for cluster operation.
      tags:
        - Administration
```

## Endpoints

{{< warning >}}
The `/_api/endpoint` endpoint is deprecated. For cluster deployments, you can
use `/_api/cluster/endpoints` instead to find all current Coordinator endpoints.
See [Cluster](cluster.md#endpoints).
{{< /warning >}}

An ArangoDB server can listen for incoming requests on multiple _endpoints_.

The endpoints are normally specified either in the _arangod_ configuration
file or on the command-line, using the `--server.endpoint` startup option.
The default endpoint for ArangoDB is `tcp://127.0.0.1:8529` (IPv4 localhost on
port 8529 over the HTTP protocol).

Note that all endpoint management operations can only be accessed via
the default `_system` database and none of the other databases.

### List the endpoints of a single server (deprecated)

```openapi
paths:
  /_db/_system/_api/endpoint:
    get:
      operationId: listEndpoints
      description: |
        {{</* warning */>}}
        This route should no longer be used.
        It is considered as deprecated from version 3.4.0 on.
        {{</* /warning */>}}

        Returns an array of all configured endpoints the server is listening on.

        The result is a JSON array of JSON objects, each with `"entrypoint"` as
        the only attribute, and with the value being a string describing the
        endpoint.

        {{</* info */>}}
        Retrieving the array of all endpoints is allowed in the system database
        only. Calling this action in any other database will make the server return
        an error.
        {{</* /info */>}}
      responses:
        '200':
          description: |
            is returned when the array of endpoints can be determined successfully.
        '400':
          description: |
            is returned if the action is not carried out in the system database.
        '405':
          description: |
            The server will respond with *HTTP 405* if an unsupported HTTP method is used.
      tags:
        - Administration
```

**Examples**

```curl
---
description: ''
name: RestEndpointGet
---
var url = "/_db/_system/_api/endpoint";
var response = logCurlRequest('GET', url);
assert(response.code === 200);
logJsonResponse(response);
```
