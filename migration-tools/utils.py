import re
from os.path import relpath
import globals

## TODO: These functions are horrible, refactor with cleaner code

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
    paragraphDescRegex = re.search(r"(?<=\n\n)[\w\s\W]+(?={:class=\"lead\"})", buffer)
    if paragraphDescRegex:
        description = paragraphDescRegex.group(0)
        if not "page.description" in description:
            description = description.replace("\n", "\n  ")
            page.frontMatter.description = f">-\n  {description}"
        else:
            page.frontMatter.description = re.search(r"(?<=description: )(.*?)((?=\n\w)|(?=---))", buffer, re.MULTILINE | re.DOTALL).group(0)

def migrate_hints(paragraph):
    hintRegex = re.findall(r" *{% hint .*? %}.*?{% endhint %}", paragraph, re.MULTILINE | re.DOTALL)
    for hint in hintRegex:
        hintSplit = hint.split("\n")
        hintType = re.search(r"'.*[']* %}", hintSplit[0]).group(0).replace("'", '').strip(" %}")
        if hintType == 'note':
            hintType = 'tip'

        newHint = hint.replace(f"{{% hint '{hintType}' %}}", f"{{{{% hints/{hintType} %}}}}")
        newHint = newHint.replace("{% endhint %}", f"{{{{% /hints/{hintType} %}}}}")
        paragraph = paragraph.replace(hint, newHint)

    return paragraph

def migrate_capture_alternative(paragraph):
    paragraph = paragraph.replace("{% capture alternative %}", "{{% hints/info %}}").replace("{% endcapture %}", "{{% /hints/info %}}")
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
    for key in globals.static_replacements["comments"]:
        paragraph = paragraph.replace(key, globals.static_replacements["comments"][key])
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

    for k in globals.infos.keys():
        if not "fileID" in globals.infos[k]:
            continue

        if globals.infos[k]["fileID"] == filename:
            referencingPath = re.search(r"(?<=site\/content\/).*", filepath).group(0)
            referencedPath = re.search(r"(?<=site\/content\/).*", k).group(0)  #Adjust link according to new directory-structure

            newAnchor = relpath(referencedPath, referencingPath).replace("../", "", 1)
            if fragment:
                newAnchor = f"{newAnchor}{fragment.group(0)}"
                
            newHref = href.replace(linkContent, newAnchor).replace(".html", "").replace(".md", "").replace("_index", "")
            paragraph = paragraph.replace(href, newHref)

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

def migrate_codeblocks(paragraph):
    tabsShortcodeStart = "{{< tabs >}}"
    tabsSortcodeEnd = "{{< /tabs >}}"
    alreadyProcessed = []
    codeblocks = re.findall(r"\`{3}(?:.*?)\`{3}", paragraph, re.MULTILINE | re.DOTALL)
    for codeblock in codeblocks:
        if codeblock in alreadyProcessed:
            continue

        lang = codeblock.split("\n")[0].replace("`", "")
        tabStart = f'{{{{% tab name="{lang}" %}}}}'
        tabEnd = '{{% /tab %}}'

        newCodeblock = f"{tabsShortcodeStart}\n{tabStart}\n{codeblock}\n{tabEnd}\n{tabsSortcodeEnd}"
        alreadyProcessed.append(codeblock)
        paragraph = paragraph.replace(codeblock, newCodeblock)

    
    # Codeblock as spaces not backticks
    alreadyProcessed = []
    codeblocks =  re.findall(r"^\s{4,}arangosh(?:.*?)(?=^\w)", paragraph, re.MULTILINE | re.DOTALL)
    for codeblock in codeblocks:
        if codeblock in alreadyProcessed:
            continue

        tabStart = f'{{{{% tab name="bash" %}}}}'
        tabEnd = '{{% /tab %}}'

        newCodeblock = f"{tabsShortcodeStart}\n{tabStart}\n{codeblock}\n{tabEnd}\n{tabsSortcodeEnd}\n"
        alreadyProcessed.append(codeblock)
        paragraph = paragraph.replace(codeblock, newCodeblock)

    return paragraph

def migrate_docublock_output(exampleName):
    generatedFile = open(f"{globals.OLD_GENERATED_FOLDER}/{exampleName}.generated", 'r', encoding="utf-8")
    output = generatedFile.read()
    output = output.replace("arangosh&gt;", "").replace("shell&gt;", "")
    output = re.sub(r"<(.*?)>", "", output, 0, re.MULTILINE)
    output = output.replace("&#x27;", "\"").replace("&quot;", "\"")

    return output

def clean_line(line):
    line = line.replace("//", "/").replace("&","").replace(" ", "-")
    line = re.sub(r"-{2,}", "-", line)
    return line.replace("#", "sharp").replace(".net", "dotnet")

def is_index(filename):
    return filename.endswith("_index.md")
