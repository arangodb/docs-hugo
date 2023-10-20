#!/bin/bash

## Args: $1=architecture

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

ARANGOPROXY_ARGS=""


if [ "$HUGO_ENV" != "prod" ] && [ "$HUGO_ENV" != "frontend" ]; then
  # For each server in arangoproxy/cmd/configs/local.yaml filled by previous step, check the server is up and healthy
  ARANGOPROXY_ARGS="-use-servers"
  if [ "$OVERRIDE" != "" ] ; then
    ARANGOPROXY_ARGS="$ARANGOPROXY_ARGS -override $OVERRIDE"
  fi

  mapfile servers < <(yq e -o=j -I=0 '.repositories.[]' /home/toolchain/arangoproxy/cmd/configs/local.yaml )

  for server in "${servers[@]}"; do
      url=$(echo "$server" | yq e '.url' -)
      printf -v val "%s/_api/version" $url
      checkIPIsReachable $val
  done
fi

cd /home/toolchain/arangoproxy/cmd
go mod vendor
go build -o arangoproxy
./arangoproxy $ARANGOPROXY_ARGS
