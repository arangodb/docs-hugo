---
title: String functions
menuTitle: String
weight: 50
description: >-
  For string processing, AQL offers the following functions
archetype: default
---
For string processing, AQL offers the following functions:

## CHAR_LENGTH()

`CHAR_LENGTH(str) → length`

Return the number of characters in `str` (not byte length).

| Input  | Length |
|--------|--------|
| String | Number of Unicode characters |
| Number | Number of Unicode characters that represent the number |
| Array  | Number of Unicode characters from the resulting stringification |
| Object | Number of Unicode characters from the resulting stringification |
| true   | 4 |
| false  | 5 |
| null   | 0 |

- **str** (string): a string. If a number is passed, it will be casted to string first.
- returns **length** (number): the character length of `str` (not byte length)

**Examples**

```aql
---
name: aqlCharLength_1
description: ''
---
  RETURN CHAR_LENGTH("foo")
```

```aql
---
name: aqlCharLength_2
description: ''
---
  LET value = {foo: "bar"}
  RETURN {
str: JSON_STRINGIFY(value),
len: CHAR_LENGTH(value)
  }
```

## CONCAT()

`CONCAT(value1, value2, ... valueN) → str`

Concatenate the values passed as `value1` to `valueN`.

- **values** (any, *repeatable*): elements of arbitrary type (at least 1)
- returns **str** (string): a concatenation of the elements. `null` values
  are ignored. Array and object values are JSON-encoded in their entirety.

**Examples**

```aql
---
name: aqlConcatStrings_1
description: ''
---
  RETURN CONCAT("foo", "bar", "baz")
```

```aql
---
name: aqlConcatNumbers_1
description: ''
---
  RETURN CONCAT(1, 2, 3)
```

```aql
---
name: aqlConcatPrimitiveTypes_1
description: ''
---
  RETURN CONCAT(null, false, 0, true, "")
```

```aql
---
name: aqlConcatCompoundTypes_1
description: ''
---
  RETURN CONCAT([5, 6], {foo: "bar"})
```


`CONCAT(anyArray) → str`

If a single array is passed to `CONCAT()`, its members are concatenated.

- **anyArray** (array): array with elements of arbitrary type
- returns **str** (string): a concatenation of the array elements. `null` values
  are ignored. Array and object values are JSON-encoded in their entirety.

```aql
---
name: aqlConcatStrings_2
description: ''
---
  RETURN CONCAT( [ "foo", "bar", "baz" ] )
```

```aql
---
name: aqlConcatNumbers_2
description: ''
---
  RETURN CONCAT( [1, 2, 3] )
```

```aql
---
name: aqlConcatPrimitiveTypes_2
description: ''
---
  RETURN CONCAT( [null, false, 0, true, ""] )
```

```aql
---
name: aqlConcatCompoundTypes_2
description: ''
---
  RETURN CONCAT( [[5, 6], {foo: "bar"}] )
```

## CONCAT_SEPARATOR()

`CONCAT_SEPARATOR(separator, value1, value2, ... valueN) → joinedString`

Concatenate the strings passed as arguments `value1` to `valueN` using the
*separator* string.

- **separator** (string): an arbitrary separator string
- **values** (string\|array, *repeatable*): strings or arrays of strings as multiple
  arguments (at least 1)
- returns **joinedString** (string): a concatenated string of the elements, using
  `separator` as separator string. `null` values are ignored. Array and object
  values are JSON-encoded in their entirety.

**Examples**

```aql
---
name: aqlConcatSeparatorStrings_1
description: ''
---
  RETURN CONCAT_SEPARATOR(", ", "foo", "bar", "baz")
```

```aql
---
name: aqlConcatSeparatorNumbers_1
description: ''
---
  RETURN CONCAT_SEPARATOR(", ", 1, 2, 3)
```

```aql
---
name: aqlConcatSeparatorPrimitiveTypes_1
description: ''
---
  RETURN CONCAT_SEPARATOR(", ", null, false, 0, true, "")
```

```aql
---
name: aqlConcatSeparatorCompoundTypes_1
description: ''
---
  RETURN CONCAT_SEPARATOR(", ", [5, 6], {foo: "bar"})
```


`CONCAT_SEPARATOR(separator, anyArray) → joinedString`

If a single array is passed as second argument to `CONCAT_SEPARATOR()`, its
members are concatenated.

- **separator** (string): an arbitrary separator string
- **anyArray** (array): array with elements of arbitrary type
- returns **joinedString** (string): a concatenated string of the elements, using
  `separator` as separator string. `null` values are ignored. Array and object
  values are JSON-encoded in their entirety.

```aql
---
name: aqlConcatSeparatorStrings_2
description: ''
---
  RETURN CONCAT_SEPARATOR(", ", ["foo", "bar", "baz"])
```

```aql
---
name: aqlConcatSeparatorNumbers_2
description: ''
---
  RETURN CONCAT_SEPARATOR(", ", [1, 2, 3])
```

```aql
---
name: aqlConcatSeparatorPrimitiveTypes_2
description: ''
---
  RETURN CONCAT_SEPARATOR(", ", [null, false, 0, true, ""])
```

```aql
---
name: aqlConcatSeparatorCompoundTypes_2
description: ''
---
  RETURN CONCAT_SEPARATOR(", ", [[5, 6], {foo: "bar"}])
```

## CONTAINS()

`CONTAINS(text, search, returnIndex) → match`

Check whether the string `search` is contained in the string `text`.
The string matching performed by `CONTAINS()` is case-sensitive.

To determine if or at which position a value is included in an **array**, see the
[POSITION() array function](array.md#position).

- **text** (string): the haystack
- **search** (string): the needle
- **returnIndex** (bool, *optional*): if set to `true`, the character position
  of the match is returned instead of a boolean. The default is `false`.
- returns **match** (bool\|number): by default, `true` is returned if `search`
  is contained in `text`, and `false` otherwise. With `returnIndex` set to `true`,
  the position of the first occurrence of `search` within `text` is returned 
  (starting at offset 0), or `-1` if it is not contained.

**Examples**

```aql
---
name: aqlContainsMatch
description: ''
---
  RETURN CONTAINS("foobarbaz", "bar")
```

```aql
---
name: aqlContains
description: ''
---
  RETURN CONTAINS("foobarbaz", "horse")
```

```aql
---
name: aqlContainsMatchIndex
description: ''
---
  RETURN CONTAINS("foobarbaz", "bar", true)
```

```aql
---
name: aqlContainsNoMatchIndex
description: ''
---
  RETURN CONTAINS("foobarbaz", "horse", true)
```

## COUNT()

This is an alias for [LENGTH()](#length).

## CRC32()

`CRC32(text) → hash`

Calculate the CRC32 checksum for `text` and return it in a hexadecimal
string representation. The polynomial used is `0x1EDC6F41`. The initial
value used is `0xFFFFFFFF`, and the final XOR value is also `0xFFFFFFFF`.

- **text** (string): a string
- returns **hash** (string): CRC32 checksum as hex string

**Examples**

```aql
---
name: aqlCrc32
description: ''
---
  RETURN CRC32("foobar")
```

## ENCODE_URI_COMPONENT()

`ENCODE_URI_COMPONENT(value) → encodedString`

Return the URI component-encoded string of `value`.

- **value** (string): a string
- returns **encodedString** (string): the URI component-encoded `value`

**Examples**

```aql
---
name: aqlEncodeUriComponent
description: ''
---
  RETURN ENCODE_URI_COMPONENT("fünf %")
```

## FIND_FIRST()

`FIND_FIRST(text, search, start, end) → position`

Return the position of the first occurrence of the string `search` inside the
string `text`. Positions start at 0.

- **text** (string): the haystack
- **search** (string): the needle
- **start** (number, *optional*): limit the search to a subset of the text,
  beginning at `start`
- **end** (number, *optional*): limit the search to a subset of the text,
  ending at `end`
- returns **position** (number): the character position of the match. If `search`
  is not contained in `text`, -1 is returned. If `search` is empty, `start` is returned.

**Examples**

```aql
---
name: aqlFindFirst_1
description: ''
---
  RETURN FIND_FIRST("foobarbaz", "ba")
```

```aql
---
name: aqlFindFirst_2
description: ''
---
  RETURN FIND_FIRST("foobarbaz", "ba", 4)
```

```aql
---
name: aqlFindFirst_3
description: ''
---
  RETURN FIND_FIRST("foobarbaz", "ba", 0, 3)
```

## FIND_LAST()

`FIND_LAST(text, search, start, end) → position`

Return the position of the last occurrence of the string `search` inside the
string `text`. Positions start at 0.

- **text** (string): the haystack
- **search** (string): the needle
- **start** (number, *optional*): limit the search to a subset of the text,
  beginning at *start*
- **end** (number, *optional*): limit the search to a subset of the text,
  ending at *end*
- returns **position** (number): the character position of the match. If `search`
  is not contained in `text`, -1 is returned.
  If `search` is empty, the string length is returned, or `end` + 1.

**Examples**

```aql
---
name: aqlFindLast_1
description: ''
---
  RETURN FIND_LAST("foobarbaz", "ba")
```

```aql
---
name: aqlFindLast_2
description: ''
---
  RETURN FIND_LAST("foobarbaz", "ba", 7)
```

```aql
---
name: aqlFindLast_3
description: ''
---
  RETURN FIND_LAST("foobarbaz", "ba", 0, 4)
```

## FNV64()

`FNV64(text) → hash`

Calculate the FNV-1A 64 bit hash for `text` and return it in a hexadecimal
string representation.

- **text** (string): a string
- returns **hash** (string): FNV-1A hash as hex string

**Examples**

```aql
---
name: aqlFnv64
description: ''
---
  RETURN FNV64("foobar")
```

## IPV4_FROM_NUMBER()

`IPV4_FROM_NUMBER(numericAddress) → stringAddress`

Converts a numeric IPv4 address value into its string representation.

- **numericAddress** (number): a numeric representation of an IPv4 address, for
  example produced by [IPV4_TO_NUMBER()](#ipv4_to_number). The number must be
  an unsigned integer between 0 and 4294967295 (both inclusive).
- returns **stringAddress** (string): the string representation of the IPv4
  address. If the input `numberAddress` is not a valid representation of an
  IPv4 address, the function returns `null` and produces a warning.

**Examples**

```aql
---
name: aqlIPv4FromNumber_1
description: ''
---
  RETURN IPV4_FROM_NUMBER(0)
```

```aql
---
name: aqlIPv4FromNumber_2
description: ''
---
  RETURN IPV4_FROM_NUMBER(134744072)
```

```aql
---
name: aqlIPv4FromNumber_3
description: ''
---
  RETURN IPV4_FROM_NUMBER(2130706433)
```

```aql
---
name: aqlIPv4FromNumber_4
description: ''
---
  RETURN IPV4_FROM_NUMBER(3232235521)
```

```aql
---
name: aqlIPv4FromNumber_5
description: ''
---
  RETURN IPV4_FROM_NUMBER(-23) // invalid, produces a warning
```

## IPV4_TO_NUMBER()

`IPV4_TO_NUMBER(stringAddress) → numericAddress`

Converts an IPv4 address string into its numeric representation.

- **stringAddress** (string): a string representing an IPv4 address
- returns **numericAddress** (number): the numeric representation of the IPv4
  address, as an unsigned integer. If the input `stringAddress` is not a valid
  representation of an IPv4 address, the function returns `null` and produces
  a warning.

**Examples**

```aql
---
name: aqlIPv4ToNumber_1
description: ''
---
  RETURN IPV4_TO_NUMBER("0.0.0.0")
```

```aql
---
name: aqlIPv4ToNumber_2
description: ''
---
  RETURN IPV4_TO_NUMBER("8.8.8.8")
```

```aql
---
name: aqlIPv4ToNumber_3
description: ''
---
  RETURN IPV4_TO_NUMBER("127.0.0.1")
```

```aql
---
name: aqlIPv4ToNumber_4
description: ''
---
  RETURN IPV4_TO_NUMBER("192.168.0.1")
```

```aql
---
name: aqlIPv4ToNumber_5
description: ''
---
  RETURN IPV4_TO_NUMBER("milk") // invalid, produces a warning
```

## IS_IPV4()

`IS_IPV4(value) → bool`

Check if an arbitrary string is suitable for interpretation as an IPv4 address.

- **value** (string): an arbitrary string
- returns **bool** (bool): `true` if `value` is a string that can be interpreted
  as an IPv4 address. To be considered valid, the string must contain of 4 octets
  of decimal numbers with 1 to 3 digits length each, allowing the values 0 to 255.
  The octets must be separated by periods and must not have padding zeroes.

**Examples**

```aql
---
name: aqlIsIPv4_1
description: ''
---
  RETURN IS_IPV4("127.0.0.1")
```

```aql
---
name: aqlIsIPv4_2
description: ''
---
  RETURN IS_IPV4("8.8.8.8")
```

```aql
---
name: aqlIsIPv4_3
description: ''
---
  RETURN IS_IPV4("008.008.008.008")
```

```aql
---
name: aqlIsIPv4_4
description: ''
---
  RETURN IS_IPV4("12345.2.3.4")
```

```aql
---
name: aqlIsIPv4_5
description: ''
---
  RETURN IS_IPV4("12.34")
```

```aql
---
name: aqlIsIPv4_6
description: ''
---
  RETURN IS_IPV4(8888)
```

## JSON_PARSE()

`JSON_PARSE(text) → value`

Return an AQL value described by the JSON-encoded input string.

- **text** (string): the string to parse as JSON
- returns **value** (any): the value corresponding to the given JSON text.
  For input values that are no valid JSON strings, the function will return `null`.

**Examples**

```aql
---
name: aqlJsonParse_1
description: ''
---
  RETURN JSON_PARSE("123")
```

```aql
---
name: aqlJsonParse_2
description: ''
---
  RETURN JSON_PARSE("[ true, false, null, -0.5 ]")
```

```aql
---
name: aqlJsonParse_3
description: ''
---
  RETURN JSON_PARSE('{"a": 1}')
```

```aql
---
name: aqlJsonParse_4
description: ''
---
  RETURN JSON_PARSE('"abc"')
```

```aql
---
name: aqlJsonParse_5
description: ''
---
  RETURN JSON_PARSE("abc") // invalid JSON
```

## JSON_STRINGIFY()

`JSON_STRINGIFY(value) → text`

Return a JSON string representation of the input value.

- **value** (any): the value to convert to a JSON string
- returns **text** (string): the JSON string representing `value`.
  For input values that cannot be converted to JSON, the function 
  will return `null`.

**Examples**

```aql
---
name: aqlJsonStringify_1
description: ''
---
  RETURN JSON_STRINGIFY(true)
```

```aql
---
name: aqlJsonStringify_2
description: ''
---
  RETURN JSON_STRINGIFY("abc")
```

```aql
---
name: aqlJsonStringify_3
description: ''
---
  RETURN JSON_STRINGIFY( [1, {'2': .5}] )
```

## LEFT()

`LEFT(value, n) → substring`

Return the `n` leftmost characters of the string `value`.

To return the rightmost characters, see [RIGHT()](#right).<br>
To take a part from an arbitrary position off the string,
see [SUBSTRING()](#substring).

- **value** (string): a string
- **n** (number): how many characters to return
- returns **substring** (string): at most `n` characters of `value`,
  starting on the left-hand side of the string

**Examples**

```aql
---
name: aqlLeft_1
description: ''
---
  RETURN LEFT("foobar", 3)
```

```aql
---
name: aqlLeft_2
description: ''
---
  RETURN LEFT("foobar", 10)
```

## LENGTH()

`LENGTH(str) → length`

Determine the character length of a string.

- **str** (string): a string. If a number is passed, it will be casted to string first.
- returns **length** (number): the character length of `str` (not byte length)

`LENGTH()` can also determine the [number of elements](array.md#length) in an array,
the [number of attribute keys](document-object.md#length) of an object / document and
the [amount of documents](miscellaneous.md#length) in a collection.

**Examples**

```aql
---
name: aqlLengthString_1
description: ''
---
  RETURN LENGTH("foobar")
```

```aql
---
name: aqlLengthString_2
description: ''
---
  RETURN LENGTH("电脑坏了")
```

## LEVENSHTEIN_DISTANCE()

`LEVENSHTEIN_DISTANCE(value1, value2) → distance`

Calculate the [Damerau-Levenshtein distance](https://en.wikipedia.org/wiki/Damerau%E2%80%93Levenshtein_distance)
between two strings.

- **value1** (string): a string
- **value2** (string): a string
- returns **distance** (number): calculated Damerau-Levenshtein distance
  between the input strings `value1` and `value2`

**Examples**

```aql
---
name: aqlLevenshteinDistance_1
description: ''
---
  RETURN LEVENSHTEIN_DISTANCE("foobar", "bar")
```

```aql
---
name: aqlLevenshteinDistance_2
description: ''
---
  RETURN LEVENSHTEIN_DISTANCE(" ", "")
```

```aql
---
name: aqlLevenshteinDistance_3
description: ''
---
  RETURN LEVENSHTEIN_DISTANCE("The quick brown fox jumps over the lazy dog", "The quick black dog jumps over the brown fox")
```

```aql
---
name: aqlLevenshteinDistance_4
description: ''
---
  RETURN LEVENSHTEIN_DISTANCE("der mötör trötet", "der trötet")
```

## LIKE()

`LIKE(text, search, caseInsensitive) → bool`

Check whether the pattern `search` is contained in the string `text`,
using wildcard matching.

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

The `LIKE()` function cannot be accelerated by any sort of index. However,
the [ArangoSearch `LIKE()` function](arangosearch.md#like) that
is used in the context of a `SEARCH` operation is backed by View indexes.

- **text** (string): the string to search in
- **search** (string): a search pattern that can contain the wildcard characters
  `%` (meaning any sequence of characters, including none) and `_` (any single
  character). Literal `%` and `_` must be escaped with backslashes.
  *search* cannot be a variable or a document attribute. The actual value must
  be present at query parse time already.
- **caseInsensitive** (bool, *optional*): if set to `true`, the matching will be
  case-insensitive. The default is `false`.
- returns **bool** (bool): `true` if the pattern is contained in `text`,
  and `false` otherwise

**Examples**

```aql
---
name: aqlLikeString_1
description: ''
---
  RETURN [
LIKE("cart", "ca_t"),
LIKE("carrot", "ca_t"),
LIKE("carrot", "ca%t")
  ]
```

```aql
---
name: aqlLikeString_2
description: ''
---
  RETURN [
LIKE("foo bar baz", "bar"),
LIKE("foo bar baz", "%bar%"),
LIKE("bar", "%bar%")
  ]
```

```aql
---
name: aqlLikeString_3
description: ''
---
  RETURN [
LIKE("FoO bAr BaZ", "fOo%bAz"),
LIKE("FoO bAr BaZ", "fOo%bAz", true)
  ]
```

## LOWER()

`LOWER(value) → lowerCaseString`

Convert upper-case letters in `value` to their lower-case counterparts.
All other characters are returned unchanged.

- **value** (string): a string
- returns **lowerCaseString** (string): `value` with upper-case characters converted
  to lower-case characters

**Examples**

```aql
---
name: aqlLower
description: ''
---
  RETURN LOWER("AVOcado")
```

## LTRIM()

`LTRIM(value, chars) → strippedString`

Return the string `value` with whitespace stripped from the start only.

To strip from the end only, see [RTRIM()](#rtrim).<br>
To strip both sides, see [TRIM()](#trim).

- **value** (string): a string
- **chars** (string, *optional*): override the characters that should
  be removed from the string. It defaults to `\r\n \t` (i.e. `0x0d`, `0x0a`,
  `0x20` and `0x09`).
- returns **strippedString** (string): `value` without `chars` at the
  left-hand side

```aql
---
name: aqlLtrim_1
description: ''
---
  RETURN LTRIM("foo bar")
```

```aql
---
name: aqlLtrim_2
description: ''
---
  RETURN LTRIM("  foo bar  ")
```

```aql
---
name: aqlLtrim_3
description: ''
---
  RETURN LTRIM("--==[foo-bar]==--", "-=[]")
```

## MD5()

`MD5(text) → hash`

Calculate the MD5 checksum for `text` and return it in a hexadecimal
string representation.

- **text** (string): a string
- returns **hash** (string): MD5 checksum as hex string

**Examples**

```aql
---
name: aqlMd5
description: ''
---
  RETURN MD5("foobar")
```

## NGRAM_POSITIONAL_SIMILARITY()

`NGRAM_POSITIONAL_SIMILARITY(input, target, ngramSize) → similarity`

Calculates the [_n_-gram similarity](https://webdocs.cs.ualberta.ca/~kondrak/papers/spire05.pdf)
between `input` and `target` using _n_-grams with minimum and maximum length of
`ngramSize`.

The similarity is calculated by counting how long the longest sequence of
matching _n_-grams is, divided by the **longer argument's** total _n_-gram count.
Partially matching _n_-grams are counted, whereas
[NGRAM_SIMILARITY()](#ngram_similarity) counts only fully matching _n_-grams.

The _n_-grams for both input and target are calculated on the fly,
not involving Analyzers.

- **input** (string): source text to be tokenized into _n_-grams
- **target** (string): target text to be tokenized into _n_-grams
- **ngramSize** (number): minimum as well as maximum _n_-gram length
- returns **similarity** (number): value between `0.0` and `1.0`

**Examples**

```aql
---
name: aqlNgramPositionalSimilarity
description: ''
---
  RETURN [
NGRAM_POSITIONAL_SIMILARITY("quick fox", "quick foxx", 2),
NGRAM_POSITIONAL_SIMILARITY("quick fox", "quick foxx", 3),
NGRAM_POSITIONAL_SIMILARITY("quick fox", "quirky fox", 2),
NGRAM_POSITIONAL_SIMILARITY("quick fox", "quirky fox", 3)
  ]
```

## NGRAM_SIMILARITY()

`NGRAM_SIMILARITY(input, target, ngramSize) → similarity`

Calculates [_n_-gram similarity](https://webdocs.cs.ualberta.ca/~kondrak/papers/spire05.pdf)
between `input` and `target` using _n_-grams with minimum and maximum length of
`ngramSize`.

The similarity is calculated by counting how long the longest sequence of
matching _n_-grams is, divided by **target's** total _n_-gram count.
Only fully matching _n_-grams are counted, whereas
[NGRAM_POSITIONAL_SIMILARITY()](#ngram_positional_similarity) counts partially
matching _n_-grams too. This behavior matches the similarity measure used in
[NGRAM_MATCH()](arangosearch.md#ngram_match).

The _n_-grams for both input and target are calculated on the fly, not involving
Analyzers.

- **input** (string): source text to be tokenized into _n_-grams
- **target** (string): target text to be tokenized into _n_-grams
- **ngramSize** (number): minimum as well as maximum _n_-gram length
- returns **similarity** (number): value between `0.0` and `1.0`

**Examples**

```aql
---
name: aqlNgramSimilarity
description: ''
---
  RETURN [
NGRAM_SIMILARITY("quick fox", "quick foxx", 2),
NGRAM_SIMILARITY("quick fox", "quick foxx", 3),
NGRAM_SIMILARITY("quick fox", "quirky fox", 2),
NGRAM_SIMILARITY("quick fox", "quirky fox", 3)
  ]
```

## RANDOM_TOKEN()

`RANDOM_TOKEN(length) → randomString`

Generate a pseudo-random token string with the specified length.
The algorithm for token generation should be treated as opaque.

- **length** (number): desired string length for the token. It must be greater
  or equal to 0 and at most 65536. A `length` of 0 returns an empty string.
- returns **randomString** (string): a generated token consisting of lowercase
  letters, uppercase letters and numbers

**Examples**

```aql
---
name: aqlRandomToken
description: ''
---
  RETURN [
RANDOM_TOKEN(8),
RANDOM_TOKEN(8)
  ]
```

## REGEX_MATCHES()

`REGEX_MATCHES(text, regex, caseInsensitive) → stringArray`

Return the matches in the given string `text`, using the `regex`.

- **text** (string): the string to search in
- **regex** (string): a [regular expression](#regular-expression-syntax)
  to use for matching the `text`
- **caseInsensitive** (bool, *optional*): if set to `true`, the matching will be
  case-insensitive. The default is `false`.
- returns **stringArray** (array): an array of strings containing the matches,
  or `null` and a warning if the expression is invalid

**Examples**

```aql
---
name: aqlRegexMatches_1
description: ''
---
  RETURN REGEX_MATCHES("My-us3r_n4m3", "^[a-z0-9_-]{3,16}$", true)
```

```aql
---
name: aqlRegexMatches_2
description: ''
---
  RETURN REGEX_MATCHES("#4d82h4", "^#?([a-f0-9]{6}|[a-f0-9]{3})$", true)
```

```aql
---
name: aqlRegexMatches_3
description: ''
---
  RETURN REGEX_MATCHES("john@doe.com", "^([a-z0-9_\\\\.-]+)@([\\\\da-z-]+)\\\\.([a-z\\\\.]{2,6})$", false)
```

## REGEX_SPLIT()

`REGEX_SPLIT(text, splitExpression, caseInsensitive, limit) → stringArray`

Split the given string `text` into a list of strings at positions where
`splitExpression` matches.

- **text** (string): the string to split
- **splitExpression** (string): a [regular expression](#regular-expression-syntax)
  to use for splitting the `text`. You can define a capturing group to keep matches
- **caseInsensitive** (bool, *optional*): if set to `true`, the matching will be
  case-insensitive. The default is `false`.
- **limit** (number, *optional*): limit the number of split values in the result.
  If no `limit` is given, the number of splits returned is not bounded.
- returns **stringArray** (array): an array of strings, or `null` and a warning
  if the expression is invalid

**Examples**

```aql
---
name: aqlRegexSplit_1
description: ''
---
  RETURN REGEX_SPLIT("This is a line.\\n This is yet another line\\r\\n This again is a line.\\r Mac line ", "\\\\.?\\r\\n|\\r|\\n")
```

```aql
---
name: aqlRegexSplit_2
description: ''
---
  RETURN REGEX_SPLIT("hypertext language, programming", "[\\\\s, ]+")
```

```aql
---
name: aqlRegexSplit_3
description: ''
---
  RETURN [
REGEX_SPLIT("Capture the article", "(the)"),
REGEX_SPLIT("Don't capture the article", "the")
  ]
```

```aql
---
name: aqlRegexSplit_4
description: ''
---
  RETURN REGEX_SPLIT("cA,Bc,A,BcA,BcA,Bc", "a,b", true, 3)
```

## REGEX_TEST()

`REGEX_TEST(text, search, caseInsensitive) → bool`

Check whether the pattern `search` is contained in the string `text`,
using regular expression matching.

- **text** (string): the string to search in
- **search** (string): a [regular expression](#regular-expression-syntax)
  search pattern
- **caseInsensitive** (bool, *optional*): if set to `true`, the matching will be
  case-insensitive. The default is `false`.
- returns **bool** (bool): `true` if the pattern is contained in `text`,
  and `false` otherwise, or `null` and a warning if the expression is invalid

**Examples**

```aql
---
name: aqlRegexTest_1
description: ''
---
  RETURN REGEX_TEST("the quick brown fox", "the.*fox")
```

```aql
---
name: aqlRegexTest_2
description: ''
---
  RETURN REGEX_TEST("the quick brown fox", "^(a|the)\\\\s+(quick|slow).*f.x$")
```

```aql
---
name: aqlRegexTest_3
description: ''
---
  RETURN REGEX_TEST("the\\nquick\\nbrown\\nfox", "^the(\\n[a-w]+)+\\nfox$")
```

## REGEX_REPLACE()

`REGEX_REPLACE(text, search, replacement, caseInsensitive) → string`

Replace the pattern `search` with the string `replacement` in the string
`text`, using regular expression matching.

- **text** (string): the string to search in
- **search** (string): a [regular expression](#regular-expression-syntax)
  search pattern
- **replacement** (string): the string to replace the `search` pattern with
- **caseInsensitive** (bool, *optional*): if set to `true`, the matching will be
  case-insensitive. The default is `false`.
- returns **string** (string): the string `text` with the `search` regex
  pattern replaced with the `replacement` string wherever the pattern exists
  in `text`, or `null` and a warning if the expression is invalid

**Examples**

```aql
---
name: aqlRegexReplace_1
description: ''
---
  RETURN REGEX_REPLACE("the quick brown fox", "the.*fox", "jumped over")
```

```aql
---
name: aqlRegexReplace_2
description: ''
---
  RETURN REGEX_REPLACE("An Avocado", "a", "_")
```

```aql
---
name: aqlRegexReplace_3
description: ''
---
  RETURN REGEX_REPLACE("An Avocado", "a", "_", true)
```

## REVERSE()

`REVERSE(value) → reversedString`

Return the reverse of the string `value`.

- **value** (string): a string
- returns **reversedString** (string): a new string with the characters in
  reverse order

**Examples**

```aql
---
name: aqlReverse_1
description: ''
---
  RETURN REVERSE("foobar")
```

```aql
---
name: aqlReverse_2
description: ''
---
  RETURN REVERSE("电脑坏了")
```

## RIGHT()

`RIGHT(value, length) → substring`

Return the `length` rightmost characters of the string `value`.

To return the leftmost characters, see [LEFT()](#left).<br>
To take a part from an arbitrary position off the string,
see [SUBSTRING()](#substring).

- **value** (string): a string
- **length** (number): how many characters to return
- returns **substring** (string): at most `length` characters of `value`,
  starting on the right-hand side of the string

**Examples**

```aql
---
name: aqlRight_1
description: ''
---
  RETURN RIGHT("foobar", 3)
```

```aql
---
name: aqlRight_2
description: ''
---
  RETURN RIGHT("foobar", 10)
```

## RTRIM()

`RTRIM(value, chars) → strippedString`

Return the string `value` with whitespace stripped from the end only.

To strip from the start only, see [LTRIM()](#ltrim).<br>
To strip both sides, see [TRIM()](#trim).

- **value** (string): a string
- **chars** (string, *optional*): override the characters that should
  be removed from the string. It defaults to `\r\n \t` (i.e. `0x0d`, `0x0a`,
  `0x20` and `0x09`).
- returns **strippedString** (string): `value` without `chars` at the
  right-hand side

**Examples**

```aql
---
name: aqlRtrim_1
description: ''
---
  RETURN RTRIM("foo bar")
```

```aql
---
name: aqlRtrim_2
description: ''
---
  RETURN RTRIM("  foo bar  ")
```

```aql
---
name: aqlRtrim_3
description: ''
---
  RETURN RTRIM("--==[foo-bar]==--", "-=[]")
```

## SHA1()

`SHA1(text) → hash`

Calculate the SHA1 checksum for `text` and returns it in a hexadecimal
string representation.

- **text** (string): a string
- returns **hash** (string): SHA1 checksum as hex string

**Examples**

```aql
---
name: aqlSha1
description: ''
---
  RETURN SHA1("foobar")
```

## SHA256()

`SHA256(text) → hash`

Calculate the SHA256 checksum for `text` and return it in a hexadecimal
string representation.

- **text** (string): a string
- returns **hash** (string): SHA256 checksum as hex string

**Examples**

```aql
---
name: aqlSha256
description: ''
---
  RETURN SHA256("foobar")
```

## SHA512()

`SHA512(text) → hash`

Calculate the SHA512 checksum for `text` and return it in a hexadecimal
string representation.

- **text** (string): a string
- returns **hash** (string): SHA512 checksum as hex string

**Examples**

```aql
---
name: aqlSha512
description: ''
---
  RETURN SHA512("foobar")
```

## SOUNDEX()

`SOUNDEX(value) → soundexString`

Return the [Soundex](https://en.wikipedia.org/wiki/Soundex)
fingerprint of `value`.

- **value** (string): a string
- returns **soundexString** (string): a Soundex fingerprint of `value`

**Examples**

```aql
---
name: aqlSoundex
description: ''
---
  RETURN [
SOUNDEX("example"),
SOUNDEX("ekzampul"),
SOUNDEX("soundex"),
SOUNDEX("sounteks")
  ]
```

## SPLIT()

`SPLIT(value, separator, limit) → strArray`

Split the given string `value` into a list of strings, using the `separator`.

To split a document identifier (`_id`) into the collection name and document key
(`_key`), you should use the more optimized
[`PARSE_IDENTIFIER()` function](document-object.md#parse_identifier).

- **value** (string): a string
- **separator** (string): either a string or a list of strings. If `separator` is
  an empty string, `value` will be split into a list of characters. If no `separator`
  is specified, `value` will be returned as array.
- **limit** (number, *optional*): limit the number of split values in the result.
  If no `limit` is given, the number of splits returned is not bounded.
- returns **strArray** (array): an array of strings

**Examples**

```aql
---
name: aqlSplit_1
description: ''
---
  RETURN SPLIT( "foo-bar-baz", "-" )
```

```aql
---
name: aqlSplit_2
description: ''
---
  RETURN SPLIT( "foo-bar-baz", "-", 1 )
```

```aql
---
name: aqlSplit_3
description: ''
---
  RETURN SPLIT( "foo, bar & baz", [ ", ", " & " ] )
```

## STARTS_WITH()

`STARTS_WITH(text, prefix) → startsWith`

Check whether the given string starts with `prefix`.

There is a corresponding [`STARTS_WITH()` ArangoSearch function](arangosearch.md#starts_with)
that can utilize View indexes.

- **text** (string): a string to compare against
- **prefix** (string): a string to test for at the start of the text
- returns **startsWith** (bool): whether the text starts with the given prefix

**Examples**

```aql
---
name: aqlStartsWith_1
description: ''
---
  RETURN STARTS_WITH("foobar", "foo")
```

```aql
---
name: aqlStartsWith_2
description: ''
---
  RETURN STARTS_WITH("foobar", "baz")
```


`STARTS_WITH(text, prefixes, minMatchCount) → startsWith`

Check if the given string starts with one of the `prefixes`.

- **text** (string): a string to compare against
- **prefixes** (array): an array of strings to test for at the start of the text
- **minMatchCount** (number, _optional_): minimum number of prefixes that
  should be satisfied. The default is `1` and it is the only meaningful value
  unless `STARTS_WITH()` is used in the context of a `SEARCH` expression where
  an attribute can have multiple values at the same time
- returns **startsWith** (bool): whether the text starts with at least
  *minMatchCount* of the given prefixes

**Examples**

```aql
---
name: aqlStartsWith_3
description: ''
---
  RETURN STARTS_WITH("foobar", ["bar", "foo"])
```

```aql
---
name: aqlStartsWith_4
description: ''
---
  RETURN STARTS_WITH("foobar", ["bar", "baz"])
```

## SUBSTITUTE()

`SUBSTITUTE(value, search, replace, limit) → substitutedString`

Replace search values in the string `value`.

- **value** (string): a string
- **search** (string\|array): if `search` is a string, all occurrences of
  `search` will be replaced in `value`. If `search` is an array of strings,
  each occurrence of a value contained in `search` will be replaced by the
  corresponding array element in `replace`. If `replace` has less list items
  than `search`, occurrences of unmapped `search` items will be replaced by an
  empty string.
- **replace** (string\|array, *optional*): a replacement string, or an array of
  strings to replace the corresponding elements of `search` with. Can have less
  elements than `search` or be left out to remove matches. If `search` is an array
  but `replace` is a string, then all matches will be replaced with `replace`.
- **limit** (number, *optional*): cap the number of replacements to this value
- returns **substitutedString** (string): a new string with matches replaced
  (or removed)

**Examples**

```aql
---
name: aqlSubstitute_1
description: ''
---
  RETURN SUBSTITUTE( "the quick brown foxx", "quick", "lazy" )
```

```aql
---
name: aqlSubstitute_2
description: ''
---
  RETURN SUBSTITUTE( "the quick brown foxx", [ "quick", "foxx" ], [ "slow", "dog" ] )
```

```aql
---
name: aqlSubstitute_3
description: ''
---
  RETURN SUBSTITUTE( "the quick brown foxx", [ "the", "foxx" ], [ "that", "dog" ], 1 )
```

```aql
---
name: aqlSubstitute_4
description: ''
---
  RETURN SUBSTITUTE( "the quick brown foxx", [ "the", "quick", "foxx" ], [ "A", "VOID!" ] )
```

```aql
---
name: aqlSubstitute_5
description: ''
---
  RETURN SUBSTITUTE( "the quick brown foxx", [ "quick", "foxx" ], "xx" )
```


`SUBSTITUTE(value, mapping, limit) → substitutedString`

Alternatively, `search` and `replace` can be specified in a combined value.

- **value** (string): a string
- **mapping** (object): a lookup map with search strings as keys and replacement
  strings as values. Empty strings and `null` as values remove matches.
  Note that there is no defined order in which the mapping is processed. In case
  of overlapping searches and substitutions, one time the first entry may win,
  another time the second. If you need to ensure a specific order then choose
  the array-based variant of this function
- **limit** (number, *optional*): cap the number of replacements to this value
- returns **substitutedString** (string): a new string with matches replaced
  (or removed)

**Examples**

```aql
---
name: aqlSubstitute_6
description: ''
---
  RETURN SUBSTITUTE("the quick brown foxx", {
"quick": "small",
"brown": "slow",
"foxx": "ant"
  })
```

```aql
---
name: aqlSubstitute_7
description: ''
---
  RETURN SUBSTITUTE("the quick brown foxx", { 
"quick": "",
"brown": null,
"foxx": "ant"
  })
```

```aql
---
name: aqlSubstitute_8
description: ''
---
  RETURN SUBSTITUTE("the quick brown foxx", {
"quick": "small",
"brown": "slow",
"foxx": "ant"
  }, 2)
```

## SUBSTRING()

`SUBSTRING(value, offset, length) → substring`

Return a substring of `value`.

To return the rightmost characters, see [RIGHT()](#right).<br>
To return the leftmost characters, see [LEFT()](#left).

- **value** (string): a string
- **offset** (number): start at this character of the string. Offsets start at 0.
  Negative offsets start from the end of the string. The last character has an
  index of -1
- **length** (number, *optional*): take this many characters. Omit the parameter
  to get the substring from `offset` to the end of the string
- returns **substring** (string): a substring of `value`

**Examples**

Get a substring starting at the 6th character and until the end of the string:

```aql
---
name: aqlSubstring_1
description: ''
---
  RETURN SUBSTRING("Holy Guacamole!", 5)
```

Get a 4 characters long substring, starting at the 11th character:

```aql
---
name: aqlSubstring_2
description: ''
---
  RETURN SUBSTRING("Holy Guacamole!", 10, 4)
```

Get a 4 characters long substring, starting at the 5th from last character:

```aql
---
name: aqlSubstring_3
description: ''
---
  RETURN SUBSTRING("Holy Guacamole!", -5, 4)
```

## SUBSTRING_BYTES()

`SUBSTRING_BYTES(value, offset, length) → substring`

Return a substring of `value`, using an `offset` and `length` in bytes instead
of in number of characters.

This function is intended to be used together with the
[`OFFSET_INFO()` function](arangosearch.md#offset_info) for
[search highlighting](../../index-and-search/arangosearch/search-highlighting.md).

- **value** (string): a string
- **offset** (number): start at this byte of the UTF-8 encoded string.
  Offsets start at 0. Negative offsets start from the end of the string.
  The last byte has an index of -1. The offset needs to coincide with the
  beginning of a character's byte sequence
- **length** (number, *optional*): take this many bytes. Omit the parameter to
  get the substring from `offset` to the end of the string. The end byte
  (`offset` + `length`) needs to coincide with the end of a character's
  byte sequence
- returns **substring** (string\|null): a substring of `value`, or `null` and
  produces a warning if the start or end byte is in the middle of a character's
  byte sequence

**Examples**

Get a substring starting at the 11th byte and until the end of the string.
Note that the heart emoji is comprised of two characters, the Black Heart Symbol
and the Variation Selector-16, each encoded using 3 bytes in UTF-8:

```aql
---
name: aqlSubstringBytes_1
description: ''
---
  RETURN SUBSTRING_BYTES("We ❤️ avocado!", 10)
```

Get a 3 bytes long substring starting at the 3rd byte, extracting the
Black Heart Symbol:

```aql
---
name: aqlSubstringBytes_2
description: ''
---
  RETURN SUBSTRING_BYTES("We ❤️ avocado!", 3, 3)
```

Get a 6 bytes long substring starting at the 15th byte from last, extracting the
heart emoji:

```aql
---
name: aqlSubstringBytes_3
description: ''
---
  RETURN SUBSTRING_BYTES("We ❤️ avocado!", -15, 6)
```

Try to get a 4 bytes long substring starting at the 15th byte from last,
resulting in a `null` value and a warning because the substring contains an
incomplete UTF-8 byte sequence:

```aql
---
name: aqlSubstringBytes_4
description: ''
---
  RETURN SUBSTRING_BYTES("We ❤️ avocado!", -15, 4)
```

## TOKENS()

`TOKENS(input, analyzer) → tokenArray`

Split the `input` string(s) with the help of the specified `analyzer` into an
array. The resulting array can be used in `FILTER` or `SEARCH` statements with
the `IN` operator, but also be assigned to variables and returned. This can be
used to better understand how a specific Analyzer processes an input value.

It has a regular return value unlike all other ArangoSearch AQL functions and
is thus not limited to `SEARCH` operations. It is independent of Views.
A wrapping `ANALYZER()` call in a search expression does not affect the
`analyzer` argument nor allow you to omit it.

- **input** (string\|array): text to tokenize. Accepts recursive arrays of
  strings.
- **analyzer** (string): name of an [Analyzer](../../index-and-search/analyzers.md).
- returns **tokenArray** (array): array of strings with zero or more elements,
  each element being a token.

**Examples**

Example query showcasing the `"text_de"` Analyzer (tokenization with stemming,
case conversion and accent removal for German text):

```aql
---
name: aqlTokens_1
description: ''
---
  RETURN TOKENS("Lörem ipsüm, DOLOR SIT Ämet.", "text_de")
```

To search a View for documents where the `text` attribute contains certain
words/tokens in any order, you can use the function like this:

```aql
FOR doc IN viewName
  SEARCH ANALYZER(doc.text IN TOKENS("dolor amet lorem", "text_en"), "text_en")
  RETURN doc
```

It will match `{ "text": "Lorem ipsum, dolor sit amet." }` for instance. If you
want to search for tokens in a particular order, use
[PHRASE()](arangosearch.md#phrase) instead.

If an array of strings is passed as first argument, then each string is
tokenized individually and an array with the same nesting as the input array
is returned:

```aql
---
name: aqlTokens_2
description: ''
---
  RETURN TOKENS("quick brown fox", "text_en")
```

```aql
---
name: aqlTokens_3
description: ''
---
  RETURN TOKENS(["quick brown", "fox"], "text_en")
```

```aql
---
name: aqlTokens_4
description: ''
---
  RETURN TOKENS(["quick brown", ["fox"]], "text_en")
```

In most cases you will want to flatten the resulting array for further usage,
because nested arrays are not accepted in `SEARCH` statements such as
`<array> ALL IN doc.<attribute>`:

```aql
LET tokens = TOKENS(["quick brown", ["fox"]], "text_en") // [ ["quick", "brown"], [["fox"]] ]
LET tokens_flat = FLATTEN(tokens, 2)                     // [ "quick", "brown", "fox" ]
FOR doc IN myView SEARCH ANALYZER(tokens_flat ALL IN doc.title, "text_en") RETURN doc
```

## TO_BASE64()

`TO_BASE64(value) → encodedString`

Return the Base64 representation of `value`.

- **value** (string): a string
- returns **encodedString** (string): a Base64 representation of `value`

**Examples**

```aql
---
name: aqlToBase64
description: ''
---
  RETURN [
TO_BASE64("ABC."),
TO_BASE64("123456")
  ]
```

## TO_HEX()

`TO_HEX(value) → hexString`

Return the hexadecimal representation of `value`.

- **value** (string): a string
- returns **hexString** (string): a hexadecimal representation of `value`

**Examples**

```aql
---
name: aqlToHex
description: ''
---
  RETURN [
TO_HEX("ABC."),
TO_HEX("ü")
  ]
```

## TRIM()

`TRIM(value, type) → strippedString`

Return the string `value` with whitespace stripped from the start and/or end.

The optional `type` parameter specifies from which parts of the string the
whitespace is stripped. [LTRIM()](#ltrim)
and [RTRIM()](#rtrim) are preferred
however.

- **value** (string): a string
- **type** (number, *optional*): strip whitespace from the
  - `0` – start and end of the string (default)
  - `1` – start of the string only
  - `2` – end of the string only


`TRIM(value, chars) → strippedString`

Return the string `value` with whitespace stripped from the start and end.

- **value** (string): a string
- **chars** (string, *optional*): override the characters that should
  be removed from the string. It defaults to `\r\n \t` (i.e. `0x0d`, `0x0a`,
  `0x20` and `0x09`).
- returns **strippedString** (string): `value` without `chars` on both sides

**Examples**

```aql
---
name: aqlTrim_1
description: ''
---
  RETURN TRIM("foo bar")
```

```aql
---
name: aqlTrim_2
description: ''
---
  RETURN TRIM("  foo bar  ")
```

```aql
---
name: aqlTrim_3
description: ''
---
  RETURN TRIM("--==[foo-bar]==--", "-=[]")
```

```aql
---
name: aqlTrim_4
description: ''
---
  RETURN TRIM("  foobar\\t \\r\\n ")
```

```aql
---
name: aqlTrim_5
description: ''
---
  RETURN TRIM(";foo;bar;baz, ", ",; ")
```

## UPPER()

`UPPER(value) → upperCaseString`

Convert lower-case letters in `value` to their upper-case counterparts.
All other characters are returned unchanged.

- **value** (string): a string
- returns **upperCaseString** (string): `value` with lower-case characters converted
  to upper-case characters

**Examples**

```aql
---
name: aqlUpper
description: ''
---
  RETURN UPPER("AVOcado")
```

## UUID()

`UUID() → UUIDString`

Return a universally unique identifier value.

- returns **UUIDString** (string): a universally unique identifier

**Examples**

```aql
---
name: aqlUuid
description: ''
---
  FOR i IN 1..3
RETURN UUID()
```

## Regular Expression Syntax

A regular expression may consist of literal characters and the following 
characters and sequences:

- `.` – the dot matches any single character except line terminators.
  To include line terminators, use `[\s\S]` instead to simulate `.` with *DOTALL* flag.
- `\d` – matches a single digit, equivalent to `[0-9]`
- `\s` – matches a single whitespace character
- `\S` – matches a single non-whitespace character
- `\b` – matches a word boundary. This match is zero-length
- `\B` – Negation of `\b`. The match is zero-length
- `[xyz]` – set of characters. Matches any of the enclosed characters
  (here: *x*, *y*, or *z*)
- `[^xyz]` – negated set of characters. Matches any other character than the
  enclosed ones (i.e. anything but *x*, *y*, or *z* in this case)
- `[x-z]` – range of characters. Matches any of the characters in the 
  specified range, e.g. `[0-9A-F]` to match any character in
  *0123456789ABCDEF*
- `[^x-z]` – negated range of characters. Matches any other character than the
  ones specified in the range
- `(xyz)` – defines and matches a pattern group. Also defines a capturing group.
- `(?:xyz)` – defines and matches a pattern group without capturing the match
- `(xy|z)` – matches either *xy* or *z*
- `^` – matches the beginning of the string (e.g. `^xyz`)
- `$` – matches the end of the string (e.g. `xyz$`)

To literally match one of the characters that have a special meaning in regular
expressions (`.`, `*`, `?`, `[`, `]`, `(`, `)`, `{`, `}`, `^`, `$`, and `\`)
you may need to escape the character with a backslash, which typically requires
escaping itself. The backslash of shorthand character classes like `\d`, `\s`,
and `\b` counts as literal backslash. The backslash of JSON escape sequences
like `\t` (tabulation), `\r` (carriage return), and `\n` (line feed) does not,
however.

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

Characters and sequences may optionally be repeated using the following
quantifiers:

- `x?` – matches one or zero occurrences of *x*
- `x*` – matches zero or more occurrences of *x* (greedy)
- `x+` – matches one or more occurrences of *x* (greedy)
- `x*?` – matches zero or more occurrences of *x* (non-greedy)
- `x+?` – matches one or more occurrences of *x* (non-greedy)
- `x{y}` – matches exactly *y* occurrences of *x*
- `x{y,z}` – matches between *y* and *z* occurrences of *x*
- `x{y,}` – matches at least *y* occurrences of *x*

Note that `xyz+` matches *xyzzz*, but if you want to match *xyzxyz* instead,
you need to define a pattern group by wrapping the sub-expression in parentheses
and place the quantifier right behind it, like `(xyz)+`.
