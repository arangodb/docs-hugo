import re
from globals import *
import http_docublocks
import inline_docublocks
import os
import yaml

def migrate(filepath):
    print("Processing " + filepath)
    try:
        file = open(filepath, "r", encoding="utf-8")
        content = file.read()
        file.close()
    except Exception as ex:
        print(traceback.format_exc())
        raise ex

    page = Page()

    _processFrontMatter(page, content, filepath)
    content = re.sub(r"^---\n(.*?)\n---\n", '', content, 0, re.MULTILINE | re.DOTALL)  ## Cut front matter from content processing
    _processContent(page, content, filepath)

    file = open(filepath, "w", encoding="utf-8")
    file.write(page.toString())
    file.close()

    return

def _processFrontMatter(page, buffer, filepath):
    if filepath in infos:
        page.frontMatter.weight = infos[filepath]["weight"] if "weight" in infos[filepath] else 0
        if "appendix" in filepath or "release-notes" in filepath:
            page.frontMatter.weight = page.frontMatter.weight + 10000
    
    frontMatterRegex = re.search(r"---(.*?)---", buffer, re.MULTILINE | re.DOTALL)
    if not frontMatterRegex:
        return		# TODO
    
    frontMatter = frontMatterRegex.group(0)

    migrate_title(page, frontMatter, buffer)
    set_page_description(page, buffer, frontMatter)

    return page

def _processContent(page, paragraph, filepath):
    if paragraph is None or paragraph == '':
        return 
        
    paragraph = re.sub(r"^ +(?=\n)", "", paragraph, 0, re.MULTILINE)

    paragraph = re.sub("{+\s?page.description\s?}+", '', paragraph)
    paragraph = paragraph.replace("{:target=\"_blank\"}", "")
    paragraph = paragraph.replace("{:style=\"clear: left;\"}", "")

    paragraph = re.sub(r"^# .*|(.*\n={4,})", "", paragraph, 1, re.MULTILINE)
    paragraph = re.sub(r"(?<=\n\n)[\w\s{.}]+{:class=\"lead\"}\n\n", '', paragraph, 0, re.MULTILINE)

    paragraph = migrate_headers(paragraph)
    paragraph = migrate_youtube_links(paragraph)

    paragraph = migrate_hints(paragraph)
    paragraph = migrate_capture_alternative(paragraph)
    paragraph = migrate_enterprise_tag(paragraph)
    paragraph = migrate_details(paragraph)
    paragraph = migrate_comments(paragraph)

    paragraph = http_docublocks.migrateHTTPDocuBlocks(paragraph)
    paragraph = inline_docublocks.migrateInlineDocuBlocks(paragraph)
    paragraph = migrateIndentedCodeblocks(filepath, paragraph)

    paragraph = paragraph.lstrip("\n")

    paragraph = re.sub(r"{% assign ver = \"3\.10\" \| version: \">=\" %}{% if ver %}", "", paragraph, 0)
    paragraph = re.sub(r"{% endif -%}", "", paragraph, 0)

    page.content = paragraph
    return


## migration modules 

def migrate_title(page, frontMatter, content):
    fmTitleRegex = re.search(r"(?<=title: ).*", frontMatter)
    if fmTitleRegex:
        page.frontMatter.title = fmTitleRegex.group(0)

    paragraphTitleRegex = re.search(r"(?<=---\n)\n*(# .*)|(.*\n(?=={4,}))", content)
    if paragraphTitleRegex:
        page.frontMatter.title = paragraphTitleRegex.group(0).replace('#', '').replace(':', '').replace("\n", "")
        page.frontMatter.title = re.sub(r"{{ .* }}", '', page.frontMatter.title)

    page.frontMatter.title = page.frontMatter.title.replace("`", "")
    return

def set_page_description(page, buffer, frontMatter):
    paragraphDescRegex = re.search(r"(?<=\n\n)[\w\s{.}]+{:class=\"lead\"}", buffer, re.MULTILINE)
    if paragraphDescRegex:
        description = paragraphDescRegex.group(0)
        if not "page.description" in description:
            print(description)
            description = description.replace("\n", "\n  ").replace("{:class=\"lead\"}", "")
            page.frontMatter.description = f">-\n  {description}"
        else:
            page.frontMatter.description = re.search(r"(?<=description: )(.*?)((?=\n\w)|(?=---))", buffer, re.MULTILINE | re.DOTALL).group(0)

def migrate_hints(paragraph):
    hintRegex = re.findall(r"{% hint .*? %}.*?{% endhint %}", paragraph, re.MULTILINE | re.DOTALL)
    for hint in hintRegex:
        hintSplit = hint.split("\n")
        hintType = re.search(r"'.*[']* %}", hintSplit[0]).group(0).replace("'", '').strip(" %}")
        hintText = "\n".join(hintSplit[1:len(hintSplit)-1])

        toReplace = f"{{% hint '{hintType}' %}}"

        if hintType == 'note':
            hintType = 'tip'

        newHint = hint.replace(toReplace, f"{{{{< {hintType} >}}}}")
        newHint = newHint.replace("{% endhint %}", f"{{{{< /{hintType} >}}}}")
        paragraph = paragraph.replace(hint, newHint)

    return paragraph

def migrate_capture_alternative(paragraph):
    captureRE = re.findall(r"(?<={% capture alternative %})(.*?)(?= {% endcapture %})", paragraph, re.MULTILINE | re.DOTALL)
    for capture in captureRE:
        info = f"{{{{< info >}}}}\n{capture}\n{{{{< /info >}}}}"
        paragraph = paragraph.replace(capture, info)

    paragraph = paragraph.replace("{% capture alternative %}", "").replace("{% endcapture %}", "")
    return paragraph

def migrate_enterprise_tag(paragraph):
    enterpriseFeatureRegex = re.findall(r"{% include hint-ee-arangograph\.md .* %}|{% include hint-ee\.md .* %}", paragraph)
    for tag in enterpriseFeatureRegex:
        feature = re.search(r"(?<=feature=).*\"", tag).group(0)
        tags = ["ArangoDB Enterprise"]
        if 'arangograph' in tag:
            tags.append("ArangoGraph")

        tagShortcode = '{{< tag '
        for t in tags:
            tagShortcode = tagShortcode + f'"{t}"'

        tagShortcode = tagShortcode + ' >}}'
        paragraph = paragraph.replace(tag, tagShortcode)
    
    return paragraph

def migrate_comments(paragraph):
    for key in static_replacements["comments"]:
        paragraph = paragraph.replace(key, static_replacements["comments"][key])

    return paragraph

def migrate_details(paragraph):
    detailsRegex = re.search(r"{% details .* %}[\w\n\s\W]*{% enddetails %}", paragraph)
    if detailsRegex:
        detailsTitle = re.search(r"(?<={% details ).*(?= %})", detailsRegex.group(0)).group(0)
        paragraph = paragraph.replace(f"{{% details {detailsTitle} %}}", '{{{{% expand title="{}" %}}}}'.format(detailsTitle))
        paragraph = paragraph.replace(f"{{% enddetails %}}", "{{{{% /expand %}}}}")
    
    return paragraph

def migrate_youtube_links(paragraph):
    youtubeRegex = re.search(r"{% include youtube\.html .* %}", paragraph)
    if youtubeRegex:
        oldYoutube = youtubeRegex.group(0)
        oldYoutube = oldYoutube.replace('{% include', '{{< ').replace('%}', '>}}').replace(".html", "")
        paragraph = paragraph.replace(youtubeRegex.group(0), oldYoutube)

    return paragraph

def migrate_headers(paragraph):
    headersRegex = re.findall(r"\n?.+\n={3,}", paragraph)
    for header in headersRegex:
        if '|' in header:
            continue
        paragraph = paragraph.replace(header, '')

    headersRegex = re.findall(r"\n?.+\n-{4,}", paragraph)
    for header in headersRegex:
        if '|' in header:
            continue
        headerSplit = header.replace('-', '').split("\n")
        headerText = f"\n## {headerSplit[len(headerSplit)-2]}"
        paragraph = paragraph.replace(header, headerText)

    return paragraph

def migrateIndentedCodeblocks(filepath, content):
    import commonmark
    import frontmatter

    post = frontmatter.load(filepath)
    parser = commonmark.Parser()
    ast = parser.parse(post.content)

    for node in ast.walker():
        if node[0].t == "code_block" and node[0].is_fenced == False:
            s = node[0].sourcepos[0][1] - 1
            toReplace = ""
            for line in node[0].literal.split("\n"):
                if line == "":
                    toReplace = toReplace + "\n"
                    continue

                toReplace = toReplace + " " * s + line + "\n"
                
            fencedCodeblock = f"```\n{node[0].literal}\n```\n"
            content = content.replace(toReplace, fencedCodeblock)

    return content

def migrate_docublock_output(exampleName):
    generatedFile = open(f"{OLD_GENERATED_FOLDER}/{exampleName}.generated", 'r', encoding="utf-8")
    output = generatedFile.read()
    output = output.replace("arangosh&gt;", "").replace("shell&gt;", "")
    output = re.sub(r"<(.*?)>", "", output, 0, re.MULTILINE)
    output = output.replace("&#x27;", "\"").replace("&quot;", "\"")

    return output

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
        self.layout = "default"
        self.description = ""
        self.menuTitle = ""
        self.weight = 0

    @staticmethod
    def clean(str):
        return str.replace("`", "").lstrip(" ")

    def toString(self):
        description = yaml.dump(self.description, sort_keys=False, default_flow_style=False)
        description = description.replace(">-", "").replace("|-", ">-")
        return f"---\ntitle: {self.clean(self.title)}\nweight: {self.weight}\ndescription: {description}\nlayout: default\n---\n"