// Frontend tests for the built documentation site, see README.md
const { defineConfig, devices } = require("@playwright/test");

const port = Number(process.env.PORT || 8090);
// Test a deployed site (e.g. a deploy preview) instead of the local build
const baseURL = process.env.BASE_URL || `http://127.0.0.1:${port}`;

module.exports = defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [["list"], ["junit", { outputFile: "results/junit.xml" }], ["html", { outputFolder: "results/report", open: "never" }]]
    : [["list"], ["html", { outputFolder: "results/report", open: "never" }]],
  outputDir: "results/artifacts",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    { name: "mobile-chromium", use: { ...devices["Pixel 7"] } },
    { name: "mobile-webkit", use: { ...devices["iPhone 15"] } },
  ],
  webServer: process.env.BASE_URL ? undefined : {
    command: `node serve.js ${process.env.SITE_DIR || "../../site/public"} ${port}`,
    url: `${baseURL}/`,
    reuseExistingServer: !process.env.CI,
  },
});
