---
title: 
weight: 10
description: >-
  arangodump Options
archetype: default
---
_arangodump_ Options

Usage: `arangodump [<options>]`

{% assign optionsFile = page.version.version | remove: "." | append: "-program-options-arangodump" -%}
{% assign options = site.data[optionsFile] -%}
{% include program-option.html options=options name="arangodump" %}
