#!/bin/bash

# docker network inspect docs_net >/dev/null 2>&1 || docker network create --driver=bridge --subnet=192.168.129.0/24 docs_net


# docker container stop test_docker >/dev/null 2>&1

# mkdir -p ../.arangosh/test/bin arangosh/test/usr arangosh/test/etc/relative

# docker run -e ARANGO_NO_AUTH=1 --net docs_net --ip 192.168.129.10 --name test_docker -d arangodb/arangodb arangod \
#   --server.endpoint tcp://0.0.0.0:8529\

# docker cp test_docker:/usr/bin arangosh/test/usr
# docker cp test_docker:/usr/share/arangodb3 arangosh/test/share
# docker cp test_docker:/usr/share/doc arangosh/test/share
# docker cp test_docker:/usr/share/man arangosh/test/share
# docker cp test_docker:/etc/arangodb3/arangosh.conf arangosh/test/etc/relative/arangosh.conf

function download_server_image() {

}

function start_server() {
  name=$1
  image=$2
  version=$3

  echo "[START_SERVER] Setup server"
  echo "$name" "$image" "$version"

  docker network inspect docs_net >/dev/null 2>&1 || docker network create --driver=bridge --subnet=192.168.129.0/24 docs_net

  docker container stop "$name" >/dev/null 2>&1

  mkdir -p ../.arangosh/"$name"/bin arangosh/test/usr arangosh/"$name"/etc/relative

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

  echo "[START_SERVER] Copy server configuration in arangoproxy repositories"
  cd ../arangoproxy/cmd/configs
}

mapfile servers < <(yq e -o=j -I=0 '.[]' servers.yaml )

for server in "${servers[@]}"; do
    # identity mapping is a yaml snippet representing a single entry
    name=$(echo "$server" | yq e '.name' -)
    image=$(echo "$server" | yq e '.image' -)
    version=$(echo "$server" | yq e '.version' -)
    start_server "$name" "$image" "$version"
done
