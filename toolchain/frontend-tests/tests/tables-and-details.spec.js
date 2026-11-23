const { test, expect, open } = require("./fixtures");

test.describe("tables", () => {
  // Many tables with long inline code, broken up with <wbr> hints
  const PAGE = "/arangodb/stable/release-notes/version-3.12/whats-new-in-3-12/";
  // Tables with short inline code (nowrap-wide)
  const SHORT_CODE_PAGE = "/arangodb/stable/aql/functions/type-check-and-cast/";

  test("are wrapped in a container and have a rounded outer border without double lines", async ({ page }) => {
    await open(page, PAGE);
    await expect(page.locator("article .table-wrapper > table").first()).toBeAttached();
    expect(await page.locator("article table").count()).toBe(await page.locator("article .table-wrapper > table").count());

    const problems = await page.locator("article .table-wrapper > table").evaluateAll(tables => {
      const px = (el, prop, pseudo) => parseFloat(getComputedStyle(el, pseudo)[prop]);
      const problems = [];
      tables.forEach((table, t) => {
        const style = getComputedStyle(table);
        if (style.borderCollapse !== "separate") problems.push(`${t}: border-collapse ${style.borderCollapse}`);
        if (!(px(table, "borderTopLeftRadius") > 0)) problems.push(`${t}: not rounded`);
        if (px(table, "borderTopWidth") !== 1) problems.push(`${t}: no outer border`);
        const rows = [...table.querySelectorAll(":scope > * > tr")];
        rows.forEach((row, r) => {
          const cells = [...row.children];
          cells.forEach((cell, c) => {
            const right = px(cell, "borderRightWidth");
            const bottom = px(cell, "borderBottomWidth");
            // The outer border of the table is the only line at the edges
            if (right !== (c === cells.length - 1 ? 0 : 1)) problems.push(`${t}/${r}/${c}: right border ${right}`);
            if (bottom !== (r === rows.length - 1 ? 0 : 1)) problems.push(`${t}/${r}/${c}: bottom border ${bottom}`);
            if (px(cell, "borderTopWidth") || px(cell, "borderLeftWidth")) problems.push(`${t}/${r}/${c}: top or left border`);
          });
        });
      });
      return problems;
    });
    expect(problems).toEqual([]);
  });

  test("don't widen the page", async ({ page }) => {
    await open(page, PAGE);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  });

  test("break long inline code at the hints, never within a word", async ({ page }) => {
    await open(page, PAGE);
    await expect(page.locator("article .table-wrapper code:has(wbr)").first()).toBeAttached();
    const broken = await page.locator("article .table-wrapper code").evaluateAll(codes => {
      const broken = [];
      for (const code of codes) {
        // The text nodes between the hints, word by word
        for (const node of code.childNodes) {
          if (node.nodeType !== Node.TEXT_NODE) continue;
          for (const m of node.data.matchAll(/\S+/g)) {
            const range = document.createRange();
            range.setStart(node, m.index);
            range.setEnd(node, m.index + m[0].length);
            const lines = new Set([...range.getClientRects()].filter(r => r.width).map(r => Math.round(r.top)));
            if (lines.size > 1) broken.push(m[0]);
          }
        }
        // The code doesn't stick out of its cell
        const cell = code.closest("td, th").getBoundingClientRect();
        const box = code.getBoundingClientRect();
        if (box.right > cell.right + 1) broken.push(`overflows: ${code.textContent}`);
      }
      return broken;
    });
    expect(broken).toEqual([]);
  });

  test("keep short inline code in one piece if there is enough space", async ({ page }) => {
    await open(page, SHORT_CODE_PAGE);
    const codes = page.locator("article .table-wrapper code.nowrap-wide:has(wbr)");
    await expect(codes.first()).toBeAttached();
    const results = await codes.evaluateAll(codes => codes.map(code => {
      const wrapper = code.closest(".table-wrapper");
      // The container query of the CSS, 36rem
      const wide = wrapper.clientWidth >= 36 * parseFloat(getComputedStyle(document.documentElement).fontSize);
      const hidden = [...code.querySelectorAll("wbr")].every(wbr => getComputedStyle(wbr).display === "none");
      return { wide, hidden, lines: code.getClientRects().length };
    }));
    for (const { wide, hidden, lines } of results) {
      // The hints only apply on narrow screens
      expect(hidden).toBe(wide);
      if (wide) expect(lines).toBe(1);
    }
  });

  test("scroll in their wrapper on small screens if they can't be narrower", async ({ page }) => {
    // Narrower than most phones. A table on this page has more unbreakable
    // content than fits even if every other column wraps as much as possible.
    await page.setViewportSize({ width: 360, height: 740 });
    await open(page, "/arangodb/stable/indexes-and-search/analyzers/");
    const widest = await page.locator("article .table-wrapper").evaluateAll(wrappers => {
      const overflow = wrappers.map(w => w.scrollWidth - w.clientWidth);
      return overflow.indexOf(Math.max(...overflow));
    });
    const wrapper = page.locator("article .table-wrapper").nth(widest);
    const sizes = await wrapper.evaluate(el => ({
      scroll: el.scrollWidth, client: el.clientWidth,
      article: el.closest("article").getBoundingClientRect().right,
      right: el.getBoundingClientRect().right,
    }));
    expect(sizes.scroll).toBeGreaterThan(sizes.client);
    // The wrapper, not the table, defines the width
    expect(sizes.right).toBeLessThanOrEqual(sizes.article + 1);
    // It can be scrolled
    await wrapper.evaluate(el => { el.scrollLeft = 100; });
    expect(await wrapper.evaluate(el => el.scrollLeft)).toBeGreaterThan(0);
  });
});

test.describe("details boxes", () => {
  // Example code with output (render.html)
  const EXAMPLE_PAGE = "/arangodb/stable/aql/execution-and-performance/parsing-queries/";
  // The details shortcode
  const SHORTCODE_PAGE = "/arangodb/stable/develop/http-api/batch-requests/";
  // Startup options with a long description (program-options.md)
  const OPTIONS_PAGE = "/arangodb/stable/components/tools/arangodb-shell/options/";

  for (const [name, path, summary] of [
    ["example output", EXAMPLE_PAGE, "Show output"],
    ["details shortcode", SHORTCODE_PAGE, "Show output"],
    ["startup options", OPTIONS_PAGE, "Show details"],
  ]) {
    test(`expand and collapse in place: ${name}`, async ({ page }) => {
      await open(page, path);
      const box = page.locator("article details.details-box").filter({ has: page.locator(`:scope > summary`, { hasText: summary }) }).first();
      const body = box.locator(":scope > .details-body");
      await expect(box).not.toHaveAttribute("open");
      await expect(body).toBeHidden();
      const summaryEl = box.locator(":scope > summary");
      await summaryEl.scrollIntoViewIfNeeded();
      const collapsed = await box.boundingBox();

      await summaryEl.click();
      await expect(box).toHaveAttribute("open", "");
      await expect(body).toBeVisible();
      // The content is inside the rounded box, below the summary
      const expanded = await box.boundingBox();
      const bodyBox = await body.boundingBox();
      const summaryBox = await summaryEl.boundingBox();
      expect(expanded.height).toBeGreaterThan(collapsed.height);
      expect(bodyBox.y).toBeGreaterThanOrEqual(summaryBox.y + summaryBox.height - 1);
      expect(bodyBox.y + bodyBox.height).toBeLessThanOrEqual(expanded.y + expanded.height + 1);
      expect(await box.evaluate(el => parseFloat(getComputedStyle(el).borderTopLeftRadius))).toBeGreaterThan(0);

      await summaryEl.click();
      await expect(box).not.toHaveAttribute("open");
      await expect(body).toBeHidden();
    });
  }

  test("can be toggled with the keyboard and show the focus ring around the box", async ({ page }) => {
    await open(page, EXAMPLE_PAGE);
    const box = page.locator("article details.details-box").first();
    const summary = box.locator(":scope > summary");
    await summary.focus();
    await page.keyboard.press("Enter");
    await expect(box).toHaveAttribute("open", "");
    await expect(summary).toBeFocused();
    const outline = await box.evaluate(el => ({
      box: getComputedStyle(el).outlineStyle,
      summary: getComputedStyle(el.querySelector(":scope > summary")).outlineStyle,
    }));
    expect(outline).toEqual({ box: "solid", summary: "none" });
    await page.keyboard.press("Enter");
    await expect(box).not.toHaveAttribute("open");
  });

  test("follow example code directly and are followed by the usual spacing", async ({ page }) => {
    // Many examples with output, followed by text or more examples
    await open(page, "/arangodb/stable/graphs/general-graphs/functions/");
    const boxes = page.locator("article .highlight + details.details-box:has(+ *)");
    await expect(boxes.first()).toBeAttached();
    const problems = await boxes.evaluateAll(boxes => boxes.flatMap((el, i) => {
      const css = e => getComputedStyle(e);
      const rect = e => e.getBoundingClientRect();
      const pre = el.previousElementSibling.querySelector(":scope > pre");
      const next = el.nextElementSibling;
      // Only the margin of the box, none of the code block
      const above = rect(el).top - rect(pre).bottom;
      const expectedAbove = parseFloat(css(el).marginTop);
      // Collapsed margins, no extra space from elements in between
      const below = rect(next).top - rect(el).bottom;
      const expectedBelow = Math.max(parseFloat(css(el).marginBottom), parseFloat(css(next).marginTop));
      const problems = [];
      if (Math.abs(above - expectedAbove) > 1) problems.push(`${i}: ${above}px above instead of ${expectedAbove}px`);
      if (Math.abs(below - expectedBelow) > 1) problems.push(`${i}: ${below}px below instead of ${expectedBelow}px (${next.tagName})`);
      return problems;
    }));
    expect(problems).toEqual([]);
  });

  test("have no extra space at the end of the expanded content", async ({ page }) => {
    await open(page, EXAMPLE_PAGE);
    const box = page.locator("article details.details-box").first();
    await box.locator(":scope > summary").click();
    const margins = await box.locator(":scope > .details-body").evaluate(body => {
      const last = body.lastElementChild;
      const pre = last.matches(".highlight") ? last.querySelector(":scope > pre") : null;
      return [getComputedStyle(last).marginBottom, pre && getComputedStyle(pre).marginBottom];
    });
    expect(margins[0]).toBe("0px");
    if (margins[1] !== null) expect(margins[1]).toBe("0px");
  });
});

test.describe("accordion", () => {
  test("stacks details boxes with a single outline", async ({ page }) => {
    // Startup options, many details boxes
    await open(page, "/arangodb/stable/components/tools/arangodb-shell/options/");
    // No page uses the accordion shortcode at the moment, so build its markup
    // (shortcodes/accordion.html) from the details boxes of the page
    const result = await page.evaluate(() => {
      const boxes = [...document.querySelectorAll("article details.details-box")].slice(0, 3);
      const accordion = document.createElement("div");
      accordion.className = "details-accordion";
      boxes[0].before(accordion);
      accordion.append(...boxes);
      const css = el => getComputedStyle(el);
      return {
        count: boxes.length,
        outline: css(accordion).borderTopWidth,
        radius: parseFloat(css(accordion).borderTopLeftRadius),
        boxes: boxes.map(el => ({
          top: css(el).borderTopWidth, left: css(el).borderLeftWidth,
          bottom: css(el).borderBottomWidth, margin: css(el).marginTop,
        })),
      };
    });
    expect(result.count).toBe(3);
    expect(result.outline).toBe("1px");
    expect(result.radius).toBeGreaterThan(0);
    // The outline is the accordion's, with separators between the boxes
    expect(result.boxes).toEqual([
      { top: "0px", left: "0px", bottom: "0px", margin: "0px" },
      { top: "1px", left: "0px", bottom: "0px", margin: "0px" },
      { top: "1px", left: "0px", bottom: "0px", margin: "0px" },
    ]);

    // Each box still expands on its own
    const second = page.locator("article .details-accordion > details").nth(1);
    await second.locator(":scope > summary").click();
    await expect(second).toHaveAttribute("open", "");
    await expect(page.locator("article .details-accordion > details[open]")).toHaveCount(1);
  });
});
