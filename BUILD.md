# ArangoDB Docs Toolchain build

## Prerequisites

- **docker-compose**
- **Python 3**

## Migration Wizard

Create a dedicated folder for testing the wizard process.

**Setup**

```shell
.> git clone git@github.com:arangodb/docs-hugo.git
.> cd docs-hugo
docs-hugo> cd migration-tools
docs-hugo/migration-tools> pip3 install pyyaml commonmark python-frontmatter
```

**Execute migration**

```shell
# Execute the migration
docs-hugo/migration-tools> ./migration.sh migrate <docsOld> <docsNew> <docublocks> <version>
```

- `docsOld`: input path to the old toolchain and content in Jekyll's format,
  pointing to the root of the `arangodb/docs` working copy

- `docsNew`: output path for the new toolchain and content in Hugo's format,
  pointing to the root of the `arangodb/docs-hugo` working copy
  (not including `/site/content`)

- `docublocks`: input path to a working copy of the `arangodb/arangodb`
  repository, needed to read the old DocuBlocks

- `version`: the version of the old content to migrate to the new toolchain,
  indicating a version folder like `3.11`

## Build

### Docker

#### Plain Build

- Run the `docker compose` services using the `docker-compose.pain-build.yml` file

  ```shell
  docs/toolchain/docker> docker compose -f docker-compose.plain-build.yml up
  ```

This command spawns the following Docker containers:

- `site`: container with the site content running `hugo serve`
- `arangoproxy`: the Go web server

The site will be available at `http://0.0.0.0:1313`


#### Generated content

**Configuration**

The toolchain container needs to be set up via config file in docs-hugo/toolchain/docker/config.yaml

```yaml
generators:   # Generators to trigger - empty string defaults to all generators
servers:      # Array to define arangodb servers to be used by the toolchain
  - image:    # arangodb docker image to be used, can be arangodb/enterprise-preview:... or a branch name
    version:  # docs branch to put the generated content into
```

**List of available generators**
- examples
- metrics
- error-codes
- optimizer
- options
- oasisctl

The generators entry is a space-separated string

**Configuration Example**

```yaml
generators: examples oasisctl options optimizer
servers:
  - image: arangodb/enterprise-preview:3.11-nightly
    version: "3.11"
```

**Note**
If "metrics" or "error-codes" in generators, the following environment variable has to be exported
```shell
export ARANGODB_SRC_{VERSION}=path/to/arangodb/source
```
**For Windows Users**
the ARANGODB_SRC_{VERSION} variable should be exported using a unix-like path
```shell
$Env:ARANGODB_SRC_3_11 = "/Drive/Path/TO/ArangoDB"
```

this environment variable and the "src" entry in the config file must match

where VERSION is one of:
- 3_10
- 3_11
- 3_12

**Run Toolchain**


- Run the `docker compose` services

  ```shell
  docs/toolchain/docker> docker compose up
  ```

This command spawns the following Docker containers:

- `toolchain`: container that handles the entire toolchain, this docker container will spawn the following containers
- `site`: container with the site content running `hugo serve`
- `arangoproxy`: the Go web server
- `{name}_{version}` (e.g. `stable_3.11`): the ArangoDB type single server using a Docker image
- `{name}_{version}_cluster` (e.g. `stable_3.11_cluster`): the ArangoDB type cluster server using a Docker image


The site will be available at `http://0.0.0.0:1313`





<!-- ### No Docker

- Build and start the _arangoproxy_ web server

  ```shell
  toolchain/arangoproxy/cmd> go build -o arangoproxy
  toolchain/arangoproxy/cmd> ./arangoproxy {flags}
  ```
- Launch the hugo build command

  ```shell
  docs-hugo/site> hugo
  ```

The static HTML is placed under `site/public/`.

For development purpose, it is suggested to use the `hugo serve` command for
hot-reload on changes. The runtime server is available at `http://localhost:1313/`. -->
