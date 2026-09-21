---
title: Install the Arango AI Suite Python SDK
menuTitle: Installation
weight: 5
description: >-
  Requirements for the Arango AI Suite Python SDK and how to install it from
  ArangoDB's package index with pip or uv
---
{{< tag "Experimental" >}}

## Requirements

- **Python 3.12 or newer.** The SDK is tested against Python 3.12 and 3.13.
- **An Arango Contextual Data Platform deployment with the Agentic AI Suite**,
  reachable from wherever your code runs. See the
  [AutoGraph prerequisites](../../agentic-ai-suite/autograph/setup.md#prerequisites)
  for the platform and ArangoDB versions AutoGraph needs.
- **A username and password** for an account that can access the database you
  want to work in. The SDK signs in with these; it does not take a token.
- **An API key for a model provider**, for example OpenAI, for the chat and
  embedding models AutoGraph uses.

## Authenticate to the package index

`arango-ai-sdk` is published to ArangoDB's private package index on Google
Artifact Registry. Availability on the public PyPI is a later step. Access is
limited to Google accounts granted permission on ArangoDB's `arango-ml` project,
so ask your ArangoDB contact for it before you continue.

Installing from that index needs Google Artifact Registry keyring support:

```bash
pip install keyring keyrings.google-artifactregistry-auth
gcloud auth login
```

Instead of `gcloud auth login`, you can supply a service account key, which is
the usual choice for CI.

## Install the package

{{< tabs "ai-suite-sdk-install" >}}

{{< tab "pip" >}}
Pass the index as an extra index URL:

```bash
pip install arango-ai-sdk \
  --extra-index-url https://europe-west3-python.pkg.dev/arango-ml/arango-ml-internal-pypi/simple/
```
{{< /tab >}}

{{< tab "uv" >}}
Declare the index explicitly in your project's `pyproject.toml`:

```toml
[[tool.uv.index]]
name = "arango_private"
url = "https://europe-west3-python.pkg.dev/arango-ml/arango-ml-internal-pypi/simple/"
explicit = true

[tool.uv.sources]
arango-ai-sdk = { index = "arango_private" }
```

Then add the dependency:

```bash
uv add arango-ai-sdk
```
{{< /tab >}}

{{< /tabs >}}

## Verify the installation

```python
import arango_ai_sdk

print(arango_ai_sdk.__version__)
```

## Release channels

Which channel a build belongs to is encoded in its version number, and both
`pip` and `uv` skip pre-releases unless you ask for one by name:

| Version looks like | Channel | Who gets it |
|--------------------|---------|-------------|
| `0.1.0` | Production | Everyone, by default |
| `0.1.0rc1` | Release candidate | Only if you ask for it explicitly |
| `0.1.0rc1.post1.dev3+g1a59664` | Development build | Only if you ask for it explicitly |

A plain `pip install arango-ai-sdk` therefore always gives you the latest
production release.

## Next step

Continue with [Getting started](getting-started.md) to build your first project.
