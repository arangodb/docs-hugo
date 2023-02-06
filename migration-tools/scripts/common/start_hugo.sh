#!/bin/bash

## Wait for all arango instances to be available before running
## the hugo build with examples gen.

function check() {
   res=$(curl -s -I $val | grep HTTP/ | awk {'print $2'})
   if [ "$res" = "200" ]; then
    echo "Connection success"
   else
     echo "Connection failed for $val"
    sleep 2s
    check $1
   fi
}

echo "Waiting for arangoproxy to be ready"
val="http://192.168.129.4:8080/health"
check $val

cd /site
hugoOptions=""
if [ "$HUGO_ENV" = "development" ]; then
   hugoOptions="serve --buildDrafts --watch --bind=0.0.0.0"
fi

echo "Hugo Settings:"
echo "   BaseURL:     $HUGO_URL"
echo "   Environment: $HUGO_ENV"
echo "   Options:     $hugoOptions"

hugo $hugoOptions -e $HUGO_ENV -b $HUGO_URL --minify
