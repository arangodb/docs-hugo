package internal

import (
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"sync"

	"github.com/arangodb/docs/migration-tools/arangoproxy/internal/arangosh"
	"github.com/arangodb/docs/migration-tools/arangoproxy/internal/common"
	"github.com/arangodb/docs/migration-tools/arangoproxy/internal/config"
	"github.com/arangodb/docs/migration-tools/arangoproxy/internal/utils"
)

func CleanCache() {
	os.OpenFile(config.Conf.Cache, os.O_TRUNC, 0644)
	emptyFile := make(map[string]string)
	emptyFileBrackets, _ := json.Marshal(emptyFile)
	os.WriteFile(config.Conf.Cache, emptyFileBrackets, 0644)
	for _, repository := range config.Conf.Repositories {
		arangosh.Exec("INIT COMMAND", utils.REMOVE_ALL_COLLECTIONS, repository) // FIXME
	}
}

func InitRepositories() {
	common.Repositories = make(map[string]config.Repository)
	fmt.Printf("INIT REPOSITORIES CONF %s\n", config.Conf.Repositories)
	var wg sync.WaitGroup
	for _, repo := range config.Conf.Repositories {
		wg.Wait()
		wg.Add(2)
		openRepoStream(&repo)
		common.Repositories[fmt.Sprintf("%s_%s_%s", repo.Name, repo.Type, repo.Version)] = repo
		commonFunctions, _ := utils.GetCommonFunctions()
		arangosh.Exec("COMMON FUNCTIONS LOAD", commonFunctions, repo)
		wg.Done()
		common.Logger.Printf("COMMON DONE")
		cmd, _ := utils.GetSetupFunctions()
		arangosh.Exec("INIT COMMAND", cmd, repo)
		wg.Done()
		common.Logger.Printf("INIT COMMAND DONE")
	}
}

func openRepoStream(repository *config.Repository) {
	arangoSHBin := fmt.Sprintf("/home/toolchain/arangoproxy/arangosh/%s/%s/usr/bin/arangosh", repository.Name, repository.Version)
	configFile := fmt.Sprintf("/home/toolchain/arangoproxy/arangosh/%s/%s/usr/bin/etc/relative/arangosh.conf", repository.Name, repository.Version)

	cmd := exec.Command(arangoSHBin, "--config", configFile, "--server.endpoint", repository.Url, "--quiet")

	stdin, err := cmd.StdinPipe()
	if err != nil {
		common.Logger.Printf("[openRepoStream] Error Open STDINPIPE %s", err.Error())
	}

	stdout, err := cmd.StdoutPipe()
	if err != nil {
		common.Logger.Printf("[openRepoStream] Error Open STDOUTPIPE %s", err.Error())
	}
	if err := cmd.Start(); err != nil {
		common.Logger.Printf("[openRepoStream] Error Start Command %s", err.Error())
	}

	repository.StdinPipe = stdin
	repository.StdoutPipe = stdout
	common.Logger.Printf("[openRepoStream] Done - Streams: \n%s\n%s", repository.StdinPipe, repository.StdoutPipe)
}
