package arangosh

import (
	"bufio"
	"errors"
	"fmt"
	"regexp"
	"strings"

	"github.com/arangodb/docs/migration-tools/arangoproxy/internal/format"
	"github.com/arangodb/docs/migration-tools/arangoproxy/internal/models"
	"github.com/arangodb/docs/migration-tools/arangoproxy/internal/utils"
	"github.com/dlclark/regexp2"
)

func ExecRoutine(example chan map[string]interface{}, outChannel chan map[string]interface{}) {
	for {
		select {
		case exampleData := <-example:
			name := exampleData["name"].(string)
			code := exampleData["code"].(string)
			repository := exampleData["repository"].(models.Repository)

			out := Exec(name, code, repository)

			var err error

			out, err = checkAssertionFailed(name, code, out, repository)
			if err != nil {
				outChannel <- map[string]interface{}{"output": out, "err": err, "name": name, "version": repository.Version}
				return
			}

			out, err = checkArangoError(name, code, out, repository)

			outChannel <- map[string]interface{}{"output": out, "err": err, "name": name, "version": repository.Version}
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
	for {
		if buf {
			break
		}

		for scanner.Scan() {
			if strings.Contains(scanner.Text(), "EOFD") {
				buf = true
				break
			}

			output = output + scanner.Text() + "\n"
		}
	}

	return
}

func checkAssertionFailed(name, code, out string, repository models.Repository) (string, error) {
	if strings.Contains(out, "EXITD") {
		models.Logger.Printf("[%s] [ERROR]: Assertion Failed", name)
		models.Logger.Printf("[%s] [ERROR]: Command output: %s", name, out)

		return out, errors.New(out)
	}
	return out, nil
}

func checkArangoError(name, code, out string, repository models.Repository) (string, error) {
	if strings.Contains(out, "ArangoError") && !strings.Contains(code, "xpError") {
		if strings.Contains(out, "ArangoError 1203") || strings.Contains(out, "ArangoError 1932") {
			return handleCollectionNotFound(name, code, out, repository)
		} else if strings.Contains(out, "ArangoError 1207") {
			var re = regexp.MustCompile(`(?m)JavaScript.*\n(.+\n)*`)
			out = re.ReplaceAllString(out, "")
			return out, nil
		} else {
			models.Logger.Printf("[%s] [ERROR]: Found ArangoError without xpError", name)
			models.Logger.Printf("[%s] [ERROR]: Command output: %s", name, out)

			return out, errors.New(out)
		}
	}

	return out, nil
}

func handleCollectionNotFound(name, code, out string, repository models.Repository) (string, error) {
	code = notFoundFallbackCode(code, out)
	output := Exec(name, code, repository)
	if strings.Contains(output, "ArangoError") && !strings.Contains(code, "xpError") {
		models.Logger.Printf("[%s] [ERROR]: Found ArangoError without xpError", name)
		models.Logger.Printf("[%s] [ERROR]: Command output: %s", name, output)

		return output, errors.New(output)
	}

	return output, nil
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
