import yaml
from pathlib import Path
import re
import shutil
from automata import cleanLine

from globals import *


def migrateStructure(label, document, manual, i):
	if document is None:
		directoryTree = open(f"{OLD_TOOLCHAIN}/_data/{version}-{manual}.yml", encoding="utf-8")
		document = yaml.full_load(directoryTree)

		if manual != "manual":
			print(f"Processing {manual}")
			title = getManualTitle(manual)
			create_index("", {"text": title, "href": "index.html"}, manual+"/", i)
			document = document[1:]

	extendedSection = ''
	if manual != "manual":
		extendedSection = manual +"/"

	for i, item in enumerate(document):

		# Ignore external links
		if "href" in item and (item["href"].startswith("http://") or item["href"].startswith("https://")):
			continue

		if "divider" in item:
			label = extendedSection
			continue

		if "subtitle" in item:
			if manual == "arangograph":
				continue
			
			subtitle = item["subtitle"].title()
			print(f"{manual} - {subtitle}")
			label = create_index_empty(extendedSection, {"text": subtitle, "href": ""}, extendedSection, i)
			continue


		if "children" in item:
			label = create_index(label, item, extendedSection, i)

			migrateStructure(label, item["children"], extendedSection, i)
			labelSplit = label.split("/")
			label = "/".join(labelSplit[0:len(labelSplit)-1])
			continue
		else:
			label = create_files_new(label, item, extendedSection, i)

def create_index(label, item, extendedSection, i):
	oldFileName = item["href"].replace(".html", ".md")
	folderName = item["text"].lower().replace(" ", "-").replace("/", "")
	label = label + "/" + folderName

	# if label in hardcodedActions:
	# 	if hardcodedActions[label]["action"] == "move-inside":
	# 		label = hardcodedActions[label]["target"] + "/" + label

	Path(cleanLine(f'{NEW_TOOLCHAIN}/content/{version}/{label}')).mkdir(parents=True, exist_ok=True)

	indexPath = cleanLine(f'{NEW_TOOLCHAIN}/content/{version}/{label}/_index.md')
	oldFilePath = f'{OLD_TOOLCHAIN}/{version}/{extendedSection}{oldFileName}'
	shutil.copyfile(oldFilePath, indexPath)

	infos[indexPath] = {
		"title": f'\'{item["text"]}\'' if '@' in item["text"] else item["text"],
		"menuTitle": f'\'{item["text"]}\'' if '@' in item["text"] else item["text"],
		"weight": 5 * i+5
		}

	# if label in hardcodedActions:
	# 	if hardcodedActions[label]["action"] == "move-after":
	# 		infos[indexPath]["weight"] = infos[hardcodedActions[label]["target"]] + 5


	mapFiles(oldFilePath, indexPath)
	return label

def create_index_empty(label, item, extendedSection, i):
	folderName = item["text"].lower().replace(" ", "-").replace("/", "")
	label = label + "/" + folderName

	# if label in hardcodedActions:
	# 	if hardcodedActions[label]["action"] == "move-inside":
	# 		label = hardcodedActions[label]["target"] + "/" + label

	Path(cleanLine(f'{NEW_TOOLCHAIN}/content/{version}/{label}')).mkdir(parents=True, exist_ok=True)

	indexPath = cleanLine(f'{NEW_TOOLCHAIN}/content/{version}/{label}/_index.md')

	infos[indexPath] = {
		"title": f'\'{item["text"]}\'' if '@' in item["text"] else item["text"],
		"menuTitle": f'\'{item["text"]}\'' if '@' in item["text"] else item["text"],
		"weight": 5 * i+5,
		}

	# if label in hardcodedActions:
	# 	if hardcodedActions[label]["action"] == "move-after":
	# 		infos[indexPath]["weight"] = infos[hardcodedActions[label]["target"]] + 5

	dstFile = open(indexPath, "w")
	dstFile.write("")
	dstFile.close()

	return label

def create_files_new(label, item, extendedSection, i):
	oldFileName = item["href"].replace(".html", ".md")
	oldFilePath = f'{OLD_TOOLCHAIN}/{version}/{extendedSection}{oldFileName}'.replace("//", "/")
	if label == '':
		return create_file_no_label(item, extendedSection, i)

	newFilename = item["text"].replace(".NET", "dotnet").replace(".", "-").lower()
	newFilename = "-".join(newFilename.split(" ")) + ".md"

	newFilename = re.sub(r"<code>|<\/code>|@\w+\/", "", newFilename, 0, re.MULTILINE).replace("/", "-").replace("@", "")

	filePath = cleanLine(f'{NEW_TOOLCHAIN}/content/{version}/{label}/{newFilename}')

	try:
		shutil.copyfile(oldFilePath, filePath)
	except FileNotFoundError:
		print(f"WARNING! FILE NOT FOUND IN OLD TOOLCHAIN {oldFilePath}")
		
	infos[filePath]  = {
		"title": f'\'{item["text"]}\'' if '@' in item["text"] else item["text"],
		"menuTitle": f'\'{item["text"]}\'' if '@' in item["text"] else item["text"],
		"weight": 5 * i+5,
		}

	mapFiles(oldFilePath, filePath)

	return label

# To handle analyzers.md etc. case that are root-level pages
def create_file_no_label(item, extendedSection, i):
	oldFileName = item["href"].replace(".html", ".md")
	oldFilePath = f'{OLD_TOOLCHAIN}/{version}/{extendedSection}{oldFileName}'.replace("//", "/")

	label = oldFileName.replace(".md", "")
	Path(cleanLine(f'{NEW_TOOLCHAIN}/content/{version}/{label}')).mkdir(parents=True, exist_ok=True)

	filePath = cleanLine(f'{NEW_TOOLCHAIN}/content/{version}/{label}/_index.md')

	try:
		shutil.copyfile(oldFilePath, filePath)
	except FileNotFoundError:
		print(f"WARNING! FILE NOT FOUND IN OLD TOOLCHAIN {oldFilePath}")
		
	infos[filePath]  = {
		"title": f'\'{item["text"]}\'' if '@' in item["text"] else item["text"],
		"menuTitle": f'\'{item["text"]}\'' if '@' in item["text"] else item["text"],
		"weight": 5*i+5,
		}

	mapFiles(oldFilePath, filePath)

	return ''

def mapFiles(old, new):
	oldFileRE = f"(?<={version}).*"
	oldFilePath = re.search(oldFileRE, old, re.MULTILINE).group(0)
	oldFilePath = re.sub("\/{2,}", "/", oldFilePath, 0, re.MULTILINE)
	urlMap[version][oldFilePath] = new

def getManualTitle(manual):
	if manual == "arangograph":
		return "ArangoGraph"
	elif manual == "aql":
		return "AQL"
	elif manual == "http":
		return "HTTP"
	elif manual == "drivers":
		return "Drivers"
	else:
		return ""
