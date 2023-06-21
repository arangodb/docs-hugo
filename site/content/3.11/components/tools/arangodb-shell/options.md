---
title: _arangosh_ Options
menuTitle: Options
weight: 15
description: >-
  arangosh Options
archetype: default
---
Usage: `arangosh [<options>]`

{% assign optionsFile = page.version.version | remove: "." | append: "-program-options-arangosh" -%}
{% assign options = site.data[optionsFile] -%}
{% include program-option.html options=options name="arangosh" %}
