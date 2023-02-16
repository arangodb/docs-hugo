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

func (service JSService) ExecuteExample(request common.Example) (res common.ExampleResponse) {
	defer common.Recover(fmt.Sprintf("JSService.ExecuteExample(%s)", request.Code))
	commands := formatRequestCode(request.Code)

	// Example is not cached, execute it against the arango instance
	repository, _ := common.GetRepository(request.Options.Release, request.Options.Version)

	//commands = utils.TryCatchWrap(commands)
	cmdOutput := arangosh.Exec(commands, repository)

	res = *common.NewExampleResponse(request.Code, cmdOutput, request.Options)
	if cmdOutput != "" {
		service.SaveCachedExampleResponse(request, res)
	}

	return
}
