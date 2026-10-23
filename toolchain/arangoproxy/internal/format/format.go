package format

import (
	"encoding/json"
	"fmt"
	"math"
	"regexp"
	"strings"

	"github.com/arangodb/docs/migration-tools/arangoproxy/internal/utils"
	"github.com/dlclark/regexp2"
)

/*
	Functions to reformat inputs/outputs
*/

func AdjustCodeForArangosh(code string) string {
	out := ""
	hide := false
	buffer := []string{}

	if !(strings.Contains(code, "EOFD")) {
		code = fmt.Sprintf("%s\nprint('EOFD');\n\n\n\n", code)
	}

	code = strings.ReplaceAll(code, "\r\n", "\n")
	re := regexp.MustCompile(`(?m)}\n *catch`)
	code = re.ReplaceAllString(code, "} catch")

	lines := strings.Split(code, "\n")

	for _, line := range lines {
		re := regexp.MustCompile(`(?m)let |const `)
		line = re.ReplaceAllString(line, "var ")

		assertRE := regexp2.MustCompile(`(?m)(?<=assert\().*(?=\))`, 0) // Replace all asserts args with String args because we want to eval() assert args
		if assertArgs, _ := assertRE.FindStringMatch(line); assertArgs != nil {
			args := strings.ReplaceAll(assertArgs.String(), "\"", "`")
			args = strings.ReplaceAll(args, "'", "`")

			line = fmt.Sprintf("assert(%s, '%s');\n", args, args)
		}

		tildeRE := regexp.MustCompile(`(?m)^\s*~`)

		if hide && !tildeRE.MatchString(line) {
			hide = false
			hiddenCode := strings.Join(buffer, "\n")
			out = fmt.Sprintf("%s\nprint('HIDED-START')\n%s\nprint('HIDED-END');\n%s", out, hiddenCode, line)
			buffer = []string{}
			continue
		}

		if tildeRE.MatchString(line) || hide {
			hide = true
			line = tildeRE.ReplaceAllString(line, "")
			buffer = append(buffer, line)
			continue
		}

		out = fmt.Sprintf("%s\n%s", out, line)
	}
	return out
}

/*
	Custom formatters
*/

/*
	JS Formatter
*/

/*
	Curl Formatter
*/

type CurlFormatter struct {
}

func (formatter CurlFormatter) FormatCommand(code string) string {
	multiLineRE := regexp.MustCompile(`(?m)[+]\s*\n*`)
	allMultiLines := multiLineRE.FindAllString(code, -1)
	for _, multiLine := range allMultiLines {
		noMoreMultiline := strings.ReplaceAll(multiLine, "\n", "")
		code = strings.Replace(code, multiLine, noMoreMultiline, -1)
	}

	return code
}

func (formatter CurlFormatter) FormatCurlOutput(arangoOutput, renderOption string) (input, output string, err error) {
	curlRE := regexp2.MustCompile(`(?ms)REQ(.*?)ENDREQ`, 0)
	curlRequests := utils.Regexp2FindAllString(curlRE, arangoOutput)
	for _, curl := range curlRequests {
		input = fmt.Sprintf("%s\n%s", input, curl)
	}

	input = strings.ReplaceAll(input, "REQ", "")
	input = strings.ReplaceAll(input, "ENDREQ", "")
	input = strings.ReplaceAll(input, "END", "\n")

	respRE := regexp2.MustCompile(`(?ms)RESP(.*?)ENDRESP`, 0)
	responses := utils.Regexp2FindAllString(respRE, arangoOutput)
	for _, response := range responses {
		output = fmt.Sprintf("%s\n%s", output, response)
	}

	output = strings.ReplaceAll(output, "RESP", "")
	output = strings.ReplaceAll(output, "ENDRESP", "")
	output = strings.ReplaceAll(output, "END", "\n")

	return input, output, nil
}

/*
	AQL Formatter
*/

type AQLFormatter struct{}

func (formatter AQLFormatter) FormatRequestCode(code string, bindVars map[string]interface{}) string {
	commands := fmt.Sprintf("db._query(`%s`", code)
	if len(bindVars) != 0 {
		bindVarsJson, _ := json.Marshal(bindVars)
		commands = fmt.Sprintf("%s, %s", commands, bindVarsJson)
	}

	commands = commands + ").toArray();"
	return commands
}

/*
	Openapi Formatter
*/

type OpenapiFormatter struct{}

// Admonition shortcodes of the docs theme. They have no equivalent in plain
// Markdown, so they are converted to blockquotes with an uppercase label for
// the machine-readable OpenAPI specifications. The comment shortcode renders
// nothing, therefore its body is dropped.
var admonitionShortcodes = []string{"warning", "info", "danger", "tip", "security", "comment"}

// One expression per shortcode because Go's regexp package has no
// backreferences. Each one swallows the indentation of the opening marker and
// the blank lines around both markers so that the blockquote can be placed as
// a stand-alone block.
var admonitionREs = func() map[string]*regexp.Regexp {
	res := make(map[string]*regexp.Regexp, len(admonitionShortcodes))
	for _, admonition := range admonitionShortcodes {
		res[admonition] = regexp.MustCompile(`(?s)(?:[ \t]*\n)*([ \t]*)\{\{<\s*` + admonition +
			`\s*>\}\}[ \t]*\n?(.*?)\n?[ \t]*\{\{<\s*/\s*` + admonition + `\s*>\}\}[ \t]*\n?(?:[ \t]*\n)*`)
	}
	return res
}()

var admonitionOpeningRE = regexp.MustCompile(`\{\{<\s*(?:` + strings.Join(admonitionShortcodes, "|") + `)\s*>\}\}`)

var shortcodeRE = regexp.MustCompile(`\{\{[<%].*?[>%]\}\}`)

// EditDescriptions converts the admonitions of every description and summary
// of an OpenAPI specification to Markdown, modifying the specification in place
func (formatter OpenapiFormatter) EditDescriptions(node interface{}) {
	switch typed := node.(type) {
	case map[string]interface{}:
		for key, value := range typed {
			if text, isText := value.(string); isText {
				if key == "description" || key == "summary" {
					typed[key] = ConvertAdmonitions(text)
				}
				continue
			}
			formatter.EditDescriptions(value)
		}
	case []interface{}:
		for _, value := range typed {
			formatter.EditDescriptions(value)
		}
	}
}

// LeftoverShortcodes returns the Hugo shortcodes that remain in a specification
// after the conversion, without duplicates. Shortcodes are meaningless outside
// of Hugo and must not end up in the OpenAPI specification files, so callers
// are expected to report them as an error.
func (formatter OpenapiFormatter) LeftoverShortcodes(node interface{}) []string {
	found := []string{}
	seen := make(map[string]bool)
	walkStrings(node, func(text string) {
		for _, shortcode := range shortcodeRE.FindAllString(text, -1) {
			if !seen[shortcode] {
				seen[shortcode] = true
				found = append(found, shortcode)
			}
		}
	})
	return found
}

func walkStrings(node interface{}, visit func(text string)) {
	switch typed := node.(type) {
	case map[string]interface{}:
		for _, value := range typed {
			walkStrings(value, visit)
		}
	case []interface{}:
		for _, value := range typed {
			walkStrings(value, visit)
		}
	case string:
		visit(typed)
	}
}

// ConvertAdmonitions replaces the admonition shortcodes of a Markdown text with
// blockquotes. The body of an admonition can span multiple paragraphs and
// contain arbitrary Markdown, including indented code blocks and nested
// admonitions. Texts without admonitions are returned unchanged.
func ConvertAdmonitions(text string) string {
	converted := false
	for {
		convertedAny := false
		for _, admonition := range admonitionShortcodes {
			match := findInnermostAdmonition(admonitionREs[admonition], text)
			if match == nil {
				continue
			}
			text = text[:match[0]] + admonitionBlockquote(admonition, text, match) + text[match[1]:]
			convertedAny, converted = true, true
		}
		if !convertedAny {
			break
		}
	}
	if !converted {
		return text
	}
	return strings.Trim(text, "\n")
}

// findInnermostAdmonition returns the first match whose body contains no
// admonition of its own, so that nested admonitions are converted inside out
func findInnermostAdmonition(re *regexp.Regexp, text string) []int {
	for _, match := range re.FindAllStringSubmatchIndex(text, -1) {
		if !admonitionOpeningRE.MatchString(text[match[4]:match[5]]) {
			return match
		}
	}
	return nil
}

// admonitionBlockquote renders the admonition that match locates in text as a
// Markdown blockquote, surrounded by blank lines to keep it separate from
// adjacent paragraphs. Comments are dropped, leaving only the separation.
func admonitionBlockquote(admonition, text string, match []int) string {
	spacing, body := text[match[2]:match[3]], text[match[4]:match[5]]

	// The whitespace in front of the opening marker is only indentation if the
	// marker starts a line, otherwise it separates it from preceding text
	startsLine := match[0] == 0 || strings.Contains(text[match[0]:match[2]], "\n")
	indent := ""
	if startsLine {
		indent = spacing
	}

	if admonition == "comment" {
		if startsLine || strings.Contains(text[match[5]:match[1]], "\n") {
			return "\n\n"
		}
		return spacing
	}

	lines := deindentLines(strings.Split(body, "\n"))
	quoted := make([]string, 0, len(lines)+2)
	quoted = append(quoted, indent+"> **"+strings.ToUpper(admonition)+"**", indent+">")
	for _, line := range lines {
		if line == "" {
			quoted = append(quoted, indent+">")
		} else {
			quoted = append(quoted, indent+"> "+line)
		}
	}
	return "\n\n" + strings.Join(quoted, "\n") + "\n\n"
}

// deindentLines removes the common leading whitespace from the body of an
// admonition, like the .InnerDeindent of Hugo does, and normalizes the
// remaining leading whitespace to spaces
func deindentLines(lines []string) []string {
	remove := math.MaxInt
	for _, line := range lines {
		columns, rest := splitIndent(line)
		if rest != "" && columns < remove {
			remove = columns
		}
	}

	for i, line := range lines {
		columns, rest := splitIndent(line)
		if rest == "" {
			lines[i] = ""
			continue
		}
		lines[i] = strings.Repeat(" ", columns-remove) + rest
	}
	return lines
}

// splitIndent separates the leading whitespace of a line from the rest and
// returns how many columns it spans. Tabs advance to the next multiple of four
// columns, the tab size that Markdown assumes for indented code blocks. The
// returned rest is empty for lines that only consist of whitespace.
func splitIndent(line string) (columns int, rest string) {
	for i := 0; i < len(line); i++ {
		switch line[i] {
		case ' ':
			columns++
		case '\t':
			columns += 4 - columns%4
		default:
			return columns, line[i:]
		}
	}
	return columns, ""
}
