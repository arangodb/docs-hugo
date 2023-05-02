#!/bin/bash

PYTHON_EXECUTABLE="python"
DOCKER_COMPOSE_ARGS=""

if ! command -v "$PYTHON_EXECUTABLE" &> /dev/null
  then
  PYTHON_EXECUTABLE="python3"
fi

if ! command -v yq &> /dev/null
  then
      wget https://github.com/mikefarah/yq/releases/latest/download/yq_linux_"$ARCH" -O /usr/bin/yq &&\
      chmod +x /usr/bin/yq
  fi

if [[ -z "${DOCKER_ENV}" ]]; then
  DOCKER_ENV="dev"
fi

GENERATOR_VERSION="$1"



function pull_image() {
  echo "[PULL-IMAGE] Invoke"
  image_name="$1"

  echo "[PULL IMAGE] Start pull of image " "$image_name"
  echo ""

  # Check the image is an official dockerhub image
  echo "[PULL IMAGE] Try from Dockerhub"
  docker pull "$image_name"

  if [ $? -eq 0 ]; then
    echo "[PULL IMAGE] Image downloaded from Dockerhub"
    return
  fi

  echo "[PULL IMAGE] Cannot find image on Dockerhub, try on CircleCI"
  pull_image_from_circleci "$image_name"
}

function pull_image_from_circleci() {
  echo "[CIRCLECI-PULL] Invoke"
  branch_name="$1"
  image_name=$(echo ${branch_name##*/})
  echo "[CIRCLECI-PULL] Branch Name: " "$branch_name"
  echo "[CIRCLECI-PULL] Image Name: " "$image_name"

  ## Get latest pipeline of the feature-pr branch
  circle_ci_pipeline=$(curl -s https://circleci.com/api/v2/project/gh/arangodb/docs-hugo/pipeline?branch=$branch_name)
  pipeline_id=$(echo "$circle_ci_pipeline" | jq '.items[0].id' | tr -d '"')
  echo "[CIRCLECI-PULL] Latest PipelineID of compiled branch: ""$pipeline_id"

  ## Check the pipeline is newer than the local image tag of the branch
  isLocalImageTheLatest=$(docker images --filter=reference=$image_name:* | grep $pipeline_id)
  echo "[CIRCLECI-PULL] Check latest docker image id" "$isLocalImageTheLatest"
  if [ "$isLocalImageTheLatest" != "" ] ; then
    return
  fi

  echo "Local image is not the latest one, donwloading latest"

  ## Get the workflows of the pipeline
  workflow_id=$(curl -s https://circleci.com/api/v2/pipeline/$pipeline_id/workflow | jq -r '.items[] | "\(.id)"')
  echo "[CIRCLECI-PULL] Latest WorkflowID: ""$workflow_id"
  
  ## Get jobs of the workflow
  jobs_numbers_string=$(curl -s https://circleci.com/api/v2/workflow/$workflow_id/job\? | jq -r '.items[] | select (.type? == "build") | .job_number')

  unset IFS
  read -ra jobs_numbers -d '' <<<"$jobs_numbers_string"

  for job_number in "${jobs_numbers[@]}"
  do
    job_artifacts=$(curl --request GET --url https://circleci.com/api/v2/project/gh/arangodb/docs-hugo/$job_number/artifacts --header 'authorization: Basic REPLACE_BASIC_AUTH')
    artifact_urls=$(echo "$job_artifacts" | jq -r '.items[] | .url')
    for artifact_url in "$artifact_urls"
    do
      echo "[CIRCLECI-PULL] Downloading artifacts of job number: " "$job_number"
      echo "[CIRCLECI-PULL] Link: " "$artifact_url"
      wget "$artifact_url"
    done
  done

  # Load image from tar
  docker load < "$image_name":"$pipeline_id".tar.gz
  echo "[PULL IMAGE] Image loaded from CircleCI Artifact"
}


## Generators
function generate_startup_options {
  container_name="$1"
  dst_folder=$(yq -r '.program-options' config.yaml)
  echo "[GENERATE OPTIONS] Starting options dump for container " "$container_name"
  echo ""
  ALLPROGRAMS="arangobench arangod arangodump arangoexport arangoimport arangoinspect arangorestore arangosh"

  for HELPPROGRAM in ${ALLPROGRAMS}; do
      echo "[GENERATE OPTIONS] Dumping program options of ${HELPPROGRAM}"
      docker exec -it "$container_name" "${HELPPROGRAM}" --dump-options >> "$dst_folder"/"$GENERATOR_VERSION"/"$HELPPROGRAM".json
      echo "Done"
  done
}


function setup_arangoproxy() {
  name=$1
  image=$2
  version=$3

  echo "[SETUP ARANGOPROXY] Setup dedicated arangosh in arangoproxy"
  cd ../arangoproxy
  rm -r arangosh

  mkdir -p arangosh/"$name"/usr arangosh/"$name"/usr/bin arangosh/"$name"/usr/bin/etc/relative

  docker cp "$name":/usr/bin/arangosh arangosh/"$name"/usr/bin/arangosh
  docker cp "$name":/usr/bin/icudtl.dat arangosh/"$name"/usr/bin/icudtl.dat

  docker cp "$name":/usr/share/ arangosh/"$name"/usr/
  docker cp "$name":/etc/arangodb3/arangosh.conf arangosh/"$name"/usr/bin/etc/relative/arangosh.conf

  sed -i -e 's~startup-directory.*~startup-directory = /home/toolchain/arangoproxy/arangosh/'"$name"'/usr/share/arangodb3/js~' arangosh/"$name"/usr/bin/etc/relative/arangosh.conf
  echo ""

  echo "[SETUP ARANGOPROXY] Retrieve server ip"
  ip=$(docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' "$name")
  echo "IP: "$ip""
  echo ""

  printf -v url "http://%s:8529" $ip

  echo "[SETUP ARANGOPROXY] Copy server configuration in arangoproxy repositories"
  yq e '.repositories += [{"name": "'"$name"'", "image": "'"$image"'", "version": "'"$version"'", "url": "'"$url"'"}]' -i ../arangoproxy/cmd/configs/local.yaml
  echo "[SETUP ARANGOPROXY] Done"
}


function start_server() {
  name=$1
  branch_name=$2
  version=$3

  examples=$4
  options=$5

  echo "[START_SERVER] Setup server"
  echo "$name" "$image" "$version"
  echo ""

  echo "[START_SERVER] setup docs_net docker network"
  docker network inspect docs_net >/dev/null 2>&1 || docker network create --driver=bridge --subnet=192.168.129.0/24 docs_net
  echo ""

  echo "[START_SERVER] Cleanup old containers"
  docker container stop "$name" "$name"_agent1 "$name"_dbserver1 "$name"_dbserver2 "$name"_dbserver3 "$name"_coordinator1 arangoproxy site || true
  docker container rm "$name" "$name"_agent1 "$name"_dbserver1 "$name"_dbserver2 "$name"_dbserver3 "$name"_coordinator1 arangoproxy site  || true
  echo ""

  pull_image "$branch_name"

  image_name=$(echo ${branch_name##*/})

  image_id=$(docker images | grep $image_name | awk '{print $3}') ## get last created image id of the target branch
  echo "$image_id"
  echo "[START_SERVER] Run single server"
  docker run -e ARANGO_NO_AUTH=1 --net docs_net --name "$name" -d "$image_id"

  echo "[START_SERVER] Run cluster server"
  ## Agencies
  docker run -e ARANGO_NO_AUTH=1 --net docs_net --ip=192.168.129.10 --name "$name"_agent1 -d "$image_id" --server.endpoint http+tcp://192.168.129.10:5001 \
     --agency.my-address=tcp://192.168.129.10:5001   --server.authentication false   --agency.activate true  \
    --agency.size 1   --agency.endpoint tcp://192.168.129.10:5001   --agency.supervision true   --database.directory agent1

  # docker run -e ARANGO_NO_AUTH=1 --net docs_net --name "$name"_agent2 -d "$image" --server.endpoint tcp://0.0.0.0:5002 \
  #    --agency.my-address=tcp://192.168.129.10:5002   --server.authentication false   --agency.activate true  \
  #   --agency.size 2   --agency.endpoint tcp://192.168.129.10:5001   --agency.supervision true   --database.directory agent2

  ## DB-Servers
  docker run -e ARANGO_NO_AUTH=1 --net docs_net --name "$name"_dbserver1 -d "$image_id" --server.endpoint tcp://0.0.0.0:6001 \
    --server.authentication false \
    --cluster.my-address http+tcp://192.168.129.10:6001 \
    --cluster.my-role DBSERVER \
    --cluster.agency-endpoint tcp://192.168.129.10:5001 \
    --database.directory dbserver1

 docker run -e ARANGO_NO_AUTH=1 --net docs_net --name "$name"_dbserver2 -d "$image_id" --server.endpoint tcp://0.0.0.0:6002 \
    --server.authentication false \
    --cluster.my-address http+tcp://192.168.129.10:6002 \
    --cluster.my-role DBSERVER \
    --cluster.agency-endpoint tcp://192.168.129.10:5001 \
    --database.directory dbserver2

   docker run -e ARANGO_NO_AUTH=1 --net docs_net --name "$name"_dbserver3 -d "$image_id" --server.endpoint tcp://0.0.0.0:6003 \
    --server.authentication false \
    --cluster.my-address http+tcp://192.168.129.10:6003 \
    --cluster.my-role DBSERVER \
    --cluster.agency-endpoint tcp://192.168.129.10:5001 \
    --database.directory dbserver3

  ## Coordinators
  docker run -e ARANGO_NO_AUTH=1 --net docs_net --name "$name"_coordinator1 -d "$image_id" --server.endpoint tcp://0.0.0.0:7001 \
    --server.authentication false \
    --cluster.my-address tcp://192.168.129.10:7001 \
    --cluster.my-role COORDINATOR \
    --cluster.agency-endpoint tcp://192.168.129.10:5001 \
    --database.directory coordinator1 


  if [ "$options" = true ] ; then
    generate_startup_options "$name"
  fi

   if [ "$examples" = true ] ; then
    setup_arangoproxy "$name" "$image_name" "$version"
  fi
}

function trap_container_exit() {
  terminate=false
  while [ "$terminate" = false ] ;
  do
    siteContainerStatus=$(docker ps -a -q --filter "name=site" --filter "status=exited")
    if [ "$siteContainerStatus" != "" ] ; then
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



### Generator flags
generate_examples=false
generate_startup=false
generate_metrics=false
generate_error_codes=false
generate_apidocs=false

start_servers=false

## MAIN

echo "[TOOLCHAIN] Starting toolchain"
echo "[TOOLCHAIN] Args: $@"

# Check for requested operations
for var in "$@"
do
    case $var in
    "examples")
      generate_examples=true
      start_servers=true
    ;;
    "options")
      generate_startup=true
      start_servers=true
    ;;
    "metrics")
      generate_metrics=true
    ;;
    "error-codes")
      generate_error_codes=true
    ;;
    "api-docs")
      generate_apidocs=true
    ;;
    *)
    ;;
    esac
done

## Expand environment variables in config.yaml, if present
yq  '(.. | select(tag == "!!str")) |= envsubst(nu)' -i config.yaml

## Generators that do not need arangodb instances at all
if [ "$generate_apidocs" = true ] ; then
  echo "[GENERATE-APIDOCS] Generating api-docs"
  dst=$(yq -r '.apidocs' config.yaml)
  echo "[TOOLCHAIN] Generate ApiDocs requested"
  echo "[TOOLCHAIN] $PYTHON_EXECUTABLE generators/generateApiDocs.py --src ../../ --dst $dst --version $GENERATOR_VERSION"
  ##TODO: get version
  "$PYTHON_EXECUTABLE" generators/generateApiDocs.py --src ../../ --dst "$dst" --version "$GENERATOR_VERSION"
  echo "[GENERATE-APIDOCS] Output file: " "$dst"

  ## Validate the openapi schema
  echo "[GENERATE-APIDOCS] Starting openapi schema validation"
  swagger-cli validate "$dst"
fi

if [ "$generate_error_codes" = true ] ; then
  errors_dat_file=$(yq -r '.error-codes.src' config.yaml)
  dst=$(yq -r '.error-codes.dst' config.yaml)
  echo "[TOOLCHAIN] Generate ErrorCodes requested"
  echo "[TOOLCHAIN] $PYTHON_EXECUTABLE generators/generateErrorCodes.py --src $errors_dat_file --dst $dst/$GENERATOR_VERSION/errors.yaml"
  ##TODO: get version
  "$PYTHON_EXECUTABLE" generators/generateErrorCodes.py --src "$errors_dat_file" --dst "$dst"/"$GENERATOR_VERSION"/errors.yaml
fi

if [ "$generate_metrics" = true ] ; then
  src=$(yq -r '.metrics.src' config.yaml)
  dst=$(yq -r '.metrics.dst' config.yaml)
  echo "[TOOLCHAIN] Generate Metrics requested"
  echo "[TOOLCHAIN] $PYTHON_EXECUTABLE generators/generateMetrics.py --main $src --dst $dst/$GENERATOR_VERSION"
  ##TODO: get version
  "$PYTHON_EXECUTABLE" generators/generateMetrics.py --main "$src" --dst "$dst"/"$GENERATOR_VERSION"
fi



## Generators stat do need arangodb instances running
if [ "$start_servers" = true ] ; then
  

  # Start arangodb servers defined in servers.yaml
  mapfile servers < <(yq e -o=j -I=0 '.servers[]' config.yaml )

  yq '.repositories = []' -i ../arangoproxy/cmd/configs/local.yaml 

  for server in "${servers[@]}"; do
      name=$(echo "$server" | yq e '.name' -)
      image=$(echo "$server" | yq e '.image' -)
      version=$(echo "$server" | yq e '.version' -)
      start_server "$name" "$image" "$version" "$generate_examples" "$generate_startup"
  done

  if [ "$generate_examples" = true ] ; then
    cd ../../
    docker compose --env-file toolchain/docker-env/"$DOCKER_ENV".env build
    docker run -d --name site --network=docs_net --ip=192.168.129.130 --env-file toolchain/docker-env/"$DOCKER_ENV".env -p 1313:1313 --volumes-from toolchain --log-opt tag="{{.Name}}" site 
    docker run -d --name arangoproxy --network=docs_net --ip=192.168.129.129 --env-file toolchain/docker-env/"$DOCKER_ENV".env --volumes-from toolchain --log-opt tag="{{.Name}}" arangoproxy
    docker logs --details --follow arangoproxy > arangoproxy-log.log &
    docker logs --details --follow site > site-log.log &
    trap_container_exit &
    #trap clean_terminate_toolchain SIGINT SIGTERM SIGKILL
    tail -f arangoproxy-log.log site-log.log
    echo "[TERMINATE] Site container exited"
    echo "[TERMINATE] Terminating toolchain"
  fi
fi


