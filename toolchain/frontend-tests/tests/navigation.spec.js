const { test, expect, open, waitForApp } = require("./fixtures");

const PAGE = "/arangodb/stable/aql/fundamentals/subqueries/";

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
  const collapsedParents = await page.locator(".nav-section:has(.link-nav-active) > .nav-section-header input:not(:checked)").count();
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
