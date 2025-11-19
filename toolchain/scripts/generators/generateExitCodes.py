import argparse
import re
import traceback

parser = argparse.ArgumentParser(description='Convert ArangoDB exit codes file to YAML')
parser.add_argument('--src', type=str, required=True,
                    help='Input file path (exitcodes.dat)')
parser.add_argument('--dst', type=str, required=True,
                    help='Output file path (exitcodes.yaml)')
args = parser.parse_args()

# Handle Windows and trailing path separators
src = args.src.replace("\\", "/").rstrip("/")
dst = args.dst.replace("\\", "/").rstrip("/")

def generateFile():
    content = ""

    try:
        f = open(src)
        content = f.read()
    except Exception as ex:
        print(f"Exception opening file {src}")
        print(traceback.print_exc())
        raise ex

    dstFile = open(dst, 'w')

    with open(src) as f:
        group = ""
        groupHasEntry = False
        for line in f:
            try:
                # Skip header and empty lines
                if line.startswith("##") or line == "\n":
                    continue

                if line.startswith("# "):
                    group = line.replace("#", "").strip().capitalize()
                    # Delay writing the group until an entry is found
                    groupHasEntry = False
                    continue

                # Skip commented out rows
                if line.startswith("#"):
                    continue

                regex = re.search(r"^(.+?),(\d+?),\"(.+?)\",\"(.+)\"$", line)
                (name, code, text, desc) = regex.groups()
                code = int(code)
                if not group:
                    raise Exception("Found entry before first group")
                if not groupHasEntry:
                    dstFile.write(f"- group: {group}\n")
                    groupHasEntry = True
                dstFile.write(f"- name: {name}\n  text: {text}\n  desc: {desc}\n  code: {code}\n")

            except Exception as ex:
                #print(f"Exception in line {line}")
                raise ex

    dstFile.close()

if __name__ == "__main__":
    generateFile()

