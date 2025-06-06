---
title: AQL Syntax
menuTitle: Syntax
weight: 5
description: >-
  Query types, whitespace, comments, keywords, and names in the AQL language
  explained
---
## Query types

An AQL query must either return a result (indicated by usage of the `RETURN`
keyword) or execute a data-modification operation (indicated by usage
of one of the keywords `INSERT`, `UPDATE`, `REPLACE`, `REMOVE` or `UPSERT`). The AQL
parser will return an error if it detects more than one data-modification 
operation in the same query or if it cannot figure out if the query is meant
to be a data retrieval or a modification operation.

AQL only allows **one** query in a single query string; thus semicolons to
indicate the end of one query and separate multiple queries (as seen in SQL) are
not allowed.

## Whitespace

Whitespace (blanks, carriage returns, line feeds, and tab stops) can be used
in the query text to increase its readability. Tokens have to be separated by
any number of whitespace. Whitespace within strings or names must be enclosed
in quotes in order to be preserved.

## Comments

Comments can be embedded at any position in a query. The text contained in the
comment is ignored by the AQL parser.

Multi-line comments cannot be nested, which means subsequent comment starts within
comments are ignored, comment ends will end the comment.

AQL supports two types of comments:

- Single line comments: These start with a double forward slash and end at
  the end of the line, or the end of the query string (whichever is first).
- Multi line comments: These start with a forward slash and asterisk, and
  end with an asterisk and a following forward slash. They can span as many
  lines as necessary.

```aql
/* this is a comment */ RETURN 1
/* these */ RETURN /* are */ 1 /* multiple */ + /* comments */ 1
/* this is
   a multi line
   comment */
// a single line comment
```

## Keywords

On the top level, AQL offers the following
[high-level operations](../high-level-operations/_index.md):

| Operation | Description
|:----------|:-----------
| `FOR`     | Array iteration
| `RETURN`  | Results projection
| `FILTER`  | Non-View results filtering
| `SEARCH`  | View results filtering
| `SORT`    | Result sorting
| `LIMIT`   | Result slicing
| `LET`     | Variable assignment
| `COLLECT` | Result grouping
| `WINDOW`  | Aggregations over related rows
| `INSERT`  | Insertion of new documents
| `UPDATE`  | (Partial) update of existing documents
| `REPLACE` | Replacement of existing documents
| `REMOVE`  | Removal of existing documents
| `UPSERT`  | Insertion of new or update of existing documents
| `WITH`    | Collection declaration

Each of the above operations can be initiated in a query by using a keyword of
the same name. An AQL query can (and typically does) consist of multiple of the
above operations.

An example AQL query may look like this:

```aql
FOR u IN users
  FILTER u.type == "newbie" && u.active == true
  RETURN u.name
```

In this example query, the terms `FOR`, `FILTER`, and `RETURN` initiate the
higher-level operation according to their name. These terms are also keywords,
meaning that they have a special meaning in the language.

For example, the query parser will use the keywords to find out which high-level
operations to execute. That also means keywords can only be used at certain
locations in a query. This also makes all keywords **reserved words** that must
not be used for other purposes than they are intended for.

For example, it is not possible to use a keyword as literal unquoted string
(identifier) for a collection or attribute name. If a collection or attribute
needs to have the same name as a keyword, then the collection or attribute name
needs to be quoted in the query (also see [Names](#names)).

Keywords are case-insensitive, meaning they can be specified in lower, upper, or
mixed case in queries. In this documentation, all keywords are written in upper
case to make them distinguishable from other query parts.

There are a few more keywords in addition to the higher-level operation keywords.
Additional keywords may be added in future versions of ArangoDB.
The complete list of keywords is currently:

- `AGGREGATE`
- `ALL`
- `ALL_SHORTEST_PATHS`
- `AND`
- `ANY`
- `ASC`
- `COLLECT`
- `DESC`
- `DISTINCT`
- `FALSE`
- `FILTER`
- `FOR`
- `GRAPH`
- `IN`
- `INBOUND`
- `INSERT`
- `INTO`
- `K_PATHS`
- `K_SHORTEST_PATHS`
- `LET`
- `LIKE`
- `LIMIT`
- `NONE`
- `NOT`
- `NULL`
- `OR`
- `OUTBOUND`
- `REMOVE`
- `REPLACE`
- `RETURN`
- `SHORTEST_PATH`
- `SORT`
- `TRUE`
- `UPDATE`
- `UPSERT`
- `WINDOW`
- `WITH`
{.columns-3}

On top of that, there are a few words used in language constructs which are not
reserved keywords. You can use them as collection or attribute names
without having to quote them. The query parser can identify them as keyword-like
based on the context:

- `KEEP` –
  [COLLECT](../high-level-operations/collect.md#discarding-obsolete-variables)
  operation variant
- `COUNT` –
  [COLLECT](../high-level-operations/collect.md#group-length-calculation)
  operation variant (`WITH COUNT INTO`)
- `OPTIONS` –
  [FOR](../high-level-operations/for.md#options) /
  [SEARCH](../high-level-operations/search.md#search-options) /
  [COLLECT](../high-level-operations/collect.md#collect-options) /
  [INSERT](../high-level-operations/insert.md#query-options) /
  [UPDATE](../high-level-operations/update.md#query-options) /
  [REPLACE](../high-level-operations/replace.md#query-options) /
  [UPSERT](../high-level-operations/upsert.md#query-options) /
  [REMOVE](../high-level-operations/remove.md#query-options) operation /
  [Graph Traversal](../graphs/traversals.md) /
  [Shortest Path](../graphs/shortest-path.md#path-search-options) /
  [k Shortest Paths](../graphs/k-shortest-paths.md#path-search-options) /
- `PRUNE` –
  [Graph Traversal](../graphs/traversals.md#pruning) (`FOR` operation variant)
- `SEARCH` –
  [SEARCH](../high-level-operations/search.md) operation
- `TO` –
  [Shortest Path](../graphs/shortest-path.md) /
  [All Shortest Paths](../graphs/all-shortest-paths.md) /
  [k Shortest Paths](../graphs/k-shortest-paths.md) /
  [k Paths](../graphs/k-paths.md)

Last but not least, there are special variables which are available in certain
contexts. Unlike keywords, they are **case-sensitive**:
 
- `CURRENT` –
  available in
  [array inline expressions](../operators.md#inline-expressions) and the
  [question mark operator](../operators.md#question-mark-operator)
- `NEW` –
  available after
  [INSERT](../high-level-operations/insert.md#returning-the-inserted-documents) /
  [UPDATE](../high-level-operations/update.md#returning-the-modified-documents) /
  [REPLACE](../high-level-operations/replace.md#returning-the-modified-documents) /
  [UPSERT](../high-level-operations/upsert.md#returning-documents)
  operation
- `OLD` –
  available after
  [UPDATE](../high-level-operations/update.md#returning-the-modified-documents) /
  [REPLACE](../high-level-operations/replace.md#returning-the-modified-documents) /
  [UPSERT](../high-level-operations/upsert.md#returning-documents) /
  [REMOVE](../high-level-operations/remove.md#returning-the-removed-documents)
  operation

If you define a variable with the same name in the same scope, then its value
will be and remain at what you set it to. Hence you need to avoid these names
for your own variables if you want to access the special variable values.

## Names

In general, names are used to identify the following things in AQL queries:
- collections
- attributes
- variables
- functions

Names in AQL are always case-sensitive.
The maximum supported length for collection/View names is 256 bytes.
Variable names can be longer, but are discouraged.

Keywords should not be used as names. If you want to use a reserved keyword as
name anyway, the name must be enclosed in backticks or forward ticks. This is referred to as _quoting_.

```aql
FOR doc IN `filter`
  RETURN doc.`sort`
```

Due to the backticks, `filter` and `sort` are interpreted as names and not as
keywords here.

You can also use forward ticks:

```aql
FOR f IN ´filter´
  RETURN f.´sort´
```

Instead of ticks, you may use the bracket notation for the attribute access:

```aql
FOR f IN `filter`
  RETURN f["sort"]
```

`sort` is a string literal in quote marks in this alternative and does thus not
conflict with the reserved keyword.

Quoting with ticks is also required if certain characters such as
hyphen minus (`-`) are contained in a name, namely if they are used for
[operators](../operators.md) in AQL:

```aql
LET `my-var` = 42
```

### Collection names

You can typically use collection names in queries as they are. If a collection
happens to have the same name as a keyword, the name must be enclosed in
backticks or forward ticks.

Quoting with ticks is also required if special characters such as
hyphen minus (`-`) are contained in a collection name:

```aql
FOR doc IN `my-coll`
  RETURN doc
```

The collection `my-coll` has a dash in its name, but `-` is an arithmetic
operator for subtraction in AQL. The backticks quote the collection name to
refer to the collection correctly.

If you use extended collection and View names
([`--database.extended-names` startup option](../../components/arangodb-server/options.md#--databaseextended-names)),
they may contain spaces, or non-ASCII characters such as Japanese or Arabic
letters, emojis, letters with accentuation, and other UTF-8 characters.
Quoting is required in these cases, too:

```aql
FOR doc IN ´🥑~колекція =)´
  RETURN doc
```

The collection name contains characters that are allowed using the extended
naming constraints and is quoted with forward ticks.

Note that quoting the name with `"` or `'` is not possible for collections as
they cannot be string literals in quote marks.

For information about the naming constraints for collections, see
[Collection names](../../concepts/data-structure/collections.md#collection-names).

### Attribute names

When referring to attributes of documents from a collection, the fully qualified
attribute name must be used. This is because multiple collections with ambiguous
attribute names may be used in a query. To avoid any ambiguity, it is not
allowed to refer to an unqualified attribute name.

Also see the naming restrictions for
[Attribute names](../../concepts/data-structure/documents/_index.md#attribute-names).

```aql
FOR u IN users
  FOR f IN friends
    FILTER u.active == true && f.active == true && u.id == f.userId
    RETURN u.name
```

In the above example, the attribute names `active`, `name`, `id`, and `userId`
are qualified using the collection names they belong to (`u` and `f`
respectively).

### Variable names

AQL allows you to assign values to additional variables in a query.
All variables that are assigned a value must have a name that is unique within
the context of the query.

```aql
FOR u IN users
  LET friends = u.friends
  RETURN { "name" : u.name, "friends" : friends }
```

In the above query, `users` is a collection name, and both `u` and `friends` are
variable names. This is because the `FOR` and `LET` operations need target
variables to store their intermediate results.

Variable names should be different from the names of any collection name used in
the same query to avoid shadowing, which can render a collection with the same
name inaccessible in the query after the variable assignment:

```aql
LET users = []
FOR u IN users // iterates over the "users" variable, not the "users" collection
  RETURN u
```

Allowed characters in variable names are the letters `a` to `z` (both in lower
and upper case), the numbers `0` to `9`, the underscore (`_`) symbol and the
dollar (`$`) sign. A variable name must not start with a number. If a variable
name starts with one or multiple underscore characters, the underscore(s) must
be followed by least one letter (a-z or A-Z). The dollar sign can only be used
as the very first character in a variable name and must be followed by a letter.
