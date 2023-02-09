import os
import json

structure = {"3.10": {}, "3.11": {}}
file = open('3_10.txt', 'r')
lines = file.readlines()

for line in lines:
    line = line.strip("\n")
    for root, dirs, files in os.walk(f"/home/dan/work/projects/arangodb-docs-fork/arangodb-docs-alpha/site/content/3.10", topdown=True):
        for file in files:
            if file == line:
                structure["3.10"][line] = {"path": f"{root}/{file}", "weight": 0}

file = open('3_11.txt', 'r')
lines = file.readlines()

for line in lines:
    line = line.strip("\n")
    for root, dirs, files in os.walk(f"/home/dan/work/projects/arangodb-docs-fork/arangodb-docs-alpha/site/content/3.11", topdown=True):
        for file in files:
            if file == line:
                structure["3.11"][line] = {"path": f"{root}/{file}", "weight": 0}


file = open("content-structure.json", "w")
file.write(json.dumps(structure, indent=4, sort_keys=True))
file.close()