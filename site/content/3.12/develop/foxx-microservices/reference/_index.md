---
title: Foxx reference
menuTitle: Reference
weight: 20
description: >-
  Each Foxx service is defined by a JSON manifest specifying the entry point, any scripts defined by the service, possible configuration options and Foxx dependencies, as well as other metadata
archetype: chapter
---
Each Foxx service is defined by a [JSON manifest](service-manifest.md)
specifying the entry point, any scripts defined by the service,
possible [configuration](configuration.md) options and Foxx dependencies,
as well as other metadata. Within a service, these options are exposed as the
[service context](service-context.md), which is also used to mount
[routers](routers/_index.md) defining the service's API endpoints.

Foxx also provides a number of [utility modules](related-modules/_index.md)
as well as a flexible [sessions middleware](sessions-middleware/_index.md)
with different transport and storage mechanisms.

Foxx services can be installed and managed over the Web-UI or through
ArangoDB's [HTTP API](../../http-api/foxx.md#management).
