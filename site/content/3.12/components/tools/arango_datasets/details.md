---
title: ArangoDB Datasets
menuTitle: Details
weight: 5
description: ''
---
## Install

**arango_datasets** can be installed with pip directly from [PyPi](https://pypi.org/project/arango-datasets/):

```sh
pip install arango-datasets
```

## Usage

Once you have installed the `arango_datasets` package you can use it to donwload and install datasets into your deployment.

```sh
# Datasets requires a valid database object 
from arango import ArangoClient

db = ArangoClient(hosts='http://localhost:8529').db("dbName", username="root", password="")
```

Pass the db object to the constructor
```sh
from arango_datasets import Datasets
datasets = Datasets(db)
```

List available datasets
```sh
print(datasets.list_datasets())
```

List more information about a particular dataset
```sh
print(datasets.dataset_info("IMDB_X"))
```

Import the dataset
```sh
datasets.load("IMDB_X")
```
