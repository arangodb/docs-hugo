---
title: NetworkX Adapter
menuTitle: NetworkX
weight: 5
description: >-
  The NetworkX Adapter allows you to export graphs from ArangoDB into NetworkX for graph analysis with Python and vice-versa
---


{{< tip >}}
ArangoDB now has a closer integration with NetworkX allowing
NetworkX users to persist their graphs in ArangoDB & leverage
GPU-accelerated graph analytics via cuGraph. [Learn more here](https://arangodb.com/introducing-the-arangodb-networkx-persistence-layer/).
{{< /tip >}}


[NetworkX](https://networkx.org/) is a commonly used tool for
analysis of network-data. If your 
analytics use cases require the use of all your graph data, for example,
to summarize graph structure, or answer global path traversal queries,
then using the ArangoDB Pregel API is recommended. If your analysis pertains
to a subgraph, then you may be interested in getting the NetworkX
representation of the subgraph for one of the following reasons:

- An algorithm for your use case is available in NetworkX
- A library that you want to use for your use case works with NetworkX Graphs as input

## Resources

Watch this
[lunch & learn session](https://www.arangodb.com/resources/lunch-sessions/graph-beyond-lunch-break-2-9-introducing-the-arangodb-networkx-adapter/)
to see how using this adapter gives you the best of both
graph worlds - the speed and flexibility of ArangoDB combined with the
ubiquity of NetworkX.

The [NetworkX Adapter repository](https://github.com/arangoml/networkx-adapter)
is available on Github. Check it out!

## Installation

To install the latest release of the NetworkX Adapter,
run the following command:

```bash
pip install adbnx-adapter
```

## Quickstart

The following examples show how to get started with the NetworkX Adapter.
Check also the 
[interactive tutorial](https://colab.research.google.com/github/arangoml/networkx-adapter/blob/master/examples/ArangoDB_NetworkX_Adapter.ipynb).

```py
import networkx as nx

from arango import ArangoClient
from adbnx_adapter import ADBNX_Adapter, ADBNX_Controller

# Connect to ArangoDB
db = ArangoClient().db()

# Instantiate the adapter
adbnx_adapter = ADBNX_Adapter(db)
```

### ArangoDB to NetworkX
```py
#######################
# 1.1: via Graph name #
#######################

nx_g = adbnx_adapter.arangodb_graph_to_networkx("fraud-detection")

#############################
# 1.2: via Collection names #
#############################

nx_g = adbnx_adapter.arangodb_collections_to_networkx(
    "fraud-detection", 
    {"account", "bank", "branch", "Class", "customer"}, # Vertex collections
    {"accountHolder", "Relationship", "transaction"} # Edge collections
)

######################
# 1.3: via Metagraph #
######################

metagraph = {
    "vertexCollections": {
        "account": {"Balance", "account_type", "customer_id", "rank"},
        "customer": {"Name", "rank"},
    },
    "edgeCollections": {
        "transaction": {"transaction_amt", "sender_bank_id", "receiver_bank_id"},
        "accountHolder": {},
    },
}

nx_g = adbnx_adapter.arangodb_to_networkx("fraud-detection", metagraph)

#######################################
# 1.4: with a custom ADBNX Controller #
#######################################

class Custom_ADBNX_Controller(ADBNX_Controller):
    """ArangoDB-NetworkX controller.

    Responsible for controlling how nodes & edges are handled when
    transitioning from ArangoDB to NetworkX, and vice-versa.
    """

    def _prepare_arangodb_vertex(self, adb_vertex: dict, col: str) -> None:
        """Prepare an ArangoDB vertex before it gets inserted into the NetworkX
        graph.

        :param adb_vertex: The ArangoDB vertex object to (optionally) modify.
        :param col: The ArangoDB collection the vertex belongs to.
        """
        adb_vertex["foo"] = "bar"

    def _prepare_arangodb_edge(self, adb_edge: dict, col: str) -> None:
        """Prepare an ArangoDB edge before it gets inserted into the NetworkX
        graph.

        :param adb_edge: The ArangoDB edge object to (optionally) modify.
        :param col: The ArangoDB collection the edge belongs to.
        """
        adb_edge["bar"] = "foo"

nx_g = ADBNX_Adapter(db, Custom_ADBNX_Controller()).arangodb_graph_to_networkx("fraud-detection")
```

### NetworkX to ArangoDB
```py
#################################
# 2.1: with a Homogeneous Graph #
#################################

nx_g = nx.grid_2d_graph(5, 5)
edge_definitions = [
    {
        "edge_collection": "to",
        "from_vertex_collections": ["Grid_Node"],
        "to_vertex_collections": ["Grid_Node"],
    }
]

adb_g = adbnx_adapter.networkx_to_arangodb("Grid", nx_g, edge_definitions)

#############################################################
# 2.2: with a Homogeneous Graph & a custom ADBNX Controller #
#############################################################

class Custom_ADBNX_Controller(ADBNX_Controller):
    """ArangoDB-NetworkX controller.

    Responsible for controlling how nodes & edges are handled when
    transitioning from ArangoDB to NetworkX, and vice-versa.
    """

    def _prepare_networkx_node(self, nx_node: dict, col: str) -> None:
        """Prepare a NetworkX node before it gets inserted into the ArangoDB
        collection **col**.

        :param nx_node: The NetworkX node object to (optionally) modify.
        :param col: The ArangoDB collection the node belongs to.
        """
        nx_node["foo"] = "bar"

    def _prepare_networkx_edge(self, nx_edge: dict, col: str) -> None:
        """Prepare a NetworkX edge before it gets inserted into the ArangoDB
        collection **col**.

        :param nx_edge: The NetworkX edge object to (optionally) modify.
        :param col: The ArangoDB collection the edge belongs to.
        """
        nx_edge["bar"] = "foo"

adb_g = ADBNX_Adapter(db, Custom_ADBNX_Controller()).networkx_to_arangodb("Grid", nx_g, edge_definitions)

###################################
# 2.3: with a Heterogeneous Graph #
###################################

edges = [
   ('student:101', 'lecture:101'), 
   ('student:102', 'lecture:102'), 
   ('student:103', 'lecture:103'), 
   ('student:103', 'student:101'), 
   ('student:103', 'student:102'),
   ('teacher:101', 'lecture:101'),
   ('teacher:102', 'lecture:102'),
   ('teacher:103', 'lecture:103'),
   ('teacher:101', 'teacher:102'),
   ('teacher:102', 'teacher:103')
]
nx_g = nx.MultiDiGraph()
nx_g.add_edges_from(edges)

# ...

# Learn how this example is handled in Colab:
# https://colab.research.google.com/github/arangoml/networkx-adapter/blob/master/examples/ArangoDB_NetworkX_Adapter.ipynb#scrollTo=OuU0J7p1E9OM
```
