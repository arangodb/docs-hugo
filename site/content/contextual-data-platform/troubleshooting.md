---
title: Troubleshooting the data platform installation
menuTitle: Troubleshooting the install
weight: 17
description: >-
  Common problems when installing the Arango Contextual Data Platform for the
  first time and running the quick start, and how to fix them
---
This page covers the problems you are most likely to hit when following
[Get started with the data platform](get-started.md).

## Start here

Three commands answer most questions:

```bash
# What the installer did, and where it stopped
cat ~/.arango-install.log

# Are the platform pods running?
kubectl get pods --namespace arango

# Why is a particular pod not running?
kubectl describe pod <pod-name> --namespace arango
```

Pods should reach a status of `Running`. A pod in `Pending`, `ImagePullBackOff`,
or `CrashLoopBackOff` is the fastest thing to look at.

## The installation fails

### Your machine is not x86-64

The Contextual Data Platform requires processors that support the **x86-64**
architecture. On Apple silicon and other ARM machines, individual services may
fail to start or the installation may not complete.

{{< tip >}}
Arango is fully committed to supporting the ARM architecture for all products
and tests them before each release. As new services and components are
developed, some of them may still be under validation. If you need ARM support
for a specific service, contact your sales, service, or support team to confirm
its status.
{{< /tip >}}

### Docker does not have enough resources

The installer creates a local Kubernetes cluster and pulls a large set of
container images. If Docker is limited to the defaults, pods stay `Pending`
with an `Insufficient cpu` or `Insufficient memory` event, or the installation
times out.

Allocate at least **4 CPUs and 8 GB of RAM** to Docker, and make sure you have
**50 GB or more of free disk space**. In Docker Desktop, this is under
**Settings** &rarr; **Resources**.

Verify what the cluster actually sees:

```bash
kubectl describe node | grep -A 5 "Allocatable"
```

### The license key is rejected

The installer stops during license activation. Check that you are passing the
license key exactly as issued, including any trailing characters:

```bash
curl --proto '=https' --tlsv1.2 -fsSL https://releases.license.arango.ai/releases/plg/install.sh | bash -s -- --license-key "YOUR_LICENSE_KEY"
```

Generate credentials from the
[Arango developer portal](https://arangoaistg.wpenginepowered.com/developers/)
if you do not have them yet.

### The cluster cannot reach the license service

Deployments with internet access need to reach `*.license.arango.ai` for the
initial activation and for continuous renewal. If your network blocks it, the
operator logs a warning event and activation never completes:

```bash
kubectl get events --namespace arango --sort-by=.lastTimestamp | tail -20
```

Allow outbound access to `*.license.arango.ai`, or follow the
[offline setup](install-and-upgrade/offline-setup.md) for air-gapped
environments. See [License Management](license-management.md) for the full
renewal lifecycle.

### Port 8529 is already in use

The installer starts a port-forward on port `8529`. If another process holds it,
the port-forward fails and the web interface never opens. Stop the other process,
then re-run the port-forward on its own:

```bash
kubectl port-forward --namespace arango service/deployment-ea 8529:8529
```

## The installation succeeded but you cannot connect

### Connection refused from the browser or the Python client

The port-forward has dropped. It is not a background service - it stops when the
terminal closes, when the network changes, or when the pod restarts. Start it
again:

```bash
kubectl port-forward --namespace arango service/deployment-ea 8529:8529
```

Then retry. Re-run this command any time the connection stops working.

### The browser warns about the certificate

Expected for a local installation. The deployment uses a self-signed
certificate, so the browser cannot verify it. Continue anyway - depending on the
browser, the option to continue is behind an **Advanced** button.

### The Python client fails with a TLS or certificate error

The client has to accept the same self-signed certificate:

```python
from arango_ai import ArangoAIClient

client = ArangoAIClient("https://localhost:8529", verify_tls=False)
```

Note the `https` scheme - the platform gateway does not serve plain HTTP.

For `curl`, pass `-k` / `--insecure`:

```bash
curl -k -u root: -d '{"query":"RETURN 42"}' https://127.0.0.1:8529/_db/_system/_api/cursor
```

### Login fails with the default credentials

The installer prints the root password at the end of its run and also writes it
to `~/.arango-install.log`. If you missed it, read it from there. Change it
before exposing the deployment beyond your machine.

## The quick start does not work

### The build never finishes

`ag.build()` is the long step - a few minutes on the sample documents, longer on
your own corpus. It streams progress, so enable the SDK logs to see where it is
instead of watching a blank screen:

```python
import logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
```

No output for more than a minute or two means something is wrong. Check the
service pods:

```bash
kubectl get pods --namespace arango
kubectl logs <pod-name> --namespace arango
```

### The LLM provider rejects the request

Authentication and quota errors come from your LLM provider, not from the
platform. Confirm the key is set in the environment you are actually running in:

```bash
echo $LLM_API_KEY
```

Any OpenAI-compatible endpoint works - OpenRouter, Google Gemini, Anthropic,
Azure, or a private corporate LLM. See
[LLM Configuration](../agentic-ai-suite/autograph/llm-configuration.md) for the
supported providers and models.

### Questions return nothing useful

Make sure `ag.build()` completed before you call `ag.ask()`. Until the graph is
built there is nothing to retrieve from, and the retriever will tell you it does
not know rather than inventing an answer.

## Start over

To remove the local cluster and everything in it:

```bash
kind delete cluster --name arango-platform
```

Then run the installation command again.

## Still stuck?

- [Online setup](install-and-upgrade/online-setup.md) - the manual installation
  steps, useful for isolating which one fails.
- [License Management](license-management.md) - activation, renewal, and the
  required network access.
- [Architecture](architecture.md) - what each component does and how they
  connect.
