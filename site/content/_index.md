---
title: Arango Documentation
menuTitle: Home
weight: 1
description: >-
  Guides, references and quick starts for the Arango data platform, AI suite
  and database.
# The homepage body is rendered by the layout
# themes/arangodb-docs-theme/layouts/_default/home.html from the parameters
# below. Internal links are root-relative content paths and are checked like
# Markdown links (the build fails on broken links if failOnBrokenLinks is set).
home:
  # Picked from the docs analytics top pages and entry pages (Sep 2026)
  popular:
    - title: AQL fundamentals
      link: /arangodb/stable/aql/fundamentals/
    - title: AQL functions
      link: /arangodb/stable/aql/functions/
    - title: Graph traversals
      link: /arangodb/stable/aql/graph-queries/traversals/
    - title: Graph Visualizer
      link: /contextual-data-platform/graph-visualizer/
    - title: Python driver
      link: /ecosystem/drivers/python/
    - title: Java driver
      link: /ecosystem/drivers/java/
  start:
    title: Get started in minutes
    more:
      title: All Get started guides
      link: /get-started/
    items:
      - title: What is Arango?
        icon: /img/home/start-what-is.svg
        description: How the products fit together
        cta: Read the overview
        link: /get-started/what-is-arango/
      - title: Contextual Data Platform
        icon: /img/home/start-platform.svg
        description: About 10 minutes
        cta: Install the platform
        link: /get-started/contextual-data-platform/
      - title: ArangoDB
        icon: /img/home/start-arangodb.svg
        description: About 2 minutes in Docker
        cta: Run ArangoDB
        link: /get-started/arangodb/
  browse:
    title: Browse the documentation
    items:
      - title: AutoGraph
        icon: /img/home/graph.svg
        link: /contextual-data-platform/autograph/
        description: Turn documents into a knowledge graph and keep it current as your content changes.
        tags:
          - title: Quick start
            link: /contextual-data-platform/autograph/quick-start/
          - title: Web interface
            link: /contextual-data-platform/autograph/web-interface/
          - title: Incremental updates
            link: /contextual-data-platform/autograph/incremental-graph-updates/
      - title: AutoRAG
        icon: /img/home/sparkles.svg
        link: /contextual-data-platform/autorag/
        description: Retrieve graph-grounded context and answer questions over your knowledge graph.
        tags:
          - title: Quick start
            link: /contextual-data-platform/autorag/quick-start/
          - title: Search methods
            link: /contextual-data-platform/autorag/search-methods/
          - title: Execute queries
            link: /contextual-data-platform/autorag/executing-queries/
      - title: Natural Language to AQL
        icon: /img/home/assistant.svg
        link: /contextual-data-platform/natural-language-to-aql/
        description: Ask questions of your data in plain language and get AQL queries and answers.
        tags:
          - title: Quick start
            link: /contextual-data-platform/natural-language-to-aql/quick-start/
          - title: Web interface
            link: /contextual-data-platform/natural-language-to-aql/web-interface/
      - title: GraphML & Graph Analytics
        icon: /img/home/analytics.svg
        link: /contextual-data-platform/graphml/
        description: Train models and run analytics on graph structure.
        tags:
          - title: GraphML quick start
            link: /contextual-data-platform/graphml/quick-start/
          - title: GraphML web interface
            link: /contextual-data-platform/graphml/ui/
          - title: Graph Analytics quick start
            link: /contextual-data-platform/graph-analytics/quick-start/
          - title: Graph Analytics web interface
            link: /contextual-data-platform/graph-analytics/web-interface/
      - title: ArangoDB core
        icon: /img/home/database.svg
        link: /arangodb/stable/
        description: The multi-model database and its query language.
        tags:
          - title: AQL
            link: /arangodb/stable/aql/
          - title: Graphs
            link: /arangodb/stable/graphs/
          - title: Indexes and search
            link: /arangodb/stable/indexes-and-search/
          - title: HTTP API
            link: /arangodb/stable/develop/http-api/
      - title: Ecosystem
        icon: /img/home/layers.svg
        link: /ecosystem/
        description: Connect your applications with the AI SDK, official drivers, and integrations.
        tags:
          - title: AI SDK
            link: /ecosystem/arango-ai-sdk/
          - title: Drivers
            link: /ecosystem/drivers/
          - title: Integrations
            link: /ecosystem/integrations/
  news:
    title: What's new
    items:
      # {stable} is replaced with the stable ArangoDB version, e.g. 3.12.
      # unversioned keeps the version selector from rewriting the link.
      - title: ArangoDB {stable} release notes
        badge: Stable
        link: /arangodb/stable/release-notes/
        unversioned: true
      - title: Contextual Data Platform release notes
        link: /contextual-data-platform/release-notes/
      - title: Arango AI SDK
        badge: New
        link: /ecosystem/arango-ai-sdk/
  community:
    title: Community
    items:
      - title: GitHub
        link: https://github.com/arangodb/arangodb
      - title: Discord
        link: https://arango.ai/join-discord
      - title: Resources
        link: https://arango.ai/resources/
---
