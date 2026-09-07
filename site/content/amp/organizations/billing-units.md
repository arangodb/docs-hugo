---
title: Billing Units in AMP
menuTitle: Billing Units
weight: 12
description: >-
  The units that the Arango Managed Platform (AMP) meters in order to bill based
  on the real resources used
---
To bill based on the real resources used, the Arango Managed Platform (AMP)
meters the following units.

{{% comment %}}
TODO: This page is derived from the Billing 2.0 design document. Open points:
- The design document numbering skips 1.1.3. Check whether a unit is missing.
- Section 1.1.5 refers to "DP30/60/100 performance details" but the pricing list
  omits DP60.
- Sections 1.2.2 and 1.2.3 both name "Infrastructure Internal Network costs" as
  the raised usage item, which is likely a copy-paste error. Confirm the correct
  usage item names for egress and ingress.
- Section 1.1.8 gives the unit as "Number of allocated cores" but states that the
  value represents the memory size. Confirm which is correct.
- Section 1.1.9 writes the metric as `deployment_aue_base`. Confirm whether the
  metric name is `aue` or `aeu`.
- The design document does not state how the four AEU inputs are combined into an
  AEU value, and does not expand the AEU acronym. Both are needed here.
- The pod, PVC, Prometheus, and DataManager references below come from the design
  document. Decide how much of this implementation detail belongs on a
  customer-facing page.
- The design document is a proposal and states parts of the model in the future
  tense ("Pricing should be based on...", "Add Instance family as a label").
  That wording is preserved below. Confirm what has actually shipped before
  publishing this page, and rewrite those parts in the present tense.
{{% /comment %}}

## Infrastructure

### CPU Hours

Real allocation of the used resources for the CPU.

- **Unit:** Single CPU allocated for one hour
- **Usage item:** Infrastructure CPU Hour costs

Calculation:

- Based on Prometheus metrics.
- The purpose of the pod is taken from the `billing.arangodb.com/type` label.
- Based on the resources requested by the pod.
- Calculation starts when the pod is scheduled to a node.
- Calculation ends when the pod enters the terminated state, or is removed.

Use cases:

- ArangoDB pod runs
- GenAI job runs
- Any additional workload, such as APIs and notebooks

### Memory Hours

Real allocation of the used resources for the memory.

- **Unit:** 1 GiB (1024<sup>3</sup>) memory allocated for one hour
- **Usage item:** Infrastructure Memory Hour costs

Calculation:

- Based on Prometheus metrics.
- The purpose of the pod is taken from the `billing.arangodb.com/type` label.
- Based on the resources requested by the pod.
- Calculation starts when the pod is scheduled to a node.
- Calculation ends when the pod enters the terminated state, or is removed.

Use cases:

- ArangoDB pod runs
- GenAI job runs
- Any additional workload, such as APIs and notebooks

### Storage GB Hours

Real usage of the storage.

- **Unit:** 1 GiB (1024<sup>3</sup>) storage allocated for one hour
- **Usage item:** Infrastructure Storage Hour costs

Calculation:

- Based on Prometheus metrics.
- The purpose of the pod is taken from the `billing.arangodb.com/type` label.
- Based on the resources requested by the PVC, taken from the status.
- Bills even if the deployment is hibernated.

Use cases:

- ArangoDB pod runs
- GenAI job runs
- Any additional workload, such as APIs and notebooks

### Storage Performance Hours

The performance allocated for storage should be based on the DP30/60/100
performance details.

- **Unit:** Storage performance allocated for one hour
- **Usage item:** Infrastructure Storage Performance Hour costs

Calculation:

- Based on Prometheus metrics.
- The purpose of the pod is taken from the `billing.arangodb.com/type` label.
- Based on the resources requested by the PVC, taken from the additional metrics
  released by the DataManager.
- Pricing should be based on the following units per hour:

  | Disk performance | Units per hour |
  |------------------|----------------|
  | DP30             | 0              |
  | DP100            | 1              |
  | DP150            | 2              |
  | DP200            | 4              |

- Values in between are proportional and pre-calculated.

Use cases:

- ArangoDB pod runs
- GenAI job runs
- Any additional workload, such as APIs and notebooks

### GPU Hours

Real allocation of the used resources for the GPU.

- **Unit:** GPU type allocated for one hour
- **Usage item:** Infrastructure GPU Type Hour costs

Calculation:

- Based on Prometheus metrics.
- The purpose of the pod is taken from the `billing.arangodb.com/type` label.
- Based on the resources requested by the pod.
- Calculation starts when the pod is scheduled to a node.
- Calculation ends when the pod enters the terminated state, or is removed.
- Add the instance family as a label.

Use cases:

- GenAI job runs
- Any additional workload, such as APIs and notebooks

### Cloud Storage Usage

Real usage of the resources for the cloud storage.

- **Unit:** 1 GiB (1024<sup>3</sup>) storage used for one hour
- **Usage item:** Cloud Storage GiB Hour

Calculation:

- Based on the cloud provider details.
- Averaged maximum over the day.

Use cases:

- Cloud backups
- Platform storage

## Network

### Internal Network Usage

Real internal network usage on the pod level.

- **Unit:** GiB of transfer
- **Usage item:** Infrastructure Internal Network costs

Calculation:

- Based on Prometheus metrics.

Use cases:

- ArangoDB pod runs
- GenAI job runs
- Any additional workload, such as APIs and notebooks

### External Egress Network Usage

Real external egress network usage on the pod level.

- **Unit:** GiB of transfer
- **Usage item:** Infrastructure Internal Network costs

Calculation:

- Based on Prometheus metrics.

Use cases:

- ArangoDB pod runs
- GenAI job runs
- Any additional workload, such as APIs and notebooks

### External Ingress Network Usage

Real external ingress network usage on the pod level.

- **Unit:** GiB of transfer
- **Usage item:** Infrastructure Internal Network costs

Calculation:

- Based on Prometheus metrics.

Use cases:

- ArangoDB pod runs
- GenAI job runs
- Any additional workload, such as APIs and notebooks

## AEU calculation inputs

The following values raise no usage items of their own. They are intermediates
used for the AEU calculation.

### Deployment Size

The deployment size defined in AMP.

- **Unit:** Number of allocated cores

Calculation:

- Based on the AMP deployment size.
- Represents the memory size.
- The deployment type is exposed via a label: `A` (1:4), `C` (1:2), `R` (1:8).

```
deployment_size{type="A"} 16   # for A16
```

### Deployment AEU Base

The number of AEU per core, based on the deployment size.

- **Unit:** Number of AEU

Calculation:

- Exposes a static value per deployment type:

  | Type | Value |
  |------|-------|
  | `A`  | 1     |
  | `C`  | 1.5   |
  | `R`  | 0.625 |

```
deployment_aue_base 1.5   # for C16
```

### Deployment Node Count

The number of nodes.

- **Unit:** Number of nodes

Calculation:

- Exposes the number of nodes in the deployment definition.

### Deployment Type Ratio

The ratio of the AEU calculation, based on the deployment type.

- **Unit:** Float number for ratio calculation

Calculation:

- Exposes a ratio based on the deployment type:

  | Deployment type | Ratio |
  |-----------------|-------|
  | Standard        | 1     |
  | Platform        | 1.5   |
  | AI              | 3.0   |

## See also

- [Billing](billing.md)
- [Credits & Usage](credits-and-usage.md)
