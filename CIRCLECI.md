# CircleCI Workflows

## Plain build

The `plain-build` workflow is automatically triggered whenever there is a push
in a PR.

It is configured to build the docs without re-generating the examples
(using a committed cache file).

A plain build is sufficient for the following types of changes:

- Creating a new page or editing an existing page, as long as no code blocks
  with front matter (i.e. generated examples) are added or modified.

- Adding a new or editing an existing HTTP API endpoint description, as long as no
  accompanying `` ```curl `` examples are added or modified. The `plain-build` workflow
  includes validation at each run using [swagger-cli](https://apitools.dev/swagger-cli/).

The build report including OpenAPI syntax validation can be found in the
`generate-summary` check in GitHub.

Invoke Args:

| Parameter Type | Name | Value |
|:---------------|:-----|:------|
| string | `workflow` | `plain-build` |
| string | `deploy-url` | `deploy-preview-{PR_NUMBER}` |

### Deploy a plain build to production

To update the live documentation independently of an ArangoDB release, for
example, because of changes to the ArangoGraph docs or to publish documentation
improvements before the next ArangoDB release, follow the steps below.

1. Go to CircleCI and select the `docs-hugo` project.
2. Select the `main` branch.
3. Click the **Trigger Pipeline** button.
4. Add the parameters described below.
5. Click **Trigger Pipeline**.

**Parameters used for docs-only publication**

| Parameter type | Name | Value |
|:---------------|:-----|:------|
| string | `workflow` | `release` |

(The `release-type` is `docs` by default)

The docs-only release workflow runs a **plain build** of the documentation and
deploys to production at <https://docs.arangodb.com> without approval step.

## Example generation

The `generate` workflow can be automatically triggered from a PR.

Necessary when adding or editing the following content:
- AQL examples (`` ```aql `` with front matter)
- arangosh (JavaScript API) examples (`` ```js `` with front matter)
- cURL HTTP API examples (`` ```curl ``)

Commands you can use in GitHub comments on PRs:
- `/generate`: to build examples for the preview
- `/commit`: to commit the previously generated examples to the PR
- `/generate-commit`: to build and commit the examples in one go

These commands work only if you indicate the upstream PRs or a nightly
image in the PR description, as they are required for the compile step.

### `/generate`

When commenting a PR with the `/generate` command, the following
arguments are invoked:

| Parameter type | Name | Value |
|:---------------|:-----|:------|
| string | `workflow` | `generate` |
| string | `arangodb-3_10` | `{string in PR Template at 3.10}` |
| string | `arangodb-3_11` | `{string in PR Template at 3.11}` |
| string | `arangodb-3_12` | `{string in PR Template at 3.12}` |
| string | `generators` | `examples` |
| string | `deploy-url` | `deploy-preview-{PR_NUMBER}` |

### `/commit`

- `workflow`: `commit-generated`

### `/generate-commit`

When commenting a PR with the `/generate-commit` command, the following
arguments are invoked:

| Parameter type | Name | Value |
|:---------------|:-----|:------|
| string | `workflow` | `generate` |
| string | `arangodb-3_10` | `{string in PR Template at 3.10}` |
| string | `arangodb-3_11` | `{string in PR Template at 3.11}` |
| string | `arangodb-3_12` | `{string in PR Template at 3.12}` |
| string | `generators` | `examples` |
| string | `deploy-url` | `deploy-preview-{PR_NUMBER}` |
| boolean | `commit-generated` | `true` |

### `cache override`

You can override the cache of an example with the `override` CircleCI parameter
in the `generate` workflow.

The override parameter is a comma-separated string of regexes.

The comma will be replaced by `|` and creates an `OR` of all the regexes in the
`override` parameter.

The example below overrides all examples having `http` or starting with `aql` in
the example name. You can also specify the name of the example to override the
cache for, i.e. `AqlDateTimeToLocal_3`. 

Note that the override is valid for all versions that are specified using the
`arangodb` parameters. You can override the example output for a single version
or for multiple versions.

| Parameter type | Name | Value |
|:---------------|:-----|:------|
| string | `workflow` | `generate` |
| string | `arangodb-3_10` | `{string in PR Template at 3.10}` |
| string | `arangodb-3_11` | `{string in PR Template at 3.11}` |
| string | `generators` | `examples` |
| boolean | `commit-generated` | `true` |
| string | `deploy-url` | `deploy-preview-{PR_NUMBER}` |
| string | `override` | `http,^aql.*` |

## Release workflow for ArangoDB releases

To run a release job for a new ArangoDB patch release (e.g. 3.11.4),
minor release (e.g. 3.12.0), or major release (e.g. 4.0.0), follow the
steps below.

1. Go to CircleCI and select the `docs-hugo` project.
2. Select the `main` branch.
3. Click the **Trigger Pipeline** button.
4. Add the parameters described below.
5. Click **Trigger Pipeline**.

**Parameters used for ArangoDB release workflow**

| Parameter type | Name | Value |
|:---------------|:-----|:------|
| string | `workflow` | `release` |
| string | `release-type` | `arangodb` |
| string | `docs-version` | `3.11` (the docs version folder) |
| string | `arangodb-branch` | `3.11` (the arangodb/arangodb branch to compile) |
| string | `arangodb-version` | `3.11.4` (updates the `versions.yaml` file) |

The ArangoDB release workflow includes the following jobs:
- `generate` workflow (all examples are re-generated for the specified version)
- will be on hold until the workflow run is approved in CircleCI
- a release branch and pull request is created with the generated content, which
  needs to be approved and merged on GitHub
- once approved, starts deploying to production at <https://docs.arangodb.com>

If any of the examples or generated content fails, the workflow fails as well.
The build report can be found in the `generate-summary` check on GitHub.

## Scheduled workflow

The `generate-scheduled` workflow is automatically triggered every Thursday.
It is configured in the CircleCI web interface at **Project Settings** > **Triggers**.

This workflow uses predefined arguments and generates the data files of the following:
- metrics
- startup options
- error codes
- optimizer rules

Invoke Args:

| Parameter type | Name | Value |
|:---------------|:-----|:------|
| string | `workflow` | `generate-scheduled` |
| string | `arangodb-3_10` | `arangodb/enterprise-preview:3.10-nightly` |
| string | `arangodb-3_11` | `arangodb/enterprise-preview:3.11-nightly` |
| string | `arangodb-3_12` | `arangodb/enterprise-preview:devel-nightly` |
| string | `generators` | `metrics error-codes optimizer options` |
| boolean | `commit-generated` | `true` |
| boolean | `create-pr` | `true` |
| string | `pr-branch` | `scheduled-content-generate_$CIRCLE_BUILD_NUM` |

Similarly, the `generate-oasisctl` workflow is automatically triggered
and repeats on the 5th of every month. It generates pages about the
command-line interface of the tool.

Invoke Args:

| Parameter type | Name | Value |
|:---------------|:-----|:------|
| string | `workflow` | `generate-oasisctl` |
| string | `arangodb-3_10` | `arangodb/enterprise-preview:3.10-nightly` |
| string | `arangodb-3_11` | `arangodb/enterprise-preview:3.11-nightly` |
| string | `arangodb-3_12` | `arangodb/enterprise-preview:devel-nightly` |
| string | `generators` | `oasisctl` |
| boolean | `commit-generated` | `true` |
| boolean | `create-pr` | `true` |
| string | `pr-branch` | `scheduled-oasisctl-generate_$CIRCLE_BUILD_NUM` |

Both workflows can be manually triggered in the CircleCI web interface
via **Trigger Pipeline**.

## Other workflows

### Create Docs Images AMD64

| Parameter type | Name | Value |
|:---------------|:-----|:------|
| string | `workflow` | `create-docs-images-amd64` |

### Create Docs Images ARM64

| Parameter type | Name | Value |
|:---------------|:-----|:------|
| string | `workflow` | `create-docs-images-arm64` |
