#!/bin/bash
##################################
#### Toolchain Launch Script
##################################

### Entrypoint of the toolchain docker image launched using docker compose.
### This script sets up everything needed by the toolchain to work and generate content.
### Check Env Vars, Launch ArangoDB docker images, Launch arangoproxy and site containers, generate content

### SETUP
#### Check/set env vars, install requirements

: > /home/toolchain.log

TRAP=0

cd /home/toolchain/scripts

## Errors and warnings for the build report (report_error etc.)
source ./report-lib.sh

### A line of the details of the build report (Markdown)
function report_detail() {
  echo "$1" >> /home/summary.md
}

### Assemble the final build report (summary.md) from the errors, warnings, and details
function finalize_report() {
  "$PYTHON_EXECUTABLE" report.py > /dev/null 2>&1 || log "[finalize_report] Failed to assemble the report"
}


PYTHON_EXECUTABLE="python"
DOCKER_COMPOSE_ARGS=""
LOG_TARGET=""


### Check whether python or python3 is installed
if ! command -v "$PYTHON_EXECUTABLE" &> /dev/null
  then
  PYTHON_EXECUTABLE="python3"
fi


echo "[INIT] Toolchain setup"

### SETTINGS
## The settings come from environment variables that docker compose passes to the
## container: from the shell, or else from the .env file next to the compose file
## (shell variables take precedence, set a variable to an empty string to clear it).
## Local runs write the effective settings back to that .env file
## ($TOOLCHAIN_ENV_FILE), so they only need to be specified once.
##
## - GENERATORS: space-separated list, all generators if empty
## - ARANGODB_BRANCH_<VERSION>: image or arangodb/arangodb branch to use for a docs
##   version (e.g. ARANGODB_BRANCH_4_X for 4.x), no server for this version if empty
## - ARANGODB_SRC_<VERSION>: arangodb/arangodb working copy (host path) for the
##   metrics, error-codes, and exit-codes generators (mounted by docker compose)
## - EXAMPLES_SCOPE: "changed" to only run the examples of pages with changed
##   examples (others use the saved output), "all" to run all examples. Defaults
##   to "changed" locally and "all" in CI. OVERRIDE implies "all".

ALL_GENERATORS="examples metrics error-codes exit-codes options optimizer oasisctl"
if [ -z "$GENERATORS" ]; then
  GENERATORS="$ALL_GENERATORS"
fi

if [ -z "$EXAMPLES_SCOPE" ]; then
  EXAMPLES_SCOPE=all
  [ "$ENV" == "local" ] && EXAMPLES_SCOPE=changed
fi

## Docs versions from versions.yaml, the variable names use uppercase with
## underscores (e.g. "4.x" -> ARANGODB_BRANCH_4_X)
mapfile -t DOCS_VERSIONS < <(yq -r '.["/arangodb/"][].name' ../../site/data/versions.yaml | sort -V)

function version_var_suffix() {
  echo "$1" | tr '.' '_' | tr '[:lower:]' '[:upper:]'
}

echo "[TOOLCHAIN] Settings:"
echo "  GENERATORS=$GENERATORS"
for version in "${DOCS_VERSIONS[@]}"; do
  suffix=$(version_var_suffix "$version")
  branch_var=ARANGODB_BRANCH_$suffix
  src_var=ARANGODB_SRC_$suffix
  echo "  $branch_var=${!branch_var}"
  echo "  $src_var=${!src_var}"
done

function persist_settings() {
  if [ "$ENV" != "local" ] || [ -z "$TOOLCHAIN_ENV_FILE" ]; then
    return
  fi
  {
    echo "# Written by the toolchain (toolchain.sh) with the settings of the last run."
    echo "# Environment variables of the shell take precedence over these values."
    echo "# Set a variable to an empty string to clear it, or edit this file."
    echo "GENERATORS=\"$GENERATORS\""
    echo "EXAMPLES_SCOPE=\"$EXAMPLES_SCOPE\""
    for version in "${DOCS_VERSIONS[@]}"; do
      suffix=$(version_var_suffix "$version")
      for var in ARANGODB_BRANCH_$suffix ARANGODB_SRC_$suffix; do
        echo "$var=\"${!var}\""
      done
    done
  } > "$TOOLCHAIN_ENV_FILE"
  ## The toolchain runs as root, keep the file editable for the owner of the folder
  chown "$(stat -c '%u:%g' "$(dirname "$TOOLCHAIN_ENV_FILE")")" "$TOOLCHAIN_ENV_FILE"
  echo "[TOOLCHAIN] Settings saved to $TOOLCHAIN_ENV_FILE"
}
persist_settings

## The arangoproxy config with the servers of this run (the committed local.yaml
## without servers is used by plain builds)
ARANGOPROXY_CONFIG=../arangoproxy/cmd/configs/generated.yaml
echo "[TOOLCHAIN] Create arangoproxy config file"
yq '.repositories = []' ../arangoproxy/cmd/configs/local.yaml > "$ARANGOPROXY_CONFIG"



echo "[INIT] Setup Finished"




function main() {
  echo "[TOOLCHAIN] Starting toolchain"
  echo "[TOOLCHAIN] Generators: $GENERATORS"
  : > /home/summary.md
  : > "$REPORT_ISSUES"
  report_detail "## Settings"
  report_detail ""
  report_detail "- Generators: $GENERATORS"

  clean_docker_environment

  ## Generate content and start server
  for version in "${DOCS_VERSIONS[@]}"; do
    branch_var=ARANGODB_BRANCH_$(version_var_suffix "$version")
    image="${!branch_var}"

    if [ "$image" == "" ]; then
      continue
    fi

    if [ $HUGO_ENV == "release" ]; then
      rm -r ../../site/data/$version/*
      echo "{}" > ../../site/data/$version/cache.json
    fi

    start_server "$image" "$version"
  done

  ## The servers of all versions start at the same time, now wait for each of them
  for version in "${DOCS_VERSIONS[@]}"; do
    branch_var=ARANGODB_BRANCH_$(version_var_suffix "$version")
    image="${!branch_var}"
    if [ "$image" != "" ]; then
      process_server "$image" "$version"
    fi
  done

  ## Independent of ArangoDB versions/servers
  if [[ $GENERATORS == *"oasisctl"* ]]; then
    generate_oasisctl
  fi

  run_arangoproxy_and_site

  ## Start arangoproxy and site containers to build examples and site

    ## redirect logs of arangoproxy and site containers to files
    docker logs --details --follow docs_arangoproxy >> toolchain.log &
    docker logs --details --follow docs_site >> toolchain.log &

    tail -f /home/toolchain.log &
    trap_container_exit
}



## Utility to print with [current arangodb server] attached
function log(){
  echo "[$LOG_TARGET] "$1""
}


### DOCKER FUNCTIONS

### Print the ID of the image for a docs version, pulling it if necessary (locally).
### $1 is an image reference, or locally also an arangodb/arangodb branch name: then
### the image that CI compiled for the commits of the working copy (ARANGODB_SRC_*,
### see compiled_image_ref) is used if available.
function find_or_pull_image() {
  image="$1"
  version="$2"

  image_id=$(docker images -q "$image" 2>/dev/null | head -n1)
  if [ -z "$image_id" ] && [ "$ENV" == "local" ]; then
    log "[find_or_pull_image] Pull image $image" >&2
    if docker pull "$image" >&2; then
      image_id=$(docker images -q "$image" | head -n1)
    else
      compiled=$(compiled_image_ref "$version")
      if [ -n "$compiled" ]; then
        log "[find_or_pull_image] Not an image, try the image compiled by CI for branch $image: $compiled" >&2
        image_id=$(docker images -q "$compiled" | head -n1)
        if [ -z "$image_id" ] && docker pull "$compiled" >&2; then
          image_id=$(docker images -q "$compiled" | head -n1)
        fi
      fi
    fi
  fi
  echo "$image_id"
}

### The image reference that CI uses for compiled branches (see clone-arangodb in
### .circleci/base_config.yml): <docs version>-<main commit>-<enterprise commit>
function compiled_image_ref() {
  version="$1"
  main_hash=$(awk 'END{print $2}' /tmp/$version/.git/logs/HEAD 2>/dev/null | cut -c1-9)
  enterprise_hash=$(awk 'END{print $2}' /tmp/$version/enterprise/.git/logs/HEAD 2>/dev/null | cut -c1-9)
  if [ -n "$main_hash" ] && [ -n "$enterprise_hash" ]; then
    echo "arangodb/docs-hugo:$version-$main_hash-$enterprise_hash"
  fi
}



function clean_docker_environment() {
  container_name="$1"

  ## Create the docs_net docker network if it doesn't exist
  log "[clean_docker_environment] setup docs_net docker network"
  docker network inspect docs_net >/dev/null 2>&1 || docker network create --driver=bridge --subnet=192.168.129.0/24 docs_net

  ## Stop and remove old containers of this ArangoDB docker image
  log "[clean_docker_environment] Cleanup orphan containers"
  docker ps -a --filter name=docs_* -q | xargs -r docker stop | xargs -r docker rm

}




#### Arangoproxy/Site 


function run_arangoproxy_and_site() {
  set -e


  log "[run_arangoproxy_and_site] Pull arangoproxy and site images"
  arch=$(uname -m)
  if [ "$arch" == "x86_64" ]; then
    arch="amd64"
  fi

  if [ "$arch" == "aarch64" ]; then
    arch="arm64"
  fi

  set +e
  
  cd ../../
  echo "[run_arangoproxy_and_site]  Run arangoproxy and site containers"
  if [ $TRAP == 0 ]; then
    HUGO_NUMWORKERMULTIPLIER=8
    if [ "$HUGO_ENV" = "release" ]; then
      HUGO_NUMWORKERMULTIPLIER=1
    fi
    docker run -d --name docs_site --network=docs_net --ip=192.168.129.130 \
      -e ENV="$ENV" \
      -e HUGO_URL="$HUGO_URL" \
      -e HUGO_ENV="$HUGO_ENV" \
      -e HUGO_NUMWORKERMULTIPLIER="$HUGO_NUMWORKERMULTIPLIER" \
      -p 1313:1313 \
      --volumes-from toolchain \
      --log-opt tag="{{.Name}}" \
      arangodb/docs-hugo:site-"$arch"

    # arangoproxy uses the Docker socket (from --volumes-from toolchain) to run
    # arangosh via "docker exec", so it needs the same super-privileged SELinux
    # domain as the toolchain container (no effect without SELinux)
    docker run -d --name docs_arangoproxy --network=docs_net --ip=192.168.129.129 \
      --security-opt label=type:spc_t \
      -e ENV="$ENV" \
      -e HUGO_URL="$HUGO_URL" \
      -e HUGO_ENV="$HUGO_ENV" \
      -e OVERRIDE="$OVERRIDE" \
      -e ARANGOPROXY_CONFIG=/home/toolchain/arangoproxy/cmd/configs/generated.yaml \
      -v docs_go_cache:/root/.cache/go-build \
      --volumes-from toolchain \
      --log-opt tag="{{.Name}}" \
      arangodb/docs-hugo:arangoproxy-"$arch"
  fi
}

function setup_arangoproxy() {
  version=$1

  container_name=docs_server_"$version"

  setup_arangoproxy_repositories "$version" "$container_name"

  log "[setup_arangoproxy] Done"
}

function container_ip() {
  docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' "$1"
}

function setup_arangoproxy_repositories() {
  version="$1"
  container_name="$2"

  ## arangoproxy runs arangosh via "docker exec" in the client container
  ## (container name + extra arangosh args, as a YAML/JSON flow sequence)
  client_args_yaml="["
  for arg in "${client_args[@]}"; do
    [ "$client_args_yaml" != "[" ] && client_args_yaml+=", "
    client_args_yaml+="\"$arg\""
  done
  client_args_yaml+="]"

  log "[setup_arangoproxy_repositories] Retrieve single server ip"
  single_server_ip=$(container_ip "$container_name")
  log "IP: "$single_server_ip""

  printf -v url "http://%s:8529" $single_server_ip

  log "[setup_arangoproxy_repositories] Copy single server configuration in arangoproxy repositories"
  yq e '.repositories += [{"type": "single", "version": "'"$version"'", "url": "'"$url"'", "container": "'"$client_container"'", "arangoshArgs": '"$client_args_yaml"'}]' -i "$ARANGOPROXY_CONFIG"

  log "[setup_arangoproxy_repositories] Retrieve cluster server ip"
  cluster_server_ip=$(container_ip "$container_name"_cluster)
  log "IP: "$cluster_server_ip""

  printf -v url "http://%s:8529" $cluster_server_ip

  log "[setup_arangoproxy_repositories] Copy cluster server configuration in arangoproxy repositories"
  yq e '.repositories += [{"type": "cluster", "version": "'"$version"'", "url": "'"$url"'", "container": "'"$client_container"'", "arangoshArgs": '"$client_args_yaml"'}]' -i "$ARANGOPROXY_CONFIG"
}


##### SERVER FUNCTIONS

function needs_servers() {
  [[ $GENERATORS == *"optimizer"* ]] || [[ $GENERATORS == *"options"* ]] || [[ $GENERATORS == *"examples"* ]]
}

## Hot backup examples create the local backup repository (/tmp/backups) with
## arangosh, but the server uploads to it. Share the directory between the servers
## and the client container (only the same container for images that bundle the
## client tools). A fresh volume per run, created by start_server.
function set_backups_mount() {
  backups_volume=docs_backups_$(version_var_suffix "$1" | tr '[:upper:]' '[:lower:]')
  backups_mount=(-v "$backups_volume":/tmp/backups)
}


### Start the containers of a version without waiting for them (see process_server)
function start_server() {
  image="$1"
  version="$2"

  LOG_TARGET="$image $version"
  if ! needs_servers; then
    return
  fi
  container_name=docs_server_"$version"

  set_backups_mount "$version"
  docker volume rm -f "$backups_volume" > /dev/null 2>&1
  docker volume create "$backups_volume" > /dev/null

    image_id=$(find_or_pull_image "$image" "$version")
    if [ -z "$image_id" ]; then
      abort_with_error "No image found for $image"
    fi
    run_arangodb_container "$container_name" "$image_id"
}

### Wait for the containers of a version and generate its content
function process_server() {
  image="$1"
  version="$2"

  report_detail ""
  report_detail "## $version"
  report_detail ""
  report_detail "- Server: \`$image\`"

  LOG_TARGET="$image $version"

  echo "[process_server] Processing Server $LOG_TARGET" 

  generators_from_source

  ## Generators stat do need arangodb instances running
  if needs_servers; then
    container_name=docs_server_"$version"
    set_backups_mount "$version"

    if [ $TRAP == 0 ]; then
      wait_for_arangodb_ready "$container_name"
      wait_for_arangodb_ready "$container_name"_cluster
    fi

      setup_client_container "$image" "$version" "$container_name"


    if [[ $GENERATORS == *"options"* ]] ; then
      generate_startup_options "$container_name" "$version"
    fi

    if [[ $GENERATORS == *"optimizer"* ]] ; then
      generate_optimizer_rules "$container_name" "$version"
    fi

    if [[ $GENERATORS == *"examples"* ]] ; then
      setup_arangoproxy "$version"
    fi
  fi
}

### Split images: the server image (repository "core", "core-preview", or
### "core-<suffix>", e.g. arangodb/core-preview:TAG) has no client tools, which are
### in a separate image of the same registry ("client-tools...", same tag).
### Prints the client tools image for a split server image, nothing otherwise (also
### for digests, which differ per image).
### Keep in sync with client_image_for() in .circleci/generate_config.py
function client_image_for() {
  if [[ "$1" =~ ^(.*/)?core((-[^/:@]*)?)(:.*)$ ]]; then
    echo "${BASH_REMATCH[1]}client-tools${BASH_REMATCH[2]}${BASH_REMATCH[4]}"
  fi
}

### Record an error for the report and exit
function abort_with_error() {
  message="$1"
  log "[ERROR] $message"
  report_error "Toolchain" "$version" "" "" "$message"
  finalize_report
  exit 1
}


### Set client_container (where arangosh & co. run) and client_args (extra arangosh args)
function setup_client_container() {
  image="$1"
  version="$2"
  server_container="$3"

  client_container="$server_container"
  client_image=$(client_image_for "$image")

  if [ -n "$client_image" ]; then
    client_container=docs_client_"$version"
    log "[setup_client_container] Split image, using client tools image $client_image"
    if ! docker image inspect "$client_image" > /dev/null 2>&1; then
      docker pull "$client_image"
    fi
    if [ $TRAP == 0 ]; then
      docker run -d --net docs_net --name "$client_container" "${backups_mount[@]}" --entrypoint sh "$client_image" -c 'tail -f /dev/null'
      follow_container_logs "$client_container"
    fi
  fi

  ## Pass the config file and JS directory explicitly in case the compiled-in
  ## defaults of arangosh don't match the image layout (e.g. compiled images).
  ## The directory name follows the major version (arangodb3, arangodb4, ...).
  ## (exactly one line per path, empty if not found)
  mapfile -t client_paths < <(docker exec "$client_container" sh -c '
    echo "$(ls -d /etc/arangodb*/arangosh.conf 2>/dev/null | sort -V | tail -n 1)"
    echo "$(ls -d /usr/share/arangodb*/js 2>/dev/null | sort -V | tail -n 1)"' 2>/dev/null | tr -d '\r')
  client_args=()
  if [ -n "${client_paths[0]}" ]; then
    client_args+=(--config "${client_paths[0]}")
  fi
  if [ -n "${client_paths[1]}" ]; then
    client_args+=(--javascript.startup-directory "${client_paths[1]}")
  fi
  printf -v shown_args '%s ' "${client_args[@]}"
  log "[setup_client_container] Client container: $client_container, arangosh args: $shown_args"
}


### Stream a container's output to the toolchain log with a [name] prefix, without the
### info/debug messages of arangod and the Starter (warnings, errors, and anything
### else like crash output are kept; see `docker logs <name>` for everything, and
### abort_container_start for the last lines on failure).
### Started right after docker run: even if the container exits immediately,
### docker logs --follow replays its full output (containers aren't --rm).
LOG_FILTER_RE='^[0-9TZ:.+-]+ (\[[0-9-]+\] )?(INFO|DEBUG|TRACE) |\|(INFO|DEBUG|TRACE)\|'
function follow_container_logs() {
  name="$1"
  docker logs --follow "$name" 2>&1 | while IFS= read -r line; do
    [[ "$line" =~ $LOG_FILTER_RE ]] || echo "[$name] $line"
  done &
}

### In local runs, keep all containers after an error for inspection (logs, site,
### servers) until the toolchain is stopped (Ctrl+C, docker compose down), which
### removes them (stop_on_signal). Returns immediately in CI.
function keep_containers_for_inspection() {
  if [ "$ENV" != "local" ]; then
    return
  fi
  log "[TERMINATE] Error (exit status $1). The containers are kept for inspection, press Ctrl+C or run docker compose down to remove them."
  while true; do
    sleep 1
  done
}

### The Starter writes the logs of the cluster's servers to files in its data
### directory, not to the console
STARTER_DATA_DIR=/localdata

### Print the output that helps to find out why a container failed: the last console
### lines including info messages (except the Starter's verbose version parsing),
### and for a cluster, the warnings, errors, and last lines of each server's log file
function print_failure_context() {
  name="$1"
  docker logs "$name" 2>&1 | grep -v "|INFO| Checking line" | tail -n 50 | while IFS= read -r line; do
    echo "[$name] (last lines) $line"
  done
  if [[ "$name" != *_cluster ]]; then
    return
  fi
  ## Copy the log files out of the container (also works if it exited)
  logs_dir=/tmp/failure-logs-$name
  rm -rf "$logs_dir"
  docker cp "$name":"$STARTER_DATA_DIR" "$logs_dir" > /dev/null 2>&1 || return
  find "$logs_dir" -name arangod.log | sort | while IFS= read -r file; do
    server=$(basename "$(dirname "$file")")
    {
      grep -E " (WARNING|ERROR|FATAL) " "$file" | tail -n 20
      echo "(last lines)"
      tail -n 10 "$file"
    } | while IFS= read -r line; do echo "[$name $server] $line"; done
  done
  rm -rf "$logs_dir"
}

### Log why a container failed to start, record the error in the summary, and exit
function abort_container_start() {
  name="$1"
  reason="$2"
  state=$(docker inspect -f 'status={{.State.Status}} exit code={{.State.ExitCode}} error={{.State.Error}}' "$name" 2>&1)
  sleep 1 # let follow_container_logs flush the container output
  print_failure_context "$name"
  log "[ERROR] $name $reason ($state). See the [$name] lines above for its output."
  report_error "Server" "$version" "$name" "" "$reason ($state)"
  finalize_report
  keep_containers_for_inspection 1
  exit 1
}

### Check status of ArangoDB instance until it is up and running
function wait_for_arangodb_ready() {
  name="$1"
  for ((attempt = 1; attempt <= 30; attempt++)); do
    if [ "$(docker inspect -f '{{.State.Running}}' "$name" 2>/dev/null)" != "true" ]; then
      abort_container_start "$name" "is not running"
    fi
    # Use IPv4 explicitly as localhost can resolve to IPv6 [::1] on which the server isn't listening
    # Caused by a change in Docker 26.0. Could also be solved with docker run --sysctl net.ipv6.conf.all.disable_ipv6=1 ...
    res=$(docker exec "$name" wget -q -S -O - http://127.0.0.1:8529/_api/version 2>&1 | grep -m 1 HTTP/ | awk '{print $2}')
    if [ "$res" = "200" ]; then
      log "Server is ready: $name"
      return 0
    fi
    log "Server not ready: $name  $res"
    sleep 2s
  done
  abort_container_start "$name" "did not become ready in time"
}


### Setup and run an ArangoDB docker image
function run_arangodb_container() {
  container_name="$1"
  image_id="$2"

  if [ $TRAP == 0 ]; then
    log "[run_arangodb_container] Run cluster server"
    docker run -d --net=docs_net -e ARANGO_NO_AUTH=1 --name="$container_name"_cluster "${backups_mount[@]}" \
      "$image_id" \
      arangodb --starter.local --starter.data-dir=$STARTER_DATA_DIR
    follow_container_logs "$container_name"_cluster

    log "[run_arangodb_container] Run single server"
    # A hot-backup restore restarts arangod via execvp, bypassing the image
    # entrypoint and NOT re-applying the config file (--config is not in effect
    # on the restart). Any config-only setting is then unset on the restarted
    # process, which either FATALs ("no startup-directory supplied") so the
    # container dies, or silently defaults wrong (e.g. the data directory, in
    # which case the server comes back WITHOUT the restored data). Command-line
    # flags DO survive the re-exec, so pass everything the restart needs
    # explicitly instead of relying on the config file.
    #
    # --database.directory applies to all versions and must match where the
    # restore places data (the image's LOCALSTATEDIR, /var/lib/arangodbN).
    # The V8/JS paths (startup-directory + Foxx app-path) apply only when the
    # server has server-side V8: we detect the js dir from the image itself (not
    # hardcoded) so it is correct for any layout and local/CI alike, and use its
    # presence as the V8 test. 4.0+ has no server-side V8/Foxx, so the probe
    # finds nothing and those flags are omitted (except in compiled images, which
    # ship the JS files for arangosh; 4.0+ arangod ignores the obsolete flags).
    # The directory name follows the major version (arangodb3, arangodb4, ...),
    # detected from the config file (or data directory) in the image.
    # Use an array expanded as "${single_args[@]}": this script sets IFS=""
    # elsewhere, so relying on unquoted word-splitting would pass all flags as a
    # single argument. An array keeps each flag a separate word regardless.
    mapfile -t layout < <(docker run --rm --entrypoint sh "$image_id" -c '
      d=$(ls -d /etc/arangodb*/arangod.conf 2>/dev/null | sort -V | tail -n 1)
      if [ -n "$d" ]; then d=$(dirname "$d"); else d=$(ls -d /var/lib/arangodb[0-9]* 2>/dev/null | grep -v -- -apps | sort -V | tail -n 1); fi
      name=$(basename "${d:-arangodb3}")
      echo "$name"
      for j in /usr/share/$name/js /usr/share/arangodb/js; do [ -d "$j" ] && echo "$j" && break; done
      echo' 2>/dev/null | tr -d '\r')
    arango_name="${layout[0]:-arangodb3}"
    js_dir="${layout[1]}"
    log "[run_arangodb_container] Detected directory name: $arango_name"
    single_args=(--server.endpoint http+tcp://0.0.0.0:8529 --database.directory=/var/lib/$arango_name)
    if [ -n "$js_dir" ]; then
      single_args+=("--javascript.startup-directory=$js_dir" --javascript.app-path=/var/lib/$arango_name-apps)
      log "[run_arangodb_container] Single server V8 paths: startup-directory=$js_dir app-path=/var/lib/$arango_name-apps"
    fi
    docker run -d --net docs_net -e ARANGO_NO_AUTH=1 --name "$container_name" "${backups_mount[@]}" \
      "$image_id" \
      "${single_args[@]}"
    follow_container_logs "$container_name"
  fi
}






## ------------------------


### GENERATORS FUNCTIONS

export IFS=""

function generators_from_source() {
  if [[ $GENERATORS == *"error-codes"* ]]; then
    generate_error_codes "$version"
  fi

  if [[ $GENERATORS == *"exit-codes"* ]]; then
    generate_exit_codes "$version"
  fi

  if [[ $GENERATORS == *"metrics"* ]]; then
    generate_metrics "$version"
  fi
}


function generate_startup_options() {
  status="✓"

  container_name="$1"
  version="$2"
  log "[generate_startup_options] Starting options dump for container " "$container_name"
  # arangobench removed in ArangoDB 4.0
  if [[ "$version" =~ ^3\. ]]; then
    declare -a ALLPROGRAMS=("arangobackup" "arangobench" "arangod" "arangodump" "arangoexport" "arangoimport" "arangoinspect" "arangorestore" "arangosh" "arangovpack")
  else
    declare -a ALLPROGRAMS=("arangobackup" "arangod" "arangodump" "arangoexport" "arangoimport" "arangoinspect" "arangorestore" "arangosh" "arangovpack")
  fi

  for HELPPROGRAM in ${ALLPROGRAMS[@]}; do
      log "[generate_startup_options] Dumping program options of ${HELPPROGRAM}"
      ## arangod from the server, the client tools from the client container (same container unless split image)
      program_container="$client_container"
      if [ "$HELPPROGRAM" == "arangod" ]; then
        program_container="$container_name"
      fi
      log "docker exec -it $program_container ${HELPPROGRAM} --dump-options > ../../site/data/$version/$HELPPROGRAM.json"

      res=$((docker exec "$program_container" "${HELPPROGRAM}" --dump-options) 2>&1)
      
      if [ $? -ne 0 ]; then
        log "[generate_startup_options] [ERROR] $res"
        report_error "Startup options" "$version" "$HELPPROGRAM" "" "$res"
        status="❌"
      fi

      echo $res > ../../site/data/$version/"$HELPPROGRAM".json
      log "[generate_startup_options] Done"
  done
  report_detail "- $version startup options: $status"

}

function generate_optimizer_rules() {
  status="✓"

  container_name="$1"
  version="$2"

  log "[generate_optimizer_rules] Generating optimizer rules " "$container_name"
  echo ""
  functions=$(cat generators/generateOptimizerRules.js)
  cluster_server_ip=$(container_ip "$container_name"_cluster)
  ## stderr separately, it has the startup errors but would corrupt the JSON output
  errfile=$(mktemp)
  res=$(docker exec "$client_container" arangosh "${client_args[@]}" --server.endpoint "tcp://$cluster_server_ip:8529" --server.authentication false --javascript.execute-string "$functions" 2>"$errfile")
  exit_code=$?
  err=$(cat "$errfile"); rm -f "$errfile"

  if [ $exit_code -ne 0 ]; then
    log "[generate_optimizer_rules] [ERROR] (exit code $exit_code) $res $err"
    report_error "Optimizer rules" "$version" "" "" "arangosh exit code $exit_code"$'\n'"$res"$'\n'"$err"
    status="❌"
  fi

  echo $res > ../../site/data/$version/optimizer-rules.json
  report_detail "- $version optimizer rules: $status"

  log "[generate_optimizer_rules] Done"
}


function generate_error_codes() {
  status="✓"

  version=$1

  if [ $version == "" ]; then
    log "[generate_error_codes] ArangoDB Source code not found. Aborting"
    exit 1
  fi
  touch ../../site/data/$version/errors.yaml

  log "[generate_error_codes] Launching generate error-codes script"
  log "[generate_error_codes] $PYTHON_EXECUTABLE generators/generateErrorCodes.py --src /tmp/"$1"/lib/Basics/errors.dat --dst ../../site/data/$version/errors.yaml"
  res=$(("$PYTHON_EXECUTABLE" generators/generateErrorCodes.py --src /tmp/"$1"/lib/Basics/errors.dat --dst ../../site/data/$version/errors.yaml) 2>&1)

  if [ $? -ne 0 ]; then
    log "[generate_error_codes] [ERROR] $res"
    report_error "Error codes" "$version" "" "" "$res"
    status="❌"
  fi

  report_detail "- $version error codes: $status"

  log "[generate_error_codes] Done"
}

function generate_exit_codes() {
  status="✓"

  version=$1

  if [ $version == "" ]; then
    log "[generate_exit_codes] ArangoDB Source code not found. Aborting"
    exit 1
  fi
  touch ../../site/data/$version/exitcodes.yaml

  log "[generate_exit_codes] Launching generate exit-codes script"
  log "[generate_exit_codes] $PYTHON_EXECUTABLE generators/generateExitCodes.py --src /tmp/"$1"/lib/Basics/exitcodes.dat --dst ../../site/data/$version/exitcodes.yaml"
  res=$(("$PYTHON_EXECUTABLE" generators/generateExitCodes.py --src /tmp/"$1"/lib/Basics/exitcodes.dat --dst ../../site/data/$version/exitcodes.yaml) 2>&1)

  if [ $? -ne 0 ]; then
    log "[generate_exit_codes] [ERROR] $res"
    report_error "Exit codes" "$version" "" "" "$res"
    status="❌"
  fi

  report_detail "- $version exit codes: $status"

  log "[generate_exit_codes] Done"
}

function generate_metrics() {
  status="✓"

  version=$1

  if [ $version == "" ]; then
    log "[generate_error_codes] ArangoDB Source code not found. Aborting"
    report_error "Metrics" "$version" "" "" "ArangoDB source code not found"
  fi

  log "[generate_metrics] Generate Metrics requested"
  log "[generate_metrics] $PYTHON_EXECUTABLE generators/generateMetrics.py --main /tmp/"$version" --dst ../../site/data/$version"
  res=$(("$PYTHON_EXECUTABLE" generators/generateMetrics.py --main /tmp/"$version" --dst ../../site/data/$version) 2>&1)

  if [ $? -ne 0 ]; then
    log "[generate_metrics] [ERROR] $res"
    report_error "Metrics" "$version" "" "" "$res"
    status="❌"
  fi

  report_detail "- $version metrics: $status"

  log "[generate_metrics] Done"
  
}

function generate_oasisctl() {
  status="✓"

  log "[generate_oasisctl] Generate OasisCTL docs"

  if [ ! -f /tmp/oasisctl.zip ]; then
    log "[generate_oasisctl] /tmp/oasisctl.zip not found. Invoking download_oasisctl"
    download_oasisctl
  fi

  mkdir -p /tmp/oasisctl
  mkdir -p /tmp/preserve

  cp ../../site/content/amp/oasisctl/_index.md /tmp/preserve/oasisctl.md > /dev/null
  rm -r ../../site/content/amp/oasisctl/* > /dev/null

  log "[generate_oasisctl] oasisctl generate-docs --link-file-ext .html --replace-underscore-with - --output-dir /tmp/oasisctl)"
  res=$(oasisctl generate-docs --link-file-ext .html --replace-underscore-with - --output-dir /tmp/oasisctl)
  if [ $? -ne 0 ]; then
    log "[generate_oasisctl] [ERROR] Error from oasisctl generate-docs: $res"
    report_error "OasisCTL" "" "oasisctl generate-docs" "" "$res"
    status="❌"
  fi

  log "[generate_oasisctl] "$PYTHON_EXECUTABLE" generators/oasisctl.py --src /tmp/oasisctl --dst ../../site/content/amp/oasisctl/"
  res=$(("$PYTHON_EXECUTABLE" generators/oasisctl.py --src /tmp/oasisctl --dst ../../site/content/amp/oasisctl/) 2>&1 )
  if [ $? -ne 0 ]; then
    log "[generate_oasisctl] [ERROR] Error from oasisctl.py: $res"
    report_error "OasisCTL" "" "oasisctl.py" "" "$res"
    status="❌"
  fi

  cp /tmp/preserve/oasisctl.md ../../site/content/amp/oasisctl/_index.md

  report_detail "- OasisCTL: $status"

  log "[generate_oasisctl] Done"
}

function download_oasisctl() {
  oasisctlVersion=$(curl -I https://github.com/arangodb-managed/oasisctl/releases/latest | awk -F '/' '/^location/ {print  substr($NF, 1, length($NF)-1)}')
  log "[download_oasisctl] Downloading oasisctl version $oasisctlVersion"
  cd /tmp
  wget https://github.com/arangodb-managed/oasisctl/releases/download/$oasisctlVersion/oasisctl.zip
  unzip oasisctl.zip
  mv bin/linux/arm/ bin/linux/arm64
  mv bin/linux/amd64/oasisctl /usr/bin/oasisctl && chmod +x /usr/bin/oasisctl
  cd /home/toolchain/scripts
}



### SYSTEM HANDLERS FUNCTIONS

### This function runs in background waiting to intercept an exit signal from arangoproxy/site container
### as soon as the signal arrives, the toolchain is terminated
function trap_container_exit() {
  terminate=false
  while [ "$terminate" = false ] ;
  do
    siteContainerStatus=$(docker ps | grep docs_site)
    if [ "$siteContainerStatus" == "" ] ; then
      log "[TERMINATE] Site exited, shutting down all containers" >> toolchain.log

      terminate=true
    fi
    toolchainContainerStatus=$(docker ps | grep toolchain)
    if [ "$toolchainContainerStatus" == "" ] ; then
      log "[TERMINATE] Toolchain exited, shutting down all containers" >> toolchain.log

      terminate=true
    fi
    arangoproxyContainerStatus=$(docker ps | grep docs_arangoproxy)
    if [ "$arangoproxyContainerStatus" == "" ] ; then
      log "[TERMINATE] Arangoproxy exited, shutting down all containers" >> toolchain.log
      terminate=true
    fi
    if [ "$ENV" == "local" ] && report_has_errors; then
      terminate=true
    fi
    ## Don't busy-loop, and let pending signals (stop_on_signal) be handled
    [ "$terminate" = false ] && sleep 1
  done

  if report_has_errors; then
    log "[TERMINATE] Errors during content generation:" >> toolchain.log
    grep '^error' "$REPORT_ISSUES" | cut -f2-5 | tr '\t' ' ' >> toolchain.log
  fi

  log "[stop_all_containers] A stop signal has been captured. Stopping all containers" >> toolchain.log
  TRAP=1

  # Inspect before docker stop; the poll loop only observes—stopping there records 137 for siblings still running.
  arangoproxy_exit=0
  site_exit=0
  if docker inspect docs_arangoproxy &>/dev/null; then
    arangoproxy_status=$(docker inspect docs_arangoproxy --format '{{.State.Status}}')
    if [ "$arangoproxy_status" = "exited" ]; then
      arangoproxy_exit=$(docker inspect docs_arangoproxy --format '{{.State.ExitCode}}')
    fi
  fi
  if docker inspect docs_site &>/dev/null; then
    site_status=$(docker inspect docs_site --format '{{.State.Status}}')
    if [ "$site_status" = "exited" ]; then
      site_exit=$(docker inspect docs_site --format '{{.State.ExitCode}}')
    fi
  fi
  arangoproxy_exit=${arangoproxy_exit:-0}
  site_exit=${site_exit:-0}

  exit_status=0
  exit_source=""
  if report_has_errors; then
    exit_status=1
    exit_source="report"
  elif [ "${arangoproxy_exit:-0}" -ne 0 ]; then
    exit_status="$arangoproxy_exit"
    exit_source="docs_arangoproxy"
  elif [ "${site_exit:-0}" -ne 0 ]; then
    exit_status="$site_exit"
    exit_source="docs_site"
  fi

  finalize_report
  if [ "$exit_status" -ne 0 ]; then
    keep_containers_for_inspection "$exit_status"
  fi

  docker stop docs_arangoproxy docs_site

  docker ps -a --filter name=docs_* -q | xargs -r docker stop | xargs -r docker rm
  docker volume ls -q --filter name=docs_backups_ | xargs -r docker volume rm > /dev/null
  log "[stop_all_containers] Done" >> /home/toolchain.log

  if [ -n "$exit_source" ]; then
    log "[stop_all_containers] Toolchain Exit Status ($exit_source) $exit_status" >> /home/toolchain.log
  else
    log "[stop_all_containers] Toolchain Exit Status 0" >> /home/toolchain.log
  fi
  exit "$exit_status"
}



### The docs_* containers are started via the Docker socket, so docker compose doesn't
### know about them. Remove them when the toolchain container is stopped (docker compose
### down, Ctrl+C), as bash as PID 1 ignores SIGTERM/SIGINT without a handler.
### A forced kill (second Ctrl+C) can't be handled, the next run cleans up instead.
### Exits with 0 locally (an intentional stop), 143 (SIGTERM) in CI (cancellation).
function stop_on_signal() {
  TRAP=1
  echo "[TOOLCHAIN] Stop requested, removing the docs_* containers"
  docker ps -a --filter name=docs_* -q | xargs -r docker rm -f > /dev/null
  docker volume ls -q --filter name=docs_backups_ | xargs -r docker volume rm > /dev/null
  if [ "$ENV" == "local" ]; then
    exit 0
  fi
  exit 143
}

trap stop_on_signal SIGTERM SIGINT

## --------------------------

main
