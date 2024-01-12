---
title: Getting Started with ArangoGraphML
menuTitle: Getting Started
weight: 10
description: >-
  How to control all resources inside ArangoGraphML in a scriptable manner
archetype: default
aliases:
  - getting-started-with-arangographml
---
ArangoGraphML is a set of services that provide an easy to use and scalable
interface for graph machine learning. Since all of the orchestration and training
logic is managed by ArangoGraph, all that is typically required is a
specification outlining the data to be used to solve a task. If you are using
the self-managed solution, additional configurations are needed such as loading
the database.

The `arangoml` package allows for managing all of the necessary ArangoGraphML components, including:
- **Project Management**: Projects are at the top level, and all activities must
  link to a project.
- **Feature Generation**: Data must be featurized to work with Graph Neural Networks
  (GNNs), and the featurization package handles this.
- **Training**: Start training data with a simple description of the problem and
  the data used to solve it.
- **Predictions**: Once a trained model exists, it is time to persist it.
  The prediction service generates predictions and persists them to the source
  graph in a new collection or within the source document.

{{< tip >}}
To enable the ArangoGraphML services in the ArangoGraph platform,
[get in touch](https://www.arangodb.com/contact/)
with the ArangoDB team. Regular notebooks in ArangoGraph don't include the
`arangoml` package.
{{< /tip >}}

ArangoGraphML's suite of services and packages is driven by what we call
"specifications". These specifications are standard Python dictionaries and
describe the task being performed and the data being used. The ArangoGraphML
services work closely together, with one task providing inputs to another.

The following is a guide to show how to use the `arangoml` package in order to:
- Manage projects
- Featurize data
- Submit training jobs
- Evaluate model metrics
- Generate predictions

## Initialize ArangoML

{{< tabs "arangoml" >}}

{{< tab "ArangoGraphML" >}}
The `arangoml` package comes pre-loaded with every ArangoGraphML notebook environment.
To start using it, simply import it, and enable it via a Jupyter Magic Command.

```py
import arangoml
arangoml = %enable_arangoml
```
{{< /tab >}}

{{< tab "Self-managed" >}}
It is possible to instantiate an ArangoML object in multiple ways:

1. via parameters
```py
from arangoml import ArangoML

arangoml = ArangoML(
    hosts="http://localhost:8529"
    username="root",
    password="password",
    # ca_cert_file="/path/to/ca.pem", # optional
    # user_token="..." # alternative to username/password
    projects_endpoint="http://localhost:8503",
    training_endpoint="http://localhost:8502",
    prediction_endpoint="http://localhost:8501",
)
```

2. via parameters + a custom ArangoClient instance
```py
from arangoml import ArangoML
from arango import ArangoClient

client = ArangoClient(
    hosts="http://localhost:8529",
    verify_override="/path/to/ca.pem",
    hosts_resolver=...,
    ...
)

arangoml = ArangoML(
    client=client,
    username="root",
    password="password",
    # user_token="..." # alternative to username/password
    projects_endpoint="http://localhost:8503",
    training_endpoint="http://localhost:8502",
    prediction_endpoint="http://localhost:8501",
)
```

3. via environment variables
```py
import os
from arangoml import ArangoML

os.environ["ARANGODB_HOSTS"] = "http://localhost:8529"
os.environ["ARANGODB_CA_CERT_FILE"]="/path/to/ca.pem"
os.environ["ARANGODB_USER"] = "root"
os.environ["ARANGODB_PW"] = "password"
# os.environ["ARANGODB_USER_TOKEN"] = "..."
os.environ["PROJECTS_ENDPOINT"] = "http://localhost:8503"
os.environ["TRAINING_ENDPOINT"] = "http://localhost:8502"
os.environ["PREDICTION_ENDPOINT"] = "http://localhost:8501"

arangoml = ArangoML()
```

4. via configuration files
```py
import os
from arangoml import ArangoML

arangoml = ArangoML(settings_files=["settings_1.toml", "settings_2.toml"])
```

5. via a Jupyter Magic Command
```
%load_ext arangoml
%enable_arangoml
```
note:
- this assumes you are working out of a Jupter Notebook environment, and
have set the environment variables in the notebook environment (see above) with **_system** access.
- Running `%load_ext arangoml` will also provide access to other ArangoGraphML Jupyter Magic Commands. See the full list by running `%lsmagic` in a notebook cell.

{{< /tab >}}

{{< /tabs >}}

## Load the database

{{< tabs "arangoml" >}}

{{< tab "ArangoGraphML" >}}

```py
from arango_datasets.datasets import Datasets

DATASET_NAME = "OPEN_INTELLIGENCE_ANGOLA"

# Setup the database
%deleteDatabase {DATASET_NAME}
%createDatabase {DATASET_NAME}
dataset_db = %useDatabase {DATASET_NAME}

# Import the dataset
# More Info: https://github.com/arangoml/arangodb_datasets
Datasets(dataset_db).load(DATASET_NAME)
```

{{< /tab >}}

{{< tab "Self-managed" >}}
```py
from arango_datasets.datasets import Datasets

DATASET_NAME = "OPEN_INTELLIGENCE_ANGOLA"

system_user = "root"
system_pw = "password"
system_db = arangoml.client.db(
    name="_system", username=system_user, password=system_pw, verify=True
)

# Setup the database
system_db.delete_database(DATASET_NAME, ignore_missing=True)
system_db.create_database(DATASET_NAME)
dataset_db = client.db(
    name=DATASET_NAME, 
    username=arangoml.settings.get("ARANGODB_USER"),
    password=arangoml.settings.get("ARANGODB_PW"),
    user_token=arangoml.settings.get("ARANGODB_USER_TOKEN"),
    verify=True
)

# Import the dataset
# More Info: https://github.com/arangoml/arangodb_datasets
Datasets(dataset_db).load(DATASET_NAME)
```
{{< /tab >}}

{{< /tabs >}}

## Projects

Projects are an important reference used throughout the entire ArangoGraphML
lifecycle. All activities link back to a project. The creation of the project
is very simple. 

### Get/Create a project
```py
project = arangoml.get_or_create_project(DATASET_NAME)
```

### List projects

```py
arangoml.projects.list_projects()
```

## Featurization

The Featurization Specification asks that you input the following:
- `featurization_name`: A name for the featurization task.
- `project_name`: The associated project name. You can use `project.name` here
  if was created or retrieved as descried above.
- `graph_name`: The associated graph name that exists within the database.
- `default_config` Optional: The optional default configuration to be applied
  across all features. Individual collection feature settings override this option.
  - `dimensionality_reduction`: Object configuring dimensionality reduction.
    - `disabled`: Boolean for enabling or disabling dimensionality reduction.
    - `size`: The number of dimensions to reduce the feature length to.
- `vertexCollections`: The list of vertex collections to be featurized. Here you
  also need to detail the attributes to featurize and how. Supplying multiple
  attributes from a single collection results in a single concatenated feature.
  - `config` Optional: The configuration to apply to the feature output for this collection.
    - `dimensionality_reduction`: Object configuring dimensionality reduction.
      - `disabled`: Boolean for enabling or disabling dimensionality reduction.
      - `size`: The number of dimensions to reduce the feature length to.
    - `output_name`: Adjust the default feature name. This can be any valid ArangoDB attribute name.
  - `features`: A single feature or multiple features can be supplied per collection
    and they can all be featurized in different ways. Supplying multiple features
    results in a single concatenated feature.
    - `feature_type`: Provide the feature type. Currently the supported types
      include `text`, `category`, `numerical`.
    - `feature_generator` Optional: Adjust advanced feature generation parameters.
      - `feature_name`: The name of this Dict should match the attribute name of the
        document stored in ArangoDB. This overrides the name provided for the parent Dict.
      - `method`: Currently no additional options, leave as default.
      - `output_name`: Adjust the default feature name. This can be any valid
        ArangoDB attribute name.
        ```python
        "collectionName": {
        "features": {
          "attribute_name": {
            "feature_type": 'text' # Currently the supported types include text, category, numerical
            "feature_generator": { # this advanced option is optional.
              "method": "transformer_embeddings",
              "feature_name": "movie_title_embeddings",
            },
        ```

- `edgeCollections`: This is the list of edge collections associated with the
  vertex collections. There are no additional options.
  ```python
  "edgeCollections": {
    "edge_name_1",
    "edge_name_2
  },
  ```

Once you have filled out the Featurization Specification, you can pass it to
the `featurizer` function.

```py
featurization_spec = {
  "featurization_name": f"{DATASET_NAME}_Featurization",
  "project_name": project.name,
  "graph_name": DATASET_NAME,
  "default_config": {
      "dimensionality_reduction": {"size": 64},
      "output_name": "x",
  },
  "vertexCollections": {
      "Actor": {
          "features": {
              "name": {
                  "feature_type": "text",
              },
          }
      },
      "Class": {
          "features": {
              "name": {
                  "feature_type": "text",
              },
          }
      },
      "Country": {
          "features": {
              "name": {
                  "feature_type": "text",
              }
          }
      },
      "Event": {
          "features": {
              "description": {
                  "feature_type": "text",
              },
              "label": {
                  "feature_type": "label",
              },
          }
      },
      "Source": {
          "features": {
              "name": {
                  "feature_type": "text",
              },
              "sourceScale": {
                  "feature_type": "category",
              },
          }
      },
      "Location": {
          "features": {
              "name": {
                  "feature_type": "text",
              }
          }
      },
      "Region": {
          "features": {
              "name": {
                  "feature_type": "category",
              },
          }
      },
  },
  "edgeCollections": {
      "eventActor": {},
      "hasSource": {},
      "hasLocation": {},
      "inCountry": {},
      "inRegion": {},
      "subClass": {},
      "type": {},
  },
}

# Run Featurization
feature_result = arangoml.featurization.featurize(
  database_name=dataset_db.name,
  featurization_spec=featurization_spec,
  batch_size=256,
  use_feature_store=False,
  run_analysis_checks=False,
  ...,
)
```

## Experiment

Each experiment consists of three main phases:
- Training
- Model Selection
- Predictions

### Training Specification 

Training Graph Machine Learning Models with ArangoGraphML only requires two steps:
1. Describe which data points should be included in the Training Job.
2. Pass the Training Specification to the Training Service.

See below the different components of the Training Specification.

- `database_name`: The database name the source data is in.
- `project_name`: The top-level project to which all the experiments will link back. 
- `metagraph`: This is the largest component that details the experiment
  objective and the associated data points.
  - `mlSpec`: Describes the desired machine learning task, input features, and
    the attribute label to be predicted.
  - `graph`: The ArangoDB graph name.
  - `vertexCollections`: Here, you can describe all the vertex collections and
    the features you would like to include in training. You must provide an `x`
    for features, and the desired prediction label is supplied as `y`.
  - `edgeCollections`: Here, you describe the relevant edge collections and any
    relevant attributes or features that should be considered when training.

A Training Specification allows for concisely defining your training task in a
single object and then passing that object to the training service using the
Python API client, as shown below.

#### Create a Training Job

```py
training_spec = {
    "database_name": dataset_db.name,
    "project_name": project.name,
    "metagraph": {
        "mlSpec": {
            "classification": {
                "targetCollection": "Event",
                "inputFeatures": f"{DATASET_NAME}_x",
                "labelField": f"{DATASET_NAME}_y",
            }
        },
        "graph": DATASET_NAME,
        "vertexCollections": feature_result.vertexCollections,
        "edgeCollections": feature_result.edgeCollections,
    },
}
    
training_job = arangoml.training.train(training_spec)

print(training_job)
```

**Expected output:**
```py
{'job_id': 'f09bd4a0-d2f3-5dd6-80b1-a84602732d61'}
```

#### Wait for a Training job to complete

```py
training_job_result = arangoml.wait_for_training(training_job.job_id)

print(training_job_result)
```

**Expected output:**
```py
{'database_name': 'db_name',
 'job_id': 'efac147a-3654-4866-88fe-03866d0d40a5',
 'job_state': None,
 'job_status': 'COMPLETED',
 'metagraph': {'edgeCollections': {...},
               'graph': 'graph_name',
               'mlSpec': {'classification': {'inputFeatures': 'x',
                                             'labelField': 'label_field',
                                             'targetCollection': 'target_collection_name'}},
               'vertexCollections': {...}
               },
 'project_id': 'project_id',
 'project_name': 'project_name',
 'time_ended': '2023-09-01T17:32:05.899493',
 'time_started': '2023-09-01T17:04:01.616354',
 'time_submitted': '2023-09-01T16:58:43.374269'}
```

#### Cancel a running Training Job

```python
arangoml.training.cancel_job(training_job.job_id)
```

**Expected output:**
```python
'OK'
```

### Model Selection

Once the Training is complete you can review the model statistics.
The Training Service returns **12 Models** using grid search parameter optimization.
 
To select a Model, use the Projects API to gather all relevant models and choose
the one you prefer for the next step.

The following examples uses the model with the highest **test accuracy**,
but there may be other factors that motivate you to choose another model.
See the `model_statistics` field below for more information.

```py
best_model = arangoml.get_best_model(
    project.name,
    training_job.job_id,
    sort_parent_key="test",
    sort_child_key="accuracy",
)

print(best_model)
```

**Expected output:**
```py
{'job_id': 'f09bd4a0-d2f3-5dd6-80b1-a84602732d61',
 'model_display_name': 'Node Classification Model',
 'model_id': '123',
 'model_name': 'Node Classification Model '
               '123',
 'model_statistics': {'_id': 'devperf/123',
                      '_key': '123',
                      '_rev': '_gkUc8By--_',
                      'run_id': '123',
                      'test': {'accuracy': 0.8891242216547955,
                               'confusion_matrix': [[13271, 2092],
                                                    [1276, 5684]],
                               'f1': 0.9,
                               'loss': 0.1,
                               'precision': 0.9,
                               'recall': 0.8,
                               'roc_auc': 0.8},
                      'timestamp': '2023-09-01T17:32:05.899493',
                      'validation': {'accuracy': 0.9,
                               'confusion_matrix': [[13271, 2092],
                                                    [1276, 5684]],
                               'f1': 0.85,
                               'loss': 0.1,
                               'precision': 0.86,
                               'recall': 0.85,
                               'roc_auc': 0.85}},
 'target_collection': 'target_collection_name',
 'target_field': 'label_field'}
```

### Prediction

After selecting a model, it is time to persist the results to a collection
using the `predict` function.

```py
prediction_spec = {
  "project_name": project.name,
  "database_name": dataset_db.name,
  "model_id": best_model.model_id,
}

prediction_job = arangoml.prediction.predict(prediction_spec)

print(prediction_job)
```

This creates a Prediction Job that grabs data and generates inferences using the
selected model. By default, predictions are written to the same Vertex Collection as
the source data. However, you can also specify a different Vertex Collection name, which
will be created & connected to the original Vertex Collection via an Edge.

#### Wait for a Prediction job to complete

```py
prediction_job_result = arangoml.wait_for_prediction(prediction_job.job_id)

print(prediction_job_result)
```

**Expected output:**
```py
{'database_name': 'db_name',
 'job_id': '123-ee43-4106-99e7-123',
 'job_state_information': {'outputAttribute': 'label_field_predicted',
                           'outputCollectionName': 'collectionName_predicted_123',
                           'outputGraphName': 'graph_name'},
 'job_status': 'COMPLETED',
 'model_id': '123',
 'project_id': '123456',
 'project_name': 'project_name',
 'time_ended': '2023-09-05T15:23:01.595214',
 'time_started': '2023-09-05T15:13:51.034780',
 'time_submitted': '2023-09-05T15:09:02.768518'}
```

#### Access the predictions

You can now directly access your predictions in your application.

```py
import json

output_collection_name = prediction_job_result["job_state_information"]['outputCollectionName']

query = f"""
  FOR doc IN {output_collection_name}
    SORT RAND()
    LIMIT 5
    RETURN doc
"""

docs = [doc for doc in dataset_db.aql.execute(query)]

print(json.dumps(docs, indent=2))
```