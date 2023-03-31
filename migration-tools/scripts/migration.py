import yaml
import os
import re
from pathlib import Path
import shutil
import time
import traceback
import argparse
import json

# migration modules
from globals import *
import structure
from definitions import *
from http_docublocks import createComponentsIn1StructsFile, explodeNestedStructs
import automata


def createStructure():
	print("----- CREATING FOLDERS STRUCTURE")
	structure.migrateStructure('', None, "manual", 0)
	structure.migrateStructure('http', None, "http", 3)
	structure.migrateStructure('arangograph', None, "arangograph", 1)
	structure.migrateStructure('aql', None, "aql", 2)
	structure.migrateStructure('drivers', None, "drivers", 4)

	print("----- DONE\n")

def initBlocksFileLocations():
	print("----- LOADING DOCUBLOCKS DEFINITIONS")
	with open(ALL_COMMENTS_FILE, 'r', encoding="utf-8") as apiDocs:
		data = apiDocs.read()

		docuBlocks = re.findall(r"<!-- filename: .* -->\n@startDocuBlock .*", data)
		for docuBlock in docuBlocks:
			fileLocation = re.findall(r"(?<=<!-- filename: ).*(?= -->)", docuBlock)[0]
			fileLocation = re.sub(r".*(?=\/Documentation)", ARANGO_MAIN, fileLocation, 1, re.MULTILINE)

			blockName = re.findall(r"(?<=@startDocuBlock ).*", docuBlock)[0]

			blocksFileLocations[blockName] = {"path": fileLocation, "processed": False}
	components["schemas"] = definitions
	createComponentsIn1StructsFile()

	print("----- DONE\n")
    
def processFiles():
	print(f"----- STARTING CONTENT MIGRATION")
	for root, dirs, files in os.walk(f"{NEW_TOOLCHAIN}/content/{version}", topdown=True):
		for file in files:
			automata.migrate(f"{root}/{file}".replace("\\", "/"))

	urlMapFile = open("urls.json", "w")
	json.dump(urlMap, urlMapFile, indent=4)
	urlMapFile.close()
	print("------ DONE\n")


def checkUnusedDocublocks():
	print(f"----- CHECK FOR UNUSED DOCUBLOCKS")
	for docuBlock in blocksFileLocations.keys():
		if blocksFileLocations[docuBlock]["processed"] == False:
			print(f"WARNING: Unused Docublock Found - {docuBlock}")
	print("----- DONE\n")

def checkMetrics():
	for filename, metric in metrics.items():
		if filename == "total":
			continue

		jekyll = metric["old"]
		hugo = metric["new"]

		#print(jekyll)
		#print(hugo)

		for element, value in jekyll.items():
			if element == "text" or element == "headers":
				continue

			if hugo[element] != value:
				print(f"[METRICS] Inconsistency in {filename}\n{element}")
				print(f"jekyll {value}")
				print(f"Hugo {hugo[element]}")
		
def migrate_media():
	print("----- MIGRATING MEDIA")
	Path(f"{NEW_TOOLCHAIN}/assets/images/").mkdir(parents=True, exist_ok=True)
	Path(f"{NEW_TOOLCHAIN}/content/images/").mkdir(parents=True, exist_ok=True)
	for root, dirs, files in os.walk(f"{OLD_TOOLCHAIN}/{version}/images", topdown=True):
		for file in files:
			shutil.copyfile(f"{root}/{file}", f"{NEW_TOOLCHAIN}/content/images/{file}")

	for root, dirs, files in os.walk(f"{OLD_TOOLCHAIN}/{version}/arangograph/images", topdown=True):
		for file in files:
			shutil.copyfile(f"{root}/{file}", f"{NEW_TOOLCHAIN}/content/images/{file}")
	print("----- DONE\n")


if __name__ == "__main__":
	print("----- STARTING MIGRATION FOR VERSION " + version)
	try:
		createStructure()
		initBlocksFileLocations()
		processFiles()
		checkUnusedDocublocks()
		checkMetrics()
		migrate_media()
	except Exception as ex:
		print(traceback.format_exc())
