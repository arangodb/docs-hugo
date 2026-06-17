---
title: GraphML Quick Start
menuTitle: Quick Start
weight: 2
description: >-
  Train your first graph machine learning model and generate predictions on
  your graph
---

## Prerequisites

- Access to the platform with **GraphML** services enabled.
- A database with **graph data** (node and edge collections).
- For **Node Classification**: some labeled nodes for training.
  For **Node Embeddings**: no labels required.

## Train a model and predict

{{< tabs "graphml-qs" >}}

{{< tab "Web Interface" >}}
{{< steps >}}

{{< step "Create a project" >}}
Go to the **AI Suite** > **Run GraphML** and click **Add new project**.
{{< /step >}}

{{< step "Featurize your graph" >}}
Select your graph, choose the node collections and attributes to use as
features, configure the job, and click **Begin featurization**.
{{< /step >}}

{{< step "Train a model" >}}
Choose the task type - **Node Classification** or **Node Embeddings** - set
the parameters, and click **Begin training**.
{{< /step >}}

{{< step "Select the best model" >}}
Review the training metrics, pick the best-performing model, and click
**Select model for prediction**.
{{< /step >}}

{{< step "Run a prediction" >}}
Configure the prediction job (optionally enable scheduling) and click **Run
Prediction**.
{{< /step >}}

{{< /steps >}}
{{< /tab >}}

{{< tab "Python API (Notebooks)" >}}
{{< steps >}}

{{< step "Enable ArangoML" >}}
```python
arangoml = %enable_arangoml
project = arangoml.get_or_create_project("my_project")
```
{{< /step >}}

{{< step "Featurize" >}}
```python
job = arangoml.jobs.featurize(featurization_spec)
arangoml.wait_for_featurization(job.job_id)
```
{{< /step >}}

{{< step "Train" >}}
```python
job = arangoml.jobs.train(training_spec)
arangoml.wait_for_training(job.job_id)
```
{{< /step >}}

{{< step "Select the best model" >}}
```python
model = arangoml.get_best_model(
    "my_project", training_job_id, sort_parent_key, sort_child_key
)
```
{{< /step >}}

{{< step "Predict" >}}
```python
job = arangoml.jobs.predict(prediction_spec)
arangoml.wait_for_prediction(job.job_id)
```
{{< /step >}}

{{< /steps >}}
{{< /tab >}}

{{< /tabs >}}

{{< tip >}}
**You now have** predicted labels (Node Classification) or vector embeddings
(Node Embeddings) written to your target collection, ready for clustering,
similarity search, anomaly detection, or link prediction.
{{< /tip >}}

## Next steps

- [Setup](setup.md): The full walkthrough.
- [UI](ui.md): The web interface in detail.
- [Notebooks API](notebooks-api.md): All `arangoml` methods and specs.
