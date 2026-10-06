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
versions = sorted(versions["/arangodb/"], key=lambda d: d['name']) 


print(f"Loaded versions {versions}")

"""argv"""
if "--help-flags" in sys.argv:
    print_help_flags()
    sys.exit()

parser = argparse.ArgumentParser()
parser.add_argument(
    "--workflow", help="The workflow to trigger", type=str
)
parser.add_argument(
    "--arangodb-branches",  nargs='+', help="The arangodb/arangodb branches to be used for the generate workflow (sorted by name)"
)
parser.add_argument(
    "--arangodb-branch", help="The arangodb/arangodb branch to be used for the release workflow", type=str
)
parser.add_argument(
    "--generators", nargs='+', help="The generators to be used by the toolchain", type=str
)
parser.add_argument(
    "--commit-generated", help="Whether to use the CircleCI commit step", type=bool
)
parser.add_argument(
    "--create-pr", help="If --commit-generated is used, create a separate PR on GitHub with the committed files", type=bool
)
parser.add_argument(
    "--pr-branch", nargs="?", help="If --create-pr is used, sets the PR branch name", type=str
)
parser.add_argument(
    "--release-type", nargs="?", help="The kind of release, docs (default) or arangodb, for the release workflow", type=str
)
parser.add_argument(
    "--docs-version", nargs="?", help="For --release-type arangodb, the documentation version (x.y) corresponding to the ArangoDB version of the release", type=str
)
parser.add_argument(
    "--arangodb-version", nargs="?", help="For --release-type arangodb, the ArangoDB version (x.y.z) to put in versions.yaml", type=str
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
        if args.workflow in ["generate-scheduled", "generate-oasisctl"] and version in ["3.10", "3.11"]:
            continue # Skip compilation, 3.10 nightly images no longer available and >= 3.11.14-3 non-public
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

        if not "/enterprise-preview:" in branch and not "/enterprise:" in branch:

            openssl = findOpensslVersion(branch)
            compileJob["compile-linux"]["openssl"] = openssl

            if not extendedCompileJob:
                extendedCompileJob = True
                config["jobs"]["compile-linux"]["steps"].append({
                    "check-arangodb-image-exists": {
                        "branch": "<< parameters.arangodb-branch >>",
                        "version": "<< parameters.version >>",
                    }
                })
                config["jobs"]["compile-linux"]["steps"].append({
                    "compile-and-dockerize-arangodb": {
                        "branch": "<< parameters.arangodb-branch >>",
                        "version": "<< parameters.version >>",
                        "openssl": "<< parameters.openssl >>",
                    }
                })

            if version in ["3.10", "3.11"]:
                if openssl.startswith("3.0"):
                    compileJob["compile-linux"]["build-image"] = "arangodb/build-alpine-x86_64:3.16-gcc11.2-openssl3.0.10"
                elif openssl.startswith("3.1"):
                    compileJob["compile-linux"]["build-image"] = "arangodb/build-alpine-x86_64:3.16-gcc11.2-openssl3.1.2"
                elif openssl.startswith("1.1"):
                    compileJob["compile-linux"]["build-image"] = "arangodb/build-alpine-x86_64:3.16-gcc11.2-openssl1.1.1s"
                else:
                    compileJob["compile-linux"]["build-image"] = "arangodb/ubuntubuildarangodb-311:9" # clang-16
            else: # build image for 3.12.9 and devel as of 2026-06-29
                compileJob["compile-linux"]["build-image"] = "arangodb/ubuntubuildarangodb-devel:23" # clang-19

        print(f"compileJob = {compileJob}")

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
        if version in ["3.10", "3.11"]:
            continue # Skip compilation, 3.10 nightly images no longer available and >= 3.11.14-3 non-public
        
        compileJob = {
            "compile-linux": {
                "context": ["sccache-aws-bucket"],
                "name": f"compile-{version}",
                "arangodb-branch": nightlyImage(version),
                "version": version
            }
        }
        # TODO: Does the default build image matter here? Defaults to legacy Alpine
        generateRequires.append(f"compile-{version}")
        jobs.append(compileJob)

    generators = ""

    if args.workflow == "generate-scheduled":
        generators = "metrics error-codes exit-codes options optimizer"
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
    config = workflow_release_store_artifacts_command(config)

    jobs = config["workflows"]["release"]["jobs"]

    generateRequires = []

    print(f"Creating compile job for version {args.docs_version} branch {args.arangodb_branch}")

    openssl = findOpensslVersion(args.arangodb_branch)

    compileJob = {
        "compile-linux": {
            "context": ["sccache-aws-bucket"],
            "name": f"compile-{args.docs_version}",
            "arangodb-branch": args.arangodb_branch,
            "version": args.docs_version
        }
    }

    if args.docs_version in ["3.10", "3.11"]:
        if openssl.startswith("3.0"):
            compileJob["compile-linux"]["build-image"] = "arangodb/build-alpine-x86_64:3.16-gcc11.2-openssl3.0.10"
        elif openssl.startswith("3.1"):
            compileJob["compile-linux"]["build-image"] = "arangodb/build-alpine-x86_64:3.16-gcc11.2-openssl3.1.2"
        elif openssl.startswith("1.1"):
            compileJob["compile-linux"]["build-image"] = "arangodb/build-alpine-x86_64:3.16-gcc11.2-openssl1.1.1s"
        else:
            compileJob["compile-linux"]["build-image"] = "arangodb/ubuntubuildarangodb-311:9" # clang-16
    else: # build image for 3.12.9 and devel as of 2026-06-29
        compileJob["compile-linux"]["build-image"] = "arangodb/ubuntubuildarangodb-devel:23" # clang-19

    config["jobs"]["compile-linux"]["steps"].append({
        "compile-and-dockerize-arangodb": {
            "branch": args.arangodb_branch,
            "version": args.docs_version,
            "openssl": openssl,
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
export HUGO_URL=https://<< pipeline.parameters.deploy-url >>--docs-hugo.netlify.app/\n \
export HUGO_ENV=examples\n \
export OVERRIDE=<< pipeline.parameters.override >>\n \
export GENERATORS='<< parameters.generators >>'\n"

    for i in range(len(versions)):
        version = versions[i]["name"]
        if args.workflow in ["generate-scheduled", "generate-oasisctl"] and version in ["3.10", "3.11"]:
            continue # Skip generation, 3.10 nightly images no longer available and >= 3.11.14-3 non-public
        branch = args.arangodb_branches[i]

        if args.workflow != "generate": #generate scheduled etc.
            branch = nightlyImage(version)

        if branch == "undefined":
            continue

        pullImage = pullImageCmd(branch, version)

        # Uppercase so a version name with letters (e.g. "4.x" -> "4_X") matches
        # the ARANGODB_BRANCH_4_X/ARANGODB_SRC_4_X vars that docker-compose.yml,
        # config.yaml and toolchain.sh reference.
        version_underscore = version.replace(".", "_").upper()
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


def workflow_release_store_artifacts_command(config):
    shell = "cd docs-hugo/site/data"

    version = args.docs_version
    branch = args.arangodb_branch

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
set +e\n\
wget $base_url/{version}-generated.tar\n\
tar -xf {version}-generated.tar -C docs-hugo/site/data/\n\
set -e\n\
"
    config["commands"]["download-generated-data"]["steps"][0]["run"]["command"] = cmd

    return config


def workflow_release_launch_command(config):
    shell = "\
export ENV=\"circleci\"\n \
export HUGO_URL=https://docs.arango.ai/\n \
export HUGO_ENV=release\n \
export GENERATORS=''\n"

    pullImage = pullImageCmd(args.arangodb_branch, args.docs_version)

    version_underscore = args.docs_version.replace(".", "_").upper()  # see note in workflow_generate_launch_command
    branchEnv = f"{pullImage}\n \
export ARANGODB_BRANCH_{version_underscore}={args.arangodb_branch}\n \
export ARANGODB_SRC_{version_underscore}=/home/circleci/project/{args.docs_version}"

    shell = f"{shell}\n{branchEnv}"

    shell = f"{shell}\n\
cd docs-hugo/toolchain/docker/amd64\n \
docker compose up --exit-code-from toolchain\n \
exit $?"

    config["commands"]["launch-toolchain"]["steps"][0]["run"]["command"] = shell
    return config


## UTILS


# Map a docs version to its upstream enterprise-preview nightly image tag.
# The docs version name does NOT equal the upstream branch/tag one-to-one:
#   - "3.12" tracks the upstream "devel" branch -> devel-nightly
#   - "4.x"  tracks the upstream "4.0" branch   -> 4.0-nightly
#   - "3.10"/"3.11" use their own same-named nightlies (currently skipped anyway)
# Only used by the scheduled/oasisctl workflows, which run against prebuilt
# nightlies instead of compiling from source. Keep this in sync with the
# upstream branch mapping in base_config.yml's clone-arangodb (4.x -> 4.0).
NIGHTLY_IMAGE = {
    "3.10": "arangodb/enterprise-preview:3.10-nightly",
    "3.11": "arangodb/enterprise-preview:3.11-nightly",
    "3.12": "arangodb/enterprise-preview:devel-nightly",
    "4.x": "arangodb/enterprise-preview:4.0-nightly",
}


def nightlyImage(version):
    try:
        return NIGHTLY_IMAGE[version]
    except KeyError:
        raise RuntimeError(
            f"No nightly image mapping for docs version '{version}'. "
            f"Add it to NIGHTLY_IMAGE in generate_config.py (the docs version "
            f"name is not necessarily the upstream nightly tag, e.g. '4.x' -> '4.0-nightly')."
        )


def pullImageCmd(branch, version):
    pullImage = f"docker pull {branch}"

    if not "/enterprise-preview:" in branch and not "/enterprise:" in branch:
        pullImage = f"BRANCH={branch}\n\
version={version}\n"
        pullImage += "\
image_name=$(echo ${BRANCH##*/})\n\
main_hash=$(awk 'END{print}' $version/.git/logs/HEAD | awk '{print $2}' | cut -c1-9)\n\
docker pull arangodb/docs-hugo:$image_name-$version-$main_hash\n\
docker tag arangodb/docs-hugo:$image_name-$version-$main_hash $image_name-$version"

    return pullImage

def findOpensslVersion(branch):
    url = f'https://raw.githubusercontent.com/arangodb/arangodb/{branch}/VERSIONS'
    print(f"Find OpenSSL Version for branch {branch}")
    r = requests.get(url)
    if r.status_code != 200:
        raise RuntimeError(
            f"Could not fetch VERSIONS for arangodb/arangodb branch '{branch}' "
            f"(HTTP {r.status_code} from {url}). Does that branch exist upstream? "
            f"Note: the docs version name (e.g. '4.x') is NOT necessarily the upstream "
            f"arangodb/arangodb branch name (e.g. '4.0' or 'devel')."
        )
    print(f"Github response: {r.text}")
    for line in r.text.split("\n"):
        if "OPENSSL_LINUX" in line:
            version = line.replace("OPENSSL_LINUX", "").replace(" ", "").replace("\"", "")
            if version:
                return version
    raise RuntimeError(
        f"No non-empty OPENSSL_LINUX entry found in VERSIONS for arangodb/arangodb "
        f"branch '{branch}' ({url}); cannot determine which OpenSSL version to compile."
    )


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
    except Exception:
        traceback.print_exc(file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()