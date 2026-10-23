// Shared test setup: a page fixture that records clipboard writes, and helpers
// to wait until the documentation app has initialized.
const base = require("@playwright/test");

const test = base.test.extend({
  page: async ({ page }, use) => {
    // Headless browsers don't all allow reading the clipboard, record writes instead
    await page.addInitScript(() => {
      window.__copied = [];
      const record = async text => { window.__copied.push(text); };
      try {
        Object.defineProperty(navigator, "clipboard", { value: { writeText: record }, configurable: true });
      } catch (e) {
        navigator.clipboard.writeText = record;
      }
    });
    await use(page);
  },
});

/** Wait until the navigation is loaded and the article for the current URL is initialized. */
async function waitForApp(page) {
  await page.waitForFunction(() => {
    const nav = document.querySelector(".main-nav-ol");
    const u = new URL(location.href);
    return nav && !nav.classList.contains("shimmer")
      && window.docsLastFetchedDocKey === u.origin + u.pathname + u.search;
  });
}

/** Open a page and wait for the app. */
async function open(page, path) {
  await page.goto(path);
  await waitForApp(page);
}

/** The text most recently written to the clipboard. */
async function copied(page) {
  return page.evaluate(() => window.__copied[window.__copied.length - 1]);
}

/** Whether the viewport matches a media query, e.g. "(hover: none)". */
async function matchesMedia(page, query) {
  return page.evaluate(q => matchMedia(q).matches, query);
}

/*
 * Navigation helpers that work with both the old markup (checkbox in a label,
 * <select> for the version) and the new one (buttons with aria-expanded, a
 * disclosure menu of version links).
 */

// Whether a .nav-section element is expanded (in the page context)
const IS_EXPANDED = "el => el.classList.contains('expanded') || !!el.querySelector(':scope > .nav-section-header input:checked')";

/** Whether the navigation section (locator of a .nav-section) is expanded. */
async function isExpanded(section) {
  return section.evaluate(new Function("return " + IS_EXPANDED)());
}

/** The header of the ArangoDB section with the version selector. */
function versionedHeader(page) {
  return page.locator(".main-nav :is(.nav-section-header-versioned, .nav-section-sticky > .nav-section-header)");
}

/** The control that shows the selected version (select or menu button). */
function versionControl(page) {
  return page.locator(".main-nav :is(select.version-selector, .version-selector-button)");
}

/** The selected version (alias). */
async function selectedVersion(page) {
  return page.evaluate(() => {
    const select = document.querySelector(".main-nav select.version-selector");
    if (select) return select.value;
    return document.querySelector(".main-nav .version-menu-item[aria-current]")?.dataset.version;
  });
}

/** Choose a version (alias) with the version selector. */
async function chooseVersion(page, version) {
  const select = page.locator(".main-nav select.version-selector");
  if (await select.count()) {
    await select.selectOption(version);
  } else {
    await page.locator(".main-nav .version-selector-button").click();
    await page.locator(`.main-nav .version-menu-item[data-version="${version}"]`).click();
  }
}

module.exports = {
  test, expect: base.expect, waitForApp, open, copied, matchesMedia,
  isExpanded, IS_EXPANDED, versionedHeader, versionControl, selectedVersion, chooseVersion,
};
