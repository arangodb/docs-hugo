#!/bin/bash

function clone-arangodb-enterprise() {
    BRANCH="$1"
    ENTERPRISE_BRANCH="devel"
    set +e
    git ls-remote --exit-code --heads git@github.com:arangodb/enterprise.git "$1"
    if [ "$?" == "0" ] ; then
        ENTERPRISE_BRANCH="$1"
    fi
    set -e
    echo "Using enterprise branch $ENTERPRISE_BRANCH"
    git clone --depth 1 git@github.com:arangodb/enterprise.git --branch "$ENTERPRISE_BRANCH" /root/project/enterprise
}

function clone-branch() {
    BRANCH="$1"
    VER="$2"
    branch_name="$1"

    echo "[SETUP] Setup server $BRANCH"

    if [[ "$BRANCH" == *"arangodb/enterprise"* ]]; then
        echo "[SETUP] An official ArangoDB Enterprise image has been chosen"
        branch_name=$(echo $BRANCH | cut -d: -f2 | cut -d- -f1)
    fi

    echo "[SETUP] Git clone $branch_name"

    git clone --depth 1 https://github.com/arangodb/arangodb.git --branch $branch_name /root/project
    clone-arangodb-enterprise $branch_name

    mkdir -p /tmp/$VER
    cp -r /root/project/. /tmp/$VER
}

function create-docker-image() {
    BRANCH="$1"
    VER="$2"
    DOCS_BRANCH="$3"

    mkdir -p create-docker/

    curl "https://raw.githubusercontent.com/arangodb/docs-hugo/$DOCS_BRANCH/toolchain/scripts/compile/tar-to-docker.Dockerfile" > create-docker/tar-to-docker.Dockerfile
    curl "https://raw.githubusercontent.com/arangodb/docs-hugo/$DOCS_BRANCH/toolchain/scripts/compile/setup-tar-to-docker.sh" > create-docker/setup-tar-to-docker.sh
    curl "https://raw.githubusercontent.com/arangodb/docs-hugo/$DOCS_BRANCH/toolchain/scripts/compile/docker-entrypoint.sh" > create-docker/docker-entrypoint.sh

    mv install.tar.gz create-docker/

    main_hash=$(awk 'END{print}' .git/logs/HEAD | awk '{print $2}' | cut -c1-9)
    image_name=$(echo $BRANCH | cut -d/ -f2)

    cd create-docker
    chmod +x setup-tar-to-docker.sh
    chmod +x docker-entrypoint.sh

    apk add docker-cli
    
    docker build -t arangodb/docs-hugo:$image_name-$VER-$main_hash --target arangodb-tar-starter -f tar-to-docker.Dockerfile .

    echo "$DOCKERHUB_PASS" | docker login -u "$DOCKERHUB_USER" --password-stdin
    docker push arangodb/docs-hugo:$image_name-$VER-$main_hash
}

function pull-branch-image(){
    BRANCH="$1"
    version="$2"

    echo "[SETUP] Setup server $BRANCH"

    if [[ "$BRANCH" == *"arangodb/enterprise"* ]]; then
        echo "[SETUP] An official ArangoDB Enterprise image has been chosen"
        echo "[SETUP] Pull Docker Image $BRANCH"
        docker pull $BRANCH
    else 
        echo "[SETUP] A Feature-PR Docker image has been choosen"
        image_name=$(echo ${BRANCH##*/})
        main_hash=$(awk 'END{print}' $version/.git/logs/HEAD | awk '{print $2}' | cut -c1-9)
        echo "[SETUP] Check TAG Image arangodb/docs-hugo:$image_name-$version-$main_hash"
        docker pull arangodb/docs-hugo:$image_name-$version-$main_hash
        docker tag arangodb/docs-hugo:$image_name-$version-$main_hash $image_name-$version
    fi
}
