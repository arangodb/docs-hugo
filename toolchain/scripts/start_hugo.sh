#!/bin/bash

: > /tmp/hugo-summary.md

function checkIPIsReachable() {
   res=$(curl -s -I $1 | grep HTTP/ | awk {'print $2'})
   if [ "$res" = "200" ]; then
     echo "Connection success"
   else
     echo "Connection failed for $1"
    sleep 3s
    checkIPIsReachable $1
   fi
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
  res=$(curl -s -I $arangoproxyUrl/openapi-validate | grep HTTP/ | awk {'print $2'})
  curl_exit=$?
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
