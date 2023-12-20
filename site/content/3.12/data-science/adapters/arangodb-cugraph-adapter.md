---
title: cuGraph Adapter
menuTitle: ArangoDB-cuGraph Adapter
weight: 15
description: >-
  The ArangoDB-cuGraph Adapter exports graphs from ArangoDB into RAPIDS cuGraph, a library of collective GPU-accelerated graph algorithms, and vice-versa
archetype: default
---
While offering a similar API and set of graph algorithms to NetworkX,
[RAPIDS cuGraph](https://docs.rapids.ai/api/cugraph/stable/)
library is GPU-based. Especially for large graphs, this
results in a significant performance improvement of cuGraph compared to NetworkX.
Please note that storing node attributes is currently not supported by cuGraph.
In order to run cuGraph, an Nvidia-CUDA-enabled GPU is required.

## Resources

The [ArangoDB-cuGraph Adapter repository](https://github.com/arangoml/cugraph-adapter)
is available on Github. Check it out!

## Installation

To install the latest release of the ArangoDB-cuGraph Adapter,
run the following command:

```bash
pip install --extra-index-url=https://pypi.nvidia.com cudf-cu11 cugraph-cu11
pip install adbcug-adapter
```

## Quickstart

The following examples show how to get started with ArangoDB-cuGraph Adapter.
Check also the 
[interactive tutorial](https://colab.research.google.com/github/arangoml/cugraph-adapter/blob/master/examples/ArangoDB_cuGraph_Adapter.ipynb).

```py
import cudf
import cugraph

from arango import ArangoClient
from adbcug_adapter import ADBCUG_Adapter, ADBCUG_Controller

# Connect to ArangoDB
db = ArangoClient().db()

# Instantiate the adapter
adbcug_adapter = ADBCUG_Adapter(db)
```

### ArangoDB to cuGraph
```py
#######################
# 1.1: via Graph name #
#######################

cug_g = adbcug_adapter.arangodb_graph_to_cugraph("fraud-detection")

#############################
# 1.2: via Collection names #
#############################

cug_g = adbcug_adapter.arangodb_collections_to_cugraph(
    "fraud-detection",
    {"account", "bank", "branch", "Class", "customer"},  #  Vertex collections
    {"accountHolder", "Relationship", "transaction"},  # Edge collections
)
```

### cuGraph to ArangoDB
```py

#################################
# 2.1: with a Homogeneous Graph #
#################################

edges = [("Person/A", "Person/B", 1), ("Person/B", "Person/C", -1)]
cug_g = cugraph.MultiGraph(directed=True)
cug_g.from_cudf_edgelist(cudf.DataFrame(edges, columns=["src", "dst", "weight"]), source="src", destination="dst", edge_attr="weight")

edge_definitions = [
    {
        "edge_collection": "knows",
        "from_vertex_collections": ["Person"],
        "to_vertex_collections": ["Person"],
    }
]

adb_g = adbcug_adapter.cugraph_to_arangodb("Knows", cug_g, edge_definitions, edge_attr="weight")

##############################################################
# 2.2: with a Homogeneous Graph & a custom ADBCUG Controller #
##############################################################

class Custom_ADBCUG_Controller(ADBCUG_Controller):
    """ArangoDB-cuGraph controller.

    Responsible for controlling how nodes & edges are handled when
    transitioning from ArangoDB to cuGraph & vice-versa.
    """

    def _prepare_cugraph_node(self, cug_node: dict, col: str) -> None:
        """Prepare a cuGraph node before it gets inserted into the ArangoDB
        collection **col**.

        :param cug_node: The cuGraph node object to (optionally) modify.
        :param col: The ArangoDB collection the node belongs to.
        """
        cug_node["foo"] = "bar"

    def _prepare_cugraph_edge(self, cug_edge: dict, col: str) -> None:
        """Prepare a cuGraph edge before it gets inserted into the ArangoDB
        collection **col**.

        :param cug_edge: The cuGraph edge object to (optionally) modify.
        :param col: The ArangoDB collection the edge belongs to.
        """
        cug_edge["bar"] = "foo"

adb_g = ADBCUG_Adapter(db, Custom_ADBCUG_Controller()).cugraph_to_arangodb("Knows", cug_g, edge_definitions)

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
cug_g = cugraph.MultiGraph(directed=True)
cug_g.from_cudf_edgelist(cudf.DataFrame(edges, columns=["src", "dst"]), source='src', destination='dst')

# ...

# Learn how this example is handled in Colab:
# https://colab.research.google.com/github/arangoml/cugraph-adapter/blob/master/examples/ArangoDB_cuGraph_Adapter.ipynb#scrollTo=nuVoCZQv6oyi
```