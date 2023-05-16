#!/bin/bash




### SETUP

PYTHON_EXECUTABLE="python"
DOCKER_COMPOSE_ARGS=""
LOG_TARGET=""

if ! command -v "$PYTHON_EXECUTABLE" &> /dev/null
  then
  PYTHON_EXECUTABLE="python3"
fi

if ! command -v yq &> /dev/null
  then
  echo "[INIT] yq command not found, downloading"
  wget -q https://github.com/mikefarah/yq/releases/latest/download/yq_linux_"$ARCH" -O /usr/bin/yq &&\
  chmod +x /usr/bin/yq
fi

echo "[INIT] Toolchain setup"
echo "[INIT] Environment variables:"
echo $(env | grep ARANGODB_)

if [[ -z "${DOCKER_ENV}" ]]; then
  DOCKER_ENV="dev"
fi

if [[ -z "${GENERATORS}" ]]; then
  GENERATORS="examples metrics error-codes api-docs options"
fi

if [[ -z "${ARANGODB_SRC}" ]]; then
  echo "[INIT] ERROR: No ARANGODB_SRC variable set, please set it."
  exit 1
fi


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

start_servers=false

## Expand environment variables in config.yaml, if present
yq  '(.. | select(tag == "!!str")) |= envsubst' -i ../docker/config.yaml

GENERATORS=$(yq -r '.generators' ../docker/config.yaml)

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

if [[ $GENERATORS == *"api-docs"* ]]; then
  generate_apidocs=true
fi


echo "[TOOLCHAIN] Expanded Config file:"
cat ../docker/config.yaml
echo ""

echo "[TOOLCHAIN] Clean arangoproxy config file"
yq '.repositories = []' -i ../arangoproxy/cmd/configs/local.yaml 

echo "[INIT] Setup Finished"




function log(){
  echo "[$LOG_TARGET] "$1""
}

function return_image_id() {
  echo "$1"
}


### IMAGE PULL/START FUNCTIONS

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
  main_hash=$(awk 'END{print}' $src/.git/logs/HEAD | awk '{print $2}' | cut -c1-9)

  docker_tag="arangodb/docs-hugo:$image_name-$version-$main_hash"

  image_id=$(docker images --filter=reference=$docker_tag | awk 'NR==2' | awk '{print $3}')
  if [ "$image_id" == "" ]; then
    docker pull $docker_tag
    docker tag $docker_tag $image_name-$version
  fi
}



function setup_arangoproxy() {
  name=$1
  image=$2
  version=$3

  container_name="$name"_"$version"

  log "[SETUP ARANGOPROXY] Setup dedicated arangosh in arangoproxy"

  mkdir -p ../arangoproxy/arangosh/"$name"/"$version"/usr ../arangoproxy/arangosh/"$name"/"$version"/usr/bin ../arangoproxy/arangosh/"$name"/"$version"/usr/bin/etc/relative
  docker cp "$container_name":/usr/bin/arangosh ../arangoproxy/arangosh/"$name"/"$version"/usr/bin/arangosh
  docker cp "$container_name":/usr/bin/icudtl.dat ../arangoproxy/arangosh/"$name"/"$version"/usr/bin/icudtl.dat

  docker cp "$container_name":/usr/share/ ../arangoproxy/arangosh/"$name"/"$version"/usr/
  docker cp "$container_name":/etc/arangodb3/arangosh.conf ../arangoproxy/arangosh/"$name"/"$version"/usr/bin/etc/relative/arangosh.conf

  sed -i -e 's~startup-directory.*~startup-directory = /home/toolchain/arangoproxy/arangosh/'"$name"'/'"$version"'/usr/share/arangodb3/js~' ../arangoproxy/arangosh/"$name"/"$version"/usr/bin/etc/relative/arangosh.conf
  echo ""

  log "[SETUP ARANGOPROXY] Retrieve server ip"
  single_server_ip=$(docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' "$container_name")
  log "IP: "$single_server_ip""
  echo ""

  printf -v url "http://%s:8529" $single_server_ip

  log "[SETUP ARANGOPROXY] Copy single server configuration in arangoproxy repositories"
  yq e '.repositories += [{"name": "'"$name"'", "type": "single", "version": "'"$version"'", "url": "'"$url"'"}]' -i ../arangoproxy/cmd/configs/local.yaml

  log "[SETUP ARANGOPROXY] Retrieve server ip"
  cluster_server_ip=$(docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' "$container_name"_agent1)
  log "IP: "$cluster_server_ip""
  echo ""

  printf -v url "http://%s:5001" $cluster_server_ip

  log "[SETUP ARANGOPROXY] Copy cluster server configuration in arangoproxy repositories"
  yq e '.repositories += [{"name": "'"$name"'", "type": "cluster", "version": "'"$version"'", "url": "'"$url"'"}]' -i ../arangoproxy/cmd/configs/local.yaml
  log "[SETUP ARANGOPROXY] Done"
}

function start_server() {
  name=$1
  branch_name=$2
  version=$3
  src=$4
  container_name="$name"_"$version"
  examples=$5
  options=$6

  log "[START_SERVER] Setup server"
  echo "$name" "$image" "$version"
  echo ""

  ## create the docs_net network if doesn't exist
  log "[START_SERVER] setup docs_net docker network"
  docker network inspect docs_net >/dev/null 2>&1 || docker network create --driver=bridge --subnet=192.168.129.0/24 docs_net
  echo ""

  log "[START_SERVER] Cleanup old containers"
  docker container stop "$container_name" "$container_name"_agent1 "$container_name"_dbserver1 "$container_name"_dbserver2 "$container_name"_dbserver3 "$container_name"_coordinator1 arangoproxy site || true
  docker container rm "$container_name" "$container_name"_agent1 "$container_name"_dbserver1 "$container_name"_dbserver2 "$container_name"_dbserver3 "$container_name"_coordinator1 arangoproxy site  || true
  echo ""

   ## Cut the firstword/ from the branch field
  image_name=$(echo ${branch_name##*/})

  ## Get the docker image id to run of the server
  image_id=$(docker images --filter=reference=$image_name-$version | awk 'NR==2' | awk '{print $3}')
  if [ "$image_id" == "" ]; then
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


  log "[START_SERVER] Run single server"
  docker run -e ARANGO_NO_AUTH=1 --net docs_net --name "$container_name" -d "$image_id"

  log "[START_SERVER] Run cluster server"

  ## We have to check there is a free ip for every agency server we will start
  declare -a agency_addresses=("192.168.129.10" "192.168.129.20" "192.168.129.30" "192.168.129.40")
  agency_address=""

  for address in "${agency_addresses[@]}";
  do
    docs_net_ips=$(docker network inspect docs_net | grep "$address"/)
    if [ "$docs_net_ips" == "" ]; then
      agency_address=$address
      break
    fi
  done

  
  log "[START_SERVER] Using $agency_address as agency ip"

  ## Agencies
  docker run -e ARANGO_NO_AUTH=1 --net docs_net --ip="$agency_address" --name "$container_name"_agent1 -d "$image_id" --server.endpoint http+tcp://"$agency_address":5001 \
     --agency.my-address=tcp://"$agency_address":5001   --server.authentication false   --agency.activate true  \
    --agency.size 1   --agency.endpoint tcp://"$agency_address":5001   --agency.supervision true   --database.directory agent1

  # docker run -e ARANGO_NO_AUTH=1 --net docs_net --name "$name"_agent2 -d "$image" --server.endpoint tcp://0.0.0.0:5002 \
  #    --agency.my-address=tcp://"$agency_address":5002   --server.authentication false   --agency.activate true  \
  #   --agency.size 2   --agency.endpoint tcp://"$agency_address":5001   --agency.supervision true   --database.directory agent2

  ## DB-Servers
  docker run -e ARANGO_NO_AUTH=1 --net docs_net --name "$container_name"_dbserver1 -d "$image_id" --server.endpoint tcp://0.0.0.0:6001 \
    --server.authentication false \
    --cluster.my-address http+tcp://"$agency_address":6001 \
    --cluster.my-role DBSERVER \
    --cluster.agency-endpoint tcp://"$agency_address":5001 \
    --database.directory dbserver1

 docker run -e ARANGO_NO_AUTH=1 --net docs_net --name "$container_name"_dbserver2 -d "$image_id" --server.endpoint tcp://0.0.0.0:6002 \
    --server.authentication false \
    --cluster.my-address http+tcp://"$agency_address":6002 \
    --cluster.my-role DBSERVER \
    --cluster.agency-endpoint tcp://"$agency_address":5001 \
    --database.directory dbserver2

   docker run -e ARANGO_NO_AUTH=1 --net docs_net --name "$container_name"_dbserver3 -d "$image_id" --server.endpoint tcp://0.0.0.0:6003 \
    --server.authentication false \
    --cluster.my-address http+tcp://"$agency_address":6003 \
    --cluster.my-role DBSERVER \
    --cluster.agency-endpoint tcp://"$agency_address":5001 \
    --database.directory dbserver3

  ## Coordinators
  docker run -e ARANGO_NO_AUTH=1 --net docs_net --name "$container_name"_coordinator1 -d "$image_id" --server.endpoint tcp://0.0.0.0:7001 \
    --server.authentication false \
    --cluster.my-address tcp://"$agency_address":7001 \
    --cluster.my-role COORDINATOR \
    --cluster.agency-endpoint tcp://"$agency_address":5001 \
    --database.directory coordinator1 


  if [ "$options" = true ] ; then
    generate_startup_options "$name"
  fi

   if [ "$examples" = true ] ; then
    setup_arangoproxy "$name" "$image_name" "$version"
  fi
}

## ------------------------


### GENERATORS FUNCTIONS

function generate_startup_options {
  container_name="$1"
  dst_folder=$(yq -r '.program-options' ../docker/config.yaml)
  log "[GENERATE OPTIONS] Starting options dump for container " "$container_name"
  echo ""
  ALLPROGRAMS="arangobench arangod arangodump arangoexport arangoimport arangoinspect arangorestore arangosh"

  for HELPPROGRAM in ${ALLPROGRAMS}; do
      log "[GENERATE OPTIONS] Dumping program options of ${HELPPROGRAM}"
      docker exec -it "$container_name" "${HELPPROGRAM}" --dump-options >> "$dst_folder"/"$GENERATOR_VERSION"/"$HELPPROGRAM".json
      log "Done"
  done
}

function generate_apidocs() {
  version=$1

  log "[GENERATE-APIDOCS] Generating api-docs"
  log "[TOOLCHAIN] $PYTHON_EXECUTABLE generators/generateApiDocs.py --src ../../ --dst ./api-docs.json --version $version"
  "$PYTHON_EXECUTABLE" generators/generateApiDocs.py --src ../../ --dst ./api-docs.json --version "$version"
  log "[GENERATE-APIDOCS] Output file: " "./api-docs.json"
  ## Validate the openapi schema
  log "[GENERATE-APIDOCS] Starting openapi schema validation"
  swagger-cli validate ./api-docs.json
}

function generate_error_codes() {
  errors_dat_file=$1
  version=$2
  log "[GENERATE ERROR-CODES] Launching generate error-codes script"
  log "[GENERATE ERROR-CODES] $PYTHON_EXECUTABLE generators/generateErrorCodes.py --src "$1"/lib/Basics/errors.dat --dst ../../site/data/$version/errors.yaml"
  "$PYTHON_EXECUTABLE" generators/generateErrorCodes.py --src "$1"/lib/Basics/errors.dat --dst ../../../site/data/$version/errors.yaml
}

function generate_metrics() {
  src=$1
  version=$2
  log "[GENERATE-METRICS] Generate Metrics requested"
  log "[GENERATE-METRICS] $PYTHON_EXECUTABLE generators/generateMetrics.py --main $src --dst ../../site/data/$version"
  "$PYTHON_EXECUTABLE" generators/generateMetrics.py --main "$src" --dst ../../site/data/$version
}



## -------------------



### SYSTEM HANDLERS FUNCTIONS

function trap_container_exit() {
  terminate=false
  while [ "$terminate" = false ] ;
  do
    siteContainerStatus=$(docker ps -a -q --filter "name=site" --filter "status=exited")
    if [ "$siteContainerStatus" != "" ] ; then

      terminate=true
    fi
    arangoproxyContainerStatus=$(docker ps -a -q --filter "name=arangoproxy" --filter "status=exited")
    if [ "$arangoproxyContainerStatus" != "" ] ; then
      echo "[TERMINATE] Arangoproxy exited, shutting down all containers" >> arangoproxy-log.log
      terminate=true
    fi
  done

  docker container stop $(docker ps -aq)
  exit 1
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


  mapfile servers < <(yq e -o=j -I=0 '.servers[]' ../docker/config.yaml )

  for server in "${servers[@]}"; do
    name=$(echo "$server" | yq e '.name' -)
    image=$(echo "$server" | yq e '.image' -)
    version=$(echo "$server" | yq e '.version' -)
    arangodb_src=$(echo "$server" | yq e '.src' -)

    if [ "$arangodb_src" == "" ] ; then
      continue
    fi

    LOG_TARGET="$name $image $version"

    echo "[TOOLCHAIN] Processing Server $LOG_TARGET" 


    ## Generators that do not need arangodb instances at all
    if [ "$generate_apidocs" = true ] ; then
      generate_apidocs "$version"
    fi

    if [ "$generate_error_codes" = true ] ; then
      generate_error_codes "$arangodb_src" "$version"
    fi

    if [ "$generate_metrics" = true ] ; then
      generate_metrics "$arangodb_src" "$version"
    fi

    ## Generators stat do need arangodb instances running
    if [ "$start_servers" = true ] ; then
      start_server "$name" "$image" "$version" "$arangodb_src" "$generate_examples" "$generate_startup"
    fi
  done

  ## Start arangoproxy and site containers to build examples and site
  if [ "$generate_examples" = true ] ; then
    docker build --target arangoproxy ../docker/ -t arangoproxy
    docker  build --target hugo ../docker/ -t site
    cd ../../
    echo "[GENERATE-EXAMPLES]  Run arangoproxy and site containers"
    docker run -d --name site --network=docs_net --ip=192.168.129.130 --env-file toolchain/docker/env/"$DOCKER_ENV".env -p 1313:1313 --volumes-from toolchain --log-opt tag="{{.Name}}" site 
    docker run -d --name arangoproxy --network=docs_net --ip=192.168.129.129 --env-file toolchain/docker/env/"$DOCKER_ENV".env --volumes-from toolchain --log-opt tag="{{.Name}}" arangoproxy
    docker logs --details --follow arangoproxy > arangoproxy-log.log &
    docker logs --details --follow site > site-log.log &
    trap_container_exit &
    #trap clean_terminate_toolchain SIGINT SIGTERM SIGKILL
    tail -f arangoproxy-log.log site-log.log
    echo "[TERMINATE] Site container exited"
    echo "[TERMINATE] Terminating toolchain"
  fi
