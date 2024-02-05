---
title: Wildcard Search with ArangoSearch
menuTitle: Wildcard search
weight: 30
description: >-
  Search for strings with placeholders that stand for one or many arbitrary characters
archetype: default
---
You can use the `LIKE()` function and `LIKE` operator for this search technique
to find strings that start with, contain, or end with a certain substring. You
can also search for complex patterns with multiple placeholders. Place the
special characters `_` and `%` as wildcards for any single or zero-or-more
characters in the search string to match multiple partial strings.

```
prefix%
%infix%
%suffix
%complex%pat_ern
```

Wildcard searching can be an alternative to tokenizing text into words and then
searching for words in a particular order ([Phrase and Proximity Search](phrase-and-proximity-search.md)).
It is especially useful if you want to search for substrings that include
characters that are considered word boundaries like punctuation and whitespace
and would normally get removed when tokenizing text.

## Index acceleration

The [ArangoSearch `LIKE()` function](../../aql/functions/arangosearch.md#like)
is backed by View indexes. In contrast, the
[string `LIKE()` function](../../aql/functions/string.md#like) cannot utilize any
sort of index. This applies to the [`LIKE` operator](../../aql/operators.md#comparison-operators),
too, which you can use instead of the function.
Another difference is that the ArangoSearch variant of the `LIKE()` function does
not accept a third argument to make matching case-insensitive. You can control
this via Analyzers instead, also see
[Case-insensitive Search with ArangoSearch](case-sensitivity-and-diacritics.md).
Which of the two equally named functions is used is determined by the context.
The ArangoSearch variant is used in `SEARCH` operations. It is also used when
you have an inverted index and use the `LIKE()` function with two arguments or
the `LIKE` operator in `FILTER` operations. The string variant is used everywhere
else, including using the `LIKE()` function with three arguments in `FILTER`
operations together with an inverted index.

You can further accelerate wildcard queries by creating a specialized `wildcard`
Analyzer and using it in a View or inverted index on the desired document
attributes. The `wildcard` Analyzer creates _n_-grams that can internally be
used to quickly find candidates, followed by post-filtering to remove
false-positive matches. The _n_-gram size should be configured depending on the
data and expected wildcard search strings. The substrings between wildcards of a
search string that are at least as long as the _n_-gram size are used to find
candidates. For example, the longest substring of `%up%if%ref%` is `ref`.
With an _n_-gram size of `3`, the `ref` substring can be looked up quickly to
find candidates, achieving a faster search as with a differently indexed attribute,
e.g. using the `identity` Analyzer. With an _n_-gram size of `2`, it is also
fast to find candidates, as `up`, `if`, `re`, and `ef` can be used to look up
potential matches. However, with an _n_-gram size of `4` or greater, ArangoSearch
has to treat all entries as candidates for this search string because the
substrings between wildcards are shorter than the _n_-gram size. It needs to
post-filter more, which is slower as with a differently indexed attribute.
Therefore, the _n_-gram size should generally be set to a small number so that
virtually all wildcard searches can get a speedup from an attribute being indexed
with the `wildcard` Analyzer. On the other hand, it should not be set
unnecessarily small, as the lookup performance degrades with many duplicate
_n_-grams in the index, which is more likely with shorter _n_-grams.

## Wildcard Syntax

- `_`: A single arbitrary character
- `%`: Zero, one or many arbitrary characters
- `\\_`: A literal underscore
- `\\%`: A literal percent sign

{{< info >}}
Literal backlashes require different amounts of escaping depending on the
context:
- `\` in bind variables (_Table_ view mode) in the web interface (automatically
  escaped to `\\` unless the value is wrapped in double quotes and already
  escaped properly)
- `\\` in bind variables (_JSON_ view mode) and queries in the web interface
- `\\` in bind variables in arangosh
- `\\\\` in queries in arangosh
- Double the amount compared to arangosh in shells that use backslashes for
escaping (`\\\\` in bind variables and `\\\\\\\\` in queries)
{{< /info >}}

## Wildcard Search Examples

### Dataset

[IMDB movie dataset](example-datasets.md#imdb-movie-dataset)

### View definition

{{< tabs "view-definition">}}

{{< tab "`search-alias` View" >}}
```js
db.imdb_vertices.ensureIndex({ name: "inv-exact", type: "inverted", fields: [ "title" ] });
db._createView("imdb", "search-alias", { indexes: [ { collection: "imdb_vertices", index: "inv-exact" } ] });
```
{{< /tab >}}

{{< tab "`arangosearch` View" >}}
```json
{
  "links": {
    "imdb_vertices": {
      "fields": {
        "title": {
          "analyzers": [
            "identity"
          ]
        }
      }
    }
  }
}
```
{{< /tab >}}

{{< /tabs >}}

### AQL queries

Match all titles that starts with `The Matr` using `LIKE()`,
where `_` stands for a single wildcard character and `%` for an arbitrary amount:

```aql
FOR doc IN imdb
  SEARCH LIKE(doc.title, "The Matr%")
  RETURN doc.title
```

| Result |
|:-------|
| **The Matr**ix Revisited |
| **The Matr**ix |
| **The Matr**ix Reloaded |
| **The Matr**ix Revolutions |
| **The Matr**ix Trilogy |

You can achieve the same with the `STARTS_WITH()` function:

```aql
FOR doc IN imdb
  SEARCH STARTS_WITH(doc.title, "The Matr")
  RETURN doc.title
```

Match all titles that contain `Mat` using `LIKE()`:

```aql
FOR doc IN imdb
  SEARCH LIKE(doc.title, "%Mat%")
  RETURN doc.title
```

| Result |
|:-------|
| The **Mat**rix Revisited |
| Gray **Mat**ters |
| Show: A Night In The Life of **Mat**chbox Twenty |
| The **Mat**ing Habits of the Earthbound Human |
| Dark **Mat**ter |
| Dave **Mat**thews & Tim Reynolds: Live at Radio City |
| Once Upon A **Mat**tress |
| Tarzan and His **Mat**e |
| Donald in **Mat**hmagic Land |
| Das Geheimnis der **Mat**erie |
| … |

Match all titles that end with `rix` using `LIKE()`:

```aql
FOR doc IN imdb
  SEARCH LIKE(doc.title, "%rix")
  RETURN doc.title
```

| Result |
|:-------|
| Ben 10: Secret of the Omnit**rix** |
| Pinchcliffe Grand P**rix** |
| Hend**rix** |
| The Mat**rix** |
| The Animat**rix** |
| Les Douze travaux d'Asté**rix** |
| Vercingéto**rix** |

Match all titles that have an `H` as first letter, followed by two arbitrary
characters, followed by `ry` and any amount of characters after that. It will
match titles starting with `Harry` and `Henry`:

```aql
FOR doc IN imdb
  SEARCH LIKE(doc.title, "H__ry%")
  RETURN doc.title
```

| Result |
|:-------|
| **Henry** & June |
| **Henry** Rollins: Live in the Conversation Pit |
| **Henry** Rollins: Uncut from NYC |
| **Harry** Potter and the Sorcerer's Stone |
| **Harry** Potter and the Chamber Of Secrets |
| … |

Use a bind parameter as input, but escape the characters with special meaning
and perform a contains-style search by prepending and appending a percent sign:

```aql
FOR doc IN imdb
  SEARCH LIKE(doc.title, CONCAT("%", SUBSTITUTE(@term, ["_", "%"], ["\\_", "\\%"]), "%"))
  RETURN doc.title
```

Bind parameters:

```json
{ "term": "y_" }
```

The query constructs the wildcard string `%y\\_%` and will match `Cry_Wolf`.

## Wildcard Analyzer Examples

You can index attributes with a `wildcard` Analyzer to improve the wildcard
search performance.

### Dataset

[IMDB movie dataset](example-datasets.md#imdb-movie-dataset)

### Custom Analyzer

```js
---
name: analyzer_wildcard_sample
description: |
  Create a `wildcard` Analyzer with a small _n_-gram size, for example, in arangosh.
  You can let the Analyzer pre-process the inputs, like with a `norm` Analyzer to
  enable case-insensitive and accent-insensitive wildcard search. Create a matching
  standalone Analyzer so that you can pre-process wildcard search strings in the
  same fashion:
---
var analyzers = require("@arangodb/analyzers");
var wildcardNormAnalyzer = analyzers.save("wildcard_norm", "wildcard", { ngramSize: 3, analyzer: { type: "norm", properties: { locale: "en", accent: false, case: "lower" } } }, ["frequency", "norm"]);
var matchingNormAnalyzer = analyzers.save("only_norm", "norm", { locale: "en", accent: false, case: "lower" });
~analyzers.remove("wildcard_norm");
~analyzers.remove("only_norm");
```

The `frequency` and `norm` [Analyzer features](../analyzers.md#analyzer-features)
are set for improved performance of simple wildcard searches at the expense of
higher memory usage.

### View definition

{{< tabs "view-definition">}}

{{< tab "`search-alias` View" >}}
```js
db.imdb_vertices.ensureIndex({ name: "inv-wildcard", type: "inverted", fields: [ { name: "description", analyzer: "wildcard_norm" } ] });
db._createView("imdb", "search-alias", { indexes: [ { collection: "imdb_vertices", index: "inv-wildcard" } ] });
```
{{< /tab >}}

{{< tab "`arangosearch` View" >}}
```json
{
  "links": {
    "imdb_vertices": {
      "fields": {
        "description": {
          "analyzers": [
            "wildcard_norm"
          ]
        }
      }
    }
  }
}
```
{{< /tab >}}

{{< /tabs >}}

### AQL queries

Match movie descriptions that end with `AY!` case-insensitively by taking the
search string and applying the `norm` Analyzer that matches the one of the
`wildcard` Analyzer (both normalizing to lowercase), and then using the `LIKE`
operator to perform a wildcard search:

{{< tabs "view-definition">}}

{{< tab "`search-alias` View" >}}
```aql
LET search = "%AY!"
LET searchNormalized = TOKENS(search, "only_norm")[0]
FOR doc IN imdb
  SEARCH doc.description LIKE searchNormalized
  RETURN doc.description
```
{{< /tab >}}

{{< tab "`arangosearch` View" >}}
```aql
LET search = "%AY!"
LET searchNormalized = TOKENS(search, "only_norm")[0]
FOR doc IN imdb
  SEARCH ANALYZER(doc.description LIKE searchNormalized, "wildcard_norm")
  RETURN doc.description
```
{{< /tab >}}

{{< /tabs >}}

| Result |
|:-------|
| Pitch, the mean-spirited devil, is trying to ruin Christmas. Santa Claus teams up … to save the d**ay!** |
| Join Little Joe … all the way to Dodge Ball City -- with Little Joe's faith being tested every step of the w**ay!** |
| Surrounded by huge walls … they have to decide whether it's better to do things their way or God's w**ay!** |
| Tautly directed by Jack Sholder … It's Back to the Future meets Groundhog D**ay!** |

Match movie descriptions that contain the following pattern (case-insensitive):
a letter `C`, an arbitrary character, the letter `T`, an arbitrary character,
a space, two hyphens, and another space.

{{< tabs "view-definition">}}

{{< tab "`search-alias` View" >}}
LET search = "%C_T_ -- %"
LET searchNormalized = TOKENS(search, "only_norm")[0]
FOR doc IN imdb
  SEARCH doc.description LIKE searchNormalized
  RETURN {d: doc.description }
{{< /tab >}}

{{< tab "`arangosearch` View" >}}
LET search = "%C_T_ -- %"
LET searchNormalized = TOKENS(search, "only_norm")[0]
FOR doc IN imdb
  SEARCH ANALYZER(doc.description LIKE searchNormalized, "wildcard_norm")
  RETURN {d: doc.description }
{{< /tab >}}

{{< /tabs >}}

| Result |
|:-------|
| New York detective John McClane is back … -- and his beloved **city --** in a deadly game that demands their concentration. |
| When Madame Adelaide Bonfamille leaves her … domesticated house **cats --** the butler plots to steal the money and kidnaps the heirs, … |
| Join Little Joe … all the way to Dodge Ball **City --** with Little Joe's faith being tested every step of the way! |
