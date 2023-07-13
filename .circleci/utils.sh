#!/bin/bash

function clone-arangodb-enterprise() {
    BRANCH="$1"
    FOLDER="$2"
    ENTERPRISE_BRANCH="devel"
    set +e
    git ls-remote --exit-code --heads git@github.com:arangodb/enterprise.git "$1"
    if [ "$?" == "0" ] ; then
        ENTERPRISE_BRANCH="$1"
    fi
    set -e
    echo "Using enterprise branch $ENTERPRISE_BRANCH"
    git clone --depth 1 git@github.com:arangodb/enterprise.git --branch "$ENTERPRISE_BRANCH" $FOLDER/enterprise
}

function clone-branch() {
    BRANCH="$1"

    echo "[SETUP] Setup server $BRANCH"

    if [[ "$BRANCH" == *"arangodb/enterprise"* ]]; then
        echo "[SETUP] An official ArangoDB Enterprise image has been chosen"
        preview_branch=$(echo $BRANCH | cut -d: -f2 | cut -d- -f1)
        git clone --depth 1 https://github.com/arangodb/arangodb.git --branch $preview_branch $preview_branch
        clone-arangodb-enterprise $preview_branch $preview_branch
    else 
        echo "[SETUP] A Feature-PR Docker image has been choosen"
        image_name=$(echo ${BRANCH##*/})
        git clone --depth 1 https://github.com/arangodb/arangodb.git --branch $BRANCH $image_name
        clone-arangodb-enterprise $BRANCH $image_name
    fi 
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
        main_hash=$(awk 'END{print}' $image_name/.git/logs/HEAD | awk '{print $2}' | cut -c1-9)
        echo "[SETUP] Check TAG Image arangodb/docs-hugo:$image_name-$version-$main_hash"
        docker pull arangodb/docs-hugo:$image_name-$version-$main_hash
        docker tag arangodb/docs-hugo:$image_name-$version-$main_hash $image_name-$version
    fi
}



function generate_setup-environment-var-branch() {
    BRANCH="$1"
    version="$2"
    export ARANGODB_BRANCH_"$2"=$BRANCH
    if [[ "$BRANCH" == *"arangodb/enterprise"* ]]; then
        preview_branch=$(echo $BRANCH | cut -d: -f2 | cut -d- -f1)
        export ARANGODB_SRC_"$2"=/home/circleci/project/$preview_branch
    else
        image_name=$(echo ${BRANCH##*/})
        export ARANGODB_SRC_"$2"=/home/circleci/project/$image_name
    fi
}

