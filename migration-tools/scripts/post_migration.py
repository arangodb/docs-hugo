import argparse
import os
import re
import traceback
import json

parser = argparse.ArgumentParser(description='Optional app description')
parser.add_argument('--dst', type=str,
                    help='New toolchain path docs folder included')
parser.add_argument('--version', type=str,
                    help='Version to migrate')
args = parser.parse_args()

if args.dst is None:
	print("Args are required")
	exit(1)

# Handle Windows and trailing path separators
dst = args.dst.replace("\\", "/").rstrip("/")
version = args.version.replace("\\", "/").rstrip("/")
NEW_TOOLCHAIN = f"{dst}/site"

def postMigration():
    for root, dirs, files in os.walk(f"{NEW_TOOLCHAIN}/content/{version}", topdown=True):
        for file in files:
            filepath = f"{root}/{file}".replace("\\", "/")
            try:
                file = open(filepath, "r", encoding="utf-8")
                content = file.read()
                file.close()
            except Exception as ex:
                print(traceback.format_exc())
                raise ex

            content = migrate_hrefs(content, filepath)

            file = open(filepath, "w", encoding="utf-8")
            file.write(content)
            file.close()

def loadUrlsMap():
    with open('urls.json') as json_file:
        urls = json.load(json_file)
    return urls[version]

urlMap = loadUrlsMap()

def migrate_hrefs(paragraph, filepath):
    hrefRegex = re.findall(r"\[([^\]]+)\]\(([^)]+)\)", paragraph)
    for href in hrefRegex:
        title = href[0]
        content = href[1]
        if re.search(r"http[s]*://|,", content):
            continue

        if re.search(r".png|.jpg|.jpeg", content):
            #paragraph = migrate_image(filepath, paragraph, title, content)
            continue
        paragraph = restructureLinks(paragraph, filepath, title, content)

    return paragraph

def migrate_image(currentFile, paragraph, label, linkContent):
    imgName = linkContent.split("/")[len(linkContent.split("/"))-1]
    imagesFolder = f"{NEW_TOOLCHAIN}/content/images/"
    relPathToImgsFolder = os.path.relpath(imagesFolder, currentFile)
    newImgName = f"{relPathToImgsFolder}/{imgName}"

    if ':style' in href:
        styleRegex = re.search(r"(?<={:style=).*(?=})", href)
        if styleRegex:
            imgWidget = '{{{{< icon src="{}" alt="{}" style={}>}}}}'.format(newImgName, label, styleRegex.group(0))

            return paragraph.replace(href, imgWidget)
    else:
        newImg = href.replace(linkContent, newImgName)
        return paragraph.replace(href, newImg)

def restructureLinks(content, filepath, title, linkContent):
    filename = "/" + linkContent.replace(".html", ".md").replace("..", "")
    filename = re.sub("\/{2,}", "/", filename, 0, re.MULTILINE)
    fragment = re.search(r"#+.*", filename)
    if fragment:
        filename = filename.replace(fragment.group(0), "")

    if filename == "/": ## Link contains only fragment in same page
        return content

    if filename.endswith("/"):
        filename = filename + "index.md"

    linkPath = findFileFromLink(filename)
    if linkPath == "":
        print(f"non trovato {filename} in {filepath}")
        return content

    newLink = os.path.relpath(linkPath, filepath)
    if fragment:
        newLink = newLink + fragment.group(0)
    newLink = newLink.replace("../", "", 1).replace(".md", "")
    content = content.replace(linkContent, newLink)
    return content

def findFileFromLink(link):
    try:
        f = urlMap[link]
        return f
    except KeyError as ex:
        pass

    ## necessary step if the link just refers to a page locally, but the urlMap is made of relPath links from site/version/
    steps = len(link.split("/"))
    for k in urlMap.keys():
        steppedK = "/" + "/".join(k.split("/")[steps:])
        if steppedK == link:
            return urlMap[k]

    return ""

    

if __name__ == "__main__":
    try:
        postMigration()
    except Exception as ex:
        traceback.print_exc()