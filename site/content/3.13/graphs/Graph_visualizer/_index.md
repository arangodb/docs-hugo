---
title: Graph Visualizer
menuTitle: Graph Visualizer
weight: 85
description: >-
  Visualize and interact with your ArangoDB graphs in an intuitive and interactive interface
---

The **Graph Visualizer** provides an interactive interface to explore graph connections
in your ArangoDB database. It allows users to navigate edges, inspect vertices,
and visually understand the data structure.

{{< info >}}
Graph creation is **not** performed within the Graph Visualizer. Graphs must be created in the **Graphs** section of the current Management interface, accessed through the second-level navigation. Once created, graphs automatically appear in the Graph Visualizer, ready for exploration and visualization.
{{< /info >}}

## 1.Graph Creation

While the Graph Visualizer is primarily designed for exploring graph data, you can also create and modify nodes and edges directly from the canvas.
<!-- ### A. Add New Nodes -->
<!-- 
  Right-click anywhere on the canvas to open the context menu and select **Create Node**. A dropdown appears listing available document collections. Select a collection (vertex type), enter a unique identifier, and create the node. It is then added to the visualization.

##### 1. Open the Graph Interface
Launch the **Graphs** tab on the left sidebar and select the graph where the new node is to be created.
##### 2. Navigate to the Node Section
Right click on the graph area
##### 3. Add a New Node
Locate the **Create Node** option and click on it. A form or dialog box should appear select the **Collection** name.
##### 4. Enter Node Details
Provide:
- **ID**: Option to selct A unique identifier or user can add manually.
##### 5. Save the Node
Click the save button. The node should appear in the graph visualization. -->
### A. Add New Nodes
To add a new node to a graph:
1. In the **Graphs** section of the ArangoDB web interface, select your graph.
2. Right-click on the canvas and choose **Create Node**.
3. In the dialog:
   - Select the target collection (**Node Type**)
   - Optionally specify a unique identifier (**Node ID**)
4. Click **Create** to add the node to the canvas and database.

![Create Node](../../../images/Graph-visualizer-CreateNode.PNG)

<!-- ### Add New Edges -->
  <!-- Right-click on the canvas and select **"Create Edge"**. Choose the edge collection from the dropdown, provide a name for the edge, and correctly set the `_from` and `_to` fields by selecting source and target nodes. The edge will be created and visualized between the two nodes.

##### 1. Open the Graph Interface
Launch the **Graphs** tab on the left sidebar and select the graph where the new edge is to be created.
##### 2. Navigate to the Edge Section
Right click on the graph area
##### 3. Add a New Edge
Locate the **Create Edge** option and click on it. A form or dialog box should appear select the **Collection** name.
##### 4. Enter Edge Details
Provide:
- **ID**: Option to selct A unique identifier or user can add manually.
- **_from**: Option to selct the collection name manually from the drop down.
- **_to**: Option to selct the collection name manually from the drop down.
##### 5. Save the Edge
Click the save button. The edge should appear in the graph visualization. -->
### B. Add New Edges
To add an edge:
1. Select the graph from the **Graphs** section.
2. Right-click and select **Create Edge**.
3. In the dialog, choose the edge collection.
4. Set `_from` and `_to` fields by selecting nodes.
5. Optionally enter a unique ID.
6. Click **Create** to finish.
![Create Edge](../../../images/Graph-visualizer-CreateEdge.png)

### C. Delete Nodes or Edges
  <!-- Select a node or edge and right-click to access the **"Delete"** option. This action removes the selected element from both the graph and the database. -->
  To delete a node or edge:
- Select it on the canvas.
- Right-click and choose **Delete** to remove it from both the graph and database.

- **Select Node and Right-click**
![Delete Node](../../../images/Graph-visualizer-DeleteNode.PNG)
- **Select Edge and Right-click**
![Delete Edge](../../../images/Graph-visualizer-DeleteEdge.PNG)

### D. View Node Properties
<!-- If You Select a node or edge a Pop-In will appear and select **View-Node** to display the properties of selected Node. -->
To view properties:
- Click on a node or edge to open its properties pop-up.


- **Select Node to display the Properties**
![Create Edge](../../../images/Graph-visualizer-Propertiesofnode.png)

## 2.Graph Visualization

The core function of the Graph Visualizer is to provide an intuitive canvas for exploring graph structures.

### A. List All Graphs
  <!-- View and select any graph from the list of connected graphs, including  -->
  <!-- **General Graphs**, **Smart Graphs**, **Satellite Graphs**, **Enterprise Graphs**, and **Knowledge Graphs**. -->
  Arango Db provides various types of graphs like
- General Graphs
- SmartGraphs
- SatelliteGraphs
- EnterpriseGraphs
- KnowledgeGraphs

![Graphs List](../../../images/Graph_VisualizerList_All_Graphs.png)

### B. Graph Selection
Graphs do not auto-load. Click **Graph Name** to visualize specific parts of the graph.

![Loaded Graph](../../../images/Graph_visuaizer_Load_Graph.png)
### C. Dynamic Graph
  In addition to static graphs, you can dynamically render graphs using the **New Query** or **Saved Queries** options. This allows visualizing results from custom AQL queries on demand.
{{< tip >}}
Use the **Explore** button to run AQL queries and render results directly on the graph.
You can also save your queries for future use.
{{< /tip >}}
## 3.Search & Filter Data

The top-left section of the Graph Visualizer includes powerful search and query tools for interactive exploration.

### A. Search
<!-- Click on Search Icon to get Pop-Up then User have to select one of the type of vertex from the provided dropdown and by entering the property name or field  name user can able to fetch the data. -->
<!-- #### 1. Search Icon 
Click on search Icon to get Pop-Up 
#### 2. Select Vertex Type
Select One of the type of vertes from the provided dropdown
#### 3. Search Response -->
1. Click the **Search** icon.
2. Choose a vertex type.
3. Enter a field or property to search for specific nodes.

Enter the DataValue or fields to get the required Data
![Search](../../../images/Graph_Visualizer_Search_Response.png)

### B. Saved Queries
<!-- Lists all previously saved AQL queries.Each entry supports **Run**, **Copy**, and
**Delete** actions for ease of reuse.
- **Click on Search Icon and Select Saved Queries** -->
- Open **Search** and click **Saved Queries**.
- Each query has options to:
  - **Run** it again
  - **Copy** to modify
  - **Delete** if no longer needed

![Saved Queries](../../../images/Graph_Visualizer_savedquery.png)
<!-- ### New Query
Write and execute custom AQL queries within the visualizer.Results are rendered
directly onto the graph canvas.You can save queries with a **custom name and description**,
making them available under **Saved Queries**.

- **Click on Search Icon and Select New Query** -->
### C. New Queries
- Go to **Search** → **New Query**.
- Write and run your own AQL query.
- Results are shown on the graph.
- You can save it with a custom name and description.

![](../../../images/Graph_Visualizer_new_Query.png)

- **Response of the NewQuery**
![](../../../images/Graph_Visualizer_NewQuery_response.png)


## 4.Visual Customization

<!-- Click the **navigation icon** at the bottom-right of the canvas to reveal styling and customization tools. -->
Click the **style panel** (bottom-right) to:
- Change node/edge colors
- Adjust opacity

### A. Styling Options 
Modify the **color** and **opacity** of selected nodes or edges for emphasis or categorization.
![](../../../images/Graph_Visualizer_Styling_Options.png)

### B. Edge-Specific Options
<!-- - Adjust **line thickness** to represent weight or importance.
- Set **arrowhead styles** for source and target, choosing from different shapes.
These options are especially helpful when working with dense or complex graphs, making key elements stand out. -->
- Set line thickness to represent weights.
- Choose different arrowhead styles for source and target nodes.

![](../../../images/Graph_Visualizer_Edge-Specific_Options.PNG)

## 5.Layouts and Navigation Tools

**Graph Layout Tools**:

- **Mini-map**: Small overview to navigate the graph.
![](../../../images/Graph_Visualizer_minimap.PNG)

- **Zoom Controls**: Zoom in/out or set specific zoom.

- **Fit to Screen**: Resize and center the graph view.

- **Re-run Layout**: Automatically rearranges nodes.

- **Layout Algorithms**: Choose between layouts to better see clusters or flows.

![](../../../images/Graph_Visualizer_Layout_Algorithms.PNG)

These features allow better spatial understanding of node clusters, hierarchies,
and relationship flows.
