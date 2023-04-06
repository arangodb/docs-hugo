package internal

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"os"

	"github.com/arangodb/docs/migration-tools/arangoproxy/internal/arangosh"
	"github.com/arangodb/docs/migration-tools/arangoproxy/internal/common"
	"github.com/arangodb/docs/migration-tools/arangoproxy/internal/config"
	"github.com/arangodb/docs/migration-tools/arangoproxy/internal/utils"
)

func InitLog(logFilepath string) {
	logFile, _ := os.OpenFile(logFilepath, os.O_CREATE|os.O_APPEND|os.O_RDWR, 0666)
	mw := io.MultiWriter(os.Stdout, logFile)
	common.Logger = log.New(mw, "", log.Ldate|log.Ltime)
}

func CleanCache() {
	os.OpenFile(config.Conf.Cache, os.O_TRUNC, 0644)
	emptyFile := make(map[string]string)
	emptyFileBrackets, _ := json.Marshal(emptyFile)
	os.WriteFile(config.Conf.Cache, emptyFileBrackets, 0644)
	for _, repository := range config.Conf.Repositories {
		arangosh.Exec(utils.REMOVE_ALL_COLLECTIONS, repository) // FIXME
		cmd, _ := utils.GetSetupFunctions()
		arangosh.Exec(cmd, repository)
	}
}

func InitRepositories() {
	common.Repositories = make(map[string]config.Repository)
	fmt.Printf("INIT REPOSITORIES CONF %s\n", config.Conf.Repositories)
	for _, repo := range config.Conf.Repositories {
		common.Repositories[fmt.Sprintf("%s_%s", repo.Name, repo.Version)] = repo
		cmd, _ := utils.GetSetupFunctions()
		arangosh.Exec(cmd, repo)
	}
}
