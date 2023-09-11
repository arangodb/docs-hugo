package arangosh

import (
	"bufio"
	"fmt"
	"regexp"
	"strings"

	"github.com/arangodb/docs/migration-tools/arangoproxy/internal/format"
	"github.com/arangodb/docs/migration-tools/arangoproxy/internal/models"
	"github.com/arangodb/docs/migration-tools/arangoproxy/internal/utils"
	"github.com/dlclark/regexp2"
)

func ExecRoutine(example chan map[string]interface{}, outChannel chan string) {
	for {
		select {
		case exampleData := <-example:
			name := exampleData["name"].(string)
			code := exampleData["code"].(string)
			filepath := exampleData["filepath"].(string)
			repository := exampleData["repository"].(models.Repository)

			out := Exec(name, code, repository)

			out = checkAssertionFailed(name, code, out, filepath, repository)
			out = checkArangoError(name, code, out, filepath, repository)

			outChannel <- out
		}
	}
}

func Exec(exampleName string, code string, repository models.Repository) (output string) {
	code = format.AdjustCodeForArangosh(code)

	cmd := []byte(code)
	_, err := repository.StdinPipe.Write(cmd)
	if err != nil {
		models.Logger.Printf("WRITE STDINT ERROR %s", err.Error())
	}

	scanner := bufio.NewScanner(repository.StdoutPipe)
	buf := false
	inArangoError := false
	xpError := false
	hide := false

	if strings.Contains(code, "xpError") {
		xpError = true

	}
	for {
		if buf {
			break
		}

		for scanner.Scan() {
			if strings.Contains(scanner.Text(), "EOFD") {
				buf = true
				break
			}

			if scanner.Text() == "\n" {
				inArangoError = false
			}

			if strings.Contains(scanner.Text(), "HIDED-START") {
				hide = true
				continue
			}

			if strings.Contains(scanner.Text(), "HIDED-END") {
				hide = false
				continue
			}

			if hide {
				continue
			}

			if inArangoError {
				continue
			}

			if xpError {
				if strings.Contains(scanner.Text(), "ArangoError") && !inArangoError {
					inArangoError = true
					re := regexp.MustCompile(`(?m)ArangoError.*`)
					output = output + "[" + re.FindString(scanner.Text()) + "]"
					continue
				}
			}

			output = output + scanner.Text() + "\n"
		}
	}

	return
}

func checkAssertionFailed(name, code, out, filepath string, repository models.Repository) string {
	if strings.Contains(out, "ASSERTD") {
		models.Logger.Printf("[%s] [ERROR]: Assertion Failed", name)
		models.Logger.Printf("[%s] [ERROR]: Command output: %s", name, out)

		re := regexp.MustCompile(`(?m)ASSERTD.*`)
		models.Logger.Summary("<li><error code=3><strong>%s</strong>  - %s <strong> ERROR %s</strong></error></li>", repository.Version, name, filepath)
		for _, match := range re.FindAllString(out, -1) {
			assertCondition := strings.ReplaceAll(match, "ASSERTD ", "")
			models.Logger.Summary("Assertion Failed for condition %s", assertCondition)
		}
		return "ERRORD"
	}
	return out
}

func checkArangoError(name, code, out, filepath string, repository models.Repository) string {
	if strings.Contains(out, "ERRORD") {
		return out
	}

	if strings.Contains(out, "ArangoError") && !strings.Contains(code, "xpError") {
		if strings.Contains(out, "ArangoError 1203") || strings.Contains(out, "ArangoError 1932") {
			return handleCollectionNotFound(name, code, out, filepath, repository)
		} else if strings.Contains(out, "ArangoError 1207") {
			var re = regexp.MustCompile(`(?m)JavaScript.*\n(.+\n)*`)
			out = re.ReplaceAllString(out, "")
			return out
		} else {
			models.Logger.Printf("[%s] [ERROR]: Found ArangoError without xpError", name)
			models.Logger.Printf("[%s] [ERROR]: Command output: %s", name, out)

			re := regexp.MustCompile(`(?m)JavaScript exception.*|ArangoError.*`)
			models.Logger.Summary("<li><error code=3><strong>%s</strong>  - %s <strong> ERROR %s</strong></error></li><br>", repository.Version, name, filepath)
			for _, match := range re.FindAllString(out, -1) {
				models.Logger.Summary(match)
			}
			return "ERRORD"
		}
	}

	return out
}

func handleCollectionNotFound(name, code, out, filepath string, repository models.Repository) string {
	code = notFoundFallbackCode(code, out)
	output := Exec(name, code, repository)
	if strings.Contains(output, "ArangoError") && !strings.Contains(code, "xpError") {
		models.Logger.Printf("[%s] [ERROR]: Found ArangoError without xpError", name)
		models.Logger.Printf("[%s] [ERROR]: Command output: %s", name, output)

		re := regexp.MustCompile(`(?m)JavaScript exception.*|ArangoError.*`)
		models.Logger.Summary("<li><error code=3><strong>%s</strong>  - %s <strong> ERROR %s</strong></error></li><br>", repository.Version, name, filepath)
		for _, match := range re.FindAllString(out, -1) {
			models.Logger.Summary(match)
		}
		return "ERRORD"
	}

	return output
}

func notFoundFallbackCode(code, output string) string {
	output = strings.Replace(output, "name: ", "", -1)
	collNotFoundRE := regexp2.MustCompile(`(?m)(?<=collection or view not found: )\w+|(?<=ArangoError: collection )'?\w+`, 0)
	collections := utils.Regexp2FindAllString(collNotFoundRE, output)
	if len(collections) == 0 {
		return ""
	}

	var newCommand string

	for _, collection := range collections {
		collection = strings.Replace(collection, "'", "", -1)
		if strings.Contains(newCommand, fmt.Sprintf("db._create('%s')", collection)) {
			continue
		}

		newCommand = fmt.Sprintf("\n\n\ndb._create('%s')\n%s\ndb._drop('%s')\n\n\n\n", collection, code, collection)

	}

	return newCommand
}
