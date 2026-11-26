const { test, expect, open, matchesMedia } = require("./fixtures");

// A page with an entry in the navigation and a table of contents
const PAGE = "/arangodb/stable/aql/fundamentals/subqueries/";

// The table of contents is a column from this width, a dropdown otherwise
const TOC_COLUMN = "(min-width: 1280px)";
// The sidebar can be collapsed from this width, and is a menu otherwise
const SIDEBAR = "(min-width: 769px)";

/** Safari only moves the focus to links with Tab if enabled in its settings. */
function skipTabbingInWebKit(browserName) {
  test.skip(browserName === "webkit", "Safari doesn't tab to links by default");
}

/** Whether the element is entirely in the viewport. */
function inViewport(locator) {
  return locator.evaluate(el => {
    const box = el.getBoundingClientRect();
    return box.top >= 0 && box.left >= 0 && box.bottom <= innerHeight && box.right <= innerWidth;
  });
}

test.describe("skip link", () => {
  test("is the first tab stop and skips to the page title", async ({ page, browserName }) => {
    skipTabbingInWebKit(browserName);
    await open(page, PAGE);
    // Also a regression test: centering the current navigation entry with
    // scrollIntoView() moved the starting point of focus navigation in Chrome
    await page.keyboard.press("Tab");
    const skip = page.locator(".skip-link");
    await expect(skip).toBeFocused();
    expect(await inViewport(skip)).toBe(true);

    await page.keyboard.press("Enter");
    await expect(page.locator("article h1")).toBeFocused();
    // No fragment in the URL
    await expect(page).toHaveURL(PAGE);

    // Then the table of contents: its first entry in the column, the dropdown otherwise
    await page.keyboard.press("Tab");
    if (await matchesMedia(page, TOC_COLUMN)) {
      await expect(page.locator(".toc-body a").first()).toBeFocused();
    } else {
      await expect(page.locator(".toc-details > summary")).toBeFocused();
    }
  });
});

test.describe("table of contents", () => {
  test("has a plain title in the column, not a summary that can be focused", async ({ page }) => {
    await open(page, PAGE);
    test.skip(!(await matchesMedia(page, TOC_COLUMN)), "No column on narrow screens");
    await expect(page.locator(".toc-title")).toBeVisible();
    await expect(page.locator(".toc-details > summary")).toBeHidden();
  });

  test("scroll containers are no tab stops of their own (Firefox)", async ({ page }) => {
    await open(page, PAGE);
    for (const selector of [".main-nav", ".toc", ".toc-entries"]) {
      await expect(page.locator(selector)).toHaveAttribute("tabindex", "-1");
    }
  });
});

test.describe("article actions", () => {
  test("come after the content and the previous/next links", async ({ page }) => {
    await open(page, PAGE);
    const order = await page.evaluate(() => {
      const following = (a, b) => !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
      const pager = document.querySelector("article .pagination");
      return [".edit-page", ".back-to-top"].map(s => following(pager, document.querySelector(`article ${s}`)));
    });
    expect(order).toEqual([true, true]);
  });

  test("back to top moves the focus to the main content", async ({ page }) => {
    await open(page, PAGE);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const button = page.locator(".back-to-top");
    await expect(button).toBeVisible();
    await button.focus();
    await page.keyboard.press("Enter");
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    await expect(page.locator("#main-content")).toBeFocused();
  });
});

test.describe("collapsed sidebar", () => {
  test("hides its entries and moves the focus between the toggles", async ({ page }) => {
    await open(page, PAGE);
    test.skip(!(await matchesMedia(page, SIDEBAR)), "No collapsible sidebar on narrow screens");
    const entry = page.locator(".main-nav .link-nav-active");
    await expect(entry).toBeVisible();

    await page.locator(".sidebar-collapse").focus();
    await page.keyboard.press("Enter");
    await expect(page.locator(".sidebar-expand")).toBeFocused();
    // Not just out of view, but not focusable either
    await expect(entry).toBeHidden();
    expect(await entry.evaluate(el => getComputedStyle(el).visibility)).toBe("hidden");

    await page.keyboard.press("Enter");
    await expect(page.locator(".sidebar-collapse")).toBeFocused();
    await expect(entry).toBeVisible();
  });
});

test.describe("links in diagrams", () => {
  const DIAGRAM_PAGE = "/contextual-data-platform/";

  test("are scrolled into view when focused", async ({ page }) => {
    await open(page, DIAGRAM_PAGE);
    const last = page.locator(".svg-figure svg a").last();
    expect(await inViewport(last)).toBe(false);
    await last.focus();
    await expect.poll(() => inViewport(last)).toBe(true);
  });

  test("don't scroll the page if in view already", async ({ page }) => {
    await open(page, DIAGRAM_PAGE);
    const first = page.locator(".svg-figure svg a").first();
    // In the middle of the viewport
    await first.evaluate(el => {
      const box = el.getBoundingClientRect();
      window.scrollBy(0, box.top + box.height / 2 - innerHeight / 2);
    });
    const scrollY = await page.evaluate(() => window.scrollY);
    await first.focus();
    // After the corrections, which run in the next frames
    await page.waitForTimeout(200);
    expect(await page.evaluate(() => window.scrollY)).toBe(scrollY);
  });

  test("are panned into view in the image viewer", async ({ page }) => {
    await open(page, "/contextual-data-platform/architecture/");
    const diagram = page.locator(".svg-figure svg[data-zoomable]");
    await diagram.focus();
    await page.keyboard.press("Enter");
    const viewer = page.locator(".image-viewer");
    await expect(viewer).toBeVisible();
    // Zoomed in, so that most of the diagram is out of view
    for (let i = 0; i < 2; i++) await page.keyboard.press("+");

    const links = await viewer.locator("svg a").count();
    const notInView = [];
    for (let i = 0; i < links; i++) {
      // The viewer handles Tab itself to keep the focus in the dialog
      await page.keyboard.press("Tab");
      const result = await page.evaluate(() => {
        const el = document.activeElement;
        if (!(el instanceof SVGAElement)) return null;
        const box = el.getBoundingClientRect();
        // Links larger than the free area show their start
        const fits = box.width < innerWidth - 100 && box.height < innerHeight - 200;
        const inView = box.top >= 0 && box.left >= 0 && box.bottom <= innerHeight && box.right <= innerWidth;
        return fits && !inView ? el.textContent.trim().replace(/\s+/g, " ") : "";
      });
      if (result) notInView.push(result);
    }
    expect(notInView).toEqual([]);
  });
});
