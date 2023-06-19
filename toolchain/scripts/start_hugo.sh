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

if ! command -v hugo &> /dev/null
then
    curl -L  https://github.com/gohugoio/hugo/releases/download/v0.110.0/hugo_0.110.0_linux-"$ARCH".deb -o hugo.deb
    apt install -y ./hugo.deb
fi

echo "Waiting for arangoproxy to be ready"
checkIPIsReachable "http://192.168.129.129:8080/health"

cd /home/site

hugoOptions="--verbose --templateMetrics"
if [ "$HUGO_ENV" = "development" ] || [ "$HUGO_ENV" = "frontend" ]; then
    hugoOptions="serve --buildDrafts --watch --bind=0.0.0.0 --ignoreCache --noHTTPCache"
fi

echo "Hugo Settings:"
echo "   BaseURL:     $HUGO_URL"
echo "   Environment: $HUGO_ENV"
echo "   Options:     $hugoOptions"

hugo $hugoOptions -e $HUGO_ENV -b $HUGO_URL --minify

