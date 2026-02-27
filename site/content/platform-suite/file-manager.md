---
title: The File Manager of the Arango Data Platform
menuTitle: File Manager
weight: 34
description: >-
  View and manage the data of services, such as your uploaded content
  for GraphRAG and the files used by service containers
---
Some of the services that run in the Arango Data Platform need to store larger
amounts data. This data needs to be stored outside of the ArangoDB database system.

The Data Platform supports different blob storage solutions for this data
persistence, such as S3 cloud storage. This storage is used by services of
the Agentic AI Suite for instance, such as for storing AI models and training-related
metadata, as well as for user-uploaded GraphRAG content. Custom services make
use of the file manager for application code, too.

## Web interface

### View files

<!-- TODO: Scoped to database? If not, why is it under Database? -->

1. In the main navigation of the Arango Data Platform web interface, go to the
   **Database** ({{< icon "database" >}}).
2. Click **File Manager** in the navigation.
3. Go the the desired tab:
   - **Container Services**: The data used by services such as the bundled
     application code. The entries are grouped by service name. If there are
     multiple sub-elements, you can expand the list and see the data for each
     version of the service.
   - **RAG Input Files**: The user-uploaded content for GraphRAG.
   - **AutoGraph Files**: Files the AutoGraph feature uses internally.
4. The cards at the top show you the total number of files, their total size,
   as well as how many of the files can be safely deleted at the moment.

### Delete files

1. In the main navigation, go to the **Database** ({{< icon "database" >}}).
2. Click **File Manager** in the navigation.
3. Go the the desired tab:
   - **Container Services**: You can delete files if they are not currently
     used by a service.
   - **RAG Input Files**: You can always delete these files.
   - **AutoGraph Files**: These files are system-managed and you cannot
     delete them.
4. In the row of the desired item, click the delete icon ({{< icon "delete" >}})
   in the **Actions** column and confirm by clicking **Delete**.

<!-- TODO:
## API
-->
