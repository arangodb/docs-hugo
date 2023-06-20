---
title: _arangoinspect_ Options
weight: 10
description: >-
  arangoinspect Options
archetype: default
---
Usage: `arangoinspect [<options>]`

{% assign optionsFile = page.version.version | remove: "." | append: "-program-options-arangoinspect" -%}
{% assign options = site.data[optionsFile] -%}
{% include program-option.html options=options name="arangoinspect" %}
