#!/bin/bash

: > /tmp/hugo-summary.md

# Higher default than arangoproxy: site may wait while arangoproxy builds. 3s between attempts.
MAX_REACHABILITY_ATTEMPTS="${MAX_REACHABILITY_ATTEMPTS:-40}"

function checkIPIsReachable() {
   local url="$1"
   local attempt="${2:-1}"
   res=$(curl -sS --connect-timeout 5 -o /dev/null -w '%{http_code}' -X GET "$url" 2>/dev/null || true)
   [ -z "$res" ] && res="000"
   if [ "$res" = "200" ]; then
     echo "Connection success"
     return 0
   fi
   echo "Connection failed for $url (attempt $attempt/$MAX_REACHABILITY_ATTEMPTS)"
   if [ "$attempt" -ge "$MAX_REACHABILITY_ATTEMPTS" ]; then
     echo "ERROR: gave up waiting for HTTP 200 from $url after $MAX_REACHABILITY_ATTEMPTS attempts" >&2
     exit 1
   fi
   sleep 3s
   checkIPIsReachable "$url" $((attempt + 1))
}

echo "Waiting for arangoproxy to be ready"

arangoproxyUrl="http://192.168.129.129:8080"
if [ "$HUGO_ENV" = "frontend" ]; then
  arangoproxyUrl="http://192.168.130.129:8080"
fi
checkIPIsReachable "$arangoproxyUrl/health"

## Errors and warnings for the build report (see report-lib.sh)
source /home/toolchain/scripts/report-lib.sh

## Plain builds don't have the toolchain container, which resets the report files.
## arangoproxy only writes to them later, when Hugo requests things.
if [ "$HUGO_ENV" = "frontend" ]; then
  : > /home/summary.md
  : > "$REPORT_ISSUES"
fi

cd /home/site

# Hugo's enableGitInfo runs `git log` per file; mark the bind-mounted
# repo as safe so Git doesn't refuse on uid mismatch between host and container.
git config --global --add safe.directory /home

hugoOptions=""
if [ "$ENV" = "local" ]; then
    # Without --buildDrafts (rarely used) to match CI builds
    hugoOptions="serve --watch --bind=0.0.0.0 --ignoreCache --noHTTPCache"
#else
#  hugoOptions="--templateMetrics --templateMetricsHints"
fi


set -o pipefail
hugo $hugoOptions -e $HUGO_ENV -b $HUGO_URL --minify 2>&1 | tee -a /tmp/hugo-summary.md
exit=$?

## Hugo's errors (e.g. from errorf in templates) for the report
grep '^ERROR ' /tmp/hugo-summary.md | while IFS= read -r line; do
  report_error "Hugo" "" "" "" "${line#ERROR }"
done
if [ $exit -ne 0 ] && ! grep -q '^ERROR ' /tmp/hugo-summary.md; then
  report_error "Hugo" "" "" "" "Hugo exited with code $exit"
fi

if [ $exit -eq 0 ]; then
  res=$(curl -sS --connect-timeout 5 -o /dev/null -w '%{http_code}' -X GET "$arangoproxyUrl/openapi-validate" 2>/dev/null)
  curl_exit=$?
  [ -z "$res" ] && res="000"
  if [ $curl_exit -ne 0 ]; then
    report_error "OpenAPI" "" "" "" "Failed to trigger the OpenAPI validation (curl error)"
    exit=1
  elif [ "$res" != "200" ]; then
    report_error "OpenAPI" "" "" "" "OpenAPI validation failed with HTTP status $res"
    exit=1
  fi
fi

{
  echo ""
  echo "## Hugo"
  echo ""
  echo "- Base URL: $HUGO_URL"
  echo "- Environment: $HUGO_ENV"
  echo "- Options: $hugoOptions"
  echo ""
  echo '```'
  cat /tmp/hugo-summary.md
  echo '```'
} >> /home/summary.md

exit $exit
