package arangosh

import (
	"bufio"
	"fmt"
	"os"
	"regexp"
	"strings"

	"github.com/arangodb/docs/migration-tools/arangoproxy/internal/common"
	"github.com/arangodb/docs/migration-tools/arangoproxy/internal/config"
	"github.com/arangodb/docs/migration-tools/arangoproxy/internal/utils"
	"github.com/dlclark/regexp2"
)

func ExecRoutine(example chan map[string]interface{}, outChannel chan string) {
	for {
		select {
		case exampleData := <-example:
			name := exampleData["name"].(string)
			code := exampleData["code"].(string)
			repository := exampleData["repository"].(config.Repository)
			common.Logger.Printf("[%s] [CODE] %s", name, code)
			out := Exec(name, code, repository)
			if strings.Contains(out, "EXITD") {
				common.Logger.Printf("[%s] [ERROR]: Assertion Failed", name)
				common.Logger.Printf("[%s] [ERROR]: Command output: %s", name, out)
				common.Logger.Summary("<li><strong>%s</strong>  - %s <strong> ERROR </strong></li><br>", repository.Version, name)

				os.Exit(1)
			}

			if strings.Contains(out, "ArangoError") && !strings.Contains(code, "xpError") {
				if strings.Contains(out, "ArangoError 1203") || strings.Contains(out, "ArangoError 1932") {
					code = notFoundFallbackCode(code, out)
					out = Exec(name, code, repository)
					if strings.Contains(out, "ArangoError") && !strings.Contains(code, "xpError") {
						common.Logger.Printf("[%s] [ERROR]: Found ArangoError without xpError", name)
						common.Logger.Printf("[%s] [ERROR]: Command output: %s", name, out)
						common.Logger.Summary("<li><strong>%s</strong>  - %s <strong> ERROR </strong></li><br>", repository.Version, name)

						os.Exit(1)
					}
				} else if strings.Contains(out, "ArangoError 1207") {
					var re = regexp.MustCompile(`(?m)JavaScript.*\n(.+\n)*`)
					out = re.ReplaceAllString(out, "")
				} else {

					common.Logger.Printf("[%s] [ERROR]: Found ArangoError without xpError", name)
					common.Logger.Printf("[%s] [ERROR]: Command output: %s", name, out)
					common.Logger.Summary("<li><strong>%s</strong>  - %s <strong> ERROR </strong></li><br>", repository.Version, name)

					os.Exit(1)
				}
			}

			common.Logger.Summary("<li><strong>%s</strong>  -  %s &#x2713;</li><br>", repository.Version, name)

			outChannel <- out
		}
	}
}

func Exec(exampleName string, code string, repository config.Repository) (output string) {
	code = common.AdjustCodeForArangosh(code)

	cmd := []byte(code)
	_, err := repository.StdinPipe.Write(cmd)
	if err != nil {
		common.Logger.Printf("WRITE STDINT ERROR %s", err.Error())
	}

	common.Logger.Printf("COMMAND %s", exampleName)
	scanner := bufio.NewScanner(repository.StdoutPipe)
	common.Logger.Printf("START SCAN %s", exampleName)
	buf := false
	for {
		if buf {
			break
		}
		for scanner.Scan() {
			if strings.Contains(scanner.Text(), "EOFD") {
				common.Logger.Printf("[%s] %s", exampleName, scanner.Text())
				buf = true
				break
			}

			common.Logger.Printf("[%s] %s", exampleName, scanner.Text())
			output = output + scanner.Text() + "\n"
		}
	}

	common.Logger.Printf("EXEC DONE")

	return
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

	common.Logger.Printf("CREO COLLEZIONE %s", newCommand)

	return newCommand
}

func collectionAlreadyExistsFallbackCode(code, output string) string {
	collExistsRE := regexp2.MustCompile(`(?m)(?<=ArangoError: the collection: \[).*(?=\] already exists)`, 0)
	collectionRE, err := collExistsRE.FindStringMatch(output)
	if err != nil {
		common.Logger.Printf("NULLO %s", collectionRE)

		return ""
	}

	common.Logger.Printf("COLLECTIONRE %s", collectionRE)

	collections := strings.Split(collectionRE.String(), ",")
	common.Logger.Printf("ESISTONO COLLEXIONI %s", collections)
	var newCommand string
	for _, collection := range collections {
		if strings.Contains(newCommand, fmt.Sprintf("db._drop(%s)", collection)) {
			continue
		}
		newCommand = fmt.Sprintf("%s\ndb._drop(%s)", newCommand, collection)
		common.Logger.Printf("NEW COMMMAND %s", newCommand)
	}
	newCommand = fmt.Sprintf("%s\n%s", newCommand, code)
	common.Logger.Printf("NEW FIN COMMAND %s", newCommand)
	return newCommand
}
