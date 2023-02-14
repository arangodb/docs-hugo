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
    bash post-migration.sh "$3" "$5"
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
