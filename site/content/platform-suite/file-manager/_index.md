---
title: The File Manager of the Arango Contextual Data Platform
menuTitle: File Manager
weight: 25
aliases:
  - file-manager
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

The **FileManager Service** page lets you manage container service files and RAG
input files from a single place.

### View files

1. Log in to the Arango Contextual Data Platform web interface.
2. Go to **Control Panel** in the main navigation sidebar and then
   click **File Manager**.
3. Select the desired tab. The number of files in each tab is shown in
   parentheses next to the tab name:
   - **Container Services**: Files uploaded for container service deployments,
     grouped by service name. The table columns are **Service Name**,
     **Version**, **Language**, **Storage Location**, **Size**, **Status**, and
     **Actions**. Services with multiple versions show the version count and
     combined size below the service name. Click the expand arrow next to a
     version to see its individual details.
   - **RAG Input Files**: Files uploaded for GraphRAG processing. Use the
     **Database** dropdown above the table to filter files by database. The
     table columns are **File Name**, **Version**, **Database**,
     **Content Type**, **Storage Location**, **Size**, **Status**, and
     **Actions**.
4. The summary cards at the top of each tab show:
   - **Total Files**: the number of files in the current tab
   - **Total Size**: the combined size of all files
   - **Safe to Delete**: the number of files that can currently be deleted

The **Status** column indicates whether a file is currently **In use** by a
running service. Files marked as **In use** cannot be deleted.

### Delete files

A **File Deletion Policy** info box is displayed at the bottom of the page:

- **Container Services**: Can only be deleted if not currently used by a running
  service.
- **RAG Input**: Can only be deleted if not currently in use by any service in
  the system.

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
