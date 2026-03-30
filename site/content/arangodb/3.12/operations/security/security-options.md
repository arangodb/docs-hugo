---
title: Server security options
menuTitle: Security Options
weight: 5
description: >-
  You can harden an ArangoDB server by restricting APIs, limiting what can be 
  accessed in JavaScript contexts, and disable unused features
---
_arangod_ provides a variety of options to make a setup more secure. 
Administrators can use these options to limit access to certain ArangoDB
server functionality as well as preventing the leakage of information about
the environment that a server is running in.

## Server hardening

If the [`--server.harden` startup option](../../components/arangodb-server/options.md#--serverharden)
is set to `true` and authentication is enabled, non-admin users are denied
access to the following HTTP APIs:

- `/_admin/cluster/numberOfServers`
- `/_admin/license`
- `/_admin/metrics`
- `/_admin/statistics-description`
- `/_admin/statistics`
- `/_admin/status`
- `/_admin/system-report`
- `/_admin/usage-metrics`
- `/_api/engine/stats`

Additionally, no version details are revealed by the version HTTP API at
`/_api/version`.

The default value for this option is `false`.

## API availability and access

Certain administrative endpoints can be restricted with startup options. Some
only let you control the availability of API endpoints while others let you
specify the access permissions and required level of authentication, or both.
Disabling APIs you don't use and increasing the access restriction help to
reduce the attack surface.

- [`--server.support-info-api`](../../components/arangodb-server/options.md#--serversupport-info-api)\
  [`--server.options-api`](../../components/arangodb-server/options.md#--serveroptions-api):

  - `disabled`: Disable the API.
  - `jwt`: The API can only be accessed via superuser JWTs.
  - `admin` (default): The API can only be accessed by admin users
    and superuser JWTs.
  - `public`: Everyone with access to the `_system` database can access the API.

- [`--backup.api-enabled`](../../components/arangodb-server/options.md#--backupapi-enabled)\
  [`--log.api-enabled`](../../components/arangodb-server/options.md#--logapi-enabled)\
  [`--log.recording-api-enabled`](../../components/arangodb-server/options.md#--logrecording-api-enabled):
  - `false`: Disable the API.
  - `jwt`: The API can only be accessed via superuser JWTs.
  - `true` (default): The API can only be accessed by admin users
    and superuser JWTs.

- [`--cluster.api-jwt-policy`](../../components/arangodb-server/options.md#--clusterapi-jwt-policy):
  - `jwt-all`: Superuser JWT required to access all operations
  - `jwt-write`: Superuser JWT required for `POST`/`PUT`/`DELETE` operations
  - `jwt-compat` (default): ArangoDB v3.7 compatibility mode

- [`--activities.only-superuser-enabled`](../../components/arangodb-server/options.md#--activitiesonly-superuser-enabled):
  - `true`: The API can only be accessed via superuser JWTs.
  - `false` (default): The API can only be accessed by admin users
    and superuser JWTs.

- [`--server.export-metrics-api`](../../components/arangodb-server/options.md#--serverexport-metrics-api):
  - `false`: Disable the API.
  - `true` (default): Enable the API.

## JavaScript security options

`arangod` has several options that allow you to make your installation more
secure when it comes to running application code in it. Below you find
an overview of the relevant options.

### Allowlists and denylists

Several options exist to restrict JavaScript application code functionality 
to just certain allowed subsets. Which subset of functionality is available
can be controlled via "denylisting" and "allowlisting" access to individual 
components.

The set theory for these lists works as follow:

- **Only a denylist is specified:**\
  Everything is allowed except a set of items matching the denylist.
- **Only an allowlist is specified:**\
  Everything is disallowed except the set of items matching the allowlist.
- **Both allowlist and denylist are specified:**\
  Everything is disallowed except the set of items matching the allowlist.
  From this allowed set, subsets can be forbidden again using the denylist.

Values for denylist and allowlist options need to be specified as ECMAScript 
regular expressions.

Each option can be used multiple times. When specifying more than one 
pattern, these patterns are combined with a _logical or_ to the actual pattern
ArangoDB uses.

These patterns and how they are applied can be observed in the `arangod` or
`arangosh` log output by enabling `--log.level security=debug`.

### Options for allowlisting and denylisting

The following options are available for allowlisting and denylisting access
to dedicated functionality for application code:

- `--javascript.startup-options-[allowlist|denylist]`:\
  These options control which startup options are exposed to JavaScript code.

- `--javascript.environment-variables-[allowlist|denylist]`:\
  These options control which environment variables are exposed to
  JavaScript code.

- `--javascript.files-allowlist`:\
  This option controls which filesystem paths can be accessed from JavaScript
  code. There is only an allowlist option for file access.

- `--javascript.endpoints-[allowlist|denylist]`:\
  These options control which endpoints can be used from within the
  `@arangodb/request` JavaScript module.

#### Startup option access

The security option to observe the behavior of the pattern matching most easily
is the masquerading of the startup options:

```sh
--javascript.startup-options-allowlist "^server\."
--javascript.startup-options-allowlist "^log\."
--javascript.startup-options-denylist "^javascript\."
--javascript.startup-options-denylist "^endpoint$"
```

These sets are resolved internally to the following regular expressions:

```sh
--javascript.startup-options-allowlist = "^server\.|^log\."
--javascript.startup-options-denylist = "^javascript\.|endpoint"
```

Invoking _arangosh_ with these options hides the denied command-line
options from the output of the following method:

```js
require('internal').options()
```

An exception is thrown when trying to access items that are masked
in the same way as if they wouldn't exist.

#### Environment variable access

Access to environment variables can be restricted to hide sensitive information
from JavaScript code, for example:

```sh
--javascript.environment-variables-allowlist "^ARANGO_"
--javascript.environment-variables-denylist "PASSWORD"
```

This allows JavaScript code to only see environment variables that start
with `ARANGO_`, except if they contain `PASSWORD`. It excludes the variables
`PATH` and `ARANGO_ROOT_PASSWORD` for instance.

Note that regular expression matching is case-sensitive. `PASSWORD` won't
exclude environment variables that include `password`. You may use
`[Pp][Aa][Ss][Ss][Ww][Oo][Rr][Dd]` for case-insensitive matching.

You can test the allow-/denylisting in _arangosh_, here using the ArangoDB 3.12
Docker image:

```sh
docker run --rm -e ARANGO_ROOT_PASSWORD="secret" arangodb:3.12 \
  arangosh --javascript.execute-string "print(process.env)"
```

```js
{
  "HOSTNAME" : "0aea68ec522d",
  "SHLVL" : "1",
  "HOME" : "/root",
  "ARANGO_ROOT_PASSWORD" : "secret",
  "ARANGO_VERSION" : "3.12.8",
  "PATH" : "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
  "PWD" : "/",
  "GLIBCXX_FORCE_NEW" : "1",
  "ICU_DATA_LEGACY" : "/usr/share/arangodb3/",
  "ICU_DATA" : "/usr/share/arangodb3/"
}
```

```sh
docker run --rm -e ARANGO_ROOT_PASSWORD="secret" arangodb:3.12 \
  arangosh --javascript.execute-string "print(process.env)" \
  --javascript.environment-variables-allowlist "^ARANGO_" \
  --javascript.environment-variables-denylist "PASSWORD"
```

```js
...
[Object {
  "ARANGO_VERSION" : "3.12.8"
}]
```

#### File access

In contrast to other areas, access to directories and files from JavaScript
operations is only controlled via an allowlist, which can be specified via the
startup option `--javascript.files-allowlist`. Thus any files or directories
not matching the allowlist are inaccessible from JavaScript filesystem
functions. Example:

```sh
--javascript.files-allowlist "^/etc/required/"
--javascript.files-allowlist "^/etc/mtab/"
--javascript.files-allowlist "^/etc/issue$"
```

The file `/etc/issue` can be accessed and all files in the directories
`/etc/required` and `/etc/mtab` plus their subdirectories are accessible,
while access to files in any other directories are disallowed from
JavaScript operations, with the following exceptions:

- **Temporary directory**:\
  JavaScript code is given access to this directory for storing temporary files.
  The temporary directory location can be specified explicitly via the
  `--temp.path` startup option.
  If the option is not specified, ArangoDB automatically use a subdirectory
  of the system's temporary directory.

- **Bundled JavaScript code**, shipped with _arangod_ and _arangosh_:\
  Files in this directory and its subdirectories are readable for JavaScript
  code running in _arangosh_. The exact path can be specified with the
  `--javascript.startup-directory` startup option.

#### Endpoint access

The endpoint allow-/denylisting limits access to external HTTP resources:

```sh
--javascript.endpoints-denylist "<regex>"
--javascript.endpoints-allowlist "<regex>"
```

Filtering is done against the full request URL, including protocol,
hostname/IP address, port, and path.

{{< security >}}
Keep in mind that these startup options are treated as regular expressions.
Certain characters have special meaning that may require escaping and the
expression only needs to match a substring by default. It is recommended to
fully specify URLs and to use a leading `^` and potentially a trailing `$` to
ensure that no other than the intended URLs are matched.
{{< /security >}}

Specifying `arangodb.org` matches:
- `http://arangodb.org`
- `http://arangodb.org/`
- `http://arangodb.org/folder/file.html`
- `https://arangodb.org`
- `https://arangodb.org:12345`
- `https://subdomain.arangodb.organic` **(!)**
- `https://arangodb-org.evil.domain` **(!)**
- etc.

An unescaped `.` represents any character. For a literal dot, use `\.`.

Specifying `http://arangodb\.org` matches:
- `http://arangodb.org`
- `http://arangodb.org:12345`
- `http://arangodb.organic` **(!)**
- `http://arangodb.org.evil.domain` **(!)**
- etc.

Specifying `^http://arangodb\.org$` only matches `http://arangodb.org`.
Despite port 80 being the default HTTP port, this doesn't match
`http://arangodb.org:80` with an explicitly stated port. Conversely, specifying
`^http://arangodb\.org:80$` matches `http://arangodb.org:80` with an explicit
port in the request URL but not `http://arangodb.org` with the port left out.
To allow both, you can make the port optional like `^http://arangodb\.org(:80)?$`.
However, the trailing `$` demands that the URL has no path. This means
`http://arangodb.org/folder/file.html` and even `http://arangodb.org/` don't
match. You can specify `^http://arangodb\.org(:80)?/` to allow any path (but
the trailing slash is needed in the request URL).

Specifying `^https?://arangodb\.org(:80|:443)?(/|$)` matches:
- `http://arangodb.org`
- `http://arangodb.org/`
- `http://arangodb.org/folder/file.html`
- `http://arangodb.org:80`
- `http://arangodb.org:80/`
- `http://arangodb.org:80/folder/file.html`
- `https://arangodb.org:443`
- `https://arangodb.org:443/`
- `https://arangodb.org:443/folder/file.html`
- etc.

You can test the allow-/denylisting in _arangosh_ as follows:

```sh
arangosh --javascript.endpoints-allowlist "^https://arangodb\.org(:443)?/"

127.0.0.1:8529@_system> require('internal').download('http://arangodb.org/file.zip')
JavaScript exception: ArangoError 11: not allowed to connect to this URL: http://arangodb.org/file.zip
...

127.0.0.1:8529@_system> require('internal').download('https://arangodb.org/file.zip')
<request permitted by allowlist>
```

{{< warning >}}
Startup options may require additional escaping in your command line.
For examples, dollar symbols and backslashes need to be escaped in most Linux
shells (`\$`, `\\`) unless the entire string is wrapped in single quotes
(`'tcp://arangodb\.org$'` instead of `tcp://arangodb\\.org\$`).
{{< /warning >}}

### Additional JavaScript security options

In addition to the allowlisting and denylisting security options, the following
extra options are available for locking down JavaScript access to certain
functionality:

- `--javascript.allow-port-testing`:
  If set to `true`, this option enables the `testPort` JavaScript function in the
  `internal` module. The default value is `false`.

- `--javascript.allow-external-process-control`:
  If set to `true`, this option allows the execution and control of external
  processes from JavaScript code via functions from the `internal` module:
  
  - `executeExternal`
  - `executeExternalAndWait`
  - `getExternalSpawned`
  - `killExternal`
  - `suspendExternal`
  - `continueExternal`
  - `statusExternal`

- `--javascript.harden`:
  If set to `true`, this setting deactivates the following JavaScript functions
  from the `internal` module, which may leak information about the environment:

  - `getPid()`
  - `logLevel()`

  The default value is `false`.

- `--javascript.tasks`: You can set this option to `false` to turn off
  [JavaScript tasks](../../develop/javascript-api/tasks.md). It disallows the
  execution of user-defined JavaScript code on the server inside of periodic
  and one-off tasks.

- `--javascript.transactions`: You can set this option to `false` to turn off
  [JavaScript Transactions](../../develop/http-api/transactions/javascript-transactions.md). It disallows
  the execution of user-defined JavaScript code on the server inside of
  JavaScript Transactions.

- `--javascript.user-defined-functions`: You can set this option to `false` to
  turn off [user-defined functions](../../aql/user-defined-functions.md) (UDFs). It disallows
  the execution of user-defined JavaScript code on the server inside of
  user-defined AQL functions (introduced in: v3.10.4).

## Security options for managing Foxx applications

The following options are available for controlling the installation of Foxx applications
in an ArangoDB server:

- `--foxx.enable` (introduced in: v3.10.5):
  If set to `false`, this option disables access to any user-defined Foxx apps.
  Accessing the URL of any (existing or potentially existing) Foxx app produces an
  HTTP `403 Forbidden` error with this setting.
  ArangoDB's built-in web interface and all built-in REST APIs remain accessible,
  except the Foxx service management API, which makes it impossible to install and
  uninstall Foxx applications. Setting the option to `false` also deactivates the
  **Services** section in the web interface.
  The default value is `true`, meaning that Foxx apps can be accessed. 

- `--foxx.api`:
  If set to `false`, this option disables the Foxx management API, which will make it
  impossible to install and uninstall Foxx applications. Setting the option to `false`
  will also deactivate the "Services" section in the web interface. 
  The default value is `true`, meaning that Foxx apps can be installed and uninstalled.

- `--foxx.store`:
  If set to `false`, this option disables the Foxx app store in ArangoDB's web interface,
  which will also prevent ArangoDB and its web interface from making calls to the main Foxx 
  application Github repository at
  [github.com/arangodb/foxx-apps](https://github.com/arangodb/foxx-apps).
  The default value is `true`.

- `--foxx.allow-install-from-remote`:
  When set to `false`, this option prevents installation of Foxx apps from any
  remote source other than GitHub and deactivates the **Remote** tab in the **Services**
  section of the web interface. Installing apps from Github and/or zip files is 
  still possible with this setting, but any other remote sources are blocked.
  When set to `true`, installing Foxx apps from other remote sources via URLs
  is allowed (introduced in: v3.8.5).
  The default value is `false`.
