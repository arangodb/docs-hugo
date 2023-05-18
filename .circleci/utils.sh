#!/bin/bash

function generate_setup-arangodb-branches(){
    ARANGODB_BRANCH="$1"
    branch_name=$(echo $ARANGODB_BRANCH | cut -d= -f2 | cut -d, -f2)
    version=$(echo $ARANGODB_BRANCH | cut -d= -f2 | cut -d, -f3)
    if [[ "$branch_name" == *"arangodb/enterprise"* ]]; then
        preview_branch=$(echo $branch_name | cut -d: -f2 | cut -d- -f1)
        git clone --depth 1 https://github.com/arangodb/arangodb.git --branch $preview_branch $preview_branch
        docker pull $branch_name
    else 
        pwd && ls
        image_name=$(echo ${branch_name##*/})
        git clone --depth 1 https://github.com/arangodb/arangodb.git --branch $branch_name $image_name

        main_hash=$(awk 'END{print}' $image_name/.git/logs/HEAD | awk '{print $2}' | cut -c1-9)
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