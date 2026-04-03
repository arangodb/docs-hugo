---
title: The File Manager of the Arango Contextual Data Platform
menuTitle: File Manager
weight: 25
description: >-
  View and manage container service files and RAG input files stored by the
  Arango Contextual Data Platform
---
Some of the services that run in the Arango Contextual Data Platform need to store larger
amounts of data. This data needs to be stored outside of the ArangoDB database system.

The Contextual Data Platform supports different blob storage solutions for this data
persistence, such as S3 cloud storage. This storage is used by services of
the Agentic AI Suite for instance, such as for storing AI models and training-related
metadata, as well as for user-uploaded GraphRAG content. Custom services make
use of the file manager for application code, too.

{{< info >}}
The File Manager service automatically connects to the ArangoDB MCP (Model Context
Protocol) service, enabling AI-assisted workflows to access and manage stored files
without additional configuration.
{{< /info >}}

## Web interface

### View files

1. Log in to the Arango Contextual Data Platform web interface.
2. Go to **Control Panel** in the main navigation sidebar and then
   click **File Manager**.
3. Select the desired tab:
   - **Container Services**: Files uploaded for container service deployments,
     grouped by service name. Each service row shows the total number of versions
     and their combined size. Click a service to expand it and browse individual
     versions, each with its own version number, language, storage location, size,
     and status.
   - **RAG Input Files**: Files uploaded for GraphRAG processing. Use the
     **Database** dropdown above the table to filter files by database. The table
     shows each file's name, version, database, content type, storage location,
     size, and status.
4. The summary cards at the top of each tab show the total number of files, their
   combined size, and how many are currently safe to delete.

A **Status** column indicates whether a file is currently **In use** by a running
service. Files marked as **In use** cannot be deleted.

### Delete files

Files can only be deleted when they are not in use by any running service.

- **Container Services**: A file can be deleted only if it is not currently used
  by a running service.
- **RAG Input Files**: A file can be deleted only if it is not currently in use
  by any service in the system.

To delete a file:

1. Log in to the Arango Contextual Data Platform web interface.
2. Go to **Control Panel** in the main navigation sidebar and then
   click **File Manager**.
3. Go to the tab containing the file you want to delete.
4. In the row of the desired item, click the delete icon ({{< icon "delete" >}})
   in the **Actions** column and confirm by clicking **Delete**.

The delete icon is only active when the file is safe to delete.

## API

You can manage files programmatically using the [File Manager HTTP API](api/).
