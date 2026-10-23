---
title: Sidebar reference
menuTitle: Sidebar reference
weight: 5
description: >-
  Every entry in the sidebar of the data platform web interface, what it opens,
  and where to learn more about it
---
The sidebar of the [data platform web interface](_index.md) groups its entries
into sections. The tables below list the entries of each section in the order
they appear, with the icon that the sidebar shows for them.

## Database related

The views in this section work with the database that is selected in the
[database selector](_index.md#database-selector).

| Icon | Entry | What you do there | Learn more |
|:----:|:------|:------------------|:-----------|
| {{< image src="../../images/platform-ui-icons/dashboard.png" alt="Dashboard icon" style="width: 24px; margin: 0;" >}} | **Dashboard** | Check the health of the deployment, such as the status of the Coordinators, DB-Servers, and Agents, and how shards are distributed. | [Cluster](../../arangodb/3.12/components/web-interface/cluster.md) |
| {{< image src="../../images/platform-ui-icons/query-editor.png" alt="Query Editor icon" style="width: 24px; margin: 0;" >}} | **Query Editor** | Write, run, explain, and profile AQL queries in tabs, save queries, and generate or optimize queries with AI assistance. | [Query Editor](../../platform-suite/query-editor.md) |
| {{< image src="../../images/platform-ui-icons/graphs.png" alt="Graphs icon" style="width: 24px; margin: 0;" >}} | **Graphs** | List, create, and delete named graphs, and open a graph in the Graph Visualizer. | [Graph Visualizer](../../platform-suite/graph-visualizer.md) |
| {{< image src="../../images/platform-ui-icons/management.png" alt="Management icon" style="width: 24px; margin: 0;" >}} | **Management** | Open the administration views of the ArangoDB core database system, see [Management menu](#management-menu). | [Web Interface (ArangoDB)](../../arangodb/3.12/components/web-interface/_index.md) |

## Agentic AI Suite

{{< tag "Agentic AI Suite" >}}

| Icon | Entry | What you do there | Learn more |
|:----:|:------|:------------------|:-----------|
| {{< image src="../../images/platform-ui-icons/autograph-studio.png" alt="AutoGraph Studio icon" style="width: 24px; margin: 0;" >}} | **AutoGraph Studio** | Create projects that turn your documents into a Context Graph and deploy retrievers to answer questions from it. | [AutoGraph web interface](../../agentic-ai-suite/autograph/web-interface.md) |
| {{< image src="../../images/platform-ui-icons/graph-analytics.png" alt="Graph Analytics icon" style="width: 24px; margin: 0;" >}} | **Graph Analytics** | Start Graph Analytics Engines and run graph algorithms such as PageRank on them. | [Graph Analytics web interface](../../agentic-ai-suite/graph-analytics/web-interface.md) |
| {{< image src="../../images/platform-ui-icons/graphml.png" alt="GraphML icon" style="width: 24px; margin: 0;" >}} | **GraphML** | Create GraphML projects and run featurization, training, and prediction jobs. | [GraphML web interface](../../agentic-ai-suite/graphml/ui.md) |
| {{< image src="../../images/platform-ui-icons/ada.png" alt="Ada icon" style="width: 24px; margin: 0;" >}} | **Ada** (beta) | Ask questions about your database in natural language and let the AI assistant run queries for you. | [Ada](../../agentic-ai-suite/ada/_index.md) |

## Other services

These entries have sub-entries. Click an entry to expand it in the sidebar.

| Icon | Entry | Sub-entries | Learn more |
|:----:|:------|:------------|:-----------|
| {{< image src="../../images/platform-ui-icons/applications.png" alt="Applications icon" style="width: 24px; margin: 0;" >}} | **Applications** | **All apps**, followed by one entry per deployed app that has its own user interface. | [Apps](../../platform-suite/container-manager/apps.md) |
| {{< image src="../../images/platform-ui-icons/ai-tools.png" alt="AI Tools icon" style="width: 24px; margin: 0;" >}} | **AI Tools** | **Notebook servers** to run Jupyter notebooks, and **MLFlow** to track experiments and manage models. | [Notebook servers](../../agentic-ai-suite/notebook-servers.md) |
| {{< image src="../../images/platform-ui-icons/monitoring.png" alt="Monitoring icon" style="width: 24px; margin: 0;" >}} | **Monitoring** | **Grafana** dashboards and **Prometheus** metrics. | [Monitoring](../../platform-suite/monitoring.md) |

## Admin

| Icon | Entry | What you do there | Learn more |
|:----:|:------|:------------------|:-----------|
| {{< image src="../../images/platform-ui-icons/databases.png" alt="Databases icon" style="width: 24px; margin: 0;" >}} | **Databases** | List, create, and delete databases. | [Databases](../../arangodb/3.12/concepts/data-structure/databases.md) |
| {{< image src="../../images/platform-ui-icons/secrets.png" alt="Secrets icon" style="width: 24px; margin: 0;" >}} | **Secrets** | Store API keys and credentials, for example, for LLM providers, so that services can use them without exposing them. | [Secrets Manager](../../platform-suite/secrets-manager.md) |
| {{< image src="../../images/platform-ui-icons/file-manager.png" alt="File Manager icon" style="width: 24px; margin: 0;" >}} | **File Manager** | Review uploaded service packages and RAG input files, and delete the ones no service uses anymore. | [File Manager](../../platform-suite/file-manager/_index.md) |
| {{< image src="../../images/platform-ui-icons/container-manager.png" alt="Container Manager icon" style="width: 24px; margin: 0;" >}} | **Container Manager** | Deploy your own services from code packages or container images and manage running instances. | [Container Manager web interface](../../platform-suite/container-manager/web-interface.md) |

## Management menu

Clicking **Management** opens a second panel next to the sidebar with the
administration views of the ArangoDB core database system. These views work
with the database selected in the [database selector](_index.md#database-selector).

![The Management menu opened next to the sidebar](../../images/data-platform-ui-management-menu.png)

| Icon | Entry | What you do there | Learn more |
|:----:|:------|:------------------|:-----------|
| {{< image src="../../images/platform-ui-icons/management-cluster.png" alt="Cluster icon" style="width: 24px; margin: 0;" >}} | **Cluster** | View statistics and the health of the cluster. | [Cluster](../../arangodb/3.12/components/web-interface/cluster.md) |
| {{< image src="../../images/platform-ui-icons/management-nodes.png" alt="Nodes icon" style="width: 24px; margin: 0;" >}} | **Nodes** | List the Coordinators, DB-Servers, and Agents with their endpoints, versions, and status, and see how shards are distributed. | [Cluster](../../arangodb/3.12/components/web-interface/cluster.md) |
| {{< image src="../../images/platform-ui-icons/management-collections.png" alt="Collections icon" style="width: 24px; margin: 0;" >}} | **Collections** | List, create, and configure collections, and browse their documents. | [Collections](../../arangodb/3.12/components/web-interface/collections.md) |
| {{< image src="../../images/platform-ui-icons/management-analyzers.png" alt="Analyzers icon" style="width: 24px; margin: 0;" >}} | **Analyzers** | List and create Analyzers for full-text search. | [Analyzers](../../arangodb/3.12/indexes-and-search/analyzers.md) |
| {{< image src="../../images/platform-ui-icons/management-views.png" alt="Views icon" style="width: 24px; margin: 0;" >}} | **Views** | List and create `arangosearch` and `search-alias` Views. | [ArangoSearch](../../arangodb/3.12/indexes-and-search/arangosearch/_index.md) |
| {{< image src="../../images/platform-ui-icons/management-queries.png" alt="Queries icon" style="width: 24px; margin: 0;" >}} | **Queries** | Run AQL queries and review running and slow queries. | [Queries](../../arangodb/3.12/components/web-interface/queries.md) |
| {{< image src="../../images/platform-ui-icons/management-graphs.png" alt="Graphs icon" style="width: 24px; margin: 0;" >}} | **Graphs** | List and create named graphs, including SmartGraphs, SatelliteGraphs, and EnterpriseGraphs. | [Graphs](../../arangodb/3.12/components/web-interface/graphs.md) |
| {{< image src="../../images/platform-ui-icons/management-services.png" alt="Services icon" style="width: 24px; margin: 0;" >}} | **Services** | Install and manage Foxx microservices. | [Services](../../arangodb/3.12/components/web-interface/services.md) |
| {{< image src="../../images/platform-ui-icons/management-users.png" alt="Users icon" style="width: 24px; margin: 0;" >}} | **Users** | Create user accounts and manage their permissions. | [Users](../../arangodb/3.12/components/web-interface/users.md) |
| {{< image src="../../images/platform-ui-icons/management-support.png" alt="Support icon" style="width: 24px; margin: 0;" >}} | **Support** | Find links to the documentation, community, and support channels, and browse the REST API. | |
| {{< image src="../../images/platform-ui-icons/management-shortcuts.png" alt="Shortcuts icon" style="width: 24px; margin: 0;" >}} | **Shortcuts** | Look up the keyboard shortcuts of the web interface. | |

The icons at the bottom of the Management panel link to the Arango community
channels.
