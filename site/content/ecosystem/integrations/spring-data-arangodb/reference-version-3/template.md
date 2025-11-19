---
title: Template
menuTitle: Template
weight: 10
description: >-
  With `ArangoTemplate`, Spring Data ArangoDB offers a central support for
  interactions with the database over a rich feature set
aliases:
  - ../../../../arangodb/3.12/develop/integrations/spring-data-arangodb/reference-version-3/template
  - ../../../../arangodb/stable/develop/integrations/spring-data-arangodb/reference-version-3/template
  - ../../../../arangodb/4.0/develop/integrations/spring-data-arangodb/reference-version-3/template
  - ../../../../arangodb/devel/develop/integrations/spring-data-arangodb/reference-version-3/template
---
{{< warning >}}
Spring Data ArangoDB version 3 reached End of Life (EOL) and is not actively
developed anymore. Upgrading to version 4 is recommended.
{{< /warning >}}

`ArangoTemplate` mostly offers the features from the ArangoDB Java driver with
additional exception translation from the drivers exceptions to the Spring Data
access exceptions inheriting the `DataAccessException` class.

The `ArangoTemplate` class is the default implementation of the operations
interface `ArangoOperations` which developers of Spring Data are encouraged to
code against.
