package httpapi

import (
	"fmt"

	"github.com/arangodb/docs/migration-tools/arangoproxy/internal/arangosh"
	"github.com/arangodb/docs/migration-tools/arangoproxy/internal/common"
)

type HTTPService struct {
	common.Service
}

func (service HTTPService) ExecuteHTTPExample(request common.Example, cacheChannel chan map[string]interface{}) (res common.ExampleResponse, err error) {
	defer common.Recover(fmt.Sprintf("HTTPService.ExecuteHTTPExample(%s)", request.Code))

	commands := formatCommand(request.Code)
	repository, _ := common.GetRepository(request.Options.Release, request.Options.Version)

	//commands = utils.TryCatchWrap(commands)
	cmdOutput := arangosh.Exec(request.Options.Name, commands, repository)

	curlRequest, curlOutput, err := formatArangoResponse(cmdOutput, string(request.Options.Render))
	if err != nil {
		return
	}

	res = *common.NewExampleResponse(curlRequest, curlOutput, request.Options)

	if cmdOutput != "" {
		cacheRequest := make(map[string]interface{})
		cacheRequest["request"] = request.Base64Request
		cacheRequest["response"] = res
		cacheChannel <- cacheRequest
	}

	return
}
