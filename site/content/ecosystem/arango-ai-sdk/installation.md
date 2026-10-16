---
title: Install the Arango AI SDK
menuTitle: Installation
weight: 5
description: >-
  Requirements for the Arango AI SDK and how to install it from a clone of its
  GitHub repository
---
{{< tag "Experimental" >}}

## Requirements

- **Python 3.12 or newer.** The package declares support for Python 3.12 and
  3.13.
- **[uv](https://docs.astral.sh/uv/)**, which manages the SDK's environment, and
  Git to clone the repository.
- **An Arango Contextual Data Platform deployment with the Agentic AI Suite**,
  reachable from wherever your code runs. See the
  [AutoGraph prerequisites](../../agentic-ai-suite/autograph/setup.md#prerequisites)
  for the platform and ArangoDB versions AutoGraph needs.
- **A username and password** for an account that can access the database you
  want to work in. The SDK signs in with these; it does not take a token.
- **An API key for a model provider**, for example OpenAI, for the chat and
  embedding models AutoGraph uses.

## Install the package

The SDK is open source under the Apache License 2.0. It is not on the public
PyPI yet, so you install it from a clone of the
[arango-ai-sdk repository](https://github.com/arangoml/arango-ai-sdk) on GitHub:

```bash
git clone https://github.com/arangoml/arango-ai-sdk
cd arango-ai-sdk
make install
```

`make install` runs `uv sync`, which creates a virtual environment in `.venv`
with the SDK and its dependencies. Without `make`, for example on a default
Windows setup, run `uv sync` directly.

Activate the environment, then run any script that imports the SDK from that
shell:

{{< tabs "arango-ai-sdk-activate" >}}

{{< tab "macOS and Linux" >}}
```bash
source .venv/bin/activate
```
{{< /tab >}}

{{< tab "Windows" >}}
```powershell
.venv\Scripts\activate
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
