---
title: Custom themes for better data optics
menuTitle: Custom themes
weight: 25
description: >-
  Build Graph Visualizer themes that color-code the Nordweave graph for
  different teams - supply chain, customer journey, and editorial views
---

Out of the box, the Graph Visualizer assigns default colors to each
collection. Products might be blue, customers might be green, orders might
be orange. That is fine for a first look, but Nordweave has a dozen vertex
collections and just as many edge collections on the canvas at any given
time.
Default colors don't tell a story - they just prevent collisions.

Themes let you tell a story. A theme is a saved set of visual
customizations - colors, icons, labels, hover info, attribute-based rules -
that you can switch between. Different themes highlight different aspects
of the same data. The merchandising team, the supply-chain team, and the
customer-experience team can each have their own lens on the same graph.

## Creating your first theme

1. Open the **Legend** panel by clicking **Legend** in the top right
   corner.
2. Open the drop-down menu at the top of the Legend panel.
3. Click **Add new theme**.
4. Name it something descriptive - "Supply Chain View" for this first one.
5. Leave **Start with** set to **Current theme** (you'll customize from
   the defaults).
6. Click **Save**.

You are now editing a named theme. Changes you make here can be saved back
to this theme without affecting any other theme.

## Theme 1: Supply Chain View

This theme is designed for the team that cares about where products come
from and whether those sources are reliable.

### Node styling

**Products** - Color: a neutral mid-gray. The product is the anchor but
not the focus in this view. Icon: a shirt or tag icon. Label: the `name`
attribute, so you see "The Selvedge Straight Jean" instead of a document
ID.

**Suppliers** - Color: use attribute-based rules to make this dynamic:

- Rule 1: where `last_audit_score < 0.5` → Color: red. These are suppliers
  with poor audit results.
- Rule 2: where `last_audit_score >= 0.8` → Color: green. High-scoring,
  trusted suppliers.
- Default (everything else): amber/yellow.

To set this up:

1. In the Legend panel, click the **Nodes** tab, then click **suppliers**.
2. Go to the **Attribute-based** tab.
3. Click **New rule**.
4. Select `last_audit_score` as the attribute, `<` as the operator, enter
   `0.5`.
5. Enable **Apply color** and pick a red.
6. Repeat for the green rule (`>= 0.8`).

**Materials** - Color: vary by `sustainability_grade`. A-grade materials
get deep green, D-grade get a muted brown. This gives instant visibility
into the sustainability profile of whatever product cluster you are
looking at.

### Edge styling

- `MANUFACTURED_BY` edges: increase the thickness to 3 and use a bold
  color. These are the relationships you care about most in this view.
- `MADE_OF` edges: set the label to `pct` so you can see "75%" along the
  edge line. You will immediately spot which material dominates a
  product's composition.

Save the theme (click the save icon in the drop-down menu).

## Theme 2: Customer Journey View

Switch perspective entirely. Click the theme drop-down and create a new
theme: **Customer Journey View**.

### Node styling

**Customers** - use attribute-based rules on `loyalty_tier`:

- `platinum` → gold color
- `gold` → warm amber
- `silver` → light gray
- `bronze` → a muted tan

Icon: a person icon. Label: `name`. Hover info: `lifetime_value_usd` and
`return_rate_pct`.

**Products** - Color: vary by `status` (`active` = green, `end-of-life` =
gray, `hidden` = faded). Label: `name`. Hover info: `price_usd` and
`sustainability_score`.

**Orders** - Color: vary by `channel`:

- `online` → blue
- `in-store` → green
- `app` → purple

Label: `order_date`.

### Edge styling

- `RETURNED` edges: Color: red, thickness: 3. Returns should stand out
  immediately.
- `PURCHASED` edges: Color: a calm blue, thickness: 1. These are the
  baseline - normal activity.
- `REVIEWED` edges: Color: teal, thickness: 2. Reviews are signal - they
  tell you the customer engaged beyond just buying.

## Theme 3: Editorial View

A third theme for the marketing and merchandising teams:

**Collections** - Color by season (warm tones for FW collections, cool
tones for SS). Label: `name`.

**Products** - Label: `name`. Hover info: `description` (so hovering gives
a quick product summary).

**Style tags** - Color by aesthetic so you can see at a glance which look a
product cluster leans into. Label: `name`.

- `TAGGED_AS` edges: Color: a standout pink or coral. Thickness: 2. These
  connect products to the style tags that define their aesthetic.
- `PART_OF_COLLECTION` edges: Color: gold. These connect products to the
  seasonal collections they belong to.

## Switching between themes

Once you have built two or three themes, switching between them is a
single click in the Legend panel drop-down. The same nodes and edges stay
on the canvas - only their visual presentation changes. This is the key
insight: themes don't filter data, they re-color and re-label it. You are
looking at the same graph, but through a different lens.

This is what "better data optics" means in practice. A supply-chain
manager glances at the canvas and sees red supplier nodes - problem. A
merchandiser switches to the Editorial View and sees how products cluster
by collection and style tag - opportunity. Same data, different signal.

{{< tip >}}
Themes are stored per graph in your browser's local storage. If your team
wants to share a standard set of themes, document the rules (attribute,
operator, value, color) and share them as a setup guide. Each team member
creates the theme once, then it persists across sessions.
{{< /tip >}}

## What's next

Themes change what the canvas *looks* like. The next page covers [Canvas
Actions](canvas-actions.md) - selection-driven queries that change what
the canvas *does*, letting you turn any node selection into an interactive
investigation.
