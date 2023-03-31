#!/bin/bash


function start_server() {
  name=$1
  image=$2
  version=$3

  echo "[START_SERVER] Setup server"
  echo "$name" "$image" "$version"

  docker network inspect docs_net >/dev/null 2>&1 || docker network create --driver=bridge --subnet=192.168.129.0/24 docs_net

  docker container stop "$name" >/dev/null 2>&1
  docker container rm "$name" >/dev/null 2>&1


  mkdir -p ../.arangosh/"$name"/bin arangosh/"$name"/usr arangosh/"$name"/etc/relative

  echo "[START_SERVER] Run server"
  docker run -e ARANGO_NO_AUTH=1 --net docs_net --name "$name" -d "$image" arangod \
    --server.endpoint tcp://0.0.0.0:8529\

  echo "[START_SERVER] Copy arango programs to arangoproxy volumes"
  docker cp "$name":/usr/bin arangosh/"$name"/usr
  docker cp "$name":/usr/share/arangodb3 arangosh/"$name"/share
  docker cp "$name":/usr/share/doc arangosh/"$name"/share
  docker cp "$name":/usr/share/man arangosh/"$name"/share
  docker cp "$name":/etc/arangodb3/arangosh.conf arangosh/"$name"/etc/relative/arangosh.conf

  echo "[START_SERVER] Retrieve server ip"
  ip=$(docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' "$name")
  echo "IP: "$ip""

  printf -v url "http://%s:8529" $ip

  echo "[START_SERVER] Copy server configuration in arangoproxy repositories"
  yq e '.repositories += [{"name": "'"$name"'", "image": "'"$image"'", "version": "'"$version"'", "url": "'"$url"'"}]' -i ../arangoproxy/cmd/configs/local.yaml
}





## MAIN

if ! command -v yq &> /dev/null
then
    wget https://github.com/mikefarah/yq/releases/latest/download/yq_linux_"$ARCH" -O /usr/bin/yq &&\
    chmod +x /usr/bin/yq
fi

# Start arangodb servers defined in servers.yaml
mapfile servers < <(yq e -o=j -I=0 '.[]' servers.yaml )

yq '.repositories = []' -i ../arangoproxy/cmd/configs/local.yaml 

for server in "${servers[@]}"; do
    name=$(echo "$server" | yq e '.name' -)
    image=$(echo "$server" | yq e '.image' -)
    version=$(echo "$server" | yq e '.version' -)
    start_server "$name" "$image" "$version"
done

docker compose --env-file ../docker-env/dev.env up --build

