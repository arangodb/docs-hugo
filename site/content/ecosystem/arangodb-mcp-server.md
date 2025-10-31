---
title: ArangoDB Model Context Protocol (MCP) Server
menuTitle: MCP Server
weight: 10
description: >-
  A Model Context Protocol server for generating and executing AQL queries using AI assistants like Claude and Cursor IDE
---
The ArangoDB MCP Server is a focused [Model Context Protocol](https://modelcontextprotocol.io/) (MCP) implementation that enables AI assistants to generate and execute AQL queries based on natural language questions. It includes lightweight schema discovery and manuals to ground queries in actual database structure.

## Features

**AQL Generation & Execution:**
- Generate AQL grounded in actual database structure
- Execute AQL with optional bind variables and target database

**Manuals for Guidance:**
- AQL reference and optimization guides built-in
- Context-aware query generation

**Lightweight Schema Discovery:**
- List collections within accessible databases
- Sample documents via simple filters to learn fields

## What You Can Do

The server is purpose-built for safe, read-focused AQL operations:
- Execute AQL queries with optional bind variables and target database
- Access built-in manuals for syntax and optimization guidance
- Discover database schemas and collection structures
- Sample documents to understand field structures

The following are not included:
- Graph/view/index/analyzer management tools
- Destructive admin operations (create/delete databases or collections)

## Getting Started

Choose the setup that works best for you. Docker is recommended for quick start with everything bundled together.

### Option 1: Docker Setup (Recommended)

This approach bundles the MCP server and ArangoDB together, perfect for testing and development.

**Prerequisites:**
- Docker installed
- Cursor IDE or Claude Desktop

1. Build the MCP server image:

```bash
cd mcp-arango-aql
docker build -t arangodb-mcp-server:dev -f Dockerfile.dev .
```

2. Start ArangoDB (if you don't have an instance):

```bash
docker run -d --name arangodb -p 8529:8529 -e ARANGO_ROOT_PASSWORD=test arangodb/arangodb:latest
```

3. Configure your AI client:

{{< tabs "docker-setup" >}}

{{< tab "Cursor IDE" >}}
Go to Settings > Features > Tools > New MCP Server and add the following configuration.

```json
{
  "mcpServers": {
    "arangodb-mcp": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm", "--network", "host",
        "-e", "ARANGO_HOSTS=http://localhost:8529",
        "-e", "ARANGO_ROOT_USERNAME=root",
        "-e", "ARANGO_ROOT_PASSWORD=test",
        "-e", "ARANGO_DEFAULT_DB_NAME=_system",
        "arangodb-mcp-server:dev"
      ]
    }
  }
}
```
{{< /tab >}}

{{< tab "Claude Desktop" >}}
Add the following configuration to `claude_desktop_config.json`.

```json
{
  "mcpServers": {
    "arangodb-mcp": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm", "--network", "host",
        "-e", "ARANGO_HOSTS=http://localhost:8529",
        "-e", "ARANGO_ROOT_USERNAME=root",
        "-e", "ARANGO_ROOT_PASSWORD=test",
        "-e", "ARANGO_DEFAULT_DB_NAME=_system",
        "arangodb-mcp-server:dev"
      ]
    }
  }
}
```
{{< /tab >}}

{{< /tabs >}}

4. Restart your AI client to load the new server.

5. Test the connection by asking your AI assistant:
   - "Show me all collections in the database"
   - "Fetch the database schemas"

### Option 2: Poetry Setup (Local Development)

Use this approach if you want to run the server locally or contribute to development.

**Prerequisites:**
- Python 3.10 or higher
- [Poetry](https://python-poetry.org/docs/#installation) installed
- ArangoDB instance (local or remote)

1. Install dependencies:

```bash
cd arango-mcp-server
poetry install
```

2. Configure your AI client:

{{< tabs "poetry-setup" >}}

{{< tab "Cursor IDE" >}}
Add to MCP settings:

```json
{
  "mcpServers": {
    "arangodb-mcp": {
      "command": "poetry",
      "args": ["-C", "/path/to/arango-mcp-server", "run", "python", "-m", "main"],
      "env": {
        "ARANGO_HOSTS": "http://localhost:8529",
        "ARANGO_ROOT_USERNAME": "root",
        "ARANGO_ROOT_PASSWORD": "your_password_here",
        "ARANGO_DEFAULT_DB_NAME": "your_db_name"
      }
    }
  }
}
```

{{< warning >}}
Replace `/path/to/arango-mcp-server` with the actual path to your project directory. The `-C` flag specifies the working directory for Poetry.
{{< /warning >}}
{{< /tab >}}

{{< tab "Claude Desktop" >}}
Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "arangodb-mcp": {
      "command": "poetry",
      "args": ["-C", "/path/to/arango-mcp-server", "run", "python", "-m", "main"],
      "env": {
        "ARANGO_HOSTS": "http://localhost:8529",
        "ARANGO_ROOT_USERNAME": "root",
        "ARANGO_ROOT_PASSWORD": "your_password_here",
        "ARANGO_DEFAULT_DB_NAME": "your_db_name"
      }
    }
  }
}
```

{{< warning >}}
Replace `/path/to/arango-mcp-server` with the actual path to your project directory. The `-C` flag specifies the working directory for Poetry.
{{< /warning >}}
{{< /tab >}}

{{< /tabs >}}

### Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `ARANGO_HOSTS` | Yes | ArangoDB server URL (e.g., `http://localhost:8529`) |
| `ARANGO_ROOT_USERNAME` | Yes | Database username |
| `ARANGO_ROOT_PASSWORD` | Yes | Database password |
| `ARANGO_DEFAULT_DB_NAME` | Yes | Default database name to use |

## Available Tools

The MCP server exposes four main tools that AI assistants can use to interact with your ArangoDB database.

### `get-aql-manual`

Retrieves built-in documentation for AQL syntax and optimization.

**Parameters:**
- `manual_name` (required): Either `aql_ref` or `optimization`.

**Use when:** You need reference documentation for writing AQL queries.

### `fetch-schemas`

Lists all collections in a database (non-system collections only).

**Parameters:**
- `database_name` (optional): Target database. Uses configured default if not specified.

**Use when:** You need to discover what collections exist in your database.

### `read-documents-with-filter`

Samples documents from a collection using simple equality filters.

**Parameters:**
- `collection_name` (required): Name of the collection to query.
- `filters` (required): Filter conditions as key-value pairs.
- `limit` (optional, default: 100): Maximum documents to return.
- `skip` (optional, default: 0): Number of documents to skip (pagination).

**Use when:** You want to explore document structure or find specific documents by exact field matches.

### `execute-aql-query`

Executes AQL queries with optional bind variables.

**Parameters:**
- `aql_query` (required): The AQL query to execute.
- `bind_vars` (optional): Bind variables for parameterized queries.
- `database_name` (optional): Target database.

**Use when:** You need to run complex queries, aggregations, or graph traversals.

## Workflow

When working with the MCP server, AI assistants typically follow this pattern:

1. **Discover**: Call `fetch-schemas()` to understand available collections.
2. **Explore**: Use `read-documents-with-filter()` to see document structures.
3. **Reference**: Call `get-aql-manual()` if complex query syntax is needed.
4. **Execute**: Run queries with `execute-aql-query()` using bind variables for safety.

## Practical Examples

**Example 1: Exploring Your Database**

*Prompt:* "Show me all collections in the database"

The AI will call `fetch-schemas()` and display the available collections with their types and document counts.

**Example 2: Finding Specific Records**

*Prompt:* "Find all active users who are verified"

The AI will:
1. Confirm the `users` collection exists with `fetch-schemas()`
2. Sample the structure with `read-documents-with-filter()`
3. Generate and execute an AQL query: 
   ```aql
   FOR user IN users 
   FILTER user.status == "active" AND user.verified == true 
   RETURN user
   ```

**Example 3: Complex Graph Traversal**

*Prompt:* "Find all friends of friends for user 'john' up to 3 levels deep"

The AI will:
1. Retrieve the AQL reference manual for graph traversal syntax
2. Identify edge collections using `fetch-schemas()`
3. Generate an optimized graph query:
   ```aql
   FOR v, e, p IN 1..3 OUTBOUND 'users/john' friends
   RETURN DISTINCT v
   ```
4. Execute with appropriate bind variables for safety

**Example 4: Data Analysis**

*Prompt:* "What's the average age of users by country?"

The AI will generate and execute an aggregation query:
```aql
FOR user IN users
COLLECT country = user.address.country
AGGREGATE avgAge = AVG(user.age)
RETURN { country, avgAge }
```

## Troubleshooting

**Server not appearing in AI client:**
- Restart your AI client after configuration changes
- Verify JSON syntax in your configuration file
- Check that all required environment variables are set

**Cannot connect to ArangoDB:**
- Verify ArangoDB is running: `curl http://localhost:8529/_api/version`
- Check credentials in environment variables are correct
- Ensure the specified database exists
- For Docker setups, verify containers can communicate on the network

**Docker container fails to start:**
- Check container logs: `docker logs <container-name>`
- Verify ArangoDB is running: `docker ps | grep arangodb`
- Ensure port 8529 is not in use: `lsof -i :8529`

**Queries return empty results:**
- Verify you're querying the correct database and collection
- Check the collection contains documents
- Use `read-documents-with-filter()` with minimal filters to see sample data

