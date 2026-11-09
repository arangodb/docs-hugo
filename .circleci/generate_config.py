#!/bin/env python3
""" read test definition, and generate the output for the specified target """
import argparse
import os
import re
import sys
import traceback
import requests
import yaml


# check python 3
if sys.version_info[0] != 3:
    print("found unsupported python version ", sys.version_info)
    sys.exit()

## Load versions
versions = yaml.safe_load(open("versions.yaml", "r"))
versions = sorted(versions["/arangodb/"], key=lambda d: d['name'])
version_names = [v["name"] for v in versions]
# The names end up in shell commands, e.g. "3.12" or "4.x"
for name in version_names:
    if not re.match(r"^\d+\.(\d+|x)$", name):
        sys.exit(f"Invalid version name in versions.yaml: {name!r}")

print(f"Loaded versions {versions}")

## How the docs versions map to arangodb/arangodb (branches, images)
upstream = yaml.safe_load(open("upstream.yaml", "r"))

"""argv"""
parser = argparse.ArgumentParser()
parser.add_argument(
    "--workflow", help="The workflow to trigger", type=str
)
parser.add_argument(
    "--arangodb-branches",  nargs='*', help="The upstream references for the generate workflow as VERSION=REF entries, e.g. 4.x=arangodb/core-preview:devel-nightly (any order, undefined if omitted)"
)
parser.add_argument(
    "--arangodb-branch", help="The upstream reference for the release workflow, the arangodb/arangodb branch for the compile workflow", type=str
)
parser.add_argument(
    "--generators", nargs='*', help="The generators to be used by the toolchain (all if empty)", type=str
)
parser.add_argument(
    "--pr-branch", nargs="?", help="The pipeline parameter (validated only)", type=str
)
parser.add_argument(
    "--override", nargs="?", help="The pipeline parameter (validated only)", type=str
)
parser.add_argument(
    "--examples-scope", nargs="?", help="The pipeline parameter (validated only)", type=str
)
parser.add_argument(
    "--deploy-url", nargs="?", help="The pipeline parameter (validated only)", type=str
)
parser.add_argument(
    "--release-type", nargs="?", help="The kind of release, docs (default) or arangodb, for the release workflow", type=str
)
parser.add_argument(
    "--docs-version", nargs="?", help="For --release-type arangodb and the compile workflow, the documentation version (x.y)", type=str
)
parser.add_argument(
    "--arangodb-version", nargs="?", help="For --release-type arangodb, the ArangoDB version (x.y.z) to put in versions.yaml", type=str
)

args = parser.parse_args()

# Upstream references by docs version name (e.g. "4.x"), passed as VERSION=REF
# entries so that their order doesn't matter
arangodb_branches = {}
for entry in args.arangodb_branches or []:
    version, sep, ref = entry.partition("=")
    if not sep:
        sys.exit(f"Invalid --arangodb-branches entry {entry!r}, expected VERSION=REF")
    if version not in version_names:
        sys.exit(f"Unknown version {version!r} in --arangodb-branches, not in versions.yaml")
    arangodb_branches[version] = ref or "undefined"


def branch_for(version):
    """The upstream reference for a docs version, "undefined" if there is none"""
    return arangodb_branches.get(version, "undefined")


# Generators of the toolchain (ALL_GENERATORS in toolchain/scripts/toolchain.sh)
GENERATORS = ["examples", "metrics", "error-codes", "exit-codes", "options", "optimizer", "oasisctl"]

# The pipeline parameters end up in shell commands of the generated configuration.
# They can come from PR descriptions and comments (via docs-webhooks), so only
# allow values without characters that the shell interprets.
# Image references and branch/tag names
REF_PATTERN = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._/:@+-]*$")
# Single-quoted in the shell, so no quotes (same as in docs-webhooks)
OVERRIDE_PATTERN = re.compile(r"^[A-Za-z0-9_.*+?^$()[\]{}|,\\-]*$")
# Branch name prefix, $CIRCLE_BUILD_NUM is allowed for the scheduled triggers
BRANCH_PATTERN = re.compile(r"^([A-Za-z0-9._/-]|\$CIRCLE_BUILD_NUM)*$")
# Netlify deploy alias, $CIRCLE_BRANCH by default
DEPLOY_URL_PATTERN = re.compile(r"^(\$CIRCLE_BRANCH|[A-Za-z0-9._/-]+)$")
ARANGODB_VERSION_PATTERN = re.compile(r"^(\d+\.\d+\.\d+([.-][A-Za-z0-9.-]+)?)?$")


def validate_parameters():
    errors = []

    def check(name, value, pattern):
        if value is not None and not pattern.match(value):
            errors.append(f"Invalid {name}: {value!r}")

    for version, ref in arangodb_branches.items():
        check(f"upstream reference for {version}", ref, REF_PATTERN)
    if args.arangodb_branch not in (None, "", "undefined"):
        check("arangodb-branch", args.arangodb_branch, REF_PATTERN)
    check("override", args.override, OVERRIDE_PATTERN)
    check("pr-branch", args.pr_branch, BRANCH_PATTERN)
    check("deploy-url", args.deploy_url, DEPLOY_URL_PATTERN)
    check("arangodb-version", args.arangodb_version, ARANGODB_VERSION_PATTERN)
    if args.examples_scope not in (None, "", "all", "changed"):
        errors.append(f"Invalid examples-scope: {args.examples_scope!r}, use all or changed")
    if args.docs_version not in (None, "") and args.docs_version not in version_names:
        errors.append(f"Invalid docs-version: {args.docs_version!r}, not in versions.yaml")
    for generator in requested_generators():
        if generator not in GENERATORS:
            errors.append(f"Unknown generator: {generator!r}, available: {' '.join(GENERATORS)}")

    if errors:
        sys.exit("\n".join(errors))


def generate_workflow(config):
    if args.workflow == "plain-build":
        if not frontend_changed():
            jobs = config["workflows"]["plain"]["jobs"]
            jobs[:] = [j for j in jobs if not (isinstance(j, dict) and "frontend-tests" in j)]
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

    if args.workflow == "compile":
        workflow_compile(config)

    return config


## WORKFLOWS

def workflow_generate(config):
    refs = {}
    for version in version_names:
        branch = branch_for(version)
        if branch != "undefined":
            refs[version] = branch

    jobs, servers = prepare_jobs(refs, needs_source())
    config = workflow_generate_launch_command(config, servers)
    config = workflow_store_artifacts_command(config, servers)

    generateJob = {
        "build-with-generated": {
            "name": args.workflow,
            "generators": "<< pipeline.parameters.generators >>",
            "commit-generated": "<< pipeline.parameters.commit-generated >>",
            "create-pr": "<< pipeline.parameters.create-pr >>",
            "pr-branch": "<< pipeline.parameters.pr-branch >>",
            "requires": [job_name(job) for job in jobs]
        }
    }

    deployJob = {
        "deploy": {
            "requires": [args.workflow],
            "deploy-args": "--alias << pipeline.parameters.deploy-url >>"
        }
    }

    if not jobs:
        remove_attach_workspace(config)

    config["workflows"]["generate"] = {"jobs": jobs + [generateJob, deployJob, frontendTestsJob(args.workflow)]}
    return config


# Plain builds only run the frontend tests if the changes compared to main can
# affect the frontend. The other workflows always run them.
FRONTEND_PATHS = (
    "site/themes/",
    "site/layouts/",
    "site/static/",
    "site/config/",
    "site/data/versions.yaml",
    "toolchain/frontend-tests/",
    ".circleci/",
)

def frontend_changed():
    sha = os.environ.get("CIRCLE_SHA1")
    token = os.environ.get("CIRCLECI_GITHUB_READONLY")
    if not sha or not token:
        print("Running the frontend tests, can't determine the changed files without CIRCLE_SHA1 and CIRCLECI_GITHUB_READONLY")
        return True
    try:
        r = requests.get(
            f"https://api.github.com/repos/arangodb/docs-hugo/compare/main...{sha}",
            headers={"Authorization": f"Bearer {token}", "Accept": "application/vnd.github+json"},
            timeout=30,
        )
        r.raise_for_status()
        files = r.json().get("files", [])
    except Exception as e:
        print(f"Running the frontend tests, can't determine the changed files: {e}")
        return True
    # The API lists at most 300 files
    if len(files) >= 300:
        print("Running the frontend tests, too many changed files to check")
        return True
    changed = [name for f in files for name in (f["filename"], f.get("previous_filename", "")) if name.startswith(FRONTEND_PATHS)]
    if changed:
        print(f"Running the frontend tests for the changed files {changed}")
    else:
        print("Skipping the frontend tests, no frontend files changed")
    return bool(changed)


def frontendTestsJob(buildJob):
    return {
        "frontend-tests": {
            "requires": [buildJob]
        }
    }


# The generate job attaches the workspace of the prepare jobs, which fails if there
# are none
def remove_attach_workspace(config):
    steps = config["jobs"]["build-with-generated"]["steps"]
    steps[:] = [step for step in steps if not (isinstance(step, dict) and "attach_workspace" in step)]


def workflow_generate_scheduled(config):
    if args.workflow == "generate-scheduled":
        generators = "metrics error-codes exit-codes options optimizer"
        # The nightly images of the versions that have public ones
        refs = {v: upstream[v]["nightly"] for v in version_names if upstream.get(v, {}).get("nightly")}
        jobs, servers = prepare_jobs(refs, True)
    elif args.workflow == "generate-oasisctl":
        # Independent of ArangoDB, no servers needed
        generators = "oasisctl"
        jobs, servers = [], {}
    else:
        sys.exit(f"Unknown workflow {args.workflow!r}")

    config = workflow_generate_launch_command(config, servers)
    config = workflow_store_artifacts_command(config, servers)

    generateJob = {
        "build-with-generated": {
            "name": args.workflow,
            "generators": generators,
            "commit-generated": True,
            "create-pr": True,
            "pr-branch": args.workflow,
            "requires": [job_name(job) for job in jobs]
        }
    }

    if not jobs:
        remove_attach_workspace(config)

    config["workflows"]["generate"] = {"jobs": jobs + [generateJob, frontendTestsJob(args.workflow)]}
    return config


def workflow_release_arangodb(config):
    version = args.docs_version
    if version not in version_names or args.arangodb_branch in (None, "", "undefined"):
        sys.exit("The release workflow for ArangoDB releases requires docs-version and arangodb-branch")

    jobs, servers = prepare_jobs({version: args.arangodb_branch}, True)
    config = workflow_release_launch_command(config, servers)
    config = workflow_store_artifacts_command(config, servers)

    generateJob = {
        "build-with-generated": {
            "name": "release-generate",
            "generators": "",
            "commit-generated": True,
            "create-pr": True,
            "pr-branch": f"RELEASE_{args.arangodb_version}",
            "requires": [job_name(job) for job in jobs]
        }
    }

    for step in config["jobs"]["build-with-generated"]["steps"]:
        if "upload-summary" in step:
            step["upload-summary"]["branch"] = f"RELEASE_{args.arangodb_version}-$CIRCLE_BUILD_NUM"

    # Deploy to production after the release PR is merged and the workflow approved
    approvalJob = {"approve-workflow": {"type": "approval", "requires": ["release-generate"]}}

    release_jobs = config["workflows"]["release"]["jobs"]
    for job in release_jobs:
        if isinstance(job, dict) and "plain-build" in job:
            job["plain-build"]["requires"] = ["approve-workflow"]

    config["workflows"]["release"]["jobs"] = jobs + [generateJob, approvalJob] + release_jobs
    return config


# Compiles an arangodb/arangodb branch of a version without upstream images (3.11)
# and caches it on Docker Hub as the image of upstream.yaml, which the other
# workflows then use for the branch name
def workflow_compile(config):
    version = args.docs_version or "3.11"
    branch = args.arangodb_branch
    if branch in (None, "", "undefined") or is_image_ref(branch):
        sys.exit("The compile workflow requires an arangodb/arangodb branch (or tag) as arangodb-branch")

    settings = upstream_settings(version)
    if not settings.get("build-image"):
        if settings.get("image"):
            sys.exit(f"The images of {version} are built by the CircleCI pipeline of arangodb/arangodb, "
                     f"not by the compile workflow (see CIRCLECI.md)")
        sys.exit(f"The compile workflow doesn't support version {version}, use a release image")

    print(f"Creating compile job for version {version} branch {branch}")
    config["workflows"]["compile"] = {
        "jobs": [{
            "compile-arangodb": {
                "context": ["sccache-aws-bucket"],
                "name": f"compile-{version}",
                "arangodb-branch": branch,
                "version": version,
                "enterprise": settings["enterprise"],
                "image-template": settings["image"],
                "build-image": settings["build-image"],
            }
        }]
    }
    return config


## JOBS

def job_name(job):
    return list(job.values())[0]["name"]


def upstream_settings(version):
    if version not in upstream:
        sys.exit(f"No upstream settings for version {version!r} in .circleci/upstream.yaml, "
                 f"it can't be generated")
    return upstream[version]


# The jobs that determine the images of the upstream references (by docs version)
# and clone the source code for the generators that read it, and the servers to
# start as {version: (image, source)} with the image as shell expression and
# whether there is source code
def prepare_jobs(refs, source):
    jobs = []
    servers = {}
    for version, ref in refs.items():
        settings = upstream_settings(version)

        # Images that can be used as they are
        if is_image_ref(ref) and not source:
            print(f"No prepare job for version {version}: image {ref}, source not needed")
            servers[version] = (ref, False)
            continue

        if not is_image_ref(ref) and not settings.get("image"):
            sys.exit(f"There are no images of arangodb/arangodb branches for version {version}, "
                     f"specify an image (e.g. a release image) instead of {ref!r}")

        if not settings.get("image"):
            hint = "Specify an existing image."
        elif settings.get("build-image"):
            hint = ("Compile it with the compile workflow, or specify an existing image "
                    "(https://github.com/arangodb/docs-hugo/blob/main/CIRCLECI.md#build-arangodb-images).")
        else:
            hint = ("Build it with the CircleCI pipeline of arangodb/arangodb, or specify an existing image "
                    "(https://github.com/arangodb/docs-hugo/blob/main/CIRCLECI.md#build-arangodb-images).")

        print(f"Creating prepare job for version {version} reference {ref}")
        jobs.append({
            "prepare-arangodb": {
                "name": f"prepare-{version}",
                "arangodb-ref": ref,
                "version": version,
                "branch": settings["branch"],
                "enterprise": settings["enterprise"],
                "image-template": settings.get("image", ""),
                "image-hint": hint,
                "source": source,
            }
        })
        # Written by the prepare job to the workspace
        servers[version] = (f"$(cat {version}/.arangodb-image)", source)
    return jobs, servers


## COMMANDS

def launch_servers_shell(servers):
    lines = []
    for version, (image, source) in servers.items():
        # Uppercase so a version name with letters (e.g. "4.x" -> "4_X") matches
        # the ARANGODB_BRANCH_4_X/ARANGODB_SRC_4_X vars that docker-compose.yml
        # and toolchain.sh reference. The toolchain pulls the client tools images
        # of split images itself.
        version_underscore = version.replace(".", "_").upper()
        lines.append(f"docker pull {image}")
        lines.append(f"export ARANGODB_BRANCH_{version_underscore}={image}")
        if source:
            lines.append(f"export ARANGODB_SRC_{version_underscore}=/home/circleci/project/{version}")
    return lines


def launch_toolchain(config, env, servers):
    lines = env + launch_servers_shell(servers) + [
        "cd docs-hugo/toolchain/docker/amd64",
        "docker compose up --exit-code-from toolchain",
        "exit $?",
    ]
    config["commands"]["launch-toolchain"]["steps"][0]["run"]["command"] = "\n".join(lines) + "\n"
    return config


def workflow_generate_launch_command(config, servers):
    return launch_toolchain(config, [
        'export ENV="circleci"',
        "export HUGO_URL=https://<< pipeline.parameters.deploy-url >>--docs-hugo.netlify.app/",
        "export HUGO_ENV=examples",
        "export OVERRIDE='<< pipeline.parameters.override >>'",
        "export EXAMPLES_SCOPE='<< pipeline.parameters.examples-scope >>'",
        "export GENERATORS='<< parameters.generators >>'",
    ], servers)


def workflow_release_launch_command(config, servers):
    return launch_toolchain(config, [
        'export ENV="circleci"',
        "export HUGO_URL=https://docs.arango.ai/",
        "export HUGO_ENV=release",
        "export GENERATORS=''",
    ], servers)


def workflow_store_artifacts_command(config, servers):
    shell = "cd docs-hugo/site/data"

    for version in servers:
        shell = f"{shell}\ntar -cvf /tmp/{version}-generated.tar {version}/\n"
        config["commands"]["store-generated-data"]["steps"].append({
            "store_artifacts": {
                "path": f"/tmp/{version}-generated.tar"
            }
        })

    config["commands"]["store-generated-data"]["steps"][0]["run"]["command"] = shell
    return config


def workflow_commit_generated_download_data(config):
    cmd = config["commands"]["download-generated-data"]["steps"][0]["run"]["command"]

    for version in version_names:
        cmd = f"{cmd}\n\
set +e\n\
wget $base_url/{version}-generated.tar\n\
tar -xf {version}-generated.tar -C docs-hugo/site/data/\n\
set -e\n\
"
    config["commands"]["download-generated-data"]["steps"][0]["run"]["command"] = cmd

    return config


## UTILS

# Image references of any registry (Docker Hub, public ECR, ...), as opposed to
# arangodb/arangodb branch names, which are resolved to the prebuilt image of
# their commit (see upstream.yaml). Branch names can't contain colons, image
# references have a tag (or a digest).
def is_image_ref(branch):
    return ":" in branch or "@" in branch


# Generators that read the arangodb/arangodb source code (cloned by prepare-arangodb)
SOURCE_GENERATORS = ["metrics", "error-codes", "exit-codes"]


def requested_generators():
    return " ".join(args.generators or []).split()


def needs_source():
    generators = requested_generators()
    return not generators or any(g in SOURCE_GENERATORS for g in generators)


## MAIN

def main():
    validate_parameters()
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
