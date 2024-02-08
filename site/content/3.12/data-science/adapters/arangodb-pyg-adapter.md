---
title: PyTorch Geometric (PyG) Adapter
menuTitle: PyG
weight: 15
description: >-
  The PyG Adapter exports Graphs from ArangoDB into PyTorch Geometric (PyG), a PyTorch-based Graph Neural Network library, and vice-versa
archetype: default
---
PyTorch Geometric (PyG) is a library built upon [PyTorch](https://pytorch.org/)
to easily write and train Graph Neural Networks (GNNs) for a wide range of
applications related to structured data.

It consists of various methods for deep learning on graphs and other irregular structures,
also known as [geometric deep learning](https://geometricdeeplearning.com/), 
from a variety of published papers. In addition, it consists of easy-to-use
mini-batch loaders for operating on many small and single giant graphs,
[multi GPU-support](https://github.com/pyg-team/pytorch_geometric/tree/master/examples/multi_gpu),
[`DataPipe` support](https://github.com/pyg-team/pytorch_geometric/blob/master/examples/datapipe.py),
distributed graph learning via [Quiver](https://github.com/pyg-team/pytorch_geometric/tree/master/examples/quiver),
a large number of common benchmark datasets (based on simple interfaces to create your own),
the [GraphGym](https://pytorch-geometric.readthedocs.io/en/latest/notes/graphgym.html) 
experiment manager, and helpful transforms, both for learning on arbitrary
graphs as well as on 3D meshes or point clouds.

## Resources

The [PyG Adapter repository](https://github.com/arangoml/pyg-adapter)
is available on Github. Check it out!

## Installation

To install the latest release of the PyG Adapter,
run the following command:

```bash
pip install torch
pip install adbpyg-adapter
```

## Quickstart

The following examples show how to get started with the PyG Adapter.
Check also the 
[interactive tutorial](https://colab.research.google.com/github/arangoml/pyg-adapter/blob/master/examples/ArangoDB_PyG_Adapter.ipynb).


```py
import torch
import pandas
from torch_geometric.datasets import FakeHeteroDataset

from arango import ArangoClient
from adbpyg_adapter import ADBPyG_Adapter, ADBPyG_Controller
from adbpyg_adapter.encoders import IdentityEncoder, CategoricalEncoder

# Connect to ArangoDB
db = ArangoClient().db()

# Instantiate the adapter
adbpyg_adapter = ADBPyG_Adapter(db)

# Create a PyG Heterogeneous Graph
data = FakeHeteroDataset(
    num_node_types=2,
    num_edge_types=3,
    avg_num_nodes=20,
    avg_num_channels=3,  # avg number of features per node
    edge_dim=2,  # number of features per edge
    num_classes=3,  # number of unique label values
)[0]
```

### PyG to ArangoDB

Note: If the PyG graph contains `_key`, `_v_key`, or `_e_key` properties for any node / edge types, the adapter will assume to persist those values as [ArangoDB document keys](https://www.arangodb.com/docs/stable/data-modeling-naming-conventions-document-keys.html). See the `Full Cycle (ArangoDB -> PyG -> ArangoDB)` section below for an example.

```py
#############################
# 1.1: without a  Metagraph #
#############################

adb_g = adbpyg_adapter.pyg_to_arangodb("FakeData", data)

#########################
# 1.2: with a Metagraph #
#########################

# Specifying a Metagraph provides customized adapter behaviour
metagraph = {
    "nodeTypes": {
        "v0": {
            "x": "features",  # 1) You can specify a string value if you want to rename your PyG data when stored in ArangoDB
            "y": y_tensor_to_2_column_dataframe,  # 2) you can specify a function for user-defined handling, as long as the function returns a Pandas DataFrame
        },
        # 3) You can specify set of strings if you want to preserve the same PyG attribute names for the node/edge type
        "v1": {"x"} # this is equivalent to {"x": "x"}
    },
    "edgeTypes": {
        ("v0", "e0", "v0"): {
            # 4) You can specify a list of strings for tensor dissasembly (if you know the number of node/edge features in advance)
            "edge_attr": [ "a", "b"]  
        },
    },
}

def y_tensor_to_2_column_dataframe(pyg_tensor: torch.Tensor, adb_df: pandas.DataFrame) -> pandas.DataFrame:
    """A user-defined function to create two
    ArangoDB attributes out of the 'user' label tensor

    :param pyg_tensor: The PyG Tensor containing the data
    :type pyg_tensor: torch.Tensor
    :param adb_df: The ArangoDB DataFrame to populate, whose
        size is preset to the length of **pyg_tensor**.
    :type adb_df: pandas.DataFrame
    :return: The populated ArangoDB DataFrame
    :rtype: pandas.DataFrame
    """
    label_map = {0: "Kiwi", 1: "Blueberry", 2: "Avocado"}

    adb_df["label_num"] = pyg_tensor.tolist()
    adb_df["label_str"] = adb_df["label_num"].map(label_map)

    return adb_df


adb_g = adbpyg_adapter.pyg_to_arangodb("FakeData", data, metagraph, explicit_metagraph=False)

#######################################################
# 1.3: with a Metagraph and `explicit_metagraph=True` #
#######################################################

# With `explicit_metagraph=True`, the node & edge types omitted from the metagraph will NOT be converted to ArangoDB.
adb_g = adbpyg_adapter.pyg_to_arangodb("FakeData", data, metagraph, explicit_metagraph=True)

########################################
# 1.4: with a custom ADBPyG Controller #
########################################

class Custom_ADBPyG_Controller(ADBPyG_Controller):
    def _prepare_pyg_node(self, pyg_node: dict, node_type: str) -> dict:
        """Optionally modify a PyG node object before it gets inserted into its designated ArangoDB collection.

        :param pyg_node: The PyG node object to (optionally) modify.
        :param node_type: The PyG Node Type of the node.
        :return: The PyG Node object
        """
        pyg_node["foo"] = "bar"
        return pyg_node

    def _prepare_pyg_edge(self, pyg_edge: dict, edge_type: tuple) -> dict:
        """Optionally modify a PyG edge object before it gets inserted into its designated ArangoDB collection.

        :param pyg_edge: The PyG edge object to (optionally) modify.
        :param edge_type: The Edge Type of the PyG edge. Formatted
            as (from_collection, edge_collection, to_collection)
        :return: The PyG Edge object
        """
        pyg_edge["bar"] = "foo"
        return pyg_edge


adb_g = ADBPyG_Adapter(db, Custom_ADBPyG_Controller()).pyg_to_arangodb("FakeData", data)
```

### ArangoDB to PyG
```py
# Start from scratch!
db.delete_graph("FakeData", drop_collections=True, ignore_missing=True)
adbpyg_adapter.pyg_to_arangodb("FakeData", data)

#######################
# 2.1: via Graph name #
#######################

# Due to risk of ambiguity, this method does not transfer attributes
pyg_g = adbpyg_adapter.arangodb_graph_to_pyg("FakeData")

#############################
# 2.2: via Collection names #
#############################

# Due to risk of ambiguity, this method does not transfer attributes
pyg_g = adbpyg_adapter.arangodb_collections_to_pyg("FakeData", v_cols={"v0", "v1"}, e_cols={"e0"})

######################
# 2.3: via Metagraph #
######################

# Transfers attributes "as is", meaning they are already formatted to PyG data standards.
metagraph_v1 = {
    "vertexCollections": {
        # Move the "x" & "y" ArangoDB attributes to PyG as "x" & "y" Tensors
        "v0": {"x", "y"}, # equivalent to {"x": "x", "y": "y"}
        "v1": {"v1_x": "x"}, # store the 'x' feature matrix as 'v1_x' in PyG
    },
    "edgeCollections": {
        "e0": {"edge_attr"},
    },
}

pyg_g = adbpyg_adapter.arangodb_to_pyg("FakeData", metagraph_v1)

#################################################
# 2.4: via Metagraph with user-defined encoders #
#################################################

# Transforms attributes via user-defined encoders
# For more info on user-defined encoders in PyG, see https://pytorch-geometric.readthedocs.io/en/latest/notes/load_csv.html
metagraph_v2 = {
    "vertexCollections": {
        "Movies": {
            "x": {  # Build a feature matrix from the "Action" & "Drama" document attributes
                "Action": IdentityEncoder(dtype=torch.long),
                "Drama": IdentityEncoder(dtype=torch.long),
            },
            "y": "Comedy",
        },
        "Users": {
            "x": {
                "Gender": CategoricalEncoder(mapping={"M": 0, "F": 1}),
                "Age": IdentityEncoder(dtype=torch.long),
            }
        },
    },
    "edgeCollections": {
        "Ratings": { "edge_weight": "Rating" } # Use the 'Rating' attribute for the PyG 'edge_weight' property
    },
}

pyg_g = adbpyg_adapter.arangodb_to_pyg("imdb", metagraph_v2)

##################################################
# 2.5: via Metagraph with user-defined functions #
##################################################

# Transforms attributes via user-defined functions
metagraph_v3 = {
    "vertexCollections": {
        "v0": {
            "x": udf_v0_x,  # supports named functions
            "y": lambda df: torch.tensor(df["y"].to_list()),  # also supports lambda functions
        },
        "v1": {"x": udf_v1_x},
    },
    "edgeCollections": {
        "e0": {"edge_attr": (lambda df: torch.tensor(df["edge_attr"].to_list()))},
    },
}

def udf_v0_x(v0_df: pandas.DataFrame) -> torch.Tensor:
    # v0_df["x"] = ...
    return torch.tensor(v0_df["x"].to_list())


def udf_v1_x(v1_df: pandas.DataFrame) -> torch.Tensor:
    # v1_df["x"] = ...
    return torch.tensor(v1_df["x"].to_list())

pyg_g = adbpyg_adapter.arangodb_to_pyg("FakeData", metagraph_v3)
```