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

if [ "$HUGO_ENV" = "frontend" ]; then
  checkIPIsReachable "http://192.168.130.129:8080/health"
else
  checkIPIsReachable "http://192.168.129.129:8080/health"
fi

cd /home/site

hugoOptions=""
if [ "$ENV" = "local" ]; then
    hugoOptions="serve --buildDrafts --watch --bind=0.0.0.0 --ignoreCache --noHTTPCache --disableLiveReload --templateMetrics --templateMetricsHints"
fi




set -o pipefail
hugo $hugoOptions -e $HUGO_ENV -b $HUGO_URL --minify 2>&1 | tee -a /tmp/hugo-summary.md
exit=$?

echo "<h2>Hugo</h2>" >> /home/summary.md
echo "<strong>BaseURL</strong>: $HUGO_URL<br>" >> /home/summary.md
echo "<strong>Environment</strong>: $HUGO_ENV<br>" >> /home/summary.md
echo "<strong>Options</strong>: $hugoOptions<br>" >> /home/summary.md

sed 's/$/<br>/g' /tmp/hugo-summary.md >> /home/summary.md

exit $exit

