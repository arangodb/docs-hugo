---
title: Container Manager
menuTitle: Container Manager
weight: 15
description: >-
  Deploy and manage custom services within the Arango Data Platform using
  your own code packages
---
The **Container Manager** lets you deploy and run custom services directly within
the Arango Data Platform. Run your own applications and workloads alongside
Arango's services while seamlessly integrating with the platform's existing
infrastructure, including authentication, routing, telemetry, and license management.

Upload your source code packages, and the Container Manager builds secure
containers using platform-provided hardened base images, then orchestrates
deployment through the Arango Control Plane (ACP) service. The platform handles
containerization, security, and integration automatically.

## Getting Started

### Package Your Code

Create a `.tar.gz` package from your source code with your dependencies.

See how to [Package Your Code](package-code/) for detailed instructions.

{{< tip >}}
Use [ServiceMaker](https://github.com/arangodb/servicemaker) to automate packaging.
It handles dependencies, builds Docker images, and generates deployment-ready archives.
{{< /tip >}}

### Choose Your Deployment Method

You can [Deploy via Web Interface](web-interface/) or
[Deploy via API](deploy-api/).

### Deploy and Run

The platform builds a secure container, orchestrates deployment through the Arango Control Plane (ACP), and runs your service with full platform integration.

## Key Capabilities

- **Custom Service Deployment**: Upload code packages (`.tar.gz` files) and
  deploy them as running services with configurable resources.
  
- **Multiple Runtimes**: Python with optional CUDA/GPU support runtime environments.
  
- **Version Management**: Maintain and deploy multiple versions of the same
  service with easy updates and rollbacks.
  
- **Service Scopes**: Deploy services globally across all databases or scope
  them to specific databases.

## Where Services Run

Control where your services are accessible and how they integrate with your databases:

- **Global**: Services are accessible across all databases in your deployment.
Platform-wide or global services are typically used for shared infrastructure
like API gateways, machine learning model serving, or notification services that
need to operate across multiple databases.

- **Database-Specific**: Services are bound to a single database. These are typically
used for data-processing APIs, webhook handlers, or any processing that should remain isolated to one database context.

## Supported Environments

Deploy services using runtime environments and resources tailored to your needs.

**Runtimes:**
- **Python 3.13** (base, PyTorch, and cuGraph variants available)

## Security

All deployed services operate within the platform's security framework, with integrated authentication, network isolation, and access controls.