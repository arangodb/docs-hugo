# Verify facts and build the site

## Verify technical facts against the source

Docs state what the product does, so check it in the code or with the owning
team before you write it. Don't fill gaps with plausible guesses. If you can't
verify a value, leave it out or add a `{{< comment >}}` for the reviewer.

Where to look:

| Topic | Source of truth |
|:------|:----------------|
| GraphML request fields and defaults | `github.com/arangoml/agml-api`: `arangographml_service/app/model/*_request.py`, routers in `app/routers/jobs/v1/` |
| GraphML web interface | `github.com/arangodb/platform-ui`, `apps/data-science-ui/src/graphML` (its generated models lag behind the backend) |
| Operator, CRDs, `ArangoProfile` | `github.com/arangodb/kube-arangodb` |
| Go driver | `github.com/arangodb/go-driver` on `master`: root is v1 (EOL), `v2/` for ArangoDB 3.x, `v3/` for 4.0 and later (no separate branch) |
| Data platform service versions | `github.com/arangodb/arangodb-platform-config` releases |
| Service API changes | the service's `CHANGELOG.md` and the previous release tag |

The public arangoml API reference (arangoml.github.io) is stale. Clone the
repositories with `git clone` to read them.

Check that everything a reader copies exists:

- Docker image tags differ between repositories. The Community
  `arangodb/arangodb` image lags behind `arangodb/enterprise`: a tag that exists
  in one may not exist in the other. Check Docker Hub before you write a tag.
- Pin versions that you have seen work. For example, kube-arangodb operator
  1.4.2 fails to create the JWT and CA secrets; use 1.4.3 or later.
- On Apple silicon (arm64), Kubernetes setups need the architecture set
  explicitly: `--set "operator.architectures={amd64,arm64}"` for the operator
  Helm chart and `spec.architecture: [arm64]` in the `ArangoDeployment`.
- Run examples and commands on a live deployment where you can. Some
  combinations don't fail but silently do something else (for example, a
  SatelliteGraph in a OneShard database gets a numeric replication factor).

Values a reviewer has confirmed stay in the page. Don't strip them on a later
editing pass because they look like assumptions.

## Build and check links

The Docker toolchain is the reference build (see the README, Plain build). For
a quick local check without Docker:

- Use Hugo 0.167 (the version pinned in `toolchain/docker/Dockerfile`). Older
  Hugo releases fail on the theme.
- Pages with `openapi` blocks call the arangoproxy service during the build.
  Without it, point `params.arangoproxyUrl` at a stub that answers any GET or
  POST with `200 {}`, and allow that URL in `security.http` (urls `.*`, methods
  `(?i)GET|POST`). Do this in a copy of the config passed with `--configDir`,
  not in the tracked config. Replace the existing `security` values; a second
  `security:` key is a YAML error.
- To build faster, exclude version folders you didn't change with
  `excludeFiles` in that config copy.
- Build with `hugo --source <absolute path>/site --configDir <config copy> --logLevel warn`
  and check the exit code. The theme warns about every broken link and anchor,
  so a build with no warnings is the link check.

Mermaid diagrams render in the browser, so syntax errors don't fail the build.
Open the page in a preview to check them.

## Theme work

- The homepage uses its own layout, `layouts/_default/home.html`.
  `site/content/_index.md` only holds front matter that feeds the hero.
- Links in theme templates use the version-stable path
  `/arangodb/stable/...`.
