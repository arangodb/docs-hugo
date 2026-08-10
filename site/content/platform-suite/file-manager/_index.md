---
title: File Manager
menuTitle: File Manager
weight: 25
description: >-
  View and manage container service files and RAG input files stored by the
  Arango Contextual Data Platform
---
The Contextual Data Platform supports different blob storage solutions for this data
persistence, such as S3 cloud storage. This storage is used by services of
the Agentic AI Suite for instance, such as for storing AI models and training-related
metadata, as well as for user-uploaded GraphRAG content. Custom services make
use of the file manager for application code, too.


## Organizing files with scopes


RAG input files are organized into **scopes**. A scope is an ordered list of
labels that addresses a file within a database, for example
`acme / legal / q3`. The model is deliberately generic: the same
mechanism represents a project, a module, or any deeper folder level, and each
service that uses the File Manager maps its own concepts onto scope levels.

The following rules apply:

- A scope has at most **five levels**.
- Each label can be up to **128 characters** long and may contain letters,
  digits, underscores, and hyphens only. All labels combined must not exceed
  256 characters.
- A file belongs to **exactly one** scope.
- Scopes are **derived from files**. A scope exists only while at least one file
  is stored under it, and it disappears when the last file is removed. You
  cannot create an empty scope.
- Files that have no scope are the database's default, unscoped files.

A file is identified by the combination of database, scope, and name. Uploading
a file with the same name into the same scope creates a new version of that
file, whereas the same name in a different scope is a separate, independent
file.

## Attaching custom metadata

Besides its scope, a RAG input file can carry your own notes, attached when you
upload it as a set of name-value pairs called `custom_metadata`. File Manager
only keeps these and hands them back unchanged, so you can use whatever names
suit your own applications.

A few names are picked up by other services. Setting `citable_url` to a
document's public web address, for example, lets the AutoGraph service show
clickable links on the citations for that document. See
[Custom metadata](api.md#custom-metadata) for the size limits and how the notes
relate to file versions.

## Web interface

The **File Manager Service** page lets you manage container service files and RAG
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
