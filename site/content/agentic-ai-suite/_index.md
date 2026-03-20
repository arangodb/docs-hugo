---
title: The Agentic AI Suite of the Arango Contextual Data Platform (v4.0)
menuTitle: Agentic AI Suite
weight: 2
description: >-
  A comprehensive AI solution that transforms your data into intelligent
  knowledge graphs with GraphRAG capabilities, applies advanced machine learning
  with GraphML, and provides enterprise-grade tools for analytics,
  natural language querying, and AI-powered insights, all through an intuitive
  web interface
aliases:
  - arangodb/3.12/data-science # 3.10, 3.11
  - arangodb/stable/data-science # 3.10, 3.11
  - arangodb/4.0/data-science # 3.10, 3.11
  - arangodb/devel/data-science # 3.10, 3.11
---

<style>
.agentic-arch-wrap {
  margin: 24px 0 32px;
  overflow-x: auto;
}
.agentic-arch-wrap svg {
  display: block;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
}
.agentic-arch-wrap a.node-link { cursor: pointer; }
.agentic-arch-wrap a.node-link:hover .suite-node     { fill: #1f5c38; stroke: #4ade80; }
.agentic-arch-wrap a.node-link:hover .suite-node-hl  { fill: #174d2e; stroke: #4ade80; }
.agentic-arch-wrap a.node-link:hover .right-node     { fill: #d1fae5; stroke: #4ade80; }
</style>

<div class="agentic-arch-wrap">
<svg viewBox="-25 0 825 720" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <marker id="arr-g" markerWidth="14" markerHeight="10" refX="14" refY="5" orient="auto" markerUnits="userSpaceOnUse">
      <polygon points="0 0,14 5,0 10" fill="#22c55e"/>
    </marker>
    <marker id="arr-gr" markerWidth="14" markerHeight="10" refX="14" refY="5" orient="auto" markerUnits="userSpaceOnUse">
      <polygon points="0 0,14 5,0 10" fill="#9ca3af"/>
    </marker>
    <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="4" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="glow-sm" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="2.5" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <rect width="800" height="720" fill="#f3f4f6" rx="4"/>

  <!-- ══════════════════════════════════════════════════════ -->
  <!-- DATA SOURCES (top row) -->
  <!-- ══════════════════════════════════════════════════════ -->

  <rect x="115" y="15" width="170" height="58" rx="8" fill="#e5e7eb" stroke="#d1d5db" stroke-width="1.5"/>
  <text x="200" y="40" text-anchor="middle" font-family="sans-serif" font-size="12" font-weight="bold" fill="#374151">Unstructured</text>
  <text x="200" y="58" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#6b7280">Data Sources</text>

  <rect x="315" y="15" width="170" height="58" rx="8" fill="#e5e7eb" stroke="#d1d5db" stroke-width="1.5"/>
  <text x="400" y="40" text-anchor="middle" font-family="sans-serif" font-size="12" font-weight="bold" fill="#374151">Semi-structured</text>
  <text x="400" y="58" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#6b7280">Data Sources</text>

  <rect x="515" y="15" width="170" height="58" rx="8" fill="#e5e7eb" stroke="#d1d5db" stroke-width="1.5"/>
  <text x="600" y="40" text-anchor="middle" font-family="sans-serif" font-size="12" font-weight="bold" fill="#374151">Structured</text>
  <text x="600" y="58" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#6b7280">Data Sources</text>

  <!-- Converging arrows → Ingestion -->
  <path d="M 200,73 C 200,100 400,100 400,110" stroke="#9ca3af" stroke-width="2" fill="none" marker-end="url(#arr-gr)"/>
  <path d="M 400,73 L 400,110"                  stroke="#9ca3af" stroke-width="2" fill="none" marker-end="url(#arr-gr)"/>
  <path d="M 600,73 C 600,100 400,100 400,110"  stroke="#9ca3af" stroke-width="2" fill="none" marker-end="url(#arr-gr)"/>

  <!-- ══════════════════════════════════════════════════════ -->
  <!-- INGESTION PIPELINE -->
  <!-- ══════════════════════════════════════════════════════ -->
  <a class="node-link" href="autograph/">
    <rect x="325" y="110" width="150" height="58" rx="9" class="suite-node-hl"
          fill="#0f3726" stroke="#22c55e" stroke-width="2" filter="url(#glow-sm)"/>
    <text x="400" y="135" text-anchor="middle" font-family="sans-serif" font-size="13" font-weight="bold" fill="#ffffff">Ingestion Pipeline</text>
    <text x="400" y="153" text-anchor="middle" font-family="sans-serif" font-size="10" fill="#86efac">AutoGraph</text>
  </a>

  <!-- Ingestion → left side (external leg, no arrowhead) -->
  <path d="M 325,139 L -14,139 L -14,401" stroke="#22c55e" stroke-width="2.5" fill="none"/>

  <!-- ══════════════════════════════════════════════════════ -->
  <!-- MAIN SUITE FRAME -->
  <!-- ══════════════════════════════════════════════════════ -->
  <rect x="10" y="200" width="780" height="400" rx="14" fill="#0b2218" stroke="#22c55e" stroke-width="2"/>
  <rect x="10" y="200" width="780" height="32"  rx="14" fill="#134d2e"/>
  <rect x="10" y="216" width="780" height="16"  fill="#134d2e"/>
  <circle cx="32"  cy="216" r="6" fill="#ff5f57"/>
  <circle cx="52"  cy="216" r="6" fill="#febc2e"/>
  <circle cx="72"  cy="216" r="6" fill="#28c840"/>
  <text x="400" y="221" text-anchor="middle" font-family="sans-serif" font-size="13" font-weight="bold" fill="#ffffff">Arango Agentic AI Suite</text>


  <!-- Entry segment: drawn on top of suite frame so arrowhead is visible -->
  <path d="M -14,401 L 35,401" stroke="#22c55e" stroke-width="2.5" fill="none" marker-end="url(#arr-g)"/>

  <!-- ══════════ COMBINED TILE: Chunks + Knowledge Shards ══════════ -->
  <rect x="35" y="244" width="180" height="208" rx="10" fill="#0f3726" stroke="#22c55e" stroke-width="2"/>
  <!-- Divider -->
  <line x1="39" y1="348" x2="211" y2="348" stroke="#22c55e" stroke-width="0.8" opacity="0.45"/>

  <!-- Chunks (top half) -->
  <a class="node-link" href="graphrag/">
    <rect x="35" y="244" width="180" height="104" rx="10" fill="transparent"/>
    <text x="125" y="291" text-anchor="middle" font-family="sans-serif" font-size="13" font-weight="bold" fill="#ffffff">Chunks</text>
    <text x="125" y="309" text-anchor="middle" font-family="sans-serif" font-size="10" fill="#86efac">Document fragments</text>
  </a>

  <!-- Knowledge Shards (bottom half) -->
  <a class="node-link" href="autograph/">
    <rect x="35" y="348" width="180" height="104" rx="10" fill="transparent"/>
    <text x="125" y="390" text-anchor="middle" font-family="sans-serif" font-size="13" font-weight="bold" fill="#ffffff">Knowledge</text>
    <text x="125" y="408" text-anchor="middle" font-family="sans-serif" font-size="13" font-weight="bold" fill="#ffffff">Shards</text>
    <text x="125" y="426" text-anchor="middle" font-family="sans-serif" font-size="10" fill="#86efac">AutoGraph</text>
  </a>

  <!-- ══════════ CLUSTER (graph clustering) ══════════ -->
  <a class="node-link" href="graph-analytics/">
    <rect x="265" y="244" width="165" height="88" rx="8" class="suite-node"
          fill="#153d28" stroke="#4ade80" stroke-width="1.5"/>
    <text x="347" y="282" text-anchor="middle" font-family="sans-serif" font-size="13" font-weight="bold" fill="#ffffff">Cluster</text>
    <text x="347" y="300" text-anchor="middle" font-family="sans-serif" font-size="10" fill="#86efac">Graph clustering</text>
  </a>

  <!-- ══════════ CONTEXTRAG (top-right) ══════════ -->
  <a class="node-link" href="graphrag/">
    <rect x="475" y="244" width="280" height="88" rx="8" class="suite-node-hl"
          fill="#0f3726" stroke="#22c55e" stroke-width="2" filter="url(#glow-sm)"/>
    <text x="615" y="282" text-anchor="middle" font-family="sans-serif" font-size="13" font-weight="bold" fill="#ffffff">ContextRAG</text>
    <text x="615" y="300" text-anchor="middle" font-family="sans-serif" font-size="10" fill="#86efac">Graph-aware retrieval</text>
  </a>

  <!-- ══════════ CENTRAL CLUSTER (ArangoDB) ══════════ -->
  <rect x="265" y="352" width="165" height="100" rx="10" fill="#082016" stroke="#22c55e" stroke-width="3" filter="url(#glow)"/>
  <text x="347" y="393" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="bold" fill="#22c55e">Cluster</text>
  <text x="347" y="413" text-anchor="middle" font-family="sans-serif" font-size="10" fill="#86efac">ArangoDB</text>
  <text x="347" y="431" text-anchor="middle" font-family="sans-serif" font-size="9"  fill="#4ade80">MegaGraph</text>

  <!-- ══════════ CO-PILOT BUILDER ══════════ -->
  <a class="node-link" href="autograph/">
    <rect x="475" y="352" width="280" height="100" rx="8" class="suite-node-hl"
          fill="#0f3726" stroke="#22c55e" stroke-width="2" filter="url(#glow-sm)"/>
    <text x="615" y="393" text-anchor="middle" font-family="sans-serif" font-size="13" font-weight="bold" fill="#ffffff">Arango Co-pilot</text>
    <text x="615" y="411" text-anchor="middle" font-family="sans-serif" font-size="13" font-weight="bold" fill="#ffffff">Builder</text>
    <text x="615" y="429" text-anchor="middle" font-family="sans-serif" font-size="10" fill="#86efac">AutoGraph</text>
  </a>

  <!-- ══════════ BOTTOM ROW ══════════ -->

  <!-- ContextRAG (bottom-left) -->
  <a class="node-link" href="graphrag/">
    <rect x="35" y="472" width="180" height="78" rx="8" class="suite-node"
          fill="#153d28" stroke="#4ade80" stroke-width="1.5"/>
    <text x="125" y="507" text-anchor="middle" font-family="sans-serif" font-size="13" font-weight="bold" fill="#ffffff">ContextRAG</text>
    <text x="125" y="525" text-anchor="middle" font-family="sans-serif" font-size="10" fill="#86efac">Knowledge extraction</text>
  </a>

  <!-- AutoRAG -->
  <a class="node-link" href="autograph/">
    <rect x="265" y="472" width="165" height="78" rx="8" class="suite-node-hl"
          fill="#0f3726" stroke="#22c55e" stroke-width="2" filter="url(#glow-sm)"/>
    <text x="347" y="507" text-anchor="middle" font-family="sans-serif" font-size="13" font-weight="bold" fill="#ffffff">AutoRAG</text>
    <text x="347" y="525" text-anchor="middle" font-family="sans-serif" font-size="10" fill="#86efac">Auto-retrieval</text>
  </a>

  <!-- Vector Embedding Store -->
  <a class="node-link" href="graphrag/">
    <rect x="475" y="472" width="280" height="78" rx="8" class="suite-node"
          fill="#153d28" stroke="#4ade80" stroke-width="1.5"/>
    <text x="615" y="507" text-anchor="middle" font-family="sans-serif" font-size="13" font-weight="bold" fill="#ffffff">Vector Embedding Store</text>
    <text x="615" y="525" text-anchor="middle" font-family="sans-serif" font-size="10" fill="#86efac">ArangoDB</text>
  </a>

  <!-- ══════════════════════════════════════════════════════ -->
  <!-- SUITE INTERNAL ARROWS -->
  <!-- ══════════════════════════════════════════════════════ -->

  <!-- Chunks → Central Cluster (right then down, enters left edge) -->
  <path d="M 215,296 L 242,296 L 242,390 L 265,390" stroke="#22c55e" stroke-width="1.5" fill="none" marker-end="url(#arr-g)"/>

  <!-- Cluster-top ↓ → Central Cluster -->
  <path d="M 347,332 L 347,352" stroke="#22c55e" stroke-width="1.5" fill="none" marker-end="url(#arr-g)"/>

  <!-- Knowledge Shards → Central Cluster (right) -->
  <path d="M 215,401 L 265,401" stroke="#22c55e" stroke-width="1.5" fill="none" marker-end="url(#arr-g)"/>

  <!-- Central Cluster → ContextRAG-top (right+up through gap) -->
  <path d="M 430,370 L 453,370 L 453,288 L 475,288" stroke="#22c55e" stroke-width="1.5" fill="none" marker-end="url(#arr-g)"/>

  <!-- Central Cluster → Co-pilot Builder (right) -->
  <path d="M 430,401 L 475,401" stroke="#22c55e" stroke-width="2" fill="none" marker-end="url(#arr-g)"/>

  <!-- Co-pilot Builder ↑ → ContextRAG-top -->
  <path d="M 615,352 L 615,332" stroke="#22c55e" stroke-width="1.5" fill="none" marker-end="url(#arr-g)"/>

  <!-- Co-pilot Builder ↓ → Vector Store -->
  <path d="M 615,452 L 615,472" stroke="#22c55e" stroke-width="1.5" fill="none" marker-end="url(#arr-g)"/>

  <!-- ContextRAG-bot → Central Cluster (right+up) -->
  <path d="M 215,511 L 242,511 L 242,412 L 265,412" stroke="#22c55e" stroke-width="1.5" fill="none" marker-end="url(#arr-g)"/>

  <!-- Central Cluster ↓ → AutoRAG -->
  <path d="M 347,452 L 347,472" stroke="#22c55e" stroke-width="1.5" fill="none" marker-end="url(#arr-g)"/>

  <!-- AutoRAG → Vector Store (right) -->
  <path d="M 430,511 L 475,511" stroke="#22c55e" stroke-width="1.5" fill="none" marker-end="url(#arr-g)"/>


  <!-- ══════════════════════════════════════════════════════ -->
  <!-- EXIT: Co-pilot Builder → Query-Response (below) -->
  <!-- ══════════════════════════════════════════════════════ -->
  <path d="M 755,401 L 793,401 L 793,653 L 600,653" stroke="#22c55e" stroke-width="2.5" fill="none" marker-end="url(#arr-g)"/>

  <!-- ══════════════════════════════════════════════════════ -->
  <!-- QUERY-RESPONSE (bottom-right) -->
  <!-- ══════════════════════════════════════════════════════ -->
  <rect x="200" y="628" width="400" height="75" rx="10" fill="#f9fafb" stroke="#d1d5db" stroke-width="1.5"/>
  <text x="400" y="648" text-anchor="middle" font-family="sans-serif" font-size="11" font-weight="bold" fill="#6b7280">Query — Response</text>

  <!-- Human -->
  <rect x="215" y="657" width="100" height="36" rx="6" fill="#ffffff" stroke="#e5e7eb" stroke-width="1.5"/>
  <text x="265" y="680" text-anchor="middle" font-family="sans-serif" font-size="12" font-weight="bold" fill="#374151">Human</text>

  <!-- Co-pilot -->
  <a class="node-link" href="autograph/">
    <rect x="350" y="657" width="100" height="36" rx="6" class="right-node" fill="#dcfce7" stroke="#22c55e" stroke-width="1.5"/>
    <text x="400" y="680" text-anchor="middle" font-family="sans-serif" font-size="12" font-weight="bold" fill="#166534">Co-pilot</text>
  </a>

  <!-- LLM -->
  <rect x="485" y="657" width="100" height="36" rx="6" fill="#ffffff" stroke="#e5e7eb" stroke-width="1.5"/>
  <text x="535" y="680" text-anchor="middle" font-family="sans-serif" font-size="12" font-weight="bold" fill="#374151">LLM</text>

</svg>
</div>

## Sample datasets

If you want to try out ArangoDB's data science features, you may use the
[`arango-datasets` Python package](../ecosystem/arango-datasets.md)
to load sample datasets into a deployment.
