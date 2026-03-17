---
title: Deploy via Web Interface
menuTitle: Web Interface
weight: 20
description: >-
  Deploy and manage services through the Container Manager web interface
---

The Container Manager web interface provides a visual way to deploy and manage services with drag-and-drop upload and interactive configuration.

{{< info >}}
Before deploying, you need a `.tar.gz` package with your application code.
See [Package Your Code](package-code/) for instructions.
{{< /info >}}

## Access the Container Manager

1. Log in to the Arango Data Platform web interface.
2. Go to **Control Panel** in the main navigation sidebar and then click
**Container Manager**.
3. The Container Manager opens with two main sections:
   - **Deploy new service** (left panel): For uploading and deploying new services.
   - **Packages** (right panel): For viewing, filtering, and managing existing services.

## Deploy a New Service

1. In the **Deploy new service** panel, drag and drop your `.tar.gz` file into the **Service Package** area, or click to browse and select your file.
2. Enter a unique name for your service (e.g., `ml-prediction-service`, `express-api-gateway`).
3. Specify a version using semantic versioning (e.g., `1.0.0`, `2.1.3`). This allows you to maintain multiple versions of the same service.
4. Select **Python** from the language dropdown menu.
5. Choose the base image:
  - `py13base`: Python 3.13 base runtime
  - `py13torch`: Python 3.13 with PyTorch
  - `py13cugraph`: Python 3.13 with cuGraph 
6. Define the **Service URL Path** where your service will be accessible, for example: `/_service/uds/_db/_system/ml-prediction-service-2`.
7. Check the **Make this a global URL Service** option to make the service accessible globally across all databases. Leave it unchecked for database-specific services.
8.  Click **Deploy Service**. The platform uploads your package, provisions the resources, and starts your service in the Kubernetes cluster.

## Update a Service

To deploy a new version of an existing service, follow the steps below.

1. Follow the steps in [Deploy a New Service](#deploy-a-new-service).
2. Use the same **Service Name** as the existing service.
3. Provide a new **Version** number (e.g., increment from `1.0.0` to `1.1.0`).
4. Upload the updated service package.
5. Click **Deploy Service**.

The new version is deployed alongside the existing version. You can run multiple versions simultaneously.

## Stop a Service

To stop a running service, follow the steps below.

1. Locate the service in the **Running services** section.
2. Click the service card to open the detail view.
3. Click **Stop Service**.
4. Confirm the action.

## API Alternative

For programmatic deployment and automation, see [Deploy via API](deploy-api/).