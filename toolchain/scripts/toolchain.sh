#!/bin/bash
##################################
#### Toolchain Launch Script
##################################

### Entrypoint of the toolchain docker image launched using docker compose.
### This script sets up everything needed by the toolchain to work and generate content.
### Check Env Vars, Launch ArangoDB docker images, Launch arangoproxy and site containers, generate content

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

### SETUP
#### Check/set env vars, install requirements

PYTHON_EXECUTABLE="python"
DOCKER_COMPOSE_ARGS=""
LOG_TARGET=""


### Check whether python or python3 is installed
if ! command -v "$PYTHON_EXECUTABLE" &> /dev/null
  then
  PYTHON_EXECUTABLE="python3"
fi

### Check yq is installed
if ! command -v yq &> /dev/null
  then
  echo "[INIT] yq command not found, downloading"
  wget -q https://github.com/mikefarah/yq/releases/latest/download/yq_linux_"$ARCH" -O /usr/bin/yq &&\
  chmod +x /usr/bin/yq
fi

echo "[INIT] Toolchain setup"
echo "[INIT] Environment variables:"

if [[ -z "${DOCKER_ENV}" ]]; then
  DOCKER_ENV="dev"   ## dev as default env
fi

## if no generators set, defaults to all
if [[ -z "${GENERATORS}" ]] || [ "${GENERATORS}" == "" ]; then
  GENERATORS="examples metrics error-codes options optimizer"
fi

## at least one arangodb src folder must be provided
if [[ -z "${ARANGODB_SRC}" ]] && [[ -z "${ARANGODB_SRC_2}" ]] && [[ -z "${ARANGODB_SRC_3}" ]]; then
  echo "[INIT] ERROR: No ARANGODB_SRC variable set, please set it."
  exit 1
fi

echo "  DOCKER_ENV=$DOCKER_ENV"


## Split the ARANGODB_BRANCH env var into name, image, version fields (for CI/CD)
export IFS=","
if [ "$ARANGODB_BRANCH" != "" ] ; then
      export ARANGODB_BRANCH_1_NAME=$(env | grep ^ARANGODB_BRANCH= | cut -d= -f2 | cut -d, -f1)
      export ARANGODB_BRANCH_1_IMAGE=$(env | grep ^ARANGODB_BRANCH= | cut -d= -f2 | cut -d, -f2)
      export ARANGODB_BRANCH_1_VERSION=$(env | grep ^ARANGODB_BRANCH= | cut -d= -f2 | cut -d, -f3)
fi

if [ "$ARANGODB_BRANCH_2" != "" ] ; then
      export ARANGODB_BRANCH_2_NAME=$(env | grep ^ARANGODB_BRANCH_2= | cut -d= -f2 | cut -d, -f1)
      export ARANGODB_BRANCH_2_IMAGE=$(env | grep ^ARANGODB_BRANCH_2= | cut -d= -f2 | cut -d, -f2)
      export ARANGODB_BRANCH_2_VERSION=$(env | grep ^ARANGODB_BRANCH_2= | cut -d= -f2 | cut -d, -f3)
fi

if [ "$ARANGODB_BRANCH_3" != "" ] ; then
      export ARANGODB_BRANCH_3_NAME=$(env | grep ^ARANGODB_BRANCH_3= | cut -d= -f2 | cut -d, -f1)
      export ARANGODB_BRANCH_3_IMAGE=$(env | grep ^ARANGODB_BRANCH_3= | cut -d= -f2 | cut -d, -f2)
      export ARANGODB_BRANCH_3_VERSION=$(env | grep ^ARANGODB_BRANCH_3= | cut -d= -f2 | cut -d, -f3)
fi

### Generator flags
generate_examples=false
generate_startup=false
generate_metrics=false
generate_error_codes=false
generate_apidocs=false
generate_optimizer=false

start_servers=false

## Expand environment variables in config.yaml, if present
yq  '(.. | select(tag == "!!str")) |= envsubst' -i ../docker/config.yaml

GENERATORS=$(yq -r '.generators' ../docker/config.yaml)


if [ "$GENERATORS" == "" ]; then
  GENERATORS="examples metrics error-codes options optimizer"
fi

# Check for requested operations
if [[ $GENERATORS == *"examples"* ]]; then
  generate_examples=true
  start_servers=true
fi

if [[ $GENERATORS == *"options"* ]]; then
  generate_startup=true
  start_servers=true
fi

if [[ $GENERATORS == *"metrics"* ]]; then
  generate_metrics=true
fi

if [[ $GENERATORS == *"error-codes"* ]]; then
  generate_error_codes=true
fi

if [[ $GENERATORS == *"optimizer"* ]]; then
  generate_optimizer=true
  start_servers=true
fi





echo "[TOOLCHAIN] Expanded Config file:"
cat ../docker/config.yaml
echo ""

## Flush repositories field of arangoproxy config
echo "[TOOLCHAIN] Clean arangoproxy config file"
yq '.repositories = []' -i ../arangoproxy/cmd/configs/local.yaml 

echo "[INIT] Setup Finished"



## Utility to print with [current arangodb server] attached
function log(){
  echo "[$LOG_TARGET] "$1""
}

function return_image_id() {
  echo "$1"
}


### IMAGE PULL/START FUNCTIONS
#### Pull an ArangoDB Image
#### First try using the official arangodb repository (e.g. arangodb/enterprise-preview)
#### If fails, try using the arangodb/docs-hugo repository used to store feature-pr compiled images
function pull_image() {
  log "[PULL-IMAGE] Invoke"
  branch_name="$1"
  version="$2"
  src="$3"

  # Check the image is an official dockerhub image
  log "[PULL IMAGE] Try from Offical ArangoDB Dockerhub"
  docker pull "$branch_name"

  if [ "$?" == "0" ]; then
    log "[PULL IMAGE] Image downloaded from Dockerhub"
    return
  fi

  log "[PULL IMAGE] Try from Private arangodb/docs-hugo Dockerhub repository"
  image_name=$(echo ${branch_name##*/})
  main_hash=$(awk 'END{print}' $src/.git/logs/HEAD | awk '{print $2}' | cut -c1-9)  ## Get hash of latest commit of git branch of arangodb/arangodb repo

  docker_tag="arangodb/docs-hugo:$image_name-$version-$main_hash"

  image_id=$(docker images --filter=reference=$docker_tag | awk 'NR==2' | awk '{print $3}')
  if [ "$image_id" == "" ]; then
    docker pull $docker_tag
    docker tag $docker_tag $image_name-$version ## tag with an easier name for easier local access to the image
  fi
}


## Copy arangosh executable from the ArangoDB docker container to the arangoproxy container
## Write to the arangoproxy config file the ArangoDB images IPs 
function setup_arangoproxy() {
  name=$1
  image=$2
  version=$3

  container_name="$name"_"$version"

  log "[SETUP ARANGOPROXY] Setup dedicated arangosh in arangoproxy"

  ## Create directory where arangosh executable will be stored
  mkdir -p ../arangoproxy/arangosh/"$name"/"$version"/usr ../arangoproxy/arangosh/"$name"/"$version"/usr/bin ../arangoproxy/arangosh/"$name"/"$version"/usr/bin/etc/relative

  ## Copy arangosh executables from ArangoDB docker container to arangoproxy container
  docker cp "$container_name":/usr/bin/arangosh ../arangoproxy/arangosh/"$name"/"$version"/usr/bin/arangosh
  docker cp "$container_name":/usr/bin/icudtl.dat ../arangoproxy/arangosh/"$name"/"$version"/usr/bin/icudtl.dat

  docker cp "$container_name":/usr/share/ ../arangoproxy/arangosh/"$name"/"$version"/usr/
  docker cp "$container_name":/etc/arangodb3/arangosh.conf ../arangoproxy/arangosh/"$name"/"$version"/usr/bin/etc/relative/arangosh.conf

  sed -i -e 's~startup-directory.*~startup-directory = /home/toolchain/arangoproxy/arangosh/'"$name"'/'"$version"'/usr/share/arangodb3/js~' ../arangoproxy/arangosh/"$name"/"$version"/usr/bin/etc/relative/arangosh.conf
  echo ""

  ## Retrieve the single server ip and write it to arangoproxy config
  log "[SETUP ARANGOPROXY] Retrieve server ip"
  single_server_ip=$(docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' "$container_name")
  log "IP: "$single_server_ip""
  echo ""

  printf -v url "http://%s:8529" $single_server_ip

  ## Retrieve the cluster server ip and write it to arangoproxy config
  log "[SETUP ARANGOPROXY] Copy single server configuration in arangoproxy repositories"
  yq e '.repositories += [{"name": "'"$name"'", "type": "single", "version": "'"$version"'", "url": "'"$url"'"}]' -i ../arangoproxy/cmd/configs/local.yaml

  log "[SETUP ARANGOPROXY] Retrieve server ip"
  cluster_server_ip=$(docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' "$container_name"_agency)
  log "IP: "$cluster_server_ip""
  echo ""

  printf -v url "http://%s:8529" $cluster_server_ip

  log "[SETUP ARANGOPROXY] Copy cluster server configuration in arangoproxy repositories"
  yq e '.repositories += [{"name": "'"$name"'", "type": "cluster", "version": "'"$version"'", "url": "'"$url"'"}]' -i ../arangoproxy/cmd/configs/local.yaml
  log "[SETUP ARANGOPROXY] Done"
}


### Setup and run an ArangoDB docker image
function start_server() {
  name=$1
  branch_name=$2
  version=$3
  src=$4
  container_name="$name"_"$version"
  examples=$5
  options=$6
  optimizer=$7

  log "[START_SERVER] Setup server"
  echo "$name" "$image" "$version"
  echo ""

  ## Create the docs_net docker network if it doesn't exist
  log "[START_SERVER] setup docs_net docker network"
  docker network inspect docs_net >/dev/null 2>&1 || docker network create --driver=bridge --subnet=192.168.129.0/24 docs_net
  echo ""

  ## Stop and remove old containers of this ArangoDB docker image
  log "[START_SERVER] Cleanup old containers"
  docker container stop "$container_name" "$container_name"_agency "$container_name"_coordinator "$container_name"_dbserver arangoproxy site &> /dev/null || true
  docker container rm "$container_name" "$container_name"_agency "$container_name"_coordinator "$container_name"_dbserver arangoproxy site &> /dev/null  || true
  echo ""

  ## Cut the firstword/ from the branch field
  image_name=$(echo ${branch_name##*/})

  ## Get the docker image id to run of the server
  image_id=$(docker images --filter=reference=$image_name-$version | awk 'NR==2' | awk '{print $3}')
  if [ "$image_id" == "" ]; then
    echo "$branch_name"
    image_id=$(docker images --filter=reference=$branch_name | awk 'NR==2' | awk '{print $3}') ## this is used for official arangodb images, arangodb/arangodb:tag
    if [ "$image_id" == "" ]; then
    ## Download the server image from Dockerhub/CircleCI
      if [ "$DOCKER_ENV" == "dev" ]; then
        pull_image "$branch_name" "$version" "$src"
        image_id=$(docker images --filter=reference=$image_name-$version | awk 'NR==2' | awk '{print $3}')
      else
        echo "[START_SERVER] No Image ID find to run"
        echo "[ERROR] Aborting"
        exit 1
      fi
    fi
  fi
 
  log "$image_id"

  ## Single server available addresses
  declare -a single_addresses=("192.168.129.2" "192.168.129.12" "192.168.129.22" "192.168.129.32")
  single_address=""

  for address in "${single_addresses[@]}";
  do
    ## Check $address is already occupied
    docs_net_ips=$(docker network inspect docs_net | grep "$address"/)
    if [ "$docs_net_ips" == "" ]; then
      single_address=$address
      break
    fi
  done

  log "[START_SERVER] Run single server"
  log "[START_SERVER] Using $single_address as single server ip"

  docker run -e ARANGO_NO_AUTH=1 --net docs_net --ip="$single_address" --name "$container_name" -d "$image_id" --server.endpoint http+tcp://"$single_address":8529

  log "[START_SERVER] Run cluster server"


echo Starting agency...
docker run -d --net=docs_net -e ARANGO_NO_AUTH=1 --name="$container_name"_agency \
  "$image_id" \
   arangodb --starter.local --starter.data-dir=./localdata


  if [ "$options" = true ] ; then
    generate_startup_options "$container_name" "$version"
  fi

  if [ "$optimizer" = true ] ; then
    generate_optimizer_rules "$container_name" "$version"
  fi

   if [ "$examples" = true ] ; then
    setup_arangoproxy "$name" "$image_name" "$version"
  fi
}

## ------------------------


### GENERATORS FUNCTIONS

function generate_startup_options() {
  set -e
  echo "<h2>Startup Options</h2>" >> /home/summary.md

  container_name="$1"
  version="$2"
  log "[GENERATE OPTIONS] Starting options dump for container " "$container_name"
  echo ""
  declare -a ALLPROGRAMS=("arangobench" "arangod" "arangodump" "arangoexport" "arangoimport" "arangoinspect" "arangorestore" "arangosh")

  for HELPPROGRAM in ${ALLPROGRAMS[@]}; do
      pwd
      log "[GENERATE OPTIONS] Dumping program options of ${HELPPROGRAM}"
      log "docker exec -it $container_name ${HELPPROGRAM} --dump-options >> ../../site/data/$version/$HELPPROGRAM.json"

      docker exec "$container_name" "${HELPPROGRAM}" --dump-options >> ../../site/data/$version/"$HELPPROGRAM".json
      log "Done"
  done

  set +e
}

function generate_optimizer_rules() {
  set -e
  echo "<h2>Optimizer Rules</h2>" >> /home/summary.md

  container_name="$1"
  version="$2"
  log "[GENERATE OPTIMIZER] Generating optimizer rules " "$container_name"
  echo ""
  functions=$(cat generators/generateOptimizerRules.js)
  docker exec "$container_name"_agency arangosh --server.authentication false --javascript.execute-string $functions >> ../../site/data/$version/optimizer-rules.json
  sed -i '1d' ../../site/data/$version/optimizer-rules.json
  log "Done"

  set +e

}


function generate_error_codes() {
  errors_dat_file=$1
  version=$2
  touch ../../site/data/$version/errors.yaml
  log "[GENERATE ERROR-CODES] Launching generate error-codes script"
  log "[GENERATE ERROR-CODES] $PYTHON_EXECUTABLE generators/generateErrorCodes.py --src "$1"/lib/Basics/errors.dat --dst ../../site/data/$version/errors.yaml"
  "$PYTHON_EXECUTABLE" generators/generateErrorCodes.py --src "$1"/lib/Basics/errors.dat --dst ../../site/data/$version/errors.yaml
}

function generate_metrics() {
  set -e

  src=$1
  version=$2
  log "[GENERATE-METRICS] Generate Metrics requested"
  log "[GENERATE-METRICS] $PYTHON_EXECUTABLE generators/generateMetrics.py --main $src --dst ../../site/data/$version"
  "$PYTHON_EXECUTABLE" generators/generateMetrics.py --main "$src" --dst ../../site/data/$version
  
  set +e
}



## -------------------



### SYSTEM HANDLERS FUNCTIONS

### This function runs in background waiting to intercept an exit signal from arangoproxy/site container
### as soon as the signal arrives, the toolchain is terminated
function trap_container_exit() {
  terminate=false
  while [ "$terminate" = false ] ;
  do
    siteContainerStatus=$(docker ps -a -q --filter "name=site" --filter "status=exited")
    if [ "$siteContainerStatus" != "" ] ; then
      echo "[TERMINATE] Site exited, shutting down all containers" >> arangoproxy-log.log

      terminate=true
    fi
    arangoproxyContainerStatus=$(docker ps -a -q --filter "name=arangoproxy" --filter "status=exited")
    if [ "$arangoproxyContainerStatus" != "" ] ; then
      echo "[TERMINATE] Arangoproxy exited, shutting down all containers" >> site-log.log
      terminate=true
    fi
  done
  echo "[TERMINATE] Before docker compose stop all" >> arangoproxy-log.log
  docker container ps -a
  #docker container stop $(docker ps -aq)
  echo "[TERMINATE] After docker container stop all" >> arangoproxy-log.log
  echo "[TERMINATE] After docker container stop all"

  docker container stop toolchain
}


function clean_terminate_toolchain() {
  echo "[TOOLCHAIN] Terminate signal trapped"
  echo "[TOOLCHAIN] Shutting down running containers"
  trap - SIGINT SIGTERM # clear the trap
  docker container stop $(docker ps -aq)
}

## --------------------------


## MAIN

echo "[TOOLCHAIN] Starting toolchain"
echo "[TOOLCHAIN] Generators: $GENERATORS"

  echo "<h2>Generators</h2>" >> /home/summary.md
  echo "$GENERATORS" >> /home/summary.md
  mapfile servers < <(yq e -o=j -I=0 '.servers[]' ../docker/config.yaml )

  for server in "${servers[@]}"; do
    name=$(echo "$server" | yq e '.name' -)
    image=$(echo "$server" | yq e '.image' -)
    version=$(echo "$server" | yq e '.version' -)
    arangodb_src=$(echo "$server" | yq e '.src' -)


    if [ "$arangodb_src" == "" ] ; then
      continue
    fi

    echo "<li><strong>$version</strong>: $image</li>" >> /home/summary.md

    LOG_TARGET="$name $image $version"

    echo "[TOOLCHAIN] Processing Server $LOG_TARGET" 


    if [ "$generate_error_codes" = true ] ; then
      echo "<h2>Error-Codes</h2>" >> /home/summary.md
      generate_error_codes "$arangodb_src" "$version"
    fi

    if [ "$generate_metrics" = true ] ; then
      echo "<h2>Metrics</h2>" >> /home/summary.md
      generate_metrics "$arangodb_src" "$version"
    fi

    ## Generators stat do need arangodb instances running
    if [ "$start_servers" = true ] ; then
      start_server "$name" "$image" "$version" "$arangodb_src" "$generate_examples" "$generate_startup" "$generate_optimizer"
    fi
  done

  ## Start arangoproxy and site containers to build examples and site
  if [ "$generate_examples" = true ] ; then
    echo "<h2>Examples</h2>" >> /home/summary.md

    set -e

    if [ "$DOCKER_ENV" == "dev" ]; then 
      ## If working locally, build the latest local image
      export DOCKER_BUILDKIT=1
      docker build --target arangoproxy ../docker/ -t arangoproxy
      docker  build --target hugo ../docker/ -t site
    else 
      ## CI/CD env, do not build images, pull them from remote repo
      docker pull arangodb/docs-hugo:arangoproxy > /dev/null
      docker pull arangodb/docs-hugo:site > /dev/null
      docker tag arangodb/docs-hugo:arangoproxy arangoproxy > /dev/null
      docker tag arangodb/docs-hugo:site site > /dev/null
    fi

    set +e
    
    cd ../../
    echo "[GENERATE-EXAMPLES]  Run arangoproxy and site containers"
    docker run -d --name site --network=docs_net --ip=192.168.129.130 --env-file toolchain/docker/env/"$DOCKER_ENV".env -p 1313:1313 --volumes-from toolchain --log-opt tag="{{.Name}}" site 
    docker run -d --name arangoproxy --network=docs_net --ip=192.168.129.129 --env-file toolchain/docker/env/"$DOCKER_ENV".env --volumes-from toolchain --log-opt tag="{{.Name}}" arangoproxy

    ## redirect logs of arangoproxy and site containers to files
    docker logs --details --follow arangoproxy > arangoproxy-log.log &
    docker logs --details --follow site > site-log.log &

    ## Run the container exit signal interceptor in background
    trap_container_exit &
    #trap clean_terminate_toolchain SIGINT SIGTERM SIGKILL

    ## tail to stdout the log files
    tail -f arangoproxy-log.log site-log.log

    ## If a container exits, the tail gets interrupted and the script will arrive here
    echo "[TERMINATE] Site container exited"
    echo "[TERMINATE] Terminating toolchain"
  fi
