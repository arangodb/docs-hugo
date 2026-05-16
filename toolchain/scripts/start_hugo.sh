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

cd /home/site

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

echo "<h2>Hugo</h2>" >> /home/summary.md
echo "<strong>BaseURL</strong>: $HUGO_URL<br>" >> /home/summary.md
echo "<strong>Environment</strong>: $HUGO_ENV<br>" >> /home/summary.md
echo "<strong>Options</strong>: $hugoOptions<br>" >> /home/summary.md

if [ $exit -eq 0 ]; then
  res=$(curl -sS --connect-timeout 5 -o /dev/null -w '%{http_code}' -X GET "$arangoproxyUrl/openapi-validate" 2>/dev/null)
  curl_exit=$?
  [ -z "$res" ] && res="000"
  if [ $curl_exit -ne 0 ]; then
    echo "<error code=2>Failed to trigger OpenAPI validation (curl error)</error><br>" >> /home/summary.md
    exit=1
  elif [ "$res" != "200" ]; then
    echo "<error code=2>OpenAPI validation failed with HTTP status $res</error><br>" >> /home/summary.md
    exit=1
  fi
fi

sed 's/$/<br>/g' /tmp/hugo-summary.md >> /home/summary.md

exit $exit
