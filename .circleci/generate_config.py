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
    return config



def workflow_generate():
    return













def main():
    try:
        args = parse_arguments()
        print("Generating configuration")
        with open("base_config.yml", "r") as instream:
            config = yaml.safe_load(instream)
            config = generate_workflow(config, args)
            with open("generated_config.yml", "w", encoding="utf-8") as outstream:
                yaml.dump(config, outstream)
    except Exception as exc:
        traceback.print_exc(exc, file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()