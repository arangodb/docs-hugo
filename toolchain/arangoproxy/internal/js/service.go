package js

import (
	"fmt"

	"github.com/arangodb/docs/migration-tools/arangoproxy/internal/arangosh"
	"github.com/arangodb/docs/migration-tools/arangoproxy/internal/common"
)

type JSService struct {
	common.Service
}

var collectionsToIgnore = new(common.IgnoreCollections)

func init() {
	collectionsToIgnore.ToIgnore = make(map[string]bool)
}

func (service JSService) ExecuteExample(request common.Example, cacheChannel chan map[string]interface{}) (res common.ExampleResponse) {
	defer common.Recover(fmt.Sprintf("JSService.ExecuteExample(%s)", request.Code))
	commands := formatRequestCode(request.Code)

	// Example is not cached, execute it against the arango instance
	repository, _ := common.GetRepository(request.Options.ServerName, request.Options.Type, request.Options.Version)

	//commands = utils.TryCatchWrap(commands)
	cmdOutput := arangosh.Exec(request.Options.Name, commands, repository)

	res = *common.NewExampleResponse(request.Code, cmdOutput, request.Options)
	if cmdOutput != "" {
		cacheRequest := make(map[string]interface{})
		cacheRequest["request"] = request.Base64Request
		cacheRequest["response"] = res
		cacheChannel <- cacheRequest
	}

	return
}
