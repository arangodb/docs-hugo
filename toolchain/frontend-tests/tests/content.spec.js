const { test, expect, open } = require("./fixtures");

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
    await expect(panel.locator(".tab-item.selected")).toHaveText(selectedText);
  });
});

test("long code blocks can be expanded", async ({ page }) => {
  await open(page, "/arangodb/stable/aql/fundamentals/subqueries/");
  const more = page.locator("article .code-show-more").first();
  test.skip(await more.count() === 0, "No long code block on the page");
  const code = page.locator("article pre:has(.code-show-more) .code-long").first();
  const collapsed = (await code.boundingBox()).height;
  await more.scrollIntoViewIfNeeded();
  await more.click();
  await expect.poll(async () => (await code.boundingBox()).height).toBeGreaterThan(collapsed);
});

test("deep links to OpenAPI properties open their details", async ({ page }) => {
  const id = "execute-a-batch-request_res_200";
  await open(page, `/arangodb/stable/develop/http-api/batch-requests/#${id}`);
  await expect(page.locator(`#${id}`)).toHaveAttribute("open", "");
});

test.describe("deep links", () => {
  // Swapping in the article again on the initial load can make the scroll land elsewhere
  test.fixme(true, "Fixed by https://github.com/arangodb/docs-hugo/pull/876");

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
      expect(Math.abs(top - padding)).toBeLessThanOrEqual(2);
    });
  }
});

test("renders mermaid diagrams", async ({ page }) => {
  await open(page, "/agentic-ai-suite/autograph/architecture/");
  await expect(page.locator("article pre.mermaid > svg").first()).toBeVisible();
});

test.describe("image viewer", () => {
  test("enlarges images and closes with Escape", async ({ page }) => {
    await open(page, "/arangodb/stable/graphs/example-graphs/");
    const img = page.locator("article img[data-zoomable]").first();
    await img.scrollIntoViewIfNeeded();
    await img.click();
    const viewer = page.locator(".image-viewer");
    await expect(viewer).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(viewer).toBeHidden();
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
