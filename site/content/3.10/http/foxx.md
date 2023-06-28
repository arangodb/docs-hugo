---
title: HTTP interface for Foxx
menuTitle: Foxx
weight: 75
description: >-
  The HTTP API for Foxx allows you to manipulate Foxx microservices installed in
  a database
archetype: default
---
<small>Introduced in: v3.2.0</small>

For more information on Foxx and its JavaScript APIs see the
[Foxx documentation](../develop/foxx-microservices/_index.md).

## Management

```openapi
### List the installed services

paths:
  /_api/foxx:
    get:
      operationId: listFoxxServices
      description: |
        Fetches a list of services installed in the current database.

        Returns a list of objects with the following attributes:

        - `mount`: the mount path of the service
        - `development`: `true` if the service is running in development mode
        - `legacy`: `true` if the service is running in 2.8 legacy compatibility mode
        - `provides`: the service manifest's `provides` value or an empty object

        Additionally the object may contain the following attributes if they have been set on the manifest:

        - `name`: a string identifying the service type
        - `version`: a semver-compatible version string
      parameters:
        - name: excludeSystem
          in: query
          required: false
          description: |
            Whether or not system services should be excluded from the result.
          schema:
            type: boolean
      responses:
        '200':
          description: |
            Returned if the request was successful.
      tags:
        - Foxx
```
```openapi
### Get the service description

paths:
  /_api/foxx/service:
    get:
      operationId: getFoxxServiceDescription
      description: |
        Fetches detailed information for the service at the given mount path.

        Returns an object with the following attributes:

        - `mount`: the mount path of the service
        - `path`: the local file system path of the service
        - `development`: `true` if the service is running in development mode
        - `legacy`: `true` if the service is running in 2.8 legacy compatibility mode
        - `manifest`: the normalized JSON manifest of the service

        Additionally the object may contain the following attributes if they have been set on the manifest:

        - `name`: a string identifying the service type
        - `version`: a semver-compatible version string
      parameters:
        - name: mount
          in: query
          required: true
          description: |
            Mount path of the installed service.
          schema:
            type: string
      responses:
        '200':
          description: |
            Returned if the request was successful.
        '400':
          description: |
            Returned if the mount path is unknown.
      tags:
        - Foxx
```
```openapi
### Install a new service

paths:
  /_api/foxx:
    post:
      operationId: createFoxxService
      description: |
        Installs the given new service at the given mount path.

        The request body can be any of the following formats:

        - `application/zip`: a raw zip bundle containing a service
        - `application/javascript`: a standalone JavaScript file
        - `application/json`: a service definition as JSON
        - `multipart/form-data`: a service definition as a multipart form

        A service definition is an object or form with the following properties or fields:

        - `configuration`: a JSON object describing configuration values
        - `dependencies`: a JSON object describing dependency settings
        - `source`: a fully qualified URL or an absolute path on the server's file system

        When using multipart data, the `source` field can also alternatively be a file field
        containing either a zip bundle or a standalone JavaScript file.

        When using a standalone JavaScript file the given file will be executed
        to define our service's HTTP endpoints. It is the same which would be defined
        in the field `main` of the service manifest.

        If `source` is a URL, the URL must be reachable from the server.
        If `source` is a file system path, the path will be resolved on the server.
        In either case the path or URL is expected to resolve to a zip bundle,
        JavaScript file or (in case of a file system path) directory.

        Note that when using file system paths in a cluster with multiple Coordinators
        the file system path must resolve to equivalent files on every Coordinator.
      parameters:
        - name: mount
          in: query
          required: true
          description: |
            Mount path the service should be installed at.
          schema:
            type: string
        - name: development
          in: query
          required: false
          description: |
            Set to `true` to enable development mode.
          schema:
            type: boolean
        - name: setup
          in: query
          required: false
          description: |
            Set to `false` to not run the service's setup script.
          schema:
            type: boolean
        - name: legacy
          in: query
          required: false
          description: |
            Set to `true` to install the service in 2.8 legacy compatibility mode.
          schema:
            type: boolean
      responses:
        '201':
          description: |
            Returned if the request was successful.
      tags:
        - Foxx
```
```openapi
### Uninstall a service

paths:
  /_api/foxx/service:
    delete:
      operationId: deleteFoxxService
      description: |
        Removes the service at the given mount path from the database and file system.

        Returns an empty response on success.
      parameters:
        - name: mount
          in: query
          required: true
          description: |
            Mount path of the installed service.
          schema:
            type: string
        - name: teardown
          in: query
          required: false
          description: |
            Set to `false` to not run the service's teardown script.
          schema:
            type: boolean
      responses:
        '204':
          description: |
            Returned if the request was successful.
      tags:
        - Foxx
```
```openapi
### Replace a service

paths:
  /_api/foxx/service:
    put:
      operationId: replaceFoxxService
      description: |
        Removes the service at the given mount path from the database and file system.
        Then installs the given new service at the same mount path.

        This is a slightly safer equivalent to performing an uninstall of the old service
        followed by installing the new service. The new service's main and script files
        (if any) will be checked for basic syntax errors before the old service is removed.

        The request body can be any of the following formats:

        - `application/zip`: a raw zip bundle containing a service
        - `application/javascript`: a standalone JavaScript file
        - `application/json`: a service definition as JSON
        - `multipart/form-data`: a service definition as a multipart form

        A service definition is an object or form with the following properties or fields:

        - `configuration`: a JSON object describing configuration values
        - `dependencies`: a JSON object describing dependency settings
        - `source`: a fully qualified URL or an absolute path on the server's file system

        When using multipart data, the `source` field can also alternatively be a file field
        containing either a zip bundle or a standalone JavaScript file.

        When using a standalone JavaScript file the given file will be executed
        to define our service's HTTP endpoints. It is the same which would be defined
        in the field `main` of the service manifest.

        If `source` is a URL, the URL must be reachable from the server.
        If `source` is a file system path, the path will be resolved on the server.
        In either case the path or URL is expected to resolve to a zip bundle,
        JavaScript file or (in case of a file system path) directory.

        Note that when using file system paths in a cluster with multiple Coordinators
        the file system path must resolve to equivalent files on every Coordinator.
      parameters:
        - name: mount
          in: query
          required: true
          description: |
            Mount path of the installed service.
          schema:
            type: string
        - name: teardown
          in: query
          required: false
          description: |
            Set to `false` to not run the old service's teardown script.
          schema:
            type: boolean
        - name: setup
          in: query
          required: false
          description: |
            Set to `false` to not run the new service's setup script.
          schema:
            type: boolean
        - name: legacy
          in: query
          required: false
          description: |
            Set to `true` to install the new service in 2.8 legacy compatibility mode.
          schema:
            type: boolean
        - name: force
          in: query
          required: false
          description: |
            Set to `true` to force service install even if no service is installed under given mount.
          schema:
            type: boolean
      responses:
        '200':
          description: |
            Returned if the request was successful.
      tags:
        - Foxx
```
```openapi
### Upgrade a service

paths:
  /_api/foxx/service:
    patch:
      operationId: upgradeFoxxService
      description: |
        Installs the given new service on top of the service currently installed at the given mount path.
        This is only recommended for switching between different versions of the same service.

        Unlike replacing a service, upgrading a service retains the old service's configuration
        and dependencies (if any) and should therefore only be used to migrate an existing service
        to a newer or equivalent service.

        The request body can be any of the following formats:

        - `application/zip`: a raw zip bundle containing a service
        - `application/javascript`: a standalone JavaScript file
        - `application/json`: a service definition as JSON
        - `multipart/form-data`: a service definition as a multipart form

        A service definition is an object or form with the following properties or fields:

        - `configuration`: a JSON object describing configuration values
        - `dependencies`: a JSON object describing dependency settings
        - `source`: a fully qualified URL or an absolute path on the server's file system

        When using multipart data, the `source` field can also alternatively be a file field
        containing either a zip bundle or a standalone JavaScript file.

        When using a standalone JavaScript file the given file will be executed
        to define our service's HTTP endpoints. It is the same which would be defined
        in the field `main` of the service manifest.

        If `source` is a URL, the URL must be reachable from the server.
        If `source` is a file system path, the path will be resolved on the server.
        In either case the path or URL is expected to resolve to a zip bundle,
        JavaScript file or (in case of a file system path) directory.

        Note that when using file system paths in a cluster with multiple Coordinators
        the file system path must resolve to equivalent files on every Coordinator.
      parameters:
        - name: mount
          in: query
          required: true
          description: |
            Mount path of the installed service.
          schema:
            type: string
        - name: teardown
          in: query
          required: false
          description: |
            Set to `true` to run the old service's teardown script.
          schema:
            type: boolean
        - name: setup
          in: query
          required: false
          description: |
            Set to `false` to not run the new service's setup script.
          schema:
            type: boolean
        - name: legacy
          in: query
          required: false
          description: |
            Set to `true` to install the new service in 2.8 legacy compatibility mode.
          schema:
            type: boolean
        - name: force
          in: query
          required: false
          description: |
            Set to `true` to force service install even if no service is installed under given mount.
          schema:
            type: boolean
      responses:
        '200':
          description: |
            Returned if the request was successful.
      tags:
        - Foxx
```

## Configuration

```openapi
### Get the configuration options

paths:
  /_api/foxx/configuration:
    get:
      operationId: getFoxxConfiguration
      description: |
        Fetches the current configuration for the service at the given mount path.

        Returns an object mapping the configuration option names to their definitions
        including a human-friendly `title` and the `current` value (if any).
      parameters:
        - name: mount
          in: query
          required: true
          description: |
            Mount path of the installed service.
          schema:
            type: string
      responses:
        '200':
          description: |
            Returned if the request was successful.
      tags:
        - Foxx
```
```openapi
### Update the configuration options

paths:
  /_api/foxx/configuration:
    patch:
      operationId: updateFoxxConfiguration
      description: |
        Replaces the given service's configuration.

        Returns an object mapping all configuration option names to their new values.
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                options:
                  description: |
                    A JSON object mapping configuration option names to their new values.
                    Any omitted options will be ignored.
                  type: object
              required:
                - options
      parameters:
        - name: mount
          in: query
          required: true
          description: |
            Mount path of the installed service.
          schema:
            type: string
      responses:
        '200':
          description: |
            Returned if the request was successful.
      tags:
        - Foxx
```
```openapi
### Replace the configuration options

paths:
  /_api/foxx/configuration:
    put:
      operationId: replaceFoxxConfiguration
      description: |
        Replaces the given service's configuration completely.

        Returns an object mapping all configuration option names to their new values.
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                options:
                  description: |
                    A JSON object mapping configuration option names to their new values.
                    Any omitted options will be reset to their default values or marked as unconfigured.
                  type: object
              required:
                - options
      parameters:
        - name: mount
          in: query
          required: true
          description: |
            Mount path of the installed service.
          schema:
            type: string
      responses:
        '200':
          description: |
            Returned if the request was successful.
      tags:
        - Foxx
```
```openapi
### Get the dependency options

paths:
  /_api/foxx/dependencies:
    get:
      operationId: getFoxxDependencies
      description: |
        Fetches the current dependencies for service at the given mount path.

        Returns an object mapping the dependency names to their definitions
        including a human-friendly `title` and the `current` mount path (if any).
      parameters:
        - name: mount
          in: query
          required: true
          description: |
            Mount path of the installed service.
          schema:
            type: string
      responses:
        '200':
          description: |
            Returned if the request was successful.
      tags:
        - Foxx
```
```openapi
### Update the dependency options

paths:
  /_api/foxx/dependencies:
    patch:
      operationId: updateFoxxDependencies
      description: |
        Replaces the given service's dependencies.

        Returns an object mapping all dependency names to their new mount paths.
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                options:
                  description: |
                    A JSON object mapping dependency names to their new mount paths.
                    Any omitted dependencies will be ignored.
                  type: object
              required:
                - options
      parameters:
        - name: mount
          in: query
          required: true
          description: |
            Mount path of the installed service.
          schema:
            type: string
      responses:
        '200':
          description: |
            Returned if the request was successful.
      tags:
        - Foxx
```
```openapi
### Replace the dependency options

paths:
  /_api/foxx/dependencies:
    put:
      operationId: replaceFoxxDependencies
      description: |
        Replaces the given service's dependencies completely.

        Returns an object mapping all dependency names to their new mount paths.
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                options:
                  description: |
                    A JSON object mapping dependency names to their new mount paths.
                    Any omitted dependencies will be disabled.
                  type: object
              required:
                - options
      parameters:
        - name: mount
          in: query
          required: true
          description: |
            Mount path of the installed service.
          schema:
            type: string
      responses:
        '200':
          description: |
            Returned if the request was successful.
      tags:
        - Foxx
```

## Miscellaneous

```openapi
### List the service scripts

paths:
  /_api/foxx/scripts:
    get:
      operationId: listFoxxScripts
      description: |
        Fetches a list of the scripts defined by the service.

        Returns an object mapping the raw script names to human-friendly names.
      parameters:
        - name: mount
          in: query
          required: true
          description: |
            Mount path of the installed service.
          schema:
            type: string
      responses:
        '200':
          description: |
            Returned if the request was successful.
      tags:
        - Foxx
```
```openapi
### Run a service script

paths:
  /_api/foxx/scripts/{name}:
    post:
      operationId: runFoxxScript
      description: |
        Runs the given script for the service at the given mount path.

        Returns the exports of the script, if any.
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                data:
                  description: |
                    An arbitrary JSON value that will be parsed and passed to the
                    script as its first argument.
                  type: json
      parameters:
        - name: name
          in: path
          required: true
          description: |
            Name of the script to run.
          schema:
            type: string
        - name: mount
          in: query
          required: true
          description: |
            Mount path of the installed service.
          schema:
            type: string
      responses:
        '200':
          description: |
            Returned if the request was successful.
      tags:
        - Foxx
```
```openapi
### Run the service tests

paths:
  /_api/foxx/tests:
    post:
      operationId: runFoxxTests
      description: |
        Runs the tests for the service at the given mount path and returns the results.

        Supported test reporters are:

        - `default`: a simple list of test cases
        - `suite`: an object of test cases nested in suites
        - `stream`: a raw stream of test results
        - `xunit`: an XUnit/JUnit compatible structure
        - `tap`: a raw TAP compatible stream

        The `Accept` request header can be used to further control the response format:

        When using the `stream` reporter `application/x-ldjson` will result
        in the response body being formatted as a newline-delimited JSON stream.

        When using the `tap` reporter `text/plain` or `text/*` will result
        in the response body being formatted as a plain text TAP report.

        When using the `xunit` reporter `application/xml` or `text/xml` will result
        in the response body being formatted as XML instead of JSONML.

        Otherwise the response body will be formatted as non-prettyprinted JSON.
      parameters:
        - name: mount
          in: query
          required: true
          description: |
            Mount path of the installed service.
          schema:
            type: string
        - name: reporter
          in: query
          required: false
          description: |
            Test reporter to use.
          schema:
            type: string
        - name: idiomatic
          in: query
          required: false
          description: |
            Use the matching format for the reporter, regardless of the `Accept` header.
          schema:
            type: boolean
        - name: filter
          in: query
          required: false
          description: |
            Only run tests where the full name (including full test suites and test case)
            matches this string.
          schema:
            type: string
      responses:
        '200':
          description: |
            Returned if the request was successful.
      tags:
        - Foxx
```
```openapi
### Enable the development mode

paths:
  /_api/foxx/development:
    post:
      operationId: enableFoxxDevelopmentMode
      description: |
        Puts the service into development mode.

        While the service is running in development mode the service will be reloaded
        from the filesystem and its setup script (if any) will be re-executed every
        time the service handles a request.

        When running ArangoDB in a cluster with multiple Coordinators note that changes
        to the filesystem on one Coordinator will not be reflected across the other
        Coordinators. This means you should treat your Coordinators as inconsistent
        as long as any service is running in development mode.
      parameters:
        - name: mount
          in: query
          required: true
          description: |
            Mount path of the installed service.
          schema:
            type: string
      responses:
        '200':
          description: |
            Returned if the request was successful.
      tags:
        - Foxx
```
```openapi
### Disable the development mode

paths:
  /_api/foxx/development:
    delete:
      operationId: disableFoxxDevelopmentMode
      description: |
        Puts the service at the given mount path into production mode.

        When running ArangoDB in a cluster with multiple Coordinators this will
        replace the service on all other Coordinators with the version on this
        Coordinator.
      parameters:
        - name: mount
          in: query
          required: true
          description: |
            Mount path of the installed service.
          schema:
            type: string
      responses:
        '200':
          description: |
            Returned if the request was successful.
      tags:
        - Foxx
```
```openapi
### Get the service README

paths:
  /_api/foxx/readme:
    get:
      operationId: getFoxxReadme
      description: |
        Fetches the service's README or README.md file's contents if any.
      parameters:
        - name: mount
          in: query
          required: true
          description: |
            Mount path of the installed service.
          schema:
            type: string
      responses:
        '200':
          description: |
            Returned if the request was successful.
        '204':
          description: |
            Returned if no README file was found.
      tags:
        - Foxx
```
```openapi
### Get the Swagger description

paths:
  /_api/foxx/swagger:
    get:
      operationId: getFoxxSwaggerDescription
      description: |
        Fetches the Swagger API description for the service at the given mount path.

        The response body will be an OpenAPI 2.0 compatible JSON description of the service API.
      parameters:
        - name: mount
          in: query
          required: true
          description: |
            Mount path of the installed service.
          schema:
            type: string
      responses:
        '200':
          description: |
            Returned if the request was successful.
      tags:
        - Foxx
```
```openapi
### Download a service bundle

paths:
  /_api/foxx/download:
    post:
      operationId: downloadFoxxService
      description: |
        Downloads a zip bundle of the service directory.

        When development mode is enabled, this always creates a new bundle.

        Otherwise the bundle will represent the version of a service that
        is installed on that ArangoDB instance.
      parameters:
        - name: mount
          in: query
          required: true
          description: |
            Mount path of the installed service.
          schema:
            type: string
      responses:
        '200':
          description: |
            Returned if the request was successful.
        '400':
          description: |
            Returned if the mount path is unknown.
      tags:
        - Foxx
```
```openapi
### Commit the local service state

paths:
  /_api/foxx/commit:
    post:
      operationId: commitFoxxServiceState
      description: |
        Commits the local service state of the Coordinator to the database.

        This can be used to resolve service conflicts between Coordinators that cannot be fixed automatically due to missing data.
      parameters:
        - name: replace
          in: query
          required: false
          description: |
            Overwrite existing service files in database even if they already exist.
          schema:
            type: boolean
      responses:
        '204':
          description: |
            Returned if the request was successful.
      tags:
        - Foxx
```
