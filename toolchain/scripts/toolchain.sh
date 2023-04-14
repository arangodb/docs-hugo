#!/bin/bash

  

PYTHON_EXECUTABLE="python"
DOCKER_COMPOSE_ARGS=""

if ! command -v "$PYTHON_EXECUTABLE" &> /dev/null
  then
  PYTHON_EXECUTABLE="python3"
fi

if [[ -z "${DOCKER_ENV}" ]]; then
  DOCKER_ENV="dev"
fi

if [ "$DOCKER_ENV" = "examples" ] ; then
  DOCKER_COMPOSE_ARGS="--exit-code-from site"
fi

GENERATOR_VERSION="$1"



function pull_image() {
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

  #echo "[PULL IMAGE] Cannot find image on Dockerhub, try on CircleCI"
  #pull_image_from_circleci "$image_name"

  # Load image from tar
  echo "[PULL IMAGE] Cannot find image on Dockerhub, load it locally"

  docker load < "$image_name".tar.gz
  echo "[PULL IMAGE] Image loaded from CircleCI Artifact"
}

function pull_image_from_circleci() {
  image_name="$1"
  ## Get latest pipeline of the feature-pr branch
  circle_ci_pipeline=$(curl --request GET   --url https://circleci.com/api/v2/project/gh/arangodb/docs-hugo/pipeline?branch=$image_name   --header 'authorization: Basic REPLACE_BASIC_AUTH')
  pipeline_id=$(echo "$circle_ci_pipeline" | jq '.items[0].id' | tr -d '"')
  echo "$pipeline_id"

  ## Get the workflows of the pipeline
  workflow_id=$(curl -s https://circleci.com/api/v2/pipeline/472dce27-73e6-4cc7-8d9b-72dc380f11b6/workflow | jq -r '.items[] | "\(.id)"')
  echo "$workflow_id"
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
      wget "$artifact_url"
    done
  done
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

  sed -i -e 's~startup-directory.*~startup-directory = /home/arangoproxy/arangosh/'"$name"'/usr/share/arangodb3/js~' arangosh/"$name"/usr/bin/etc/relative/arangosh.conf
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
  image=$2
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
  docker container stop "$name" >/dev/null 2>&1
  docker container rm "$name" >/dev/null 2>&1
  echo ""

  pull_image "$2"

  echo "[START_SERVER] Run server"
  docker run -e ARANGO_NO_AUTH=1 --net docs_net --name "$name" -d "$image"

  if [ "$options" = true ] ; then
    generate_startup_options "$name"
  fi

   if [ "$examples" = true ] ; then
    setup_arangoproxy "$name" "$image" "$version"
  fi
}



### Generator flags
generate_examples=false
generate_startup=false
generate_metrics=false
generate_error_codes=false
generate_apidocs=false

start_servers=false

## MAIN

# Check for requested operations
for var in "$@"
do
    case $var in
    "generate-examples")
      generate_examples=true
      start_servers=true
    ;;
    "program-options")
      generate_startup=true
      start_servers=true
    ;;
    "generate-metrics")
      generate_metrics=true
    ;;
    "generate-errorcodes")
      generate_error_codes=true
    ;;
    "generate-apidocs")
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
  dst=$(yq -r '.apidocs' config.yaml)
  ##TODO: get version
  "$PYTHON_EXECUTABLE" generators/generateApiDocs.py --src ../../ --dst "$dst" --version "$GENERATOR_VERSION"
fi

if [ "$generate_error_codes" = true ] ; then
  errors_dat_file=$(yq -r '.error-codes.src' config.yaml)
  dst=$(yq -r '.error-codes.dst' config.yaml)
  ##TODO: get version
  "$PYTHON_EXECUTABLE" generators/generateErrorCodes.py --src "$errors_dat_file" --dst "$dst"/"$GENERATOR_VERSION"/errors.yaml
fi

if [ "$generate_metrics" = true ] ; then
  src=$(yq -r '.metrics.src' config.yaml)
  dst=$(yq -r '.metrics.dst' config.yaml)
  ##TODO: get version
  "$PYTHON_EXECUTABLE" generators/generateMetrics.py --main "$src" --dst "$dst"/"$GENERATOR_VERSION"
fi



## Generators stat do need arangodb instances running
if [ "$start_servers" = true ] ; then
  if ! command -v yq &> /dev/null
  then
      wget https://github.com/mikefarah/yq/releases/latest/download/yq_linux_"$ARCH" -O /usr/bin/yq &&\
      chmod +x /usr/bin/yq
  fi

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
    docker compose --env-file ../docker-env/"$DOCKER_ENV" up --build "$DOCKER_COMPOSE_ARGS"
  fi
fi


