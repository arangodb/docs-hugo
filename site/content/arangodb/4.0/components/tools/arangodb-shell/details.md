---
title: _arangosh_ Details
menuTitle: Details
weight: 10
description: ''
---
## Interaction

You can paste multiple lines into _arangosh_, given the first line ends with an
opening brace:

```js
---
name: shellPaste
description: ''
---
for (var i = 0; i < 10; i ++) {
  require("@arangodb").print("Hello world " + i + "!\n");
}
```

To load your own JavaScript code into the current JavaScript interpreter context,
use the load command:

```js
require("internal").load("/tmp/test.js")
```

You can exit arangosh using the key combination {{< kbd "Ctrl D" >}} or by
typing `quit` and hitting {{< kbd "Return" >}}.

## Shell Output

The ArangoDB shell prints the output of the last evaluated expression
by default:

```js
---
name: lastExpressionResult
description: ''
---
42 * 23
```

In order to prevent printing the result of the last evaluated expression,
the expression result can be captured in a variable, e.g.

```js
---
name: lastExpressionResultCaptured
description: ''
---
var calculationResult = 42 * 23
```

There is also the `print` function to explicitly print out values in the
ArangoDB shell:

```js
---
name: printFunction
description: ''
---
print({ a: "123", b: [1,2,3], c: "test" });
```

By default, the ArangoDB shell uses a pretty printer when JSON documents are
printed. This ensures documents are printed in a human-readable way:

```js
---
name: usingToArray
description: ''
---
db._create("five")
for (var i = 0; i < 5; i++) {
  db.five.save({value:i});
}
db.five.toArray()
~db._drop("five");
```

While the pretty-printer produces nice looking results, it needs a lot of
screen space for each document. Sometimes a more dense output might be better.
In this case, the pretty printer can be turned off using the command
`stop_pretty_print()`.

To turn on pretty printing again, use the `start_pretty_print()` command.

## Escaping

In AQL, escaping is done traditionally with the backslash character: `\`.
For literal backslashes, you need to double backslashes to `\\`.
_arangosh_ requires another level of escaping, also with the backslash character.
It adds up to four backslashes that need to be written in _arangosh_ for a single
literal backslash (`c:\tmp\test.js`):

```js
db._query('RETURN "c:\\\\tmp\\\\test.js"')
```

You can use [bind variables](../../../aql/how-to-invoke-aql/with-arangosh.md) to
mitigate this:

```js
var somepath = "c:\\tmp\\test.js"
db._query(aql`RETURN ${somepath}`)
```

## Database Wrappers

_arangosh_ provides the [`db` object](../../../develop/javascript-api/@arangodb/db-object.md)
by default, and this object can be used for switching to a different database
and managing collections inside the current database.

For a list of available methods for the `db` object, type

```js
---
name: shellHelp
description: ''
---
db._help(); 
```

The implementation of the `db` object wraps HTTP requests
to ArangoDB's [HTTP API](../../../develop/http-api/_index.md).
It means that the following code performs around 100k HTTP requests:

```js
for (var i = 0; i < 100000; i++) {
  db.test.save({ name: { first: "Jan" }, count: i});
}
```

You should avoid making excessive calls like this and instead save batches of
documents in fewer HTTP requests:

```js
var batch = [];
for (var i = 0; i < 100000; i++) {
  batch.push({ name: { first: "Jan" }, count: i});
  if (batch.length >= 1000) {
    db.test.save(batch);
    batch = [];
  }
}
if (batch.length > 0) {
  db.test.save(batch);
}
```

## Using `arangosh` via Unix shebang mechanisms

In Unix operating systems, you can start scripts by specifying the interpreter in the first line of the script.
This is commonly called `shebang` or `hash bang`. You can also do that with `arangosh`, i.e. create `~/test.js`:

```sh
#!/usr/bin/arangosh --javascript.execute 
require("internal").print("hello world")
db._query("FOR x IN test RETURN x").toArray()
```

Note that the first line has to end with a blank in order to make it work.
Mark it executable to the OS: 

```sh
> chmod a+x ~/test.js
```

and finally try it out:

```sh
> ~/test.js
```

## Shell Configuration

_arangosh_ looks for a user-defined startup script named `.arangosh.rc` in the
user's home directory on startup. The home directory is likely at `/home/<username>/`
on Unix/Linux.

If the file `.arangosh.rc` is present in the home directory, _arangosh_ executes
the contents of this file inside the global scope.

You can use this to define your own extra variables and functions that you need often.
For example, you could put the following into the `.arangosh.rc` file in your home
directory:

```js
// "var" keyword avoided intentionally...
// otherwise "timed" would not survive the scope of this script
global.timed = function (cb) {
  console.time("callback");
  cb();
  console.timeEnd("callback");
};
```

This makes a function named `timed` available in _arangosh_ in the global scope.

You can now start _arangosh_ and invoke the function like this:

```js
timed(function () { 
  for (var i = 0; i < 1000; ++i) {
    db.test.save({ value: i }); 
  }
});
```

Please keep in mind that, if present, the `.arangosh.rc` file needs to contain valid
JavaScript code. If you want any variables in the global scope to survive you need to
omit the `var` keyword for them. Otherwise, the variables are only visible inside
the script itself, but not outside.

## JavaScript security options

The _arangosh_ shell has several options that allow you to limit what the
JavaScript code can access. Below you find an overview of the relevant options.

### Allowlists and denylists

Several options exist to restrict the functionality of JavaScript code
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
_arangosh_ uses.

These patterns and how they are applied can be observed in arangosh's log output
by enabling `--log.level V8=debug`.

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

- **Bundled JavaScript code**, shipped with _arangosh_:\
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
