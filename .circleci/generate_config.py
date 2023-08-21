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

def generate_workflow(config, params):
    match params:
        case _:
            return




def main():
    try:
        with open("jobs.yml", "r", encoding="utf-8") as instream:
            config = yaml.safe_load(instream)
            paramsFile = open('ci-params.json')
            params = json.load(f)
            generate_workflow(config, params)
        with open("generated_config.yml", "w", encoding="utf-8") as outstream:
            yaml.dump(config, outstream)
    except Exception as exc:
        traceback.print_exc(exc, file=sys.stderr)
        sys.exit(1)