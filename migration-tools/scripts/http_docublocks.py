import re
import json
import yaml
import traceback
from definitions import *
from globals import *
from pathlib import Path

from functools import reduce  # forward compatibility for Python 3
import operator


swaggerBaseTypes = [
    '',
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
    'int64',
    'date-time'
]

def str_presenter(dumper, data):
    multilineRegex = re.sub(r"^\n", '', data, 0, re.MULTILINE)
    if len(multilineRegex.split('\n')) > 1:  # check for multiline string
        text_list = [line.rstrip() for line in data.splitlines()]
        fixed_data = "\n".join(text_list).strip("\n")
        return dumper.represent_scalar('tag:yaml.org,2002:str', fixed_data, style='|')
    data = data.strip("\n")
    return dumper.represent_scalar('tag:yaml.org,2002:str', data)

yaml.add_representer(str, str_presenter)
yaml.representer.SafeRepresenter.add_representer(str, str_presenter) # to use with safe_dum
yaml.Dumper.ignore_aliases = lambda *args : True

def createComponentsIn1StructsFile():
    for p in Path(f"{ARANGO_MAIN}/Documentation/DocuBlocks/Rest").rglob("1_struct*.md"):
        print(f"1 struct {p}")
        try:
            f = open(str(p), "r", encoding="utf-8").readlines()
        except FileNotFoundError as ex:
            raise ex

        buffer = []
        for line in f:
            if line == "\n" and len(buffer) == 0:
                continue

            if line.startswith("@RESTSTRUCT"):       ## a new struct is beginning, process the buffer of the previous struct and start a new buffer
                if len(buffer) == 0:                 ## case i=0 starting the file, the buffer is empty so we fill it with the new struct incoming
                    buffer = [line]
                    continue

                processComponents("".join(buffer))
                buffer = [line]
                continue

            buffer.append(line)                     ## append the description line to the current struct buffer

        processComponents("\n".join(buffer))        ## this will process the last struct in the file with remaining strings in the buffer

    explodeNestedStructs(components, "$ref", "")



def getFromDict(dataDict, mapList):
    return reduce(operator.getitem, mapList, dataDict)

def setInDict(dataDict, mapList, value):
    mapList = mapList.split("/")[1:]
    getFromDict(dataDict, mapList[:-1])[mapList[-1]] = value

def delFromDict(dataDict, mapList):
    mapList = mapList.split("/")[1:]
    del getFromDict(dataDict, mapList[:-1])[mapList[-1]]

def explodeNestedStructs(data, target, k):
    for key, value in data.items():
        if not target in value:
            if isinstance(value, dict):
                explodeNestedStructs(value, target, k + "/" + key)
        else:
            if "type" in value:
                structName = value["$ref"]
                delFromDict(components, f"{k}/{key}/$ref")
                setInDict(components, f"{k}/{key}/properties", components["schemas"][structName]["properties"])
                if "required" in components["schemas"][structName]:
                    setInDict(components, f"{k}/{key}/required", components["schemas"][structName]["required"])
            else:
                setInDict(components, k + "/" + key, components["schemas"][value[target]])
    

def migrateHTTPDocuBlocks(docublock):
    if 'errorCodes' in docublock:
        return "{{% error-codes %}}"
    if 'documentRevision' in docublock:
        return ""

    docuBlockName = docublock.split(",")[0] 
    docuBlockFile = blocksFileLocations[docuBlockName]["path"]
    tag = docuBlockFile.split("/")[len(docuBlockFile.split("/"))-2]
    try:
        docuBlockFile = open(docuBlockFile, "r", encoding="utf-8").read()
    except FileNotFoundError as ex: 
        print(f"[ERROR] Cannot open docublock file {docuBlockFile} - {ex}")
        traceback.print_exc()
        raise ex
        
    blocksFileLocations[docuBlockName]["processed"] = True

    declaredDocuBlocks = re.findall(r"(?<=@startDocuBlock )(.*?)@endDocuBlock", docuBlockFile, re.MULTILINE | re.DOTALL)

    for block in declaredDocuBlocks:
        if block.split("\n")[0] == docuBlockName:
            
            headerLevel = 3
            if re.search(r"h\d", docublock):
                headerLevel = int(re.search(r"h\d", docublock).group(0).replace("h", ""))
            
            newBlock = processHTTPDocuBlock(block, tag, headerLevel)
            return newBlock


def processHTTPDocuBlock(docuBlock, tag, headerLevel):
    blockExamples = processExample_new(docuBlock+"@endDocuBlock")

    docuBlock = re.sub(r"@EXAMPLES.*", "", docuBlock, 0, re.MULTILINE | re.DOTALL)
    newBlock = {"paths": {}}
    url, verb, currentRetStatus = "", "", 0
    docuBlock = docuBlock + "\n" + "@ENDRESPONSES"
    title, description = "", ""

    blocks = re.findall(r"@RESTSTRUCT{(.*?)^(?=@)", docuBlock, re.MULTILINE | re.DOTALL)
    for block in blocks:
        try:
            processComponents(block)
        except Exception as ex:
            print(f"Exception occurred for block {block}\n{ex}")
            traceback.print_exc()
            exit(1)
    
    explodeNestedStructs(components, "$ref", "")

    blocks = re.findall(r"@RESTHEADER{(.*?)^(?=@)", docuBlock, re.MULTILINE | re.DOTALL)
    for block in blocks:
        try:
            url, verb, title = processHeader(block, newBlock)
            title = "#" * headerLevel + " " + title
        except Exception as ex:
            print(f"Exception occurred for block {block}\n{ex}")
            traceback.print_exc()
            exit(1)

    blocks = re.findall(r"(?<=@HINTS\n)(.*?)(?=@)", docuBlock, re.MULTILINE | re.DOTALL)
    for block in blocks:
        currentHint = ""

        try:
            for line in block.rstrip().split("\n"):
                if "{% hint " in line:
                    currentHint = line.replace("{% hint '", "").replace("' %}", "")
                    line = f"{{{{</* {currentHint} */>}}}}\n"
                    description = description + line
                elif "{% endhint " in line:
                    line = f"{{{{</* /{currentHint} */>}}}}\n"
                    description = description + line
                else:
                    description = description + line + "\n"
        except Exception as ex:
            print(f"Exception occurred for block {block}\n{ex}")
            traceback.print_exc()
            exit(1)
    if len(blocks) > 0:
        description = description + "\n"

    blocks = re.findall(r"(?<=@RESTDESCRIPTION\n)(.*?)(?=\n@)", docuBlock, re.MULTILINE | re.DOTALL)
    for block in blocks:
        try:
            description = description + block + "\n"
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
            

    blocks = re.findall(r"(@RESTRETURNCODE\W.*?)(?=@RESTRETURNCODE|@ENDRESPONSES)",  docuBlock, re.MULTILINE | re.DOTALL)
    for block in blocks:
        restReturnCode = re.search(r"@RESTRETURNCODE\W(.*?)(?=@|\n\n)", block, re.MULTILINE | re.DOTALL).group(0)
        try:
            currentRetStatus = processResponse(restReturnCode, newBlock["paths"][url][verb])
        except Exception as ex:
            print(f"Exception occurred for block {block}\n{ex}")
            traceback.print_exc()
            exit(1)

        block = block + "\n" + "@ENDREPLYBODY"
        responseBodies = re.findall(r"@RESTREPLYBODY{(.*?)^(?=@)",  block,  re.MULTILINE | re.DOTALL)
        for responseBody in responseBodies:
            try:
                processResponseBody(responseBody, newBlock["paths"][url][verb]["responses"], currentRetStatus)
            except Exception as ex:
                print(f"Exception occurred for block {block}\n{ex}")
                traceback.print_exc()
                exit(1)

    
    newBlock["paths"][url][verb]["description"] = description
    newBlock["paths"][url][verb]["tags"] = [tag]
    yml = render_yaml(newBlock, title)
    
    exampleCodeBlocks = ""
    if len(blockExamples) > 0:
        exampleCodeBlocks = parse_examples(blockExamples)

    return yml + "\n" + exampleCodeBlocks

### BLOCK PROCESSING    

def processExample_new(docublock):
    examples = re.findall(r"(?<=@EXAMPLES)(.*?)(?=@endDocuBlock)", docublock, re.MULTILINE | re.DOTALL)
    if not examples:
        return []
    blockExamples = []

    inExample = False
    exampleBlock = {'options': {"description": ""}, 'code': ""}

    lines = examples[0].split("\n")

    for i, line in enumerate(lines):
        if "@EXAMPLE_" in line:
            inExample = True

            exampleName = re.search(r"(?<={).*(?=})", line).group(0)
            exampleBlock["options"]["name"] = exampleName
            if "_cluster" in exampleBlock["options"]["name"]:
                exampleBlock["options"]["type"] = "cluster"
                exampleBlock["options"]["name"] = exampleBlock["options"]["name"].replace("_cluster", "")
            continue

        if "@END_EXAMPLE_" in line:
            blockExamples.append(exampleBlock)
            exampleBlock = {'options': {"description": ""}, 'code': ""}
            inExample = False
            continue

        if inExample:
            if exampleBlock["code"] == "" and line == "\n":
                continue

            line = re.sub(r"^ *\|", "", line, 0, re.MULTILINE)
            exampleBlock["code"] = exampleBlock["code"] + "\n" + line

        if not inExample:
            exampleBlock["options"]["description"] = exampleBlock["options"]["description"] + "\n" + line
    return blockExamples


def processHeader(docuBlock, newBlock):
    headerRe = re.search(r".*}", docuBlock).group(0)
    headerSplit = headerRe.split(",")
    try:
        url, verb, desc = headerSplit[0].split(" ")[1], headerSplit[0].split(" ")[0].strip("{").lower(), headerSplit[1].replace("}", "").strip()
        newBlock["paths"][url] = {verb: {}}
        newBlock["paths"][url][verb]["operationId"] = headerSplit[2].replace("}", "").replace(" ", "")
        newBlock["paths"][url][verb]["description"] = desc + "\n"
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
    
    paramBlock["name"] = paramSplit[0]

    if "URLPARAM" in paramType:
        paramBlock["in"] = "path"
    elif "QUERYPARAM" in paramType:
        paramBlock["in"] = "query"
    elif "HEADERPARAM" in paramType:
        paramBlock["in"] = "header"

    paramBlock["required"] = True if paramSplit[2] == "required" else False

    paramBlock["description"] = "\n".join(docuBlock[1].split("\n")[1:]).replace(":", "") + "\n"
    paramBlock["schema"] = {"type": paramSplit[1]}
    try:
        if paramSplit[3] != "" and not paramSplit[3] in swaggerBaseTypes:
            paramBlock["schema"] = {"$ref": f"#/components/schemas/{paramSplit[3]}" }
    except IndexError:
        pass

    if "parameters" not in newBlock:
        newBlock["parameters"] = []

    if not paramBlock in newBlock["parameters"]:
        newBlock["parameters"].append(paramBlock)

def processRequestBody(docuBlock, newBlock): 
    params = docuBlock[1].split("\n")[0].strip("}").split(",")
    name, typ, required, subtype, description = '', '', '', '', "\n".join(docuBlock[1].split("\n")[1:]) + "\n"
    paramBlock = {}

    if not "requestBody" in newBlock:
        newBlock["requestBody"] = {"content": {"application/json": {"schema": {}}}}

    try:
        name = params[0]
        typ = params[1]
        required = params[2]
        subtype = params[3]
    except Exception:
        pass

    paramBlock["description"] = description

    if typ == "array":
        if not subtype in swaggerBaseTypes:
            paramBlock.update({"type": "array", "items": components["schemas"][subtype]})
        else:
            paramBlock.update({"type": "array", "items": {"type": subtype}})
    else:
        if not subtype in swaggerBaseTypes:
            paramBlock.update(components["schemas"][subtype])
        else:
            paramBlock.update({"type": typ})

    if name == '':
        newBlock["requestBody"]["content"]["application/json"]["schema"] = paramBlock
        return
    else:
        if not "properties" in newBlock["requestBody"]["content"]["application/json"]["schema"]:
            newBlock["requestBody"]["content"]["application/json"]["schema"] = {"type": "object", "properties": {}}
        newBlock["requestBody"]["content"]["application/json"]["schema"]["properties"][name] = paramBlock
        if required == "required":
            if not "required" in newBlock["requestBody"]["content"]["application/json"]["schema"]:
                newBlock["requestBody"]["content"]["application/json"]["schema"]["required"] = []
            newBlock["requestBody"]["content"]["application/json"]["schema"]["required"].append(name)
    return

def processResponse(docuBlock, newBlock):
    blockSplit = docuBlock.split("\n")
    statusRE = re.search(r"\d+}", docuBlock).group(0)
    description = docuBlock.replace(statusRE, "").replace(":", "").replace("@RESTRETURNCODE{", "") + "\n"
    status = statusRE.replace("}", "")

    retBlock = {"description": description}

    if "responses" not in newBlock:
        newBlock["responses"] = {}

    newBlock["responses"][status] = retBlock
    return status

def processResponseBody(docuBlock, newBlock, statusCode):
    params = docuBlock.split("\n")[0].strip("}").split(",")
    name, typ, required, subtype, description = '', '', '', '', "\n".join(docuBlock.split("\n")[1:]) + "\n"
    paramBlock = {}

    if not "content" in newBlock[statusCode]:
        newBlock[statusCode]["content"] = {"application/json": {"schema": {}}}

    try:
        name = params[0]
        typ = params[1]
        required = params[2]
        subtype = params[3]
    except Exception:
        pass

    paramBlock["description"] = description

    if typ == "array":
        if not subtype in swaggerBaseTypes:
            paramBlock.update({"type": "array", "items":components["schemas"][subtype]})
        else:
            paramBlock.update({"type": "array", "items": {"type": subtype}})
    else:
        if not subtype in swaggerBaseTypes:
            paramBlock.update(components["schemas"][subtype])
        else:
            paramBlock.update({"type": typ})

    if name == '':
        newBlock[statusCode]["content"]["application/json"]["schema"] = paramBlock
        return
    else:
        if not "properties" in newBlock[statusCode]["content"]["application/json"]["schema"]:
            newBlock[statusCode]["content"]["application/json"]["schema"] = {"type": "object", "properties": {}}
        newBlock[statusCode]["content"]["application/json"]["schema"]["properties"][name] = paramBlock
        if required == "required":
            if not "required" in newBlock[statusCode]["content"]["application/json"]["schema"]:
                newBlock[statusCode]["content"]["application/json"]["schema"]["required"] = []
            newBlock[statusCode]["content"]["application/json"]["schema"]["required"].append(name)

    return

def processComponents(block):
    args = block.split("\n")[0].strip("}").replace("@RESTSTRUCT{", "").split(",")
    
    description = "\n".join(block.split("\n")[1:]) + "\n"
    structName, paramName, paramType, paramRequired, paramSubtype = args[1], args[0], args[2], args[3], args[4]
    structProperty = {
        "description": description,
        "type": paramType,
    }    

    if not paramSubtype in swaggerBaseTypes:
        if paramType == "array":
            structProperty["items"] = {"$ref": paramSubtype}
        else:
            structProperty["$ref"] = paramSubtype
    else:
        if paramType == "array":
            structProperty["items"] = {"type": paramSubtype}

    if structName in components["schemas"]:
        if paramRequired == "required":
            if not "required" in components["schemas"][structName]:
                components["schemas"][structName]["required"] = []

            components["schemas"][structName]["required"].append(paramName)

        components["schemas"][structName]["properties"][paramName] = structProperty
        return

    components["schemas"][structName] = {
        "type": "object",
        "properties": {paramName: structProperty},
    }
    if paramRequired == "required":
        components["schemas"][structName]["required"] = [paramName]
    return

####    YAML WRITERS

# Make pyyaml indent lists properly (two spaces, then the hyphen)
class CustomizedDumper(yaml.Dumper):
    def increase_indent(self, flow=False, indentless=False):
        return super(CustomizedDumper, self).increase_indent(flow, False)

def render_yaml(block, title):
    blockYaml = yaml.dump(block, sort_keys=False, default_flow_style=False, Dumper=CustomizedDumper)
    res = f'\
```openapi\n\
{title}\n\
\n\
{blockYaml}\
```'
    res = res.replace("@endDocuBlock", "")
    #res = re.sub(r"^ *$\n", '', res, 0, re.MULTILINE | re.DOTALL)
    res = re.sub(r"\|.*", '|', res, 0, re.MULTILINE)
    return res

def parse_examples(blockExamples):
    res = '\n**Examples**\n\n'
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
{code}\n\
```\n\
'
        res = res + "\n" + codeBlock
    return res


if __name__ == "__main__":
    initBlocksFileLocations()
