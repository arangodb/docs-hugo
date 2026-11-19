#!/usr/bin/env python3
"""Draws the diagrams of the expertiseGraph example graph into
site/content/images/. Keep the data in sync with the example graph.

Usage: python3 toolchain/scripts/diagrams/expertise_graph.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from svgdiagram import Svg, arrow, box, node, self_loop  # noqa: E402

IMAGES = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                      "..", "..", "..", "site", "content", "images")

PERSONS = {  # key: (name, city)
    "alice": ("Alice", "Berlin"), "bob": ("Bob", "Berlin"),
    "charlie": ("Charlie", "Amsterdam"), "dana": ("Dana", "Cologne"),
    "eve": ("Eve", "Vienna"), "frankie": ("Frankie", "Amsterdam"),
    "grace": ("Grace", "Vienna"), "harper": ("Harper", "Cologne"),
}
KNOWS = [  # from, to, type, since
    ("alice", "bob", "colleague", 2019), ("alice", "charlie", "friend", 2015),
    ("bob", "dana", "colleague", 2021), ("bob", "dana", "friend", 2023),
    ("charlie", "dana", "friend", 2018), ("dana", "alice", "friend", 2020),
    ("dana", "eve", "colleague", 2022), ("charlie", "frankie", "colleague", 2023),
    ("frankie", "grace", "friend", 2017), ("harper", "alice", "colleague", 2024),
]
SKILLS = {
    "programming": "Programming", "statistics": "Statistics",
    "design-basics": "Design Basics", "python": "Python",
    "javascript": "JavaScript", "data-analysis": "Data Analysis",
    "machine-learning": "Machine Learning", "ux-design": "UX Design",
    "web-development": "Web Development",
}
REQUIRES = [  # skill, prerequisite, hours
    ("python", "programming", 40), ("javascript", "programming", 35),
    ("data-analysis", "python", 30), ("data-analysis", "statistics", 40),
    ("machine-learning", "python", 60), ("machine-learning", "statistics", 50),
    ("ux-design", "design-basics", 30), ("web-development", "javascript", 50),
    ("web-development", "ux-design", 40),
]


def schema():
    svg = Svg("expertise-graph-schema", "Structure of the expertiseGraph",
              "The collections of the expertiseGraph example graph: the knows "
              "edges connect persons with persons, the hasSkill edges persons "
              "with skills, the requires edges skills with the skills they "
              "require, and the livesIn edges persons with cities.")
    persons = box(0, 0, "persons", w=130, h=44, size=14)
    skills = box(330, 0, "skills", w=130, h=44, size=14)
    cities = box(0, 150, "cities", w=130, h=44, size=14)
    self_loop(svg, persons, "knows\ntype, since")
    self_loop(svg, skills, "requires\nhours")
    arrow(svg, persons, skills, "hasSkill\nlevel")
    arrow(svg, persons, cities, "livesIn")
    node(svg, persons, "lime")
    node(svg, skills, "teal")
    node(svg, cities, "white")
    return svg


def people():
    svg = Svg("expertise-graph-people", "The people of the expertiseGraph",
              "Eight persons and the knows edges between them, labeled with the "
              "type of relationship and the year since when. " + " ".join(
                  f"{PERSONS[a][0]} knows {PERSONS[b][0]} ({t} since {s})."
                  for a, b, t, s in KNOWS))
    pos = {"harper": (0, 150), "alice": (220, 150), "bob": (440, 40),
           "charlie": (440, 260), "dana": (660, 150), "eve": (880, 150),
           "frankie": (660, 370), "grace": (880, 370)}
    ns = {k: box(x, y, PERSONS[k][0], PERSONS[k][1], w=112) for k, (x, y) in pos.items()}
    pairs = {}
    for a, b, t, s in KNOWS:
        pairs.setdefault((a, b), []).append((t, s))
    for (a, b), rels in pairs.items():
        for i, (t, s) in enumerate(rels):
            bulge = 0 if len(rels) == 1 else (-26 if i == 0 else 26)
            arrow(svg, ns[a], ns[b], f"{t}\n{s}", bulge=bulge,
                  label_offset=0 if len(rels) == 1 else (-14 if i == 0 else 14),
                  label_at=0.62 if (a, b) == ("dana", "alice") else 0.5)
    for n in ns.values():
        node(svg, n, "lime")
    return svg


def skills():
    svg = Svg("expertise-graph-skills", "The skills of the expertiseGraph",
              "Nine skills and the requires edges from a skill to the skills it "
              "requires, labeled with the hours it takes to learn the skill "
              "based on the required one. " + " ".join(
                  f"{SKILLS[a]} requires {SKILLS[b]} ({h} hours)."
                  for a, b, h in REQUIRES))
    pos = {"design-basics": (0, 0), "programming": (330, 0),
           "ux-design": (0, 160), "javascript": (220, 160), "python": (440, 160),
           "statistics": (800, 160), "web-development": (110, 320),
           "data-analysis": (620, 300), "machine-learning": (620, 440)}
    ns = {k: box(x, y, SKILLS[k]) for k, (x, y) in pos.items()}
    for a, b, h in REQUIRES:
        arrow(svg, ns[a], ns[b], f"{h} h")
    for n in ns.values():
        node(svg, n, "teal")
    return svg


if __name__ == "__main__":
    for fn in (schema, people, skills):
        d = fn()
        path = os.path.join(IMAGES, d.name + ".svg")
        with open(path, "w") as f:
            f.write(d.render())
        print("wrote", os.path.relpath(path))
