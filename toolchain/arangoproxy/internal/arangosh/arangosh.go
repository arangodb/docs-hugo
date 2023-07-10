package arangosh

import (
	"bufio"
	"strings"

	"github.com/arangodb/docs/migration-tools/arangoproxy/internal/common"
	"github.com/arangodb/docs/migration-tools/arangoproxy/internal/config"
)

func ExecRoutine(example chan map[string]interface{}, outChannel chan string) {
	for {
		select {
		case exampleData := <-example:
			name := exampleData["name"].(string)
			code := exampleData["code"].(string)
			repository := exampleData["repository"].(config.Repository)

			out := Exec(name, code, repository)
			if strings.Contains(out, "EXITD") {
				common.Logger.Printf("[%s] [ERROR]: Assertion Failed", name)
				common.Logger.Printf("[%s] [ERROR]: Command output: %s", name, out)
				common.Logger.Summary("<li><strong>%s</strong>  - %s <strong> ERROR </strong></li><br>", repository.Version, name)

				// os.Exit(1)
			}

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

	common.Logger.Summary("<li><strong>%s</strong>  -  %s &#x2713;</li><br>", repository.Version, exampleName)
	common.Logger.Printf("EXEC DONE")

	return
}
