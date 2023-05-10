#!/bin/bash

## Args: $1=architecture

. /home/toolchain/scripts/functions.sh

wget -q https://github.com/mikefarah/yq/releases/latest/download/yq_linux_"$ARCH" -O /usr/bin/yq &&\
    chmod +x /usr/bin/yq

# For each server in arangoproxy/cmd/configs/local.yaml filled by previous step, check the server is up and healthy
mapfile servers < <(yq e -o=j -I=0 '.repositories.[]' /home/toolchain/arangoproxy/cmd/configs/local.yaml )

for server in "${servers[@]}"; do
    url=$(echo "$server" | yq e '.url' -)
    printf -v val "%s/_api/version" $url
    checkIPIsReachable $val
done

cd /home/toolchain/arangoproxy/cmd && go run main.go $ARANGOPROXY_ARGS
