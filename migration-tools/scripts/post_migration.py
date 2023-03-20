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
    hrefRegex = re.findall(r"\[([^\]]+)\]\(([^)]+)\)({.*})*", paragraph)
    for href in hrefRegex:
        title = href[0]
        content = href[1]

        if len(href) == 3:
            style = href[2]

        if re.search(r"http[s]*://|,", content):
            continue

        if re.search(r".png|.jpg|.jpeg", content):
            paragraph = migrate_image(filepath, paragraph, href)
            continue
        
        paragraph = restructureLinks(paragraph, filepath, title, content)

    return paragraph

def migrate_image(currentFile, paragraph, href):
    label = href[0]
    linkContent = href[1]
    imgName = linkContent.split("/")[len(linkContent.split("/"))-1]
    imagesFolder = f"{NEW_TOOLCHAIN}/content/images/"
    relPathToImgsFolder = os.path.relpath(imagesFolder, currentFile).replace("../", "", 1)
    newImgName = f"{relPathToImgsFolder}/{imgName}"

    if href[2] != "":
        style = href[2]
        paragraph = paragraph.replace(style, "")
        style = style.replace("{:style=", "").replace("}", "")
        imgWidget = '{{{{< icon src="{}" alt="{}" style={}>}}}}'.format(newImgName, label, style)
        paragraph = paragraph.replace(f"![{label}]", "").replace(f"({linkContent})", imgWidget)
        
        return paragraph
    else:
        return paragraph.replace(linkContent, newImgName)

def restructureLinks(content, filepath, title, linkContent):
    print("")
    print(f"file {filepath}")
    print(f"linkContent {linkContent}")
    filename = "/" + linkContent.replace(".html", ".md").replace("..", "")
    filename = re.sub("\/{2,}", "/", filename, 0, re.MULTILINE)
    fragment = re.search(r"#+.*", filename)
    if fragment:
        filename = filename.replace(fragment.group(0), "")
    print(f"filename {filename}")
    if filename == "/": ## Link contains only fragment in same page
        return content

    if filename.endswith("/"):
        filename = filename + "index.md"
    print(f"filename 2 {filename}")
    linkPath = findFileFromLink(filename)
    print(f"linkPath {linkPath}")
    if linkPath == "":
        print(f"link {filename} not found in {filepath}")
        return content

    newLink = os.path.relpath(linkPath, filepath)
    if fragment:
        newLink = newLink + fragment.group(0)

    print(f"newLink {newLink}")
    newLink = newLink.replace("../", "", 1)
    oldLink = f"[{title}]({linkContent})"
    newLink = f"[{title}]({newLink})"
    content = content.replace(oldLink, newLink)
    return content

def findFileFromLink(link):
    try:
        f = urlMap[link]
        print(f"find f {f}")
        return f
    except KeyError as ex:
        pass

    ## necessary step if the link just refers to a page locally, but the urlMap is made of relPath links from site/version/
    steps = len(link.split("/"))
    for k in urlMap.keys():
        steppedK = "/" + "/".join(k.split("/")[steps:])
        if steppedK == link:
            print(f"found steppedK {steppedK}")
            x = urlMap[k]
            print(f"from steppedK {x}")
            return x

    return ""

    

if __name__ == "__main__":
    try:
        postMigration()
    except Exception as ex:
        traceback.print_exc()