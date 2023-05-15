import argparse
import yaml
import os
import json
import re
import traceback
from functools import reduce  # forward compatibility for Python 3
import operator



##CMDLINE ARGS
parser = argparse.ArgumentParser(description='Optional app description')
parser.add_argument('--src', type=str,
                    help='docs/ folder')
parser.add_argument('--dst', type=str,
                    help='api-docs.json file destination')
parser.add_argument('--version', type=str,
                    help='documentation version folder')
args = parser.parse_args()

if args.src is None or args.dst is None or args.version is None:
    print("Args are required")
    exit(1)

# Handle Windows and trailing path separators
docs = args.src
dst = args.dst
version = args.version

apiDocsRes = {
    "openapi": "3.1.0",
    "info": {
        "description": "ArangoDB REST API Interface",
        "version": "3.10.5", # TODO: Don't hardcode the ArangoDB version
        "title": "ArangoDB",
        "license": {
            "name": "Apache License, Version 2.0"
        }
    },
    "tags": {

    },
    "paths" : {}
}

def generateAPIDocs():
    print("PARSING DOCUMENTATION FILES")
    for root, dirs, files in os.walk(f"{docs}/site/content/{version}", topdown=True):
        if root.endswith("images"):
            continue

        for file in files:
            processFile(f"{root}/{file}".replace("\\", "/"))

    print("END")

def loadTags():
    print("GENERATING TAGS")
    try:
        file = open(f"{docs}/site/data/openapi_tags.yaml", "r", encoding="utf-8")
        data = file.read()
        file.close()
    except Exception as ex:
        print(traceback.format_exc())
        raise ex

    tags = yaml.safe_load(data)
    apiDocsRes["tags"] = tags
    print(f"TAGS GENERATED")
    
def processFile(filepath):
    try:
        file = open(filepath, "r", encoding="utf-8")
        data = file.read()
        file.close()
    except Exception as ex:
        print(f"Error reading file {filepath}")
        print(traceback.format_exc())
        raise ex

    endpoints = re.findall(r"\`{3}openapi(.*?)\`{3}", data, re.MULTILINE | re.DOTALL)
    for endpoint in endpoints:
        endpointDict = yaml.safe_load(endpoint)
        path = next(iter(endpointDict["paths"]))
        method = next(iter(endpointDict["paths"][path]))
        if not path in apiDocsRes["paths"]:
            apiDocsRes["paths"][path] = {}
        apiDocsRes["paths"][path][method] = endpointDict["paths"][path][method]

    processDescriptions(apiDocsRes, "")
    
    dstFile = open(dst, "w")
    json.dump(apiDocsRes, dstFile, indent=2)
    dstFile.close()



def getFromDict(dataDict, mapList):
    return reduce(operator.getitem, mapList, dataDict)

def setInDict(dataDict, mapList, value):
    mapList = mapList.split(",")[1:]
    getFromDict(dataDict, mapList[:-1])[mapList[-1]] = value

def delFromDict(dataDict, mapList):
    mapList = mapList.split(",")[1:]
    del getFromDict(dataDict, mapList[:-1])[mapList[-1]]

def processDescriptions(data, k):
    for key, value in data.items():
        if not "description" in value:
            if isinstance(value, dict):
                processDescriptions(value, k + "," + key)
        else:
            desc = value["description"]
            if re.search(r"{{< (?:warning|info|danger|success|tip) >}}", desc, re.MULTILINE):
                newDesc = generateNewDesc(desc)
                setInDict(apiDocsRes, f"{k},{key},description", newDesc)

def generateNewDesc(oldDesc):
    newDesc = ""
    insideHint = False
    for line in oldDesc.split("\n"):
        hint = re.search(r"{{< (warning|info|danger|success|tip) >}}", line)
        if hint:
            insideHint = True
            newDesc += f"> **{hint[1].upper()}**:\n"
        elif re.search(r"{{< /(?:warning|info|danger|success|tip) >}}", line):
            insideHint = False
        else:
            if insideHint:
                newDesc += f"> {line}\n"
            else:
                newDesc += f"{line}\n"
    return newDesc

if __name__ == "__main__":
    print("--- GENERATE API DOCS")
    loadTags()
    generateAPIDocs()
    print("--- END")
