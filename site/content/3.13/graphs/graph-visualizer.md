---
title: Graph Visualizer
menuTitle: Graph Visualizer
weight: 102
description: >-
  Explore your ArangoDB graphs with an intuitive and interactive interface
---
The **Graph Visualizer** is a browser-based tool integrated into the web interface
of the ArangoDB Platform. It lets you explore the connections of your named graphs
to visually understand the structure as well as to inspect and edit the attributes
of individual nodes and edges. It also offers query capabilities and you can
create new nodes (vertices) and relations (edges).

{{< info >}}
Graph creation is **not** performed within the Graph Visualizer. Graphs must be
created in the **Management** section under **Graphs** of the second-level
navigation in the web interface. Once created, you can select a graph
from the list for for exploration and visualization.
{{< /info >}}

You can use the Graph Visualizer to do the following:

- Dynamically expand nodes to show more of their neighborhood to see how
  entities are connected.
- Inspect the properties of nodes and edges.
- Modify existing or create new nodes and edges.
- Filter specific collections to focus on a subset of your graph.
- Rearrange nodes automatically or manually for better visual clarity.
- Use zoom and pan to explore large graphs more easily.

## View a graph

The core function of the Graph Visualizer is to provide an intuitive canvas for
exploring graph structures. You can visualize any type of **named graph**
(General Graphs, SmartGraphs, EnterpriseGraphs, SatelliteGraphs).

{{< warning >}}
Anonymous graphs using adhoc sets of document and edge collections are not
supported by the Graph Visualizer.
{{< /warning >}}

### Select and load a graph

After selecting a graph from the list, it may not be immediately visualized on
the canvas. In cases such as:

- Using the **Clear Canvas** option
- Reopening the Graph Visualizer after a previous session
- Selecting a graph with no initial nodes displayed

You may see a message prompting you to use the **Explore** button.  
To view the graph:

- Click **Explore** and search for a node by name or ID.
- Alternatively, use the **New Query** or **Saved Query** buttons to display part
of the graph.

{{< tip >}}
Use the **Explore** button to run AQL queries and render results directly on the
graph. You can also save your queries for future use.
{{< /tip >}}

## Search and filter data

The top-left section of the Graph Visualizer includes powerful search and query
tools for interactive exploration.

### Search

To find specific nodes or edges:

1. Click the **Explore** button in the top-left panel of the Graph Visualizer.
2. Use the search box to look up a node by name or ID.
3. Matching nodes will be highlighted or loaded onto the canvas.

{{< tip >}}
You can also use the **New Query** or **Saved Query** buttons to load
specific subgraphs using AQL queries.
{{< /tip >}}

### Saved Queries

To run a saved query:

1. Click the **Explore** button at the top-left of the Graph Visualizer.
2. In the panel that opens, click the **Saved Queries** tab.
3. Each saved query has options to:
  - **Run** it again
  - **Copy** to modify
  - **Delete** if no longer needed

### New Queries

To run a custom query:

1. Click the **Explore** button at the top-left of the Graph Visualizer.
2. In the panel that opens, click the **New Query** tab.
3. Enter your AQL query in the editor.
4. Click **Run** to visualize the result on the graph canvas.

### View node and edge properties

You can inspect the document attributes of node or edge as follows:

- Double-click a node or edge to open a dialog with the properties.
- Right-click a node to open the context menu and click **View Node** to open
  the dialog with the properties.

## Edit graph data

While the Graph Visualizer is primarily designed for exploring graph data, you
can also create and modify nodes and edges directly from the canvas.

### Add new nodes

You can add nodes to the the graph's document collections directly from the
canvas. This allows you to expand your graph structure.

1. In the **Graphs** section of the ArangoDB web interface, select your graph.
2. Right-click on the canvas and choose **Create Node**.
3. A dialog opens with the following options:
   - Select the target collection (**Node Type**).
   - Optionally specify a unique identifier (**Node ID**).
4. Click **Create** to add the node to the canvas and database.

![Create Node](../../../images/Graph-visualizer-CreateNode_1.PNG)

### Add New Edges

You can add edges to the graph's edge collections directly from the canvas.
This allows you to create additional connections between nodes.

1. In the **Graphs** section of the ArangoDB web interface, select your graph.
2. Right-click on the canvas and choose **Create Edge**.
3. In the dialog:
   - Select the target collection (**Edge Type**, which corresponds to an edge collection).
   - Set the `_from` and `_to` fields by selecting the source and target nodes.
   - Optionally specify a unique identifier (**Edge ID**).
4. Click **Create** to add the edge to the canvas and database.

{{< info >}}
If you select two nodes before right-clicking to open the edge creation
dialog, the `_from` and `_to` fields are automatically pre-filled.
The order is not based on your selection sequence but the document key. <!-- TODO: Can we fix it in the UI? -->
{{< /info >}}

### Delete nodes

You can delete individual nodes which deletes the corresponding document.

1. Right-click a node to open the context menu.
2. Click **Delete Node**.
3. Any edges connected to this node are deleted by default to ensure graph
   consistency. To keep the edges, untick **Delete connected edge(s)**.
4. Confirm the deletion by clicking **Delete**.

### Delete edges

1. Right-click an edge to open the context menu.
2. Click **Delete Edge**.
3. Confirm the deletion by clicking **Delete**.

## Visual customization

You can adjust how the graph data is displayed, like the color, opacity, and
labels of nodes and edges.

1. Optional: Reset to default styling if desired.
2. Click the _palette_ icon in the top right to open the **Customization** panel.
3. Adjust the styling for nodes or edges:
   - Select a **Label** attribute to display a custom field (e.g. `name` or `type`)
     on nodes instead of `_id`.
   - **Reset Button:** Click **Reset** in the style panel to restore nodes and
     edges to their original colors, opacity, and labels.  
   - **Node Count:** The **Nodes in Graph** indicator at the top of the panel
     shows how many nodes are currently loaded or visible. It updates automatically
     when you run queries, apply filters, or add/delete elements.

All styling changes are visual-only and do not affect the underlying data.

### Node styling options 

You can modify styling attributes of selected **nodes** for emphasis,
categorization, or clarity.

- **Color**: Assign a specific color to highlight elements  
- **Opacity**: Make elements more or less transparent  
- **Label Attribute**: Choose a field (e.g., `name`, `title`) to show instead of
  `_id`  
- **Reset**: Clear all styling modifications  

### Edge-specific options

You can modify styling attributes of selected **Edges** for emphasis,
categorization, or clarity.
In addition to the shared styling settings, edges offer further customization:

- **Line Thickness**: Set thickness to reflect edge weight or significance  
- **Arrowhead Styles**: Choose different arrow types for **source** and **target**
  directions  
- **Label Attribute**: Select an edge field to display as a label on the edge  

## Layouts and Navigation Tools

{{< tip >}}
To select and move multiple nodes, hold down the `Ctrl` key (or `Cmd` on macOS)
and drag a selection box around them. However, context menu
actions like **Delete** only work for single selections.
{{< /tip >}}

**Graph Layout Tools**:

- **Mini-map**: Small overview to navigate the graph.

- **Zoom Controls**: Zoom in/out or set specific zoom.

- **Fit to Screen**: Resize and center the graph view.

- **Re-run Layout**: Automatically rearranges nodes.

- **Layout Algorithms**: Choose between layouts to better see clusters or flows.

These features allow better spatial understanding of node clusters, hierarchies,
and relationship flows.
