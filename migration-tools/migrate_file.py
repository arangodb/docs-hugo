import re
from globals import *
import http_docublocks
import inline_docublocks

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
        
    paragraph = re.sub("{+\s?page.description\s?}+", '', paragraph)
    paragraph = paragraph.replace("{:target=\"_blank\"}", "")
    paragraph = paragraph.replace("{:style=\"clear: left;\"}", "")

    paragraph = re.sub(r"^# .*|(.*\n={4,})", "", paragraph, 0, re.MULTILINE)
    paragraph = re.sub(r"(?<=\n\n)[\w\s{.}]+{:class=\"lead\"}\n\n", '', paragraph, 0, re.MULTILINE)

    paragraph = migrate_headers(paragraph)
    paragraph = migrate_hrefs(paragraph, infos, filepath)
    paragraph = migrate_youtube_links(paragraph)

    paragraph = migrate_hints(paragraph)
    paragraph = migrate_capture_alternative(paragraph)
    paragraph = migrate_enterprise_tag(paragraph)
    paragraph = migrate_details(paragraph)
    paragraph = migrate_comments(paragraph)

    paragraph = migrateIndentedCodeblocks(paragraph)
    paragraph = http_docublocks.migrateHTTPDocuBlocks(paragraph)
    paragraph = inline_docublocks.migrateInlineDocuBlocks(paragraph)
    paragraph = paragraph.lstrip("\n")

    paragraph = re.sub(r"{% assign ver = \"3\.10\" \| version: \">=\" %}{% if ver %}", "", paragraph, 0)
    paragraph = re.sub(r"{% endif -%}", "", paragraph, 0)

    page.content = paragraph
    return

## Migration units

def migrate_title(page, frontMatter, content):
    fmTitleRegex = re.search(r"(?<=title: ).*", frontMatter)
    if fmTitleRegex:
        page.frontMatter.title = fmTitleRegex.group(0)

    paragraphTitleRegex = re.search(r"(?<=---\n)(# .*)|(.*\n(?=={4,}))", content)
    if paragraphTitleRegex:
        page.frontMatter.title = paragraphTitleRegex.group(0).replace('#', '').replace(':', '')
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
        if hintType == 'note':
            hintType = 'tip'

        newHint = f"{{{{% {hintType} %}}}}\n{hintText}\n{{{{% /{hintType} %}}}}"
        paragraph = paragraph.replace(hint, newHint)

    return paragraph

def migrate_capture_alternative(paragraph):
    captureRE = re.findall(r"(?<={% capture alternative %})(.*?)(?= {% endcapture %})", paragraph, re.MULTILINE | re.DOTALL)
    for capture in captureRE:
        info = f"{{{{% info %}}}}\n{capture}\n{{{{% /info %}}}}"
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

def migrate_hrefs(paragraph, infos, filepath):
    hrefRegex = re.findall(r"[^\s]*\[.*\]\(.*\).*", paragraph)
    for href in hrefRegex:
        if 'https://' in href or 'http://' in href:
            continue

        if href.startswith("!"):
            paragraph = migrate_image(paragraph, href)
            continue

    linksRegex = re.findall(r"(?<=\]\()(.*?)\)", paragraph)
    for link in linksRegex:
        if ".html" in link:
            paragraph = migrate_link(paragraph, link, filepath)

    return paragraph

def migrate_image(paragraph, href):
    linkContent = re.search(r"(?<=\]\()(.*?)\)", href).group(0).replace(")", "")
    newImgName = "/images/"+ linkContent.split("/")[len(linkContent.split("/"))-1]

    if ':style' in href:
        styleRegex = re.search(r"(?<={:style=).*(?=})", href)
        if styleRegex:
            label = re.search(r"(?<=\[).*(?=\])", href).group(0)	# Bug with new style regex, to fix
            if "\"" in label:
                label = label.replace('"', '')

            imgWidget = '{{{{< icon src="{}" alt="{}" style={}>}}}}'.format(newImgName, label, styleRegex.group(0))

            return paragraph.replace(href, imgWidget)
    else:
        newImg = href.replace(linkContent, newImgName)
        return paragraph.replace(href, newImg)

def migrate_link(paragraph, href, filepath):
    linkContent = href.replace(")", "")
    filename = re.search("([^\/]+)\.html", linkContent)
    if not filename:
        return paragraph

    filename = filename.group(0).replace(".html", "").replace("/", "")
    fragment = re.search(r"#+.*", linkContent)

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

def migrate_docublock_output(exampleName):
    generatedFile = open(f"{OLD_GENERATED_FOLDER}/{exampleName}.generated", 'r', encoding="utf-8")
    output = generatedFile.read()
    output = output.replace("arangosh&gt;", "").replace("shell&gt;", "")
    output = re.sub(r"<(.*?)>", "", output, 0, re.MULTILINE)
    output = output.replace("&#x27;", "\"").replace("&quot;", "\"")

    return output

def migrateIndentedCodeblocks(paragraph):
    indentedCodeblocks = re.findall(r"(?:\n+ {4,}[^-].*)+", paragraph, re.MULTILINE)
    for codeblock in indentedCodeblocks:
        newCodeblock = f"```\n{codeblock}\n```\n"
        newCodeblock = re.sub(r"(?<=\`{3}\n)(^\n)+|^ {4}", "", newCodeblock, 0, re.MULTILINE)

        paragraph = paragraph.replace(codeblock, "\n" + newCodeblock + "\n")

    return paragraph

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
		return f"---\ntitle: {self.clean(self.title)}\nweight: {self.weight}\ndescription: {self.description}\nlayout: default\n---\n"