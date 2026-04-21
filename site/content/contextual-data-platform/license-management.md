---
title: License Management
menuTitle: License Management
weight: 30
description: >-
  How the Arango license service works with Kubernetes-managed deployments,
  the network access it requires, and how to apply and renew licenses for
  the Contextual Data Platform and ArangoDB
---
The Arango Enterprise Edition of ArangoDB and the Arango Contextual Data Platform
are activated using a managed license service operated by Arango. When you run
a deployment with the [ArangoDB Kubernetes Operator](https://arangodb.github.io/kube-arangodb/)
(`kube-arangodb`), the operator talks to this service on your behalf to
activate and renew licenses automatically, so you don't need to manage license
expiry yourself.

## Two Kubernetes flows — online or air-gapped

Which steps you follow depends on whether your cluster can reach the Arango
license service:

| Your cluster | What you do | Platform CLI tool? |
|---|---|---|
| **Online** — can reach `*.license.arango.ai` | Create a Kubernetes secret with your **client ID** and **client secret**. The operator activates the deployment and renews the license automatically. | **No** |
| **Air-gapped** — no outbound internet | Generate a **license key file** on a separate internet-connected machine using the Platform CLI tool, then apply it as a Kubernetes secret on the air-gapped cluster. | **Yes**, on the internet-connected machine only |

The rest of this page describes how the operator manages the license and
how to apply it for each flow.

{{< info >}}
If you run a **standalone ArangoDB** deployment (no Kubernetes operator),
see the [ArangoDB License Management](../arangodb/4.0/operations/administration/license-management.md)
page instead. That page also hosts the
[Docker tutorial](../arangodb/4.0/operations/administration/license-management.md#tutorial-generate-a-license-key-using-docker)
for generating a license key with the Platform CLI tool — which is also what
you use on the internet-connected machine in the air-gapped flow.
{{< /info >}}

## Required network access

Kubernetes-managed deployments with internet access need to reach
`*.license.arango.ai` for the initial activation and continuous renewal of
the license.

Air-gapped deployments do not need any outbound access from the cluster itself.
License keys are generated on a separate internet-connected system using the
[Platform CLI tool](install-and-upgrade/offline-setup.md#step-7-generate-a-license-key)
and then applied as a Kubernetes secret on the air-gapped cluster.

## How the operator manages the license

In a Kubernetes-managed deployment, the ArangoDB Kubernetes Operator handles
the full license lifecycle. You provide license credentials (a client ID and
client secret) as a Kubernetes secret once, and the operator keeps the
deployment licensed automatically.

### Automatic license renewal

The operator requests a short-lived license from the Arango license service
and renews it well before it expires. The default lifecycle is:

1. The operator requests a license that is valid for **14 days** (the TTL).
2. The license service grants the license and returns an actual expiry date.
3. **3 days** before that expiry date (the grace period), the operator
   automatically connects to the license service and requests a fresh license.
4. The new license is applied to the ArangoDB cluster without downtime.

In practice, the operator contacts the license service roughly every 11 days
(14-day TTL minus the 3-day early renewal window). License rollover is
transparent to the running deployment.

### Automatic TLS certificate rotation

TLS certificates are generated with a validity of roughly **3 months**. When a
certificate is about to expire, the operator automatically generates a new one
and restarts the affected server. No manual action is required.

### What happens if a renewal fails

The 3-day grace period is the safety buffer for renewal failures (internet
outage, license service unreachable, etc.). The operator doesn't try only
once — it keeps retrying on every reconciliation cycle:

1. At day 11, the regeneration time is reached. The operator tries to contact
   the license service. If the request fails, the action completes with an
   error log and a Kubernetes warning event — but your existing license is
   still valid for 3 more days.
2. On the next reconciliation loop (which runs continuously, typically every
   few seconds), the operator sees that regeneration is still needed and
   tries again immediately.
3. It keeps retrying on every reconciliation cycle until it succeeds or the
   license expires at day 14.

As soon as connectivity to the license service is restored — even briefly —
the operator grabs a new license.

If the full 3-day grace period passes without a successful renewal, the
license expires and ArangoDB falls back to Community Edition behavior
(Enterprise features become unavailable), but the database itself keeps
running.

### Configuration options

You don't need to change anything for the defaults to work. If you want to
tune the renewal behavior, the following fields are available on the
`ArangoDeployment` resource:

- `spec.license.ttl` — how long each license lasts.
  Default: `336h` (14 days).
- `spec.license.expirationGracePeriod` — how early before expiry the
  operator starts trying to renew.
  Default: `72h` (3 days).
- `spec.tls.ttl` — how long internal TLS certificates last.
  Default: `2610h` (about 3 months).

A shorter TTL means more frequent renewals. A longer grace period means
renewal starts earlier and gives you a larger window of automatic retries
before the license expires. For example, setting
`spec.license.expirationGracePeriod: 168h` with the default 14-day TTL
starts renewal attempts at day 7 instead of day 11, giving you a full week
of retries before expiry.

See the [`ArangoDeployment` custom resource reference](https://arangodb.github.io/kube-arangodb/docs/deployment-resource-reference.html)
for the full list of fields.

## Apply a license in a Kubernetes-managed deployment

How you supply the license to the operator depends on whether the cluster
has internet access.

### Online: apply license credentials

In environments with internet access, supply your license credentials
(client ID and client secret) as a Kubernetes secret. The operator uses
them to activate the deployment and to renew the license automatically.

1. Create a secret with the license credentials. Substitute
   `<license-client-id>` and `<license-client-secret>` with the actual
   values you received from the Arango team:

   ```sh
   kubectl create secret generic arango-license-key \
     --namespace arango \
     --from-literal=license-client-id="<license-client-id>" \
     --from-literal=license-client-secret="<license-client-secret>"
   ```

2. Reference the secret in the `spec.license.secretName` field of the
   `ArangoDeployment`:

   ```yaml
   apiVersion: "database.arangodb.com/v1"
   kind: "ArangoDeployment"
   metadata:
     name: "deployment-example"
   spec:
     # ...
     license:
       secretName: arango-license-key
   ```

See the [online setup guide](install-and-upgrade/online-setup.md) for the full
installation flow.

### Offline / air-gapped: apply a generated license key

In air-gapped environments the cluster cannot reach the license service, so
you generate a long-lived license key on an internet-connected system and
apply it as a secret on the air-gapped cluster.

1. On an internet-connected system, use the Platform CLI tool to generate
   a license key for your deployment. This requires an inventory file and
   the deployment ID collected from the air-gapped cluster — see
   [Step 6: Collect information for the licensing](install-and-upgrade/offline-setup.md#step-6-collect-information-for-the-licensing)
   and [Step 7: Generate a license key](install-and-upgrade/offline-setup.md#step-7-generate-a-license-key)
   in the offline setup guide for the detailed procedure.

2. On the air-gapped cluster, create a secret with the generated license key.
   Substitute `<license-string>` with the key contents:

   ```sh
   kubectl create secret generic arango-license-key \
     --namespace arango \
     --from-literal=token-v2="<license-string>"
   ```

3. Reference the secret in `spec.license.secretName` of the
   `ArangoDeployment`, the same way as for online deployments.

Because the license key has a limited validity, you need to repeat the
generation step and update the secret before the key expires. The operator
applies the updated key on its next reconciliation cycle.

## Verify the license

To check the current license status of a running deployment, use any of the
interfaces described in [Check the license](../arangodb/4.0/operations/administration/license-management.md#check-the-license)
on the ArangoDB License Management page (web interface, HTTP API, arangosh,
or a driver).

For monitoring the remaining validity automatically, the
`arangodb_license_expires` metric is exposed by Coordinators and DB-Servers.
See the [Metrics API](../arangodb/4.0/develop/http-api/monitoring/metrics.md).

## Further reading

- [ArangoDB License Management](../arangodb/4.0/operations/administration/license-management.md) —
  command-line and API-based flows, including standalone (non-Kubernetes)
  deployments, and reference information about license status fields.
- [`kube-arangodb` — Setting the License](https://arangodb.github.io/kube-arangodb/docs/how-to/set_license.html) —
  the operator's own reference for license secrets and the `spec.license` field.
- [Online setup](install-and-upgrade/online-setup.md) and
  [Offline setup](install-and-upgrade/offline-setup.md) — end-to-end
  installation guides that include the licensing steps in context.
