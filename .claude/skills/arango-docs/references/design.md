# Visual design for docs: diagrams, images, colors

Adapted from the Arango design system (`DESIGN.md` of the `arango-design`
skill, values from the Arango Core Library in Figma) for what the docs need:
SVG diagrams, Mermaid, screenshots, and theme tweaks. For building UI (an app,
a prototype, a dashboard), use the `arango-design` skill instead.

If the Figma library, `DESIGN.md`, and this file disagree, Figma wins. Update
this file.

## Brand rules

- The logo is an avocado, so the palette reads green, never blue or cyan. No
  purple anywhere in the docs (purple marks prototypes).
- Navy `#002E3B` and lime `#BEFE99` are the brand anchors.
- Lime is a fill for dark surfaces or a tint. On white it has 1.18:1 contrast:
  never use it for text, icons, thin lines, or arrows on a light background.
- Teal reads as grey at small sizes. Use it for structure (boxes, lines), not
  to tell data series apart.
- No gradients, glows, glassmorphism, drop shadows, or emoji in diagrams.
- Status colors mean status. Pair every status color with a word or icon.

## Diagram palette

Use only these values in SVG diagrams. The diagrams in `site/content/images/`
already use them; match them in new diagrams.

| Role | Hex |
|:-----|:----|
| Dark surface (boxes, panels) | `#014654` |
| Deeper dark surface | `#012D3A` |
| Lighter dark surface | `#00576E` |
| Hover on dark | `#06838A` |
| Lines and arrows on light | `#00576E` |
| Lines on dark (`#012D3A`) | `#90A1B9` (5.5:1) |
| Lines crossing light and dark | `#62748E` |
| Lime fill (on dark, or as a highlight box) | `#BEFE99` |
| Lime tint panel | `#EEFBD5` |
| Teal tint panel | `#E3EEF0` |
| Text, dark | `#1D293D`, `#314158` |
| Small text on grey | `#45556C` (not `#62748E`) |
| Muted text and lines | `#62748E`, `#90A1B9` |
| Borders and dividers | `#CAD5E2`, `#E2E8F0` |
| Light grey fill | `#F1F5F9` |
| Text on dark | `#FFFFFF`, `#F8FAFC` |
| Extra category: green | `#008236` |
| Extra category: navy | `#002E3B` |
| Fallback only: amber | `#BB4D00` on `#FEF9C2` |

Don't use the old brand set (`#151D25`, `#044926`, `#B9FF38`, `#4F6D8B`,
`#470878`, `#02245F`), Tailwind blues/purples/greens, or the logo greens
(`#127920`, `#39B54A`, `#C7FE62`). The `--color-*` variables at the top of the
theme's `theme.css` are partly legacy; the values above win for diagrams.

Contrast: text needs 4.5:1 against its background (3:1 for 18px or larger, or
14px bold). Lines and arrows that carry meaning need 3:1. Check every new pair.

## Diagram text

- Font: `font-family="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif"`.
  The site serves Inter 300 to 600. For monospace labels use the
  `ui-monospace` stack (Geist Mono isn't loaded on the site).
- No text smaller than 13px at the diagram's natural width. If a label doesn't
  fit, cut words or change the layout.
- Labels are sentence case, short, with no em or en dashes (use a colon).
- Box labels weight 500 (not bold), 600 only for emphasis.
- Inter is wider than Helvetica: give label pills about 4px side padding beyond
  the measured text.
- Use product names, not internal service names: AutoGraph, AutoRAG, GraphML,
  Graph Analytics. Never Importer or Retriever.

## Diagram geometry

- Arrow tips touch the target's border, about 1px inside its outer edge. Never
  stop short and never end deep inside.
- The line stops just past the arrowhead base (marker `refX` about 2 of the
  marker length), so the stroke doesn't stick out beside the tip.
- Database cylinders: center the label block vertically in the visible body,
  between the bottom of the top ellipse (`cy + ry`) and the front of the bottom
  curve.
- Compute positions from the geometry; don't eyeball them.
- Related things sit closer than unrelated things. Spacing on a 4px grid.
- Corner radius 8px on boxes. Borders 1px (2px for emphasis).

For links, keyboard order, and focus styles in embedded SVGs, see `markup.md`.

## Mermaid

Don't set colors or fonts in Mermaid code (`style`, `classDef`, `%%{init}%%`).
The theme's `theme.js` sets them for all diagrams.

## Screenshots and images

- Compress before committing (Squoosh, 64-color palette, OxiPNG).
- Crop to the part of the UI the text is about. No browser chrome or desktop.
- Placeholder data in screenshots and examples is plausible ArangoDB data
  (`customers`, `orders`, 1,204,331 documents, 48 ms). No Lorem ipsum, John
  Doe, Acme, foo/bar.
- Always write alt text that says what the image shows.

## Logo

- Use the logo files as-is. Don't redraw, recolor, stretch, or inline the
  paths. Minimum height 20px (16px for the avocado mark).
- Black wordmark on light backgrounds, white (reversed) on dark.
- Once per screen. Not in page content or diagrams, except the existing
  avocado in the Platform Overview diagram.

## Theme and layout changes (CSS, Hugo templates)

When you change `site/themes/arangodb-docs-theme/` (layouts, CSS, the
homepage), follow the `arango-design` skill's `DESIGN.md` for tokens, type
scale, spacing, and the "what not to do" list. Key points:

- Text 13px minimum; 14px is the default UI size; headings weight 500.
- Buttons name the result. One primary action per view.
- Cards: light grey fill (`#F1F5F9`) with a 1px border, no heavy shadow.
- A visible focus ring on every interactive element.
- Must work from 360px wide without horizontal page scroll.
