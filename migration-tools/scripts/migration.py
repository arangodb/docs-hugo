import yaml
import os
import re
from pathlib import Path
import shutil
import time
import traceback
import argparse

# migration modules
from globals import *
import migrate_file
import structure
from definitions import *


def createStructure():
	print("----- CREATING FOLDERS STRUCTURE")
	structure.migrateStructure('', None, "manual")
	structure.migrateStructure('http', None, "http")
	structure.migrateStructure('arangograph', None, "arangograph")
	structure.migrateStructure('aql', None, "aql")
	structure.migrateStructure('drivers', None, "drivers")
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

			blocksFileLocations[blockName] = fileLocation
	components["schemas"] = definitions
	print("----- DONE\n")
    
def processFiles():
	print(f"----- STARTING CONTENT MIGRATION")
	for root, dirs, files in os.walk(f"{NEW_TOOLCHAIN}/content/{version}", topdown=True):
		for file in files:
			migrate_file.migrate(f"{root}/{file}".replace("\\", "/"))
	print("------ DONE\n")

def writeOpenapiComponents():
	print(f"----- SAVING OPENAPI DEFINITIONS ON FILE")
	with open(OAPI_COMPONENTS_FILE, 'w', encoding="utf-8") as outfile:
		yaml.dump(components, outfile, sort_keys=False, default_flow_style=False)
	print("----- DONE\n")

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
		writeOpenapiComponents()
		migrate_media()
	except Exception as ex:
		print(traceback.format_exc())
