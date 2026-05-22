---
title: Upgrade the version of the Arango Contextual Data Platform (v4.0)
menuTitle: Upgrade version
weight: 20
description: >-
  How to upgrade from an earlier version to a newer version of the Contextual Data Platform
---
Follow the upgrade procedure that applies for your environment:

- [**Online upgrade**](#online-upgrade): Upgrade with internet access.
- [**Offline upgrade**](#offline-upgrade): Upgrade without internet access,
  including fully air-gapped environments.

The guides assume that the Kubernetes namespace the data platform uses is called
`arango` and that the `ArangoDeployment` has the name `deployment-example`.

## Online upgrade

The following descriptions covers the upgrade procedure for the
Arango Contextual Data Platform if it has internet access.

### Step 1: Prepare the upgrade

You receive an updated package configuration file from the Arango team.

The Contextual Data Platform **package configuration** is a YAML file that
defines which services to install and their configurations. The file may include
newer versions of existing services, newly added services, as well as changes as
to what services are started automatically.

{{< info >}}
A newer version of the Contextual Data Platform may require a higher ArangoDB
version. Make sure to check the [Release notes](../release-notes.md) and plan
for an upgrade of ArangoDB as part of the data platform upgrade if necessary.
{{< /info >}}

### Step 2: Upgrade the operator

Upgrade the [ArangoDB Kubernetes Operator](https://arangodb.github.io/kube-arangodb/)
(`kube-arangodb`) with Helm.

You can find the latest release on GitHub:
<https://github.com/arangodb/kube-arangodb/releases/latest>

```sh
VERSION_OPERATOR='1.4.3' # Use a newer version if available

helm upgrade --install operator \
  --namespace arango \
  "https://github.com/arangodb/kube-arangodb/releases/download/$VERSION_OPERATOR/kube-arangodb-enterprise-$VERSION_OPERATOR.tgz" \
  --set "webhooks.enabled=true" \
  --set "operator.args[0]=--deployment.feature.gateway=true" \
  --set "operator.architectures={amd64}"
```

The output looks similar to the following on success:

```
Release "operator" has been upgraded. Happy Helming!
NAME: operator
LAST DEPLOYED: Wed May 20 15:45:02 2026
NAMESPACE: arango
STATUS: deployed
REVISION: 2
DESCRIPTION: Upgrade complete
TEST SUITE: None
NOTES:
You have installed Kubernetes ArangoDB Operator in version 1.4.3

To access ArangoDeployments you can use:

kubectl --namespace "arango" get arangodeployments

More details can be found on https://github.com/arangodb/kube-arangodb/tree/1.4.3/docs
```

### Step 3: Update the deployment

The planned upgrade of the data platform may require a newer version of
ArangoDB. See the [Release notes](../release-notes.md) for the minimum versions.

{{< warning >}}
Before upgrading ArangoDB, make sure to check for any incompatible changes in
the [ArangoDB release notes](../../arangodb/3.12/release-notes/_index.md) and
create an off-site backup!
{{< /warning >}}

Update the `ArangoDeployment` specification to use a newer version of ArangoDB.

- If you have a YAML file, e.g. `deployment.yaml`, then modify the `spec.image`
  field, save the file, and apply the specification:

  ```sh
  kubectl apply --namespace arango -f deployment.yaml
  ```
- You may also edit the specification directly in a command-line to modify the
  `spec.image` field:

  ```sh
  kubectl edit --namespace arango ArangoDeployment deployment-example
  ```

Example:

```yaml
apiVersion: database.arangodb.com/v1
kind: ArangoDeployment
metadata:
  name: deployment-example
  # ...
spec:
  image: arangodb/enterprise:3.12.9  # <-- Update here
  # ...
```

The upgrade process starts shortly after the modification and can take some time
until the Agent, DB-Server, and Coordinator pods are replaced with new ones
running the configured ArangoDB version.

### Step 4: Update the platform CLI tool

Download the Arango Contextual Data Platform CLI tool `arangodb_operator_platform` from
<https://github.com/arangodb/kube-arangodb/releases>, matching the version of
the operator (`kube-arangodb`).

It is recommended to rename the downloaded executable to
`arangodb_operator_platform` (with an `.exe` extension on Windows) and add it to
the `PATH` environment variable to make it available as a command in the system.

On Linux and macOS, you need to make the file executable. Your file manager
may allow that in a visual way, or you can use a command-line to run
`chmod +x arangodb_operator_platform`.

On macOS, you may additionally need to run `xattr -r -d com.apple.quarantine arangodb_operator_platform`
in a command-line to remove the flag that marks it as downloaded from the
internet to be able to run it.

### Step 5: Update the platform services

Use the platform CLI tool and the package configuration you received to update
the data platform services.

Substitute `<license-client-id>` and `<license-client-secret>`
with the actual license credentials and `./platform.yaml` with the path to the
package configuration file. The platform name (`deployment-example`) needs to
match the name as specified in the `ArangoDeployment` configuration.

```sh
arangodb_operator_platform --namespace arango package install \
  --license.client.id "<license-client-id>" \
  --license.client.secret "<license-client-secret>" \
  --platform.name deployment-example \
  ./platform.yaml
```

You can omit the license options if you want to let the tool discover the
license credentials from the `ArangoDeployment` automatically. 

## Offline upgrade

The following descriptions covers the upgrade procedure for the
Arango Contextual Data Platform if it has no internet access, including fully
air-gapped environments.

What needs to be done in which environment is indicated by each step:

- **Air-gapped system**: The offline environment.
- **Internet-connected system**: The online environment.

### Step 1: Download the upgrade files and information

{{< tag "Internet-connected system" >}}

In case of an upgrade on hardware without internet access, everything needed
to upgrade the services of the data platform has to be downloaded on a system
with internet access and needs to be transferred to the offline or air-gapped
system.


- You either receive a package configuration file or a pre-made package for
  download.
  
  A **platform package** is a zipped file that contains manifests and container
  images of various services of the Contextual Data Platform. You can import
  the platform package into your container registry from where Kubernetes can
  pull the images.

  A Contextual Data Platform **package configuration** is a YAML file that defines
  the services, their versions, and configuration. You can use it to create a
  platform package yourself by exporting from Arango's container registry.

- Download the latest enterprise version of the ArangoDB Kubernetes Operator
  `kube-arangodb` from <https://github.com/arangodb/kube-arangodb/releases/latest>.

  Look for the file called `kube-arangodb-enterprise-x.x.x.tgz` (where `x.x.x`
  is the version number). It is the operator for x86-64 CPUs.
  You may need to click **Show all # assets** to reveal all files. 

- Download the Arango Contextual Data Platform CLI tool `arangodb_operator_platform` from
  <https://github.com/arangodb/kube-arangodb/releases/latest>.
  It is available for Linux, macOS, and Windows for the x86-64 as well as 64-bit ARM
  architecture, for example:
  
  - `arangodb_operator_platform_darwin_arm64` for macOS with Apple M1 and later CPUs
  - `arangodb_operator_platform_linux_amd64` for Linux-based systems with x86-64 CPU
  - `arangodb_operator_platform_linux_arm64` for Linux-based systems with 64-bit ARM CPU
  - `arangodb_operator_platform_windows_amd64` for Windows with 64-bit x86-64 CPU

  It is recommended to rename the downloaded executable to
  `arangodb_operator_platform` (with an `.exe` extension on Windows) and add it to
  the `PATH` environment variable to make it available as a command in the system.

  On Linux and macOS, you need to make the file executable. Your file manager
  may allow that in a visual way, or you can use a command-line to run
  `chmod +x arangodb_operator_platform`.

  On macOS, you may additionally need to run `xattr -r -d com.apple.quarantine arangodb_operator_platform`
  in a command-line to remove the flag that marks it as downloaded from the
  internet to be able to run it.

- Pull the necessary images from the internet and save them to files in order to
  copy them to the air-gapped system.

  You can use container management tool like Docker but you can also use a
  dedicated tool like `regctl` instead. Keep in mind that you also need this tool
  in the air-gapped environment to load the images into the container registry.

  You need at least the image of the ArangoDB Kubernetes Operator
  (`arangodb/kube-arangodb-enterprise`). If you want to use a local MinIO
  instance for blob storage, make sure to also get this image
  (e.g. `minio/minio:latest`). The process is the same for any image.

  {{< tabs "container-management" >}}

  {{< tab "Docker" >}}
  ```sh
  docker pull docker.io/arangodb/kube-arangodb-enterprise:1.4.3
  docker save docker.io/arangodb/kube-arangodb-enterprise:1.4.3 -o kube-arangodb-enterprise.tar
  ```
  {{< /tab >}}

  {{< tab "regctl" >}}
  Download the `regctl` executables that match your systems from
  <https://github.com/regclient/regclient/releases/>.

  In the following, the assumed name of the executable is `regctl`.

  On Linux and macOS, you need to make the file executable. Your file manager
  may allow that in a visual way, or you can use a command-line to run
  `chmod +x regctl`.

  On macOS, you may additionally need to run `xattr -r -d com.apple.quarantine regctl`
  in a command-line to remove the flag that marks it as downloaded from the
  internet to be able to run it.

  To pull the image and save it to a file as follows:

<!-- TODO: Pull arangodb and k8s pause images too? -->

  ```sh
  regctl image export docker.io/arangodb/kube-arangodb-enterprise:1.4.3 kube-arangodb-enterprise.tar
  ```
  {{< /tab >}}

  {{< /tabs >}}

### Step 2:
