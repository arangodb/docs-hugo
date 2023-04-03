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

    newBlock["options"]["release"] = "stable"

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
        newBlock["options"]["explain"] = "true"
        block = block.replace("@EXPLAIN{TRUE}\n", "")

    bindVarsRe = re.search(r"@BV {.*}", block, re.MULTILINE | re.DOTALL)
    if bindVarsRe:
        newBlock["options"]["bindVars"] = bindVarsRe.group(0).replace("@BV ", "")
        block = re.sub(r"@BV {.*}\n", "", block, 0, re.MULTILINE | re.DOTALL)

    
    newBlock["code"] = "\n".join(block.split("\n")[1:]).lstrip(" ").replace("    ", "")
    codeblock = render_codeblock(newBlock)
    codeblock = codeblock.replace("|", " ")

    ## static fixes
    codeblock = codeblock.replace("bindVars:  -", "bindVars: ")
    processed.append(block)


    return codeblock

def render_codeblock(block):
    exampleOptions = yaml.dump(block["options"], sort_keys=False, default_flow_style=False)
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
