#!/bin/env python3
""" read test definition, and generate the output for the specified target """
import argparse
import os
import sys
import traceback
import yaml
import json
import requests
import re

# check python 3
if sys.version_info[0] != 3:
    print("found unsupported python version ", sys.version_info)
    sys.exit()

## Load versions
versions = yaml.safe_load(open("versions.yaml", "r"))
versions = sorted(versions, key=lambda d: d['name']) 

print(f"Loaded versions {versions}")

"""argv"""
if "--help-flags" in sys.argv:
    print_help_flags()
    sys.exit()

parser = argparse.ArgumentParser()
parser.add_argument(
    "--workflow", help="file containing the circleci base config", type=str
)
parser.add_argument(
    "--arangodb-branches",  nargs='+', help="arangodb branches"
)
parser.add_argument(
    "--generators", help="file containing the test definitions", type=str
)
parser.add_argument(
    "--commit-generated", help="file containing the test definitions", type=str
)
parser.add_argument(
    "--create-pr", help="file containing the test definitions", type=str
)

args = parser.parse_args()








def generate_workflow(config):
    workflow_generate(config)
    return config



def workflow_generate(config):
    print("add openssl")
    jobs = config["workflows"]["generate"]["jobs"]

    generateRequires = []

    for i in range(len(versions)):
        version = versions[i]["name"]
        branch = args.arangodb_branches[i]
        if branch == "undefined":
            continue

        print(f"version {version} branch {branch}")

        compileJob = {
            "compile-linux": {
                "context": ["sccache-aws-bucket"],
                "name": f"compile-{version}",
                "arangodb-branch": branch,
                "version": version,
                "openssl": findOpensslVersion(branch),
                "requires": ["approve-workflow"]
            }
        }
        generateRequires.append(f"compile-{version}")
        jobs.append(compileJob)

    generateJob = {
        "build-with-generated": {
            "name": "build-with-generated",
            "generators": args.generators,
            "commit-generated": args.commit_generated,
            "create-pr": args.create_pr,
            "requires": generateRequires
        }
    }
    deployJob = {
        "deploy": {
            "requires": ["build-with-generated"]
        }
    }
    jobs.append(generateJob)
    jobs.append(deployJob)

    return config

def findOpensslVersion(branch):
    r = requests.get(f'https://raw.githubusercontent.com/arangodb/arangodb/{branch}/VERSIONS')
    version = re.search(r"OPENSSL_LINUX.*", str(r.content))
    return version.group(0)



def main():
    try:
        print(f"Generating configuration with args: {args}")
        with open("base_config.yml", "r") as instream:
            config = yaml.safe_load(instream)
            config = generate_workflow(config)
            with open("generated_config.yml", "w", encoding="utf-8") as outstream:
                yaml.dump(config, outstream)
    except Exception as exc:
        traceback.print_exc(exc, file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()