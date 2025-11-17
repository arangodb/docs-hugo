---
title: RDF Adapter
menuTitle: RDF
weight: 25
description: >-
  ArangoRDF allows you to export graphs from ArangoDB into RDF and vice-versa
---
RDF is a standard model for data interchange on the Web. RDF has features that
facilitate data merging even if the underlying schemas differ, and it
specifically supports the evolution of schemas over time without requiring all
the data consumers to be changed.

RDF extends the linking structure of the Web to use URIs to name the relationship
between things as well as the two ends of the link (this is usually referred to
as a "triple"). Using this simple model, it allows structured and semi-structured
data to be mixed, exposed, and shared across different applications.

This linking structure forms a directed, labeled graph, where the edges represent
the named link between two resources, represented by the graph nodes. This graph
view is the easiest possible mental model for RDF and is often used in
easy-to-understand visual explanations.

## Resources

- [ArangoRDF repository](https://github.com/ArangoDB-Community/ArangoRDF),
  available on GitHub
- [ArangoRDF documentation](https://arangordf.readthedocs.io/en/latest/),
  available on Read the Docs
- [RDF Primer](https://www.w3.org/TR/rdf11-concepts/)
- [RDFLib (Python)](https://pypi.org/project/rdflib/)


## Installation

To install the latest release of ArangoRDF,
run the following command:

```bash
pip install arango-rdf
```

##  Quickstart

The following examples show how to get started with ArangoRDF.
Check also the 
[interactive tutorial](https://colab.research.google.com/github/ArangoDB-Community/ArangoRDF/blob/main/examples/ArangoRDF.ipynb).

```py
from rdflib import Graph
from arango import ArangoClient
from arango_rdf import ArangoRDF

db = ArangoClient().db()

adbrdf = ArangoRDF(db)

def beatles():
    g = Graph()
    g.parse("https://raw.githubusercontent.com/ArangoDB-Community/ArangoRDF/main/tests/data/rdf/beatles.ttl", format="ttl")
    return g
```

### RDF to ArangoDB

**Note**: RDF-to-ArangoDB functionality has been implemented using concepts described in the paper
*[Transforming RDF-star to Property Graphs: A Preliminary Analysis of Transformation Approaches](https://arxiv.org/abs/2210.05781)*. So we offer two transformation approaches:

1. [RDF-Topology Preserving Transformation (RPT)](https://arangordf.readthedocs.io/en/latest/rdf_to_arangodb_rpt.html)
2. [Property Graph Transformation (PGT)](https://arangordf.readthedocs.io/en/latest/rdf_to_arangodb_pgt.html)

```py
# 1. RDF-Topology Preserving Transformation (RPT)
adbrdf.rdf_to_arangodb_by_rpt(name="BeatlesRPT", rdf_graph=beatles(), overwrite_graph=True)

# 2. Property Graph Transformation (PGT) 
adbrdf.rdf_to_arangodb_by_pgt(name="BeatlesPGT", rdf_graph=beatles(), overwrite_graph=True)
```

### ArangoDB to RDF

```py
# pip install arango-datasets
from arango_datasets import Datasets

name = "OPEN_INTELLIGENCE_ANGOLA"
Datasets(db).load(name)

# 1. Graph to RDF
rdf_graph = adbrdf.arangodb_graph_to_rdf(name, rdf_graph=Graph())

# 2. Collections to RDF
rdf_graph_2 = adbrdf.arangodb_collections_to_rdf(
    name,
    rdf_graph=Graph(),
    v_cols={"Event", "Actor", "Source"},
    e_cols={"eventActor", "hasSource"},
)

# 3. Metagraph to RDF
rdf_graph_3 = adbrdf.arangodb_to_rdf(
    name=name,
    rdf_graph=Graph(),
    metagraph={
        "vertexCollections": {
            "Event": {"date", "description", "fatalities"},
            "Actor": {"name"}
        },
        "edgeCollections": {
            "eventActor": {}
        },
    },
)
```

## Terminology

### Literals

In RDF, even literal values are referenced by edges. Literals cannot have
outgoing edges (i.e., cannot be the subject of a statement). RDF uses the XSD
type system for literals, so the string "Fred" is represented as `"Fred"^^xsd:String` 
or fully expanded as `"Fred" ^^http://…"`. Literals can also contain language 
and locale tags, for example, `"cat@en" ^^xsd:String` and `"chat@fr"^^xsd:String`. 
These language tags can be useful and would ideally be preserved. 

Literals could be added as a property instead of creating a separate node; this 
takes better advantage of using a property graph. If you are coming from a triple 
store or downloading your data using a [SPARQL](https://www.w3.org/TR/rdf-sparql-query/) query you could handle these properties when 
exporting. 

### Uniform Resource Identifiers (URIs)

#### Prefixes

In RDF, it is common to use [namespace prefixes](https://www.w3.org/TR/rdf-concepts/#section-URIspaces) with references for ease of parsing. This 
can be easily handled with a property graph in a few ways. The easiest approach 
is to add the statement prefixes to the document. This keeps the prefixes close 
to the data but results in a lot of duplicated fields. Another approach would be 
to append the prefix and form the full URI as a property.

#### Identifiers

URIs (e.g `http://dbpedia.org/resource/`) are used as universal identifiers in 
RDF but contain special characters, namely `:` and `/`, which make them not 
suitable for use as an ArangoDB `_key` attribute. Consequently, a hashing algorithm
is used within ArangoRDF to store the URI as an ArangoDB graph node.

### Blank Nodes

Blank nodes are identifiers that have local scope and cannot (must not) be
referenced externally. Blank nodes are usually used in structures like lists and 
other situations where it is inconvenient to create URIs. They will cause problems
when reconciling differences between graphs. Hashing these values as well is a way 
to work around them but as they are considered temporary identifiers in the RDF 
world they could pose consistency issues in your RDF graph.

### Serializations

There are numerous RDF serializations, including XML and JSON based
serializations and gzipped serializations. Third party libraries will likely handle 
all of the serializations but it is a step that may effect how data is imported. 

### Ontology, Taxonomy, Class Inheritance, and RDFS

The final consideration is something that for many is the core of RDF and 
semantic data: [Ontologies](https://www.w3.org/standards/semanticweb/ontology).
Not just ontologies but also class inheritance, and schema validation. One method 
would be to add the ontology in a similar way to what has been suggested for the 
RDF graphs as ontologies are usually structured in the same way (or can be). 