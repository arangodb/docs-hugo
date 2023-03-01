import re
import json
import yaml
import traceback
from definitions import *
from globals import *

swaggerBaseTypes = [
    'object',
    'array',
    'number',
    'integer',
    'long',
    'float',
    'double',
    'string',
    'byte',
    'binary',
    'boolean',
    'date',
    'dateTime',
    'password',
    'int64'
]

def str_presenter(dumper, data):
    multilineRegex = re.sub(r"^\n", '', data, 0, re.MULTILINE)
    if len(multilineRegex.split('\n')) > 2:  # check for multiline string
        text_list = [line.rstrip() for line in data.splitlines()]
        fixed_data = "\n".join(text_list).lstrip("\n")
        return dumper.represent_scalar('tag:yaml.org,2002:str', fixed_data, style='|')
    data = data.strip("\n")
    return dumper.represent_scalar('tag:yaml.org,2002:str', data)

yaml.add_representer(str, str_presenter)
yaml.representer.SafeRepresenter.add_representer(str, str_presenter) # to use with safe_dum

def migrateHTTPDocuBlocks(paragraph):
    docuBlockNameRe = re.findall(r"(?<={% docublock ).*(?= %})", paragraph)
    for docuBlock in docuBlockNameRe:
        if 'errorCodes' in docuBlock:
            paragraph = paragraph.replace("{% docublock errorCodes %}", "{{< error-codes >}}")
            continue

        docuBlockFile =blocksFileLocations[docuBlock]
        tag = docuBlockFile.split("/")[len(docuBlockFile.split("/"))-2]
        try:
            docuBlockFile = open(docuBlockFile, "r", encoding="utf-8").read()
        except FileNotFoundError:
            continue
        
        declaredDocuBlocks = re.findall(r"(?<=@startDocuBlock )(.*?)@endDocuBlock", docuBlockFile, re.MULTILINE | re.DOTALL)

        for block in declaredDocuBlocks:
            if block.startswith(docuBlock):
                if docuBlock == "documentRevision":
                    revisionContent = re.search(r"(?<=documentRevision\n\n)(.*?)", block, re.MULTILINE | re.DOTALL).group(0)
                    paragraph = paragraph.replace("{% docublock "+ docuBlock + " %}", revisionContent)
                    continue

                newBlock = processHTTPDocuBlock(block, tag)

                paragraph = paragraph.replace("{% docublock "+ docuBlock + " %}", newBlock)

    paragraph = re.sub(r"```\n{3,}", "```\n\n", paragraph, 0, re.MULTILINE)

    return paragraph

def processHTTPDocuBlock(docuBlock, tag):
    blockExamples = processExamples(docuBlock)

    docuBlock = re.sub(r"@EXAMPLES.*", "", docuBlock, 0, re.MULTILINE | re.DOTALL)
    newBlock = {"openapi": "3.1.0", "paths": {}}
    url, verb, currentRetStatus = "", "", 0

    docuBlock = docuBlock + "\n"
    title = ""
    blocks = re.findall(r"@RESTHEADER{(.*?)^(?=@)", docuBlock, re.MULTILINE | re.DOTALL)
    for block in blocks:
        try:
            url, verb, title = processHeader(block, newBlock)
        except Exception as ex:
            print(f"Exception occurred for block {block}\n{ex}")
            traceback.print_exc()
            exit(1)

    blocks = re.findall(r"(?<=@RESTDESCRIPTION\n)(.*?)(?=\n@)", docuBlock, re.MULTILINE | re.DOTALL)
    for block in blocks:
        try:
            newBlock["paths"][url][verb]["description"] = block
        except Exception as ex:
            print(f"Exception occurred for block {block}\n{ex}")
            traceback.print_exc()
            exit(1)

    blocks = re.findall(r"(URLPARAM|HEADERPARAM|BODYPARAM|QUERYPARAM){(.*?)^(?=@)", docuBlock, re.MULTILINE | re.DOTALL)
    for block in blocks:
        try:
            processParameters(block, newBlock["paths"][url][verb])
        except Exception as ex:
            print(f"Exception occurred for block {block}\n{ex}")
            traceback.print_exc()
            exit(1)

    blocks = re.findall(r"@RESTRETURNCODE{(.*?)^(?=@|\n)",  docuBlock, re.MULTILINE | re.DOTALL)
    for block in blocks:
        try:
            currentRetStatus = processResponse(block, newBlock["paths"][url][verb])
        except Exception as ex:
            print(f"Exception occurred for block {block}\n{ex}")
            traceback.print_exc()
            exit(1)

    blocks = re.findall(r"@RESTREPLYBODY{(.*?)^(?=@)",  docuBlock,  re.MULTILINE | re.DOTALL)
    for block in blocks:
        try:
            processResponseBody(block, newBlock["paths"][url][verb]["responses"], currentRetStatus)
        except Exception as ex:
            print(f"Exception occurred for block {block}\n{ex}")
            traceback.print_exc()
            exit(1)

    blocks = re.findall(r"@RESTSTRUCT{(.*?)^(?=@)", docuBlock, re.MULTILINE | re.DOTALL)
    for block in blocks:
        try:
            processComponents(block)
        except Exception as ex:
            print(f"Exception occurred for block {block}\n{ex}")
            traceback.print_exc()
            exit(1)

    newBlock["paths"][url][verb]["tags"] = [tag]
    yml = render_yaml(newBlock, title)
    
    exampleCodeBlocks = ""
    if len(blockExamples) > 0:
        exampleCodeBlocks = parse_examples(blockExamples)

    return yml + "\n" + exampleCodeBlocks

### BLOCK PROCESSING    

def processExamples(docuBlock):
    examples = re.findall(r"(?<=@EXAMPLE_)(.*?)(?=@END_EXAMPLE_)", docuBlock, re.MULTILINE | re.DOTALL)
    blockExamples = []

    for block in examples:
        exampleBlock = {'options': {}, 'code': ""}
        exampleType = re.search(r"ARANGO.*(?={)", block).group(0)
        if exampleType == "ARANGOSH_RUN":
            exampleBlock["options"]["render"] = "input"
        elif exampleType == "ARANGOSH_OUTPUT":
            exampleBlock["options"]["render"] = "input/output"

        exampleName = re.search(r"(?<={).*(?=})", block).group(0)
        exampleBlock["options"]["name"] = exampleName
        exampleBlock["options"]["release"] = "stable"
        exampleBlock["options"]["version"] = version
        code = re.search(r"(?<="+exampleType+"{"+exampleName+"}\n).*", block, re.MULTILINE | re.DOTALL).group(0)
        code = code.replace("|", " ")
        exampleBlock["code"] = code

        if "logJsonResponse" in code:
            exampleBlock["options"]["render"] = "input/output"

        blockExamples.append(exampleBlock)

    return blockExamples

def processHeader(docuBlock, newBlock):
    headerRe = re.search(r".*}", docuBlock).group(0)
    headerSplit = headerRe.split(",")
    try:
        url, verb, desc = headerSplit[0].split(" ")[1], headerSplit[0].split(" ")[0].strip("{").lower(), headerSplit[1].replace("}", "")
        newBlock["paths"][url] = {verb: {"description": desc}}
        newBlock["paths"][url][verb]["operationId"] = headerSplit[2].replace("}", "").replace(" ", "")
    except IndexError:
        pass 

    return url, verb, desc

def processParameters(docuBlock, newBlock):
    paramType = docuBlock[0]

    if "BODYPARAM" in paramType:
        processRequestBody(docuBlock, newBlock)
        return

    paramBlock = {}
    
    params = docuBlock[1].split("\n")[0].strip("}")
    paramSplit = params.split(",")
    try:
        paramBlock["name"] = paramSplit[0]
        paramBlock["schema"] = {"type": paramSplit[1]}
        paramBlock["required"] = True if paramSplit[2] == "required" else False
        if paramSplit[3] != "" and not paramSplit[3] in swaggerBaseTypes:
            paramBlock["schema"] = {"$ref": f"#/components/schemas/{paramSplit[3]}" }
    except IndexError:
        pass
    
    paramBlock["description"] = "\n".join(docuBlock[1].split("\n")[1:]).replace(":", "")

    if "URLPARAM" in paramType:
        paramBlock["in"] = "path"
    elif "QUERYPARAM" in paramType:
        paramBlock["in"] = "query"
    elif "HEADERPARAM" in paramType:
        paramBlock["in"] = "header"

    if "parameters" not in newBlock:
        newBlock["parameters"] = []

    if not paramBlock in newBlock["parameters"]:
        newBlock["parameters"].append(paramBlock)

def processRequestBody(docuBlock, newBlock):
    params = docuBlock[1].split("\n")[0].strip("}")
    paramSplit = params.split(",")
    name = paramSplit[0]
    paramBlock = {}
    try:
        paramBlock["type"] = "object" if paramSplit[1] == "json" else paramSplit[1]
        if len(paramSplit) >= 4 and paramSplit[3] != "":
            if paramSplit[3] in swaggerBaseTypes:
                if paramSplit[3] != "string":
                    paramBlock["format"] = paramSplit[3]
            else:
                paramBlock["$ref"] = f"#/components/schemas/{paramSplit[3]}"

        if paramBlock["type"] == "array":
            paramBlock["items"] = {"type": paramSplit[3] if paramSplit[3] != "" else "string"}

        if "$ref" in paramBlock:
            del paramBlock["type"]

    except IndexError:
        print(f"Exception on block {block}\n")
        traceback.print_exc()
    pass
    
    paramBlock["description"] = "\n".join(docuBlock[1].split("\n")[1:])

    if name == "" and "schema" in paramBlock:
        newBlock["requestBody"]["content"] = {"application/json": {"schema": paramBlock["schema"]}}
        return

    if not "requestBody" in newBlock:
        newBlock["requestBody"] = {}

    if not "content" in newBlock["requestBody"]:
        newBlock["requestBody"]["content"] = {"application/json": {"schema": {"type": "object", "properties": {}, "required": []}}}

    newBlock["requestBody"]["content"]["application/json"]["schema"]["properties"][name] = paramBlock
    if paramSplit[2] == "required":
            newBlock["requestBody"]["content"]["application/json"]["schema"]["required"].append(name)
    return

def processResponse(docuBlock, newBlock):
    blockSplit = docuBlock.split("\n")
    statusRE = re.search(r"\d+}", docuBlock).group(0)
    description = docuBlock.replace(statusRE, "").replace(":", "")
    status = statusRE.replace("}", "")

    retBlock = {"description": description}

    if "responses" not in newBlock:
        newBlock["responses"] = {}

    newBlock["responses"][status] = retBlock
    return status

def processResponseBody(docuBlock, newBlock, statusCode):
    replyBlock = {}
    blocks = docuBlock.split("\n")
    paramSplit = blocks[0].strip("}").split(",")
    name = paramSplit[0].strip("{")
    try:
        replyBlock["type"] = "object" if paramSplit[1] == "json" else paramSplit[1]
        if paramSplit[3] != "":
            if paramSplit[3] in swaggerBaseTypes:
                if not paramSplit[3] == "string":
                    replyBlock["format"] = paramSplit[3]
            else:
                replyBlock["$ref"] = f"#/components/schemas/{paramSplit[3]}"

        if replyBlock["type"] == "array":
            replyBlock["items"] = {"type": paramSplit[3] if paramSplit[3] != "" else "string"}

        if "$ref" in replyBlock:
            del replyBlock["type"]
    except IndexError:
        print(f"Exception on block {block}\n")
        traceback.print_exc()
    
    replyBlock["description"] = "\n".join(blocks[1:])

    if name == "" and "schema" in replyBlock:
        newBlock[statusCode]["content"] = {"application/json": {"schema": replyBlock["schema"]}}
        return

    if not "content" in newBlock[statusCode]:
        newBlock[statusCode]["content"] = {"application/json": {"schema": {"type": "object", "properties": {}, "required": []}}}

    newBlock[statusCode]["content"]["application/json"]["schema"]["properties"][name] = replyBlock
    if paramSplit[2] == "required" and not name in newBlock[statusCode]["content"]["application/json"]["schema"]["required"]:
            newBlock[statusCode]["content"]["application/json"]["schema"]["required"].append(name)
    return

def processComponents(block):
    args = block.split("\n")[0].strip("}").split(",") 
    
    description = "\n".join(block.split("\n")[1:])
    structName, paramName, paramType, paramRequired, paramSubtype = args[1], args[0], args[2], args[3], args[4]
    structProperty = {
        "type": paramType,
        "description": description,
    }    

    if paramSubtype != "string":
        structProperty["format"] = paramSubtype

    if paramType == "array":
        structProperty.pop("format", None)
        key = "type"
        if not paramSubtype in swaggerBaseTypes:
            key = "$ref"
            paramSubtype = "#/components/schemas/" + paramSubtype

        structProperty["items"] = {key: paramSubtype if paramSubtype != "" else "string"}

    if structName in components["schemas"]:
        components["schemas"][structName]["properties"][paramName] = structProperty
        return

    components["schemas"][structName] = {
        "type": "object",
        "properties": {paramName: structProperty}
            }
    return

####    YAML WRITERS

def render_yaml(block, title):
    blockYaml = yaml.dump(block, sort_keys=False, default_flow_style=False)
    res = f'\
```http-spec\n\
{blockYaml}\
```'
    res = res.replace("@endDocuBlock", "")   
    #res = re.sub(r"^ *$\n", '', res, 0, re.MULTILINE | re.DOTALL)
    res = re.sub(r"\|.*", '|', res, 0, re.MULTILINE)
    return f"\n## {title}\n\n" + res

def parse_examples(blockExamples):
    res = ''
    for example in blockExamples:
        exampleOptions = yaml.dump(example["options"], sort_keys=False, default_flow_style=False)
        code = example["code"]
        indentationToRemove = len(code.split("\n")[0]) - len(code.split("\n")[0].lstrip(' '))
        code = re.sub("^ {"+str(indentationToRemove)+"}", '', code, 0, re.MULTILINE)
        
        codeBlock = f'\n\
```curl\n\
---\n\
{exampleOptions}\
---\n\
{code}\
```\n\
'
        res = res + "\n" + codeBlock
    return res


if __name__ == "__main__":
    initBlocksFileLocations()
