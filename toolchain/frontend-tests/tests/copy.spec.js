const { test, expect, open, copied, matchesMedia } = require("./fixtures");

const CODE_PAGE = "/arangodb/stable/aql/how-to-invoke-aql/with-arangosh/";
const ENDPOINT_PAGE = "/arangodb/stable/develop/http-api/batch-requests/";

const opacity = locator => locator.evaluate(el => Number(getComputedStyle(el).opacity));

test.describe("code block copy button", () => {
  test("appears when hovering the code block, not only the button", async ({ page }) => {
    await open(page, CODE_PAGE);
    test.skip(!(await matchesMedia(page, "(hover: hover)")), "Needs a mouse");
    const pre = page.locator("article pre:has(.copy-to-clipboard-button)").first();
    const button = pre.locator(".copy-to-clipboard-button");
    await pre.scrollIntoViewIfNeeded();
    await page.mouse.move(0, 0);
    await expect.poll(() => opacity(button)).toBe(0);
    // Hover the code at the bottom left, away from the button
    const box = await pre.boundingBox();
    await page.mouse.move(box.x + 20, box.y + box.height - 10);
    await expect.poll(() => opacity(button)).toBeGreaterThan(0.5);
  });

  test("is always shown on touch screens", async ({ page }) => {
    await open(page, CODE_PAGE);
    test.skip(!(await matchesMedia(page, "(hover: none)")), "Needs a touch screen");
    const button = page.locator("article pre .copy-to-clipboard-button").first();
    await button.scrollIntoViewIfNeeded();
    await expect.poll(() => opacity(button)).toBeGreaterThan(0.5);
  });

  test("copies the code and confirms it", async ({ page }) => {
    await open(page, CODE_PAGE);
    const pre = page.locator("article pre:has(.copy-to-clipboard-button)").first();
    await pre.scrollIntoViewIfNeeded();
    await pre.hover();
    const button = pre.locator(".copy-to-clipboard-button");
    await button.click();
    const code = await pre.locator(".copy-this").innerText();
    expect((await copied(page)).trim()).toBe(code.trim());
    await expect(button).toHaveClass(/tooltipped/);
    await expect(button).not.toHaveClass(/tooltipped/, { timeout: 3000 });
  });
});

test.describe("endpoint copy button", () => {
  test("appears when hovering the endpoint and copies its path", async ({ page }) => {
    await open(page, ENDPOINT_PAGE);
    const group = page.locator("article .endpoint-group").first();
    const button = group.locator(".clipboard-copy");
    await group.scrollIntoViewIfNeeded();
    if (await matchesMedia(page, "(hover: hover)")) {
      await page.mouse.move(0, 0);
      await expect.poll(() => opacity(button)).toBe(0);
      await group.locator(".endpoint-url").hover();
    }
    await expect.poll(() => opacity(button)).toBeGreaterThan(0.5);
    await button.click();
    expect((await copied(page)).trim()).toBe((await group.locator(".copy-this").innerText()).trim());
  });
});

test("heading links copy the link to the section", async ({ page }) => {
  await open(page, CODE_PAGE);
  const heading = page.locator("article h2:has(.header-link)").first();
  const id = await heading.getAttribute("id");
  await heading.scrollIntoViewIfNeeded();
  await heading.hover();
  await heading.locator(".header-link").click();
  await expect(page).toHaveURL(`${CODE_PAGE}#${id}`);
  expect(await copied(page)).toBe(new URL(`${CODE_PAGE}#${id}`, page.url()).href);
});
