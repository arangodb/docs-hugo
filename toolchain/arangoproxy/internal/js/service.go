package js

import (
	"fmt"

	"github.com/arangodb/docs/migration-tools/arangoproxy/internal/common"
)

type JSService struct {
	common.Service
}

func (service JSService) ExecuteExample(request common.Example, cacheChannel chan map[string]interface{}, exampleChannel chan map[string]interface{}, outputChannel chan string) (res common.ExampleResponse) {
	defer common.Recover(fmt.Sprintf("JSService.ExecuteExample(%s)", request.Code))
	commands := formatRequestCode(request.Code)

	// Example is not cached, execute it against the arango instance
	repository, _ := common.GetRepository(request.Options.ServerName, request.Options.Type, request.Options.Version)

	//commands = utils.TryCatchWrap(commands)
	exampleData := map[string]interface{}{
		"name":       request.Options.Name,
		"code":       commands,
		"repository": repository,
	}
	exampleChannel <- exampleData
	cmdOutput := <-outputChannel

	res = *common.NewExampleResponse(request.Code, cmdOutput, request.Options)
	cacheRequest := make(map[string]interface{})
	cacheRequest["request"] = request.Base64Request
	cacheRequest["response"] = res
	cacheChannel <- cacheRequest

	return
}
