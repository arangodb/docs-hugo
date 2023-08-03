import re
from globals import *
import yaml

def migrateInlineDocuBlocks(block):
    processed = []

    originalBlock = block
    newBlock = {"language": "js",
                "options": {
                    "name": "",
                    "description": "",
                    "render": "input",
                    "version": version,
                    "server_name": "stable",
                    "type": "single",
                    },
                "code": "",
                }

    newBlock["options"]["name"] =  block.split("\n")[0].replace(" ", "")
    exampleType = re.search(r"@EXAMPLE_.*",  block).group(0)

    if "@EXAMPLE_ARANGOSH_OUTPUT" in exampleType:
        newBlock["options"]["render"] = "input/output"
        newBlock["options"]["name"] = re.search(r"(?<=@EXAMPLE_ARANGOSH_OUTPUT{).*(?=})", exampleType).group(0)

    elif "@EXAMPLE_AQL" in exampleType:
        newBlock["language"] = "aql"
        newBlock["options"]["render"] = "input/output"

    if "_cluster" in newBlock["options"]["name"]:
        newBlock["options"]["type"] = "cluster"
        newBlock["options"]["name"] = newBlock["options"]["name"].replace("_cluster", "")

    brief = re.search(r"@brief.*", block)
    if brief:
        newBlock["options"]["description"] = brief.group(0)

    block = re.sub(r"@EXAMPLE_.*", '', block, 0)
    datasetRe = re.search(r"@DATASET.*", block)
    if datasetRe:
        newBlock["options"]["dataset"] = datasetRe.group(0).replace("@DATASET{", "").replace("}", "")
        block = re.sub(r"@DATASET.*\n", '', block, 0)

    explainRe = re.search(r"@EXPLAIN{TRUE}.*", block)
    if explainRe:
        newBlock["options"]["explain"] = True
        block = block.replace("@EXPLAIN{TRUE}\n", "")

    bindVarsRe = re.search(r"@BV {.*}", block, re.MULTILINE | re.DOTALL)
    if bindVarsRe:
        newBlock["options"]["bindVars"] = bindVarsRe.group(0).replace("@BV ", "")
        block = re.sub(r"@BV {.*}\n", "", block, 0, re.MULTILINE | re.DOTALL)


    newBlock["code"] = "\n".join(block.split("\n")[1:]).lstrip(" ").replace("    ", "")
    if "USER_04_documentUser" in newBlock["options"]["name"]:
        newBlock["code"] = "\n~ require('@arangodb/users').save('my-user', 'my-secret-password');\n" + newBlock["code"]
    if "GRAPHSP_03_A_to_D" in newBlock["options"]["name"]:
        newBlock["code"] = "\n~ db._createEdgeCollection('edges');\n" + newBlock["code"] 
    codeblock = render_codeblock(newBlock)
    codeblock = re.sub(r"^ *\|", "", codeblock, 0, re.MULTILINE)

    ## static fixes
    codeblock = codeblock.replace("bindVars:  -", "bindVars: ")
    processed.append(block)


    return codeblock

def render_codeblock(block):
    exampleOptions = yaml.dump(block["options"], sort_keys=False, default_flow_style=False)
    exampleOptions = exampleOptions.replace("bindVars: |-", "bindVars: ")
    code = block["code"]
    indentationToRemove = len(code.split("\n")[0]) - len(code.split("\n")[0].lstrip(' '))
    code = re.sub("^ {"+str(indentationToRemove)+"}", '', code, 0, re.MULTILINE)

    res = f'\
```{block["language"]}\n\
---\n\
{exampleOptions}\
---\
{code}\
```\n\
'
    return res
