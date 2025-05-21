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

> 💡 **Note:** Graph creation is **not** performed within the Graph Visualizer. Graphs must be created in the **Graphs** section of the application. Once a graph is created there, it will automatically appear in the Graph Visualizer, ready for exploration and visualization.

## 1.Graph

While the Graph Visualizer is primarily designed for exploring graph data, you can also create and modify nodes and edges directly from the canvas.

### Add New Nodes

  Right-click anywhere on the canvas to open the context menu and select **Create Node**. A dropdown appears listing available document collections. Select a collection (vertex type), enter a unique identifier, and create the node. It is then added to the visualization.

- **Step-1 : Right Click On Graph Area**
- **Step-2 : Select Create Node**
- **Step-3 : Select the desired Node Type and click on Create**

![Create Node](../../../images/Graph-visualizer-CreateNode.PNG)
### Add New Edges
  Right-click on the canvas and select **"Create Edge"**. Choose the edge collection from the dropdown, provide a name for the edge, and correctly set the `_from` and `_to` fields by selecting source and target nodes. The edge will be created and visualized between the two nodes.

- **Step-1 : Right Click On Graph Area**
- **Step-2 : Select Create Edge**
- **Step-3 : Select the desired Edge from drop down and enter valid details in '_from' and '_to' and click Create**
![Create Edge](../../../images/Graph-visualizer-CreateEdge.png)

### Delete Nodes or Edges

  Select a node or edge and right-click to access the **"Delete"** option. This action removes the selected element from both the graph and the database.

- **Select Node and Right click**
![Create Edge](../../../images/Graph-visualizer-DeleteNode.PNG)
- **Select Edge and Right click**
![Create Edge](../../../images/Graph-visualizer-DeleteEdge.PNG)
### View Node Properties

  If You Select a node or edge a Pop-In will appear and display the properties of selected Node or Edge.

- **Select Node to display the Properties**
![Create Edge](../../../images/Graph-visualizer-Propertiesofnode.png)

## 2.Graph Visualization

The core function of the Graph Visualizer is to provide an intuitive canvas for exploring graph structures.

- **List All Graphs:**  
  View and select any graph from the list of connected graphs, including **General Graphs**, **Smart Graphs**, **Satellite Graphs**, **Enterprise Graphs**, and **Knowledge Graphs**.
{{< image src="../../images/1_List All Graphs.png" >}}
![Create Edge](../../../images/Graph-visualizer-Propertiesofnode.png)
- **Select and Load a Graph:**  
  Upon selecting a graph, its nodes and edges are visualized. The visualization includes a summary of the vertex and edge collections involved, providing a clear view of the data model and relationships.
{{< image src="../../images/2_Load_Graph.png" >}}
![Create Edge](../../../images/Graph-visualizer-Propertiesofnode.png)
- **Dynamic Graph Rendering:**  
  In addition to static graphs, you can dynamically render graphs using the **New Query** or **Saved Queries** options. This allows visualizing results from custom AQL queries on demand.
> 💡 On CLick search bar (Explore) user can able to run the query and see the result on Canvas.And also user can able to save the query for future use.

## 3.Search & Filter Data

The top-left section of the Graph Visualizer includes powerful search and query tools for interactive exploration.

##### 🔍 Search
Click on Search Icon to get Pop-Up then User have to select one of the type of vertex from the provided dropdown and by entering the property name or field  name user can able to fetch the data.

- **Step-1 : Click on Search Icon to get Pop-Up**
- **Step-2 : Select Vertex Type from DropDown**
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