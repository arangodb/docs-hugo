import yaml
from pathlib import Path
import re
import shutil

from globals import *
import migrate_file


def migrateStructure(label, document, manual, i):
	if document is None:
		directoryTree = open(f"{OLD_TOOLCHAIN}/_data/{version}-{manual}.yml", encoding="utf-8")
		document = yaml.full_load(directoryTree)

		if manual != "manual":
			create_index("", {"text": manual.upper(), "href": "index.html"}, manual+"/", i)
			document = document[1:]

	extendedSection = ''
	if manual != "manual":
		extendedSection = manual +"/"
	print(f"extended sec {extendedSection}")
	for i, item in enumerate(document):
		print(f"item {item}")
		# Ignore external links
		if "href" in item and (item["href"].startswith("http://") or item["href"].startswith("https://")):
			continue
		if "divider" in item:
			continue

		if "subtitle" in item:
			print(f"label {label}")
			label = create_index_empty(extendedSection, {"text": item["subtitle"].lower(), "href": ""}, extendedSection, i)
			continue


		if "children" in item:
			print(f"children 1 {label}")
			label = create_index(label, item, extendedSection, i)
			print(f"children 2 {label}")
			migrateStructure(label, item["children"], extendedSection, i)
			labelSplit = label.split("/")
			label = "/".join(labelSplit[0:len(labelSplit)-1])
			print(f"children 3 {label}")
			continue
		else:
			print(f"no children 1 {label}")
			label = create_files_new(label, item, extendedSection, i)
			print(f"no children 2 {label}")

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
		"weight": 5 * i+1,
		}

	mapFiles(oldFilePath, indexPath)
	return label

def create_index_empty(label, item, extendedSection, i):
	folderName = item["text"].lower().replace(" ", "-").replace("/", "")
	label = label + "/" + folderName

	Path(migrate_file.cleanLine(f'{NEW_TOOLCHAIN}/content/{version}/{label}')).mkdir(parents=True, exist_ok=True)

	indexPath = migrate_file.cleanLine(f'{NEW_TOOLCHAIN}/content/{version}/{label}/_index.md')

	infos[indexPath] = {
		"title": f'\'{item["text"]}\'' if '@' in item["text"] else item["text"],
		"weight": 5 * i+1,
		}

	dstFile = open(indexPath, "w")
	dstFile.write("")
	dstFile.close()

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
		"weight": 5 * i+1,
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
		"weight": 5*i+1,
		}

	mapFiles(oldFilePath, filePath)

	return ''

def mapFiles(old, new):
	oldFileRE = f"(?<={version}).*"
	oldFilePath = re.search(oldFileRE, old, re.MULTILINE).group(0)
	oldFilePath = re.sub("\/{2,}", "/", oldFilePath, 0, re.MULTILINE)
	urlMap[version][oldFilePath] = new