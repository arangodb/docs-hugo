#!/bin/bash

. functions.sh

## Install hugo with arch dependent link

echo "Waiting for arangoproxy to be ready"
checkIPIsReachable "http://arangoproxy:8080/health"

cd /site
startHugo

