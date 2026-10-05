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
example, because of changes to the Contextual Data Platform docs or to publish documentation
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
deploys to production at <https://docs.arango.ai> without approval step.

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
| string | `arangodb-3_10` | [Upstream reference](#upstream-references) for 3.10 |
| string | `arangodb-3_11` | [Upstream reference](#upstream-references) for 3.11 |
| string | `arangodb-3_12` | [Upstream reference](#upstream-references) for 3.12 |
| string | `arangodb-4_x`  | [Upstream reference](#upstream-references) for 4.x  |
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
| string | `arangodb-3_10` | [Upstream reference](#upstream-references) for 3.10 |
| string | `arangodb-3_11` | [Upstream reference](#upstream-references) for 3.11 |
| string | `arangodb-3_12` | [Upstream reference](#upstream-references) for 3.12 |
| string | `arangodb-4_x`  | [Upstream reference](#upstream-references) for 4.x  |
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
| string | `arangodb-3_10` | [Upstream reference](#upstream-references) for 3.10 |
| string | `arangodb-3_11` | [Upstream reference](#upstream-references) for 3.11 |
| string | `arangodb-3_12` | [Upstream reference](#upstream-references) for 3.12 |
| string | `arangodb-4_x`  | [Upstream reference](#upstream-references) for 4.x  |
| string | `generators` | `examples` |
| boolean | `commit-generated` | `true` |
| string | `deploy-url` | `deploy-preview-{PR_NUMBER}` |
| string | `override` | `http,^aql.*` |

### Upstream references

Documentation pull requests specify upstream references like so:

```markdown
- 3.10: 
- 3.11: https://github.com/arangodb/arangodb/pull/12345
- 3.12: arangodb/enterprise-preview:devel-nightly
- 4.x: arangodb/core-preview:4.0-nightly
```

The above example indicates that ArangoDB versions 3.11 and 3.12 contain changes
relevant to the docs PR, but 3.10 does not. Relevant changes are typically
behavior changes of _arangod_ that will be visible in documentation examples.

For 3.11, a link to a PR in the `arangodb/arangodb` repository is given. It is
used by the GitHub integration to determine the feature branch to compile and
use for generating examples. Do not specify a link when manually triggering a
pipeline in CircleCI but the **branch name** (like `feature/new-aql-function`)!
Compiled branches are cached as Docker images on Docker Hub, tagged with the
docs version and the commits that were compiled:
`arangodb/docs-hugo:<version>-<arangodb commit>-<enterprise commit>`
(the first 9 characters of the commit hashes). The enterprise commit is the one
of the branch with the same name in the `arangodb/enterprise` repository, or of
the default branch (`devel`, or `4.0` for 4.x) if there is no such branch. Before
compiling, CI checks whether this image exists and uses it instead, so reruns
and later `/generate` commands for the same commits don't compile again. Only
compiling uploads images. New commits in either repository lead to a new image.

For 3.12, an ArangoDB Enterprise Edition image hosted on
[Docker Hub](https://hub.docker.com/) is specified. Using container images has the
advantage that the compilation of ArangoDB can be skipped, making the example
generation faster. Of course, this requires that an image containing relevant
changes to ArangoDB exists.

Images can also come from other registries if they can be pulled without
authentication, for example, from public ECR or GCR:
`public.ecr.aws/<alias>/<repository>:<tag>` or
`gcr.io/gcr-for-testing/arangodb/core-preview:4.0-nightly`. Every reference with
a tag is treated as an image (branch names can't contain colons). Docker Hub is
used if no registry is specified.

For 4.x, the server and the client tools are in separate images
(`arangodb/core-preview:TAG` and `arangodb/client-tools-preview:TAG`, or
`arangodb/core:TAG` and `arangodb/client-tools:TAG`). Only specify the server
image. The matching client tools image is derived and pulled automatically:
if the last part of the repository name is `core` or starts with `core-`, it is
replaced by `client-tools` (keeping the rest, the registry, and the tag), e.g.
`gcr.io/gcr-for-testing/arangodb/client-tools-preview:4.0-nightly` for
`gcr.io/gcr-for-testing/arangodb/core-preview:4.0-nightly`.
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
| string | `arangodb-branch` | `3.11.4` (the arangodb/arangodb branch to compile) |
| string | `arangodb-version` | `3.11.4` (updates the `versions.yaml` file) |

The ArangoDB release workflow includes the following jobs:
- `generate` workflow (all examples are re-generated for the specified version)
- a release branch and pull request is created with the generated content, which
  needs to be reviewed and merged on GitHub
- once merged, the workflow in CircleCI needs to be approved to start
  deploying to production at <https://docs.arango.ai>

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
| string | `arangodb-4_x`  | `arangodb/core-preview:4.0-nightly` |
| string | `generators` | `metrics error-codes exit-codes optimizer options` |
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
| string | `generators` | `oasisctl` |
| boolean | `commit-generated` | `true` |
| boolean | `create-pr` | `true` |
| string | `pr-branch` | `scheduled-oasisctl-generate_$CIRCLE_BUILD_NUM` |

Both workflows can be manually triggered in the CircleCI web interface
via **Trigger Pipeline**.

## Toolchain images

The `create-docs-images-amd64` and `create-docs-images-arm64` workflows rebuild
the Docker images of the toolchain (`arangodb/docs-hugo:site-<arch>`,
`arangodb/docs-hugo:arangoproxy-<arch>`, `arangodb/docs-hugo:toolchain-<arch>`)
and push them to Docker Hub.

Run them after changing `toolchain/docker/Dockerfile`, for example, to update
Hugo (`HUGO_VERSION`). Changes to the toolchain scripts and the arangoproxy code
don't require new images, as they are used from the repository when the
containers start. The other tools and packages of the images use the latest
versions when the images are built, so also run the workflows regularly to get
security updates.

The workflows build from the `toolchain/docker/Dockerfile` of the branch you
trigger them on, cloned from GitHub, so push your changes first. They overwrite
the images that all builds use (every branch, PRs, plain builds, releases),
however. Building from a feature branch therefore affects everyone immediately.
Test changes locally first, then merge them into `main` and build from `main`:

1. Build the images locally with the official names and test them (see the
   [README](README.md#update-the-toolchain-dependencies)).
2. Merge the changes to the `Dockerfile` into `main`.
3. In CircleCI, select the `docs-hugo` project and the `main` branch.
4. Click **Trigger Pipeline** and add the parameter below with the value
   `create-docs-images-amd64`, then trigger another pipeline with
   `create-docs-images-arm64`.
5. To use the new images locally, pull them (e.g.
   `docker pull arangodb/docs-hugo:site-amd64`), as images that exist locally
   aren't updated automatically.

| Parameter type | Name | Value |
|:---------------|:-----|:------|
| string | `workflow` | `create-docs-images-amd64` or `create-docs-images-arm64` |

## Troubleshooting

### Expired Netlify access token

If the `netlify deploy` command fails in CircleCI, it's possible that the
Netlify Personal Access Token (PAT) expired. In this case, the error message
in the CircleCI log looks like this:

> Error: Site not found. Please rerun "netlify link"

In Netlify, expired PATs automatically disappear (in the personal settings
under Applications):

<https://app.netlify.com/user/applications#personal-access-tokens>

Create a new token, save it in 1Password, and update it in the CircleCI
project settings:

<https://app.circleci.com/settings/project/github/arangodb/docs-hugo/environment-variables>

You don't have to delete the old one first. You can simply click **Add**, set
the **Name** to `NETLIFY_ACCESS_TOKEN` and paste the token into the **Value**
field. This updates the existing `NETLIFY_ACCESS_TOKEN` entry.
