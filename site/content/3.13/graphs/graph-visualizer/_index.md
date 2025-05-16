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

- **Add New Nodes (Vertices):**  
  Right-click anywhere on the canvas and select **"Create Node"**. A dropdown will appear showing all related document collections. Select the desired collection (vertex type), provide a unique identifier or name, and create the node. The node will then appear in the visualization.

- **Step-1 : Right Click On Graph Area**
![Create - new - Node](../../images/1a-Create_Node.png)
- **Step-2 : Select Create Node**
![Create - new - Node](../../images/1b-Create_Node.png)
- **Step-3 : Select the desired Node Type and click on Create**
![Create - new - Node](../../images/1c-Create_Node.png)

- **Add New Edges (Relationships):**  
  Right-click on the canvas and select **"Create Edge"**. Choose the edge collection from the dropdown, provide a name for the edge, and correctly set the `_from` and `_to` fields by selecting source and target nodes. The edge will be created and visualized between the two nodes.




- **Delete Nodes or Edges:**  
  Select a node or edge and right-click to access the **"Delete"** option. This action removes the selected element from both the graph and the database.

- **Properties of Nodes or Edges:**  
  If You Select a node or edge a Pop-In will appear and display the properties of selected Node or Edge.
  
  <!-- - **Edit:** Open a document editor to modify the node or edge properties and save them to the database. -->
  <!-- - **Expand:** Visually expand  the selected node to reveal its connected neighbors.
  - **Set as Start Node:** Mark the node as the starting point in graph traversal.
  - **Pin Node:** Lock the node in place on the canvas to prevent movement.
  - **Unpin Node:** Unlock a pinned node to allow repositioning. -->

## 2.Graph Visualization

The core function of the Graph Visualizer is to provide an intuitive canvas for exploring graph structures.

- **List All Graphs:**  
  View and select any graph from the list of connected graphs, including **General Graphs**, **Smart Graphs**, **Satellite Graphs**, **Enterprise Graphs**, and **Knowledge Graphs**.

- **Select and Load a Graph:**  
  Upon selecting a graph, its nodes and edges are visualized. The visualization includes a summary of the vertex and edge collections involved, providing a clear view of the data model and relationships.

- **Dynamic Graph Rendering:**  
  In addition to static graphs, you can dynamically render graphs using the **New Query** or **Saved Queries** options. This allows visualizing results from custom AQL queries on demand.

## 3.Search & Filter Data

The top-left section of the Graph Visualizer includes powerful search and query tools for interactive exploration.

##### 🔍 Search
- User have to select one of the type of vertex from the provided dropdown and by entering the property name or field  name user can able to fetch the data.

##### 💾 Saved Queries
- Lists all previously saved AQL queries.
- Each entry supports **Run**, **Copy**, and **Delete** actions for ease of reuse.

##### ✏️ New Query
- Write and execute custom AQL queries within the visualizer.
- Results are rendered directly onto the graph canvas.
- You can save queries with a **custom name and description**, making them available under **Saved Queries**.

## 4.Visual Customization

Click the **navigation icon** at the bottom-right of the canvas to reveal styling and customization tools.

##### 🏷️ Display Fields
  Choose which attributes or fields from the document to display as node or edge labels.

##### 🎨 Styling Options 
  Modify the **color** and **opacity** of selected nodes or edges for emphasis or categorization.

##### 🔗 Edge-Specific Options
  - Adjust **line thickness** to represent weight or importance.
  - Set **arrowhead styles** for source and target, choosing from different shapes.

These options are especially helpful when working with dense or complex graphs, making key elements stand out.

## 5.Layouts and Navigation Tools

Graph layout and navigation tools help users manage large and complex graphs effectively.

- **Mini-map:**  
  View a compact overview of the graph and navigate quickly.

- **Zoom Controls:**  
  Use the buttons to zoom in/out, or manually set a specific zoom percentage.

- **Fit to Screen:**  
  Automatically resize and center the graph to fit the visible canvas.

- **Re-run Layout:**  
  Rearrange nodes and edges to apply a fresh layout for improved clarity.

- **Layout Algorithms:**  
  Switch between layout styles such as:
  - **Force-directed**
  - **Hierarchical**
  - **Concentric**

These features allow better spatial understanding of node clusters, hierarchies,
and relationship flows.

---