#!/bin/bash
##################################
#### Toolchain Launch Script
##################################

### Entrypoint of the toolchain docker image launched using docker compose.
### This script sets up everything needed by the toolchain to work and generate content.
### Check Env Vars, Launch ArangoDB docker images, Launch arangoproxy and site containers, generate content

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


echo "[INIT] Toolchain setup"
echo "[INIT] Environment variables:"

## if no generators set, defaults to all
if [[ -z "${GENERATORS}" ]] || [ "${GENERATORS}" == "" ]; then
  GENERATORS="examples metrics error-codes options optimizer oasisctl"
fi

## at least one arangodb src folder must be provided
if [[ -z "${ARANGODB_SRC_3_10}" ]] && [[ -z "${ARANGODB_SRC_3_11}" ]] && [[ -z "${ARANGODB_SRC_3_12}" ]]; then
  echo "[INIT] ERROR: No ARANGODB_SRC variable set, please set it."
  exit 1
fi

echo "  DOCKER_ENV=$DOCKER_ENV"



## Split the ARANGODB_BRANCH env var into name, image, version fields (for CI/CD)
if [ "$ARANGODB_BRANCH_3_10" != "" ] ; then
      export ARANGODB_BRANCH_3_10_NAME="stable"
      export ARANGODB_BRANCH_3_10_IMAGE="$ARANGODB_BRANCH_3_10"
      export ARANGODB_BRANCH_3_10_VERSION="3.10"
fi

if [ "$ARANGODB_BRANCH_3_11" != "" ] ; then
      export ARANGODB_BRANCH_3_11_NAME="stable"
      export ARANGODB_BRANCH_3_11_IMAGE="$ARANGODB_BRANCH_3_11"
      export ARANGODB_BRANCH_3_11_VERSION="3.11"
fi

if [ "$ARANGODB_BRANCH_3_12" != "" ] ; then
      export ARANGODB_BRANCH_3_12_NAME="stable"
      export ARANGODB_BRANCH_3_12_IMAGE="$ARANGODB_BRANCH_3_12"
      export ARANGODB_BRANCH_3_12_VERSION="3.12"
fi

start_servers=false

## Expand environment variables in config.yaml, if present
yq  '(.. | select(tag == "!!str")) |= envsubst' -i ../docker/config.yaml

GENERATORS=$(yq -r '.generators' ../docker/config.yaml)


if [ "$GENERATORS" == "" ]; then
  GENERATORS="examples metrics error-codes options optimizer oasisctl"
fi


echo "[TOOLCHAIN] Expanded Config file:"
cat ../docker/config.yaml
echo ""

## Flush repositories field of arangoproxy config
echo "[TOOLCHAIN] Clean arangoproxy config file"
yq '.repositories = []' -i ../arangoproxy/cmd/configs/local.yaml 

echo "[INIT] Setup Finished"




function main() {
  echo "[TOOLCHAIN] Starting toolchain"
  echo "[TOOLCHAIN] Generators: $GENERATORS"

  echo "<h2>Generators</h2>" >> /home/summary.md
  echo "$GENERATORS" >> /home/summary.md

  mapfile servers < <(yq e -o=j -I=0 '.servers[]' ../docker/config.yaml )

  ## Generate content and start server
  for server in "${servers[@]}"; do
    arangodb_src=$(echo "$server" | yq e '.src' -)
    if [ "$arangodb_src" == "" ] ; then
      continue
    fi

    process_server "$server"
  done

  ## Start arangoproxy and site containers to build examples and site
  if [[ $GENERATORS == *"examples"* ]] ; then
    echo "<h2>Examples</h2>" >> /home/summary.md

    run_arangoproxy_and_site

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
}



## Utility to print with [current arangodb server] attached
function log(){
  echo "[$LOG_TARGET] "$1""
}


### DOCKER FUNCTIONS

function pull_image() {
  log "[pull_image] Invoke"
  branch_name="$1"
  version="$2"
  src="$3"

  # Check the image is an official dockerhub image
  log "[pull_image] Try from Offical ArangoDB Dockerhub - Image: $branch_name"

  docker pull "$branch_name"

  if [ "$?" == "0" ]; then
    log "[pull_image] Image downloaded from Dockerhub"
    return
  fi

  pull_from_docs_repo $branch_name $version $src
}



function pull_from_docs_repo() {
  branch_name="$1"
  version="$2"
  src="$3"

  image_name=$(echo ${branch_name##*/})
  main_hash=$(awk 'END{print}' $src/.git/logs/HEAD | awk '{print $2}' | cut -c1-9)  ## Get hash of latest commit of git branch of arangodb/arangodb repo

  docker_tag="arangodb/docs-hugo:$image_name-$version-$main_hash"

  image_id=$(docker images --filter=reference=$docker_tag | awk 'NR==2' | awk '{print $3}')
  if [ "$image_id" == "" ]; then
  log "[pull_from_docs_repo] Try from Private arangodb/docs-hugo Dockerhub repository - Image: $docker_tag"
    docker pull $docker_tag
    docker tag $docker_tag $image_name-$version ## tag with an easier name for easier local access to the image
  fi
}



function get_docker_imageid() {
  branch_name="$1"
  image_name="$2"
  version="$3"

  ## Get the docker image id to run of the server
  image_id=$(docker images --filter=reference=$image_name-$version | awk 'NR==2' | awk '{print $3}')
  if [ "$image_id" == "" ]; then
    image_id=$(docker images --filter=reference=$branch_name | awk 'NR==2' | awk '{print $3}') ## this is used for official arangodb images, arangodb/arangodb:tag
  fi
  echo "$image_id"
}



function clean_docker_environment() {
  container_name="$1"

  ## Create the docs_net docker network if it doesn't exist
  log "[clean_docker_environment] setup docs_net docker network"
  docker network inspect docs_net >/dev/null 2>&1 || docker network create --driver=bridge --subnet=192.168.129.0/24 docs_net

  ## Stop and remove old containers of this ArangoDB docker image
  log "[clean_docker_environment] Cleanup old containers"
  docker container stop "$container_name" "$container_name"_cluster arangoproxy site &> /dev/null || true
  docker container rm "$container_name" "$container_name"_cluster arangoproxy site &> /dev/null  || true
}




#### Arangoproxy/Site 


function run_arangoproxy_and_site() {
  set -e


  log "[run_arangoproxy_and_site] Pull arangoproxy and site images"
  docker pull arangodb/docs-hugo:arangoproxy
  docker pull arangodb/docs-hugo:site
  docker tag arangodb/docs-hugo:arangoproxy arangoproxy
  docker tag arangodb/docs-hugo:site site

  set +e
  
  cd ../../
  echo "[run_arangoproxy_and_site]  Run arangoproxy and site containers"

  docker run -d --name site --network=docs_net --ip=192.168.129.130 \
    -e HUGO_URL="$HUGO_URL" \
    -e HUGO_ENV="$HUGO_ENV" \
    -p 1313:1313 \
    --volumes-from toolchain \
    --log-opt tag="{{.Name}}" \
    site

  docker run -d --name arangoproxy --network=docs_net --ip=192.168.129.129 \
    -e HUGO_URL="$HUGO_URL" \
    -e HUGO_ENV="$HUGO_ENV" \
    --volumes-from toolchain \
    --log-opt tag="{{.Name}}" \
     arangoproxy
}

function setup_arangoproxy() {
  name=$1
  image=$2
  version=$3

  container_name="$name"_"$version"

  setup_arangoproxy_arangosh "$name" "$image" "$version"

  setup_arangoproxy_repositories "$name" "$version" "$container_name"
  
  log "[setup_arangoproxy] Done"
}

function setup_arangoproxy_arangosh() {
  name=$1
  image=$2
  version=$3

  container_name="$name"_"$version"

  log "[setup_arangoproxy_arangosh] Setup dedicated arangosh in arangoproxy"

  ## Create directory where arangosh executable will be stored
  mkdir -p ../arangoproxy/arangosh/"$name"/"$version"/usr ../arangoproxy/arangosh/"$name"/"$version"/usr/bin ../arangoproxy/arangosh/"$name"/"$version"/usr/bin/etc/relative

  ## Copy arangosh executables from ArangoDB docker container to arangoproxy container
  docker cp "$container_name":/usr/bin/arangosh ../arangoproxy/arangosh/"$name"/"$version"/usr/bin/arangosh
  docker cp "$container_name":/usr/bin/icudtl.dat ../arangoproxy/arangosh/"$name"/"$version"/usr/bin/icudtl.dat

  docker cp "$container_name":/usr/share/ ../arangoproxy/arangosh/"$name"/"$version"/usr/
  docker cp "$container_name":/etc/arangodb3/arangosh.conf ../arangoproxy/arangosh/"$name"/"$version"/usr/bin/etc/relative/arangosh.conf

  sed -i -e 's~startup-directory.*~startup-directory = /home/toolchain/arangoproxy/arangosh/'"$name"'/'"$version"'/usr/share/arangodb3/js~' ../arangoproxy/arangosh/"$name"/"$version"/usr/bin/etc/relative/arangosh.conf
  echo ""
}

function setup_arangoproxy_repositories() {
  name="$1"
  version="$2"
  container_name="$3"

  log "[setup_arangoproxy_repositories] Retrieve single server ip"
  single_server_ip=$(docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' "$container_name")
  log "IP: "$single_server_ip""

  printf -v url "http://%s:8529" $single_server_ip

  log "[setup_arangoproxy_repositories] Copy single server configuration in arangoproxy repositories"
  yq e '.repositories += [{"name": "'"$name"'", "type": "single", "version": "'"$version"'", "url": "'"$url"'"}]' -i ../arangoproxy/cmd/configs/local.yaml

  log "[setup_arangoproxy_repositories] Retrieve cluster server ip"
  cluster_server_ip=$(docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' "$container_name"_cluster)
  log "IP: "$cluster_server_ip""

  printf -v url "http://%s:8529" $cluster_server_ip

  log "[setup_arangoproxy_repositories] Copy cluster server configuration in arangoproxy repositories"
  yq e '.repositories += [{"name": "'"$name"'", "type": "cluster", "version": "'"$version"'", "url": "'"$url"'"}]' -i ../arangoproxy/cmd/configs/local.yaml
}




##### SERVER FUNCTIONS

function process_server() {
  server="$1"

  name=$(echo "$server" | yq e '.name' -)
  image=$(echo "$server" | yq e '.image' -)
  version=$(echo "$server" | yq e '.version' -)
  arangodb_src=$(echo "$server" | yq e '.src' -)

  echo "<li><strong>$version</strong>: $image</li>" >> /home/summary.md

  LOG_TARGET="$name $image $version"

  echo "[process_server] Processing Server $LOG_TARGET" 

  generators_from_source

  ## Generators stat do need arangodb instances running
  if [[ $GENERATORS == *"optimizer"* ]] || [[ $GENERATORS == *"options"* ]] || [[ $GENERATORS == *"examples"* ]]; then
    container_name="$name"_"$version"
    image_name=$(echo ${image##*/})

    clean_docker_environment "$container_name"

    image_id=$(get_docker_imageid $image $image_name $version)
    if [ "$image_id" == "" ]; then
      if [ "$ENV" == "local" ]; then
        pull_image "$image" "$version" "$src"
        image_id=$(docker images --filter=reference=$image_name-$version | awk 'NR==2' | awk '{print $3}')
      else
        echo "[START_SERVER] No Image ID find to run"
        echo "[ERROR] Aborting"
        exit 1
      fi
    fi
    image_id=$(get_docker_imageid $image $image_name $version)

  
    run_arangodb_container "$container_name" "$image_id"

    if [[ $GENERATORS == *"options"* ]] ; then
      generate_startup_options "$container_name" "$version"
    fi

    if [[ $GENERATORS == *"optimizer"* ]] ; then
      generate_optimizer_rules "$container_name" "$version"
    fi

    if [[ $GENERATORS == *"examples"* ]] ; then
      setup_arangoproxy "$name" "$image_name" "$version"
    fi
  fi
}

### Setup and run an ArangoDB docker image
function start_server() {
  name=$1
  branch_name=$2
  version=$3
  src=$4
  container_name="$name"_"$version"
  image_name=$(echo ${branch_name##*/})


  log "[start_server] Setup server"
  echo "$name" "$image" "$version"
  echo ""

  
}


function run_arangodb_container() {
  container_name="$1"
  image_id="$2"

  log "[run_arangodb_container] Run single server"
  docker run -e ARANGO_NO_AUTH=1 --net docs_net --name "$container_name" -d "$image_id" --server.endpoint http+tcp://0.0.0.0:8529

  log "[run_arangodb_container] Run cluster server"
  docker run -d --net=docs_net -e ARANGO_NO_AUTH=1 --name="$container_name"_cluster \
    "$image_id" \
    arangodb --starter.local --starter.data-dir=./localdata
}






## ------------------------


### GENERATORS FUNCTIONS

export IFS=""

function generators_from_source() {
  if [[ $GENERATORS == *"error-codes"* ]]; then
    generate_error_codes "$arangodb_src" "$version"
  fi

  if [[ $GENERATORS == *"metrics"* ]]; then
    generate_metrics "$arangodb_src" "$version"
  fi

  if [[ $GENERATORS == *"oasisctl"* ]]; then
    generate_oasisctl "$version"
  fi
}


function generate_startup_options() {
  echo "<h2>Startup Options</h2>" >> /home/summary.md

  container_name="$1"
  version="$2"
  log "[generate_startup_options] Starting options dump for container " "$container_name"
  
  declare -a ALLPROGRAMS=("arangobench" "arangod" "arangodump" "arangoexport" "arangoimport" "arangoinspect" "arangorestore" "arangosh")

  echo "<li><strong>$version</strong>:<ul>" >> /home/summary.md

  for HELPPROGRAM in ${ALLPROGRAMS[@]}; do
      log "[generate_startup_options] Dumping program options of ${HELPPROGRAM}"
      log "docker exec -it $container_name ${HELPPROGRAM} --dump-options > ../../site/data/$version/$HELPPROGRAM.json"

      res=$((docker exec "$container_name" "${HELPPROGRAM}" --dump-options) 2>&1)
      
      if [ $? -ne 0 ]; then
        log "[generate_startup_options] [ERROR] $res"
        echo "<li><strong>${HELPPROGRAM}</strong>: <strong> ERROR: $res</strong></li>" >> /home/summary.md
        exit 1
      fi

      echo $res > ../../site/data/$version/"$HELPPROGRAM".json
      echo "<li><strong>${HELPPROGRAM}</strong>: &#x2713;</li>" >> /home/summary.md
      log "[generate_startup_options] Done"
  done
  echo "</ul></li>" >> /home/summary.md

}

function generate_optimizer_rules() {
  echo "<h2>Optimizer Rules</h2>" >> /home/summary.md

  container_name="$1"
  version="$2"

  log "[generate_optimizer_rules] Generating optimizer rules " "$container_name"
  echo ""
  functions=$(cat generators/generateOptimizerRules.js)
  res=$(docker exec "$container_name"_cluster arangosh --server.authentication false --javascript.execute-string $functions) 

  if [ $? -ne 0 ]; then
    log "[generate_optimizer_rules] [ERROR] $res"
    echo "<li><strong>$version</strong>: <strong> ERROR: $res</strong></li>" >> /home/summary.md
    exit 1
  fi

  echo $res > ../../site/data/$version/optimizer-rules.json
  echo "<li><strong>$version</strong>: &#x2713;</li>" >> /home/summary.md

  log "[generate_optimizer_rules] Done"
}


function generate_error_codes() {
  echo "<h2>Error Codes</h2>" >> /home/summary.md

  errors_dat_file=$1
  version=$2
  touch ../../site/data/$version/errors.yaml

  log "[generate_error_codes] Launching generate error-codes script"
  log "[generate_error_codes] $PYTHON_EXECUTABLE generators/generateErrorCodes.py --src "$1"/lib/Basics/errors.dat --dst ../../site/data/$version/errors.yaml"
  res=$(("$PYTHON_EXECUTABLE" generators/generateErrorCodes.py --src "$1"/lib/Basics/errors.dat --dst ../../site/data/$version/errors.yaml) 2>&1)

  if [ $? -ne 0 ]; then
    log "[generate_error_codes] [ERROR] $res"
    echo "<li><strong>$version</strong>: <strong> ERROR: $res</strong></li>" >> /home/summary.md
    exit 1
  fi

  echo "<li><strong>$version</strong>: &#x2713;</li>" >> /home/summary.md
  log "[generate_error_codes] Done"
}

function generate_metrics() {
  echo "<h2>Metrics</h2>" >> /home/summary.md

  src=$1
  version=$2

  log "[generate_metrics] Generate Metrics requested"
  log "[generate_metrics] $PYTHON_EXECUTABLE generators/generateMetrics.py --main $src --dst ../../site/data/$version"
  res=$(("$PYTHON_EXECUTABLE" generators/generateMetrics.py --main "$src" --dst ../../site/data/$version) 2>&1)

  if [ $? -ne 0 ]; then
    log "[generate_metrics] [ERROR] $res"
    echo "<li><strong>$version</strong>: <strong> ERROR: $res</strong></li>" >> /home/summary.md
    exit 1
  fi

  echo "<li><strong>$version</strong>: &#x2713;</li>" >> /home/summary.md
  log "[generate_metrics] Done"
  
}

function generate_oasisctl() {
  echo "<h2>OasisCTL</h2>" >> /home/summary.md

  version=$1

  log "[generate_oasisctl] Generate OasisCTL docs"


  mkdir -p /tmp/oasisctl
  mkdir -p /tmp/preserve

  cp ../../site/content/$version/arangograph/oasisctl/_index.md /tmp/preserve/oasisctl.md > /dev/null
  rm -r ../../site/content/$version/arangograph/oasisctl/* > /dev/null

  log "[generate_oasisctl] oasisctl generate-docs --link-file-ext .html --replace-underscore-with - --output-dir /tmp/oasisctl)"
  res=$(oasisctl generate-docs --link-file-ext .html --replace-underscore-with - --output-dir /tmp/oasisctl)
  if [ $? -ne 0 ]; then
    log "[generate_oasisctl] [ERROR] Error from oasisctl generate-docs: $res"
    echo "<li><strong>$version</strong>: <strong> ERROR: Error from oasisctl generate-docs: </strong>$res</li>" >> /home/summary.md
    exit 1
  fi

  log "[generate_oasisctl] "$PYTHON_EXECUTABLE" generators/oasisctl.py --src /tmp/oasisctl --dst ../../site/content/$version/arangograph/oasisctl/"
  res=$(("$PYTHON_EXECUTABLE" generators/oasisctl.py --src /tmp/oasisctl --dst ../../site/content/$version/arangograph/oasisctl/) 2>&1 )
  if [ $? -ne 0 ]; then
    log "[generate_oasisctl] [ERROR] Error from oasisctl.py: $res"
    echo "<li><strong>$version</strong>: <strong> ERROR: Error from oasisctl.py: </strong>$res</li>" >> /home/summary.md
    exit 1
  fi

  cp /tmp/preserve/oasisctl.md ../../site/content/$version/arangograph/oasisctl/_index.md

  echo "<li><strong>$version</strong>: &#x2713;</li>" >> /home/summary.md
  log "[generate_oasisctl] Done"
}



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

main
