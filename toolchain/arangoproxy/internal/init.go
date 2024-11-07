package internal

import (
	"bufio"
	"fmt"
	"io"
	"os"
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
		os.Exit(1)
	}

	stdout, err := cmd.StdoutPipe()
	if err != nil {
		models.Logger.Printf("[openRepoStream] Error Open STDOUTPIPE %s", err.Error())
		os.Exit(1)
	}

	stderr, err := cmd.StderrPipe()
	if err != nil {
		models.Logger.Printf("[openRepoStream] Error Open STDERRPIPE %s\n", err.Error())
		os.Exit(1)
	}

	if err := cmd.Start(); err != nil {
		models.Logger.Printf("[openRepoStream] Error Start Command %s", err.Error())
		os.Exit(1)
	}

	repository.StdinPipe = stdin
	repository.StdoutPipe = stdout

	models.Logger.Printf("[openRepoStream] Opened Stream for %s successfully", repository.Version)

	// stderr catches e.g. arangosh.conf not found but ICU initialization errors are written to stdout
	// We can't easily read from the stdout pipe twice, however, here and in arangosh.Exec()
	reader := bufio.NewReader(stderr)

	go func(cmd *exec.Cmd, reader io.Reader) {
		scanner := bufio.NewScanner(reader)
		for scanner.Scan() {
			models.Logger.Printf("[arangosh stderr] %s\n", scanner.Text())
		}
		err := cmd.Wait()
		if err != nil {
			exit := cmd.ProcessState.ExitCode()
			models.Logger.Printf("[openRepoStream] The arangosh process terminated with an error, exit code %d\n", exit)
			os.Exit(1)
		}
	}(cmd, reader)

}
