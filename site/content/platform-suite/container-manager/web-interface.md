---
title: How to deploy a new service via the Web Interface
menuTitle: Web Interface
weight: 5
description: >-
  Complete guide to deploying, monitoring, and managing services through the
  Container Manager web interface
---

The Container Manager web interface provides a unified view for deploying new
services and monitoring existing ones. This guide covers everything you need to
know to use the web interface effectively, from your first deployment to managing
production services.

## How to Access the Container Manager

1. Log in to the Arango Data Platform web interface.
2. Click **Container Manager** in the main navigation sidebar.
3. The Container Manager opens with two main sections:
   - **Deploy new service** (left panel): For uploading and deploying new services.
   - **Running services** (right panel): For monitoring and managing existing services.

## Deploy a New Service

### Prepare Your Service Package

Package your application code as a `.tar.gz` archive containing:

- Your application code and entry point.
- A configuration file specifying dependencies (e.g., `requirements.txt` for
  Python, `package.json` for Node.js).
- Any additional files your service needs to run.

### Upload and Configure

1. In the **Deploy new service** panel, upload your service package:
   - Drag and drop your `.tar.gz` file into the **Service Package** area, or
   - Click to browse and select your file.
2. Enter a **Service Name** (e.g., `ml-prediction-service`, `express-api-gateway`).
3. Specify a **Version** for your service. Use semantic versioning
  (e.g., `1.0.0`, `2.1.3`) to easily maintain multiple versions of the same service.
4. Define the **Service URL Path**. This is the URL path where your service will
  be accessible, for example `/_services/_db/_system/ml-prediction-service-2`.
5. Optionally, check **Make this a global URL service**. When this option is
  enabled, the service is accessible globally across all databases.
6. Select a **Runtime Container** that matches your application's requirements:
     - **Python 3.11**
     - **Python 3.11 (CUDA)**
     - **Python 3.12**
     - **Python 3.12 (CUDA)**
     - **Node.js 20**
     - **Node.js 22**
7. Choose a **Machine Class**. This determines the computational resources allocated
  to your service:
     - **Small**: 2 CPU, 4GB RAM
     - **Medium**: 4 CPU, 8GB RAM
     - **Large**: 8 CPU, 16GB RAM
     - **Small GPU**: 4 CPU, 8GB RAM, 4GB GPU
     - **Large GPU**: 16 CPU, 16GB RAM, 8GB GPU
8. Click **Deploy Service** to deploy your service.

The platform uploads your package, provisions the resources, and starts your
service in the Kubernetes cluster.

## Running Services

The **Running services** section displays all deployed services with real-time
status information. You can filter services by their current status or by runtime
and machine class.

### Service Versions

Deployed services can have multiple versions. Click to expand and see all
deployed versions with their respective details and timestamps.

## Update a Service

1. Follow the steps in [Deploy a New Service](#deploy-a-new-service).
2. Use the same **Service Name** as the existing service.
3. Provide a new **Version** number (e.g., increment from `1.0.0` to `1.1.0`).
4. Upload the updated service package.
5. Click **Deploy Service**.

The new version is deployed alongside the existing version.

## Stop a Service

1. Locate the running service in the **Running services** section.
2. Click the service card to open the detail view.
3. Click **Stop Service**.
4. Confirm the action.

The service transitions to the **Stopped** state and stops consuming resources,
but remains available for restart.

## Restart a Service

To restart a stopped service:

1. Navigate to the **Stopped** tab in the Running services panel.
2. Click the service you want to restart.
3. Click **Start Service**.

The service restarts with the same configuration.

## Delete a Service

To permanently remove a service:

1. Locate the service in the **Running services** panel.
2. Click the delete button ({{< icon "delete" >}}) on the service card.
3. Confirm the deletion.