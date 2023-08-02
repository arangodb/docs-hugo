---
title: _arangobench_ Startup Options
menuTitle: Options
weight: 5
description: >-
  arangobench Startup Options
pageToc:
  maxHeadlineLevel: 2
archetype: default
---
Usage: `arangobench [<options>]`

**Examples**

Run the `version` test case with 1000 requests, without threads:

```
arangobench --test-case version --requests 1000 --threads 1
```

Run the `document` test case with 2000 requests, with two concurrent threads:

```
arangobench --test-case document --requests 1000 --threads 2
```

Run the `document` test case with 2000 requests, with threads 2,
with async requests:

```
arangobench --test-case document --requests 1000 --threads 2 --async true
```

Run the `document` test case with 2000 requests, with threads 2,
using batch requests:

```
arangobench --test-case document --requests 1000 --threads 2 --batch-size 10
```

{{% program-options name="arangobench" %}}
