package arangosh

import (
	"bytes"
	"fmt"
	"os"
	"os/exec"
	"strings"

	"github.com/arangodb/docs/migration-tools/arangoproxy/internal/common"
	"github.com/arangodb/docs/migration-tools/arangoproxy/internal/config"
	"github.com/arangodb/docs/migration-tools/arangoproxy/internal/utils"
)

func Exec(exampleName string, command string, repository config.Repository) (output string) {
	commonFunctions, _ := utils.GetCommonFunctions()
	command = fmt.Sprintf("%s\n%s", commonFunctions, command)

	arangoSHBin := fmt.Sprintf("/home/toolchain/arangoproxy/arangosh/%s/%s/usr/bin/arangosh", repository.Name, repository.Version)
	configFile := fmt.Sprintf("/home/toolchain/arangoproxy/arangosh/%s/%s/usr/bin/etc/relative/arangosh.conf", repository.Name, repository.Version)

	common.Logger.Printf("[%s] Executing on ArangoDB Server: %s %s %s - %s", exampleName, repository.Name, repository.Type, repository.Version, repository.Url)
	cmd := exec.Command(arangoSHBin, "--config", configFile, "--server.endpoint", repository.Url, "--quiet")

	var out, er bytes.Buffer
	cmd.Stdin = strings.NewReader(strings.ReplaceAll(command, "~", ""))
	cmd.Stdout = &out
	cmd.Stderr = &er

	cmd.Run()

	if er.String() != "" {
		errorString := fmt.Sprintf("[%s] [InvokeArangoSH] [ERROR] ArangoDB Error: %s", exampleName, er.String())
		common.Logger.Printf(errorString)

		os.Exit(1)
	}

	if out.String() == "" {
		msg := fmt.Sprintf("[%s] [InvokeArangoSH] [WARNING] Empty Output %s", exampleName, out.String())
		common.Logger.Printf(msg)

		return ""
	}

	// if strings.Contains(out.String(), "ArangoError") {
	// 	if !strings.Contains(command, "xpError") {
	// 		msg := fmt.Sprintf("[%s] [InvokeArangoSH] ArangoError without xpError: %s", exampleName, out.String())
	// 		common.Logger.Printf(msg)
	// 		//os.Exit(1)
	// 	}
	// 	return output
	// }

	split := strings.Split(out.String(), "\n")[1:] // Cut the Please specify a password line from output
	output = strings.Join(split, "\n")
	common.Logger.Printf("[%s] [InvokeArangoSH] Command Output: %s", exampleName, output)

	return output
}
