---
title: Install the Arango AI SDK
menuTitle: Installation
weight: 5
description: >-
  Requirements for the Arango AI SDK and how to install it from ArangoDB's
  package index with pip or uv
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

<!-- TODO: link to the open-source repository of the SDK once it is published -->

## Install the package

{{< tabs "arango-ai-sdk-install" >}}

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

## Next step

Continue with [Getting started](getting-started.md) to build your first project.
