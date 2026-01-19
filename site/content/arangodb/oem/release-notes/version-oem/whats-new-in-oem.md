---
title: Features and Improvements in ArangoDB OEM / Embedded
menuTitle: What's New in OEM
weight: 5
description: >-
  Improved performance and reporting for AQL queries, new caching features for
  indexed data, improvements to the web interface
---
The following list shows in detail which features have been added or improved in
ArangoDB OEM / Embedded. It also contains several bug fixes that are not listed
here.

## Miscellaneous changes

### Optional elevation for GeoJSON Points

<small>Introduced in: v3.11.14-2</small>

The `GEO_POINT()` function now accepts an optional third argument to create a
GeoJSON Point with three coordinates: `[longitude, latitude, elevation]`.

GeoJSON Points may now have three coordinates in general.
However, ArangoDB does not take any elevation into account in geo-spatial
calculations.

Points with an elevation do no longer fail the validation in the `GEO_POLYGON()`
and `GEO_MULTIPOLYGON()` functions. Moreover, GeoJSON with three coordinates is
now indexed by geo indexes and thus also matched by geo-spatial queries, which
means you may find more results than before.

Also see [Geo-spatial functions in AQL](../../aql/functions/geo.md).

## Internal changes

### Upgraded bundled library versions

Upgraded ArangoDB Starter to version 0.18.19.

Upgraded Rclone to version 1.62.2, compiled with Go version 1.24.11.

Upgraded OpenSSL to version 3.5.4.

Updated the timezone data (tzdata) to the version as of 2025-11-05.

Upgraded OpenLDAP to version 2.6.10.

Upgrade arangosync to version 2.19.20.
