package common

import (
	"fmt"
	"regexp"
	"strings"

	"github.com/dlclark/regexp2"
)

/*
	Functions to reformat inputs/outputs
*/

func AdjustCodeForArangosh(code string) string {
	code = strings.Replace(code, "~", "var x = ", -1)
	if !(strings.Contains(code, "EOFD")) {
		code = fmt.Sprintf("%s\nprint('EOFD');\n\n\n\n", code)
	}

	re := regexp.MustCompile(`(?m)let |const `)
	code = re.ReplaceAllString(code, "var ")

	re = regexp.MustCompile(`(?m)}\n *catch`)
	code = re.ReplaceAllString(code, "} catch")

	return code
}

func FormatResponse(response *ExampleResponse) {
	codeComments := regexp.MustCompile(`(?m)~.*`) // Cut the ~... strings from the displayed input
	response.Input = codeComments.ReplaceAllString(response.Input, "")

	re := regexp.MustCompile(`(?m)^\s*$\r?\n`) // Cut all excessive spaces and newlines from output
	response.Input = re.ReplaceAllString(response.Input, "")
	if strings.Contains(string(response.Options.Render), "output") {
		response.Output = re.ReplaceAllString(response.Output, "")
		response.Output = strings.TrimPrefix(strings.TrimPrefix(response.Output, "\n"), "\r\n")
	}

	searchErrorsInResponse(response)
	if response.Output == "" {
		response.Output = "Empty Output"
	}
}

func searchErrorsInResponse(response *ExampleResponse) {
	errorRE := regexp2.MustCompile(`(?ms)(?<=ERROR\n).*(?=END ERR)`, 0)
	errorMatch, _ := errorRE.FindStringMatch(response.Output)
	if errorMatch == nil {
		return
	}

	response.Error = errorMatch.String()
}
