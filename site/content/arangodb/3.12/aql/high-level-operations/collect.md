---
title: '`COLLECT` operation in AQL'
menuTitle: COLLECT
weight: 40
description: >-
  The `COLLECT` operation can group data, retrieve all distinct values, count
  how often values occur, and calculate statistical properties efficiently
---
The different variants of `COLLECT` cover most needs for grouping and aggregating
data. For aggregation using a sliding window, see the [`WINDOW` operation](window.md).

## Syntax

There are multiple syntax variants for `COLLECT` operations.

Group by one or multiple criteria, optionally aggregate over the elements of
each group, and optionally store the elements of each group in an array variable:

```aql-syntax
COLLECT <var> = <expr> [, … , <varN> = <exprN>]
[AGGREGATE <aggVar> = <aggExpr> [, … , <aggVarN> = <aggExprN>]]
[INTO <groupsVar> [= <projectionExpr>]]
[OPTIONS { … }]
```

Aggregate over all elements without grouping, and optionally store all elements
in an array variable:

```aql-syntax
COLLECT
AGGREGATE <aggVar> = <aggExpr> [, … , <aggVarN> = <aggExprN>]
[INTO <groupsVar> [= <projectionExpr>]]
[OPTIONS { … }]
```

Count the elements in total or per group:

```aql-syntax
COLLECT [<var> = <expr> [, … , <varN> = <exprN>]]
WITH COUNT INTO <countVar>
[OPTIONS { … }]
```

Group by one or multiple criteria, store the elements of each group in an array
variable, and limit which variables from the scope are stored for each element:

```aql-syntax
COLLECT <var> = <expr> [, … , <varN> = <exprN>]
INTO <groupsVar>
KEEP <keepVar> [, … , <keepVarN>]
[OPTIONS { … }]
```

{{< info >}}
The `COLLECT` operation eliminates all local variables in the current scope.
After a `COLLECT`, only the variables introduced by `COLLECT` itself are available.
{{< /info >}}

## Grouping

To group elements, specify one or more group criteria in the form of
`<var> = <expr>` after the `COLLECT` keyword. `COLLECT` evaluates the
expression for every element and returns one result per distinct value.
The variable contains the group value and you can use it in later operations.

The following example query finds the distinct values in `u.city` and makes
them available in the variable `city`:

```aql
FOR u IN users
  COLLECT city = u.city
  RETURN { 
    "city" : city 
  }
```

To group by multiple criteria, separate them with commas:

```aql
FOR u IN users
  COLLECT country = u.country, city = u.city
  RETURN { 
    "country" : country, 
    "city" : city
  }
```

In the above example, the `users` are grouped by country first and then by
city, and there is one result for each distinct combination of country and city.

## Storing group elements (`INTO`)

Grouping on its own only gives you the group values. To also access the
elements that fell into each group, add an `INTO` clause with a variable name.
This variable (*groupsVar*) is an array with as many elements as there are in
the group. Each element of that array is an object with one attribute per
variable that is defined in the query at this point, with the attribute name
being the variable name and the attribute value being the variable value.

Note that this considers all variables that are defined before the `COLLECT`
operation, but not those on the top level (outside of any `FOR`), unless the
`COLLECT` operation is itself on the top level, in which case all variables are
taken. Furthermore, note that the optimizer may move `LET` operations out of
`FOR` loops to improve performance.

```aql
FOR u IN users
  COLLECT city = u.city INTO groups
  RETURN { 
    "city" : city, 
    "usersInCity" : groups 
  }
```

In the above example, the `users` are grouped by the `city` attribute. The
result is an array of objects, one for each distinct `u.city` value. The
elements of the `users` array per city are available in the `groups` variable,
each in the form `{ "u": … }` because `u` is the only variable in scope.
For example, `groups[*].u.name` gives you the names of all users in a city.

You can combine `INTO` with multiple group criteria and with an
[`AGGREGATE` clause](#aggregation-aggregate):

```aql
FOR u IN users
  COLLECT country = u.country, city = u.city INTO groups
  RETURN { 
    "country" : country, 
    "city" : city, 
    "usersInCity" : groups 
  }
```

### Projections

Instead of storing all variables of the scope for each element, you can specify
an arbitrary expression after `INTO <groupsVar> =` (*projectionExpr*). For each
element, only the result of this expression is stored in the *groupsVar*:

```aql
FOR u IN users
  COLLECT country = u.country, city = u.city INTO groups = u.name
  RETURN { 
    "country" : country, 
    "city" : city, 
    "userNames" : groups 
  }
```

In the above example, the *projectionExpr* is `u.name`. Therefore, the
*groupsVar* is an array of user names rather than an array of objects with
a `u` attribute holding a full user document. This can be much more efficient
than copying all variables of the scope into the *groupsVar*, which happens
without a *projectionExpr*.

{{< tip >}}
You can also express such projections using an
[Aggregation](#aggregation-aggregate) with the `PUSH()` function
(introduced in v3.12.4):

```aql
FOR u IN users
  COLLECT country = u.country, city = u.city AGGREGATE groups = PUSH(u.name)
  RETURN { 
    "country" : country, 
    "city" : city, 
    "userNames" : groups 
  }
```
{{< /tip >}}

The *projectionExpr* can also be used for arbitrary computations:

```aql
FOR u IN users
  COLLECT country = u.country, city = u.city INTO groups = { 
    "name" : u.name, 
    "isActive" : u.status == "active"
  }
  RETURN { 
    "country" : country, 
    "city" : city, 
    "usersInCity" : groups 
  }
```

### Discarding obsolete variables (`KEEP`)

Without a *projectionExpr*, all variables from the scope are copied into the
*groupsVar*. This is safe but can have a negative impact on performance if
there are many variables in scope or if the variables contain large amounts
of data.

You can add a `KEEP` clause to explicitly define which variables to copy into
the *groupsVar*. The following example limits the variables that are copied
to just `name`. The variables `u` and `someCalculation` that are also in scope
are not copied into the *groupsVar* because they are not listed in the
`KEEP` clause:

```aql
FOR u IN users
  LET name = u.name
  LET someCalculation = u.value1 + u.value2
  COLLECT city = u.city INTO groups KEEP name 
  RETURN { 
    "city" : city, 
    "userNames" : groups[*].name 
  }
```

You can specify multiple variable names in the `KEEP` clause, separated by
commas. `KEEP` is only valid in combination with `INTO`, and you cannot combine
it with a *projectionExpr* or an `AGGREGATE` clause.

The query optimizer discards unused variables automatically in many cases
(`remove-collect-variables` [optimizer rule](../execution-and-performance/query-optimization.md#optimizer-rules)):

- If the *groupsVar* isn't used after the `COLLECT` operation, the optimizer
  removes the `INTO` clause altogether.
- If the *groupsVar* is only accessed via specific variables later in the query,
  like `groups[*].name` in the above example, the optimizer limits the copied
  variables to the ones that are accessed, as if you had specified `KEEP`.
  This also applies if the `COLLECT` operation has an `AGGREGATE` clause, where
  you cannot use `KEEP` yourself.

The optimizer cannot apply the automatic restriction if it cannot determine
which variables are accessed, for example, if you return the *groupsVar* as a
whole or pass it to a function. Specify `KEEP` explicitly or use a
*projectionExpr* in such cases to avoid copying unnecessary data.

## Counting elements (`WITH COUNT INTO`)

`COLLECT` provides a special `WITH COUNT INTO` clause to efficiently determine
the number of elements.

Without group criteria, it returns the number of elements that made it into the
`COLLECT` operation:

```aql
FOR u IN users
  COLLECT WITH COUNT INTO length
  RETURN length
```

The above is equivalent to, but less efficient than:

```aql
RETURN LENGTH(users)
```

With group criteria, it counts the number of elements in each group:

```aql
FOR u IN users
  COLLECT age = u.age WITH COUNT INTO length
  RETURN { 
    "age" : age, 
    "count" : length 
  }
```

{{< info >}}
`WITH COUNT` must always be followed by `INTO <countVar>`. You cannot combine
it with an `AGGREGATE` clause or with `INTO <groupsVar>` to store the group
elements. If you need the counts together with other aggregations or the group
elements, see [From `WITH COUNT INTO` to `AGGREGATE`](#from-with-count-into-to-aggregate).
{{< /info >}}

## Aggregation (`AGGREGATE`)

You can use `COLLECT` operations with an `AGGREGATE` clause to aggregate the
data per group, such as determining the minimum, maximum, and average values,
the sums, and more. The aggregate values are built incrementally while the
elements are grouped.

```aql
FOR u IN users
  COLLECT ageGroup = FLOOR(u.age / 5) * 5 
  AGGREGATE minAge = MIN(u.age), maxAge = MAX(u.age)
  RETURN {
    ageGroup, 
    minAge, 
    maxAge 
  }
```

The `AGGREGATE` keyword must directly follow the group criteria. If there are
no group criteria, it must directly follow the `COLLECT` keyword, and the
aggregation is over all elements:

```aql
FOR u IN users
  COLLECT AGGREGATE minAge = MIN(u.age), maxAge = MAX(u.age)
  RETURN {
    minAge, 
    maxAge 
  }
```

You can combine `AGGREGATE` with an `INTO` clause to also
[store the group elements](#storing-group-elements-into), including with a
[projection](#projections).

### Aggregate expressions

Only specific expressions are allowed on the right-hand side of each `AGGREGATE`
assignment:

- On the top level, an aggregate expression must be a call to one of the
  supported aggregation functions:
  - `LENGTH()` / `COUNT()`
  - `MIN()`
  - `MAX()`
  - `SUM()`
  - `AVERAGE()` / `AVG()`
  - `STDDEV_POPULATION()` / `STDDEV()`
  - `STDDEV_SAMPLE()`
  - `VARIANCE_POPULATION()` / `VARIANCE()`
  - `VARIANCE_SAMPLE()`
  - `UNIQUE()`
  - `SORTED_UNIQUE()`
  - `COUNT_DISTINCT()` / `COUNT_UNIQUE()`
  - `BIT_AND()`
  - `BIT_OR()`
  - `BIT_XOR()`
  - `PUSH()` (introduced in v3.12.4)

- An aggregate expression must not refer to variables introduced by the `COLLECT` itself.

### `AGGREGATE` vs. post-aggregation

Instead of using `AGGREGATE`, you can store the group elements using `INTO`
and perform calculations on them after the grouping. The following example
shows such a post-aggregation:

```aql
FOR u IN users
  COLLECT ageGroup = FLOOR(u.age / 5) * 5 INTO g
  RETURN { 
    "ageGroup" : ageGroup,
    "minAge" : MIN(g[*].u.age),
    "maxAge" : MAX(g[*].u.age)
  }
```

This produces the same result as the `AGGREGATE` example of the previous section
but requires storing all elements of all groups during the `COLLECT` operation,
which can be inefficient. With `AGGREGATE`, only the aggregate values are kept
and updated for each element, which is therefore often more efficient.

If you perform calculations on the results of a `COLLECT` operation, check
whether you can rewrite them to use `COLLECT ... AGGREGATE`. Post-aggregation
is still necessary if you need a calculation that is not covered by the
[aggregate expressions](#aggregate-expressions), for example, to determine
the median using `MEDIAN(g[*].u.age)`.

### From `WITH COUNT INTO` to `AGGREGATE`

`WITH COUNT INTO` is a convenient shorthand if all you need is the number of
elements. You can express the same with the `COUNT()` aggregation function
(or `LENGTH()`, or `SUM(1)`):

```aql
FOR u IN users
  COLLECT age = u.age AGGREGATE length = COUNT()
  RETURN {
    "age" : age, 
    "count" : length 
  }
```

Unlike `WITH COUNT INTO`, the `AGGREGATE` variant lets you calculate further
aggregate values at the same time. For example, to also get the cities the
users of each age live in:

```aql
FOR u IN users
  COLLECT age = u.age
  AGGREGATE length = COUNT(), cities = UNIQUE(u.city)
  RETURN {
    "age" : age, 
    "count" : length,
    "cities" : cities
  }
```

This also works without group criteria, so that you can replace
`COLLECT WITH COUNT INTO length` with
`COLLECT AGGREGATE length = COUNT(), avgAge = AVG(u.age)`, for example.

If you need the group elements in addition to the counts, you can add an
`INTO` clause to the `AGGREGATE` variant:

```aql
FOR u IN users
  COLLECT age = u.age AGGREGATE length = COUNT() INTO groups = u.name
  RETURN {
    "age" : age, 
    "count" : length,
    "userNames" : groups
  }
```

## `COLLECT` vs. `RETURN DISTINCT`

In order to make a result set unique, one can either use `COLLECT` or
`RETURN DISTINCT`.

```aql
FOR u IN users
  RETURN DISTINCT u.age
```

```aql
FOR u IN users
  COLLECT age = u.age
  RETURN age
```

Behind the scenes, both variants create a *CollectNode*. However, they use
different implementations of `COLLECT` that have different properties:

- `RETURN DISTINCT` **maintains the order of results**, but it is limited to
  a single value.

- `COLLECT` **changes the order of results** (sorted or undefined), but it
  supports multiple values and is more flexible than `RETURN DISTINCT`.

Aside from its sophisticated grouping and aggregation capabilities, `COLLECT`
allows you to place a `LIMIT` operation before `RETURN` to potentially stop the
`COLLECT` operation early.

## `COLLECT` options

### `disableIndex`

<small>Introduced in: v3.12.4</small>

You can disable the `use-index-for-collect` optimization for individual
`COLLECT` operations by setting this option to `true`.

```aql
COLLECT ... OPTIONS { disableIndex: true }
```

The optimization improves the scanning for distinct values using `COLLECT` if a
usable persistent index is present. It is automatically disabled if the
selectivity is high, i.e. there are many different values, or if there is
filtering or an `INTO` or `AGGREGATE` clause.

### `method`

There are two variants of `COLLECT` that the optimizer can choose from:
the *sorted* and the *hash* variant. The `method` option can be used in a
`COLLECT` statement to inform the optimizer about the preferred method,
`"sorted"` or `"hash"`.

```aql
COLLECT ... OPTIONS { method: "sorted" }
```

If no method is specified by the user, then the optimizer will create a plan
that uses the *sorted* method, and an additional plan using the *hash* method
if the `COLLECT` statement qualifies for it.

If the method is explicitly set to *sorted*, then the optimizer will always use
the *sorted* variant of `COLLECT` and not even create a plan using the *hash*
variant. If it is explicitly set to *hash*, then the optimizer will create a
plan using the *hash* method **only if the `COLLECT` statement qualifies**.
Not all `COLLECT` statements can use the *hash* method, in particular ones that
do not perform any grouping. In case the `COLLECT` statement qualifies,
there will only be one plan that uses the *hash* method. Otherwise, the
optimizer will default to the *sorted* method.

The *sorted* method requires its input to be sorted by the group criteria
specified in the `COLLECT` clause. To ensure correctness of the result, the
optimizer will automatically insert a `SORT` operation into the query in front
of the `COLLECT` statement. The optimizer may be able to optimize away that
`SORT` operation later if a sorted index is present on the group criteria.

In case a `COLLECT` statement qualifies for using the *hash* variant, the
optimizer will create an extra plan for it at the beginning of the planning
phase. In this plan, no extra `SORT` statement will be added in front of the
`COLLECT`. This is because the *hash* variant of `COLLECT` does not require
sorted input. Instead, a `SORT` statement will be added after the `COLLECT` to
sort its output. This `SORT` statement may be optimized away again in later
stages.

If the sort order of the `COLLECT` is irrelevant to the user, adding the extra
instruction `SORT null` after the `COLLECT` will allow the optimizer to remove
the sorts altogether:

```aql
FOR u IN users
  COLLECT age = u.age
  SORT null  /* note: will be optimized away */
  RETURN age
```

Which `COLLECT` variant is used by the optimizer if no preferred method is set
explicitly depends on the optimizer's cost estimations. The created plans with
the different `COLLECT` variants will be shipped through the regular
optimization pipeline. In the end, the optimizer will pick the plan with the
lowest estimated total cost as usual.

In general, the *sorted* variant of `COLLECT` should be preferred in cases when
there is a sorted index present on the group criteria. In this case the
optimizer can eliminate the `SORT` operation in front of the `COLLECT`, so that
no `SORT` will be left.

If there is no sorted index available on the group criteria, the up-front sort
required by the *sorted* variant can be expensive. In this case it is likely
that the optimizer will prefer the *hash* variant of `COLLECT`, which does not
require its input to be sorted.

Which variant of `COLLECT` will actually be used can be figured out by looking
at the execution plan of a query, specifically the comment of the *CollectNode*:

```aql
Execution plan:
 Id   NodeType                  Est.   Comment
  1   SingletonNode                1   * ROOT
  2   EnumerateCollectionNode      5     - FOR doc IN coll   /* full collection scan, projections: `name` */
  3   CalculationNode              5       - LET #2 = doc.`name`   /* attribute expression */   /* collections used: doc : coll */
  4   CollectNode                  5       - COLLECT name = #2   /* hash */
  6   SortNode                     5       - SORT name ASC   /* sorting strategy: standard */
  5   ReturnNode                   5       - RETURN name
```
