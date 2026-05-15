---
title: From PostgreSQL to a Graph-Powered Catalog
menuTitle: From PostgreSQL to a Graph-Powered Catalog
weight: 5
description: >-
  This is an end-to-end tutorial that follows a fictional retailer, Nordweave,
  on its journey from a traditional relational backend to a graph-native,
  AI-ready data platform. Every chapter solves one concrete pain point and
  introduces one layer of the Arango Contextual Data Platform. By the final
  chapter, Nordweave is running agentic AI workflows on top of the same data
  you import in the very first chapter. We start with the database itself,
  because everything agentic ultimately rests on it.
---

This is an end-to-end tutorial that follows a fictional retailer, Nordweave,
on its journey from a traditional relational backend to a graph-native,
AI-ready data platform. Every chapter solves one concrete pain point and
introduces one layer of the Arango Contextual Data Platform. By the final
chapter, Nordweave is running agentic AI workflows on top of the same data
you import in the very first chapter. We start with the database itself,
because everything agentic ultimately rests on it.

## Meet Nordweave

Nordweave is a fictional mid-to-premium clothing retailer. They run physical
stores plus an e-commerce site, design in-house *and* stock third-party
brands, and lean hard on a sustainability story (organic cotton, recycled
wool, traceable suppliers). For years, their product catalog, customer
profiles, and order history lived comfortably in PostgreSQL.

Then growth happened.

- The catalog crossed 5,000 active SKUs across 50 categories, 54 base
  materials, and 105 cross-cutting style tags.
- The customer base hit 20,000 shoppers across 100,976 orders and 16,699
  returns, and the merchandising team wanted to see the *connections*
  between all of that, not just totals.
- "Customers who bought from the Atelier collection and returned fewer
  than 20%" turned into deeply nested SQL joins that pegged the
  database CPU.
- The data science team wanted a foundation that could later host a
  shopping assistant grounded in real catalog and review data. They
  needed graph relationships, not foreign keys.

Nordweave came to ArangoDB. Not because PostgreSQL is bad, but because the
*shape* of their problem had shifted from rows and tables to things and the
relationships between them. That shape is a graph, and Arango is built for it.

## The dataset

The Nordweave dataset is a synthesized snapshot of a clothing retailer's
operational data - catalog, supply chain, customers, orders, returns, and
reviews - distributed as a set of JSON Lines files, one per collection. For
the early chapters we work with the structured ground-truth spine: vertex
documents on one side, ready-to-load edges on the other.

The dataset is organized into two folders:

- **`spine/`** - structured ground-truth JSON Lines files, one per
  collection. This is the part loaded in
  [Chapter 1.1 - Importing the spine](importing-data.md).
- **`unstructured/`** - long-form text (lookbooks, design briefs, trend
  reports, style guides, supplier audits, incident post-mortems). Used by
  later chapters with the
  [GraphRAG Importer](../../graphrag/_index.md).

The part that matters for the first chapter is the **`spine/`** folder -
the structured ground-truth JSON Lines files that get loaded straight
into ArangoDB.

### Vertex collections

| Collection | Records | Notes |
|---|---|---|
| brands | 80 | In-house sub-brands plus stocked third parties |
| categories | 50 | Hierarchical (parent_category_id stored inline) |
| collections | 42 | Seasonal drops (SS24, FW25, "Atelier Edit", ...) |
| customers | 20,000 | With size profile, loyalty tier, return rate |
| employees | 410 | Designers, buyers, store managers, execs |
| influencers | 100 | IG / TikTok / YouTube partners |
| materials | 54 | Cotton, wool, cupro, recycled blends, ... |
| orders | 100,976 | Online, in-store, app |
| products | 5,000 | The catalog |
| returns | 16,699 | With reason code and free-text note |
| reviews | 29,897 | The bulk RAG corpus (later chapters) |
| stores | 41 | Flagship, outlet, concession, online |
| style_tags | 105 | Minimalist, streetwear, oversized, Y2K, ... |
| suppliers | 120 | Audited factories worldwide |
| teams | 30 | Org units across 9 divisions |

### Edge collections

| Collection | Records | Shape |
|---|---|---|
| contains | 228,593 | Order → Product (with qty, size, price) |
| purchased | 182,881 | Customer → Product (denormalized for ML) |
| placed | 100,976 | Customer → Order |
| fulfilled_at | 100,976 | Order → Store |
| has_style_pref | 60,400 | Customer → StyleTag |
| reviewed | 29,897 | Customer → Product |
| tagged_as | 26,368 | Product → StyleTag |
| returned | 16,699 | Customer → Product |
| made_of | 7,148 | Product → Material (with pct) |
| manufactured_by | 5,000 | Product → Supplier |
| belongs_to_category | 5,000 | Product → Category |
| sold_as_brand | 5,000 | Product → Brand |
| designed_by | 2,958 | Product → Employee |
| part_of_collection | 2,332 | Product → Collection |
| member_of | 410 | Employee → Team |
| manages | 389 | Employee → Employee (acyclic reporting DAG) |
| works_at | 154 | Employee → Store |
| leads | 30 | Employee → Team |

About **57k nodes and ~750k edges** in total - small enough to fit on a
single DB-Server, large enough to make sharding decisions matter. A few
representative records, straight from the files:

```json
// spine/products.jsonl
{"_key": "prod_00000", "sku": "NW-WMN-S-00000", "name": "The A-Line Midi Skirt",
 "category_id": "cat_womens_bottoms_skirts", "collection_id": null,
 "brand_id": "brand_grenja", "price_usd": 199.0,
 "colors": ["Cream", "Stone", "Navy", "Berry"],
 "sizes": ["W24", "W26", "W28", "W30", "W32", "W34", "W36", "W38", "W40"],
 "launch_date": "2023-04-10", "status": "active",
 "sustainability_score": 0.77,
 "description": "The A-Line Midi Skirt by Grenja. Made from 75% cupro and 25% recycled wool. ..."}

// spine/customers.jsonl
{"_key": "cust_00000", "name": "Joshua Beck", "email": "joshua.beck681@example.com",
 "country": "DE", "joined_date": "2025-06-13", "loyalty_tier": "bronze",
 "size_profile": {"tops": "L", "bottoms": "W28", "shoes": "39"},
 "preferred_style_tags": [], "lifetime_value_usd": 0.0,
 "return_rate_pct": 0.0, "is_return_fraud": false}

// spine/edges_contains.jsonl (Order CONTAINS Product, with line-item details)
{"_from": "orders/ord_000000", "_to": "products/prod_04762",
 "qty": 1, "size": "W28", "color": "Stone", "unit_price_usd": 125.99}

// spine/edges_made_of.jsonl (Product MADE_OF Material, with weight %)
{"_from": "products/prod_00000", "_to": "materials/mat_cupro", "pct": 75}
```

Two things to notice:

- The edge files already use ArangoDB-native `_from` / `_to` references in
  `<collection>/<key>` form. No transformation is needed at import time.
- Some edges carry payload (`pct`, `qty`, `unit_price_usd`). ArangoDB edges
  are first-class documents - properties on edges are perfectly normal.

## How the series is organized

### Chapter 1 - Foundations

Get the data in, decide how it is sharded, and decide how the small
reference graphs are co-located.

- [Importing the data with arangoimport](importing-data.md)
- [OneShard databases for single-server query latency](oneshard-databases.md)
- [SatelliteGraphs for hot reference data](satellitegraphs.md)

### Chapter 2 - Exploring Nordweave visually and with Ada

Take the spine that was just imported and learn how to look at it,
customize it, and ask it questions in plain English.

- [Opening the Graph Visualizer and reading the relationships](graph-visualizer.md)
- [Custom themes for better data optics](custom-themes.md)
- [Canvas Actions for interactive graph investigation](canvas-actions.md)
- [Meeting Ada, your AI-powered database assistant](meeting-ada.md)

Get these foundations right and every subsequent chapter - GraphRAG over
review and audit text, AutoGraph for design briefs and incident
post-mortems, an agentic merchandising assistant - gets dramatically simpler.
