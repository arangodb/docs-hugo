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
from datetime import datetime


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
    "--arangodb-branch", help="file containing the test definitions", type=str
)
parser.add_argument(
    "--generators", nargs='+', help="file containing the test definitions", type=str
)
parser.add_argument(
    "--commit-generated", help="file containing the test definitions", type=bool
)
parser.add_argument(
    "--create-pr", help="file containing the test definitions", type=bool
)
parser.add_argument(
    "--pr-branch", nargs="?", help="file containing the test definitions", type=str
)
parser.add_argument(
    "--release-type", nargs="?", help="file containing the test definitions", type=str
)
parser.add_argument(
    "--docs-version", nargs="?", help="file containing the test definitions", type=str
)
parser.add_argument(
    "--arangodb-version", nargs="?", help="file containing the test definitions", type=str
)

args = parser.parse_args()


def generate_workflow(config):
    if args.workflow == "plain-build":
        return config

    if args.workflow == "generate":
        workflow_generate(config)
    
    if args.workflow.startswith("generate-"):
        workflow_generate_scheduled(config)

    if args.workflow == "commit-generated":
        workflow_commit_generated_download_data(config)

    if args.workflow == "release":
        if args.release_type == "arangodb":
            workflow_release_arangodb(config)

    return config


## WORKFLOWS

def workflow_generate(config):
    config = workflow_generate_launch_command(config)
    config = workflow_generate_store_artifacts_command(config)

    jobs = config["workflows"]["generate"]["jobs"]

    generateRequires = []
    extendedCompileJob = False

    for i in range(len(versions)):
        version = versions[i]["name"]
        branch = args.arangodb_branches[i]
        if branch == "undefined":
            continue

        print(f"Creating compile job for version {version} branch {branch}")

        compileJob = {
            "compile-linux": {
                "context": ["sccache-aws-bucket"],
                "name": f"compile-{version}",
                "arangodb-branch": branch,
                "version": version,
                "requires": ["approve-workflow"]
            }
        }

        compileJob["compile-linux"]["openssl"] = "3.0.9"
        if not "enterprise-preview" in branch:
            compileJob["compile-linux"]["openssl"] = findOpensslVersion(branch)

            if not extendedCompileJob:
                extendedCompileJob = True
                config["jobs"]["compile-linux"]["steps"].append({
                    "check-arangodb-image-exists": {
                        "branch": branch,
                        "version": version
                    }
                })
                config["jobs"]["compile-linux"]["steps"].append({
                    "compile-and-dockerize-arangodb": {
                        "branch": branch,
                        "version": version
                    }
                })

        generateRequires.append(f"compile-{version}")
        jobs.append(compileJob)

    generateJob = {
        "build-with-generated": {
            "name": args.workflow,
            "generators": "<< pipeline.parameters.generators >>",
            "commit-generated": "<< pipeline.parameters.commit-generated >>",
            "create-pr": "<< pipeline.parameters.create-pr >>",
            "pr-branch": "<< pipeline.parameters.pr-branch >>",
            "requires": generateRequires
        }
    }

    deployJob = {
        "deploy": {
            "requires": [args.workflow],
            "deploy-args": "--alias << pipeline.parameters.deploy-url >>"
        }
    }
    jobs.append(generateJob)
    jobs.append(deployJob)

    return config


def workflow_generate_scheduled(config):
    config = workflow_generate_launch_command(config)
    config = workflow_generate_store_artifacts_command(config)

    config["workflows"]["generate"]["jobs"] = []
    jobs = config["workflows"]["generate"]["jobs"]

    generateRequires = []

    for i in range(len(versions)):
        version = versions[i]["name"]
        
        compileJob = {
            "compile-linux": {
                "context": ["sccache-aws-bucket"],
                "name": f"compile-{version}",
                "arangodb-branch": f"arangodb/enterprise-preview:{version}-nightly" if versions[i]["alias"] != "devel" else "arangodb/enterprise-preview:devel-nightly",
                "version": version,
                "openssl": "3.0.9",
            }
        }
        generateRequires.append(f"compile-{version}")
        jobs.append(compileJob)

    generators = ""

    if args.workflow == "generate-scheduled":
        generators = "metrics error-codes options optimizer"
    elif args.workflow == "generate-oasisctl":
        generators = "oasisctl"

    generateJob = {
        "build-with-generated": {
            "name": args.workflow,
            "generators": generators,
            "commit-generated": True,
            "create-pr": True,
            "pr-branch": args.workflow,
            "requires": generateRequires
        }
    }

    jobs.append(generateJob)


def workflow_release_arangodb(config):
    config = workflow_release_launch_command(config)

    jobs = config["workflows"]["release"]["jobs"]

    generateRequires = []

    print(f"Creating compile job for version {args.docs_version} branch {args.arangodb_branch}")

    openssl = findOpensslVersion(args.arangodb_branch)

    compileJob = {
        "compile-linux": {
            "context": ["sccache-aws-bucket"],
            "name": f"compile-{args.docs_version}",
            "arangodb-branch": args.arangodb_branch,
            "version": args.docs_version,
            "openssl": openssl,
        }
    }
    config["jobs"]["compile-linux"]["steps"].append({
        "compile-and-dockerize-arangodb": {
            "branch": args.arangodb_branch,
            "version": args.docs_version
        }
    })
    generateRequires.append(f"compile-{args.docs_version}")
    jobs.insert(0, compileJob)

    generateJob = {
        "build-with-generated": {
            "name": "release-generate",
            "generators": "",
            "commit-generated": True,
            "create-pr": True,
            "pr-branch": f"RELEASE_{args.arangodb_version}",
            "requires": generateRequires
        }
    }

    for step in config["jobs"]["build-with-generated"]["steps"]:
        if "upload-summary" in step:
            step["upload-summary"]["branch"] = f"RELEASE_{args.arangodb_version}-$CIRCLE_BUILD_NUM"

    jobs.insert(1, generateJob)

    approvalWorkflow = {"approve-workflow": {"type": "approval", "requires": ["release-generate"]}}
    jobs.insert(2, approvalWorkflow)

    jobs[3]["plain-build"]["requires"] = ["approve-workflow"]


    return config



## COMMANDS

def workflow_generate_launch_command(config):
    shell = "\
export ENV=\"circleci\"\n \
export HUGO_URL=https://<< pipeline.parameters.deploy-url >>--docs-hugo.netlify.app\n \
export HUGO_ENV=examples\n \
export OVERRIDE=<< pipeline.parameters.override >>\n \
export GENERATORS='<< parameters.generators >>'\n"

    for i in range(len(versions)):
        version = versions[i]["name"]
        branch = args.arangodb_branches[i]

        if args.workflow != "generate": #generate scheduled etc.
            branch = f"arangodb/enterprise-preview:{version}-nightly" if versions[i]["alias"] != "devel" else "arangodb/enterprise-preview:devel-nightly"

        if branch == "undefined":
            continue

        pullImage = pullImageCmd(branch, version)

        version_underscore = version.replace(".", "_")
        branchEnv = f"{pullImage}\n \
export ARANGODB_BRANCH_{version_underscore}={branch}\n \
export ARANGODB_SRC_{version_underscore}=/home/circleci/project/{version}"

        shell = f"{shell}\n{branchEnv}"

    shell = f"{shell}\n\
cd docs-hugo/toolchain/docker/amd64\n \
docker compose up --exit-code-from toolchain\n \
exit $?"

    config["commands"]["launch-toolchain"]["steps"][0]["run"]["command"] = shell
    return config


def workflow_generate_store_artifacts_command(config):
    shell = "cd docs-hugo/site/data"

    for i in range(len(versions)):
        version = versions[i]["name"]
        branch = args.arangodb_branches[i]
        if branch == "undefined":
            continue

        branchEnv = f"tar -cvf /tmp/{version}-generated.tar {version}/\n"
        shell = f"{shell}\n{branchEnv}"
        config["commands"]["store-generated-data"]["steps"].append({
            "store_artifacts": {
                "path": f"/tmp/{version}-generated.tar"
            }
        })


    config["commands"]["store-generated-data"]["steps"][0]["run"]["command"] = shell
    return config

def workflow_commit_generated_download_data(config):
    cmd = config["commands"]["download-generated-data"]["steps"][0]["run"]["command"]

    for i in range(len(versions)):
        version = versions[i]["name"]
        cmd = f"{cmd}\n\
wget $base_url/{version}-generated.tar\n\
tar -xf {version}-generated.tar -C docs-hugo/site/data/\n\
"
    config["commands"]["store-generated-data"]["steps"][0]["run"]["command"] = cmd

    return config


def workflow_release_launch_command(config):
    shell = "\
export ENV=\"circleci\"\n \
export HUGO_URL=https://docs.arangodb.com\n \
export HUGO_ENV=release\n \
export GENERATORS=''\n"

    pullImage = pullImageCmd(args.arangodb_branch, args.docs_version)

    version_underscore = args.docs_version.replace(".", "_")
    branchEnv = f"{pullImage}\n \
export ARANGODB_BRANCH_{version_underscore}={args.arangodb_branch}\n \
export ARANGODB_SRC_{version_underscore}=/home/circleci/project/{args.docs_version}"

    shell = f"{shell}\n{branchEnv}"

    shell = f"{shell}\n\
docker compose up --exit-code-from toolchain\n \
exit $?"

    config["commands"]["launch-toolchain"]["steps"][0]["run"]["command"] = shell
    return config


## UTILS


def pullImageCmd(branch, version):
    pullImage = f"docker pull {branch}"

    if not "enterprise-preview" in branch:
        pullImage = f"BRANCH={branch}\n\
version={version}\n"
        pullImage += "\
image_name=$(echo ${BRANCH##*/})\n\
main_hash=$(awk 'END{print}' $version/.git/logs/HEAD | awk '{print $2}' | cut -c1-9)\n\
docker pull arangodb/docs-hugo:$image_name-$version-$main_hash\n\
docker tag arangodb/docs-hugo:$image_name-$version-$main_hash $image_name-$version"

    return pullImage

def findOpensslVersion(branch):
    r = requests.get(f'https://raw.githubusercontent.com/arangodb/arangodb/{branch}/VERSIONS')
    print(f"Find OpenSSL Version for branch {branch}")
    print(f"Github response: {r.text}")
    for line in r.text.split("\n"):
        if "OPENSSL_LINUX" in line:
            return line.replace("OPENSSL_LINUX", "").replace(" ", "").replace("\"", "")


## MAIN

def main():
    try:
        print(f"Generating configuration with args: {args}")
        with open("base_config.yml", "r") as instream:
            config = yaml.safe_load(instream)
            with open("config.yml", "r") as startConfig:
                config["parameters"] = yaml.safe_load(startConfig)["parameters"]

            config = generate_workflow(config)
            with open("generated_config.yml", "w", encoding="utf-8") as outstream:
                yaml.dump(config, outstream)
    except Exception as exc:
        traceback.print_exc(exc, file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()