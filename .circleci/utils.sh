#!/bin/bash

function clone-arangodb-enterprise() {
    ARANGODB_BRANCH="$1"
    ENTERPRISE_BRANCH="$2"
    if ["$ENTERPRISE_BRANCH" == ""]; then
        set +e
        git ls-remote --exit-code --heads git@github.com:arangodb/enterprise.git "$1"
        if [ "$?" == "0" ] ; then
            ENTERPRISE_BRANCH="$1"
        else
            ENTERPRISE_BRANCH=devel
        fi
        set -e
    fi
    echo "Using enterprise branch $ENTERPRISE_BRANCH"
    image_name=$(echo ${ARANGODB_BRANCH##*/})
    git clone --depth 1 git@github.com:arangodb/enterprise.git --branch "$ENTERPRISE_BRANCH" $image_name/enterprise
}

function generate_setup-arangodb-branches(){
    ARANGODB_BRANCH="$1"
    ENTERPRISE_BRANCH="$2"

    echo "[SETUP] Setup server $ARANGODB_BRANCH"
    branch_name=$(echo $ARANGODB_BRANCH | cut -d= -f2 | cut -d, -f2)
    echo "$branch_name"
    version=$(echo $ARANGODB_BRANCH | cut -d= -f2 | cut -d, -f3)

    if [[ "$branch_name" == *"arangodb/enterprise"* ]]; then
        echo "[SETUP] An official ArangoDB Enterprise image has been chosen"
        preview_branch=$(echo $branch_name | cut -d: -f2 | cut -d- -f1)
        git clone --depth 1 https://github.com/arangodb/arangodb.git --branch $preview_branch $preview_branch
        clone-arangodb-enterprise $preview_branch $ENTERPRISE_BRANCH
        echo "[SETUP] Pull Docker Image $branch_name"
        docker pull $branch_name
    else 
        echo "[SETUP] A Feature-PR Docker image has been choosen"
        image_name=$(echo ${branch_name##*/})
        git clone --depth 1 https://github.com/arangodb/arangodb.git --branch $branch_name $image_name
        clone-arangodb-enterprise $branch_name $ENTERPRISE_BRANCH

        main_hash=$(awk 'END{print}' $image_name/.git/logs/HEAD | awk '{print $2}' | cut -c1-9)
        echo "[SETUP] Check TAG Image arangodb/docs-hugo:$image_name-$version-$main_hash"
        docker pull arangodb/docs-hugo:$image_name-$version-$main_hash
        docker tag arangodb/docs-hugo:$image_name-$version-$main_hash $image_name-$version
    fi
}

function generate_setup-environment-var-branch() {
    ARANGODB_BRANCH="$1"
    branch_name=$(echo $ARANGODB_BRANCH | cut -d= -f2 | cut -d, -f2)
    export ARANGODB_BRANCH=$ARANGODB_BRANCH
    if [[ "$branch_name" == *"arangodb/enterprise"* ]]; then
        preview_branch=$(echo $branch_name | cut -d: -f2 | cut -d- -f1)
        export ARANGODB_SRC=/home/circleci/project/$preview_branch
    else
        image_name=$(echo ${branch_name##*/})
        export ARANGODB_SRC=/home/circleci/project/$image_name
    fi
}