---
title: ArangoDB Datasets
menuTitle: ArangoDB Datasets
weight: 40
description: >-
  `arango-datasets` is a Python package for loading sample datasets into ArangoDB
---
You can use the `arango-datasets` package in conjunction with the `python-arango`
driver to load example data into your ArangoDB deployments. The data is hosted
on AWS S3. There are a number of existing datasets already available and you can
view them by calling the `list_datasets()` method as shown below.

## Install

To install the Python package, you can use the `pip` command to directly install
it from [PyPi](https://pypi.org/project/arango-datasets/):

```sh
pip install arango-datasets
```

You can find the source code repository of the module on GitHub:
<https://github.com/arangoml/arangodb_datasets>

## Usage

Once you have installed the `arango-datasets` package, you can use it to
download and import datasets into your deployment with `arango_datasets.Datasets`.

The `Datasets` constructor requires a valid [python-arango](../../../../ecosystem/drivers/python.md)
database object as input. It defines the target deployment, database, and
credentials to load a dataset.

```py
from arango import ArangoClient
db = ArangoClient(hosts='http://localhost:8529').db("dbName", username="root", password="")
```

Pass the database object to the `Datasets` constructor:

```py
from arango_datasets import Datasets
datasets = Datasets(db)
```

List the available datasets:

```py
print(datasets.list_datasets())
```

List more information about a particular dataset:

```py
print(datasets.dataset_info("IMDB_X"))
```

Import the dataset:

```py
datasets.load("IMDB_X")
```
