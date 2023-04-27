---
title: _arangoimport_ Options
weight: 20
description: >-
  arangoimport Options
archetype: default
---
Usage: `arangoimport [<options>]`

{% assign optionsFile = page.version.version | remove: "." | append: "-program-options-arangoimport" -%}
{% assign options = site.data[optionsFile] -%}
{% include program-option.html options=options name="arangoimport" %}
