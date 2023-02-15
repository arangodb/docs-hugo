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
    res = {}

    f = open(src).read()
    labels = re.findall(r"#{2} .*", f, re.MULTILINE)

    for label in labels:
        res[label] = {}

    with open(src) as f:
        currentLabel = ""

        for line in f:
            try:
                if line.startswith("###"):
                    continue

                if line.strip("\n") in res:
                    currentLabel = line.strip("\n")
                    continue

                if line == "\n":
                    continue

                parts = line.split(",")
                errorName = parts[0]
                errorCode = parts[1]
                errorMsg = parts[2]
                errorDesc = ",".join(parts[3:])

                res[currentLabel][errorName] = {
                    "errorCode": errorCode,
                    "errorMsg": errorMsg,
                    "errorDesc": errorDesc
                    }

            except Exception as ex:
                print(f"Exception in line {line}")
                print(traceback.print_exc())

    
     
    with open(dst, 'w') as convert_file:
        convert_file.write(json.dumps(res, indent=4))

if __name__ == "__main__":
    generateFile()