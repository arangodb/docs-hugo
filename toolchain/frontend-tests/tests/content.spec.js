const { test, expect, open, waitForApp, matchesMedia } = require("./fixtures");

test.describe("tabs", () => {
  const PAGE = "/arangodb/stable/aql/fundamentals/subqueries/";

  test("switch the panel and remember the selection", async ({ page }) => {
    await open(page, PAGE);
    const panel = page.locator("article .tab-panel").first();
    const tabs = panel.locator("[role=tab]");
    const second = tabs.nth(1);
    await second.scrollIntoViewIfNeeded();
    await second.click();
    await expect(second).toHaveAttribute("aria-selected", "true");
    await expect(tabs.first()).toHaveAttribute("aria-selected", "false");
    await expect(panel.locator(".tab-item.selected")).toHaveCount(1);
    await expect(panel.locator(".tab-item.selected")).toBeVisible();
    const selectedText = await panel.locator(".tab-item.selected").innerText();

    await page.reload();
    await open(page, PAGE);
    await expect(panel.locator("[role=tab]").nth(1)).toHaveAttribute("aria-selected", "true");
    // innerText like above: textContent has no breaks between block elements
    await expect(panel.locator(".tab-item.selected")).toHaveText(selectedText, { useInnerText: true });
  });

  test("switch with the arrow keys, Home, and End", async ({ page }) => {
    await open(page, PAGE);
    const tabs = page.locator("article .tab-panel").first().locator("[role=tab]");
    const count = await tabs.count();
    expect(count).toBeGreaterThan(1);
    await tabs.first().click();
    await expect(tabs.first()).toBeFocused();

    const expectSelected = async i => {
      await expect(tabs.nth(i)).toBeFocused();
      await expect(tabs.nth(i)).toHaveAttribute("aria-selected", "true");
      await expect(tabs.nth(i)).toHaveAttribute("tabindex", "0");
    };
    await page.keyboard.press("ArrowRight");
    await expectSelected(1);
    await expect(tabs.first()).toHaveAttribute("tabindex", "-1");
    await page.keyboard.press("ArrowLeft");
    await expectSelected(0);
    // Wraps around
    await page.keyboard.press("ArrowLeft");
    await expectSelected(count - 1);
    await page.keyboard.press("Home");
    await expectSelected(0);
    await page.keyboard.press("End");
    await expectSelected(count - 1);
  });

  test("underline the selected tab only and stay inside the panel", async ({ page }) => {
    await open(page, PAGE);
    const panels = page.locator("article .tab-panel");
    await expect(panels.first()).toBeAttached();
    const problems = await panels.evaluateAll(panels => {
      const problems = [];
      panels.forEach((panel, p) => {
        const box = panel.getBoundingClientRect();
        for (const tab of panel.querySelectorAll("[role=tab]")) {
          const underline = getComputedStyle(tab, "::after");
          const selected = tab.getAttribute("aria-selected") === "true";
          if ((underline.content !== "none" && underline.height === "2px") !== selected) {
            problems.push(`${p}: ${tab.textContent.trim()} underline ${underline.content} ${underline.height}`);
          }
          // The tabs wrap on narrow screens instead of sticking out
          const r = tab.getBoundingClientRect();
          if (r.left < box.left - 1 || r.right > box.right + 1) problems.push(`${p}: ${tab.textContent.trim()} outside`);
        }
      });
      return problems;
    });
    expect(problems).toEqual([]);
  });
});

test.describe("narrow screens", () => {
  // Narrower than most phones
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
  });

  for (const path of [
    // URLs as link labels
    "/arangodb/stable/develop/http-api/monitoring/metrics/",
    "/arangodb/stable/release-notes/version-3.12/incompatible-changes-in-3-12/",
    "/ecosystem/integrations/arangodb-tinkerpop-provider/",
    // Long identifiers in a nested list and in bold text
    "/arangodb/stable/release-notes/version-3.0/incompatible-changes-in-3-0/",
    "/contextual-data-platform/graphml/notebooks-api/",
    // Headings that fill the line, with the link icon after them
    "/arangodb/stable/release-notes/version-3.11/incompatible-changes-in-3-11/",
    "/contextual-data-platform/install-and-upgrade/",
    "/ecosystem/integrations/spring-data-arangodb/mapping/",
  ]) {
    test(`don't scroll horizontally: ${path}`, async ({ page }) => {
      await open(page, path);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
    });
  }

  for (const width of [360, 1280]) {
    test(`heading link icons fit after the last word: ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      // Many headings of different levels and lengths
      await open(page, "/arangodb/stable/release-notes/version-3.12/whats-new-in-3-12/");
      const problems = await page.locator("article :is(h2, h3, h4, h5, h6):has(> .header-link)").evaluateAll(headings => headings.flatMap(h => {
        const link = h.querySelector(":scope > .header-link");
        const icon = link.querySelector(".icon").getBoundingClientRect();
        const content = h.closest(".article-body").getBoundingClientRect();
        // The text before the icon, its last line
        const range = document.createRange();
        range.setStart(h, 0);
        range.setEndBefore(link);
        const lines = [...range.getClientRects()].filter(r => r.width);
        const last = lines.reduce((a, r) => r.bottom > a.bottom ? r : a, lines[0]);
        const middle = (icon.top + icon.bottom) / 2;
        const problems = [];
        if (icon.right > content.right + 0.5) problems.push(`${h.id}: sticks out by ${icon.right - content.right}px`);
        // Not on a line of its own, which looks like an empty line while hidden
        if (!(middle > last.top && middle < last.bottom)) problems.push(`${h.id}: not on the last line`);
        return problems;
      }));
      expect(problems).toEqual([]);
    });
  }

  test("URLs as link labels wrap between path segments", async ({ page }) => {
    await open(page, "/arangodb/stable/develop/http-api/monitoring/metrics/");
    const links = page.locator("article a.link:has(wbr)");
    await expect(links.first()).toBeAttached();
    const result = await links.evaluateAll(links => {
      let wrapped = 0;
      const broken = [];
      for (const a of links) {
        if (new Set([...a.getClientRects()].map(r => Math.round(r.top))).size > 1) wrapped++;
        // The text between two hints, e.g. "docs.arango.ai/", stays on one line
        for (const node of a.childNodes) {
          if (node.nodeType !== Node.TEXT_NODE || !node.data) continue;
          const range = document.createRange();
          range.selectNodeContents(node);
          if (new Set([...range.getClientRects()].filter(r => r.width).map(r => Math.round(r.top))).size > 1) broken.push(node.data);
        }
      }
      return { wrapped, broken };
    });
    expect(result.wrapped).toBeGreaterThan(0);
    expect(result.broken).toEqual([]);
  });
});

test.describe("space below code blocks", () => {
  for (const [name, path] of [
    // Text after code in an item of a tight list (no <p>), and the next item
    ["tight lists", "/arangodb/stable/aql/functions/type-check-and-cast/"],
    // Code fences without a language (no .highlight wrapper), one after another
    ["plain code blocks", "/arangodb/stable/operations/administration/user-management/in-arangosh/"],
    // The "Bind Parameters" label of examples, a bare <strong>
    ["example labels", "/arangodb/stable/aql/examples-and-query-patterns/joins/"],
  ]) {
    test(`separates code from what follows: ${name}`, async ({ page }) => {
      await open(page, path);
      const gaps = await page.evaluate(() => {
        const article = document.querySelector("article");
        const boxed = "img, svg, table, pre, hr, details, .tab-panel, .box";
        // Not the hidden output in collapsed details boxes
        const shown = pre => !pre.closest("details:not([open])") && pre.getClientRects().length;
        return [...article.querySelectorAll("pre:not(.mermaid)")].filter(shown).map(pre => {
          // The next text or boxed element in document order
          const walker = document.createTreeWalker(article, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
          walker.currentNode = pre;
          let node = walker.nextSibling() ? walker.currentNode : null;
          if (!node) {
            let el = pre;
            while (el && !el.nextSibling) el = el.parentNode;
            node = el && (walker.currentNode = el.nextSibling);
          }
          for (; node; node = walker.nextNode()) {
            let top = null;
            if (node.nodeType === Node.TEXT_NODE && node.data.trim()) {
              const range = document.createRange();
              range.selectNodeContents(node);
              top = [...range.getClientRects()].find(r => r.width)?.top;
            } else if (node.nodeType === Node.ELEMENT_NODE && node.matches(boxed) && shown(node)) {
              top = node.getBoundingClientRect().top;
            }
            if (top != null) return Math.round(top - pre.getBoundingClientRect().bottom);
          }
          return null;
        }).filter(gap => gap !== null);
      });
      expect(gaps.length).toBeGreaterThan(0);
      expect(Math.min(...gaps)).toBeGreaterThanOrEqual(14);
    });
  }

  test("at the end of a list, the list's spacing applies", async ({ page }) => {
    await open(page, "/contextual-data-platform/license-management/");
    const blocks = page.locator("article :is(ol, ul):has(+ *) > li:last-child > .highlight:last-child > pre");
    await expect(blocks.first()).toBeAttached();
    const results = await blocks.evaluateAll(pres => pres.map(pre => {
      const list = pre.closest("ol, ul");
      const next = list.nextElementSibling;
      return {
        gap: next.getBoundingClientRect().top - pre.getBoundingClientRect().bottom,
        // Collapsed margins: no extra space from the code block
        expected: Math.max(parseFloat(getComputedStyle(list).marginBottom), parseFloat(getComputedStyle(next).marginTop)),
      };
    }));
    for (const { gap, expected } of results) expect(Math.abs(gap - expected)).toBeLessThanOrEqual(1);
  });
});

test("long code blocks can be expanded", async ({ page }) => {
  await open(page, "/arangodb/stable/release-notes/version-3.12/whats-new-in-3-12/");
  // Fails rather than skips if the page has no long code block anymore
  const more = page.locator("article .code-show-more:visible").first();
  await expect(more).toBeAttached();
  const code = page.locator("article pre:has(.code-show-more:visible) .code-long").first();
  const collapsed = (await code.boundingBox()).height;
  await more.scrollIntoViewIfNeeded();
  await more.click();
  await expect.poll(async () => (await code.boundingBox()).height).toBeGreaterThan(collapsed);
});

test.describe("deep links to OpenAPI properties", () => {
  for (const [path, id, parents] of [
    ["/arangodb/stable/develop/http-api/batch-requests/", "execute-a-batch-request_res_200", []],
    // Nested property
    ["/arangodb/stable/develop/http-api/collections/", "create-a-collection_body_keyOptions_type", ["create-a-collection_body_keyOptions"]],
    // Array items (double underscore)
    ["/arangodb/stable/develop/http-api/queries/aql-query-results-cache/", "list-the-entries-of-the-aql-query-results-cache_res_200__hash", ["list-the-entries-of-the-aql-query-results-cache_res_200"]],
    // Property name with an underscore (_key), so the ID can't be split into parent IDs
    ["/arangodb/stable/develop/http-api/graphs/named-graphs/", "add-an-edge-definition_res_201_graph__key", ["add-an-edge-definition_res_201", "add-an-edge-definition_res_201_graph"]],
  ]) {
    test(`open the property and its parents: ${id}`, async ({ page }) => {
      await open(page, `${path}#${id}`);
      for (const target of [...parents, id]) {
        const details = page.locator(`[id="${target}"]`);
        await expect(details).toHaveAttribute("open", "");
        await expect(details.locator(":scope > summary")).not.toHaveClass(/collapsed/);
      }
    });
  }
});

test.describe("deep links", () => {
  for (const target of [
    "/arangodb/stable/graphs/example-graphs/#city-graph",
    "/arangodb/stable/indexes-and-search/arangosearch/geospatial-search/#search-for-polygons-within-polygons",
    "/arangodb/stable/develop/http-api/batch-requests/#execute-a-batch-request_res_200",
  ]) {
    test(`scroll to the target: ${target}`, async ({ page }) => {
      await open(page, target);
      const id = target.split("#")[1];
      // Wait for late layout changes, like images, code blocks being collapsed, and diagrams
      await page.waitForLoadState("load");
      await page.waitForTimeout(1000);
      const top = await page.locator(`#${id}`).evaluate(el => el.getBoundingClientRect().top);
      const padding = await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop));
      // A few pixels of rounding when the browser keeps the position while fonts swap
      expect(Math.abs(top - padding)).toBeLessThanOrEqual(4);
    });
  }
});

test.describe("deep links into a tab that isn't selected", () => {
  // An API v1 property: nested in details boxes, in the v1 tab while v0 is selected by default
  const PATH = "/arangodb/stable/develop/http-api/administration/";
  const ID = "get-the-server-version-apiv1_res_200_details_architecture";
  const PARENTS = ["get-the-server-version-apiv1_res_200", "get-the-server-version-apiv1_res_200_details"];
  const REMEMBERED = JSON.stringify({ "arangodb-api": "v0" });

  async function rememberTab(page) {
    await open(page, "/arangodb/stable/develop/http-api/");
    await page.evaluate(value => localStorage.setItem("tab-selections", value), REMEMBERED);
  }

  async function expectRevealed(page) {
    const selected = page.locator("article .tab-nav-button.selected[data-tab-group='arangodb-api']");
    await expect(selected.first()).toHaveAttribute("data-tab-item", "v1");
    for (const target of [...PARENTS, ID]) {
      const details = page.locator(`[id="${target}"]`);
      await expect(details).toHaveAttribute("open", "");
      await expect(details.locator(":scope > summary")).not.toHaveClass(/collapsed/);
    }
    await page.waitForLoadState("load");
    await page.waitForTimeout(1000);
    const top = await page.locator(`[id="${ID}"]`).evaluate(el => el.getBoundingClientRect().top);
    const padding = await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop));
    expect(Math.abs(top - padding)).toBeLessThanOrEqual(4);
    // Only shown for this view, the reader's choice stays
    expect(await page.evaluate(() => localStorage.getItem("tab-selections"))).toBe(REMEMBERED);
  }

  test("select the tab and open the parents when loading the page", async ({ page }) => {
    await rememberTab(page);
    await open(page, `${PATH}#${ID}`);
    await expectRevealed(page);
  });

  test("select the tab and open the parents when following a link", async ({ page }) => {
    await rememberTab(page);
    await page.evaluate(() => { window.__sameDocument = true; });
    // A link at a fixed position, so that clicking it doesn't scroll
    await page.evaluate(href => {
      const a = document.createElement("a");
      a.className = "link"; a.href = href; a.id = "test-link"; a.textContent = "test";
      a.style.cssText = "position: fixed; top: 100px; left: 50%; z-index: 100000";
      document.body.append(a);
    }, `${PATH}#${ID}`);
    await page.click("#test-link");
    await waitForApp(page);
    // Loaded by the app (loadPage), not by a full page load
    expect(await page.evaluate(() => window.__sameDocument)).toBe(true);
    await expectRevealed(page);
  });
});

test("renders mermaid diagrams", async ({ page }) => {
  await open(page, "/contextual-data-platform/autograph/architecture/");
  // Mermaid is loaded from a CDN and rendered after the app is ready. Running
  // it takes about a second in WebKit, but 3.5s and more when the browsers of
  // a full test run compete for the CPU, close to the default timeout of 5s.
  await expect(page.locator("article pre.mermaid > svg").first()).toBeVisible({ timeout: 20000 });
});

test.describe("image viewer", () => {
  test("enlarges images and closes with Escape", async ({ page }) => {
    await open(page, "/arangodb/stable/components/web-interface/graphs/");
    const img = page.locator("article img[data-zoomable]").first();
    await img.scrollIntoViewIfNeeded();
    await img.click();
    const viewer = page.locator(".image-viewer");
    await expect(viewer).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(viewer).toBeHidden();
  });

  test("enlarges embedded SVG diagrams and closes with Escape", async ({ page }) => {
    await open(page, "/arangodb/stable/graphs/example-graphs/");
    const svg = page.locator("article .svg-figure svg[data-zoomable]").first();
    await svg.scrollIntoViewIfNeeded();
    await svg.click();
    const viewer = page.locator(".image-viewer");
    await expect(viewer).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(viewer).toBeHidden();
  });

  test.describe("zoom hint", () => {
    // The last screenshot is further down than the linked page is long
    const LONG_PAGE = "/contextual-data-platform/autograph/web-interface/";
    const SHORT_PAGE = "/contextual-data-platform/autorag/";

    test.beforeEach(async ({ page }) => {
      await page.goto("about:blank");
      test.skip(!(await matchesMedia(page, "(hover: hover)")), "Only shown on devices with hover");
    });

    /** Hover the last screenshot of the long page, so that the hint is shown far down. */
    async function hoverLastImage(page) {
      await open(page, LONG_PAGE);
      const img = page.locator("article [data-zoomable]").last();
      await img.scrollIntoViewIfNeeded();
      await img.hover();
      await expect(page.locator(".image-zoom-hint")).toHaveClass(/visible/);
    }

    /** The link to the short page at the end of the long page. */
    function linkToShortPage(page) {
      return page.locator(`article a[href="${SHORT_PAGE}"]`).last();
    }

    /** By how much the hint makes the document taller than its content. */
    function extraHeight(page) {
      return page.evaluate(() => {
        const hint = document.querySelector(".image-zoom-hint");
        const withHint = document.documentElement.scrollHeight;
        hint.style.display = "none";
        const without = document.documentElement.scrollHeight;
        hint.style.display = "";
        return withHint - without;
      });
    }

    test("doesn't make the page longer before it is shown", async ({ page }) => {
      await open(page, SHORT_PAGE);
      expect(await extraHeight(page)).toBe(0);
    });

    test("doesn't let the next page scroll past its end", async ({ page }) => {
      await hoverLastImage(page);
      // Moving the pointer to the link hides the hint
      await linkToShortPage(page).click();
      await expect(page).toHaveURL(SHORT_PAGE);
      await waitForApp(page);
      await expect.poll(() => extraHeight(page)).toBe(0);
    });

    test("is hidden when another page is loaded without moving the pointer", async ({ page }) => {
      await hoverLastImage(page);
      await linkToShortPage(page).evaluate(a => a.click());
      await expect(page).toHaveURL(SHORT_PAGE);
      await waitForApp(page);
      await expect(page.locator(".image-zoom-hint")).not.toHaveClass(/visible/);
      await expect.poll(() => extraHeight(page)).toBe(0);
    });

    test("is hidden when details are toggled", async ({ page }) => {
      // A page with an illustration and a details box
      await open(page, "/arangodb/stable/aql/examples-and-query-patterns/traversals/");
      const img = page.locator("article [data-zoomable]").first();
      await img.scrollIntoViewIfNeeded();
      await img.hover();
      const hint = page.locator(".image-zoom-hint");
      await expect(hint).toHaveClass(/visible/);
      // With the keyboard, so that the pointer stays on the illustration
      await page.locator("article details.details-box > summary").first().focus();
      await page.keyboard.press("Enter");
      await expect(hint).not.toHaveClass(/visible/);
    });
  });

  test("doesn't offer to enlarge small icons", async ({ page }) => {
    await open(page, "/arangodb/stable/use-cases/");
    const icons = page.locator("article img[src*='/icon-']");
    await expect(icons.first()).toBeVisible();
    await expect(page.locator("article img[src*='/icon-'][data-zoomable]")).toHaveCount(0);
  });
});

test("back to top button appears after scrolling and scrolls up", async ({ page }) => {
  await open(page, "/arangodb/stable/graphs/example-graphs/");
  const button = page.locator(".back-to-top");
  await expect(button).toBeHidden();
  await page.evaluate(() => window.scrollTo(0, 2000));
  await expect(button).toBeVisible();
  await button.click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
});

test("search opens the search dialog", async ({ page }) => {
  await open(page, "/arangodb/stable/");
  // DocSearch is loaded from a CDN
  test.skip(!(await page.evaluate(() => !!window.docsearch)), "DocSearch not available (offline?)");
  const toggle = page.locator(".sidebar-toggle-navigation");
  const button = page.locator(".DocSearch-Button");
  if (!(await button.isVisible()) && await toggle.isVisible()) await toggle.click();
  await button.click();
  await expect(page.locator(".DocSearch-Modal")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".DocSearch-Modal")).toHaveCount(0);
});
