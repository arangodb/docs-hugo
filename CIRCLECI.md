# CircleCI Workflows

## Plain build

The `plain-build` workflow is automatically triggered whenever there is a push
in a PR.

It is configured to build the docs without re-generating the examples
(using a committed cache file).

Pull requests from forks of people who aren't members of the `arangodb` GitHub
organization aren't built automatically, as the builds run their code with
access to the CircleCI secrets. A member can review the changes (especially to
`.circleci/` and `toolchain/`) and then start the build with a `/build` comment.
New commits need another `/build`.

`/generate` works for pull requests from forks, too. The CI can't push to forks,
however, so `/commit` and `/generate-commit` push the changes of the pull request
together with the generated files to a new branch (`generated-pr-<number>-<build>`)
and open a pull request for it. Merge this pull request instead of the one from
the fork.

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
- `/build`: to build the preview (see [Plain build](#plain-build), only needed for forks)
- `/generate`: to build examples for the preview
- `/commit`: to commit the previously generated examples to the PR
- `/generate-commit`: to build and commit the examples in one go

These commands work only if you indicate the upstream PRs, branches, or images in
the PR description (see [Upstream references](#upstream-references)).

Only members of the `arangodb` GitHub organization can use these commands.

The workflows don't compile ArangoDB. For upstream PRs and branches, they use the
image that was built for the latest commit of the branch, which needs to exist
(see [Build ArangoDB images](#build-arangodb-images)).

`/generate` and `/generate-commit` accept optional arguments, separated by spaces:

- `scope=all` or `scope=changed`: whether to run all examples (the default) or
  only the examples of pages with changed or new examples
  (see `EXAMPLES_SCOPE` in the [README](README.md)).
- `override=<regexes>`: only save the output of the examples whose names match
  the comma-separated regular expressions, whether their code changed or not,
  e.g. `override=^aql,RestVersion` (see [Cache override](#cache-override)).
  `override=.*` refreshes the output of all examples.
- `generators=<names>`: the generators to run, comma-separated, instead of
  `examples`, e.g. `generators=options,optimizer` to update the startup option
  and optimizer rule data. Available: `examples`, `options`, `optimizer`,
  `metrics`, `error-codes`, `exit-codes`, `oasisctl`.

For example: `/generate-commit scope=changed` or
`/generate-commit generators=examples,options override=RestVersion`.

The bot reacts to the command comment with 🚀 when it triggered the workflow.
Invalid arguments are reported in a comment instead. The effective settings
are listed in the details of the `generate-summary` check.

### Saved example output and previews

The `generate` workflow runs the examples (all of them by default), but only
saves the output of examples whose code changed and of new examples to
`site/data/<version>/cache.json`. With `override`, it only saves the output of
the matching examples instead (see [Cache override](#cache-override)). The output
of other examples stays as it is, even if the server now returns something
different. This keeps the diffs small, as many examples contain values that
change with every run (document keys and revisions, IDs, timestamps, timings).
Releases are different: the [release workflow](#release-workflow-for-arangodb-releases) empties the
cache of the released version first, so it saves the output of all examples.

- `/generate`: the deploy preview is built from the live responses, so all
  examples (of the versions with a server) show the current server output. The
  output is stored as artifacts but not committed.
- `/commit`: commits the cache of the last `/generate` run, which only contains
  the changes described above. `/generate` followed by `/commit` is the same as
  `/generate-commit`.
- The commit doesn't trigger a new build (`[skip ci]`), so the preview keeps
  showing all-fresh output. The next push to the PR triggers a regular build
  from the cache, and the preview then shows the committed output: new output
  for changed examples, the previous output for all others. The published
  documentation is built the same way.

To refresh the saved output of examples whose code didn't change, for example,
because the server behavior changed, use `override`.

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
| string | `generators` | `examples` (or the `generators` argument) |
| string | `deploy-url` | `deploy-preview-{PR_NUMBER}` |
| string | `examples-scope` | The `scope` argument, empty by default |
| string | `override` | The `override` argument, empty by default |

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
| string | `generators` | `examples` (or the `generators` argument) |
| string | `deploy-url` | `deploy-preview-{PR_NUMBER}` |
| string | `examples-scope` | The `scope` argument, empty by default |
| string | `override` | The `override` argument, empty by default |
| boolean | `commit-generated` | `true` |

### Cache override

You can override the cache of an example with the `override` argument of the
`/generate` and `/generate-commit` commands, or the `override` CircleCI
parameter in the `generate` workflow.

The override parameter is a comma-separated string of regexes. The output of an
example is saved if one of them matches the example name (e.g.
`HttpGharialCreate`) or the name of its cache entry (e.g.
`HttpGharialCreate_single`).

Only the output of the matching examples is saved, also if other examples are
new or their code changed. This lets you update specific examples and leave
other changes for later. To save the output of new and changed examples, too,
run the workflow without `override`, or include these examples in it.

A regex that matches no example is reported as a warning, as nothing is saved
for it (e.g. because of a typo).

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
- 3.11: https://github.com/arangodb/arangodb/pull/12345
- 3.12: arangodb/enterprise-preview:3.12-nightly
- 4.x: feature/new-aql-function
```

The above example indicates that all versions contain changes relevant to the
docs PR. Relevant changes are typically behavior changes of _arangod_ that will be
visible in documentation examples. Leave the line of a version empty if it has
no relevant changes. Its content isn't regenerated then.

An upstream reference can be one of the following:

- **An image**, like `arangodb/enterprise-preview:3.12-nightly` for 3.12 in the
  example. The image is used as it is.
- **A PR** in the `arangodb/arangodb` repository, like for 3.11 in the example.
  The GitHub integration uses the branch of the PR.
- **A branch** of the `arangodb/arangodb` repository, like for 4.x in the example,
  or a link to it (`https://github.com/arangodb/arangodb/tree/feature/new-aql-function`).
  Do not specify a link when manually triggering a pipeline in CircleCI but the
  **branch name**!

For 3.10 (deprecated), only images are supported, like `arangodb/enterprise:3.10.14`.

For PRs and branches, the workflows use the image that was built for the latest
commit of the branch. The image is identified by the commit of the branch and
the commit of the branch with the same name in the `arangodb/enterprise`
repository, or of the default branch of the version if there is no such branch
(`3.11`, `3.12`, or `devel` for 4.x), like the CI of `arangodb/arangodb` does.
If the image doesn't exist, the workflow fails and you need to build it first
(see [Build ArangoDB images](#build-arangodb-images)). Pushing new commits to
either branch requires a new image.

The `metrics`, `error-codes`, and `exit-codes` generators read files from the
source code of the `arangodb/arangodb` repository, which is cloned for them:
- For PRs and branches, the commit of the image.
- For images tagged with commits (the images built for branches), this commit.
- For nightly images (tags containing `nightly`), the branch the docs version is
  based on (`3.12` for 3.12, `devel` for 4.x, see `branch` in
  `.circleci/upstream.yaml`), as the tags don't necessarily name a branch
  (`4.0-nightly` is a build of `devel`).
- For other images, the release tag that the image tag indicates. Anything
  after the first `-` and after the third version number is removed
  (`3.12.5-1` → `3.12.5`, `3.12.5.2` → `3.12.5`), and the result needs to exist
  as a tag (or branch) in `arangodb/arangodb`.

Images can come from any registry if they can be pulled without
authentication, for example, from public ECR or GCR:
`public.ecr.aws/<alias>/<repository>:<tag>` or
`gcr.io/gcr-for-testing/arangodb/core-preview:devel-nightly`. Every reference with
a tag is treated as an image (branch names can't contain colons). Docker Hub is
used if no registry is specified.

For 4.x, the server and the client tools are in separate images
(`arangodb/core-preview:TAG` and `arangodb/client-tools-preview:TAG`, or
`arangodb/core:TAG` and `arangodb/client-tools:TAG`). Only specify the server
image. The matching client tools image is derived and pulled automatically:
if the last part of the repository name is `core` or starts with `core-`, it is
replaced by `client-tools` (keeping the rest, the registry, and the tag), e.g.
`gcr.io/gcr-for-testing/arangodb/client-tools-preview:devel-nightly` for
`gcr.io/gcr-for-testing/arangodb/core-preview:devel-nightly`. This requires a tag:
the client tools image of a server image pinned by digest (`core@sha256:...`)
can't be derived, as its digest differs, so the toolchain rejects such references.

The settings per docs version (default enterprise branches, how images of
branches are named, nightly images) are in `.circleci/upstream.yaml`.

## Build ArangoDB images

The docs workflows don't compile ArangoDB. To generate the documentation for an
`arangodb/arangodb` branch, build an image for its latest commit first. You can
then use the branch name (or the PR) as upstream reference, or the image.
Building an image takes a while, so wait for the build to finish before you
trigger a docs workflow with the branch.

### 3.12 and later

The CircleCI pipeline of the `arangodb/arangodb` repository builds the images:

1. Go to CircleCI and select the `arangodb` project.
2. Select the branch.
3. Click the **Trigger Pipeline** button.
4. Select the `testing` pipeline.
5. Set the `config-definitions` parameter to an empty string (defaults to `tests.yml`).
6. Change `create-preview-docker-images` from `none` to `alpine`.
7. Click **Run Pipeline**.

The images are multi-arch (amd64 and arm64) and pushed to public ECR under
`public.ecr.aws/b0b8h2r4/`, tagged with the first 7 characters of the
`arangodb/arangodb` and `arangodb/enterprise` commits,
`<arangodb commit>_<enterprise commit>`. The exact tag is shown in the
`push-preview-manifest` job.

- 3.12: `public.ecr.aws/b0b8h2r4/arangodb/enterprise-preview:TAG`, a single
  Enterprise Edition image. It is Alpine-based by default. It can also be
  Debian-based (`deb` instead of `alpine`, tag with an additional `-deb`
  suffix), but you then need to specify the image as upstream reference, as
  branch names use the Alpine-based image.
- 4.x: `public.ecr.aws/b0b8h2r4/arangodb/core-preview:TAG` and
  `public.ecr.aws/b0b8h2r4/arangodb/client-tools-preview:TAG`, the server and
  client tools images, Alpine-based only.

### 3.11

There are no public images of 3.11 (OEM LTS) releases and branches, so the `compile`
workflow of the docs compiles ArangoDB from source and pushes the image to Docker
Hub as `arangodb/docs-hugo:3.11-<arangodb commit>-<enterprise commit>` (the
first 9 characters of the commits):

1. Go to CircleCI and select the `docs-hugo` project.
2. Select the `main` branch.
3. Click the **Trigger Pipeline** button.
4. Add the parameters described below.
5. Click **Trigger Pipeline**.

| Parameter type | Name | Value |
|:---------------|:-----|:------|
| string | `workflow` | `compile` |
| string | `arangodb-branch` | The `arangodb/arangodb` branch or tag to compile, e.g. `3.11.14` or `v3.11.14.6` |
| string | `docs-version` | `3.11` (the default) |

The workflow skips compiling if the image exists already. At the end, it prints
the upstream reference to use, e.g. `- 3.11: arangodb/docs-hugo:3.11-94076126f-633a631f7`.
The build image (`arangodb/ubuntubuildarangodb-311`, set in
`.circleci/upstream.yaml`) needs to have the OpenSSL version that the source code
requires (`OPENSSL_LINUX` in the `VERSIONS` file), as CMake fails with any other
version. oskar publishes a numbered tag per OpenSSL update, and the workflow uses
the newest tag whose image installs the required version (determined from the
image layers on Docker Hub).

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
| string | `arangodb-branch` | The release image like `arangodb/enterprise:3.12.13`, or an `arangodb/arangodb` branch or tag like `v3.11.14.6` |
| string | `arangodb-version` | `3.11.14` (updates the `versions.yaml` file) |

If the release images are already published, specify the image (e.g.
`arangodb/enterprise:3.12.13`, or `arangodb/core:4.0.1` for 4.x). Otherwise,
specify the branch or tag, for example, to test the workflow before a release or
to prepare the documentation before the images are published. Like for
[upstream references](#upstream-references), an image needs to exist for its
commit (see [Build ArangoDB images](#build-arangodb-images)).

There are no public images of 3.11 releases, so run the `compile` workflow for
the release tag (e.g. `v3.11.14.6`) first and then the release workflow with the
same tag as `arangodb-branch`.

The release workflow runs all generators for the version and regenerates all of
its data from scratch: it empties `site/data/<version>/`, including the example
cache, so that the output of all examples is saved, not only of the changed ones
(see [Saved example output and previews](#saved-example-output-and-previews)).

The ArangoDB release workflow includes the following jobs:
- `generate` workflow (all examples are re-generated for the specified version)
- a release branch and pull request is created with the generated content, which
  needs to be reviewed and merged on GitHub
- once merged, the workflow in CircleCI needs to be approved to start
  deploying to production at <https://docs.arango.ai>
- after the deployment, the built commit is tagged as `v<arangodb-version>`
  (e.g. `v3.12.13`), if its `versions.yaml` has this version. If the workflow
  runs again for the same version (e.g. to fix the generated content), the tag
  moves forward to the new commit, but never to a commit that doesn't contain
  the tagged one. Docs releases (`release-type` other than `arangodb`) and
  hotfix releases that only add release notes aren't tagged

The tags of the releases published before that (3.10.11, 3.11.4, and later,
all with the release workflow) were created once with
`toolchain/scripts/tag-past-releases.py`, for the merge commits of the last
`RELEASE_<version>-<build>` pull request of every version. Earlier releases were
published with the former Jekyll toolchain.

If any of the examples or generated content fails, the workflow fails as well.
The build report can be found in the `generate-summary` check on GitHub.

## Scheduled workflow

The `generate-scheduled` workflow is automatically triggered every Thursday.
It is configured in the CircleCI web interface at **Project Settings** > **Triggers**.

This workflow uses predefined arguments and generates the data files of the following:
- metrics
- startup options
- error codes
- exit codes
- optimizer rules

It runs against the nightly images of the versions that have public ones
(`nightly` in `.circleci/upstream.yaml`), currently
`arangodb/enterprise-preview:3.12-nightly` for 3.12 and
`arangodb/core-preview:devel-nightly` for 4.x. 3.11 has no public nightly images.

The changes are committed to a new branch, and a pull request is opened for
them. If nothing changed, there is no branch and no pull request.

Invoke Args:

| Parameter type | Name | Value |
|:---------------|:-----|:------|
| string | `workflow` | `generate-scheduled` |

Similarly, the `generate-oasisctl` workflow is automatically triggered
and repeats on the 5th of every month. It generates pages about the
command-line interface of the tool. It doesn't start any ArangoDB servers.
Like the `generate-scheduled` workflow, it only opens a pull request if
something changed.

Invoke Args:

| Parameter type | Name | Value |
|:---------------|:-----|:------|
| string | `workflow` | `generate-oasisctl` |

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
6. Let the other docs contributors know that they need to pull the new images,
   too. Otherwise, they keep using their older local images, which may not be
   compatible with the content anymore (e.g. if it relies on a newer Hugo
   version). See the [README](README.md#scheduled-and-example-generation-build) for the commands.

| Parameter type | Name | Value |
|:---------------|:-----|:------|
| string | `workflow` | `create-docs-images-amd64` or `create-docs-images-arm64` |

## Troubleshooting

### Missing build reports and pull requests

The CircleCI jobs send the build reports (checks on GitHub) and the requests to
open pull requests to the docs-webhooks app. It only accepts them with the shared
token in the `DOCS_WEBHOOK_TOKEN` environment variable, which needs to have the
same value in the CircleCI project settings and in the environment variables of
the Netlify site of the app. If the checks are missing and the jobs log
`{"ok":false}` for these requests, check that the variable is set on both sides.
After changing it in Netlify, redeploy the app.

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
