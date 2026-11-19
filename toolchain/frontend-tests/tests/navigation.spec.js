const { test, expect, open, waitForApp, isExpanded, IS_EXPANDED } = require("./fixtures");

const PAGE = "/arangodb/stable/aql/language-basics/subqueries/";

/** On narrow screens, the navigation is only shown after opening it. */
async function showNav(page) {
  const toggle = page.locator(".sidebar-toggle-navigation");
  if (await toggle.isVisible()) {
    await toggle.click();
    await expect(page.locator(".main-nav")).toBeVisible();
  }
}

test("highlights the current page in the navigation and expands its parents", async ({ page }) => {
  await open(page, PAGE);
  await showNav(page);
  const active = page.locator(".main-nav .link-nav-active");
  await expect(active).toHaveCount(1);
  await expect(active).toHaveAttribute("href", PAGE);
  await expect(active).toBeVisible();
  // Every section containing the page is expanded
  const collapsedParents = await page.evaluate(isExpandedSrc => {
    const isExpanded = new Function("return " + isExpandedSrc)();
    return [...document.querySelectorAll(".main-nav .nav-section:has(.link-nav-active)")].filter(s => !isExpanded(s)).length;
  }, IS_EXPANDED);
  expect(collapsedParents).toBe(0);
});

test("loads pages from the navigation without reloading the document", async ({ page }) => {
  await open(page, PAGE);
  await showNav(page);
  await page.evaluate(() => { window.__sameDocument = true; });
  const link = page.locator(".main-nav .link-nav-active").locator("xpath=ancestor::li[contains(@class, 'nav-leaf')]/following-sibling::li[1]//a[contains(@class, 'link-nav')]").first();
  const href = await link.getAttribute("href");
  const heading = await page.locator("article h1").innerText();
  const title = await page.title();
  await link.click();
  await expect(page).toHaveURL(href);
  await waitForApp(page);
  await expect(page.locator("article h1")).not.toHaveText(heading);
  await expect(page).not.toHaveTitle(title);
  expect(await page.evaluate(() => window.__sameDocument)).toBe(true);
  await expect(page.locator(".main-nav .link-nav-active")).toHaveAttribute("href", href);
});

test("goes back to the previous page", async ({ page }) => {
  await open(page, PAGE);
  const heading = await page.locator("article h1").innerText();
  const link = page.locator("article a.link[href^='/arangodb/']:not([href*='#'])").first();
  await link.scrollIntoViewIfNeeded();
  await link.click();
  await waitForApp(page);
  await expect(page.locator("article h1")).not.toHaveText(heading);
  await page.goBack();
  await waitForApp(page);
  await expect(page).toHaveURL(PAGE);
  await expect(page.locator("article h1")).toHaveText(heading);
});

test("shows the not found page for unknown URLs", async ({ page }) => {
  const response = await page.goto("/this-page-does-not-exist/");
  expect(response.status()).toBe(404);
  await expect(page.locator(".notfound")).toBeVisible();
  await expect(page.locator(".notfound a.link")).toHaveAttribute("href", "/");
});

test("opens and closes the navigation on narrow screens", async ({ page, isMobile }) => {
  test.skip(!isMobile, "The navigation is always shown on wide screens");
  await open(page, PAGE);
  const nav = page.locator(".main-nav");
  await expect(nav).toBeHidden();
  await page.locator(".sidebar-toggle-navigation").click();
  await expect(nav).toBeVisible();
  // Following a link closes it again
  await nav.locator(".link-nav-active").click();
  await expect(nav).toBeHidden();
});

test("loads internal links in the content without reloading the document", async ({ page }) => {
  await open(page, PAGE);
  await page.evaluate(() => { window.__sameDocument = true; });
  const heading = await page.locator("article h1").innerText();
  const link = page.locator("article a.link[href^='/arangodb/']:not([href*='#'])").first();
  const href = await link.getAttribute("href");
  await link.scrollIntoViewIfNeeded();
  await link.click();
  await expect(page).toHaveURL(href);
  await waitForApp(page);
  await expect(page.locator("article h1")).not.toHaveText(heading);
  expect(await page.evaluate(() => window.__sameDocument)).toBe(true);
});

test.describe("links with modifier keys", () => {
  test.skip(({ isMobile }) => isMobile, "No modifier keys on touch screens");

  for (const [name, modifiers] of [["Ctrl/Cmd+click opens a new tab", ["ControlOrMeta"]], ["Shift+click opens a new window", ["Shift"]]]) {
    for (const [where, selector] of [
      ["content", "article a.link[href^='/arangodb/']:not([href*='#'])"],
      ["navigation", ".main-nav .link-nav-active"],
    ]) {
      test(`${name} (${where})`, async ({ page, context }) => {
        await open(page, PAGE);
        const link = page.locator(selector).first();
        const href = await link.getAttribute("href");
        await link.scrollIntoViewIfNeeded();
        const [opened] = await Promise.all([context.waitForEvent("page"), link.click({ modifiers })]);
        await expect(opened).toHaveURL(href);
        // The current page stays as it is
        await expect(page).toHaveURL(PAGE);
      });
    }
  }
});

test("collapses expanded navigation sections except for the path to the current page", async ({ page }) => {
  await open(page, PAGE);
  await showNav(page);
  // Expand a section that doesn't contain the current page
  const other = page.locator(".main-nav .nav-section:not(:has(.link-nav-active)):has(> .nav-section-header > .expand-nav)").first();
  await other.locator(":scope > .nav-section-header > .expand-nav").click();
  await expect.poll(() => isExpanded(other)).toBe(true);
  // Navigate to another page with the navigation
  const next = page.locator(".main-nav .link-nav-active").locator("xpath=ancestor::li[contains(@class, 'nav-leaf')]/following-sibling::li[1]//a[contains(@class, 'link-nav')]").first();
  const href = await next.getAttribute("href");
  await next.click();
  await waitForApp(page);
  await expect(page).toHaveURL(href);
  await showNav(page);
  await expect.poll(() => isExpanded(other)).toBe(false);
  // Exactly the sections containing the current page are expanded
  const expanded = await page.evaluate(isExpandedSrc => {
    const isExpanded = new Function("return " + isExpandedSrc)();
    const checked = [...document.querySelectorAll(".main-nav .nav-section")].filter(isExpanded);
    const active = document.querySelector(".main-nav .link-nav-active");
    const path = [];
    for (let s = active.closest(".nav-section"); s; s = s.parentElement.closest(".nav-section")) path.push(s);
    // A section's own link counts too: a section page expands its children
    return { checked: checked.length, onPath: checked.filter(s => path.includes(s)).length, pathLength: path.length };
  }, IS_EXPANDED);
  expect(expanded.onPath).toBe(expanded.checked);
  expect(expanded.checked).toBe(expanded.pathLength);
});

test.describe("going back", () => {
  test.skip(({ isMobile }) => isMobile, "Same behavior, desktop is enough");

  test("restores the scroll position, open details, and selected tabs", async ({ page }) => {
    const A = "/arangodb/stable/collections/";
    const B = "/arangodb/stable/documents/";
    const view = () => page.evaluate(() => ({
      tab: document.querySelector("article .tab-nav-button.selected[data-tab-group='interfaces']")?.dataset.tabItem,
      open: [...document.querySelectorAll("article details:not(.toc-details)")].map(d => d.open),
      // The text at the top of the viewport
      text: document.elementFromPoint(innerWidth / 2, 200)?.textContent.trim().slice(0, 80),
    }));
    // A link at a fixed position, so that clicking it doesn't scroll
    const follow = async href => {
      await page.evaluate(href => {
        const a = document.createElement("a");
        a.className = "link"; a.href = href; a.id = "test-link"; a.textContent = "test";
        a.style.cssText = "position: fixed; top: 100px; left: 50%; z-index: 100000";
        document.body.append(a);
      }, href);
      await page.click("#test-link");
      await waitForApp(page);
    };

    await open(page, A);
    const tab = page.locator("article .tab-nav-button[data-tab-group='interfaces']").nth(1);
    await tab.scrollIntoViewIfNeeded();
    await tab.click();
    const summary = page.locator("article details:not(.toc-details) > summary").first();
    await summary.scrollIntoViewIfNeeded();
    await summary.click();
    await page.mouse.wheel(0, 300);
    await page.waitForTimeout(500);
    const before = await view();

    // Another page with the same tab group, which changes the preference
    await follow(B);
    await page.locator("article .tab-nav-button[data-tab-group='interfaces']").first().click();
    await page.goBack();
    await waitForApp(page);
    await expect.poll(view).toEqual(before);
  });
});
