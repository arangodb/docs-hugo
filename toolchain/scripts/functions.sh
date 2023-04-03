#!/bin/bash

function startHugo() {
    hugoOptions=""
    if [ "$HUGO_ENV" = "development" ] || [ "$HUGO_ENV" = "frontend" ]; then
        hugoOptions="serve --buildDrafts --watch --bind=0.0.0.0"
    fi

    echo "Hugo Settings:"
    echo "   BaseURL:     $HUGO_URL"
    echo "   Environment: $HUGO_ENV"
    echo "   Options:     $hugoOptions"

    hugo $hugoOptions -e $HUGO_ENV -b $HUGO_URL --minify
}

#$1=architecture
function arangoshDownload() {
        case "$1" in
        "amd64")
            if [ ! -f /home/arangosh/3.10/bin/arangosh ]; then
                mkdir -p /home/arangosh/3.10
                arangoshExtract "3.10" "x86_64" "arangodb3-client-linux-3.10.4-nightly_x86_64"
            fi
             if [ ! -f /home/arangosh/3.11/bin/arangosh ]; then
                mkdir -p /home/arangosh/3.11
                arangoshExtract "3.11" "x86_64" "arangodb3-client-linux-3.11.0-nightly_x86_64"
            fi
        ;;
        "arm64")
            if [ ! -f /home/arangosh/3.10/bin/arangosh ]; then
                mkdir -p /home/arangosh/3.10
                arangoshExtract "3.10" "aarch64" "arangodb3-client-linux-3.10.4-nightly_arm64"
            fi
             if [ ! -f /home/arangosh/3.11/bin/arangosh ]; then
                mkdir -p /home/arangosh/3.11
                arangoshExtract "3.11" "aarch64" "arangodb3-client-linux-3.11.0-nightly_arm64"
            fi
        ;;
        esac
}

#$1=version,$2=arch,$3=filename
function arangoshExtract() {
    wget -q https://download.arangodb.com/nightly/"$1"/Linux/"$2"/"$3".tar.gz
    tar -xf "$3".tar.gz -C /home/arangosh/"$1"/ --strip-components=1
}

#$1=arch
function installHugo() {
    case "$1" in
    "amd64")
        curl -L  https://github.com/gohugoio/hugo/releases/download/v0.110.0/hugo_0.110.0_linux-amd64.deb -o hugo.deb
        
    ;;
    "arm64")
        curl -L https://github.com/gohugoio/hugo/releases/download/v0.110.0/hugo_0.110.0_linux-arm64.deb -o hugo.deb
    ;;
    esac

    apt-get install -y  ./*.deb
}


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
