---
title: _arangorestore_ Options
menuTitle: Options
weight: 10
description: >-
  arangorestore Options
archetype: default
---
Usage: `arangorestore [<options>]`

{% assign optionsFile = page.version.version | remove: "." | append: "-program-options-arangorestore" -%}
{% assign options = site.data[optionsFile] -%}
{% include program-option.html options=options name="arangorestore" %}
