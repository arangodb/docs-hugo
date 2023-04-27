#!/bin/bash

. /home/toolchain/scripts/functions.sh

if ! command -v hugo &> /dev/null
then
    installHugo "$ARCH"
fi


echo "Waiting for arangoproxy to be ready"
checkIPIsReachable "http://arangoproxy:8080/health"

cd /home/site
startHugo

