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

## Graph Creation

While the Graph Visualizer is primarily designed for exploring graph data, you can also create and modify nodes and edges directly from the canvas.

###  Add New Nodes
To add a new node to a graph:
1. In the **Graphs** section of the ArangoDB web interface, select your graph.
2. Right-click on the canvas and choose **Create Node**.
3. In the dialog:
   - Select the target collection (**Node Type**)
   - Optionally specify a unique identifier (**Node ID**)
4. Click **Create** to add the node to the canvas and database.

![Create Node](../../../images/Graph-visualizer-CreateNode.PNG)

### Add New Edges
To add an edge:
1. Select the graph from the **Graphs** section.
2. Right-click and select **Create Edge**.
3. In the dialog, choose the edge collection.
4. Set `_from` and `_to` fields by selecting nodes.
5. Optionally enter a unique ID.
6. Click **Create** to finish.
![Create Edge](../../../images/Graph-visualizer-CreateEdge.png)

### Delete Nodes or Edges

  To delete a node or edge:
- Select it on the canvas.
- Right-click and choose **Delete** to remove it from both the graph and database.

- **Select Node and Right-click**
![Delete Node](../../../images/Graph-visualizer-DeleteNode.PNG)
- **Select Edge and Right-click**
![Delete Edge](../../../images/Graph-visualizer-DeleteEdge.PNG)

### View Node Properties

To view properties:
- Click on a node or edge to open its properties pop-up.

- **Select Node to display the Properties**
![Create Edge](../../../images/Graph-visualizer-Propertiesofnode.png)

## Graph Visualization

The core function of the Graph Visualizer is to provide an intuitive canvas for exploring graph structures.

### List All Graphs
  Arango Db provides various types of graphs like
- General Graphs
- SmartGraphs
- SatelliteGraphs
- EnterpriseGraphs
- KnowledgeGraphs

![Graphs List](../../../images/Graph_VisualizerList_All_Graphs.png)

### Select and Load a Graph

After selecting a graph from the list, it may not be immediately visualized on the canvas. In cases such as:
- Using the **Clear Canvas** option
- Reopening the Graph Visualizer after a previous session
- Selecting a graph with no initial nodes displayed

You may see a message prompting you to use the **Explore** button.  
To view the graph:

- Click **Explore** and search for a node by name or ID.
- Alternatively, use the **New Query** or **Saved Query** buttons to display part of the graph.

![Loaded Graph](../../../images/Graph_visuaizer_Load_Graph.png)

{{< tip >}}
Use the **Explore** button to run AQL queries and render results directly on the graph.
You can also save your queries for future use.
{{< /tip >}}
## Search & Filter Data

The top-left section of the Graph Visualizer includes powerful search and query tools for interactive exploration.

### Search

1. Click the **Search** icon.
2. Choose a vertex type.
3. Enter a field or property to search for specific nodes.

Enter the DataValue or fields to get the required Data
![Search](../../../images/Graph_Visualizer_Search_Response.png)

### Saved Queries

- Open **Search** and click **Saved Queries**.
- Each query has options to:
  - **Run** it again
  - **Copy** to modify
  - **Delete** if no longer needed

![Saved Queries](../../../images/Graph_Visualizer_savedquery.png)

### New Queries
- Go to **Search** → **New Query**.
- Write and run your own AQL query.
- Results are shown on the graph.
- You can save it with a custom name and description.

![](../../../images/Graph_Visualizer_new_Query.png)

- **Response of the NewQuery**
![](../../../images/Graph_Visualizer_NewQuery_response.png)


## Visual Customization

Click the **style panel** (bottom-right) to:
- Change node/edge colors
- Adjust opacity

### Styling Options 
Modify the **color** and **opacity** of selected nodes or edges for emphasis or categorization.
![](../../../images/Graph_Visualizer_Styling_Options.png)

### Edge-Specific Options

- Set line thickness to represent weights.
- Choose different arrowhead styles for source and target nodes.

![](../../../images/Graph_Visualizer_Edge-Specific_Options.PNG)

## Layouts and Navigation Tools

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
