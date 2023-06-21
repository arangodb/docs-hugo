---
title: _arangoexport_ Options
menuTitle: Options
weight: 10
description: >-
  arangoexport Options
archetype: default
---
Usage: `arangoexport [<options>]`

{% assign optionsFile = page.version.version | remove: "." | append: "-program-options-arangoexport" -%}
{% assign options = site.data[optionsFile] -%}
{% include program-option.html options=options name="arangoexport" %}
