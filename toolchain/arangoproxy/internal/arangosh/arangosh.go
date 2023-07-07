package arangosh

import (
	"bufio"
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/arangodb/docs/migration-tools/arangoproxy/internal/common"
	"github.com/arangodb/docs/migration-tools/arangoproxy/internal/config"
	"github.com/arangodb/docs/migration-tools/arangoproxy/internal/utils"
	"github.com/dlclark/regexp2"
)

var mu sync.Mutex

func ExecRoutine(example chan map[string]interface{}, outChannel chan string) {
	for {
		select {
		case exampleData := <-example:
			name := exampleData["name"].(string)
			code := exampleData["code"].(string)
			repository := exampleData["repository"].(config.Repository)

			out := Exec(name, code, repository)

			outChannel <- out
		}
	}
}

func Exec(exampleName string, code string, repository config.Repository) (output string) {
	code = common.AdjustCodeForArangosh(code)

	common.Logger.Printf("EXEC")
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
	// // time.Sleep(time.Second * 3)
	// // commonFunctions, _ := utils.GetCommonFunctions()
	// // command := fmt.Sprintf("%s\n%s", commonFunctions, code)

	// // arangoSHBin := fmt.Sprintf("/home/toolchain/arangoproxy/arangosh/%s/%s/usr/bin/arangosh", repository.Name, repository.Version)
	// // configFile := fmt.Sprintf("/home/toolchain/arangoproxy/arangosh/%s/%s/usr/bin/etc/relative/arangosh.conf", repository.Name, repository.Version)
	// // mu.Lock()
	// // common.Logger.Printf("[%s] Executing on ArangoDB Server: %s %s %s - %s", exampleName, repository.Name, repository.Type, repository.Version, repository.Url)

	// // cmd := exec.Command(arangoSHBin, "--config", configFile, "--server.endpoint", repository.Url, "--quiet")

	// // var out, er bytes.Buffer
	// // cmd.Stdin = strings.NewReader(strings.ReplaceAll(command, "~", ""))
	// // cmd.Stdout = &out
	// // cmd.Stderr = &er

	// // cmd.Run()

	// if er.String() != "" {
	// 	errorString := fmt.Sprintf("[%s] [InvokeArangoSH] [ERROR] ArangoDB Error: %s", exampleName, er.String())
	// 	common.Logger.Printf(errorString)

	// 	os.Exit(1)
	// }

	// if out.String() == "" {
	// 	msg := fmt.Sprintf("[%s] [InvokeArangoSH] [WARNING] Empty Output %s", exampleName, out.String())
	// 	common.Logger.Printf(msg)

	// 	return ""
	// }

	// mu.Unlock()
	// if strings.Contains(out.String(), "ArangoError") {
	// 	if !strings.Contains(command, "xpError") && !strings.Contains(out.String(), "ArangoError 1207") && !strings.Contains(out.String(), "ArangoError 1203") {
	// 		// newCommand := arangoErrorFallback(code, out.String())
	// 		// if newCommand == "" {
	// 		msg := fmt.Sprintf("[%s] [InvokeArangoSH] ArangoError without xpError: %s\n%s", command, exampleName, out.String())
	// 		common.Logger.Printf(msg)
	// 		common.Logger.Summary("<li><strong>%s</strong>: %s <strong>Error</strong>\n", repository.Version, exampleName)
	// 		common.Logger.Summary("<strong>Stacktrace</strong><br>%s</li>", out.String())

	// 		//os.Exit(1)
	// 		// }
	// 		// Exec(exampleName, newCommand, repository)
	// 	}
	// 	split := strings.Split(out.String(), "\n")[1:] // Cut the Please specify a password line from output
	// 	output = strings.Join(split, "\n")
	// 	return output
	// }

	// split := strings.Split(out.String(), "\n")[1:] // Cut the Please specify a password line from output
	// output = strings.Join(split, "\n")
	// common.Logger.Printf("[%s] [InvokeArangoSH] Command Output: %s", exampleName, output)
	// common.Logger.Summary("<li><strong>%s</strong>  -  %s &#x2713;</li><br>", repository.Version, exampleName)
	// return output
}

func arangoErrorFallback(code, output string) string {
	if strings.Contains(output, "ArangoError 1203") || strings.Contains(output, "ArangoError 1932") {
		return notFoundFallbackCode(code, output)
	}

	if strings.Contains(output, "ArangoError 2001") {
		time.Sleep(time.Second * 2)
		return code
	}

	if strings.Contains(output, "ArangoError 2001") {
		time.Sleep(time.Second * 5)
		return code
	}

	// if strings.Contains(output, "ArangoError 1207") {
	// 	return collectionAlreadyExistsFallbackCode(code, output)
	// }

	// if strings.Contains(output, "ArangoError 1200") || strings.Contains(output, "ArangoError 1924") || strings.Contains(output, "ArangoError 30") || strings.Contains(output, "ArangoError 2001") {
	// 	time.Sleep(time.Second * 1)
	// 	return code
	// }

	// if strings.Contains(output, "ArangoError 1202") {
	// 	return strings.Replace(code, "db._drop", "print", 1)
	// }

	// common.Logger.Printf("BOOASDOASDOASODISAOFIOSAIFOSAF %s", output)

	return ""
}

func notFoundFallbackCode(code, output string) string {
	collNotFoundRE := regexp2.MustCompile(`(?m)(?<=collection or view not found: )\w+|(?<=ArangoError: collection )'?\w+`, 0)
	collections := utils.Regexp2FindAllString(collNotFoundRE, output)
	if len(collections) == 0 {
		return ""
	}

	var newCommand string

	for _, collection := range collections {
		collection = strings.Replace(collection, "'", "", -1)
		if collection == "_graphs" {
			continue
		}
		if strings.Contains(newCommand, fmt.Sprintf("db._create('%s')", collection)) {
			continue
		}

		newCommand = fmt.Sprintf("db._create('%s')\n%s\ndb._drop('%s')", collection, code, collection)

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
