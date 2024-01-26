---
title: DGL Adapter
menuTitle: DGL
weight: 20
description: >-
  The DGL Adapter exports graphs from ArangoDB into Deep Graph Library (DGL), a Python package for graph neural networks, and vice-versa
archetype: default
---
The [Deep Graph Library (DGL)](https://www.dgl.ai/) is an
easy-to-use, high performance and scalable
Python package for deep learning on graphs. DGL is framework agnostic, meaning
that, if a deep graph model is a component of an end-to-end application, the
rest of the logics can be implemented in any major frameworks, such as PyTorch,
Apache MXNet or TensorFlow.

## Resources

Watch this
[lunch & learn session](https://www.arangodb.com/resources/lunch-sessions/graph-beyond-lunch-break-2-8-dgl-adapter/)
to get an introduction and see how to use the DGL adapter.

The [DGL Adapter repository](https://github.com/arangoml/dgl-adapter)
is available on Github. Check it out!

## Installation

To install the latest release of the DGL Adapter,
run the following command:

```bash
pip install adbdgl-adapter
```

## Quickstart

The following examples show how to get started with the DGL Adapter.
Check also the 
[interactive tutorial](https://colab.research.google.com/github/arangoml/dgl-adapter/blob/master/examples/ArangoDB_DGL_Adapter.ipynb).

```py
import dgl
import torch
import pandas

from arango import ArangoClient
from adbdgl_adapter import ADBDGL_Adapter, ADBDGL_Controller
from adbdgl_adapter.encoders import IdentityEncoder, CategoricalEncoder

# Connect to ArangoDB
db = ArangoClient().db()

# Instantiate the adapter
adbdgl_adapter = ADBDGL_Adapter(db)

# Create a DGL Heterogeneous Graph
fake_hetero = dgl.heterograph({
    ("user", "follows", "user"): (torch.tensor([0, 1]), torch.tensor([1, 2])),
    ("user", "follows", "topic"): (torch.tensor([1, 1]), torch.tensor([1, 2])),
    ("user", "plays", "game"): (torch.tensor([0, 3]), torch.tensor([3, 4])),
})
fake_hetero.nodes["user"].data["features"] = torch.tensor([21, 44, 16, 25])
fake_hetero.nodes["user"].data["label"] = torch.tensor([1, 2, 0, 1])
fake_hetero.nodes["game"].data["features"] = torch.tensor([[0, 0], [0, 1], [1, 0], [1, 1], [1, 1]])
fake_hetero.edges[("user", "plays", "game")].data["features"] = torch.tensor([[6, 1], [1000, 0]])
```

### DGL to ArangoDB
```py
############################
# 1.1: without a Metagraph #
############################

adb_g = adbdgl_adapter.dgl_to_arangodb("FakeHetero", fake_hetero)

#########################
# 1.2: with a Metagraph #
#########################

# Specifying a Metagraph provides customized adapter behaviour
metagraph = {
    "nodeTypes": {
        "user": {
            "features": "user_age",  # 1) you can specify a string value for attribute renaming
            "label": label_tensor_to_2_column_dataframe,  # 2) you can specify a function for user-defined handling, as long as the function returns a Pandas DataFrame
        },
        # 3) You can specify set of strings if you want to preserve the same DGL attribute names for the node/edge type
        "game": {"features"} # this is equivalent to {"features": "features"}
    },
    "edgeTypes": {
        ("user", "plays", "game"): {
            # 4) you can specify a list of strings for tensor dissasembly (if you know the number of node/edge features in advance)
            "features": ["hours_played", "is_satisfied_with_game"]
        },
    },
}

def label_tensor_to_2_column_dataframe(dgl_tensor: torch.Tensor, adb_df: pandas.DataFrame) -> pandas.DataFrame:
    """A user-defined function to create two
    ArangoDB attributes out of the 'user' label tensor

    :param dgl_tensor: The DGL Tensor containing the data
    :type dgl_tensor: torch.Tensor
    :param adb_df: The ArangoDB DataFrame to populate, whose
        size is preset to the length of **dgl_tensor**.
    :type adb_df: pandas.DataFrame
    :return: The populated ArangoDB DataFrame
    :rtype: pandas.DataFrame
    """
    label_map = {0: "Class A", 1: "Class B", 2: "Class C"}

    adb_df["label_num"] = dgl_tensor.tolist()
    adb_df["label_str"] = adb_df["label_num"].map(label_map)

    return adb_df


adb_g = adbdgl_adapter.dgl_to_arangodb("FakeHetero", fake_hetero, metagraph, explicit_metagraph=False)

#######################################################
# 1.3: with a Metagraph and `explicit_metagraph=True` #
#######################################################

# With `explicit_metagraph=True`, the node & edge types omitted from the metagraph will NOT be converted to ArangoDB.
adb_g = adbdgl_adapter.dgl_to_arangodb("FakeHetero", fake_hetero, metagraph, explicit_metagraph=True)

########################################
# 1.4: with a custom ADBDGL Controller #
########################################

class Custom_ADBDGL_Controller(ADBDGL_Controller):
    def _prepare_dgl_node(self, dgl_node: dict, node_type: str) -> dict:
        """Optionally modify a DGL node object before it gets inserted into its designated ArangoDB collection.

        :param dgl_node: The DGL node object to (optionally) modify.
        :param node_type: The DGL Node Type of the node.
        :return: The DGL Node object
        """
        dgl_node["foo"] = "bar"
        return dgl_node

    def _prepare_dgl_edge(self, dgl_edge: dict, edge_type: tuple) -> dict:
        """Optionally modify a DGL edge object before it gets inserted into its designated ArangoDB collection.

        :param dgl_edge: The DGL edge object to (optionally) modify.
        :param edge_type: The Edge Type of the DGL edge. Formatted
            as (from_collection, edge_collection, to_collection)
        :return: The DGL Edge object
        """
        dgl_edge["bar"] = "foo"
        return dgl_edge


adb_g = ADBDGL_Adapter(db, Custom_ADBDGL_Controller()).dgl_to_arangodb("FakeHetero", fake_hetero)
```

### ArangoDB to DGL
```py
# Start from scratch!
db.delete_graph("FakeHetero", drop_collections=True, ignore_missing=True)
adbdgl_adapter.dgl_to_arangodb("FakeHetero", fake_hetero)

#######################
# 2.1: via Graph name #
#######################

# Due to risk of ambiguity, this method does not transfer attributes
dgl_g = adbdgl_adapter.arangodb_graph_to_dgl("FakeHetero")

#############################
# 2.2: via Collection names #
#############################

# Due to risk of ambiguity, this method does not transfer attributes
dgl_g = adbdgl_adapter.arangodb_collections_to_dgl("FakeHetero", v_cols={"user", "game"}, e_cols={"plays"})

######################
# 2.3: via Metagraph #
######################

# Transfers attributes "as is", meaning they are already formatted to DGL data standards.
# Learn more about the DGL Data Standards here: https://docs.dgl.ai/guide/graph.html#guide-graph
metagraph_v1 = {
    "vertexCollections": {
        # Move the "features" & "label" ArangoDB attributes to DGL as "features" & "label" Tensors
        "user": {"features", "label"}, # equivalent to {"features": "features", "label": "label"}
        "game": {"dgl_game_features": "features"},
        "topic": {},
    },
    "edgeCollections": {
        "plays": {"dgl_plays_features": "features"}, 
        "follows": {}
    },
}

dgl_g = adbdgl_adapter.arangodb_to_dgl("FakeHetero", metagraph_v1)

#################################################
# 2.4: via Metagraph with user-defined encoders #
#################################################

# Transforms attributes via user-defined encoders
metagraph_v2 = {
    "vertexCollections": {
        "Movies": {
            "features": {  # Build a feature matrix from the "Action" & "Drama" document attributes
                "Action": IdentityEncoder(dtype=torch.long),
                "Drama": IdentityEncoder(dtype=torch.long),
            },
            "label": "Comedy",
        },
        "Users": {
            "features": {
                "Gender": CategoricalEncoder(), # CategoricalEncoder(mapping={"M": 0, "F": 1}),
                "Age": IdentityEncoder(dtype=torch.long),
            }
        },
    },
    "edgeCollections": {"Ratings": {"weight": "Rating"}},
}

dgl_g = adbdgl_adapter.arangodb_to_dgl("imdb", metagraph_v2)

##################################################
# 2.5: via Metagraph with user-defined functions #
##################################################

# Transforms attributes via user-defined functions
metagraph_v3 = {
    "vertexCollections": {
        "user": {
            "features": udf_user_features,  # supports named functions
            "label": lambda df: torch.tensor(df["label"].to_list()),  # also supports lambda functions
        },
        "game": {"features": udf_game_features},
    },
    "edgeCollections": {
        "plays": {"features": (lambda df: torch.tensor(df["features"].to_list()))},
    },
}

def udf_user_features(user_df: pandas.DataFrame) -> torch.Tensor:
   # user_df["features"] = ...
    return torch.tensor(user_df["features"].to_list())


def udf_game_features(game_df: pandas.DataFrame) -> torch.Tensor:
    # game_df["features"] = ...
    return torch.tensor(game_df["features"].to_list())


dgl_g = adbdgl_adapter.arangodb_to_dgl("FakeHetero", metagraph_v3)
```