import argparse
import re
import json
import traceback

parser = argparse.ArgumentParser(description='Optional app description')
parser.add_argument('--src', type=str,
                    help='errors.dat file path')
parser.add_argument('--dst', type=str,
                    help='errors.yaml file path')
args = parser.parse_args()

if args.src is None or args.dst is None:
	print("Args are required")
	exit(1)

# Handle Windows and trailing path separators
src = args.src.replace("\\", "/").rstrip("/")
dst = args.dst.replace("\\", "/").rstrip("/")

def generateFile():
    groups = []
    content = ""

    try:
        f = open(src)
        content = f.read()
    except Exception as ex:
        print(f"Exception opening file {src}")
        print(traceback.print_exc())
        raise ex

    labels = re.findall(r"#{3,}\n#{2} .*", content, re.MULTILINE)

    for label in labels:
        label = label.replace("#", "").replace("\n", "").lstrip(" ")
        groups.append(label)

    dstFile = open(dst, 'w')

    with open(src) as f:
        for line in f:
            try:
                if line.startswith("###") or line == "\n":
                    continue

                if line.startswith("## "):
                    group = line.replace("#", "").replace("\n", "").lstrip(" ")
                    if group in groups:
                        dstFile.write(f"- group: {group}\n")

                    continue

                parts = line.split(",")

                regex = re.search(r"(\".*\"),(.+)$", line, re.MULTILINE)
                errorDesc = regex.group(2).replace("\",", "\"")
                dstFile.write(f"- name: {parts[0]}\n  text: {regex.group(1)}\n  desc: {errorDesc}\n  code: {parts[1]}\n")

            except Exception as ex:
                #print(f"Exception in line {line}")
                raise ex

    dstFile.close()

if __name__ == "__main__":
    generateFile()