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

module.exports = { test, expect: base.expect, waitForApp, open, copied, matchesMedia };
