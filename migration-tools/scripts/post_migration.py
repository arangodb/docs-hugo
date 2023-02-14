import argparse
import os

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



filepaths = []

def postMigration():
    loadFilepaths()
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

            content = restructureLinks(content, filepath)

            file = open(filepath, "w", encoding="utf-8")
            file.write(content)
            file.close()

def loadFilepaths():
    for root, dirs, files in os.walk(f"{NEW_TOOLCHAIN}/content/{version}", topdown=True):
        for file in files:
            filepath = f"{root}/{file}".replace("\\", "/")
            filepaths.append(filepath)
    return

def restructureLinks(content, filepath):
    linkContent = href.replace(")", "")
    filename = re.search(".*\.html", linkContent, re.MULTILINE)
    if not filename:
        return paragraph

    filename = filename.group(0).replace(".html", ".md").replace("..", "")
    fragment = re.search(r"#+.*", linkContent)
    newLink = ""
    for k in filepaths:
        match = re.search(filename + "$", k, re.MULTILINE)
        if match:
            newLink = os.path.relpath(k, filepath).replace("../", "", 1)

    content = content.replace(linkContent, newLink)
    return content

    

if __name__ == "__main__":
    try:
        postMigration()
    except Exception as ex:
        print(ex)