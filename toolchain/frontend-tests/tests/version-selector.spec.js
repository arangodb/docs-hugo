const { test, expect, open, waitForApp, versionedHeader, versionControl, selectedVersion, chooseVersion } = require("./fixtures");

const PATH = "aql/fundamentals/subqueries/";

async function showNav(page) {
  const toggle = page.locator(".sidebar-toggle-navigation");
  if (await toggle.isVisible()) await toggle.click();
}

test("shows the version selector on versioned pages with the version of the page", async ({ page }) => {
  await open(page, `/arangodb/stable/${PATH}`);
  await showNav(page);
  await expect(versionControl(page)).toBeVisible();
  expect(await selectedVersion(page)).toBe("stable");
  // Only the navigation of the selected version is shown
  const lists = page.locator(".main-nav .nav-ol[data-version]");
  await expect(lists.locator("visible=true")).toHaveCount(1);
  await expect(page.locator(".main-nav .nav-ol.selected-version")).toHaveAttribute("data-version", "stable");
});

test("hides the version selector while the ArangoDB section is collapsed", async ({ page }) => {
  await open(page, "/amp/");
  await showNav(page);
  const selector = versionControl(page);
  await expect(selector).toBeHidden();
  const header = versionedHeader(page);
  await header.locator(".expand-nav").click();
  await expect(selector).toBeVisible();
  await header.locator(".expand-nav").click();
  await expect(selector).toBeHidden();
});

test("switches to the same page in another version", async ({ page }) => {
  await open(page, `/arangodb/stable/${PATH}`);
  await showNav(page);
  await chooseVersion(page, "devel");
  await expect(page).toHaveURL(`/arangodb/devel/${PATH}`);
  await waitForApp(page);
  await expect(page.locator(".main-nav .nav-ol.selected-version")).toHaveAttribute("data-version", "devel");
  expect(await page.evaluate(() => localStorage.getItem("docs-version"))).toBe("devel");
  // The version is remembered on unversioned pages
  await open(page, "/amp/");
  await showNav(page);
  await versionedHeader(page).locator(".expand-nav").click();
  expect(await selectedVersion(page)).toBe("devel");
});
