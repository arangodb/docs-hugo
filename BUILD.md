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
docs-hugo/migration-tools> ./clean.sh   # This removes all media and content from a previous migration
docs-hugo/migration-tools> pip3 install pyyaml commonmark python-frontmatter
```

**Execute migration**

```shell
# Execute the migration
docs-hugo/migration-tools> python3 migration.py --src <docsOld> --dst <docsNew> --arango-main <docublocks> --version <version>
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

- Run the `docker compose` services

  ```shell
  docs/> docker compose up --build
  ```

This command spawns the following Docker containers:

- `site`: container with the site content running `hugo serve`
- `arangoproxy`: the Go web server
- `arango*` (e.g. `arango_single_3_11`): the ArangoDB server using a Docker image

The site will be available at `http://0.0.0.0:1313`

You can optionally specify an environment file using `--env-file`:

```shell
docker-compose --env-file ./toolchain/docker-env/frontend.env up --build
```

The available configurations are:

- **Development** (`dev.env`):
  for running the toolchain locally, with example generation
- **Frontend** (`frontend.env`):
  for running the toolchain locally, without example generation,
  mainly for testing and working on the theme
- **Release** (`release.env`):
  used in CI for building and deploying the docs to production,
  including example generation
- **Examples** (`examples.env`):
  used in CI for building the docs, including example generation

### No Docker

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
hot-reload on changes. The runtime server is available at `http://localhost:1313/`.
