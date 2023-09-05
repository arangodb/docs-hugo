# Migration to Hugo docs toolchain

The migration script converts the Jekyll-specific Markdown files as well as
the DocuBlocks from the main repository to the Hugo-specific Markdown files
that are needed for the new documentation toolchain.

## Prerequisites

- **docker-compose**
- **Python 3**

## How to run the migration script

Create a dedicated folder for testing the migration process.

**Setup**

```shell
.> git clone git@github.com:arangodb/docs-hugo.git
.> cd docs-hugo
docs-hugo> cd migration-tools
docs-hugo/migration-tools> pip3 install pyyaml commonmark python-frontmatter
```

**Execute migration**

```shell
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
