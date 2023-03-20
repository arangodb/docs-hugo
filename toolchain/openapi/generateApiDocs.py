import argparse
import yaml
import os
import json
import re
import traceback


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
		"version": "3.10.5",
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
            print(file)
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

    dstFile = open(dst, "w")
    json.dump(apiDocsRes, dstFile, indent=4)
    dstFile.close()

if __name__ == "__main__":
    print("--- GENERATE API DOCS")
    loadTags()
    generateAPIDocs()
    print("--- END")
