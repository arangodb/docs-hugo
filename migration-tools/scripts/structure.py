import yaml
from pathlib import Path
import re
import shutil

from globals import *
import migrate_file


def migrateStructure(label, document, manual):
	if document is None:
		directoryTree = open(f"{OLD_TOOLCHAIN}/_data/{version}-{manual}.yml", encoding="utf-8")
		document = yaml.full_load(directoryTree)

		if manual != "manual":
			create_index("", {"text": manual.upper(), "href": "index.html"}, manual+"/", 0)
			document = document[1:]

	extendedSection = ''
	if manual != "manual":
		extendedSection = manual +"/"

	for i, item in enumerate(document):
		# Ignore external links
		if "href" in item and (item["href"].startswith("http://") or item["href"].startswith("https://")):
			continue

		if "subtitle" in item or "divider" in item:
			continue

		if "children" in item:
			label = create_index(label, item, extendedSection, i)
			
			migrateStructure(label, item["children"], extendedSection)
			labelSplit = label.split("/")
			label = "/".join(labelSplit[0:len(labelSplit)-1])
			continue
		else:
			label = create_files_new(label, item, extendedSection, i)


def create_index(label, item, extendedSection, i):
	oldFileName = item["href"].replace(".html", ".md")
	folderName = item["text"].lower().replace(" ", "-").replace("/", "")
	label = label + "/" + folderName

	Path(migrate_file.cleanLine(f'{NEW_TOOLCHAIN}/content/{version}/{label}')).mkdir(parents=True, exist_ok=True)

	indexPath = migrate_file.cleanLine(f'{NEW_TOOLCHAIN}/content/{version}/{label}/_index.md')
	oldFilePath = f'{OLD_TOOLCHAIN}/{version}/{extendedSection}{oldFileName}'
	shutil.copyfile(oldFilePath, indexPath)
	infos[indexPath] = {
		"title": f'\'{item["text"]}\'' if '@' in item["text"] else item["text"],
		"weight": 5 * i,
		}

	mapFiles(oldFilePath, indexPath)
	return label

def create_files_new(label, item, extendedSection, i):
	oldFileName = item["href"].replace(".html", ".md")
	oldFilePath = f'{OLD_TOOLCHAIN}/{version}/{extendedSection}{oldFileName}'.replace("//", "/")
	if label == '':
		return create_file_no_label(item, extendedSection, i)

	filePath = migrate_file.cleanLine(f'{NEW_TOOLCHAIN}/content/{version}/{label}/{oldFileName}')

	try:
		shutil.copyfile(oldFilePath, filePath)
	except FileNotFoundError:
		print(f"WARNING! FILE NOT FOUND IN OLD TOOLCHAIN {oldFilePath}")
		
	infos[filePath]  = {
		"title": f'\'{item["text"]}\'' if '@' in item["text"] else item["text"],
		"weight": 5 * i,
		}

	mapFiles(oldFilePath, filePath)

	return label

# To handle analyzers.md etc. case that are root-level pages
def create_file_no_label(item, extendedSection, i):
	oldFileName = item["href"].replace(".html", ".md")
	oldFilePath = f'{OLD_TOOLCHAIN}/{version}/{extendedSection}{oldFileName}'.replace("//", "/")

	label = oldFileName.replace(".md", "")
	Path(migrate_file.cleanLine(f'{NEW_TOOLCHAIN}/content/{version}/{label}')).mkdir(parents=True, exist_ok=True)

	filePath = migrate_file.cleanLine(f'{NEW_TOOLCHAIN}/content/{version}/{label}/_index.md')

	try:
		shutil.copyfile(oldFilePath, filePath)
	except FileNotFoundError:
		print(f"WARNING! FILE NOT FOUND IN OLD TOOLCHAIN {oldFilePath}")
		
	infos[filePath]  = {
		"title": f'\'{item["text"]}\'' if '@' in item["text"] else item["text"],
		"weight": 5*i,
		}

	mapFiles(oldFilePath, filePath)

	return ''

def mapFiles(old, new):
	oldFileRE = f"(?<={version}).*"
	oldFilePath = re.search(oldFileRE, old, re.MULTILINE).group(0)
	oldFilePath = re.sub("\/{2,}", "/", oldFilePath, 0, re.MULTILINE)
	urlMap[version][oldFilePath] = new