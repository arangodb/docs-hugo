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

	arangoSHBin := fmt.Sprintf("/home/arangoproxy/arangosh/%s/usr/bin/arangosh", repository.Name)
	configFile := fmt.Sprintf("/home/arangoproxy/arangosh/%s/usr/bin/etc/relative/arangosh.conf", repository.Name)

	cmd := exec.Command(arangoSHBin, "--config", configFile, "--server.endpoint", repository.Url, "--quiet")

	var out, er bytes.Buffer
	cmd.Stdin = strings.NewReader(strings.ReplaceAll(command, "~", ""))
	cmd.Stdout = &out
	cmd.Stderr = &er

	cmd.Run()

	common.Logger.Printf("[InvokeArangoSH] [RESULT] %s", out.String())
	common.Logger.Printf("[InvokeArangoSH] [RESULT 2] %s", er.String())

	return ""
}
