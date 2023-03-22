import re
from globals import *
import http_docublocks
import inline_docublocks
import os
from migrate_file import Page

def migrate(filepath):
    print("Processing " + filepath)
    try:
        content = open(filepath, "r", encoding="utf-8").readlines()
    except Exception as ex:
        print(traceback.format_exc())
        raise ex

    page = Page()
    if filepath.endswith("_index.md"):
        page.frontMatter.layout = "chapter"
    else:
        page.frontMatter.layout = "default"

    if content == "": ## for pages derived from subtitles
        page.frontMatter.title = infos[filepath]["title"]
        page.frontMatter.weight = infos[filepath]["weight"]
    
    processFile(page, content)

    file = open(filepath, "w", encoding="utf-8")
    file.truncate()
    file.write(page.toString())
    file.close()

    return

def processFile(page, content):
    flags = {"frontMatter": False, "endFrontMatter": False, "description": False, "title": False, "inCodeblock": False, "hint": {"active": False, "type": ""}, "capture": False, "inDocublock": False, "assign-ver": {"active": False, "isValid": False}}

    buffer = []

    for i, line in enumerate(content):
        if line == "\n":
            page.content = page.content + "\n"
            continue

        ## Trap and skip inline docublocks extra line
        if re.search(r"{%.*arangoshexample|{%.*aqlexample|@END_EXAMPLE_", line, re.MULTILINE):
            continue

        ## Convert ---- header to ## header and === header to frontmatter title
        if i < len(content)-1:
            if content[i+1].startswith("===") and not flags["title"]:
                page.frontMatter.title = line.replace(":", "").replace("`", "")
                flags["title"] = True
                continue

            if content[i+1].startswith("---") and flags["endFrontMatter"]:
                page.content = page.content + "## " + line
                continue

        ## Front Matter
        if re.search(r"={3,}|-{3,}", line, re.MULTILINE):
            flags["frontMatter"] = not flags["frontMatter"]
            if not flags["frontMatter"]:
                flags["endFrontMatter"] = True
                flags["description"] = False
                flags["title"] = False

            continue

        if flags["frontMatter"] and not flags["endFrontMatter"]:
            processFrontMatterLine(page, line, flags)
            continue

        if "{:class=\"lead\"}" in line:
            page.frontMatter.description = "".join(buffer)
            buffer = []
            continue
        
        if "{{ page.description }}" in line:
            continue

        ## Headers
        if line.startswith("# ") and not flags["title"]:
            page.frontMatter.title = line.replace("# ", "").replace(":", "").replace("`", "")
            flags["title"] = True
            continue

        ##Hints
        if "{% hint " in line:
            hintType = line.replace("{% hint ", "").replace(" %}", "").replace("\n", "")
            flags["hint"] = {"active": True, "type": hintType}
            page.content = page.content + f"{{{{< {hintType} >}}}}\n"
            continue

        if "{% endhint %}" in line:
            flags["hint"]["active"] = False
            page.content = page.content + f"{{{{< /{hintType} >}}}}\n"
            continue

        if flags["hint"]["active"]:
            page.content = page.content + line
            buffer = []
            continue

        ##Capture alternative
        if "{% capture alternative %}" in line:
            flags["capture"] = True
            page.content = page.content + f"{{{{< info >}}}}\n"
            continue

        if "{% endcapture %}" in line:
            flags["capture"] = False
            page.content = page.content + f"{{{{< /info >}}}}\n"
            continue

        if flags["capture"]:
            page.content = page.content + line
            buffer = []
            continue
        
        ## Codeblocks
        if line.startswith("```"):
            flags["inCodeblock"] = not flags["inCodeblock"]
            page.content = page.content +line
            continue

        if flags["inCodeblock"]:
            page.content = page.content +line
            continue

        ## HTTP Docublocks
        if "{% docublock" in line:
            docublockName = line.replace("{% docublock ", "").replace(" %}", "").replace("\n", "")
            codeblock = http_docublocks.migrateHTTPDocuBlocks(docublockName)
            page.content = page.content + codeblock
            continue

        ## Inline Docublocks
        if "@startDocuBlockInline" in line:
            flags["inDocublock"] = True
            continue

        if "@endDocuBlock" in line:
            flags["inDocublock"] = False
            continue

        if flags["inDocublock"]:
            processDocublockLine(page, line, flags)
            continue

        ## Comments
        if re.search(r"{%.*comment", line, re.MULTILINE):
            page.content = page.content + "{{% comment %}}"
            continue

        if re.search(r"{%.*endcomment", line, re.MULTILINE):
            page.content = page.content + "{{% /comment %}}"
            continue  

        ## Hint-ee
        if "{% include hint-ee" in line:
            feature = re.search(r"(?<=feature=).*\"", line).group(0)
            tags = ["ArangoDB Enterprise"]
            if 'arangograph' in line:
                tags.append("ArangoGraph")

            tagShortcode = '{{< tag '
            for t in tags:
                tagShortcode = tagShortcode + f'"{t}"'

            tagShortcode = tagShortcode + ' >}}'    
            page.content = page.content + tagShortcode
            continue

        ## Assign ver
        if "{% assign ver" in line:
            if "3.10" in line:
                flags["assign-ver"]["isValid"] = True

            flags["assign-ver"]["active"] = True
            continue

        if re.search("{%.*else", line, re.MULTILINE):
            if flags["assign-ver"]["active"]:
                flags["assign-ver"]["active"] = False
                flags["assign-ver"]["isValid"] = not flags["assign-ver"]["isValid"]
            continue

        if "{% endif" in line:
            if flags["assign-ver"]["active"]:
                flags["assign-ver"]["active"] = False
                flags["assign-ver"]["isValid"] = False
            continue

        if flags["assign-ver"]["active"] and not flags["assign-ver"]["isValid"]:
            continue



        buffer.append(line)
        page.content = page.content + line

    #print(page.frontMatter.toString())
    return page




def processFrontMatterLine(page, line, flags):
    if line.startswith("title:"):
        page.frontMatter.title = line.replace("title:", "")

    if line.startswith("description:"):
        flags["description"] = True
        page.frontMatter.description = line.replace("description:", "")
        return

    if re.search(r"^[a-zA-Z]", line, re.MULTILINE):
        if flags["description"]:
            flags["description"] = False
        return

    if line.startswith(" "):
        if flags["description"]:
            page.frontMatter.description = page.frontMatter.description + line

def processDocublockLine(page, line, flags):
    return

