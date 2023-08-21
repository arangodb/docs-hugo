#!/bin/env python3
""" read test definition, and generate the output for the specified target """
import argparse
import os
import sys
import traceback
import yaml
import json

# check python 3
if sys.version_info[0] != 3:
    print("found unsupported python version ", sys.version_info)
    sys.exit()

def parse_arguments():
    """argv"""
    if "--help-flags" in sys.argv:
        print_help_flags()
        sys.exit()

    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--workflow", help="file containing the circleci base config", type=str
    )
    parser.add_argument(
        "--deploy-url", help="file containing the circleci base config", type=str
    )
    parser.add_argument(
        "--generators", help="file containing the test definitions", type=str
    )
    parser.add_argument("-o", "--output", type=str, help="filename of the output")

    return parser.parse_args()














def generate_workflow(config, args):
    if args.workflow == "plain-build":
        return workflow_plain_build(config, args)
    elif "generate" in args.workflow:
        return
    else:
        return


def workflow_plain_build(config, args):
    buildYaml = yaml.safe_load(open("jobs/plain_build.yml", "r"))
    deployYaml = yaml.safe_load(open("jobs/plain_build.yml", "r"))
    config["jobs"] = {
        "plain-build": buildYaml["plain-build"],
        "deploy": deployYaml["deploy"]
    }
    config["workflows"] = {
        "plain": {
            "jobs": [{
                "plain-build": {"deploy-url": args.deploy-url}
            },
            {
                "deploy": {"deploy-url": args.deploy-url, "requires": ["plain-build"]}
            }]
        }
    }
    return config




def workflow_generate():
    return













def main():
    try:
        args = parse_arguments()
        print("Generating configuration")
        config = {"version": 2.1, "jobs": {}, "workflows": {}}
        config = generate_workflow(config, args)
        with open("generated_config.yml", "w", encoding="utf-8") as outstream:
            yaml.dump(config, outstream)
    except Exception as exc:
        traceback.print_exc(exc, file=sys.stderr)
        sys.exit(1)