---
title: Deploy via Web Interface
menuTitle: Web Interface
weight: 20
description: >-
  Deploy and manage services through the Container Manager web interface
---

The Container Manager web interface provides a visual way to deploy and manage
services with drag-and-drop upload and interactive configuration. You can deploy
services using a code package or a Docker image URL.

## Access the Container Manager

1. Log in to the Arango Contextual Data Platform web interface.
2. Go to **Control Panel** in the main navigation sidebar and then
   click **Container Manager**.
3. The Container Manager opens with two tabs:
   - **Packages**: For deploying services from code packages and managing
     uploaded packages.
   - **Containers**: For deploying services from Docker images and managing
     running containers.

Each tab has a **Deploy new Service** panel on the left and a list of
existing services on the right.

## Deploy Service from a Code Package

{{< info >}}
Before deploying, you need a `.tar.gz` package with your application code.
See [Package Your Code](package-code/) for instructions.
{{< /info >}}

1. Select the **Packages** tab.
2. In the **Deploy new Service** panel, drag and drop your `.tar.gz` file
   into the upload area, or click to browse and select your file.
3. Enter a **File name** for your service
   (e.g., `ml-prediction-service`).
4. Specify a **Version** using semantic versioning (e.g., `1.0.0`, `2.1.3`).
   This allows you to maintain multiple versions of the same service.
5. Choose the **Base Image** from the dropdown:
   - `py13base`: Python 3.13 base runtime
   - `py13torch`: Python 3.13 with PyTorch
   - `py13cugraph`: Python 3.13 with cuGraph
6. Define the **Service URL Path** where your service will be accessible
   (e.g., `my-service`).
7. Check **Make this a global URL service** to make the service accessible
   globally across all databases. Leave it unchecked for database-specific
   services.
8. Click **Deploy Service**. The platform uploads your package, provisions
   the resources, and starts your service in the Kubernetes cluster.

### Update a Code Package Service

To deploy a new version of an existing service:

1. Follow the steps in [Deploy Service from a Code Package](#deploy-service-from-a-code-package).
2. Use the same **File name** as the existing service.
3. Provide a new **Version** number (e.g., increment from `1.0.0` to `1.1.0`).
4. Upload the updated service package.
5. Click **Deploy Service**.

The new version is deployed alongside the existing version. You can run
multiple versions simultaneously.

## Deploy Service from a Docker Image

1. Select the **Containers** tab.
2. In the **Deploy new Service** panel, enter the **Image URL** for your
   Docker image (e.g., `docker.io/org/image:tag`).
3. Define the **Service URL Path** where your service will be accessible
   (e.g., `my-service`).
4. Check **Make this a global URL service** to make the service accessible
   globally across all databases. Leave it unchecked for database-specific
   services.
5. Click **Deploy Container**. The platform pulls your Docker image,
   provisions the resources, and starts your service in the Kubernetes cluster.

Your Docker image must expose an HTTP server (default port: `8000`) and handle
requests at the root path (`/`).

## Stop a Service

To stop a running service:

1. Locate the service in the **Running** filter of the relevant tab
   (**Packages** or **Containers**).
2. Click the service card to open the detail view.
3. Click **Stop Service**.
4. Confirm the action.

## API Alternative

For programmatic deployment and automation, see [Deploy via API](deploy-api/).