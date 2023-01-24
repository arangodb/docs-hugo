#!/bin/bash

if [ ! -f /home/arangodb3.10/bin/arangosh ]; then
    wget https://download.arangodb.com/nightly/3.10/Linux/aarch64/arangodb3-client-linux-3.10.3-nightly_arm64.tar.gz
    tar -xf arangodb3-client-linux-3.10.3-nightly_arm64.tar.gz
    mv arangodb3-client-linux-3.10.3-nightly_arm64 /home/arangodb3.10
fi

if [ ! -f /home/arangodb3.11/bin/arangosh ]; then
    wget https://download.arangodb.com/nightly/3.11/Linux/aarch64/arangodb3-client-linux-3.11.0-nightly_arm64.tar.gz
    tar -xf arangodb3-client-linux-3.11.0-nightly_arm64.tar.gz
    mv arangodb3-client-linux-3.11.0-nightly_arm64 /home/arangodb3.11
fi

function check() {
   res=$(curl -s -I $val | grep HTTP/ | awk {'print $2'})
   if [ "$res" = "200" ]; then
    echo "Connection success"
   else
     echo "Connection failed for $val"
    sleep 2s
    check $1
   fi
}

declare -a arangoUrls=("192.168.129.2:8521" )
echo "Waiting for all arango instances to be ready"
for val in ${arangoUrls[@]}; do
     printf -v val "http://%s/_api/version" $val
   check $val
done

cd /home/arangoproxy/cmd && go run main.go
