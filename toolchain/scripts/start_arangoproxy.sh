#!/bin/bash

## Args: $1=architecture

# Stop after this many attempts (2s apart) if HTTP 200 is never seen.
MAX_REACHABILITY_ATTEMPTS="${MAX_REACHABILITY_ATTEMPTS:-30}"

function checkIPIsReachable() {
   local url="$1"
   local attempt="${2:-1}"
   res=$(curl -s --dump-header --output /dev/null "$url" | grep HTTP/ | awk {'print $2'})
   if [ "$res" = "200" ]; then
     echo "Connection success"
     return 0
   fi
   echo "Connection failed for $url (attempt $attempt/$MAX_REACHABILITY_ATTEMPTS)"
   if [ "$attempt" -ge "$MAX_REACHABILITY_ATTEMPTS" ]; then
     echo "ERROR: gave up waiting for HTTP 200 from $url after $MAX_REACHABILITY_ATTEMPTS attempts" >&2
     exit 1
   fi
   sleep 2s
   checkIPIsReachable "$url" $((attempt + 1))
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
go build -mod=vendor -o arangoproxy
./arangoproxy $ARANGOPROXY_ARGS
