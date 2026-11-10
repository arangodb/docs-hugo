#!/usr/bin/python3

"""Combine the documentation snippets of the server metrics into one file and
check them. Whether all declared metrics are documented (and vice versa) is
checked by the CI of arangodb/arangodb (utils/generateAllMetricsDocumentation.py),
which needs the full source code, including arangodb/enterprise."""

import os
import sys
import argparse

from yaml import load, dump, YAMLError
try:
    from yaml import CLoader as Loader
except ImportError:
    from yaml import Loader

# Usage:

def print_usage():
    """Print usage."""
    print("""Usage: utils/generateAllMetricsDocumentation.py [--dst] [--main]

""")

parser = argparse.ArgumentParser(description='ArangoDB Generate Metrics Documentation')
parser.add_argument('--dst', type=str,
                    help='path to save the metrics file')
parser.add_argument('--main', type=str,
                    help='path to the arangodb source code')
args = parser.parse_args()

if args.main is None:
	print("Args are required")
	exit(1)

DUMPMETRICS = False
if args.dst is not None:
    DUMPMETRICS = True

# Handle Windows and trailing path separators
ARANGODB_SOURCE = args.main.replace("\\", "/").rstrip("/")
DST = args.dst.replace("\\", "/").rstrip("/")



if len(sys.argv) > 1 and (sys.argv[1] == "-h" or sys.argv[1] == "--help"):
    print_usage()
    sys.exit(0)

# Some data:
CATEGORYNAMES = [
    "Agency",
    "AQL",
    "ArangoSearch",
    "Connectivity",
    "Disk", # Unused
    "Errors",
    "Foxx", # Up to v3.12
    "Health",
    "Hotbackup", # Unused
    "k8s", # Unused
    "kubearangodb", # Unused
    "License",
    "Maintenance",
    "Network",
    "Pregel", # Up to v3.12
    "Replication",
    "RocksDB",
    "Scheduler",
    "Statistics",
    "Transactions",
    "V8", # Up to v3.12
    "VectorIndex", # From v3.12.9 onward
]

NODE_TYPES = ["coordinator", "dbserver", "agent", "single"]

# Check that we are in the right place:
if not os.path.isdir(f"{ARANGODB_SOURCE}/Documentation/Metrics"):
    print(f"No Documentation/Metrics folder in {ARANGODB_SOURCE}, expected the arangodb/arangodb source code!")
    sys.exit(1)

# List files in Documentation/Metrics:
YAMLFILES = [f for f in os.listdir(f"{ARANGODB_SOURCE}/Documentation/Metrics") if f.endswith(".yaml")]
YAMLFILES.sort()
if "allMetrics.yaml" in YAMLFILES:
    YAMLFILES.remove("allMetrics.yaml")
if "template.yaml" in YAMLFILES:
    YAMLFILES.remove("template.yaml")

if len(YAMLFILES) == 0:
    print(f"Did not find any metrics in {ARANGODB_SOURCE}/Documentation/Metrics!")
    sys.exit(2)

# Check the documentation of every metric:
MISSING = False
for yamlfile in YAMLFILES:
    metric = yamlfile[:-5]
    bad = False
    filename = os.path.join(f"{ARANGODB_SOURCE}/Documentation/Metrics", yamlfile)
    try:
        with open(filename, encoding="utf-8") as s:
            y = load(s, Loader=Loader)
    except YAMLError as err:
        print(f"Could not parse YAML file '{filename}', error:\n{err}")
        bad = True

    if not bad:
        # Check a few things in the yaml:
        for attr in ["name", "help", "exposedBy", "description", "unit",
                     "type", "category", "complexity", "introducedIn"]:
            if not attr in y:
                print(f"YAML file '{filename}' does not have required attribute '{attr}'")
                bad = True
        if not bad:
            for attr in ["name", "help", "description", "unit",
                         "type", "category", "complexity", "introducedIn"]:
                if not isinstance(y[attr], str):
                    print(f"YAML file '{filename}' has an attribute "
                          f"'{attr}' whose value must be a string but isn't.")
                    bad = True
            if y["help"].strip()[-1] != ".":
                print(f"YAML file '{filename}' has a 'help' attribute that "
                      f"does not end with a period.")
                bad = True
            if not isinstance(y["exposedBy"], list):
                print(f"YAML file '{filename}' has an attribute 'exposedBy' "
                      f"whose value must be a list but isn't.")
                bad = True
            else:
                for e in y["exposedBy"]:
                    if e not in NODE_TYPES:
                        print(f"YAML file '{filename}' has an attribute 'exposedBy' "
                              f"that lists an invalid value '{e}'.")
                        bad = True
            if not bad:
                if not y["category"] in CATEGORYNAMES:
                    print(f"YAML file '{filename}' has an unknown category "
                          f"'{y['category']}', please fix.")
                    bad = True
                if y["name"] != metric:
                    print(f"YAML file '{filename}' has an attribute name '" + y["name"] + "' which does not match the file name.")
                    bad = True

    if bad:
        MISSING = True


OUTFILE = f"{DST}/allMetrics.yaml"
if DUMPMETRICS:
    # Dump what we have:
    with open(OUTFILE, "w", encoding="utf-8") as S:
        for i, yamlfile in enumerate(YAMLFILES):
            with open(os.path.join(f"{ARANGODB_SOURCE}/Documentation/Metrics", yamlfile), encoding="utf-8") as I:
                prefix = "- "
                while True:
                    l = I.readline()
                    if l == "":
                        break
                    S.write(prefix)
                    prefix = "  "
                    S.write(l)
                S.write("\n")

if MISSING:
    sys.exit(17)

