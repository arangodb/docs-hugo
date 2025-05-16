---
title: Graph Visualizer
menuTitle: Graph Visualizer
weight: 85
description: >-
  Graph Visualizer allows you to visualize the graphs present in the database.
---

A **Graph** in ArangoDB is a powerful data structure that models relationships between entities. The **Graph Visualizer** provides an interactive interface to explore these connections, enabling users to traverse edges, inspect vertices, and intuitively understand the underlying data structure.

> 💡 **Note:** Graph creation is **not** performed within the Graph Visualizer. Graphs must be created in the **Graphs** section of the application. Once a graph is created there, it will automatically appear in the Graph Visualizer, ready for exploration and visualization.

## 1.Data Augmentation

While the Graph Visualizer is primarily designed for exploring graph data, you can also create and modify nodes and edges directly from the canvas.

**A.Add New Nodes (Vertices):** 
  Right-click anywhere on the canvas and select **"Create Node"**. A dropdown will appear showing all related document collections. Select the desired collection (vertex type), provide a unique identifier or name, and create the node. The node will then appear in the visualization.

- **Step-1 : Right Click On Graph Area**
{{< image src="../../images/1a-Create_Node.png" >}}

- **Step-2 : Select Create Node**
{{< image src="../../images/1b-Create_Node.png" >}}

- **Step-3 : Select the desired Node Type and click on Create**
{{< image src="../../images/1c-Create_Node.png" >}}

**B.Add New Edges (Relationships):**  
  Right-click on the canvas and select **"Create Edge"**. Choose the edge collection from the dropdown, provide a name for the edge, and correctly set the `_from` and `_to` fields by selecting source and target nodes. The edge will be created and visualized between the two nodes.

- **Step-1 : Right Click On Graph Area**
{{< image src="../../images/2a-Create_Edge.png" >}}

- **Step-2 : Select Create Edge**
{{< image src="../../images/2b-Create_Edge.png" >}}

- **Step-3 : Select the desired Edge from drop down and enter valid details in '_from' and '_to' and click Create**
{{< image src="../../images/2c-Create_Edge.png" >}}

**C.Delete Nodes or Edges:**  
  Select a node or edge and right-click to access the **"Delete"** option. This action removes the selected element from both the graph and the database.

- **Select Node and Right click**
{{< image src="../../images/3a-Delete_Node.png" >}}

- **Select Edge and Right click**
{{< image src="../../images/3b-Delete_Edge.png" >}}

**D.Properties of Nodes or Edges:**  
  If You Select a node or edge a Pop-In will appear and display the properties of selected Node or Edge.

- **Select Edge to display the Properties**
{{< image src="../../images/4a-Properties-of-Edge.png" >}}

- **Select Node to display the Properties**
{{< image src="../../images/4-Properties-of-Node.png" >}}

## 2.Graph Visualization

The core function of the Graph Visualizer is to provide an intuitive canvas for exploring graph structures.

- **List All Graphs:**  
  View and select any graph from the list of connected graphs, including **General Graphs**, **Smart Graphs**, **Satellite Graphs**, **Enterprise Graphs**, and **Knowledge Graphs**.
{{< image src="../../images/1_List All Graphs.png" >}}

- **Select and Load a Graph:**  
  Upon selecting a graph, its nodes and edges are visualized. The visualization includes a summary of the vertex and edge collections involved, providing a clear view of the data model and relationships.
{{< image src="../../images/2_Load_Graph.png" >}}

- **Dynamic Graph Rendering:**  
  In addition to static graphs, you can dynamically render graphs using the **New Query** or **Saved Queries** options. This allows visualizing results from custom AQL queries on demand.
  - **Dynamic Graph By using New-Query**
{{< image src="../../images/3a_DynamicGraphby_NewQuery.png" >}}
  - **Dynamic Graph By using Saved-Query**
{{< image src="../../images/DynamicGraph_By_Saved_Query.png" >}}

## 3.Search & Filter Data

The top-left section of the Graph Visualizer includes powerful search and query tools for interactive exploration.

##### 🔍 Search
User have to select one of the type of vertex from the provided dropdown and by entering the property name or field  name user can able to fetch the data.

- **Step-1 : Click on Search Icon to get Pop-Up**
{{< image src="../../images/1a_search.png" >}}
- **Step-2 : Select Vertex Type from DropDown**
{{< image src="../../images/1b_search.png" >}}
- **Step-3 : Enter the DataValue or fields toget the required Data**
{{< image src="../../images/1c_Search Response.png" >}}

##### 💾 Saved Queries
Lists all previously saved AQL queries.Each entry supports **Run**, **Copy**, and
**Delete** actions for ease of reuse.
- **Click on Search Icon and Select Saved Queries**
{{< image src="../../images/2a_savedquery.png" >}}

##### ✏️ New Query
Write and execute custom AQL queries within the visualizer.Results are rendered
directly onto the graph canvas.You can save queries with a **custom name and description**,
making them available under **Saved Queries**.
- **Click on Search Icon and Select New Query**
{{< image src="../../images/3a_new_Query.png" >}}
- **Response of the NewQuery**
{{< image src="../../images/3b_NewQuery_response.png" >}}

## 4.Visual Customization

Click the **navigation icon** at the bottom-right of the canvas to reveal styling and customization tools.

##### 🏷️ Display Fields
Choose which attributes or fields from the document to display as node or edge labels.
- **Select Node to Display Fields**
{{< image src="../../images/4-Properties-of-Node.png" >}}

##### 🎨 Styling Options 
Modify the **color** and **opacity** of selected nodes or edges for emphasis or categorization.
{{< image src="../../images/2_Styling Options.png" >}}

##### 🔗 Edge-Specific Options
- Adjust **line thickness** to represent weight or importance.
- Set **arrowhead styles** for source and target, choosing from different shapes.
These options are especially helpful when working with dense or complex graphs, making key elements stand out.
{{< image src="../../images/3_Edge-Specific Options.png" >}}

## 5.Layouts and Navigation Tools

Graph layout and navigation tools help users manage large and complex graphs effectively.

- **Mini-map:**  
  View a compact overview of the graph and navigate quickly.
{{< image src="../../images/1_minimap.png" >}}

- **Zoom Controls:**  
  Use the buttons to zoom in/out, or manually set a specific zoom percentage.

- **Fit to Screen:**  
  Automatically resize and center the graph to fit the visible canvas.

- **Re-run Layout:**  
  Rearrange nodes and edges to apply a fresh layout for improved clarity.

- **Layout Algorithms:**  
  Switch between layout styles such as:
{{< image src="../../images/5_Layout Algorithms.png" >}}

These features allow better spatial understanding of node clusters, hierarchies,
and relationship flows.

---