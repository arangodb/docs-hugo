#!/bin/bash

function help() {
    echo "Usage: migration.sh [CMD]"
    echo "migrate {src} {dst} {mainArango} {version}      Start docs migration for version {version}"
}

function print() {
    echo "---------"
    echo "$@"
    echo "---------"
}

function migrate() {
    print "Migrating" "$5"
    cd scripts/
    python3 migration.py --src "$2" --dst "$3" --arango-main "$4" --version "$5"
    cd ../../site/content/"$5"
    echo "---" >> _index.md
    echo "menuTitle: '"$5"'" >> _index.md
    echo "weight: 0" >> _index.md
    echo "layout: default" >> _index.md
    echo "---" >> _index.md
    cd ../../../migration-tools/scripts
    cat homepage_template.md >> ../../site/content/"$5"/_index.md
    python3 post_migration.py --dst "$3" --version "$5"
    print "Migration End"
}

# main

case $1 in
    migrate)
        migrate "$@"
    ;;
    *)
        help
    ;;
esac
