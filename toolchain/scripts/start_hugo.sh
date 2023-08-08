#!/bin/bash

function checkIPIsReachable() {
   res=$(curl -s -I $1 | grep HTTP/ | awk {'print $2'})
   if [ "$res" = "200" ]; then
     echo "Connection success"
   else
     echo "Connection failed for $1"
    sleep 2s
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

hugoOptions="--verbose --templateMetrics"
if [ "$ENV" = "local" ]; then
    hugoOptions="serve --buildDrafts --watch --bind=0.0.0.0 --ignoreCache --noHTTPCache"
fi

echo "Hugo Settings:"
echo "   BaseURL:     $HUGO_URL"
echo "   Environment: $HUGO_ENV"
echo "   Options:     $hugoOptions"

hugo $hugoOptions -e $HUGO_ENV -b $HUGO_URL --minify

