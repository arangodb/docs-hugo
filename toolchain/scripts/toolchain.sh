#!/bin/bash


function start_server() {
  name=$1
  image=$2
  version=$3

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


  echo "[START_SERVER] Run server"
  docker run -e ARANGO_NO_AUTH=1 --net docs_net --name "$name" -d "$image"

  echo "[START_SERVER] Setup dedicated arangosh in arangoproxy"
  cd ../arangoproxy
  rm -r arangosh

  mkdir -p arangosh/"$name"/usr arangosh/"$name"/usr/bin arangosh/"$name"/usr/bin/etc/relative

  docker cp "$name":/usr/bin/arangosh arangosh/"$name"/usr/bin/arangosh
  docker cp "$name":/usr/bin/icudtl.dat arangosh/"$name"/usr/bin/icudtl.dat

  docker cp "$name":/usr/share/ arangosh/"$name"/usr/
  docker cp "$name":/etc/arangodb3/arangosh.conf arangosh/"$name"/usr/bin/etc/relative/arangosh.conf

  sed -i -e 's~startup-directory.*~startup-directory = /home/arangoproxy/arangosh/'"$name"'/usr/share/arangodb3/js~' arangosh/"$name"/usr/bin/etc/relative/arangosh.conf
  echo ""

  echo "[START_SERVER] Retrieve server ip"
  ip=$(docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' "$name")
  echo "IP: "$ip""
  echo ""

  printf -v url "http://%s:8529" $ip

  echo "[START_SERVER] Copy server configuration in arangoproxy repositories"
  yq e '.repositories += [{"name": "'"$name"'", "image": "'"$image"'", "version": "'"$version"'", "url": "'"$url"'"}]' -i ../arangoproxy/cmd/configs/local.yaml
  echo "[START_SERVER] Done"
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

