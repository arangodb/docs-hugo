#!/bin/bash

## Args: $1=architecture

# Stop after this many attempts (2s apart) if HTTP 200 is never seen.
MAX_REACHABILITY_ATTEMPTS="${MAX_REACHABILITY_ATTEMPTS:-30}"

function checkIPIsReachable() {
   local url="$1"
   local attempt="${2:-1}"
   # HEAD (-I) returns 405 for /_api/version in ArangoDB 4.0+
   res=$(curl -sS --connect-timeout 5 -o /dev/null -w '%{http_code}' -X GET "$url" 2>/dev/null || true)
   [ -z "$res" ] && res="000"
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

# Example generation uses the config with the servers written by toolchain.sh,
# plain builds use the committed one without servers
ARANGOPROXY_CONFIG="${ARANGOPROXY_CONFIG:-/home/toolchain/arangoproxy/cmd/configs/local.yaml}"
ARANGOPROXY_ARGS="-config $ARANGOPROXY_CONFIG"


if [ "$HUGO_ENV" != "prod" ] && [ "$HUGO_ENV" != "frontend" ]; then
  # For each server in the arangoproxy config written by toolchain.sh, check the server is up and healthy
  ARANGOPROXY_ARGS="$ARANGOPROXY_ARGS -use-servers"

  # arangoproxy runs arangosh via "docker exec" in the per-version client containers.
  # Older arangoproxy images lack the docker CLI (added to the Dockerfile).
  if ! command -v docker &> /dev/null; then
    echo "Installing docker CLI"
    apk add --no-cache docker-cli
  fi
  if [ "$OVERRIDE" != "" ] ; then
    ARANGOPROXY_ARGS="$ARANGOPROXY_ARGS -override $OVERRIDE"
  fi

  mapfile servers < <(yq e -o=j -I=0 '.repositories.[]' "$ARANGOPROXY_CONFIG" )

  for server in "${servers[@]}"; do
      url=$(echo "$server" | yq e '.url' -)
      printf -v val "%s/_api/version" $url
      checkIPIsReachable "$val"
  done
fi

cd /home/toolchain/arangoproxy/cmd
go build -mod=vendor -o arangoproxy
./arangoproxy $ARANGOPROXY_ARGS
