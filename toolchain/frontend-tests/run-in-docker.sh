#!/bin/bash
# Run the frontend tests in the Playwright Docker image that CircleCI uses, with
# all browsers (WebKit doesn't run natively on every Linux distribution).
# Arguments are passed to `playwright test`, e.g. --project webkit
set -euo pipefail

cd "$(dirname "$0")"
# Keep in sync with @playwright/test in package.json and .circleci/base_config.yml
image="mcr.microsoft.com/playwright:v1.49.1-noble"
site_dir="$(realpath "${SITE_DIR:-../../site/public}")"

docker run --rm --init --network host \
  --user "$(id -u):$(id -g)" -e HOME=/tmp \
  --security-opt label=disable \
  -v "$PWD:/tests" -v "$site_dir:/site:ro" \
  -w /tests -e SITE_DIR=/site -e PORT="${PORT:-8090}" -e BASE_URL="${BASE_URL:-}" \
  "$image" sh -c 'npm ci --no-audit --no-fund --loglevel=error && npx playwright test "$@"' -- "$@"
