package aql

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/arangodb/docs/migration-tools/arangoproxy/internal/common"
	"github.com/arangodb/docs/migration-tools/arangoproxy/internal/utils"
)

type AQLService struct {
	common.Service
}

func (service AQLService) Execute(request common.Example, cacheChannel chan map[string]interface{}, exampleChannel chan map[string]interface{}, outputChannel chan string) (res AQLResponse) {
	defer common.Recover(fmt.Sprintf("AQLService.Execute(%s)", request.Code))
	commands := service.formatRequestCode(&request)

	repository, _ := common.GetRepository(request.Options.ServerName, request.Options.Type, request.Options.Version)

	// Check if dataset to be used
	if request.Options.Dataset != "" {
		createDSCmd := utils.Datasets[request.Options.Dataset].Create
		removeDSCmd := utils.Datasets[request.Options.Dataset].Remove
		commands = removeDSCmd + "\n" + createDSCmd + "\n" + commands + "\n" + removeDSCmd
	}

	// If xpError on, don't use try catch wrap
	//request.Code = utils.TryCatchWrap()

	// Example is not cached, execute it against the arango instance
	//commands = utils.TryCatchWrap(commands)
	exampleData := map[string]interface{}{
		"name":       request.Options.Name,
		"code":       commands,
		"repository": repository,
	}
	exampleChannel <- exampleData
	cmdOutput := <-outputChannel

	res.ExampleResponse.Input, res.ExampleResponse.Options = request.Code, request.Options

	if strings.Contains(string(request.Options.Render), "output") {
		res.ExampleResponse.Output = fmt.Sprintf("%s\n%s", res.Output, cmdOutput)
	}

	common.FormatResponse(&res.ExampleResponse)
	cacheRequest := make(map[string]interface{})
	cacheRequest["request"] = request.Base64Request
	cacheRequest["response"] = res.ExampleResponse
	cacheChannel <- cacheRequest

	res.BindVars = request.Options.BindVars

	return
}

func (service AQLService) formatRequestCode(request *common.Example) string {
	commands := fmt.Sprintf("db._query(`%s`", request.Code)
	if len(request.Options.BindVars) != 0 {
		bindVarsJson, _ := json.Marshal(request.Options.BindVars)
		commands = fmt.Sprintf("%s, %s", commands, bindVarsJson)
	}

	commands = commands + ");"
	return commands
}
