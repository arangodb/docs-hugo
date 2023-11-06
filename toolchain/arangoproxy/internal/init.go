package internal

import (
	"fmt"
	"os/exec"
	"sync"

	"github.com/arangodb/docs/migration-tools/arangoproxy/internal/arangosh"
	"github.com/arangodb/docs/migration-tools/arangoproxy/internal/models"
	"github.com/arangodb/docs/migration-tools/arangoproxy/internal/utils"
)

func InitRepositories() {
	models.Repositories = make(map[string]models.Repository)
	var wg sync.WaitGroup

	for _, repo := range models.Conf.Repositories {
		wg.Wait()
		wg.Add(2)

		openRepoStream(&repo)

		models.Repositories[fmt.Sprintf("%s_%s", repo.Type, repo.Version)] = repo

		commonFunctions, _ := utils.GetCommonFunctions()
		arangosh.Exec("Load common functions", commonFunctions, "", repo)
		wg.Done()

		cmd, _ := utils.GetSetupFunctions()
		arangosh.Exec("Init collections", cmd, "", repo)
		wg.Done()
	}
}

func openRepoStream(repository *models.Repository) {
	arangoSHBin := fmt.Sprintf("/arangosh/arangosh/%s/usr/bin/arangosh", repository.Version)
	configFile := fmt.Sprintf("/arangosh/arangosh/%s/usr/bin/etc/relative/arangosh.conf", repository.Version)

	cmd := exec.Command(arangoSHBin, "--config", configFile, "--server.endpoint", repository.Url, "--quiet")

	stdin, err := cmd.StdinPipe()
	if err != nil {
		models.Logger.Printf("[openRepoStream] Error Open STDINPIPE %s", err.Error())
	}

	stdout, err := cmd.StdoutPipe()
	if err != nil {
		models.Logger.Printf("[openRepoStream] Error Open STDOUTPIPE %s", err.Error())
	}

	if err := cmd.Start(); err != nil {
		models.Logger.Printf("[openRepoStream] Error Start Command %s", err.Error())
	}

	repository.StdinPipe = stdin
	repository.StdoutPipe = stdout
	models.Logger.Printf("[openRepoStream] Opened Stream for %s succesfully", repository.Version)
}
