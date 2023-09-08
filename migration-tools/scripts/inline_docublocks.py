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
                    },
                "code": "",
                }

    newBlock["options"]["name"] =  block.split("\n")[0].replace(" ", "")
    exampleType = re.search(r"@EXAMPLE_.*",  block).group(0)

    if "@EXAMPLE_ARANGOSH_OUTPUT" in exampleType:
        newBlock["options"]["name"] = re.search(r"(?<=@EXAMPLE_ARANGOSH_OUTPUT\{).*(?=\})", exampleType).group(0)

    elif "@EXAMPLE_AQL" in exampleType:
        newBlock["language"] = "aql"

    if "_cluster" in newBlock["options"]["name"]:
        newBlock["options"]["type"] = "cluster"
        newBlock["options"]["name"] = newBlock["options"]["name"].replace("_cluster", "")

    brief = re.search(r"@brief.*", block)
    if brief:
        newBlock["options"]["description"] = brief.group(0)

    block = re.sub(r" *@EXAMPLE_.*\n", '', block)

    datasetRe = re.search(r"@DATASET.*", block)
    if datasetRe:
        newBlock["options"]["dataset"] = datasetRe.group(0).replace("@DATASET{", "").replace("}", "")
        block = re.sub(r" *@DATASET.*\n", '', block)

    explainRe = re.search(r"@EXPLAIN\{TRUE\}.*", block)
    if explainRe:
        newBlock["options"]["explain"] = True
        block = re.sub(r" *@EXPLAIN\{TRUE\}.*\n", "", block)

    # The greedy matching could erroneously select the closing bracket of an
    # AQL object literal, but in the current content, @BV always comes after the query
    bindVarsRe = re.search(r"( *)@BV (\{.*\})\n", block, re.MULTILINE | re.DOTALL)
    if bindVarsRe:
        indentationToRemove = len(bindVarsRe.group(1))
        newBlock["options"]["bindVars"] = re.sub("^ {0,"+str(indentationToRemove)+"}", "", bindVarsRe.group(2), 0, re.MULTILINE)
        block = re.sub(r" *@BV \{.*\}\n", "", block, 0, re.MULTILINE | re.DOTALL)

    newBlock["code"] = block.partition("\n")[2] # Example name on first line
    codeblock = render_codeblock(newBlock)

    ## static fixes
    codeblock = codeblock.replace("bindVars:  -", "bindVars: ")
    processed.append(block)


    return codeblock

def render_codeblock(block):
    exampleOptions = yaml.dump(block["options"], sort_keys=False, default_flow_style=False)
    exampleOptions = exampleOptions.replace("bindVars: |-", "bindVars: ")
    code = block["code"]
    code = re.sub(r"^( *)\|", "\\1 ", code, 0, re.MULTILINE)
    firstLine = code.partition("\n")[0]
    indentationToRemove = len(firstLine) - len(firstLine.lstrip(' '))
    code = re.sub("^ {0,"+str(indentationToRemove)+"}", '', code, 0, re.MULTILINE)

    res = f'\
```{block["language"]}\n\
---\n\
{exampleOptions}\
---\n\
{code}\
```\n\
'
    return res
