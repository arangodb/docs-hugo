package arangosh

import (
	"bytes"
	"fmt"
	"os/exec"
	"strings"

	"github.com/arangodb/docs/migration-tools/arangoproxy/internal/common"
	"github.com/arangodb/docs/migration-tools/arangoproxy/internal/config"
	"github.com/arangodb/docs/migration-tools/arangoproxy/internal/utils"
)

func Exec(command string, repository config.Repository) (output string) {
	commonFunctions, _ := utils.GetCommonFunctions()
	command = fmt.Sprintf("%s\n%s", commonFunctions, command)
	arangoSHBin := fmt.Sprintf("/home/toolchain/arangoproxy/arangosh/%s/usr/bin/arangosh", repository.Name)
	configFile := fmt.Sprintf("/home/toolchain/arangoproxy/arangosh/%s/usr/bin/etc/relative/arangosh.conf", repository.Name)

	cmd := exec.Command(arangoSHBin, "--config", configFile, "--server.endpoint", repository.Url, "--quiet")

	var out, er bytes.Buffer
	cmd.Stdin = strings.NewReader(strings.ReplaceAll(command, "~", ""))
	cmd.Stdout = &out
	cmd.Stderr = &er

	cmd.Run()

	if er.String() != "" {
		common.Logger.Printf("[InvokeArangoSH] [ERROR] ArangoDB Error: %s", er.String())

		return er.String()
	}

	if out.String() == "" {
		common.Logger.Printf("[InvokeArangoSH] [WARNING] Empty Output %s", out.String())

		return ""
	}

	split := strings.Split(out.String(), "\n")[1:] // Cut the Please specify a password line from output
	output = strings.Join(split, "\n")
	common.Logger.Printf("[InvokeArangoSH] Command Output: %s", output)

	return output
}
