---
title: _arangobench_ Startup Options
menuTitle: Options
weight: 5
description: >-
  The startup options of the `arangobench` executable
pageToc:
  maxHeadlineLevel: 2
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

{{% program-options name="arangobench" %}}
