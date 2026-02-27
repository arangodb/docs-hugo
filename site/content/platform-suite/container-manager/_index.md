---
title: Container Manager
menuTitle: Container Manager
weight: 17
description: >-
  Deploy and manage custom services within the Arango Data Platform using
  your own code packages
---

The **Container Manager** lets you deploy and run custom services directly within the Arango Data Platform. Run your own applications and workloads alongside Arango's services while seamlessly integrating with the platform's existing infrastructure, including authentication, routing, telemetry, and license management.

Upload your source code packages, and the Container Manager builds secure containers using platform-provided hardened base images, then orchestrates deployment through the GenAI Service. The platform handles containerization, security, and integration automatically.

## How It Works

1. **Package Your Code**: Create a `.tar.gz` package from your source code.
2. **Upload**: Upload the package via the web interface or API.
3. **Containerization**: The platform builds a secure container using hardened base images.
4. **Deploy**: The GenAI Service orchestrates and deploys your service.
5. **Run**: Your service runs with full platform integration.

## Key Capabilities

- **Custom Service Deployment**: Upload code packages (`.tar.gz` files) and
  deploy them as running services with configurable resources.
  
- **Multiple Runtimes**: Choose from Python (with optional CUDA/GPU support)
  and Node.js runtime environments.
  
- **Flexible Resource Allocation**: Select from predefined machine classes
  (Small, Medium, Large GPU) to match your service's CPU, memory, and GPU needs.
  
- **Version Management**: Maintain and deploy multiple versions of the same
  service with easy updates and rollbacks.
  
- **Service Scopes**: Deploy services globally across all databases or scope
  them to specific databases.
  
- **Integrated Monitoring**: Track service status, resource usage, and health
  directly from the unified web interface.

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
- **Python 3.11** and **Python 3.11 (CUDA)**
- **Python 3.12** and **Python 3.12 (CUDA)**
- **Node.js 20** and **Node.js 22**

**Machine Classes:**
- **Small** (2 CPU, 4GB RAM): Lightweight services.
- **Medium** (4 CPU, 8GB RAM): Standard workloads.
- **Large** (8 CPU, 16GB RAM): CPU-intensive applications.
- **Small GPU** (4 CPU, 8GB RAM, 4GB GPU): Light GPU workloads.
- **Large GPU** (16 CPU, 16GB RAM, 8GB GPU): Heavy GPU-accelerated computing.

## Security

All deployed services operate within the platform's security framework.

## API Reference