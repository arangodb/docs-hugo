---
title: Container Manager
menuTitle: Container Manager
weight: 15
description: >-
  Deploy and manage custom services within the Arango Contextual Data Platform using
  your own code packages or Docker images
---
The **Container Manager** lets you deploy and run custom services directly within
the Arango Contextual Data Platform. Run your own applications and workloads alongside
Arango's services while seamlessly integrating with the platform's existing
infrastructure, including authentication, routing, telemetry, and license management.

You can deploy services in two ways:

- **Bring Your Own Code**: Upload your source code packages, and the Container
  Manager builds secure containers using platform-provided hardened base images.
- **Bring Your Own Container**: Provide a Docker image URL, and the platform
  deploys it directly.

Both deployment options are available through the
[Web Interface](web-interface/) or [API](deploy-api/).
In both cases, the Container Manager orchestrates deployment through the
Arango Control Plane (ACP) service. The platform handles security and
integration automatically.

Services that serve their own user interface can additionally be registered as
**Apps**, making them available in the platform's Apps catalog with their UI
embedded in the web interface. See [Host a UI with Apps](apps/).

## Getting Started

### Bring Your Own Code

Create a `.tar.gz` package from your source code with your dependencies.

See how to [Package Your Code](package-code/) for detailed instructions.

{{< tip >}}
Use [ServiceMaker](https://github.com/arangodb/servicemaker) to automate packaging.
It handles dependencies, builds container images, and generates deployment-ready archives.
{{< /tip >}}

### Bring Your Own Container

Provide a Docker image URL and the platform deploys it directly.
By default, the platform routes traffic to an HTTP server on port `8000`,
which your Docker image must expose. Your image must also handle requests at
the root path (`/`).

### Legacy Foxx services

ArangoDB up to version 3.12 had the Foxx microservice framework to run JavaScript
code on the server-side to enable customization. You can think of the
data platform's user-defined services (bring your own code/container) as a more
powerful incarnation of Foxx:

- A microservice architecture but with a clear separation of the core
  database system and the surrounding services.
- Not limited to (synchronous) JavaScript – you may use a standard Node.js
  runtime with its entire ecosystem including async libraries.
- You can use different programming languages and environments altogether
  thanks to containerization.

Any existing Foxx services from ArangoDB v3.12 and older that you still require
need to be rewritten for the data platform and ArangoDB 4.0+.
You may consider using AI tools for this.

## Key Capabilities

- **Custom Service Deployment**: Upload code packages (`.tar.gz` files) or
  provide Docker image URLs to deploy running services.

- **Apps**: Register a service that serves a UI as an App and use
  it embedded in the platform's Apps catalog.

- **Multiple Runtimes**: For code-based deployments, supported runtime
  environments include Python with optional CUDA/GPU support. For image-based
  deployments, you can use any runtime packaged in your Docker image.

- **Version Management**: Maintain and deploy multiple versions of the same
  service with easy updates.
  
- **Service Scopes**: Deploy services globally across all databases or scope
  them to specific databases.

## Where Services Run

Control where your services are accessible and how they integrate with your databases:

- **Global**: Services are accessible across all databases in your deployment.
  Platform-wide or global services are typically used for shared infrastructure
  like API gateways, machine learning model serving, or notification services
  that need to operate across multiple databases.

- **Database-Specific**: Services are bound to a single database. These are
  typically used for data-processing APIs, webhook handlers, or any processing
  that should remain isolated to one database context.

## Supported Environments

Deploy services using runtime environments and resources tailored to your needs.

**Code-based deployments (Bring Your Own Code):**
- **Python 3.12** (base, PyTorch, and cuGraph variants available)

**Container-based deployments (Bring Your Own Container):**
- Any runtime or language packaged in your container image

## Security

All deployed services operate within the platform's security framework, with
integrated authentication, network isolation, and access controls.

{{< comment >}}
## Scaling and High Availability

Services deployed through the Container Manager inherit the platform's
Kubernetes-native scaling and high availability capabilities:

- **Automatic Scaling**:\
  Your services can scale horizontally and vertically based on workload demands,
  leveraging Kubernetes autoscaling mechanisms.

- **Multi-AZ Deployment**:\
  Services can be distributed across availability zones for fault tolerance
  and resilience.

- **Zero-Downtime Updates**:\
  Rolling updates enable you to deploy new versions of your services with
  minimal or no service disruption.

For detailed information about the platform's scaling architecture and
high availability features, see
[Operational Features](../../contextual-data-platform/platform-suite.md#operational-features).
{{< /comment >}}
