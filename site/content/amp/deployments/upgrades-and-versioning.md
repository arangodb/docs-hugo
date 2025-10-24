---
title: Upgrades and Versioning in the Arango Managed Platform (AMP)
menuTitle: Upgrades and Versioning
weight: 10
description: >-
  Select which version of ArangoDB you want to use within your AMP
  deployment and choose when to roll out your upgrades
---
{{< info >}}
Please note that this policy comes into effect in April 2023.
{{< /info >}}

## Release Definitions

The following definitions are used for release types of ArangoDB within the
Arango Managed Platform (AMP):

| Release  | Introduces  | Contains breaking changes  |
|----------|-------------|----------------------------|
| **Major** (`X.y.z`) | Major new features and functionalities | Likely large changes |
| **Minor** (`x.Y.z`) | Some new features or improvements | Likely small changes |
| **Patch** (`x.y.Z`) | Essential fixes and improvements | Small changes in exceptional circumstances |

## Release Channels

When creating a deployment in AMP, you can select the minor version
of ArangoDB that your deployment is going to use. This minor version is in the
format `Major.Minor` and indicates the major and minor version of ArangoDB that
is used in this deployment, for example `3.10` or `3.9`.

To provide secure and reliable service, databases are deployed on the latest
available patch version in the selected version. For example, if `3.10` is
selected and `3.10.3` is the latest version of ArangoDB available for the `3.10`
minor version, then the deployment is initially using ArangoDB `3.10.3`.

## Upgrades

### Manual Upgrades

At any time, you can change the release channel of your deployment to a later
release channel, but not to an earlier one. For example, if you are using `3.10`
then you can change your deployment’s release channel to `3.11`, but you would
not be able to change the release channel to `3.9`.
See [how to edit a deployment](_index.md#how-to-edit-a-deployment).

Upon changing your release channel, an upgrade process for your deployment is
initiated to upgrade your running database to the latest patch release of your
selected release channel. You can use this mechanism to upgrade your deployments
at a time that suits you, prior to the forced upgrade when your release channel
is no longer available.

### Automatic Upgrades

#### Major Versions (`X.y.z`)

The potential disruption of a major version upgrade requires additional testing
of any applications connecting to your AMP deployment. As a result, when
a new major version is released in AMP, an email is sent out
to inform you of this release.

If the ArangoDB version that you are currently using is no longer available
in AMP, you are forced to upgrade to the next available version.
Prior to the removal of the version, an email is sent out to inform you of this
forced upgrade.

#### Minor Versions (`x.Y.z`)

Although minor upgrades are not expected to cause significant compatibility
changes like major versions, they may still require additional planning and
validation.

This is why minor upgrades are treated in the same manner as major upgrades
within AMP. When a new minor version is released on the AMP
platform, an email is sent out to inform you of this release.

If the ArangoDB version that you are currently using is no longer available in
AMP, you are forced to upgrade to the next available version.
Prior to the removal of the version, an email is sent out to inform you of this
forced upgrade.

#### Patch Versions (`x.y.Z`)

Upgrades between patch versions are transparent, with no significant disruption
to your applications. As such, you can expect to be automatically upgraded to
the latest patch version of your selected minor version shortly after it becomes
available in AMP.

AMP aims to give approximately one week’s notice prior to upgrading your
deployments to the latest patch release. Although in exceptional circumstances
(such as a critical security issue) the upgrade may be triggered with less than
one week's notice.
The upgrade is carried out automatically. However, if you need the upgrade to be
deferred temporarily, contact the AMP Support team to request that.
