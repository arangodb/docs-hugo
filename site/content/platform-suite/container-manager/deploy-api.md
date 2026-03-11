---
title: Deploy a new service via API
menuTitle: API Deployment
weight: 30
description: >-
  Deploy and manage services programmatically using the Container Manager APIs
---

The Container Manager API enables programmatic deployment and management of services, ideal for automation, CI/CD pipelines, and infrastructure-as-code workflows.

{{< info >}}
Before deploying, you need a `.tar.gz` package with your application code.
See [Package Your Code](package-code/) for instructions.
{{< /info >}}

## Prerequisites

To deploy services via the API, you need:
- A Bearer token for authentication
- Your `.tar.gz` service package
- The external endpoint URL for your Arango Platform deployment

## Upload Your Archive

Upload your application archive to the FileManager service:

{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/_platform/filemanager/global/byoc/" >}}

```bash
curl -X POST "https://<EXTERNAL_ENDPOINT>:8529/_platform/filemanager/global/byoc/" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -F "name=<APP_NAME>" \
  -F "version=<APP_VERSION>" \
  -F "language=python" \
  -F "type=Service" \
  -F "file=@project.tar.gz"
```

| Field | Description | Required |
|-------|-------------|----------|
| `name` | Application name identifier (alphanumeric, hyphens, underscores) | Yes |
| `version` | Application version (e.g., `1.0.0`) | Yes |
| `language` | Programming language: `python` or `nodejs` | Yes |
| `type` | Deployment type: `Service` | Yes |
| `file` | The `.tar.gz` archive file | Yes |

**Success Response:**

```json
{
  "name": "<APP_NAME>",
  "version": "<APP_VERSION>",
  "status": "uploaded",
  "uploaded_at": "2026-01-01T00:00:00Z"
}
```

Save the `name` and `version` values as you will need them in the deployment step.

## Deploy Service

After uploading your archive, deploy it as a running service:

{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/v1/uds" >}}

```bash
curl -X POST "https://<EXTERNAL_ENDPOINT>:8529/v1/uds" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "app_name": "<APP_NAME>",
    "app_version": "<APP_VERSION>",
    "env": {
      "service_type": "base_type",
      "base_image": "py13base",
      "app_instance_name": "<APP_INSTANCE_NAME>",
      "db_name": "<DATABASE_NAME>"
    }
  }'
```

**Parameters:**

| Parameter | Location | Description | Required |
|-----------|----------|-------------|----------|
| `app_name` | body | Must match the `name` from upload step | Yes |
| `app_version` | body | Must match the `version` from upload step | Yes |
| `service_type` | env | Set to `base_type` | Yes |
| `base_image` | env | Base image name (see [Available Base Images](#available-base-images)) | Yes |
| `app_instance_name` | env | Service instance name (alphanumeric, used in routing) | Yes |
| `db_name` | env | Database name (optional) | No |

### Available Base Images

| Image Name | Description |
|------------|-------------|
| `py13base` | Python 3.13 base runtime |
| `py13torch` | Python 3.13 with PyTorch |
| `py13cugraph` | Python 3.13 with cuGraph |
// TODO: Add Node.js base images (e.g., node20base, node22base) to the Available Base Images table once Node.js support is implemented.


## Service Access

Once deployed, your service is accessible via HTTP at a specific endpoint pattern which depends on whether your service is database-scoped or global.

{{< tabs "service-access" >}}

{{< tab "Database-Scoped" >}}

If you provided `db_name` during deployment, your service is accessible at:

{{< endpoint "GET" "https://<EXTERNAL_ENDPOINT>:8529/_service/uds/_db/{db_name}/{app_instance_name}/" >}}

{{< /tab >}}

{{< tab "Global" >}}

If you did not provide `db_name`, your service is accessible at:

{{< endpoint "GET" "https://<EXTERNAL_ENDPOINT>:8529/_service/uds/_global/{app_instance_name}/" >}}

{{< /tab >}}

{{< /tabs >}}

All HTTP requests to these paths are routed to your container's service.

## Manage Uploaded Files

### List All Uploaded Services

Get a list of all uploaded BYOC services:

{{< endpoint "GET" "https://<EXTERNAL_ENDPOINT>:8529/_platform/filemanager/global/byoc/" >}}

**Query Parameters:**

| Parameter | Description | Required |
|-----------|-------------|----------|
| `name` | Filter by service name | No |
| `language` | Filter by language (`python` or `nodejs`) | No |
| `type` | Filter by type (`Service` or `Job`) | No |
| `limit` | Maximum results to return (default: 100) | No |
| `offset` | Pagination offset (default: 0) | No |

**Response:**

```json
{
  "services": [
    {
      "name": "my-service",
      "version": "1.0.0",
      "language": "python",
      "type": "Service",
      "storage_location": "file_manager:byoc:my-service:v1.0.0:service.tar.gz",
      "size": 1024,
      "uploaded_at": "2026-01-01T00:00:00Z",
      "safe_to_delete": false
    }
  ],
  "total": 1,
  "limit": 100,
  "offset": 0
}
```

### List Versions of a Service

Get all versions of a specific service:

{{< endpoint "GET" "https://<EXTERNAL_ENDPOINT>:8529/_platform/filemanager/global/byoc/{name}" >}}

**Query Parameters:**

| Parameter | Description | Required |
|-----------|-------------|----------|
| `limit` | Maximum results to return (default: 100) | No |
| `offset` | Pagination offset (default: 0) | No |

**Response:**

```json
{
  "name": "my-service",
  "versions": [
    {
      "version": "1.0.0",
      "language": "python",
      "type": "Service",
      "size": 1024,
      "uploaded_at": "2026-01-01T00:00:00Z"
    },
    {
      "version": "2.0.0",
      "language": "python",
      "type": "Service",
      "size": 2048,
      "uploaded_at": "2026-01-02T00:00:00Z"
    }
  ],
  "total": 2,
  "limit": 100,
  "offset": 0
}
```

### Get File Information

Get detailed information about a specific service version:

{{< endpoint "GET" "https://<EXTERNAL_ENDPOINT>:8529/_platform/filemanager/global/byoc/{name}/{version}" >}}

**Response:**

```json
{
  "name": "my-service",
  "version": "1.0.0",
  "language": "python",
  "type": "Service",
  "storage_location": "file_manager:byoc:my-service:v1.0.0:service.tar.gz",
  "size": 1024,
  "uploaded_at": "2026-01-01T00:00:00Z",
  "safe_to_delete": false
}
```

### Download Service File

Download the uploaded service file:

{{< endpoint "GET" "https://<EXTERNAL_ENDPOINT>:8529/_platform/filemanager/global/byoc/{name}/{version}/download" >}}

```bash
curl -X GET "https://<EXTERNAL_ENDPOINT>:8529/_platform/filemanager/global/byoc/<SERVICE_NAME>/<VERSION>/download" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -o service.tar.gz
```

The file content is streamed back with `Content-Type: application/octet-stream`.

### Delete a Service Version

Delete a specific version of an uploaded service:

{{< endpoint "DELETE" "https://<EXTERNAL_ENDPOINT>:8529/_platform/filemanager/global/byoc/{name}/{version}" >}}

**Response:**

```json
{
  "name": "my-service",
  "version": "1.0.0",
  "status": "deleted"
}
```

{{< warning >}}
Files can only be deleted if they are marked as `safe_to_delete: true`. Otherwise, the API returns a `423` (Locked) status code. This prevents accidental deletion of files that are actively being used by deployed services.
{{< /warning >}}

## Complete Example

See below a complete workflow for uploading and deploying a database-scoped service.

```bash
#!/bin/bash

ENDPOINT="https://your-platform.example.com:8529"
TOKEN="your_jwt_token"
SERVICE_NAME="recommendation-engine"
SERVICE_VERSION="1.0.0"
INSTANCE_NAME="recommendation-api"
DATABASE="mydb"

# Step 1: Upload service package
echo "Uploading service package..."
curl -X POST "$ENDPOINT/_platform/filemanager/global/byoc/" \
  -H "Authorization: Bearer $TOKEN" \
  -F "name=$SERVICE_NAME" \
  -F "version=$SERVICE_VERSION" \
  -F "language=python" \
  -F "type=Service" \
  -F "file=@${SERVICE_NAME}.tar.gz"

# Step 2: Deploy the service
echo "Deploying service..."
curl -X POST "$ENDPOINT/v1/uds" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"app_name\": \"$SERVICE_NAME\",
    \"app_version\": \"$SERVICE_VERSION\",
    \"env\": {
      \"service_type\": \"base_type\",
      \"base_image\": \"py13base\",
      \"app_instance_name\": \"$INSTANCE_NAME\",
      \"db_name\": \"$DATABASE\"
    }
  }"

echo "Service deployed successfully!"
echo "Access your service at: $ENDPOINT/_service/uds/_db/$DATABASE/$INSTANCE_NAME/"
```

## Web Interface Alternative

For visual deployment and management, see [Deploy via Web Interface](web-interface/).
