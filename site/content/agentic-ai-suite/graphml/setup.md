---
title: Set up GraphML
menuTitle: Setup
weight: 5
description: >-
  You can use GraphML straight within the Arango Contextual Data Platform,
  via the web interface or via Notebooks
aliases:
  - ../../arangodb/3.12/data-science/arangographml/deploy # 3.10, 3.11
  - ../../arangodb/stable/data-science/arangographml/deploy # 3.10, 3.11
  - ../../arangodb/4.x/data-science/arangographml/deploy # 3.10, 3.11
  - ../../arangodb/devel/data-science/arangographml/deploy # 3.10, 3.11
---
## Web interface versus Jupyter Notebooks

The Arango Contextual Data Platform provides enterprise-ready Graph Machine Learning in two options,
tailored to suit diverse requirements and preferences: 
- Using the web interface
- In a scriptable manner, using the integrated Jupyter Notebooks and the HTTP API for GraphML

## Setup

{{< tabs "graphml-setup" >}}

{{< tab "Web Interface" >}}
The web interface of the Arango Contextual Data Platform allows you to create,
configure, and run a full machine learning workflow for GraphML.
To get started, see the [Web interface for GraphML](ui.md) page.
{{< /tab >}}

{{< tab "Notebooks" >}}
The [Notebook servers](../notebook-servers.md) run within the
Arango Contextual Data Platform. They offer a pre-configured environment where
everything, including necessary components and configurations, comes preloaded.
You don't need to set up or configure the infrastructure, and can immediately
start using the GraphML functionalities in a scriptable manner. To get started,
see the [GraphML Notebooks & API](notebooks-api.md) reference documentation.

- **Accessible at all levels**
  - Low code UI
  - Notebooks
  - APIs
- **Full usability**
  - MLOps lifecycle
  - Metrics
  - Metadata capture
  - Model management

{{< /tab >}}

{{< /tabs >}}

## Configure resources with profiles

GraphML jobs (featurization, training, prediction, and embedding generation)
run as Kubernetes pods
that the Arango Contextual Data Platform schedules on your behalf. Without
further configuration, these pods use conservative default resource limits,
including a low memory limit. This is enough for small example datasets, but
jobs on real-world data often exceed it.

When a job runs out of memory, Kubernetes terminates its pod (`OOMKilled`) and
retries it until the Job fails with `BackoffLimitExceeded`. The web interface
and the API only report a generic error in this case, so the cause is only
visible in the pod status and logs, for example, with
`kubectl describe pod <pod-name>` or `kubectl logs <pod-name>`.

{{< tip >}}
It is recommended to create a custom profile with resources that match your
data and to select it for your GraphML jobs, instead of relying on the
defaults. This applies to both CPU and GPU workloads.
{{< /tip >}}

### What a profile is

A profile is an `ArangoProfile` custom resource of the
[ArangoDB Kubernetes Operator](https://arangodb.github.io/kube-arangodb/docs/using-the-operator.html).
It holds a pod and container template that the operator merges into the pods
of a job when the profile is selected, for example:

- Container resource requests and limits (CPU, memory, GPUs)
- A `nodeSelector` to run the job on specific nodes, such as GPU nodes
- `tolerations` for tainted nodes

Your deployment may come with predefined profiles, such as `gpu-g4dn-xlarge`,
which the **Enable GPU** option uses by default. These typically only select a
node type and request a GPU, but don't raise the memory limit. To give a job
more memory, create your own profile.

For the full specification, see the
[ArangoProfile Custom Resource](https://arangodb.github.io/kube-arangodb/docs/arango-profile-resource.html)
in the kube-arangodb documentation.

### Create a profile

To list the profiles that already exist in the namespace of your deployment
and to inspect one of them, run the following commands:

```sh
kubectl get arangoprofiles -n <namespace>
kubectl get arangoprofile <profile-name> -n <namespace> -o yaml
```

An existing GPU profile is a good starting point, as it already contains the
`nodeSelector` and `tolerations` that are specific to your cluster.
The following example defines a profile that requests 2 CPU cores, 8 GiB of
memory, and one GPU:

```yaml
apiVersion: scheduler.arangodb.com/v1beta1
kind: ArangoProfile
metadata:
  name: gpu-memory-8gi-cpu-2
  namespace: <namespace>
spec:
  template:
    priority: 128
    container:
      default:
        resources:
          requests:
            cpu: 2
            memory: 8Gi
            nvidia.com/gpu: 1
          limits:
            cpu: 2
            memory: 8Gi
            nvidia.com/gpu: 1
    pod:
      # Adjust to the node labels of your cluster
      nodeSelector:
        arangodb.com/node: g4dn.xlarge
      # Add one toleration for each taint of your GPU nodes
      tolerations:
        - key: arangodb.com/gpu
          operator: Exists
          effect: NoSchedule
        - key: nvidia.com/gpu
          operator: Exists
          effect: NoSchedule
```

- Create the profile in the same namespace as your deployment.
- `priority` is optional and defaults to `0`. It only matters if multiple
  profiles apply to the same pod: profiles with a higher value are applied
  first, and profiles with the same value are sorted by name. You can omit it
  if you select a single profile for a job.
- Nodes usually have multiple taints, for example, one for the node type and
  one for the GPU. List a toleration for each taint of the nodes you want the
  job to run on, or Kubernetes cannot schedule the pod there. Copy the
  `tolerations` of an existing GPU profile or check the taints of a node with
  `kubectl describe node <node-name>`.
- Set both `requests` and `limits`. The memory limit is what prevents the pod
  from being terminated, while the requests make sure that Kubernetes schedules
  the pod on a node with enough free resources.
- For CPU-only jobs, remove the `nvidia.com/gpu` entries and adjust or remove
  the `nodeSelector` and `tolerations` that target GPU nodes.
- The resources must fit on a single node of the selected node type. Otherwise,
  the pod remains in the `Pending` state, or waits for the cluster autoscaler to
  add a suitable node.

Apply the profile and check that the operator accepted it. The `Ready`
condition in the status of the resource should be `True`:

```sh
kubectl apply -f gpu-memory-8gi-cpu-2.yaml
kubectl get arangoprofile gpu-memory-8gi-cpu-2 -n <namespace> -o yaml
```

### Use a profile in GraphML

Every GraphML job type supports profiles: featurization, training,
prediction, and embedding generation. Each job has its own **Profiles** option
in the web interface and its own `profiles` field in the API. Reference a
profile by its name (`metadata.name`).

{{< info >}}
A profile only applies to the job you select it for. Profiles of a
featurization job don't carry over to the training job, nor to later
prediction or embedding generation jobs. Select a profile for each job that
needs more resources than the defaults.
{{< /info >}}

- In the web interface, add the profile under **Profiles** in the
  configuration of the job, see
  [Featurization configuration](ui.md#configuration-options),
  [Node classification](ui.md#node-classification),
  [Node embeddings](ui.md#node-embeddings), and
  [Prediction configuration](ui.md#configuration-options-1).
- In the Python API, set the top-level `profiles` attribute of the job
  specification to the profile name, for example,
  `"profiles": "gpu-memory-8gi-cpu-2"`. To apply multiple profiles, separate
  their names with commas, for example, `"profiles": "high-memory,gpu"`.
  See [Featurization](notebooks-api.md#featurization),
  [Training](notebooks-api.md#training), and
  [Prediction](notebooks-api.md#prediction).

### Profiles and Enable GPU

Training, prediction, and embedding generation jobs have an **Enable GPU**
option (`enableGpu` in the API). It selects whether the GPU or the CPU version
of the job runs, and it determines the profiles of the job together with the
**Profiles** option (`profiles`). Featurization jobs always run the CPU version
and only use the profiles you set.

| Enable GPU | Profiles | Job version | Profiles applied to the job |
|:-----------|:---------|:------------|:----------------------------|
| Off | Not set | CPU | None, the default resource limits apply |
| Off | Set | CPU | Your profiles |
| On | Not set | GPU | `gpu-g4dn-xlarge` |
| On | Set | GPU | Your profiles, `gpu-g4dn-xlarge` is not applied |

You can select a profile without enabling GPU, for example, to give a
CPU-only job more CPU and memory. A profile that requests a GPU doesn't turn
on GPU acceleration by itself. Enable GPU to run the GPU version of the job.

{{< warning >}}
If you enable GPU and set profiles, your profiles replace the default
`gpu-g4dn-xlarge` profile completely. Nothing from the default profile is
merged in. Your profiles need to request a GPU (`nvidia.com/gpu`) and define
the `nodeSelector` and `tolerations` for your GPU nodes, as well as enough
memory for your data. See [Create a profile](#create-a-profile) for an example.
{{< /warning >}}
