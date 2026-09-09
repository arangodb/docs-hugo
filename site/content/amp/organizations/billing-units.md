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

## Infrastructure

### CPU Hours

Real allocation of the used resources for the CPU.

- **Unit:** Single CPU allocated for one hour
- **Usage item:** Infrastructure CPU Hour costs

Calculation:

- Based on the CPU resources reserved for the workload, not on how much of that
  CPU is actually used.
- Metering starts when the workload starts running, and ends when it stops.

Use cases:

- ArangoDB deployment runs
- GenAI job runs
- Any additional workload, such as APIs and notebooks

### Memory Hours

Real allocation of the used resources for the memory.

- **Unit:** 1 GiB (1024<sup>3</sup>) memory allocated for one hour
- **Usage item:** Infrastructure Memory Hour costs

Calculation:

- Based on the memory reserved for the workload, not on how much of that memory
  is actually used.
- Metering starts when the workload starts running, and ends when it stops.

Use cases:

- ArangoDB deployment runs
- GenAI job runs
- Any additional workload, such as APIs and notebooks

### Storage GiB Hours

Real usage of the storage.

- **Unit:** 1 GiB (1024<sup>3</sup>) storage allocated for one hour
- **Usage item:** Infrastructure Storage Hour costs

Calculation:

- Based on the storage size provisioned for the workload, not on the amount of
  data stored.
- Billed even if the deployment is hibernated.

Use cases:

- ArangoDB deployment runs
- GenAI job runs
- Any additional workload, such as APIs and notebooks

### Storage Performance Hours

The disk performance provisioned for the data volumes of a deployment.

- **Unit:** One data volume of a given disk performance tier for one hour
- **Usage item:** Infrastructure Storage Performance Hour costs

Calculation:

- Based on the disk performance provisioned for the workload. There are five
  tiers and the deployment is charged the rate of the tier it uses. There are
  no values in between.
- Charged per data volume and hour, regardless of the size of the volume.
- Only the data volumes of the DB-Servers or of the single server are charged.
  The volumes of the Agents are not charged.
- The following rates apply, relative to the rate of the DP100 tier:

  | Disk performance | Rate | Availability |
  |------------------|------|--------------|
  | DP30             | Not charged | All cloud providers |
  | DP60             | 0.5x | AWS, GCP, Azure |
  | DP100            | 1x   | AWS, GCP, Azure |
  | DP150            | 2.6x | AWS only |
  | DP200            | 4.6x | AWS only |

Use cases:

- ArangoDB deployment runs
- GenAI job runs
- Any additional workload, such as APIs and notebooks

### GPU Hours

Real allocation of the used resources for the GPU.

- **Unit:** One GPU allocated for one hour                                                                                                                                                                                 
- **Usage item:** Infrastructure GPU Hour costs                                                                                                                                                                            
                                                                                                                                                                                                                             
  Calculation:                                                                                                                                                                                                               
                                                                                                                                                                                                                             
- Based on the GPU resources reserved for the workload, not on how much of that GPU is actually used.                                                                                                                                                                                                                                                                                                                                 
- Metering starts when the workload is scheduled, and ends when it stops.                                                                                                                                                  
- A workload that requests a GPU occupies the whole GPU node. The rate reflects the cost of that node and depends on the cloud provider and the region.                                                                                                                                          

Use cases:

- GenAI job runs
- Any additional workload, such as APIs and notebooks

### Cloud Storage Usage

Real usage of the resources for the cloud storage.

- **Unit:** 1 GiB (1024<sup>3</sup>) storage used for one hour
- **Usage item:** Cloud Storage GiB Hour

Calculation:

- Based on the size of the data AMP stores for the deployment in its object                                                                                                                                                
  storage buckets, measured by AMP itself.                                                                                                                                                                                 
- The size is sampled continuously and averaged over each 24-hour period.                                                                                                                                                  
                                                                                                                                                                                                                           
Use cases:                                                                                                                                                                                                                 
                                                                                                                                                                                                                           
- Backups, including deployment-specific backup buckets                                                                                                                                                                    
- Remote backups                                                                                                                                                                                                           
- Audit logs delivered to a cloud storage destination                                                                                                                                                                      
- Platform storage                                                                                                                                                                                                         
- Machine learning data                                                                                                                                                                                                    
- Core dumps  

## Network

Real network usage, metered per workload.

- **Unit:** 1 GiB (1024<sup>3</sup>) of transfer
- **Usage item:** Infrastructure Network costs

Calculation:

- The billed quantity is the ingress and the egress transfer, summed up.
- The rate depends on the destination of the transfer:

  | Destination      | Transfer                                    | Rate |
  |------------------|---------------------------------------------|------|
  | Internet         | To and from the public internet             | Depends on the cloud provider and the region |
  | In-cluster       | Internal traffic within the cluster         | A flat rate, the same for all cloud providers |
  | Private endpoint | Through a private endpoint                  | The same flat rate as for in-cluster traffic |

Use cases:

- ArangoDB deployment runs
- GenAI job runs
- Any additional workload, such as APIs and notebooks

## ArangoDB Equivalent Units (AEU)

An ArangoDB Equivalent Unit (AEU) expresses how much ArangoDB a deployment
runs, independent of the infrastructure it runs on. It is the license unit of
AMP, charged on top of the infrastructure units, and it draws from the same
credit balance.

- **Unit:** 1 AEU for one hour
- **Usage item:** Deployment AEU Hour costs

Calculation:

- The AEU value of a deployment is the product of four inputs:

  ```
  AEU = Deployment Size × Deployment Node Count × Deployment AEU Base × Deployment Type Ratio
  ```

- The value is sampled every five minutes and aggregated over 24-hour periods.
- The rate per AEU hour is flat. It is the same in all regions and for all
  cloud providers.
- A hibernated deployment has a node count of `0` and therefore raises no
  AEU costs.

The four inputs raise no usage items of their own:

### Deployment Size

The deployment size defined in AMP.

- **Unit:** Allocated memory in GiB (1024<sup>3</sup>)

Calculation:

- Based on the memory of the AMP deployment size, for example `16` for an A16
  deployment.
- The node size class of the deployment is `A` (1:4), `C` (1:2), or `R` (1:8).

### Deployment Node Count

The number of nodes.

- **Unit:** Number of nodes

Calculation:

- The number of nodes in the deployment definition.
- The value is `0` while the deployment is hibernated.

### Deployment AEU Base

The number of AEU per unit of deployment size.

- **Unit:** Number of AEU

Calculation:

- A static value per node size class:

  | Node size class | Value |
  |-----------------|-------|
  | `A`             | 1     |
  | `C`             | 1.5   |
  | `R`             | 0.625 |

### Deployment Type Ratio

The ratio of the AEU calculation, based on the deployment type.

- **Unit:** Float number for ratio calculation

Calculation:

- A ratio based on the platform bundle of the deployment:

  | Deployment type | Ratio |
  |-----------------|-------|
  | CoreDB          | 1     |
  | AI Suite        | 1.5   |
  | DataScience     | 3     |

## See also

- [Billing](billing.md)
- [Credits & Usage](credits-and-usage.md)
