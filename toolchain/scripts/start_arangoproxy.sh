#!/bin/bash

## Args: $1=architecture

. functions.sh

installArangosh "$1" "3.10"
installArangosh "$1" "3.11"


declare -a arangoUrls=("arango_single_3_10:8529" "arango_single_3_11:8529")


echo "Waiting for all arango instances to be ready"
for val in ${arangoUrls[@]}; do
    printf -v val "http://%s/_api/version" $val
    checkIPIsReachable $val
done

cd /home/arangoproxy/cmd && go run main.go $ARANGOPROXY_ARGS
