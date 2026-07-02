---
title: Artifacts
menuTitle: Artifacts
weight: 15
description: >-
  The interactive charts and custom HTML that Ada renders alongside its chat
  answers
---

When Ada responds to a query, it may produce artifacts. An artifact is a
rendered output that appears alongside the chat message. Ada currently supports
two artifact types:

## React artifact (type: `react`)

A React artifact renders an interactive data visualization using Recharts
components.

- **Purpose**: Data visualizations using Recharts components (e.g., BarChart,
  PieChart, LineChart, AreaChart, RadarChart, etc.).
- **Features**: Interactive charts for dashboards and analytics. Highly
  customizable for comparing categories, trends, or distributions.
- **Example**:

  ```jsx
  const data = [
    { name: 'Active', value: 12 },
    { name: 'Inactive', value: 4 }
  ];

  function Chart() {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" />
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  }
  ```

## HTML artifact (type: `html`)

An HTML artifact renders custom HTML, CSS, or SVG directly in the chat panel.

- **Purpose**: Diagrams, dashboards, tables, content panels, styled lists, and
  other visual or interactive UI components outside of charting.
- **Features**: Flexible — can be standard HTML for tables, interactive
  diagrams (e.g., SVG), or explanatory layouts.
- **Example**:
  - An entity relationship diagram using SVG
  - Custom styled information boxes
  - HTML tables of data

## When to use each artifact type

- Use React artifacts for charts, graphs, and dashboards.
- Use HTML artifacts for diagrams, tables, or infographics not covered by
  charting.
