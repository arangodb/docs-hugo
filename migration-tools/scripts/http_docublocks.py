import re
import json
import yaml
import traceback
from definitions import *
from globals import *

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
    'int64'
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

def createComponentsIn1StructsFile(path):
    try:
        f = open(f"{ARANGO_MAIN}/Documentation/DocuBlocks/Rest/{path}", "r", encoding="utf-8").readlines()
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

            processComponents("\n".join(buffer))
            buffer = [line]
            continue

        buffer.append(line)                     ## append the description line to the current struct buffer

    processComponents("\n".join(buffer))        ## this will process the last struct in the file with remaining strings in the buffer



def getFromDict(dataDict, mapList):
    return reduce(operator.getitem, mapList, dataDict)

def setInDict(dataDict, mapList, value):
    mapList = mapList.split("/")[1:]
    getFromDict(dataDict, mapList[:-1])[mapList[-1]] = value

def explodeNestedStructs(data, target, k):
    for key, value in data.items():
        if not target in value:
            if isinstance(value, dict):
                explodeNestedStructs(value, target, k + "/" + key)
        else:
            setInDict(components, k + "/" + key, components["schemas"][value[target]])
    

def migrateHTTPDocuBlocks(paragraph):
    docuBlockNameRe = re.findall(r"(?<={% docublock ).*(?= %})", paragraph)
    for docuBlock in docuBlockNameRe:
        if 'errorCodes' in docuBlock:
            paragraph = paragraph.replace("{% docublock errorCodes %}", "{{< error-codes >}}")
            continue

        docuBlockFile = blocksFileLocations[docuBlock]["path"]
        tag = docuBlockFile.split("/")[len(docuBlockFile.split("/"))-2]
        try:
            docuBlockFile = open(docuBlockFile, "r", encoding="utf-8").read()
        except FileNotFoundError as ex: 
            print(f"[ERROR] Cannot open docublock file {docuBlockFile} - {ex}")
            #traceback.print_exc()
            continue
        blocksFileLocations[docuBlock]["processed"] = True
        declaredDocuBlocks = re.findall(r"(?<=@startDocuBlock )(.*?)@endDocuBlock", docuBlockFile, re.MULTILINE | re.DOTALL)

        for block in declaredDocuBlocks:
            if block.split("\n")[0] == docuBlock:
                if docuBlock == "documentRevision":
                    revisionContent = re.search(r"(?<=documentRevision\n\n)(.*?)", block, re.MULTILINE | re.DOTALL).group(0)
                    paragraph = paragraph.replace("{% docublock "+ docuBlock + " %}", revisionContent)
                    continue

                newBlock = processHTTPDocuBlock(block, tag)
                paragraph = paragraph.replace("{% docublock "+ docuBlock + " %}", newBlock, 1)

    paragraph = re.sub(r"```\n{3,}", "```\n\n", paragraph, 0, re.MULTILINE)

    return paragraph

def processHTTPDocuBlock(docuBlock, tag):
    blockExamples = processExamples(docuBlock)

    docuBlock = re.sub(r"@EXAMPLES.*", "", docuBlock, 0, re.MULTILINE | re.DOTALL)
    newBlock = {"paths": {}}
    url, verb, currentRetStatus = "", "", 0
    docuBlock = docuBlock + "\n" + "@ENDRESPONSES"
    title = ""

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
        except Exception as ex:
            print(f"Exception occurred for block {block}\n{ex}")
            traceback.print_exc()
            exit(1)

    blocks = re.findall(r"(?<=@RESTDESCRIPTION\n)(.*?)(?=\n@)", docuBlock, re.MULTILINE | re.DOTALL)
    for block in blocks:
        try:
            newBlock["paths"][url][verb]["description"] = block + "\n"
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

    if typ == "array":
        if not subtype in swaggerBaseTypes:
            paramBlock = {"type": "array", "items": components["schemas"][subtype]}
        else:
            paramBlock = {"type": "array", "items": {"type": subtype}}
    else:
        if not subtype in swaggerBaseTypes:
            paramBlock = components["schemas"][subtype]
        else:
            paramBlock = {"type": typ}

    paramBlock["description"] = description

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

    if typ == "array":
        if not subtype in swaggerBaseTypes:
            paramBlock = {"type": "array", "items":components["schemas"][subtype]}
        else:
            paramBlock = {"type": "array", "items": {"type": subtype}}
    else:
        if not subtype in swaggerBaseTypes:
            paramBlock = components["schemas"][subtype]
        else:
            paramBlock = {"type": typ}

    paramBlock["description"] = description

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
        "type": paramType,
        "description": description,
    }    

    if paramType == "array":
        key = "type"
        if not paramSubtype in swaggerBaseTypes:
            key = "$ref"

        structProperty["items"] = {key: paramSubtype if paramSubtype != "" else "string"}

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
        "required": []
        }
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
## {title}\n\
\n\
{blockYaml}\
```'
    res = res.replace("@endDocuBlock", "")
    #res = re.sub(r"^ *$\n", '', res, 0, re.MULTILINE | re.DOTALL)
    res = re.sub(r"\|.*", '|', res, 0, re.MULTILINE)
    return res

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
