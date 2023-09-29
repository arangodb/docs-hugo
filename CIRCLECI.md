# CircleCI Workflows

## Plain build

The `plain-build` workflow is automatically triggered whenever there is a push
in a PR.
It is configured to build the docs without re-generating the examples
(using a committed cache file.)

A plain build is sufficient for the following types of changes:

- Creating a new page or editing an existing page, as long as no code blocks with front matter
  (i.e. generated examples) are added or modified.

- Adding a new or editing an existing HTTP API endpoint description, as long as no
  accompanying `` ```curl `` examples are added or modified. The `plain-build` workflow
  includes validation at each run using [swagger-cli](https://apitools.dev/swagger-cli/).

The build report including OpenAPI syntax validation can be found in the
`generate-summary` check in GitHub.

Invoke Args:

| Name | Value |
|:-----|:------|
| `workflow` | `plain-build` |
| `deploy-url` | `deploy-preview-{PR_NUMBER}` |

## Deploy to production a plain build

To publish a plain build to the production site hosted at <https://docs.arangodb.com>,
follow the steps below:

1. Go to CircleCI and select the `docs-hugo` project.
2. Select the `main` branch.
3. Click the **Trigger Pipeline** button.
4. Add the following parameter:
   - Parameter type: string
   - Name: `workflow`
   - Value: `release`
5. Click **Trigger Pipeline**.

The pipeline gets triggered, but stays on hold as it requires an approval.
Select the pipeline from the dashboard and approve the workflow.

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

| Name | Value |
|:-----|:------|
| `workflow` | `generate` |
| `arangodb-3_10` | `{string in PR Template at 3.10}` |
| `arangodb-3_11` | `{string in PR Template at 3.11}` |
| `arangodb-3_12` | `{string in PR Template at 3.12}` |
| `generators` | `examples` |
| `deploy-url` | `deploy-preview-{PR_NUMBER}` |

### `/commit`

- `workflow`: `commit-generated`

### `/generate-commit`

When commenting a PR with the `/generate-commit` command, the following
arguments are invoked:

| Name | Value |
|:-----|:------|
| `workflow` | `generate` |
| `arangodb-3_10` | `{string in PR Template at 3.10}` |
| `arangodb-3_11` | `{string in PR Template at 3.11}` |
| `arangodb-3_12` | `{string in PR Template at 3.12}` |
| `generators` | `examples` |
| `deploy-url` | `deploy-preview-{PR_NUMBER}` |
| `commit-generated` | `true` |

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

| Name | Value |
|:-----|:------|
| `workflow` | `generate` |
| `arangodb-3_10` | `{string in PR Template at 3.10}` |
| `arangodb-3_11` | `{string in PR Template at 3.11}` |
| `generators` | `examples` |
| `commit-generated` | `true` |
| `override` | `http,^aql.*` |

## Release workflow (ArangoDB)

To run a release job for a new ArangoDB patch release (e.g. 3.11.4), follow the
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
| string | `arangodb-branch` | `3.11` |
| string | `arangodb-version` | `3.11.4` |

The ArangoDB release workflow includes the following jobs:
- `generate` workflow (all examples are re-generated for the specified version)
- a release branch is created with the generated content, which needs to be approved and merged
- will be on hold until it is approved in CircleCI as well
- once approved, starts deploying to production at https://docs.arangodb.com

If any of the examples or generated content fails, the workflow will fail as well. 
The build report can be found in the `generate-summary` check in GitHub.

## Scheduled workflow

The `generate-scheduled` workflow is automatically triggered every Thursday.
It is configured in the CircleCI web interface at **Project Settings** > **Triggers**.

This workflow uses predefined arguments and generates the data files of the following:
- metrics
- startup options
- error codes
- optimizer rules

Invoke Args:

| Name | Value |
|:-----|:------|
| `workflow` | `generate-scheduled` |
| `arangodb-3_10` | `arangodb/enterprise-preview:3.10-nightly` |
| `arangodb-3_11` | `arangodb/enterprise-preview:3.11-nightly` |
| `arangodb-3_12` | `arangodb/enterprise-preview:devel-nightly` |
| `generators` | `metrics error-codes optimizer options` |
| `commit-generated` | `true` |
| `create-pr` | `true` |
| `pr-branch` | `scheduled-content-generate_$CIRCLE_BUILD_NUM` |

Similarly, the `generate-oasisctl` workflow is automatically triggered
and repeats on the 5th of every month. It generates pages about the command-line interface of the tool.

Invoke Args:

| Name | Value |
|:-----|:------|
| `workflow` | `generate-oasisctl` |
| `arangodb-3_10` | `arangodb/enterprise-preview:3.10-nightly` |
| `arangodb-3_11` | `arangodb/enterprise-preview:3.11-nightly` |
| `arangodb-3_12` | `arangodb/enterprise-preview:devel-nightly` |
| `generators` | `oasisctl` |
| `commit-generated` | `true` |
| `create-pr` | `true` |
| `pr-branch` | `scheduled-oasisctl-generate_$CIRCLE_BUILD_NUM` |

Both workflows can be manually triggered in the CircleCI web interface
via **Trigger Pipeline**.

## Other workflows

### Create Docs Images AMD64

| Name | Value |
|:-----|:------|
| `workflow` | `create-docs-images-amd64` |

### Create Docs Images ARM64

| Name | Value |
|:-----|:------|
| `workflow` | `create-docs-images-arm64` |
