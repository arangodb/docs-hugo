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
  GENERATORS="examples metrics error-codes options optimizer"
fi

## Split the ARANGODB_BRANCH env var into name, image, version fields (for CI/CD)
if [ "$ARANGODB_BRANCH_3_10" != "" ] ; then
      export ARANGODB_BRANCH_3_10_IMAGE="$ARANGODB_BRANCH_3_10"
      export ARANGODB_BRANCH_3_10_VERSION="3.10"
fi

if [ "$ARANGODB_BRANCH_3_11" != "" ] ; then
      export ARANGODB_BRANCH_3_11_IMAGE="$ARANGODB_BRANCH_3_11"
      export ARANGODB_BRANCH_3_11_VERSION="3.11"
fi

if [ "$ARANGODB_BRANCH_3_12" != "" ] ; then
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
  : > /home/summary.md
  echo "<h2>Generators</h2>" >> /home/summary.md
  echo "$GENERATORS" >> /home/summary.md

  clean_docker_environment

  mapfile servers < <(yq e -o=j -I=0 '.servers[]' ../docker/config.yaml )

  ## Generate content and start server
  for server in "${servers[@]}"; do
    image=$(echo "$server" | yq e '.image' -)
    version=$(echo "$server" | yq e '.version' -)

    if [ "$image" == "" ]; then
      continue
    fi

    if [ $HUGO_ENV == "release" ]; then
      rm -r ../../site/data/$version/*
      echo "{}" > ../../site/data/$version/cache.json
    fi

    process_server "$server"
  done

  run_arangoproxy_and_site

  ## Start arangoproxy and site containers to build examples and site
  if [[ $GENERATORS == *"examples"* ]] ; then
    echo "<h2>Examples</h2>" >> /home/summary.md
  fi

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

function pull_image() {
  log "[pull_image] Invoke"
  branch_name="$1"
  version="$2"

  # Check the image is an official dockerhub image
  log "[pull_image] Try from Offical ArangoDB Dockerhub - Image: $branch_name"

  docker pull "$branch_name"

  if [ "$?" == "0" ]; then
    log "[pull_image] Image downloaded from Dockerhub"
    return
  fi

  pull_from_docs_repo $branch_name $version
}



function pull_from_docs_repo() {
  branch_name="$1"
  version="$2"

  image_name=$(echo ${branch_name##*/})
  main_hash=$(awk 'END{print}' /tmp/$version/.git/logs/HEAD | awk '{print $2}' | cut -c1-9)  ## Get hash of latest commit of git branch of arangodb/arangodb repo

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

  log "[clean_docker_environment] setup arangosh docker volume"
  docker volume create arangosh

  ## Stop and remove old containers of this ArangoDB docker image
  log "[clean_docker_environment] Cleanup orphan containers"
  docker ps -a --filter name=docs_* -q | xargs docker stop | xargs docker rm

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

    docker run -d --name docs_arangoproxy --network=docs_net --ip=192.168.129.129 \
      -e ENV="$ENV" \
      -e HUGO_URL="$HUGO_URL" \
      -e HUGO_ENV="$HUGO_ENV" \
      -e OVERRIDE="$OVERRIDE" \
      -v arangosh:/arangosh \
      --volumes-from toolchain \
      --log-opt tag="{{.Name}}" \
      arangodb/docs-hugo:arangoproxy-"$arch"
  fi
}

function setup_arangoproxy() {
  image=$1
  version=$2

  container_name=docs_server_"$version"

  setup_arangoproxy_arangosh "$image" "$version"

  setup_arangoproxy_repositories "$version" "$container_name"

  log "[setup_arangoproxy] Done"
}

function setup_arangoproxy_arangosh() {
  image=$1
  version=$2
  container_name=docs_server_"$version"
  log "[setup_arangoproxy_arangosh] Setup dedicated arangosh in arangoproxy"
  ## Create directory where arangosh executable will be stored
  docker exec  $container_name sh -c "mkdir -p /tmp/arangosh/$version/usr /tmp/arangosh/$version/usr/bin /tmp/arangosh/$version/usr/bin/etc/relative"
  ## Copy arangosh executables from ArangoDB docker container to arangoproxy container
  docker exec  $container_name sh -c "cp -r /usr/bin/arangosh /tmp/arangosh/$version/usr/bin/arangosh"

  #docker cp "$container_name":/usr/bin/icudtl.dat ../arangoproxy/arangosh/"$name"/"$version"/usr/bin/icudtl.dat
  docker exec  $container_name sh -c "cp -r /usr/share/ /tmp/arangosh/$version/usr/"
  docker exec  $container_name sh -c "cp -r /usr/bin/icudtl.dat /tmp/arangosh/$version/usr/share/arangodb3/"

  docker exec  $container_name sh -c "sed 's~startup-directory.*$~startup-directory = /arangosh/arangosh/$version/usr/share/arangodb3/js~' /etc/arangodb3/arangosh.conf > /tmp/arangosh/$version/usr/bin/etc/relative/arangosh.conf"
  echo ""
}

function setup_arangoproxy_repositories() {
  version="$1"
  container_name="$2"

  log "[setup_arangoproxy_repositories] Retrieve single server ip"
  single_server_ip=$(docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' "$container_name")
  log "IP: "$single_server_ip""

  printf -v url "http://%s:8529" $single_server_ip

  log "[setup_arangoproxy_repositories] Copy single server configuration in arangoproxy repositories"
  yq e '.repositories += [{"type": "single", "version": "'"$version"'", "url": "'"$url"'"}]' -i ../arangoproxy/cmd/configs/local.yaml

  log "[setup_arangoproxy_repositories] Retrieve cluster server ip"
  cluster_server_ip=$(docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' "$container_name"_cluster)
  log "IP: "$cluster_server_ip""

  printf -v url "http://%s:8529" $cluster_server_ip

  log "[setup_arangoproxy_repositories] Copy cluster server configuration in arangoproxy repositories"
  yq e '.repositories += [{"type": "cluster", "version": "'"$version"'", "url": "'"$url"'"}]' -i ../arangoproxy/cmd/configs/local.yaml
}


##### SERVER FUNCTIONS

function process_server() {
  server="$1"

  image=$(echo "$server" | yq e '.image' -)
  version=$(echo "$server" | yq e '.version' -)

  echo "<li><strong>$version</strong>: $image<ul>" >> /home/summary.md

  LOG_TARGET="$image $version"

  echo "[process_server] Processing Server $LOG_TARGET" 

  generators_from_source

  ## Generators stat do need arangodb instances running
  if [[ $GENERATORS == *"optimizer"* ]] || [[ $GENERATORS == *"options"* ]] || [[ $GENERATORS == *"examples"* ]]; then
    container_name=docs_server_"$version"
    image_name=$(echo ${image##*/})

    image_id=$(get_docker_imageid $image $image_name $version)
    if [ "$image_id" == "" ]; then
      if [ "$ENV" == "local" ]; then
        pull_image "$image" "$version"
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
      setup_arangoproxy "$image_name" "$version"
    fi
  fi
  echo "</ul></li>" >> /home/summary.md
}

### Check status of ArangoDB instance until it is up and running
function wait_for_arangodb_ready() {
  attempts="${2:-1}"
  res=$(docker exec -it $1 wget -q -S -O - http://localhost:8529/_api/version 2>&1 | grep -m 1 HTTP/ | awk '{print $2}')
  if [ "$res" = "200" ]; then
    log "Server is ready: $1"
  else
    log "Server not ready: $1  $res"
    let attempts++
    if [ "$attempts" -gt 30 ]; then
      log "Giving up waiting on server."
      exit 1
    else
      sleep 2s
      wait_for_arangodb_ready $1 $attempts
    fi
  fi
}


### Setup and run an ArangoDB docker image
function run_arangodb_container() {
  container_name="$1"
  image_id="$2"

  if [ $TRAP == 0 ]; then
    log "[run_arangodb_container] Run cluster server"
    docker run -d --net=docs_net -e ARANGO_NO_AUTH=1 --name="$container_name"_cluster \
      "$image_id" \
      arangodb --starter.local --starter.data-dir=./localdata

    log "[run_arangodb_container] Run single server"
    docker run -d --net docs_net -e ARANGO_NO_AUTH=1 --name "$container_name" -v arangosh:/tmp \
      "$image_id" \
      --server.endpoint http+tcp://0.0.0.0:8529

    wait_for_arangodb_ready "$container_name"
    wait_for_arangodb_ready "$container_name"_cluster
  fi
}






## ------------------------


### GENERATORS FUNCTIONS

export IFS=""

function generators_from_source() {
  if [[ $GENERATORS == *"error-codes"* ]]; then
    generate_error_codes "$version"
  fi

  if [[ $GENERATORS == *"metrics"* ]]; then
    generate_metrics "$version"
  fi

  if [[ $GENERATORS == *"oasisctl"* ]]; then
    generate_oasisctl "$version"
  fi
}


function generate_startup_options() {
  echo "<li><strong>Startup Options</strong><ul>" >> /home/summary.md

  container_name="$1"
  version="$2"
  log "[generate_startup_options] Starting options dump for container " "$container_name"
  declare -a ALLPROGRAMS=("arangobackup" "arangobench" "arangod" "arangodump" "arangoexport" "arangoimport" "arangoinspect" "arangorestore" "arangosh" "arangovpack")


  for HELPPROGRAM in ${ALLPROGRAMS[@]}; do
      log "[generate_startup_options] Dumping program options of ${HELPPROGRAM}"
      log "docker exec -it $container_name ${HELPPROGRAM} --dump-options > ../../site/data/$version/$HELPPROGRAM.json"

      res=$((docker exec "$container_name" "${HELPPROGRAM}" --dump-options) 2>&1)
      
      if [ $? -ne 0 ]; then
        log "[generate_startup_options] [ERROR] $res"
        echo "<li><error code=4><strong>${HELPPROGRAM}</strong>: <strong> ERROR: $res</strong></error></li>" >> /home/summary.md
      fi

      echo $res > ../../site/data/$version/"$HELPPROGRAM".json
      echo "<li><strong>${HELPPROGRAM}</strong>: &#x2713;</li>" >> /home/summary.md
      log "[generate_startup_options] Done"
  done
  echo "</ul></li>" >> /home/summary.md

}

function generate_optimizer_rules() {
  echo "<li><strong>Optimizer Rules</strong>:" >> /home/summary.md

  container_name="$1"
  version="$2"

  log "[generate_optimizer_rules] Generating optimizer rules " "$container_name"
  echo ""
  functions=$(cat generators/generateOptimizerRules.js)
  res=$(docker exec "$container_name"_cluster arangosh --server.authentication false --javascript.execute-string $functions) 

  if [ $? -ne 0 ]; then
    log "[generate_optimizer_rules] [ERROR] $res"
    echo "<error code=5><strong> ERROR: $res</strong></error>" >> /home/summary.md
  fi

  echo $res > ../../site/data/$version/optimizer-rules.json
  echo " &#x2713;" >> /home/summary.md

  echo "</li>" >> /home/summary.md

  log "[generate_optimizer_rules] Done"
}


function generate_error_codes() {
  echo "<li><strong>Error Codes</strong>:" >> /home/summary.md

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
    echo "<error code=6><strong> ERROR: $res</strong></error>" >> /home/summary.md
  fi

  echo " &#x2713;" >> /home/summary.md
  echo "</li>" >> /home/summary.md

  log "[generate_error_codes] Done"
}

function generate_metrics() {
  echo "<li><strong>Metrics</strong>" >> /home/summary.md

  version=$1

  if [ $version == "" ]; then
    log "[generate_error_codes] ArangoDB Source code not found. Aborting"
    echo "<li><error code=7><strong>$version</strong>: <strong> ERROR: ArangoDB Source Not Found</strong><error></li>" >> /home/summary.md
  fi

  log "[generate_metrics] Generate Metrics requested"
  log "[generate_metrics] $PYTHON_EXECUTABLE generators/generateMetrics.py --main /tmp/"$version" --dst ../../site/data/$version"
  res=$(("$PYTHON_EXECUTABLE" generators/generateMetrics.py --main /tmp/"$version" --dst ../../site/data/$version) 2>&1)

  if [ $? -ne 0 ]; then
    log "[generate_metrics] [ERROR] $res"
    echo "<error code=7><strong> ERROR: $res</strong><error>" >> /home/summary.md
  fi

  echo "&#x2713;" >> /home/summary.md
  echo "</li>" >> /home/summary.md

  log "[generate_metrics] Done"
  
}

function generate_oasisctl() {
  echo "<li><strong>OasisCTL</strong>" >> /home/summary.md

  version=$1

  log "[generate_oasisctl] Generate OasisCTL docs"

  if [ ! -f /tmp/oasisctl.zip ]; then
    log "[generate_oasisctl] /tmp/oasisctl.zip not found. Invoking download_oasisctl"
    download_oasisctl
  fi

  mkdir -p /tmp/oasisctl
  mkdir -p /tmp/preserve

  cp ../../site/content/$version/arangograph/oasisctl/_index.md /tmp/preserve/oasisctl.md > /dev/null
  rm -r ../../site/content/$version/arangograph/oasisctl/* > /dev/null

  log "[generate_oasisctl] oasisctl generate-docs --link-file-ext .html --replace-underscore-with - --output-dir /tmp/oasisctl)"
  res=$(oasisctl generate-docs --link-file-ext .html --replace-underscore-with - --output-dir /tmp/oasisctl)
  if [ $? -ne 0 ]; then
    log "[generate_oasisctl] [ERROR] Error from oasisctl generate-docs: $res"
    echo "<error code=8><strong> ERROR: </strong>$res</error>" >> /home/summary.md
  fi

  log "[generate_oasisctl] "$PYTHON_EXECUTABLE" generators/oasisctl.py --src /tmp/oasisctl --dst ../../site/content/$version/arangograph/oasisctl/"
  res=$(("$PYTHON_EXECUTABLE" generators/oasisctl.py --src /tmp/oasisctl --dst ../../site/content/$version/arangograph/oasisctl/) 2>&1 )
  if [ $? -ne 0 ]; then
    log "[generate_oasisctl] [ERROR] Error from oasisctl.py: $res"
    echo "<error code=8><strong> ERROR: Error: </strong>$res</error></li>" >> /home/summary.md
  fi

  cp /tmp/preserve/oasisctl.md ../../site/content/$version/arangograph/oasisctl/_index.md

  echo "&#x2713;" >> /home/summary.md
  echo "</li>" >> /home/summary.md

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
      docker stop docs_arangoproxy docs_site
      log "[TERMINATE] Site exited, shutting down all containers" >> toolchain.log

      terminate=true
    fi
    toolchainContainerStatus=$(docker ps | grep toolchain)
    if [ "$toolchainContainerStatus" == "" ] ; then
      docker stop docs_arangoproxy docs_site
      log "[TERMINATE] Toolchain exited, shutting down all containers" >> toolchain.log

      terminate=true
    fi
    arangoproxyContainerStatus=$(docker ps | grep docs_arangoproxy)
    if [ "$arangoproxyContainerStatus" == "" ] ; then
      docker stop docs_arangoproxy docs_site
      log "[TERMINATE] Arangoproxy exited, shutting down all containers" >> toolchain.log
      terminate=true
    fi
    if [ "$ENV" == "local" ]; then
      errors=$(cat summary.md  | grep '<error')
      if [ "$errors" != "" ] ; then
        docker stop docs_arangoproxy docs_site
        terminate=true
      fi
    fi
  done

  errors=$(cat summary.md  | grep '<error')
  if [ "$errors" != "" ] ; then
    docker stop docs_arangoproxy docs_site
    log "[TERMINATE] Error during content generation:" >> toolchain.log
    log "[TERMINATE] ""$errors" >> toolchain.log
  fi

  log "[stop_all_containers] A stop signal has been captured. Stopping all containers" >> toolchain.log
  TRAP=1
  docker stop docs_arangoproxy docs_site
  docker ps -a --filter name=docs_* -q | xargs docker stop | xargs docker rm
  log "[stop_all_containers] Done" >> /home/toolchain.log
  exitStatus=$(cat summary.md  | grep -o '<error code=.' | cut -d '=' -f2 | head -n 1)
  log "[stop_all_containers] Toolchain Exit Status ""$exitStatus" >> /home/toolchain.log

  exit $exitStatus
}



## --------------------------

main
