package internal

import (
	"encoding/json"
	"fmt"
	"os"

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
		cmd, _ := utils.GetSetupFunctions()
		arangosh.Exec("INIT COMMAND", cmd, repository)
	}
}

func InitRepositories() {
	common.Repositories = make(map[string]config.Repository)
	fmt.Printf("INIT REPOSITORIES CONF %s\n", config.Conf.Repositories)
	for _, repo := range config.Conf.Repositories {
		common.Repositories[fmt.Sprintf("%s_%s_%s", repo.Name, repo.Type, repo.Version)] = repo
		cmd, _ := utils.GetSetupFunctions()
		arangosh.Exec("INIT COMMAND", cmd, repo)
	}
}
