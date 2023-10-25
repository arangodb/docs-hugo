import argparse
import os
import traceback
import string
import re


parser = argparse.ArgumentParser(description='Optional app description')
parser.add_argument('--src', type=str,
                    help='docs/ folder')
parser.add_argument('--dst', type=str,
                    help='api-docs.json file destination')
args = parser.parse_args()

if args.src is None or args.dst is None:
    print("Args are required")
    exit(1)

src = args.src
dst = args.dst

params = {"currentSection": "topLevel", "topLevel": {"weight": 0}}



TITLE_CASE = {
    'apikey': 'API Key',
    'apikeys': 'API Keys',
    'auditlog': 'Audit Log',
    'auditlogs': 'Audit Logs',
    'cacertificate': 'CA Certificate',
    'cacertificates': 'CA Certificates',
    'diskperformances': 'Disk Performances',
    'ipallowlist': 'IP Allowlist',
    'ipallowlists': 'IP Allowlists',
    'notebookmodels': 'Notebook Models',
    'tandc': 'Terms & Conditions',
    'arangodb': 'ArangoDB',
    'cpusizes': 'CPU Sizes',
    'nodesizes': 'Node Sizes'
}


def main():
    for root, dirs, files in os.walk(src, topdown=True):
        filenames = sorted(files)
        params["filenames"] = filenames

        for file in filenames:
            processFile(f"{root}/{file}".replace("\\", "/"), file, params)

def processFile(filepath, filename, params):
    data = read_file(filepath)

    content = ""

    filename, section = create_filename(filename)

    if not section in params:
        params[section] = {"weight": 0}

    if section != params["currentSection"]:
        params["currentSection"] = section
        
    params[section]["weight"] = params[section]["weight"] + 5

    content = rewrite_content(data, section, filename)

    os.makedirs(os.path.dirname(filename), exist_ok=True)
    with open(filename, "w") as f:
        f.write(content)


def read_file(filepath):
    try:
        file = open(filepath, "r", encoding="utf-8")
        data = file.readlines()
        file.close()
        return data
    except Exception as ex:
        print(f"Error reading file {filepath}")
        print(traceback.format_exc())
        raise ex
    

def create_filename(filename):
    if filename == "oasisctl.md":
        return f"{dst}/options.md", "topLevel"

    section = filename.split("_")[1].replace(".md", "")
    newFilename = filename.replace("oasisctl_", "").replace("_", "-")


    if sum(f"oasisctl_{section}" in s for s in params["filenames"]) > 1:

        newFilename = f"{dst}{section}/{newFilename}"
        if len(filename.split("_")) == 2:
            newFilename = f'{dst}{section}/_index.md'

        return newFilename, section

    newFilename = f"{dst}/{newFilename}"
    
    return newFilename, "topLevel"

def rewrite_content(data, section, filename):
    title = ""
    content = ""
    flags = {"inFrontMatter": False, "endFrontMatter": False, "inHeader": False, "firstHeaderContent": False}

    for i, line in enumerate(data):

        if line == "\n":
            if flags["firstHeaderContent"]:
                continue

            content = content + line
            continue

        if "description: " in line and "/options.md" in filename:
            content = content + "description: Command-line client tool for managing ArangoGraph\n"
            continue

        if "layout: "in line:
            content = content + line.replace("layout: ", "archetype: ")
            continue


        if "title: " in line:
            if "/options.md" in filename:
                content = content + f"title: ArangoGraph Shell oasisctl\nmenuTitle: Options\nweight: {params[section]['weight']}\n"
                continue

            menuTitle = ""
            lineWords = line.replace("title: ", "").split(" ")
            title = " ".join(lineWords)
            for word in lineWords:
                if word.lower() in TITLE_CASE:
                    menuTitle = menuTitle + f" {TITLE_CASE[word.lower()]}"
                    continue

                menuTitle = menuTitle + f" {word}"

            menuTitle = menuTitle.replace("Oasisctl ", "")
            content = content + f"{line}menuTitle:{menuTitle}weight: {params[section]['weight']}\n"
            continue

            
        if line.startswith("###### Auto generated"):
            continue

        if "### SEE ALSO" in line:
            content = content + "## See also"
            continue


        if line.startswith("#"):
            header = line.replace("#", "").replace(" ", "", 1)
            if header.lower() == title.lower():
                flags["firstHeaderContent"] = True
                continue

            flags["firstHeaderContent"] = False

            if line.startswith("### "):
                line = line.replace("#", "", 1)
                content = content + string.capwords(line)
                continue

            if line.startswith("## "):
                content = content + string.capwords(line)
                continue

        if line == "---":
            content = content + line
            flags["inFrontMatter"] = not flags["inFrontMatter"]
            if not flags["inFrontMatter"]:
                flags["endFrontMatter"] = True
            continue

        if re.search(r"\[.*\]\(.*\)", line, re.MULTILINE):
            line = adjustLink(line, filename)
            content = content + line
            continue


        if flags["firstHeaderContent"]:
            continue

        content = content + line
        continue

    return content


def adjustLink(line, filename):
    link = re.search(r"(?<=\().*(?=\))", line).group(0)
    newLink = link.replace("oasisctl-", "")

    if newLink.replace(".html", "") == params["currentSection"]:
        line = line.replace(link, "_index.md")
        return line

    if newLink == "oasisctl.html":
        newLink = newLink.replace("oasisctl.html", "options.md")
        if params["currentSection"] != "topLevel":
            newLink = "../"+newLink
        
        line = line.replace(link, newLink)
        return line

    if "/options.md" in filename:
        if sum(f"oasisctl_{newLink.replace('.html', '')}" in s for s in params["filenames"]) > 1:
            newLink = f"{newLink.replace('.html', '')}/_index.md"

    line = line.replace(link, newLink.replace(".html", ".md"))
        
    return line



if __name__ == "__main__":
    main()

