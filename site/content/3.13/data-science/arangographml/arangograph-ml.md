---
title: ArangoGraphML Web Interface
menuTitle: ArangoGraphML Web Interface
weight: 15
description: >-
 Enterprise-ready, graph-powered machine learning as a cloud service or self-managed
aliases:
  - getting-started-with-arangographml
---
Solve high-computational graph problems with Graph Machine Learning. Apply ML on a selected graph to predict connections, get better product recommendations, classify nodes, and perform node embeddings. Configure and run the whole machine learning flow entirely in the web interface.

## Creating a GraphML Project

To create a new GraphML project using the ArangoDB Web Interface, follow these steps:

- **Select the Target Database** – From the **Database** dropdown in the left-hand sidebar, select the database where the project should reside.
- **Navigate to the Data Science Section** – In the left-hand navigation menu, click on Data Science to open the GraphML project management interface, then click on RunGraphML.
![Navigate to Data Science](../../../images/datascience-intro.jpg)  
- **Click "Add new project"** – In the **GraphML projects** view, click  **Add new project**.
- **Fill in Project Details** – A modal titled **Create ML project** will appear. Enter a **name** for your machine learning project.
- **Create the Project** – Click the **Create project** button to finalize the creation.
- **Verify Project in the List** – After creation, the new project will appear in the list under **GraphML projects**. Click the project name to enter and begin creating ML jobs like Featurization, Training, Model Selection, Prediction.

## Featurization Phase

After clicking on a project name, you are taken to a screen where you can configure and start a new Featurization job. Follow these steps:
- **Select a Graph** – In the **Features** section, choose your target graph from the **Select a graph** dropdown (Example, `imdb`).
- **Choose Vertex Collections** – Pick the vertex collections (Example, `movie`, `person`) that you want to include for feature extraction.
- **Select Attributes** – From the dropdown, choose the attributes from your vertex collection to convert into machine-understandable features. 

{{< info >}}
The following attributes cannot be used: imdb_feat_description, imdb_feat_genre, imdb_feat_homepage, imdb_feat_id, imdb_feat_imageUrl, imdb_feat_imdb_x_hash, imdb_feat_imdbId, imdb_feat_label, imdb_feat_language, imdb_feat_lastModified, imdb_feat_released, imdb_feat_releaseDate, imdb_feat_runtime, imdb_feat_studio, imdb_feat_tagline, imdb_feat_title, imdb_feat_trailer, imdb_feat_type, imdb_feat_version, imdb_x, imdb_y, prediction_model_output. As some of their values are lists or arrays.
{{< /info >}}

- **Expand Configuration and Advanced Settings** – Optionally adjust parameters like batch size, feature prefix, dimensionality reduction, and write behavior. These settings are also shown in JSON format on the right side of the screen for transparency.

- **Batch size** – The number of documents to process in a single batch.
- **Run analysis checks** – Whether to run analysis checks to perform a high-level analysis of the data quality before proceeding. Default is `true`.
- **Skip labels** – Skip the featurization process for attributes marked as labels. Default is `false`.
- **Overwrite FS graph** – Whether to overwrite the Feature Store graph if features were previously generated. Default is `false`, so features are written to an existing graph.
- **Write to source graph** – Whether to store the generated features in the source graph. Default is `true`.
- **Use feature store** – Enable the use of the Feature Store database, which stores features separately from the source graph. Default is `false`, so features are written to the source graph.

- **Click "Begin Featurization"** – Once all selections are done, click the **Begin featurization** button. This will trigger a **node embedding-compatible featurization job**.Once the job status changes to **"Ready for training"**, you can start the **ML Training** step.

![Navigate to Featurization](../../../images/graph-ml-ui-featurization.png) 

## Training Phase

This is the second step in the ML workflow after featurization. In the training phase, you configure and launch a machine learning training job on your graph data.

#### Select Type of Training Job

There are two types of training jobs available, depending on the use case:


#### Node Classification

Node Classification is used to categorize the nodes in your graph based on their features and structural connections within the graph.

**Use cases include:**
- Entity categorization (Example, movies into genres, users into segments)
- Fraud detection in transaction networks
- Anomaly detection in IT or social graphs

**Configuration Parameters:**
- **Type of Training Job:** Node classification
- **Target Vertex Collection:** Choose the collection to classify (Example, `movie`)
- **Batch Size:** The nummer of documents processed in a single training iteration.  (Example, 256)
- **Data Load Batch Size:** The number of documents loaded from ArangoDB into memory in a single batch during the data loading phase. (Example, 50000)
- **Data Load Parallelism:** The number of parallel processes used when loading data from ArangoDB into memory for trainnig. (Example, 10)

After setting these values, click the **Begin training** button to start the job.

![Node Classification](../../../images/ml-nodeclassification.png)

####  Node Embedding

Node Embedding is used to generate vector embeddings (dense numerical representations) of graph nodes that capture structural and feature-based information.

**Use cases include:**
- Similarity search (Example, finding similar products, users, or documents)
- Link prediction (Example, suggesting new connections)
- Input for downstream ML tasks like clustering or visualization

**Configuration Parameters:**
- **Type of Training Job:** Node embeddings
- **Target Vertex Collection:** Select the collection to generate embeddings for (Example, `movie` or `person`)
- No label is required for training in this mode

Once the configuration is complete, click **Begin training** to launch the embedding job.

![Node Embeddings](../../../images/ml-node-embedding.png)


After training is complete, the next step in the ArangoGraphML workflow is **Model Selection**.

## Model Selection Phase

Once the training is finished, the job status updates to READY FOR MODEL SELECTION. This means the model has been trained using the provided vertex and edge data and is now ready for evaluation.

**Understanding Vertex Collections:**

**X Vertex Collection:** These are the source nodes used during training. They represent the full set of nodes on which features were computed (Example, person, movie).

**Y Vertex Collection:** These are the target nodes that contain labeled data. The labels in this collection are used to supervise the training process and are the basis for evaluating prediction quality.

The target collection is where the model’s predictions will be stored once prediction is executed.

**Model Selection Interface:**

A list of trained models is displayed, along with performance metrics such as accuracy, Precision, Recall, F1 score, Loss.            
Review the results of different model runs and configurations.

Select the best performing model suitable for your prediction task.

![Model Selection](../../../images/graph-ml-model.png)
## Prediction Phase
Once the best-performing model has been selected, you move to the final step of the GraphML pipeline: generating predictions for new or unlabeled data.
### Overview
The Prediction interface allows you to run inference using the selected model. You can define how predictions are executed, which collections are involved, and whether new or outdated documents should be automatically featurized before prediction.

![prediction phase](../../../images/graph-prediction.png)

### Configuration Options
In the Prediction screen, you will see the following configuration options:

- Selected Model: Displays the model you selected during the Model Selection phase. This model will be used to perform inference.

- Target Vertex Collection: This is the vertex collection on which predictions will be applied.

- Prediction Type: Depending on the training job (Example, classification or embedding), the prediction will output class labels or updated embeddings.

### Featurization Settings
Two toggles are available to control automatic featurization during prediction

**Featurize New Documents:**
This option controls whether newly added documents are automatically featurized. It is useful when new data arrives after training, allowing predictions to continue without requiring a full retraining process.

**Featurize Outdated Documents:**
Enable or disable the featurization of outdated documents. Outdated documents are those whose attributes (used during featurization) have changed since the last feature computation. This ensures prediction results are based on up-to-date information.

These options give you flexibility in handling dynamic graph data and keeping your predictions relevant without having to repeat the entire ML workflow.

**Data load batch size** – Specifies the number of documents to load in a single batch (Example, 500000).

**Data load parallelism** – Number of parallel threads used to process the prediction workload (Example, 10).

**Prediction field** – The field in the documents where the predicted values will be stored (Example, prediction).

### Enable Scheduling

You can configure automatic predictions using the **Enable scheduling** checkbox.

When scheduling is enabled, predictions will be executed automatically based on a specified **CRON expression**. This is useful for regularly updating prediction outputs as new data enters the system.

#### Schedule (CRON expression)

You can define a CRON expression that sets when the prediction job should run. For example:
0 0 1 1 *
This CRON pattern will execute the prediction **every year on January 1st at 00:00**.

Below the CRON field, a user-friendly scheduling interface helps translate it:

- **Period**: Options include *Hourly*, *Daily*, *Weekly*, *Monthly*, or *Yearly*.
- **Month**: *(Example, January)*
- **Day of Month**: *(Example, 1)*
- **Day of Week**: *(optional)*
- **Hours and Minutes**: Set the exact time for execution *(Example, 0:00)*


### Execute Prediction
After reviewing the configuration, click the Run Prediction button. ArangoGraphML will then:

- Perform featurization 

- Run inference using the selected model

- Write prediction results into the target vertex collection or a specified output location

Once prediction is complete, you can analyze the results directly in the Web Interface or export them for downstream use.
