import re
from globals import *
import http_docublocks
import inline_docublocks
import os
import yaml

def migrate(filepath):
    print("Processing " + filepath)
    try:
        content = open(filepath, "r", encoding="utf-8").readlines()
    except Exception as ex:
        print(traceback.format_exc())
        raise ex

    page = Page()
    page.frontMatter.weight = infos[filepath]["weight"]

    if filepath.endswith("_index.md"):
        page.frontMatter.layout = "chapter"
    else:
        page.frontMatter.layout = "default"

    temp = re.sub(r"---.*---", "", "\n".join(content), 0, re.MULTILINE | re.DOTALL)

    if temp == "": ## for pages derived from subtitles
        page.frontMatter.title = infos[filepath]["title"]
    else:
        oldMetrics = getJekyllMetrics(content)
        processFile(page, content, filepath)

        newMetrics = getHugoMetrics(page.toString().split("\n"))
        metrics[filepath] = {"old": oldMetrics, "new": newMetrics}

    file = open(filepath, "w", encoding="utf-8")
    file.truncate()
    file.write(page.toString())
    file.close()

    return

def getJekyllMetrics(content):
    flags = {"frontMatter": False, "endFrontMatter": False, "description": False, "title": False, "inCodeblock": False, "hint": {"active": False, "type": ""}, "capture": False, "inDocublock": False, "assign-ver": {"active": False, "isValid": False}}
    metrics = {"text": 0, "inlineDocublocks": 0, "httpDocublocks":0, "headers": 0, "hints": 0, "details": 0, "plainCodeblocks": 0, "hint-ee": 0, "comments": 0}
    
    for i, line in enumerate(content):
        if line == "\n":
            continue

        ## Trap and skip inline docublocks extra line
        if re.search(r"{%.*arangoshexample", line, re.MULTILINE) and not re.search(r"{%.*endarangoshexample", line, re.MULTILINE) and not re.search(r"{%.*include.*arangoshexample", line, re.MULTILINE):
            continue

        if re.search(r"{%.*aqlexample", line, re.MULTILINE) and not re.search(r"{%.*endaqlexample", line, re.MULTILINE) and not re.search(r"{%.*include.*aqlexample", line, re.MULTILINE):
            continue


        if "{:style=\"clear: left;\"}" in line or "{:class=\"lead\"}" in line:
            continue

        if re.search(r"title: .+", line):
            metrics["headers"] += 1
            metrics["text"] += 1
            continue

        ## Find headers
        if re.search(r"^={3,}|^-{3,}|^#{1,}", line, re.MULTILINE):
            if not flags["endFrontMatter"]:
                flags["frontMatter"] = not flags["frontMatter"]
                if not flags["frontMatter"]:
                    flags["endFrontMatter"] = True
                continue

            metrics["headers"] += 1

        if "{{ page.description }}" in line:
            continue

        ##Hints
        if "{% hint " in line:
            metrics["hints"] += 1
            continue

        if "{% endhint %}" in line:
            continue

        ##Capture alternative
        if "{% capture " in line:
            metrics["hints"] += 1
            continue

        if "{% endcapture %}" in line:
            continue

        ## Details
        if "{% details" in line:
            metrics["details"] += 1
            continue

        if "{% enddetail" in line:
            continue
        
        ## Codeblocks
        if line.startswith("```"):
            flags["inCodeblock"] = not flags["inCodeblock"]
            if flags["inCodeblock"]:
                metrics["plainCodeblocks"] += 1
            continue

        ## HTTP Docublocks
        if "{% docublock" in line:
            metrics["httpDocublocks"] += 1
            continue

        ## Inline Docublocks
        if "@startDocuBlockInline" in line:
            metrics["inlineDocublocks"] += 1
            continue

        if "@endDocuBlock" in line:
            flags["inDocublock"] = False
            continue

        ## Comments
        if "{% comment %}" in line or "{%- comment %}" in line:
            metrics["comments"] += 1
            continue

        if "{% endcomment %}" in line or "{%- endcomment %}" in line:
            continue  

        ## Hint-ee
        if "{% include hint-ee" in line:
            metrics["hint-ee"] += 1
            continue

        ## Assign ver
        if "{% assign ver" in line:
            continue

        if re.search("{%.*else", line, re.MULTILINE):
            continue

        if "{% endif" in line:
            continue

        metrics["text"] += 1
    return metrics

def getHugoMetrics(content):
    flags = {"frontMatter": False, "endFrontMatter": False, "description": False, "title": False, "inCodeblock": False, "hint": {"active": False, "type": ""}, "capture": False, "inDocublock": False, "assign-ver": {"active": False, "isValid": False}}
    metrics = {"text": 0, "inlineDocublocks": 0, "httpDocublocks":0, "headers": 0, "hints": 0, "details": 0, "plainCodeblocks": 0, "hint-ee": 0, "comments": 0}
    
    for i, line in enumerate(content):
        if line == "\n":
            continue

        if "{{< error-codes >}}" in line:
            metrics["httpDocublocks"] += 1
            continue

        if re.search(r"title: .+", line):
            metrics["headers"] += 1
            metrics["text"] += 1
            continue

        ## Find headers
        if re.search(r"^#", line, re.MULTILINE):
            metrics["headers"] += 1
            continue

        ##Hints
        if re.search(r"{{< warning|{{< info|{{< danger|{{< success|{{< tip|{{< security", line, re.MULTILINE):
            if flags["inDocublock"]:
                continue

            metrics["hints"] += 1
            continue

        if re.search(r"{{< /warning|{{< /info|{{< /danger|{{< /success|{{< /tip|{{< /security", line, re.MULTILINE):
            continue

        ## Details
        if "{{% expand" in line:
            metrics["details"] += 1
            continue

        if "{{% /expand" in line:
            continue

        if line.startswith("```openapi"):
            flags["inDocublock"] = True
            metrics["httpDocublocks"] += 1
            continue
        
        ## Codeblocks
        if line.startswith("```"):
            if flags["inDocublock"]:
                flags["inDocublock"] = False
                continue
            if i < len(content) - 1:
                if content[i+1].startswith("---"):
                    flags["inDocublock"] = True
                    if not line.startswith("```curl"):
                        metrics["inlineDocublocks"] += 1
                else:
                    flags["inCodeblock"] = not flags["inCodeblock"]
                    if flags["inCodeblock"]:
                        metrics["plainCodeblocks"] += 1
            continue


        ## Comments
        if "{{% comment %}}" in line or "{{%- comment %}}" in line:
            metrics["comments"] += 1
            continue

        if "{{% /comment %}}" in line:
            continue  

        ## Hint-ee
        if "{{< tag" in line:
            metrics["hint-ee"] += 1
            continue

        metrics["text"] += 1
    return metrics


def processFile(page, content, filepath):
    flags = {"frontMatter": False, "endFrontMatter": False, "description": False, "redirect": False, "title": False, "inCodeblock": False, "hint": {"active": False, "type": ""}, "capture": False, "inDocublock": False, "assign-ver": {"active": False, "isValid": False}}

    buffer = []
    try:
        for i, line in enumerate(content):
            if line == "\n":
                if page.content == "":
                    continue
                
                page.content = page.content + "\n"
                continue

            if flags["inDocublock"]:
                buffer.append(line)
                
            ## Trap and skip inline docublocks extra line
            if re.search(r"{%.*arangoshexample|{%.*aqlexample|@END_EXAMPLE_", line, re.MULTILINE):
                continue

            if "{:target=\"_blank\"}" in line:
                line = line.replace("{:target=\"_blank\"}", "")

            if "{:style=\"clear: left;\"}" in line:
                line = line.replace("{:style=\"clear: left;\"}", "")

                
    
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
                processFrontMatterLine(page, line, flags, filepath)
                continue

            if "{:class=\"lead\"}" in line:
                if not buffer:
                    continue

                page.frontMatter.description = "".join(buffer)
                page.content = page.content.replace("".join(buffer), "")
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
                hintPart = line.split("%}")
                hintType = hintPart[0].replace("{% hint '", "").replace("' ", "").replace("\n", "").replace(" ", "")
                if hintType == 'note':
                    hintType = 'tip'

                flags["hint"] = {"active": True, "type": hintType}

                page.content = page.content + f"{{{{< {hintType} >}}}}"
                
                if hintPart[1]:
                    page.content = page.content + hintPart[1]
                continue

            if "{% endhint " in line:
                flags["hint"]["active"] = False
                hintType = flags["hint"]["type"]
                page.content = page.content + f"{{{{< /{hintType} >}}}}\n"
                continue

            if flags["hint"]["active"]:
                page.content = page.content + line
                buffer = []
                continue

            ##Capture 
            if "{% capture " in line:
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

            ## Details
            if "{% details" in line:
                title = line.replace("{% details '", "").replace("' %}\n", "")
                page.content = page.content + '{{{{% expand title="{}" %}}}}\n'.format(title)
                continue

            if "{% enddetail" in line:
                page.content = page.content + "{{% /expand %}}\n"
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
                buffer = []
                flags["inDocublock"] = True
                line = line.replace("@startDocuBlockInline ", "")
                buffer.append(line)
                continue

            if "@endDocuBlock" in line:
                flags["inDocublock"] = False
                newCodeblock = inline_docublocks.migrateInlineDocuBlocks("".join(buffer))
                newCodeblock = re.sub(r".*@END_EXAMPLE.*\n|.*@endDocuBlock.*\n", "", newCodeblock, 0, re.MULTILINE)
                page.content = page.content + newCodeblock
                buffer = []
                continue

            if flags["inDocublock"]:
                continue

            ## Comments
            if "{% comment %}" in line or "{%- comment %}" in line:
                line = line.replace("{% comment %}", "{{% comment %}}").replace("{%- comment %}", "{{% comment %}}")

                if "endcomment" in line:                            ## The comment is entirely in a single line
                    line = line.replace("{% endcomment %}", "{{% /comment %}}").replace("{%- endcomment %}", "{{% /comment %}}")
                
                page.content = page.content + line
                continue

            if "endcomment" in line:
                line = line.replace("{% endcomment %}", "{{% /comment %}}").replace("{%- endcomment %}", "{{% /comment %}}")
                page.content = page.content + line
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
    except Exception as ex:
        raise ex

    #print(page.frontMatter.toString())
    return page




def processFrontMatterLine(page, line, flags, filepath):
    if line.startswith("title:"):
        page.frontMatter.title = line.replace("title:", "")
        return

    if line.startswith("description:"):
        flags["description"] = True
        flags["redirect"] = False
        page.frontMatter.description = line.replace("description: ", "")
        return

    if line.startswith("redirect_from"):
        flags["redirect"] = True
        flags["description"] = False
        return

    if re.search(r"^[a-zA-Z]", line, re.MULTILINE):
        if flags["description"]:
            flags["description"] = False
        
        if flags["redirect"]:
            flags["redirect"] = False

        return



    if line.startswith(" "):
        if flags["description"]:
            line = line.replace("  ", "")
            page.frontMatter.description = page.frontMatter.description +  line
            return
        
        if flags["redirect"]:
            line = "/" + line.replace("  - ", "").replace(".html", ".md").replace("\n", "")
            line = re.sub(r" #.*", "", line, 0, re.MULTILINE)

            urlMap[version][line] = filepath
            return


def cleanLine(line):
    line = line.replace("//", "/").replace("&","").replace(" ", "-")
    line = re.sub(r"-{2,}", "-", line)
    return line.replace("#", "sharp").replace(".net", "dotnet")

def is_index(filename):
    return filename.endswith("_index.md")


class Page():
	def __init__(self):
		self.frontMatter = FrontMatter()
		self.content = ""

	def toString(self):
		res = self.frontMatter.toString()
		cleanedFrontMatter = re.sub(r"^\s*$\n", '', res, 0, re.MULTILINE | re.DOTALL)
		res =  f"{cleanedFrontMatter}{self.content}"
		#res = re.sub(r"(?<=---)\n*", '\n', f"{cleanedFrontMatter}{self.content}", 0, re.MULTILINE | re.DOTALL)
		return res

class FrontMatter():
    def __init__(self):
        self.title = ""
        self.layout = ""
        self.description = ""
        self.menuTitle = ""
        self.weight = 0

    @staticmethod
    def clean(str):
        return str.replace("`", "").lstrip(" ")

    def toString(self):
        description = yaml.dump(self.description, sort_keys=False, default_flow_style=False)
        description = description.replace(">-", "").replace("|-", ">-")
        return f"---\ntitle: {self.clean(self.title)}\nweight: {self.weight}\ndescription: {description}\narchetype: {self.layout}\n---\n"