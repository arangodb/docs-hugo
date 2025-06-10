# Developer Guide for txt2aql

This guide provides comprehensive instructions for developers working with the Natural Language to AQL Translation Service (txt2aql).

## Table of Contents
- [Development Environment Setup](#development-environment-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
   - [Local Development](#local-development)
   - [Protobuf Code Generation](#code-generation)
   - [Code Quality](#code-quality)
   - [Testing](#testing)
- [LLM Provider Configuration](#llm-provider-configuration)
- [Deployment](#deployment)
- [CI Pipeline](#ci-pipeline)
- [Troubleshooting](#troubleshooting)

## Development Environment Setup

### Prerequisites
- Python 3.12+
- Poetry for dependency management
- Docker
- ArangoDB instance
- One of the supported LLM providers:
  - OpenAI API key
  - Triton server
  - Ollama

### Initial Setup

1. Clone the repository
```bash
git clone <repository-url>
cd natural-language-service
```

2. Install Poetry (if not already installed)
```bash
pipx install poetry
```

3. Install project dependencies
```bash
poetry install
```
This should create a virtual environment inside the project and install all the necessary dependencies for the project plus the project package to your local environment.

## Project Structure
Here is the structure of the main parts of the project:
```
natural-language-service/
├── txt2aql/               # Core service code
│   ├── server.py          # gRPC server implementation
│   ├── service.py         # Main service logic
│   ├── read_only_chain.py # LangChain implementation for read-only chain
│   └── llm_factory.py     # LLM provider factory
├── proto/                 # Protocol buffer definitions
├── tests/                 # Test suite
│   ├── unit/             # Unit tests
│   └── integration/      # Integration tests
├── docs/                 # Documentation
└── charts/               # Helm charts for deployment
```

## Development Workflow

### Local Development

####  Docker Compose File

The `docker-compose.yml` file in this repository defines three main services for local development:

- **python**: Runs the `txt2aql` application, exposing ports for gRPC APIs. It is built from the local source and configured with environment variables for database and LLM provider integration.
- **proxy**: Acts as a reverse proxy, routing external HTTP traffic to the appropriate backend service ports for easier access and local testing.
- **arangodb**: Provides a local ArangoDB instance with persistent storage and default credentials, used by the application for data storage and retrieval. Please note that this instance does not have data stored in it yet, so running queries against ArangoDB instance is not yet possible in dev environment.

The file sets up networking and environment variables to ensure all services can communicate and persist data as needed. To launch the full stack locally, use:

```bash
docker-compose up
```

This setup streamlines development, ensures consistent environments, and simplifies dependency management.

### Code Generation

Generate Protocol Buffer code:
```bash
./compile_protos.sh
```

### Code Quality

#### Pre-commit Hooks

Pre-commit hooks are automated checks that run before each commit to ensure code quality and consistency. They help catch issues early in the development process and maintain high code standards across the project.

##### Installation

The pre-commit package is included in the development dependencies. If you haven't already, install them with:

```bash
poetry install --with dev
```

Install the pre-commit hooks into your local git repository:

```bash
poetry run pre-commit install
```

##### Available Hooks

The project uses several pre-commit hooks for quality control:

1. **Code Formatting**

   - `isort`: Sorts Python imports alphabetically and separates them into sections
   - `black`: Enforces consistent Python code formatting

2. **Static Analysis**

   - `mypy`: Performs static type checking of Python code
   - `flake8`: Checks for style guide enforcement and coding standards

3. **Security**

   - `bandit`: Scans for common security issues in Python code (excludes tests and generated code)

##### Best Practices

1. Address all hook failures before pushing code
2. Don't bypass hooks unless absolutely necessary
3. Consider using VS Code extensions of these linting tools to get automated fixes on the fly.

### Testing

### Unit Tests

Run unit tests:
```bash
poetry run pytest tests/unit/
```

### Integration Tests

So far there is no integration tests environment for local development. So these tests shold be executed in the CI pipeline. In this section, we are explaining the scripts used in preparing integration tests environment on the CI pipeline.

#### Test Model Creation

The service includes a script to create a minimal test model for Triton inference server testing. The model consists of:

1. A simple ONNX model that implements an identity operation
2. Triton model configuration in protobuf text format
3. Proper directory structure required by Triton

To create the test model:

```bash
poetry run python scripts/tests/create_test_model.py
```

This creates:

```plaintext
artifacts/
└── minimal_model/
    ├── 1/
    │   └── model.onnx     # Minimal ONNX model
    └── config.pbtxt       # Triton configuration
```

The generated model:

- Accepts string input (single element)
- Returns string output (identity function)
- Uses ONNX Runtime as the backend
- Has no batching enabled

You can use this as a template to create your own test models by modifying the input/output specifications and model operations in `create_test_model.py`.

#### Create Test Database

For testing purposes, the service includes a script to create a test database with sample data. The script:

1. Connects to ArangoDB's system database
2. Creates a new test database
3. Sets up a test collection with indexed fields
4. Populates it with sample student data

To create the test database:

```bash
poetry run python scripts/tests/create_test_database.py
```

The script will:

- Create a new database with the test database name
- Create a collection named "students"
- Add a persistent unique index on the "name" field
- Insert sample documents:

```json
{"name": "jane", "age": 39}
{"name": "josh", "age": 18}
{"name": "judy", "age": 21}
```

This script is executed automatically inside the entrypoint-tests.sh script, so you don't need to run it manually.
Note: Ensure your ArangoDB instance is running and accessible before running this script. The script uses environment variable `ARANGODB_ENDPOINT` for the connection.

#### Prepare Test Environment

The `prepare_test_environment.py` script sets up a complete testing environment in Kubernetes with the following components:

1. **MLflow Setup**
   - Deploys MLflow artifact repository service for model storage
   - Deploys MLflow tracking service for model registry
   - Registers the test model ("minimal_model") created in the previous step

2. **LLM Host (Triton) Setup**
   - Deploys Triton Inference Server for model serving
   - Resource configuration:
     - Memory: 1-2Gi
     - CPU: 100-200m
     - Storage: 10-15Gi

3. **Service Deployment**
   - Deploys two instances of the Natural Language service:
     - One using OpenAI for testing
     - One using Triton with the test model

Similar to the create_test_database.py script, the script is executed automatically inside the entrypoint-tests.sh script, so you don't need to run it manually.

#### Environment Variables
The script also sets environment variables needed by the tests:
- `TRITON_HTTP_URL`: Triton server HTTP endpoint
- `TRITON_GRPC_URI`: Triton server gRPC endpoint
- `NL_SERVICE_OPENAI_URL`: OpenAI-backed service URL
- `NL_SERVICE_TRITON_URL`: Triton-backed service URL

## LLM Provider Configuration

### OpenAI Configuration

- Default model: gpt-3.5-turbo
- Configurable temperature and retry settings
- API key required

### Triton Configuration

- Requires running Triton Inference Server
- Model must be loaded and available
- gRPC endpoint configuration required

### Ollama Configuration

- Local LLM deployment
- Requires running Ollama server
- Supports various open-source models

Please note that Ollama is not meant for production use.

## Deployment

### Helm Chart Deployment

The project includes a Helm chart that can be used to deploy the service. This helm chart defines the resources that will be created and used upon installation.

Service installation must be done through GenAI service exclusively. Please check the grpc endpoint `CreateGraphRag`, which is accessible via http post request: `/v1/graphrag`
to install the service.

All required parameters are defined in the helm chart's deployment.yaml file and labeled with keyword `required`.

## CI Pipeline

The project uses CircleCI for continuous integration and deployment. The pipeline consists of several workflows:

### Main Workflows

1. **python_ci**: Code quality checks
   - `test`: Runs unit tests with pytest
   - `lint`: Runs code quality checks (black, isort, mypy, flake8, bandit)

2. **dev**: Runs on non-main branches
   - Builds development Docker images
   - Creates development Helm charts
   - Deploys to development environment
   - Runs integration tests

3. **qa**: Runs on main branch
   - Builds QA Docker images
   - Creates QA Helm charts
   - Deploys to both development and QA environments
   - Runs integration tests

### Key Features

- Uses AWS ECR for Docker image storage
- Deploys Helm charts to S3 buckets
- Supports two environments: dev and qa.
- Includes integration tests with MLflow and Triton server
- Uses Poetry for Python dependency management

### Environment Requirements

The pipeline requires several context variables:
- `aws`: AWS credentials and configuration
- `agml-pypi`: Private PyPI repository credentials
- `LLM-KEYS`: OpenAI API keys for testing
- `ArangoML-CI-Jenkins`: CI/CD integration settings

## Troubleshooting

### Common Issues

1. Database Connection Issues
   - Verify ARANGODB_URL is accessible
   - Check authentication credentials
   - Ensure database exists and is accessible

2. LLM Provider Issues
   - Verify API credentials
   - Check provider endpoint availability
   - Validate model names and configurations

3. gRPC/HTTP Connection Issues
   - Check port availability (9090 for gRPC, 8080 for HTTP)
   - Verify network/firewall settings
   - Check SSL/TLS configuration if enabled
