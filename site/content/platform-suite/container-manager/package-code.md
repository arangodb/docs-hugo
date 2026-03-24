---
title: Package Your Code
menuTitle: Package Code
weight: 10
description: >-
  Package your application code for deployment in Container Manager
---

Before deploying a code-based service via the [Web Interface](web-interface/)
or [API](deploy-api/), you need to package your application as a `.tar.gz`
archive containing your code and dependencies.

{{< tip >}}
If you already have a Docker image, you can skip packaging and deploy it
directly using a Docker image URL. See
[Deploy via Web Interface](web-interface/) or [Deploy via API](deploy-api/)
for details on image-based deployments.
{{< /tip >}}

## Choose Your Packaging Method

You can package your code in two ways:

### Using ServiceMaker (Recommended)

ServiceMaker is a command-line tool that automates code preparation for
deploying services. It processes standard projects and generates deployment-ready
artifacts.

**What ServiceMaker automates:**
- Builds Docker container images using platform runtime base images.
- Installs and packages project dependencies using `uv`.
- Generates `.tar.gz` archives ready for upload to Container Manager.
- Creates Dockerfile configurations tailored to your project.
- Sets up virtual environments that match platform base images.
- Enables local Docker image testing before deployment.
- Optionally publishes Docker images to container registries.
- Processes standard project formats (`pyproject.toml`, `requirements.txt`, `package.json`).

For installation and usage instructions, see the
[ServiceMaker repository](https://github.com/arangodb/servicemaker).

### Manual Packaging

If you prefer to package your code manually without ServiceMaker,
follow the steps below.

1. Create a project structure with your application code and entry point script.
2. Add a dependency configuration file:
   - For Python: Create a `pyproject.toml` with your dependencies and Python version requirement.
3. Use `uv` for Python projects (recommended):
   - Ensure your `pyproject.toml` specifies `requires-python` matching your target runtime
     (e.g., `">=3.11"` for Python 3.11 and newer runtimes).
   - List all dependencies in the `dependencies` array.
   - The platform uses `uv` to install dependencies during containerization.
4. Create the archive:
   ```bash
   tar -czf myservice.tar.gz myproject/
   ```
5. Test locally (optional but recommended):
   - Install dependencies using `uv pip install -r pyproject.toml`.
   - Run your entry point script to verify it works before uploading.

## Example: Python Project

**Project structure:**
```
myproject/
├── pyproject.toml
├── main.py
└── config.json
```

**Example `pyproject.toml`:**
```toml
[project]
name = "my-service"
version = "1.0.0"
requires-python = ">=3.11"
dependencies = [
    "fastapi>=0.115.0",
    "uvicorn[standard]>=0.32.0",
]
```

**Create the archive:**
```bash
tar -czf myservice.tar.gz myproject/
```

## Next Steps

Once you have your `.tar.gz` package ready, you can deploy it using:
- [Deploy via Web Interface](web-interface/)
- [Deploy via API](deploy-api/)
