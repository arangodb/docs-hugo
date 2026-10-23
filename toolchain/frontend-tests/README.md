# Frontend tests

Browser tests with [Playwright](https://playwright.dev/) for the functionality
of the built documentation site, like the navigation, version selector, copy
buttons, tabs, and image viewer. They run in Chromium, Firefox, and WebKit, on
desktop and mobile viewports.

For when CircleCI runs them and how to run them locally, see
[Frontend tests](../../README.md#frontend-tests) in the main README.

## Write tests

- Import `test` and `expect` from `tests/fixtures.js`. Its `page` records
  clipboard writes (`copied(page)`), because headless browsers don't all allow
  reading the clipboard.
- Open pages with `open(page, path)`, which waits until the navigation is loaded
  and the article is initialized. Use `waitForApp(page)` after in-app navigation.
- Use the `stable` and `devel` version aliases in paths so that tests don't
  need updates for new versions.
- Check behavior that depends on the input device with media queries
  (`matchesMedia(page, "(hover: none)")`), like the CSS does, rather than the
  project name.

## Update Playwright

Change the version of `@playwright/test` in `package.json` (and run
`npm install`), the Docker image tag in `run-in-docker.sh`, and the image of the
`frontend-tests` job in `.circleci/base_config.yml` together.
