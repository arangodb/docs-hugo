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
    page.frontMatter.menuTitle = infos[filepath]["menuTitle"]


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


        if "{:style=\"clear: left;\"}" in line or "{:class=\"lead\"}" in line or "{:class=\"table-scroll\"}" in line:
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
    flags = {"frontMatter": False, "endFrontMatter": False, "description": False, "redirect": False, "toc": False, "title": False, "inDetails": False, "inCodeblock": False, "hint": {"active": False, "type": ""}, "capture": False, "inDocublock": False, "assign-ver": {"active": False, "isValid": False}}

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

            if "{:class=\"table-scroll\"}" in line:
                continue

            if "{:class=\"columns-3\"}" in line:
                line = line.replace("{:class=\"columns-3\"}", "{.columns-3}")
    
            if "{:class=\"fixed\"}" in line:
                line = line.replace("{:class=\"fixed\"}", "{.fixed}")
    
            ## Convert ---- header to ## header and === header to frontmatter title
            if i < len(content)-1:
                if content[i+1].startswith("===") and not flags["title"]:
                    page.frontMatter.title = line.replace(":", "").replace("`", "")
                    flags["title"] = True
                    continue

                if content[i+1].startswith("---") and flags["endFrontMatter"]:
                    if " | " in line: ## is a table!
                        page.content = page.content + line
                        continue
                    page.content = page.content + "## " + line
                    continue

            

            ## Front Matter
            if re.search(r"^={3,}|^-{3,}", line):
                if flags["inDocublock"]:
                    continue

                # if flags["inCodeblock"]:
                #     page.content += line
                #     continue

                if flags["endFrontMatter"] and "|" in line:
                    page.content = page.content + line
                    continue

                flags["frontMatter"] = not flags["frontMatter"]
                if not flags["frontMatter"]:
                    flags["endFrontMatter"] = True
                    flags["description"] = False
                    flags["title"] = False
                    continue

                continue

            if flags["frontMatter"] and not flags["endFrontMatter"]:
                processFrontMatterLine(page, line, flags, filepath)
                continue

            if "{:class=\"lead\"}" in line:
                if not buffer:
                    continue

                line = line.replace("{:class=\"lead\"}", "{.lead}")
                page.content = page.content + line
                continue
            
            if "{{ page.description }}" in line:
                line = line.replace("{{ page.description }}", "{{< description >}}")
                page.content = page.content + line
                continue

            ## Headers
            if line.startswith("# ") and not flags["title"]:
                page.frontMatter.title = line.replace("# ", "").replace(":", "").replace("`", "")
                flags["title"] = True
                continue

            ##Hints
            if "{% hint " in line:
                spaces = re.search(r" {1,}(?=\{)", line)
                hintPart = line.split("%}")
                hintType = hintPart[0].replace("{% hint '", "").replace("' ", "").replace("\n", "").replace(" ", "")
                if hintType == 'note':
                    hintType = 'tip'

                flags["hint"] = {"active": True, "type": hintType}

                if spaces:
                    page.content = page.content + spaces.group(0)

                if flags["inDetails"]:
                    page.content = page.content + f"{{{{</* {hintType} */>}}}}"
                else:
                    page.content = page.content + f"{{{{< {hintType} >}}}}"
                
                if hintPart[1]:
                    page.content = page.content + hintPart[1]
                continue

            if "{% endhint " in line:
                flags["hint"]["active"] = False
                hintType = flags["hint"]["type"]

                spaces = re.search(r" {1,}(?=\{)", line)
                if spaces:
                    page.content = page.content + spaces.group(0)

                if flags["inDetails"]:
                    page.content = page.content + f"{{{{</* /{hintType} */>}}}}\n"
                else:
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
                flags["inDetails"] = True
                title = line.replace("{% details '", "").replace("' %}\n", "")
                page.content = page.content + '{{{{< expand title="{}" >}}}}\n'.format(title)
                continue

            if "{% enddetail" in line:
                flags["inDetails"] = False
                page.content = page.content + "{{< /expand >}}\n"
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
                print(newCodeblock)
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
                tags = ["ArangoDB Enterprise Edition"]
                if '-arangograph.md' in line:
                    tags.append("ArangoGraph")

                tagShortcode = "{{< tag " + " ".join(map(lambda t: t.join('""'), tags)) + " >}}\n"
                originalSpaces = len(line) - len(line.lstrip())  
                page.content = page.content + " "*originalSpaces + tagShortcode
                continue

            if '{% include program-option.html options=options' in line:
                line = line.replace('{% include program-option.html options=options', "{{% program-options")
                line = line.replace('%}', '%}}')
                page.content = page.content + line
                continue

            if 'assign optionsFile = page.version.version' in line or 'assign options = site.data' in line:
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

            if "{% include metrics.md" in line:
                line = "{{% metrics %}}\n"
                page.content = page.content + line
                continue

            if "{% include youtube.html" in line:
                line = line.replace("{% include youtube.html", "{{< youtube")
                line = line.replace("%}", ">}}")
                page.content = page.content + line
                continue

            if "{% include youtube-playlist.html" in line:
                line = line.replace("{% include youtube-playlist.html", "{{< youtube-playlist")
                line = line.replace("%}", ">}}")
                page.content = page.content + line
                continue

            if "{% raw %}" in line or "{% endraw %}" in line:
                continue

            if "{% assign rulesFile" in line:
                continue

            if "{% include aql-optimizer-rules" in line:
                page.content = page.content + "{{% optimizer-rules %}}"
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

    if line.startswith("page-toc"):
        flags["toc"] = True
        flags["description"] = False
        flags["redirect"] = False
        page.frontMatter.toc = to_lower_camel_case(line)
        return

    if line.startswith("description:"):
        flags["description"] = True
        flags["redirect"] = False
        flags["toc"] = False

        page.frontMatter.description = line.replace("description: ", "")
        return

    if line.startswith("redirect_from"):
        flags["redirect"] = True
        flags["description"] = False
        flags["toc"] = False
        return

    if re.search(r"^[a-zA-Z]", line, re.MULTILINE):
        if flags["description"]:
            flags["description"] = False
        
        if flags["redirect"]:
            flags["redirect"] = False

        if flags["toc"]:
            flags["toc"] = False

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

        if flags["toc"]:
            page.frontMatter.toc = page.frontMatter.toc + "\n" + to_lower_camel_case(line)
            return


def cleanLine(line):
    line = line.replace("#", "sharp")
    line = line.replace("//", "/").replace("&","and").replace(" ", "-").replace("'", "")
    line = re.sub(r"-{2,}", "-", line)
    return line

def is_index(filename):
    return filename.endswith("_index.md")


def to_camel_case(snake_str):
    return "".join(x.capitalize() for x in snake_str.lower().split("-"))

def to_lower_camel_case(snake_str):
    camel_string = to_camel_case(snake_str)
    return snake_str[0].lower() + camel_string[1:]


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
        self.toc = ""

    @staticmethod
    def clean(str):
        return str.replace("`", "").lstrip(" ")

    def toString(self):
        self.title = self.title.replace("{{ site.data.versions[page.version.name] }} ", "")
        description = yaml.dump(self.description, sort_keys=False, default_flow_style=False)
        description = description.replace(">-", "").replace("|-", ">-")
        return f"---\ntitle: {self.clean(self.title)}\nmenuTitle: {self.menuTitle}\nweight: {self.weight}\ndescription: {description}\n{self.toc}\narchetype: {self.layout}\n---\n"
