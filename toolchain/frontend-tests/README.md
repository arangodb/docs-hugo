# Frontend tests

Browser tests with [Playwright](https://playwright.dev/) for the functionality
of the built documentation site, like the navigation, version selector, copy
buttons, tabs, and image viewer. They run in Chromium, Firefox, and WebKit, on
desktop and mobile viewports.

CircleCI runs them before deploying a release, after scheduled and example
generation builds, and after plain builds if the changes compared to `main`
touch the theme, site configuration, static files, versions, these tests, or
the CircleCI configuration (in parallel to the deploy preview, see
`FRONTEND_PATHS` in `.circleci/generate_config.py`).

## Run the tests locally

Build the site first (see [Plain build](../../README.md#plain-build) with
`ENV=static`), so that `site/public/` exists. Then:

```sh
cd toolchain/frontend-tests
npm ci
npx playwright install chromium firefox   # once, add webkit if supported
npx playwright test --project chromium --project mobile-chromium --project firefox
```

The tests serve `site/public/` themselves (`serve.js`, behaves like Netlify for
directory URLs and 404 pages). Use `SITE_DIR` for a build elsewhere, or
`BASE_URL` to test a deployed site instead, for example a deploy preview:

```sh
BASE_URL=https://deploy-preview-1234--docs-hugo.netlify.app npx playwright test
```

To run all browsers including WebKit, which doesn't run natively on every Linux
distribution, use the same Docker image as CircleCI (arguments are passed to
`playwright test`):

```sh
./run-in-docker.sh
```

After a run, `npm run report` opens the report, with screenshots and traces of
failed tests (`npx playwright show-trace results/artifacts/.../trace.zip`).
`npx playwright test --ui` lets you run and debug tests interactively.

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
