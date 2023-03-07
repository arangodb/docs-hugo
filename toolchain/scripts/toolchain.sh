#!/bin/sh

docker network inspect docs_net >/dev/null 2>&1 || docker network create --driver=bridge --subnet=192.168.129.0/24 docs_net


docker container stop test_docker >/dev/null 2>&1

mkdir -p ../.arangosh/test/bin arangosh/test/usr arangosh/test/etc/relative

docker run -e ARANGO_NO_AUTH=1 --net docs_net --ip 192.168.129.10 --name test_docker -d arangodb/arangodb arangod \
  --server.endpoint tcp://0.0.0.0:8529\

docker cp test_docker:/usr/bin arangosh/test/usr
docker cp test_docker:/usr/share/arangodb3 arangosh/test/share
docker cp test_docker:/usr/share/doc arangosh/test/share
docker cp test_docker:/usr/share/man arangosh/test/share
docker cp test_docker:/etc/arangodb3/arangosh.conf arangosh/test/etc/relative/arangosh.conf
