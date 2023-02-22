#! /bin/bash

function startHugo() {
    hugoOptions=""
    if [ "$HUGO_ENV" = "development" ]; then
    hugoOptions="serve --buildDrafts --watch --bind=0.0.0.0"
    fi

    echo "Hugo Settings:"
    echo "   BaseURL:     $HUGO_URL"
    echo "   Environment: $HUGO_ENV"
    echo "   Options:     $hugoOptions"

    hugo $hugoOptions -e $HUGO_ENV -b $HUGO_URL --minify
}

#$1=architecture,$2=version
function installArangosh() {
    ## switch-case architecture->link
    
    if [ ! -f /home/arangosh/"$2"/bin/arangosh ]; then
        wget https://download.arangodb.com/nightly/"$2"/Linux/aarch64/arangodb3-client-linux-3.10.3-nightly_arm64.tar.gz
        tar -xf arangodb3-client-linux-3.10.3-nightly_arm64.tar.gz
        mv arangodb3-client-linux-3.10.3-nightly_arm64 /home/arangosh/"$2"/
    fi
}

function installHugo() {

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