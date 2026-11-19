"""Helpers to draw graph diagrams as SVG in the style of the documentation.

The diagrams use the light colors as presentation attributes and carry the
dark mode role classes of dark.css (dg-f-* for fills, dg-s-* for strokes), so
that they work on their own and adapt to the dark mode of the docs.

Text widths are estimated, so check the result visually, for example by
rendering it with `magick -density 100 file.svg file.png`.
"""
import math
from xml.sax.saxutils import escape

FONT = "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif"

TEXT = "#1d293d"
MUTED = "#45556c"
ACCENT = "#014654"   # dark teal text
TEAL = "#00576e"     # outlines, arrows, teal boxes (kept in dark mode)
LIME = "#befe99"     # lime boxes (kept in dark mode)
TAG = "#eefbd5"      # edge label badges
LINE = "#90a1b9"     # gray lines
CANVAS = "#f1f5f9"
RADIUS = 12


def tw(s, size, bold=False):
    """Estimated width of a text in Inter."""
    return len(s) * size * (0.6 if bold else 0.55)


class Svg:
    def __init__(self, name, title, desc):
        self.name = name
        self.title = title
        self.desc = desc
        self.back = []    # edges and panels, drawn first
        self.front = []   # nodes and labels
        self.minx = self.miny = 1e9
        self.maxx = self.maxy = -1e9

    def grow(self, x1, y1, x2, y2):
        self.minx = min(self.minx, x1)
        self.miny = min(self.miny, y1)
        self.maxx = max(self.maxx, x2)
        self.maxy = max(self.maxy, y2)

    def text(self, x, y, s, size=13, cls="dg-f-text", fill=TEXT, weight=None,
             anchor="middle", italic=False, layer="front"):
        w = tw(s, size, weight is not None)
        x1 = x - w / 2 if anchor == "middle" else (x if anchor == "start" else x - w)
        self.grow(x1, y - size, x1 + w, y + 3)
        attrs = f'x="{x:.1f}" y="{y:.1f}" text-anchor="{anchor}" font-size="{size}"'
        if weight:
            attrs += f' font-weight="{weight}"'
        if italic:
            attrs += ' font-style="italic"'
        c = f'class="{cls}" ' if cls else ""
        getattr(self, layer).append(f'<text {c}{attrs} fill="{fill}">{escape(s)}</text>')

    def rect(self, x, y, w, h, rx=RADIUS, fill="#ffffff", fcls="dg-f-node",
             stroke=TEAL, scls="dg-s-accent", sw=1.5, dash=None, layer="front"):
        self.grow(x - sw, y - sw, x + w + sw, y + h + sw)
        cls = " ".join(c for c in (fcls, scls) if c)
        c = f'class="{cls}" ' if cls else ""
        d = f' stroke-dasharray="{dash}"' if dash else ""
        getattr(self, layer).append(
            f'<rect {c}x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" '
            f'rx="{rx}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"{d}/>')

    def path(self, d, bbox, marker="a", stroke=TEAL, scls="dg-s-accent", sw=2,
             dash=None, layer="back"):
        self.grow(*bbox)
        m = f' marker-end="url(#{self.name}-{marker})"' if marker else ""
        da = f' stroke-dasharray="{dash}"' if dash else ""
        getattr(self, layer).append(
            f'<path class="{scls}" d="{d}" fill="none" stroke="{stroke}" '
            f'stroke-width="{sw}"{m}{da}/>')

    def tag(self, x, y, s, size=10.5):
        """Edge label badge centered at x, y. A newline splits it into a bold
        first line and regular further lines."""
        lines = s.split("\n")
        w = max(tw(line, size, True) for line in lines) + 14
        lh = size + 3
        h = lh * len(lines) + 6
        self.rect(x - w / 2, y - h / 2, w, h, rx=min(h / 2, 10), fill=TAG,
                  fcls="dg-f-tag-solid", stroke=TEAL, scls="dg-s-accent", sw=1)
        top = y - lh * len(lines) / 2 + size * 0.86
        for k, line in enumerate(lines):
            self.text(x, top + k * lh, line, size=size, cls="dg-f-lime",
                      fill=ACCENT, weight="700" if k == 0 else None)

    def render(self, pad=18):
        x0 = math.floor(self.minx - pad)
        y0 = math.floor(self.miny - pad)
        w = math.ceil(self.maxx + pad) - x0
        h = math.ceil(self.maxy + pad) - y0
        n = self.name
        marker = ('<marker id="{id}" markerWidth="8" markerHeight="8" refX="2" refY="4" '
                  'orient="auto" markerUnits="userSpaceOnUse"><path class="{cls}" '
                  'd="M0,0 L8,4 L0,8 z" fill="{fill}"/></marker>')
        defs = ("<defs>" + marker.format(id=f"{n}-a", cls="dg-f-accent", fill=TEAL)
                + marker.format(id=f"{n}-g", cls="dg-f-arrow", fill=LINE) + "</defs>")
        out = [
            f'<svg xmlns="http://www.w3.org/2000/svg" class="keep-colors" '
            f'viewBox="{x0} {y0} {w} {h}" width="{w}" height="{h}" role="img" '
            f'aria-labelledby="{n}-t {n}-d" font-family="{FONT}">',
            f'  <title id="{n}-t">{escape(self.title)}</title>',
            f'  <desc id="{n}-d">{escape(self.desc)}</desc>',
            f'  {defs}',
            f'  <rect class="dg-f-canvas" x="{x0}" y="{y0}" width="{w}" height="{h}" '
            f'rx="6" fill="{CANVAS}"/>',
        ]
        out += ["  " + e for e in self.back]
        out += ["  " + e for e in self.front]
        out.append("</svg>")
        return "\n".join(out) + "\n"


def _slab(n, px, py, ux, uy):
    """Parameter interval where the ray p + t*u is inside the box of node n."""
    t0, t1 = -1e9, 1e9
    for c, half, p, u in ((n["x"], n["w"] / 2, px, ux), (n["y"], n["h"] / 2, py, uy)):
        if abs(u) < 1e-9:
            continue
        a, b = (c - half - p) / u, (c + half - p) / u
        t0, t1 = max(t0, min(a, b)), min(t1, max(a, b))
    return t0, t1


def _rounded(n, px, py, ux, uy, t, exiting, r=RADIUS):
    """Moves a ray/box intersection onto the rounded corner if it is in one."""
    x, y = px + ux * t, py + uy * t
    hw, hh = n["w"] / 2, n["h"] / 2
    if abs(x - n["x"]) <= hw - r or abs(y - n["y"]) <= hh - r:
        return t
    ccx = n["x"] + math.copysign(hw - r, x - n["x"])
    ccy = n["y"] + math.copysign(hh - r, y - n["y"])
    fx, fy = px - ccx, py - ccy
    b = fx * ux + fy * uy
    disc = b * b - (fx * fx + fy * fy - r * r)
    if disc < 0:
        return t
    root = math.sqrt(disc)
    return -b + root if exiting else -b - root


def arrow(svg, a, b, label=None, bulge=0.0, label_at=0.5, label_offset=0.0,
          label_side=None, label_size=11, marker="a", stroke=TEAL,
          scls="dg-s-accent", dash=None):
    """Arrow from node a to node b (dicts with x, y, w, h), starting and ending
    at the box borders. bulge curves it to its right-hand side. label is shown
    in a badge on the arrow, or as plain text label_side away from it."""
    dx, dy = b["x"] - a["x"], b["y"] - a["y"]
    dist = math.hypot(dx, dy)
    ux, uy = dx / dist, dy / dist
    nx, ny = -uy, ux
    sx, sy = a["x"] + nx * bulge * 0.35, a["y"] + ny * bulge * 0.35
    s = _rounded(a, sx, sy, ux, uy, _slab(a, sx, sy, ux, uy)[1], True) - 1
    e = _rounded(b, sx, sy, ux, uy, _slab(b, sx, sy, ux, uy)[0], False) - 2
    x1, y1 = sx + ux * s, sy + uy * s
    x2, y2 = sx + ux * e, sy + uy * e
    if bulge:
        cx = (a["x"] + b["x"]) / 2 + nx * bulge * 2
        cy = (a["y"] + b["y"]) / 2 + ny * bulge * 2
        tx, ty = x2 - cx, y2 - cy
        tl = math.hypot(tx, ty)
        x2e, y2e = x2 - tx / tl * 6, y2 - ty / tl * 6
        svg.path(f"M{x1:.1f},{y1:.1f} Q{cx:.1f},{cy:.1f} {x2e:.1f},{y2e:.1f}",
                 (min(x1, x2, cx), min(y1, y2, cy), max(x1, x2, cx), max(y1, y2, cy)),
                 marker=marker, stroke=stroke, scls=scls, dash=dash)
        px, py = (x1 + 2 * cx + x2) / 4, (y1 + 2 * cy + y2) / 4
    else:
        x2e, y2e = x2 - ux * 6, y2 - uy * 6
        svg.path(f"M{x1:.1f},{y1:.1f} L{x2e:.1f},{y2e:.1f}",
                 (min(x1, x2), min(y1, y2), max(x1, x2), max(y1, y2)),
                 marker=marker, stroke=stroke, scls=scls, dash=dash)
        px, py = x1 + (x2 - x1) * label_at, y1 + (y2 - y1) * label_at
    if label is None:
        return
    if label_side is not None:
        ext = abs(nx) * tw(label, label_size, True) / 2 + abs(ny) * label_size / 2
        d = label_side + ext
        svg.text(px + nx * d, py + ny * d + label_size * 0.36, label, size=label_size,
                 cls="dg-f-lime", fill=ACCENT, weight="700")
    else:
        svg.tag(px + nx * label_offset, py + ny * label_offset, label)


def self_loop(svg, n, label=None, side="top", size=46):
    """Arrow from a node back to itself, as a loop on one side of the box."""
    x, y, w, h = n["x"], n["y"], n["w"], n["h"]
    if side == "top":
        x1, y1, x2, y2 = x - 22, y - h / 2, x + 22, y - h / 2
        c1, c2 = (x - 40, y - h / 2 - size), (x + 40, y - h / 2 - size)
        lx, ly = x, y - h / 2 - size * 0.75
    else:
        x1, y1, x2, y2 = x - 22, y + h / 2, x + 22, y + h / 2
        c1, c2 = (x - 40, y + h / 2 + size), (x + 40, y + h / 2 + size)
        lx, ly = x, y + h / 2 + size * 0.75
    # Leave room for the arrow tip
    dx, dy = x2 - c2[0], y2 - c2[1]
    dl = math.hypot(dx, dy)
    x2e, y2e = x2 - dx / dl * 7, y2 - dy / dl * 7
    svg.path(f"M{x1:.1f},{y1:.1f} C{c1[0]:.1f},{c1[1]:.1f} {c2[0]:.1f},{c2[1]:.1f} "
             f"{x2e:.1f},{y2e:.1f}",
             (min(x1, c1[0]), min(y1, c1[1], c2[1]), max(x2, c2[0]), max(y1, c1[1], c2[1])))
    if label:
        svg.tag(lx, ly, label)


def node(svg, n, style="lime"):
    """Draws a node dict with x, y (center), w, h, label, and optionally sub
    (a second, smaller line) and size (font size of the label).

    Styles: lime (default), teal, white, external (dashed), unvisited (dotted).
    Lime and teal boxes keep their colors in dark mode."""
    x, y, w, h = n["x"], n["y"], n["w"], n["h"]
    sub_fill, sub_cls = MUTED, "dg-f-muted"
    if style == "lime":
        svg.rect(x - w / 2, y - h / 2, w, h, fill=LIME, fcls=None, stroke=TEAL, scls=None)
        fill, cls, sub_fill, sub_cls = ACCENT, None, TEAL, None
    elif style == "teal":
        svg.rect(x - w / 2, y - h / 2, w, h, fill=TEAL, fcls=None, stroke=TEAL, scls=None)
        fill, cls, sub_fill, sub_cls = "#ffffff", None, LIME, None
    elif style == "white":
        svg.rect(x - w / 2, y - h / 2, w, h)
        fill, cls = ACCENT, "dg-f-text"
    elif style == "external":
        svg.rect(x - w / 2, y - h / 2, w, h, stroke=LINE, scls="dg-s-line", dash="5 4")
        fill, cls = MUTED, "dg-f-muted"
    elif style == "unvisited":
        svg.rect(x - w / 2, y - h / 2, w, h, fill="none", fcls=None, stroke=LINE,
                 scls="dg-s-line", dash="2 3")
        fill, cls = MUTED, "dg-f-muted"
    else:
        raise ValueError(style)
    size = n.get("size", 13)
    if n.get("sub"):
        svg.text(x, y - 2, n["label"], size=size, cls=cls, fill=fill, weight="700")
        svg.text(x, y + 13, n["sub"], size=11, cls=sub_cls, fill=sub_fill)
    else:
        svg.text(x, y + size * 0.35, n["label"], size=size, cls=cls, fill=fill, weight="700")


def box(x, y, label, sub=None, w=None, h=None, size=13):
    """Node dict for a box centered at x, y, sized to its label if w is None."""
    width = w or max(tw(label, size, True), tw(sub or "", 11)) + 28
    return {"x": x, "y": y, "w": width, "h": h or (44 if sub else 36),
            "label": label, "sub": sub, "size": size}
